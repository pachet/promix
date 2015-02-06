#Promix
###Mix promises with callbacks for improved control flow

Promix is a way to regain control of asynchronous code.

**Before:**
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
**After:**
`````javascript
function doAsyncStuff ( a, b, c, callback ) {
	promix.chain(asyncOne, a)
		.and(asyncTwo, b)
		.and(asyncThree, c)
		.end(callback);
}
`````


##Contents

1. [Install](#install)
2. [Introduction](#introduction)
4. [Examples](#examples)
3. [API](#api)
5. [License](#license)
6. [Notes](#notes)

<br />

##Install

`````text
npm install promix
`````

<br />
##Introduction

Promix is a control flow library for JavaScript that makes it easy to chain asynchronous operations together.
If you pass in a function that accepts a trailing callback argument, Promix will transform it into a promise and add it to the chain.
You can pass in your own promises, too, if that's your style. Promix lets you easily mix the two, and make it out of callback hell in one piece.


<br />
##Examples

<br />
###In the browser

`````javascript
var $wrapper = $('#wrapper');
var offset = 0;
var loading = false;
var wrapperHeight = 0;

function loadEntries ( category, start ) {
	return $.get('/news/' + category + '/entries/?start=' + start);
}

function loadImageFor ( entry ) {
	var promise = promix.promise();
	var image = new Image();
	image.onload = function ( ) {
		promise.fulfill();
	};
	image.src = '/images/' + entry.thumbnail;

	return promise;
}

function addEntries ( entries ) {
	$wrapper.append(Handlebars.templates.entries(entries));
	loading = false;
	wrapperHeight = $wrapper.height();
}

//Load the list of entries from the server,
//wait for the first image to load, then show the list:
function showNextEntries ( ) {
	loading = true;
	offset += 10;
	var chain = promix.chain(loadEntries, 'javascript', offset).as('entries');
	chain.then(loadImageFor, chain.entries(0));
	chain.then(addEntries, chain.entries());
	chain.then($.fn.fadeIn).bind($wrapper).otherwise(showError);
}

showNextEntries();
`````

<br />
###In a service

`````javascript
//Return the 10 most recent entries:
function getEntries ( category, offset, callback ) {
	var query = [
		'SELECT uuid, title, thumbnail, author, description, body, date',
		'FROM Entries WHERE active = 1 AND category = ?',
		'ORDER BY date DESC LIMIT 10 OFFSET ?'
	];
	promix.chain(sql.query, query.join(' '), [category, offset]).end(callback);
}
`````

<br />
###In a route
`````javascript
//Request entries and send them back as JSON:
router.get('/news/:category/entries/', function ( request, response, next ) {
	promix.chain(getEntries, request.params.category, request.query.offset)
		.then(response.send).as('json')
		.otherwise(next);
});
`````

<br />
###As a generator
`````javascript
//Recycling the showNextEntries function from the first example:
var generator = promix.chain(showNextEntries).stop().until(false);
var $window = $(window);

$window.on('scroll', function ( event ) {
	if ( loading ) {
		return;
	}
	if ( $window.scrollTop() > wrapperHeight - 200 ) {
		generator.start();
	}
});
`````


<br />
##API

**NOTE:** The API examples in this section use the following functions in order to illustrate asynchronous behavior:

`````javascript
function asyncOne ( a, b, callback ) {
	setTimeout(function ( ) {
		return callback(null, a + b);
	}, 10);
}

function asyncTwo ( c, d, callback ) {
	setTimeout(function ( ) {
		return callback(null, c * d);
	}, 20);
}

function errorFn ( label, callback ) {
	setTimeout(function ( ) {
		return callback(new Error('This function throws errors (' + label + ')'));
	}, 30);
}
`````

<br />
##promix
The `promix` object exposes all of the functionality of the Promix library.

Require it in Node.js:
> **var promix = require('promix');**

Or load it in your browser:
> **&lt;script src="promix.min.js"&gt;&lt;/script&gt;**

<br />
###promix.chain() [\*](#breakpoints)
Accept an optional promise or callback-accepting function, and return a new chain.


Usage:
> **promix.chain( promise )**

> **promix.chain( function [, arguments ] )**

Pass a callback-accepting function, with whatever arguments you want to supply (Promix creates the trailing callback argument for you):
`````javascript
var chain = promix.chain(asyncOne, 1, 2);
`````

Or just pass in a preexisting promise:
`````javascripts
var promise = promix.promise();
var chain = promix.chain(promise);
`````

<br />
###promix.promise()
Create a new promise.

Usage:
> **promix.promise( [base object] )**

This promise is Promises/A+ compliant, meaning it exposes a `.then()` method that can be used to attach success and error handlers:
`````javascript
var promise = promix.promise();

function success ( result ) {
	console.log(result);

	//vaporeon
}

function failure ( error ) {
	//our promise wasn't rejected,
	//so we won't reach this
}

promise.then(success, failure);
promise.fulfill('vaporeon');
`````

You can pass an optional object to `.promise()`, and that object will inherit the `.then()`, `.fulfill()`, and `.reject()` methods.
`````javascript
var promise = promix.promise({
	foo : 'foo',
	bar : 'bar',
	baz : 'baz'
});

console.log(promise);

//	{
//		foo : 'foo',
//		bar : 'bar',
//		baz : 'baz',
//		then : [function then],
//		fulfill : [function fulfill],
//		reject : [function reject]
//	}
`````

###promix.toString()
Convert a standard promise to a StringPromise. A StringPromise allows you to manipulate a promise's eventual string value using familiar String methods. (See the [StringPromise API](#stringpromise) below.)

Usage:
> **promix.toString( promise )**

`````javascript
var promise = promix.promise();

setTimeout(function ( ) {
	promise.fulfill('foobarfoobaz');
}, 10);

promix.toString(promise).replace(/foo/g, 'wat').then(function ( result ) {
	console.log(result);

	//watbarwatbaz
});
`````

###promix.toNumber()
Convert a standard promise to a NumberPromise. A NumberPromise allows you to manipulate a promise's eventual number value using familiar methods. (See the [NumberPromise API](#numberpromise) below.)

Usage:
> **promix.toNumber( promise )**

`````javascript
var promise = promix.promise();

setTimeout(function ( ) {
	promise.fulfill(26.56);
}, 10);

promix.toNumber(promise).round().then(function ( result ) {
	console.log(result);

	//27
});
`````


###promix.toArray()
Convert a standard promise to an ArrayPromise. An ArrayPromise allows you to manipulate a promise's eventual array value using familiar Array methods. (See the [NumberPromise API](#numberpromise) below.)

Usage:
> **promix.toArray( promise )**

`````javascript
var promise = promix.promise();

setTimeout(function ( ) {
	promise.fulfill(['foo', 'wat', 'baz', 'bar']);
}, 10);

promix.toArray(promise).sort().join('-').then(function ( result ) {
	console.log(result);

	//bar-baz-foo-wat
});
`````

###promix.toObject()
Convert a standard promise to an ObjectPromise. An ObjectPromise allows you to get and set properties, and transform the promise to other Promise types. (See the [ObjectPromise API](#objectpromise) below.)

Usage:
> **promix.toObject( promise )**

`````javascript
var promise = promix.promise();

setTimeout(function ( ) {
	promise.fulfill({
		foo : 1,
		bar : 2
	});
}, 10);

promix.toObject(promise).get('foo').toNumber().plus(5).then(function ( result ) {
	console.log(result);

	//7
});
`````

##Chain
A chain is used to collect the eventual outcomes of asynchronous JavaScript actions. It consolidates the successful results of these actions, and notifies us of any error that occurs during completion of its steps.
This allows us to assign one callback for the entire chain.

<br />
###chain.and()
Add a new promise or callback-accepting function as a parallel step in the chain.

Usage:
> **chain.and( promise )**

> **chain.and( function [, arguments ] )**

`````javascript
var promise = promix.promise();
promix.chain(asyncOne, 1, 2)
	.and(asyncTwo, 3, 4)
	.and(promise)
	.and(...)
	//continue adding things as need be
`````

<br />
###chain.then() [\*](#breakpoints)
Add a new promise or function as a sequential step in the chain. All prior steps must complete before this step is evaluated.

Usage:
> **chain.then( promise )**

> **chain.then( function [, arguments ] )**


If you pass a function to `chain.then()` as the only argument,
the function will be passed an array of results from all earlier steps in the chain:

`````javascript
var chain = promix.chain(asyncOne, 1, 2).and(asyncTwo, 3, 4).then(function ( results ) {
	console.log(results);

	//[3, 12]
});
`````

If you supply additional arguments to `.then()`, those arguments, as well as a trailing callback created by promix, will be passed to the function **instead of** the results object:

`````javascript
function someFn ( v1, v2, callback ) {
	setTimeout(function ( ) {
		return callback(v1 + v1 + v1 + ' ' + v2 + v2 + v2);
	}, 50);
}

promix.chain(asyncOne, 1, 2).and(asyncTwo, 3, 4).then(someFn, 'a', 'b').then(function ( results ) {
	console.log(results);

	//[3, 12, 'aaa bbb']
});
`````
In the above case, the chain continues because `someOtherFn` calls the `callback` argument supplied by Promix.

If you pass a promise to `chain.then()`, the chain will wait until that promise has been resolved (or rejected) before continuing:

`````javascript
var promise = promix.promise();

setTimeout(function ( ) {
	promise.fulfill(5000);
}, 40);

var chain = promix.chain(asyncOne, 1, 2).and(asyncTwo, 3, 4).then(promise).then(function ( results ) {
	console.log(results);

	//[3, 12, 5000]
});
`````

A function passed to `chain.then()` can also directly return a promise in order to continue the promise chain.

For example:
````javascript
function someOtherfn ( results, callback ) {
	var promise = promix.promise();

	setTimeout(function ( ) {
		promise.fulfill(results [1] - results [0]);
	}, 50);

	return promise;
}

promix.chain(asyncOne, 1, 2).and(asyncTwo, 3, 4).then(someFn).then(function ( results ) {
	console.log(results);

	//[3, 12, 9]
});
`````

<br />
###chain.otherwise() [\*](#breakpoints)
Add a new error handler to the chain.

Usage:
> **chain.otherwise( function )**

Any errors that occur will break the chain, preventing execution of further steps, and pass to the nearest handler.
`````javascript
var chain = promix.chain(asyncOne, 1, 2).and(errorFn, 'foo').then(function ( results ) {
	//we will never reach this point, because errorFn threw an error
}).otherwise(function ( error ) {
	console.log(error);

	//Error: This function throws errors (foo)
});
`````

**NOTE**

If you do not attach an error handler using `chain.otherwise()` or `chain.end()` (see [chain.end](#chainend-)), the error will be thrown.
You can disable this feature by explicitly suppressing errors for your chain (see [chain.suppress](#chainsuppress)).

<br />
###chain.end() [\*](#breakpoints)
Add a promise or callback-accepting function to the current chain.

Usage:
> **chain.end( promise )**

> **chain.end( function [, arguments] )**

If a callback is supplied, it will not be passed a trailing callback parameter, as is normally done when adding a function as a new step in the chain:

`````javascript
when(asyncOne, 1, 2).and(asyncTwo, 3, 4).end(function ( a, b, callback ) {
	console.log(arguments);
	console.log(callback);

	//5, 6
	//undefined
}, 5, 6);
`````

<br />
###chain.callback() [\*](#breakpoints)
Add a single callback to the end of the chain. This callback also acts as an error handler.

Usage:
> **chain.callback( function )**

Callbacks in Node.js often take the form `function ( error, result ) { }`.
`chain.callback()` allows you to pass a single function of this signature into the chain;
Promix will fork it into a `.then ( results ) { }` success handler and a `.otherwise ( error ) { }` error handler behind the scenes:

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

promix.chain(asyncOne, 1, 2).and(asyncTwo, 3, 4).callback(typicalCallback);
`````

<br />
###chain.as()
Assign a label to the current step in the chain.

Usage:
> **chain.as( label )**

`````javascript
var chain = promix.chain(foo, 1, 2).as('foo');
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
If the assertion returns false, the error that Promix creates from the failed assertion will be given the label that you passed into `.as()`:

`````javascript
var chain = promix.chain(asyncOne, 1, 2).and(asyncTwo, 3, 4);

chain.assert(function ( results ) {
	return results [1] === 14;
}).as('Checking to make sure asyncTwo returned 14');

chain.otherwise(function ( error ) {
	console.log(error);

	//Error: Chain failed assertion: Checking to make sure asyncTwo returned 14
});
`````

The `chain.as()` method will also assign a new promise property on the chain itself representing the state of the current step. See [chain \[label\]] below. You can also use this property to create promises that return results from the labelled step. See [chain \[label\]()](#label) below.

<br />
###chain \[label\]
An alias to a promise representing the state of a specific step in the chain, as designated by `chain.as()`.

When a step in the chain is either fulfilled or rejected, the promise stored at this property will be completed with the result (or error) from that step:
`````javascript
var chain = when(asyncOne, 1, 2).as('foo');
chain.and(asyncTwo, 3, 4).as('bar');


//chain.bar is now a standard promise:
chain.bar.then(function ( result ) {
	console.log(result);

	//12
}, function ( error ) {
	//We won't reach this
});
`````

<br />
###chain.bind()
Bind the execution context of the current step in the chain.

Usage:
> **chain.bind(context)**

Some functions depend on the context on which they are called. Using `chain.bind()`, we can supply this execution context for specific steps in the chain:
`````javascript
var someObj = {
	transform : function ( text, callback ) {
		setTimeout(function ( ) {
			return callback(null, text.split('').reverse().join(''));
		}, 50);
	},
	getName : function ( text, callback ) {
		this.transform(text, callback);
	}
};

when(someObj.getName, 'pikachu').then(function ( results ) {
	//we will not reach this
}).otherwise(function ( error ) {
	console.log(Error);

	//Uncaught TypeError: Object [Object] has no method 'transform'
});

//let's try again, using chain.bind():
when(someObj.getName, 'pikachu').bind(someObj).then(function ( results ) {
	console.log(results);

	//['uhcakip']
}).otherwise(function ( error ) {
	//we will not reach this
});

`````

###chain.time(namespace)
Designate that the chain should be timed. When the chain is marked as complete
via `chain.done()`, the time it took to complete will be stored under the
designated namespace, and accessible via `promix.stats(namespace)`. If labels
are assigned to discrete steps within the chain, the times for each of these
enumerated steps will be stored individually, as well.

Usage:
> **chain.time( [namespace] )**

`````javascript
function oneSecond ( callback ) {
	setTimeout(callback, 1000);
}

function twoSeconds ( callback ) {
	setTimeout(callback, 2000);
}

var chain = promix.chain();

chain.time('bowser');
chain.and(oneSecond).as('foo');
chain.and(oneSecond).as('foo');
chain.and(twoSeconds).as(bar');
chain.then(function(results) {
	chain.done();

	console.log(promix.stats('bowser'));

	// The above would output the following metrics
	// (note that the total time for the chain is 2000,
	//  because the steps are executed in parallel):

	/*
	{
		count: 1,
		total: 2000,
		average: 2000
	}
	*/

	// We can retrieve the child steps as follows
	// (incorporates two steps, each one second in length):

	console.log(promix.stats('bowser.foo'));

	/*
	{
		count: 2,
		total: 2000,
		average: 1000
	}
});
`````

<br />
##StringPromise
StringPromises allow us to mutate the eventual String result of a promise that has yet to complete.
StringPromises are returned from calling `promix.toString()`, as well as from any method on the other promise types that implicitly casts the promise value to a String (eg, `ArrayPromise.join()`).

StringPromises expose the methods common to all Promix typed promises
([get](#objectpromiseget), [set](#objectpromiseset),
[delete](#objectpromisedelete), [keys](#objectpromisekeys),
[toJSON](#objectpromisetojson)).

StringPromises wrap all of the methods that exist on the native
`String.prototype`. There are a few additional convenience methods, as well.
Their documentation will be added shortly.

<br />
##NumberPromise
NumberPromises allow us to mutate the eventual Number result of a promise that has yet to complete.
NumberPromises are returned from calling `promix.toNumber()`, as well as from any method on the other promise types that implicitly casts the promise value to a Number (eg, `ArrayPromise.length()`).

<br />
##ArrayPromise
ArrayPromises allow us to mutate the eventual Array result of a promise that has yet to complete.
ArrayPromises are returned from calling `promix.toArray()`, as well as from any method on the other promise types that implicitly casts the promise value to an Array (eg, `StringPromise.split()`).

ArrayPromises wrap all of the methods that exist on the native
`Array.prototype`. There are a few additional convenience methods, as well.
Their documentation will be added shortly.

<br />
##ObjectPromise
ObjectPromises allow us to perform generic object mutations on a promise that has yet to complete.
ObjectPromises are returned from any method on the other promise types with an indeterminate return type (eg `ArrayPromise.pop()`, where we are unsure what type of value exists at index 0).

ObjectPromises expose the following methods:

<br />
###ObjectPromise.get()
Promise to get the value of the given property.

Usage:
>**ObjectPromise.get(property)**

Returns:
>**ObjectPromise**


<br />
###ObjectPromise.set()
Promise to set the property name to the given value.

Usage:
>**ObjectPromise.set(property, value)**

Returns:
>**ObjectPromise**


<br />
###ObjectPromise.delete()
Promise to delete the property at the supplied identifier.

Usage:
>**ObjectPromise.delete(identifier)**

Returns:
>**ObjectPromise**


<br />
###ObjectPromise.keys()
Promise to return an array of the property identifiers belonging to the promise result.

Usage:
>**ObjectPromise.keys()**

Returns:
>**ArrayPromise**


<br />
###ObjectPromise.toJSON()
Promise to return a serialized JSON representation of the current promise.

Usage:
>**ObjectPromise.toJSON()**

Returns:
>**StringPromise**


<br />
##License

Promix is MIT licensed. You can read the license [here](https://raw.github.com/reflex/promix/master/license).

<br />
##Notes
###Breakpoints

Certain Promix chain methods act as chain breakpoints.
These methods are designated with an asterisk (\*) throughout this documentation.
A breakpoint is a step in the execution of a chain that necessarily introduces sequential behavior.

For instance, in the following example:
`````javascript
promix.chain(foo).and(bar).and(baz).then(wat);
`````
The `.then(wat)` step is a breakpoint, because it requires everything before it to be completed before it will execute.



