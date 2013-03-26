var
	Chain = require('./lib/Chain'),
	Promise = require('./lib/Promise'),
	Handler = require('./lib/Handler');

function when ( ) {
	var
		result = new Chain(),
		args = Array.prototype.slice.call(arguments);

	if ( args.length ) {
		result.and.apply(result, args);
	}
	return result;
}

module.exports = {
	when : when,
	chain : when,
	promise : Promise,
	handle : Handler.set
};
