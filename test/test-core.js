var promix = require('../index.js');


function join(test) {
	test.expect(2);

	function failOne(error) {
		test.ok(false, 'We should not be here');
		test.done();
	}

	function success_one(result) {
		test.equals(result, true);
	}

	function failTwo(error) {
		test.equals(error.toString(), 'Error: The resolver was told to fail.');
		test.done();
	}

	function success_two(result) {
		test.ok(false, 'We should not be here');
		test.done();
	}

	function resolver(succeed, callback) {
		if (succeed) {
			callback(null, true);
		} else {
			callback(new Error('The resolver was told to fail.'));
		}
	}

	resolver(true, promix.join(success_one, failOne));
	resolver(false, promix.join(success_two, failTwo));
}

function fork(test) {
	test.expect(3);

	var promise1 = promix.promise(),
		promise2 = promix.promise();

	function callback1 (error, result) {
		test.equals(error.toString(), 'Error: An arbitrary error.');
	}

	function callback2 (error, result) {
		test.equals(error, null);
		test.equals(result, 'An arbitrary result.');
		test.done();
	}

	promix.fork(promise1, callback1);
	promix.fork(promise2, callback2);
	promise1.reject(new Error('An arbitrary error.'));
	promise2.fulfill('An arbitrary result.');
}

function first (test) {
	test.expect(1);

	var promise1 = promix.promise(),
		promise2 = promix.promise(),
		promise_three = promix.promise();

	promix.first(promise1, promise2, promise_three).then(function( result) {
		test.equals(result, 'foo');
		test.done();
	});

	setTimeout(promise1.fulfill.bind(promise1, false), 10);
	setTimeout(promise2.fulfill.bind(promise2, null), 20);
	setTimeout(promise_three.fulfill.bind(promise_three, 'foo'), 30);
}

function errorless (test) {
	test.expect(2);

	function resolver(value, callback) {
		callback(value);
	}

	function callback(error, result) {
		test.equals(error, null);
		test.equals(result, 'An arbitrary result...');
		test.done();
	}

	resolver('An arbitrary result...', promix.errorless(callback));
}

function wrap(test) {
	test.expect(2);

	var promise1 = promix.promise(),
		callback1 = promix.wrap(promise1),
		promise2 = promix.promise(),
		callback2 = promix.wrap(promise2);

	function resolver(succeed, callback) {
		if (succeed) {
			callback(null, 'An arbitrary result.');
		} else {
			callback(new Error('An arbitrary error!'));
		}
	}

	promise1.then(function success(result) {
		test.ok(false, 'We should not be here.');
		test.done();
	}, function failure(error) {
		test.equals(error.toString(), 'Error: An arbitrary error!');
	});

	promise2.then(function success(result) {
		test.equals(result, 'An arbitrary result.');
		test.done();
	}, function failure(error) {
		test.ok(false, 'We should not be here.');
		test.done();
	});

	resolver(false, callback1);
	resolver(true, callback2);
}

function invoke(test) {
	test.expect(2);

	function resolver(succeed, callback) {
		if (succeed) {
			callback(null, 'An arbitrary value?');
		} else {
			callback(new Error('An arbitrary error?'));
		}
	}

	promix.invoke(resolver, false).then(function success(result) {
		test.ok(false, 'We should not be here.');
		test.done();
	}, function failure(error) {
		test.equals(error.toString(), 'Error: An arbitrary error?');
	});

	promix.invoke(resolver, true).then(function success(result) {
		test.equals(result, 'An arbitrary value?');
		test.done();
	}, function failure(error) {
		test.ok(false, 'We should not be here.');
		test.done();
	});
}

function succeed (test) {
	test.expect(1);

	promix.succeed('An arbitrary value.').then(function success(result) {
		test.equals(result, 'An arbitrary value.');
		test.done();
	}, function failure(error) {
		test.ok(false, 'We should not be here.');
		test.done();
	});
}

function fail (test) {
	test.expect(1);

	promix.fail('An arbitrary error.').then(function success(result) {
		test.ok(false, 'We should not be here');
		test.done();
	}, function failure(error) {
		test.equals(error.toString(), 'Error: An arbitrary error.');
		test.done();
	});
}

function compose (test) {
	test.expect(4);

	promix.compose({
		one: promix.next(1),
		two: promix.next(2),
		three: promix.next(3),
		four: promix.next(4)
	}).then(function resolve (result) {
		test.equals(result.one, 1);
		test.equals(result.two, 2);
		test.equals(result.three, 3);
		test.equals(result.four, 4);
		test.done();
	});
}


function concat (test) {
	test.expect(1);

	var promise1 = promix.next('bar'),
		promise2 = promix.next('wat');

	promix.concat('foo', promise1, 'baz', promise2).then(
		function success(result) {
			test.equals(result, 'foobarbazwat');
			test.done();
		}, function failure(error) {
			test.ok(false, 'We should not be here.');
			test.done();
		}
	);
}

function _do (test) {

	function increment(value, callback) {
		setTimeout(function() {
			callback(null, value + 1);
		}, 0);
	}

	test.expect(1);
	promix.with(15).do(
		increment,
		increment,
		increment,
		increment
	).then(function(result) {
		test.equals(result, 19);
		test.done();
	}, function(error) {
		test.ok(false, 'we should not be here.');
		test.done();
	});
}

module.exports = {
	join: join,
	/*
	fork: fork,
	first: first,
	wrap: wrap,
	errorless: errorless,
	invoke: invoke,
	succeed: succeed,
	fail: fail,
	compose: compose,
	concat: concat,
	'do': _do
	*/
};
