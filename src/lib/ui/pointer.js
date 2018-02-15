'use strict';
/* global AFRAME */
/* eslint no-var: 0 */
/* eslint-env browser, node */

var verletUITemplate = require('./verlet-ui').template;

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

AFRAME.registerComponent('verlet-ui-pointer', AFRAME.utils.extend({
	setup: function () {
		var manipulatorSelector = this.parent.getDOMAttribute('grabber-tracking').manipulator;
		this.el.setAttribute('verlet-constraint', 'stiffness: 0.05; to: ' + manipulatorSelector + ';');
	}
}, verletUITemplate));

AFRAME.registerComponent('verlet-ui-default-pointer', {
	init: function () {

		var pointerOpenHand = document.createElement('a-entity');
		pointerOpenHand.setAttribute('material', 'color: white;');
		pointerOpenHand.setAttribute('scale', '0.2 0.2 0.2');
		pointerOpenHand.setAttribute('rotation', '30 0 0');
		pointerOpenHand.setAttribute('obj-model', 'obj: url(https://cdn.rawgit.com/SamsungInternet/a-frame-demos/44b878/a-frame-assets/hand/hand-relaxed.obj);');

		var pointerClosedHand = document.createElement('a-entity');
		pointerClosedHand.setAttribute('material', 'color: white;');
		pointerClosedHand.setAttribute('scale', '0.2 0.2 0.2');
		pointerClosedHand.setAttribute('rotation', '40 0 0');
		pointerClosedHand.setAttribute('obj-model', 'obj: url(https://cdn.rawgit.com/SamsungInternet/a-frame-demos/44b878/a-frame-assets/hand/hand-fist.obj);');
		pointerClosedHand.setAttribute('visible', 'false');

		// Make the hand open and close
		var pointer = this.el;

		pointer.appendChild(pointerOpenHand);
		pointer.appendChild(pointerClosedHand);

		pointer.addEventListener('grabber-drag-start', function () {
			pointerOpenHand.setAttribute('visible', false);
			pointerClosedHand.setAttribute('visible', true);
		});

		pointer.addEventListener('grabber-drag-end', function () {
			pointerOpenHand.setAttribute('visible', true);
			pointerClosedHand.setAttribute('visible', false);
		});

		this.el1 = pointerOpenHand;
		this.el2 = pointerClosedHand;
	},
	remove: function () {
		this.el.removeChild(this.el1);
		this.el.removeChild(this.el2);
	}
});

// Tracks cursor position, used for interacting with the UI in the scene
AFRAME.registerComponent('grabber-tracking', {
	schema: {
		manipulator: {
			type: 'selector'
		},
		pointer: {
			type: 'selector'
		},
	},
	init: function () {
		var canvas = this.el.sceneEl.canvas;

		// Wait for canvas to load.
		if (!canvas) {
			this.el.sceneEl.addEventListener('render-target-loaded', this.init.bind(this));
			return;
		}

		// Attach event listeners.
		canvas.addEventListener('touchstart', this.dragStart.bind(this));
		canvas.addEventListener('touchend', this.dragEnd.bind(this));
		canvas.addEventListener('mousedown', this.dragStart.bind(this));
		canvas.addEventListener('mouseup', this.dragEnd.bind(this));
		canvas.addEventListener('click', this.handleClick.bind(this));

		this.actionables = [];
		this.currentObject = null;
		this.ready === true;
	},
	update: function () {
		this.grabber = this.data.pointer;
		this.cameraAnchor = this.data.manipulator;

		// Function to find the distance between anything and the grabber
		this.squaredDistanceFn = squaredDistanceBetween(this.grabber);
		this.sortFn = (function (a,b) {
			return this.squaredDistanceFn(a) - this.squaredDistanceFn(b);
		}).bind(this);
	},
	registerActionable: function (el) {
		if (this.actionables.indexOf(el) === -1) {
			this.actionables.push(el);
		}
	},
	unRegisterActionable: function (el) {
		var n = this.actionables.indexOf(el);
		if (n === -1) return;
		this.actionables.splice(n, 1);
	},
	handleClick: function () {
		this.grabber.emit('grabber-click');
		if (this.currentObject !== null) {
			this.currentObject.emit('grabber-click');
		}
	},
	dragStart: function (e) {
		this.grabber.emit('grabber-drag-start');
		if (this.currentObject !== null) {
			this.grabEl = this.currentObject;
			this.currentObject.emit('grabber-drag-start');
			e.preventDefault();
		}
	},
	dragEnd: function (e) {
		this.grabber.emit('grabber-drag-end');
		if (this.grabEl) {
			this.grabEl.emit('grabber-drag-end');
			this.grabEl = null;
			e.preventDefault();
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

// To mark something grabable by the pointer
// also adds a verlet-constraint to make it jump to it.
AFRAME.registerComponent('verlet-ui-grabable', AFRAME.utils.extend({
	schema: {
		range: {
			default: 0.8
		},
		radius: {
			default: 0
		}
	},
	setup: function () {

		this.remove();

		var pointer = this.parent.getAttribute('grabber-tracking').pointer;
		this.parent.components['grabber-tracking'].registerActionable(this.el);

		this.constraintIdPromise = this.parent.components['verlet-container'].connectPoints(
			this.el,
			pointer,
			{
				stiffness: 0.2,
				range: this.data.range,
				restingDistance: this.data.radius
			}
		).then(function (data) {
			return data.constraintId;
		});
	},
	remove() {
		this.parent.components['grabber-tracking'].unRegisterActionable(this.el);
		if (this.constraintIdPromise) {
			this.constraintIdPromise.then(id => this.parent.components['verlet-container'].removeConstraint(id));
		}
	}
}, verletUITemplate));