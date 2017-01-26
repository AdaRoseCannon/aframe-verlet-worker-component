'use strict';
/* eslint-env commonjs, browser, es6 */
/* eslint no-console: 0 */
/* global AFRAME */

const Verlet = require('./lib/verlet-messenger');

async function start(options) {
	const v = new Verlet();
	await v.init(options);
	return v;
};

AFRAME.registerComponent('verlet-container', {
	schema: {
		gravity: {
			default: -9.8
		},
		boxSize: {
			default: 0
		},
		floor: {
			default: -Infinity
		}
	},
	init () {
		this.systemPromise = start(this.data).then(v => this.v = v);
		this.systemPromise.then(v => this.el.emit('verlet-container-init-complete', v));
		this.points = new Map();
		this.updatePoints = this.updatePoints.bind(this);
	},
	update() {
		// TODO: Update verlet system without restarting worker
	},
	addPoint(component, data) {
		return this.systemPromise
			.then(v => v.addPoint(data))
			.then(d => {
				this.points.set(d.point.id, component);
				return d.point.id;
			});
	},
	connectPoints(p1, p2, options) {
		this.systemPromise.then(v => v.connectPoints(p1, p2, options));
	},
	updatePoint(id, data) {
		const inData = { id };
		Object.assign(inData, data);
		return this.systemPromise.then(v => v.updatePoint(inData));
	},
	tick() {
		if(!this.v) return;
		this.v.getPoints().then(this.updatePoints);
		this.v.process();
	},
	updatePoints({byteData}) {
		for (let i = 0, l = byteData.length; i < l; i += 4) {
			const point = byteData[i + 0] && this.points.get(byteData[i + 0]);
			if (!point) continue;
			const pX = byteData[i + 1];
			const pY = byteData[i + 2];
			const pZ = byteData[i + 3];
			point.setPosition(pX, pY, pZ);
		}
	}
});

AFRAME.registerComponent('verlet-constraint', {
	schema: {
		stiffness: {
			default: 1
		},
		from: {
			type: 'selectorAll'
		},
		to: {
			type: 'selectorAll'
		},
		distance: {
			default: ''
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
		this.constraints = new Map();
	},

	update() {
		this.data.restingDistance = this.data.distance ? Number(this.data.distance) : undefined;
		this.parentReadyPromise.then(c => {
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
						Promise.all([this.parentReadyPromise, i.components['verlet-point'].idPromise, j.components['verlet-point'].idPromise])
						.then(arr => {
							const verletSystem = arr[0];
							const id1 = arr[1];
							const id2 = arr[2];
							verletSystem.connectPoints(id1, id2, { stiffness: this.data.stiffness, restingDistance: this.data.restingDistance });
						});
					}
				}
			}
		});
	},
});


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
	},

	// for processing data recieved from container
	setPosition(x, y, z) {
		this.el.object3D.position.x = x;
		this.el.object3D.position.y = y;
		this.el.object3D.position.z = z;
	},

	update() {

		return this.parentReadyPromise.then(c => {

			this.data.position = this.attrValue.position ? this.data.position : this.el.object3D.position;
			if (!this.idPromise) {
				this.idPromise = c.addPoint(this, this.data);
				return this.idPromise;
			} else {
				return this.idPromise.then(id => c.updatePoint(id, this.data));
			}
		});
	},
});
