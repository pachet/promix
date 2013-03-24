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
	if ( item.start === null ) {
		return 0;
	}
	else {
		return ( item.finish || Date.now() ) - item.start;
	}
}

function add_times ( step ) {
	var
		index = step.length,
		total = 0;

	while ( index -- ) {
		total += get_item_time(step [index]);
	}
	return total;
}


module.exports = {
	get_slice_result : get_slice_result,
	check_step : check_step,
	get_item_time : get_item_time,
	add_times : add_times
};
