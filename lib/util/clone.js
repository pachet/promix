
function clone(object) {
	var result = { },
		key;

	for (key in object) {
		result[key] = object[key];
	}

	return result;
}

module.exports = clone;
