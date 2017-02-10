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

module.exports.remove = function () {

};
