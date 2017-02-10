'use strict';
/* global AFRAME */

AFRAME.registerComponent('position-from-el', {
	schema: {
		type: 'selector'
	},
	update: function () {
		if (this.data) this.el.setAttribute('position', this.data.getAttribute('position'));
	}
})