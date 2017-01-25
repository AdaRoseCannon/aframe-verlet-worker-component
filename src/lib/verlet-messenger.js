'use strict';
/* eslint-env es6, worker */
/* eslint no-console: 0 */

class Verlet {

	constructor(maxPoints = 50) {
		this.myWorker = new Worker('./build/worker.js');
		this.messageQueue = [];
		this.setMaxPoints(maxPoints);

		// Process messages once per frame
		this.process = this.process.bind(this);
		requestAnimationFrame(this.process);
	}


	/**
	 * Updates the size of the memory buffer
	 * used to store points use this to allocate what is required.
	 * */
	setMaxPoints(maxPoints) {
		this.maxPoints = maxPoints;
		this.data = new Float32Array(maxPoints * 5);
	}

	process() {
		if (this.messageQueue.length) {

			const extractedMessages = this.messageQueue.splice(0);

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
			this.myWorker.postMessage(messageToSend, transfer);
		}
		requestAnimationFrame(this.process);
	}

	workerMessage(message) {

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
			this.messageQueue.push(data);
		}.bind(this));
	}

	/**
	 * options object
	 * graivity: -9.8
	 * size: {x: 10, y: 10, x: 10}
	 */
	init(options) {
		return this.workerMessage({action: 'init', options});
	}

	/**
	 * Run the physics System and return the updated points
	 */
	getPoints() {
		return this.workerMessage({ action: 'getPoints', byteData: this.data });
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
		return this.workerMessage({action: 'addPoint', pointOptions});
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
		return this.workerMessage({action: 'updatePoint', pointOptions});
	}

	connectPoints(p1, p2, constraintOptions) {
		return this.workerMessage({action: 'connectPoints', options: {p1, p2, constraintOptions}});
	}

	updateConstraint(options) {
		return this.workerMessage({action: 'updateConstraint', options });
	}

	reset() {
		return this.workerMessage({action: 'reset'});
	}
}

module.exports = Verlet;