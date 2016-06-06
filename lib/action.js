var
	Promise         = require('./promise'),
	clone           = require('./util/clone'),
	bind            = require('./util/bind'),
	slice           = require('./util/slice'),
	isPromise       = require('./util/is-promise'),
	isFunction      = require('./util/is-function'),
	replacePromises = require('./util/replace-promises'),
	Streams         = require('./streams');


function Action(step, args) {
	this.stamp = Math.random().toString(16).slice(3);
	this.labels = [ ];

	// store a local reference to this action's parent step:
	this.step = step;

	var primary = args[0];

	if (primary === undefined) {
		throw new Error('Action cannot be undefined');
	}

	// We don't call .apply() here, because we don't want the
	// promise constructor to process the supplied arguments.
	Promise.call(this);

	// We need to perform several checks in order to
	// determine what kinds of values we're dealing with.

	// First, let's check whether we were given a stream value
	// as the first argument. If so, we should wrap it in a promise.
	// Then we can just use that promise as if it'd been passed in as one.
	if (Streams.isStream(primary)) {
		primary = Streams.wrap(primary);
	}

	// If we have a promise as the first argument, we can just
	// hook into its completion state via ".then()":
	if (isPromise(primary)) {
		primary.then(
			this.fulfill,
			this.break
		);
		return;
	}

	// Okay, now we have promises out of the way.

	// If the first value we received isn't a function,
	// we can just fulfill this action with it as the result value:
	if (!isFunction(primary)) {
		this.fulfill(primary);
		return;
	}

	// Now that we know the first argument we received
	// is a function, we should store it for later
	// (we'll call it when this action is dispatched):
	this.fn = primary;

	// And we should store the remaining arguments, as well:
	this.args = slice(args, 1);
}

Action.prototype = clone(Promise.prototype);

Action.prototype.step = null;
Action.prototype.fn = null;
Action.prototype.args = null;
Action.prototype.labels = null;
Action.prototype.context = null;
Action.prototype.is_dynamic = true;
Action.prototype.is_failure_action = false;
Action.prototype.is_omitted = false;
Action.prototype.prefix = undefined;
Action.prototype.suffix = undefined;

Action.prototype.fulfill = function fulfill() {
	this.startEndTime();
	Promise.prototype.fulfill.apply(this, arguments);
};

Action.prototype.break = function breakPromise() {
	this.startEndTime();
	Promise.prototype.break.apply(this, arguments);
};


Action.prototype.execute = function execute() {
	var result,
		error_result,
		chain = this.step.chain;

	// This is important. In order to allow for
	// appending at the current step in the chain
	// from within an action being executed,
	// we need to set ourselves as the current
	// insertion point, but then reset afterwards.
	chain.setInsertionStep(this.step);

	this.markStartTime();

	try {
		result = this.fn.apply(this.context || this, this.args);
	} catch (error) {
		// If this action has been designated as a failure action
		// (eg, via "chain.otherwise()"), we should just throw the
		// error, so that any downstream failure actions can handle it.
		if (this.isFailureAction()) {
			// In this case, ".break()" will never be called,
			// so we need to manually log the end time ourselves.
			this.startEndTime();
			throw error;
		}

		// We need to store a reference to the error
		// in order to reference it from outside the catch block.
		// Not the most elegant thing ever.
		error_result = error;
	}

	chain.setInsertionStep(chain.getLastStep());

	if (error_result) {
		this.break(error_result);
		return;
	}

	if (isPromise(result)) {
		// If we got a promise back as the immediate result,
		// we should always treat this action as dynamic:
		this.is_dynamic = true;

		// We don't have to bind the context of these callback methods;
		// it's done automatically in the overridden Promise constructor.
		result.then(this.fulfill, this.break);
	} else if (!this.is_dynamic) {
		// If this action is non-dynamic (ie, the user attached a step that was
		// intended to receive the current result set, but not directly perform
		// perform any asynchronous behavior itself), then we should resolve
		// immediately so that our calling step will know we're done.

		this.fulfill(result);
	}
};

Action.prototype.handler = function handler(error, result) {
	if (error) {
		this.break(error);
	} else {
		this.fulfill(result);
	}
};

Action.prototype.handlePromisesResolved = function handlePromisesResolved(
	error
) {
	if (error) {
		this.break(error);
	} else {
		this.execute();
	}
};

Action.prototype.dispatch = function dispatch() {
	if (this.dispatched) {
		throw new Error('action was already dispatched');
	}

	this.dispatched = true;

	// If this action didn't have a function passed in,
	// it means we're either wrapping some other promise,
	// or are going to immediately resolve with some static value.
	// In that case, we can just bail out.
	if (!this.fn) {
		return;
	}

	if (!isFunction(this.fn)) {
		throw new Error(
			'action.fn was not a function (got ' + (typeof fn) + ')'
		);
	}

	// If there are no arguments, this step should just get passed the current
	// list of results for the entire chain as its only argument. Notice that
	// we wrap these results in an additional array to match "this.args".
	// We also flag this action as being non-dynamic.
	if (!this.args.length) {
		this.args = [this.step.chain.getResults()];
		this.is_dynamic = false;
	} else if (!this.isFailureAction()) {
		this.args.push(bind(this.handler, this));
	}

	if (this.prefix !== undefined) {
		this.args.unshift(this.prefix);
	}

	if (this.suffix !== undefined) {
		this.args.push(this.suffix);
	}

	replacePromises(this.args, bind(this.handlePromisesResolved, this));
};

Action.prototype.markAsFailureAction = function markAsFailureAction() {
	this.is_failure_action = true;
};

Action.prototype.isFailureAction = function isFailureAction() {
	return this.is_failure_action;
};

Action.prototype.addArgument = function addArgument(arg) {
	this.args.push(arg);
};

Action.prototype.addLabel = function addLabel(label) {
	this.labels.push(label);
};

Action.prototype.getAllLabels = function getAllLabels() {
	return this.labels;
};

Action.prototype.hasLabels = function hasLabels() {
	return this.labels.length > 0;
};

Action.prototype.getResult = function getResult() {
	return this.result;
};

Action.prototype.isDynamic = function isDynamic() {
	return this.is_dynamic;
};

Action.prototype.setContext = function setContext(context) {
	this.context = context;
};

Action.prototype.getContext = function getContext() {
	return this.context;
};

Action.prototype.omit = function omit() {
	this.is_omitted = true;
};

Action.prototype.isOmitted = function isOmitted() {
	return this.is_omitted;
};

Action.prototype.markStartTime = function markStartTime() {
	this.start_time = Date.now();
};

Action.prototype.startEndTime = function startEndTime() {
	this.end_time = Date.now();
};

Action.prototype.getElapsedTime = function getElapsedTime() {
	return Date.now() - this.start_time;
};

Action.prototype.getTimeToComplete = function getTimeToComplete() {
	return this.end_time - this.start_time;
};

Action.prototype.setPrefix = function setPrefix(prefix) {
	this.prefix = prefix;
};

Action.prototype.setSuffix = function setSuffix(suffix) {
	this.suffix = suffix;
};

module.exports = Action;
