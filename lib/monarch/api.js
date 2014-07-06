/* 
 * monarch/api.js
 * 
 * Status: BETA
 * 
 * This API contains both *high level* calls to be used within the Monarch UI layer, as well as *lower level* calls for directly accessing
 * NIF Services - currently just OntoQuest and Federation services
 * 
 * This high level calls should abstract away from details of where information about a disease, phenotype, gene etc is stored.
 * 
 * The idea is that this application layer can live on either the server (i.e. within Rhino) or on the client.
 * Currently the status is that you MUST use Rhino whilst we are in testing phase. Some minor rewrites will be required to ise jQuery in place.
 * 
 *
 */


// ========================================
// SETUP
// ========================================
if (typeof bbop == 'undefined') { var bbop = {};}
if (typeof bbop.monarch == 'undefined') { bbop.monarch = {};}
var fs = require('fs');

// ========================================
// ENGINE
// ========================================

/*
 * Namespace: monarch.api
 * 
 * Constructor: bbop.monarch.Engine
 * 
 * constructor for Engine object
 * 
 * Example: engine = new bbop.monarch.Engine();
 * 
 * Arguments: opts : associative array. Keys: ontology_services_url,
 * federation_services_url
 */

bbop.monarch.Engine = function(opts) {
    if (bbop.monarch.defaultConfig != null) {
        console.log("Using pre-set configuration: ");
        this.config = bbop.monarch.defaultConfig;
    }
    else {
        console.log("Using default configuration");
        this.config = {};
    }
    
    // set defaults
    if (this.config.ontology_services_url == null) {
        this.config.ontology_services_url = 'http://nif-services-stage.neuinfo.org/ontoquest-lamhdi/'; // monarch
																										// ontology
																										// in
																										// ontoloquest
    }
    if (this.config.federation_services_url == null) {
        this.config.federation_services_url = "http://beta.neuinfo.org/services/v1/federation/";
    }
    if (this.config.annotate_services_url == null) {
        this.config.annotate_services_url = "http://neuinfo.org/services/v1/annotate/"; // @deprecated
    }
    if (this.config.owlsim_services_url == null) {
        this.config.owlsim_services_url = "http://owlsim.crbs.ucsd.edu/";
    }
    if (this.config.literature_services_url == null) {
        this.config.literature_services_url = "http://beta.neuinfo.org/services/v1/literature/";
    }
    
    // TODO - deprecate this
    this.config.closure_resources = [
        "nif-0000-03216-7", 
        "nif-0000-00053-4",
        "nif-0000-00096-6",
        "nif-0000-00558-2",
        "nif-0000-03216-9",
        "nif-0000-21427-10",
        "nlx_151835-1",
        "nlx_152525-2",
        "nlx_151671-2",
        "nlx_31015-2",
        // "nlx_152525-3" // requires further testing
    ];

    if (this.config.autocomplete_url == null) {
        this.config.autocomplete_url="http://nif-services.neuinfo.org/servicesv1/v1/vocabulary.json";
    }


    this.config.summary_categories = this.getConfig('summary_categories');

    //console.log("config: "+JSON.stringify(this.config));

       // @Deprecated
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

    var subprocess = require('ringo/subprocess');
    this.debugInfo = 
        {
            dateServerStarted : new Date(Date.now()),
            serverInfo : subprocess.command("uname -a"),
            apiVersionInfo : this.apiVersionInfo(),
        };

    // allow caller to override defaults
    if (opts != null) {
        for (var k in opts) {
            this.config[k] = opts[k];
        }
    }
}

bbop.monarch.Engine.prototype.setConfiguration = function(c) {
    for (var k in c) {
        console.log("Setting config "+k+" = "+c[k]);
        this.config[k] = c[k];
    }

}

bbop.monarch.Engine.prototype.apiVersionInfo = function() {
    // TODO: fill this in automatically with external config file value?
    return "monarch-api-2014-06-21";
}

bbop.monarch.Engine.prototype.introspect = function() {
    var meta =
        {
            debugInfo : this.debugInfo,
            config : this.config,
            cacheSize : (this.cache != null ? this.cache.contents().length : 0)

        };
    return meta;
}

// //////////////////////////////////////////////////////////////////
// 
// APPLICATION LOGIC
// 
// Anything related to genes, phenotypes, diseases and their
// connections - this is where you want to be.

/*
 * Function: fetchDiseaseInfo
 * 
 * Retrieves JSON block providing info about a disease
 * 
 * The returned object will be the same as that for fetchClassInfo, enhanced
 * with disease-specific information
 * 
 * Known issues: If a DOID is used, similarity scores will not be returned. This
 * should be resolved when the Federation API makes use of equivalence axioms.
 * 
 * Example: var diseaseInfo = engine.fetchDiseaseInfo("DOID_1430");
 * 
 * Status: status: PARTIALLY IMPLEMENTED
 * 
 * Arguments: id : An identifier. One of: IRI string, OBO-style ID or NIF-style
 * ID
 * 
 * Returns: JSON blob with info about the disease
 */
bbop.monarch.Engine.prototype.fetchDiseaseInfo = function(id, opts) {
    var engine = this;
    if (this.cache != null) {
        console.log("Checking cache for "+id);
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
    else {
        console.log("No cache for this engine");
    }

    // every disease is represented as a class in the ontology
    var obj = this.fetchClassInfo(id, {level:1});

    obj.apiVersionInfo = this.apiVersionInfo();

	// TEMP; workaround needed for orphanet
	if (id.match(/ORPHANET/)) {
		var resource = {id : 'nif-0000-21306-1', label : 'ORPHANET'};
		console.log("workaround for orphanet -- looking up label in "+resource.id);
		// look it up in the orphanet resource to get the label
		var instlabel = engine.fetchInstanceLabelByType(id,resource.id,'disease');
		console.log('FOUND:'+JSON.stringify(instlabel));
		if ((instlabel != null) && (instlabel.results != null) && (instlabel.results.length > 0)) {
			obj = { id : id, label : instlabel.results[0].label };	
		};
	}

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
    // * PHENOTYPES
    // * GENOMIC

    // TODO - enhance this object with calls to Federation services

    var resource_id;
    var phenotype_associations = [];
    var gene_associations = [];
	var pathway_associations = [];
    var models = [];
    var alleles = [];
    var sim = [];
    var similar_diseases = [];
    var similar_mice = [];
    var pathways = [];
    var literature = [];
    var pmids = [];
    var pmidinfo = [];

    // we want to fetch phenotypes from HPO annotations by keying using
    // OMIM, ORPHANET, DECIPHER IDs. Due to the way the merged DO works,
    // these *should* be the primary IDs.
    // we also might want the closure - e.g. for a generic disease,
    // get phenotypes for specific forms of this disease

    // for now, just use the entry point ID
    var disease_ids = [id];
    var engine = this;
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
        resultObj = engine.fetchDiseaseGeneAssociations(id,'disease');
        gene_associations = gene_associations.concat(resultObj);
        
        resultObj = this.fetchSequenceAlterationPhenotypeAsAssociations(id,'9606');
        alleles = alleles.concat(resultObj.results);    

		//TODO remove these
        sim = sim.concat(this.fetchMonarchDiseaseByDiseasePrecompute(id).results);
        // fetch the top 25 similar diseases
        similar_diseases = similar_diseases.concat(this.searchByDisease(id,'9606',25));
        similar_mice = similar_mice.concat(this.searchByDisease(id,'10090',25));

        if (phenotype_associations != null) {
            for (var i = 0; i < phenotype_associations.length; i += 1) {
                var phenotype = phenotype_associations[i].phenotype;
                var source = phenotype_associations[i].source;
                var ref = phenotype_associations[i].references;
                if (ref != null) {
                    for (var j = 0; j < ref.length; j += 1) {
                        var regex = /^(PMID|pmid):(\d+)$/;
                        var regres = regex.exec(ref[j].id);
                        if (regres != null) {
                            var num = regres[2];
                            if (pmids.indexOf(num) == -1) {
                                pmids.push(num);
                            }
                            var citation = {
                                type: "phenotype",
                                obj: phenotype,
                                source: source,
                                pub: num,
                            };
                            literature.push(citation);
                        }
                    }
                }
            }
        };
        if (gene_associations != null) {
            for (var i = 0; i < gene_associations.length; i += 1) {
                var gene = gene_associations[i].gene;
                var source = gene_associations[i].source;
                var ref = gene_associations[i].references;
                if (ref != null) {
                    for (var j = 0; j < ref.length; j += 1) {
                        var regex = /^(PMID|pmid):(\d+)$/;
                        var regres = regex.exec(ref[j].id);
                        if (regres != null) {
                            var num = regres[2];
                            if (pmids.indexOf(num) == -1) {
                                pmids.push(num);
                            }
                            var citation = {
                                type: "gene",
                                obj: gene,
                                source: source,
                                pub: num,
                            };
                            literature.push(citation);
                        }
                    }
                }
            }
        };
        if (alleles != null) {
            for (var i = 0; i < alleles.length; i += 1) {
                var allele = alleles[i].allele;
                var source = alleles[i].source;
                var ref = alleles[i].evidence.split(", ");
                    if (ref != null) {
                    for (var j = 0; j < ref.length; j += 1) {
                        var regex = /^(PMID|pmid):(\d+)$/;
                        var regres = regex.exec(ref[j]);
                        if (regres != null) {
                            var num = regres[2];
                            if (pmids.indexOf(num) == -1) {
                                pmids.push(num);
                            }
                            var citation = {
                                type: "allele",
                                obj: allele,
                                source: source,
                                pub: num,
                            };
                            literature.push(citation);
                        }
                    }
                }
            }
        };


		// old
        // resultObj = this.fetchPathwaysForDisease(id);
        // pathways = pathways.concat(resultObj.results);

        resultObj = engine.fetchAssertedDiseasePathwayAssociations(id,obj.label);
        pathway_associations = pathway_associations.concat(resultObj);
        resultObj = engine.fetchInferredDiseasePathwayAssociations(id,obj.label,gene_associations);
        pathway_associations = pathway_associations.concat(resultObj);
    
        resultObj = engine.fetchPubFromPMID(pmids);
        pmidinfo = pmidinfo.concat(resultObj);

    }

    // add annotation sufficiency score to the associations

/*
 * var pheno_features = phenotype_associations.map(function(p) { return { id :
 * p.phenotype.id, "isPresent" : (p.modifier == "normal" ? "false" : "true") }
 * }); var annotation_profile = { id : obj.id, label : obj.label, features :
 * pheno_features };
 * 
 * //could be configurable set of categories in the future var categories =
 * getConfig('summary_categories'); var info_profile =
 * engine.getInformationProfile(annotation_profile,categories);
 * 
 * phenotype_associations.annotation_sufficiency = info_profile.scaled_score
 */

    obj.annotation_sufficiency = engine.getAnnotationSufficiencyScoreFromAssociations(phenotype_associations);

    obj.gene_associations = gene_associations;
    obj.phenotype_associations = phenotype_associations;
    obj.models = models;
    obj.similar_models = {'10090' : similar_mice};
    obj.alleles = alleles;
    obj.sim = sim
    obj.similar_diseases = similar_diseases;
    // obj.pathways = pathways;
	obj.pathway_associations = pathway_associations;
	obj.literature = literature;
	obj.pmidinfo = pmidinfo;

    this.addJsonLdContext(obj);

    if (this.cache != null) {
        this.cache.store('disease', id, obj);
    }
    console.log('pathway_assoc'+JSON.stringify(obj.pathway_associations,null,' '));
    return obj;
}

bbop.monarch.Engine.prototype.getAnnotationSufficiencyScoreFromAssociations = function(assocs) {
    var engine = this;
	//console.log('assoc:'+JSON.stringify(assocs,null,' '));

	// assoc style not uniform. sometimes it is p.phenotype.id; other times it
	// is in has_phenotype
	// TODO standardize association formats
    var features = assocs.map(
		function(p) { 
		    var phenotype_id = null;
			var modifier = null;
			if (p.phenotype != null) {
				phenotype_id = p.phenotype.id;
				modifier = p.modifier;
			} else if (p.has_phenotype != null && p.has_phenotype.type != null) {
				phenotype_id = p.has_phenotype.type.id;
				modifier = p.has_phenotype.modifier;
			}
			return { id : phenotype_id,"isPresent" : (modifier == "normal" ? "false" : "true") } }
	);
    var annotation_profile = { features : features };

    // could be configurable set of categories in the future
    var categories = engine.config.summary_categories;
// var categories = getConfig('summary_categories');
    var info_profile = engine.getInformationProfile(annotation_profile,categories);
	//console.log("ANNOTATION_SUFFICIENCY: "+info_profile.scaled_score);
    return  info_profile.scaled_score

}

/*
 * Function: fetchPhenotypeInfo
 * 
 * Retrieves JSON block providing info about a phenotype
 * 
 * Status: STUB - just diseases. No transitive closure.
 * 
 * Retrieves JSON block providing info about a phenotype
 * 
 * The returned object will be the same as that for fetchClassInfo, enhanced
 * with phenotype-specific information
 * 
 * Arguments: id : An identifier. One of: IRI string, OBO-style ID or NIF-style
 * ID opts : An associative array (EXTENSIBLE, OPTIONAL)
 * 
 * Returns: JSON blob with info about the phenotype
 */
bbop.monarch.Engine.prototype.fetchPhenotypeInfo = function(id, opts) {
    //console.log("Phenotype: "+id);
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
    // * DISEASE/DISORDER
    // - OMIM diseeases by phenotype - DONE
    // * GENOMIC
    // - OMIM genes by phenotype
    // - model organism genes or genotypes with this phenotype (requires
	// uberpheno plus reasoning)

    var literature = [];
    var pmids = [];
    var pmidinfo = [];
    // ** OMIM **

    var resultObj = this.fetchOmimDiseasePhenotypeAsAssocations(id);
    obj.disease_associations = resultObj.results;

    var numResults = resultObj.resultCount;

    // disease-pairs matched using this phenotype (EXPERIMENTAL)
	//TODO remove
    obj.sim =this.fetchMonarchDiseaseByDiseasePrecompute(id).results;

    // TODO: this should probably be smarter to figure out what species the
	// phenotype is in and then only query the relevant species
    // TODO: is taxon id attached to the phenotype term?
    obj.genotype_associations = this.fetchGenoPhenoAsAssociationsBySpecies(id,'10090','phenotype').results;                                  // Mouse
    obj.genotype_associations = obj.genotype_associations.concat(this.fetchGenoPhenoAsAssociationsBySpecies(id,'7955','phenotype').results); // Fish
    obj.genotype_associations = obj.genotype_associations.concat(this.fetchGenoPhenoAsAssociationsBySpecies(id,'6239','phenotype').results); // Worm
    obj.genotype_associations = obj.genotype_associations.concat(this.fetchGenoPhenoAsAssociationsBySpecies(id,'9606','phenotype').results); // Human
    // obj.genotype_associations =
	// obj.genotype_associations.concat(this.fetchWormGenoPhenoAsAssocations(id).results);

    if (obj.disease_associations != null) {
        for (var i = 0; i < obj.disease_associations.length; i += 1) {
            var disease = obj.disease_associations[i].disease;
            var source = obj.disease_associations[i].source;
            var ref = obj.disease_associations[i].references;
            if (ref != null) {
                for (var j = 0; j < ref.length; j += 1) {
                    var regex = /^(PMID|pmid):(\d+)$/;
                    var regres = regex.exec(ref[j].id);
                    if (regres != null) {
                        var num = regres[2];
                        if (pmids.indexOf(num) == -1) {
                            pmids.push(num);
                        }
                        var citation = {
                            type: "disease",
                            obj: disease,
                            source: source,
                            pub: num,
                        };
                        literature.push(citation);
                    }
                }
            }
        }
    };
    if (obj.genotype_associations != null) {
        for (var i = 0; i < obj.genotype_associations.length; i += 1) {
            var genotype = obj.genotype_associations[i].has_genotype;
            var source = obj.genotype_associations[i].source;
            var ref = obj.genotype_associations[i].reference;
            if (ref != null) {
                var regex = /^(PMID|pmid):(\d+)$/;
                var regres = regex.exec(ref.id);
                if (regres != null) {
                    var num = regres[2];
                    if (pmids.indexOf(num) == -1) {
                        pmids.push(num);
                    }
                    var citation = {
                        type: "genotype",
                        obj: genotype,
                        source: source,
                        pub: num,
                    };
                    literature.push(citation);
                }
            }
        }
    };

    resultObj = engine.fetchPubFromPMID(pmids);
    pmidinfo = pmidinfo.concat(resultObj);
	obj.literature = literature;
	obj.pmidinfo = pmidinfo;

    // ** GENES **
    // TODO: based on the genotype_associations fetched, we shold be able to get
	// the implicated genes
    // TODO


    if (this.cache != null) {
        this.cache.store('phenotype', id, obj);
    }

    return obj;
}

/*
 * Function: fetchGenotypeInfo
 * 
 * Retrieves JSON block providing info about a genotype
 * 
 * The structure follows geno, e.g.
 *  > { id: ZDB-GENO-...?, label:, a<tm1>/a<+>;foo<x>/foo<x>(AB), type:
 * effective_genotype > has_part : [ > > { id: , label:, a<tm1>/a<+>;foo<x>/foo<x>(AB),
 * type: intrinsic_genotype ## aka SO:genotype > has_reference_part : { > id:..,
 * label:AB, type: genomic_background > } > has_variant_part : { > id:..,
 * label:, a<tm1>/a<+>;foo<x>/foo<x>, type: genomic_variation_complement, >
 * has_variant_part : [ > { > id:.., label:, a<tm1>/a<+>, type:
 * variation_single_locus_complement, > has_variant_part : [ > { > id: ZDB-ALT-,
 * label: a<tm1>, type: variant_locus, > is_locus_instance_of : { > id:
 * ZDB-GENE-..., label: a, type: gene_locus, > has_variant_part : { > id:,
 * label: tm1, type: point_mutation > } > }}]}]}}]}
 * 
 * Arguments: id : An identifier. One of: IRI string, OBO-style ID or NIF-style
 * ID opts : An associative array (EXTENSIBLE, OPTIONAL)
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
                console.log("Using Cached version of "+id);
                return cached;
            }
        }
    }

    // TODO: identifier resolver needed
    var obj = this.fetchGenotype(id,'10090'); // Mouse
        // console.log("mouseGENO:"+JSON.stringify(obj));
    if (obj == null) {
        var obj = this.fetchGenotype(id,'7955'); // Fish
    } else {
        console.log("mouse genotype found");
    }
    if (obj == null) {
        var obj = this.fetchGenotype(id,'6239'); // Worm
    } else {
        console.log("worm genotype found");
    }
        if (obj == null) {
            var obj = this.fetchGenotype(id,'9606'); // Human
        } else {
        console.log("human genotype found");
    }

    // console.log("GENO:"+JSON.stringify(obj));

    // TODO - make this more elegant
    // TODO: should get this directly from the genotype... not sure why it's not
	// there
    // obj.phenotype_associations =
	// this.fetchGenoPhenoAsAssociationsBySpecies(id,obj.taxon.id).results;
    if (obj == null) {
        obj = {};
        obj.id = id;
    }
        obj.phenotype_associations = this.fetchGenoPhenoAsAssociationsBySpecies(id,'10090').results;  // Mouse
        obj.phenotype_associations = obj.phenotype_associations.concat(this.fetchGenoPhenoAsAssociationsBySpecies(id,'7955').results); // Fish
        obj.phenotype_associations = obj.phenotype_associations.concat(this.fetchGenoPhenoAsAssociationsBySpecies(id,'6239').results); // Worm
    obj.phenotype_associations = obj.phenotype_associations.concat(this.fetchGenoPhenoAsAssociationsBySpecies(id,'9606').results); // Human

    obj.annotation_sufficiency = engine.getAnnotationSufficiencyScoreFromAssociations(obj.phenotype_associations);

    obj.apiVersionInfo = this.apiVersionInfo();

    var literature = [];
    var pmids = [];
    var pmidinfo = [];
    if (obj.phenotype_associations != null) {
        for (var i = 0; i < obj.phenotype_associations.length; i += 1) {
            var phenotype = obj.phenotype_associations[i].has_phenotype.type;
            var source = obj.phenotype_associations[i].source;
            var ref = obj.phenotype_associations[i].reference;
            if (ref != null) {
                var regex = /^(PMID|pmid):(\d+)$/;
                var regres = regex.exec(ref.id);
                if (regres != null) {
                    var num = regres[2];
                    if (pmids.indexOf(num) == -1) {
                        pmids.push(num);
                    }
                    var citation = {
                        type: "phenotype",
                        obj: phenotype,
                        source: source,
                        pub: num,
                    };
                    literature.push(citation);
                }
            }
        }
    };
    var resultObj = engine.fetchPubFromPMID(pmids);
    pmidinfo = pmidinfo.concat(resultObj);
	obj.literature = literature;
	obj.pmidinfo = pmidinfo;

    if (this.cache != null) {
        this.cache.store('genotype', id, obj);
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

    var pheno_ids = this.getPhenotypesByEntityClass(id);
    pheno_ids = pheno_ids.map(function(id) { return id.replace("http://purl.obolibrary.org/obo/","").replace("_",":") });
    obj.phenotype_ids = pheno_ids;
    var cx = this;
    obj.phenotypes = pheno_ids.map(function(id){ return cx.fetchClassInfo(id, {level:0})});
    
    // for (var k in pheno_ids) {
    // var pid = pheno_ids[k];
    // var p = this.fetchPhenotypeInfo(pid);
    //
    // }

    var useExperimentalUnion = false;
    if (useExperimentalUnion) {

        var mega_id = pheno_ids.join(" OR ");
        // var ph = this.fetchPhenotypeInfo({unionOf : pheno_ids});
        
        // copy-and-pasted from fetchPhenotypeInfo - TODO DRY
        obj.disease_associations = this.fetchOmimDiseasePhenotypeAsAssocations(mega_id);
        
        // TODO: this should probably be smarter to figure out what species the
		// phenotype is in and then only query the relevant species
        // TODO: is taxon id attached to the phenotype term?
        obj.genotype_associations = this.fetchGenoPhenoAsAssociationsBySpecies(mega_id,'10090').results;  // Mouse
        obj.genotype_associations = obj.genotype_associations.concat(this.fetchGenoPhenoAsAssociationsBySpecies(mega_id,'7955').results); // Fish
        obj.genotype_associations = obj.genotype_associations.concat(this.fetchGenoPhenoAsAssociationsBySpecies(mega_id,'6239').results);   // Worm
        obj.genotype_associations = obj.genotype_associations.concat(this.fetchGenoPhenoAsAssociationsBySpecies(mega_id,'9606').results);   // Human
    }

    // obj.disease_associations = ph.disease_associations;
    // obj.genotype_associations = ph.genotype_associations;

    // obj.disease_associations = this.fetchOmimDiseaseAnatomyAsAssocations(id);
	// // TODO - smarter query
    // obj.phenotype_associations =
	// this.fetchOmimGenePhenotypeAsAssocations(id); // TODO - smarter query
    // obj.phenotype_associations =
	// this.fetchGenoPhenoAsAssociationsBySpecies(id,'9606').results;

    // obj.gene_associations = this.fetchGeneExpressionAsAssocations(id);

    if (this.cache != null) {
        this.cache.store('anatomy', id, obj);
    }

    return obj;
}



/*
 * Function: fetchGeneInfo
 * 
 * Status: PARTIALLY IMPLEMENTED
 * 
 * TODO - decide whether core gene info should come from ontology or federation
 * 
 * Retrieves JSON block providing info about a gene, currently from MyGene
 * 
 * The returned object will be the same as that for fetchClassInfo, enhanced
 * with gene-specific information
 * 
 * 
 * Arguments: id : An identifier. One of: IRI string, OBO-style ID or NIF-style
 * ID
 * 
 * Returns: JSON blob with info about the gene
 */
