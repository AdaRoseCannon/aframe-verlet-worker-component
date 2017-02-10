/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/* eslint-env commonjs, worker, es6 */

	'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	importScripts('https://cdn.polyfill.io/v2/polyfill.js?features=es6');

	var idIncrementer = 100;
	var World3D = __webpack_require__(17);
	var Constraint3D = __webpack_require__(30);
	var Point3D = __webpack_require__(34);
	var timeFactor = 1;
	var vec3 = {
		distance: __webpack_require__(32),
		scaleAndAdd: __webpack_require__(36)
	};

	var VerletThreePoint = function VerletThreePoint(_ref) {
		var _ref$position = _ref.position,
		    position = _ref$position === undefined ? { x: 0, y: 0, z: 0 } : _ref$position,
		    _ref$radius = _ref.radius,
		    radius = _ref$radius === undefined ? 1 : _ref$radius,
		    _ref$mass = _ref.mass,
		    mass = _ref$mass === undefined ? 1 : _ref$mass,
		    _ref$attraction = _ref.attraction,
		    attraction = _ref$attraction === undefined ? 0 : _ref$attraction,
		    _ref$attractionRange = _ref.attractionRange,
		    attractionRange = _ref$attractionRange === undefined ? Infinity : _ref$attractionRange,
		    _ref$velocity = _ref.velocity,
		    velocity = _ref$velocity === undefined ? { x: 0, y: 0, z: 0 } : _ref$velocity;

		_classCallCheck(this, VerletThreePoint);

		this.initialRadius = radius;
		this.initialMass = mass;
		this.attraction = attraction;
		this.attractionRange = attractionRange;
		this.constraints = [];
		this.forces = [];
		this.forceMap = new Map();

		this.verletPoint = new Point3D({
			position: [position.x, position.y, position.z],
			mass: mass,
			radius: radius,
			attraction: attraction
		}).addForce([velocity.x, velocity.y, velocity.z]);

		this.verletPoint.forces = this.forces;
		this.verletPoint.forceMap = this.forceMap;
	};

	var VerletForce = function () {
		function VerletForce(options) {
			_classCallCheck(this, VerletForce);

			this.update(options);
			if (!this.vector) throw Error('Force Vector has not been defined');
		}

		_createClass(VerletForce, [{
			key: 'update',
			value: function update(_ref2) {
				var vector = _ref2.vector;

				if (vector) {
					this.vector = [vector.x, vector.y, vector.z];
				}
			}
		}, {
			key: 'applyForce',
			value: function applyForce(point) {

				// work out acceleration due to force
				vec3.scaleAndAdd(point.acceleration, point.acceleration, this.vector, 1.0 / point.mass);
			}
		}]);

		return VerletForce;
	}();

	function MyVerlet() {
		var _this = this;

		var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};


		this.points = [];
		this.pointMap = new Map();
		this.constraints = [];
		this.constraintMap = new Map();
		this.forceMap = new Map();

		this.addForce = function (options) {
			var f = new VerletForce(options);
			f.id = idIncrementer++;
			_this.forceMap.set(f.id, f);

			return f;
		};

		this.addPoint = function (options) {
			var p = new VerletThreePoint(options);
			var p0 = void 0;
			var iter = _this.pointMap.values();
			p.id = idIncrementer++;
			p.verletPoint.id = p.id;

			// if a point is attractive add a pulling force
			while (p0 = iter.next(), !p0.done && (p0 = p0.value)) {
				if (p.attraction || p0.attraction && p !== p0) {
					_this.connect(p.verletPoint, p0.verletPoint, {
						stiffness: (p.attraction || 0) + (p0.attraction || 0),
						restingDistance: p.verletPoint.radius + p0.verletPoint.radius,

						// if the range is contact range then limit it to the sum of the radius
						// otherwise it is the range as a Number or Infinity
						range: p.attractionRange === 'contact' ? p.verletPoint.radius + p0.verletPoint.radius : p.attractionRange ? Number(p.attractionRange) : Infinity
					});
				}
			}

			_this.points.push(p.verletPoint);
			_this.pointMap.set(p.id, p);

			return p;
		};

		this.removePoint = function (id) {

			// remove any associated constraints
			_this.pointMap.get(id).constraints.forEach(function (cId) {
				return _this.removeConstraint(cId);
			});

			// remove the point
			_this.pointMap.delete(id);

			// trigger cache cleanup
			_this.needsUpdate = true;
		};

		this.connect = function (p1, p2, options) {
			if (!options) options = {
				stiffness: 0.05,
				restingDistance: p1.radius + p2.radius
			};

			var c = new Constraint3D([p1, p2], options);
			c.range = options.range || Infinity;
			c.breakingDistance = options.breakingDistance || Infinity;

			c.id = idIncrementer++;
			_this.constraints.push(c);
			_this.constraintMap.set(c.id, c);
			return c.id;
		};

		this.removeConstraint = function (constraintId) {

			// remove constraint
			_this.constraintMap.delete(constraintId);

			// trigger cache cleanup
			_this.needsUpdate = true;
		};

		var worldOptions = {
			gravity: options.gravity ? [0, options.gravity, 0] : undefined,
			friction: options.friction || 0.99
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

		var oldT = 0;

		this.animate = function animate() {
			var t = Date.now();

			// set up first frame
			if (oldT === 0) oldT = t - 16;

			// Update arrays of points and constraints
			if (this.needsUpdate) {
				var _points, _constraints;

				this.points.splice(0);
				(_points = this.points).push.apply(_points, _toConsumableArray(Array.from(this.pointMap.values()).map(function (p) {
					return p.verletPoint;
				})));

				this.constraints.splice(0);
				(_constraints = this.constraints).push.apply(_constraints, _toConsumableArray(this.constraintMap.values()));

				this.needsUpdate = false;
			}

			// don't bother calculating many times in a single batch
			if (t - oldT < 8) {
				return;
			}

			var dT = (t - oldT) / 1000;
			if (dT > 0.032) {
				// console.warn('Long frame: ' + dT);

				// It's okay to skip frames but just slow down the simulation
				dT = 0.032;
			}

			for (var i = 0, l = this.constraints.length; i < l; i++) {
				var c = this.constraints[i];

				// if it has a range or a breaking point calculate whether it should skip or break
				if (c.range && c.range !== Infinity || c.breakingDistance && c.breakingDistance !== Infinity) {
					var distance = vec3.distance(c.points[0].position, c.points[1].position);
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
				var _world$forces;

				this.world.needsForceUpdate = false;
				this.world.forces.splice(0);
				(_world$forces = this.world.forces).push.apply(_world$forces, _toConsumableArray(this.world.forceMap.values()));
			}

			// handle forces
			for (var _i = 0, _l = this.points.length; _i < _l; _i++) {

				var p = this.points[_i];

				// Update arrays of forces on each point if needed
				if (p.needsForceUpdate) {
					var _p$forces;

					p.needsForceUpdate = false;
					p.forces.splice(0);
					(_p$forces = p.forces).push.apply(_p$forces, _toConsumableArray(p.forceMap.values()));
				}

				// Apply any global forces
				for (var j = 0, _l2 = this.world.forces.length; j < _l2; j++) {
					var force = this.world.forces[j];
					if (force.expire) {
						this.world.forceMap.delete(force.id);
						continue;
					}
					force.applyForce(p);
				}

				// Apply any individual forces
				for (var _j = 0, _l3 = p.forces.length; _j < _l3; _j++) {
					var _force = p.forces[_j];
					if (_force.expire) {
						p.forceMap.delete(_force.id);
						continue;
					}
					_force.applyForce(p);
				}
			}

			// step the simulation
			this.world.integrate(this.points, dT * timeFactor);
			oldT = t;
		};
	}

	var verlet = void 0;

	// Recieve messages from the client and reply back onthe same port
	self.addEventListener('message', function (event) {

		var transfer = [];
		var data = event.data.map(function (_ref3) {
			var _ref4 = _slicedToArray(_ref3, 2),
			    id = _ref4[0],
			    message = _ref4[1];

			var i = message;

			var _ret = function () {
				switch (i.action) {
					case 'init':
						verlet = new MyVerlet(i.options);
						return {
							v: { id: id }
						};

					case 'getPoints':

						// Use Float32Array to handle the data
						var byteData = new Float32Array(i.byteData);
						verlet.animate();
						for (var j = 0, _i2 = 0, l = verlet.points.length; _i2 < l; _i2++) {
							var p = verlet.points[_i2];
							if (!p) continue;
							byteData[j + 0] = p.id;
							byteData[j + 1] = p.position[0];
							byteData[j + 2] = p.position[1];
							byteData[j + 3] = p.position[2];
							j += 4;
						}

						transfer.push(byteData.buffer);

						return {
							v: { id: id, byteData: byteData.buffer, length: verlet.points.length }
						};

					// don't do anything just return the points
					case 'noopPoints':
						return {
							v: { id: id, byteData: i.byteData, length: verlet.points.length }
						};

					case 'createForce':
						var newForce = verlet.addForce(i.forceOptions);
						verlet.forceMap.set(newForce.id, newForce);
						i.targets.forEach(function (id) {
							if (id === 'world') {
								verlet.world.forceMap.set(newForce.id, newForce);
								verlet.world.needsForceUpdate = true;
							} else {
								var _p = verlet.pointMap.get(id);
								_p.verletPoint.needsForceUpdate = true;
								_p.forceMap.set(newForce.id, newForce);
							}
						});
						return {
							v: { id: id, forceId: newForce.id }
						};

					case 'useForce':
						var gotForce = verlet.forceMap.get(i.forceId);
						i.targets.forEach(function (id) {
							if (id === 'world') {
								verlet.world.forceMap.set(gotForce.id, gotForce);
								verlet.world.needsForceUpdate = true;
							} else {
								var _p2 = verlet.pointMap.get(id);
								_p2.needsForceUpdate = true;
								_p2.forceMap.set(gotForce.id, gotForce);
							}
						});
						return {
							v: { id: id, forceId: gotForce.id }
						};

					case 'updateForce':
						verlet.forceMap.get(i.forceId).update(i.forceOptions);
						return {
							v: { id: id }
						};

					case 'removeForce':
						verlet.forceMap.get(i.forceId).expire = true;
						return {
							v: { id: id }
						};

					case 'connectPoints':
						var p1 = verlet.pointMap.get(i.options.id1);
						var p2 = verlet.pointMap.get(i.options.id2);
						var constraintId = verlet.connect(p1.verletPoint, p2.verletPoint, i.options.constraintOptions);
						p1.constraints.push(constraintId);
						p2.constraints.push(constraintId);

						return {
							v: {
								id: id,
								constraintId: constraintId
							}
						};

					case 'removeConstraint':
						verlet.removeConstraint(i.options.constraintId);
						return {
							v: { id: id }
						};

					case 'updateConstraint':
						var c = verlet.constraintMap.get(i.options.constraintId);
						if (i.options.stiffness !== undefined) c.stiffness = i.options.stiffness;
						if (i.options.restingDistance !== undefined) c.restingDistance = i.options.restingDistance;
						return {
							v: { id: id }
						};

					case 'addPoint':
						return {
							v: {
								id: id,
								point: verlet.addPoint(i.pointOptions),
								length: verlet.points.length
							}
						};

					case 'removePoint':
						verlet.removePoint(i.options.id);
						return {
							v: { id: id }
						};

					case 'updatePoint':
						var d = i.pointOptions;
						var p3 = verlet.pointMap.get(d.id);
						if (d.position !== undefined) p3.verletPoint.place([d.position.x, d.position.y, d.position.z]);
						if (d.velocity !== undefined) p3.verletPoint.addForce([d.velocity.x, d.velocity.y, d.velocity.z]);
						if (d.mass !== undefined) p3.verletPoint.mass = d.mass;
						if (d.radius !== undefined) p3.verletPoint.radius = d.radius;
						return {
							v: { id: id }
						};

					case 'reset':
						verlet.points.splice(0);
						verlet.pointMap = new Map();
						verlet.constraints.splice(0);
						verlet.constraintMap = new Map();
						return {
							v: { id: id }
						};

					default:
						return {
							v: {
								error: 'Invalid Action: ' + i.action,
								id: id
							}
						};
				}
			}();

			if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
		});

		// deliver data by transfering data
		self.postMessage(data, transfer);
	});

	self.postMessage({ id: 'handshake' });

/***/ },
/* 1 */,
/* 2 */,
/* 3 */,
/* 4 */,
/* 5 */,
/* 6 */,
/* 7 */,
/* 8 */,
/* 9 */,
/* 10 */,
/* 11 */,
/* 12 */,
/* 13 */,
/* 14 */,
/* 15 */,
/* 16 */,
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	var vec3 = {
	    create: __webpack_require__(18),
	    add: __webpack_require__(19),
	    multiply: __webpack_require__(20),
	    sub: __webpack_require__(21),
	    scale: __webpack_require__(22),
	    copy: __webpack_require__(23),
	    sqrLen: __webpack_require__(24),
	    fromValues: __webpack_require__(25),
	}
	module.exports = __webpack_require__(26)(vec3)

