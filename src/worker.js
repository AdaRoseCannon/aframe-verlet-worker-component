/* eslint-env commonjs, worker, es6 */
/* eslint no-console: 0 */

'use strict';

const World3D = require('verlet-system/3d');
const Constraint3D = require('verlet-constraint/3d');
const Point3D = require('verlet-point/3d');
const timeFactor = 1;
const vec3 = {
    create: require('gl-vec3/create'),
    add: require('gl-vec3/add'),
    // dot: require('gl-vec3/dot'),
    subtract: require('gl-vec3/subtract'),
    scale: require('gl-vec3/scale'),
    distance: require('gl-vec3/distance'),
    length: require('gl-vec3/length')
};

const p3DPrototype = (new Point3D()).constructor.prototype;
p3DPrototype.intersects = function (p) { return vec3.distance(this.position, p.position) <= this.radius + p.radius; };
p3DPrototype.distanceFrom = function (p) { return vec3.distance(this.position, p.position); };

class VerletThreePoint {
	constructor({
		position = { x: 0, y: 0, z: 0 },
		radius = 1,
		mass = 1,
		attraction = 0,
		velocity = { x: 0, y: 0, z: 0 }
	}) {
		this.initialRadius = radius;
		this.initialMass = mass;
		this.attraction = attraction;

		this.verletPoint = new Point3D({
			position: [ position.x, position.y, position.z ],
			mass,
			radius,
			attraction
		}).addForce([ velocity.x, velocity.y, velocity.z ]);
	}
}

function MyVerlet(options = {}) {

	this.points = [];
	this.constraints = [];

	this.addPoint = options => {
		const p = new VerletThreePoint(options);
		p.id = this.points.push(p) + 99;

		// if a point is attractive add a pulling force
		this.points.forEach(p0 => {
			if (p.attraction || p0.attraction && p !== p0) {
				this.connect(p, p0, {
					stiffness: (p.attraction || 0) + (p0.attraction || 0),
					restingDistance: p.radius + p0.radius
				});
			}
		});

		return p;
	};

	this.connect = (p1, p2, options) => {
		if (!options) options = {
			stiffness: 0.05,
			restingDistance: p1.radius + p2.radius
		};

		const c = new Constraint3D([p1.verletPoint, p2.verletPoint], options);
		this.constraints.push(c);
		return this.constraints.indexOf(c);
	};

	const worldOptions = {
		gravity: options.gravity ? [0, options.gravity, 0] : undefined,
		friction: 0.99
	};

	if (options.boxSize) {
		worldOptions.min = [-options.size.x / 2, -options.size.y / 2, -options.size.z / 2];
		worldOptions.min = [options.size.x / 2, options.size.y / 2, options.size.z / 2];
	}

	if (typeof options.floor === 'number' && options.floor !== -Infinity) {
		worldOptions.min = [null, options.floor, null];
		worldOptions.max = [null, null, null];
	}

	this.world = new World3D(worldOptions);

	let oldT = 0;

	this.animate = function animate() {
		const t = Date.now();

		// don't bother calculating many times in a single batch
		if (t - oldT < 3) {
			return;
		}

		const dT = Math.min(0.064, (t - oldT) / 1000);
		const vP = this.points.map(p => p.verletPoint);

		this.constraints.forEach(c => c.solve());

		this.world.integrate(vP, dT * timeFactor);
		oldT = t;
	};
}


let verlet;

// Recieve messages from the client and reply back onthe same port
self.addEventListener('message', function(event) {

	const transfer = [];
	const data = Object.entries(event.data).map(([id, message]) => {
		const i = message;

		switch (i.action) {
			case 'init':
				verlet = new MyVerlet(i.options);
				return { id };

			case 'getPoints':

				// Use Float32Array to handle the data
				const byteData = new Float32Array(i.byteData);
				verlet.animate();
				for (let i = 0, l = verlet.points.length; i < l; i++) {
					const p = verlet.points[i];
					const j = i * 4;
					byteData[j + 0] = p.id;
					byteData[j + 1] = p.verletPoint.position[0];
					byteData[j + 2] = p.verletPoint.position[1];
					byteData[j + 3] = p.verletPoint.position[2];
				}

				transfer.push(byteData.buffer);

				return { id, byteData: byteData.buffer };

			// don't do anything just return the points
			case 'noopPoints':
				return {id, byteData: i.byteData};

			case 'connectPoints':
				const p1 = verlet.points[i.options.id1 - 100];
				const p2 = verlet.points[i.options.id2 - 100];
				return {
					id,
					constraintId: verlet.connect(p1, p2, i.options.constraintOptions)
				};

			case 'updateConstraint':
				const c = verlet.constraints[i.options.constraintId];
				if (i.options.stiffness !== undefined) c.stiffness = i.options.stiffness;
				if (i.options.restingDistance !== undefined) c.restingDistance = i.options.restingDistance;
				return {id};

			case 'addPoint':
				return {
					id,
					point: verlet.addPoint(i.pointOptions)
				};

			case 'updatePoint':
				const d = i.pointOptions;
				const p3 = verlet.points[d.id - 100];
				if (d.position !== undefined) p3.verletPoint.place([d.position.x, d.position.y, d.position.z]);
				if (d.velocity !== undefined) p3.verletPoint.addForce([d.velocity.x, d.velocity.y, d.velocity.z]);
				if (d.mass !== undefined) p3.verletPoint.mass = d.mass;
				if (d.radius !== undefined) p3.verletPoint.radius = d.radius;
				return { id };

			case 'reset':
				verlet.points.splice(0);
				return { id };

			default:
				return {
					error: 'Invalid Action',
					id
				};
		}
	});

	// deliver data by transfering data
	self.postMessage(data, transfer);
});
