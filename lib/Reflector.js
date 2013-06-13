var
	Promise = require('./Promise');

function Reflector ( deferred ) {
	var reflect = new Promise(function reflect ( identifier ) {
		var
			subpromise = new Promise();

		function success ( result ) {
			var
				value;

			if ( result ) {
				if ( typeof identifier === 'undefined' ) {
					value = result;
				}
				else {
					value = result [identifier];
				}
			}
			else {
				value = null;
			}
			return void subpromise.fulfill(value);
		}

		function failure ( error ) {
			return void subpromise.reject(error);
		}

		deferred.then(success, failure);
		return subpromise;
	});
	deferred.reflection = reflect;
	deferred.then(reflect.fulfill, reflect.reject);
	return reflect;
}

module.exports = Reflector;
