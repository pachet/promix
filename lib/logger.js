var isFunction = require('./util/is-function'),
	logger = console,
	required_methods = ['log', 'warn', 'error'];

function wrap(client_logger) {
	required_methods.forEach(function each(method) {
		if (!isFunction(client_logger[method])) {
			throw new Error(
				'Supplied logger missing a required method: ' + method
			);
		}
	});

	logger = client_logger;
}

function reset() {
	logger = console;
}

function logInfo() {
	logger.log.apply(logger, arguments);
}

function logWarning() {
	logger.warn.apply(logger, arguments);
}

function logError() {
	logger.error.apply(logger, arguments);
}

module.exports = {
	wrap:       wrap,
	reset:      reset,
	error:      logError,
	logError:   logError,
	warn:       logWarning,
	warning:    logWarning,
	logWarning: logWarning,
	log:        logInfo,
	info:       logInfo,
	logInfo:    logInfo
};
