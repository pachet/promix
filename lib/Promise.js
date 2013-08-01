var
	Handler = require('./Handler');

function copy ( object ) {
	var
		result = { };

	Object.keys(object).forEach(function each ( key ) {
		result [key] = object [key];
	});
	return result;
}

function Promise ( base, clone ) {
	var
		children = [ ],
		fulfilled = false,
		rejected = false,
		result = null,
		error = null,
		exposure;

	function fulfill ( resultant_result ) {
		var
			index,
			length,
			child;

		if ( rejected || fulfilled ) {
			return;
			//throw new Error('Cannot fulfill a rejected promise');
		}
		exposure.fulfilled = fulfilled = true;
		exposure.result = result = resultant_result;
		index = 0;
		length = children.length;
		while ( index < length ) {
			child = children [index];
			if ( child.success ) {
				child.promise.resolve(child.success(result));
			}
			index ++;
		}
	}

	function reject ( resultant_error ) {
		var
			result = false,
			index,
			length,
			child;

		if ( fulfilled || rejected ) {
			return;
			//throw new Error('Cannot reject a fulfilled promise');
		}
		exposure.rejected = rejected = true;
		exposure.error = error = resultant_error;
		index = 0;
		length = children.length;
		while ( index < length ) {
			child = children [index];
			if ( child.failure ) {
				child.failure(error);
			}
			else {
				child.promise.reject(error);
			}
			index ++;
			result = true;
		}
		if ( ! result && Handler.handle ) {
			Handler.handle(error);
		}
	}

	function then ( success, failure ) {
		var
			promise = new Promise(),
			success_is_function = typeof success === 'function',
			failure_is_function = typeof failure === 'function';

		if ( fulfilled && success_is_function ) {
			setTimeout(function deferred_success ( ) {
				promise.fulfill(success(result));
			}, 0);
		}
		else if ( rejected ) {
			setTimeout(function deferred_failure ( ) {
				if ( failure_is_function ) {
					failure(error);
				}
				else {
					promise.reject(error);
				}
			}, 0);
		}
		else {
			children.push({
				promise : promise,
				success : success_is_function ? success : null,
				failure : failure_is_function ? failure : null
			});
		}
		return promise;
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
