var
	Promise = require('./Promise'),
	Chain = require('./Chain'),
	global_val = (function ( ) { return this; }).call(null),
	promise_types,
	map,
	lookups,
	lookup,
	key,
	current,
	generator,
	prototype,
	prototypes = { },
	generators = { },
	property,
	index;


function StringPromise ( value ) {
	var
		promise = new Promise(new generators ['String']());

	promise.valueOf = lookups.String.valueOf;
	setTimeout(function ( ) {
		if ( value && typeof value.then === 'function' ) {
			value.then(promise.fulfill, promise.reject);
		}
		else {
			promise.fulfill(value);
		}
	}, 0);
	return promise;
}

function ArrayPromise ( value ) {
	var
		promise = new Promise(new generators ['Array']()),
		chain = new Chain(),
		args = Array.prototype.slice.call(arguments);

	promise.valueOf = lookups.Array.valueOf;
	function resolver ( ) {
		return void promise.fulfill.apply(promise, Array.prototype.slice.call(arguments));
	}

	args.unshift(resolver);
	chain.end.apply(chain, args);
	chain.otherwise(promise.reject);
	return promise;
}

function NumberPromise ( value ) {
	var
		promise = new Promise(new generators ['Number']());
	
	promise.valueOf = lookups.Number.valueOf;
	setTimeout(function ( ) {
		if ( value && typeof value.then === 'function' ) {
			value.then(promise.fulfill, promise.reject);
		}
		else {
			promise.fulfill(+ value);
		}
	}, 0);
	return promise;

}

function BooleanPromise ( value ) {

}

function ObjectPromise ( value ) {
		var
		promise = new Promise(new generators ['Object']());

	promise.valueOf = lookups.Object.valueOf;
	setTimeout(function ( ) {
		if ( value && typeof value.then === 'function' ) {
			value.then(promise.fulfill, promise.reject);
		}
		else {
			promise.fulfill(value);
		}
	}, 0);
	return promise;
}

promise_types = {
	'String' : StringPromise,
	'Array' : ArrayPromise,
	'Number' : NumberPromise,
	'Boolean' : BooleanPromise,
	'Object' : ObjectPromise
};