bbop.monarch.Engine.prototype.fetchGeneInfo = function(id, opts) {
    if (this.cache != null) {
        var cached = this.cache.fetch('gene', id);
        if (cached != null) {
            if (cached.apiVersionInfo == null || cached.apiVersionInfo != this.apiVersionInfo()) {
                console.log("cached version is out of date - will not use");
            }
            else {
                return cached;
            }
        }
    }
    
    var gene = {};
    var resource_id;
    var phenotype_associations = [];
    var orthologs = [];
    var interactions = [];
    var gene_associations = [];
    var disease_associations = [];
    var models = [];
    var alleles = [];
    var sim = [];
    var similar_diseases = [];
    var similar_mice = [];
    var pathways = [];
    var genotype_associations = [];
    var xrefs = {};
    var xref_table = [];
    var analyze_phenotypes;
    var literature = [];
    var pmids = [];
    var pmidinfo = [];
    
    // This will call MyGene services to get the basic gene information
    // can be augmented a lot.
    // See http://mygene.info/v2/api//Remove NCBI prefix
    
    id  = id.replace(/NCBI[Gg]ene_/,"NCBIGene:");  
    gene.id = id;

    var obj = this.fetchGeneInfoFromMyGene(id.replace(/NCBI_?[Gg]ene:/,""));

    if (obj.source == "NOT FOUND") {
        // couldn't find the gene from MyGene, so look it up in our
        // mapping table
        var mappings = this.mapGeneToNCBIgene(id);
        console.log(JSON.stringify(mappings));
        // let's just take the first one for now, if there's >1
        var ncbigene_ids = Object.keys(mappings);
        var ncbigene = {};
        if (ncbigene_ids.length > 0) {
            ncbigene = mappings[ncbigene_ids[0]];
            if (ncbigene.id){
                ncbi_id = ncbigene.id;
                ncbi_id = ncbi_id.replace(/NCBI_?[Gg]ene:/,'');
                ncbigene.ncbi_id = ncbi_id;
            }
		// TODO get all xrefs
            gene = ncbigene;
        }
        gene.references = [];
    } else {
        gene = {
            // we found it, now make the object in our style
            id : 'NCBIGene:'+obj.entrezgene,
            ncbi_id : obj.entrezgene,
            label : obj.symbol,
            description : obj.name,
            summary : obj.summary,
            taxon : {
            	      id: "NCBITaxon:" + obj.taxid,
            	      label: obj.taxid
            	    },
            references : [
                 {
                  id:'NCBIGene:'+obj.entrezgene,
                  source : 'NCBIGene'
                 }
            ],
            source : "MyGene"
        };
        
        if (obj.map_location){
            gene.location = obj.map_location;
        }
        if (obj.ensembl){
            if (obj.ensembl.gene){
                gene.references.push({ 
                	                   id:'Ensembl:'+obj.ensembl.gene,
                	                   source : 'Ensembl'
                	                 });
            }
        }
    }
    console.log("GENE: "+JSON.stringify(gene));
    
    
    // Get organism
    if (gene.ncbi_id){
        //var filters = ["geneid:"+this.quote(gene.ncbi_id.toString())];  
		//var filters = ["geneid:"+gene.ncbi_id.toString()] 
		var filters = { geneid : gene.ncbi_id.toString() };

        var resource_id = 'nif-0000-02801-1';
        var fetchOrg = 
            this.fetchDataFromResource(null,
                    resource_id,null,null,null,filters,null,null,null
                );
    
        // TODO how to handle multiple results (should only have 1)
        if (fetchOrg.results[0]){
            if (gene.taxon.label.toString() === fetchOrg.results[0].tax_id.toString()){
                gene.species = fetchOrg.results[0].species;
            }
        }
    }
    
    
    // obj.kegg_stuff = this.mapNCBIGeneToKO(id);
    // TODO: how should i handle multiple mappings to ncbi?
    var genePathways = this.fetchPathwaysForGene(gene.id);
    if (genePathways == null || genePathways.pathways == null) {
        console.warn("No pathway info");
    }
    else {
        // gene.pathways = pathwayInfo.pathways;
		var pathway_associations = [];
        // console.log('GENEPATHWAYS:'+JSON.stringify(genePathways));
		if (genePathways.pathways){
         for (var j=0; j<genePathways.pathways.length; j++) { 
             var pathway = genePathways.pathways[j];
             // pathway.id = pathway.id;
             var assoc = {
                 id : "monarch:disco/" + gene.v_uuid,
				 // TODO these are actually inferred via orthology, say this?
                 type : "Association",
                 gene : {id : gene.id, label : gene.label},
                 pathway : pathway,
                 source : pathway.source,
                 resource : pathway.source,
                 references : pathway.references
             };
             pathway_associations.push(assoc);
         }
		}
		gene.pathway_associations = pathway_associations;
    }
    // TODO: include SO type id?
    gene.type = "gene";
    
    var removedXRefs = ['EMBL-Bank','NCBI_Genome','NIA','NCBI_nuccore',
                        'NCBI_locus_tag','DoTS','HomoloGene','CCDS',
                        'BIOGRID','NCBI_gi','NCBI_GP','EC','RefSeq_NA',
                        'RefSeq_Prot','VEGA','Unigene'];
    
    // Generate cross references
    var geneMap = this.mapNCBIGeneToSource(gene.id);
    var unique = {};
    for (var k=0; k < gene.references.length; k++){
    	unique[gene.references[k].id] = 1;
    }
    if (geneMap.results){
    	for (var i=0, len=geneMap.results.length; i < len; i++){
    		if (!geneMap.results[i].source){
    			continue;
    		} else if (removedXRefs.indexOf(geneMap.results[i].source) >= 0) {
    		    continue;
    		} else if ((geneMap.results[i].id.match(/MGD\-MRK\-/))||
    		           (geneMap.results[i].id.match(/ENS.*[PT]/))) {
    			continue;
    		}
    		
    		if (geneMap.results[i].id in unique){
                continue;
            } 
    		gene.references.push(geneMap.results[i]);
    		unique[geneMap.results[i].id] = 1;
    	}
    }
    
    // Map NCBI gene to disease data
    disease_associations = this.fetchDiseaseGeneAssociations(gene.id,'gene');
    
    disease_associations = disease_associations.filter(function(d){
		return d.gene.id === gene.id;});
    
    // Map NCBI gene to phenotype data
    
    // PHENOTYPES
    if (disease_associations){
    	for (var i=0;i < disease_associations.length; i++){
            var resultSet = 
            	this.fetchDiseasePhenotypeAsGeneAssocations(disease_associations[i].disease.id,gene);
            if (resultSet){
                phenotype_associations = phenotype_associations.concat(resultSet);
            }
    	}
    	//Uniquify phenotype associations
    	var uniqResults = 
        	this.uniquifyResultSet(phenotype_associations,["gene","phenotype","disease"],"false","true");
    	phenotype_associations = uniqResults;
    }

    // This code is generate associations for tables using ids other than NCBI
	// gene
    // typically for model organisms.
    if (gene.references[0]){
            
        // Check to make sure gene is the same for each result
        for (var i=0;i < gene.references.length; i++){
            	
            var modelObj = this.fetchModelOrgGenePhenotypeAsAssociation(gene.references[i].id,
                                                                        gene.references[i].source,
                                                                        gene);
            var genoTypeObj = this.fetchGeneGenoTypeAsAssociation(gene.references[i].id,
           			                                              gene.references[i].source,
           			                                              gene);
            
            var orthoObj = this.fetchGeneOrthologAsAssociation(gene.references[i].id,gene.label,gene);
            
            var alleleObj = this.fetchGeneAlleleAsAssociation(gene.references[i].id,
                                                              gene,gene.taxon.id);
            
            if (orthoObj){
                orthologs = orthologs.concat(orthoObj.results)
            }
            
            if (alleleObj){
                alleles = alleles.concat(alleleObj.results);
            }
            	
            if (modelObj){
                phenotype_associations = phenotype_associations.concat(modelObj.results);
            }
            if (genoTypeObj){
                genotype_associations = genotype_associations.concat(genoTypeObj.results);
            }
            
            //Generate cross references table
            if (xrefs[gene.references[i].source]){
            	xrefs[gene.references[i].source] =  
            		xrefs[gene.references[i].source].concat({id: gene.references[i].id});
            } else {
                xrefs[gene.references[i].source] = [];
                xrefs[gene.references[i].source] =  
                	xrefs[gene.references[i].source].concat({id: gene.references[i].id});
            }
        }    
    }
    
    // Generate human-genotype and human-allele relationships
    // HACK - This is a hardcode based on NCBI taxon id, this should be changed
    // eventually to a non-hardcoded approach
    
    if ((gene.taxon) && (gene.taxon.id)) {
        if (gene.taxon.id.toString() === '9606'){
        	    	
        	 var genoTypeObj = this.fetchGeneGenoTypeAsAssociation(gene.id,
                                                                   'human',
                                                                   gene);
        	 
        	 var alleleObj = this.fetchGeneAlleleAsAssociation(gene.id,
                                                               gene,gene.taxon.id);
        	 if (genoTypeObj){
                 genotype_associations = genotype_associations.concat(genoTypeObj.results);
             }
        	 if (alleleObj){
                 alleles = alleles.concat(alleleObj.results);
             }
        }
    }
    // HACK to generate content for MGI IDs
    // that are not found in mygene or our lookup table
    if (id.match(/MGI/)&&(!gene.ncbi_id)) {
    	formID = id.replace(/MGI_/,'MGI:');
    	gene.id = formID;
    	gene.label = formID;
    	var modelObj = this.fetchModelOrgGenePhenotypeAsAssociation(formID,
                                                                    'MGI',
                                                                    gene);
    	
        var genoTypeObj = this.fetchGeneGenoTypeAsAssociation(formID,
                                                              'MGI',
                                                              gene);

        var orthoObj = this.fetchGeneOrthologAsAssociation(formID,'MGI',gene);

        var alleleObj = this.fetchGeneAlleleAsAssociation(formID,gene,10090);

        if (orthoObj){
            orthologs = orthologs.concat(orthoObj.results)
        }
        if (alleleObj){
            alleles = alleles.concat(alleleObj.results);
            }
        if (modelObj){
            phenotype_associations = phenotype_associations.concat(modelObj.results);
        }
        if (genoTypeObj){
            genotype_associations = genotype_associations.concat(genoTypeObj.results);
        }
    }
    
    // Find gene interactions
    var interactionObj = this.fetchGeneInteractions(id);
    if (interactionObj){
        interactions = interactions.concat(interactionObj.results);
    }

    // Add results to gene object
    gene.phenotype_associations = phenotype_associations;
    gene.genotype_associations = genotype_associations;
    gene.alleles = alleles;
    gene.orthologs = orthologs;
    gene.interactions = interactions;
    gene.disease_associations = disease_associations;
    
    //Build xref table from xrefs object
    var xrefs_keys = Object.keys(xrefs);
    for (var i=0; i < xrefs_keys.length; i++){
    	var xref_row = {
    			         id : xrefs[xrefs_keys[i]],
    			         source : xrefs_keys[i]
    	                }
    	xref_table = xref_table.concat(xref_row);
    }
    //Update gene.references instead of creating a redundant table
    gene.references = xref_table;
    
    // Generate inferred diseases from orthologs
    if ((!gene.disease_associations[0])&&(gene.orthologs)&&(gene.taxon)&&(gene.taxon.id != 9606)){
    	for (var i=0;i < gene.orthologs.length; i++){
    		if (gene.orthologs[i].organism == 'Homo sapiens'){
    			var disObj = this.fetchDiseaseGeneAssociations(gene.orthologs[i].ortholog.id,'gene');
    			if (disObj){
    				disease_ortho_assocs = disObj.filter(function(d){
    					return d.gene.id === gene.orthologs[i].ortholog.id;});
    			    disease_associations = disease_associations.concat(disease_ortho_assocs);
    			}
    		}
    	}
    	if (disease_associations[0]){
    		for (var i=0, len=disease_associations.length; i < len; i++){
    			disease_associations[i].association_type = 'putative - via ortholog';
    			disease_associations[i].model_gene = {};
    			disease_associations[i].model_gene.id = disease_associations[i].gene.id;
    			disease_associations[i].model_gene.label = disease_associations[i].gene.label;
    			disease_associations[i].gene.id = id;
    			disease_associations[i].model_species = 'Homo sapiens';
    			if (gene.label){
    				disease_associations[i].gene.label = gene.label;
    			} else {
    				disease_associations[i].gene.label = '';
    			}
    			
    		}
    	}
    	gene.disease_associations = disease_associations;
    }

    // Sort references and orthologs
    gene.references.sort(function (reference, query) { return reference.source.localeCompare(query.source) });
    gene.orthologs.sort(function (reference, query) { return reference.organism.localeCompare(query.organism) });
    
    // Create analyze phenotype link
    if (gene.phenotype_associations){
    	analyze_phenotypes = '/analyze/phenotypes/?input_items=';
    	for (var i=0;i < gene.phenotype_associations.length; i++){
                var next = i + 1;
                if (gene.phenotype_associations[next]){
    			analyze_phenotypes = analyze_phenotypes + gene.phenotype_associations[i].phenotype.id + "+";
    	        } else {
    	        	analyze_phenotypes = analyze_phenotypes + gene.phenotype_associations[i].phenotype.id;
    	        }
    	}
    	analyze_phenotypes = analyze_phenotypes + "&limit=100";
    	if (gene.taxon){
    		if (gene.taxon.id){
    		    analyze_phenotypes = analyze_phenotypes + "&target_species=" + gene.taxon.label.toString();
    		}
    	}	
    }
    gene.analyze_phenotypes = analyze_phenotypes;

    // Capitalize first letter of gene description
    // HACK - Perhaps this should be done on the client side
    if (gene.description){
        var capLabel = gene.description.charAt(0).toUpperCase() 
                       + gene.description.substring(1);
        gene.description = capLabel;
    }

    gene.annotation_sufficiency = engine.getAnnotationSufficiencyScoreFromAssociations(phenotype_associations);

    if (gene.phenotype_associations != null) {
        for (var i = 0; i < gene.phenotype_associations.length; i += 1) {
            var phenotype = gene.phenotype_associations[i].phenotype;
            var source = gene.phenotype_associations[i].source;
            var ref = gene.phenotype_associations[i].references;
            if (ref != null) {
                for (var j = 0; j < ref.length; j += 1) {
                    var regex = /^(PMID|pmid):(\d+)$/;
                    var regres = regex.exec(ref[j].id);
                    if (regres != null) {
                        var num = regres[2];
                        if (pmids.indexOf(num) == -1) {
                            pmids.push(num);
                        }
                        var citation = {
                            type: "phenotype",
                            obj: phenotype,
                            source: source,
                            pub: num,
                        };
                        literature.push(citation);
                    }
                }
            }
        }
    };
    if (gene.disease_associations != null) {
        for (var i = 0; i < gene.disease_associations.length; i += 1) {
            var disease = gene.disease_associations[i].disease;
            var source = gene.disease_associations[i].source;
            var ref = gene.disease_associations[i].references;
            if (ref != null) {
                for (var j = 0; j < ref.length; j += 1) {
                    var regex = /^(PMID|pmid):(\d+)$/;
                    var regres = regex.exec(ref[j].id);
                    if (regres != null) {
                        var num = regres[2];
                        if (pmids.indexOf(num) == -1) {
                            pmids.push(num);
                        }
                        var citation = {
                            type: "disease",
                            obj: disease,
                            source: source,
                            pub: num,
                        };
                        literature.push(citation);
                    }
                }
            }
        }
    };
    if (gene.interactions != null) {
        for (var i = 0; i < gene.interactions.length; i += 1) {
            var geneb = gene.interactions[i].geneb;
            var source = gene.interactions[i].source;
            var ref = gene.interactions[i].references;
            if (ref != null) {
                var regex = /^(PMID|pmid):(\d+)$/;
                var regres = regex.exec(ref.id);
                if (regres != null) {
                    var num = regres[2];
                    if (pmids.indexOf(num) == -1) {
                        pmids.push(num);
                    }
                    var citation = {
                        type: "gene",
                        obj: geneb,
                        source: source,
                        pub: num,
                    };
                    literature.push(citation);
                }
            }
        }
    };

    console.log("Fetching PMIDs...");
    var resultObj = engine.fetchPubFromPMID(pmids);
    pmidinfo = pmidinfo.concat(resultObj);
	gene.literature = literature;
	gene.pmidinfo = pmidinfo;

    if (this.cache != null) {
        this.cache.store('gene', id, gene);
    }
    
    return gene;
}

/*
 * Function:fetchGeneOrthologAsAssociation
 * 
 * Returns: ordered list of matches
 * 
 * Arguments: - id : single gene id
 * 
 */
bbop.monarch.Engine.prototype.fetchGeneOrthologAsAssociation = function(id,label,genObj) {
	var resource_id = 'nlx_84521-1'; // HARDCODE
	var engine = this;
//    var filter = [];
    var resultObj = {};
    resultObj.results = [];
    
    //filter = ["genea:" +this.quote(id)];
//    filter = ["genea:"+id];
	var filter = { genea : id };

    var tr =
        function (r) {
    	
    	var obj = {
                id : "monarch:disco/" + r.e_uid,
                type : "Association", 
                gene : { 
                    id : genObj.id,
                    label: label
                },
            
                ortholog : { 
                    id : r.geneb// ,
                    // label : r.model_gene_symbol
                },
            
                organism :  r.speciesb,  
                
                orthology_class : r.orthology_class_label,
                
                // provenance
                source : {
                     id : 'PANTHER',
                     label : 'PANTHER'
                 },
                 resource : resource_id
            };

            return obj;
        };
        
    var resultObj1 = this.fetchDataFromResource(null, 
                            resource_id,
                            tr,
                            null,
							null,
                            filter,
							null,
                            null,
                            null );
    
    // Now get the reverse associations for model org to human associations
    //filter = ["geneb:" +this.quote(id)];
//	filter = ["geneb:"+id];
	filter = { geneb : id };

    tr =
        function (r) {
    	
    	var obj = {
                id : "monarch:disco/" + r.e_uid,
                type : "Association", 
                gene : { 
                    id : genObj.id,
                    label: label
                },
            
                ortholog : { 
                    id : r.genea          
                },
            
                organism :  r.speciesa,  
                
                orthology_class : r.orthology_class_label,
                
                // provenance
                source : {
                     id : 'PANTHER',
                     label : 'PANTHER'
                 },
                 resource : resource_id
            };

            return obj;
        };
        
    var resultObj2 = this.fetchDataFromResource(null, 
                                           resource_id,
                                           tr,
                                           null,
										   null,
                                           filter,
										   null,
                                           null,
                                           null );
    // Combine result objects
    if (resultObj1.results){
    	resultObj.results = resultObj.results.concat(resultObj1.results);
    }
    if (resultObj2.results){
    	resultObj.results = resultObj.results.concat(resultObj2.results);
    }
    // Map the model orgs gene ids to NCBI
    // for proper linkouts
    var mappedResults = {};
    var unique = {};
    mappedResults.results = [];
    
    if (resultObj){
    	for (var i=0; i<resultObj.results.length; i++){
    		if (resultObj.results[i].ortholog.id){
    		    var modelID = resultObj.results[i].ortholog.id;
    		    var ncbiMappings = this.mapGeneToNCBIgene(modelID);
    		    var ncbigene_ids = Object.keys(ncbiMappings);
    		    if (ncbigene_ids[0]){
    		        var ncbiGene = ncbiMappings[ncbigene_ids[0]].id;
    		        var ncbiLabel = ncbiMappings[ncbigene_ids[0]].label;
    		        resultObj.results[i].ortholog.id = ncbiGene;
    		        resultObj.results[i].ortholog.label = ncbiLabel;
    		        // uniquify result set
    		        if (ncbiGene in unique){
    		        	// toss it out (although seeing different classes/source
						// for same genes
                        continue;
                    } else {
    		            mappedResults.results = mappedResults.results.concat(resultObj.results[i]);
                        unique[ncbiGene] = 1;
                    }
    		    }
    		}
        }
    }
    
    return mappedResults;	
}