/***/ },
/* 18 */
/***/ function(module, exports) {

	module.exports = create;

	/**
	 * Creates a new, empty vec3
	 *
	 * @returns {vec3} a new 3D vector
	 */
	function create() {
	    var out = new Float32Array(3)
	    out[0] = 0
	    out[1] = 0
	    out[2] = 0
	    return out
	}

/***/ },
/* 19 */
/***/ function(module, exports) {

	module.exports = add;

	/**
	 * Adds two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {vec3} out
	 */
	function add(out, a, b) {
	    out[0] = a[0] + b[0]
	    out[1] = a[1] + b[1]
	    out[2] = a[2] + b[2]
	    return out
	}

/***/ },
/* 20 */
/***/ function(module, exports) {

	module.exports = multiply;

	/**
	 * Multiplies two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {vec3} out
	 */
	function multiply(out, a, b) {
	    out[0] = a[0] * b[0]
	    out[1] = a[1] * b[1]
	    out[2] = a[2] * b[2]
	    return out
	}

/***/ },
/* 21 */
/***/ function(module, exports) {

	module.exports = subtract;

	/**
	 * Subtracts vector b from vector a
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {vec3} out
	 */
	function subtract(out, a, b) {
	    out[0] = a[0] - b[0]
	    out[1] = a[1] - b[1]
	    out[2] = a[2] - b[2]
	    return out
	}

/***/ },
/* 22 */
/***/ function(module, exports) {

	module.exports = scale;

	/**
	 * Scales a vec3 by a scalar number
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the vector to scale
	 * @param {Number} b amount to scale the vector by
	 * @returns {vec3} out
	 */
	function scale(out, a, b) {
	    out[0] = a[0] * b
	    out[1] = a[1] * b
	    out[2] = a[2] * b
	    return out
	}

/***/ },
/* 23 */
/***/ function(module, exports) {

	module.exports = copy;

	/**
	 * Copy the values from one vec3 to another
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the source vector
	 * @returns {vec3} out
	 */
	function copy(out, a) {
	    out[0] = a[0]
	    out[1] = a[1]
	    out[2] = a[2]
	    return out
	}

/***/ },
/* 24 */
/***/ function(module, exports) {

	module.exports = squaredLength;

	/**
	 * Calculates the squared length of a vec3
	 *
	 * @param {vec3} a vector to calculate squared length of
	 * @returns {Number} squared length of a
	 */
	function squaredLength(a) {
	    var x = a[0],
	        y = a[1],
	        z = a[2]
	    return x*x + y*y + z*z
	}

/***/ },
/* 25 */
/***/ function(module, exports) {

	module.exports = fromValues;

	/**
	 * Creates a new vec3 initialized with the given values
	 *
	 * @param {Number} x X component
	 * @param {Number} y Y component
	 * @param {Number} z Z component
	 * @returns {vec3} a new 3D vector
	 */
	function fromValues(x, y, z) {
	    var out = new Float32Array(3)
	    out[0] = x
	    out[1] = y
	    out[2] = z
	    return out
	}

/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	var number = __webpack_require__(27)
	var clamp = __webpack_require__(28)
	var createCollider = __webpack_require__(29)

	module.exports = function create(vec) {
	    
	    var collide = createCollider(vec)

	    var velocity = vec.create()
	    var tmp = vec.create()
	    var zero = vec.create()
	    
	    function VerletSystem(opt) {
	        if (!(this instanceof VerletSystem))
	            return new VerletSystem(opt)
	        
	        opt = opt||{}

	        this.gravity = opt.gravity || vec.create()
	        this.friction = number(opt.friction, 0.98)
	        this.min = opt.min
	        this.max = opt.max
	        this.bounce = number(opt.bounce, 1)
	    }
	    
	    VerletSystem.prototype.collision = function(p, velocity) {
	        collide(p, velocity, this.min, this.max, this.bounce)
	    }

	    VerletSystem.prototype.integratePoint = function(point, delta) {
	        var mass = typeof point.mass === 'number' ? point.mass : 1

	        //if mass is zero, assume body is static / unmovable
	        if (mass === 0) {
	            this.collision(point, zero)
	            vec.copy(point.acceleration, zero)
	            return
	        }

	        vec.add(point.acceleration, point.acceleration, this.gravity)
	        vec.scale(point.acceleration, point.acceleration, mass)
	            
	        //difference in positions
	        vec.sub(velocity, point.position, point.previous)

	        //dampen velocity
	        vec.scale(velocity, velocity, this.friction)

	        //handle custom collisions in 2D or 3D space
	        this.collision(point, velocity)

	        //set last position
	        vec.copy(point.previous, point.position)
	        var tSqr = delta * delta
	            
	        //integrate
	        vec.scale(tmp, point.acceleration, 0.5 * tSqr)
	        vec.add(point.position, point.position, velocity)
	        vec.add(point.position, point.position, tmp)

	        //reset acceleration
	        vec.copy(point.acceleration, zero)
	    }

	    VerletSystem.prototype.integrate = function(points, delta) {
	        for (var i=0; i<points.length; i++) {
	            this.integratePoint(points[i], delta)
	        }
	    }

	    return VerletSystem
	}

/***/ },
/* 27 */
/***/ function(module, exports) {

	module.exports = function numtype(num, def) {
		return typeof num === 'number'
			? num 
			: (typeof def === 'number' ? def : 0)
	}

/***/ },
/* 28 */
/***/ function(module, exports) {

	module.exports = clamp

	function clamp(value, min, max) {
	  return min < max
	    ? (value < min ? min : value > max ? max : value)
	    : (value < max ? max : value > min ? min : value)
	}


/***/ },
/* 29 */
/***/ function(module, exports) {

	module.exports = function(vec) {
	    var negInfinity = vec.fromValues(-Infinity, -Infinity, -Infinity)
	    var posInfinity = vec.fromValues(Infinity, Infinity, Infinity)
	    var ones = vec.fromValues(1, 1, 1)
	    var reflect = vec.create()
	    var EPSILON = 0.000001

	    return function collider(p, velocity, min, max, friction) {
	        if (!min && !max)
	            return
	            
	        //reset reflection 
	        vec.copy(reflect, ones)

	        min = min || negInfinity
	        max = max || posInfinity

	        var i = 0,
	            n = p.position.length,
	            hit = false,
	            radius = p.radius || 0

	        //bounce and clamp
	        for (i=0; i<n; i++)
	            if (typeof min[i] === 'number' && p.position[i]-radius < min[i]) {
	                reflect[i] = -1
	                p.position[i] = min[i]+radius
	                hit = true
	            }
	        for (i=0; i<n; i++)
	            if (typeof max[i] === 'number' && p.position[i]+radius > max[i]) {
	                reflect[i] = -1
	                p.position[i] = max[i]-radius
	                hit = true
	            }

	        //no bounce
	        var len2 = vec.sqrLen(velocity)
	        if (!hit || len2 <= EPSILON)
	            return

	        var m = Math.sqrt(len2)
	        if (m !== 0) 
	            vec.scale(velocity, velocity, 1/m)

	        //scale bounce by friction
	        vec.scale(reflect, reflect, m * friction)

	        //bounce back
	        vec.multiply(velocity, velocity, reflect)
	    }
	}

/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	var vec3 = {
	    create: __webpack_require__(18),
	    add: __webpack_require__(19),
	    dot: __webpack_require__(31),
	    sub: __webpack_require__(21),
	    scale: __webpack_require__(22),
	    distance: __webpack_require__(32)
	}
	module.exports = __webpack_require__(33)(vec3)

/***/ },
/* 31 */
/***/ function(module, exports) {

	module.exports = dot;

	/**
	 * Calculates the dot product of two vec3's
	 *
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {Number} dot product of a and b
	 */
	function dot(a, b) {
	    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
	}

/***/ },
/* 32 */
/***/ function(module, exports) {

	module.exports = distance;

	/**
	 * Calculates the euclidian distance between two vec3's
	 *
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {Number} distance between a and b
	 */
	function distance(a, b) {
	    var x = b[0] - a[0],
	        y = b[1] - a[1],
	        z = b[2] - a[2]
	    return Math.sqrt(x*x + y*y + z*z)
	}

/***/ },
/* 33 */
/***/ function(module, exports) {

	module.exports = function(vec) {
	    var delta = vec.create()
	    var scaled = vec.create()

	    function Constraint(points, opt) {
	        if (!points || points.length !== 2)
	            throw new Error('two points must be specified for the constraint')
	        if (!points[0].position || !points[1].position)
	            throw new Error('must specify verlet-point or similar, with { position }')
	        this.points = points
	        this.stiffness = 1.0
	        if (opt && typeof opt.stiffness === 'number')
	            this.stiffness = opt.stiffness

	        if (opt && typeof opt.restingDistance === 'number')
	            this.restingDistance = opt.restingDistance
	        else
	            this.restingDistance = vec.distance(this.points[0].position, this.points[1].position)
	    }

	    Constraint.prototype.solve = function() {
	        //distance formula
	        var p1 = this.points[0],
	            p2 = this.points[1],
	            p1vec = p1.position,
	            p2vec = p2.position,
	            p1mass = typeof p1.mass === 'number' ? p1.mass : 1,
	            p2mass = typeof p2.mass === 'number' ? p2.mass : 1

	        vec.sub(delta, p1vec, p2vec)
	        var d = Math.sqrt(vec.dot(delta, delta))

	        //ratio for resting distance
	        var restingRatio = d===0 ? this.restingDistance : (this.restingDistance - d) / d
	        var scalarP1, 
	            scalarP2

	        //handle zero mass a little differently
	        if (p1mass == 0 && p2mass == 0) {
	            scalarP1 = 0
	            scalarP2 = 0
	        } else if (p1mass == 0 && p2mass > 0) {
	            scalarP1 = 0
	            scalarP2 = this.stiffness
	        } else if (p1mass > 0 && p2mass == 0) {
	            scalarP1 = this.stiffness
	            scalarP2 = 0
	        } else {
	            //invert mass quantities
	            var im1 = 1.0 / p1mass
	            var im2 = 1.0 / p2mass
	            scalarP1 = (im1 / (im1 + im2)) * this.stiffness
	            scalarP2 = this.stiffness - scalarP1
	        }
	        
	        //push/pull based on mass
	        vec.scale(scaled, delta, scalarP1 * restingRatio)
	        vec.add(p1vec, p1vec, scaled)
	        
	        vec.scale(scaled, delta, scalarP2 * restingRatio)
	        vec.sub(p2vec, p2vec, scaled)

	        return d
	    }

	    return function(p1, p2, opt) {
	        return new Constraint(p1, p2, opt)
	    }
	}


/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	var vec3 = {
	    create: __webpack_require__(18),
	    sub: __webpack_require__(21),
	    copy: __webpack_require__(23)
	}
	module.exports = __webpack_require__(35)(vec3)

/***/ },
/* 35 */
/***/ function(module, exports) {

	module.exports = function(vec) {
	    function Point(opt) {
	        this.position = vec.create()
	        this.previous = vec.create()
	        this.acceleration = vec.create()
	        this.mass = 1.0
	        this.radius = 0

	        if (opt && typeof opt.mass === 'number')
	            this.mass = opt.mass
	        if (opt && typeof opt.radius === 'number')
	            this.radius = opt.radius

	        if (opt && opt.position) 
	            vec.copy(this.position, opt.position)
	        
	        if (opt && (opt.previous||opt.position)) 
	            vec.copy(this.previous, opt.previous || opt.position)
	        
	        if (opt && opt.acceleration)
	            vec.copy(this.acceleration, opt.acceleration)
	    }

	    Point.prototype.addForce = function(v) {
	        vec.sub(this.previous, this.previous, v)
	        return this
	    }

	    Point.prototype.place = function(v) {
	        vec.copy(this.position, v)
	        vec.copy(this.previous, v)
	        return this
	    }

	    return function(opt) {
	        return new Point(opt)
	    }
	}

/***/ },
/* 36 */
/***/ function(module, exports) {

	module.exports = scaleAndAdd;

	/**
	 * Adds two vec3's after scaling the second operand by a scalar value
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @param {Number} scale the amount to scale b by before adding
	 * @returns {vec3} out
	 */
	function scaleAndAdd(out, a, b, scale) {
	    out[0] = a[0] + (b[0] * scale)
	    out[1] = a[1] + (b[1] * scale)
	    out[2] = a[2] + (b[2] * scale)
	    return out
	}

/***/ }
/******/ ]);