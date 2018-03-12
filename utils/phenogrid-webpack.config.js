const path = require('path');

module.exports = {
	entry: [
		"./node_modules/phenogrid/js/phenogrid.js"
	],
	output: {
		path: path.join(__dirname, "../gen"),
		filename: "phenogrid.min.js",
		library: "phenogrid.min.js",
		libraryTarget: "umd"
	},
	resolve: {
	}
};


