/* eslint-env commonjs, worker, es6 */

'use strict';
importScripts('https://cdn.polyfill.io/v2/polyfill.js?features=es6');

let idIncrementer = 100;
const World3D = require('verlet-system/3d');
const Constraint3D = require('verlet-constraint/3d');
const Point3D = require('verlet-point/3d');
const timeFactor = 1;
const vec3 = {
    distance: require('gl-vec3/distance'),
	scaleAndAdd: require('gl-vec3/scaleAndAdd'),
};

class VerletThreePoint {
	constructor({
		position = { x: 0, y: 0, z: 0 },
		radius = 1,
		mass = 1,
		attraction = 0,
		attractionRange = Infinity,
		velocity = { x: 0, y: 0, z: 0 }
	}) {
		this.initialRadius = radius;
		this.initialMass = mass;
		this.attraction = attraction;
		this.attractionRange = attractionRange;
		this.constraints = [];
		this.forces = [];
		this.forceMap = new Map();

		this.verletPoint = new Point3D({
			position: [ position.x, position.y, position.z ],
			mass,
			radius,
			attraction
		}).addForce([velocity.x, velocity.y, velocity.z]);

		this.verletPoint.forces = this.forces;
		this.verletPoint.forceMap = this.forceMap;
	}
}

class VerletForce {
	constructor(options) {
		this.update(options);
		if (!this.vector) throw Error('Force Vector has not been defined');
	}

	update({
		vector
	}) {
		if (vector) {
			this.vector = [
				vector.x,
				vector.y,
				vector.z
			];
		}
	}

	applyForce(point) {

		// work out acceleration due to force
		vec3.scaleAndAdd(point.acceleration, point.acceleration, this.vector, 1.0 / point.mass);
	}
}

function MyVerlet(options = {}) {

	this.points = [];
	this.pointMap = new Map();
	this.constraints = [];
	this.constraintMap = new Map();
	this.forceMap = new Map();

	this.addForce = options => {
		const f = new VerletForce(options);
		f.id = idIncrementer++;
		this.forceMap.set(f.id, f);

		return f;
	}

	this.addPoint = options => {
		const p = new VerletThreePoint(options);
		let p0;
		const iter = this.pointMap.values();
		p.id = idIncrementer++;
		p.verletPoint.id = p.id;

		// if a point is attractive add a pulling force
		while (p0 = iter.next(), !p0.done && (p0 = p0.value)) {
			if (p.attraction || p0.attraction && p !== p0) {
				this.connect(p.verletPoint, p0.verletPoint, {
					stiffness: (p.attraction || 0) + (p0.attraction || 0),
					restingDistance: p.verletPoint.radius + p0.verletPoint.radius,

					// if the range is contact range then limit it to the sum of the radius
					// otherwise it is the range as a Number or Infinity
					range: p.attractionRange === 'contact' ? p.verletPoint.radius + p0.verletPoint.radius : (p.attractionRange ? Number(p.attractionRange) : Infinity)
				});
			}
		}

		this.points.push(p.verletPoint);
		this.pointMap.set(p.id, p);

		return p;
	};

	this.removePoint = id => {

		// remove any associated constraints
		this.pointMap.get(id).constraints.forEach(cId => this.removeConstraint(cId));

		// remove the point
		this.pointMap.delete(id);

		// trigger cache cleanup
		this.needsUpdate = true;
	}

	this.connect = (p1, p2, options) => {
		if (!options) options = {
			stiffness: 0.05,
			restingDistance: p1.radius + p2.radius
		};

		const c = new Constraint3D([p1, p2], options);
		c.range = options.range || Infinity;
		c.breakingDistance = options.breakingDistance || Infinity;

		c.id = idIncrementer++;
		this.constraints.push(c);
		this.constraintMap.set(c.id, c);
		return c.id;
	};

	this.removeConstraint = constraintId => {


		// remove constraint
		this.constraintMap.delete(constraintId);

		// trigger cache cleanup
		this.needsUpdate = true;
	}

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
	this.world.forces = [];
	this.world.forceMap = new Map();

	let oldT = 0;

	this.animate = function animate() {
		const t = Date.now();

		// set up first frame
		if (oldT === 0) oldT = t - 16;

		// Update arrays of points and constraints
		if (this.needsUpdate) {
			this.points.splice(0);
			this.points.push(...Array.from(this.pointMap.values()).map(p => p.verletPoint));

			this.constraints.splice(0);
			this.constraints.push(...this.constraintMap.values());

			this.needsUpdate = false;
		}

		// don't bother calculating many times in a single batch
		if (t - oldT < 8) {
			return;
		}

		const dT = (t - oldT) / 1000;
		if (dT > 0.032) {
			console.warn('Long frame: ' + dT);

			// It's okay to skip frames but just slow down the simulation
			dT = 0.032;
		}

		for (let i = 0, l = this.constraints.length; i < l; i++) {
			const c = this.constraints[i];

			// if it has a range or a breaking point calculate whether it should skip or break
			if (
				(c.range && c.range !== Infinity) ||
				(c.breakingDistance && c.breakingDistance !== Infinity)
			) {
				const distance = vec3.distance(c.points[0].position, c.points[1].position);
				if (distance > c.breakingDistance) {
					this.removeConstraint(c.id);
					continue;
				};
				if (distance > c.range) continue;
			}
			c.solve();
		}

		// Update arrays of forces on the world
		if (this.world.needsForceUpdate) {
			this.world.needsForceUpdate = false;
			this.world.forces.splice(0);
			this.world.forces.push(...this.world.forceMap.values());
		}

		// handle forces
		for (let i = 0, l = this.points.length; i < l; i++) {

			const p = this.points[i];

			// Update arrays of forces on each point if needed
			if (p.needsForceUpdate) {
				p.needsForceUpdate = false;
				p.forces.splice(0);
				p.forces.push(...p.forceMap.values());
			}

			// Apply any global forces
			for (let j = 0, l = this.world.forces.length; j < l; j++) {
				const force = this.world.forces[j];
				if (force.expire) {
					this.world.forceMap.delete(force.id);
					continue;
				}
				force.applyForce(p);
			}

			// Apply any individual forces
			for (let j = 0, l = p.forces.length; j < l; j++) {
				const force = p.forces[j];
				if (force.expire) {
					p.forceMap.delete(force.id);
					continue;
				}
				force.applyForce(p);
			}
		}

		// step the simulation
		this.world.integrate(this.points, dT * timeFactor);
		oldT = t;
	};
}

