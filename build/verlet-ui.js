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

	__webpack_require__(10);
	__webpack_require__(14);
	__webpack_require__(15);
	__webpack_require__(16);
	__webpack_require__(11);

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
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	/* global AFRAME */
	/* eslint no-var: 0 */
	/* eslint-env browser, node */

	var verletUITemplate = __webpack_require__(11).template;
	var types = {
		radio: __webpack_require__(12),
		button: __webpack_require__(13)
	};

	AFRAME.registerComponent('verlet-ui-input', AFRAME.utils.extend({
		schema: {
			type: {

				// One of 'radio',
				type: 'string'
			}
		},
		setup: function setup() {
			this.remove();
			this.remove = types[this.data.type].remove;
			return types[this.data.type].setup.bind(this)();
		}
	}, verletUITemplate));

	AFRAME.registerComponent('verlet-ui-default-selector', {
		schema: {
			'color': {
				type: 'color',
				default: '#ffffff'
			},
			'activeColor': {
				type: 'color',
				default: '#ff9911'
			}
		},
		init: function init() {
			this.els = [];
		},
		update: function update() {

			// create standard animations for interactions
			this.el.setAttribute('material', 'color', this.data.color);

			this.remove();
			var el1 = document.createElement('a-animation');
			el1.setAttribute('attribute', 'scale');
			el1.setAttribute('easing', 'ease-out-elastic');
			el1.setAttribute('begin', 'grabber-hover-on');
			el1.setAttribute('fill', 'forwards');
			el1.setAttribute('dur', '1000');
			el1.setAttribute('to', '1.3 1.3 1.3');

			var el2 = document.createElement('a-animation');
			el2.setAttribute('attribute', 'scale');
			el2.setAttribute('easing', 'ease-out-elastic');
			el2.setAttribute('begin', 'grabber-hover-out');
			el2.setAttribute('fill', 'forwards');
			el2.setAttribute('dur', '1000');
			el2.setAttribute('to', '1 1 1');

			var el3 = document.createElement('a-animation');
			el3.setAttribute('attribute', 'material.color');
			el3.setAttribute('begin', 'grabber-drag-start');
			el3.setAttribute('fill', 'forwards');
			el3.setAttribute('dur', '200');
			el3.setAttribute('from', this.data['color']);
			el3.setAttribute('to', this.data['activeColor']);

			var el4 = document.createElement('a-animation');
			el4.setAttribute('attribute', 'material.color');
			el4.setAttribute('begin', 'grabber-drag-end');
			el4.setAttribute('fill', 'forwards');
			el4.setAttribute('dur', '200');
			el4.setAttribute('from', this.data['activeColor']);
			el4.setAttribute('to', this.data['color']);

			this.el.appendChild(el1);
			this.el.appendChild(el2);
			this.el.appendChild(el3);
			this.el.appendChild(el4);
			this.els.push(el1, el2, el3, el4);
		},
		remove: function remove() {
			while (this.els.length) {
				this.el.removeChild(this.els.pop());
			}
		}
	});

	AFRAME.registerComponent('verlet-ui-default-button', {
		schema: {
			'color': {
				type: 'color',
				default: '#ffffff'
			},
			'activeColor': {
				type: 'color',
				default: '#ff9911'
			}
		},
		init: function init() {
			this.els = [];
		},
		update: function update() {

			this.el.setAttribute('material', 'color', this.data.color);

			// create standard animations for interactions

			this.remove();
			var el1 = document.createElement('a-animation');
			el1.setAttribute('attribute', 'scale');
			el1.setAttribute('easing', 'ease-out-elastic');
			el1.setAttribute('begin', 'grabber-hover-on');
			el1.setAttribute('fill', 'forwards');
			el1.setAttribute('dur', '1000');
			el1.setAttribute('to', '1.3 1.3 1.3');

			var el2 = document.createElement('a-animation');
			el2.setAttribute('attribute', 'scale');
			el2.setAttribute('easing', 'ease-out-elastic');
			el2.setAttribute('begin', 'grabber-hover-out');
			el2.setAttribute('fill', 'forwards');
			el2.setAttribute('dur', '1000');
			el2.setAttribute('to', '1 1 1');

			var el3 = document.createElement('a-animation');
			el3.setAttribute('attribute', 'material.color');
			el3.setAttribute('begin', 'grabber-click');
			el3.setAttribute('fill', 'forwards');
			el3.setAttribute('dur', '200');
			el3.setAttribute('from', this.data['activeColor']);
			el3.setAttribute('to', this.data['color']);

			this.el.appendChild(el1);
			this.el.appendChild(el2);
			this.el.appendChild(el3);
			this.els.push(el1, el2, el3);
		},
		remove: function remove() {
			while (this.els.length) {
				this.el.removeChild(this.els.pop());
			}
		}
	});

