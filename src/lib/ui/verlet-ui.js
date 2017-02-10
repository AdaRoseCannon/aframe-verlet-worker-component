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

var noop = function () { };
var verletUITemplate = {
	update: function () {
		if (this.tick === noop) this.tick = this.__tick;
	},
	tick: function () {
		let el = this.el;
		while (el && el.matches && !el.matches('[grabber-tracking], verlet-ui')) el = el.parentNode;
		this.parent = el;
		this.__tick = this.tick;
		this.tick = noop;
		this.setup();
	}
};

module.exports.template = verletUITemplate;