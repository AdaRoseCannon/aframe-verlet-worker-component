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
/******/ ({

/***/ 0:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	/* eslint-env commonjs, browser, es6 */

	__webpack_require__(12);
	__webpack_require__(10);
	__webpack_require__(33);
	__webpack_require__(34);
	__webpack_require__(11);

/***/ },

/***/ 10:
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
			var pointerSelector = this.parent.getDOMAttribute('grabber-tracking').pointer;
			this.el.setAttribute('verlet-constraint', 'stiffness:0.2; range: ' + this.data.range + '; distance: ' + this.data.radius + '; to: ' + pointerSelector + ';');
			this.parent.components['grabber-tracking'].registerActionable(this.el);
		},
		remove: function remove() {
			this.parent.components['grabber-tracking'].unRegisterActionable(this.el);
		}
	}, verletUITemplate));

/***/ },

/***/ 11:
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

/***/ 12:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	/* global AFRAME */
	/* eslint no-var: 0 */
	/* eslint-env browser, node */

	var verletUITemplate = __webpack_require__(11).template;
	var types = {
		radio: __webpack_require__(35),
		button: __webpack_require__(36)
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

/***/ },

/***/ 33:
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

/***/ 34:
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

/***/ },

/***/ 35:
/***/ function(module, exports) {

	'use strict';
	/* eslint no-var: 0 */
	/* eslint-env browser, node */

	module.exports.setup = function () {
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
		function setConstraint() {
			this.setAttribute('verlet-constraint', 'stiffness: 0.4; to: ' + manipulatorSelector + ';');
		}
		function removeConstraint() {
			this.setAttribute('verlet-constraint', 'stiffness: 0.4; to:;');
		}
		selector.addEventListener('grabber-drag-start', setConstraint);
		selector.addEventListener('grabber-drag-end', removeConstraint);

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
			});
		});
	};

	module.exports.remove = function () {};

/***/ },

/***/ 36:
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

/***/ }

/******/ });