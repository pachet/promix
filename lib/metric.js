
function Metric(name) {
	this.name = name;
}

Metric.prototype = {
	name: null,
	times: null,
	children: null
};

Metric.prototype.augment = function augment(time) {
	if (!this.times) {
		this.times = [ ];
	}

	// We just store the time; no need recalculating
	// individual numbers before we are asked to do so.
	this.times.push(time);
};

Metric.prototype.createChildMetric = function createChildMetric(namespace) {
	if (!this.children) {
		this.children = [ ];
	}

	var child_metric = this.children[namespace] = new Metric(namespace);

	return child_metric;
};

Metric.prototype.getChildMetric = function getChildMetric(namespace) {
	if (this.children) {
		return this.children[namespace];
	} else {
		return null;
	}
};

Metric.prototype.enumerate = function enumerate() {

	var index = 0,
		count = this.times.length,
		total = 0;

	while (index < count) {
		total += this.times[index];
		index++;
	}

	var average = total / count;

	return {
		count: count,
		total: total,
		average: average
	};
};

module.exports = Metric;
