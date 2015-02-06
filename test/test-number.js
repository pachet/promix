var
	promix = require('../index.js');

function add ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toNumber(promise).add(2, 3, 4).then(function ( result ) {
		test.equals(result, 14);
		test.done();
	}, function ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function ( ) {
		promise.fulfill(5);
	}, 0);
}

function subtract ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toNumber(promise).subtract(1, 2).then(function ( result ) {
		test.equals(result, 3);
		test.done();
	}, function ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function ( ) {
		promise.fulfill(6);
	}, 0);
}

function multiply ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toNumber(promise).multiplyBy(5).then(function ( result ) {
		test.equals(result, 30);
		test.done();
	}, function ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function ( ) {
		promise.fulfill(6);
	}, 0);
}

function divide ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toNumber(promise).divideBy(3).then(function ( result ) {
		test.equals(result, 3);
		test.done();
	}, function ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function ( ) {
		promise.fulfill(9);
	}, 0);
}

function round ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toNumber(promise).multiplyBy(2).round().then(function ( result ) {
		test.equals(result, 3);
		test.done();
	}, function ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function ( ) {
		promise.fulfill(1.3);
	}, 0);
}

function ceil ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toNumber(promise).divideBy(2).ceil().then(function ( result ) {
		test.equals(result, 2);
		test.done();
	}, function ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function ( ) {
		promise.fulfill(2.8);
	}, 0);
}

function floor ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toNumber(promise).multiplyBy(2).add(0.6).floor().then(function ( result ) {
		test.equals(result, 4);
		test.done();
	}, function ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function ( ) {
		promise.fulfill(2);
	}, 0);
}

function average ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toNumber(promise).add(2).average(4, 5, 6).then(function ( result ) {
		test.equals(result, 4.5);
		test.done();
	}, function ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function ( ) {
		promise.fulfill(1);
	}, 0);
}

function mod ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toNumber(promise).subtract(2).mod(5).then(function ( result ) {
		test.equals(result, 3);
		test.done();
	}, function ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function ( ) {
		promise.fulfill(10);
	}, 0);
}


function pow ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toNumber(promise).add(2).pow(3).then(function ( result ) {
		test.equals(result, 8);
		test.done();
	}, function ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function ( ) {
		promise.fulfill(0);
	}, 0);
}

function abs ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toNumber(promise).add(2).abs().then(function ( result ) {
		test.equals(result, 7.5);
		test.done();
	}, function ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function ( ) {
		promise.fulfill(-9.5);
	}, 0);
}

function max ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toNumber(promise).add(2).max(5, 7, 9).then(function ( result ) {
		test.equals(result, 9);
		test.done();
	}, function ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function ( ) {
		promise.fulfill(2);
	}, 0);
}

function min ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toNumber(promise).add(2).min(5, 7, 9).then(function ( result ) {
		test.equals(result, 4);
		test.done();
	}, function ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function ( ) {
		promise.fulfill(2);
	}, 0);
}

function toFixed ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toNumber(promise).toFixed(4).then(function ( result ) {
		test.equals(result, '1.2346');
		test.done();
	}, function ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function ( ) {
		promise.fulfill(1.23456789);
	}, 0);
}

function toExponential ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toNumber(promise).toExponential().then(function ( result ) {
		test.equals(result, '2.345e+3');
		test.done();
	}, function ( error ) {
		console.log(error);
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function ( ) {
		promise.fulfill(2345);
	}, 0);
}

function toString ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toNumber(promise).add(2).toString().concat('tails').then(function ( result ) {
		test.equals(result, '9tails');
		test.done();
	}, function ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function ( ) {
		promise.fulfill(7);
	}, 0);
}

function toPrecision ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toNumber(promise).toPrecision(3).then(function ( result ) {
		test.equals(result, '2.12e+3');
		test.done();
	}, function ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function ( ) {
		promise.fulfill(2124.00001);
	}, 0);
}

function toLocaleString ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toNumber(promise).toLocaleString().then(function ( result ) {
		test.equals(result, '9');
		test.done();
	}, function ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	setTimeout(function ( ) {
		promise.fulfill(9);
	}, 0);
}





module.exports = {
	add : add,
	subtract : subtract,
	multiply : multiply,
	divide : divide,
	round : round,
	ceil : ceil,
	floor : floor,
	average : average,
	mod : mod,
	pow : pow,
	abs : abs,
	max : max,
	min : min,
	toFixed : toFixed,
	toPrecision : toPrecision,
	toString : toString,
	toExponential : toExponential,
	toLocaleString : toLocaleString
};
