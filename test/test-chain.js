var
	promix = require('../index'),
	run    = require('../lib/tests/run.js');

var public_methods = [
	'and',
	'andCall',
	'then',
	'thenCall',
	'thenEach',
	'otherwise',
	'as',
	'bind',
	'bindAll',
	'callback',
	'omit',
	'each',
	'end',
	'name',
	'time',
	'done',
	'pipe',
	'andOnce',
	'thenOnce',
	'using'
];

var tests = {
	ensurePublicMethodCoverage: ensurePublicMethodCoverage,
	and:                        and,
	andRecursive:               andRecursive,
	andSyncVsAsync:             andSyncVsAsync,
	andCall:                    andCall,
	then:                       then,
	thenCall:                   thenCall,
	otherwise:                  otherwise,
	as:                         as,
	bind:                       bind,
	bindAll:                    bindAll,
	callback:                   callback,
	omit:                       omit,
	each:                       each,
	thenEach:                   thenEach,
	eachRecursive:              eachRecursive,
	end:                        end,
	name:                       name,
	time:                       time,
	done:                       done,
	pipe:                       pipe,
	last:                       last,
	returnPromise:              returnPromise,
	promise_end:                promise_end,
	promise_compose_success:    promise_compose_success,
	promise_compose_failure:    promise_compose_failure,
	andOnce:                    andOnce,
	thenOnce:                   thenOnce,
	using:                      using,
	conditionalIf:              conditionalIf,
	conditionalIfElse:          conditionalIfElse,
	conditionalElse:            conditionalElse,
	complexConditional:         complexConditional,
	truncatedConditional:       truncatedConditional,
	sleep:                      sleep,
	prepend:                    prepend,
	append:                     append
};

module.exports = tests;

function ensurePublicMethodCoverage(test) {
	test.expect(public_methods.length);

	public_methods.forEach(function each(method) {
		test.ok(
			tests[method] !== undefined,
			'Ensure that a test exists for public method "' + method + '"'
		);
	});

	test.done();
}

function and(test) {
	test.expect(2);

	function async(label, callback) {
		setTimeout(function dispatcher() {
			return void callback(null, 'pass: ' + label);
		}, 0);
	}

	var chain = promix.when();

	chain.and(async, 'foo').as('foo');
	chain.and(async, 'bar').as('bar');
	chain.then(function finisher(results) {
		run(test, function(test) {
			// "chain.and()" should store results by index
			// on the chain results object.
			test.equal(results[0], 'pass: foo');
		});

		run(test, function(test) {
			// "chain.and()" should wait for all steps to complete
			// before advancing to the next step.
			test.equal(results[1], 'pass: bar');
		});

		test.done();
	});
}

function andRecursive(test) {
	test.expect(2);

	var chain = promix.chain();

	function foo(number, callback) {
		chain.and(bar, 'pikachu');
		callback(null);
	}

	function bar(pokemon, callback) {
		callback(null, pokemon.split('').reverse().join(''));
	}

	chain.and(foo, 1);

	chain.then(function finisher(results) {
		run(test, function(test) {
			// Additional actions added while a step is pending
			// should be included as a child action within that step.
			test.equals(results.length, 2);
		});

		run(test, function(test) {
			// Action results from the same step should be
			// enumerated in the correct order, even when one
			// is added within the handler function of a sibling.
			test.equals(results[1], 'uhcakip');
		});

		test.done();
	});
}

function andSyncVsAsync(test) {
	test.expect(2);

	var chain = promix.chain();

	function getNumberSync(number, callback) {
		return void callback(null, number);
	}

	function getNumberAsync(number, callback) {
		setTimeout(function deferred() {
			return void callback(null, number);
		}, 0);
	}

	function addNumbers(one, two, callback) {
		test.equals(one, 1);
		test.equals(two, 2);
		test.done();
	}

	chain.and(getNumberAsync, 1).as('one');
	chain.and(getNumberSync, 2).as('two');

	chain.and(addNumbers, chain.one, chain.two);
}

