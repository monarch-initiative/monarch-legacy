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

/* Namespace: bbop.monarch.Engine
 * 
 * Constructor: bbop.monarch.Engine
 *
 * constructor for Engine object
 * 
 * Example:
 *  engine = new bbop.monarch.Engine();
 * 
 * Arguments:
 *  opts : associative array. Keys: ontology_services_url, federation_services_url
 */

bbop.monarch.Engine = function(opts) {
    // Someone will have to explain to be the difference between:
    //  nif-services-stage, alpha, beta, ...
    this.config = {};

    // set defaults
    this.config.ontology_services_url = 'http://nif-services-stage.neuinfo.org/'; // monarch ontology in ontoloquest
    this.config.federation_services_url = "http://beta.neuinfo.org/services/v1/federation/";

    if (typeof console != null) {
        // RingoJS
        this.fetchUrlImplementation = function(url) {
            var httpclient = require('ringo/httpclient');
            console.log("URL: "+url);
            var exchangeObj =  httpclient.get(url);
            console.log("RESULT: "+exchangeObj);
            console.log("STATUS: "+exchangeObj.status);
            return exchangeObj.content;
        };
    }


    // allow caller to override defaults
    if (opts != null) {

        for (var k in opts) {
            this.config[k] = opts[k];
        }
    }
}

bbop.monarch.Engine.prototype.apiVersionInfo = function() {
    return "monarch-api-2013-09-09";
}

////////////////////////////////////////////////////////////////////
// 
// APPLICATION LOGIC
// 
// Anything related to genes, phenotypes, diseases and their
// connections - this is where you want to be.

/* Function: fetchDiseaseInfo
 *
 * Retrieves JSON block providing info about a disease
 *
 * The returned object will be the same as that for fetchClassInfo,
 * enhanced with disease-specific information
 *
 * Known issues:
 *  If a DOID is used, similarity scores will not be returned.
 *  This should be resolved when the Federation API makes use of
 *  equivalence axioms.
 *
 * Example:
 *  var diseaseInfo = engine.fetchDiseaseInfo("DOID_1430");
 *
 * Status:
 *  status: PARTIALLY IMPLEMENTED
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
            if (cached.apiVersionInfo == null || cached.apiVersionInfo != this.apiVersionInfo()) {
                console.log("cached version is out of date - will not use");
            }
            else {
                return cached;
            }
        }
    }

    // every disease is represented as a class in the ontology
    var obj = this.fetchClassInfo(id, {level:1});

    obj.apiVersionInfo = this.apiVersionInfo();

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

    this.addJsonLdContext(obj);
    
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
            if (cached.apiVersionInfo == null || cached.apiVersionInfo != this.apiVersionInfo()) {
                console.log("cached version is out of date - will not use");
            }
            else {
                return cached;
            }
        }
    }

    // every phenotype is represented as a class in the ontology
    var obj = this.fetchClassInfo(id, {level:1});

    obj.apiVersionInfo = this.apiVersionInfo();

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

    obj.genotype_associations = this.fetchMgiGenoPhenoAsAssocations(id).results;
    obj.genotype_associations = obj.genotype_associations.concat(this.fetchZfinGenoPhenoAsAssocations(id).results);

    if (this.cache != null) {
        this.cache.store('phenotype', id, obj);
    }

    return obj;
}




/* Function: fetchGenotypeInfo
 *
 * Retrieves JSON block providing info about a genotype
 *
 * Status: STUB - just diseases. No transitive closure.
 *
 * Retrieves JSON block providing info about a genotype
 *
 * The returned object will be the same as that for fetchClassInfo,
 * enhanced with genotype-specific information
 *
 * Arguments:
 *  id : An identifier. One of: IRI string, OBO-style ID or NIF-style ID
 *  opts : An associative array (EXTENSIBLE, OPTIONAL)
 *
 * Returns: JSON blob with info about the genotype
 */
