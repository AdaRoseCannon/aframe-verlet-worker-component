'use strict';
/* eslint-env commonjs, browser, es6 */
/* global AFRAME */


AFRAME.registerComponent('verlet-constraint', {
	schema: {
		stiffness: {
			default: 0.05
		},
		from: {
			type: 'selectorAll'
		},
		to: {
			type: 'selectorAll'
		},
		distance: {

			// ideal length of the constraint it will try to maintain this
			default: 0
		},
		breakingDistance: {

			// like range but won't will destroy itself after breaking
			// Element will remain
			default: ''
		},
		range: {
			default: Infinity
		}
	},

	init () {
		let el = this.el;
		while (el && el.matches && !el.matches('[verlet-container], verlet-ui')) el = el.parentNode;
		if (el.components['verlet-container']) {
			this.parentReadyPromise = Promise.resolve(el.components['verlet-container']);
		} else {
			this.parentReadyPromise = new Promise(r => el.addEventListener('verlet-container-init-complete', () => r(el.components['verlet-container'])));
		}
		this.constraints = new Map();
	},

	update() {

		// destroy everything then rebuild!
		this.remove().then(() => {
			this.idPromises = this.idPromises || [];
			this.data.restingDistance = this.data.distance;
			this.data.breakingDistance = this.data.breakingDistance ? Number(this.data.breakingDistance) : undefined;
			this.parentReadyPromise.then(verletSystem => {
				if ((!this.data.from || !this.data.from.length)) {
					if (this.el.matches('[verlet-point]')) {
						this.data.from = [this.el];
					} else {
						this.data.from = [];
					}
				}

				if ((!this.data.to || !this.data.to.length)) {
					if (this.el.matches('[verlet-point]')) {
						this.data.to = [this.el];
					} else {
						this.data.to = [];
					}
				}

				for (const i of this.data.to) {
					for (const j of this.data.from) {
						if (i !== j) {
							if (!i.components['verlet-point'].idPromise) i.updateComponent('verlet-point');
							if (!j.components['verlet-point'].idPromise) j.updateComponent('verlet-point');
							this.idPromises.push(
								Promise.all([i.components['verlet-point'].idPromise, j.components['verlet-point'].idPromise])
								.then(arr => {
									const id1 = arr[0];
									const id2 = arr[1];
									return verletSystem.connectPoints(id1, id2, {
										stiffness: this.data.stiffness,
										restingDistance: this.data.restingDistance,
										range: this.data.range,
										breakingDistance: this.data.breakingDistance
									})
									.then(obj => obj.constraintId);
								})
							);
						}
					}
				}
			});
		});
	},

	remove() {
		if (this.idPromises) {
			return Promise.all([this.parentReadyPromise, ...this.idPromises]).then(function (arrOfIDs) {
				// remove every constraint
				const v = arrOfIDs.shift();
				return Promise.all(arrOfIDs.map(id => v.removeConstraint(id)));
			});
		} else {
			return Promise.resolve();
		}
	}
});

AFRAME.registerPrimitive('a-verlet-constraint', {
	defaultComponents: {
		'verlet-constraint': {}
	},

	mappings: {
		to: 'verlet-constraint.to',
		from: 'verlet-constraint.from',
		stiffness: 'verlet-constraint.stiffness',
		distance: 'verlet-constraint.distance',
		range: 'verlet-constraint.range'
	}
});