function andCall(test) {
	test.expect(3);

	var chain = promix.when(),
		context = { };

	function monotonic(callback) {
		var args = arguments,
			actual_context = this;

		run(test, function(test) {
			// The only argument passed to this function
			// should be the continuation callback.
			test.equal(args.length, 1);
		});

		run(test, function(test) {
			// The execution context for the handler
			// should be the one we specified in ".andCall()"
			test.equal(actual_context, context);
		});

		callback(null, 'baz');
	}

	function async(label, callback) {
		setTimeout(function dispatcher() {
			return void callback(null, 'pass: ' + label);
		}, 0);
	}

	test.expect(3);

	chain.and(async, 'foo').as('foo');
	chain.andCall(monotonic, context).as('bar');
	chain.then(function finisher(results) {
		run(test, function(test) {
			// Straightforward test to make sure
			// the value supplied by action is
			// propagated to the results object.
			test.equals(results.bar, 'baz');
		});

		test.done();
	});
}

function then(test) {
	test.expect(8);

	var chain = promix.when();

	function async(label, time, callback) {
		setTimeout(function dispatcher() {
			return void callback(null, 'pass: ' + label);
		}, time || 0);
	}

	function asyncWrapper(label, delay, callback) {

		run(test, function(test) {
			// "chain.then()" should create the correct result aliases
			test.equal(chain.results.baz, 'pass: baz');
		});

		run(test, function(test) {
			// "chain.then()" should index results at the correct index
			test.equal(chain.results[2], 'pass: baz');
		});

		return void async(label, delay, callback);
	}

	chain.and(async, 'foo', 1).as('foo');

	chain.then(function interstitial(results) {
		chain.and(async, 'bar', 1).as('bar');
	});

	chain.then(function interstitial(results) {
		test.equal(results[0], 'pass: foo');
		test.equal(results.foo, 'pass: foo');
		test.equal(results[1], 'pass: bar');
		test.equal(results.bar, 'pass: bar');
	});

	chain.and(async, 'baz', 3).as('baz');
	chain.then(asyncWrapper, 'boo', 2).as('boo');

	chain.then(function interstitial(results) {
		test.equal(results[3], 'pass: boo');
		test.equal(results.boo, 'pass: boo');
		test.done();
	});

	chain.otherwise(function failure(error) {
		test.ok(false, 'We should not be here.');
		test.done();
	});
}

function thenCall(test) {
	test.expect(3);

	var chain = promix.when(),
		context = { };

	function async(label, callback) {
		setTimeout(function dispatcher() {
			return void callback(null, 'pass: ' + label);
		}, 0);
	}

	function monotonic(callback) {
		var actual_context = this,
			args = arguments;

		run(test, function(test) {
			// The context in the monotonic handler
			// should be the same one we specified.
			test.equal(actual_context, context);
		});

		run(test, function(test) {
			// The only argument passed to the monotonic handler
			// should be the chain's continuation callback.
			test.equal(args.length, 1);
		});

		return void setTimeout(function deferred() {
			callback(null, 'baz');
		}, 0);
	}

	chain.and(async, 'foo').as('foo');
	chain.thenCall(monotonic, context).as('bar');
	chain.then(function finisher(results) {
		run(test, function(test) {
			// The value returned from the monotonic handler
			// should be properly enumerated on the results object.
			test.equals(results.bar, 'baz');
		});

		test.done();
	});
}

