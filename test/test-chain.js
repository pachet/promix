var
	promix = require('../index');

function async ( label, time, callback ) {
	setTimeout(function ( ) {
		if ( label === 'bad' || label === 'worse' ) {
			return void callback(new Error('fail: ' + label));
		}
		return void callback(null, 'pass: ' + label);
	}, time || 0);
}

function and ( test ) {
	var
		chain = promix.when();

	test.expect(5);
	chain.and(async, 'foo', 0).as('foo');
	chain.and(async, 'bar', 1).as('bar');
	chain.then(function ( results ) {
		test.equal(results.foo, 'pass: foo');
		test.equal(results [0], 'pass: foo');
		test.equal(results.bar, 'pass: bar');
		test.equal(results [1], 'pass: bar');
		chain.and(async, 'bad', 0).as('bad');
		chain.then(function ( results ) {
			test.ok(false, 'We should not be here');
			test.done();
		});
		chain.otherwise(function ( error, results ) {
			test.equal(error.toString(), 'Error: fail: bad');
			test.done();
		});
	});
}

function or ( test ) {
	var
		chain_one = promix.when(),
		chain_two = promix.when();

	test.expect(3);
	chain_one.and(async, 'one', 6);
	chain_one.or(async, 'two', 2);
	chain_one.or(async, 'three', 4).as('or');
	chain_one.then(function ( results ) {
		test.equal(results [0], 'pass: two');
		test.equal(results.or, 'pass: two');
		chain_two.or(async, 'four', 3);
		chain_two.or(async, 'five', 2);
		chain_two.or(async, 'bad', 1).as('or');
		chain_two.then(function ( results ) {
			test.ok(false, 'We should not be here');
			test.done();
		});
		chain_two.otherwise(function ( error ) {
			test.equal(error.toString(), 'Error: fail: bad');
			test.done();
		});
	});
}

function then ( test ) {
	var
		chain = promix.when();

	function async_wrapper ( label, delay, callback ) {
		test.equal(chain.results.baz, 'pass: baz');
		test.equal(chain.results [2], 'pass: baz');
		return void async(label, delay, callback);
	}

	test.expect(8);
	chain.and(async, 'foo', 1).as('foo');
	chain.then(function ( results ) {
		chain.and(async, 'bar', 1).as('bar');
	});
	chain.then(function ( results ) {
		test.equal(results [0], 'pass: foo');
		test.equal(results.foo, 'pass: foo');
		test.equal(results [1], 'pass: bar');
		test.equal(results.bar, 'pass: bar');
	});
	chain.and(async, 'baz', 3).as('baz');
	chain.then(async_wrapper, 'boo', 2).as('boo');
	chain.then(function ( results ) {
		test.equal(results [3], 'pass: boo');
		test.equal(results.boo, 'pass: boo');
		test.done();
	});
	chain.otherwise(function ( error ) {
		test.ok(false, 'We should not be here.');
		test.done();
	});
}

function end ( test ) {
	var
		chain_one = promix.when(),
		chain_two = promix.when();
	
	function handler_one ( error, results ) {
		test.equal(error, null);
		test.equal(results [0], 'pass: foo');
		test.equal(results.foo, 'pass: foo');
		test.equal(results [1], 'pass: bar');
		test.equal(results.bar, 'pass: bar');

		chain_two.and(async, 'bad', 1).as('bad');
		chain_two.end(handler_two);
	}

	function handler_two ( error, results ) {
		test.equal(error.toString(), 'Error: fail: bad');
		test.done();
	}

	test.expect(6);
	chain_one.and(async, 'foo', 1).as('foo');
	chain_one.and(async, 'bar', 2).as('bar');
	chain_one.end(handler_one);
}

function stop ( test ) {
	var
		chain = promix.when();

	test.expect(0);
	chain.and(async, 'bar', 2).as('bar');
	chain.stop();
	chain.then(function ( results ) {
		test.ok(false, 'We should not be here.');
		test.done();
	});
	test.done();
}

function suppress ( test ) {
	var
		chain_one = promix.when(),
		chain_two = promix.when();
		
	chain_one.and(async, 'foo', 1).as('foo');
	chain_one.and(async, 'bad', 2).as('bad');
	chain_one.suppress();
	chain_one.then(function ( results ) {
		test.equal(results [0], 'pass: foo');
		test.equal(results.foo, 'pass: foo');
		chain_two.and(async, 'bar', 1).as('bar');
		chain_two.and(async, 'bad', 2).as('bad');
		chain_two.suppress(1);
		chain_two.then(function ( results ) {
			test.ok(true, 'Made it to 1st chokepoint');
			chain_two.and(async, 'worse', 3).as('worse');
		});
		chain_two.then(function ( results ) {
			test.ok(false, 'We should not be here.');
			test.done();
		});
		chain_two.otherwise(function ( error ) {
			test.equal(error.toString(), 'Error: fail: worse');
			test.done();
		});
	});
	chain_one.otherwise(function ( error ) {
		test.ok(false, 'We should not be here.');
		test.done();
	});
}

