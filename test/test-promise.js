var
	promix = require('../index');

function then ( test ) {
	var
		promise = promix.promise();

	test.expect(4);
	promise.then(function ( result ) {
		test.equals(result, 1);
		return 2;
	}).then(function ( result ) {
		test.equals(result, 2);
		return 3;
	}).then(function ( result ) {
		test.equals(result, 3);
		return 4;
	}).then(function ( result ) {
		test.equals(result, 4);
		test.done();
	});

	setTimeout(function ( ) {
		promise.fulfill(1);
	}, 0);

}

function cascade ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promise.then(function ( result ) {
		test.ok(false, 'we should not be here');
	}).then(function ( result ) {
		test.ok(false, 'we should not be here');
	}).then(function ( result ) {
		test.ok(false, 'we should not be here');
	}).then(function ( result ) {
		test.ok(false, 'we should not be here');
	}).then(function ( result ) {
		test.ok(false, 'we should not be here');
	}, function ( error ) {
		test.equals(error.toString(), 'Error: arbitrary error');
		test.done();
	});

	setTimeout(function ( ) {
		promise.reject(new Error('arbitrary error'));
	}, 0);
}

function fulfill ( test ) {
	var
		deferred = promix.promise();

	test.expect(1);
	deferred.then(function success ( result ) {
		test.equal(result, 'This promise will be fulfilled');
		test.done();
	}, function failure ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	return void deferred.fulfill('This promise will be fulfilled');
}

function reject ( test ) {
	var
		deferred = promix.promise();

	test.expect(1);
	deferred.then(function success ( result ) {
		test.ok(false, 'We should not be here');
		test.done();
	}, function failure ( error ) {
		test.equal(error.toString(), 'Error: This promise will be rejected');
		test.done();
	});
	deferred.reject(new Error('This promise will be rejected'));
}

function fulfill_fulfill ( test ) {
	var
		deferred = promix.promise();

	test.expect(2);
	deferred.then(function success_one ( result ) {
		test.equal(result, 'This promise will be fulfilled');
	});
	deferred.then(function success_two ( result ) {
		test.equal(result, 'This promise will be fulfilled');
		test.done();
	}, function failure ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	return void deferred.fulfill('This promise will be fulfilled');
}


function reject_reject ( test ) {
	var
		deferred = promix.promise();
	
	test.expect(2);
	deferred.then(function success_one ( result ) {
		test.ok(false, 'We should not be here');
	}, function error_one ( error ) {
		test.equal(error.toString(), 'Error: This promise will be rejected');
	});
	deferred.then(function success_two ( result ) {
		test.ok(false, 'We should not be here');
	}, function error_two ( error ) {
		test.equal(error.toString(), 'Error: This promise will be rejected');
		test.done();
	});
	return void deferred.reject(new Error('This promise will be rejected'));
}

function fulfill_reject ( test ) {
	var
		deferred_one = promix.promise(),
		deferred_two;

	test.expect(3);
	
	deferred_two = deferred_one.then(function success_one ( result ) {
		test.equal(result, 'This promise will be fulfilled');
		return result;
	}, function failure_one ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	deferred_one.fulfill('This promise will be fulfilled');
	test.throws(function ( ) {
		deferred_one.reject(new Error('This promise will be rejected'));
	});
	deferred_two.then(function success_two ( result ) {
		test.equal(result, 'This promise will be fulfilled');
		test.done();
	}, function failure_two ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
}

function reject_fulfill ( test ) {
	var
		deferred_one = promix.promise(),
		deferred_two;

	test.expect(2);
	deferred_two = deferred_one.then(function success_one ( result ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	deferred_one.reject(new Error('This promise will be rejected'));
	test.throws(function ( ) {
		deferred_one.fulfill('This promise will be fulfilled');
	});
	deferred_two.then(function success_two ( result ) {
		test.ok(false, 'We should not be here');
		test.done();
	}, function failure_two ( error ) {
		test.equal(error.toString(), 'Error: This promise will be rejected');
		test.done();
	});
}

module.exports = {
	then : then,
	cascade : cascade,
	fulfill : fulfill,
	reject : reject,
	fulfill_fulfill : fulfill_fulfill,
	reject_reject : reject_reject,
	fulfill_reject : fulfill_reject,
	reject_fulfill : reject_fulfill
};