lookups = {
	'String' : {
		charAt : String.prototype.charAt,
		concat : String.prototype.concat,
		'escape' : global_val.escape,
		'unescape' : global_val.unescape,
		'encodeURI' : global_val.encodeURI,
		'encodeURIComponent' : global_val.encodeURIComponent,
		'decodeURI' : global_val.decodeURI,
		'decodeURIComponent' : global_val.decodeURIComponent,
		indexOf : String.prototype.indexOf,
		match : String.prototype.match,
		replace : String.prototype.replace,
		split : String.prototype.split,
		slice : String.prototype.slice,
		substr : String.prototype.substr,
		substring : String.prototype.substring,
		toLowerCase : String.prototype.toLowerCase,
		toUpperCase : String.prototype.toUpperCase,
		trim : String.prototype.trim,
		length : function length ( ) {
			return this.length;
		},
		toFloat : function toFloat ( ) {
			return parseFloat(this);
		},
		toInt : function toInt ( radix ) {
			return parseInt(this, radix || 10);
		},
		parse : function parse ( ) {
			var
				result;

			try {
				result = JSON.parse(this);
			}
			catch ( error ) {
				return error;
			}
			return result;
		},
		valueOf : function valueOf ( ) {
			return 'StringPromise';
		},
		get : function get ( key ) {
			return this [key];
		},
		set : function set ( key, value ) {
			this [key] = value;
			return this;
		},
		'delete' : function _delete ( key ) {
			delete this [key];
			return this;
		},
		keys : function keys ( ) {
			return Object.keys(this);
		},
		toJSON : function toJSON ( ) {
			return JSON.stringify(this);
		}
	},
	'Array' : {
		filter : Array.prototype.filter || function filter ( callback, context ) {
			var
				index = 0,
				length = this.length,
				current_result,
				results = [ ];

			while ( index < length ) {
				current_result = callback.call(context, this [index]);
				if ( current_result ) {
					results.push(current_result);
				}
				index ++;
			}
		},
		forEach : Array.prototype.forEach || function for_each ( callback, context ) {
			var
				index = 0,
				length = this.length;

			while ( index < length ) {
				callback.call(context, this [index], index, this);
				index ++;
			}
			return this;
		},
		map : Array.prototype.map || function ( callback, context ) {
			var
				index = 0,
				length = this.length,
				result = [ ];

			while ( index < length ) {
				result.push(callback.call(context, this [index], index, this));
				index ++;
			}
			return result;
		},
		pop : Array.prototype.pop,
		push : Array.prototype.push,
		reverse : Array.prototype.reverse,
		shift : Array.prototype.shift,
		sort : Array.prototype.sort,
		splice : Array.prototype.splice,
		unshift : Array.prototype.unshift,
		concat : Array.prototype.concat,
		join : Array.prototype.join,
		slice : Array.prototype.slice,
		toString : Array.prototype.toString,
		indexOf : Array.prototype.indexOf,
		lastIndexOf : Array.prototype.lastIndexOf,
		valueOf : function valueOf ( ) {
			return 'ArrayPromise';
		},
		get : function get ( key ) {
			return this [key];
		},
		set : function set ( key, value ) {
			this [key] = value;
			return this;
		},
		'delete' : function _delete ( key ) {
			delete this [key];
			return this;
		},
		keys : function keys ( ) {
			return Object.keys(this);
		},
		toJSON : function toJSON ( ) {
			return JSON.stringify(this);
		}
	},
	'Number' : {
		toFixed : Number.prototype.toFixed,
		toPrecision : Number.prototype.toPrecision,
		toLocaleString : Number.prototype.toLocaleString,
		toString : Number.prototype.toString,
		toExponential : Number.prototype.toExponential,
		valueOf : function valueOf ( ) {
			return 'NumberPromise';
		},
		plus : function plus ( ) {
			var
				total = + this,
				index = arguments.length;

			while ( index -- ) {
				total += arguments [index];
			}
			return total;
		},
		minus : function minus ( ) {
			var
				total = + this,
				index = arguments.length;

			while ( index -- ) {
				total -= arguments [index];
			}
			return total;
		},
		times : function times ( ) {
			var
				total = + this,
				index = arguments.length;

			while ( index -- ) {
				total *= arguments [index];
			}
			return total;
		},
		divideBy : function divideBy ( ) {
			var
				total = + this,
				index = arguments.length;

			while ( index -- ) {
				total /= arguments [index];
			}
			return total;
		},
		round : function round ( ) {
			return Math.round(+ this);
		},
		ceil : function ceil ( ) {
			return Math.ceil(+ this);
		},
		floor : function floor ( ) {
			return Math.floor(+ this);
		},
		average : function averageWith ( ) {
			var
				total = + this,
				index = 0,
				length = arguments.length;

			while ( index < length ) {
				total += arguments [index];
				index ++;
			}
			return total / ( length + 1 );
		},
		modulus : function modulus ( divisor ) {
			return ( + this ) % divisor;
		},
		pow : function pow ( power ) {
			return Math.pow(+ this, power);
		},
		abs : function abs ( ) {
			return Math.abs(+ this);
		},
		max : function max ( ) {
			return Math.max.apply(Math, Array.prototype.slice.call(arguments).concat(+ this));
		},
		min : function min ( ) {
			return Math.min.apply(Math, Array.prototype.slice.call(arguments).concat(+ this));
		},
		get : function get ( key ) {
			return this [key];
		},
		set : function set ( key, value ) {
			this [key] = value;
			return this;
		},
		'delete' : function _delete ( key ) {
			delete this [key];
			return this;
		},
		keys : function keys ( ) {
			return Object.keys(this);
		},
		toJSON : function toJSON ( ) {
			return JSON.stringify(this);
		}

	},
	'Object' : {
		get : function get ( key ) {
			return this [key];
		},
		set : function set ( key, value ) {
			this [key] = value;
			return this;
		},
		'delete' : function _delete ( key ) {
			delete this [key];
			return this;
		},
		keys : function keys ( ) {
			return Object.keys(this);
		},
		values : function values ( ) {
			var
				map = this;

			return Object.keys(map).map(function ( property ) {
				return map [property];
			});
		},
		extend : function extend ( target, source, overwrite ) {
			var
				key;

			if ( typeof target === 'undefined' || target === null ) {
				if ( typeof source === 'undefined' || source === null ) {
					return { };
				}
				return source;
			}
			for ( key in source ) {
				if ( source.hasOwnProperty(key) ) {
					if ( typeof target [key] === 'undefined' || overwrite ) {
						target [key] = source [key];
					}
				}
			}
			return target;
		},
		clone : function clone ( original, deep ) {
			var
				key,
				property,
				type,
				result = { };

			for ( key in original ) {
				if ( original.hasOwnProperty(key) ) {
					property = original [key];
					type = typeof property;
					if ( type === 'string' || type === 'number' || type === 'boolean' || type === 'function' || property === null || property instanceof RegExp ) {
						result [key] = property;
					}
					else if ( Object.prototype.toString.call(property) === '[object Array]' ) {
						result [key] = deep ? property.slice(0) : property;
					}
					else {
						result [key] = clone(property, deep);
					}
				}
			}
			return result;
		},
		valueOf : function valueOf ( ) {
			return 'ObjectPromise';
		},
		toString : function toString ( ) {
			return this.toString();
		},
		toNumber : function toNumber ( ) {
			return + this;
		},
		toArray : function toArray ( ) {
			return [this];
		},
		toObject : function toObject ( ) {
			return this;
		},
		toJSON : function toJSON ( ) {
			return JSON.stringify(this);
		}
	}
};
lookup = lookups.String;
lookup.parseFloat = lookup.toFloat;
lookup.parseInt = lookup.toInt;
lookup.json = lookup.toJSON;
lookup = lookups.Number;
lookup.raiseTo = lookup.power = lookup.pow;
lookup.add = lookup.plus;
lookup.subtract = lookup.minus;
lookup.multiply = lookup.times;
lookup.divide = lookup.divideBy;
lookup.mean = lookup.average;
lookup.avg = lookup.average;
lookup.mod = lookup.modulus;
lookup.json = lookup.toJSON;
lookup = lookups.Array;
lookup.json = lookup.toJSON;
lookup.each = lookup.forEach;
lookup = lookups.Object;
lookup.json = lookup.toJSON;
lookup.copy = lookup.clone;

