var promix = require('./index');

function pending() {
	var promise = promix.promise();

	return {
		promise: promise,
		resolve: promise.fulfill,
		reject: promise.reject
	};
}

module.exports = {
	pending: pending,
	deferred: pending
};
