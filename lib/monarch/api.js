/* 
 * monarch/api.js
 * 
 * Status: ALPHA
 * 
 * This API contains both *high level* calls to be used within the Monarch UI layer, as well as *lower level* calls for directly accessing
 * NIF Services - currently just OntoQuest and Federation services
 * 
 * This high level calls should abstract away from details of where information about a disease, phenotype, gene etc is stored.
 * 
 * The idea is that this application layer can live on either the server (i.e. within Rhino) or on the client.
 * Currently the status is that you MUST use Rhino whilst we are in testing phase. Some minor rewrites will be required to ise jQuery in place.
 * 
 * To test this:
 * 
 * java PATH/TO/RHINO/js.jar demo.js
 *
 * This loads the classes, and runs a short test
 *
 *
 * You can also experiment with functions within a REPL
 *
 */


// ========================================
// SETUP
// ========================================
if (typeof bbop == 'undefined') { var bbop = {};}
if (typeof bbop.monarch == 'undefined') { bbop.monarch = {};}

// ========================================
// ENGINE
// ========================================

/* Namespace: bbop.monarch
 * 
 * constructor for Engine object
 * 
 * Arguments:
 *  opts : associative array
 */

bbop.monarch.Engine = function(opts) {
    // Someone will have to explain to be the difference between:
    //  nif-services-stage, alpha, beta, ...
    this.config = {};

    // set defaults
    this.config.ontology_services_url = 'http://nif-services-stage.neuinfo.org/'; // monarch ontology
    this.config.federation_services_url = "http://beta.neuinfo.org/services/v1/federation/";

    if (typeof console != null) {
        // RingoJS
        this.fetchUrlImplementation = function(url) {
            var httpclient = require('ringo/httpclient');
            return httpclient.get(url).content;
        };
    }


    // allow caller to override defaults
    if (opts != null) {

        for (var k in opts) {
            this.config[k] = opts[k];
        }
    }
}

////////////////////////////////////////////////////////////////////
// 
// APPLICATION LOGIC
// 
// Anything related to genes, phenotypes, diseases and their
// connections - this is where you want to be.

/* Function: fetchDiseaseInfo
 *
 * Status: PARTIALLY IMPLEMENTED - requires doid/merged to be loaded into import chain
 *
 * Retrieves JSON block providing info about a disease
 *
 * The returned object will be the same as that for fetchClassInfo,
 * enhanced with disease-specific information
 *
 *
 * Arguments:
 *  id : An identifier. One of: IRI string, OBO-style ID or NIF-style ID
 *
 * Returns: JSON blob with info about the disease
 */
bbop.monarch.Engine.prototype.fetchDiseaseInfo = function(id, opts) {
    if (this.cache != null) {
        var cached = this.cache.fetch('disease', id);
        if (cached != null) {
            return cached;
        }
    }

    // every disease is represented as a class in the ontology
    var obj = this.fetchClassInfo(id);

    // TEMPORARY - we are waiting for OQ to index the disease ontology
    if (obj == null) {
        obj = {
            id: id,
            label : id
        };
    }

    // enhance this basic ontology class with cross-ontology axioms
    // for example, disease to locus (anatomy) or GO.
    // TODO - load this into monarch ontology

    // enhance this basic ontology class with data. In particular:
    //  * PHENOTYPES
    //  * GENOMIC

    // TODO - enhance this object with calls to Federation services

    var resource_id;
    var phenotype_associations = [];
    var gene_associations = [];
    var models = [];
    var alleles = [];
    var sim = [];

    // we want to fetch phenotypes from HPO annotations by keying using
    // OMIM, ORPHANET, DECIPHER IDs. Due to the way the merged DO works,
    // these *should* be the primary IDs.
    // we also might want the closure - e.g. for a generic disease,
    // get phenotypes for specific forms of this disease

    // for now, just use the entry point ID
    var disease_ids = [id];

    for (var i=0; i<disease_ids.length; i++) {
        var disease_id = disease_ids[i];
        var resultObj;

        // PHENOTYPES
        resultObj = this.fetchOmimDiseasePhenotypeAsAssocations(id);
        phenotype_associations = phenotype_associations.concat(resultObj.results);

        // MODELS (currently assorted) // TODO
        resultObj = this.fetchMonarchIntegratedDiseaseModels(id);
        models = models.concat(resultObj.results);

        // GENES - DGA
        resultObj = this.fetchOmimDiseaseGeneAsAssocations(id);
        gene_associations = gene_associations.concat(resultObj.results);

        resultObj = this.fetchOmimGeneAllelePhenotypeAsAssocations(id);
        alleles = alleles.concat(resultObj.results);

        sim = sim.concat(this.fetchMonarchDiseaseByDiseasePrecompute(id).results);

    }
    obj.phenotype_associations = phenotype_associations;
    obj.gene_associations = gene_associations;
    obj.models = models;
    obj.alleles = alleles;
    obj.sim = sim;
    
    if (this.cache != null) {
        this.cache.store('disease', id, obj);
    }

    return obj;
}


