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

function dispatch ( child, value, success ) {
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
				result.then(child.promise.fulfill, child.promise.reject);
			}
		}
		catch ( error ) {
			child.promise.reject(error);
		}
	}
	else {
		child.promise [success ? 'resolve' : 'reject'] (value);
	}	
}

function Promise ( base, clone ) {
	var
		children = [ ],
		fulfilled = false,
		rejected = false,
		result = null,
		error = null,
		exposure;

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
	}

	function then ( success, failure ) {
		var
			child = {
				promise : new Promise(),
				success : typeof success === 'function' ? success : null,
				failure : typeof failure === 'function' ? failure : null
			};

		if ( fulfilled ) {
			setTimeout(dispatch.bind(null, child, result, true), 0);
		}
		else if ( rejected ) {
			setTimeout(dispatch.bind(null, child, error, false), 0);
		}
		else {
			children.push(child);
		}
		return child.promise;
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
	exposure.then = then;
	exposure.result = null;
	exposure.error = null;
	exposure.fulfilled = false;
	exposure.rejected = false;

	return exposure;
}


module.exports = Promise;
