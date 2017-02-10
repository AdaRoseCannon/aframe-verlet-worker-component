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
	init() {
		this.els = [];
	},
	update() {

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
	remove() {
		while (this.els.length) this.el.removeChild(this.els.pop());
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
	init() {
		this.els = [];
	},
	update() {

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
	remove() {
		while (this.els.length) this.el.removeChild(this.els.pop());
	}
});