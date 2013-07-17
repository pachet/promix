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

module.exports = {
	compose : compose
};
