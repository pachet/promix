var Promise = require('./promise'),
	Action = require('./action'),
	clone = require('./util/clone'),
	bind = require('./util/bind');

function Step(chain) {
	this.chain = chain;
	this.stamp = Math.random().toString(16).slice(3);
	this.actions = [ ];
	this.results = [ ];

	// We don't call .apply() here, because we don't want the
	// promise constructor to process the supplied arguments.
	Promise.call(this);
}

Step.prototype = clone(Promise.prototype);

// Whether or not the step is the currently
// active step within its parent chain:
Step.prototype.is_active = false;

Step.prototype.actions = null;
Step.prototype.results = null;

Step.prototype.failure_action = null;
Step.prototype.completed_action_count = 0;
Step.prototype.is_start_predicate = false;
Step.prototype.is_end_predicate = false;
Step.prototype.is_callback = false;

Step.prototype.iteration_id = null;

Step.prototype.addAction = function addAction(parameters) {
	var action = this.createAction(parameters);

	this.actions.push(action);

	if (this.isActive() && !this.chain.isDone()) {
		this.dispatchAction(action);
	}

	return action;
};

Step.prototype.createAction = function createAction(parameters) {
	return new Action(this, parameters);
};

Step.prototype.dispatchAction = function dispatchAction(action) {
	action.then(
		bind(this.handleActionSuccess, this, action),
		bind(this.handleActionFailure, this, action)
	);

	// Don't dispatch the action until the next tick,
	// in order to guarantee proper asynchronous behavior:
	setTimeout(bind(action.dispatch, action), 0);
};

Step.prototype.setFailureAction = function setFailureAction(parameters) {
	var action = this.createAction(parameters);

	action.markAsFailureAction();

	this.failure_action = action;

	return action;
};

Step.prototype.getFailureAction = function getFailureAction() {
	return this.failure_action;
};

Step.prototype.hasFailureAction = function hasFailureAction() {
	return !!this.failure_action;
};

Step.prototype.dispatchFailureAction = function dispatchFailureAction(error) {
	this.failure_action.addArgument(error);
	this.failure_action.dispatch();
};

Step.prototype.getLastAction = function getLastAction() {
	return this.actions[this.actions.length - 1];
};

Step.prototype.getAllActions = function getAllActions() {
	return this.actions;
};

Step.prototype.handleActionSuccess = function handleActionSuccess(
	action,
	result
) {
	this.completed_action_count++;

	if (this.chain.isTimed()) {
		this.chain.logActionTiming(action);
	}

	if (this.completed_action_count === this.actions.length) {
		this.active = false;
		// We need to use this method to store the result values, ather
		// than storing them one by one as they are resolved, because the
		// actions are not guaranteed to resolve in the order they are added.
		this.fulfill(this.collectResults());
	}
};

Step.prototype.handleActionFailure = function handleActionFailure(
	action,
	error
) {
	// Notice that we don't log timing for actions that fail.

	this.active = false;
	this.break(error);
};


/**
 * After all actions have fulfilled, collect their results
 * and store them on "this.results", then return the results.
 *
 * @returns {Array} array of results from child actions
 */
Step.prototype.collectResults = function collectResults() {
	var index = 0,
		action;

	while (index < this.actions.length) {
		action = this.actions[index];

		// We should only add the result value from this action to our
		// results array if the action was not marked as omitted:
		if (!action.isOmitted() && action.isDynamic()) {
			this.results.push(action.result);
		}

		index++;
	}

	return this.results;
};

Step.prototype.isEmpty = function isEmpty() {
	return this.actions.length === 0;
};

Step.prototype.isActive = function isActive() {
	return this.is_active;
};

Step.prototype.activate = function activate() {
	this.is_active = true;

	var index = 0;

	while (index < this.actions.length) {
		this.dispatchAction(this.actions[index]);
		index++;
	}
};

Step.prototype.flagAsStartPredicate = function flagAsStartPredicate() {
	this.is_start_predicate = true;
};

Step.prototype.isStartPredicate = function isStartPredicate() {
	return this.is_start_predicate;
};

Step.prototype.flagAsEndPredicate = function flagAsEndPredicate() {
	this.is_end_predicate = true;
};

Step.prototype.isEndPredicate = function isEndPredicate() {
	return this.is_end_predicate;
};

Step.prototype.setContext = function setContext(context) {
	var action = this.getLastAction();

	if (action) {
		action.setContext(context);
	}
};

Step.prototype.setContextForAllActions = function setContextForAllActions(context) {
	this.actions.forEach(function each(action) {
		action.setContext(context);
	});
};

Step.prototype.isIteration = function isIteration() {
	return this.iteration_id !== null;
};

Step.prototype.setIterationId = function setIterationId(iteration_id) {
	this.iteration_id = iteration_id;
};

Step.prototype.getIterationId = function getIterationId() {
	return this.iteration_id;
};

Step.prototype.setIsCallback = function isCallback(is_callback) {
	this.is_callback = is_callback;
};

Step.prototype.isCallback = function isCallback() {
	return this.is_callback;
};


module.exports = Step;
