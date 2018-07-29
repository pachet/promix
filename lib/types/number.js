var Types = require('../constants/types'),
	TypeResolver = require('./resolver'),
	ObjectPromise = require('./object'),
	clone = require('../util/clone');


function NumberPromise(value) {
	ObjectPromise.apply(this, arguments);
}

NumberPromise.prototype = clone(ObjectPromise.prototype);

NumberPromise.prototype.coerce = function coerce(value) {
	return +value;
};

TypeResolver.define(Types.NUMBER, NumberPromise, Number, {
	abs: {
		returns: Types.NUMBER,
		method: function abs() {
			return Math.abs(this);
		}
	},
	add: {
		returns: Types.NUMBER,
		method:  function add() {
			var result = this,
				index = 0;

			while (index < arguments.length) {
				result += arguments[index++];
			}

			return result;
		}
	},
	average: {
		returns: Types.NUMBER,
		method:  function average() {
			var total = this,
				index = 0;

			while (index < arguments.length) {
				total += arguments[index];

				index++;
			}

			return total / (arguments.length + 1);
		}
	},
	ceil: {
		returns: Types.NUMBER,
		method:  function ceil() {
			return Math.ceil(this);
		}
	},
	divideBy: {
		returns: Types.NUMBER,
		method:  function divideBy() {
			var index = 0,
				result = this;

			while (index < arguments.length) {
				result /= arguments[index];
				index++;
			}

			return result;
		}
	},
	floor: {
		returns: Types.NUMBER,
		method:  function method() {
			return Math.floor(this);
		}
	},
	max: {
		returns: Types.NUMBER,
		method:  function min() {
			var maximum = this,
				index = 0,
				value;

			while (index < arguments.length) {
				value = arguments[index];

				if (value > maximum) {
					maximum = value;
				}

				index++;
			}

			return maximum;
		}
	},
	min: {
		returns: Types.NUMBER,
		method:  function min() {
			var minimum = this,
				index,
				value;

			while (index < arguments.length) {
				value = arguments[index];

				if (value < minimum) {
					minimum = value;
				}

				index++;
			}

			return minimum;
		}
	},
	mod: {
		returns: Types.NUMBER,
		method:  function mod(value) {
			return this % value;
		}
	},
	multiplyBy: {
		returns: Types.NUMBER,
		method:  function multiplyBy() {
			var index = 0,
				result = this;

			while (index < arguments.length) {
				result *= arguments[index];
				index++;
			}

			return result;
		}
	},
	pow: {
		returns: Types.NUMBER,
		method:  function pow(power) {
			return Math.pow(this, power);
		}
	},
	round: {
		returns: Types.NUMBER,
		method:  function round() {
			return Math.round(this);
		}
	},
	subtract: {
		returns: Types.NUMBER,
		method:  function subtract() {
			var result = this,
				index = 0;

			while (index < arguments.length) {
				result -= arguments[index++];
			}

			return result;
		}
	},
	greaterThan: {
		returns: Types.BOOLEAN,
		method:  function greaterThan(value) {
			return this > value;
		}
	},
	greaterThanOrEqualTo: {
		returns: Types.BOOLEAN,
		method:  function greaterThanOrEqualTo(value) {
			return this >= value;
		}
	},
	lessThan: {
		returns: Types.BOOLEAN,
		method:  function lessThan(value) {
			return this < value;
		}
	},
	lessThanOrEqualTo: {
		returns: Types.BOOLEAN,
		method:  function lessThanOrEqualTo(value) {
			return this <= value;
		}
	}
});

module.exports = NumberPromise;
