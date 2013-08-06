var
	promix = require('./index');

function pending ( ) {
	var
		promise = promix.promise();

	return {
		promise : promise,
		fulfill : promise.fulfill,
		reject : promise.reject
	};
}

module.exports = {
	pending : pending
};
