var
	readable,
	writable,
	Promise = require('./promise'),
	utils = require('./utils'),
	stream = require('stream');

function noop ( ) { }

function wrap ( stream ) {
	var
		promise = new Promise(),
		aggregate;

	if ( stream instanceof writable ) {
		stream.on('finish', function resolveWritableStream ( ) {
			return void promise.fulfill(stream);
		});
		stream.on('error', promise.reject);
	}
	else if ( stream instanceof readable ) {
		stream.on('data', function handleData ( data ) {
			if ( ! aggregate ) {
				aggregate = data;
			}
			else {
				aggregate = Buffer.concat([aggregate, data]);
			}
		});
		stream.on('end', function handleEnd ( ) {
			promise.fulfill(aggregate);
		});
		stream.on('error', function ( error ) {
			console.log(error);
			promise.reject(error);
		});
	}
	else {
		utils.next(function resolveImmediately ( ) {
			promise.fulfill(stream);
		});
	}

	return promise;
}


if ( typeof window === 'undefined' ) {
	readable = stream.Readable;
	writable = stream.Writable;
}
else {
	readable = writable = noop;
}

module.exports = {
	readable : readable,
	writable : writable,
	wrap : wrap
};
