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

	'use strict';
	/* eslint-env commonjs, browser, es6 */
	/* global AFRAME */

	/* TODO Keep track of unused workers in the event of the container being destroyed so that they can be reused later. */

	var start = function () {
		var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(options) {
			var v;
			return regeneratorRuntime.wrap(function _callee$(_context) {
				while (1) {
					switch (_context.prev = _context.next) {
						case 0:
							v = new Verlet();
							_context.next = 3;
							return v.init(options);

						case 3:
							return _context.abrupt('return', v);

						case 4:
						case 'end':
							return _context.stop();
					}
				}
			}, _callee, this);
		}));

		return function start(_x) {
			return _ref.apply(this, arguments);
		};
	}();

	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

	function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

	var Verlet = __webpack_require__(1);

	;

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
		init: function init() {
			var _this = this;

			this.systemPromise = start(this.data).then(function (v) {
				return _this.v = v;
			});
			this.systemPromise.then(function (v) {
				return _this.el.emit('verlet-container-init-complete', v);
			});
			this.points = new Map();
			this.updatePoints = this.updatePoints.bind(this);
		},
		update: function update() {
			// TODO: Update verlet system without restarting worker
		},
		addPoint: function addPoint(component, data) {
			var _this2 = this;

			return this.systemPromise.then(function (v) {
				return v.addPoint(data);
			}).then(function (d) {
				_this2.points.set(d.point.id, component);
				return d.point.id;
			});
		},
		removePoint: function removePoint(id) {
			return this.systemPromise.then(function (v) {
				return v.removePoint(id);
			});
		},
		updatePoint: function updatePoint(id, data) {
			var inData = { id: id };
			Object.assign(inData, data);
			return this.systemPromise.then(function (v) {
				return v.updatePoint(inData);
			});
		},
		connectPoints: function connectPoints(p1, p2, options) {
			return this.systemPromise.then(function (v) {
				return v.connectPoints(p1, p2, options);
			});
		},
		removeConstraint: function removeConstraint(id) {
			return this.systemPromise.then(function (v) {
				return v.removeConstraint(id);
			});
		},
		tick: function tick() {
			if (!this.v) return;
			this.v.getPoints().then(this.updatePoints);
			this.v.process();
		},
		updatePoints: function updatePoints(_ref2) {
			var byteData = _ref2.byteData;

			for (var i = 0, l = byteData.length; i < l; i += 4) {
				var point = byteData[i + 0] && this.points.get(byteData[i + 0]);
				if (!point) continue;
				var pX = byteData[i + 1];
				var pY = byteData[i + 2];
				var pZ = byteData[i + 3];
				point.setPosition(pX, pY, pZ);
			}
		}
	});

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
				default: ''
			}
		},
		init: function init() {
			var el = this.el;
			while (el && el.matches && !el.matches('[verlet-container]')) {
				el = el.parentNode;
			}if (el.components['verlet-container']) {
				this.parentReadyPromise = Promise.resolve(el.components['verlet-container']);
			} else {
				this.parentReadyPromise = new Promise(function (r) {
					return el.addEventListener('verlet-container-init-complete', function () {
						return r(el.components['verlet-container']);
					});
				});
			}
			this.constraints = new Map();
		},
		update: function update() {
			var _this3 = this;

			// destroy everything then rebuild!
			this.remove().then(function () {
				_this3.idPromises = _this3.idPromises || [];
				_this3.data.restingDistance = _this3.data.distance ? Number(_this3.data.distance) : undefined;
				_this3.parentReadyPromise.then(function (verletSystem) {
					if (!_this3.data.from || !_this3.data.from.length) {
						if (_this3.el.matches('[verlet-point]')) {
							_this3.data.from = [_this3.el];
						} else {
							_this3.data.from = [];
						}
					}

					if (!_this3.data.to || !_this3.data.to.length) {
						if (_this3.el.matches('[verlet-point]')) {
							_this3.data.to = [_this3.el];
						} else {
							_this3.data.to = [];
						}
					}

					var _iteratorNormalCompletion = true;
					var _didIteratorError = false;
					var _iteratorError = undefined;

					try {
						for (var _iterator = _this3.data.to[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
							var i = _step.value;
							var _iteratorNormalCompletion2 = true;
							var _didIteratorError2 = false;
							var _iteratorError2 = undefined;

							try {
								for (var _iterator2 = _this3.data.from[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
									var j = _step2.value;

									if (i !== j) {
										if (!i.components['verlet-point'].idPromise) i.updateComponent('verlet-point');
										if (!j.components['verlet-point'].idPromise) j.updateComponent('verlet-point');
										_this3.idPromises.push(Promise.all([i.components['verlet-point'].idPromise, j.components['verlet-point'].idPromise]).then(function (arr) {
											var id1 = arr[0];
											var id2 = arr[1];
											return verletSystem.connectPoints(id1, id2, { stiffness: _this3.data.stiffness, restingDistance: _this3.data.restingDistance }).then(function (obj) {
												return obj.constraintId;
											});
										}));
									}
								}
							} catch (err) {
								_didIteratorError2 = true;
								_iteratorError2 = err;
							} finally {
								try {
									if (!_iteratorNormalCompletion2 && _iterator2.return) {
										_iterator2.return();
									}
								} finally {
									if (_didIteratorError2) {
										throw _iteratorError2;
									}
								}
							}
						}
					} catch (err) {
						_didIteratorError = true;
						_iteratorError = err;
					} finally {
						try {
							if (!_iteratorNormalCompletion && _iterator.return) {
								_iterator.return();
							}
						} finally {
							if (_didIteratorError) {
								throw _iteratorError;
							}
						}
					}
				});
			});
		},
		remove: function remove() {
			if (this.idPromises) {
				return Promise.all([this.parentReadyPromise].concat(_toConsumableArray(this.idPromises))).then(function (arrOfIDs) {
					// remove every constraint
					var v = arrOfIDs.shift();
					return Promise.all(arrOfIDs.map(function (id) {
						return v.removeConstraint(id);
					}));
				});
			} else {
				return Promise.resolve();
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
			},
			radius: {
				default: 0
			}
		},
		init: function init() {
			var _this4 = this;

			var el = this.el;
			while (el && el.matches && !el.matches('[verlet-container]')) {
				el = el.parentNode;
			}if (el.components['verlet-container']) {
				this.parentReadyPromise = Promise.resolve(el.components['verlet-container']);
			} else {
				this.parentReadyPromise = new Promise(function (r) {
					return el.addEventListener('verlet-container-init-complete', function () {
						return r(el.components['verlet-container']);
					});
				});
			}
			this.parentReadyPromise.then(function (c) {
				_this4.parentVerletComponent = c;
			});
			this.el.updateComponent('position');
		},


		// for processing data recieved from container
		setPosition: function setPosition(x, y, z) {
			this.el.object3D.position.x = x;
			this.el.object3D.position.y = y;
			this.el.object3D.position.z = z;
		},
		update: function update() {
			var _this5 = this;

			return this.parentReadyPromise.then(function (c) {

				_this5.data.position = _this5.attrValue.position ? _this5.data.position : _this5.el.object3D.position;
				if (!_this5.idPromise) {
					_this5.idPromise = c.addPoint(_this5, _this5.data);
					return _this5.idPromise;
				} else {
					return _this5.idPromise.then(function (id) {
						return c.updatePoint(id, _this5.data);
					});
				}
			});
		},
		remove: function remove() {
			var _this6 = this;

			return this.parentReadyPromise.then(function (c) {
				if (_this6.idPromise) {
					return _this6.idPromise.then(function (id) {
						return c.removePoint(id);
					});
				} else {
					return Promise.resolve();
				}
			});
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
			distance: 'verlet-constraint.distance'
		}
	});

