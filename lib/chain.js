var
	Promise = require('./promise'),
	Step = require('./step'),
	Reflector = require('./reflector'),
	handler = require('./handler'),
	utility = require('./utility');

function Chain ( exports, args ) {
	this.exports = exports;
	this.steps = [ ];
	this.results = [ ];
	this.aliases = { };
	this.add_step();
	if ( args && args.length ) {
		this.add_promise.apply(this, Array.prototype.slice.call(args));
	}
}

Chain.prototype = {
	alternate : false,
	stopped : false,
	silenced : false,
	rejected : false,
	endpoint : false,
	broken : false,
	slice : 0,
	suppressed : 0,
	position : 0,
	focus : -1,
	introspects : 0,
	name : 'none set',
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
		step.context = context;
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
			original_offset = offset,
			step,
			args;

		if ( this.rejected || this.suppressed ) {
			if ( handler.handle ) {
				handler.handle(error);
			}
			return;
		}
		length = this.steps.length;
		this.rejected = true;
		while ( offset < length ) {
			step = this.steps [offset];
			if ( step && step.handler !== null ) {
				if ( step.error_arguments ) {
					args = step.error_arguments.concat(error);
				}
				else {
					args = [error];
				}
				return void step.handler.apply(step.context || null, args);
			}
			offset ++;
		}
		offset = original_offset;
		while ( offset -- ) {
			step = this.steps [offset];
			if ( step && step.handler !== null ) {
				if ( step.error_arguments ) {
					args = step.error_arguments.concat(error);
				}
				else {
					args = [error];
				}
				return void step.handler.apply(step.context || null, args);
			}
		}
		if ( this.silenced === false ) {
			if ( handler.handle ) {
				return void handler.handle(error);
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
				current_result = utility.get_slice_result(step [index]);
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
		else if ( typeof step.assertion === 'function' && step.assertion.call(step.context || null, this.results) === false ) {
			if ( typeof step.label !== 'undefined' ) {
				assert_message = step.label;
			}
			else {
				assert_message = step.assertion.toString();
			}
			return void this.reject(new Error('Domain failed assertion: ' + assert_message), this.position - 1);
		}
		else if ( typeof step.then === 'function' ) {
			resultant_promise = step.then.call(step.context || null, this.results);
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
			}, this.exports ['break'].bind(this.exports));
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
			return void self.reject(error, offset);
		}

		if ( promise.args ) {
			primary = promise.args [0];
		}
		if ( typeof primary === 'function' ) {
			primary = Array.prototype.slice.call(promise.args);
		}
		if ( Object.prototype.toString.call(primary) === '[object Array]' ) {
			introspect_index = 1;
			while ( introspect_index < primary.length ) {
				current_introspect = primary [introspect_index];
				if ( current_introspect && typeof current_introspect.then === 'function' ) {
					introspect_index = 1;
					introspect_domain = this.exports.__clone();
					while ( introspect_index < primary.length ) {
						if ( primary [introspect_index] !== undefined ) {
							introspect_domain.and(primary [introspect_index]);
						}
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
						var
							immediate_result = introspect_domain.introspect.returned;

						if ( promise.reflection ) {
							promise.reflection.returned = immediate_result;
						}
						if ( immediate_result && typeof immediate_result.then === 'function' ) {
							immediate_result.then(promise.fulfill, promise.reject);
						}
						return void promise.fulfill(results.introspect);
					});
					introspect_domain.otherwise(promise.reject);
					break;
				}
				introspect_index ++;
			}
			if ( ! introspect_domain ) {
				resolved_args = promise.args.slice(0);
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
						var
							result;

						result = primary.apply(promise.context || null, resolved_args);
						if ( promise.reflection ) {
							promise.reflection.returned = result;
						}
						if ( result && typeof result.then === 'function' ) {
							result.then(promise.fulfill, promise.reject);
						}
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

		if ( typeof primary === 'undefined' ) {
			return setTimeout((function reject ( ) {
				this.reject(new Error('Chain step value cannot be undefined.'), this.position);
			}).bind(this), 0);
		}
		if ( primary && typeof primary.then === 'function' ) {
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
				promise.args = args;
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
			if ( utility.reserved_identifiers.indexOf(text) === -1 ) {
				this.exports [text] = new Reflector(step_item [step_item.length - 1]);
			}
		}
	}
};

module.exports = Chain;
