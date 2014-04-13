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


    if (options.context || options.target != null) {
        //engine.addJsonLdContext(JSON.parse(fs.read(options.context)));
    }
    else {

    }
    
    ldcontext = engine.getJsonLdContext();

    var gsets = [];
    if (options.mappings != null) {
        gsets = [JSON.parse(fs.read(options.mappings))];
    }
    else {
        gsets = args.map(function(fn) {
            return JSON.parse(fs.read(fn));
        });
    }
    
    for (var j in gsets) {
        var gset = gsets[j];
        var graphs = gset.graphs;

    
        for (var k in graphs) {
            var graphconf = graphs[k];
            if (options.graph == null || graphconf.graph == options.graph) {
                generateNamedGraph(graphconf);
            }
        }
    }

}

// call the main method; ringo specific
if (require.main == module.id) {
    main(system.args);
}

function mapRdfResource(iri) {
    if (iri.match(/\s/) != null) {
        iri = iri.replace(/\s/g, "");
    }

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
        var v = row[ix];
        return mapColumnValue(ix, v, cmap, gconf);
    }
    else {
        return mapRdfResource(ix);
    }
}

function mapColumnValue(ix, v, cmap, gconf) {
    var cobj = cmap[ix];
    var type = cobj.type;

    // JSON-LD context
    var ctx = cobj['@context'];
    if (ctx != null) {
        if (ctx[v] != null) {
            v = ctx[v];
        }
        else {
            console.warn("NO MAPPING: "+v);
        }
    }

    // column
    if (cobj.prefix != null) {
        return mapRdfResource(cobj.prefix + v);
    }
    
    // Remobe this code when this is fixed: https://support.crbs.ucsd.edu/browse/NIF-10646
    if (cobj.list_delimiter != null) {
        var vl = v.split(cobj.list_delimiter);
        if (v == '-') {
            // ARRGGH AD-HOCCERY
            vl = [];
        }
        if (v == "") {
            vl = [];
        }
        if (vl.length == 0) {
            return null;
        }
        if (vl.length > 1) {
            // WARNING: assumes literals
            //return vl.map(function(e) { return engine.quote(e) }).join(", ");
            return vl.map(function(e) { return mapColumnValue(ix, e, cmap, gconf) });
        }
        // carry on, just use v, as it is a singleton list
    }
    if (type == 'rdfs:Literal') {
        return engine.quote(v);
    }
    if (v == null) {
        console.warn("No value for "+ix+" in "+JSON.stringify(row));
    }
    return mapRdfResource(v);
}

function generateNamedGraph(gconf) {

    var io = fs.open(targetDir + "/" + gconf.graph + ".ttl", {write: true});
    emitPrefixes(io);

    var colNames = gconf.columns.map(function(c) { return c.name });
    var cmap = {};
    gconf.columns.forEach(function(c) { cmap[c.name] = c });


    var offset = 0;
    var done = false;
    var seenMap = {};
    var nDupes = 0;
    while (!done) {

        var resultObj = engine.fetchDataFromResource(null, gconf.view, null, colNames, gconf.filter, maxLimit, null, {offset : offset});
        console.info(offset + " / "+resultObj.resultCount + " rows");



        offset += maxLimit;
        if (offset >= resultObj.resultCount) {
            done = true;
        }
        else {
        }

        var iter = 0;
        var results = resultObj.results;
        for (var k in results) {
            var r = results[k];

            var key = colNames.map(function(cn) { return r[cn] }).join("-");
            if (seenMap[key]) {
                nDupes ++;
                continue;
            }

            // crude way to keep cache small; cost of occasional dupes is low
            if (iter > 10) {
                seenMap = {};
                iter = 0;
            }
            seenMap[key] = true;
            
            if (colNames.indexOf('v_uuid') > -1 && r.v_uuid == null) {
                // HACK - see https://support.crbs.ucsd.edu/browse/NIF-10231
                r.v_uuid = colNames.map(function(cn) { return safeify(r[cn]) }).join("-");
            }
            
            
            for (var j in gconf.mappings) {
                var mapping = gconf.mappings[j];
                //console.log(JSON.stringify(mapping));
                var sv = mapColumn(mapping.subject, r, cmap);
                var pv = mapColumn(mapping.predicate, r, cmap);
                var ov = mapColumn(mapping.object, r, cmap);
                
                emit(io, sv, pv, ov);
                
            }
        }
        console.log("nDupes = "+nDupes);
    }
    io.close();
}

// does not uniquify
function emit(io, sv, pv, ov) {
    if (sv == null || pv == null || ov == null) {
        return;
    }
    if (ov.forEach != null) {
        //console.log("Emitting multiple triples: "+ov.length);
        ov.forEach(function(x) { emit(io, sv, pv, x) });
    }
    else {
        io.print(sv + " " + pv + " " + ov + " .");
    }
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

function safeify(s) {
    if (s == null) {
        return "NULL";
    }
    return s.replace(/[^a-zA-Z0-9]/g, '_');
}