map = {
	'String' : [
		['escape', 'String'],
		['unescape', 'String'],
		['encodeURI', 'String'],
		['decodeURI', 'String'],
		['encodeURIComponent', 'String'],
		['decodeURIComponent', 'String'],
		['charAt', 'String'],
		['concat', 'String'],
		['indexOf', 'Number'],
		['length', 'Number'],
		['match', 'Array'],
		['replace', 'String'],
		['split', 'Array'],
		['slice', 'String'],
		['substr', 'String'],
		['substring', 'String'],
		['toLowerCase', 'String'],
		['toUpperCase', 'String'],
		['trim', 'String'],
		['toInt', 'Number'],
		['toFloat', 'Number'],
		['parseInt', 'Number'],
		['parseFloat', 'Number'],
		['get', 'Object'],
		['set', 'String'],
		['delete', 'String'],
		['keys', 'Array'],
		['parse', 'Object'],
		['toJSON', 'String'],
		['json', 'String']
	],
	'Array' : [
		['map', 'Array'],
		['reduce', 'Object'],
		['filter', 'Array'],
		['each', 'Array'],
		['foreach', 'Array'],
		['pop', 'Object'],
		['push', 'Number'],
		['reverse', 'Array'],
		['shift', 'Object'],
		['sort', 'Array'],
		['splice', 'Array'],
		['unshift', 'Number'],
		['concat', 'Array'],
		['join', 'String'],
		['slice', 'Array'],
		['toString', 'String'],
		['indexOf', 'Number'],
		['lastIndexOf', 'Number'],
		['get', 'Object'],
		['set', 'Array'],
		['delete', 'Array'],
		['keys', 'Array'],
		['toJSON', 'String'],
		['json', 'String']
	],
	'Number' : [
		['toFixed', 'String'],
		['toExponential', 'String'],
		['toLocaleString', 'String'],
		['toPrecision', 'String'],
		['toString', 'String'],
		['plus', 'Number'],
		['add', 'Number'],
		['minus', 'Number'],
		['subtract', 'Number'],
		['times', 'Number'],
		['multiply', 'Number'],
		['divideBy', 'Number'],
		['divide', 'Number'],
		['round', 'Number'],
		['ceil', 'Number'],
		['floor', 'Number'],
		['average', 'Number'],
		['mean', 'Number'],
		['modulus', 'Number'],
		['mod', 'Number'],
		['pow', 'Number'],
		['raiseTo', 'Number'],
		['power', 'Number'],
		['abs', 'Number'],
		['min', 'Number'],
		['max', 'Number'],
		['get', 'Object'],
		['set', 'Number'],
		['delete', 'Number'],
		['keys', 'Array'],
		['toJSON', 'String'],
		['json', 'String']
	],
	'Object' : [
		['toString', 'String'],
		['toNumber', 'Number'],
		['toArray', 'Array'],
		['toJSON', 'String'],
		['json', 'String'],
		['get', 'Object'],
		['set', 'Object'],
		['values', 'Array'],
		['clone', 'Object'],
		['copy', 'Object'],
		['extend', 'Object'],
		['delete', 'Object'],
		['keys', 'Array']
	]
};

