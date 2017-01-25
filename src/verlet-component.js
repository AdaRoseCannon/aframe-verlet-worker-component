'use strict';
/* eslint-env es6, worker */
/* eslint no-console: 0 */

const Verlet = require('./lib/verlet-messenger');

async function start() {
	try {
		const v = new Verlet();
		await v.init();
		await v.addPoint({
			position: {
				x: 0,
				y: 0,
				z: 0
			}
		});
		console.log(await v.getPoints());
	} catch (e) {
		console.log(e);
	}
};

start();