'use strict';
/* eslint-env es6, worker */
/* eslint no-console: 0 */

const maxPoints = 50;
let data;
const myWorker = new Worker('./build/worker.js');
const messageQueue = [];

function workerMessage(message) {

	const id = Date.now() + Math.floor(Math.random() * 1000000);

	// This wraps the message posting/response in a promise, which will resolve if the response doesn't
	// contain an error, and reject with the error if it does. If you'd prefer, it's possible to call
	// controller.postMessage() and set up the onmessage handler independently of a promise, but this is
	// a convenient wrapper.
	return new Promise(function workerMessagePromise(resolve, reject) {
		const data = {
			id,
			message,
			resolve,
			reject
		};
		messageQueue.push(data);
	});
}

// Process messages once per frame
requestAnimationFrame(function process() {
	if (messageQueue.length) {

		const extractedMessages = messageQueue.splice(0);

		const messageToSend = extractedMessages.map(i => (
			{ message: i.message, id: i.id }
		));

		const messageChannel = new MessageChannel();
		messageChannel.port1.onmessage = function resolveMessagePromise(event) {
			messageChannel.port1.onmessage = undefined;

			// Iterate over the responses and resolve/reject accordingly
			const response = event.data;
			response.forEach((d, i) => {
				if (extractedMessages[i].id !== d.id) {
					throw Error('ID Mismatch!!!');
				}
				if (!d.error) {
					extractedMessages[i].resolve(d);
				} else {
					extractedMessages[i].reject(d.error);
				}
			});
		};
		const transfer = [messageChannel.port2];
		if (messageToSend.byteData) transfer.push(messageToSend.byteData);
		myWorker.postMessage(messageToSend, transfer);
	}
	requestAnimationFrame(process);
});

class Verlet {

	/**
	 * options object
	 * graivity: -9.8
	 * size: {x: 10, y: 10, x: 10}
	 */
	init(options) {
		return workerMessage({action: 'init', options});
	}

	/**
	 * Run the physics System and return the updated points
	 */
	getPoints() {
		if (!data) data = new Float32Array(maxPoints * 5);
		return workerMessage({ action: 'getPoints', byteData: data });
	}

	/**
	 * Add a point to the Verlet System
	 *
     * position: {x, y, z},
     * velocity: {x, y, z},
     * mass [Number],
     * radius [Number],
     * attraction [Number] - Pre makes connects point to all others
	 * */
	addPoint(pointOptions) {
		return workerMessage({action: 'addPoint', pointOptions});
	}

	/**
	 * Update a point in the Verlet System
	 *
     * position: {x, y, z},
     * velocity: {x, y, z},
     * mass [Number],
     * radius [Number],
	 * */
	updatePoint(pointOptions) {
		return workerMessage({action: 'updatePoint', pointOptions});
	}

	connectPoints(p1, p2, constraintOptions) {
		return workerMessage({action: 'connectPoints', options: {p1, p2, constraintOptions}});
	}

	updateConstraint(options) {
		return workerMessage({action: 'updateConstraint', options });
	}

	reset() {
		return workerMessage({action: 'reset'});
	}
}

module.exports = Verlet;