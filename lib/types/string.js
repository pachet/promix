var Types = require('../constants/types'),
	TypeResolver = require('./resolver'),
	ObjectPromise = require('./object'),
	clone = require('../util/clone');


function StringPromise() {
	ObjectPromise.apply(this, arguments);
}

StringPromise.prototype = clone(ObjectPromise.prototype);

StringPromise.prototype.coerce = function coerce(value) {
	return '' + value;
};

TypeResolver.define(Types.STRING, StringPromise, String, {
	length: {
		returns: Types.NUMBER,
		method: function length() {
			return this.length;
		}
	},
	parse: {
		returns: Types.OBJECT,
		method: function parse() {
			return JSON.parse(this);
		}
	},
	parseFloat: {
		returns: Types.NUMBER,
		method: function abstractedParseFloat() {
			return parseFloat(this);
		}
	},
	parseInt: {
		returns: Types.NUMBER,
		method: function abstractedParseInt(radix) {
			return parseInt(this, radix || 10);
		}
	},
	toNumber: {
		returns: Types.NUMBER,
		method: function toNumber() {
			return +this;
		}
	},
});

module.exports = StringPromise;
