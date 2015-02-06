
function isArray(value) {
	return value && Object.prototype.toString.call(value) === '[object Array]';
}

module.exports = isArray;