/* Function: fetchPhenotypeInfo
 *
 * Retrieves JSON block providing info about a phenotype
 *
 * Status: STUB - just diseases. No transitive closure.
 *
 * Retrieves JSON block providing info about a phenotype
 *
 * The returned object will be the same as that for fetchClassInfo,
 * enhanced with phenotype-specific information
 *
 * Arguments:
 *  id : An identifier. One of: IRI string, OBO-style ID or NIF-style ID
 *  opts : An associative array (EXTENSIBLE, OPTIONAL)
 *
 * Returns: JSON blob with info about the phenotype
 */
bbop.monarch.Engine.prototype.fetchPhenotypeInfo = function(id, opts) {
    if (this.cache != null) {
        var cached = this.cache.fetch('phenotype', id);
        if (cached != null) {
            return cached;
        }
    }

    // every phenotype is represented as a class in the ontology
    var obj = this.fetchClassInfo(id, {level:1});

    // enhance this basic ontology class with cross-ontology axioms
    // for example, phenotype to GO or anatomy
    // TODO - load this into monarch ontology


    // enhance this basic ontology class with data. In particular:
    //  * DISEASE/DISORDER
    //    - OMIM diseeases by phenotype - DONE
    //  * GENOMIC
    //    - OMIM genes by phenotype
    //    - model organism genes or genotypes with this phenotype (requires uberpheno plus reasoning)

    var disease_associations = [];
    // ** OMIM **

    var resultObj = this.fetchOmimDiseasePhenotypeAsAssocations(id);

    var numResults = resultObj.resultCount; // we don't do anything with this yet
    // later on we may have disease associations from other views, not just OMIM
    obj.disease_associations = resultObj.results;

    // disease-pairs matched using this phenotype (EXPERIMENTAL)
    obj.sim =this.fetchMonarchDiseaseByDiseasePrecompute(id).results;
    
    // ** GENES **
    // TODO

    if (this.cache != null) {
        this.cache.store('phenotype', id, obj);
    }

    return obj;
}


bbop.monarch.Engine.prototype.fetchAnatomyInfo = function(id, opts) {
    if (this.cache != null) {
        var cached = this.cache.fetch('anatomy', id);
        if (cached != null) {
            //return cached;
        }
    }

    // every anatomy is represented as a class in the ontology
    var obj = this.fetchClassInfo(id, {level:1});


    //obj.disease_associations = this.fetchOmimDiseaseAnatomyAsAssocations(id); // TODO - smarter query
    obj.phenotype_associations = this.fetchOmimGenePhenotypeAsAssocations(id); // TODO - smarter query
    obj.gene_associations = this.fetchGeneExpressionAsAssocations(id);


    if (this.cache != null) {
        //this.cache.store('anatomy', id, obj);
    }

    return obj;
}


/* Function: fetchGeneInfo
 *
 * Status: NOT IMPLEMENTED
 *
 * TODO - decide whether core gene info should come from ontology or federation
 *
 * Retrieves JSON block providing info about a gene
 *
 * The returned object will be the same as that for fetchClassInfo,
 * enhanced with gene-specific information
 *
 *
 * Arguments:
 *  id : An identifier. One of: IRI string, OBO-style ID or NIF-style ID
 *
 * Returns: JSON blob with info about the gene
 */
bbop.monarch.Engine.prototype.fetchGeneInfo = function(id, opts) {
    // every gene is represented as a class in the ontology (???)
    var obj = this.fetchClassInfo(id);

    // TODO - enhance this object with calls to Federation services

    return obj;
}


