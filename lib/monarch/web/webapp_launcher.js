/* eslint-disable */

//
// node webapp_launcher.js [--port 8080] [dev]
//

var env = require('serverenv.js');
var platform = 'NodeJS';
var envName = 'dev';
var port = '8080';
var args = env.getArgv().slice(1);

if (args.length > 1 && args[0] === '--port') {
	port = args[1];
	if (args.length > 2) {
		envName = args[2];
	}
}
else if (args.length > 0) {
	envName = args[0];
	if (args.length > 2 && args[1] === '--port') {
		port = args[2];
	}
}

console.log('Starting server' + '.' +
			' Platform: ' + platform + '.' +
			' Environment: ' + envName + '.' +
			' Port: ' + port + '.');
			
console.log("NODEVERSION:", process.version);

var defaultConfigFile = "conf/server_config_dev.json";
var golrConfigFile = "conf/golr-conf.json";

if (envName === 'production') {
	defaultConfigFile = "conf/server_config_production.json";
}
else if (envName === 'beta') {
	defaultConfigFile = "conf/server_config_beta.json";
}
// else if (envName === 'CORSTest') {
// 	defaultConfigFile = "conf/server_config_cors_test.json";
// }

console.log('defaultConfigFile: ' + defaultConfigFile + ' golrConfigFile: ' + golrConfigFile);

var defaultConfig = env.readJSON(defaultConfigFile);
var golrConfig = env.readJSON(golrConfigFile);
global.defaultPort = port;

if (envName === 'CORSTest') {
	defaultConfig.app_base = 'http://127.0.0.1:8080';
	console.log('CORSTest app_base: ', defaultConfig.app_base);
}

console.log('defaultConfig: ' + JSON.stringify(defaultConfig));

var webapp = require('web/webapp.js');
webapp.configServer(defaultConfig, golrConfig);
webapp.startServer();

