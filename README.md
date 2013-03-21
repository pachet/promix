promix - control flow made easy
======================

###Contents###

1. [Install](#install)
2. [Introduction](#introduction)
3. [API](#api)
	* [promix.when](#when)
	* [chain.and](#and)
	* [chain.or](#or)
	* [chain.then](#then)
	* [chain.as](#as)
	* [chain.[label]](#chain-label)
	* [chain.otherwise](#otherwise)
	* [chain.assert](#assert)
	* [chain.end](#end)
	* [chain.name](#name)
	* [chain.reject](#reject)
4. [Examples](#examples)
	* [In a service](#in-a-service)
	* [In a route](#in-a-route)
5. [License](#license)



<br />

###Install###

`````text
npm install promix
`````

###Introduction###

With promix, you can turn this:
`Ex. 1: Callback Hell`
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
`Ex. 2: Callback Bliss`
`````javascript
function doAsyncStuff ( a, b, c, callback ) {
	promix.when(asyncOne, a).and(asyncTwo, b).and(asyncThree, c).end(callback);
}
`````

promix is a control flow library for JavaScript that makes it easy to chain asynchronous operations together.
If you pass in a function that accepts a trailing callback argument, promix will transform it into a promise and add it to the chain.
You can pass in your own promises, too, if that's your style. promix lets you easily mix the two, and make it out of callback hell in one piece.

###API###

####promix.when()####
	Accept a promise or callback-accepting function, and returns a new chain.

####chain.and()####
	Add a new promise or callback-accepting function as a parallel step in the chain.

####chain.or()####
	Add a new promise or callback-accepting function as a sibling of the current step.
	The first of the siblings to complete will be used.

####chain.then()####
	Add a new promise or function as a sequential step in the chain.
	If you pass a function to `chain.then()`, and don't supply any additional arguments,
	the function will be passed an array of results from all earlier steps in the chain:
	If you supply your own arguments, those arguments will be passed to the function instead:
	



####chain.as()####
	Assign a label to the current step in the chain.
	`````javascript
	var chain = promix.when(foo, 1, 2).as('foo');
	`````
	In addition to living at the current step index on the results array,
	results from steps labelled with `.as()` will be aliased as that label as a property on the results object passed to downstream functions:
	`````javascript
	function async ( a, b, callback ) {
		setTimeout(function ( ) {
			return callback(null, a + b);
		});
	});

	var chain = promise.when(async, 1, 2).as('bar');
	chain.then(function ( results ) {
		//results [0] === results.bar
		console.log(results [0]);
		console.log(results.bar);
	});
	`````
	prints:
	`````text
	3
	3
	`````
	The `chain.as()` method will also dynamically create a new function property

####chain [label]()####
	

####chain.otherwise()####
	Add a new error handler to the chain.
	Any errors that occur will break the chain and be passed to the nearest handler.

####chain.assert()####
	Add an assert function to the chain.
	This function will receive the results from any earlier steps.
	If the assert function returns `true`, the chain will continue.
	If the assert function returns `false`, the chain will break.

####chain.end()####
	Add a single callback to the end of the chain. This callback also acts as an error handler.

####chain.name()####
	Assigns a name to the chain. This is handy for identifying which chain threw an error, for instance.

####chain.reject()####
	Rejects the current chain with the supplied error. If the chain doesn't have an error handler attached, the error will be thrown.