let verlet;

// Recieve messages from the client and reply back onthe same port
self.addEventListener('message', function(event) {

	const transfer = [];
	const data = event.data.map(([id, message]) => {
		const i = message;

		switch (i.action) {
			case 'init':
				verlet = new MyVerlet(i.options);
				return { id };

			case 'getPoints':

				// Use Float32Array to handle the data
				const byteData = new Float32Array(i.byteData);
				verlet.animate();
				for (let j = 0, i = 0, l = verlet.points.length; i < l; i++) {
					const p = verlet.points[i];
					if (!p) continue;
					byteData[j + 0] = p.id;
					byteData[j + 1] = p.position[0];
					byteData[j + 2] = p.position[1];
					byteData[j + 3] = p.position[2];
					j += 4;
				}

				transfer.push(byteData.buffer);

				return { id, byteData: byteData.buffer, length: verlet.points.length };

			// don't do anything just return the points
			case 'noopPoints':
				return { id, byteData: i.byteData, length: verlet.points.length };

			case 'createForce':
				const newForce = verlet.addForce(i.forceOptions);
				verlet.forceMap.set(newForce.id, newForce);
				i.targets.forEach(id => {
					if (id === 'world') {
						verlet.world.forceMap.set(newForce.id, newForce);
						verlet.world.needsForceUpdate = true;
					} else {
						const p = verlet.pointMap.get(id);
						p.verletPoint.needsForceUpdate = true;
						p.forceMap.set(newForce.id, newForce);
					}
				});
				return { id, forceId: newForce.id };

			case 'useForce':
				const gotForce = verlet.forceMap.get(i.forceId);
				i.targets.forEach(id => {
					if (id === 'world') {
						verlet.world.forceMap.set(gotForce.id, gotForce);
						verlet.world.needsForceUpdate = true;
					} else {
						const p = verlet.pointMap.get(id);
						p.needsForceUpdate = true;
						p.forceMap.set(gotForce.id, gotForce);
					}
				});
				return { id, forceId: gotForce.id };

			case 'updateForce':
				verlet.forceMap.get(i.forceId).update(i.forceOptions);
				return { id };

			case 'removeForce':
				verlet.forceMap.get(i.forceId).expire = true;
				return { id };

			case 'connectPoints':
				const p1 = verlet.pointMap.get(i.options.id1);
				const p2 = verlet.pointMap.get(i.options.id2);
				const constraintId = verlet.connect(p1.verletPoint, p2.verletPoint, i.options.constraintOptions);
				p1.constraints.push(constraintId);
				p2.constraints.push(constraintId);

				return {
					id,
					constraintId
				};
			case 'removeConstraint':
				verlet.removeConstraint(i.options.constraintId);
				return { id };

			case 'updateConstraint':
				const c = verlet.constraintMap.get(i.options.constraintId);
				if (i.options.stiffness !== undefined) c.stiffness = i.options.stiffness;
				if (i.options.restingDistance !== undefined) c.restingDistance = i.options.restingDistance;
				return {id};

			case 'addPoint':
				return {
					id,
					point: verlet.addPoint(i.pointOptions),
					length: verlet.points.length
				};

			case 'removePoint':
				verlet.removePoint(i.options.id);
				return { id };

			case 'updatePoint':
				const d = i.pointOptions;
				const p3 = verlet.pointMap.get(d.id);
				if (d.position !== undefined) p3.verletPoint.place([d.position.x, d.position.y, d.position.z]);
				if (d.velocity !== undefined) p3.verletPoint.addForce([d.velocity.x, d.velocity.y, d.velocity.z]);
				if (d.mass !== undefined) p3.verletPoint.mass = d.mass;
				if (d.radius !== undefined) p3.verletPoint.radius = d.radius;
				return { id };

			case 'reset':
				verlet.points.splice(0);
				verlet.pointMap = new Map();
				verlet.constraints.splice(0);
				verlet.constraintMap = new Map();
				return { id };

			default:
				return {
					error: 'Invalid Action: ' + i.action,
					id
				};
		}
	});

	// deliver data by transfering data
	self.postMessage(data, transfer);
});

self.postMessage({id: 'handshake'});