var
	promix = require('../index.js');

function queue ( promise, value ) {
	setTimeout(function ( ) {
		promise.fulfill(value);
	}, 0);
}

function parse ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toString(promise).parse().get('foo').toNumber().plus(4).then(function ( result ) {
		test.equals(result, 5);
		test.done();
	});
	queue(promise, '{"foo":1,"bar":2,"baz":3}');
}

function stringify ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toObject(promise).json().parse().get('foo').toString().concat('23').toInt().plus(4).then(function ( result ) {
		test.equals(result, 127);
		test.done();
	});
	queue(promise, {
		foo : 1,
		bar : 2,
		baz : 3
	});
}


module.exports = {
	parse : parse,
	stringify : stringify
};
