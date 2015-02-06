var
	promix = require('../index.js');

function queue(promise, value, delay) {
	setTimeout(function() {
		promise.fulfill(value);
	}, delay || 0);
}

function pop(test) {
	var promise = promix.promise();

	promix.toArray(promise).pop().then(function(result) {
		test.equals(result, 3);
		test.done();
	});

	queue(promise, [1, 2, 3]);
}

function push(test) {
	var promise = promix.promise();

	promix.toArray(promise).push(4).then(function(result) {
		test.equals(result, 4);
		test.done();
	});

	queue(promise, [1, 2, 3]);
}

function reverse(test) {
	var promise = promix.promise();

	promix.toArray(promise).reverse().pop().then(function(result) {
		test.equals(result, 1);
		test.done();
	});

	queue(promise, [1, 2, 3]);
}

function shift(test) {
	var promise = promix.promise();

	promix.toArray(promise).shift().then(function(result) {
		test.equals(result, 1);
		test.done();
	});

	queue(promise, [1, 2, 3]);
}

function sort(test) {
	var promise = promix.promise();

	promix.toArray(promise).sort().pop().then(function(result) {
		test.equals(result, 'c');
		test.done();
	});

	queue(promise, ['c', 'a', 'b']);
}

function splice(test) {
	var promise = promix.promise();

	promix.toArray(promise).splice(0, 1).then(function(result) {
		test.equals(result, 10);
		test.done();
	});

	queue(promise, [10, 5, 7]);
}

function unshift(test) {
	var promise = promix.promise();

	promix.toArray(promise).unshift(2).then(function(result) {
		test.equals(result, 4);
		test.done();
	});

	queue(promise, [10, 5, 7]);
}

function concat(test) {
	test.expect(2);

	var promise = promix.promise(),
		string_promise_one = promix.promise(),
		string_promise_two = promix.promise();

	promix.toArray(promise).concat(2).pop().then(function(result) {
		test.equals(result, 2);
	});

	promix.toArray(string_promise_one)
		.concat(string_promise_two)
		.concat('baz', 'wat')
		.join(' ')
		.then(function(result) {
			test.equals(result, 'foo bar baz wat');
			test.done();
		});

	queue(promise, [10, 5, 7]);
	queue(string_promise_two, 'bar', 10);
	queue(string_promise_one, 'foo', 20);
}

function join(test) {
	var promise = promix.promise();

	promix.toArray(promise).join('x').then(function(result) {
		test.equals(result, '10x5x7');
		test.done();
	});

	queue(promise, [10, 5, 7]);
}

function slice(test) {
	var promise = promix.promise();

	promix.toArray(promise).slice(1,2).shift().then(function(result) {
		test.equals(result, 5);
		test.done();
	});

	queue(promise, [10, 5, 7]);
}

function toString(test) {
	var promise = promix.promise();

	promix.toArray(promise).toString().then(function(result) {
		test.equals(result, '10,5,7');
		test.done();
	});

	queue(promise, [10, 5, 7]);
}

function indexOf(test) {
	var promise = promix.promise();

	promix.toArray(promise).indexOf(12).then(function(result) {
		test.equals(result, -1);
		test.done();
	});
	queue(promise, [10, 5, 7]);
}

function lastIndexOf(test) {
	var promise = promix.promise();

	promix.toArray(promise).lastIndexOf(5).then(function(result) {
		test.equals(result, 3);
		test.done();
	});

	queue(promise, [10, 5, 7, 5]);
}

module.exports = {
	pop: pop,
	push: push,
	reverse: reverse,
	shift: shift,
	sort: sort,
	splice: splice,
	unshift: unshift,
	concat: concat,
	join: join,
	slice: slice,
	toString: toString,
	indexOf: indexOf,
	lastIndexOf: lastIndexOf
};
