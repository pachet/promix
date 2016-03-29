var Promise = require('./promise'),
	ReadableStream,
	WritableStream,
	stream;

function wrap(stream) {
	var promise = new Promise();

	if (!isStream(stream)) {
		setTimeout(function resolveImmediately() {
			promise.fulfill(stream);
		}, 0);

		return promise;
	}

	if (stream instanceof WritableStream) {
		stream.on('finish', function resolveWritableStream() {
			promise.fulfill(stream);
		});

		stream.on('error', promise.break);

		return promise;
	}

	var result;

	// Otherwise, we know we're dealing with a readable stream;
	// this means we need to wait for it to finish being written to:
	stream.on('data', function handleData(data) {
		if (!result) {
			result = data;
		} else {
			result = Buffer.concat([result, data]);
		}
	});

	stream.on('end', function handleEnd() {
		promise.fulfill(result);
	});

	stream.on('error', function handleError(error) {
		promise.reject(error);
	});

	return promise;
}


if (typeof window === 'undefined') {
	stream = require('str' + 'eam');
	ReadableStream = stream.Readable;
	WritableStream = stream.Writable;
} else {
	ReadableStream = WritableStream = function noop() { };
}

function isStream(value) {
	if (!value) {
		return false;
	}

	return (value instanceof ReadableStream)
		|| (value instanceof WritableStream);
}

module.exports = {
	wrap: wrap,
	isStream: isStream
};
