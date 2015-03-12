var fs = require('fs');
var bbop = require('bbop');
if (typeof bbop == 'undefined') { var bbop = {};}
if (typeof bbop.monarch == 'undefined') { bbop.monarch = {};}
// see: https://docs.google.com/document/d/1ZxGuuvyvMmHVWQ7rIleIRkmbiDTNNP27eAHhxyFWHok/edit#

bbop.monarch.defaultConfig = JSON.parse(fs.read("conf/server_config_production.json"));
load('lib/monarch/web/webapp_launcher.js');
console.log("This is the production server");
