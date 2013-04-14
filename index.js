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

module.exports = Types;
module.exports.handle = Handler.set;
module.exports.promise = Promise;
module.exports.when = when;
module.exports.chain = when;
