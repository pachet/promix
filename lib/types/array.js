var Types = require('../constants/types'),
	TypeResolver = require('./resolver'),
	ObjectPromise = require('./object'),
	clone = require('../util/clone'),
	isArray = require('../util/is-array');


function ArrayPromise(value) {
	ObjectPromise.apply(this, arguments);
}

ArrayPromise.prototype = clone(ObjectPromise.prototype);

ArrayPromise.prototype.coerce = function coerce(value) {
	if (isArray(value)) {
		return value;
	} else {
		return [value];
	}
};

TypeResolver.define(Types.ARRAY, ArrayPromise, Array, {
	every: Types.BOOLEAN,
	filter: Types.ARRAY,
	forEach: {
		returns: Types.ARRAY,
		// We have to wrap the native prototype method
		// in order to return the original object:
		method: function forEach() {
			Array.prototype.forEach.apply(this, arguments);

			return this;
		}
	},
	map: Types.ARRAY,
	pop: Types.OBJECT,
	reduce: Types.ARRAY,
	reduceRight: Types.ARRAY,
	reduceLeft: Types.ARRAY,
	shift: Types.OBJECT,
	some: Types.BOOLEAN,
	// TODO
});

module.exports = ArrayPromise;
