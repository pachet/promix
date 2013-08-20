function Step ( ) {
	this.complete = false;
	this.results = [ ];
	this.complete_count = 0;
	this.then = null;
	this.handler = null;
	this.assertion = null;
	this.condition = false;
	this.condition_value = null;
	this.condition_bound = false;
}

Step.prototype = [ ];

module.exports = Step;
