var
	promix = require('../index.js');

function queue ( promise, value ) {
	setTimeout(function ( ) {
		promise.fulfill(value);
	}, 0);
}

function set ( test ) {
	var
		promise = promix.promise();

	test.expect(2);
	promix.toObject(promise).set('foo', 'bar').then(function ( result ) {
		test.equals(result.foo, 'bar');
		test.equals(result.baz, 'wat');
		test.done();
	});
	queue(promise, {
		baz : 'wat'
	});
}

function get ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toObject(promise).get('foo').then(function ( result ) {
		test.equals(result, 'bar');
		test.done();
	});
	queue(promise, {
		foo : 'bar'
	});
}

function _delete ( test ) {
	var
		promise = promix.promise();

	test.expect(1);
	promix.toObject(promise).delete('foo').then(function ( result ) {
		test.equals(result.foo, void 0);
		test.done();
	});
	queue(promise, {
		foo : 'bar'
	});
}

function keys ( test ) {
	var
		promise = promix.promise();

	test.expect(3);
	promix.toObject(promise).keys().concat('wat').sort().then(function ( result ) {
		test.equals(result [0], 'bar');
		test.equals(result [1], 'foo');
		test.equals(result [2], 'wat');
		test.done();
	});

	queue(promise, {
		foo : 1,
		bar : 2
	});
}

module.exports = {
	set : set,
	get : get,
	'delete' : _delete,
	keys : keys
};
