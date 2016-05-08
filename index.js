var Chain = require('./lib/chain'),
	Promise = require('./lib/promise'),
	Stats = require('./lib/stats'),
	Settings = require('./lib/settings'),
	ArrayPromise = require('./lib/types/array'),
	NumberPromise = require('./lib/types/number'),
	StringPromise = require('./lib/types/string'),
	ObjectPromise = require('./lib/types/object'),
	BooleanPromise = require('./lib/types/boolean'),
	Logger = require('./lib/logger'),
	slice = require('./lib/util/slice');

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

function join(success, failure) {
	return function applyJoin() {
		var args = slice(arguments),
			error = args.shift();

		if (error) {
			return void failure(error);
		}

		return void success.apply(null, args);
	};
}

function next(value) {
	var promise = new Promise();

	setTimeout(function deferred() {
		promise.fulfill(value);
	}, 0);

	return promise;
}

function concat() {
	if (arguments.length === 0) {
		return next('');
	}

	var
		args    = slice(arguments),
		promise = new StringPromise(args.shift());

	while (args.length) {
		promise = promise.concat(args.shift());
	}

	return promise;
}

function getStats(name) {
	return Stats.get(name);
}

function printStats(name) {
	return Stats.print(name);
}

function toString(promise) {
	return new StringPromise(promise);
}

function toNumber(promise) {
	return new NumberPromise(promise);
}

function toArray(promise) {
	return new ArrayPromise(promise);
}

function toBoolean(promise) {
	return new BooleanPromise(promise);
}

function toJSON(promise) {
	var json_promise = new Promise();

	promise.then(function success(result) {
		try {
			json_promise.fulfill(JSON.stringify(result));
		} catch (error) {
			json_promise.break(error);
		}
	}, json_promise.break);

	return json_promise;
}

function toObject(promise) {
	return new ObjectPromise(promise);
}

function setLogger(logger) {
	Logger.wrap(logger);
}


module.exports = {
	chain:          createChain,
	when:           createChain,
	promise:        createPromise,
	wrap:           wrap,
	compose:        compose,
	join:           join,
	next:           next,
	concat:         concat,
	getStats:       getStats,
	printStats:     printStats,
	toString:       toString,
	toNumber:       toNumber,
	toArray:        toArray,
	toBoolean:      toBoolean,
	toJSON:         toJSON,
	toObject:       toObject,
	enableLogging:  Settings.enableLogging,
	disableLogging: Settings.disableLogging,
	setLogger:      setLogger,
	version:        require('./package.json').version
};