/***/ },
/* 11 */
/***/ function(module, exports) {

	'use strict';
	/* global AFRAME */
	/* eslint no-var: 0 */
	/* eslint-env browser, node */

	AFRAME.registerPrimitive('verlet-ui', {
		defaultComponents: {
			'grabber-tracking': {},
			'verlet-container': {
				gravity: 0,
				friction: 0.8
			}
		},

		mappings: {
			manipulator: 'grabber-tracking.manipulator',
			pointer: 'grabber-tracking.pointer'
		}
	});

	var noop = function noop() {};
	var verletUITemplate = {
		update: function update() {
			if (this.tick === noop) this.tick = this.__tick;
		},
		tick: function tick() {
			var el = this.el;
			while (el && el.matches && !el.matches('[grabber-tracking], verlet-ui')) {
				el = el.parentNode;
			}this.parent = el;
			this.__tick = this.tick;
			this.tick = noop;
			this.setup();
		}
	};

	module.exports.template = verletUITemplate;

/***/ },
/* 12 */
/***/ function(module, exports) {

	'use strict';
	/* eslint no-var: 0 */
	/* eslint-env browser, node */

	module.exports.setup = function () {
		this.constraints = this.constraints || [];
		this.eventListeners = this.eventListeners || [];

		// clean up
		this.remove();

		var selector = this.el.querySelector('a-verlet-ui-input-selector');
		var manipulatorSelector = this.parent.getDOMAttribute('grabber-tracking').manipulator;
		var self = this;
		var options = [].slice.call(document.querySelectorAll('a-verlet-ui-option'));

		this.updateValue = function () {
			options.sort(function (a, b) {
				var distanceToA = selector.object3D.position.distanceToSquared(a.object3D.position);
				var distanceToB = selector.object3D.position.distanceToSquared(b.object3D.position);
				return distanceToA - distanceToB;
			});
			this.el.value = options[0].getAttribute('value');
		};

		// Set up being able to drag and pull the dragable object
		this.setConstraint = function setConstraint() {
			this.setAttribute('verlet-constraint', 'stiffness: 0.4; to: ' + manipulatorSelector + ';');
		};
		this.removeConstraint = function removeConstraint() {
			this.setAttribute('verlet-constraint', 'stiffness: 0.4; to:;');
		};
		selector.addEventListener('grabber-drag-start', this.setConstraint);
		selector.addEventListener('grabber-drag-end', this.removeConstraint);

		this.updateValue();

		// Set up firing change events when it is dropped
		selector.addEventListener('grabber-drag-end', function () {
			var oldValue = self.el.value;
			self.updateValue();
			if (self.el.value !== oldValue) {
				self.el.emit('change', self.el.value);
			}
		});

		// attach each option to the selector to allow it to snap into place
		options.forEach(function (option) {
			self.parent.components['verlet-container'].connectPoints(option, selector, {
				stiffness: 0.5,
				range: 0.75,
				restingDistance: 0
			}).then(function (data) {
				option.__constraintId = data.constraintId;
				self.constraints.push(data.constraintId);
			});
		});
	};

	module.exports.remove = function () {
		var _this = this;

		// clean up constraints and eventListeners

		this.constraints.forEach(function (id) {
			return _this.parent.components['verlet-container'].removeConstraint(id);
		});
		var selector = this.el.querySelector('a-verlet-ui-input-selector');
		selector.removeEventListener('grabber-drag-start', this.setConstraint);
		selector.removeEventListener('grabber-drag-end', this.removeConstraint);
	};

/***/ },
/* 13 */
/***/ function(module, exports) {

	'use strict';
	/* eslint no-var: 0 */
	/* eslint-env browser, node */

	module.exports.setup = function () {

		if (!this.el.getAttribute('verlet-ui-grabable')) {
			this.el.setAttribute('verlet-ui-grabable', '');
		}
		this.el.setAttribute('verlet-point', 'mass: 0;');

		this.el.addEventListener('grabber-click', function () {
			this.emit('click');
		});
	};

	module.exports.remove = function () {};

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	/* global AFRAME */
	/* eslint no-var: 0 */
	/* eslint-env browser, node */

	var verletUITemplate = __webpack_require__(11).template;

	function squaredDistanceBetween(el1, el2) {

		// make it curryable
		if (!el2) return function (el2) {
			return squaredDistanceBetween(el1, el2);
		};

		// this is horrible hack, we need the world position for the camera anchor as it's relative position never changes
		// fortunately it's world position is calculated and kept locally because it has sync-position:true
		var dSquared = el1.object3D.position.distanceToSquared(el2.components['verlet-point'].worldPosition || el2.object3D.position);

		// make it the distance to the edge of the resting distance of the verlet point
		if (el1.components['verlet-constraint'] && el1.components['verlet-constraint'].data.restingDistance) {
			dSquared -= el1.components['verlet-constraint'].data.restingDistance * el1.components['verlet-constraint'].data.restingDistance;
		}
		if (el2.components['verlet-constraint'] && el2.components['verlet-constraint'].data.restingDistance) {
			dSquared -= el2.components['verlet-constraint'].data.restingDistance * el2.components['verlet-constraint'].data.restingDistance;
		}
		if (dSquared < 0) dSquared = 0;
		return dSquared;
	}

	AFRAME.registerComponent('verlet-ui-pointer', AFRAME.utils.extend({
		setup: function setup() {
			var manipulatorSelector = this.parent.getDOMAttribute('grabber-tracking').manipulator;
			this.el.setAttribute('verlet-constraint', 'stiffness: 0.05; to: ' + manipulatorSelector + ';');
		}
	}, verletUITemplate));

	AFRAME.registerComponent('verlet-ui-default-pointer', {
		init: function init() {

			var pointerOpenHand = document.createElement('a-entity');
			pointerOpenHand.setAttribute('material', 'color: white;');
			pointerOpenHand.setAttribute('scale', '0.2 0.2 0.2');
			pointerOpenHand.setAttribute('rotation', '30 0 0');
			pointerOpenHand.setAttribute('obj-model', 'obj: url(https://cdn.rawgit.com/SamsungInternet/a-frame-demos/44b878/a-frame-assets/hand/hand-relaxed.obj);');

			var pointerClosedHand = document.createElement('a-entity');
			pointerClosedHand.setAttribute('material', 'color: white;');
			pointerClosedHand.setAttribute('scale', '0.2 0.2 0.2');
			pointerClosedHand.setAttribute('rotation', '40 0 0');
			pointerClosedHand.setAttribute('obj-model', 'obj: url(https://cdn.rawgit.com/SamsungInternet/a-frame-demos/44b878/a-frame-assets/hand/hand-fist.obj);');
			pointerClosedHand.setAttribute('visible', 'false');

			// Make the hand open and close
			var pointer = this.el;

			pointer.appendChild(pointerOpenHand);
			pointer.appendChild(pointerClosedHand);

			pointer.addEventListener('grabber-drag-start', function () {
				pointerOpenHand.setAttribute('visible', false);
				pointerClosedHand.setAttribute('visible', true);
			});

			pointer.addEventListener('grabber-drag-end', function () {
				pointerOpenHand.setAttribute('visible', true);
				pointerClosedHand.setAttribute('visible', false);
			});

			this.el1 = pointerOpenHand;
			this.el2 = pointerClosedHand;
		},
		remove: function remove() {
			this.el.removeChild(this.el1);
			this.el.removeChild(this.el2);
		}
	});

	// Tracks cursor position, used for interacting with the UI in the scene
	AFRAME.registerComponent('grabber-tracking', {
		schema: {
			manipulator: {
				type: 'selector'
			},
			pointer: {
				type: 'selector'
			}
		},
		init: function init() {
			var canvas = this.el.sceneEl.canvas;

			// Wait for canvas to load.
			if (!canvas) {
				this.el.sceneEl.addEventListener('render-target-loaded', this.init.bind(this));
				return;
			}

			// Attach event listeners.
			canvas.addEventListener('touchstart', this.dragStart.bind(this));
			canvas.addEventListener('touchend', this.dragEnd.bind(this));
			canvas.addEventListener('mousedown', this.dragStart.bind(this));
			canvas.addEventListener('mouseup', this.dragEnd.bind(this));
			canvas.addEventListener('click', this.handleClick.bind(this));

			this.actionables = [];
			this.currentObject = null;
			this.ready === true;
		},
		update: function update() {
			this.grabber = this.data.pointer;
			this.cameraAnchor = this.data.manipulator;

			// Function to find the distance between anything and the grabber
			this.squaredDistanceFn = squaredDistanceBetween(this.grabber);
			this.sortFn = function (a, b) {
				return this.squaredDistanceFn(a) - this.squaredDistanceFn(b);
			}.bind(this);
		},
		registerActionable: function registerActionable(el) {
			if (this.actionables.indexOf(el) === -1) {
				this.actionables.push(el);
			}
		},
		unRegisterActionable: function unRegisterActionable(el) {
			var n = this.actionables.indexOf(el);
			if (n === -1) return;
			this.actionables.splice(n, 1);
		},
		handleClick: function handleClick() {
			this.grabber.emit('grabber-click');
			if (this.currentObject !== null) {
				this.currentObject.emit('grabber-click');
			}
		},
		dragStart: function dragStart(e) {
			this.grabber.emit('grabber-drag-start');
			if (this.currentObject !== null) {
				this.grabEl = this.currentObject;
				this.currentObject.emit('grabber-drag-start');
				e.preventDefault();
			}
		},
		dragEnd: function dragEnd(e) {
			this.grabber.emit('grabber-drag-end');
			if (this.grabEl) {
				this.grabEl.emit('grabber-drag-end');
				this.grabEl = null;
				e.preventDefault();
			}
		},
		tick: function tick() {
			// this can probably be debounced to 100ms.

			// this needs to be smarter because the sortFn is expensive due to distance measuring
			this.actionables.sort(this.sortFn);
			var c = this.actionables[0];

			// detect if camera is either attracted to something
			if (this.squaredDistanceFn(c) < 0.5) {

				// no need to update
				if (this.currentObject === c) {
					return;
				}

				// let the old one know it is no longer selected
				if (this.currentObject !== null) {
					this.currentObject.emit('grabber-hover-out');
				}

				// set the current one
				this.currentObject = c;

				// let it know it is being hovered
				c.emit('grabber-hover-on');
			} else if (this.currentObject) {
				this.currentObject.emit('grabber-hover-out');
				this.currentObject = null;
			}
		}
	});

	// To mark something grabable by the pointer
	// also adds a verlet-constraint to make it jump to it.
	AFRAME.registerComponent('verlet-ui-grabable', AFRAME.utils.extend({
		schema: {
			range: {
				default: 0.8
			},
			radius: {
				default: 0
			}
		},
		setup: function setup() {

			this.remove();

			var pointer = this.parent.getAttribute('grabber-tracking').pointer;
			this.parent.components['grabber-tracking'].registerActionable(this.el);

			this.constraintIdPromise = this.parent.components['verlet-container'].connectPoints(this.el, pointer, {
				stiffness: 0.2,
				range: this.data.range,
				restingDistance: this.data.radius
			}).then(function (data) {
				return data.constraintId;
			});
		},
		remove: function remove() {
			var _this = this;

			this.parent.components['grabber-tracking'].unRegisterActionable(this.el);
			if (this.constraintIdPromise) {
				this.constraintIdPromise.then(function (id) {
					return _this.parent.components['verlet-container'].removeConstraint(id);
				});
			}
		}
	}, verletUITemplate));

/***/ },
/* 15 */
/***/ function(module, exports) {

	'use strict';
	/* global AFRAME */

	// verlet-ui-pointer from ./pointer.js
	// is a verlet point with mass 0.1

	AFRAME.registerPrimitive('verlet-ui-pointer', {
		defaultComponents: {
			'verlet-ui-pointer': {},
			'verlet-point': {
				mass: 0.1
			}
		}
	});

	// defined in ./input.js
	AFRAME.registerPrimitive('a-verlet-ui-input', {
		defaultComponents: {
			'verlet-ui-input': {}
		},
		mappings: {
			type: 'verlet-ui-input.type'
		}
	});

	// an option to be used in a-verlet-ui-input
	// behaviour depends on the type of the parent input
	AFRAME.registerPrimitive('a-verlet-ui-option', {
		defaultComponents: {
			'geometry': {
				primitive: 'sphere',
				radius: '0.2'
			},
			material: {
				shader: 'standard'
			},
			'verlet-point': {
				mass: 0
			}
		},
		mappings: {
			radius: 'geometry.radius',
			color: 'material.color'
		}
	});

	// The selector for a-verlet-ui-input
	// it's behaviour depends on the type of the input
	AFRAME.registerPrimitive('a-verlet-ui-input-selector', {
		defaultComponents: {
			'geometry': {
				primitive: 'sphere',
				radius: '0.3'
			},
			'verlet-ui-grabable': {
				radius: 0.3
			},
			material: {
				shader: 'standard',
				side: 'back',
				transparent: true,
				opacity: 0.8
			},
			'verlet-point': {
				mass: 1
			}
		},
		mappings: {
			type: 'verlet-ui-input.type',
			radius: 'geometry.radius',
			color: 'material.color',
			default: 'position-from-el'
		}
	});

/***/ },
/* 16 */
/***/ function(module, exports) {

	'use strict';
	/* global AFRAME */

	AFRAME.registerComponent('position-from-el', {
		schema: {
			type: 'selector'
		},
		update: function update() {
			if (this.data) this.el.setAttribute('position', this.data.getAttribute('position'));
		}
	});

/***/ }
/******/ ]);