'use strict';
/* global AFRAME */
/* eslint no-var: 0 */
/* eslint-env browser, node */

var verletUITemplate = require('./verlet-ui').template;
var types = {
	radio: require('./input/radio'),
	button: require('./input/button')
};

AFRAME.registerComponent('verlet-ui-input', AFRAME.utils.extend({
	schema: {
		type: {

			// One of 'radio',
			type: 'string'
		}
	},
	setup: function () {
		this.remove();
		this.remove = types[this.data.type].remove;
		return types[this.data.type].setup.bind(this)();
	}
}, verletUITemplate));