var
	promix = require('../index.js');

function compose ( test ) {
	test.expect(4);
	promix.compose({
		one : promix.next(1),
		two : promix.next(2),
		three : promix.next(3),
		four : promix.next(4)
	}).then(function resolve ( result ) {
		test.equals(result.one, 1);
		test.equals(result.two, 2);
		test.equals(result.three, 3);
		test.equals(result.four, 4);
		test.done();
	});
}


function concat ( test ) {
	var
		promise_one = promix.next('bar'),
		promise_two = promix.next('wat');

	test.expect(1);
	promix.concat('foo', promise_one, 'baz', promise_two).then(function success ( result ) {
		test.equals(result, 'foobarbazwat');
		test.done();
	}, function failure ( error ) {
		test.ok(false, 'We should not be here.');
		test.done();
	});
}

module.exports = {
	compose : compose,
	concat : concat
};