bbop.monarch.Engine.prototype.fetchGenotypeInfo = function(id, opts) {
    if (this.cache != null) {
        var cached = this.cache.fetch('genotype', id);
        if (cached != null) {
            if (cached.apiVersionInfo == null || cached.apiVersionInfo != this.apiVersionInfo()) {
                console.log("cached version is out of date - will not use");
            }
            else {
                return cached;
            }
        }
    }

    // TODO - do not assume all genotypes are from MGI.
    // should the view be here or further upstream?
    var obj = this.fetchMgiGenotype(id);

    console.log("GENO:"+JSON.stringify(obj));

    obj.apiVersionInfo = this.apiVersionInfo();

    // TODO - make this more elegant
    // should the view be here or further upstream?
    obj.phenotype_associations = this.fetchMgiGenoPhenoAsAssocations(id).results;
    if (obj.phenotype_associations.length == 0) {
        obj.phenotype_associations = this.fetchZfinGenoPhenoAsAssocations(id).results;
    }

    if (this.cache != null) {
        this.cache.store('phenotype', id, obj);
    }

    return obj;
}


bbop.monarch.Engine.prototype.fetchAnatomyInfo = function(id, opts) {
    if (this.cache != null) {
        var cached = this.cache.fetch('anatomy', id);
        if (cached != null) {
            return cached;
        }
    }

    // every anatomy is represented as a class in the ontology
    var obj = this.fetchClassInfo(id, {level:1});


    //obj.disease_associations = this.fetchOmimDiseaseAnatomyAsAssocations(id); // TODO - smarter query
    obj.phenotype_associations = this.fetchOmimGenePhenotypeAsAssocations(id); // TODO - smarter query
    obj.gene_associations = this.fetchGeneExpressionAsAssocations(id);


    if (this.cache != null) {
        this.cache.store('anatomy', id, obj);
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
                id : "monarch:disco/" + r.e_uid,
                type : "Association", 
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

// ?? this view is really gene-disease? <-- YES
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

// EXAMPLE: https://beta.neuinfo.org/mynif/search.php?q=MP_0000854&t=indexable&list=cover&nif=nif-0000-00096-2
// EXAMPLE: http://beta.neuinfo.org/services/v1/federation/data/nif-0000-00096-2.json?includePrimaryData=true&q=MP_0000854
bbop.monarch.Engine.prototype.fetchMgiGenoPhenoAsAssocations = function(id) {
    var resource_id = 'nif-0000-00096-2'; // HARCODE ALERT

    var tr =
        function (r) {
            var obj = {
                id : "MGI:" + r.mgi_annotation_id, // TODO - push ID generation to ingest
                evidence : { 
                    type : {
                        id : r.evidence_code_id,
                        code : r.evidence_code,
                        label : r.evidence_code_label
                    }
                },
                reference : { 
                    id : r.pubmed_id,
                    label : r.Reference 
                },
                has_genotype : 
                {
                    // generic class of genotype
                    // (we could also model this as an individual)
                    type : {
                        id : r.mgi_genotype_id,
                        label : r.mgi_genotype_label,
                        type : "Genotype"
                    },

                    // background
                    has_part : { id : "MGI:" + r.background_strain_id,
                                 label: r.background_strain_name }
                },
                has_phenotype : {
                    description : r.free_text_phenotype_description,
                    type : 
                    {
                        id : r.phenotype_id,
                        label : r.phenotype_name
                    },
                },
                source : "MGI GenoPheno associations",
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

bbop.monarch.Engine.prototype.fetchZfinGenoPhenoAsAssocations = function(id) {
    var resource_id = 'nif-0000-21427-10'; // HARCODE ALERT

    var tr =
        function (r) {
            var pmids = r.pubmed_ids.split(", ");
            var refs = pmids.map(
                    function(pmid) {
                        var ref =
                        { 
                            id : "PMID:"+pmid,
                            type : "Publication",
                        }
                        return ref;
                    }
                );

            var inheres_in =
                    {
                        type :
                        {
                            id : r.affected_structure_or_process_1_superterm_id,
                            label : r.affected_structure_or_process_1_superterm_name
                        },
                    };
            if (r.affected_structure_or_process_1_subterm_id != "") {
                inheres_in.part_of = {
                    type :
                    {
                        id : r.affected_structure_or_process_1_subterm_id,
                        label : r.affected_structure_or_process_1_subterm_name
                    }
                };
            }
            var obj = {
                id : "ZFIN:" + r.zfin_annotation_id, // TODO - push ID generation to ingest
                evidence : { 
                    type : {
                        id : "ECO:0000006",
                        code : "EXP",
                        label : "inferred from experiment"
                    }
                },
                reference : refs,
                has_environment : { 
                    id : "ZFIN:" + r.environment_id,
                    label : r.environmental_conditions
                },
                has_genotype : 
                {
                    // generic class of genotype
                    // (we could also model this as an individual)
                    type : {
                        id : r.effective_genotype_id,
                        label : r.clean_effective_genotype_label,
                        type : "Effective Genotype"
                    },
                    has_part : {
                        id : r.genotype_id,
                        label : r.clean_genotype_name,
                        type : "Organismal Genotype"
                    },
                    //TODO: add experimental genotype to source table
                    has_part : {
                        id : r.experimental_genotype_id,
                        label : r.clean_experimental_genotype_label,
                        type : "Experimental Genotype"
                    },

                    // background
                    // TODO: this can be fetched from 21427-13
                    has_part : { id : "ZFIN:" + r.background_strain_id,
                                 label: r.background_strain_name }
                },
                has_phenotype : {
                    //description : r.free_text_phenotype_description,
                    type : 
                    {
                        id : r.zp_id,
                        label : r.zp_label,
                    },
                    inheres_in : inheres_in,
                    start_stage :
                    {
                        id : r.start_stage_id,
                        label : r.start_stage_name
                    },
                    end_stage :
                    {
                        id : r.end_stage_id,
                        label : r.end_stage_name
                    },
                },
                source : "ZFIN GenoPheno associations",
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


// EXAMPLE: https://neuinfo.org/mynif/search.php?q=MGI_4420313&first=true&t=indexable&nif=nif-0000-00096-3
// EXAMPLE: http://beta.neuinfo.org/services/v1/federation/data/nif-0000-00096-3.json?includePrimaryData=true&q=MGI_4420313
bbop.monarch.Engine.prototype.fetchMgiGenotype = function(id) {
    var resource_id = 'nif-0000-00096-3'; // HARCODE ALERT

    // note this follows a different pattern from the association-based federation query wrappers;
    // here we assume that 1 genotype is represented as 1..n rows
    var geno = {
        type : "Genotype",

        source : "MGI GenoAllele",
        resource : resource_id
    };

    var tr =
        function (r) {
            // these are properties of the container
            geno.id = r.mgi_genotype_id;
            geno.label = r.genomic_variation_complement; // CHECK THIS

            // TODO - check w Matt and Nicole if background is part of geno or g2a assoc?
            
            var obj = {
                type : "GenotypeAlleleAssociation",
                zygosity : r.zygosity,
                genomic_variation_complement : r.genomic_variation_complement,
                background : { id : r.genomic_background_in,
                               label: r.genomic_background_name,
                               allele_complement: r["Allele Complement"]
                },
                locus : { id : r.locus_id,
                          symbol : r.locus_symbol,
                          label : r.locus_name },
                // TODO allele stuff
                
                source : "MGI GenoAllele",
                resource : resource_id
            };
            return obj;
        };


    var resultObj = 
        this.fetchDataFromResource(id, 
                                   resource_id,
                                   tr
                                  );
    geno.alleles =
        resultObj.results;
    return geno;
}

// TODO
bbop.monarch.Engine.prototype.fetchRelatedClinicalTrials = function(id) {
}

// TODO
bbop.monarch.Engine.prototype.fetchRelatedDrugs = function(id) {
}

bbop.monarch.Engine.prototype.fetchMonarchIntegratedDiseaseModels = function(id) {
    var resource_id = 'nlx_152525-2'; // HARCODE ALERT

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
 * Implementation notes:
 *  - makes use of OntoQuest REST API which returns XML
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

/* Function: keywordSearchOverOntologies
 *
 * Get list of terms matching keywords. Here a 'term' is just a string
 * (TODO: find if there is a way to get OQ return ID+label pairs)
 *
 * TODO: all ancestors. E.g.
 * http://nif-services.neuinfo.org/ontoquest/keyword/glial+c/anc/terms/cell;process
 *
 * Can be used for auto-complete
 *
 * Arguments:
 * - term : keyword
 * - opts : Dictionary parameter
 *
 * Returns: Class struct as JSON
 */
bbop.monarch.Engine.prototype.keywordSearchOverOntologies = function(term, opts) {
    var nif_id = this.getNifId(id);
    var url = this.config.ontology_services_url + 'ontoquest-lamhdi/keyword/' + escape(term);
    var xmlStr = this.fetchUrl(url)
    var xml = this.parseXML(xmlStr); // TEMPORARY - OQ will soon return JSON
    var xterms = xml.data.term;
    var terms = [];
    for (var t in xterms) {
        terns.push(t.toString());
    }
    return terms;
}

/* Function: searchOverOntologies
 *
 * Get list of classes matching keywords
 *
 * TODO: all ancestors. E.g.
 * http://nif-services.neuinfo.org/ontoquest/keyword/glial+c/anc/terms/cell;process
 *
 * Arguments:
 * - term : keyword
 * - opts : Dictionary parameter
 *
 * Returns: Class struct as JSON
 */
bbop.monarch.Engine.prototype.searchOverOntologies = function(term, opts) {
    var results = [];
    var xmlStr = this.fetchUrl(this.config.ontology_services_url + 'ontoquest-lamhdi/concepts/search/' + escape(term));
    var xml = this.parseXML(xmlStr); // TEMPORARY - OQ will soon return JSON
    var classes = xml.data.classes.class;   
    for (var k in classes) {
        var cx = classes[k];
        console.log("C="+cx);
        var c = this._translateOntoQuestClassXml(cx);        
        results.push(c);
    }
    console.log("# search results = "+results.length);
    return results;
}


/* Function: fetchDataFromResource
 *
 * Services used: NIF federation call
 *
 * This currently relies on OntoQuest magic to ensure that the input ontology class ID is
 * expanded to all relevant https://support.crbs.ucsd.edu/browse/LAMHDI-140
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

// Translate OQ XML into JSON
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
        info = this._translateOntoQuestClassXml(c);
    }
    return info;
}

// given an XML object that is the data.classes portion of the OQ payload,
// turn this into JSON.
// See fetchClassInfo for details on the JSON structure
bbop.monarch.Engine.prototype._translateOntoQuestClassXml = function(c) {
    var info = {};
    if (c == null) {
        return null;
    }
    var id = c.id.toString();
    info = {
        id : id,
        label : c.label.toString(),
        url : c.url.toString(),
        type: "owl:Class",
    };

    var category = null;
    // TODO - OQ should tell us what kind of thing this is
    if (id.indexOf("OMIM") == 0 || id.indexOf("DOID") == 0 || id.indexOf("ORPHANET") == 0) {
        category = 'disease';
    }
    else if (id.indexOf("HP") == 0 || id.indexOf("MP") == 0 || id.indexOf("ZP") == 0) {
        category = 'phenocategory';
    }
    else if (id.indexOf("UBERON") == 0 || id.indexOf("FMA") == 0 || id.indexOf("MA") == 0 || id.indexOf("ZFA") == 0  || id.indexOf("CL") == 0) {
        category = 'anatomy';
    }
    info.category = category;

    // NOTE: OQ puts the definition into the comments field and suffixes [definition] on the end. Why?
    if (c.comments != null && c.comments.comment[0] != null) {
        info.comments = [c.comments.comment[0].toString()];
    }
    //for each (var p in c.other_properties.property) {
    //for (var i=0; i<c.other_properties.property.length; i++) {
    for (var i in c.other_properties.property) {
        var p = c.other_properties.property[i];
        var k = p['@name'];
        var v = p.toString();
        console.log("OTHER PROP: "+k+" = "+p);
        if (info[k] == null) {
            info[k] = [];
        }
        // if it quacks like a duck....
        if (info[k].push != null) {
            // OQ has dupes - we take care not to include these
            if (info[k].indexOf(v) < 0) {
                info[k].push(v);
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

/* Function: resolveClassId
 *
 * Resolves one of the many identifier styles to a canonical NIF-style class ID
 *
 *
 * Arguments:
 *   id : string
 *
 * Returns: NIF-style ID
 */
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

// See: http://www.slideshare.net/gkellogg1/json-for-linked-data
// Can be transated with: http://rdf-translator.appspot.com/
bbop.monarch.Engine.prototype.addJsonLdContext = function(info) {
    info['@context'] = this.getJsonLdContext();
}

// note: in future this may be modularized by datatype
// @seeAlso: http://geneontology.org/contexts/
bbop.monarch.Engine.prototype.getJsonLdContext = function() {
    var ctxt =
    {

        //////////////////////////////////////////
        // generic
        "@base": "http://monarch-initiative.org/",
        id : "@id",
        type : {"@id":"rdf:type", "@type":"@id"},

        //////////////////////////////////////////
        // Standard ID spaces
        //
        // TODO - standardize across all of NIF
        obo : "http://purl.obolibrary.org/obo/",
        DOID: "http://purl.obolibrary.org/obo/DOID_",
        ORPHANET: "http://purl.obolibrary.org/obo/ORPHANET_",
        OMIM: "http://purl.obolibrary.org/obo/OMIM_", // TODO - we could use omim.org but isn't linked data
        PMID: "http://www.ncbi.nlm.nih.gov/pubmed/", // TODO - use a linked data URI?
        HP: "http://purl.obolibrary.org/obo/HP_",
        MP: "http://purl.obolibrary.org/obo/MP_",
        ZP: "http://purl.obolibrary.org/obo/ZP_", // TODO
        GENO: "http://purl.obolibrary.org/obo/GENO_",
        ECO: "http://purl.obolibrary.org/obo/ECO_",
        RO: "http://purl.obolibrary.org/obo/RO_",
        BFO: "http://purl.obolibrary.org/obo/BFO_",
        monarch: "http://monarch-initiative.org/",
        MGI: "http://monarch-initiative.org/data/MGI_", // TODO
        SIO: "http://semanticscience.org/resource/SIO_",
        dc: "http://purl.org/dc/terms/",
        foaf: "http://xmlns.com/foaf/0.1/",
        rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
        rdfs: "http://www.w3.org/2000/01/rdf-schema#",
        xsd: "http://www.w3.org/2001/XMLSchema#",
        owl: "http://www.w3.org/2002/07/owl#",

        //////////////////////////////////////////
        // Standard semantic web vocabs

        label: "rdfs:label",
        comment: "rdfs:comment",
        description: "dc:description",
        email: "foaf:mbox",
        depiction: {"@id": "foaf:depiction", "@type": "@id"},
        title: "dc:title",
        source: "dc:source",
        website: {"@id": "foaf:homepage", "@type": "@id"},
        subClassOf: "owl:subClassOf",
        Class: "owl:Class",

        has_part : "BFO:0000051",

        created: {"@id": "dc:created", "@type": "xsd:dateTime"},
        creator: {"@id": "dc:creator", "@type": "@id"},

        //////////////////////////////////////////
        // Monarch specific stuff

        Association: "SIO:000897", // we may reconsider this

        // this key connects a general info bag to a set of
        // phenotype annotations.
        //
        // we need a somewhat fake property to connect these in the RDF
        // consider using IAO
        phenotype_associations: "rdfs:seeAlso",
        genotype_associations: "rdfs:seeAlso",

        // TODO - verify this w/ Matt
        has_genotype: "GENO:0000222",
        background: "GENO:0000010",

        // fairly generic relation - in this case connects our organism instance
        has_phenotype: "RO:0002200",

        // this is not quite the same as dc:source - we distinguish between
        // the NIF/DISCO view and the ultimate source. Good way of doing this
        // with IAO?
        resource: "monarch:nif-resource",

        reference : "dc:publication",  // ???
        evidence : "monarch:evidence", // ??? TODO

        // phenotype qualifiers - we need a vocab for these. Geno?
        onset: "monarch:age_of_onset",
        frequency: "monarch:frequency",
        inheritance: "monarch:mode_of_inheritance",
        
        // Note: we will revisit this after discussions of a generic association model
        disease: "monarch:disease",
        phenotype: "monarch:phenotype",
        
    };
    return ctxt;
}



