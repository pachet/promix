var
	reserved_identifiers = [
		'and',
		'or',
		'name',
		'as',
		'then',
		'assert',
		'otherwise',
		'suppress',
		'unsuppress',
		'reject',
		'callback',
		'end',
		'stop',
		'start',
		'break',
		'bind',
		'until',
		'time',
		'results',
		'result'
	];

function get_slice_result ( slice ) {
	var
		index = 0,
		length = slice.length;

	while ( index < length ) {
		if ( slice [index].fulfilled === true ) {
			return slice [index].result;
		}
		index ++;
	}
	return null;
}

function check_step ( step ) {
	return ( step.assertion === null && step.then === null && step.length === 0 );
}

function get_item_time ( item ) {
	item = item [item.length - 1];
	if ( ! item.start ) {
		return 0;
	}
	else {
		return ( item.finish || Date.now() ) - item.start;
	}
}

function find_max_time ( step ) {
	var
		index = step.length,
		max = 0,
		current;

	while ( index -- ) {
		current = get_item_time(step [index]);
		if ( current > max ) {
			max = current;
		}
	}
	return max;
}


module.exports = {
	get_slice_result : get_slice_result,
	check_step : check_step,
	get_item_time : get_item_time,
	find_max_time : find_max_time,
	reserved_identifiers : reserved_identifiers
};
