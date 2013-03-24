var
	Promise = require('./Promise');

function Reflector ( deferred ) {
	var
		result;

	function get ( identifier ) {
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
	}
	//think about masking this instead
	//result = new Promise(get);
	//deferred.then(result.fulfill, result.reject);
	result = get;
	return result;
}

module.exports = Reflector;
