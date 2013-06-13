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

function fork ( failure, success ) {
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

function next ( value ) {
	var
		promise = Promise();

	setTimeout(function ( ) {
		return void promise.fulfill(value);
	}, 0);
	return promise;
}

module.exports = Types;
module.exports.handle = Handler.set;
module.exports.promise = Promise;
module.exports.when = when;
module.exports.chain = when;
module.exports.fork = fork;

if ( typeof window !== 'undefined' && typeof window.promix === 'undefined' ) {
	window.promix = module.exports;
}