function otherwise(test) {
	test.expect(4);

	run(test, function(test) {
		// Test to make sure that errors are forwarded to
		// subsequent error handlers added with ".otherwise()"
		var chain = promix.chain();

		chain.andCall(function(callback) {
			callback(new Error('test error 1'));
		});

		chain.otherwise(function(error) {
			test.equal(error.toString(), 'Error: test error 1');
		});
	});

	run(test, function(test) {
		// Test to make sure that errors are forwarded to
		// earlier error handlers added with ".otherwise()"
		var chain = promix.chain();

		chain.otherwise(function(error) {
			test.equal(error.toString(), 'Error: test error 2');
		});

		chain.andCall(function(callback) {
			callback(new Error('test error 2'));
		});
	});

	run(test, function(test) {
		// If a specified error handler throws its own error
		// while handling the chain error it is supplied,
		// the new error should be passed to earlier handlers.
		var chain = promix.chain();

		chain.otherwise(function(error) {
			test.equal(error.toString(), 'Error: replaced error');
		});

		chain.andCall(function(callback) {
			callback(new Error('original error'));
		});

		chain.otherwise(function(error) {
			throw new Error('replaced error');
		});
	});

	run(test, function(test) {
		// If an action throws an error while being executed,
		// the error should be forwarded to the correct error handler.
		var chain = promix.chain();

		chain.andCall(function(callback) {
			throw new Error('test error 3');
		});

		chain.otherwise(function(error) {
			test.equal(error.toString(), 'Error: test error 3');

			setTimeout(function() {
				// Wait until the other tests have finished (hopefully):
				test.done();
			}, 10);
		});
	});

}

function as(test) {
	test.expect(4);

	function async(label, callback) {
		setTimeout(function dispatcher() {
			return void callback(null, label);
		}, 0);
	}

	var chain = promix.chain();

	chain.and(async, 'foo').as('foo');
	chain.and(async, 'bar').as('bar');

	chain.then(function(results) {
		test.equals(results.foo, 'foo');
		test.equals(results[0], results.foo);
		test.equals(results.bar, 'bar');
		test.equals(results[1], results.bar);

		test.done();
	});
}

function callback(test) {
	test.expect(6);

	var chain_one = promix.when(),
		chain_two = promix.when();

	function async(label, time, callback) {
		setTimeout(function dispatcher() {
			if (label === 'bad' || label === 'worse') {
				return void callback(new Error('fail: ' + label));
			}

			return void callback(null, 'pass: ' + label);
		}, time || 0);
	}

	function handlerOne(error, results) {
		run(test, function(test) {
			// Ensure that no error is passed into the callback handler.
			test.equal(error, null);
		});

		run(test, function(test) {
			// Ensure that the correct results object is passed to the handler.
			test.equal(results [0], 'pass: foo');
			test.equal(results.foo, 'pass: foo');
			test.equal(results [1], 'pass: bar');
			test.equal(results.bar, 'pass: bar');
		});

		chain_two.and(async, 'bad', 1).as('bad');
		chain_two.callback(handlerTwo);
	}

	function handlerTwo(error, results) {
		run(test, function(test) {
			// The handler added via .callback()
			// should be used as the chain's error handler,
			// if an error actually occurs.
			test.equal(error.toString(), 'Error: fail: bad');
		});

		test.done();
	}

	chain_one.and(async, 'foo', 1).as('foo');
	chain_one.and(async, 'bar', 2).as('bar');
	chain_one.callback(handlerOne);
}

function bind(test) {
	test.expect(2);

	run(test, function(test) {
		// Make sure that bound actions are executed
		// within the proper context.
		var chain = promix.chain();

		var cat = {
			sound: 'meow',
			error: function() {
				test.equals(this.sound, 'meow');
				test.done();
			}
		};

		function talk(callback) {
			callback(null, this.sound);
		}

		chain.andCall(talk).bind(cat);

		chain.then(function(results) {
			test.equal(results[0], 'meow');

			throw new Error('cat error');
		});

		chain.otherwise(cat.error).bind(cat);
	});
}

function bindAll(test) {
	test.expect(3);

	var context = {
		name: 'bowser'
	};

	var chain = promix.chain();

	chain.andCall(function a(callback) {
		test.equals(this, context);
		callback(null);
	});

	chain.andCall(function b(callback) {
		test.equals(this, context);
		callback(new Error('something'));
	});

	chain.otherwise(function c() {
		test.equals(this, context);
		test.done();
	});

	chain.bindAll(context);
}

