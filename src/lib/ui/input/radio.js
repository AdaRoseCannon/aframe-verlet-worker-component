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
	}

	// Set up being able to drag and pull the dragable object
	this.setConstraint = function setConstraint() {
		this.setAttribute('verlet-constraint', 'stiffness: 0.4; to: ' + manipulatorSelector + ';');
	}
	this.removeConstraint = function removeConstraint() {
		this.setAttribute('verlet-constraint', 'stiffness: 0.4; to:;');
	}
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
		self.parent.components['verlet-container'].connectPoints(
			option,
			selector,
			{
				stiffness: 0.5,
				range: 0.75,
				restingDistance: 0
			}
		).then(function (data) {
			option.__constraintId = data.constraintId;
			self.constraints.push(data.constraintId);
		});
	});
};

module.exports.remove = function () {

	// clean up constraints and eventListeners

	this.constraints.forEach(id => this.parent.components['verlet-container'].removeConstraint(id));
	var selector = this.el.querySelector('a-verlet-ui-input-selector');
	selector.removeEventListener('grabber-drag-start', this.setConstraint);
	selector.removeEventListener('grabber-drag-end', this.removeConstraint);
};