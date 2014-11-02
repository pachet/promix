var
	Promise = require('./promise'),
	Step = require('./step'),
	Reflector = require('./reflector'),
	handler = require('./handler'),
	utils = require('./utils'),
	streams = require('./streams');

module.exports = Chain;

function Chain ( exports, args ) {
	this.exports = exports;
	this.steps = [ ];
	this.results = [ ];
	this.aliases = { };
	this.addStep();
	if ( args && args.length ) {
		this.addPromise.apply(this, utils.copy(args));
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
	promiseCount : 0,
	syncing : false,
	name : 'none set'
};

Chain.prototype.sync = function sync ( ) {
	var
		step = this.steps [this.position];

	this.syncing = true;
	if ( ! step ) {
		return this.syncing = false;
	}
	if ( step.preflight ) {
		step.cancel();
		step.dispatch();
	}
	else if ( this.broken === false ) {
		clearTimeout(step.dispatchTimer);
		this.dispatchStep(step);
	}
	this.syncing = false;
};

Chain.prototype.start = function start ( ) {
	var
		step = this.steps [this.position];

	if ( ! step.completed && this.broken === false ) {
		this.queue(step);
	}
};


Chain.prototype.queue = function queue ( step ) {
	clearTimeout(step.dispatchTimer);
	step.dispatchTimer = utils.next((function applyQueuedDispatch ( ) {
		this.dispatchStep(step);
	}).bind(this));
};

Chain.prototype.bind = function bind ( focus, context ) {
	var
		step = this.steps [focus],
		length,
		slice,
		sliceLength,
		item;

	if ( ! step || step.completed === true ) {
		return;
	}
	step.context = context;
	slice = step [step.length - 1];

	if (slice) {
		slice [slice.length - 1].context = context;
	}
};

Chain.prototype.suppress = function suppress ( label, state ) {
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
};

Chain.prototype.reject = function reject ( error, offset ) {
	var
		length,
		originalOffset = offset,
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
			if ( step.errorArguments ) {
				args = step.errorArguments.concat(error);
			}
			else {
				args = [error];
			}
			return void step.handler.apply(step.context || null, args);
		}
		offset ++;
	}
	offset = originalOffset;
	while ( offset -- ) {
		step = this.steps [offset];
		if ( step && step.handler ) {
			if ( step.errorArguments ) {
				args = step.errorArguments.concat(error);
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
};

Chain.prototype.complete = function complete ( step ) {
	var
		assertMessage,
		labels,
		index = 0,
		length = step.length,
		currentResult,
		currentFocus = this.focus,
		resultantPromise,
		conditionMatch;

	if ( this.rejected || this.broken ) {
		return;
	}
	this.focus = this.position;
	if ( length > 0 ) {
		while ( index < length ) {
			currentResult = utils.getSliceResult(step [index]);
			this.results.push(currentResult);
			if ( typeof step [index].labels !== 'undefined' ) {
				labels = step [index].labels.slice(0);
				while ( labels.length ) {
					this.results [labels.shift()] = currentResult;
					if ( step.condition && currentResult === step.conditionValue ) {
						conditionMatch = true;
					}
				}
			}
			index ++;
		}
	}
	else if ( typeof step.assertion === 'function' && step.assertion.call(step.context || null, this.results) === false ) {
		if ( typeof step.label !== 'undefined' ) {
			assertMessage = step.label;
		}
		else {
			assertMessage = step.assertion.toString();
		}
		return void this.reject(new Error('Domain failed assertion: ' + assertMessage), this.position - 1);
	}
	else if ( typeof step.then === 'function' ) {
		resultantPromise = step.then.call(step.context || null, this.results);
		if ( typeof resultantPromise !== 'undefined' ) {
			step.then = null;
			this.addPromise(resultantPromise);
			if ( typeof step.label !== 'undefined' ) {
				this.label(this.focus, step.label);
			}
			currentFocus --;
		}
	}
	if ( typeof resultantPromise === 'undefined' && ( conditionMatch || ! step.condition ) ) {
		step.completed = true;
		this.position ++;
	}
	else if ( step.conditionValue && typeof step.conditionValue.then === 'function' && step.conditionBound === false ) {
		step.conditionBound = true;
		step.conditionValue.then(function success ( result ) {
			step.condition = false;
		}, this.exports ['break'].bind(this.exports));
	}
	if ( this.position < this.steps.length ) {
		return void this.dispatchStep(this.steps [this.position]);
	}
};

Chain.prototype.dispatchStep = function dispatchStep ( step ) {
	var
		index,
		length = step.length,
		subIndex = 0,
		subLength,
		currentFocus = this.focus,
		complete;

	this.focus = this.position;
	if ( this.stopped === true || this.rejected === true ) {
		return;
	}
	if ( step.completed ) {
		index = this.steps.indexOf(step);
		if ( index === step.length - 1 ) {
			return;
		}
		return dispatchStep(this.steps [index + 1]);
	}
	complete = this.complete.bind(this);
	if ( length ) {
		this.slice = 0;
		while ( this.slice < length ) {
			subIndex = 0;
			subLength = step [this.slice].length;
			while ( subIndex < subLength ) {
				this.applyHooks(step, subIndex);
				subIndex ++;
			}
			this.slice ++;
		}
	}
	else {
		if ( this.syncing ) {
			return complete(step);
		}
		else {
			utils.next(function deferComplete ( ) {
				return void complete(step);
			});
		}
	}
	this.focus = currentFocus;
};

Chain.prototype.addStep = function addStep ( ) {
	var
		step = new Step();

	this.steps.splice(++ this.focus, 0, step);
	return step;
};

Chain.prototype.applyHooks = function applyHooks ( step, subIndex ) {
	var
		offset = this.focus,
		currentSlice = this.slice,
		invalidPromise,
		introspectIndex,
		currentIntrospect,
		resolvedArgs,
		introspectDomain,
		introspectArguments,
		introspectPrimary,
		self = this,
		name = this.name,
		steps = this.steps,
		primary = null,
		syncing = this.syncing,
		checkSyncing,
		dispatchPromise,
		tailDispatch = false,
		completed = false,
		promise = step [currentSlice] [subIndex];


	function success ( result ) {
		if ( completed ) {
			return;
		}
		completed = true;
		promise.finish = Date.now();
		step.completeCount ++;
		if ( step.completeCount >= step.length ) {
			return void self.complete(step);
		}
	}

	function failure ( error ) {
		if ( completed ) {
			return;
		}
		completed = true;
		promise.finish = Date.now();
		if ( promise.parent.suppressed || self.suppressed ) {
			if ( ! promise.parent.suppressed && typeof self.suppressed === 'number' ) {
				self.suppressed --;
			}
			completed = false;
			return void success(null);
		}
		return void self.reject(error, offset);
	}

	// because the syncing state may change before this method completes,
	// we can use this function to return the value as it currently exists:
	checkSyncing = (function checkSyncing ( ) {
		return this.syncing;
	}).bind(this);

	if ( promise.args ) {
		primary = promise.args [0];
	}
	if ( typeof primary === 'function' ) {
		primary = utils.copy(promise.args);
	}
	if ( Object.prototype.toString.call(primary) === '[object Array]' ) {
		introspectIndex = 1;
		while ( introspectIndex < primary.length && ! this.syncing ) {
			currentIntrospect = primary [introspectIndex];
			if ( currentIntrospect && typeof currentIntrospect.then === 'function' ) {
				introspectIndex = 1;
				introspectDomain = this.exports.__clone();
				while ( introspectIndex < primary.length ) {
					if ( primary [introspectIndex] !== undefined ) {
						introspectDomain.and(primary [introspectIndex]);
					}
					introspectIndex ++;
				}
				introspectPrimary = primary [0];
				introspectDomain.then(function compositeIntrospect ( results ) {
					var
						args = [introspectPrimary].concat(results);

					if ( step.endpoint ) {
						introspectDomain.end.apply(introspectDomain, args);
					}
					else {
						introspectDomain.then.apply(introspectDomain, args).as('introspect');
					}
					if ( promise.context ) {
						introspectDomain.bind(promise.context);
					}
				});
				introspectDomain.then(function fulfillIntrospect ( results ) {
					var
						immediateResult = introspectDomain.introspect.returned;

					if ( promise.reflection ) {
						promise.reflection.returned = immediateResult;
					}
					if ( immediateResult && typeof immediateResult.then === 'function' ) {
						immediateResult.then(promise.fulfill, promise.reject);
					}
					return void promise.fulfill(results.introspect);
				});
				introspectDomain.otherwise(promise.reject);
				break;
			}
			introspectIndex ++;
		}
		if ( ! introspectDomain ) {
			resolvedArgs = promise.args.slice(0);
			primary = resolvedArgs.shift();
			if ( ! step ) {
				return;
			}
			if ( step.condition ) {
				promise = new Promise(promise);
				step.completeCount = 0;
			}
			if ( typeof primary === 'function' ) {
				if ( ! step.endpoint ) {
					resolvedArgs.push(function resolvePromise ( error, result ) {
						if ( error ) {
							promise.reject(error);
						}
						else {
							promise.fulfill(result);
						}
						if ( checkSyncing() && typeof promise.sync === 'function' ) {
							promise.sync();
						}
					});
				}
				dispatchPromise = function dispatchPromise ( ) {
					var
						result,
						syncing = checkSyncing(),
						index;

					step.preflight = false;
					index = step.dispatchers.indexOf(dispatchPromise);
					if ( index !== -1 ) {
						step.dispatchers.splice(index, 1);
					}
					result = primary.apply(promise.context || null, resolvedArgs);
					if ( promise.reflection ) {
						promise.reflection.returned = result;
					}
					if ( result && typeof result.then === 'function' ) {
						result = result.then(promise.fulfill, promise.reject);
						// determine if we can/should force the resultant promise
						// into sync mode:
						if ( syncing && result && typeof result.sync === 'function' ) {
							result.sync();
						}
					}
				};
				// if we're in sync mode, wait to dispatch until the
				// tail of the current function:
				if ( this.syncing ) {
					tailDispatch = true;
				}
				else {
					step.preflight = true;
					/*
					step.timers.push(utils.next(dispatchPromise));
					step.dispatchers.push(dispatchPromise);
					*/
					dispatchPromise();
				}
			}
			else {
				utils.next(function fulfillPromise ( ) {
					if ( resolvedArgs.length ) {
						return void promise.fulfill([primary].concat(resolvedArgs));
					}
					else {
						return void promise.fulfill(primary);
					}
				});
			}
		}
	}
	else if ( ( ! primary || typeof primary.then !== 'function' ) && this.strict ) {
		invalidPromise = primary;
		utils.next(function rejectPromise ( ) {
			var
				labelInfix = '';

			if ( steps [offset] [currentSlice] && steps [offset] [currentSlice].labels ) {
				labelInfix = ' (labelled "' + steps [offset] [currentSlice].labels [0] + '")';
			}
			return void promise.reject(new Error('The domain (named "' + name + '") was given an invalid promise' + labelInfix + ': ' + invalidPromise));
		});
	}
	if ( promise.constructor === Chain ) {
		promise.then(success).otherwise(failure);
	}
	else {
		promise.then(success, failure);
	}
	promise.start = Date.now();
	if ( tailDispatch ) {
		dispatchPromise();
	}
	if ( checkSyncing() && completed === false ) {
		success(null);
	}
};

Chain.prototype.addPromise =  function addPromise ( primary, secondary ) {
	var
		promise,
		step,
		args = utils.copy(arguments);

	if ( typeof primary === 'undefined' ) {
		return setTimeout((function rejector ( ) {
			return this.reject(new Error('Chain step value cannot be undefined.'), this.position);
		}).bind(this), 0);
	}
	if ( primary && typeof primary.then === 'function' ) {
		promise = new Promise();
		primary.then(promise.fulfill, promise.reject);
	}
	else {
		this.promiseCount ++;
		promise = new Promise();
		if ( args.length === 1 && typeof primary !== 'function' ) {
			if ( primary instanceof streams.writable || primary instanceof streams.readable ) {
				streams.wrap(primary).then(promise.fulfill, promise.reject);
			}
			else {
				utils.next(function resolveImmediately ( ) {
					return void promise.fulfill(primary);
				});
			}
		}
		else {
			promise.args = args;
		}
	}
	step = this.steps [this.focus];
	if ( step.assertion !== null || step.then !== null ) {
		step = this.addStep();
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
};

Chain.prototype.label = function label ( index, text ) {
	var
		stepItem,
		reflector;

	if ( this.steps.length < index ) {
		return;
	}

	stepItem = this.steps [index];

	if ( stepItem.length === 0 ) {
		if ( text !== 'last' ) {
			stepItem.label = text;
			this.aliases [text] = stepItem;
		}
	}
	else {
		stepItem = stepItem [stepItem.length - 1];

		if ( text !== 'last' ) {
			if ( typeof stepItem.labels === 'undefined' ) {
				stepItem.labels = [ ];
			}
			stepItem.labels.push(text);
			this.aliases [text] = stepItem;
		}

		reflector = new Reflector(stepItem [stepItem.length - 1]);

		if ( utils.reserved.indexOf(text) === -1 ) {
			this.exports [text] = reflector;
		}
	}
};


