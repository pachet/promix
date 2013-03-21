promix - control flow made easy
======================

###Contents###

1. [Install](#install)
2. [Introduction](#introduction)
3. [API](#api)
	* [promix.when](#when) *
	* [chain.and](#and)
	* [chain.then](#then) *
	* [chain.or](#or)
	* [chain.as](#as)
	* [chain.otherwise](#otherwise) *
	* [chain.assert](#assert) *
	* [chain [label]](#chain-label)
	* [chain.end](#end) *
	* [chain.until](#until) *
	* [chain.reject](#reject)
	* [chain.stop](#stop)
	* [chain.start](#start)
	* [chain.break](#break)
	* [chain.suppress](#suppress)
	* [chain.name](#name)
4. [Examples](#examples)
	* [In a service](#in-a-service)
	* [In a route](#in-a-route)
5. [License](#license)

\* will introduce a sequential breakpoint (nothing beyond the breakpoint will be evaluated until the breakpoint item has returned)



<br />

###Install###

`````text
npm install promix
`````

###Introduction###

With promix, you can turn this:

`````javascript

function doAsyncStuff ( a, b, c, callback ) {
	asyncOne(a, function ( error, responseA ) {
		if ( error ) {
			return callback(error);	
		}
		asyncTwo(b, function ( error, responseB ) {
			if ( error ) {
				return callback(error);
			}
			asyncThree(c, function ( error, responseC ) {
				if ( error ) {
					return callback(error);
				}
				//All done!
				return callback(null, [
					responseA,
					responseB,
					responseC
				]);
			});
		});
	});
}
`````
into this:

`````javascript
function doAsyncStuff ( a, b, c, callback ) {
	promix.when(asyncOne, a).and(asyncTwo, b).and(asyncThree, c).end(callback);
}
`````

promix is a control flow library for JavaScript that makes it easy to chain asynchronous operations together.
If you pass in a function that accepts a trailing callback argument, promix will transform it into a promise and add it to the chain.
You can pass in your own promises, too, if that's your style. promix lets you easily mix the two, and make it out of callback hell in one piece.

###API###

NOTE: The API examples in this section use the following functions in order to illustrate asynchronous behavior:

`````javascript
function asyncOne ( a, b, callback ) {
	setTimeout(function ( ) {
		return callback(null, a + b);
	}, 10);
}

function asyncTwo ( c, d, callback ) {
	setTimeout(function ( ) {
		return callback(null, a * b);
	}, 20);
}

function errorFn ( e, f, callback ) {
	setTimeout(function ( ) {
		return callback(new Error('This function throws errors'));
	}, 30);
}
`````

####promix.when() *
Accept a promise or callback-accepting function, and return a new chain.

Pass a callback-accepting function, with whatever arguments you want to supply (promix creates the trailing callback argument for you):
`````javascript
var chain = when(asyncOne, 1, 2);
`````

Or just pass in a preexisting promise:
`````javascript
var promise = promix.promise();
var chain = promix.when(promise);
`````

####chain.and()
Add a new promise or callback-accepting function as a parallel step in the chain.
`````javascript
var promise = promix.promise();
var chain = when(asyncOne, 1, 2).and(asyncTwo, 3, 4).and(promix) //---> continue adding things as need be!
`````

####chain.then() *
Add a new promise or function as a sequential step in the chain. All prior steps must complete before this step is evaluated.


If you pass a function to `chain.then()` as the only argument,
the function will be passed an array of results from all earlier steps in the chain:

`````javascript
var chain = when(asyncOne, 1, 2).and(asyncTwo, 3, 4).then(function ( results ) {
	console.log(results);

	//[3, 12]
});


`````

If you supply additional arguments to `.then()`, those arguments, as well as a trailing callback created by promix, will be passed to the function instead of the results object:

`````javascript
function someFn ( v1, v2, callback ) {
	setTimeout(function ( ) {
		return callback(v1 + v1 + v1 + ' ' + v2 + v2 + v2);
	}, 50);
}

promix.when(asyncOne, 1, 2).and(asyncTwo, 3, 4).then(someFn, 'a', 'b').then(function ( results ) {
	console.log(results);

	//[3, 12, 'aaa bbb']
});
````` 
In the above case, the chain continues because `someOtherFn` calls the `callback` argument supplied by promix.

If you pass a promise to `chain.then()`, the chain will wait until that promise has been resolved (or rejected) before continuing:

`````javascript
var promise = promix.promise();

setTimeout(function ( ) {
	promise.fulfill(5000);
}, 40);

var chain = when(asyncOne, 1, 2).and(asyncTwo, 3, 4).then(promise).then(function ( results ) {
	console.log(results);
	
	//[3, 12, 5000]
});
`````

A function passed to `chain.then()` can also directly return either **1)** a promise, or, for convenience, **2)** an array with a function at index 0 (just like we've been passing to our other methods) in order to continue the promise chain.

For example:
````javascript
function someOtherfn ( results, callback ) {
	var promise = promix.promise();

	setTimeout(function ( ) {
		promise.fulfill(results [1] - results [0]);
	}, 50);

	return promise;
}

promix.when(asyncOne, 1, 2).and(asyncTwo, 3, 4).then(someFn).then(function ( results ) {
	console.log(results);
	
	//[3, 12, 9]
});
`````


	
####chain.or()
Add a new promise or callback-accepting function as a sibling of the current step.
Only the first sibling to complete will be added to the list of results.
`````javascript
var chain = when(asyncTwo, 3, 4).or(asyncTwo, 1, 2).then(function ( results ) {
	//asyncOne completes first (see above);
	//we only receive asyncOne's result:
	console.log(results [0]);
	console.log(results [1]);

	//3
	//undefined
});
`````


####chain.otherwise() *
Add a new error handler to the chain.
Any errors that occur will break the chain, preventing execution of further steps, and pass to the nearest handler.
`````javascript
var chain = when(asyncOne, 1, 2).and(errorFn, 5, 6).then(function ( results ) {
	//we will never reach this point, because errorFn threw an error
}).otherwise(function ( error ) {
	console.log(error);

	//Error: This function throws errors
});

*NOTE* If you do not attach an error handler using `chain.otherwise()` or `chain.end()` (see [chain.end](#end)),
the error will be thrown.
You can disable this feature by explicitly suppressing errors for your chain (see [chain.suppress]('#suppress)).
`````

####chain.end() *
Add a single callback to the end of the chain. This callback also acts as an error handler.

Callbacks often take the form `function ( error, result ) { }`.
`chain.end()` allows you to pass a single function of this type into the chain;
promix will fork it into a `.then ( results ) { }` success handler and a `.otherwise ( error ) { }` error handler behind the scenes:

`````javascript
function typicalCallback ( error, result ) {
	if ( error ) {
		throw error;
	}
	else {
		console.log(result);

		//[3, 12]
	}
}

promix.when(asyncOne, 1, 2).and(asyncTwo, 3, 4).end(typicalCallback);
`````

####chain.until() *
TBI

####chain.assert() *
Add an assert function to the chain.
This function will receive the results from any earlier steps for you to test.
If your assert function returns `true`, the chain will continue:
`````javascript
promix.when(asyncOne, 1, 2).assert(function ( results ) {
	console.log(results);

	//[3]

	return results [0] === 3;
}).then(asyncTwo, 3, 4).then(function ( results ) {
	console.log(results);

	//[3, 12]
});
`````

If your assert function returns `false`, the chain will break, and an error will be passed to the nearest error handler:
var chain = promix.when(asyncOne, 1, 2);

chain.assert(function ( results ) {
	return results [0] === 4;
});
chain.then(function ( results ) {
	//we will never reach this point
});
chain.otherwise(function ( error ) {
	console.log(error);

	//Error: Chain failed assertion
});


####chain.as()
Assign a label to the current step in the chain.
`````javascript
var chain = promix.when(foo, 1, 2).as('foo');
`````
In addition to living at the current step index on the results array,
results from steps labelled with `.as()` will be aliased as a property on the results object passed to downstream functions:
`````javascript
var chain = promise.when(foo, 1, 2).as('foo');
chain.then(function ( results ) {
	//results [0] === results.foo
	console.log(results [0]);
	console.log(results.foo);

	//3
	//3
});
`````

If you call `chain.as()` after an `.assert()`, you will label that assertion.
If the assertion returns false, the error that promix creates from the failed assertion will be given the label that you passed into `.as()`:

`````javascript
var chain = promix.when(asyncOne, 1, 2).and(asyncTwo, 3, 4);

chain.assert(function ( results ) {
	return results [1] === 14;
}).as('Checking to make sure asyncTwo returned 14');

chain.otherwise(function ( error ) {
	console.log(error);
	
	//Error: Chain failed assertion: Checking to make sure asyncTwo returned 14
});
`````

The `chain.as()` method will also dynamically create a new function property on the chain itself that you can use to create promises to return results from that specific step. See `chain [label]` below.

####chain \[label\]()
Create a promise to return a specific property of the chain result specified by `label`. When the specified result is ready, this promise will be fulfilled with the property at the key you specified. If no property is specified, the entire result will be returned:
`````javascript

function asyncArray ( callback ) {
	setTimeout(function ( ) {
		return callback(null, [ 'pikachu', 'charizard' ]);
	});
}

function asyncObject ( callback ) {
	setTimeout(function ( ) {
		return callback(null, {
			leaf : 'bulbasaur',
			water : 'vaporeon'
		});
	});
}

function additionalFn ( val1, val2, val3 ) {
	console.log(val1);
	console.log(val2);
	console.log(val3);
}

var chain = promix.when(asyncOne, 1, 2).as('one').and(asyncArray).as('array').and(asyncObject).as('object');
chain.then(additionalFn, chain.one(), chain.array(1), chain.object('water'));

//3
//'charizard'
//'vaporeon'
`````
	
####chain.reject()
Explicitly rejects the current chain with the supplied error.

You can pass a string, and promix will create an error for you:

`````javascript
var chain = promix.when(asyncOne, 1, 2);
chain.then(function ( results ) {
	chain.reject(new Error('No good reason'));
	//or just
	chain.reject('No good reason');
}).otherwise(function ( error ) {
	console.log(error);

	//Error: No good reason
});
`````

####chain.stop() *
Stop the execution of any future steps in the chain.

This method is useful if you want to break the chain without introducing an error:
`````javascript
var chain = promix.when(asyncOne, 1, 2);

chain.then(function ( results ) {
	console.log(results);
	
	//[3]
	
	chain.stop();
});

chain.then(function ( results ) {
	//we will not reach this point
});
`````

Note that after calling `chain.stop()`, you can still restart the chain at a later time (see [chain.start](#start)).
If you want to **permanently** halt execution of the chain, ensuring no future steps are executed, use [chain.break](#break).

####chain.start()
Restart a chain that has been stopped. If `chain.stop()` has not been called, this method has no effect.

This method is useful for controlling when sequential steps are executed:
`````javascript
var chain = when(asyncOne, 1, 2).stop();
chain.and(asyncTwo, 3, 4);




`````

####chain.break()
Permanently break the chain, preventing the execution of any subsequent steps.

`````javascript
var chain = promix.when(asyncOne, 1, 2);

chain.then(function ( results ) {
	chain.break();
});

chain.then(function ( results ) {
	//we will never reach this point
});
`````


####chain.suppress()
Prevent uncaught errors that occur within the chain from being thrown:
`````javascript
var chain = promise.when(asyncOne, 1, 2).suppress();

chain.reject(new Error('This error will be suppressed'));

//no error thrown
`````

Obviously, use caution with this one. You don't want your chain to swallow errors forever like that lion cave mouth in Aladdin.


####chain.name()
`````javascript

`````
Assigns a name to the chain. This is handy for identifying which chain threw an error, for instance.




