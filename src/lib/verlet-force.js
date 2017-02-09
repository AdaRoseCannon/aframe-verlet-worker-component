'use strict';
/* eslint-env commonjs, browser, es6 */
/* global AFRAME */


AFRAME.registerComponent('verlet-force', {
	schema: {
		vector: {
			type: 'vec3'
		},
		target: {
			type: 'selectorAll'
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
		this.hasRequestedCreation = false;
	},
	update() {
		const promise = this.parentReadyPromise.then(c => {
			this.data.target = this.attrValue.target ? this.data.target : [this.el];

			if (this.hasRequestedCreation === false) {
				this.hasRequestedCreation = true;
				const targetPromises = this.data.target.map(t => {
					if (t.components['verlet-container']) return Promise.resolve('world');

					if (!t.components['verlet-point']) throw Error('Target is not a verlet-point or verlet-container');
					if (!t.components['verlet-point'].idPromise) t.updateComponent('verlet-point');
					return t.components['verlet-point'].idPromise;
				});

				return Promise.all(targetPromises)
				.then(targetIds => {
					return c.createForce({ vector: this.data.vector }, targetIds);
				});
			} else {

				return this.idPromise.then( id => c.updateForce(id, {
					vector: this.data.vector
				}));
			}
		});

		if (!this.idPromise) this.idPromise = promise;
		return this.idPromise;
	},
	remove() {
		// mark to be expired worker will clean it up
	}
})
