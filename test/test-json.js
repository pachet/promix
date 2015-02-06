var
	promix = require('../index.js');

function queue(promise, value, delay) {
	setTimeout(function() {
		promise.fulfill(value);
	}, delay || 0);
}

function parse(test) {
	test.expect(1);

	var promise = promix.promise();

	promix.toString(promise)
		.parse()
		.get('foo')
		.toNumber()
		.add(4)
		.then(function(result) {
			test.equals(result, 5);
			test.done();
		});

	queue(promise, '{"foo":1,"bar":2,"baz":3}');
}

function stringify(test) {
	test.expect(1);

	var promise = promix.promise();

	promix.toObject(promise)
		.json()
		.parse()
		.get('foo')
		.toString()
		.concat('23')
		.parseInt()
		.add(4)
		.then(function(result) {
			test.equals(result, 127);
			test.done();
		});

	queue(promise, {
		foo: 1,
		bar: 2,
		baz: 3
	});
}


module.exports = {
	parse: parse,
	stringify: stringify
};
