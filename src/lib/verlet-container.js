'use strict';
/* eslint-env commonjs, browser, es6 */
/* global AFRAME */

/* TODO Keep track of unused workers in the event of the container being destroyed so that they can be reused later. */

const Verlet = require('./verlet-container-messenger');

async function start(options) {
	const v = options.workerUrl ? new Verlet(options.workerUrl) : new Verlet();
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
		},
		workerUrl: {
			default: ''
		},
		friction: {
			default: 0.99
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
	removePoint(id) {
		return this.systemPromise.then(v => v.removePoint(id));
	},
	updatePoint(id, data) {
		const inData = { id };
		Object.assign(inData, data);
		return this.systemPromise.then(v => v.updatePoint(inData));
	},
	connectPoints(p1, p2, options) {

		if (typeof options.restingDistance !== 'number' || options.restingDistance === NaN) console.warn('Invalid Contstraint', p1, p2, options);

		if (!p1.components['verlet-point'].idPromise) p1.updateComponent('verlet-point');
		if (!p2.components['verlet-point'].idPromise) p2.updateComponent('verlet-point');
		return Promise.all([p1.components['verlet-point'].idPromise, p2.components['verlet-point'].idPromise, this.systemPromise])
		.then(arr => {
			const id1 = arr[0];
			const id2 = arr[1];
			const v = arr[2];
			return v.connectPoints(id1, id2, options);
		});
	},
	removeConstraint(id) {
		return this.systemPromise.then(v => v.removeConstraint(id));
	},
	createForce(options, targetIds) {
		return this.systemPromise.then(v => v.createForce(options, targetIds)).then(o => o.forceId);
	},
	updateForce(id, options) {
		return this.systemPromise.then(v => v.updateForce(id, options));
	},
	tick() {
		if(!this.v) return;
		this.v.getPoints().then(this.updatePoints);
		this.v.process();
	},
	updatePoints({byteData, length}) {
		for (let i = 0, l = length; i < l; i += 1) {
			const point = byteData[i * 4 + 0] && this.points.get(byteData[i * 4 + 0]);
			if (!point) continue;
			const pX = byteData[i * 4 + 1];
			const pY = byteData[i * 4 + 2];
			const pZ = byteData[i * 4 + 3];
			point.setPosition(pX, pY, pZ);
		}
	}
});