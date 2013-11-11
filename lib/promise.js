var
	handler = require('./handler');

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

function dispatch ( child, value, success, sync ) {
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
}

function Promise ( base, clone ) {
	var
		children = [ ],
		cache = { },
		fulfilled = false,
		rejected = false,
		result = null,
		error = null,
		exposure,
		key = 0;

	function fulfill ( value ) {
		var
			index,
			length,
			child;

		if ( rejected || fulfilled ) {
			return;
		}
		exposure.fulfilled = fulfilled = true;
		exposure.result = result = value;
		index = 0;
		length = children.length;
		while ( index < length ) {
			child = children [index];
			dispatch(child, result, true);
			index ++;
		}
		return {
			sync : sync
		};
	}

	function reject ( reason ) {
		var
			result = false,
			index,
			length,
			child,
			child_result;

		if ( fulfilled || rejected ) {
			return;
		}
		exposure.rejected = rejected = true;
		exposure.error = error = reason;
		index = 0;
		length = children.length;
		while ( index < length ) {
			child = children [index];
			dispatch(child, error, false);
			index ++;
			result = true;
		}
		if ( ! result && handler.handle ) {
			handler.handle(error);
		}
		return {
			sync : sync
		};
	}

	function then ( success, failure ) {
		var
			child = {
				promise : new Promise(),
				success : typeof success === 'function' ? success : null,
				failure : typeof failure === 'function' ? failure : null
			},
			localKey = ++ key,
			handler,
			timer;

		if ( fulfilled || rejected ) {
			if ( fulfilled ) {
				handler = dispatch.bind(null, child, result, true);
			}
			else {
				handler = dispatch.bind(null, child, error, false);
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
			children.push(child);
		}
		return child.promise;
	}

	function sync ( ) {
		var
			keys = Object.keys(cache),
			key,
			index,
			child,
			item;

		while ( keys.length ) {
			while ( keys.length ) {
				key = keys.pop();
				item = cache [key];
				clearTimeout(item.timer);
				item.handler();
				delete cache [key];
			}
			keys = Object.keys(cache);
		}
		index = children.length;
		while ( index -- ) {
			child = children [index];
			if ( typeof child.promise.sync === 'function' ) {
				child.promise.sync();
			}
		}
		return exposure;
	}

	if ( base && clone === true ) {
		exposure = copy(base);
	}
	else {
		exposure = base || { };
	}
	exposure.reject = reject;
	exposure.resolve = fulfill;
	exposure.fulfill = fulfill;
	exposure.sync = sync;
	exposure.then = then;
	exposure.result = null;
	exposure.error = null;
	exposure.fulfilled = false;
	exposure.rejected = false;

	return exposure;
}


module.exports = Promise;
