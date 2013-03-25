var
	Handler = require('./Handler');

function Promise ( base ) {
	var
		fulfillers = [ ],
		rejectors = [ ],
		fulfilled = false,
		rejected = false,
		result = null,
		error = null,
		promise = null,
		exposure;

	function fulfill ( resultant_result ) {
		if ( rejected ) {
			throw new Error('Cannot reject a fulfilled promise');
		}
		exposure.fulfilled = fulfilled = true;
		exposure.result = result = resultant_result;
		while ( fulfillers.length ) {
			fulfillers.shift()(result);
		}
	}

	function reject ( resultant_error ) {
		var
			result = false;

		if ( fulfilled ) {
			throw new Error('Cannot fulfill a rejected promise');
		}
		exposure.rejected = rejected = true;
		exposure.error = error = resultant_error;
		while ( rejectors.length ) {
			rejectors.shift()(error);
			result = true;
		}
		if ( ! result ) {
			if ( Handler.handle ) {
				Handler.handle(error);
			}
		}
	}

	function then ( success, failure ) {
		if ( fulfilled ) {
			setTimeout(function deferred_success ( ) {
				return void success(result);
			}, 0);
		}
		else if ( rejected && typeof failure === 'function' ) {
			setTimeout(function deferred_failure ( ) {
				return void failure(error);
			}, 0);
		}
		else {
			fulfillers.push(success);
			if ( typeof failure === 'function' ) {
				rejectors.push(failure);
			}
		}
		if ( promise === null ) {
			promise = new Promise();
			then(promise.fulfill, promise.reject);
		}
		return promise;
	}

	exposure = base || { };
	exposure.reject = reject;
	exposure.fulfill = fulfill;
	exposure.then = then;
	exposure.result = null;
	exposure.error = null;
	exposure.fulfilled = false;
	exposure.rejected = false;

	return exposure;
}


module.exports = Promise;
