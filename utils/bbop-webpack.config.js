const path = require('path');

module.exports = {
	entry: [
		"./node_modules/bbop/bbop.js"
	],
	output: {
		path: path.join(__dirname, "../gen"),
		filename: "bbop.min.js",
		library: "bbop.min.js",
		libraryTarget: "umd"
	},
	resolve: {
	    alias: {
	      'ringo/httpclient': path.join(__dirname, "../js/nop.js")
	    }
	}
};


