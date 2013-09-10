load('lib/monarch/api.js');
var Parser = require('ringo/args').Parser;
var system = require('system');
var httpclient = require('ringo/httpclient');

function main(args) {
    var script = args.shift();
    var parser = new Parser(system.args);

    parser.addOption("q","query","QueryTerm", "ID or name for a disease");
    parser.addOption("x", "extract", "DocumentPart", "E.g. phenotype_associations");
    parser.addOption('h', 'help', null, 'Display help');
    parser.addOption('c', 'context', null, 'Add JSON-LD context');
    //parser.addOption('', 'no-context', null, 'Hide JSON-LD context');
    //parser.addOption('p', 'prettyprint', null, 'Pretty print JSON');

    var options = parser.parse(args);

    if (options.help) {
	print(parser.help());
	system.exit('-1');
    }

    print("Q="+options.query);

    var engine = new bbop.monarch.Engine();
    var info = engine.fetchDiseaseInfo(options.query); 

    if (options.extract != null) {
        info = info[options.extract];
    }

    if (options.context) {
        engine.addJsonLdContext(info);
    }
    else {
        info['@context'] = null;
    }

    var out = JSON.stringify(info, null, " ");

    //if (options.prettyprint) {
        //out = httpclient.post("http://jsonprettyprint.com/json-pretty-printer.php", {json_data:out}).content;
//}

    print(out);
}

// call the main method; ringo specific
if (require.main == module.id) {
    main(system.args);
}
