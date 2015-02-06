var
	reserved = [
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
	],
	next;

function getSliceResult ( slice ) {
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

function getItemTime ( item ) {
	item = item [item.length - 1];
	if ( ! item.start ) {
		return 0;
	}
	else {
		return ( item.finish || Date.now() ) - item.start;
	}
}

// turns a list of formal arguments into a real array:
function copy ( args ) {
	return Array.prototype.slice.call(args);
}

// use process.nextTick if we're running in Node:
if ( this.process && typeof this.process.nextTick === 'function' ) {
	next = process.nextTick;
}
else {
	next = function next ( fn ) {
		return setTimeout(fn, 0);
	};
}



module.exports = {
	next : next,
	copy : copy,
	getSliceResult : getSliceResult,
	getItemTime : getItemTime,
	reserved : reserved
};
