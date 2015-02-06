

var promix = require('./index');

var promise = promix.promise();

/*
promise.toString()
	.slice(2, 8)
	.toNumber()
	.add(6)
	.toString(16)
	.split('')
	.reverse()
	.then(function(result) {
		console.log('RESULTS:');
		console.log('value: ' + result);
		console.log('type:  ' + (typeof result));
	});

promise.fulfill('xx223344yy');
*/


promise.toNumber()
	.toString(16)
	.slice(3)
	.then(function(result) {
		console.log(result);
	});

promise.fulfill(Math.random());
