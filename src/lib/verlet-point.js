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
		},
		syncPosition: {
			default: false
		}
	},

	init() {
		let el = this.el;
		while (el && el.matches && !el.matches('[verlet-container], verlet-ui')) el = el.parentNode;
		if (el.components['verlet-container']) {
			this.parentReadyPromise = Promise.resolve(el.components['verlet-container']);
		} else {
			this.parentReadyPromise = new Promise(r => el.addEventListener('verlet-container-init-complete', () => r(el.components['verlet-container'])));
		}
		this.parentReadyPromise.then(c => {
			this.parentVerletComponent = c;
		});
		this.hasRequestedPoint = false;
		this.parentVerletElement = el;
	},

	// for processing data recieved from container
	setPosition(x, y, z) {

		// We are updating the data in the simulation so ignore return results
		if (this.data.syncPosition) return;

		this.el.object3D.position.x = x;
		this.el.object3D.position.y = y;
		this.el.object3D.position.z = z;
	},

	update() {
		if (this.data.syncPosition && this.data.mass !== 0) {
			throw Error('Can only sync position if the mass is 0');
		}
		const promise = this.parentReadyPromise.then(c => {
			this.data.position = this.attrValue.position ? this.data.position : this.parentVerletElement.object3D.worldToLocal(this.el.object3D.getWorldPosition());
			if (!this.hasRequestedPoint) {
				this.hasRequestedPoint = true;
				return c.addPoint(this, this.data).then(id => this.id = id);
			} else {
				return this.idPromise.then(id => {
					c.updatePoint(id, this.data);
					return id;
				});
			}
		});
		if (!this.idPromise) this.idPromise = promise;
		return this.idPromise;
	},

	tick() {
		if (this.data.syncPosition && this.parentVerletComponent && this.id) {
			if (!this.worldPosition) {
				this.worldPosition = new AFRAME.THREE.Vector3();
			}
			this.parentVerletComponent.updatePoint(this.id, {
				position: this.parentVerletElement.object3D.worldToLocal(this.el.object3D.getWorldPosition(this.worldPosition))
			});
		}
	},

	remove() {
		this.id = undefined;
		return this.parentReadyPromise.then(c => {
			if (this.idPromise) {
				return this.idPromise.then(id => c.removePoint(id));
			} else {
				return Promise.resolve();
			}
		});
	}
});