function last(test) {
	var chain = promix.chain();

	test.expect(1);

	function asyncOne(a, b, callback) {
		setTimeout(function dispatcher() {
			return callback(null, a + b);
		}, 1);
	}

	function asyncTwo(c, d, callback) {
		setTimeout(function dispatcher() {
			return callback(null, c * d);
		}, 2);
	}

	chain.and(asyncOne, 2, 3);
	chain.then(asyncTwo, chain.last, chain.last).as('result');
	chain.then(function interstitial( results ) {
		test.equals(results.result, 25);
		test.done();
	});
}

function each(test) {
	test.expect(6);

	var chain = promix.chain();

	var values = [
		'foo',
		'bar',
		'baz'
	];

	var index = 0;

	function checker(value, callback) {
		test.equals(value, values [index++]);

		callback(null, value.split('').reverse().join(''));
	}

	function callback(results) {
		var index = results.length;

		while (index--) {
			test.equals(
				results[index],
				values[index].split('').reverse().join('')
			);
		}

		test.done();
	}

	chain.each(values, checker);
	chain.then(callback);
}


function eachRecursive(test) {
	test.expect(4);

	function reverse(value) {
		return value.split('').reverse().join('');
	}

	function foo(value, callback) {
		return void callback(null, reverse(value));
	}

	function bar(value, callback) {
		return void callback(null, reverse(value));
	}

	function getList(path, callback) {
		setTimeout(function deferred() {
			return void callback(null, [
				'pikachu',
				'charizard',
				'blastoise'
			]);
		});
	}

	var chain = promix.chain();

	chain.and(getList, 'test').as('list');
	chain.each(chain.list, function each(item, callback) {
		chain.and(foo, item);
		chain.and(bar, chain.last).as(item);
		callback(null);
	});

	chain.then(function finisher(results) {
		test.equals(results.length, 10);
		test.equals(results.pikachu, 'pikachu');
		test.equals(results.charizard, 'charizard');
		test.equals(results.blastoise, 'blastoise');

		test.done();
	});
}

function omit(test) {
	test.expect(3);

	function asyncFn(value, callback) {
		setTimeout(function() {
			return void callback(null, value);
		}, 0);
	}

	var chain = promix.chain();

	chain.and(asyncFn, 'foo').as('foo');
	chain.and(asyncFn, 'bar').as('bar').omit();
	chain.and(asyncFn, 'baz').as('baz');
	chain.and(asyncFn, 'wat').omit();
	chain.and(asyncFn, 'biz').as('biz');
	chain.and(asyncFn, 'bam').as('bam').omit();

	chain.then(function(results) {
		test.equals(results.length, 3);
		test.equals(results.bar, undefined);
		test.equals(results.bam, undefined);
		test.done();
	});

}

function end(test) {
	test.expect(3);

	function asyncFn(value, callback) {
		setTimeout(function() {
			return void callback(null, value);
		}, 0);
	}

	function endFn(a, b) {
		test.equals(arguments.length, 2);
		test.equals(a, 'one');
		test.equals(b, 'two');
		test.done();
	}

	var chain = promix.chain();

	chain.and(asyncFn, 'foo');
	chain.end(endFn, 'one', 'two');
}

function name(test) {
	test.expect(1);

	var chain = promix.chain();

	chain.name('foo');

	test.equals(chain.namespace, 'foo');
	test.done();
}

function time(test) {
	test.expect(3);

	var chain = promix.chain();

	function slowFn(delay, callback) {
		setTimeout(function() {
			callback(null);
		}, delay);
	}

	function getRandomDelay() {
		return Math.floor(Math.random() * 200) + 100;
	}

	chain.time().name('foo');
	chain.and(slowFn, getRandomDelay()).as('bar');
	chain.and(slowFn, getRandomDelay()).as('bar');
	chain.then(function(results) {
		test.equals(
			promix.getStats('bar'),
			undefined
		);

		var stats = promix.getStats('foo.bar');

		test.equals(
			stats.count,
			2
		);

		test.ok(stats.total >= 200);

		test.done();
	});
}

