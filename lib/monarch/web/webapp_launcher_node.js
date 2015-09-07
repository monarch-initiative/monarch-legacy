console.log("This is a NodeJS development server1");

var env = require('serverenv.js');
var webapp = require('web/webapp.js');

var defaultConfig = env.readJSON("conf/server_config_dev.json");
var golrConfig = env.readJSON("conf/golr-conf.json");

webapp.configServer(defaultConfig, golrConfig);
webapp.startServer();
