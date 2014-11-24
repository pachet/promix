var
	Chain = require('./chain'),
	Promise = require('./promise'),
	utils = require('./utils'),
	logger = require('./logger'),
	hold;

module.exports = Exposure;

function Exposure ( ) {
	this.__internal = new Chain(this, arguments);
	this.results = this.result = this.__internal.results;
}


Exposure.prototype.and = function and ( ) {
	var
		internal = this.__internal;

	internal.addPromise.apply(internal, utils.copy(arguments));
	if ( internal.focus === internal.position ) {
		internal.queue(internal.steps [internal.focus]);
	}

	this.as('last');

	return this;
};

Exposure.prototype.andCall = function andCall ( callable, context ) {
	return this.and(function abstracted(dummy, callback) {
		callable.call(context || this, callback);
	}, null);
};

Exposure.prototype.or = function or ( ) {
	var
		internal = this.__internal;

	internal.alternate = true;
	internal.addPromise.apply(internal, utils.copy(arguments));
	internal.alternate = false;
	if ( internal.focus === internal.position && ! internal.stopped ) {
		internal.queue(internal.steps [internal.focus]);
	}

	this.as('last');

	return this;
};

Exposure.prototype.name = function name ( identifier ) {
	this.__internal.name = identifier;
	return this;
};

Exposure.prototype.as = function as ( text ) {
	this.__internal.label(this.__internal.focus, text);
	return this;
};

Exposure.prototype.then = function then ( interlocutor, secondary ) {
	var
		internal = this.__internal,
		step,
		type = typeof secondary,
		is_promise = interlocutor && typeof interlocutor.then === 'function';

	if ( internal.steps [internal.focus].check() === false ) {
		internal.addStep();
	}
	step = internal.steps [internal.focus];
	if ( ! is_promise && ( type === 'undefined' || ( type === 'function' && secondary.then === undefined && arguments.length === 2 ) ) ) {
		step.then = interlocutor;
		if ( type === 'function' ) {
			internal.exports.otherwise(secondary);
		}
	}
	else {
		internal.addPromise.apply(internal, utils.copy(arguments));
	}
	step.endpoint = internal.endpoint;
	internal.endpoint = false;
	if ( internal.focus === internal.position ) {
		internal.queue(step);
	}

	this.as('last');

	return this;
};

Exposure.prototype.thenCall = function thenCall ( callable, context ) {
	return this.then(function abstracted(dummy, callback) {
		callable.call(context || this, callback);
	}, null);
};

Exposure.prototype.assert = function assert ( assertion ) {
	var
		internal = this.__internal;

	if ( internal.steps [internal.focus].check() === false ) {
		internal.addStep();
	}
	internal.steps [internal.focus].assertion = assertion;
	return this;
};

Exposure.prototype.otherwise = function otherwise ( ) {
	var
		internal = this.__internal,
		args = utils.copy(arguments);

	internal.steps [internal.focus].handler = args [0];
	if ( args.length > 1 ) {
		internal.steps [internal.focus].errorArguments = args.slice(1);
	}

	return this;
};

Exposure.prototype.suppress = function suppress ( label ) {
	this.__internal.suppress(label, true);
	return this;
};

Exposure.prototype.unsuppress = function unsuppress ( label ) {
	this.__internal.suppress(label, false);
	return this;
};

Exposure.prototype.reset = function reset ( ) {
	var
		key;

	this.__internal.results.length = 0;
	for ( key in this.__internal ) {
		delete this.__internal [key];
	}
};

Exposure.prototype.reject = function reject ( error ) {
	this.__internal.reject(error, this.__internal.position);
	return this;
};

Exposure.prototype.callback = function callback ( resolver ) {
	this.otherwise(resolver);
	this.then(function ( results ) {
		return void resolver(null, results);
	});

	return this;
};

Exposure.prototype.end = function end ( ) {
	this.__internal.endpoint = true;

	this.then.apply(this, utils.copy(arguments));

	return this;
};

Exposure.prototype.stop = function stop ( ) {
	this.__internal.stopped = true;
	return this;
};

Exposure.prototype.start = function start ( ) {
	var
		internal = this.__internal;

	if ( internal.stopped ) {
		internal.stopped = false;
		internal.start();
	}
	return this;
};

Exposure.prototype ['break'] = function _break ( ) {
	this.__internal.broken = true;
	return this;
};

Exposure.prototype.bind = function bind ( context ) {
	this.__internal.bind(this.__internal.focus, context);
	return this;
};

Exposure.prototype.until = function until ( condition ) {
	var
		internal = this.__internal;

	internal.steps [internal.focus].condition = true;
	internal.steps [internal.focus].conditionValue = condition;
	return this;
};

Exposure.prototype.time = function time ( label ) {
	var
		internal = this.__internal,
		alias,
		index,
		total;

	if ( typeof label !== 'undefined' ) {
		if ( typeof internal.aliases [label] !== 'undefined' ) {
			alias = internal.aliases [label];
			if ( alias.constructor.name === 'Step' ) {
				return alias.findMaxTime();
			}
			else {
				return utils.getItemTime(alias);
			}
		}
		else {
			return null;
		}
	}
	else {
		index = internal.position;
		total = 0;
		while ( index -- ) {
			total += internal.steps [index].findMaxTime();
		}
		return total;
	}
};

Exposure.prototype.sync = function sync ( ) {
	var
		internal = this.__internal;

	internal.sync();
	return this;
};


Exposure.prototype.__clone = function clone ( ) {
	return new Exposure();
};


Exposure.prototype.status = function status ( ) {

};

Exposure.prototype.log = function log ( config ) {
	return logger.logSteps(this.__internal, config);
};

Exposure.prototype.wait = function wait ( ms, blocking ) {
	var promise = new Promise();

	setTimeout(promise.fulfill, ms);

	if ( blocking ) {
		this.then(promise);
	}
	else {
		this.and(promise);
	}

	return this;
};

Exposure.prototype.each = function each ( array, fn ) {
	if ( !array || Object.prototype.toString.call(array) !== '[object Array]' ) {
		return this.and(fn, array);
	}

	var index = 0;

	while ( index < array.length ) {
		this.and(fn, array [index]);

		index ++;
	}

	return this;
};

