var Types = require('../constants/types'),
	TypeResolver = require('./resolver'),
	ObjectPromise = require('./object'),
	clone = require('../util/clone'),
	slice = require('../util/slice');

function FunctionPromise(value) {
	ObjectPromise.apply(this, arguments);
}

FunctionPromise.prototype = clone(ObjectPromise.prototype);

FunctionPromise.prototype.coerce = function coerce(value) {
	return value;
};

TypeResolver.define(Types.FUNCTION, FunctionPromise, Object, {
	call: {
		returns: Types.OBJECT,
		method: function call() {
			var
				args    = slice(arguments),
				context = args.shift();

			return this.apply(context, args);
		}
	},
	apply: {
		returns: Types.OBJECT,
		method:  function apply() {
			var
				context = arguments[0],
				args    = arguments[1];

			return this.apply(context, args);
		}
	},
	execute: {
		returns: Types.OBJECT,
		method:  function execute() {
			return this.apply(this, arguments);
		}
	},
	bind: {
		returns: Types.FUNCTION,
		method:  function bind(context) {
			return this.bind(context);
		}
	}
});

module.exports = FunctionPromise;
