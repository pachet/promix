function isPromise(value) {
	return value && typeof value.then === 'function';
}

module.exports = isPromise;