function assert ( test ) {
	var
		chain_one = promix.when(),
		chain_two = promix.when();

	test.expect(3);
	chain_one.and(async, 'foo', 2).as('foo');
	chain_one.assert(function ( results ) {
		return ( results [0] === 'pass: foo' && results.foo === 'pass: foo' );
	}).as('Test #1 for assertions.');
	chain_one.then(function ( results ) {
		test.equal(results [0], 'pass: foo');
		test.equal(results.foo, 'pass: foo');
		chain_two.and(async, 'bar', 2).as('bar');
		chain_two.assert(function ( results ) {
			return ( results [0] !== 'pass: bar' && results.bar !== 'pass: bar');
		}).as('Test #2 for assertions.');
		chain_two.then(function ( results ) {
			test.ok(false, 'We should not be here');
			test.done();
		});
		chain_two.otherwise(function ( error ) {
			test.equal(error.toString(), 'Error: Domain failed assertion: Test #2 for assertions.');
			test.done();
		});
	});
	chain_one.otherwise(function ( results ) {
		test.ok(false, 'We should not be here.');
		test.done();
	});
}

function promise_compose_success ( test ) {
	var
		promise_one = promix.promise(),
		promise_two = promix.promise(),
		promise_three = promix.promise(),
		promise_four = promix.promise(),
		chain = promix.when();

	function service_one ( a, b, c, d, callback ) {
		setTimeout(function ( ) {
			return void callback(null, a + b + c + d);
		}, 0);
	}

	function service_two ( a, b, c, d, callback ) {
		setTimeout(function ( ) {
			return void callback(null, d + c + b + a);
		}, 0);
	}

	test.expect(2);
	chain.and(service_one, promise_one, 'foo', promise_two, 'bar').as('one');
	chain.and(service_two, promise_three, 'baz', promise_four, 'wat').as('two');
	chain.then(function ( results ) {
		test.equal(results.one, 'pikachufoocharizardbar');
		test.equal(results.two, 'watvenusaurbazvaporeon');
		test.done();
	});
	chain.otherwise(function ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	
	setTimeout(function ( ) {
		promise_one.fulfill('pikachu');
	}, 0);
	setTimeout(function ( ) {
		promise_two.fulfill('charizard');
	}, 0);
	setTimeout(function ( ) {
		promise_three.fulfill('vaporeon');
	}, 0);
	setTimeout(function ( ) {
		promise_four.fulfill('venusaur');
	}, 0);
}



function promise_compose_failure ( test ) {
	var
		promise_one = promix.promise(),
		promise_two = promix.promise(),
		promise_three = promix.promise(),
		promise_four = promix.promise(),
		chain = promix.when();

	function service_one ( a, b, c, d, callback ) {
		setTimeout(function ( ) {
			return void callback(null, a + b + c + d);
		}, 0);
	}

	function service_two ( a, b, c, d, callback ) {
		setTimeout(function ( ) {
			return void callback(null, d + c + b + a);
		}, 0);
	}

	test.expect(1);
	chain.and(service_one, promise_one, 'foo', promise_two, 'bar').as('one');
	chain.and(service_two, promise_three, 'baz', promise_four, 'wat').as('two');
	chain.then(function ( results ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
	chain.otherwise(function ( error ) {
		test.equal(error.toString(), 'Error: This promise will be rejected');
		test.done();
	});
	
	setTimeout(function ( ) {
		promise_one.fulfill('pikachu');
	}, 0);
	setTimeout(function ( ) {
		promise_two.fulfill('charizard');
	}, 0);
	setTimeout(function ( ) {
		promise_three.fulfill('vaporeon');
	}, 0);
	setTimeout(function ( ) {
		promise_four.reject(new Error('This promise will be rejected'));
	}, 0);
}



function introspect_success ( test ) {
	var
		chain = promix.when();

	function async_one ( value, callback ) {
		setTimeout(function ( ) {
			return void callback(null, value * 2);
		}, 0);
	}

	function async_two ( value, callback ) {
		setTimeout(function ( ) {
			return void callback(null, [null, null, value * 4]);
		}, 0);
	}

	function async_three ( value, callback ) {
		setTimeout(function ( ) {
			return void callback(null, { value : value + 1 });
		}, 0);
	}
	
	function async_four ( a, b, c, callback ) {
		test.equal(a, 2);
		test.equal(b, 4);
		test.equal(c, 2);
		setTimeout(function ( ) {
			return void callback(null, c * b - a);
		}, 0);
	}

	test.expect(4);
	chain.and(async_one, 1).as('one');
	chain.and(async_two, 1).as('two');
	chain.and(async_three, 1).as('three');
	chain.then(async_four, chain.one(), chain.two(2), chain.three('value')).as('check');
	chain.then(function ( results ) {
		test.equal(results.check, 6);
		test.done();
	});
	chain.otherwise(function ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
}



module.exports = {
	and : and,
	or : or,
	then : then,
	end : end,
	stop : stop,
	suppress : suppress,
	assert : assert,
	promise_compose_success : promise_compose_success,
	promise_compose_failure : promise_compose_failure,
	introspect_success : introspect_success
};

