
var logging_enabled = false;

function enableLogging() {
	logging_enabled = true;
}

function disableLogging() {
	logging_enabled = false;
}

function isLoggingEnabled() {
	return logging_enabled;
}

module.exports = {
	enableLogging: enableLogging,
	isLoggingEnabled: isLoggingEnabled
};

