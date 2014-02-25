/* Test: urltester.js

   This tests a set of URLs required for Monarch.

   TODO: 
    - improve XML tests (OntoQuest)
    - allow configurable switching between beta/production URLs

    To run:

    > ringo tests/urltester.js -h

 */

var Parser = require('ringo/args').Parser;
var system = require('system');
var assert = require("assert");
var fs = require("fs");
var httpclient = require('ringo/httpclient');
var version = null; // alpha, beta or productions

// list of cfgs to load
var cfgs =
    [
        "urltest_cfg.js"
    ];

var components = null;  // list of components to be tested. Defaults to all

// test ALL configs
exports.testAll = function() {
    for (var k in cfgs) {
        testCfgFile(cfgs[k]);
    }
};

var testCfgFile = function(fn) {
    var urls = [];
    try {
        urls = eval(fs.read("tests/"+fn));
    }
    catch(msg) {
        console.error("Cannot parse: "+fn);
        var stm = require("ringo/logging").getScriptStack(msg);
        print(msg);
        print(stm);
        assert.isTrue(false);
    }
    for (var k in urls) {
        testUrl(urls[k]);
    }
}

// test a particular URL, check if returns expected results
var testUrl = function(urlinfo) {
    var url = urlinfo.url;
    var component = urlinfo.component;
    var expects = urlinfo.expects;

    if (components != null) {
        if (components.indexOf(component) == -1) {
            console.log("Skipping test on: "+url);
            return;
        }
    }

    url = modifyUrlForComponent(url, component);

    console.log("Testing URL: "+url);
    print(JSON.stringify(urlinfo, ' ', null));
    var x = httpclient.get(url);
    console.log("Status: " + x.status);
    if (expects.status != null) {
        assert.equal(expects.status, x.status);
    }
    if (expects.status == null && x.status == 500) {
        console.warn("Received a 500");
        assert.notEqual(x.status, 500);
        // no point testing further
        return;
    }

    var resultObj = null;
    if (expects.format != null) {
        var rawContent = x.content;

        if (expects.raw_contains != null) {
            var strings = listify(expects.raw_contains);
            strings.forEach(function(s) {
                console.log("Checking for presence of string: "+s);
                //assert.isTrue(rawContent.indexOf(s) > -1);
                assert.stringContains(rawContent, s);
            });
        }

        if (expects.raw_not_contains != null) {
            var strings = expects.raw_not_contains.push == null ? [expects.raw_not_contains] : expects.raw_not_contains; // listify
            strings.forEach(function(s) {
                console.log("Checking for presence of string: "+s);
                //assert.isTrue(rawContent.indexOf(s) > -1);
                assert.stringContains(rawContent, s);
            });
        }
        
        if (expects.format == 'json') {
            resultObj = JSON.parse(rawContent);
        }
        else if (expects.format == 'xml') {
            resultObj =  new XML(rawContent.replace("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>",""));
        }
        else if (expects.format == 'html') {
            console.warn("ignoring html");
        }
        else {
            console.warn("TODO: "+expects.format);
        }
    }

    if (resultObj != null) {
        var results = null;
        if (component == 'vocabulary') {
            results = resultObj;
        }
        else if (component == 'federation') {
            results = resultObj.result.result; // yes this looks odd, but this is how fed returns data
        }
        else if (component == 'ontoquest') {
            // TODO - OQ XML layered on JSON is complex - best just do raw checks for now
            results = resultObj.data;
        }
        else if (component == 'monarch') {
            var subcomponent = urlinfo.subcomponent;
            if (subcomponent == 'simsearch') {
                results = [resultObj];
            }
            else {
                console.warn("Not implemented: "+ subcomponent);
            }
        }
        else {
            console.warn("??"+component);
            results = resultObj;
        }
        console.log("# results: "+results.length);
        testResults(urlinfo, results);
    }
}

var testResults = function(urlinfo, results) {
    var expects = urlinfo.expects;

    if (expects.min_results != null) {
        console.log("Expects: min_results = "+expects.min_results+" Actual #results="+results.length);
        assert.isTrue(results.length >= expects.min_results);
    }
    if (expects.max_results != null) {
        console.log("Expects: max_results = "+expects.max_results+" Actual #results="+results.length);
        assert.isTrue(results.length <= expects.max_results);
    }
    if (expects.must_contain != null) {
        console.log("Expects: match = "+JSON.stringify(expects.must_contain, null, ' '));
        listify(expects.must_contain).forEach(
            function(matchObj) { 
                var matches = results.filter(function(r) { return matchesQuery(r, matchObj) });
                assert.notEqual(matches.length, 0);
            });
    }
    if (expects.must_not_contain != null) {
        console.log("Expects: NO match = "+JSON.stringify(expects.must_not_contain, null, ' '));
        listify(expects.must_not_contain).forEach(
            function(matchObj) { 
                var matches = results.filter(function(r) { return matchesQuery(r, matchObj) });
                assert.equal(matches.length, 0);
            });
    }
}

var matchesQuery = function(obj, pattern) {
    for (var k in pattern) {
        if ( ! (obj[k] != null && obj[k] == pattern[k]) ) {
            return false;
        }
    }
    return true;
}

// this is a fairly hacky (and incomplete) way of translating the hardcoded beta URLs to production or
// alpha.
// see: https://docs.google.com/document/d/1ZxGuuvyvMmHVWQ7rIleIRkmbiDTNNP27eAHhxyFWHok/edit#
//
// Consider using webapp_launcher to select the correct configuration
var modifyUrlForComponent = function(url, component) {
    if (version == null) {
        return url;
    }
    if (component == 'federation' || component == 'vocabulary') {
        if (version == 'alpha') {
            return url.replace("beta.", "alpha.");
        }
    }
    return url;
}

function listify(x) {
    return x.push == null ? [x] : x;
}

if (require.main == module) {
    var script = system.args.shift();
    var parser = new Parser(system.args);
    parser.addOption('h', 'help', null, 'Display help');
    parser.addOption('c', 'components', 'String', 'comma separated list of components');
    parser.addOption('s', 'setup', 'String', 'one of: alpha, beta, production (NOT IMPLEMENTED)');
    
    var options = parser.parse(system.args);
    if (options.help) {
        print("Usage: ringo OPTIONS tests/urltester.js\n");
        print("Runs URL tests");
        print("\nOptions:");
	print(parser.help());
        print("\n\n\
Example:\n\
# Tests vocabulary component\n\
ringo tests/urltester.js -c vocabulary\n\
\n\
Example:\n\
# Tests federation component on alpha\n\
ringo tests/urltester.js -c vocabulary -s alpha\n\
\n\
Example:\n\
# all tests\
ringo tests/urltester.js -c vocabulary\n\
");
	system.exit('-1');
    }

    if (options.components != null) {
        components = options.components.split(",");
    }
    else {
        components = [
            'vocabulary',
            'federation',
            'ontoquest'
        ];
    }

    version = options.setup;

    //system.args.forEach(function(fn) { print(fn) });
    var rtn = require("test").run(exports);
    print("Return code="+rtn);
    system.exit(rtn);
}
