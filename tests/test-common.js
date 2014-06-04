load('lib/monarch/api.js');

var Parser = require('ringo/args').Parser;
var system = require('system');
var assert = require("assert");
var fs = require('fs');
var setup;
if (typeof bbop == 'undefined') { var bbop = {};}
if (typeof bbop.monarch == 'undefined') { bbop.monarch = {};}

function getTestEngine() {
    var script = system.args.shift();
    var parser = new Parser(system.args);
    parser.addOption('h', 'help', null, 'Display help');
    parser.addOption('s', 'setup', 'String', 'one of: beta, production');
    
    var options = parser.parse(system.args);
    if (options.help) {
        print("Usage: ringo OPTIONS tests/apitest.js\n");
        print("Runs API tests");
        print("\nOptions:");
	print(parser.help());
	system.exit('-1');
    }

    setup = options.setup;
    var conf = "conf/server_config_dev.json";

    if (setup != null) {
        if (setup == 'production') {
            conf = "conf/server_config_production.json";
        }
    }

    // see: https://docs.google.com/document/d/1ZxGuuvyvMmHVWQ7rIleIRkmbiDTNNP27eAHhxyFWHok/edit#
    bbop.monarch.defaultConfig = JSON.parse(fs.read(conf));

    return new bbop.monarch.Engine();

}
