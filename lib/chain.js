var Step = require('./step'),
	Action = require('./action'),
	Stats = require('./stats'),
	bind = require('./util/bind'),
	slice = require('./util/slice'),
	isPromise = require('./util/is-promise'),
	isArray = require('./util/is-array'),
	isFunction = require('./util/is-function'),
	Settings = require('./settings'),
	Logger = require('./logger');

function Chain() {
	this.steps = [ ];
	this.results = [ ];

	this.markStartTime();

	// Let's go ahead and bind the context of these methods;
	// we're probably going to have to hand them off them multiple times.
	this.handleStepSuccess = bind(this.handleStepSuccess, this);
	this.handleStepFailure = bind(this.handleStepFailure, this);

	if (Settings.isLoggingEnabled()) {
		this.determineCallsite();
	}
}

Chain.prototype = {
	steps: null,
	results: null,
	is_timed: false,
	start_time: null,
	end_time: null,
	namespace: null,
	is_done: false,
	callsite: null
};

PrivateMethods: {

	Chain.prototype.addStep = function addStep() {
		var step = new Step(this);

		this.steps.push(step);

		// We bound the context of these methods in our constructor,
		// so we don't have to repeatedly do it here:
		step.then(
			this.handleStepSuccess,
			this.handleStepFailure
		);

		if (this.steps.length === 1) {
			this.setCurrentStep(step);
		}

		this.setInsertionStep(step);

		return step;
	};

	/**
	 * Set a new current step for this chain.
	 * The "current step" is the one we are currently waiting on to complete.
	 * @returns {Step}
	 */
	Chain.prototype.setCurrentStep = function setCurrentStep(step) {
		this.current_step = step;

		if (step) {
			step.activate();
		}
	};

	/**
	 * Return the step that we are currently waiting on to complete.
	 * The "current step" is the one we are currently waiting on to complete.
	 * @param {Step} step
	 */
	Chain.prototype.getCurrentStep = function getCurrentStep() {
		return this.current_step;
	};


	/**
	 * Returns the last step in the chain; pretty straightforward, right?
	 * @returns {Step}
	 */
	Chain.prototype.getLastStep = function getLastStep() {
		return this.steps[this.steps.length - 1];
	};

	Chain.prototype.getInsertionStep = function getInsertionStep() {
		return this.insertion_step;
	};

	Chain.prototype.setInsertionStep = function setInsertionStep(step) {
		this.insertion_step = step;
	};

	Chain.prototype.getStepAfter = function getStepAfter(step) {
		var index = this.steps.indexOf(step);

		if (index === -1 || index === this.steps.length - 1) {
			return null;
		}

		return this.steps[index + 1];
	};

	Chain.prototype.getStepBefore = function getStepBefore(step) {
		var index = this.steps.indexOf(step);

		// If the resultant index is -1 (not found) or 0 (the first element),
		// we can just bail out and return a null value.
		if (index < 1) {
			return null;
		}

		return this.steps[index - 1];
	};

	Chain.prototype.labelStepResults = function labelStepResults(step) {
		var results = this.results,
			actions = step.getAllActions(),
			index = 0,
			action,
			action_result,
			labels;

		while (index < actions.length) {
			action = actions[index++];

			if (action.isOmitted()) {
				continue;
			}

			labels = action.getAllLabels();
			action_result = action.getResult();

			labels.forEach(function each(label) {
				results[label] = action_result;
			});
		}
	};

	Chain.prototype.handleStepSuccess = function handleStepSuccess(results) {
		var current_step = this.getCurrentStep(),
			next_step = this.getStepAfter(current_step);

		this.results.push.apply(this.results, results);
		this.labelStepResults(current_step);

		if (!next_step) {
			this.setCurrentStep(null);
			return;
		}

		this.setCurrentStep(next_step);
	};

	Chain.prototype.handleStepFailure = function handleStepFailure(error) {

		if (Settings.isLoggingEnabled()) {
			this.logError(error);
		}

		var step = this.getLastStep();

		// Notice that we don't log timing for steps that fail.

		while (step) {
			if (step.hasFailureAction()) {
				try {
					step.dispatchFailureAction(error);
					return;
				} catch(new_error) {
					error = new_error;
				}
			}

			step = this.getStepBefore(step);
		}

		// If we make it this far, it means that there was never
		// an error handler attached via "otherwise()" or similar.
		// In this case, we should just throw the error outright.
		//
		// However, we need to do so on the next tick, because:
		//
		// 1) "handleStepFailure" is executed within the resolution
		//	  step of a promise
		//
		// 2) When a callback passed to "promise.then()" throws an error,
		// 	  that error is caught by the promise layer and used to
		//	  break the promise, rather than throwing outright.
		//
		// ... but throwing outright is what we want in this case,
		// hence the "setTimeout". We don't want the error to get swallowed up.
		setTimeout(function deferred() {
			throw error;
		}, 0);
	};

	Chain.prototype.logError = function logError(error) {
		var namespace = this.getNamespace();

		if (namespace) {
			Logger.error('Chain "' + namespace + '" intercepted an error!');
		} else {
			Logger.error('An anonymous promix chain intercepted an error!');
		}

		Logger.error(error);
		Logger.error('(created ' + this.callsite + ')');
	};

	Chain.prototype.determineCallsite = function determineCallsite() {
		var stack;

		try {
			throw new Error('abstracted');
		} catch(error) {
			stack = error.stack;
			this.callsite = stack.split('\n')[4];
		}

		if (this.callsite) {
			this.callsite = this.callsite.replace('\t', '');
		}
	};

	Chain.prototype.canUseLabelAsAlias = function canUseLabelAsAlias(label) {
		if (label in Chain.prototype) {
			return false;
		}

		return true;
	};

	Chain.prototype.addAction = function addAction(parameters) {
		var step = this.getInsertionStep() || this.addStep(),
			action = step.addAction(parameters);

		this.aliasAction(action, 'last');

		return action;
	};

	Chain.prototype.aliasAction = function aliasAction(action, label) {
		if (this.canUseLabelAsAlias(label)) {
			this[label] = action;
		}
	};

	Chain.prototype.getResults = function getResults() {
		return this.results;
	};

	// Time functions

	Chain.prototype.getNamespace = function getNamespace() {
		return this.namespace;
	};

	/**
	 * Takes a generic action label, and formats it for the Stats aggregator
	 * to properly consume by prepending this chain's namespace, if set.
	 *
	 * @param {String} label - an action label
	 * @return {String} metric namespace
	 */
	Chain.prototype.resolveMetricNamespace = function resolveMetricNamespace(
		label
	) {
		var name = this.getNamespace();

		if (name) {
			return name + '.' + label;
		} else {
			return label;
		}
	};

	Chain.prototype.logActionTiming = function logActionTiming(action) {
		// If an action hasn't had any labels set,
		// we don't have anything to log by:
		if (!action.hasLabels()) {
			return;
		}

		var time = action.getTimeToComplete(),
			labels = action.getAllLabels(),
			index = 0;

		while (index < labels.length) {
			Stats.augment(this.resolveMetricNamespace(labels[index]), time);

			index++;
		}
	};

	Chain.prototype.isTimed = function isTimed() {
		return this.is_timed;
	};

	Chain.prototype.markStartTime = function markStartTime() {
		this.start_time = Date.now();
	};

	Chain.prototype.markEndTime = function markEndTime() {
		this.end_time = Date.now();
	};

	Chain.prototype.isDone = function isDone() {
		return this.is_done;
	};

	Chain.prototype.registerOnce = function registerOnce(
		method,
		emitter,
		event
	) {
		var done,
			result,
			fired = false;

		method.call(this, function interstitial(dummy, callback) {
			if (fired) {
				return void callback(null, result);
			}

			done = callback;
		}, null);

		function handler(primary) {
			result = primary;
			fired = true;

			if (done) {
				done(null, result);
			}
		}

		if (typeof emitter.once === 'function') {
			emitter.once(event, handler);
		} else {
			emitter.on(event, function wrapper() {
				handler.apply(this, arguments);
				emitter.off(event, wrapper);
			});
		}

		return this;
	};

	Chain.prototype.advanceToNextPredicate = function advanceToNextPredicate() {
		var
			index = this.steps.indexOf(this.getCurrentStep()) + 1,
			step;

		while (index < this.steps.length) {
			step = this.steps[index];

			index++;

			if (step.isStartPredicate() || step.isEndPredicate()) {
				break;
			} else {
				index--;
				this.steps.splice(index, 1);
			}
		}
	};

	Chain.prototype.removeSubsequentPredicates = function removeSubsequentPredicates() {
		var
			current_step = this.getCurrentStep(),
			step,
			start_predicate = null,
			index = this.steps.indexOf(current_step) + 1;

		while (index < this.steps.length) {

			step = this.steps[index];

			index++;

			if (!start_predicate && step.isStartPredicate()) {
				start_predicate = step;
			}

			if (start_predicate) {
				if (step.isEndPredicate()) {
					break;
				} else {
					index--;
					this.steps.splice(index, 1);
				}
			}
		}
	};

	Chain.prototype.addIfElseStep = function addIfElseStep(promise) {
		this.then(function then(result, callback) {
			if (!result) {
				this.advanceToNextPredicate();
			} else {
				this.removeSubsequentPredicates();
			}

			callback(null);
		}, promise).bind(this).omit();

		this.getInsertionStep().flagAsStartPredicate();
		this.addStep();
	};

}


