var isFunction = require('../util/is-function'),
	slice = require('../util/slice');

var TestWrapper = {
	test: null,
	message: null,
	run: function run(fn) {
		fn(this.test);
	}
};

var methods_bound = false;

function bindMethod(key, method) {
	TestWrapper[key] = function wrappedMethod() {
		if (!this.message) {
			return method.apply(this.test, arguments);
		}

		return method.apply(this.test, slice(arguments).concat(this.message));
	};
}

function bindMethods(test) {
	var prototype = Object.getPrototypeOf(test),
		key,
		property;

	for (key in prototype) {
		property = prototype[key];

		if (!isFunction(property)) {
			continue;
		}

		bindMethod(key, property);
	}

 	methods_bound = true;
}

function extractMessage(fn) {
	var lines = fn.toString().split('\n'),
		message = '',
		index = 0,
		line;

	while (index < lines.length) {
		line = lines[index].trim();

		if (line.indexOf('//') === 0) {
			message += line + ' ';
		} else {
			break;
		}

		index++;
	}

	return message || undefined;
}

function run(test, fn) {
	if (!methods_bound) {
		bindMethods(test);
	}

	TestWrapper.test = test;
	TestWrapper.message = extractMessage(fn);
	TestWrapper.run(fn);
}

module.exports = run;
