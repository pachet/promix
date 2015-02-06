var
	promix = require('../index.js');

function queue ( promise, value ) {
	setTimeout(function ( ) {
		promise.fulfill(value);
	}, 0);
}

function number_to_array ( test ) {
	var
		promise = promix.promise();

	promix.toNumber(promise).toString().concat('bar').split('').then(function ( result ) {
		test.equals(result [0], '2');
		test.equals(result [1], 'b');
		test.equals(result [2], 'a');
		test.equals(result [3], 'r');
		test.done();
	});
	queue(promise, 2);
}

function array_to_number ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toArray(promise).reverse().toString().split(',').join('').toInt().then(function ( result ) {
		test.equals(result, 123);
		test.done();
	});

	queue(promise, ['bar', 3, 2, 1]);
}

function string_to_number ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toString(promise).toFloat().plus(2).times(3).toPrecision(3).toFloat().then(function ( result ) {
		test.equals(result, 12.3);
		test.done();
	});

	queue(promise, '2.1bar');
}

function array_to_string ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toArray(promise).concat('bar', 'baz').join('').replace(/baz/g, 'boom').then(function ( result ) {
		test.equals(result, 'foowatbarboom');
		test.done();
	});
	queue(promise, ['foo', 'wat']);
}




module.exports = {
	number_to_array : number_to_array,
	array_to_number : array_to_number,
	string_to_number : string_to_number,
	array_to_string : array_to_string
};
