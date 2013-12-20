load('lib/monarch/api.js');
var Parser = require('ringo/args').Parser;
var system = require('system');
var httpclient = require('ringo/httpclient');

function main(args) {
    var script = args.shift();
    var parser = new Parser(system.args);

    parser.addOption("d","datatype","Datatype", "E.g. disease");
    parser.addOption("q","query","QueryTerm", "ID or name for a disease");
    parser.addOption("x", "extract", "DocumentPart", "E.g. phenotype_associations");
    parser.addOption('h', 'help', null, 'Display help');
    parser.addOption('c', 'context', null, 'Add JSON-LD context');
    parser.addOption('t', 'target', 'Format', 'Target format. E.g. nt, rdf-xml');
    //parser.addOption('', 'no-context', null, 'Hide JSON-LD context');
    //parser.addOption('p', 'prettyprint', null, 'Pretty print JSON');

    var options = parser.parse(args);

    if (options.help) {
	print(parser.help());
	system.exit('-1');
    }

    var engine = new bbop.monarch.Engine();

    var q = options.query;
    var func = "fetchDiseaseInfo";
    var dt = options.datatype;

    if (dt == 'disease') {
        func = "fetchDiseaseInfo";
    }
    else if (dt == 'genotype') {
        func = "fetchGenotypeInfo";
    }
    else if (dt == 'phenotype') {
        func = "fetchPhenotypeInfo";
    }
    else {
        print("Unknown datatype: "+dt);
        system.exit(1);
    }

    var info = engine[func](q);

    if (options.extract != null) {
        info = info[options.extract];
    }

    if (options.context || options.target != null) {
        engine.addJsonLdContext(info);
    }
    else {
        info['@context'] = null;
    }

    var out = JSON.stringify(info, null, "    ");

    if (options.target != null) {
        var tgt = options.target;
        if (tgt == 'rdf' || tgt == 'rdf-xml') {
            tgt = 'xml';
        }
        var url = "http://rdf-translator.appspot.com/convert/json-ld/"+tgt+"/content";
        out = httpclient.post(url, {content:out}).content;
    }

    print(out);
}

// call the main method; ringo specific
if (require.main == module.id) {
    main(system.args);
}
