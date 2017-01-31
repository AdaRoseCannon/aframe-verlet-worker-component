'use strict';
/* eslint-env commonjs, browser, es6 */
/* global AFRAME */


AFRAME.registerComponent('verlet-point', {
	schema: {
		position: {
			type: 'vec3'
		},
		velocity: {
			type: 'vec3'
		},
		mass: {
			default: 1
		},
		radius: {
			default: 0
		},
		attraction: {
			default: 0
		},
		attractionRange: {
			default: 'contact'
		}
	},
	init () {
		let el = this.el;
		while (el && el.matches && !el.matches('[verlet-container]')) el = el.parentNode;
		if (el.components['verlet-container']) {
			this.parentReadyPromise = Promise.resolve(el.components['verlet-container']);
		} else {
			this.parentReadyPromise = new Promise(r => el.addEventListener('verlet-container-init-complete', () => r(el.components['verlet-container'])));
		}
		this.parentReadyPromise.then(c => {
			this.parentVerletComponent = c;
		});
		this.el.updateComponent('position');
		this.hasRequestedPoint = false;
	},

	// for processing data recieved from container
	setPosition(x, y, z) {
		this.el.object3D.position.x = x;
		this.el.object3D.position.y = y;
		this.el.object3D.position.z = z;
	},

	update() {
		const promise = this.parentReadyPromise.then(c => {

			this.data.position = this.attrValue.position ? this.data.position : this.el.object3D.position;
			if (!this.hasRequestedPoint) {
				this.hasRequestedPoint = true;
				return c.addPoint(this, this.data);
			} else {
				return this.idPromise.then(id => c.updatePoint(id, this.data));
			}
		});
		if (!this.idPromise) this.idPromise = promise;
		return this.idPromise;
	},

	remove() {
		return this.parentReadyPromise.then(c => {
			if (this.idPromise) {
				return this.idPromise.then(id => c.removePoint(id));
			} else {
				return Promise.resolve();
			}
		});
	}
});