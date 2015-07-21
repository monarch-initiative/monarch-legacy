var env = require('../serverenv.js');

var bbop = require('bbop');
if (typeof bbop == 'undefined') { var bbop = {};}
if (typeof bbop.monarch == 'undefined') { bbop.monarch = {};}
//see: https://docs.google.com/document/d/1ZxGuuvyvMmHVWQ7rIleIRkmbiDTNNP27eAHhxyFWHok/edit#

console.log("This is a development server1");

bbop.monarch.defaultConfig = JSON.parse(env.fs_readFileSync("conf/server_config_dev.json"));
bbop.monarch.golrConfig = JSON.parse(env.fs_readFileSync("conf/golr-conf.json"));
eval(env.fs_readFileSync('lib/monarch/web/webapp_launcher.js')+'');
