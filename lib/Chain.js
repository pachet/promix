var
	Promise = require('./Promise'),
	Step = require('./Step'),
	Reflector = require('./Reflector'),
	Handler = require('./Handler'),
	Utility = require('./Utility');

function Chain ( ) {
	var
		self = this;

	this.time = 0;
	this.steps = [ ];
	this.results = [ ];
	this.aliases = { };
	this.alternate = false;
	this.stopped = false;
	this.silenced = false;
	this.rejected = false;
	this.endpoint = false;
	this.broken = false;
	this.slice = 0;
	this.suppressed = 0;
	this.position = 0;
	this.focus = -1;
	this.introspects = 0;
	this.name = 'none set';
	this.exports = {
		and : function and ( ) {
			self.add_promise.apply(self, Array.prototype.slice.call(arguments));
			if ( self.focus === self.position ) {
				self.queue(self.steps [self.focus]);
			}
			return self.exports;
		},
		or : function or ( ) {
			self.alternate = true;
			self.add_promise.apply(self, Array.prototype.slice.call(arguments));
			self.alternate = false;
			if ( self.focus === self.position && ! self.stopped ) {
				self.queue(self.steps [self.focus]);
			}
			return self.exports;
		},
		name : function label ( identifier ) {
			self.name = identifier;
			return self.exports;
		},
		as : function as ( text ) {
			self.label(self.focus, text);
			return self.exports;
		},
		then : function then ( interlocutor, secondary ) {
			var
				step;

			if ( Utility.check_step(self.steps [self.focus]) === false ) {
				self.add_step();
			}
			step = self.steps [self.focus];
			if ( typeof secondary === 'undefined' ) {
				step.then = interlocutor;
			}
			else {
				self.add_promise.apply(self, Array.prototype.slice.call(arguments));
			}
			step.endpoint = self.endpoint;
			self.endpoint = false;
			if ( self.focus === self.position ) {
				self.queue(step);
			}
			return self.exports;
		},
		assert : function assert ( assertion ) {
			if ( Utility.check_step(self.steps [self.focus]) === false ) {
				self.add_step();
			}
			self.steps [self.focus].assertion = assertion;
			return self.exports;
		},
		otherwise : function otherwise ( handler ) {
			self.steps [self.focus].handler = handler;
			return self.exports;
		},
		suppress : function suppress ( label ) {
			self.suppress(label, true);
			return self.exports;
		},
		unsuppress : function suppress ( label ) {
			self.suppress(label, false);
			return self.exports;
		},
		reject : function reject ( error ) {
			self.reject(error, self.position);
			return self.exports;
		},
		callback : function callback ( resolver ) {
			self.exports.otherwise(resolver);
			self.exports.then(function ( results ) {
				return void resolver(null, results);
			});
			return self.exports;
		},
		end : function end ( ) {
			self.endpoint = true;
			self.exports.then.apply(self.exports, Array.prototype.slice.call(arguments));
			return self.exports;
		},
		stop : function stop ( ) {
			self.stopped = true;
			//clearTimeout(self.steps [self.focus].dispatch_timer);
			return self.exports;
		},
		start : function start ( ) {
			if ( self.stopped ) {
				self.stopped = false;
				self.start();
			}
			return self.exports;
		},
		'break' : function _break ( ) {
			self.broken = true;
			return self.exports;
		},
		bind : function bind ( context ) {
			self.bind(self.focus, context);
			return self.exports;
		},
		until : function until ( condition ) {
			self.steps [self.focus].condition = true;
			self.steps [self.focus].condition_value = condition;
			return self.exports;
		},
		time : function time ( label ) {
			var
				alias,
				index,
				total;
			
			if ( typeof label !== 'undefined' ) {
				if ( typeof self.aliases [label] !== 'undefined' ) {
					alias = self.aliases [label];
					if ( alias.constructor === Step ) {
						return Utility.find_max_time(alias);
					}
					else {
						return Utility.get_item_time(alias);
					}
				}
				else {
					return null;
				}
			}
			else {
				index = self.position;
				total = 0;
				while ( index -- ) {
					total += Utility.find_max_time(self.steps [index]);
				}
				return total;
			}
		},
		results : this.results,
		result : this.results
	};
	this.add_step();
	if ( arguments.length ) {
		this.add_promise.apply(this, Array.prototype.slice.call(arguments));
	}
	return this.exports;
}