/* Function: fetchOmimDiseasePhenotypeAsAssocations
 *
 * Status: IMPLEMENTED
 *
 * Given a query term (e.g. an ID, either disease or phenotype), return
 * an association list object, with structure:
 *
 *     { resultCount : NUM, results: [ASSOC1, ...., ASSOCn] }
 *
 * Where ASSOC is an associative array representing a
 * disease-phenotype association with the following keys:
 *
 *  - disease : a disease structure
 *  - phenotype : a disease structure
 *  - onset
 *  - frequency
 *  - source
 *  - resource
 *
 * Both disease and phenotype structures are associative arrays keyed
 * with id and label.
 * (may be extended in future)
 *
 *
 * Arguments:
 *  id : An identifier. One of: IRI string, OBO-style ID or NIF-style ID
 *
 * Returns: JSON representing list of D-P associations
 */
bbop.monarch.Engine.prototype.fetchOmimDiseasePhenotypeAsAssocations = function(id) {

    // so obviously it would be nicer to be more declarative here abstract over
    // this a little, but this is fine to get us started
    // Example: http://beta.neuinfo.org/services/v1/federation/data/nlx_151835-1.json?includePrimaryData=true&q=HP_0003797

    // IMPORTANT NOTE: this does **not** yet do transitive closure. We would ideally like a query
    // for get-diseases-with-phentype "abnormal limb" to get diseases that effect digits, phalanges, femurs, etc.
    // this can be accomplished using the phenotype ontology.
    // We could in theory do this by querying ontoquest for the closure and then feeding all IDs in as a large
    // disjunctive query but this is not efficient or scalable. Either the federation service needs to
    // be made closure-aware OR we populate the views with the closure

    var resource_id = 'nlx_151835-1'; // HARCODE ALERT

    // translate OMIM result into generic association object
    var trOmim =
        function (r) {
            // Repair IDs. TODO, fix in view?
            if (r.disorder_id > 0) {
                // is-numeric
                r.disorder_id = "OMIM:"+r.disorder_id;
            }
            var obj = {
                disease : { id : r.disorder_id, 
                            label : r.disorder_name },
                
                // in future, the phenotype may be more specific
                phenotype : { id : r.phenotype_id,
                              label : r.phenotype_label},
                
                onset : r.onset,
                frequency : r.frequency,
                
                // provenance
                source : "HPO OMIM annotations",
                resource : resource_id
            };
            return obj;
        };


    var resultObj = 
        this.fetchDataFromResource(id, 
                                   resource_id,
                                   trOmim
                                  );
    return resultObj;
}

// ?? this view is really gene-disease?
bbop.monarch.Engine.prototype.fetchOmimGenePhenotypeAsAssocations = function(id) {
    var resource_id = 'nif-0000-03216-8'; // HARCODE ALERT

    var resultObj = 
        this.fetchDataFromResource(id, 
                                   resource_id
                                   //trOmimDGA TODO
                                  );
    return resultObj;
}

// DGA
// EXAMPLE: https://neuinfo.org/mynif/search.php?q=Smith-Lemli-Opitz%20syndrome&t=indexable&list=cover&nif=nif-0000-03216-7
bbop.monarch.Engine.prototype.fetchOmimDiseaseGeneAsAssocations = function(id) {
    var resource_id = 'nif-0000-03216-7'; // HARCODE ALERT

    // translate OMIM DiseaseGeneAssociation (DGA) result into generic association object
    var trOmimDGA =
        function (r) {
            var obj = {
                // in the DGA view "phenotype" is disease
                disease : { id : r.omim_phenotype_id,
                            label : r.omim_phenotype_name },
                
                // check: is this singular or plural
                gene : { id : r.omim_gene_ids,
                         label : r.gene_symbols},
                
                inheritance : r.omim_phenotype_inheritance,
                
                // provenance
                source : "OMIM DiseaseGene associations",
                resource : resource_id
            };
            return obj;
        };


    var resultObj = 
        this.fetchDataFromResource(id, 
                                   resource_id,
                                   trOmimDGA
                                  );
    return resultObj;

    // TODO
}