/***/ },
/* 1 */
/***/ function(module, exports) {

	'use strict';
	/* eslint-env commonjs, browser, es6 */

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var awaitingResponseQueue = new Map();
	var BYTE_DATA_STAND_IN = 'BYTE_DATA_STAND_IN';

	function resolveMessagePromise(event) {
		var _this = this;

		// Iterate over the responses and resolve/reject accordingly
		var response = event.data;

		if (response.id === 'handshake') {
			this.workerPromiseResolver();
			return;
		}

		response.forEach(function (d) {
			var waitingMessage = awaitingResponseQueue.get(d.id);
			awaitingResponseQueue.delete(d.id);
			delete d.id;
			if (!d.error) {
				if (d.byteData) {
					_this.dataAvailable = true;
					_this.data = new Float32Array(d.byteData);
					d.byteData = _this.data;
				}
				waitingMessage.resolve(d);
			} else {
				waitingMessage.reject(d.error);
			}
		});
	};

	var Verlet = function () {
		function Verlet() {
			var _this2 = this;

			var maxPoints = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 10;

			_classCallCheck(this, Verlet);

			this.myWorker = new Worker('./build/worker.js');
			this.workerPromise = new Promise(function (resolve) {
				return _this2.workerPromiseResolver = resolve;
			});
			this.myWorker.addEventListener('message', resolveMessagePromise.bind(this));
			this.messageQueue = [];
			this.setMaxPoints(maxPoints);

			// Process messages once per frame
			this.process = this.process.bind(this);
		}

		/**
	  * Updates the size of the memory buffer
	  * used to store points use this to allocate what is required.
	  * */


		_createClass(Verlet, [{
			key: 'setMaxPoints',
			value: function setMaxPoints(maxPoints) {
				this.maxPoints = maxPoints;
				this.data = new Float32Array(maxPoints * 4);
				this.dataAvailable = true;
			}
		}, {
			key: 'process',
			value: function process() {

				// skip frames if data is being slow
				if (!this.data) return;

				if (this.messageQueue.length) {

					var transfer = [];
					var messageToSend = {};

					var queue = this.messageQueue.splice(0);
					var _iteratorNormalCompletion = true;
					var _didIteratorError = false;
					var _iteratorError = undefined;

					try {
						for (var _iterator = queue[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
							var i = _step.value;

							if (i.message['BYTE_DATA_STAND_IN']) {
								delete i.message['BYTE_DATA_STAND_IN'];
								i.message.byteData = this.data.buffer;

								if (transfer.indexOf(this.data.buffer) === -1) {
									transfer.push(this.data.buffer);
								}
							}

							messageToSend[i.id] = i.message;
							awaitingResponseQueue.set(i.id, i);
						}
					} catch (err) {
						_didIteratorError = true;
						_iteratorError = err;
					} finally {
						try {
							if (!_iteratorNormalCompletion && _iterator.return) {
								_iterator.return();
							}
						} finally {
							if (_didIteratorError) {
								throw _iteratorError;
							}
						}
					}

					;

					if (transfer.indexOf(this.data.buffer) !== -1) {
						this.dataAvailable = false;
						this.data = undefined;
					}

					this.myWorker.postMessage(messageToSend, transfer);
				}
			}
		}, {
			key: 'workerMessage',
			value: function workerMessage(message) {

				var id = String(Date.now() + Math.floor(Math.random() * 1000000));

				// This wraps the message posting/response in a promise, which will resolve if the response doesn't
				// contain an error, and reject with the error if it does. If you'd prefer, it's possible to call
				// controller.postMessage() and set up the onmessage handler independently of a promise, but this is
				// a convenient wrapper.
				return new Promise(function workerMessagePromise(resolve, reject) {
					var data = {
						id: id,
						message: message,
						resolve: resolve,
						reject: reject
					};

					if (message.action === 'getPoints') {
						var _iteratorNormalCompletion2 = true;
						var _didIteratorError2 = false;
						var _iteratorError2 = undefined;

						try {
							for (var _iterator2 = this.messageQueue[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
								var o = _step2.value;

								if (o.message.action === 'getPoints') o.message.action = 'noopPoints';
							}
						} catch (err) {
							_didIteratorError2 = true;
							_iteratorError2 = err;
						} finally {
							try {
								if (!_iteratorNormalCompletion2 && _iterator2.return) {
									_iterator2.return();
								}
							} finally {
								if (_didIteratorError2) {
									throw _iteratorError2;
								}
							}
						}
					}

					this.messageQueue.push(data);
				}.bind(this));
			}

			/**
	   * options object
	   * graivity: -9.8
	   * size: {x: 10, y: 10, x: 10}
	   */

		}, {
			key: 'init',
			value: function init(options) {
				var _this3 = this;

				return this.workerPromise.then(function () {
					var promise = _this3.workerMessage({ action: 'init', options: options });

					// send init message
					_this3.process();
					return promise;
				});
			}

			/**
	   * Run the physics System and return the updated points
	   */

		}, {
			key: 'getPoints',
			value: function getPoints() {
				return this.workerMessage({ action: 'getPoints', BYTE_DATA_STAND_IN: BYTE_DATA_STAND_IN });
			}

			/**
	   * Add a point to the Verlet System
	   *
	      * position: {x, y, z},
	      * velocity: {x, y, z},
	      * mass [Number],
	      * radius [Number],
	      * attraction [Number] - Pre makes connects point to all others
	   * */

		}, {
			key: 'addPoint',
			value: function addPoint(pointOptions) {
				return this.workerMessage({ action: 'addPoint', pointOptions: pointOptions });
			}

			/**
	   * Update a point in the Verlet System
	   *
	      * position: {x, y, z},
	      * velocity: {x, y, z},
	      * mass [Number],
	      * radius [Number],
	   * */

		}, {
			key: 'updatePoint',
			value: function updatePoint(pointOptions) {
				return this.workerMessage({ action: 'updatePoint', pointOptions: pointOptions });
			}
		}, {
			key: 'removePoint',
			value: function removePoint(id) {
				return this.workerMessage({ action: 'removePoint', options: { id: id } });
			}
		}, {
			key: 'connectPoints',
			value: function connectPoints(id1, id2, constraintOptions) {
				return this.workerMessage({ action: 'connectPoints', options: { id1: id1, id2: id2, constraintOptions: constraintOptions } });
			}
		}, {
			key: 'updateConstraint',
			value: function updateConstraint(options) {
				return this.workerMessage({ action: 'updateConstraint', options: options });
			}
		}, {
			key: 'removeConstraint',
			value: function removeConstraint(constraintId) {
				return this.workerMessage({ action: 'removeConstraint', options: { constraintId: constraintId } });
			}
		}, {
			key: 'reset',
			value: function reset() {
				return this.workerMessage({ action: 'reset' });
			}
		}]);

		return Verlet;
	}();

	module.exports = Verlet;

/***/ }
/******/ ]);