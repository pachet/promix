var extend = require('./util/extend'),
	clone = require('./util/clone'),
	bind = require('./util/bind'),
	isPromise = require('./util/is-promise'),
	isFunction = require('./util/is-function'),
	TypeResolver = require('./types/resolver'),
	Types = require('./constants/types');

// We declare this function standalone, rather than on the Promise prototype,
// in order to avoid clashes with that property name in cases when a base object
// is passed in to the Promise constructor that implements ".dispatch()".
function dispatch(child, value, success) {
	var parent_promise = this;

	setTimeout(function deferred() {
		var method = success ? child.success : child.failure;

		if (!method) {
			return void child.promise[success ? 'resolve' : 'reject'](value);
		}

		var result;

		try {
			result = method(value);

			if (result === child.promise) {
				child.promise.reject(
					new TypeError('Cannot return a promise from itself!')
				);
			} else if (!isPromise(result)) {
				child.promise.resolve(result);
			} else {
				result.then(child.promise.resolve, child.promise.reject);
			}
		} catch (error) {
			if (child.promise.hasErrorHandlers()) {
				child.promise.reject(error);
			} else {
				throw error;
			}
		}
	}, 0);
}


function Promise(base, clone) {
	var result;

	if (!this.stamp) {
		this.stamp = Math.random().toString(16).slice(3);
	}

	if (base) {
		if (clone) {
			result = clone(base);
		} else {
			result = base;
		}

		extend(result, Promise.prototype);
	} else {
		result = this;
	}

	result.children = [ ];

	// As you can see, I prefer different verbs than those that have, by now,
	// become regrettably canonized in the Promise spec. If you make a promise
	// to someone in real life, you don't "resolve" that promise; you "fulfill"
	// it. And conversely, you would never say something like this:
	//
	// "You swore that you wouldn't use Angular! You rejected your promise!"
	//
	// .... naming things is hard, I get it. But damn if I'm not going to use
	// verbs that have at least a shred of semantic meaning. Nevertheless,
	// I've aliased these verbs to those defined in the spec in order to
	// appease the unwashed masses, and for cross-compatibility purposes.

	result.fulfill = result.resolve = bind(result.fulfill, result);
	result.break = result.reject = bind(result.break, result);

	return result;
}

Promise.prototype = {
	children: null,
	fulfilled: false,
	rejected: false,
	result: null,
	error: null,
	has_error_listeners: false,
	has_success_listeners: false
};


Promise.prototype.fn = function fn() {
	var promise = this;

	return function abstracted() {
		var args = Array.prototype.slice.call(arguments),
			callback = args[args.length - 1];

		promise.then(function success(result) {
			if (!isPromise(result)) {
				if (isFunction(callback)) {
					return callback(
						new Error(
							'Promise.fn() was fulfilled with a non-function'
						)
					);
				}
			}

			result.apply(this, args);
		}, function failure(error) {
			if (isFunction(callback)) {
				callback(error);
			}
		});
	};
};

Promise.prototype.fulfill = function fulfill(value) {
	var index,
		length,
		child;

	if (this.rejected || this.fulfilled) {
		return;
	}

	this.fulfilled = true;
	this.result = value;

	index = 0;
	length = this.children.length;

	while (index < length) {
		child = this.children [index];
		dispatch.call(this, child, value, true);
		index++;
	}
};

Promise.prototype.break = function breakPromise(error) {
	if (this.fulfilled || this.rejected) {
		return;
	}

	this.rejected = true;
	this.error = error;

	if (!this.children.length) {
		return;
	}

	var index = 0;

	while (index < this.children.length) {
		dispatch.call(this, this.children[index], error, false);
		index++;
	}
};

Promise.prototype.then = function then(success, failure) {
	if (!isFunction(success)) {
		success = null;
	} else {
		this.has_success_handlers = true;
	}

	if (!isFunction(failure)) {
		failure = null;
	} else {
		this.has_error_handlers = true;
	}

	var child = {
		promise: new Promise(),
		success: success,
		failure: failure
	};

	var handler;

	if (this.fulfilled || this.rejected) {
		if (this.fulfilled) {
			dispatch.call(this, child, this.result, true);
		} else {
			dispatch.call(this, child, this.error, false);
		}

		setTimeout(handler, 0);
	} else {
		this.children.push(child);
	}

	return child.promise;
};

Promise.prototype.hasErrorHandlers = function hasErrorHandlers() {
	return this.has_error_handlers;
};

Promise.prototype.hasSuccessHandlers = function hasSuccessHandlers() {
	return this.has_success_handlers;
};

Promise.prototype.equals = function equals(value) {
	var promise = new Promise();

	function success(result) {
		promise.fulfill(result === value);
	}

	function failure(error) {
		promise.break(error);
	}

	this.then(success, failure);

	return promise;
};

Promise.prototype.get = function get() {
	var coerced = this.toObject();

	return coerced.get.apply(coerced, arguments);
};

Promise.prototype.toString = TypeResolver.createCoercer(Types.STRING);
Promise.prototype.toNumber = TypeResolver.createCoercer(Types.NUMBER);
Promise.prototype.toArray = TypeResolver.createCoercer(Types.ARRAY);
Promise.prototype.toObject = TypeResolver.createCoercer(Types.OBJECT);
Promise.prototype.toBoolean = TypeResolver.createCoercer(Types.BOOLEAN);
Promise.prototype.toFunction = TypeResolver.createCoercer(Types.FUNCTION);
Promise.prototype.toRegex = TypeResolver.createCoercer(Types.REGEX);
Promise.prototype.toDate = TypeResolver.createCoercer(Types.DATE);


module.exports = Promise;