function done(test) {
	test.expect(0);

	var chain = promix.chain();

	chain.done();
	chain.and(function() {
		run(test, function(test) {
			// Make sure that actions added after "chain.done()"
			// is called do not get dispatched:
			test.ok(false);
		});
	});

	setTimeout(function() {
		test.done();
	}, 0);
}

function returnPromise(test) {
	test.expect(2);

	run(test, function(test) {
		// Ensure that promises that are fulfilled
		// after their parent action is executed
		// are correctly assigned as the result of that action.
		function promiseReturner(value) {
			var promise = promix.promise();

			setTimeout(function() {
				promise.fulfill(value);
			}, 0);

			return promise;
		}

		var chain = promix.chain();

		chain.and(promiseReturner, 'foo');
		chain.then(function(results) {
			test.equal(results[0], 'foo');
		});
	});

	run(test, function(test) {
		// Ensure that promises that are rejected
		// after their parent action is executed
		// are correctly forwarded to the chain's error handler.
		function promiseReturner(value) {
			var promise = promix.promise();

			setTimeout(function() {
				promise.break(new Error('test error'));
			}, 10);

			return promise;
		}

		var chain = promix.chain();

		chain.and(promiseReturner, 'foo');
		chain.otherwise(function(error) {
			test.equal(error.toString(), 'Error: test error');
			test.done();
		});
	});
}

function promise_end(test) {
	var
		chain  = promix.chain(),
		object = { };

	function service_one(value, callback) {
		setTimeout(function() {
			callback(null, {
				foo: 'bar',
				baz: 'wat'
			});
		}, 0);
	}

	test.expect(2);
	object.resolution = function jeffson() {
		test.done();
	};
	object.callback = function persimmon(result) {
		test.equals(result.foo, 'bar');
		test.equals(result.baz, 'wat');
		this.resolution();
	};
	chain.and(service_one, 1).as('one');
	chain.end(object.callback, chain.one).bind(object);
	chain.otherwise(function(error) {
		test.ok(false, 'We should not be here');
		test.done();
	});
}

function promise_compose_success(test) {
	var
		promise_one   = promix.promise(),
		promise_two   = promix.promise(),
		promise_three = promix.promise(),
		promise_four  = promix.promise(),
		chain         = promix.when();

	function service_one(a, b, c, d, callback) {
		setTimeout(function() {
			return void callback(null, a + b + c + d);
		}, 0);
	}

	function service_two(a, b, c, d, callback) {
		setTimeout(function() {
			return void callback(null, d + c + b + a);
		}, 0);
	}

	test.expect(2);
	chain.and(service_one, promise_one, 'foo', promise_two, 'bar').as('one');
	chain.and(service_two, promise_three, 'baz', promise_four, 'wat').as('two');
	chain.then(function(results) {
		test.equal(results.one, 'pikachufoocharizardbar');
		test.equal(results.two, 'watvenusaurbazvaporeon');
		test.done();
	});
	chain.otherwise(function(error) {
		test.ok(false, 'We should not be here');
		test.done();
	});

	setTimeout(function() {
		promise_one.fulfill('pikachu');
	}, 0);
	setTimeout(function() {
		promise_two.fulfill('charizard');
	}, 0);
	setTimeout(function() {
		promise_three.fulfill('vaporeon');
	}, 0);
	setTimeout(function() {
		promise_four.fulfill('venusaur');
	}, 0);
}



