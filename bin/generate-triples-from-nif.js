// generate-triples-from-nif, AKA "DISCO 2 TURTLE"
// See:
//  https://github.com/monarch-initiative/monarch-app/tree/master/conf/rdf-mapping
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
var prefixMap = {};

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


    if (options.context) {
        ldcontext = JSON.parse(fs.read(options.config));
    }
    else {
        ldcontext = JSON.parse(fs.read("conf/monarch-context.json"));
    }
    
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

        // tp level object does not need to be a set of graphs
        if (graphs == null) {
            graphs = [gset];
        }

        if (options.config != null) {
            engine.setConfiguration( JSON.parse(fs.read(options.config)) );
        }
        if (gset.forceConfiguration != null) {
            engine.setConfiguration( gset.forceConfiguration );
        }
        if (gset.isDisabled && gset.isDisabled != "0") {
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
    var isMapVersionIdentical = false;
    var isDataCurrent = true;
    if (fs.exists(mdFilePath)) {
        lastDumpMetadata = JSON.parse(fs.read(mdFilePath));
        if (lastDumpMetadata.mapVersion != null) {
            console.info("Comparing last dump version: "+lastDumpMetadata.mapVersion+ " with current: " + gconf.mapVersion);
            if (lastDumpMetadata.mapVersion == gconf.mapVersion) {
                console.info("Identical - will not redump");
                isMapVersionIdentical = true;
            }
            else {
                if (lastDumpMetadata.mapVersion > gconf.mapVersion) {
                    console.warn("Kind of weird; lastDumpMetadata.mapVersion > gconf.mapVersion");
                }
            }
        }
        var numDays = gconf.lengthOfCycleInDays;
        if (numDays == null) {
            numDays = 7;
        }
        var lastExportDate = lastDumpMetadata.exportDate;
        if (lastExportDate == null) {
            console.info("No last export date - assuming stale, will redump");
            isDataCurrent = false;
        }
        else {
            var now = new Date(Date.now());
            var nextExportDate = Date.add(lastExportDate, numDays, 'day');
            console.log("Next export scheduled on: "+nextExportDate);
            if (Date.after(now, nextExportDate)) {
                isDataCurrent = false;
            }
            else {
                isDataCurrent = true;
            }

        }
    }
    else {
        console.log("Cannot find "+mdFilePath+ " -- assuming this is initial dump");
    }

    if (isMapVersionIdentical && isDataCurrent) {
        console.info("Mapping is unchanged AND data is current, so I will skip the dump");
        return;
    }

    // globals ahoy
    numTriplesDumped = 0;
    numAxiomsDumped = 0;

    // write each NG to its own turtle file
    var ioFile = targetFileBaseName + ".ttl";
    var stageFile = ioFile + ".tmp";
    var io = fs.open(stageFile, {write: true});
    console.log("Writing: "+ioFile);

    // HEADER
    emitPrefixes(io, gconf.prefixes);

    // OBJECTS
    if (gconf.objects != null) {
        gconf.objects.forEach(function(obj) {
            var id = normalizeUriRef(obj.id);
            for (var k in obj) {
                if (k == 'id') {
                }
                else {
                    emit(io, id, normalizeUriRef(k), normalizeUriRef(obj[k]));
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
        var resultObj = engine.fetchDataFromResource(null, gconf.view, null, queryColNames, null, gconf.filter, null, maxLimit, null, qopts);
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
    fs.move(stageFile, ioFile);

    var mdObj =
        {
            sourceView : gconf.view,
            mapVersion : gconf.mapVersion,
            numSourceRows : numSourceRows,
            numTriplesDumped : numTriplesDumped,
            numAxiomsDumped : numAxiomsDumped,
            exportDate : new Date(Date.now())
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
        return normalizeUriRef(ix);
    }
}

// Expand CURIE or shortform ID to IRI.
// E.g. GO:1234 --> http://purl.obolibrary.org/obo/GO_1234
//
function normalizeUriRef(iri) {
    // remove whitespace
    if (iri.match(/\s/) != null) {
        console.warn("Whitespace in "+iri);
        iri = iri.replace(/\s/g, "");
    }

    if (iri.indexOf("http") == 0) {
        return "<"+iri+">";
    }

    var pos = iri.indexOf(":");
    var prefix;
    if (pos == -1) {
        prefix = iri;
        if (prefixMap[prefix] == null) {
            // no : separator
            // use base prefix
            iri = ":" + iri;
        }
        else {
            // the ID field is itself a prefix entry.
            // This is useful for certain kinds of values; e.g.
            // a string "P" can be mapped to a full URI (e.g. in panther mapping)
            iri = iri + ":";
        }
    }
    else {
        prefix = iri.slice(0,pos);

        // validate prefix
        if (prefixMap[prefix] == null) {
            console.error("Not a valid prefix: "+prefix);
            system.exit(1);
        }

    }

    return iri;
}



// Arguments:
//  - ix : index
//  - v : column value obtained from data row
//  - cmap : column map
function mapColumnValue(ix, v, cmap, gconf) {
    var cobj = cmap[ix]; // metadata on column
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

    if (v == null) {
        console.warn("No value for "+ix);
        return null;
    }


    // if column metadata includes a prefix, then prepend this
    if (cobj.prefix != null) {
        return normalizeUriRef(cobj.prefix + v);
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
    if (type == 'rdfs:Literal') {
        return engine.quote(v);
    }
    return normalizeUriRef(v);
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
        // special case: Object is a list
        //console.log("Emitting multiple triples: "+ov.length);
        ov.forEach(function(x) { emit(io, sv, pv, x, mapping) });
    }
    else {
        // special case for OWL constructs
        if (mapping != null && mapping.isExistential && mapping.isExistential != "0") {
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
function emitPrefixes(io, extraPrefixes) {
    for (var k in ldcontext) {
        var pfx = ldcontext[k];
        if (k.indexOf('@') == 0) {
            continue;
        }
        if (typeof pfx == 'string') {
            if (pfx.indexOf('@') == 0) {
                continue;
            }
            prefixMap[k] = pfx;
        }
    }
    if (extraPrefixes != null) {
        for (var k in extraPrefixes) {
            var pfx = extraPrefixes[k];
            prefixMap[k] = pfx;
        }
    }
    if (prefixMap[""] == null) {
        prefixMap[""] = ldcontext['@base'];
    }
    for (var k in prefixMap) {
        var pfx = prefixMap[k];
        var pfxUri = expandUri(pfx);
        io.print("@prefix "+k+": <"+pfxUri+"> .");
    }
    io.print("");
}

function expandUri(ref) {
    //console.log("Expanding: "+ref);
    if (ref.indexOf("http") == 0) {
        return ref;
    }
    var pos = ref.indexOf(":");
    if (pos == -1) {
        console.error("Cannot expand: "+ref);
        system.exit(1);
    }
    var prefix = ref.slice(0, pos);
    if (prefixMap[prefix] == null) {
        console.error("Cannot expand: "+prefix);
        system.exit(1);
    }
    var newRef = prefixMap[prefix] + ref.slice(pos+1);
    //console.log("  EXP: "+prefix+" --> "+newRef);
    return newRef;
    
}

// remove offensive characters for IRI construction
function safeify(s) {
    if (s == null) {
        return "NULL";
    }
    return s.replace(/[^a-zA-Z0-9]/g, '_');
}
