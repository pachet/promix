var
	utils = require('./utils');

function Step ( ) {
	this.timers = [ ];
	this.dispatchers = [ ];
	this.results = [ ];
}

Step.prototype = [ ];
Step.prototype.complete = false;
Step.prototype.completeCount = 0;
Step.prototype.then = null;
Step.prototype.handler = null;
Step.prototype.assertion = null;
Step.prototype.condition = null;
Step.prototype.conditionValue = null;
Step.prototype.conditionBound = false;
Step.prototype.preflight = false;

// determine whether the step is empty, eg, can be assigned a promise or fn to invoke:
Step.prototype.check = function check ( ) {
	return ( this.assertion === null && this.then === null && this.length === 0 );
};

Step.prototype.cancel = function cancel ( ) {
	while ( this.timers.length ) {
		clearTimeout(this.timers.pop());
	}
};

Step.prototype.dispatch = function dispatch ( ) {
	while ( this.dispatchers.length ) {
		this.dispatchers.pop()();
	}
};

Step.prototype.findMaxTime = function findMaxTime ( ) {
	var
		index = this.length,
		max = 0,
		current;

	while ( index -- ) {
		current = utils.getItemTime(this [index]);
		if ( current > max ) {
			max = current;
		}
	}
	return max;
};

module.exports = Step;