// EXAMPLE: https://beta.neuinfo.org/mynif/search.php?q=DOID_14692&t=indexable&nif=nif-0000-03216-6&b=0&r=20
bbop.monarch.Engine.prototype.fetchOmimGeneAllelePhenotypeAsAssocations = function(id) {
    var resource_id = 'nif-0000-03216-6'; // HARCODE ALERT

    // translate OMIM DiseaseGeneAssociation (DGA) result into generic association object
    var tr =
        function (r) {
            var obj = {
                // in the DGA view "phenotype" is disease
                disease : { id : r.omim_phenotype_id,
                            label : r.allele_disease_name },

                allele : { id : r.gene_allele_id,
                           link : r.gene_allele_link,
                           //xref : r.omim_allele_id,
                           xref : "dbSNP" + r.dbsnp_id,
                           mutation : r.gene_mutation,
                           label : r.gene_symbols},
                
                gene : { id : r.omim_gene_id,
                         label : r.gene_symbol},
                
                inheritance : r.omim_phenotype_inheritance,
                evidence : r.pubmed_ids,
                // provenance
                source : "OMIM DiseaseGene associations",
                resource : resource_id
            };
            return obj;
        };


    var resultObj = 
        this.fetchDataFromResource(id, 
                                   resource_id,
                                   tr
                                  );
    return resultObj;

    // TODO
}

bbop.monarch.Engine.prototype.fetchMonarchIntegratedDiseaseModels = function(id) {
    var resource_id = 'nlx_152748-1'; // HARCODE ALERT

    // translate 
    var tr =
        function (r) {
            var obj = {

                disease : { id : r.omim_id,  // todo - disease_id often blank?
                            label : r.disease_name },
                
                model : { id : r.model_id,
                          url : r.model_url,
                          label : r.clean_model_symbol, // clean? symbol or name?

                          // we model type as a distinct object
                          type : {
                              label : r.model_type,
                              parent : r.model_subtype
                          },

                          // taxon belongs to the model
                          taxon : {
                              id : r.taxon_id,
                              label : r.taxon_name,
                          }
                        }, 

                // type of association
                type : {
                    label : r.disease_model_type // e.g. asserted
                },
                
                // provenance
                source : r.annotation_source,
                resource : resource_id
            };
            return obj;
        };

    var resultObj = 
        this.fetchDataFromResource(id, 
                                   resource_id,
                                   tr
                                  );

    return resultObj;

}

// EXAMPLE: http://beta.neuinfo.org/services/v1/federation/data/nlx_152525-3.json?includePrimaryData=true&q=DECIPHER_42
// VIEW: http://beta.neuinfo.org/mynif/search.php?q=DECIPHER_42&t=indexable&nif=nlx_152525-3&b=0&r=20
// TODO: the federation query currently returns 
// TODO: OQ needs to expand on IDs. E.g if I query for DOID_14330 (PD) then it should expand to the OMIM IDs for child terms
bbop.monarch.Engine.prototype.fetchMonarchDiseaseByDiseasePrecompute = function(id) {
    var resource_id = 'nlx_152525-3'; // HARCODE ALERT

    // translate 
    var tr =
        function (r) {
            var obj = {

                // TODO - get labels for these. Requires OQ to have loaded the disease ontology
                a : { type : "disease",
                      id : r.a },
                b : { type : "disease",
                      id : r.b },
                metric : r.metric,
                score : r.score,
                value : r.value,
                                
                // provenance
                source : "Monarch/PhenoDigm",
                resource : resource_id
            };
            return obj;
        };

    var resultObj = 
        this.fetchDataFromResource(id, 
                                   resource_id,
                                   tr
                                  );

    return resultObj;

}




// EXAMPLE: http://beta.neuinfo.org/services/v1/federation/data/nif-0000-00432-1.json?includePrimaryData=true&q=42757
bbop.monarch.Engine.prototype.fetchGeneInteractions = function(id) {
    var resource_id = 'nif-0000-00432-1'; // HARCODE ALERT

    // translate 
    var tr =
        function (r) {
            var obj = {

                a : { id: r.interactor_a_gene_id,
                      label: r.interactor_a_gene_name},
                b : { id: r.interactor_b_gene_id,
                      label: r.interactor_b_gene_name},
                                
                // provenance
                source : "BioGrid",
                resource : resource_id
            };
            return obj;
        };

    var resultObj = 
        this.fetchDataFromResource(id, 
                                   resource_id,
                                   tr
                                  );

    return resultObj;

}


