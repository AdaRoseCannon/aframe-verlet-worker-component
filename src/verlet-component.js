'use strict';
/* eslint-env es2017, worker */
/* eslint no-console: 0 */

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
	tick() {
		if(!this.v) return;
		this.v.getPoints().then(this.updatePoints);
	},
	updatePoints({byteData}) {
		for (let i = 0, l = byteData.length; i < l; i += 4) {
			const id = byteData[i + 0];
			if (!id) continue;
			const pX = byteData[i + 1];
			const pY = byteData[i + 2];
			const pZ = byteData[i + 3];
			this.points.get(id).setPosition(pX, pY, pZ);
		}
	}
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
		}
	},
	init () {
		let el = this.el;
		while (el && el.matches && !el.matches('[verlet-container]')) el = el.parentNode;
		if (el.components['verlet-container']) {
			this.parentReady = Promise.resolve(el.components['verlet-container']);
		} else {
			this.parentReady = new Promise(r => el.addEventListener('verlet-container-init-complete', () => r(el.components['verlet-container'])));
		}
		this.parentReady.then(c => {
			this.parentVerletComponent = c;
			this.update();
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
		if (!this.parentVerletComponent) return;
		this.data.position = this.attrValue.position ? this.data.position : this.el.object3D.position;
		if (!this.idPromise) {
			this.idPromise = this.parentVerletComponent.addPoint(this, this.data);
		} else {
			this.idPromise.then(id => this.parentVerletComponent.updatePoint(id, this.data));
		}
	},
});
