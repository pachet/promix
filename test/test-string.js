var promix = require('../index.js');

function queue(promise, value, delay) {
	setTimeout(function() {
		promise.fulfill(value);
	}, delay || 0);
}

function charAt(test) {
	test.expect(1);

	var promise = promix.promise();

	promix.toString(promise).charAt(2).then(function(result) {
		test.equals(result, 'k');
		test.done();
	}, function(error) {
		test.ok(false, 'We should not be here');
		test.done();
	});

	queue(promise, 'pikachu');
}

function concat(test) {
	test.expect(1);

	var promise = promix.promise();

	promix.toString(promise)
		.concat(' is', ' a', ' lightning', ' pokemon')
		.then(function(result) {
			test.equals(result, 'pikachu is a lightning pokemon');
			test.done();
		}, function(error) {
			test.ok(false, 'We should not be here');
			test.done();
		});

	queue(promise, 'pikachu');
}

function indexOf(test) {
	test.expect(1);

	var promise = promix.promise();

	promix.toString(promise).indexOf('chu').then(function(result) {
		test.equals(result, 4);
		test.done();
	}, function(error) {
		test.ok(false, 'We should not be here');
		test.done();
	});

	queue(promise, 'pikachu');
}

function length(test) {
	test.expect(1);

	var promise = promix.promise();

	promix.toString(promise).length().then(function(result) {
		test.equals(result, 7);
		test.done();
	}, function(error) {
		test.ok(false, 'We should not be here');
		test.done();
	});

	queue(promise, 'pikachu');
}

function match(test) {
	test.expect(1);

	var promise = promix.promise();

	promix.toString(promise).match(/charizard/).then(function(result) {
		test.equals(result [0], 'charizard');
		test.done();
	}, function(error) {
		test.ok(false, 'We should not be here');
		test.done();
	});

	queue(promise, 'pikachu charizard wartortle');
}

function replace(test) {
	test.expect(1);

	var promise = promix.promise();

	promix.toString(promise)
		.replace(/charizard/g, 'beedrill')
		.then(function(result) {
			test.equals(result, 'pikachu beedrill wartortle');
			test.done();
		}, function(error) {
			test.ok(false, 'We should not be here');
			test.done();
		});

	queue(promise, 'pikachu charizard wartortle');
}

function split(test) {
	test.expect(1);

	var promise = promix.promise();

	promix.toString(promise).split(' ').then(function(result) {
		test.equals(result.join('_'), 'pikachu_charizard_wartortle');
		test.done();
	}, function(error) {
		test.ok(false, 'We should not be here');
		test.done();
	});

	queue(promise, 'pikachu charizard wartortle');
}

function slice(test) {
	test.expect(1);

	var promise = promix.promise();

	promix.toString(promise).slice(8).then(function(result) {
		test.equals(result, 'charizard wartortle');
		test.done();
	}, function(error) {
		test.ok(false, 'We should not be here');
		test.done();
	});

	queue(promise, 'pikachu charizard wartortle');

	setTimeout(function() {
		promise.fulfill('pikachu charizard wartortle');
	}, 0);
}

function substr(test) {
	test.expect(1);

	var promise = promix.promise();

	promix.toString(promise).substr(8, 9).then(function(result) {
		test.equals(result, 'charizard');
		test.done();
	}, function(error) {
		test.ok(false, 'We should not be here');
		test.done();
	});

	queue(promise, 'pikachu charizard wartortle');
}

function substring(test) {
	test.expect(1);

	var promise = promix.promise();

	promix.toString(promise).substring(8, 17).then(function(result) {
		test.equals(result, 'charizard');
		test.done();
	}, function(error) {
		test.ok(false, 'We should not be here');
		test.done();
	});

	queue(promise, 'pikachu charizard wartortle');
}

function toLowerCase(test) {
	test.expect(1);

	var promise = promix.promise();

	promix.toString(promise).toLowerCase().then(function(result) {
		test.equals(result, 'charizard');
		test.done();
	}, function(error) {
		test.ok(false, 'We should not be here');
		test.done();
	});

	queue(promise, 'CHARIZARD');
}

function toUpperCase(test) {
	test.expect(1);

	var promise = promix.promise();

	promix.toString(promise).toUpperCase().then(function(result) {
		test.equals(result, 'CHARIZARD');
		test.done();
	}, function(error) {
		test.ok(false, 'We should not be here');
		test.done();
	});

	queue(promise, 'charizard');
}

function trim(test) {
	test.expect(1);

	var promise = promix.promise();

	promix.toString(promise).trim().then(function(result) {
		test.equals(result, 'charizard');
		test.done();
	}, function(error) {
		test.ok(false, 'We should not be here');
		test.done();
	});

	queue(promise, ' charizard ');
}

function parse(test) {
	test.expect(1);

	var promise = promix.promise();

	promix.toString(promise).parse().then(function(result) {
		test.equals(result.foo, 'bar');
		test.done();
	}, function(error) {
		test.ok(false, error.toString());
	});

	queue(promise, '{"foo": "bar"}');
}

function parseFloat(test) {
	test.expect(1);

	var promise = promix.promise();

	promix.toString(promise).parseFloat().then(function(result) {
		test.equals(result, 1.2345);
		test.done();
	}, function(error) {
		test.ok(false, error.toString());
		test.done();
	});

	queue(promise, '1.2345abc');
}


function parseInt(test) {
	test.expect(1);

	var promise = promix.promise();

	promix.toString(promise).parseInt(10).then(function(result) {
		test.equals(result, 123);
		test.done();
	}, function(error) {
		test.ok(false, error.toString());
		test.done();
	});

	queue(promise, '123px');
}


module.exports = {
	charAt: charAt,
	concat: concat,
	indexOf: indexOf,
	length: length,
	match: match,
	replace: replace,
	split: split,
	slice: slice,
	substr: substr,
	substring: substring,
	toLowerCase: toLowerCase,
	toUpperCase: toUpperCase,
	trim: trim,
	parse: parse,
	parseFloat: parseFloat,
	parseInt: parseInt
};
