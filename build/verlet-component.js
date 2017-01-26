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
	/* eslint-env es2017, worker */
	/* eslint no-console: 0 */

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
		tick() {
			if (!this.v) return;
			this.v.getPoints().then(this.updatePoints);
		},
		updatePoints({ byteData }) {
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
		init() {
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
		}
	});

/***/ },
/* 1 */
/***/ function(module, exports) {

	'use strict';
	/* eslint no-console: 0 */

	const awaitingResponseQueue = new Map();
	const BYTE_DATA_STAND_IN = 'BYTE_DATA_STAND_IN';

	function resolveMessagePromise(event) {

		// Iterate over the responses and resolve/reject accordingly
		const response = event.data;
		response.forEach((d, i) => {
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
			requestAnimationFrame(this.process);
		}

		workerMessage(message) {

			const id = String(Date.now() + Math.floor(Math.random() * 1000000));
			const verletSystem = this;

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

		connectPoints(p1, p2, constraintOptions) {
			return this.workerMessage({ action: 'connectPoints', options: { p1, p2, constraintOptions } });
		}

		updateConstraint(options) {
			return this.workerMessage({ action: 'updateConstraint', options });
		}

		reset() {
			return this.workerMessage({ action: 'reset' });
		}
	}

	module.exports = Verlet;

/***/ }
/******/ ]);