function promise_compose_failure(test) {
	var
		promise_one   = promix.promise(),
		promise_two   = promix.promise(),
		promise_three = promix.promise(),
		promise_four  = promix.promise(),
		chain         = promix.when();

	function service_one(a, b, c, d, callback) {
		setTimeout(function() {
			return void callback(null, a + b + c + d);
		}, 0);
	}

	function service_two(a, b, c, d, callback) {
		setTimeout(function() {
			return void callback(null, d + c + b + a);
		}, 0);
	}

	test.expect(1);
	chain.and(service_one, promise_one, 'foo', promise_two, 'bar').as('one');
	chain.and(service_two, promise_three, 'baz', promise_four, 'wat').as('two');
	chain.then(function(results) {
		test.ok(false, 'We should not be here');
	});
	chain.otherwise(function(error) {
		test.equal(error.toString(), 'Error: This promise will be rejected');
		test.done();
	});

	setTimeout(function() {
		promise_one.fulfill('pikachu');
	}, 0);
	setTimeout(function() {
		promise_two.fulfill('charizard');
	}, 0);
	setTimeout(function() {
		promise_three.fulfill('vaporeon');
	}, 0);
	setTimeout(function() {
		promise_four.break(new Error('This promise will be rejected'));
	}, 0);

}


function thenEach( test ) {
	test.expect(7);

	var index = 0;

	function asyncFn(value, callback) {
		var frozen_index = index;

		setTimeout(function deferred() {
			test.equals(
				index,
				frozen_index,
				'Make sure that `thenEach` sequence is executed serially, ' +
				'not in parallel'
			);

			index++;

			callback(null, value.split('').reverse().join(''));
		}, 10);
	}

	var chain = promix.chain();

	var array = [
		'pikachu',
		'charizard',
		'vaporeon'
	];

	chain.thenEach(array, asyncFn);

	chain.then(function finisher(results) {
		test.equals(results.length, array.length);

		var index = 0;

		while (index < array.length) {
			test.equals(
				results[index],
				array[index].split('').reverse().join('')
			);
			index++;
		}

		test.done();
	});

}



function pipe(test) {
	test.expect(6);

	function asyncOne(str, callback) {
		setTimeout(function() {
			callback(null, str.split('').reverse().join(''));
		}, 0);
	}

	function asyncTwo(str1, str2, callback) {
		test.equals(str1, 'bar');
		test.equals(str2, 'foo');
		setTimeout(function() {
			callback(null, str1 + '-' + str2);
		}, 0);
	}

	function asyncThree(str1, str2, str3, callback) {
		test.equals(str1, 'baz');
		test.equals(str2, 'wat');
		test.equals(str3, 'bar-foo');
		setTimeout(function() {
			callback(null, str1 + '-' + str2 + '-' + str3);
		}, 0);
	}

	promix.chain(asyncOne, 'oof')
		.pipe(asyncTwo, 'bar')
		.pipe(asyncThree, 'baz', 'wat')
		.pipe(function finisher( result ) {
			test.equals(result, 'baz-wat-bar-foo');
			test.done();
		})
		.otherwise(function failure( error ) {
			test.ok(false, error.toString());
		});
}

function andOnce(test) {
	test.expect(4);

	var events = require('events'),
		emitter = new events.EventEmitter();

	var chain = promix.chain();

	chain.andOnce(emitter, 'foo').as('foo');
	chain.andOnce(emitter, 'bar').as('bar');

	chain.then(function(results) {
		test.equals(results[0], 16);
		test.equals(results.foo, 16);
		test.equals(results[1], 32);
		test.equals(results.bar, 32);
		test.done();
	});

	setTimeout(function() {
		emitter.emit('foo', 16);
	}, 5);

	setTimeout(function() {
		emitter.emit('bar', 32);
	}, 10);
}

function thenOnce(test) {
	test.expect(5);

	var events = require('events'),
		emitter = new events.EventEmitter();

	var chain = promix.chain();

	var flag = false;

	chain.and(function(dummy, callback) {
		setTimeout(function() {
			// Set the flag indicating that this setTimeout() call was
			// invoked before the subsequent andCall() callback.
			flag = true;
			callback(null, 'asdf');
		}, 10);
	}, null).as('delay');

	chain.thenOnce(emitter, 'foo').as('foo');

	chain.andCall(function(callback) {
		test.equals(flag, true);

		callback(null);
	});

	chain.then(function(results) {
		test.equals(results.delay, 'asdf');
		test.equals(results[0], 'asdf');
		test.equals(results.foo, 16);
		test.equals(results[1], 16);
		test.done();
	});

	emitter.emit('foo', 16);
}

