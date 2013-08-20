var
	Chain = require('./Chain'),
	utility = require('./Utility');

module.exports = Exposure;

function Exposure ( ) {
	this.__internal = new Chain(this, arguments);
	this.results = this.result = this.__internal.results;
}

Exposure.prototype = {
	and : function and ( ) {
		this.__internal.add_promise.apply(this.__internal, Array.prototype.slice.call(arguments));
		if ( this.__internal.focus === this.__internal.position ) {
			this.__internal.queue(this.__internal.steps [this.__internal.focus]);
		}
		return this.__internal.exports;
	},
	or : function or ( ) {
		this.__internal.alternate = true;
		this.__internal.add_promise.apply(this.__internal, Array.prototype.slice.call(arguments));
		this.__internal.alternate = false;
		if ( this.__internal.focus === this.__internal.position && ! this.__internal.stopped ) {
			this.__internal.queue(this.__internal.steps [this.__internal.focus]);
		}
		return this.__internal.exports;
	},
	name : function label ( identifier ) {
		this.__internal.name = identifier;
		return this.__internal.exports;
	},
	as : function as ( text ) {
		this.__internal.label(this.__internal.focus, text);
		return this.__internal.exports;
	},
	then : function then ( interlocutor, secondary ) {
		var
			step,
			type = typeof secondary;

		if ( utility.check_step(this.__internal.steps [this.__internal.focus]) === false ) {
			this.__internal.add_step();
		}
		step = this.__internal.steps [this.__internal.focus];
		if ( type === 'undefined' || ( type === 'function' && secondary.then === undefined && arguments.length === 2 ) ) {
			step.then = interlocutor;
			if ( type === 'function' ) {
				this.__internal.exports.otherwise(secondary);
			}
		}
		else {
			this.__internal.add_promise.apply(this.__internal, Array.prototype.slice.call(arguments));
		}
		step.endpoint = this.__internal.endpoint;
		this.__internal.endpoint = false;
		if ( this.__internal.focus === this.__internal.position ) {
			this.__internal.queue(step);
		}
		return this.__internal.exports;
	},
	assert : function assert ( assertion ) {
		if ( utility.check_step(this.__internal.steps [this.__internal.focus]) === false ) {
			this.__internal.add_step();
		}
		this.__internal.steps [this.__internal.focus].assertion = assertion;
		return this.__internal.exports;
	},
	otherwise : function otherwise ( ) {
		var
			args = Array.prototype.slice.call(arguments);

		this.__internal.steps [this.__internal.focus].handler = args [0];
		if ( args.length > 1 ) {
			this.__internal.steps [this.__internal.focus].error_arguments = args.slice(1);
		}
		return this.__internal.exports;
	},
	suppress : function suppress ( label ) {
		this.__internal.suppress(label, true);
		return this.__internal.exports;
	},
	unsuppress : function suppress ( label ) {
		this.__internal.suppress(label, false);
		return this.__internal.exports;
	},
	reject : function reject ( error ) {
		this.__internal.reject(error, this.__internal.position);
		return this.__internal.exports;
	},
	callback : function callback ( resolver ) {
		this.__internal.exports.otherwise(resolver);
		this.__internal.exports.then(function ( results ) {
			return void resolver(null, results);
		});
		return this.__internal.exports;
	},
	end : function end ( ) {
		this.__internal.endpoint = true;
		this.__internal.exports.then.apply(this.__internal.exports, Array.prototype.slice.call(arguments));
		return this.__internal.exports;
	},
	stop : function stop ( ) {
		this.__internal.stopped = true;
		//clearTimeout(this.__internal.steps [this.__internal.focus].dispatch_timer);
		return this.__internal.exports;
	},
	start : function start ( ) {
		if ( this.__internal.stopped ) {
			this.__internal.stopped = false;
			this.__internal.start();
		}
		return this.__internal.exports;
	},
	'break' : function _break ( ) {
		this.__internal.broken = true;
		return this.__internal.exports;
	},
	bind : function bind ( context ) {
		this.__internal.bind(this.__internal.focus, context);
		return this.__internal.exports;
	},
	until : function until ( condition ) {
		this.__internal.steps [this.__internal.focus].condition = true;
		this.__internal.steps [this.__internal.focus].condition_value = condition;
		return this.__internal.exports;
	},
	time : function time ( label ) {
		var
			alias,
			index,
			total;
		
		if ( typeof label !== 'undefined' ) {
			if ( typeof this.__internal.aliases [label] !== 'undefined' ) {
				alias = this.__internal.aliases [label];
				if ( alias.constructor.name === 'Step' ) {
					return utility.find_max_time(alias);
				}
				else {
					return utility.get_item_time(alias);
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
				total += utility.find_max_time(this.__internal.steps [index]);
			}
			return total;
		}
	},
	__clone : function clone ( ) {
		return new Exposure();
	}
};

