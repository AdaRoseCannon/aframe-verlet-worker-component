'use strict';
/* global AFRAME */
/* eslint no-var: 0 */
/* eslint-env browser */

function squaredDistanceBetween(el1, el2) {

	// make it curryable
	if (!el2) return function (el2) {
		return squaredDistanceBetween(el1, el2);
	}

	// this is horrible hack, we need the world position for the camera anchor as it's relative position never changes
	// fortunately it's world position is calculated and kept locally because it has sync-position:true
	var dSquared = el1.object3D.position.distanceToSquared(el2.components['verlet-point'].worldPosition || el2.object3D.position);

	// make it the distance to the edge of the resting distance of the verlet point
	if (el1.components['verlet-constraint'] && el1.components['verlet-constraint'].data.restingDistance) {
		dSquared -= el1.components['verlet-constraint'].data.restingDistance * el1.components['verlet-constraint'].data.restingDistance;
	}
	if (el2.components['verlet-constraint'] && el2.components['verlet-constraint'].data.restingDistance) {
		dSquared -= el2.components['verlet-constraint'].data.restingDistance * el2.components['verlet-constraint'].data.restingDistance;
	}
	if (dSquared < 0) dSquared = 0;
	return dSquared;
}

AFRAME.registerSystem('grabber-tracking', {
	init: function () {
		var canvas = this.sceneEl.canvas;

		// Wait for canvas to load.
		if (!canvas) {
			this.sceneEl.addEventListener('render-target-loaded', this.init.bind(this));
			return;
		}

		// Attach event listeners.
		canvas.addEventListener('mousedown', this.dragStart.bind(this));
		canvas.addEventListener('mouseup', this.dragEnd.bind(this));
		canvas.addEventListener('click', this.handleClick.bind(this));

		var grabber = document.getElementById('grabber');
		this.cameraAnchor = document.getElementById('camera-anchor');

		// Function to find the distance between anything and the grabber
		this.squaredDistanceFn = squaredDistanceBetween(grabber);
		this.sortFn = (function (a,b) {
			return this.squaredDistanceFn(a) - this.squaredDistanceFn(b);
		}).bind(this);

		this.actionables = Array.from(document.querySelectorAll('.grabable'));
		this.currentObject = null;
		this.ready === true;
	},
	handleClick: function () {
		if (this.currentObject !== null) {
			this.currentObject.emit('grabber-click');
		}
	},
	dragStart: function () {
		if (this.currentObject !== null) {
			this.grabEl = this.currentObject;
			this.currentObject.emit('grabber-drag-start');
		}
	},
	dragEnd: function () {
		if (this.grabEl) {
			this.grabEl.emit('grabber-drag-end');
			this.grabEl = null;
		}
	},
	tick: function () {
		// this can probably be debounced to 100ms.

		// this needs to be smarter because the sortFn is expensive due to distance measuring
		this.actionables.sort(this.sortFn);
		var c = this.actionables[0];

		// detect if camera is either attracted to something
		if (this.squaredDistanceFn(c) < 0.5) {

			// no need to update
			if (this.currentObject === c) {
				return;
			}

			// let the old one know it is no longer selected
			if (this.currentObject !== null) {
				this.currentObject.emit('grabber-hover-out');
			}

			// set the current one
			this.currentObject = c;

			// let it know it is being hovered
			c.emit('grabber-hover-on');
		} else if (this.currentObject) {
			this.currentObject.emit('grabber-hover-out');
			this.currentObject = null;
		}
	}
});