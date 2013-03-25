var
	Chain = require('./lib/Chain'),
	Promise = require('./lib/Promise'),
	Handler = require('./lib/Handler');

module.exports = {
	when : function when ( ) {
		var
			result = new Chain(),
			args = Array.prototype.slice.call(arguments);

		if ( args.length ) {
			result.and.apply(result, args);
		}
		return result;
	},
	promise : Promise,
	handle : Handler.set
};