PublicMethods: {

	Chain.prototype.and = function and() {
		this.addAction(arguments);

		return this;
	};

	Chain.prototype.andCall = function andCall(fn, context) {
		if (typeof fn !== 'function') {
			throw new Error(
				'First argument to chain.andCall() must be a function'
			);
		}

		this.and(function abstracted(dummy, callback) {
			fn.call(context || this, callback);
		}, null);

		return this;
	};

	Chain.prototype.then = function then() {
		var insertion_step = this.getInsertionStep();

		if (insertion_step && !insertion_step.isEmpty()) {
			this.addStep();
		}

		this.addAction(arguments);

		return this;
	};

	Chain.prototype.thenCall = function thenCall(fn, context) {
		if (typeof fn !== 'function') {
			throw new Error(
				'First argument to chain.thenCall() must be a function'
			);
		}

		this.then(function abstractedThen(dummy, callback) {
			fn.call(context || this, callback);
		}, null);

		return this;
	};

	Chain.prototype.otherwise = function otherwise() {
		var step = this.getInsertionStep();

		if (!step || step.hasFailureAction()) {
			step = this.addStep();
		}

		step.setFailureAction(arguments);

		return this;
	};

	Chain.prototype.sleep = function sleep(duration) {
		this.thenCall(function starter(callback) {
			setTimeout(function deferred() {
				callback(null);
			}, duration || 0);
		});

		return this;
	};

	Chain.prototype.as = function as(label) {
		var action = this.getInsertionStep().getLastAction();

		if (!action) {
			return;
		}

		action.addLabel(label);
		this.aliasAction(action, label);

		return this;
	};

	Chain.prototype.bind = function bind(context) {
		var step = this.getInsertionStep(),
			action;

		if (step.hasFailureAction()) {
			action = step.getFailureAction();
		} else {
			action = step.getLastAction();
		}

		if (action) {
			action.setContext(context);
		}

		return this;
	};

	Chain.prototype.callback = function callback(fn) {
		this.then(function interstitial(results) {
			fn(null, results);
		});
		this.otherwise(fn);

		return this;
	};

	Chain.prototype.omit = function omit() {
		var action = this.getInsertionStep().getLastAction();

		if (action) {
			action.omit();
		}

		return this;
	};

	Chain.prototype.each = function each(array, fn, sequential) {
		var method = sequential ? this.then : this.and;

		if (isPromise(array)) {
			method.call(this, function interstitial(results, callback) {
				this.each(results, fn, sequential);
				callback(null);
			}, array).bind(this).omit();

			return;
		}

		var index = 0;

		while (index < array.length) {
			method.call(this, fn, array[index]);
			index++;
		}

		return this;
	};

	Chain.prototype.thenEach = function thenEach(array, fn) {
		return this.each(array, fn, true);
	};

	Chain.prototype.end = function end() {
		var args = slice(arguments),
			fn = args.shift();

		if (!isFunction(fn)) {
			throw new Error(
				'First argument to "chain.end()" must be a function'
			);
		}

		var done = bind(this.done, this);

		function handler() {
			var args = slice(arguments),
				callback = args.pop();

			// If the user calls ".bind()" subsequent to calling ".end()",
			// supplying "this" below will preserve the desired context:
			fn.apply(this, args);
			callback(null);

			// ... but it also means that we need to make sure that the context
			// is baked into the following, hence the "bind()" call above:
			done();
		}

		args.unshift(handler);

		this.then.apply(this, args);

		return this;
	};

	Chain.prototype.name = function name(namespace) {
		this.namespace = namespace;

		return this;
	};

	Chain.prototype.time = function time() {
		this.is_timed = true;

		return this;
	};

	Chain.prototype.done = function done() {
		var namespace = this.getNamespace();

		this.markEndTime();

		if (this.isTimed() && namespace) {
			Stats.augment(namespace, this.getTimeToComplete());
		}

		this.is_done = true;

		return this;
	};

	Chain.prototype.pipe = function pipe() {
		var args = slice(arguments);

		if (isPromise(this.last)) {
			args.push(this.last);
		}

		this.then.apply(this, args);

		return this;
	};

	Chain.prototype.andOnce = function andOnce(emitter, event) {
		return this.registerOnce(this.and, emitter, event);
	};

	Chain.prototype.thenOnce = function thenOnce(emitter, event) {
		return this.registerOnce(this.and, emitter, event);
	};

	Chain.prototype.using = function using() {
		var args = slice(arguments),
			step = this.getInsertionStep();

		if (!step) {
			throw new Error(
				'Cannot use .using() method before defining a chain step'
			);
		}

		var action = step.getLastAction();

		args.forEach(function each(arg) {
			if (typeof arg === 'string' && this[arg] instanceof Action) {
				action.addArgument(this[arg]);
			} else {
				action.addArgument(arg);
			}
		}, this);

		return this;
	};

	Chain.prototype.if = function _if(promise) {
		this.addStep().flagAsEndPredicate();
		this.addIfElseStep(promise);
		return this;
	};

	Chain.prototype.elseIf = function elseIf(promise) {
		this.addIfElseStep(promise);
		return this;
	};

	Chain.prototype.else = function _else() {
		this.addStep().flagAsStartPredicate();

		if (arguments.length) {
			return this.then.apply(this, arguments);
		} else {
			return this;
		}
	};

	Chain.prototype.endIf = function endIf() {
		this.addStep().flagAsEndPredicate();
		return this;
	};

}

module.exports = Chain;
