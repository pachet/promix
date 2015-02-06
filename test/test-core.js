var
	promix = require('../index.js');


function join ( test ) {

	function fail_one ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	}

	function success_one ( result ) {
		test.equals(result, true);
	}

	function fail_two ( error ) {
		test.equals(error.toString(), 'Error: The resolver was told to fail.');
		test.done();
	}

	function success_two ( result ) {
		test.ok(false, 'We should not be here');
		test.done();
	}

	function resolver ( succeed, callback ) {
		if ( succeed ) {
			callback(null, true);
		}
		else {
			callback(new Error('The resolver was told to fail.'));
		}
	}

	test.expect(2);
	resolver(true, promix.join(success_one, fail_one));
	resolver(false, promix.join(success_two, fail_two));
}

function fork ( test ) {
	var
		promise_one = promix.promise(),
		promise_two = promix.promise();

	function callback_one ( error, result ) {
		test.equals(error.toString(), 'Error: An arbitrary error.');
	}

	function callback_two ( error, result ) {
		test.equals(error, null);
		test.equals(result, 'An arbitrary result.');
		test.done();
	}

	test.expect(3);
	promix.fork(promise_one, callback_one);
	promix.fork(promise_two, callback_two);
	promise_one.reject(new Error('An arbitrary error.'));
	promise_two.fulfill('An arbitrary result.');
}

function first ( test ) {
	var
		promise_one = promix.promise(),
		promise_two = promix.promise(),
		promise_three = promix.promise();

	test.expect(1);
	promix.first(promise_one, promise_two, promise_three).then(function ( result ) {
		test.equals(result, 'foo');
		test.done();
	});
	setTimeout(promise_one.fulfill.bind(promise_one, false), 10);
	setTimeout(promise_two.fulfill.bind(promise_two, null), 20);
	setTimeout(promise_three.fulfill.bind(promise_three, 'foo'), 30);
}

function errorless ( test ) {
	function resolver ( value, callback ) {
		callback(value);
	}

	function callback ( error, result ) {
		test.equals(error, null);
		test.equals(result, 'An arbitrary result...');
		test.done();
	}
	
	test.expect(2);
	resolver('An arbitrary result...', promix.errorless(callback));
}

function wrap ( test ) {
	var
		promise_one = promix.promise(),
		callback_one = promix.wrap(promise_one),
		promise_two = promix.promise(),
		callback_two = promix.wrap(promise_two);

	function resolver ( succeed, callback ) {
		if ( succeed ) {
			callback(null, 'An arbitrary result.');
		}
		else {
			callback(new Error('An arbitrary error!'));
		}
	}

	test.expect(2);
	promise_one.then(function success ( result ) {
		test.ok(false, 'We should not be here.');
		test.done();
	}, function failure ( error ) {
		test.equals(error.toString(), 'Error: An arbitrary error!');
	});
	promise_two.then(function success ( result ) {
		test.equals(result, 'An arbitrary result.');
		test.done();
	}, function failure ( error ) {
		test.ok(false, 'We should not be here.');
		test.done();
	});
	resolver(false, callback_one);
	resolver(true, callback_two);
}

function invoke ( test ) {
	function resolver ( succeed, callback ) {
		if ( succeed ) {
			callback(null, 'An arbitrary value?');
		}
		else {
			callback(new Error('An arbitrary error?'));
		}
	}

	test.expect(2);
	promix.invoke(resolver, false).then(function success ( result ) {
		test.ok(false, 'We should not be here.');
		test.done();
	}, function failure ( error ) {
		test.equals(error.toString(), 'Error: An arbitrary error?');
	});
	promix.invoke(resolver, true).then(function success ( result ) {
		test.equals(result, 'An arbitrary value?');
		test.done();
	}, function failure ( error ) {
		test.ok(false, 'We should not be here.');
		test.done();
	});
}

function succeed ( test ) {
	test.expect(1);
	promix.succeed('An arbitrary value.').then(function success ( result ) {
		test.equals(result, 'An arbitrary value.');
		test.done();
	}, function failure ( error ) {
		test.ok(false, 'We should not be here.');
		test.done();
	});
}

function fail ( test ) {
	test.expect(1);
	promix.fail('An arbitrary error.').then(function success ( result ) {
		test.ok(false, 'We should not be here');
		test.done();
	}, function failure ( error ) {
		test.equals(error.toString(), 'Error: An arbitrary error.');
		test.done();
	});
}

function compose ( test ) {
	test.expect(4);
	promix.compose({
		one : promix.next(1),
		two : promix.next(2),
		three : promix.next(3),
		four : promix.next(4)
	}).then(function resolve ( result ) {
		test.equals(result.one, 1);
		test.equals(result.two, 2);
		test.equals(result.three, 3);
		test.equals(result.four, 4);
		test.done();
	});
}


function concat ( test ) {
	var
		promise_one = promix.next('bar'),
		promise_two = promix.next('wat');

	test.expect(1);
	promix.concat('foo', promise_one, 'baz', promise_two).then(function success ( result ) {
		test.equals(result, 'foobarbazwat');
		test.done();
	}, function failure ( error ) {
		test.ok(false, 'We should not be here.');
		test.done();
	});
}

function _do ( test ) {

	function increment ( value, callback ) {
		setTimeout(function ( ) {
			callback(null, value + 1);
		}, 0);
	}

	test.expect(1);
	promix.with(15).do(
		increment,
		increment,
		increment,
		increment
	).then(function ( result ) {
		test.equals(result, 19);
		test.done();
	}, function ( error ) {
		test.ok(false, 'we should not be here.');
		test.done();
	});
}

module.exports = {
	join : join,
	fork : fork,
	first : first,
	wrap : wrap,
	errorless : errorless,
	invoke : invoke,
	succeed : succeed,
	fail : fail,
	compose : compose,
	concat : concat,
	'do' : _do
};
