var
	promix = require('../index.js');

function queue ( promise, value ) {
	setTimeout(function ( ) {
		promise.fulfill(value);
	}, 0);
}

function invalid_string ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toString(promise).replace('x', 'y').concat('bar').then(function ( result ) {
		test.equals(result, 'bar');
		test.done();
	});
	queue(promise, []);
}

function invalid_number ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toNumber(promise).add(2, 3, 4).then(function ( result ) {
		test.equals(result, 9);
		test.done();
	});
	queue(promise, []);
}

function invalid_array ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toArray(promise).concat('a', 'b').join('x').then(function ( result ) {
		test.equals(result, '2xaxb');
		test.done();
	});
	queue(promise, 2);
}

module.exports = {
	invalid_string : invalid_string,
	invalid_number : invalid_number,
	invalid_array : invalid_array
};
