
function bind() {
	var args = arguments,
		fn = args[0],
		context = args[1];

	return function boundFn() {
		var index,
			resolved_args;

		if (args.length > 2) {
			resolved_args = Array.prototype.slice.call(args, 2);
			index = 0;

			while (index < arguments.length) {
				resolved_args.push(arguments[index]);
				index++;
			}
		} else {
			resolved_args = arguments;
		}

		return fn.apply(context, resolved_args);
	};
}

module.exports = bind;
