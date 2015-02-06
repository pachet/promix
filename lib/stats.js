var isArray = require('./util/is-array'),
	Metric = require('./metric');

// A map to store metrics, keyed by namespace:
var metrics = new Metric();

function get(namespace) {
	if (!namespace) {
		return metrics;
	}

	var metric = getNestedMetric(splitNamespace(namespace), false);

	if (metric) {
		return metric.enumerate();
	} else {
		return null;
	}
}

function splitNamespace(namespace) {
	return namespace.split('.');
}

function getNestedMetric(namespaces, create_missing) {
	var metric,
		namespace,
		// start at the root:
		current_node = metrics;

	while (current_node && namespaces.length) {
		namespace = namespaces.shift();
		metric = current_node.getChildMetric(namespace);

		if (!metric && create_missing) {
			metric = current_node.createChildMetric(namespace);
		}

		current_node = metric;
	}

	return current_node;
}

function augment(namespace, time) {
	var metric = getNestedMetric(splitNamespace(namespace), true);

	metric.augment(time);
}

function print(namespace) {
	var metric = get(namespace);

	if (!metric) {
		return void console.warn('Metric "' + namespace + '" not found');
	}

	metric.output();
}


module.exports = {
	get: get,
	print: print,
	augment: augment
};
