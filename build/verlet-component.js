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
	/* eslint no-console: 0 */
	/* global AFRAME */

	/* TODO Keep track of unused workers in the event of the container being destroyed so that they can be reused later. */

	let start = (() => {
		var _ref = _asyncToGenerator(function* (options) {
			const v = new Verlet();
			yield v.init(options);
			return v;
		});

		return function start(_x) {
			return _ref.apply(this, arguments);
		};
	})();

	function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

	const Verlet = __webpack_require__(1);

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
		init() {
			this.systemPromise = start(this.data).then(v => this.v = v);
			this.systemPromise.then(v => this.el.emit('verlet-container-init-complete', v));
			this.points = new Map();
			this.updatePoints = this.updatePoints.bind(this);
		},
		update() {
			// TODO: Update verlet system without restarting worker
		},
		addPoint(component, data) {
			return this.systemPromise.then(v => v.addPoint(data)).then(d => {
				this.points.set(d.point.id, component);
				return d.point.id;
			});
		},
		connectPoints(p1, p2, options) {
			return this.systemPromise.then(v => v.connectPoints(p1, p2, options));
		},
		removeConstraint(id) {
			return this.systemPromise.then(v => v.removeConstraint(id));
		},
		updatePoint(id, data) {
			const inData = { id };
			Object.assign(inData, data);
			return this.systemPromise.then(v => v.updatePoint(inData));
		},
		tick() {
			if (!this.v) return;
			this.v.getPoints().then(this.updatePoints);
			this.v.process();
		},
		updatePoints({ byteData }) {
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
		init() {
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

			// destroy everything then rebuild!
			this.remove().then(() => {
				this.idPromises = this.idPromises || [];
				this.data.restingDistance = this.data.distance ? Number(this.data.distance) : undefined;
				this.parentReadyPromise.then(verletSystem => {
					if (!this.data.from || !this.data.from.length) {
						if (this.el.matches('[verlet-point]')) {
							this.data.from = [this.el];
						} else {
							this.data.from = [];
						}
					}

					if (!this.data.to || !this.data.to.length) {
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
								this.idPromises.push(Promise.all([i.components['verlet-point'].idPromise, j.components['verlet-point'].idPromise]).then(arr => {
									const id1 = arr[0];
									const id2 = arr[1];
									return verletSystem.connectPoints(id1, id2, { stiffness: this.data.stiffness, restingDistance: this.data.restingDistance }).then(obj => obj.constraintId);
								}));
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
					console.log(arrOfIDs);
					return Promise.all(arrOfIDs.map(id => v.removeConstraint(id)));
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
		init() {
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
		}
	});

/***/ },
/* 1 */
/***/ function(module, exports) {

	'use strict';
	/* eslint-env commonjs, browser, es6 */
	/* eslint no-console: 0 */

	const awaitingResponseQueue = new Map();
	const BYTE_DATA_STAND_IN = 'BYTE_DATA_STAND_IN';

	function resolveMessagePromise(event) {

		// Iterate over the responses and resolve/reject accordingly
		const response = event.data;
		response.forEach(d => {
			const waitingMessage = awaitingResponseQueue.get(d.id);
			awaitingResponseQueue.delete(d.id);
			delete d.id;
			if (!d.error) {
				if (d.byteData) {
					// console.log('Recieved \'data\' back from worker');
					this.dataAvailable = true;
					this.data = new Float32Array(d.byteData);
					d.byteData = this.data;
				}
				waitingMessage.resolve(d);
			} else {
				waitingMessage.reject(d.error);
			}
		});
	};

	class Verlet {

		constructor(maxPoints = 10) {
			this.myWorker = new Worker('./build/worker.js');
			this.myWorker.addEventListener('message', resolveMessagePromise.bind(this));
			this.messageQueue = [];
			this.setMaxPoints(maxPoints);

			// Process messages once per frame
			this.process = this.process.bind(this);
			requestAnimationFrame(this.process);
		}

		/**
	  * Updates the size of the memory buffer
	  * used to store points use this to allocate what is required.
	  * */
		setMaxPoints(maxPoints) {
			this.maxPoints = maxPoints;
			this.data = new Float32Array(maxPoints * 4);
			this.dataAvailable = true;
		}

		process() {

			// skip frames if data is being slow
			if (!this.data) return;

			if (this.messageQueue.length) {

				const transfer = [];
				const messageToSend = {};

				const queue = this.messageQueue.splice(0);
				for (const i of queue) {
					if (i.message['BYTE_DATA_STAND_IN']) {
						delete i.message['BYTE_DATA_STAND_IN'];
						i.message.byteData = this.data.buffer;

						if (transfer.indexOf(this.data.buffer) === -1) {
							transfer.push(this.data.buffer);
						}
					}

					messageToSend[i.id] = i.message;
					awaitingResponseQueue.set(i.id, i);
				};

				if (transfer.indexOf(this.data.buffer) !== -1) {
					// console.log('Transfering \'data\' to worker');
					this.dataAvailable = false;
					this.data = undefined;
				}

				this.myWorker.postMessage(messageToSend, transfer);
			}
		}

		workerMessage(message) {

			const id = String(Date.now() + Math.floor(Math.random() * 1000000));

			// This wraps the message posting/response in a promise, which will resolve if the response doesn't
			// contain an error, and reject with the error if it does. If you'd prefer, it's possible to call
			// controller.postMessage() and set up the onmessage handler independently of a promise, but this is
			// a convenient wrapper.
			return new Promise(function workerMessagePromise(resolve, reject) {
				const data = {
					id,
					message,
					resolve,
					reject
				};

				if (message.action === 'getPoints') {
					for (const o of this.messageQueue) {
						if (o.message.action === 'getPoints') o.message.action = 'noopPoints';
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
		init(options) {
			return this.workerMessage({ action: 'init', options });
		}

		/**
	  * Run the physics System and return the updated points
	  */
		getPoints() {
			// console.log(this.dataAvailable ? 'Data Available' : 'Data Unavailable');
			return this.workerMessage({ action: 'getPoints', BYTE_DATA_STAND_IN });
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
		addPoint(pointOptions) {
			return this.workerMessage({ action: 'addPoint', pointOptions });
		}

		/**
	  * Update a point in the Verlet System
	  *
	     * position: {x, y, z},
	     * velocity: {x, y, z},
	     * mass [Number],
	     * radius [Number],
	  * */
		updatePoint(pointOptions) {
			return this.workerMessage({ action: 'updatePoint', pointOptions });
		}

		connectPoints(id1, id2, constraintOptions) {
			return this.workerMessage({ action: 'connectPoints', options: { id1, id2, constraintOptions } });
		}

		updateConstraint(options) {
			return this.workerMessage({ action: 'updateConstraint', options });
		}

		removeConstraint(constraintId) {
			return this.workerMessage({ action: 'removeConstraint', options: { constraintId } });
		}

		reset() {
			return this.workerMessage({ action: 'reset' });
		}
	}

	module.exports = Verlet;

/***/ }
/******/ ]);