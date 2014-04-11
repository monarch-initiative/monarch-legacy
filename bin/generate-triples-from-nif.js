load('lib/monarch/api.js');
var Parser = require('ringo/args').Parser;
var system = require('system');
var fs = require('fs');
var httpclient = require('ringo/httpclient');

var options;
var engine;
var maxLimit = 1000;
//var maxLimit = 10;
var ldcontext;
var targetDir;

function main(args) {
    var script = args.shift();
    var parser = new Parser(system.args);

    parser.addOption("g","graph","ID", "E.g. ncbi-gene");
    parser.addOption("m","mappings","JSONFile", "E.g. conf/rdf-mapping/ncbi-gene-map.json");
    parser.addOption("C","context","JSONFile", "E.g. conf/context.json");
    parser.addOption("c","config","JSONFile", "E.g. conf/production.json");
    parser.addOption("d","targetDir","Directory", "E.g. target");
    parser.addOption('h', 'help', null, 'Display help');

    options = parser.parse(args);

    if (options.help) {
	print(parser.help());
	system.exit('-1');
    }

    engine = new bbop.monarch.Engine();

    if (options.config != null) {
        engine.setConfiguration( JSON.parse(fs.read(options.config)) );
    }

    targetDir = options.targetDir != null ? options.targetDir : "target";

    var gset = JSON.parse(fs.read(options.mappings));

    if (options.context || options.target != null) {
        //engine.addJsonLdContext(JSON.parse(fs.read(options.context)));
    }
    else {

    }
    
    ldcontext = engine.getJsonLdContext();

    var graphs = gset.graphs;

    
    for (var k in graphs) {
        var graphconf = graphs[k];
        if (options.graph == null || graphconf.graph == options.graph) {
            generateNamedGraph(graphconf);
        }
    }

    // TODO - footer

}

// call the main method; ringo specific
if (require.main == module.id) {
    main(system.args);
}

function mapRdfResource(iri) {
    if (iri.indexOf("http") == 0) {
        return "<"+iri+">";
    }
    iri = engine.expandIdToURL(iri);
    if (iri.indexOf("http") == 0) {
        return "<"+iri+">";
    }
}

function mapColumn(ix, row, cmap, gconf) {
    if (cmap[ix] != null) {
        var cobj = cmap[ix];
        var type = cobj.type;

        var v = row[ix];

        if (cobj.lookup != null) {
            if (cobj.lookup[v] != null) {
                v = cobj.lookup[v];
            }
            else {
                console.warn("NO MAPPING: "+v);
            }
        }

        // column
        if (cobj.prefix != null) {
            return mapRdfResource(cobj.prefix + v);
        }
        if (cobj.list_delimiter != null) {
            var vl = v.split(cobj.list_delimiter);
            if (v == '-') {
                // ARRGGH AD-HOCCERY
                vl = [];
            }
            if (vl.length == 0) {
                return null;
            }
            // WARNING: assumes literals
            return vl.map(function(e) { return engine.quote(e) }).join(", ");
        }
        if (type == 'Literal') {
            return engine.quote(v);
        }
        return mapRdfResource(v);
    }
    return mapRdfResource(ix);   
}

function generateNamedGraph(gconf) {

    var io = fs.open(targetDir + "/" + gconf.graph + ".ttl", {write: true});
    emitPrefixes(io);

    var colNames = gconf.columns.map(function(c) { return c.name });
    var cmap = {};
    gconf.columns.forEach(function(c) { cmap[c.name] = c });

    var offset = 0;
    var done = false;
    while (!done) {

        var resultObj = engine.fetchDataFromResource(null, gconf.view, null, colNames, gconf.filter, maxLimit, null, {offset : offset});
        console.info(offset + " / "+resultObj.resultCount + " rows");

        offset += maxLimit;
        if (offset >= resultObj.resultCount) {
            done = true;
        }
        else {
        }

        var results = resultObj.results;
        for (var k in results) {
            var r = results[k];
            
            for (var j in gconf.mappings) {
                var mapping = gconf.mappings[j];
                
                var sv = mapColumn(mapping.subject, r, cmap);
                var pv = mapColumn(mapping.predicate, r, cmap);
                var ov = mapColumn(mapping.object, r, cmap);
                
                emit(io, sv, pv, ov);
                
            }
        }
    }
    io.close();
}

// does not uniquify
function emit(io, sv, pv, ov) {
    if (sv == null || pv == null || ov == null) {
        return;
    }
    io.print(sv + " " + pv + " " + ov + " .");
}

function emitPrefixes(io) {
    for (var k in ldcontext) {
        var pfx = ldcontext[k];
        if (k.indexOf('@') == 0) {
            continue;
        }
        if (typeof pfx == 'string') {
            if (pfx.indexOf('@') == 0) {
                continue;
            }
            io.print("@prefix "+k+": <"+pfx+"> .");
        }
    }
    io.print("");
}
