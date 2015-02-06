var Chain = require('./lib/chain'),
	Promise = require('./lib/promise'),
	Stats = require('./lib/stats');

function createChain() {
	var chain = new Chain();

	if (arguments.length) {
		chain.and.apply(chain, arguments);
	}

	return chain;
}

function createPromise(value) {
	return new Promise(value);
}

function wrap(promise, value) {
	return function wrappedFn(error, result) {
		if (error) {
			return void promise.reject(error);
		} else {
			return void promise.resolve(value || result);
		}
	};
}

function compose(object) {
	var chain = new Chain(),
		promise = new Promise(),
		keys = Object.keys(object);

	keys.forEach(function each(key) {
		chain.and(object[key]).as(key);
	});

	chain.then(function handler(results) {
		var result = { };

		keys.forEach(function each(key) {
			result[key] = results[key];
		});

		promise.fulfill(result);
	});

	chain.otherwise(promise.reject);

	return promise;
}

function getStats(name) {
	return Stats.get(name);
}

function printStats(name) {
	return Stats.print(name);
}

module.exports = {
	chain: createChain,
	when: createChain,
	promise: createPromise,
	wrap: wrap,
	compose: compose,
	version: require('./package.json').version,
	getStats: getStats,
	printStats: printStats
};
