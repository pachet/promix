var promix = require('../index');

function then(test) {
	test.expect(4);

	var promise = promix.promise();

	promise.then(function(result) {
		test.equals(result, 1);
		return 2;
	}).then(function(result) {
		test.equals(result, 2);
		return 3;
	}).then(function(result) {
		test.equals(result, 3);
		return 4;
	}).then(function(result) {
		test.equals(result, 4);
		test.done();
	});

	setTimeout(function() {
		promise.fulfill(1);
	}, 0);

}

function cascade(test) {
	test.expect(1);

	var promise = promix.promise();

	promise.then(function(result) {
		test.ok(false, 'we should not be here');
	}).then(function(result) {
		test.ok(false, 'we should not be here');
	}).then(function(result) {
		test.ok(false, 'we should not be here');
	}).then(function(result) {
		test.ok(false, 'we should not be here');
	}).then(function(result) {
		test.ok(false, 'we should not be here');
	}, function(error) {
		test.equals(error.toString(), 'Error: arbitrary error');
		test.done();
	});

	setTimeout(function() {
		promise.reject(new Error('arbitrary error'));
	}, 0);
}

function fulfill(test) {
	test.expect(1);

	var promise = promix.promise();

	promise.then(function success(result) {
		test.equal(result, 'This promise will be fulfilled');
		test.done();
	}, function failure(error) {
		test.ok(false, 'We should not be here');
		test.done();
	});

	promise.fulfill('This promise will be fulfilled');
}

function reject(test) {
	test.expect(1);

	var promise = promix.promise();

	promise.then(function(result) {
		test.ok(false, 'We should not be here');
		test.done();
	}, function(error) {
		test.equal(error.toString(), 'Error: This promise will be rejected');
		test.done();
	});

	promise.reject(new Error('This promise will be rejected'));
}

function fulfillFulfill(test) {
	var promise = promix.promise();

	test.expect(2);

	promise.then(function(result) {
		test.equal(result, 'This promise will be fulfilled');
	});

	promise.then(function(result) {
		test.equal(result, 'This promise will be fulfilled');
		test.done();
	}, function(error) {
		test.ok(false, 'We should not be here');
		test.done();
	});

	promise.fulfill('This promise will be fulfilled');
}


function rejectReject(test) {
	test.expect(2);

	var promise = promix.promise();

	promise.then(function(result) {
		test.ok(false, 'We should not be here');
	}, function(error) {
		test.equal(error.toString(), 'Error: This promise will be rejected');
	});

	promise.then(function(result) {
		test.ok(false, 'We should not be here');
	}, function(error) {
		test.equal(error.toString(), 'Error: This promise will be rejected');
		test.done();
	});

	promise.reject(new Error('This promise will be rejected'));
}

function fulfillReject(test) {
	var promise1 = promix.promise(),
		promise2;

	test.expect(2);

	promise2 = promise1.then(function(result) {
		test.equal(result, 'This promise will be fulfilled');
		return result;
	}, function(error) {
		test.ok(false, 'We should not be here');
		test.done();
	});

	promise1.fulfill('This promise will be fulfilled');

	promise2.then(function(result) {
		test.equal(result, 'This promise will be fulfilled');
		test.done();
	}, function(error) {
		test.ok(false, 'We should not be here');
		test.done();
	});
}

function rejectFulfill(test) {
	var promise1 = promix.promise(),
		promise2;

	test.expect(1);
	promise2 = promise1.then(function success_one(result) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	promise1.reject(new Error('This promise will be rejected'));
	promise2.then(function success_two(result) {
		test.ok(false, 'We should not be here');
		test.done();
	}, function failure_two(error) {
		test.equal(error.toString(), 'Error: This promise will be rejected');
		test.done();
	});
}

function fn(test) {
	test.expect(1);

	var promise = promix.promise();

	promise.fn()('bowser');

	setTimeout(function() {
		promise.fulfill(function(string) {
			test.equals(string, 'bowser');
			test.done();
		});
	}, 0);
}

module.exports = {
	then: then,
	cascade: cascade,
	fulfill: fulfill,
	reject: reject,
	fulfillFulfill: fulfillFulfill,
	rejectReject: rejectReject,
	fulfillReject: fulfillReject,
	rejectFulfill: rejectFulfill,
	fn: fn
};
