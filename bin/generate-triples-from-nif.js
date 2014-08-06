// generate-triples-from-nif, AKA "DISCO 2 TURTLE"
// See:
//  https://github.com/monarch-initiative/monarch-app/tree/master/conf/rdf-mapping
load('lib/monarch/api.js');
var Parser = require('ringo/args').Parser;
var dates = require('ringo/utils/dates');
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
    parser.addOption("C","context","JSONFile", "E.g. conf/context.jsonld");
    parser.addOption("c","config","JSONFile", "E.g. conf/production.json");
    parser.addOption("d","targetDir","Directory", "E.g. target");
    parser.addOption("s","skip","GraphNamePattern", "E.g. disease. Performs text match");
    parser.addOption("l","limit","Number", "Default 1000");
    parser.addOption("k","apikey","ID", "NIF/SciCrunch API Key");
    parser.addOption('h', 'help', null, 'Display help');

    options = parser.parse(args);

    var skipGraphsMatching = options.skip;

    if (options.help) {
	print(parser.help());
	system.exit('-1');
    }

    engine = new bbop.monarch.Engine();

    if (options.config != null) {
        engine.setConfiguration( JSON.parse(fs.read(options.config)) );
    }

    if (options.limit) {
        maxLimit = options.limit;
    }

    targetDir = options.targetDir != null ? options.targetDir : "target";


    if (options.context) {
        ldcontext = JSON.parse(fs.read(options.config));
    }
    else {
        ldcontext = JSON.parse(fs.read("conf/monarch-context.jsonld"));
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
                if (skipGraphsMatching) {
                    if (graphconf.graph.match(skipGraphsMatching)) {
                        console.log("Skipping: "+graphconf.graph);
                        continue;
                    }
                }
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

    // write each NG to its own turtle file
    var ioFile = targetFileBaseName + ".ttl";
    var mdFilePath = targetFileBaseName + "-meta.json";
    var voidFilePath = targetFileBaseName + "-void.jsonld";
    var isFileExists = fs.exists(ioFile);

    console.log("Target: "+ioFile);

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
                console.info("mapVersion is different");
                if (lastDumpMetadata.mapVersion > gconf.mapVersion) {
                    console.warn("Kind of weird; lastDumpMetadata.mapVersion > gconf.mapVersion");
                }
            }
        }
        if (!gconf.mapVersion) {
            console.log("Configuration doe not have a mapVersion tag - assuming constant");
            isMapVersionIdentical = true;
        }
        var numDays = gconf.lengthOfCycleInDays;
        if (numDays == null) {
            numDays = 7;
        }
        if (lastDumpMetadata.exportDate == null) {
            console.info("No last export date - assuming stale, will redump");
            isDataCurrent = false;
        }
        else {
            var lastExportDate = new Date(lastDumpMetadata.exportDate);
            var now = new Date(Date.now());
            var nextExportDate = dates.add(lastExportDate, numDays, 'day');
            console.log("Next export scheduled on: "+nextExportDate);
            if (dates.after(now, nextExportDate)) {
                console.log("data is stale");
                isDataCurrent = false;
            }
            else {
                console.log("data is current");
                isDataCurrent = true;
            }

        }
    }
    else {
        console.log("Cannot find "+mdFilePath+ " -- assuming this is initial dump");
    }

    if (isMapVersionIdentical && isDataCurrent && isFileExists) {
        console.info("Mapping is unchanged AND data is current, so I will skip the dump for "+ioFile);
        return;
    }

    // globals ahoy
    numTriplesDumped = 0;
    numAxiomsDumped = 0;

    var stageFile = ioFile + ".tmp";
    var io = fs.open(stageFile, {write: true});
    console.log("Writing: "+ioFile);

    // HEADER
    emitPrefixes(io, gconf.prefixes);

    // OBJECTS
    if (gconf.objects != null) {
        gconf.objects.forEach(function(obj) {
            var id = normalizeUriRef(obj.id, gconf);
            for (var k in obj) {
                if (k == 'id') {
                }
                else {
                    emit(io, id, normalizeUriRef(k), normalizeUriRef(obj[k], gconf));
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
    var numNullWarnings = 0;

    while (!done) {

        var qopts = {offset : offset};
        if (options.apikey != null) {
            qopts[apikey] = options.apikey;
        }
        // Federation query
        var resultObj;
        try {
            resultObj = engine.fetchDataFromResource(null, gconf.view, null, queryColNames, null, gconf.filter, null, maxLimit, null, qopts);
        }
        catch (err) {
            console.error("Failed on call to "+gconf.view);
            var stm = require("ringo/logging").getScriptStack(err);
            console.error(stm);
            system.exit(1);
        }

        numSourceRows = resultObj.resultCount;
        console.info(offset + " / "+ numSourceRows + " row from "+gconf.graph);


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
            //console.log(JSON.stringify(r));

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

                if (sv == null || pv == null || ov == null) {
                    numNullWarnings++;
                    if (numNullWarnings < 10) {
                        console.warn(" Triple [ "+sv+" "+pv+" "+ov+" ] has null value in "+r.v_uuid);
                        if (numNullWarnings == 9) {
                            console.warn("Will not warn about this again");
                        }

                    }
                }
                else {
                    emit(io, sv, pv, ov, mapping);
                }
                
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

    // VOID: todo
    var voidDataset = gconf.metadata;
    if (voidDataset == null) {
        voidDataset = {};
    };
    if (!voidDataset.type) {
        voidDataset.type = "void:Dataset";
    };
    if (!voidDataset.title) {
        voidDataset.type = gconf.graph;
    };
    var exportDate = new Date(Date.now());
    voidDataset.id = "http://purl.obolibrary.org/obo/upheno/data/"+gconf.graph;
    voidDataset["dcterms:created"] = exportDate;
    voidDataset["dcterms:nifVew"] = gconf.view; // TODO
    voidDataset["void:triples"] = numTriplesDumped;
    voidDataset["@context"] = ldcontext['@context'];

    fs.write(voidFilePath, JSON.stringify(voidDataset, null, ' '));
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
        return normalizeUriRef(ix, gconf);
    }
}

// Expand CURIE or shortform ID to IRI.
// E.g. GO:1234 --> http://purl.obolibrary.org/obo/GO_1234
//
function normalizeUriRef(iri, gconf) {
    // remove whitespace
    if (iri.match(/\s/) != null) {
        console.warn("Whitespace in "+iri);
        iri = iri.replace(/\s/g, "");
    }

    if (iri == "") {
        //console.warn("Empty IRI");
        //system.exit(1);
        return null;
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
            console.error("Not a valid prefix: "+prefix+" in IRI: "+iri+" graph:"+ gconf ? gconf.graph : "-");
            if (prefixMap[prefix.toUpperCase()] != null) {
                console.log("Replacing "+prefix+" with upper case form");
                return iri.replace(prefix, prefix.toUpperCase());
            }
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
        return normalizeUriRef(cobj.prefix + v, gconf);
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
            vl = vl.map(function(e) { return e.replace(/^\s+/g,"");});
            return vl.map(function(e) { return mapColumnValue(ix, e, cmap, gconf) });
        }
        // carry on, just use v, as it is a singleton list
    }
    //console.log("TYPE of '"+v+"' is "+type+"."+JSON.stringify(cobj));
    if (type == 'rdfs:Literal') {
        return engine.quote(v);
    }
    return normalizeUriRef(v, gconf);
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
    else if (sv.forEach != null) {
        // special case: Subject is a list
        //console.log("Emitting multiple triples: "+ov.length);
        sv.forEach(function(x) { emit(io, x, pv, ov, mapping) });
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
    var ldmap = ldcontext["@context"];
    for (var k in ldmap) {
        var pfx = ldmap[k];
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
        prefixMap[""] = ldmap['@base'];
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
