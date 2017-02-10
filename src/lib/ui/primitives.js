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