bbop.monarch.Engine.prototype.trVariant = function(r,variant_type) {
    var variant = {};
    variant.id = r[variant_type+"_id"];
	if (typeof variant.id != 'undefined') {
		variant.id = variant.id.replace(/\-SA$/,'');  //hardcode OMIM
		variant.id = variant.id.replace(/_/,'.');
		variant.label = r[variant_type+"_label"];
		if (typeof variant.label != 'undefined') {
			variant.label = variant.label.replace(/[<>]/g,'');
		}
	    var vtype = {};
        var id = r[variant_type+"_type_id"];
		if (id != "" && typeof id != 'undefined') {
			vtype.id = r[variant_type+"_type_id"];
		}
		vtype.label = r[variant_type+"_type_label"];
		variant.variant_type = vtype;
	} else {
		variant = {};
	} 

    //console.log("VARIANT: "+JSON.stringify(variant));
	return variant;
}

/*
 * Function:fetchGeneAlleleAsAssociation
 * 
 * Returns: ordered list of matches
 * 
 * Arguments: - id : single gene id - source : source of id (eg MGI) - limit :
 * object containing id and label of the linked gene
 * 
 */
bbop.monarch.Engine.prototype.fetchGeneAlleleAsAssociation = function(id,genObj,tax) {
    console.log("INFO: fetching GeneAlleleAssociations for id:"+id);
    var engine = this;
	//TODO add clinvar
    //TODO may need to refactor WB format to uniformly handle the api
	var tax_to_resource_map = {
            '9606' : [{id:'nif-0000-03216-9',label:'OMIM',col:'sequence_alteration'},
					 // {id:'nlx_151671-5',label:'ClinVar',col:'sequence_alteration'}
					 ],    
            '6239'    : [{id:'nif-0000-00053-4',label:'WB',col:'sequence_alteration'},
//TODO						 {id:'nif-0000-00053-4',label:'WB',col:'variant_locus_alteration'}
						], 
            '10090'   : [{id:'nif-0000-00096-5',label:'MGI',col:'sequence_alteration'}],
            '7955'  : [{id:'nif-0000-21427-11',label:'ZFIN',col:'sequence_alteration'}, 
//TODO change this at some point to being variant_locus_alteration
					   {id:'nif-0000-21427-12',label:'ZFIN',col:'targeted_gene_subregion'}
					  ]
	};

//TODO:  to be variant_locus_alteration
    var resultObj = {};
	var all_variant_results = [];
    resultObj.results = [];

    var resource_list = tax_to_resource_map[tax.toString().replace(/NCBITaxon:/,'')];

    // check if in supported resources
    if (typeof resource_list == 'undefined') { 
		return; 
	}


	var formattedID = id.replace(/NCBI_[Gg]ene:/,'NCBIGene:');

	for (var i=0; i<resource_list.length; i++){
		var resource = resource_list[i];
		var variant_type = resource.col; 
		var trAssoc = function (r) {
			var obj = {
					id : "monarch:disco/" + r.v_uuid,
					type : "Association",
					variant : engine.trVariant(r,variant_type),
//TODO add references
//					references : publication_id,
					source : resource,
					resource : resource.id
			};
			if (obj.variant != {}) {return obj;};
		};


		var filter = [];
		//TODO fix data upstream to always be gene_id
		if (variant_type == 'targeted_gene_subregion') {
			filter.push("affected_gene_id:"+formattedID);
		} else {
			filter.push("gene_id:"+formattedID);
		}

		resultObj = this.fetchDataFromResource(null, 
                             resource.id,
                             trAssoc,
                             null,
							 null,
                             filter,
							 null,
                             null,
                             null );
		all_variant_results = all_variant_results.concat(resultObj.results);
	}

	console.log("|all_variant_results|="+all_variant_results.length);
        
	// need to make this a function
	var uniqResults = {};
	var unique = {};
	uniqResults.results = [];

	if (all_variant_results){
		for (var i=0; i<all_variant_results.length; i++){
			var cat = all_variant_results[i].variant.id;

			if (cat in unique){
				continue;
			} else {
				// Filter out lists from MGI as some alleles are not linked
				// to the query gene
				if (all_variant_results[i].variant.id && all_variant_results[i].variant.id.match(/\,/)){
					continue;
				}
				if (all_variant_results[i].variant.id){
					uniqResults.results = uniqResults.results.concat(all_variant_results[i]);
				}
				unique[cat] = 1;
			}
		}
	}
    console.log("|all_variant_results| uniq="+uniqResults.results.length);
	return uniqResults;
}
/*
 * Function:fetchGeneGenoTypeAsAssociation
 * 
 * Returns: ordered list of matches
 * 
 * Arguments: - id : single gene id - source : source of id (eg MGI) - limit :
 * object containing id and label of the linked gene
 * 
 */
bbop.monarch.Engine.prototype.fetchGeneGenoTypeAsAssociation = function(id,source, genObj) {
    var source_to_resource_map = {    // HARDCODE ALERT
            'WB'    : {id:'nif-0000-00053-3',label:'WB'},      // WB
            'MGI'   : {id:'nif-0000-00096-5',label:'MGI'},    // MGI
            'ZFIN'  : {id:'nif-0000-21427-13',label:'ZFIN'}  // ZFIN
         };
	// TODO integrate flybase data
    if ((source == 'MGI')||(source == 'ZFIN')){
        var resource_id = source_to_resource_map[source].id;
        var filter;
        if (source == 'MGI'){
        	//filter = ["gene_id:"+this.quote(id)];
        	//filter = ["gene_id:"+id];
			filter = { gene_id : id };
        } else if (source == 'ZFIN'){
        	//filter = ["implicated_gene_ids:"+this.quote(id)];
        	filter = ["implicated_gene_ids:"+id];
			filter = { implicated_gene_ids : id };
        }
        var tr;
        
        if (source == 'MGI'){
            tr =
            function (r) {
            
            	if ((r.genomic_background_label)&&
            	    (r.effective_genotype_label)&&
            	    (r.genomic_variation_complement_label)){
            		r.effective_genotype_label = r.genomic_variation_complement_label
            	}
            
            var obj = {
                id : "monarch:disco/" + r.e_uid,
                type : "Association", 
                
                genotype : { 
                    id : r.effective_genotype_id,
                    label : r.effective_genotype_label
                },
                background : r.genomic_background_label,
                genes : r.gene_label,
                
                references : [
                     {
                         id : r.publication_id
                     }
                 ],

                 // provenance
                 source : {
                     id : resource_id, 
                     label : source_to_resource_map[source].label
                 },
                 resource : resource_id
            };
            return obj;
        };
        } else if (source == 'ZFIN'){
            tr =
                function (r) {
                
                	/*
					 * if ((r.genomic_background_label)&&
					 * (r.effective_genotype_label)&&
					 * (r.genomic_variation_complement_label)){
					 * r.effective_genotype_label =
					 * r.genomic_variation_complement_label }
					 */
                
                var obj = {
                    id : "monarch:disco/" + r.e_uid,
                    type : "Association", 
                    
                    genotype : { 
                        id : r.effective_genotype_id,
                        label : r.effective_genotype_label
                    },
                    background : r.genomic_background_label,
                    genes : r.implicated_gene_labels,
                    
                    references : [
                         {
                             id : r.publication_id
                         }
                     ],

                     // provenance
                     source : {
                         id : resource_id, 
                         label : source_to_resource_map[source].label
                     },
                     resource : resource_id
                };
                return obj;
            };
        } 
        var resultObj = this.fetchDataFromResource(null, 
                               resource_id,
                               tr,
                               null,
							   null,
                               filter,
							   null,
                               null,
                               null );
        var uniqResults = {};
        var unique = {};
        uniqResults.results = [];
        
        if (resultObj){
        	for (var i=0; i<resultObj.results.length; i++){
                var cat = resultObj.results[i].genotype.id;
                          // resultObj.results[i].references[0].id;
             
        		if (cat in unique){
                    continue;
                } else {
                	if (resultObj.results[i].genotype.id){
                	    uniqResults.results = uniqResults.results.concat(resultObj.results[i]);
                	}
                	unique[cat] = 1;
                }
        	}
        }
        
        return uniqResults;
    }
}
/*
 * Function:fetchModelOrgGenePhenotypeAsAssociation
 * 
 * Returns: ordered list of matches
 * 
 * Arguments: - id : single gene id - source : source of id (eg MGI) - limit :
 * object containing id and label of the linked gene
 * 
 */    
bbop.monarch.Engine.prototype.fetchModelOrgGenePhenotypeAsAssociation = function(id,source,genObj) {
	
    var source_to_resource_map = {    // HARDCODE ALERT
            'MGI'  : {id:'nif-0000-00096-6',label:'MGI'},   // MGI
            'ZFIN' : {id:'nif-0000-21427-10',label:'ZFIN'}, // ZFIN
            'WB'   : {id:'nif-0000-00053-4',label:'WB'},    // WB
        };
    // TODO integrate flybase data
    if ((source == 'MGI')||(source == 'ZFIN')||(source == 'WB')){
        var resource_id = source_to_resource_map[source].id;
        var filter;
        if ((source == 'MGI')||(source == 'ZFIN')){
        	//filter = ["implicated_gene_ids:"+this.quote(id)];
        	//filter = ["implicated_gene_ids:"+id];
			filter = { implicated_gene_ids : id };

        } else if (source == 'WB'){
            //filter = ["gene_id:"+this.quote(id)];
            //filter = ["gene_id:"+id];
			filter = { gene_id : id };
        }
    
        var tr =
            function (r) {
            var obj = {
                id : "monarch:disco/" + r.e_uid,
                type : "Association", 
                gene : { 
                    id : genObj.id,
                    label: genObj.label
                },
                
                phenotype : { 
                    id : r.phenotype_id,
                    label : r.phenotype_label},
                 
                 references : [
                     {
                         id : r.publication_id
                     }
                 ],

                 // provenance
                 source : {
                     id : resource_id, 
                     label : source_to_resource_map[source].label
                 },
                 resource : resource_id
            };
            return obj;
        };
        var resultObj = this.fetchDataFromResource(null, 
                               resource_id,
                               tr,
                               null,
							   null,
                               filter,
							   null,
                               null,
                               null );
        var uniqResults = {};
        var unique = {};
        var uniquePhenoEvidence = {};
        uniqResults.results = [];
        
        if (resultObj){
        	for (var i=0; i<resultObj.results.length; i++){
        		var uniqPheno =  resultObj.results[i].phenotype.id;
                var cat = resultObj.results[i].phenotype.id+
                          resultObj.results[i].references[0].id;
                //Combine pmids
        		if (uniqPheno in unique){
        		   for (var j=0; j<uniqResults.results.length; j++){
        			   if ((uniqResults.results[j].phenotype.id == resultObj.results[i].phenotype.id)&&
        			       (!uniquePhenoEvidence[cat])){
        			    	   
        			       uniqResults.results[j].references = 
        			    	   uniqResults.results[j].references.concat(resultObj.results[i].references);
        			       uniquePhenoEvidence[cat]=1;
        			   }
        		   }
                } else {
                	if (resultObj.results[i].phenotype.id){
                	    uniqResults.results = uniqResults.results.concat(resultObj.results[i]);
                	}
                	unique[uniqPheno] = 1;
                	uniquePhenoEvidence[cat]=1;
                }
        	}
        }
        
        return uniqResults;
    }
    
}

//This function will take a gene identifier, and generate
//a bunch of mappings by using the Monarch ID mapping table
bbop.monarch.Engine.prototype.mapNCBIGeneToSource = function(id) {
    var resource_id = 'nlx_152525-4'; // ID map

    var engine = this;
	if (id != null) {
        id = id.replace(/NCBI_?[Gg]ene:/,'');
	}
    //var filter = ["source:NCBIGene","id:"+this.quote(id)];
	//var filter = ["source:NCBIGene","id:"+id];
	var filter = { source : "NCBIGene", "id" : id };
    var tr =
        function (r) {

            if (r.mapped_id.match(/^MGI/)){
                r.mapped_id = r.mapped_id.replace(/MGI:/,'');
            } else if (r.mapped_id.match(/^PR:/)){
                r.mapped_id = r.mapped_id.replace(/PR:/,'');   	
            }
			//TODO i don't understand why this is being done? (to kshefchek from nlw)
            if (r.mapped_source.match(/^ENSEMBL/)){
                r.mapped_source = r.mapped_source.replace(/ENSEMBL/,'Ensembl');   	
            }

            var obj = {
                    id: r.mapped_source+":"+r.mapped_id,
                    source: r.mapped_source
            }

            return obj;
        };
        

    var resultObj = this.fetchDataFromResource(null, 
                            resource_id,
                            tr,
                            null,
							null,
                            filter,
							null,
                            null,
                            null );
    return resultObj;
    
}

bbop.monarch.Engine.prototype.fetchGenePhenotypeAsAssociation = function(id) {
    var resource_id = 'nif-0000-03216-9'; // HARDCODE ALERT
    var resultObj = {};
    var results = [];
    var disease_associations = [];
    var disease = {};
    var unique = {};
	if (id != null) {
        id = id.replace(/NCBI_[Gg]ene:/,'NCBIGene:');
    }
    var references = function (ids) {
        var idlist = ids.split(/[,;]/);
        var idobjs = [];
        idlist.forEach( function (id) {
            idobjs.push( { id : id } );
        } );
        return idobjs;
    }
    
    //var filters = ["gene_id:"+this.quote(id)];  
    var filters = ["gene_id:"+id];  
    
    var fetchPheno = 
        this.fetchDataFromResource(null, 
                resource_id,null,null,
				null,
                filters
                );
    
    // Iterate over result set to find every phenotype_id
    for (var i=0; i<fetchPheno.results.length; i++){
        var result = fetchPheno.results[i];
        
        if (result.phenotype_id in unique){
            continue;
        } else {
            
        }
        var phenoObj = 
            this.fetchOmimDiseasePhenotypeAsGeneAssocations(result.phenotype_id,result);
        unique[result.phenotype_id] = 1;
        if (phenoObj.results != null){
            results = results.concat(phenoObj.results);
        }
    }
    
    resultObj.results = results;
    return resultObj;
    
}

bbop.monarch.Engine.prototype.fetchDiseasePhenotypeAsGeneAssocations = function(id,genObj) {

    var resource_id = 'nlx_151835-1'; // HARDCODE ALERT
    //console.log("OBJ="+JSON.stringify(id));
    if (!id){
        return{};
    }
    
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
                gene : { 
                    id : genObj.id, 
                    label : genObj.label },

                 // in future, the phenotype may be more specific
                 phenotype : { 
                    id : r.phenotype_id,
                    label : r.phenotype_label,
                    modifier : r.phenotype_modifier},

                 // disease information
                 disease : {
                    id : r.disorder_id,
                    label : r.disorder_name,
                    onset : r.onset,
                    frequency : r.frequency,
                 },
                 
                 references : [
                     {
                         id : r.publication_id
                     }
                 ],

                 // provenance
                 source : {
                     id : resource_id, 
                     label : "HPO"
                 },
                 resource : resource_id
            };
            return obj;
        };

//    var filters = ["disorder_id:"+this.quote(id)];
    var subclassFilters = ["disorder_id:"+id]
 
    var resultObj = 
        this.fetchDataFromResource(null, 
                resource_id,
                trOmim,
                null,
				null,
				null,
                subclassFilters
                );
    
    return resultObj.results;

}

bbop.monarch.Engine.prototype.fetchGeneInfoFromMyGene = function(id) {
    var mygene_url = "http://mygene.info/v2/";
    // if need be, we can expand this out a lot
    // http://mygene.info/v2/query?q=symbol:CDK2&species=9606
    var ret;
    var omim = /^OMIM/;
    var mgi = /^MGI/;
    if (id.match(omim)){
        var geneID = id.replace("OMIM:","");
        ret = this.fetchUrl(mygene_url + 'query?q=mim:' + geneID + "&species=human,mouse,rat,zebrafish," +
                            "fruitfly,nematode&fields=entrezgene,name,symbol,_id,taxid,ensembl," +
                            "map_location,summary");
        ret = JSON.parse(ret);
    } else if(id.match(mgi)){
        var geneID = id.replace(/MGI[:_]/,"MGI\\\\:");
        ret = this.fetchUrl(mygene_url + 'query?q=mgi:' + geneID + "&species=human,mouse,rat,zebrafish," +
                            "fruitfly,nematode&fields=entrezgene,name,symbol,_id,taxid,ensembl," +
                            "map_location,summary");
        ret = JSON.parse(ret);
        // Support for MGI IDs seem limited, querying the NCBI gene ID
        if (ret.total > 0){
            geneID = ret.hits[0].entrezgene;
            ret = this.fetchUrl(mygene_url + 'query?q=' + geneID + "&species=human,mouse,rat,zebrafish," +
                               "fruitfly,nematode&fields=entrezgene,name,symbol,_id,taxid,ensembl," +
                               "map_location,summary");
            ret = JSON.parse(ret);
        }
            
    } else {
        ret = this.fetchUrl(mygene_url + 'query?q=' + id + "&species=human,mouse,rat,zebrafish,fruitfly," +
                            "nematode&fields=entrezgene,name,symbol,_id,taxid,ensembl,map_location,summary");
        ret = JSON.parse(ret);
    }
// console.log("MyGene result="+JSON.stringify(ret,null,' '));
    if (ret.total > 0) {
      var obj = ret.hits[0]; // return the first hit
      obj.source =  "MyGene";
    } else { 
      // need a fall-through case of looking this up in the id mapping
		// table...will this get us KO ids?
      // and/or looking this up in the KEGG tables
      var obj = {id : id};
      obj.source = "NOT FOUND";
    }
    return obj;
}



/*
 * Function: fetchOmimDiseasePhenotypeAsAssocations
 * 
 * Status: IMPLEMENTED
 * 
 * Given a query term (e.g. an ID, either disease or phenotype), return an
 * association list object, with structure:
 *  { resultCount : NUM, results: [ASSOC1, ...., ASSOCn] }
 * 
 * Where ASSOC is an associative array representing a disease-phenotype
 * association with the following keys:
 *  - disease : a disease structure - phenotype : a disease structure - onset -
 * frequency - source - resource
 * 
 * Both disease and phenotype structures are associative arrays keyed with id
 * and label.
 * 
 * Stability: - we may change the JSON object returned to be JSON-LD compliant -
 * federation query may use ID mapping and OWL equivalence axioms in future
 * 
 * Arguments: - id : An identifier. One of: IRI string, OBO-style ID or
 * NIF-style ID
 * 
 * Returns: JSON representing list of D-P associations
 */
bbop.monarch.Engine.prototype.fetchOmimDiseasePhenotypeAsAssocations = function(id, opts) {

    // so obviously it would be nicer to be more declarative here; abstract over
    // this a little, but this is fine to get us started
    // Example:
	// http://beta.neuinfo.org/services/v1/federation/data/nlx_151835-1.json?exportType=data&q=HP_0003797

    var resource_id = 'nlx_151835-1'; // HARCODE ALERT

    // translate OMIM result into generic association object
    var trOmim =
        function (r) {
            // Repair IDs. TODO, fix in view?
            if (r.disorder_id > 0) {
                // is-numeric
                r.disorder_id = "OMIM:"+r.disorder_id;
            }
            var references = function (ids) {
                var idlist = ids.split(/[,;]/);
                var idobjs = [];
                idlist.forEach( function (id) {
                    idobjs.push( { id : id } );
                } );
                return idobjs;
            }
            var obj = {
                id : "monarch:disco/" + r.v_uuid,
                type : "Association", 
                disease : { 
                    id : r.disorder_id, 
                    label : r.disorder_name },

                 // in future, the phenotype may be more specific
                 phenotype : { 
                    id : r.phenotype_id,
                    label : r.phenotype_label},

                 onset : r.onset,
                 frequency : r.frequency,

                 // provenance
                 source : {
                     id : resource_id, 
                     label : "HPO"
                 },
                 resource : resource_id,
                 // in this resource, col is called publication_id, but it's
					// a comma-separated list
                 references : references(r.publication_id)
    
            };
            return obj;
        };

    var filters = {};
	var subclassFilters = {};
    var idtype = engine.mapIdentifierType(id);
    if (opts != null && opts.type != null) {
        if (idtype == null) {
            idtype = opts.type;
        }
        else {
            if (idtype != opts.type) {
                console.error("Expected "+opts.type+" got "+idtype);
                return null;
            }
        }
    }
    if (idtype == 'disease') {
        subclassFilters['disorder_id'] = id;
    } else if (idtype == 'phenotype') {
		subclassFilters['phenotype_id'] = id;
	}
    filters["aspect"] = "O";
    //var filters = ["disorder_id:"+id,"aspect:O"];
    var resultObj = 
        this.fetchDataFromResource(null, 
                resource_id,
                trOmim,
                null,
				null,
                filters,
				subclassFilters
                );

    //console.log("Phenos:"+JSON.stringify(resultObj));
    return resultObj;
}

