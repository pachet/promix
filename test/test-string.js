var
	promix = require('../index.js');


function charAt ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toString(promise).charAt(2).then(function ( result ) {
		test.equals(result, 'k');
		test.done();
	}, function ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});

	setTimeout(function ( ) {
		promise.fulfill('pikachu');
	}, 0);
}

function concat ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toString(promise).concat(' is', ' a', ' lightning', ' pokemon').then(function ( result ) {
		test.equals(result, 'pikachu is a lightning pokemon');
		test.done();
	}, function ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});

	setTimeout(function ( ) {
		promise.fulfill('pikachu');
	}, 0);
}

function indexOf ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toString(promise).indexOf('chu').then(function ( result ) {
		test.equals(result, 4);
		test.done();
	}, function ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function ( ) {
		promise.fulfill('pikachu');
	}, 0);
}

function length ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toString(promise).length().then(function ( result ) {
		test.equals(result, 7);
		test.done();
	}, function ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function ( ) {
		promise.fulfill('pikachu');
	}, 0);
}

function match ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toString(promise).match(/charizard/).then(function ( result ) {
		test.equals(result [0], 'charizard');
		test.done();
	}, function ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function ( ) {
		promise.fulfill('pikachu charizard wartortle');
	}, 0);
}

function replace ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toString(promise).replace(/charizard/g, 'beedrill').then(function ( result ) {
		test.equals(result, 'pikachu beedrill wartortle');
		test.done();
	}, function ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function ( ) {
		promise.fulfill('pikachu charizard wartortle');
	}, 0);
}

function split ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toString(promise).split(' ').then(function ( result ) {
		test.equals(result.join('_'), 'pikachu_charizard_wartortle');
		test.done();
	}, function ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function ( ) {
		promise.fulfill('pikachu charizard wartortle');
	}, 0);
}

function slice ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toString(promise).slice(8).then(function ( result ) {
		test.equals(result, 'charizard wartortle');
		test.done();
	}, function ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function ( ) {
		promise.fulfill('pikachu charizard wartortle');
	}, 0);
}

function substr ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toString(promise).substr(8, 9).then(function ( result ) {
		test.equals(result, 'charizard');
		test.done();
	}, function ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function ( ) {
		promise.fulfill('pikachu charizard wartortle');
	}, 0);
}

function substring ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toString(promise).substring(8, 17).then(function ( result ) {
		test.equals(result, 'charizard');
		test.done();
	}, function ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function ( ) {
		promise.fulfill('pikachu charizard wartortle');
	}, 0);
}

function toLowerCase ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toString(promise).toLowerCase().then(function ( result ) {
		test.equals(result, 'charizard');
		test.done();
	}, function ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function ( ) {
		promise.fulfill('CHARIZARD');
	}, 0);
}

function toUpperCase ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toString(promise).toUpperCase().then(function ( result ) {
		test.equals(result, 'CHARIZARD');
		test.done();
	}, function ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function ( ) {
		promise.fulfill('charizard');
	}, 0);
}

function trim ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toString(promise).trim().then(function ( result ) {
		test.equals(result, 'charizard');
		test.done();
	}, function ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function ( ) {
		promise.fulfill('  charizard  ');
	}, 0);
}


function parseFloat ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toString(promise).parseFloat().then(function ( result ) {
		test.equals(result, 1.2345);
		test.done();
	}, function ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function ( ) {
		promise.fulfill('1.2345abc');
	}, 0);
}


function parseInt ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toString(promise).parseInt(10).then(function ( result ) {
		test.equals(result, 123);
		test.done();
	}, function ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function ( ) {
		promise.fulfill('123px');
	}, 0);
}





module.exports = {
	charAt : charAt,
	concat : concat,
	indexOf : indexOf,
	length : length,
	match : match,
	replace : replace,
	split : split,
	slice : slice,
	substr : substr,
	substring : substring,
	toLowerCase : toLowerCase,
	toUpperCase : toUpperCase,
	trim : trim,
	parseFloat : parseFloat,
	parseInt : parseInt
};
