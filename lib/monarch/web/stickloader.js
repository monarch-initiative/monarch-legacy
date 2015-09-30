//
//	This JS file is specified by webapp.js during its initialization of the
//	ringo/httpserver to declare a RingoJS module that will be loaded into
//	each of the httpserver's worker threads.
//	This file allows us to initialize the bbop.monarch.Engine and related structures
//	that are needed in each worker thread.
//
var webapp = require('web/webapp.js');

webapp.startServer();

exports.app = webapp.app;