for ( key in map ) {
	if ( map.hasOwnProperty(key) ) {
		current = map [key];
		prototype = prototypes [key] = { };
		generators [key] = function ( ) { };
		generators [key].prototype = prototype;
		index = current.length;
		while ( index -- ) {
			property = current [index] [0];
			generator = promise_types [current [index] [1]];
			lookup = lookups [key];
			prototype [property] = ( function create_definition ( generator, property, lookup ) {
				return function abstracted_property ( ) {
					var
						internal_promise = new Promise(),
						promise = generator(internal_promise),
						args = Array.prototype.slice.call(arguments);

					function fulfill ( result ) {
						var
							chain;

						if ( typeof result === 'undefined' || result === null || typeof lookup [property] === 'undefined' ) {
							return void internal_promise.reject(new TypeError('Promise result ' + result + ' has no property ' + property));
						}
						if ( typeof lookup [property] === 'function' ) {
							//args.unshift(result [property]);
							args.unshift(function apply_property ( ) {
								var
									continuation;
							
								continuation = lookup [property].apply(result, Array.prototype.slice.call(arguments, 0, -1));
								internal_promise.fulfill(continuation);
							});
							chain = new Chain();
							chain.and.apply(chain, args);
							chain.otherwise(internal_promise.reject);
						}
						else if ( typeof result [property] !== 'undefined' ) {
							return void internal_promise.fulfill(result [property]);
						}
					}

					internal_promise.then(promise.fulfill, promise.reject);
					this.then(fulfill, promise.reject);
					return promise;
				};
			} ) (generator, property, lookup);
		}
	}
}

module.exports = {
	toString : StringPromise,
	toNumber : NumberPromise,
	toArray : ArrayPromise,
	toObject : ObjectPromise
};

