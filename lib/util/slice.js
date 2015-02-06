
function slice(array, start, end) {
	return Array.prototype.slice.call(array, start, end);
}

module.exports = slice;
