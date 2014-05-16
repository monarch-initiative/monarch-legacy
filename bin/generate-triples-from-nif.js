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
var numTriplesDumped;
var numAxiomsDumped;

function main(args) {
    var script = args.shift();
    var parser = new Parser(system.args);

    parser.addOption("g","graph","ID", "E.g. ncbi-gene");
    parser.addOption("m","mappings","JSONFile", "E.g. conf/rdf-mapping/ncbi-gene-map.json");
    parser.addOption("C","context","JSONFile", "E.g. conf/context.json");
    parser.addOption("c","config","JSONFile", "E.g. conf/production.json");
    parser.addOption("d","targetDir","Directory", "E.g. target");
    parser.addOption("k","apikey","ID", "NIF/SciCrunch API Key");
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

        if (options.config != null) {
            engine.setConfiguration( JSON.parse(fs.read(options.config)) );
        }
        if (gset.forceConfiguration != null) {
            engine.setConfiguration( gset.forceConfiguration );
        }
        if (gset.isDisabled) {
            console.log("Skipping disabled conf");
            continue;
        }

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

// generate a named graph from a set of mappings
function generateNamedGraph(gconf) {

    var targetFileBaseName = targetDir + "/" + gconf.graph;

    var mdFilePath = targetFileBaseName + "-meta.json";

    var lastDumpMetadata;
    if (fs.exists(mdFilePath)) {
        lastDumpMetadata = JSON.parse(fs.read(mdFilePath));
        if (lastDumpMetadata.mapVersion != null) {
            console.info("Comparing last dump version: "+lastDumpMetadata.mapVersion+ " with current: " + gconf.mapVersion);
            if (lastDumpMetadata.mapVersion == gconf.mapVersion) {
                console.info("Identical - will not redump");
                return;
            }
            else {
                if (lastDumpMetadata.mapVersion > gconf.mapVersion) {
                    console.warn("Kind of weird; lastDumpMetadata.mapVersion > gconf.mapVersion");
                }
            }
        }
    }
    else {
        console.log("Cannot find "+mdFilePath+ " -- assuming this is initial dump");
    }

    // globals ahoy
    numTriplesDumped = 0;
    numAxiomsDumped = 0;

    // write each NG to its own turtle file
    var io = fs.open(targetFileBaseName + ".ttl", {write: true});

    // HEADER
    emitPrefixes(io);

    // OBJECTS
    if (gconf.objects != null) {
        gconf.objects.forEach(function(obj) {
            var id = mapRdfResource(obj.id);
            for (var k in obj) {
                if (k == 'id') {
                }
                else {
                    emit(io, id, mapRdfResource(k), mapRdfResource(obj[k]));
                }
            }
        });
    }

    var colNames = gconf.columns.map(function(c) { return c.name });
    var cmap = {};

    // create index mapping column names to column metadata
    gconf.columns.forEach(function(c) { cmap[c.name] = c });

    // don't use derived columns in queries
    var queryColNames = colNames.filter( function(c) { return cmap[c].derivedFrom == null } );
    var derivedColNames = colNames.filter( function(c) { return cmap[c].derivedFrom != null } );

    // Federation REST API does not allow extraction of
    // all data in one query, so we iterate through rows
    // in chunks, starting with offset = 0
    var offset = 0;
    var done = false;
    var seenMap = {};
    var nDupes = 0;
    var numSourceRows;

    while (!done) {

        var qopts = {offset : offset};
        if (options.apikey != null) {
            qopts[apikey] = options.apikey;
        }
        // Federation query
        var resultObj = engine.fetchDataFromResource(null, gconf.view, null, queryColNames, gconf.filter, maxLimit, null, qopts);
        numSourceRows = resultObj.resultCount;
        console.info(offset + " / "+ numSourceRows + " rows");


        offset += maxLimit;
        if (offset >= numSourceRows) {
            done = true;
        }
        else {
        }

        var iter = 0;
        var results = resultObj.results;
        for (var k in results) {
            var r = results[k];

            derivedColNames.forEach( function(c) {
                var dc = cmap[c].derivedFrom;
                r[c] = r[dc];
            });

            // generate a primary key for entire row.
            // we have no way to SELECT DISTINCT so to avoid
            // writing duplicate triples we check if the set of requested
            // column values is unique
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
            iter++;
            seenMap[key] = true;
            
            if (colNames.indexOf('v_uuid') > -1 && r.v_uuid == null) {
                // HACK - see https://support.crbs.ucsd.edu/browse/NIF-10231
                r.v_uuid = colNames.map(function(cn) { return safeify(r[cn]) }).join("-");
            }
            
            // Each n-ary Row in the Solr view can be mapped to multiple 3-ary triples
            for (var j in gconf.mappings) {
                var mapping = gconf.mappings[j];

                // map each element of triple
                var sv = mapColumn(mapping.subject, r, cmap);
                var pv = mapColumn(mapping.predicate, r, cmap);
                var ov = mapColumn(mapping.object, r, cmap);
                
                emit(io, sv, pv, ov, mapping);
                
            }
        }
        console.log("nDupes = "+nDupes);
    }
    io.close();

    var mdObj =
        {
            sourceView : gconf.view,
            mapVersion : gconf.mapVersion,
            numSourceRows : numSourceRows,
            numTriplesDumped : numTriplesDumped,
            numAxiomsDumped : numAxiomsDumped,
        };

    fs.write(mdFilePath, JSON.stringify(mdObj));
}

// Arguments:
//  - ix : either a column name or a literal or IRI
//  - row : key-value object obtained from Fed query
//  - cmap : column description object
//  - gconf : graph conf
function mapColumn(ix, row, cmap, gconf) {
    // is ix a column? if so return column value
    if (cmap[ix] != null) {
        var v = row[ix];
        return mapColumnValue(ix, v, cmap, gconf);
    }
    else {
        // ix is a fixed RDF resource
        return mapRdfResource(ix);
    }
}

// Expand CURIE or shortform ID to IRI.
// E.g. GO:1234 --> http://purl.obolibrary.org/obo/GO_1234
//
function mapRdfResource(iri) {
    // remove whitespace
    if (iri.match(/\s/) != null) {
        console.warn("Whitespace in "+iri);
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


// Arguments:
//  - ix : column mapping spec
//  - v : column value obtained from row
function mapColumnValue(ix, v, cmap, gconf) {
    var cobj = cmap[ix];
    var type = cobj.type;

    // JSON-LD context;
    // can be used to map string values to IRIs
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
    
    // Remove this code when this is fixed: https://support.crbs.ucsd.edu/browse/NIF-10646
    if (cobj.list_delimiter != null) {
        var vl = v.split(cobj.list_delimiter);
        if (v == '-') {
            // ARRGGH AD-HOCCERY. Sometimes empty lists are denoted '-'...
            vl = [];
        }
        if (v == "") {
            // sometimes an empty string
            vl = [];
        }
        if (vl.length == 0) {
            return null;
        }
        if (vl.length > 1) {
            return vl.map(function(e) { return mapColumnValue(ix, e, cmap, gconf) });
        }
        // carry on, just use v, as it is a singleton list
    }
    if (v == null) {
        console.warn("No value for "+ix);
        return null;
    }
    if (type == 'rdfs:Literal') {
        return engine.quote(v);
    }
    return mapRdfResource(v);
}


/* Function: emit
 *
 * Writes a triple to a stream
 *
 * Arguments:
 *  - io: stream to write to
 *  - sv: subject of triple
 *  - pv: predicate of triple
 *  - ov: object of triple. If a list, emits multiple triples, for each element
 *  - mapping: (optional) source mapping used to derive the triple
 *
 */
function emit(io, sv, pv, ov, mapping) {
    if (sv == null || pv == null || ov == null) {
        return;
    }
    if (ov.forEach != null) {
        //console.log("Emitting multiple triples: "+ov.length);
        ov.forEach(function(x) { emit(io, sv, pv, x, mapping) });
    }
    else {
        if (mapping != null && mapping.isExistential) {
            io.print(sv + " rdfs:subClassOf [a owl:Restriction ; owl:onProperty " + pv + " ; owl:someValuesFrom " + ov + " ] .");
            numTriplesDumped += 4;
            numAxiomsDumped ++;
        }
        else {
            io.print(sv + " " + pv + " " + ov + " .");
            numTriplesDumped ++;
            numAxiomsDumped ++;
        }
    }
}

// TODO: we can reduce the size of the triple dump by making use of these
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

// remove offensive characters for IRI construction
function safeify(s) {
    if (s == null) {
        return "NULL";
    }
    return s.replace(/[^a-zA-Z0-9]/g, '_');
}