// ?? this view is really gene-disease? <-- YES
// Function: fetchOmimGenePhenotypeAsAssocations
//
// Status: DEPRECATED
bbop.monarch.Engine.prototype.fetchOmimGenePhenotypeAsAssocations = function(id) {
    var resource_id = 'nif-0000-03216-8'; // HARCODE ALERT

    var resultObj = 
        this.fetchDataFromResource(id, 
                resource_id
                // trOmimDGA TODO
                );
    return resultObj;
}

// Function: fetchOmimDiseaseGeneAsAssocations
//
// Status: DEPRECATED
//
// Given a query term (e.g. an ID, either disease or phenotype), return
// an association list object, with structure:
//
// { resultCount : NUM, results: [ASSOC1, ...., ASSOCn] }
//
// Where ASSOC is an associative array representing a
// disease-gene association.
//
//
// Stability:
// - we may change the JSON object returned to be JSON-LD compliant
// - federation query may use ID mapping and OWL equivalence axioms in future
//
// Arguments:
// - id : An identifier. One of: IRI string, OBO-style ID or NIF-style ID. E.g.
// OMIM_105830
//
// Returns: JSON representing list of D-G associations
// /

// DGA
// EXAMPLE:
// https://neuinfo.org/mynif/search.php?q=Smith-Lemli-Opitz%20syndrome&t=indexable&list=cover&nif=nif-0000-03216-7
bbop.monarch.Engine.prototype.fetchOmimDiseaseGeneAsAssocations = function(id) {
    console.log("Fetching OMIM DiseaseGeneAssociations for"+id);
    var resource_id = 'nif-0000-03216-7'; // HARCODE ALERT
    var engine = this;
    // translate OMIM DiseaseGeneAssociation (DGA) result into generic
	// association object
    var trOmimDGA =
        function (r) {
            var obj = {
                // in the DGA view "phenotype" is disease
                disease : { 
                    id : r.omim_phenotype_id,
                      label : r.omim_phenotype_name },

                  // check: is this singular or plural
                  gene : { 
                    id : r.omim_gene_ids,
                      label : r.gene_symbols},

                  inheritance : r.omim_phenotype_inheritance,

                  // provenance
                  source : {
                      id : resource_id,
                      label : "OMIM"
                  },
                resource : resource_id
            };
            return obj;
        };

    // TODO: this currently uses a workaround, filtering on disease id,
    // but it should should use the query
        // var filters = [
        // "omim_phenotype_id:"+this.quote(engine.getFederationNifId(id)),
        // ];

    // note that we project a subset of the columns for efficiency
    var resultObj = 
        this.fetchDataFromResource(id, // null, //was id
                resource_id,
                trOmimDGA,
                [
                'omim_phenotype_id',
                'omim_phenotype_name',
                'omim_gene_ids',
                'gene_symbols',
                'omim_phenotype_inheritance'
                ],
                filters
                );

    return resultObj;
}

// http://beta.neuinfo.org/mynif/search.php?q=*&t=indexable&nif=nlx_151671-2
//right now the id could be either a gene or a disease
//need to supply which type it is for query purposes (or should it be a lookup?)
bbop.monarch.Engine.prototype.fetchDiseaseGeneAssociations = function(id,type) {
// these will be retrieved from ClinVar diseasegene, but probably should
// come straight from the variantdisease mappings; perhaps even from >1 resource

	//TODO need to clean these up and map the disease ids to the representative class
    var engine = this;
    var resources = [ {id : 'nlx_151671-2', label : 'ClinVar'},
                      {id : 'nif-0000-03216-7', label : 'OMIM'},
                      {id : 'nlx_31015-2', label : 'KEGG'},
					  {id : 'nif-0000-21306-2', label : 'ORPHANET'},
                      {id : 'nif-0000-02683-4', label : 'CTD', filter : {direct_or_inferred:'direct'}}
					];
    var assocLookup = {};
    resources.forEach(function(resource) {
        console.log("Fetching DiseaseGene Associations from " + resource.label + " ("+resource.id+") for "+id);
		var thisSource = {id : resource.id, label : resource.label};

        // translate DiseaseGeneAssociation (DGA) result into generic
		// association object

        var trDGA =
            function (r) {
                // TEMPORARY
				var genes = [];
				if (r.gene_id != null) {
					r.gene_ids = r.gene_id;
					r.gene_labels = r.gene_label;
				};	
                if (r.gene_ids != null) {
					for (var i=0; i< r.gene_ids.split(",").length; i++) {
						if (r.gene_labels != null && r.gene_labels.split(",").length == r.gene_ids.split(",").length) {
							genes.push({id : r.gene_ids.split(",")[i].trim(), label : r.gene_labels.split(",")[i].trim()});
						} else {
							genes.push({id : r.gene_ids.split(",")[i].trim()});
						}
					}
				} 
				var diseases = [];
                if (resource.label == 'ClinVar') {
					// TODO once UMLS gets added to uberdisease, then we can
					// switch back
					// but the primary disase_id in ClinVar is UMLS, not omim.
                	if (r.omim_id){
					    diseases.push({id : r.omim_id, label : r.omim_label});
                    }
                } else if (resource.label == 'KEGG' || resource.label == 'ORPHANET') {
					if (r.omim_ids.split(",").length == 1 && r.omim_ids.split(",") != '') {
						// TODO once KEGG and ORPHANET disease ids get put into
						// uberdisease, we can use disease_id,
						// disease_id - otherwise i might get suprious results
						// HACK - temporarily use the omim id instead, but only for 1:1
						for (var i=0; i<r.omim_ids.split(",").length; i++) {
							if (r.omim_labels != null && r.omim_ids.split(",").length == r.omim_labels.split(",").length) {
								diseases.push({id : r.omim_ids.split(",")[i], label : r.omim_labels.split(",")[i]});
							} else {
								diseases.push({id : r.omim_ids.split(",")[i]});
							}
						}
						// TODO fix data scrubbing here; similarly, we only want
						// to fetch the genes if there's only one OMIM id for
						// kegg things
						/*if (genes) {
							genes = genes.map(function(g) {
								if	(!(g.id.match(/NCBI/))) g.id = 'NCBIGene:'+g.id;
								return {id : g.id, label : g.label};
							});
						}*/
					} else {
						diseases.push({id : r.disease_id, label : r.disease_label});
						// remove the genes, we only want to map the genes if
						// there's one mapped disease for kegg
						// genes = [];
					}
                        if (genes) {
                            genes = genes.map(function(g) {
                                if  (!(g.id.match(/NCBI/))) g.id = 'NCBIGene:'+g.id;
                                return {id : g.id, label : g.label};
                            });
                        }

				} else {
					diseases.push({id : r.disease_id, label : r.disease_label});
				}
				console.log('diseases:'+JSON.stringify(diseases));
				console.log('genes:'+JSON.stringify(genes));
				var assocs = [];
				for (var j=0; j<diseases.length; j++) {
					var disease = diseases[j];
					for (var i=0; i<genes.length; i++) {
						var gene = genes[i];
						var assoc = { disease : disease, 
									  gene : gene,
									  references : [],
									  source : [],
									};	
						if (assocLookup[disease.id+gene.id]) {
							assoc = assocLookup[disease.id+gene.id];
							if (assoc.disease.label == null) {
								assoc.disease.label = disease.label;
							}
							if (assoc.gene.label == null) {
								assoc.gene.label = gene.label;
							}
						} else {
							assocLookup[disease.id+gene.id] = assoc;
						};
						if (assoc.source.indexOf(thisSource) < 0) { 
                            assoc.source.push(thisSource);
                        }
						console.log("assoc:"+JSON.stringify(assoc));
						console.log("sources:"+JSON.stringify(assoc.source));
						//assoc.source.push( { id: resource.id, label : resource.label} );
						
						if (r.publication_id != null) {
							assoc.references.push(
								{ id: r.publication_id,
								  label : r.publication_label, 
								  source : { id : resource.id, label: resource.label+', via '+r.publication_label}
								});
						}
						if (r.publication_ids != null) {
							r.publication_ids.trim().split(",").forEach(function(p) {
								assoc.references.push(
									{id : p.trim(), 
									 source : {id : resource.id}
									})
								});
						};
						var obj = { disease : disease,
								gene : gene,
								references : [{
									id : r.publication_id,
									label : r.publication_label,
								//source : { id : resource.id, label : resource.label+", via "+r.publication_label }
								}],
								resource : resource.id
						};
						assocs.push(assoc);
						//console.log('ASSOC:'+JSON.stringify(assoc,null,' '));
					}
				}

                return assocs;
			};
    // var filters = [
    // "omim_id:"+this.quote(engine.getFederationNifId(id)),
    // ];
    //var filters = null;
	var filters = resource.filter;
	//var filters = {direct_or_inferred : "direct"};
	var query = null;
	var subclassQuery = null;
	if (type == 'gene') {
		query = id;
	} else {
		subclassQuery = id;
	}
    var resultObj =
            engine.fetchDataFromResource(
                    query,
                    resource.id,
                    trDGA,
                    ['gene_id','gene_label','disease_id','disease_label','publication_label','publication_id','gene_ids','gene_labels','publication_ids','omim_id','omim_ids','omim_label','omim_labels'],
					subclassQuery,
                    filters,
					null,
                    null
                );

	if (resultObj.resultCount == 0) {
		console.log("Got no results doing a subclassQuery; trying with a regular query.");
		resultObj =
            engine.fetchDataFromResource(
                    id,
                    resource.id,
                    trDGA,
                    ['gene_id','gene_label','disease_id','disease_label','publication_label','publication_id','gene_ids','gene_labels','publication_ids','omim_id','omim_ids','omim_label','omim_labels'],
                    null,
                    filters,
                    null,
                    null
                );
		}
    } );

    var results = new Array();

    // console.log('ASSOCIATIONS:'+JSON.stringify(assocLookup,null,' '));

    for (var key in assocLookup) {
        console.log('key:'+key);
        results.push(assocLookup[key]);
    }
    // console.log('RESULTS:'+JSON.stringify(results));
    var uniqResults = this.uniquifyResultSet(results,["gene","disease"],"true");
    return uniqResults;
    
}

// TODO: this is really just a variation on the fetchGenoPhenoAsAssociation
// currently expects the id to be a phenotype or disease id
bbop.monarch.Engine.prototype.fetchSequenceAlterationPhenotypeAsAssociations = function(id,sp) {
    console.log("Fetching SequenceAlterationPhenotypeAssociations: "+id);
    var species_to_resource_map = {    // HARDCODE ALERT
        '10090' : {id:'nif-0000-00096-5',label:'MGI',   default_taxon : {id : 'NCBITaxon:10090',label : 'Mus musculus'}},
        '7955' : {id: 'nif-0000-21427-10',label:'ZFIN', default_taxon : {id : 'NCBITaxon:7955', label : 'Danio rerio'}},
        '6239' : {id: 'nif-0000-00053-4',label:'WB',    default_taxon : {id : 'NCBITaxon:6239', label : 'Caenorhabditis elegans'}},
        '7227' : {id: 'nif-0000-00558-2',label:'FB',    default_taxon : {id : 'NCBITaxon:7227', label : 'Drosophila melanogaster'}},
        '9606' : {id: 'nif-0000-03216-9',label:'OMIM',  default_taxon : {id : 'NCBITaxon:9606', label : 'Homo sapiens'}}    // OMIM - this is a variant table
    };

  var resource_id = species_to_resource_map[sp].id;
  var engine = this;
  var tr =         
    function (r) {
        var geno = engine.makeGenotype(r);
            if (geno.taxon == {} || typeof geno.taxon == 'undefined' || geno.taxon == null) {
                geno.taxon = species_to_resource_map[sp].default_taxon;
            }
        geno.has_variant_loci.has_part[0].id = 
        	geno.has_variant_loci.has_part[0].id.replace(/_/,'.');
         var obj = {
            disease : {
                id : r.phenotype_id,
                label : r.phenotype_label,
                description : r.phenotype_description_free_text,
                inheritance : r.phenotype_inheritance },
            sequence_alteration : geno.has_sequence_alterations[0],
            allele : geno.has_variant_loci.has_part[0],  // TODO: this is a
															// list
            gene : geno.has_affected_genes[0],
            evidence : r.publication_id,  // TODO: this is a list
            resource : resource_id,
            source : species_to_resource_map[sp], // returns an object
        };
        return obj;
    };

	//todo, this will probably fail if you give it a sequence alteration id
	var subclassQuery = id;
    var resultObj =
        this.fetchDataFromResource(null,
                resource_id,
                tr,
				null,
				subclassQuery
                );
    return resultObj;

}

// Function: fetchOmimGeneAllelePhenotypeAsAssociations
//
// Status: DEPRECATED

