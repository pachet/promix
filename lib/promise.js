var
	handler = require('./handler');


function extend ( target, source ) {
	var key;

	for ( key in source ) {
		target [key] = source [key];
	}

	return target;
}

function copy ( object ) {
	var
		result = { },
		keys = Object.keys(object),
		index = keys.length,
		key;

	while ( index -- ) {
		key = keys [index];
		result [key] = object [key];
	}
	return result;
}

function Promise ( base, clone ) {
	var result;

	if ( base ) {
		if ( clone ) {
			result = copy(base);
		} else {
			result = base;
		}

		extend(base, Promise.prototype);
	} else {
		result = this;
	}

	result.children = [ ];
	result.cache = { };

	result.fulfill = result.fulfill.bind(result);
	result.reject = result.reject.bind(result);

	return result;
}

Promise.prototype = {
	children: null,
	cache: null,
	fulfilled: false,
	rejected: false,
	result: null,
	error: null,
	key: 0
};

Promise.prototype.dispatch = function dispatch ( child, value, success, sync ) {
	var
		method = success ? child.success : child.failure,
		result;

	if ( method ) {
		try {
			result = method(value);
			if ( ! result || typeof result.then !== 'function' ) {
				child.promise.resolve(result);
			}
			else {
				result.then(child.promise.resolve, child.promise.reject);
			}
		}
		catch ( error ) {
			child.promise.reject(error);
		}
	}
	else {
		child.promise [success ? 'resolve' : 'reject'] (value);
	}
	if ( sync && typeof child.promise.sync === 'function' ) {
		child.promise.sync();
	}
};

Promise.prototype.fn = function fn ( ) {
	var promise = this;

	return function abstracted() {
		var args = Array.prototype.slice.call(arguments),
			callback = args [args.length - 1];

		promise.then(function success(result) {
			if ( ! result || typeof result !== 'function' ) {
				if (callback && typeof callback === 'function') {
					return callback(new Error('Promise.fn() was fulfilled with a non-function'));
				}
			}

			result.apply(this, args);
		}, function failure(error) {

			if (callback && typeof callback === 'function') {
				callback(error);
			}
		});

	};
};

Promise.prototype.fulfill = function fulfill ( value ) {
	var
		index,
		length,
		child;

	if ( this.rejected || this.fulfilled ) {
		return;
	}

	this.fulfilled = true;
	this.result = value;

	index = 0;
	length = this.children.length;

	while ( index < length ) {
		child = this.children [index];
		this.dispatch(child, value, true);
		index ++;
	}

	return this;
};

Promise.prototype.resolve = Promise.prototype.fulfill;

Promise.prototype.reject = function reject ( error ) {
	var
		result = false,
		index,
		length,
		child,
		child_result;

	if ( this.fulfilled || this.rejected ) {
		return;
	}

	this.rejected = true;
	this.error = error;
	index = 0;
	length = this.children.length;

	while ( index < length ) {
		child = this.children [index];
		this.dispatch(child, error, false);
		index ++;
		result = true;
	}

	if ( ! result && handler.handle ) {
		handler.handle(error);
	}

	return this;
};

Promise.prototype.then = function then ( success, failure ) {
	var
		child = {
			promise : new Promise(),
			success : typeof success === 'function' ? success : null,
			failure : typeof failure === 'function' ? failure : null
		},
		localKey = ++ this.key,
		handler,
		timer,
		cache = this.cache;

	if ( this.fulfilled || this.rejected ) {
		if ( this.fulfilled ) {
			handler = this.dispatch.bind(this, child, this.result, true);
		}
		else {
			handler = this.dispatch.bind(this, child, this.error, false);
		}
		timer = setTimeout(function ( ) {
			handler();
			delete cache [localKey];
		}, 0);
		cache [localKey] = {
			handler : handler,
			timer : timer
		};
	}
	else {
		this.children.push(child);
	}
	return child.promise;
};

Promise.prototype.sync = function sync ( ) {
	var
		keys = Object.keys(this.cache),
		key,
		index,
		child,
		item;

	while ( keys.length ) {
		while ( keys.length ) {
			key = keys.pop();
			item = this.cache [key];
			clearTimeout(item.timer);
			item.handler();
			delete this.cache [key];
		}
		keys = Object.keys(this.cache);
	}
	index = this.children.length;
	while ( index -- ) {
		child = this.children [index];
		if ( typeof child.promise.sync === 'function' ) {
			child.promise.sync();
		}
	}

	return this;
};

module.exports = Promise;
