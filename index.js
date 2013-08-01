var
	Chain = require('./lib/Chain'),
	Promise = require('./lib/Promise'),
	Handler = require('./lib/Handler'),
	Types = require('./lib/Types');

function when ( ) {
	var
		result = new Chain(),
		args = Array.prototype.slice.call(arguments);

	if ( args.length ) {
		result.and.apply(result, args);
	}
	return result;
}

function join ( failure, success ) {
	return function apply_fork ( ) {
		var
			args = Array.prototype.slice.call(arguments),
			error = args.shift();

		if ( error ) {
			return void failure(error);
		}
		return void success.apply(null, args);
	};
}

function fork ( promise, callback ) {
	promise.then(function abstracted_callback ( result ) {
		return callback(null, result);
	}, callback);
}

function errorless ( callback ) {
	return function errorless ( ) {
		return callback.apply(null, [null].concat(arguments));
	};
}

function forward ( promise, value ) {
	return function ( error, result ) {
		if ( error ) {
			return void promise.reject(error);
		}
		return void promise.resolve(value);
	};
}

function succeed ( value ) {
	var
		promise = Promise();

	setTimeout(function ( ) {
		return void promise.resolve(value);
	}, 0);
	return promise;
}

function fail ( reason ) {
	var
		promise = Promise();

	if ( ! ( reason instanceof Error ) ) {
		reason = new Error(reason);
	}
	setTimeout(function ( ) {
		return void promise.reject(reason);
	}, 0);
	return promise;
}

function compose ( object ) {
	var
		chain = new Chain();

	Object.keys(object).map(function map ( key ) {
		chain.and(object [key]).as(key);
	});
	return chain;
}

module.exports = Types;
module.exports.handle = Handler.set;
module.exports.promise = Promise;
module.exports.when = module.exports.chain = when;
module.exports.join = module.exports.fork = join;
module.exports.forward = forward;
module.exports.errorless = errorless;
module.exports.succeed = module.exports.next = succeed;
module.exports.fail = fail;
module.exports.compose = compose;

if ( typeof window !== 'undefined' && typeof window.promix === 'undefined' ) {
	window.promix = module.exports;
}
