var env = require('serverenv.js');
var bbop = require('api.js').bbop;
var _ = require('underscore');

if (env.isRingoJS()) {
    var Parser = require('ringo/args').Parser;
    var system = require('system');
}
else {
    var WaitFor = require('wait.for');
}

var assert = require("assert");
var fs = require('fs');
var setup;
if (typeof bbop == 'undefined') { var bbop = {};}
if (typeof bbop.monarch == 'undefined') { bbop.monarch = {};}


function getTestEngine() {
    if (env.isRingoJS()) {
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
    }
    else {
        console.log("CLI parsing NYI for NodeJS");
        options = {
            setup: null
        };
    }

    setup = options.setup;
    var conf = "conf/server_config_dev.json";

    if (setup != null) {
        if (setup == 'production') {
            conf = "conf/server_config_production.json";
        }
    }

    // see: https://docs.google.com/document/d/1ZxGuuvyvMmHVWQ7rIleIRkmbiDTNNP27eAHhxyFWHok/edit#
    bbop.monarch.defaultConfig = env.readJSON(conf);

    return new bbop.monarch.Engine();

}

function runTestsHelper(tests) {
    var testsPassed = 0;
    var testsFailed = 0;

    _.each(tests, function (test, key) {
        var testPassed = test();
        if (testPassed) {
            console.log('## Test Passed:', key);
            testsPassed++;
        }
        else {
            console.log('## Test Failed:', key);
            testsFailed++;
        }
    });

    console.log('# ' + testsPassed + ' tests passed');
    console.log('# ' + testsFailed + ' tests failed');

    return testsFailed;
}


function runTests(tests) {
    if (env.isRingoJS()) {
        var testsFailed = runTestsHelper(tests);
        system.exit(testsFailed);
    }
    else {
        WaitFor.launchFiber(function () {
            var testsFailed = runTestsHelper(tests);
            process.exit(testsFailed);
        });
    }
}

function returnAssert(str, val) {
    if (!val) {
        console.log('#AssertionFailed: ', str);
    }
    return val;
}

exports.assert = returnAssert;
exports.getTestEngine = getTestEngine;
exports.runTests = runTests;
