var
	promix = require('../index.js');

function call(test) {
	var promise = promix.promise();

	var context = {
		base_amount: 1000
	};

	test.expect(1);

	var deferred = promix
		.toObject(promise)
		.get('foo')
		.toFunction()
		.call(context, 345);

	deferred.then(function(result) {
		test.equals(result, 1690);
		test.done();
	}, function(error) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function() {
		promise.fulfill({
			foo: function foo(amount) {
				return this.base_amount + (amount * 2);
			}
		});
	}, 0);
}

function apply(test) {
	var promise = promix.promise();

	var context = {
		base_amount: 1000
	};

	test.expect(1);

	var deferred = promix
		.toObject(promise)
		.get('foo')
		.toFunction()
		.apply(context, [345, 500]);

	deferred.then(function(result) {
		test.equals(result, 2190);
		test.done();
	}, function(error) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function() {
		promise.fulfill({
			foo: function foo(amount, additional_amount) {
				return this.base_amount + (amount * 2) + additional_amount;
			}
		});
	}, 0);
}

function bind(test) {
	var promise = promix.promise();

	var context = {
		base_amount: 1000
	};

	test.expect(1);

	var deferred = promix
		.toObject(promise)
		.get('foo')
		.toFunction()
		.bind(context)
		.execute(345);

	deferred.then(function(result) {
		test.equals(result, 1690);
		test.done();
	}, function(error) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function() {
		promise.fulfill({
			foo: function foo(amount) {
				return this.base_amount + (amount * 2);
			}
		});
	}, 0);
}

function execute(test) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toObject(promise).get('foo').toFunction().execute(345).then(function(result) {
		test.equals(result, 690);
		test.done();
	}, function(error) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function() {
		promise.fulfill({
			foo: function foo(amount) {
				return amount * 2;
			}
		});
	}, 0);
}

module.exports = {
	call:    call,
	apply:   apply,
	bind:    bind,
	execute: execute
};
