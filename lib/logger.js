var
	util = require('util'),
	config = { };


function formatRelativeSeconds ( timestamp ) {
	var
		now = Date.now(),
		difference = now - timestamp,
		seconds = difference / 1000;

	return seconds.toFixed(3) + 's ago';
}

function truncate ( string ) {
	var
		result = string.replace(/[\n\s\t]+/g, '');

	if ( result.length <= 35 ) {
		return result;
	}
	return result.slice(0, 32) + '...';
}

function getChildArgs ( child ) {
	var
		args = child.args || [ ];

	if ( args.length && typeof args [0] === 'function' ) {
		return util.format(args.slice(1));
	}
	return args;
}

function getChildResult ( child ) {
	if ( child.fulfilled ) {
		return '[' + ( typeof child.result ) + '] ' + truncate(util.format(child.result));
	}
	return '';
}

function getChildError ( child ) {
	if ( child.error ) {
		return truncate(util.format(child.error));
	}
	return '';
}

function getStepLabel ( step, fallback ) {
	var
		index = step.length,
		child;

	if ( ! index && step.label ) {
		return step.label;
	}
	while ( index -- ) {
		child = step [index];
		if ( ! child.labels || child.labels.length === 0 ) {
			continue;
		}
		return child.labels [child.labels.length - 1];
	}
	return fallback;
}

function getFunctionSlug ( fn ) {
	if ( config.aliases && fn.alias || fn.__alias ) {
		return getFunctionSlug(fn.alias || fn.__alias);
	}
	if ( fn.name && ! config.contents ) {
		return fn.name;
	}
	return truncate(fn.toString());
}


function getChildFunction ( item ) {
	var
		primary;

	if ( typeof item.then === 'function' && typeof item.fulfill !== 'function' ) {
		return getFunctionSlug(item.then);
	}
	if ( item.args ) {
		primary = item.args [0];
		if ( typeof primary === 'function' ) {
			return getFunctionSlug(primary);
		}
	}
	return '';
}

function logChild ( child, logger ) {
	logger('\tfunction:\t' + getChildFunction(child));
	logger('\targuments:\t' + getChildArgs(child));
	logger('\tresult:\t\t' + getChildResult(child));
	logger('\terror:\t\t' + getChildError(child));
	if ( child.start ) {
		logger('\tstarted:\t' + formatRelativeSeconds(child.start));
	}
	if ( child.finish ) {
		logger('\tfinished:\t' + formatRelativeSeconds(child.finish));
	}
}

function logChildren ( step, logger ) {
	var
		index = 0,
		length = step.length,
		child;

	while ( index < length ) {
		child = step [index];
		if ( child.length ) {
			logChildren(child, logger);
		}
		else {
			logChild(child, logger);
		}
		index ++;
	}
}

function logSteps ( chain, currentConfig, logger ) {
	var
		steps = chain.steps,
		index = 0,
		length = steps.length,
		step,
		priorConfig = config;

	config = currentConfig || { };

	if ( typeof logger !== 'function' ) {
		logger = console.log;
	}

	logger('\n');
	while ( index < length ) {
		step = steps [index];
		if ( index === chain.position ) {
			logger('========== HEAD ==========');
		}
		logger('STEP ' + getStepLabel(step, index) + ':');
		if ( step.length === 0 ) {
			logChild(step, logger);
		}
		logChildren(step, logger);
		if ( index === chain.position ) {
			logger('==========================');
		}
		index ++;
	}
	logger('\n');

	config = priorConfig;
}


module.exports = {
	logSteps : logSteps
};