function using(test) {
	test.expect(1);

	function deferred(dummy, callback) {
		callback(null, 1234);
	}

	function downstream(value, callback) {
		test.equals(value, 1234);
		test.done();
	}

	var chain = promix.chain();

	chain.and(deferred, 'abcd').as('deferred');
	chain.and(downstream).using('deferred');
}

function conditionalIf(test) {
	test.expect(2);

	var chain = promix.chain();

	function deferred_a(a, b, callback) {
		test.equals(a, 1);
		test.equals(b, 2);
		callback(null);
	}

	function deferred_b(a, b, callback) {
		test.ok(false, 'We should not be here');
		test.done();
	}

	function deferred_c() {
		test.ok(false, 'We should not be here');
		test.done();
	}

	var promise_a = promix.next(true),
		promise_b = promix.next(false);

	chain.if(promise_a).then(deferred_a, 1, 2).as('a');
	chain.elseIf(promise_b).then(deferred_b, 3, 4).as('b');
	chain.else(deferred_c).as('c');
	chain.endIf();
	chain.then(function handler() {
		test.done();
	}).as('d');
}

function conditionalIfElse(test) {
	test.expect(2);

	var chain = promix.chain();

	function deferred_a(a, b, callback) {
		test.ok(false, 'We should not be here (1)');
		test.done();

	}

	function deferred_b(a, b, callback) {
		test.equals(a, 3);
		test.equals(b, 4);
		callback(null);
	}

	function deferred_c() {
		test.ok(false, 'We should not be here (2)');
		test.done();
	}

	chain.if(promix.next(false)).then(deferred_a, 1, 2).as('a');
	chain.elseIf(promix.next(true)).then(deferred_b, 3, 4).as('b');
	chain.else(deferred_c).as('c');
	chain.endIf();
	chain.then(function handler() {
		test.done();
	}).as('d');
}

function conditionalElse(test) {
	test.expect(2);

	var chain = promix.chain();

	function deferred_a(a, b, callback) {
		test.ok(false, 'We should not be here');
		test.done();

	}

	function deferred_b(a, b, callback) {
		test.ok(false, 'We should not be here');
		test.done();
	}

	function deferred_c(a, b, callback) {
		test.equals(a, 5);
		test.equals(b, 6);
		callback(null);
	}

	chain.if(promix.next(false)).then(deferred_a, 1, 2).as('a');
	chain.elseIf(promix.next(false)).then(deferred_b, 3, 4).as('b');
	chain.else(deferred_c, 5, 6).as('c');
	chain.endIf();
	chain.then(function handler() {
		test.done();
	}).as('d');
}

function complexConditional(test) {
	test.expect(6);

	var chain = promix.chain();

	chain.if(promix.next(true)).then(function interstitial() {
		test.ok(true, 'It is okay that we are here');
	});

	chain.elseIf(promix.next(false)).then(function interstitial() {
		test.ok(false, 'We should not be here');
		test.done();
	});

	chain.else(function interstitial() {
		test.ok(false, 'We should not be here');
		test.done();
	});

	chain.then(function interstitial() {
		test.ok(false, 'We should not be here');
		test.done();
	});

	chain.if(promix.next(false)).then(function interstitial() {
		test.ok(false, 'We should not be here');
		test.done();
	});

	chain.elseIf(promix.next(true).equals(true)).then(function interstitial() {
		test.ok(true, 'It is okay that we are here');
	});

	chain.else(function interstitial() {
		test.ok(false, 'We should not be here');
		test.done();
	});

	chain.endIf();

	chain.then(function interstitial() {
		test.ok(true, 'It is okay that we are here');
	});

	chain.if(promix.next(false).equals(true)).then(function interstitial() {
		test.ok(false, 'We should not be here');
		test.done();
	});

	chain.elseIf(promix.next(false)).then(function interstitial() {
		test.ok(false, 'We should not be here');
		test.done();
	});

	chain.else(function interstitial() {
		test.ok(true, 'It is okay that we are here');
	});

	chain.then(function interstitial() {
		test.ok(true, 'It is okay that we are here');
	});

	chain.endIf();

	chain.then(function finisher() {
		test.ok(true, 'It is okay that we are here');
		test.done();
	});
}

