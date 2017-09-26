var promix = require('../index.js');


function join(test) {
	test.expect(2);

	function failOne(error) {
		test.ok(false, 'We should not be here');
		test.done();
	}

	function success_one(result) {
		test.equals(result, true);
	}

	function failTwo(error) {
		test.equals(error.toString(), 'Error: The resolver was told to fail.');
		test.done();
	}

	function success_two(result) {
		test.ok(false, 'We should not be here');
		test.done();
	}

	function resolver(succeed, callback) {
		if (succeed) {
			callback(null, true);
		} else {
			callback(new Error('The resolver was told to fail.'));
		}
	}

	resolver(true, promix.join(success_one, failOne));
	resolver(false, promix.join(success_two, failTwo));
}


function compose(test) {
	test.expect(4);

	promix.compose({
		one:   promix.next(1),
		two:   promix.next(2),
		three: promix.next(3),
		four:  promix.next(4)
	}).then(function resolve(result) {
		test.equals(result.one, 1);
		test.equals(result.two, 2);
		test.equals(result.three, 3);
		test.equals(result.four, 4);
		test.done();
	});
}

function concat(test) {
	test.expect(1);

	var
		value_a = 'pikachu ',
		value_b = promix.next('is '),
		value_c = 'an ',
		value_d = promix.next('electric '),
		value_e = 'pokemon';

	promix.concat(
		value_a,
		value_b,
		value_c,
		value_d,
		value_e
	).then(
		function success(result) {
			test.equals(result, 'pikachu is an electric pokemon');
			test.done();
		},
		function failure() {
			test.ok(false, 'We should not be here');
		}
	);
}

function filter(test) {
	test.expect(2);

	var input_array = promix.next([1, 2, 3, 4, 5, 6, 7, 8, 9]);

	function filterFn(element, callback) {
		return void callback(null, element % 2 === 0);
	}

	function handler(error, results) {
		test.equals(error, null);
		test.deepEqual(results, [2, 4, 6, 8]);
		test.done();
	}

	promix.filter(input_array, filterFn).callback(handler);
}

module.exports = {
	join:    join,
	compose: compose,
	concat:  concat,
	filter:  filter
};