// EXAMPLE:
// https://beta.neuinfo.org/mynif/search.php?q=DOID_14692&t=indexable&nif=nif-0000-03216-6&b=0&r=20
bbop.monarch.Engine.prototype.fetchOmimGeneAllelePhenotypeAsAssocations = function(id) {
    var resource_id = 'nif-0000-03216-6'; // HARCODE ALERT

    // translate OMIM DiseaseGeneAssociation (DGA) result into generic
	// association object
    var tr =
        function (r) {
            var obj = {
                // in the DGA view "phenotype" is disease
                disease : { 
                    id : r.omim_phenotype_id,
                      label : r.allele_disease_name },

      allele : { id : r.gene_allele_id,
          link : r.gene_allele_link,
          // xref : r.omim_allele_id,
          xref : "dbSNP" + r.dbsnp_id,
          mutation : r.gene_mutation,
          label : r.gene_symbols},

      gene : { id : r.omim_gene_id,
          label : r.gene_symbol},

      inheritance : r.omim_phenotype_inheritance,
      evidence : r.pubmed_ids,
      // provenance
      source : "OMIM",
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
};

// function: makeGenotype
//
// Status: MOSTLY IMPLEMENTED
//
// This is meant as an internal function to take a row (r) from NIF geno or
// pheno
// tables, and extract out the parts pertaining to a genotype, and build the
// JSON
// genotype object, following the GENO model.
// This will probably go away once we are able to get this data from D2R
// transformed
// datastore
// What is presently missing is the aggregation of genotype parts. So, because
// the source data is denormalized, one genotype can have multiple rows, and
// will currently create multiple JSON objects with only partially-overlapping
// contents. This will be confusing.
//
bbop.monarch.Engine.prototype.makeGenotype = function(r) {
    var background = {
        id : r.genomic_background_id,
         label: r.genomic_background_label ,
         type : "genomic_background"
    };

    // TODO: this isn't always a gene! but for now it's fine.
    var reference_locus =
    {
        id : r.gene_id,
         label : r.gene_label,
         type : "reference_locus"
    };

    var sequence_alteration =
    {
        id : r.sequence_alteration_id,
         label : r.sequence_alteration_label,
          has_mutation : r.mutation,
         type : "sequence_alteration",
    };

    var variant_locus =
    {
        id : r.variant_locus_id,
         label : r.variant_locus_label,
         type : "variant_locus",
         has_part : [
             reference_locus,
             sequence_alteration
        ]
    };
    var variant_loci = {
        type : "variant_loci",
           has_part : [variant_locus]
    }
    // TODO: is there a better way to get the gene ids?
    var affected_gene_collection = { 
        type : "affected_gene_collection", 
           has_part : [r.gene_id].concat(r.implicated_gene_ids)  // implicated_gene_ids
    };

    var vslc = {
        id : r.variant_single_locus_complement_id,
         label : r.variant_single_locus_complement_label,
         type : "variant_single_locus_complement",
         zygosity : {
            label : r.zygosity,
            type : "zygosity"
         },
        is_sequence_variant_of : reference_locus, 
        has_variant_part : variant_loci  // how do i get both?
    };

    var genomic_variation_complement = 
    // TODO: VSLC aren't given as a list...denormalized....how to aggregate?
    {
        id : r.genomic_variation_complement_id,
         label : r.genomic_variation_complement_label,
         type : "genomic_variation_complement",
         has_part : [vslc]
    };

    var intrinsic_genotype =
    {
        id : r.intrinsic_genotype_id,
         label : r.intrinsic_genotype_label,
         type : "intrinsic_genotype",
         has_part : [
            background,
             genomic_variation_complement
        ],
    };
    var extrinsic_genotype =
    {
        id : r.extrinsic_genotype_id,
             label : r.extrinsic_genotype_label_html,
             type : "extrinsic_genotype"
    };
    var obj =
    {
        id : r.effective_genotype_id,
         label : r.effective_genotype_label,
         type : "effective_genotype",
        has_part : [
            intrinsic_genotype,
            extrinsic_genotype
            ],
         has_variant_loci : variant_loci,
        has_affected_genes : [{id:r.gene_id,label:r.gene_label}],
        has_sequence_alterations : [sequence_alteration],
        taxon : { id : r.taxon_id, label : r.taxon_label}
    };
    console.log("CACHE " + JSON.stringify(obj, null, ' '));
    return obj;
};


// i think this expects a genotype or it's parts as the identifier
bbop.monarch.Engine.prototype.fetchGenotype = function(id,sp) {
    var species_to_resource_map = {  // HARDCODE ALERT
        '10090' : {id:'nif-0000-00096-5',label:'MGI',   default_taxon : {id : 'NCBITaxon:10090',label : 'Mus musculus'}},
        '7955' : {id: 'nif-0000-21427-13',label:'ZFIN', default_taxon : {id : 'NCBITaxon:7955', label : 'Danio rerio'}},
        '6239' : {id: 'nif-0000-00053-3',label:'WB',    default_taxon : {id : 'NCBITaxon:6239', label : 'Caenorhabditis elegans'}},   
        '7227' : {id: 'nif-0000-00558-1',label:'FB',    default_taxon : {id : 'NCBITaxon:7227', label : 'Drosophila melanogaster'}},
        '9606' : {id: 'nif-0000-03216-9',label:'OMIM',  default_taxon : {id : 'NCBITaxon:9606', label : 'Homo sapiens'}}    // OMIM - this is a variant table
    };

    var resource_id = species_to_resource_map[sp].id;

    var genoLookup = {};

    var engine = this;

    var tr =
        function (r) {
            var geno = engine.makeGenotype(r);
            if (genoLookup[geno.id]) {
                geno = genoLookup[geno.id];
            } else {
                genoLookup[geno.id] = geno;
            }
             
            geno.source = species_to_resource_map[sp].label;
            geno.resource = resource_id;
            if (geno.taxon == {} || typeof geno.taxon == 'undefined' || geno.taxon == null) {
				geno.taxon = species_to_resource_map[sp].default_taxon;
			}
            return geno;
        };

    var resultObj =
        this.fetchDataFromResource(id,
                resource_id,
                tr
                );

    // TODO
    var geno = genoLookup[id];
    // console.log("GENOLookup: "+JSON.stringify(geno));

/*
 * if (geno == null) { geno = { type : "genotype", id : id, source : { id :
 * resource_id, }, resource : resource_id }; }
 */
    return geno;
}


bbop.monarch.Engine.prototype.fetchGenoPhenoAsAssociationsBySpecies = function(id,sp,type) {
    // a species to resource map // HARDCODE ALERT
    // TODO: will need to make array so that we can multiple source for each
	// species
    // TODO: - can eventually be dynamic with a service call
    var species_to_resource_map = {
        '10090' : {id:'nif-0000-00096-6',label:'MGI',   default_taxon : {id : 'NCBITaxon:10090',label : 'Mus musculus'}},
        '7955' : {id: 'nif-0000-21427-10',label:'ZFIN', default_taxon : {id : 'NCBITaxon:7955', label : 'Danio rerio'}},
        '6239' : {id: 'nif-0000-00053-4',label:'WB',    default_taxon : {id : 'NCBITaxon:6239', label : 'Caenorhabditis elegans'}},
        '7227' : {id: 'nif-0000-00558-2',label:'FB',    default_taxon : {id : 'NCBITaxon:7227', label : 'Drosophila melanogaster'}},
        '9606' : {id: 'nif-0000-03216-9',label:'OMIM',  default_taxon : {id : 'NCBITaxon:9606', label : 'Homo sapiens'}}    // OMIM - this is a variant table
    };

    var resource_id = species_to_resource_map[sp].id;

    var engine = this;
    var tr =
        function (r) {

            // TODO: this is very zfin-specific -- do we need to generalize this
            // and do some lookups into the ontology for mappings to anatomy?
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
            };

            var geno = engine.makeGenotype(r);

            var obj = {
                id : r.annotation_id, // TODO - push ID generation to ingest
                 evidence : {
                    type : {
                        id : r.evidence_code_id,
                         code : r.evidence_code_symbol,
                         label : r.evidence_code_label
                       }
                },
                reference : {
                                    type: "publication",
                    id : (r.publicaton_id != null ? r.publicaton_id : r.publication_id), // CHANGE
																							// ME:
																							// see
																							// https://github.com/monarch-initiative/monarch-app/issues/68
                         label : r.publication_label
                },
                has_environment : {
                    type : {
                        id : r.environment_id,
                        label : r.environment_label,
                       }
                  },
                has_genotype : geno, 
                   has_phenotype : {
                     description : r.phenotype_description_free_text,
                      type : {
                        id : r.phenotype_id,
                         label : r.phenotype_label
                      },
                     modifier : r.phenotype_modifier
                   },
                source : species_to_resource_map[sp],
                taxon : {
                    id : r.taxon_id,
                     label: r.taxon_label
                },
                resource : species_to_resource_map[sp].id
            };
            if (obj.taxon == {} || typeof obj.taxon === 'undefined' || obj.taxon === null) {
                obj.taxon = species_to_resource_map[sp].default_taxon;
            }

        return obj;
    };

// TODO: may have to refactor this
	var resultObj = {};
	if (type == 'phenotype') {
		resultObj =
        this.fetchDataFromResource(null,
                resource_id,
                tr,
                null,
                id
                );
	} else {
		resultObj = this.fetchDataFromResource(id,resource_id,tr);
	}
    return resultObj;
}


// EXAMPLE:
// https://beta.neuinfo.org/mynif/search.php?t=indexable&list=cover&nif=nif-0000-00096-2&q=MP_0000854
// EXAMPLE:
// https://beta.neuinfo.org/mynif/search.php?&t=indexable&nif=nif-0000-21427-10&b=0&r=20&q=cerebellum
// https://neuinfo.org/mynif/search.php?q=worm&t=indexable&list=cover&nif=nif-0000-00053-2&q=synapse
// http://beta.neuinfo.org/services/v1/federation/data/nif-0000-00053-2.json?exportType=data&q=synapse
/*
 * //THIS FUNCTION IS NOW DEPRECATED
 * bbop.monarch.Engine.prototype.fetchWormGenoPhenoAsAssocations = function(id) {
 * var resource_id = 'nif-0000-00053-2'; // HARCODE ALERT
 * 
 * var tr = function (r) {
 * 
 * var obj = { evidence : { type : { id : "ECO:0000006", code : "EXP", label :
 * "inferred from experiment" } }, reference : { id: r.wb_citation_id, },
 * has_genotype : { id : r.allele_id, label : r.allele_name, type :
 * r.allele_type_id,
 *  // we repeat the background object - it also appears inside genotype_context
 *  // A 'parent' genotype (i.e. genetic context) is split into experiment and
 * 'organismal' part (i.e. genotype context) has_part : [ {
 * is_sequence_variant_of : { id : r.affected_gene_id, label :
 * r.affected_gene_name } } ] }, has_phenotype : { description :
 * r.free_text_phenotype_description, type : { id : r.phenotype_id, label :
 * r.phenotype_label, }, //inheres_in : inheres_in, start_stage : { type : { id :
 * r.start_stage_id, label : r.start_stage_label } }, end_stage : { type : { id :
 * r.end_stage_id, label : r.end_stage_label } }, }, source : { id :
 * resource_id, label : "WormBase GenoPheno associations", }, resource :
 * resource_id }; return obj; };
 * 
 * var resultObj = this.fetchDataFromResource(id, resource_id, tr ); return
 * resultObj; } // WORM
 */





// EXAMPLE:
// https://neuinfo.org/mynif/search.php?q=MGI_4420313&first=true&t=indexable&nif=nif-0000-00096-3
// EXAMPLE:
// http://beta.neuinfo.org/services/v1/federation/data/nif-0000-00096-3.json?exportType=data&q=MGI_4420313
// Note: the id may be for any part of a genotype - e.g. if query by a
// background ID then the results may include all
// genotypes with this as part

// THIS FUNCTION IS NOW DEPRECATED - most functionality has been replicated by
// fetchGenotype(id,sp), which is a generic version of this function.
bbop.monarch.Engine.prototype.fetchMgiGenotype = function(id) {
    var resource_id = 'nif-0000-00096-3'; // HARCODE ALERT


    var genoLookup = {};

    var tr =
        function (r) {
            // note: id might not match genotype_id (e.g. it may match
			// background)
            var geno = {
                    id : r.mgi_genotype_id,
                     label : r.genomic_variation_complement, // CHECK THIS
                     type : "genotype", // todo
                     has_genomic_variation_complement : {
                        has_part : [],
                           type : "genomic_variation_complement"
                     }
            };

            // these are properties of the container
            if (genoLookup[geno.id]) {
                geno = genoLookup[geno.id];
            }
            else {
                genoLookup[geno.id] = geno;
            }
            // console.log("CACHE " + JSON.stringify(geno, null, ' '));

            var background =
            {
                id : r.genomic_background_in,
                label: r.genomic_background_name
            };

            if (geno.has_background != null && geno.has_background != background) {
                console.warn("Different background for "+geno.id+" "+geno.label+" "+background +" != " + geno.has_background);
            }
            geno.has_background = background;
            geno.source = {
                id : r.resource_id,
                 label : "MGI GenoAllele",
            };
            geno.zygosity = r.zygosity; // TODO <- how do we do this in geno?

            var vslc = {
                id : r.allele_complement_id,
                label : r.allele_complement_label,
                type : "variant_single_locus_complement",
                zygosity : r.zygosity,
                is_sequence_variant_of : {
                    id : r.locus_id,
                    symbol : r.locus_symbol,
                    label : r.locus_name,
                    type : "gene"
                },
                has_variant_part : [
                       {
                        id: r.allele_1_id,
                        label: r.allele_1_label
                       },
                       {
                        id: r.allele_2_id,
                        label: r.allele_2_label
                       }    
                 ]
            };
            geno.has_genomic_variation_complement.has_part.push(vslc);
            // geno.allele_complement = r.allele_complement; //???



            // TODO - check w Matt and Nicole if background is part of geno or
			// g2a assoc?
            // @Deprecated
            var obj = {
                    type : "GenotypeAlleleAssociation",
                    zygosity : r.zygosity,
                    genomic_variation_complement : r.genomic_variation_complement,
                    has_background : background,
                    allele_complement: r["Allele Complement"],
                    has_locus : { 
                        id : r.locus_id,
                        symbol : r.locus_symbol,
                        label : r.locus_name },
                    // TODO allele stuff

                    source : "MGI",
                    resource : resource_id
            };
            return obj;
        };


    var resultObj = 
        this.fetchDataFromResource(id, 
                resource_id,
                tr
                );
    // geno.alleles =
    // resultObj.results;
    // TODO
    var geno = genoLookup[this.getOboId(id)];
    if (geno == null) {
        geno = 
        {
            type : "genotype",
               id : id,
               source : {
                id : resource_id,
                 label : "MGI"
               },
            resource : resource_id
        };
    }
    return geno;
}




// EXAMPLE:
// http://beta.neuinfo.org/services/v1/federation/data/nif-0000-21427-8.json?exportType=data&q=ZDB-GENO-030619-2
// Note: the id may be for a genomic_variant_complement_id or an allele.
// This does NOT find all alleles for the whole context
// bbop.monarch.Engine.prototype.fetchZfinGenomicVariantComplements =
// function(id) {
// var resource_id = 'nif-0000-00096-3'; // ZFIN:GenotypeAllele

// var genoLookup = {};

// var tr =
// function (r) {
// // note: id might not match genotype_id (e.g. it may match background)
// var geno = {
// id : r.genomic_variant_complement_id,
// label : r.genomic_variant_complement_name,
// type : "genomic_variant_complement",
// zygosity : zygosity,
// has_part : [],
// source : {
// id : r.resource_id,
// label : "ZFIN GenoAllele",
// }
// };

// // these are properties of the container
// if (genoLookup[geno.id]) {
// geno = genoLookup[geno.id];
// }
// else {
// genoLookup[geno.id] = geno;
// }

// var vslc = {
// id : r.allele_complement_id,
// label : r.allele_complement_label,
// type : "variant_single_locus_complement",
// is_sequence_variant_of : {
// id : r.locus_id,
// symbol : r.locus_symbol,
// label : r.locus_name,
// type : "gene"
// },
// has_variant_part : [
// {
// id: r.allele_1_id,
// label: r.allele_1_label
// },
// {
// id: r.allele_2_id,
// label: r.allele_2_label
// }
// ]
// };
// //geno.allele_complement = r.allele_complement; //???



// // TODO - check w Matt and Nicole if background is part of geno or g2a assoc?
// // @Deprecated
// var obj = {
// type : "GenotypeAlleleAssociation",
// zygosity : r.zygosity,
// genomic_variation_complement : r.genomic_variation_complement,
// has_background : background,
// allele_complement: r["Allele Complement"],
// has_locus : { id : r.locus_id,
// symbol : r.locus_symbol,
// label : r.locus_name },
// // TODO allele stuff

// source : "ZFIN GenoAllele",
// resource : resource_id
// };
// return obj;
// };


// var resultObj =
// this.fetchDataFromResource(id,
// resource_id,
// tr
// );
// //geno.alleles =
// // resultObj.results;
// // TODO
// var geno = genoLookup[id];
// if (geno == null) {
// geno =
// {
// type : "genotype",
// id : id,
// source : "ZFIN GenoAllele",
// resource : resource_id
// };
// }

// print("GENO = "+geno);

// return geno;
// } /// ZFIN GENO

// TODO
bbop.monarch.Engine.prototype.fetchRelatedClinicalTrials = function(id) {
}

// TODO
bbop.monarch.Engine.prototype.fetchRelatedDrugs = function(id) {
}

// EXAMPLE:
// 
bbop.monarch.Engine.prototype.fetchMonarchIntegratedDiseaseModels = function(id) {
    var resource_id = 'nlx_152525-2'; // HARCODE ALERT

    // translate
    var tr =
        function (r) {
            var obj = {

                disease : { 
                    id : r.omim_id,  // todo - disease_id often blank?
                      label : r.disease_name },

                  model : { 
                    id : r.model_id,
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
                source : engine.mapStringToSource(r.annotation_source),
                 resource : resource_id
            };
            return obj;
        };

	var query = null;
	var subclassQuery = id;
    var resultObj = 
        this.fetchDataFromResource(null, 
                resource_id,
                tr,
				null,
				subclassQuery
                );

    return resultObj;

};

// Function: searchByDisease
//
// Status: Partially Implemented
//
// This function will take some kind of identifier (disease, genotype), and find
// those "things"
// that are similar.
// First implementation will take a disease or genotype identifier, and find the
// top "cutoff" things
// (either diseases or animal models) based on the owlsim precomputed piepline.
// These are
// loaded statically in the NIF/Monarch tables, with a resource identification
// map to
// locate the correct precomputed table in NIF.
// Defaults are set for cutoff(25) and metric (BMAasymIC), but the query id and
// target_species should be supplied
// in order to know what table needs to be fetched
// This currently does an iterative lookup in order to get all the labels. Note
// sure if that is
// the best strategy.
// This wrapping function could easily have precomputed or on-the-fly functions
// added or swapped.
//
// TODO: this can be extended to apply other kinds of filters to limit the data
// considered,
// or only specific classes or whatever. Lots of possiblities for the future.
// TODO: this should really have a target_type filter, and the selection of the
// precomputed dataset
// should be based on the combination of source_taxid, target_taxid, a_type, and
// b_type.
//
bbop.monarch.Engine.prototype.searchByDisease = function(id,target_species,cutoff,metric) {
    // currently, we only have disease x (disease or mouse models) in tables
    // TODO: load other precomputed data sources
    // TODO: types should be fetched from CM services
    // HARDCODE ALERT: these assume selection by target_species -- could be
	// other filters

    /*
	 * if (target_species='9606') { var id_list =
	 * this.expandIdentifiersToPhenotypes( id ); id_list =
	 * idlist.split(/[\s,]+/) return
	 * this.searchByPhenotypeProfile(id_list,target_species,null,cutoff); }
	 */

    var species_to_resource_map = {
        '9606' : {
            id:'nlx_152525-3', label:'OwlSim: Disease-x-disease',
            a_type:"disorder", b_type:"disorder",
            a_source:'nlx_151835-1', b_source:'nlx_151835-1' },
        '10090' : {
            id:'nlx_152525-10', label:'OwlSim: Disease-x-mouse_genotypes',
            a_type:"disorder", b_type:"effective_genotype",
            a_source:'nlx_151835-1', b_source:'nif-0000-00096-6' },
// '7955' : {id:'',label'zebrafish models'}
    };

    // set defaults
    if (typeof target_species == 'undefined') {
        console.log("ERROR: no target_species supplied. Defaulting to human, 9606.");
        target_species = '10090'
    };


    // TODO: these defaults probably should be in a config
    cutoff = typeof cutoff !== 'undefined' ? cutoff : 5;
    metric = typeof metric !== 'undefined' ? metric : 'BMAasymIC';   // HARDCODE

    // TODO: need to write a proper function to find the correct precomputed
	// thing
    // based on source and target types in addition to species.

    var resource = species_to_resource_map[target_species];
    var engine = this;

    var queryLookup = {};

    var results = [];
    var tr =
        function (r) {
            var myid = engine.getFederationNifId(id);
            // these are properties of the container
            if (queryLookup[id]) {
                query = queryLookup[id];
            }
            else {
                myid = engine.getFederationNifId(r.a);
                queryLookup[id] = {
                    id : myid,
                    type : resource.a_type,
                };
                var instlabel = engine.fetchInstanceLabelByType(r.a,resource.a_source,resource.a_type);
                if ((instlabel != null) && (instlabel.results != null) && (instlabel.results.length > 0)) {
                    queryLookup[id].label = instlabel.results[0].label
                };    
            };


            // console.log("CACHE " + JSON.stringify(query, null, ' '));
            myid = engine.getFederationNifId(r.b);
            var target = {
                    id : myid,
                    matches : {}, // could populate this with a "compare" call
                    type: resource.b_type,
                    score : {'metric' : r.metric, 'score' : r.score, 'rank' : r.rank } 
            };
            
            instlabel = engine.fetchInstanceLabelByType(myid,resource.b_source,resource.b_type);
            if ((instlabel != null) && (instlabel.results != null) && (instlabel.results.length > 0)) {
                target.label = instlabel.results[0].label
            };

            results.push(target);
            // return target;
        };

//    var filters = [
//        //"a:"+this.quote(engine.getFederationNifId(id)),
//        "a:"+engine.getFederationNifId(id),
//        "rank:<"+cutoff,
//        "metric:"+metric];
	var filters = { a : engine.getFederationNifId(id),
					rank : "<"+cutoff,
					metric : metric };
    var resultObj =
        this.fetchDataFromResource(null,
                resource.id,
                tr,
                null,
				null, 
                filters,
				null,
                null,
                'rank'
                );

    var query = queryLookup[id];
    // var query = queryLookup[this.getFederationNifId(id)];

    var system_stats = this.getOWLSimSystemStats();

    system_stats.metric_stats = {metric : 'BMAasymIC', maxscore : '8.45', avgscore : '6.437', stdevscore : '3.8956', comment:'These numbers are approximations for this release'}; 

    var similarThings = {
        a : query,
        b : results, // resultObj.results,
        cutoff : cutoff,
        metadata : system_stats,
        source : resource,
        resource : resource.id
    };


    return similarThings;

// return resultObj;

}

/*
 * This assums the minimum json format for the profile, according to the
 * Phenotips spec: http://phenotips.org/JSON+Sample annotation_profile = { {
 * "id": "P0000001", "features": [ { "id": "HP:0002457", "name": "Abnormal head
 * movements", "type": "phenotype", "isPresent": true }, ... ] } where isPresent =
 * true|false, where false are "not"-style annotations of remarkable normality
 * 
 */
bbop.monarch.Engine.prototype.getInformationProfile = function(annotation_profile,categories) {
    var engine = this;
    var score = 0.00;
    var scored_profile = {};


    // HARDCODE ALERT
    // The following scaling factors might be configurable in the future
    var category_scaling_factor = 0.5;    
    var not_scaling_factor = 0.25;

    // TODO: throw error?
    if (annotation_profile == null) {
        return scored_profile;
    }
    if (annotation_profile.features == null) {
        return scored_profile;
    }

    console.log("CATEGORIES:"+JSON.stringify(categories));    
    // loop through all of the features, and build the params for owlsim
    // make sure to split them into norm/abnorm (isPresent = true|false)
    // i am only taking phenotypes, not the metadata
    var atts = [];
    var nots = [];
    annotation_profile.features.forEach( function(f) {
        // assume that if isPresent flag is not there, then true
        if (f.isPresent == "false" || f.observed == "no") {
            nots.push(f.id);
        } else {
            atts.push(f.id);
        }
    } );
    var url = this.config.owlsim_services_url + '/getAttributeInformationProfile';

    // now that i have the annotation list, go and fetch the scores for the
    // abnormal and normal annotations separately
    var resultStr = this.fetchUrl(url,
            { a : atts,
              r : categories },
            'post');
    var att_info =  JSON.parse(resultStr);
    scored_profile.features = att_info;

    if (nots.length > 0) {
        resultStr = this.fetchUrl(url,
                { a : nots,
                  r : categories },
                  'post');
        var not_info = JSON.parse(resultStr);
        // console.log("NOT array:"+JSON.stringify(nots));
        // console.log("NOTS:"+JSON.stringify(not_info));
        scored_profile.nots = not_info;
        resultStr = this.fetchUrl(url,
                { a : atts.concat(nots),
                  r : categories },
                'post');
        var all_info = JSON.parse(resultStr);
    } else {
        var all_info = att_info;
    }
    // eventually could add the two together when we get the raw data
    
    // build a unified score based on the categories
    // must scale it by the minimum possible score; we know that
    // in phenotips the minimum score is based on one of the
    // categories

    // scored_profile.all = all_info;
    if (all_info.annotation_sufficiency != null) {
        scored_profile.simple_score = parseFloat(all_info.annotation_sufficiency.score);
    } else {
        scored_profile.simple_score = parseFloat(all_info.score);
    }
    // if (nots.length > 0) {
        // the NOTs will count only a fraction of the whole score
            // (parseFloat(att_info.annotation_sufficiency.score)
            // + (parseFloat(not_info.annotation_sufficiency.score) *
			// not_scaling_factor)) / (1+not_scaling_factor);
    // }

    // take a simple average of the categorical scores, regardless of their not
	// status
    var scores = all_info.categorical_scores.map(function(s) { return parseFloat(s.score); } );
    if (scores.length > 0) {
        scored_profile.categorical_score = scores.reduce(function(a,b) { return a+b; }) / scores.length;
        // "curving" based on category minimum scores - Not sure if this is
		// necessary
        // ommiting for now
        // var categorical_mins = engine.getMinScorePerCategory(categories);
        // var min = categorical_mins.map(function(x) { return
		// parseFloat(x.score)} ).reduce(function(previous,current){
        // return previous > current ? current : previous });
        if (att_info.annotation_sufficiency != null) {
            att_info.score = att_info.annotation_sufficiency.score;
        }
        scored_profile.scaled_score = (
            // (scored_profile.overall_score - min)+
            ((scored_profile.simple_score + parseFloat(att_info.score)) / 2.0) +
            (scored_profile.categorical_score * category_scaling_factor)) / (1+category_scaling_factor);
    }

    return scored_profile;    
}

bbop.monarch.Engine.prototype.getMinScorePerCategory = function(categories) {
    var engine = this;
    var categorical_scores = [];
    categories.forEach( function(c) {

        var url = engine.config.owlsim_services_url + '/getAttributeInformationProfile';
        var resultStr = engine.fetchUrl(url,            
                        { a : [c],              
                          r : categories },
                          'post');
        var att_info =  JSON.parse(resultStr);
        var obj = {id : c, score : att_info.annotation_sufficiency.score};
        categorical_scores.push(obj);
    });
    return categorical_scores;
}

/*
 * Function: searchByPhenotypeProfile
 * 
 * Returns phenotypically similar entities of a given type.
 * 
 * This is currently hardcoded to types per species, but will be expanded in the
 * future to be more customizable.
 * 
 * Status: PARTIALLY IMPLEMENTED
 * 
 * Arguments: - query : a list of phenotype identifiers - target_species :
 * numeric fragment of NCBITaxon identifier - target_type : genotype | disease |
 * gene | variation (NOT IMPLEMENTED) - cutoff : - metric :
 * 
 */
bbop.monarch.Engine.prototype.searchByPhenotypeProfile = function(query,target_species,target_type,cutoff,metric) {
    var engine = this;
    var defaultMetric = 'combinedScore';

    // var id_list = query.split(/[\s,]+/); //assume it's just a simple string
	// list, convert to proper list type
    var id_list = query;
    console.log("Query:"+id_list);
    console.log("|Query| : "+ id_list.length);
    id_list = engine.mapIdentifiersToPhenotypes(id_list);

    var species_to_filter_map = {
            '10090' : { label : 'Mus musculus', target_idspace : 'MGI', b_type : 'gene', b_source : 'nif-0000-00096-6' },
            '9606' : { label : 'Homo sapiens', target_idspace : 'OMIM', b_type : 'disease',b_source : 'nlx_151835-1'},
            '7227' : { label : 'Drosophila melanogaster', target_idspace : 'FBgenoInternal', b_type : 'genotype',b_source : 'nif-0000-00558-2'},
            '7955' : { label : 'Danio rerio', target_idspace : 'ZFIN', b_type : 'gene', b_source : 'nif-0000-21427-10'}
    };

    var resource = {};
    // set defaults
    if (typeof target_species !== 'undefined' && target_species != '' && target_species != null) {
      console.log("No target species supplied.  Fetching best matches for anything.");
	 //make a clone
     for( var key in species_to_filter_map[target_species] )
       resource[ key ] = species_to_filter_map[target_species][ key ];

    } else {
      //hack; for now everything is a target, so all resources are included
      var b_type = [];
      var b_source = [];
      for (var spid in species_to_filter_map) {
        var res = species_to_filter_map[spid];
        b_type.push(res.b_type);
        b_source.push(res.b_sourcce);
      }
      resource.b_type = b_type.join(",");
      resource.b_source = b_source;
	};
    resource.a_type = 'phenotype_profile';
    resource.label = 'OwlSim Server: '+this.config.owlsim_services_url;

    cutoff = typeof cutoff !== 'undefined' ? cutoff : 5;
    metric = typeof metric !== 'undefined' ? metric : defaultMetric;   

    var taxon = {} ;
    // TODO: this is currently hardcoded to a single type - needs to be flexible
    // should be based on the target_type
    if (typeof target_species != 'undefined' && target_species != '' && target_species != null) {
      var target = resource.target_idspace;  // HARDCODE

	  taxon = { id : 'NCBITaxon:'+target_species, label : species_to_filter_map[target_species].label };
    } 
	else { target = null };																	// ALERT

    var queryLookup = {};
    var stuff = engine.searchByAttributeSet(id_list,target,cutoff);
    // console.log(JSON.stringify(stuff,null,' '));

    var results = [];
    for (var i=0; i<stuff.results.length; i++) {
    // rank is based on rank returned by owlsim, currently hardcoded to be combinedScore
        var r = stuff.results[i];
        if (typeof target_species == 'undefined') {
			taxon = engine.mapMatchIdentifierToTaxon(r.j.id); 
		}

     //   console.log("taxon match for id"+r.j.id+"="+JSON.stringify(taxon));

        var obj = {
            id : r.j.id, 
            label : r.j.label, 
            taxon : taxon,
            matches : r.matches,
            type : target_type, 
            score : {metric : metric, score : r[metric], rank : i} } ;
        results.push(obj);
    };

    if (results.length > 0) {
    var system_stats = stuff.results[0].system_stats;
    //HARDCODE ALERT
	//TODO this should be the result of an owlsim call
    system_stats.metric_stats = {metric : metric, maxscore : '100', avgscore : '60', stdevscore : '4.32', comment:'These stats are approximations for this release'};

    resource.a_type = 'phenotype_profile';
    resource.label = 'OwlSim Server: '+this.config.owlsim_services_url;
    var similarThings = {
            a : id_list,  // TODO: look up the id info - return this info
            b : results,  // TODO: process results to select only a single
							// metric, reformat, etc.
            cutoff : cutoff,
            metadata : system_stats,
            resource : resource.id,
            source : {id : resource.id, label : resource.target}
    };
	} else {
		var similarThings = {};
	}

    //if (typeof target_species == 'undefined') {
    //  console.log('SIMILAR:'+JSON.stringify(similarThings,null,' '));
    //}
    return similarThings;

}

//This function maps an identifer to a taxon, and is used
//particularly when retrieving phenotype matches from owlsim server
bbop.monarch.Engine.prototype.mapMatchIdentifierToTaxon = function(id) {
    var taxon = {};
    if (id.match(/^MGI/)) {
        taxon.id = 'NCBITaxon:10090';
        taxon.label = 'Mus musculus';
    } else if (id.match(/^ZFIN/)) {
        taxon.id = 'NCBITaxon:7955';
        taxon.label = 'Danio rerio';
    } else if (id.match(/^OMIM|^ORPHANET|^DECIPHER/)) {
        taxon.id = 'NCBITaxon:9606';
        taxon.label = 'Homo sapiens';
    } else if (id.match(/^FB/)) {
        taxon.id = 'NCBITaxon:7227'; 
        taxon.label = 'Drosophila melanogaster';
    } else if (id.match(/^WB/)) {
        taxon.id = 'NCBITaxon:6239';
        taxon.label = 'Caenorhabditis elegans';
    } else {
        taxon.id = "";
        taxon.label = "Not Specified";
    }
    return taxon;
}

//This function maps an identifer to a taxon, and is used
//particularly when retrieving phenotype matches from owlsim server
bbop.monarch.Engine.prototype.mapSpeciesIdentifierToTaxon = function(id) {
    var taxon = {};
    if (id == '10090') {
        taxon.id = 'NCBITaxon:10090';
        taxon.label = 'Mus musculus';
    } else if (id == '7955') {
        taxon.id = 'NCBITaxon:7955';
        taxon.label = 'Danio rerio';
    } else if (id == '9606') {
        taxon.id = 'NCBITaxon:9606';
        taxon.label = 'Homo sapiens';
    } else if (id == '7227') {
        taxon.id = 'NCBITaxon:7227'; 
        taxon.label = 'Drosophila melanogaster';
    } else if (id == '6239') {
        taxon.id = 'NCBITaxon:6239';
        taxon.label = 'Caenorhabditis elegans';
    } else {
        taxon.id = "";
        taxon.label = "Not Specified";
    }
    return taxon;
}

// The function maps a source string like "MGI" to a source object.
// Note: The source object ID only contains the resource ID. It does not contain
// identifying data (number at end) about what the data is about (what sort of
// information).
bbop.monarch.Engine.prototype.mapStringToSource = function(str) {
    var source = {};
    source.id = "";
    source.label = str;
    if (str.match(/Biogrid/)) {
        source.id = "nif-0000-00432";
    } else if (str.match(/ClinVar/)) {
        source.id = "nlx_151671";
    } else if (str.match(/Coriell/)) {
        source.id = "nif-0000-00182";
    } else if (str.match(/CTD/)) {
        source.id = "nif-0000-02683";
    } else if (str.match(/DECIPHER/)) {
        source.id = "nlx_151653";
    } else if (str.match(/Ensembl/)) {
        source.id = "nif-0000-21145";
    } else if (str.match(/FB|FlyBase/)) {
        source.id = "nif-0000-00558";
    } else if (str.match(/HGNC/)) {
        source.id = "nif-0000-02955";
    } else if (str.match(/HPO/)) {
        source.id = "nlx_151835";
    } else if (str.match(/KEGG/)) {
        source.id = "nlx_31015";
    } else if (str.match(/MGI/)) {
        source.id = "nif-0000-00096";
    } else if (str.match(/OMIM/)) {
        source.id = "nif-0000-03216";
    } else if (str.match(/ORPHANET/)) {
        source.id = "nif-0000-21306";
    } else if (str.match(/PANTHER/)) {
        source.id = "nlx_84521";
    } else if (str.match(/PharmGKB/)) {
        source.id = "nif-0000-00414";
    } else if (str.match(/PubMed|NCBI|PMID|pmid/)) {
        source.id = "nif-0000-02801";
    } else if (str.match(/Uniprot/)) {
        source.id = "nif-0000-00377";
    } else if (str.match(/Vega/)) {
        source.id = "nif-0000-03626";
    } else if (str.match(/WB|WormBase/)) {
        source.id = "nif-0000-00053";
    } else if (str.match(/ZFIN/)) {
        source.id = "nif-0000-21427";
    }
    return source;
}

// EXAMPLE:
// http://beta.neuinfo.org/services/v1/federation/data/nlx_152525-3.json?exportType=data&q=DECIPHER_42
// VIEW:
// http://beta.neuinfo.org/mynif/search.php?q=DECIPHER_42&t=indexable&nif=nlx_152525-3&b=0&r=20
// TODO: the federation query currently returns
// TODO: OQ needs to expand on IDs. E.g if I query for DOID_14330 (PD) then it
// should expand to the OMIM IDs for child terms
bbop.monarch.Engine.prototype.fetchMonarchDiseaseByDiseasePrecompute = function(id) {
    var resource_id = 'nlx_152525-3'; // HARCODE ALERT

    // translate
    var tr =
        function (r) {
            var obj = {

                // TODO - get labels for these. Requires OQ to have loaded the
				// disease ontology
                a : { 
                    type : "disease",
                    id : r.a },
                b : { type : "disease",
                        id : r.b },
                metric : r.metric,
                score : r.score,
                value : r.value,

                // provenance
                source : "OWLSim",
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




// EXAMPLE:
// http://beta.neuinfo.org/services/v1/federation/data/nif-0000-00432-1.json?exportType=data&q=42757
bbop.monarch.Engine.prototype.fetchGeneInteractions = function(id) {
    var resource_id = 'nif-0000-00432-1'; // HARCODE ALERT
    var geneID = id.replace(/NCBI_?[gG]ene:/,'');
    //var filter = ["interactor_a_gene_id:" +this.quote(geneID)];
//    var filter = ["interactor_a_gene_id:" +geneID];
	var filter = { interactor_a_gene_id : geneID };

    var resultObj = {};
    resultObj.results = [];

    // translate
    var tr =
        function (r) {
            var obj = {
            genea : { 
                      id: id,
                      label: r.interactor_a_gene_name
                    },
            geneb : { 
                      id: 'NCBIGene:'+r.interactor_b_gene_id,
                      label: r.interactor_b_gene_name
                    },               
            geneb_organism : r.interactor_b_taxon_name,      
            interaction_type : r.interaction_type_names,
            interaction_detection: r.interaction_detection_method_names,
            references: {
            	       id : 'PMID:' + r.pubmed_id
            	    },               
            // provenance
            source : {
                       id : resource_id, 
                       label : 'Biogrid'
                    },
            resource : resource_id
            };
            return obj;
        };

    var resultObj1 = 
    	this.fetchDataFromResource(null, 
                                   resource_id,
                                   tr,
                                   null,
								   null,
                                   filter,
                                   null,
                                   null );
    
    // Now get the reverse associations for model org to human associations
    //filter = ["interactor_b_gene_id:" +this.quote(geneID)];
//    filter = ["interactor_b_gene_id:" +geneID];
	filter = { interactor_b_gene_id : geneID }

    tr =
    	function (r) {
        var obj = {
        genea : { 
        	      id: 'NCBIGene:'+r.interactor_b_gene_id,
                  label: r.interactor_b_gene_name
                },
        geneb : { 
  	              id: 'NCBIGene:'+r.interactor_a_gene_id,
                  label: r.interactor_a_gene_name
                },               
        geneb_organism : r.interactor_a_taxon_name,      
        interaction_type : r.interaction_type_names,
        interaction_detection: r.interaction_detection_method_names,
        references: {
        	       id : 'PMID:' + r.pubmed_id
        	    },               
        // provenance
        source : {
                   id : resource_id, 
                   label : 'Biogrid'
                },
        resource : resource_id
        };
        return obj;
    };
        
    var resultObj2 = this.fetchDataFromResource(null, 
                                           resource_id,
                                           tr,
                                           null,
                                           null,
										   filter,
                                           null,
                                           null );
    // Combine result objects
    if (resultObj1.results){
    	resultObj.results = resultObj.results.concat(resultObj1.results);
    }
    if (resultObj2.results){
    	resultObj.results = resultObj.results.concat(resultObj2.results);
    }
    
    // need to make this a function
    var uniqResults = {};
    var unique = {};
    uniqResults.results = [];
    
    if (resultObj){
    	for (var i=0; i<resultObj.results.length; i++){
            var cat = resultObj.results[i].genea.id+
                      resultObj.results[i].geneb.id+
                      resultObj.results[i].interaction_type;
         
    		if (cat in unique){
                continue;
            } else {
            	uniqResults.results = uniqResults.results.concat(resultObj.results[i]);
                unique[cat] = 1;
            }
    	}
    }
    
    return uniqResults;

}

// EXAMPLE: Y
// Not yet referenced
// TODO: fix this to work with the refactored NIF services
bbop.monarch.Engine.prototype.fetchGeneExpressionAsAssocations = function(id) {
    var resource_id = 'nif-0000-08127-1'; // Use GEMMA for now

    var tr =
        function (r) {
            var obj = {
                // in the DGA view "phenotype" is disease
                location : { // id : r.omim_phenotype_id,
                    label : r.tissue},

                       gene : { 
                        id : "gene:" + r.geneid,
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

/*
 * Function: searchByAttributeSet
 * 
 * Returns: ordered list of matches
 * 
 * Arguments: - atts : list of class identifiers - target_filter: An ID space
 * (string) [e.g. ZFIN] OR a query object - limit : number of results to return.
 * 
 * Query objects are only partially supported. An ID space can be used in place
 * of an object, but this usage may be deprecated in future.
 * 
 * Keys: - target: an ID space - species: numeric fragment of NCBITaxon ID or
 * IRI - type: one of gene | genotype | disease (NOT IMPLEMENTED)
 * 
 */
bbop.monarch.Engine.prototype.searchByAttributeSet = function(atts, tf, limit) {
    console.log("|Atts| = "+atts.lnegth);
    console.log("Atts:"+atts);
    console.log("Filter:"+JSON.stringify(tf));
    var ph = 
    {
        a : atts
    };

    // current the owlsim server only supports one way of selecting a result set
	// to query against,
    // the 'target' parameter, which constrains by ID space. In future, the
	// server will support
    // arbitrary filtering of the result set using any OWL properties of the
	// target - e.g.
    // species, type (gene vs genotype vs disease), ..
    //
    // Currently we map everything to a 'target' parameter in the owlsim query
    if (tf != null) {
        if (typeof tf == 'object') {
            if (tf.type != null) {
                console.warn("Not supported");
            }

            if (tf.target != null) {
                ph.target = tf.target;
            }
            else if (tf.species != null) {
                if (tf.species == 10090) {
                    ph.target = 'MGI';
                }
                else if (tf.species == 9606) {
                    ph.target = 'OMIM';
                }
                else if (tf.species == 7955) {
                    ph.target = 'ZFIN';
                }
                else if (tf.species == 7227) {
                    ph.target = 'FBgenoInternal';
                }
                else {
                    console.warn("Species not yet supported: " + tf.species);
                }
            }
            else {
            }
        }
        else {
            // type is a string; we assume this is an ID space
            // this usage may become deprecated
            ph.target = tf;
        }
    }
    if (limit != null) {
        ph.limit = limit;
    }
    var resultStr = this.fetchUrl(this.config.owlsim_services_url + '/searchByAttributeSet',
            ph,
            'get');
    if (resultStr == "" || resultStr == null) {
        return {
            results: []
        }
    }
    return JSON.parse(resultStr);
}

/*
 * Function: getAnnotationSufficiencyScore
 * 
 * Returns: ordered list of matches
 * 
 * Arguments: - atts : list of class identifiers - target: (optional) e.g. MGI -
 * limit : number of results to return
 * 
 */
bbop.monarch.Engine.prototype.getAnnotationSufficiencyScore = function(atts) {
    console.log("|Atts| = "+atts.lnegth);
        // EXAMPLE:
		// http://owlsim.crbs.ucsd.edu/getAnnotationSufficiencyScore?a=HP:0001324&a=HP:0007340&a=HP:0000158
    var resultStr = this.fetchUrl(this.config.owlsim_services_url + '/getAnnotationSufficiencyScore',
            { a : atts},
            'get');
    return JSON.parse(resultStr);
}

bbop.monarch.Engine.prototype.getOWLSimSystemStats = function() {
    var resultStr = this.searchByAttributeSet('HP:0001324','OMIM',1);
    // This is a total hack
    // This will just call the compare function and the retrieve the results
	// from there
    // It is not actually calling a special owlsim function, which it should
    // TODO: need to write/call the actual owlsim service
    var stats = resultStr.results[0].system_stats;
    console.log("STATS: "+JSON.stringify(stats));
    return stats;
}


// E.g. ('OMIM_143100', 'MGI:3664660')
bbop.monarch.Engine.prototype.fetchAttributeComparisonMatrix = function(x,y) {
    // TODO - remove this hardwired assumption (disease x model)
    var disease = this.fetchDiseaseInfo(x);
    var model = this.fetchGenotypeInfo(y);

    var disease_phenotype_ids = 
        disease.phenotype_associations.map(function(e) {
                return e.phenotype.id;
                });
    var model_phenotype_ids = 
        model.phenotype_associations.map(function(e) {
                console.log("MP:"+JSON.stringify(e));
                return e.has_phenotype.type.id;
                });
    console.log("DP IDs="+disease_phenotype_ids);
    console.log("MP IDs="+model_phenotype_ids);

    var resultStr = this.fetchUrl(this.config.owlsim_services_url + '/compareAttributeSets',
            {
a : disease_phenotype_ids, 
b : model_phenotype_ids, 

},
'post');
return JSON.parse(resultStr);
}

// E.g. ('OMIM_127750', [model1, model2, ...])
bbop.monarch.Engine.prototype.fetchAttributeMultiComparisonMatrix = function(x,model_ids) {

    // TODO - remove this hardwired assumption (disease x model)
    var disease = this.fetchDiseaseInfo(x);


    var disease_phenotype_set = {};
    for (var j in disease.phenotype_associations) {
        disease_phenotype_set[disease.phenotype_associations[j].phenotype.id] = 1;
    }

    var model_phenotype_set = {};

    var models_by_phenotype_map = {};

    console.log("MOD_IDS=" + model_ids);
    for (var k in model_ids) {
        var model_id = model_ids[k];
        console.log(" MOD=" + model_id);
        var model = this.fetchGenotypeInfo(model_id);
        for (var j in model.phenotype_associations) {
            var pa = model.phenotype_associations[j];
            // if (pa.has_phenotype == null) {
            // console.log(" HUH?" + JSON.stringify(pa));
            // }
            var ph = pa.has_phenotype.type;
            console.log("   PHID=" + ph.id);
            model_phenotype_set[ph.id] = 1;
            if (models_by_phenotype_map[ph.id] == null) {
                models_by_phenotype_map[ph.id] = [];
            }
            models_by_phenotype_map[ph.id].push(model_id);
        }
    }

    var disease_phenotype_ids = Object.keys(disease_phenotype_set);
    var model_phenotype_ids = Object.keys(model_phenotype_set);

    console.log("DP IDs="+disease_phenotype_ids);
    console.log("MP IDs="+model_phenotype_ids);

    var resultStr = this.fetchUrl(this.config.owlsim_services_url + '/compareAttributeSets',
            {
a : disease_phenotype_ids,
b : model_phenotype_ids,

},
'post');
var lcsList = JSON.parse(resultStr);

var attMatchList = [];
for (var i in lcsList) {
    var lcsObj = lcsList[i];

    var lcs_id = lcsObj.LCS.id;

    var attribute_a_id = lcsObj.A.id;
    var attribute_b_id = lcsObj.B.id;

    for (var j in models_by_phenotype_map[attribute_b_id]) {
        var model = models_by_phenotype_map[attribute_b_id][j];
        var row_id = attribute_a_id + "_" + attribute_b_id;
        var am =
        {
id : row_id + "_" + model_id,
     attribute_a_id : attribute_a_id,
     attribute_a_label : lcsObj.A.label,
     attribute_b_id : attribute_b_id,
     attribute_b_label : lcsObj.B.label,
     element_b_id : model_id,
     row_id : row_id,
     lcs_id : lcs_id,
     // lcs_label : lcsObj.label,
     lcs_score : lcsObj.LCS_Score
        };
        attMatchList.push(am);
    }

}

return attMatchList;
}

// expand disease IDs to their phenotypes
bbop.monarch.Engine.prototype.mapIdentifiersToPhenotypes = function(ids) {
    var pids = [];
    var exclude_pids = [];
    for (var k in ids) {
        var pid = this.expandIdentifierToPhenotype(ids[k]);
        if (pid.indexOf("-") == 0) {
            exclude_pids.push(pid.replace("-",""));
        }
        else {
            pids.push( pid );
        }
    }
    console.log("EXCLUDE PIDs: "+exclude_pids);
    console.log("PIDs (pre-filter): "+pids);
    pids = pids.filter( function(pid) { return exclude_pids.indexOf(pid) == -1 } );
    console.log("PIDs (post-filter): "+pids);
    return pids;
}

bbop.monarch.Engine.prototype.expandIdentifierToPhenotype = function(id) {
    id = id.replace("_",":");
    var parts = id.split(":");
    var db = parts[0];
    var phenotype_associations = [];
    var resultObj;
    // TODO avoid hard-cording assumptions
    if (this.mapIdentifierType(id) == 'phenotype') {
        return id;
    }

    if (this.mapIdentifierType(id) == 'disease') {
        console.log("Expanding disease ID to phenotype: "+id);
        resultObj = this.fetchOmimDiseasePhenotypeAsAssocations(id);
        phenotype_associations = phenotype_associations.concat(resultObj.results);
        return phenotype_associations.map( function(a) {return a.phenotype.id});
    }
    console.log("Assuming id is a phenotype: "+id);
    return id;
}

bbop.monarch.Engine.prototype.mapIdentifierType = function(id) {
    id = id.replace("_",":");
    var parts = id.split(":");
    var db = parts[0];
    // TODO avoid hard-cording assumptions
    // THIS IS A TERRIBLE HACK
    if (db == 'MP' || db == 'HP' || db == 'WBbt' || db == 'ZP') {
      return 'phenotype';
	}
    if (db == 'OMIM' || db == 'DECIPHER' || db == 'ORPHANET' || db == 'DOID') {
      return 'disease';
	}
	return null;
}

// A generic wrapper to fetch all pathway information, given some pathway query
// Status: NOT IMPLEMENTED
bbop.monarch.Engine.prototype.fetchPathwayInfo = function(q) {
  // TODO: add cache checks here --uncomment
/*
 * if (this.cache != null) { var cached = this.cache.fetch('pathway', id); if
 * (cached != null) { if (cached.apiVersionInfo == null || cached.apiVersionInfo !=
 * this.apiVersionInfo()) { console.log("cached version is out of date - will
 * not use"); } else { console.log("Using Cached version of "+id); return
 * cached; } } }
 */
    // TODO: in the future allow lookups for any pathway table
    var resource_id = 'nlx_31015-3'; // HARDCODE ALERT
      var engine = this;
      var tr = 
        function (r) {
              var obj = {
                  id : r.pathway_id,
                  label : r.pathway_label,
                description : r.description, // TODO- we don't yet have the
												// data
                  genes : engine.fetchGenesForPathway(r.pathway_id).results,
                // diseases :
				// engine.fetchDiseasesForPathway(r.pathway_id).results,
                resource : resource_id,
                source : { id : resource_id,label : 'KEGG'}
              };
            return obj;
        };
    var resultObj =
        this.fetchDataFromResource(q,resource_id,tr);

    return resultObj;
}

// Given a pathway ID, fetch the list of genes that are annotated to it
// Can be optionally filtered by Species
// Status: NOT IMPLEMENTED
bbop.monarch.Engine.prototype.fetchGenesForPathway = function(id,species) {
    console.log("Fetching GenesForPathway: "+id);
    resource_id = 'nlx_31015-3'; // HARDCODE ALERT
    // set default species to human
    if (typeof species == 'undefined') {
        console.log("ERROR: no species supplied for gene fetching. Defaulting to human, 9606.");
        species = '9606'
    };

      var engine = this;
      var tr =
        function (r) {
            var obj = {
                    // TODO: need to properly list the genes, with id and label
                    // TODO: need to map the ko ids to the appropriate species
                    pathway : { id : id , label : r.pathway_label },
                    genes : [ r.ko_ids ],
                    resource : resource_id,
                    source : {
                        id: resource_id,
                        label: 'KEGG' }
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

// Status: NOT IMPLEMENTED
bbop.monarch.Engine.prototype.fetchDiseasesForPathway = function(id) {
      return {};
}

// Until ID mapping is working, we need this lookup function
// we can look things up using myGene, but also using our ID map
// for those resources that aren't mapped.
// Status: IMPLEMENTED
bbop.monarch.Engine.prototype.mapGeneToNCBIgene = function(id) {
    var resource_id = 'nlx_152525-4'; // ID map

    // query our ID mapping table to get the NCBIgene id.
    // this will return an object of matching genes in our tables
    // some ids will match multiple ncbi gene records, and will
    // reflect that mapping
    var engine = this;
    var mappings = {};
    var tr =
        function (r) {
            var rid = r.source+":"+r.id;
			if (r.mapped_source == "KEGG") {
				r.mapped_id = r.mapped_id.replace(/:/,"-")
			}
            var cid = r.mapped_source+":"+r.mapped_id;
            var mapping = { id : rid,
                            ncbi_id: r.id,
                            mapped_id : cid,
                            label : r.symbol,
                            taxon : {id : r.taxon_id, label : r.taxon_label},
                            references : [
                              {
                                  id : 'NCBIGene:'+r.id
                              }]
                            };

            if (mappings[r.id]) {
                mapping = mappings[r.id];
            } else {
                mappings[r.id] = mapping;
            }
        mapping.references.push(r.mapping_resource);
   
     return mapping;
    };
//	var filters = ["source:NCBIGene","mapped_id:"+this.quote(this.getFederationNifId(id))];
	var filters = { source : "NCBIGene", mapped_id : engine.getFederationNifId(id) };

    var resultObj = this.fetchDataFromResource(null, resource_id, tr,null,null,filters,null,null,null);

    if (resultObj.results == 0 ) {
        // no match
        // try splitting out any idspace/prefix and identifier before the query
        var idsplit=id.match(/(\w+)[\:_]([\w\-]+)/);
        console.log("ID MATCHES:"+idsplit);
        var idspace = idsplit[1];
        var newid = idsplit[2];
		
        if (idsplit != null) {
			//filters = ["source:NCBIGene","mapped_id:"+this.quote(this.getFederationNifId(newid)),"mapped_source:"+idspace];
			filters = { source : "NCBIGene", 
						mapped_id : engine.getFederationNifId(newid),
						mapped_source : idspace };
            var resultObj = this.fetchDataFromResource(null, resource_id, tr,null,null,filters,null,null,null);    
        }
    }

    return mappings;
}

// A helper function to map a gene ID to a kegg KO id
// This assumes the id is an NCBI gene identifier
// Status: Implemented
bbop.monarch.Engine.prototype.mapNCBIGeneToKO = function(id) {
    var kegg_ko_map_resource_id = 'nlx_31015-4'; // gene-to-KO map //HARDCODE
    var id_map_resource_id = 'nlx_152525-4'; // ID map

    var engine = this;
    var mappings = {};
    var tr =
        function (r) {
            return r;
        };

    // scrub the id of any prefix, just in case.
	if (id != null) {
		id = id.replace(/NCBI_?[gG]ene:/,"");
	}
    // get the ncbi gene to kegg id
    // we'll assume 1:1 for now
    //we used to have to map this, but now it is directly in the 31015-4 resource
    //var ncbiToKeggGene = this.fetchDataFromResource(null, id_map_resource_id, tr,null,["source:NCBIGene","id:"+this.quote(id),"mapped_source:KEGG"],1,null,{ useClosure : false});
    //console.log("NCBI:KEGG:"+JSON.stringify(ncbiToKeggGene));
    //var kegg_geneid;
    //if (ncbiToKeggGene.results.length == 0 ) {
    //    kegg_geneid = null; 
    //} else {
    //    kegg_geneid = this.getFederationNifId(ncbiToKeggGene.results[0].mapped_id.replace("KEGG:",""));
    //}
    var keggtr = 
        function (r) {

            if (! r.ko_id) {r.ko_id = "n/a";}
            if (! r.ko_label) {r.ko_id = "n/a";}


            var obj = {
                //id : "NCBIGene:"+id,
				id : r.gene_id,
                label : r.gene_label,
                kegg_gene_id : r.kegg_gene_id,
                kegg_gene_label : r.kegg_gene_label,
                ko_id : r.ko_id,
                ko_label : r.ko_label,
                taxon : { id : r.taxon_id, label : r.taxon_label },
                source : {
                    id : kegg_ko_map_resource_id,
                    label : "KEGG"
                },
                resource_id : kegg_ko_map_resource_id,
            };
            return obj;
        };
       
    //if (kegg_geneid != null){
    	//var keggGeneToKO = this.fetchDataFromResource(null,kegg_ko_map_resource_id, keggtr, null,["gene_id:"+this.quote(kegg_geneid)],null,null,{useClosure : false});
//		var filters = ["gene_id:"+this.quote("NCBIGene:"+id)];
		var filters = { gene_id : "NCBIGene:"+id };

    	var keggGeneToKO = this.fetchDataFromResource(null,kegg_ko_map_resource_id, keggtr, null, null,filters,null,null,null);
    	return keggGeneToKO.results;
    //} else {
    //	return [];
    //}
    
}

// Given a gene id, fetch all pathways that are annotated to it.
// At first, use the KEGG pathways, which required operating via KO class
// Status: IMPLEMENTED
bbop.monarch.Engine.prototype.fetchPathwaysForGene = function(id) {
    var resource_id = 'nlx_31015-3'; // pathway-to-KO map //HARDCODE
    var evidence_map_resource_id = 'nlx_31015-2'; // gene-to-pmid map
													// //HARDCODE
    var engine = this;

    // for now, assume user is coming in with an NCBI id.
    // 
    if (this.mapNCBIGeneToKO(id).length == 0) {
        return {};
    }
    var ko_id = this.mapNCBIGeneToKO(id)[0].ko_id;

    console.log("Looked up KO id: "+ko_id);
    console.log("Hacking the lookup for NIF -- removing preceeding K from identifier until id queries are fixed");
    var geneLookup = {};

    var tr =
        function (r) {
            var gene = { id : id, pathways : [] };// , pathways : [{id:
													// r.pathway_id,label :
													// r.pathway_label}] };
            if (geneLookup[id]) {
                gene = geneLookup[id];
            } else {
                geneLookup[id] = gene;
            }
        gene.pathways.push({id: r.pathway_id,
                            label : r.pathway_label,
                            source : { id : resource_id, label: 'KEGG'},
                           });
        return gene;
    };

    var resultObj =
        this.fetchDataFromResource(ko_id,
                resource_id,
                tr
                );

    // console.log('PATHWAY LOOKUP:'+JSON.stringify(resultObj));
    var pathList = {};
    if (geneLookup != {} && geneLookup != null && typeof geneLookup !== 'undefined' && typeof geneLookup[id] !== 'undefined') {
        pathList = {
            pathways : geneLookup[id].pathways, 
            id : id, // TODO: temp, for testing
            ko_id : ko_id,
            resource : resource_id,
        };
    }
    // Get gene pathway evidence
    /*
	 * Commenting out as this returns evidence for disease-pathway relationships
	 * We do not currently have a resource for gene-pathway publications, but
	 * this should work with a few changes once that resource is available if
	 * (pathList.pathways){ for (var i=0; i < pathList.pathways.length; i++){
	 * pathList.pathways[i].references = []; var gene_id =
	 * id.replace(/NCBI_?[Gg]ene:/,""); var path_id =
	 * pathList.pathways[i].id.replace(/KEGG:/,"") var filter =
	 * ["gene_ids:"+this.quote(gene_id),"pathway_ids:"+this.quote(path_id)]; var
	 * geneToKOEvidence = this.fetchDataFromResource(null,
	 * evidence_map_resource_id, null, null, filter, null, null, {useClosure :
	 * false}); if (geneToKOEvidence.results){ for (var j=0; j <
	 * geneToKOEvidence.results.length; j++){ var ref =
	 * geneToKOEvidence.results[j].publication_ids.split(", "); if (ref){ for
	 * (var index = 0; index < ref.length; index++){
	 * pathList.pathways[i].references.push({id:ref[index]}); } } } }
	 *  } } console.log(JSON.stringify(pathList));
	 */
	return pathList;
}

// Given a disease id, fetch all pathways that are annotated to it.

// Status: IMPLEMENTED
// TODO: add inferred linkages via disease genes (which might not be curated
// from KEGG
bbop.monarch.Engine.prototype.fetchPathwaysForDisease = function(id) {
	var resource_map = {id : 'nlx_31015-2',label:'KEGG'}; // HARDCODE ALERT
    var engine = this;
    
    var tr =
        function (r) {
			var obj = {};
			if (r.pathway_ids.length > 0) {
            r.gene_ko_ids = [];
			var genes = [];
			var ids = r.gene_ids.split(", ");
			var labels = r.gene_symbols.split(", ");
			for (var i=0; i<ids.length ; i++) {
                // convert ncbi gene id to kegg
                var ko_gene_id = engine.mapNCBIGeneToKO(ids[i]);
                if (ko_gene_id && ko_gene_id.length > 0) {
                    r.gene_ko_ids.push( engine.mapNCBIGeneToKO(ids[i])[0].ko_id );
					genes.push({id : ids[i], label : labels[i], ko_ids : [ko_gene_id[0].ko_id]});
                }
            }
			ids = r.pathway_ids.split(", ");
			labels = r.pathway_labels.split(", ");
			var pathways = [];
			for (var i=0; i<ids.length; i++) {
				// TODO assuming there are ids.length == labels.length
				pathways.push({id : ids[i], label : labels[i]});
			}
			//var references = {id : 'KEGG:'+r.disease_id, label : r.disease_label};
			var references = {id : r.disease_id, label : r.disease_label};
			obj = {
				id : id,   // disease id
				genes : genes,
				pathways : pathways,
				references : references,
				source : resource_map,
				rel : 'associated to disease'
			};
		}
        return obj;
    };

    
    var resultObj = this.fetchDataFromResource(id, resource_map.id, tr);

	// console.log('PATHWAYBYDISEASE: '+JSON.stringify(resultObj,' ', null));

    return resultObj;
}

// note that subclass closure on the ids in the list is not working correctly
// https://support.crbs.ucsd.edu/browse/NIF-10435
bbop.monarch.Engine.prototype.fetchAssertedDiseasePathwayAssociations = function(id,label) {
    var resource_map = {id : 'nlx_31015-2',label:'KEGG'}; // HARDCODE ALERT
    var engine = this;
	var query = null;
	var subclassQuery = id;
	//TODO verify if this is correct
    var fetchPath =
        this.fetchDataFromResource(query,
                resource_map.id, null, null,subclassQuery);
  
    // Iterate over result set
	var associations = [];
    for (var i=0; i<fetchPath.results.length; i++){
        var r = fetchPath.results[i];
		var pathway_ids = [];
		if (r.pathway_ids != null && r.pathway_ids != "") {
			pathway_ids = r.pathway_ids.split(",");
		}
		var pathway_labels = r.pathway_labels.split(",");
		// unfold the disease-pathway associations
		for (var j=0; j < pathway_ids.length; j++) {
                        if (pathway_ids[i] == null) {
                            continue;
                        }
			var pathway = {id : pathway_ids[i].trim(), label : pathway_labels[j].trim()};
			var assoc = {
				id : "monarch:disco/" + r.v_uuid,
				type : "Association",
				// TODO: using omim ids instead of disease_id as primary b/c we
				// haven't mapped kegg diseases into uberdisease
				// also, since omim ids are a list, and it uses transivity to
				// resolve it,
				// but i don't know which one is matched, i will just use the
				// query
				// id to list, but it isn't quite right
				disease : {
					id : id.replace(/_/,":"),
					label : label,
					kegg_id : r.disease_id,
					kegg_label : r.disease_label,
					omim_ids : r.omim_ids,
					omim_labels : r.omim_labels },
				pathway : pathway, 
				// provenance
				source : resource_map,
				resource : resource_map.id,
				references : [{id : r.disease_id, label : r.disease_label}]
			};
			associations.push(assoc);
		}
	} 
	// console.log(associations,null,' ');
	return associations;
}

/*
 * given a set of genes (in the gene_assoc list), fetch the pathways, and infer
 * that the diseases are linked to the pathways via the genes
 */
bbop.monarch.Engine.prototype.fetchInferredDiseasePathwayAssociations = function(id,label,gene_assoc) {
    var engine = this;
	var genes = gene_assoc.map(function(g) { return g.gene });
	// console.log('GENES:'+JSON.stringify(genes,null,' '));
	var associations = [];
	for (var i=0; i<genes.length; i++) {	
		var gene = genes[i];
		var genePathways = engine.fetchPathwaysForGene(gene.id);
		// console.log('GENEPATHWAYS:'+JSON.stringify(genePathways));
		if (genePathways == null || genePathways.pathways == null ) continue;
		for (var j=0; j<genePathways.pathways.length; j++) {	
			var pathway = genePathways.pathways[j];
			// pathway.id = pathway.id;
            var assoc = {
                id : "monarch:disco/" + gene.v_uuid,
                type : "Inferred by gene",
                // TODO: using omim ids instead of disease_id as primary b/c we
                // haven't mapped kegg diseases into uberdisease
                // also, since omim ids are a list, and it uses transivity to
				// resolve it,
                // but i don't know which one is matched, i will just use the
				// query
                // id to list, but it isn't quite right
                disease : {
                    id : id.replace(/_/,":"),
                    label : label,
				},
                pathway : pathway,
                // provenance
                source : [gene.source,pathway.source],
                resource : [gene.resource,pathway.source],
                references : [{id : gene.id, label : gene.label}]
            };
            associations.push(assoc);
		}
	}
	// group associations by disease-pathway(?)
	return associations;;
}


// //////////////////////////////////////////////////////////////////
// 
// GENERIC NIF ACCESS LAYER
//
// There should be no mention of biological entities such as genes,
// diseases etc below this point.
//
//
// May be refactored into distinct modules in the future.

/*
 * Function: fetchClassInfo
 * 
 * Retrieves JSON blob providing info about an ontology class
 * 
 * 
 * Data structures: - Class = { id: ID, label : LABEL, relationships:
 * [Relationship*] OPTIONAL } - Relationship = { subject: OBJ, property : OBJ,
 * object : OBJ } - Obj = { id : ID, label : LABEL }
 * 
 * Services used: - OntoQuest
 * 
 * Options: - level : See OntoQuest docs. If set, a list of relationships will
 * form a graph with distance=level focused on class
 * 
 * Implementation notes: - makes use of OntoQuest REST API which returns XML
 * 
 * Arguments: - id : An identifier. One of: IRI string, OBO-style ID or
 * NIF-style ID - opts : Dictionary parameter
 * 
 * Returns: Class struct as JSON
 */
bbop.monarch.Engine.prototype.fetchClassInfo = function(id, opts) {
    var nif_id = this.getOntoquestNifId(id);
	var xmlStr = "";
	try {
    var xmlStr = this.fetchUrl(this.config.ontology_services_url + 'concepts/term/' + nif_id);
	    }
    catch(err) {
//        return errorResponse(err);
    }

    var obj = this._translateOntoQuestXmlToJson(xmlStr, nif_id);
    if (opts != null) {
        // TODO - Currently partly broken - see
		// https://support.crbs.ucsd.edu/browse/NIF-9077
        if (opts.level != null && opts.level > 0) {
            obj.relationships = [];
			try {
            xmlStr = this.fetchUrl(this.config.ontology_services_url + 'rel/all/' + nif_id, {level:opts.level});
           // console.log(xmlStr);
            var xml = this.parseXML(xmlStr); // TEMPORARY - OQ will soon
												// return JSON
            // console.log(xml);
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
			} catch (err) {
				console.log("Erorr when fetching class info; continuing; \n"+err);
			}
            //console.log("OBJ="+JSON.stringify(obj));
        }
    }
    return obj;
}

// Search a specified resource for a value, filtered by it's type
bbop.monarch.Engine.prototype.fetchInstanceLabelByType = function(id, resource_id,type_label) {
    var nif_id = this.getFederationNifId(id); // formats an identifier for
												// nif-style
    
    var tr =
        function (r) {
            var label = r[type_label+"_label"];
            label = ((typeof label !== 'undefined') && (label !=='')) ? label : r[type_label+"_name"];
            var obj = {
                id : nif_id,
                label : label, 
                source : resource_id,
                resource : resource_id
            };
            // console.log("Fetched: "+JSON.stringify(obj));
            return obj;
        };

//    var filters = [type_label+"_id:"+this.quote(nif_id)];   
//    var filters = [type_label+"_id:"+nif_id];   
	var col=type_label+"_id";
	var filters = {};
	filters[col] = nif_id;
 
    var cols = [type_label+"_name",type_label+"_label"];

    // TODO: when this ticket is closed, we don't have to limit the filter:
    // https://support.crbs.ucsd.edu/browse/NIF-9875
    var resultObj =
        this.fetchDataFromResource(null,
                                   resource_id,
                                   tr,
                                   cols,
								   null, 
				                   filters,
								   null,
								   1,  // just fetch the first match, and hope it's right!
                                   null );

    return resultObj;
}

// TODO - make this more configurable
bbop.monarch.Engine.prototype.getDefaultCategories = function() {
    // WARNING: categories are case sensitive.
    // In future this can be driven from the yaml
    return [
        'gene',
        'Phenotype',
        'disease'
    ];
}




bbop.monarch.Engine.prototype.annotateText = function(txt, opts) {
    var q = opts;
    q.content = txt;
    var res = 
        this.fetchUrl("http://kato.crbs.ucsd.edu:9000/scigraph/annotations/entities.json", q); // TODO
    console.log(res);    
    var results = JSON.parse(res);
    results.forEach(function(r) {
        if (r.token.id != null) {
            var url = r.token.id;
            r.token.url = url;
            r.token.id = url.replace(/.*\//g,"");
        }
    });
    return results;
}

/*
 * Function: searchSubstring
 * 
 * Services used: NIF vocabulary autocomplete
 * 
 * Arguments: term : search term Returns: JSON structure - as per NIF vocabular
 * services
 */
bbop.monarch.Engine.prototype.searchSubstring = function(term, opts) {

    var q =
        { vocabulary : "monarch",
          prefix : term};
    if (opts != null) {
        for (var k in opts) {
            q[k] = opts[k];
        }
    }
    if (q.category == null) {
        q.category = this.getDefaultCategories();
    }

    
    // var res=
	// this.fetchUrl(this.config.autocomplete_url+"?vocabulary=monarch&prefix="+term);
    var res= this.fetchUrl(this.config.autocomplete_url, q);

    var results = JSON.parse(res);
    var filtered = [];

    // filter dups
    for (var i =0; i < results.length; i++) {
    var rec = results[i];
    var found = false;
    for (var j =0; j < filtered.length; j++) {
        if (results[i].id === filtered[j].id || 
                (results[i].term.toLowerCase() === filtered[j].term.toLowerCase() &&
                 results[i].term.category === filtered[j].term.category)) {
        found = true;
        break;
        }
    }
    if (found === false) {
        filtered.push(rec);
    }
    
    }

    
    return filtered;
}

/*
 * Function: searchOverOntologies
 * 
 * 
 * Arguments: - term : keyword - opts : Dictionary parameter
 * 
 * Returns: Class struct as JSON
 */
bbop.monarch.Engine.prototype.searchOverOntologies = function(term, opts) {

    var results = [];

    if (/\S+:\S+/.test(term)) {
        term = this.quote(term);
    }

    var q =
        { vocabulary : "monarch",
          prefix : term};
// term : term};
    if (opts != null) {
        for (var k in opts) {
            q[k] = opts[k];
        }
    }
    if (q.category == null) {
        q.category = this.getDefaultCategories();
    }

    var url = this.config.autocomplete_url;
    // HACK
    // url = url.replace(".json", "/search.json");
    var res = this.fetchUrl(url, q);

    var results = JSON.parse(res);
    results.forEach(function(r) {
        r.label = r.term
    });
    return results;
}

// TODO
bbop.monarch.Engine.prototype.fetchReferenceInfo = function(txt, opts) {
}

bbop.monarch.Engine.prototype.getPhenotypesByEntityClass = function(id) {
    var fragmentId = this.getOntoquestNifId(id);
    var resultStr = 
        this.fetchUrl(this.config.owlsim_services_url + '/getSubClasses.json',
                      {
                          expression : "'has part' some ('inheres in part of' some "+fragmentId+")",
                          direct : "true"
                      });
    //console.log(JSON.stringify(resultStr));
    return JSON.parse(resultStr);
}


/*
 * Function: fetchDataFromResource
 * 
 * Services used: NIF federation call. See:
 * http://beta.neuinfo.org/services/resource_FederationService.html#path__federation_data_-nifId-.html
 * 
 * This currently relies on OntoQuest magic to ensure that the input ontology
 * class ID is expanded to all relevant
 * https://support.crbs.ucsd.edu/browse/LAMHDI-140
 * 
 * Arguments: q : query. Arbitrary term or NIF ID resource_id : E.g.
 * nlx_151835-1 trFunction : a function to be applied to each result object
 * which returns a transformed object project : a list of columns to project
 * (select) filters : a list of filters to be applied at fetching time Returns:
 * JSON structure { resultCount : NUM, results: [ TRANSFORMED-OBJECTS ] }
 */
bbop.monarch.Engine.prototype.fetchDataFromResource = function(query, resource_id, trFunction, projectCols, subclassQuery,filters,subclassFilters,limit,sortField,opts) {
    // Example:
	// http://beta.neuinfo.org/services/v1/federation/data/nif-0000-03216-7.json?exportType=data&q=Smith
    if (query != null) {
        var nif_id = this.getFederationNifId(query);
    }  else { var nif_id = '*'};

    var urlBase = this.config.federation_services_url;

    // presently, system maxes at 1000 results
    var LIMIT = ((typeof limit !== 'undefined') && (limit !== null)) ? limit : 1000;
    // var LIMIT = 1000;

    var params = 
    {
        exportType : "data", 
        // includeSubclasses : true,
        count : LIMIT,
        q : nif_id
    };

    if (opts != null && opts.offset != null) {
        params.offset = opts.offset;
    }

	// using the closure is determined by the calling function
    // either for the subclassQuery or subclassFilter options
    // includeSubclasses=true is being deprecated
	if (subclassQuery != null) {
		params.subclassQuery = subclassQuery;	
	}
    if (subclassFilters != null) {
        if (subclassFilters.length) {
            if (subclassFilters.length > 0) {
                params.subclassFilter = subclassFilters;
            }
        }
        else {
            // treat as map
            var fl = [];
            for (var k in subclassFilters) {
                fl.push( k + ":" + subclassFilters[k]);
            }
            params.subclassFilter = fl;
        }
    }

/*    // determine if closures should be used;
    // currently we have a whitelist of resources that have closure
    // indexing on. But the calling code can explicitly override
    // this decision by passing useClosure as a key in the options object
    var useClosure = false;
    if (opts != null && "useClosure" in opts) {
        useClosure = opts.useClosure;
    }
    else {
        // note that opts takes priority
        if (this.config.closure_resources.indexOf(resource_id) > -1) {
            useClosure = true;
        }
    }
    if (useClosure) {
        params.includeSubclasses = true;
    }
*/
    if (projectCols != null && projectCols.length > 0) {
        params.project = projectCols;
    }

    if (filters != null) {
        if (filters.length) {
            if (filters.length > 0) {
                params.filter = filters;
            }
        }
        else {
            // treat as map
            var fl = [];
            for (var k in filters) {
                //fl.push( k + ":" + this.quote(filters[k]));
                fl.push( k + ":" + filters[k]);
            }
            params.filter = fl;
        }
    }
    if (sortField != null && sortField.length > 0) {
        params.sortField = sortField
    }

    // flat results transformed into nested json objects
    var results = [];

    var resultStr = this.fetchUrl(urlBase + 'data/' +  resource_id + '.json', 
            params
            );
    var fedObj;
    if (this.config.jQuery != null) {
        // alert("parsing: "+resultStr);
        fedObj = jQuery.parseJSON(resultStr).result;
    }
    else {
        fedObj = JSON.parse(resultStr).result;
    }

    // federation queries return json of the form
    // {result: { resultCount: nnn, result: [R1, R2, ..] } }
    // we eliminate the outer result key above, and then translate the inner
	// one.

    if (trFunction == null) {
        // pass-through unchanged
        trFunction = function(x){return x};
    }
    var resultObj = null;
    if (fedObj != null) {  // this will happen if there's a 500 error
        for (var k in fedObj.result) {
            results.push( trFunction( fedObj.result[k] ) );
        }
        resultObj = {
            resultCount : fedObj.resultCount,
            results : results
        };
    } else {
        resultObj = {
            resultCount : 0,
            results : []
        }
    }
    return resultObj;
}

/*
 * Function: fetchPubFromPMID
 * 
 * Services used: NIF literature call. See:
 * http://beta.neuinfo.org/services/resource_LiteratureService.html
 * 
 * Arguments: pmid: set of pmids
 * Returns: JSON structure { results: [ PUBLICATION-OBJECTS ] }
 *
 * Example:
 * http://beta.neuinfo.org/services/v1/literature/pmid.json?pmid=22080565
 * http://beta.neuinfo.org/services/v1/literature/pmid.json?pmid=22080565&pmid=22080566
 */
bbop.monarch.Engine.prototype.fetchPubFromPMID = function(ids) {
    var urlBase = this.config.literature_services_url;
    var totalInfo = [];
    while (ids.length > 0) {
        var query = ids.splice(0, 10);
        var params = {
            pmid : query,
        };
        var resultStr = this.fetchUrl(urlBase + "pmid.json", params);
        var pubObj = JSON.parse(resultStr);
        var trFunction = function(x) {return x};
        var results = [];
        if (pubObj != null) {
            for (var i in pubObj) {
                results.push(trFunction(pubObj[i]));
            }
        }
        totalInfo = totalInfo.concat(results);
    }
    return totalInfo;
}

/*
 * Function: fetchUrl
 * 
 * Generate fetch over HTTP
 * 
 * In future this will abstract over base implementation: rhino vs jquery
 * 
 * Arguments: url : string params : string OR list OR dict
 * 
 * Returns: string - may be JSON, XML, who knows
 */
bbop.monarch.Engine.prototype.fetchUrl = function(url, params, method) {
    var data = '';
    if (params == null) {
        params = {};
    }
    console.log("FETCHING: "+url+" data="+JSON.stringify(params));
    var httpclient = require('ringo/httpclient');
    // console.log("URL: "+url);
    this._lastURL = url;
    var exchangeObj;
    if (method == 'post') {
        exchangeObj =  httpclient.post(url, params);
    }
    else {
        exchangeObj =  httpclient.get(url, params);
    }
    console.log("RESULT: "+exchangeObj);
    console.log("STATUS: "+exchangeObj.status);
    if (exchangeObj.status != 200) {
        // console.log("Status != 200. ExchangeObj source=
		// "+exchangeObj.toSource());
        throw({
            type : "fetchUrl",
            url: url,
            status: exchangeObj.status,
            message: "error fetching <"+url+"> response code=" + exchangeObj.status + " src="+exchangeObj.toSource()
        });
    }
    return exchangeObj.content;
}


// Translate OQ XML into JSON
// TODO: eliminate XML and E4X dependencies and retrieve JSON from OntoQuest
// instead
// Depends on: https://support.crbs.ucsd.edu/browse/LAMHDI-216
bbop.monarch.Engine.prototype._translateOntoQuestXmlToJson = function(xmlStr, query_id) {

    var info = {}; // payload

    var xml = this.parseXML(xmlStr); // TEMPORARY - OQ will soon return JSON
    if (xml != null) {
        // console.log(xml);
        var classes = xml.data.classes;
        // print("#CLASSES: "+classes.length());
        if (classes.length() > 1) {
            console.warn("Expected one class: " + classes.length);
        }
        if (classes.length == 0) {
            console.error("Invalid xml: "+xmlStr);
            throw({
                type : "ontoquest",
                message: "invalid XML: " + xmlStr,
            });
        }
		var c = '<>';
		if (typeof classes != 'undefined') {
			c = classes[0].class;
			info = this._translateOntoQuestClassXml(c);
		} else {
			info = {};
		}
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
	// MESH can be both an pheno or disease.  ACK!
    if (id.indexOf("OMIM") == 0 || id.indexOf("DOID") == 0 || id.indexOf("ORPHANET") == 0) {
        category = 'disease';
    }
    else if (id.indexOf("HP") == 0 || id.indexOf("MP") == 0 || id.indexOf("ZP") == 0) {
        category = 'phenotype';
    }
    else if (id.indexOf("UBERON") == 0 || id.indexOf("FMA") == 0 || id.indexOf("MA") == 0 || id.indexOf("ZFA") == 0  || id.indexOf("CL") == 0) {
        category = 'anatomy';
    }
    info.category = category;

    // NOTE: OQ puts the definition into the comments field and suffixes
	// [definition] on the end. Why?
    if (c.comments != null && c.comments.comment[0] != null) {
        info.comments = [c.comments.comment[0].toString()];
    }
    if (c.definition != null) {
        // sometimes OQ gives this...
        info.definition = c.definition.toString();
    }
    if (c.synonyms != null) {
        // note: OQ appears to have lost the ability to discriminate by syn
		// type;
        // for now we map all to exact syn
        info.has_exact_synonym = [];
        for (var i in c.synonyms.synonym) {
            var syn = c.synonyms.synonym[i].toString();
            info.has_exact_synonym.push(syn);
        }
        
    }
    for (var i in c.other_properties.property) {
        var p = c.other_properties.property[i];
        var k = p['@name'];
        var v = p.toString();
        if (k == "IAO_0000115") {
            // sigh
            console.log("DEF: = "+v);
            info.definition = v;
            continue;
        }
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


// very basic uniquifying of an array.

bbop.monarch.Engine.prototype.unique = function unique(arr) {
    var u = {}, a = [];
    for(var i = 0, l = arr.length; i < l; ++i){
        if(!u.hasOwnProperty(arr[i])) {
            a.push(arr[i]);
            u[arr[i]] = 1;
        }
    }
    return a;
}

/*
 * Function:uniquifyResultSet
 * 
 * Returns: array of hashes
 * 
 * Arguments: - resultObj   : array of hashes in the monarch format
 *            - uniqOnKeys  : array of keys in which we want to make
 *                            unique, function looks for key.id when
 *                            making a row unique
 *            - isSourceNew : boolean, set to true if uniquifying
 *                            rows from mutliple sources
 *            - isRefNew    : boolean, set to true if uniquifying
 *                            references from mutliple sources
 */
bbop.monarch.Engine.prototype.uniquifyResultSet = function(resultObj,uniqOnKeys,isSourceNew,isRefNew) {
	var uniqResults = [];
    var unique = {};
    var count = 0;
    
    if (resultObj){
    	for (var i=0; i<resultObj.length; i++){
    		var row = '';
    		if (uniqOnKeys){
    			for (var j=0; j<uniqOnKeys.length; j++){
    				var uniqOnKey = uniqOnKeys[j];
    				if ((resultObj[i][uniqOnKey].id)&&
 				       (resultObj[i][uniqOnKey].id.match(/^omim/))){
    				    resultObj[i][uniqOnKey].id = 
    					    resultObj[i][uniqOnKey].id.replace("omim","OMIM");
    				}
    			    row += resultObj[i][uniqOnKey].id;
    			}
    		} else {
    			row = resultObj[i].id;
    		}
         
    		if (row in unique){
    			//If we need to add the source to source list
    			if (isSourceNew == 'true' && resultObj[i].source[0].id){
    				var index = unique[row];
    				uniqResults[index].source = 
    					  uniqResults[index].source.concat(resultObj[i].source);
    				//Make sure source list is still unique
    				var uniqSource = this.uniquifyResultSet(uniqResults[index].source);
    				uniqResults[index].source = uniqSource;
    		    }
    			//If we need to add the ref to ref list
    			if (isRefNew == 'true' && resultObj[i].references){
    				var index = unique[row];
    				uniqResults[index].references = 
    					uniqResults[index].references.concat(resultObj[i].references);
    				//Make sure ref list is still unique
    				var uniqRef = this.uniquifyResultSet(uniqResults[index].references);
    				uniqResults[index].references = uniqRef;
    		    }
            } else {
            	if (row){
            	    uniqResults = uniqResults.concat(resultObj[i]);
            	    unique[row] = count++;
            	}
            }
    	}
    	return uniqResults;
    } else {
    	return [];
    }
}

// translates an ID to a canonical form used by OntoQuest and other NIF services
bbop.monarch.Engine.prototype.getFederationNifId = function(id) {
    if (id.indexOf("http:") == 0) {
        var parts = id.split("/");
        id = parts[parts.length-1];
    }
    if (id.indexOf("_") > -1) { 
            id = id.replace("_",":");
    }
    return id;
}

bbop.monarch.Engine.prototype.getOntoquestNifId = function(id) {
    if (id.indexOf("http:") == 0) {
        var parts = id.split("/");
        id = parts[parts.length-1];
    }
    if (id.indexOf(":") > -1) {
        id = id.replace(":","_");
    }
    return id;
}

bbop.monarch.Engine.prototype.getOboId = function(id) {
    if (id.indexOf("_") > -1) {
        id = id.replace("_",":");
    }
    return id;
}

bbop.monarch.Engine.prototype.quote = function(v) {
    // do not quote numbers or anything that looks like a number
    if (v.match(/^[0-9]+$/) != null) {
        return v;
    }
    v = v.replace(/"/g,'\\"');
    return '"' + v + '"';
}

/*
 * Function: resolveClassId
 * 
 * Resolves one of the many identifier styles to a canonical NIF-style class ID
 * 
 * Example: resolveClassId("OMIM:123456") returns "OMIM_123456"
 * 
 * 
 * Arguments: id : string
 * 
 * Returns: NIF-style ID
 */
bbop.monarch.Engine.prototype.resolveClassId = function(id) {
    id = this.getOntoquestNifId(id);
    console.log("Resolved:"+id+"; now testing if exists in OntoQuest ");
    var cls = this.fetchClassInfo(id,{level:0});
	console.log("Fetched:"+JSON.stringify(cls));
    if (cls == null || cls.id == null || cls.id == "") {
        return id;
    }
    // hardcode alert - see
	// https://github.com/monarch-initiative/monarch-app/issues/33
//    if (cls.id.indexOf("DOID") == 0) {
		//check for equivalent classes
		console.log("Checking for equivalent classes to redirect");
        var altcls = this.fetchClassInfo(id,{level:1});
        for (var k in altcls.relationships) {
            var rel = altcls.relationships[k];
            if (rel.property.id == "equivalentClass") {
                var object = rel.object;
                console.log("Mapped using equivalence to:"+object.id);
				cls = this.fetchClassInfo(object.id,{level:0});
				break;
            }
        }

//    }
    
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

        // ////////////////////////////////////////
        // generic
        "@base": "http://monarch-initiative.org/",
        id : "@id",
        type : {"@id":"rdf:type", "@type":"@id"},

        // ////////////////////////////////////////
        // Standard ID spaces
        //
        // TODO - standardize across all of NIF
        obo : "http://purl.obolibrary.org/obo/",
        DOID: "http://purl.obolibrary.org/obo/DOID_",
        ORPHANET: "http://purl.obolibrary.org/obo/ORPHANET_",
        OMIM: "http://purl.obolibrary.org/obo/OMIM_", // TODO - we could use
        MESH: "http://purl.obolibrary.org/obo/MESH_", // TODO - we could use
														// omim.org but isn't
														// linked data
        PMID: "http://www.ncbi.nlm.nih.gov/pubmed/", // TODO - use a linked
														// data URI?
        HP: "http://purl.obolibrary.org/obo/HP_",
        MP: "http://purl.obolibrary.org/obo/MP_",
        ZP: "http://purl.obolibrary.org/obo/ZP_", // TODO
        GENO: "http://purl.obolibrary.org/obo/GENO_",
        ECO: "http://purl.obolibrary.org/obo/ECO_",
        RO: "http://purl.obolibrary.org/obo/RO_",
        SO: "http://purl.obolibrary.org/obo/SO_",
        BFO: "http://purl.obolibrary.org/obo/BFO_",
        monarch: "http://monarch-initiative.org/",
        MGI: "http://monarch-initiative.org/data/MGI_", // TODO
        NCBIGene: "http://purl.obolibrary.org/obo/NCBIGene_",
        MedGen: "http://purl.obolibrary.org/obo/MedGen_",
        SIO: "http://semanticscience.org/resource/SIO_",
        faldo: "http://biohackathon.org/resource/faldo#",
        dc: "http://purl.org/dc/terms/",
        foaf: "http://xmlns.com/foaf/0.1/",
        rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
        rdfs: "http://www.w3.org/2000/01/rdf-schema#",
        xsd: "http://www.w3.org/2001/XMLSchema#",
        owl: "http://www.w3.org/2002/07/owl#",

        oboInOwl: "http://www.geneontology.org/formats/oboInOwl#",

        // ////////////////////////////////////////
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

        // ////////////////////////////////////////
        // Monarch specific stuff

        Association: "SIO:000897", // we may reconsider this

        // this key connects a general info bag to a set of
        // phenotype annotations.
        //
        // we need a somewhat fake property to connect these in the RDF
        // consider using IAO
        phenotype_associations: "rdfs:seeAlso",
        genotype_associations: "rdfs:seeAlso",
        pathway_associations: "rdfs:seeAlso",

        // TODO - verify this w/ Matt
        // properties:
        has_genotype: "GENO:0000222",   // TODO: why does a relationship have a
										// class id?
        has_background: "GENO:0000010",

        // classes:
        environment : "GENO:0000099",
        genotype : "GENO:0000000",
        intrinsic_genotype : "GENO:0000000",
        extrinsic_genotype : "GENO:0000524",
        effective_genotype : "GENO:0000525",
        genomic_variation_complement : "GENO:0000009", // GENO_0000520?
        // ExperimentalGenotype : "GENO:0000438",
        genomic_background : "GENO:0000010",
        // genetic_context : "GENO:0000427",
        sequence_alteration_collection : "GENO:0000025",
        variant_loci : "GENO:0000027", // variant_locus_collection?
        // reference_loci : "GENO:0000024", //reference_locus_collection?
        variant_locus : "GENO:0000481", // variant_locus //"GENO:0000062",
										// //sequence-variant_gene_locus
        reference_locus : "GENO:0000036", // reference_locus //GENO_0000501,
											// wild-type locus?
        gene_locus : "GENO:0000014",  // GENO_0000184
        sequence_alteration : "SO:0001059",
        zygosity : "GENO:0000133", // zygosity
        chromosome : "GENO:0000323", // chromosome
        chromosomal_region : "GENO:0000390", // chromosomal_region
        morpholino : "GENO:0000417", // morpholino

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

        // Note: we will revisit this after discussions of a generic association
		// model
        disease: "monarch:disease",
        phenotype: "monarch:phenotype",

    };
    return ctxt;
}


bbop.monarch.Engine.prototype.expandIdToURL = function(id) {
    var pos = id.indexOf(":");
    var prefix = id.slice(0,pos);
    var suffix = id.slice(pos+1);
    var ctxt = this.getJsonLdContext();
    if (ctxt[prefix] != null) {
        return ctxt[prefix] + suffix;
    }
    return ctxt['@base'] + suffix;
}

bbop.monarch.Engine.prototype.getConfig = function(t) {
    var s = JSON.parse(fs.read('conf/'+t+'.json'));
    return s;
}