Chain.prototype = {
	start : function start ( ) {
		var
			step = this.steps [this.position];

		if ( ! step.completed && this.broken === false ) {
			this.queue(step);
		}
	},
	queue : function queue ( step ) {
		clearTimeout(step.dispatch_timer);
		step.dispatch_timer = setTimeout((function apply_queued_dispatch ( ) {
			this.dispatch_step(step);
		}).bind(this), 0);
	},
	bind : function bind ( focus, context ) {
		var
			step = this.steps [focus],
			length,
			slice,
			slice_length,
			item;

		if ( ! step || step.completed === true ) {
			return;
		}
		length = step.length;
		while ( length -- ) {
			slice = step [length];
			slice_length = slice.length;
			while ( slice_length -- ) {
				item = slice [slice_length];
				item.context = context;
			}
		}
	},
	suppress : function suppress ( label, state ) {
		switch ( typeof label ) {
			case 'undefined':
				this.suppressed = state;
				break;
			case 'number':
				if ( label ) {
					this.suppressed = label;
				}
				break;
			case 'string':
				if ( typeof this.aliases [label] !== 'undefined' ) {
					this.aliases [label].suppressed = state;
				}
				break;
		}
	},
	reject : function reject ( error, offset ) {
		var
			length,
			original_offset = offset;

		if ( this.rejected || this.suppressed ) {
			if ( Handler.handle ) {
				Handler.handle(error);
			}
			return;
		}
		length = this.steps.length;
		this.rejected = true;
		while ( offset < length ) {
			if ( this.steps [offset] && this.steps [offset].handler !== null ) {
				this.steps [offset].handler(error);
				return;
			}
			offset ++;
		}
		offset = original_offset;
		while ( offset -- ) {
			if ( this.steps [offset] && this.steps [offset].handler !== null ) {
				this.steps [offset].handler(error);
				return;
			}
		}
		if ( this.silenced === false ) {
			if ( Handler.handle ) {
				return void Handler.handle(error);
			}
			else {
				throw error;
			}
		}
	},
	complete : function complete ( step ) {
		var
			assert_message,
			labels,
			index = 0,
			length = step.length,
			current_result,
			current_focus = this.focus,
			resultant_promise,
			condition_match;

		if ( this.rejected || this.broken ) {
			return;
		}
		step.complete = true;
		this.focus = this.position;
		if ( length > 0 ) {
			while ( index < length ) {
				current_result = Utility.get_slice_result(step [index]);
				this.results.push(current_result);
				if ( typeof step [index].labels !== 'undefined' ) {
					labels = step [index].labels.slice(0);
					while ( labels.length ) {
						this.results [labels.shift()] = current_result;
						if ( step.condition && current_result === step.condition_value ) {
							condition_match = true;
						}
					}
				}
				index ++;
			}
		}
		else if ( typeof step.assertion === 'function' && step.assertion(this.results) === false ) {
			if ( typeof step.label !== 'undefined' ) {
				assert_message = step.label;
			}
			else {
				assert_message = step.assertion.toString();
			}
			return void this.reject(new Error('Domain failed assertion: ' + assert_message), this.position - 1);
		}
		else if ( typeof step.then === 'function' ) {
			resultant_promise = step.then(this.results);
			if ( typeof resultant_promise !== 'undefined' ) {
				step.then = null;
				this.add_promise(resultant_promise);
				if ( typeof step.label !== 'undefined' ) {
					this.label(this.focus, step.label);
				}
				this.position --;
				current_focus --;
			}
		}
		if ( condition_match || ! step.condition ) {
			this.position ++;
		}
		else if ( step.condition_value && typeof step.condition_value.then === 'function' && step.condition_bound === false ) {
			step.condition_bound = true;
			step.condition_value.then(function success ( result ) {
				step.condition = false;
			}, this.exports.break);
		}
		if ( this.position < this.steps.length ) {
			return void this.dispatch_step(this.steps [this.position]);
		}
	},
	dispatch_step : function dispatch_step ( step ) {
		var
			length = step.length,
			sub_index = 0,
			sub_length,
			current_focus = this.focus,
			complete = this.complete.bind(this);

		this.focus = this.position;
		if ( this.stopped === true || this.rejected === true ) {
			return;
		}
		if ( length ) {
			this.slice = 0;
			while ( this.slice < length ) {
				sub_index = 0;
				sub_length = step [this.slice].length;
				while ( sub_index < sub_length ) {
					this.apply_hooks.apply(this, [ ].concat(step [this.slice] [sub_index]));
					sub_index ++;
				}
				this.slice ++;
			}
		}
		else {
			setTimeout(function ( ) {
				return void complete(step);
			}, 0);
		}
		this.focus = current_focus;
	},
	add_step : function add_step ( ) {
		var
			step = new Step();
		this.steps.splice(++ this.focus, 0, step);
		return step;
	},
	apply_hooks : function apply_hooks ( promise ) {
		var
			offset = this.focus,
			step = this.steps [offset],
			current_slice = this.slice,
			invalid_promise,
			introspect_index,
			current_introspect,
			resolved_args,
			introspect_domain,
			introspect_arguments,
			introspect_primary,
			self = this,
			name = this.name,
			steps = this.steps,
			primary = null;

		function success ( result ) {
			promise.finish = Date.now();
			step.complete_count ++;
			if ( step.complete_count >= step.length ) {
				return void self.complete(step);
			}
		}

		function failure ( error ) {
			promise.finish = Date.now();
			if ( promise.parent.suppressed || self.suppressed ) {
				if ( ! promise.parent.suppressed && typeof self.suppressed === 'number' ) {
					self.suppressed --;
				}
				return void success(null);
			}
			return void self.reject(error, offset - 1);
		}

		if ( promise.arguments ) {
			primary = promise.arguments [0];
		}
		if ( typeof primary === 'function' ) {
			primary = Array.prototype.slice.call(promise.arguments);
		}
		if ( Object.prototype.toString.call(primary) === '[object Array]' ) {
			introspect_index = 1;
			while ( introspect_index < primary.length ) {
				current_introspect = primary [introspect_index];
				if ( current_introspect && typeof current_introspect.then === 'function' ) {
					introspect_index = 1;
					introspect_domain = new Chain();
					while ( introspect_index < primary.length ) {
						introspect_domain.and(primary [introspect_index]);
						introspect_index ++;
					}
					introspect_primary = primary [0];
					introspect_domain.then(function composite_introspect ( results ) {
						var
							args = [introspect_primary].concat(results);

						if ( step.endpoint ) {
							introspect_domain.end.apply(introspect_domain, args);
						}
						else {
							introspect_domain.then.apply(introspect_domain, args).as('introspect');
						}
						if ( promise.context ) {
							introspect_domain.bind(promise.context);
						}
					});
					introspect_domain.then(function fulfill_introspect ( results ) {
						return void promise.fulfill(results.introspect);
					});
					introspect_domain.otherwise(promise.reject);
					break;
				}
				introspect_index ++;
			}
			if ( ! introspect_domain ) {
				resolved_args = promise.arguments.slice(0);
				primary = resolved_args.shift();
				if ( step.condition ) {
					promise = new Promise(promise);
					step.complete_count = 0;
					//step.complete_count = Math.max(step.complete_count - 1, 0);
				}
				if ( typeof primary === 'function' ) {
					if ( ! step.endpoint ) {
						resolved_args.push(function resolve_promise ( error, result ) {
							if ( error ) {
								return void promise.reject(error);
							}
							else {
								return void promise.fulfill(result);
							}
						});
					}
					setTimeout(function dispatch_promise ( ) {
						return void primary.apply(promise.context || null, resolved_args);
					}, 0);
				}
				else {
					setTimeout(function fulfill_promise ( ) {
						if ( resolved_args.length ) {
							return void promise.fulfill([primary].concat(resolved_args));
						}
						else {
							return void promise.fulfill(primary);
						}
					}, 0);
				}
			}
		}
		else if ( ( ! primary || typeof primary.then !== 'function' ) && this.strict ) {
			invalid_promise = primary;
			setTimeout(function reject_promise ( ) {
				var
					label_infix = '';

				if ( steps [offset] [current_slice] && steps [offset] [current_slice].labels ) {
					label_infix = ' (labelled "' + steps [offset] [current_slice].labels [0] + '")';
				}
				return void promise.reject(new Error('The domain (named "' + name + '") was given an invalid promise' + label_infix + ': ' + invalid_promise));
			}, 0);
		}
		if ( promise.constructor === Chain ) {
			promise.then(success).otherwise(failure);
		}
		else {
			promise.then(success, failure);
		}
		promise.start = Date.now();
	},
	add_promise : function add_promise ( primary, secondary ) {
		var
			promise,
			step,
			args = Array.prototype.slice.call(arguments);

		if ( typeof primary.then === 'function' ) {
			promise = primary;
		}
		else {
			promise = new Promise();
			if ( args.length === 1 && typeof primary !== 'function' ) {
				setTimeout(function resolve_immediately ( ) {
					return void promise.fulfill(primary);
				}, 0);
			}
			else {
				promise.arguments = args;
			}
		}
		step = this.steps [this.focus];
		if ( step.assertion !== null || step.then !== null ) {
			step = this.add_step();
		}
		this.slice = step.length - 1;
		if ( this.alternate && this.slice + 1 ) {
			step [this.slice].push(promise);
			promise.parent = step [this.slice];
		}
		else {
			promise.parent = [promise];
			this.slice = step.push(promise.parent);
		}
	},
	label : function label ( index, text ) {
		var
			step_item;

		if ( this.steps.length < index ) {
			return;
		}
		step_item = this.steps [index];
		if ( step_item.length === 0 ) {
			step_item.label = text;
			this.aliases [text] = step_item;
		}
		else {
			step_item = step_item [step_item.length - 1];
			if ( typeof step_item.labels === 'undefined' ) {
				step_item.labels = [ ];
			}
			step_item.labels.push(text);
			this.aliases [text] = step_item;
			if ( this.reserved_identifiers.indexOf(text) === -1 ) {
				this.exports [text] = new Reflector(step_item [step_item.length - 1]);
			}
		}
	}
};

Chain.prototype.reserved_identifiers = Object.keys(Chain.prototype);

module.exports = Chain;
