var
	promix = require('../index.js'),
	fs = require('fs');

function readable ( test ) {
	var
		stream = fs.createReadStream(__dirname + '/files/readable.txt'),
		chain = promix.chain();

	test.expect(1);
	chain.and(stream);
	chain.then(function success ( results ) {
		test.equals(results [0].toString('utf8'), 'this is a readable test file\n');
		test.done();
	});
	chain.otherwise(function failure ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
}

function writable ( test ) {
	var
		stream = fs.createWriteStream(__dirname + '/files/writable.txt'),
		chain = promix.chain();

	test.expect(2);
	chain.and(stream);
	setTimeout(function deferred ( ) {
		stream.write('this is a writable test file');
		stream.end();
	});
	chain.then(function success ( results ) {
		test.equals(results [0], stream);
		test.equals(fs.readFileSync(__dirname + '/files/writable.txt', 'utf8'), 'this is a writable test file');
		test.done();
	});
	chain.otherwise(function failure ( error ) {
		test.ok(false, 'We should not be here');
		test.done();
	});
}

module.exports = {
	readable : readable,
	writable : writable
};
