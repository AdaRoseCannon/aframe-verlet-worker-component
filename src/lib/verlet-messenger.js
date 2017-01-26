'use strict';
/* eslint no-console: 0 */

const awaitingResponseQueue = new Map();
const BYTE_DATA_STAND_IN = 'BYTE_DATA_STAND_IN';

function resolveMessagePromise(event) {

	// Iterate over the responses and resolve/reject accordingly
	const response = event.data;
	response.forEach((d, i) => {
		const waitingMessage = awaitingResponseQueue.get(d.id);
		awaitingResponseQueue.delete(d.id);
		delete d.id;
		if (!d.error) {
			if (d.byteData) {
				// console.log('Recieved \'data\' back from worker');
				this.dataAvailable = true;
				this.data = new Float32Array(d.byteData);
				d.byteData = this.data;
			}
			waitingMessage.resolve(d);
		} else {
			waitingMessage.reject(d.error);
		}
	});
};

class Verlet {

	constructor(maxPoints = 10) {
		this.myWorker = new Worker('./build/worker.js');
		this.myWorker.addEventListener('message', resolveMessagePromise.bind(this));
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
		this.data = new Float32Array(maxPoints * 4);
		this.dataAvailable = true;
	}

	process() {

		// skip frames if data is being slow
		if (!this.data) return;

		if (this.messageQueue.length) {

			const transfer = [];
			const messageToSend = {};

			const queue = this.messageQueue.splice(0);
			for (const i of queue) {
				if (i.message['BYTE_DATA_STAND_IN']) {
					delete i.message['BYTE_DATA_STAND_IN'];
					i.message.byteData = this.data.buffer;

					if (transfer.indexOf(this.data.buffer) === -1) {
						transfer.push(this.data.buffer);
					}
				}

				messageToSend[i.id] = i.message;
				awaitingResponseQueue.set(i.id, i);
			};

			if (transfer.indexOf(this.data.buffer) !== -1) {
				// console.log('Transfering \'data\' to worker');
				this.dataAvailable = false;
				this.data = undefined;
			}

			this.myWorker.postMessage(messageToSend, transfer);
		}
		requestAnimationFrame(this.process);
	}

	workerMessage(message) {

		const id = String(Date.now() + Math.floor(Math.random() * 1000000));
		const verletSystem = this;

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

			if (message.action === 'getPoints') {
				for (const o of this.messageQueue) {
					if (o.message.action === 'getPoints') o.message.action = 'noopPoints';
				}
			}

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
		// console.log(this.dataAvailable ? 'Data Available' : 'Data Unavailable');
		return this.workerMessage({ action: 'getPoints', BYTE_DATA_STAND_IN });
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