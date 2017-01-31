'use strict';
/* eslint-env commonjs, browser, es6 */
/* global AFRAME */


AFRAME.registerComponent('verlet-force', {
	schema: {
		vector: {
			type: 'vec3'
		},
		targets: {
			type: 'selectorAll'
		}
	},
	init() {
		let el = this.el;
		while (el && el.matches && !el.matches('[verlet-container]')) el = el.parentNode;
		if (el.components['verlet-container']) {
			this.parentReadyPromise = Promise.resolve(el.components['verlet-container']);
		} else {
			this.parentReadyPromise = new Promise(r => el.addEventListener('verlet-container-init-complete', () => r(el.components['verlet-container'])));
		}
	},
	update() {
		return this.parentReadyPromise.then(c => {

			this.data.targets = this.attrValue.targets ? this.data.targets : [this.el];
			Promise.all(this.data.targets.map(t => {
				if (!t.components['verlet-point']) throw Error('Target is not a verlet-point');
				if (!t.idPromise) t.updateComponent('verlet-point');
				return t.idPromise;
			}))
			.then(ids => console.log(ids));
		});
	},
	remove() {
		// mark to be expired worker will clean it up
	}
})
