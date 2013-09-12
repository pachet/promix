var
	Chain = require('./lib/chain'),
	Promise = require('./lib/promise'),
	handler = require('./lib/handler'),
	Exposure = require('./lib/exposure'),
	types = require('./lib/types'),
	utils = require('./lib/utils');


module.exports = {
	promise : Promise,
	toString : types.toString,
	toNumber : types.toNumber,
	toArray : types.toArray,
	toObject : types.toObject,
	handle : handler.set,
	when : when,
	chain : when,
	join : join,
	fork : fork,
	first : first,
	invoke : invoke,
	concat : concat,
	wrap : wrap,
	forward : wrap,
	errorless : errorless,
	succeed : succeed,
	next : succeed,
	fail : fail,
	compose : compose,
	version : require('./package.json').version
};

// expose the module at `window.promix` if we're in a browser:
if ( typeof window !== 'undefined' && typeof window.promix === 'undefined' ) {
	window.promix = module.exports;
}


// Takes an optional promise or fn to invoke, and returns a new chain.
//
// Usage :
//	promix.when()
//	promix.when(<thenable> promise)
//	promix.when(<function> callback [, arg1, arg2, ...])
//
// Returns :
//	<Chain>
//
function when ( ) {
	var
		chain = new Exposure();

	// only call chain.and() if they actually supplied arguments:
	if ( arguments.length ) {
		chain.and.apply(chain, utils.copy(arguments));
	}
	return chain;
}

// Takes discrete success and failure callbacks,
// and turns them into a consolidated error-first callback.
//
// Usage :
//	promix.join(<function> successFn, <function> failureFn)
//
// Returns :
//	<function>
//
function join ( success, failure ) {
	return function applyJoin ( ) {
		var
			args = utils.copy(arguments),
			error = args.shift();

		if ( error ) {
			return void failure(error);
		}
		return void success.apply(null, args);
	};
}

// Applies a standard error-first callback to a promise.
//
// Usage :
//	promix.fork(<object> promise, <function> callback)
//
function fork ( promise, callback ) {
	promise.then(function abstracted_callback ( result ) {
		return callback(null, result);
	}, callback);
}

// Accepts an indeterminate number of promises,
// and returns a promise that will be fulfilled with the first truthy promise result.
//
// Usage :
//	promix.first(<object> promise, <object> promise [, <object> promise, ....])
//
function first ( ) {
	var
		returned = false,
		promise = new Promise(),
		length = arguments.length,
		index = 0,
		current;

	function dispatcher ( result ) {
		if ( ! returned && result ) {
			returned = true;
			promise.fulfill(result);
		}
	}

	while ( index < length ) {
		current = arguments [index];
		if ( current && typeof current.then === 'function' ) {
			current.then(dispatcher);
		}
		index ++;
	}
	return promise;
}

// Turns a success-only callback into a standard error-first callback.
//
// Usage :
//	promix.errorless(<function> callback)
//
// Returns :
//	<function>
//
function errorless ( callback ) {
	return function errorless ( ) {
		return callback.apply(null, [null].concat(utils.copy(arguments)));
	};
}

// Transforms a promise into a standard callback.
//
// Usage :
//	promix.wrap(<object> promise, <?> value)
//
// Returns :
//	<function>
//
function wrap ( promise, value ) {
	return function ( error, result ) {
		if ( error ) {
			return void promise.reject(error);
		}
		return void promise.resolve(value || result);
	};
}

// Invokes the supplied callback-accepting function,
// passes in any arguments + a synthetic callback,
// and returns a promise that will be fulfilled/rejected
// when that callback is called.
//
// Usage :
//	promix.invoke(<function> callbackAcceptingFn [, arg1, arg2, ...])
//
// Returns :
//	<Promise>
//
function invoke ( ) {
	var
		promise,
		args = utils.copy(arguments),
		primary;

	if ( typeof args [0] !== 'function' ) {
		return succeed(args);
	}
	promise = new Promise();
	primary = args.shift();
	args.push(function abstracted_callback ( error, result ) {
		if ( error ) {
			return void promise.reject(error);
		}
		return void promise.fulfill(result);
	});
	primary.apply(null, args);
	return promise;
}

// Returns a promise that will be fulfilled at the next tick/breath.
//
// Usage :
//	promix.succeed(<?> value)
//
// Returns :
//	<Promise>
function succeed ( value ) {
	var
		promise = new Promise();

	utils.next(function wrapper ( ) {
		return void promise.resolve(value);
	});
	return promise;
}

// Returns a promise that will be rejected at the next tick/breath.
//
// Usage :
//	promix.fail(<?> reason)
//
// Returns :
//	<Promise>
//
function fail ( reason ) {
	var
		promise = new Promise();

	if ( ! ( reason instanceof Error ) ) {
		reason = new Error(reason);
	}
	utils.next(function wrapper ( ) {
		return void promise.reject(reason);
	});
	return promise;
}

// Returns a new Chain with a discrete step for each property in the
// supplied object. This lets us do cool things like:
//
// promix.compose({
//	foo : fooPromise,
//	bar : 2,
//	baz : bazPromise
// }).then(fn);
//
function compose ( object ) {
	var
		chain = new Exposure();

	Object.keys(object).map(function map ( key ) {
		chain.and(object [key]).as(key);
	});
	return chain;
}

// Convenience wrapper to concatenate promises into a single StringPromise.
//
// Usage :
//	promix.concat(<string || Promise> arg1 [, arg2, arg3, arg4])
//
// Returns :
//	<StringPromise>
function concat ( ) {
	var
		args = utils.copy(arguments),
		primary = args.shift(),
		intermediary;

	intermediary = types.toString(primary);
	return intermediary.concat.apply(intermediary, args);
}