function truncatedConditional(test) {
	var file_path = '/foo/bar/baz.txt';

	var chain = promix.chain();

	function isDirectoryAbstracted(path, callback) {
		test.ok(true, 'isDirectory called');

		setTimeout(function deferred() {
			callback(null, false);
		}, 1);
	}

	chain.and(isDirectoryAbstracted, file_path);

	function rmdirAbstracted(path, callback) {
		test.ok(false, 'We should not be here');
		test.done();
	}

	function unlinkAbstracted(path, callback) {
		test.ok(true, 'unlink called');

		setTimeout(function deferred() {
			callback(null);
		}, 1);
	}

	chain
		.if(chain.last)
		.then(rmdirAbstracted, file_path)
		.else(unlinkAbstracted, file_path)
		.endIf();

	function getParentDirectory(file_path) {
		return '/foo/bar';
	}

	var parent_directory = getParentDirectory(file_path);

	function readdirAbstracted(path, callback) {
		test.ok(true, 'readdir called');

		setTimeout(function deferred() {
			return void callback(null, [
				'pikachu',
				'bowser',
				'mario'
			]);
		}, 1);
	}

	chain.then(readdirAbstracted, parent_directory);

	function deleteFileAbstracted(path, callback) {
		test.ok(false, 'We should not be here');
		test.done();
	}

	chain
		.if(chain.last.get('length').equals(0))
		.then(deleteFileAbstracted, parent_directory)
		.endIf();

	function abstractedCallback(error, results) {
		test.ok(true, 'We are here! This is good');
		test.done();
	}

	chain.callback(abstractedCallback);
}

function sleep(test) {
	test.expect(1);

	var chain = promix.chain();

	var failure_timer = setTimeout(function deferred() {
		test.ok(false, 'We should not be here');
	}, 1000);

	setTimeout(function deferred() {
		test.ok(true, 'We should be here');
	}, 250);

	chain.sleep(500).then(function deferred() {
		clearTimeout(failure_timer);
		test.done();
	});
}

function prepend(test) {
	var
		chain        = promix.chain(),
		global_error = new Error('test error');

	chain.prepend('pikachu');

	function foo(pokemon, a, b, callback) {
		test.equals(pokemon, 'pikachu');
		test.equals(a, 123);
		test.equals(b, 456);

		return void callback(null);
	}

	function bar(pokemon, a, b, callback) {
		test.equals(pokemon, 'pikachu');
		test.equals(a, 789);
		test.equals(b, 101112);

		return void callback(global_error);
	}

	function failure(error) {
		test.equals(error, global_error);
		test.done();
	}

	chain.and(foo, 123, 456);
	chain.and(bar, 789, 101112);
	chain.otherwise(failure);
}

function append(test) {
	var
		chain        = promix.chain(),
		global_error = new Error('test error');

	chain.append('charizard');

	function foo(a, b, callback, pokemon) {
		test.equals(a, 123);
		test.equals(b, 456);
		test.equals(pokemon, 'charizard');
		return void callback(null);
	}

	function bar(a, b, callback, pokemon) {
		test.equals(a, 789);
		test.equals(b, 101112);
		test.equals(pokemon, 'charizard');
		return void callback(global_error);
	}

	function failure(error, pokemon) {
		test.equals(error, global_error);
		test.equals(pokemon, 'charizard');
		test.done();
	}

	chain.and(foo, 123, 456);
	chain.and(bar, 789, 101112);
	chain.otherwise(failure);
}


