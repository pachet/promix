var Types = require('../constants/types'),
	TypeResolver = require('./resolver'),
	Promise = require('../promise'),
	clone = require('../util/clone'),
	isObject = require('../util/is-array'),
	isPromise = require('../util/is-promise');

function ObjectPromise(value) {
	this.value = value;

	Promise.call(this);

	if (isPromise(this.value)) {
		this.value.then(this.fulfill, this.break);
	} else if (this.value !== undefined) {
		this.fulfill(this.coerce(this.value));
	}
}

ObjectPromise.prototype = clone(Promise.prototype);

ObjectPromise.prototype.coerce = function coerce(value) {
	if (!value) {
		return { };
	} else {
		return value;
	}
};

TypeResolver.define(Types.OBJECT, ObjectPromise, Object, {
	delete: {
		returns: Types.OBJECT,
		method: function del(key) {
			delete this[key];

			return this;
		}
	},
	get: {
		returns: Types.OBJECT,
		method: function get(key) {
			return this[key];
		}
	},
	json: {
		returns: Types.STRING,
		method: function json() {
			return JSON.stringify(this);
		}
	},
	keys: {
		returns: Types.ARRAY,
		method: function keys() {
			return Object.keys(this);
		}
	},
	set: {
		returns: Types.OBJECT,
		method: function set(key, value) {
			this[key] = value;
			return this;
		}
	},
	toString: {
		returns: Types.STRING,
		method: function toString() {
			return '' + this.valueOf();
		}
	}
});

module.exports = ObjectPromise;
