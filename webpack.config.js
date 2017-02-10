/* eslint-env commonjs */
'use strict';

module.exports = {
	entry: {
		'verlet-worker': './src/verlet-worker.js',
		'verlet-component': './src/verlet-component.js',
		'verlet-ui': './src/verlet-ui.js'
	},
	output: {
		path: './build/',
		filename: '[name].js',
	},
	module: {
		loaders: [{
			test: /\.js$/,
			exclude: /node_modules/,
			loader: 'babel-loader'
		}]
	}
};
