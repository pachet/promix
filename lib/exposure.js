var
	Chain = require('./chain'),
	utils = require('./utils');

module.exports = Exposure;

function Exposure ( ) {
	this.__internal = new Chain(this, arguments);
	this.results = this.result = this.__internal.results;
}

Exposure.prototype.and = function and ( ) {
	this.__internal.addPromise.apply(this.__internal, utils.copy(arguments));
	if ( this.__internal.focus === this.__internal.position ) {
		this.__internal.queue(this.__internal.steps [this.__internal.focus]);
	}
	return this.__internal.exports;
};

Exposure.prototype.or = function or ( ) {
	this.__internal.alternate = true;
	this.__internal.addPromise.apply(this.__internal, utils.copy(arguments));
	this.__internal.alternate = false;
	if ( this.__internal.focus === this.__internal.position && ! this.__internal.stopped ) {
		this.__internal.queue(this.__internal.steps [this.__internal.focus]);
	}
	return this.__internal.exports;
};

Exposure.prototype.name = function name ( identifier ) {
	this.__internal.name = identifier;
	return this.__internal.exports;
};

Exposure.prototype.as = function as ( text ) {
	this.__internal.label(this.__internal.focus, text);
	return this.__internal.exports;
};

Exposure.prototype.then = function then ( interlocutor, secondary ) {
	var
		step,
		type = typeof secondary;

	if ( this.__internal.steps [this.__internal.focus].check() === false ) {
		this.__internal.addStep();
	}
	step = this.__internal.steps [this.__internal.focus];
	if ( type === 'undefined' || ( type === 'function' && secondary.then === undefined && arguments.length === 2 ) ) {
		step.then = interlocutor;
		if ( type === 'function' ) {
			this.__internal.exports.otherwise(secondary);
		}
	}
	else {
		this.__internal.addPromise.apply(this.__internal, utils.copy(arguments));
	}
	step.endpoint = this.__internal.endpoint;
	this.__internal.endpoint = false;
	if ( this.__internal.focus === this.__internal.position ) {
		this.__internal.queue(step);
	}
	return this.__internal.exports;
};

Exposure.prototype.assert = function assert ( assertion ) {
	if ( this.__internal.steps [this.__internal.focus].check() === false ) {
		this.__internal.addStep();
	}
	this.__internal.steps [this.__internal.focus].assertion = assertion;
	return this.__internal.exports;
};

Exposure.prototype.otherwise = function otherwise ( ) {
	var
		args = utils.copy(arguments); 

	this.__internal.steps [this.__internal.focus].handler = args [0];
	if ( args.length > 1 ) {
		this.__internal.steps [this.__internal.focus].errorArguments = args.slice(1);
	}
	return this.__internal.exports;
};

Exposure.prototype.suppress = function suppress ( label ) {
	this.__internal.suppress(label, true);
	return this.__internal.exports;
};

Exposure.prototype.unsuppress = function unsuppress ( label ) {
	this.__internal.suppress(label, false);
	return this.__internal.exports;
};

Exposure.prototype.reject = function reject ( error ) {
	this.__internal.reject(error, this.__internal.position);
	return this.__internal.exports;
};

Exposure.prototype.callback = function callback ( resolver ) {
	this.__internal.exports.otherwise(resolver);
	this.__internal.exports.then(function ( results ) {
		return void resolver(null, results);
	});
	return this.__internal.exports;
};

Exposure.prototype.end = function end ( ) {
	this.__internal.endpoint = true;
	this.__internal.exports.then.apply(this.__internal.exports, utils.copy(arguments));
	return this.__internal.exports;
};

Exposure.prototype.stop = function stop ( ) {
	this.__internal.stopped = true;
	//clearTimeout(this.__internal.steps [this.__internal.focus].dispatchTimer);
	return this.__internal.exports;
};

Exposure.prototype.start = function start ( ) {
	if ( this.__internal.stopped ) {
		this.__internal.stopped = false;
		this.__internal.start();
	}
	return this.__internal.exports;
};

Exposure.prototype ['break'] = function _break ( ) {
	this.__internal.broken = true;
	return this.__internal.exports;
};

Exposure.prototype.bind = function bind ( context ) {
	this.__internal.bind(this.__internal.focus, context);
	return this.__internal.exports;
};

Exposure.prototype.until = function until ( condition ) {
	this.__internal.steps [this.__internal.focus].condition = true;
	this.__internal.steps [this.__internal.focus].conditionValue = condition;
	return this.__internal.exports;
};

Exposure.prototype.time = function time ( label ) {
	var
		alias,
		index,
		total;
	
	if ( typeof label !== 'undefined' ) {
		if ( typeof this.__internal.aliases [label] !== 'undefined' ) {
			alias = this.__internal.aliases [label];
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
		index = this.__internal.position;
		total = 0;
		while ( index -- ) {
			total += this.__internal.steps [index].findMaxTime();
		}
		return total;
	}
};

Exposure.prototype.__clone = function clone ( ) {
	return new Exposure();
};

