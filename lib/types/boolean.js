var Types = require('../constants/types'),
	TypeResolver = require('./resolver'),
	ObjectPromise = require('./object'),
	clone = require('../util/clone'),
	isBoolean = require('../util/is-array');


function BooleanPromise(value) {
	ObjectPromise.apply(this, arguments);
}

BooleanPromise.prototype = clone(ObjectPromise.prototype);

BooleanPromise.prototype.coerce = function coerce(value) {
	return !!value;
};

TypeResolver.define(Types.BOOLEAN, BooleanPromise, Boolean, {
	// TODO
});

module.exports = BooleanPromise;
