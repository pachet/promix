var
	reporter;

try {
	reporter = require('nodeunit').reporters.default;
}
catch ( error ) {
	console.warn("\nPromix uses the nodeunit module for testing.");
	console.warn("Install it by running 'npm install' in the Promix root,");
	console.warn("or grab it from https://github.com/caolan/nodeunit\n");
	process.exit();
}

process.chdir(__dirname);
reporter.run(['./']);