// EXAMPLE: Y
bbop.monarch.Engine.prototype.fetchGeneExpressionAsAssocations = function(id) {
    var resource_id = 'nif-0000-08127-1'; // Use GEMMA for now

    var tr =
        function (r) {
            var obj = {
                // in the DGA view "phenotype" is disease
                location : { //id : r.omim_phenotype_id,
                            label : r.tissue},
                
                gene : { id : "gene:" + r.geneid,
                         label : r.gene_symbol, 
                         taxon : r.species},
                
                type : r.gene_expression,
                description: r.description,
                
                // provenance
                source : r.source,
                resource : resource_id
            };
            return obj;
        };


    var resultObj = 
        this.fetchDataFromResource(id, 
                                   resource_id,
                                   tr
                                  );
    return resultObj;

    // TODO
}


////////////////////////////////////////////////////////////////////
// 
// GENERIC NIF ACCESS LAYER
//
// There should be no mention of biological entities such as genes,
// diseases etc below this point.
//
//
// May be refactored into distinct modules in the future.

/* Function: fetchClassInfo
 *
 * Retrieves JSON blob providing info about an ontology class
 *
 *
 * Data structures:
 * - Class = { id: ID, label : LABEL, relationships: [Relationship*] OPTIONAL }
 * - Relationship = { subject: OBJ, property : OBJ, object : OBJ }
 * - Obj = { id : ID, label : LABEL }
 *
 * Services used: 
 * - OntoQuest
 *
 * Options:
 *  - level : See OntoQuest docs. If set, a list of relationships will form a graph with distance=level focused on class
 *
 *
 * Arguments:
 * - id : An identifier. One of: IRI string, OBO-style ID or NIF-style ID
 * - opts : Dictionary parameter
 *
 * Returns: Class struct as JSON
 */
bbop.monarch.Engine.prototype.fetchClassInfo = function(id, opts) {
    var nif_id = this.getNifId(id);
    var xmlStr = this.fetchUrl(this.config.ontology_services_url + 'ontoquest-lamhdi/concepts/term/' + nif_id);
    var obj = this._translateOntoQuestXmlToJson(xmlStr);
    if (opts != null) {
        // TODO - Currently partly broken - see https://support.crbs.ucsd.edu/browse/NIF-9077
        if (opts.level != null) {
            obj.relationships = [];
            xmlStr = this.fetchUrl(this.config.ontology_services_url + 'ontoquest-lamhdi/rel/all/' + nif_id, {level:opts.level});
            console.log(xmlStr);
            var xml = this.parseXML(xmlStr); // TEMPORARY - OQ will soon return JSON            
            console.log(xml);
            var g = xml.data.ontGraph;            
            for (var k in g.relationships.relationship) {
                var r = g.relationships.relationship[k];
                console.log("R="+r);
                obj.relationships.push( { subject: {id : r.subject.@id.toString(),
                                                    label : r.subject.toString()
                                                   },
                                          property: {id : r.property.@id.toString(),
                                                     label : r.property.toString()
                                                   },
                                          object: {id : r.object.@id.toString(),
                                                    label : r.object.toString()
                                                   },
                                          source: "OntoQuest"});
                                          
            }
            console.log("OBJ="+JSON.stringify(obj));
        }
    }
    return obj;
}


/* Function: fetchDataFromResource
 *
 *
 * Services used: NIF federation call
 *
 *
 * Arguments:
 *   q : query. Arbitrary term or NIF ID
 *   resource_id : E.g. nlx_151835-1
 *   trFunction : a function to be applied to each result object which returns a transformed object
 *
 * Returns: JSON structure { resultCount : NUM, results: [ TRANSFORMED-OBJECTS ] }
 */
bbop.monarch.Engine.prototype.fetchDataFromResource = function(id, resource_id, trFunction) {
    // Example: http://beta.neuinfo.org/services/v1/federation/data/nif-0000-03216-7.json?includePrimaryData=true&q=Smith
    var nif_id = this.getNifId(id);

    var resultStr = this.fetchUrl(this.config.federation_services_url + 'data/' +  resource_id + '.json', 
                               {
                                   includePrimaryData : true, 
                                   q : nif_id
                               });
    var fedObj;
    if (this.config.jQuery != null) {
        //alert("parsing: "+resultStr);
        fedObj = jQuery.parseJSON(resultStr).result;
    }
    else {
        fedObj = JSON.parse(resultStr).result;
    }

    // federation queries return json of the form
    // {result: { resultCount: nnn, result: [R1, R2, ..] } }
    // we eliminate the outer result key above, and then translate the inner one.

    if (trFunction == null) {
        // pass-through unchanged
        trFunction = function(x){return x};
    }

    var results = [];
    //for each (var r in fedObj.result) {
    for (var k in fedObj.result) {
        results.push( trFunction( fedObj.result[k] ) );
    }
    var resultObj = 
        {
            resultCount : fedObj.resultCount,
            results : results
        };
    return resultObj;
}

