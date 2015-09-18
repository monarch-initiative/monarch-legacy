console.log("This is a RingoJS development server1");

var env = require('serverenv.js');
var app = require('web/webapp.js');

var defaultConfig = env.readJSON("conf/server_config_dev.json");
var golrConfig = env.readJSON("conf/golr-conf.json");

app.configServer(defaultConfig, golrConfig);
app.startServer();
