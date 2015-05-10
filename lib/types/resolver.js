var replacePromises = require('../util/replace-promises'),
	bind = require('../util/bind'),
	slice = require('../util/slice'),
	isFunction = require('../util/is-function'),
	isArray = require('../util/is-array'),
	Types = require('../constants/types'),
	Logger = require('../logger'),
	constructors = { };


var blacklisted_properties = [
	'__defineGetter__',
	'__defineSetter__',
	'__lookupGetter__',
	'__lookupSetter__'
];

function isBlacklistedProperty(property_name) {
	return blacklisted_properties.indexOf(property_name) !== -1;
}

function patchProperty(prototype, key, definition) {
	var Constructor;

	function evaluate(promise, args, input) {

		function promiseResolutionHandler(error, results) {
			if (error) {
				promise.break(error);
				return;
			}

			var result;

			try {
				result = definition.method.apply(input, args);
				promise.fulfill(result);
			} catch(error) {
				promise.break(error);
			}
		}

		replacePromises(args, bind(promiseResolutionHandler, this));
	}

	prototype[key] = function abstractProperty() {
		if (!Constructor) {
			Constructor = getConstructorForType(definition.returns);
		}

		var promise = new Constructor(),
			args = slice(arguments);

		this.then(
			evaluate.bind(this, promise, args),
			promise.break
		);

		return promise;
	};
}


function patchPrototype(type, Constructor, NativeConstructor, definitions) {
	var native_prototype = NativeConstructor.prototype,
		native_property_names = Object.getOwnPropertyNames(native_prototype);

	native_property_names.forEach(function each(property_name) {
		if (isBlacklistedProperty(property_name)) {
			return;
		}

		var native_property = native_prototype[property_name];

		if (!isFunction(native_property)) {
			return;
		}

		var definition,
			instance,
			result;

		if (Object.prototype.hasOwnProperty.call(definitions, property_name)) {
			definition = definitions[property_name];
		}

		if (!definition) {
			try {
				instance = new NativeConstructor();
				result = instance[property_name]();

				if (isArray(result)) {
					definition = Types.ARRAY;
				} else if (result !== undefined) {
					definition = typeof result;
				}
			} catch (error) {
				// Do nothing, the following check will handle it.
			}
		}

		if (!definition) {
			return;
		}

		if (typeof definition === 'string') {
			definitions[property_name] = {
				method: native_property,
				returns: definition
			};
		} else if (!definition.method) {
			definition.method = native_property;
		}
	});

	// We have to iterate a second time after patching
	// via the native prototype, in order to wrap any
	// methods that were added arbitrarily to the type definition
	// but that may not have an analogue on the native prototype:
	var key;

	for (key in definitions) {
		patchProperty(Constructor.prototype, key, definitions[key]);
	}
}

function getConstructorForType(type) {
	var constructor = constructors[type];

	if (!constructor) {
		throw new Error(
			'No typed promise constructor found for type: ' + type
		);
	}

	return constructor;
}

function setConstructorForType(type, constructor) {
	constructors[type] = constructor;
}

function define(type, Constructor, NativeConstructor, definitions) {
	if (arguments.length !== 4) {
		throw new Error('Wrong number of arguments passed to "define()"');
	}

	if (!isFunction(Constructor)) {
		throw new Error('Must specify a valid constructor');
	}

	if (!isFunction(NativeConstructor)) {
		throw new Error('Must specify a valid native constructor');
	}

	setConstructorForType(type, Constructor);
	patchPrototype(type, Constructor, NativeConstructor, definitions);
}

function createCoercer(type) {
	var Constructor;

	return function coercer() {
		if (!Constructor) {
			Constructor = getConstructorForType(type);
		}

		var promise = new Constructor();

		this.then(promise.fulfill, promise.break);

		return promise;
	};
}

module.exports = {
	getConstructorForType: getConstructorForType,
	define: define,
	createCoercer: createCoercer
};