/* Function: fetchUrl
 *
 * Generate fetch over HTTP
 *
 * In future this will abstract over base implementation: rhino vs jquery
 *
 * Arguments:
 *   url : string
 *   params :   string OR list OR dict
 *
 * Returns: string - may be JSON, XML, who knows
 */
bbop.monarch.Engine.prototype.fetchUrl = function(url, params) {
    if (params != null) {

        // be flexible in what params can be..
        if (params.map != null) {
            // params is a list of "K=V" strings
            url = url + "?" + params.join("&");
        }
        else {
            // params is a dictionary, with each value an atom or a list
            url = url + "?";
            for (var k in params) {
                var vs = params[k];
                if (vs.map == null) {
                    vs = [vs];
                }
                url = url + vs.map( function(v) { return k+"="+v }).join("&") + "&";
            }
        }
    }
    console.log("FETCHING: "+url);
    //print("URL: "+url);
   return this.fetchUrlLowLevel(url); 
}

bbop.monarch.Engine.prototype.fetchUrlLowLevel = function(url) {
    //print("FETCHING: "+url);
    if (this.fetchUrlImplementation != null) {
        // API caller can provide their own URL fetching function (e.g. jQuery)
        return this.fetchUrlImplementation(url);
    }
    else {
        // defalt (rhino) URL fetching
        return readUrl(url);
    }
}

// TODO: eliminate XML and E4X dependencies and retrieve JSON from OntoQuest instead
// Depends on: https://support.crbs.ucsd.edu/browse/LAMHDI-216
bbop.monarch.Engine.prototype._translateOntoQuestXmlToJson = function(xmlStr) {

    var info = {}; // payload

    var xml = this.parseXML(xmlStr); // TEMPORARY - OQ will soon return JSON
    if (xml != null) {
        var classes = xml.data.classes;
        //print("#CLASSES: "+classes.length());
        if (classes.length() > 1) {
            this.kvetch("Expected 1 class, got " + classes);
        }
        var c = classes[0].class;
        if (c == null) {
            return null;
        }
        info = {
            id : c.id.toString(),
            label : c.label.toString(),
            url : c.url.toString()
        };
        if (c.comments != null && c.comments[0] != null) {
            info.comments = [c.comments[0].comment.toString()];
        }
        //for each (var p in c.other_properties.property) {
        for (var i=0; i<c.other_properties.property.length; i++) {
            var p = c.other_properties.property[i];
            var k = p['@name'];
            if (info[k] == null) {
                info[k] = [];
            }
            // if it quacks like a duck....
            if (info[k].push != null) {
                info[k].push(p.toString());
            }
        }
    }
    return info;
}

// This is a wrapper to deal with a known bug in E4X.
// E4X is no longer supported, but we will ditch this as
// soon as OntoQuest serves JSON
bbop.monarch.Engine.prototype.parseXML = function(s) {
    if (this.config.jQuery != null) {
        return jQuery.parseXML(s);
    }
    else {
        return new XML(s.replace("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>",""));
    }
}

// translates an ID to a canonical form used by OntoQuest and other NIF services
bbop.monarch.Engine.prototype.getNifId = function(id) {
    if (id.indexOf("http:") == 0) {
        var parts = id.split("/");
        id = parts[parts.length-1];
    }
    if (id.indexOf(":") > -1) {
        id = id.replace(":","_");
    }
    return id;
}

bbop.monarch.Engine.prototype.resolveClassId = function(id) {
    id = this.getNifId(id);
    console.log("Resolved:"+id);
    var cls = this.fetchClassInfo(id);
    if (cls == null || cls.id == null || cls.id == "") {
        return id;
    }
    console.log("Using:"+cls.id);
    return cls.id;
}

