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

var env = require('serverenv.js');
var _ = require('underscore');
var bbop = require('bbop');
var eSummary = require('esummary.js');

var logFetchTimes = env.getEnv().USE_LOG_FETCH;
if (logFetchTimes && logFetchTimes === '1') {
    console.log('#USE_LOG_FETCH enabled');
    logFetchTimes = true;
}
else {
    logFetchTimes = false;
}

if (!env.isRingoJS()) {
    var AsyncRequest = require('request').defaults({
                                                    forever: true
                                                    });
    var WaitFor = require('wait.for');
}


if (typeof bbop == 'undefined') { var bbop = {};}
if (typeof bbop.monarch == 'undefined') { bbop.monarch = {};}
exports.bbop = bbop;


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
 * Arguments: opts : associative array. Keys: config
 */

bbop.monarch.Engine = function(opts) {
    if (bbop.monarch.defaultConfig != null) {
        this.config = bbop.monarch.defaultConfig;
        this.log("bbop.monarch.Engine Using pre-set configuration: ");
    }
    else {
        this.log("bbop.monarch.Engine Using default configuration");
        this.config = {};
    }
    
    if (bbop.monarch.golrConfig != null) {
        this.config.golr = bbop.monarch.golrConfig;
        this.log("bbop.monarch.Engine Using pre-set golr configuration: ");
    } else {
        this.log("bbop.monarch.Engine WARN: No GOlr configuration set");
    }
    
    if (this.config.owlsim_services_url == null) {
        this.config.owlsim_services_url = "http://monarchinitiative.org/owlsim";
    }

    this.config.summary_categories = this.getConfig('summary_categories');

    //this.log("api.js config: "+JSON.stringify(this.config));

    if (env.isRingoJS()) {
        // RingoJS
        this.fetchUrlImplementation = function(url) {
            var httpclient = require('ringo/httpclient');
            this.log("URL: "+url);
            var exchangeObj =  httpclient.get(url);
            this.log("RESULT: "+exchangeObj);
            this.log("STATUS: "+exchangeObj.status);
            return exchangeObj.content;
        };
    }
    else {
        this.fetchUrlImplementation = function(url) {
            var requestResult = WaitFor.for(AsyncRequest.get, url);
            return requestResult.body + '';
        };
    }

    this.debugInfo =
        {
            dateServerStarted : new Date(Date.now()),
            serverInfo :
                env.isRingoJS() ?
                    require('ringo/subprocess').command("uname -a")
                    :
                    require("child_process").exec('uname -a').unref(),
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
        this.log("Setting config "+k+" = "+c[k]);
        this.config[k] = c[k];
    }

}

bbop.monarch.Engine.prototype.apiVersionInfo = function() {
    // TODO: fill this in automatically with external config file value?
    return "monarch-api-2014-12-19";
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
/* TODO Delete me
bbop.monarch.Engine.prototype.fetchDiseaseInfo = function(id, opts) {
    var engine = this;
    if (this.cache != null) {
        this.log("Checking cache for "+id);
        var cached = this.cache.fetch('disease', id);
        if (cached != null) {
            if (cached.apiVersionInfo == null || cached.apiVersionInfo != this.apiVersionInfo()) {
                this.log("cached version is out of date - will not use");
            }
            else {
                //this.log("Found cached for "+id);
                return cached;
            }
        }
    }
    else {
        this.log("No cache for this engine");
    }

    // every disease is represented as a class in the ontology
    var obj = this.fetchClassInfo(id, {level:1});

    obj.apiVersionInfo = this.apiVersionInfo();



    // TEMP; workaround needed for orphanet
    if (id.match(/ORPHANET/)) {
        var resource = {id : 'nif-0000-21306-1', label : 'ORPHANET'};
        this.log("workaround for orphanet -- looking up label in "+resource.id);
        // look it up in the orphanet resource to get the label
        var instlabel = engine.fetchInstanceLabelByType(id,resource.id,'disease');
        this.log('FOUND:'+JSON.stringify(instlabel));
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
    var heritability = [];
    // we want to fetch phenotypes from HPO annotations by keying using
    // OMIM, ORPHANET, DECIPHER IDs. Due to the way the merged DO works,
    // these *should* be the primary IDs.
    // we also might want the closure - e.g. for a generic disease,
    // get phenotypes for specific forms of this disease

    // for now, just use the entry point ID
    var disease_ids = [id];
    var engine = this;
    for (var i=0; i<disease_ids.length; i++) {

        // do not perform expensive queries for high-level/broad diseases
        if (obj.fragment == 'DOID_630'      ||    // genetic disease
            obj.fragment == 'DOID_4'        ||    // disease
            obj.fragment == 'DOID_150'      ||    // disease of mental health
            obj.fragment == 'DOID_0014667'  ||    // disease of metabolism
            obj.fragment == 'DOID_0060035'  ||    // medical disorder
            obj.fragment == 'DOID_14566'    ||    // cellular proliferation
            obj.fragment == 'DOID_225'      ||    // syndrome
            obj.fragment == 'DOID_7'              // anatomical entity
           ) {
            continue;
        }

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

        //search the various associations for pubs to be added to lit tab, with inferrences
        //good test: OMIM_154700
        literature = literature.concat(engine.makeLiteratureAssociations(phenotype_associations,'phenotype'));
        literature = literature.concat(engine.makeLiteratureAssociations(gene_associations,'gene'));
        literature = literature.concat(engine.makeLiteratureAssociations(alleles,'variant'));

        // old
        // resultObj = this.fetchPathwaysForDisease(id);
        // pathways = pathways.concat(resultObj.results);

        resultObj = engine.fetchAssertedDiseasePathwayAssociations(id,obj.label);
        pathway_associations = pathway_associations.concat(resultObj);
        resultObj = engine.fetchInferredDiseasePathwayAssociations(id,obj.label,gene_associations);
        pathway_associations = pathway_associations.concat(resultObj);

        //TODO: add pathway_association refs to literature
    
        pmids = literature.map( function(r) { return r.pub; });
        pmids = engine.unique(pmids);
        pmidinfo = pmidinfo.concat(engine.fetchPubFromPMID(pmids));
        resultObj = engine.fetchHeritabilityForDisease(id);
        heritability = heritability.concat(resultObj.results);
    }  //end loop through disease ids




   

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
 *//*

    obj.annotation_sufficiency = engine.getAnnotationSufficiencyScoreFromAssociations(phenotype_associations);

    obj.gene_associations = gene_associations;
    obj.phenotype_associations = phenotype_associations;

    // get phenotype list..
    obj.phenotype_list = engine.getPhenotypeList(phenotype_associations);

    obj.models = models;
    obj.similar_models = {'10090' : similar_mice};
    obj.alleles = alleles;
    obj.sim = sim
    obj.similar_diseases = similar_diseases;
    // obj.pathways = pathways;
    obj.pathway_associations = pathway_associations;
    obj.literature = literature;
    obj.pmidinfo = pmidinfo;
    obj.heritability = heritability;

    this.addJsonLdContext(obj);

    if (this.cache != null) {
        this.cache.store('disease', id, obj);
    }
    //this.log('pathway_assoc'+JSON.stringify(obj.pathway_associations,null,' '));
    return obj;
}
*/

bbop.monarch.Engine.prototype.getPhenotypeList = function(assocs) {
    var res = [];
    for (var k in assocs) {
    var ph = assocs[k].phenotype;
    var item = { "id": ph.id, "label": ph.label, "observed": "positive"};
    res.push(item);
    }
    return res;
};

/* TODO Delete me
bbop.monarch.Engine.prototype.makePhenotypeHistogramFromAssociations = function(assocs) {
    var distro = [];

    var engine = this;
    
    //make unique hash of phenotypes given categories in config
    //fetch the counts from the profileinfo function
    var info_profile = engine.getInfoProfileFromAssociations(assocs);

    engine.log("PROFILE:"+JSON.stringify(info_profile));

    //for now, this won't be interactive, but just a summary.  we ought to make this it's own owlsim service call.
    var categorical_scores = info_profile.features.categorical_scores;
    categorical_scores.forEach( function(s) {
        var d = {};
        d.item = {id : s.id, label : s.label};
        d.value = s.stats.n;          
        distro.push(d);
    });

    return distro;
}
*/

//this function is pubmed specific, but it shouldn't be for the lit tab.  
//TODO make this more generic
/* TODO delete me
bbop.monarch.Engine.prototype.makeLiteratureAssociations = function(assocs,type) {
    var lit = [];
    var pmids = [];
    var engine = this;
    //engine.log("ASSOCS ("+type+":"+JSON.stringify(assocs));
    if (assocs != null) {
        for (var i = 0; i < assocs.length; i += 1) {
            var assoc = assocs[i];
            var obj = {};
            if (typeof assoc[type] == 'undefined' || assoc[type] == null) {
                obj = assoc['has_'+type];
            } else {
                obj = assoc[type];
            }
            var source = assoc.source;
            var ref = assoc.references;
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
                            type: type,
                            obj: obj,
                            source: source,
                            pub: num,
                            };
                        lit.push(citation);
                    }
                }
            }
        }
    }
    return lit;
}
*/

/*
 * Function: fetchDiseaseGeneAssocsInfo
 *
 * This function is similar to fetchDiseaseInfo, but it only returns the genes
 * associated with a disease rather than all the disease info.
 *
 * It is called by fetchPhenotypeInfo on the diseases associated with the phenotype
 * to find genes associated with the phenotype.
 */
/* TODO delete me
bbop.monarch.Engine.prototype.fetchDiseaseGeneAssocsInfo = function(id) {
    var engine = this;
    if (this.cache != null) {
        var cached = this.cache.fetch('disease', id.replace(':', '_'));
        if (cached != null) {
            if (cached.apiVersionInfo != null && cached.apiVersionInfo == this.apiVersionInfo()) {
                return cached.gene_associations;
            }
        }
    }
    return this.fetchDiseaseGeneAssociations(id, 'disease');
}
*/
bbop.monarch.Engine.prototype.getAnnotationSufficiencyScoreFromAssociations = function(assocs) {
    var engine = this;

    var info_profile = engine.getInfoProfileFromAssociations(assocs);

    return  info_profile.scaled_score

}

bbop.monarch.Engine.prototype.getInfoProfileFromAssociations = function(assocs) {
    var engine = this;
    //this.log('assoc:'+JSON.stringify(assocs,null,' '));

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

    return info_profile;

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
/* TODO delete me
bbop.monarch.Engine.prototype.fetchPhenotypeInfo = function(id, opts) {
    var engine = this;
    //this.log("Phenotype: "+id);
    if (this.cache != null) {
        var cached = this.cache.fetch('phenotype', id);
        if (cached != null) {
            if (cached.apiVersionInfo == null || cached.apiVersionInfo != this.apiVersionInfo()) {
                this.log("cached version is out of date - will not use");
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
    // - OMIM diseases by phenotype - DONE
    // * GENOMIC
    // - OMIM genes by phenotype
    // - model organism genes or genotypes with this phenotype (requires
    // uberpheno plus reasoning)

    var genes = [];
    var literature = [];
    var pmids = [];
    var pmidinfo = [];
    
    // ** OMIM **

    var resultObj = this.fetchOmimDiseasePhenotypeAsAssocations(id);
    obj.disease_associations = resultObj.results;

    var numResults = resultObj.resultCount;
    
    /* This finds genes related to the phenotype by inferring from the disease-phenotype
     * associations that exist in the disease_associations object. This iterates through
     * the diseases associated with the phenotype and finds the genes the diseases are
     * associated with.
     *
     * There is temporarily an arbitrary limit on the diseases that are iterated through
     * due to taking far too long to iterate through several hundred diseases. Eventually,
     * this limit will be less arbitrary because there will be a way to sort the importance
     * or relevance of disease to phenotypes (and we can choose to look through only the
     * most important diseases).
     * 
     * TODO: Sort diseases by relevance and iterate through only the most relevant diseases.
     * TODO: Find more related genes by iterating through genotypes related to the phenotype
     * and finding genes through this genotype-phenotype association. *//*

    //TODO this doesn't actually add the phenotype to the association object!!! FIXME

    var LIMIT = 30;     // arbitrary and should later be sorted by disease-phenotype
                        // relationship strength score
    for (var i = 0; i < obj.disease_associations.length && i < LIMIT; i++) {
        var disease = obj.disease_associations[i].disease;
        genes = genes.concat(this.fetchDiseaseGeneAssocsInfo(disease.id));
    }
    var keys = ["gene", "disease"];
    obj.gene_associations = this.uniquifyResultSet(genes, keys, true, true);


    // disease-pairs matched using this phenotype (EXPERIMENTAL)

    var taxon_ids = [10090,7955,6239,9606,7227];
    obj.genotype_associations = [];
    taxon_ids.forEach(function(tax) {
        obj.genotype_associations = obj.genotype_associations.concat(engine.fetchGenoPhenoAsAssociationsBySpecies(id,tax.toString(),'phenotype').results);
    });


    // ** REFERENCES **
    //make the literature association objects for the literature tab
    literature = literature.concat(engine.makeLiteratureAssociations(obj.disease_associations,"disease"));
    literature = literature.concat(engine.makeLiteratureAssociations(obj.gene_associations,"gene"));
    literature = literature.concat(engine.makeLiteratureAssociations(obj.genotype_associations,"genotype"));
    literature.forEach( function(r) { pmids.push(r.pub); pmids = engine.unique(pmids)});
    pmidinfo = pmidinfo.concat(engine.fetchPubFromPMID(pmids));
    obj.literature = literature;
    obj.pmidinfo = pmidinfo;

    // ** GENES **
    // TODO: based on the genotype_associations fetched, we shold be able to get
    // the implicated genes

    //make the gene associations.  this does make repetitive data, but i don't have to make another call.  yay.
    obj.gene_associations = obj.gene_associations.concat(this.makeInferredGenePhenotypeAssociations(obj.genotype_associations));    

    if (this.cache != null) {
        this.cache.store('phenotype', id, obj);
    }

    return obj;
}
*/

//TODO make this more general to make any kind of inferred genephenoassoc (such as using gene-disease)
bbop.monarch.Engine.prototype.makeInferredGenePhenotypeAssociations = function(assocs) {
    var genes = {};
    var gene_assocs = [];
    if (assocs != null) {
        for (var i = 0; i < assocs.length; i += 1) {
            var assoc = assocs[i];
            var these_genes = {};
            //this.info("ASSOC:"+JSON.stringify(assoc));
            if (assoc.has_genotype != null && typeof assoc.has_genotype != 'undefined' && typeof assoc.has_genotype.has_affected_genes != 'undefined') {
                //make a unique set of genes with a hash
                var geneList = assoc.has_genotype.has_affected_genes;
                for (var j=0; j<geneList.length; j+=1) {
                    these_genes[geneList[j].id] = geneList[j];
                }
            }
            genes+= these_genes;
            //    make associations
            for (var gene in these_genes) {
                this.log("Expanding association to gene "+gene);
                var new_assoc = {};
                new_assoc.gene = these_genes[gene];
                new_assoc.type = "Association",
                new_assoc.phenotype = assoc.has_phenotype;
                new_assoc.references = assoc.references;
                new_assoc.source = assoc.source;
                new_assoc.resource = assoc.resource_id;
                new_assoc.inferred_from = {
                    type : "genotype",
                    id : assoc.has_genotype.id,
                    label : assoc.has_genotype.label
                };
                gene_assocs = gene_assocs.concat(new_assoc);
            }
        }
    }
    this.log('created '+gene_assocs.length+' associations');
    gene_assocs = this.uniquifyResultSet(gene_assocs, ["gene"], false, false);
    return gene_assocs;
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
                this.log("cached version is out of date - will not use");
            }
            else {
                this.log("Using Cached version of "+id);
                return cached;
            }
        }
    }
    var engine = this;
    var tax = engine.mapMatchIdentifierToTaxon(id);
    var obj = {id : id};
    var geno = {};
    if (typeof tax != 'undefined' && tax != {} && tax != null) {
        console.log("Fetching genotype from taxon "+tax.label);
        obj = engine.fetchGenotype(id,tax.id.replace(/NCBITaxon:/,''));
    }

//    engine.log("ULTIMATEGENO:"+JSON.stringify(obj),' ');

    if (obj == null) {
        obj = {};
        obj.id = id;
    }

    var taxon_ids = [10090,7955,6239,9606,7227];
    obj.phenotype_associations = [];
    taxon_ids.forEach(function(tax) {
        obj.phenotype_associations = obj.phenotype_associations.concat(engine.fetchGenoPhenoAsAssociationsBySpecies(id,tax.toString()).results);
    });

    obj.phenotype_list = engine.getGenotypePhenotypeList(obj.phenotype_associations);
    
    obj.annotation_sufficiency = engine.getAnnotationSufficiencyScoreFromAssociations(obj.phenotype_associations);

    obj.apiVersionInfo = engine.apiVersionInfo();

    // ** REFERENCES **
    var literature = [];
    var pmids = [];
    var pmidinfo = [];

    literature = literature.concat(engine.makeLiteratureAssociations(obj.phenotype_associations,"phenotype"));
    literature.forEach( function(r) { pmids.push(r.pub); pmids = engine.unique(pmids)});
    pmidinfo = pmidinfo.concat(engine.fetchPubFromPMID(pmids));

    obj.literature = literature;
    obj.pmidinfo = pmidinfo;

    if (this.cache != null) {
        this.cache.store('genotype', id, obj);
    }

    return obj;
}

bbop.monarch.Engine.prototype.getGenotypePhenotypeList = function(assocs) {
    var res = {}
    var phenotypes=[];
    // first get species
    if (assocs == null || assocs == [] || assocs == {} || typeof assocs == 'undefined') {
        return res;
    }
    //engine.log("ASSOCS"+JSON.stringify(assocs));
    if (assocs[0] != null && assocs[0] != [] && typeof assocs[0] != 'undefined') {
        res.species = assocs[0].has_genotype.taxon.label;
    }
    for (k in assocs) {
        var assoc = assocs[k];
        if (typeof assoc.has_phenotype != 'undefined' && typeof assoc.has_phenotype.type != 'undefined') {
            var pheno = assoc.has_phenotype.type;
            pheno.observed = "positive";
            phenotypes.push(pheno);
        }
    }
    res.phenotype_list = phenotypes;
    return res;

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
/* TODO DELETE ME
bbop.monarch.Engine.prototype.fetchGeneInfo = function(id, opts) {
    var engine = this;
    var gene = {};
    
    //a bit of id scrubbing for queries where it isn't refactored 
    id  = id.replace(/NCBI[Gg]ene_/,"NCBIGene:");  
    gene.id = id;
    
    if (engine.cache != null) {
        var cached;
        try {
            cached = engine.cache.fetch('gene', id);
        } catch (err) {
            console.error("caught exception "+err+"for gene "+ id);
        }
        if (cached != null) {
            if (cached.apiVersionInfo == null || cached.apiVersionInfo != engine.apiVersionInfo()) {
                engine.log("cached version is out of date - will not use");
            }
            else {
                return cached;
            }
        }
    }
    
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
    
    //Add API version
    gene.apiVersionInfo = engine.apiVersionInfo();

    // This will call MyGene services to get the basic gene information
    // can be augmented a lot.
    // See http://mygene.info/v2/api  
    //Remove NCBI prefix
    var obj = engine.fetchGeneInfoFromMyGene(id.replace(/NCBI_?[Gg]ene:/,""));
    gene.xrefs = [];
    if (obj.source == "NOT FOUND") {
        // couldn't find the gene from MyGene, so look it up in our
        // mapping table
        var mappings = engine.mapGeneToNCBIgene(id);
        // let's just take the first one for now, if there's >1
        var ncbigene_ids = Object.keys(mappings);
        var ncbigene = {};
        if (ncbigene_ids.length > 0) {
            ncbigene = mappings[ncbigene_ids[0]];
            if (ncbigene.id){
                var ncbi_id = ncbigene.id;
                ncbi_id = ncbi_id.replace(/NCBI_?[Gg]ene:/,'');
                ncbigene.ncbi_id = ncbi_id;
            }
        // TODO get all xrefs
            var ncbi_keys = Object.keys(ncbigene);
            ncbi_keys.forEach(function(r) {
                gene[r] = ncbigene[r];
            });
        }
    } else {
        //TODO refactor fetchGeneInfoFromMyGene to return the gene object in our style?
        var init_gene = {
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
            //not sure if the reference should be NCBI gene? should it reference itself?
            references : [
                { id:'NCBIGene:'+obj.entrezgene,
                  source : 'NCBIGene'
                }
            ],
            sources : [ {label : "MyGene" } ]
        };
        
        var init_keys = Object.keys(init_gene);
        init_keys.forEach(function(r) {
            gene[r] = init_gene[r];
        });
        //refactor to new function - so that any genomic feature has coordinates with the same structure
        //see variants
        if (obj.map_location){
            gene.location = obj.map_location;
        }
        //TODO refactor Ensembl -> ENSEMBL
        if (obj.ensembl){
            if (obj.ensembl.gene){
                gene.xrefs.push({ 
                    id:'Ensembl:'+obj.ensembl.gene,
                    source : 'Ensembl'
                    });
            }
        }
    }
  
    if (typeof gene.ncbi_id != 'undefined') { 
        gene.taxon = engine.fetchTaxonForGene(gene.ncbi_id.toString());
        gene.synonyms = engine.getGeneSynonyms(gene.ncbi_id.toString());
    }

    
    // obj.kegg_stuff = this.mapNCBIGeneToKO(id);
    // TODO: how should i handle multiple mappings to ncbi?
    var genePathways = engine.fetchPathwaysForGene(gene.id);
    if (genePathways == null || genePathways.pathways == null) {
        engine.warn("No pathway info for "+gene.id);
    }
    else {
        // gene.pathways = pathwayInfo.pathways;
        var pathway_associations = [];
        // this.log('GENEPATHWAYS:'+JSON.stringify(genePathways));
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

    // ** XREFS / ALTIDs **
    var geneMap = engine.fetchEquivalentGeneIds(gene.id);
    gene.xrefs = gene.xrefs.concat(engine.filterXrefsForGene(geneMap,
                                                             gene.xrefs));
 
    // ** DISEASES AND INFERRED PHENOTYPES **
    // direct associations
    // can filter this based on taxon - right now we only have human diseases
    if (gene.taxon && gene.taxon.id == 'NCBITaxon:9606') {
        disease_associations = engine.fetchDiseaseGeneAssociations(gene.id,'gene');
    
        disease_associations = disease_associations.filter(function(d){
            return d.gene.id === gene.id;});
        
        disease_associations = 
            engine.collapseEquivalencyClass(
                    disease_associations,["gene"],'disease',true);
    
        // ** PHENOTYPES **
        // inferred based on disease associations
        if (disease_associations){
            for (var i=0;i < disease_associations.length; i++){
                var phenoAssoc = 
                    engine.fetchDiseasePhenotypeAsGeneAssocations(disease_associations[i].disease.id,gene);
                phenotype_associations = phenotype_associations.concat(phenoAssoc);
            }
            //Uniquify phenotype associations
            var uniqResults = 
                engine.uniquifyResultSet(phenotype_associations,["gene","phenotype","disease"],false,true);
            phenotype_associations = uniqResults;
        }
    } else {
        engine.info("Skipping disease lookup since gene is not human");
    }

    // This code is generate associations for tables using ids other than NCBI
    // gene
    // typically for model organisms.
    //TODO: refactor - this is very very costly.  probably need to just standardize on NCBI gene for now, and add NCBI genes to the mod views upstream.
    if (gene.xrefs[0]){
            
        // Check to make sure gene is the same for each result
        for (var i=0;i < gene.xrefs.length; i++){
            //Generate cross references table
            if (xrefs[gene.xrefs[i].source]){
                xrefs[gene.xrefs[i].source] =  
                    xrefs[gene.xrefs[i].source].concat({id: gene.xrefs[i].id});
            } else {
                xrefs[gene.xrefs[i].source] = [];
                xrefs[gene.xrefs[i].source] =  
                    xrefs[gene.xrefs[i].source].concat({id: gene.xrefs[i].id});
            }
            var g = gene.xrefs[i];
            if (!(/FB|MGI|ZFIN|NCBIGene|Ensembl/i.test(g.id))) {
                engine.info("skipping lookup of "+g.id);
                continue;
            }
            
            var phenoObj = engine.fetchGenePhenotypeAsAssociation(g.id,gene,gene.taxon);
    
            var genoTypeObj = engine.fetchGeneGenoTypeAsAssociation(gene.xrefs[i].id,
                                                                     gene.xrefs[i].source,
                                                                     gene);
            
            var orthoObj = engine.fetchGeneOrthologAsAssociation(gene.xrefs[i].id,gene.label,gene.id);
            
            var alleleObj = engine.fetchGeneAlleleAsAssociation(gene.xrefs[i].id,
                                                              gene,gene.taxon.id);
            
            phenotype_associations = phenotype_associations.concat(phenoObj.results);
            alleles = alleles.concat(alleleObj);
            genotype_associations = genotype_associations.concat(genoTypeObj);
            orthologs = orthologs.concat(orthoObj);
        } //end loop over gene.xrefs    
    }


    engine.log("ORTHOS:"+JSON.stringify(orthologs));

    // Generate human-genotype and human-allele relationships
    // HACK - This is a hardcode based on NCBI taxon id, this should be changed
    // eventually to a non-hardcoded approach
    
    if ((gene.taxon) && (gene.taxon.id)) {
        if (gene.taxon.id.toString() === '9606'){
              
             //TODO Add genotypes for humans
             /*var genoTypeObj = engine.fetchGeneGenoTypeAsAssociation(gene.id,
                                                                     'human',
                                                                     gene); *//*
             var alleleObj = engine.fetchGeneAlleleAsAssociation(gene.id,
                                                                 gene,
                                                                 gene.taxon.id);
             
             //genotype_associations = genotype_associations.concat(genoTypeObj);
             alleles = alleles.concat(alleleObj);
        }
    }
    // HACK to generate content for MGI IDs
    // that are not found in mygene or our lookup table
    if (id.match(/MGI/)&&(!gene.ncbi_id)) {
        var formID = id.replace(/MGI_/,'MGI:');
        gene.taxon = {};
        gene.taxon.id = 'NCBITaxon:10090';
        gene.taxon.label = 'Mus musculus';
        gene.id = formID;
        gene.label = formID;

        var phenoObj = engine.fetchGenePhenotypeAsAssociation(gene.id,gene,gene.taxon);    
        var genoTypeObj = engine.fetchGeneGenoTypeAsAssociation(formID,
                                                              'MGI',
                                                              gene);
        var orthoObj = engine.fetchGeneOrthologAsAssociation(formID,'MGI',gene.id);
        var alleleObj = engine.fetchGeneAlleleAsAssociation(formID,gene,gene.taxon.id);
        
        phenotype_associations = phenotype_associations.concat(phenoObj.results);
        alleles = alleles.concat(alleleObj);
        genotype_associations = genotype_associations.concat(genoTypeObj);
        orthologs = orthologs.concat(orthoObj);
    }
    
    // Find gene interactions
    var interactionObj = engine.fetchGeneInteractions(id);
    if (interactionObj){
        interactions = interactions.concat(interactionObj.results);
    }

    // Add results to gene object
    gene.phenotype_associations = phenotype_associations;
    console.log("GETTING GENE -- raw phenotype associations: "+JSON.stringify(phenotype_associations));
    gene.phenotype_list = engine.getPhenotypeList(phenotype_associations);
    console.log("GETTING GENE -- phenotype list: "+JSON.stringify(gene.phenotype_list));
    

    gene.genotype_associations = genotype_associations;
    gene.alleles = alleles;
    gene.orthologs = orthologs;
    gene.interactions = interactions;
    gene.disease_associations = disease_associations;
    
    //Collapse xref table
    //TODO this only includes the filtered set, need to include all
    var xrefs_keys = Object.keys(xrefs);
    for (var i=0; i < xrefs_keys.length; i++){
        var xref_row = {
                         ids : xrefs[xrefs_keys[i]],
                         source : xrefs_keys[i]
                        }
        xref_table = xref_table.concat(xref_row);
    }
    //Update gene.references instead of creating a redundant table
    gene.xrefs = xref_table;
  
    // Generate inferred diseases from orthologs
    // but don't get inferred diseases from paralogs for human. 
    if (typeof gene.taxon != 'undefined' && typeof gene.taxon.id != 'undefined' && (!gene.disease_associations[0])&&(gene.orthologs)&&(gene.taxon)&&(!gene.taxon.id.match(/9606$/))){
        gene.disease_associations = engine.getDiseaseAssocsFromOrthologs(gene);
    }

    // Sort references and orthologs
    gene.xrefs.sort(function (reference, query) { return reference.source.localeCompare(query.source) });
    gene.orthologs.sort(function (reference, query) { return reference.organism.localeCompare(query.organism) });
    
    // Create analyze phenotype link
    gene.analyze_phenotypes = engine.buildAnalyzePhenotypeURL(gene.phenotype_associations,gene.taxon);

    // Capitalize first letter of gene description
    // Perhaps this should be done on the client side
    if (gene.description){
        var capLabel = gene.description.charAt(0).toUpperCase() 
                       + gene.description.substring(1);
        gene.description = capLabel;
    }

    gene.annotation_sufficiency = engine.getAnnotationSufficiencyScoreFromAssociations(phenotype_associations);

    // ** REFERENCES **
    literature = literature.concat(engine.makeLiteratureAssociations(gene.phenotype_associations,"phenotype"));
    literature = literature.concat(engine.makeLiteratureAssociations(gene.disease_associations,'disease'));
    literature = literature.concat(engine.makeLiteratureAssociations(gene.interactions,'gene'));

    //add gene citations directly from sene2pubmed list
    var refs = engine.fetchRefsForGene(id);
    literature = literature.concat(refs);
        

    literature.forEach( function(r) { pmids.push(r.pub); });
    pmids = engine.unique(pmids);
    pmidinfo = pmidinfo.concat(engine.fetchPubFromPMID(pmids));

    gene.literature = literature;
    gene.pmidinfo = pmidinfo;

    var pheno_distro = engine.makePhenotypeHistogramFromAssociations(phenotype_associations);

    
    if (engine.cache != null) {
        engine.cache.store('gene', id, gene);
    }
    
    return gene;
}
*/

bbop.monarch.Engine.prototype.getGeneSynonyms = function(id) {
    var engine = this;
    
    var resource = 'nif-0000-02801-1';
    
    var tr = function (r) {
        var synonyms = r.synonyms;
        var synonymList = synonyms.split(',');
        return synonymList;
    };
    //Using NIF
    var filter = { geneid : id };
    var resultObj = engine.fetchDataFromResource(null,
                            resource,
                            tr, null, null,
                            filter, null,null,null);
    
    //This creates an array or arrays, merge
    var synList = [];
    synList = synList.concat.apply(synList, resultObj.results);
    return synList;
    
    //Using SciGraph
    /*tr = function (r) {
        return r.synonyms;
    };
    var ncbi_ID = 'NCBIGene_'+id;
    return engine.getVocabularyTermByID(ncbi_ID,tr);*/

}


bbop.monarch.Engine.prototype.fetchSpotlight = function(type, id) {
    var engine = this;
    var info = {};
    var spotlight_config = engine.getConfig('spotlight');
    if (typeof item == 'undefined') {
        //return a random one
        var index=Math.round(Math.random()*((spotlight_config[type].length)-1));
        id = spotlight_config[type][index];
    } 
    if (engine.cache != null) {
        var cached;
        type = type.toLowerCase();
        try {
            if (type === 'model'){
                type = 'genotype';
            }
            cached = engine.cache.fetch(type, id);
        } catch (err) {
            console.error("caught exception "+err+"for spotlight "+ id);
        }
        if (cached != null) {
            if (cached.apiVersionInfo == null || cached.apiVersionInfo != engine.apiVersionInfo()) {
                engine.log("cached version is out of date - will not use");
            }
            else {
                info = cached;
            }
        }
    }

    var spotlight_data = {};
    spotlight_data.id = id;

    //fetch the cached object by type
    
    switch (type) {
        case 'gene' : 
            spotlight_data.name = info.description;
            spotlight_data.description = info.summary;
            spotlight_data.taxon = info.taxon.label;
            spotlight_data.divergence = "metazoa";
            spotlight_data.genotype_count = info.genotype_associations.length;
            spotlight_data.phenotypes = {};
            if (typeof info.phenotype_associations != 'undefined' && info.phenotype_associations != null) {
                info.phenotype_associations.forEach(function(p) {spotlight_data.phenotypes[p.phenotype.id] = {id:p.phenotype.id,label:p.phenotype.label}});
                spotlight_data.phenotypes = Object.keys(spotlight_data.phenotypes).map(function(p) {return spotlight_data.phenotypes[p]});
            }
            spotlight_data.anatomy = []; //TODO - figure out anatomical parts
            spotlight_data.diseases = [];
            if (typeof info.disease_associations != 'undefined') {
                info.disease_associations.map( function(a) {
                        spotlight_data.diseases.push(a.disease);
                        });
            }
            spotlight_data.pathways = []; 
            if (typeof info.pathway_associations != 'undefined') {
                info.pathway_associations.map( function(a) {
                        spotlight_data.pathways.push(a.pathway);
                        });
            }
            spotlight_data.publication_count = info.pmidinfo.length; 
            break;
        case 'disease' : 
            spotlight_data.description = info.definition;
            spotlight_data.model_count = info.models.length;

            spotlight_data.heritability = {};
            //engine.log("HERIT="+JSON.stringify(info.heritability));
            if (info.heritability != null) {
                info.heritability.forEach(function(h) {spotlight_data.heritability[h.inheritance.id] = h.inheritance});
                spotlight_data.heritability = Object.keys(spotlight_data.heritability).map(function(h) {return spotlight_data.heritability[h]});;
            }
            spotlight_data.phenotypes = {};
            if (info.phenotype_associations != null) {
                info.phenotype_associations.forEach(function(p) {spotlight_data.phenotypes[p.phenotype.id] = {id:p.phenotype.id,label:p.phenotype.label}});
                spotlight_data.phenotypes = Object.keys(spotlight_data.phenotypes).map(function(p) {return spotlight_data.phenotypes[p]});
            }
            spotlight_data.anatomy = []; //TODO - figure out anatomical parts
            spotlight_data.genes = {};
            if (info.gene_associations != null && typeof info.gene_associations != 'undefined') {
                info.gene_associations.forEach(function(g) {if (g.gene.id.trim() != 'NCBIGene:') {spotlight_data.genes[g.gene.id] = {id:g.gene.id,label:g.gene.label}}});
                spotlight_data.genes = Object.keys(spotlight_data.genes).map(function(g) {return spotlight_data.genes[g]});
            }
            spotlight_data.publication_count = info.pmidinfo.length;
            break;
        case 'genotype':
        case 'model':
            spotlight_data.taxon = info.taxon.label;
            spotlight_data.genes = info.has_affected_genes;
            spotlight_data.phenotypes = {};
            if (typeof info.phenotype_associations != 'undefined' && info.phenotype_associations != null) {
                info.phenotype_associations.forEach(function(p) {spotlight_data.phenotypes[p.has_phenotype.type.id] = {id:p.has_phenotype.type.id,label:p.has_phenotype.type.label}});
                spotlight_data.phenotypes = Object.keys(spotlight_data.phenotypes).map(function(p) {return spotlight_data.phenotypes[p]});
            }
            spotlight_data.anatomy = []; //TODO - figure out anatomical parts
            spotlight_data.diseases = [];  //TODO - add disease associations
            /*if (typeof info.disease_associations != 'undefined') {
                info.disease_associations.map( function(a) {
                        spotlight_data.diseases.push(a.disease);
                        });
            }*/
            spotlight_data.publication_count = info.pmidinfo.length;
            break;
        case 'phenotype':
            spotlight_data.description = info.definition;
            if (info.models != null && typeof info.models != 'undefined') {
                spotlight_data.model_count = info.models.length;
            }
            spotlight_data.genes = {};
            if (info.gene_associations != null && typeof info.gene_associations != 'undefined') {
                info.gene_associations.forEach(function(g) {if (g.gene.id.trim() != 'NCBIGene:') {spotlight_data.genes[g.gene.id] = {id:g.gene.id,label:g.gene.label}}});
                spotlight_data.genes = Object.keys(spotlight_data.genes).map(function(g) {return spotlight_data.genes[g]});
            }


            spotlight_data.diseases = {};
            if (info.disease_associations != null) {
                info.disease_associations.forEach(function(a) {spotlight_data.diseases[a.disease.id] = {id:a.disease.id,label:a.disease.label}});
                spotlight_data.diseases = Object.keys(spotlight_data.diseases).map(function(d) {return spotlight_data.diseases[d]});
            }
            spotlight_data.publication_count = info.pmidinfo.length;
            spotlight_data.model_count = info.genotype_associations.length;

            break;
    }

    spotlight_data.label = info.label;

    return spotlight_data;
}


bbop.monarch.Engine.prototype.getDiseaseAssocsFromOrthologs = function(gene) {
    var engine = this;
    var disease_associations = [];
    for (var i=0;i < gene.orthologs.length; i++){
        if (gene.orthologs[i].organism == 'Homo sapiens'){
            var disObj = engine.fetchDiseaseGeneAssociations(gene.orthologs[i].ortholog.id,'gene');
            if (disObj){
                var disease_ortho_assocs = disObj.filter(function(d){
                    return d.gene.id === gene.orthologs[i].ortholog.id;});
                disease_ortho_assocs = 
                    engine.collapseEquivalencyClass(
                            disease_ortho_assocs,["gene"],'disease',true);
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
            disease_associations[i].gene.id = gene.id;
            disease_associations[i].model_species = 'Homo sapiens';
            if (gene.label){
                disease_associations[i].gene.label = gene.label;
            } else {
                disease_associations[i].gene.label = '';
            }
            
        }
    }
    return disease_associations;
}

bbop.monarch.Engine.prototype.filterXrefsForGene = function(geneMap,references) {

    var unique = {};
    if (references){
        for (var k=0; k < references.length; k++){
            unique[references[k].id] = 1;
        }
    }

    //TODO consider using a xrefsToKeep instead?
    var xrefsToRemove = ['EMBL-Bank','NCBI_Genome','NIA','NCBI_nuccore',
                        'NCBI_locus_tag','DoTS','HomoloGene','CCDS',
                        'BIOGRID','NCBI_gi','NCBI_GP','EC','RefSeq_NA',
                        'RefSeq_Prot','VEGA','Unigene'];
    var xrefs = [];
    var geneMap = geneMap.results;
    if (geneMap){
        for (var i=0, len=geneMap.length; i < len; i++){
            var g = geneMap[i];
            if (!g.source){
                continue;
            } else if (xrefsToRemove.indexOf(g.source) >= 0) {
                continue;
            } else if ((g.id.match(/MGD\-MRK\-/))||
                       (g.id.match(/ENS.*[PT]/))) {
                continue;
            }
            if (g.id in unique){
                continue;
            }
            xrefs.push(g);
            unique[g.id] = 1;
        }
    }
    return xrefs;
}


bbop.monarch.Engine.prototype.fetchTaxon = function(id) {
    var engine = this;
    
    var neighbors = engine.getGraphNeighbors(id, 1, 'http://purl.obolibrary.org/obo/RO_0002162', 'BOTH', false, engine.config.scigraph_data_url);
    var graph = new bbop.model.graph();
    graph.load_json(neighbors);
    var tax = {};
    var taxon_list = graph.get_parent_nodes(id, 'http://purl.obolibrary.org/obo/RO_0002162');
    if (taxon_list){
        taxon_list.forEach(function (node){
            tax.id = node.id();
            tax.label = node.label();
        });
    }
    return tax; 
}

bbop.monarch.Engine.prototype.fetchRefsForGene = function(id) {
    var gene2pubmed = {id : 'nif-0000-02801-2', label: 'NCBI'};
    var engine = this;
    engine.info("Fetching Gene2Pubmed ("+id+"...");
    var lit = [];
    var tr = function (r) {
        var obj = {
                type : 'gene',
                obj : {id : r.gene_id, label : r.gene_label},
                source: gene2pubmed,
                pub: r.pubmed_num
            };
            return obj;
        };
    var filter = { gene_id : id };
    var resultObj = this.fetchDataFromResource(null,
                            gene2pubmed.id,
                            tr,
                            null,
                            null,
                            filter,
                            null,
                            null,
                            null );
    engine.info("Found "+resultObj.results.length);
    return resultObj.results;
}


bbop.monarch.Engine.prototype.buildAnalyzePhenotypeURL = function(phenotype_associations,taxon) {
    var analyze_phenotypes = '/analyze/phenotypes/?input_items=';
    
    if (phenotype_associations){
        for (var i=0;i < phenotype_associations.length; i++){
                var next = i + 1;
                if (phenotype_associations[next]){
                analyze_phenotypes = analyze_phenotypes + phenotype_associations[i].phenotype.id + "+";
                } else {
                    analyze_phenotypes = analyze_phenotypes + phenotype_associations[i].phenotype.id;
                }
        }
        analyze_phenotypes = analyze_phenotypes + "&limit=100";
        if (taxon){
            if (taxon.id){
                analyze_phenotypes = analyze_phenotypes + "&target_species=" + taxon.label.toString();
            }
        }
        return analyze_phenotypes;
    } else {
        return "";
    }
}

/*
 * Function:fetchOrthologList
 * 
 * Returns: Object containing inputs, paralogs, and orthologs
 * 
 * Arguments: - ids : list of entrez gene IDs
 * 
 */

bbop.monarch.Engine.prototype.fetchOrthologList = function(ids) {
    var engine = this;
    ids = engine.unique(ids);
    
    var results = {
            'input' : ids,
            'paralogs' : [],
            'orthologs' : []
    };
    
    ids.forEach(function(id) {
        var orthoObj = engine.fetchGeneOrthologFromSciGraph(id,'label',true);
        //results.orthologs = results.orthologs.concat(orthoObj);
        orthoObj.forEach(function(homolog) {
            if (homolog.orthology_class === 'Paralog'){
                results.paralogs = results.paralogs.concat(homolog.ortholog.id);
            } else if ((homolog.orthology_class === 'Least Diverged Ortholog')
                       || (homolog.orthology_class === 'Ortholog')){
                results.orthologs = results.orthologs.concat(homolog.ortholog.id);
            }
            
        });
    });
    
    var filter = "^OMIM|NCBI|MGI|ZFIN|ENSEMBL:ENSG\\d+|ENSEMBL:ENSDARG\\d+|ENSEMBL\:ENSMUSG\\d+";
    var filtered_regex = new RegExp(filter);
    
    results.paralogs = results.paralogs.filter(function(d){
        return (filtered_regex.test(d));
    });
    results.orthologs = results.orthologs.filter(function(d){
        return (filtered_regex.test(d));
    });
    
    results.orthologs = engine.unique(results.orthologs);
    results.paralogs = engine.unique(results.paralogs);
        
    return results;
};

/*
 * Function:fetchGeneOrthologFromSciGraph
 * 
 * Returns: ordered list of matches
 * 
 * Arguments: - id : single gene id
 * 
 */
bbop.monarch.Engine.prototype.fetchGeneOrthologFromSciGraph = function(id) {
    var engine = this;
    
    var CLASS_MAP = {
            'http://purl.obolibrary.org/obo/RO_HOM0000017' : 'Ortholog',
            'http://purl.obolibrary.org/obo/RO_HOM0000020' : 'Least Diverged Ortholog',
            'http://purl.obolibrary.org/obo/RO_HOM0000019': 'Homolog',
            'http://purl.obolibrary.org/obo/RO_HOM0000011' : 'Paralog',
            'http://purl.obolibrary.org/obo/RO_HOM0000023' : 'Paralog',
            'http://purl.obolibrary.org/obo/RO_HOM0000022' : 'Ohnolog',
            'http://purl.obolibrary.org/obo/RO_HOM0000018': 'Xenolog',
            'http://purl.obolibrary.org/obo/RO_0002351' : 'has_member'       
    };
    
    var params = {
            'homolog_id': 'RO:HOM0000000'
    };
    
    var path = '/genes/'+id+'/homologs.json';
    var scigraphResults = engine.querySciGraphDynamicServices(path,params);
    
    var homologGraph = new bbop.model.graph();
    homologGraph.load_json(scigraphResults);
    var node_list = homologGraph.get_descendent_subgraph(id,'equivalentClass').all_nodes();

    var equivalent_classes = node_list.map( function(obj){ return obj.id(); }).concat(id);
    var results = [];
    
    homologGraph.all_edges().forEach(function(edge){
        if (equivalent_classes.indexOf(edge.subject_id()) >= 0){
            var resultObj = {
                    'gene': {
                        'id': id,
                        'label': homologGraph.get_node(id).label()
                    },
                    'ortholog' : { 
                        id : edge.object_id()
                    },
                    
                    'orthology_class' : CLASS_MAP[edge.predicate_id()]
            };
            results.push(resultObj);
        } else if (equivalent_classes.indexOf(edge.object_id()) >= 0){
            var resultObj = {
                    'gene': {
                        'id': id,
                        'label': homologGraph.get_node(id).label()
                    },
                    'ortholog' : { 
                        id : edge.subject_id()
                    },
                
                    'orthology_class' : CLASS_MAP[edge.predicate_id()]
            };
            results.push(resultObj);
        }
    });
    return results;  
}

//TODO check for cycling, mimic get_ancestor subgraph
bbop.model.graph.prototype.get_descendent_subgraph = function(obj_id, pred){   
    var anchor = this;
    var edge_list = new Array();
    var descendent_graph = new bbop.model.graph();
    if (typeof anchor.seen_node_list === 'undefined') {
        anchor.seen_node_list = [obj_id];
    }
    
    anchor.get_child_nodes(obj_id, pred).forEach( function(sub_node) {
        var sub_id = sub_node.id();
        if (anchor.seen_node_list.indexOf(sub_id) > -1){
            return;
        }
        anchor.seen_node_list.push(sub_id);
        descendent_graph.add_edge(anchor.get_edge(sub_id, obj_id, pred));
        descendent_graph.add_node(anchor.get_node(sub_id));
        descendent_graph.add_node(anchor.get_node(obj_id));
        descendent_graph.merge_in(anchor.get_descendent_subgraph(sub_id, pred));
    });
        
    return descendent_graph; 
};

/*
 * Function:fetchGeneOrthologAsAssociation
 * 
 * Returns: ordered list of matches
 * 
 * Arguments: - id : single gene id
 * 
 */
bbop.monarch.Engine.prototype.fetchGeneOrthologAsAssociation = function(id,label,ncbiID, isNCBIGene, noMap) {
    var resource_id = 'nlx_84521-1'; // HARDCODE
    var engine = this;
//    var filter = [];
    var resultObj = {};
    resultObj.results = [];
    
    //filter = ["genea:" +this.quote(id)];
//    filter = ["genea:"+id];
    var filter;
    if (isNCBIGene === true) {
        filter = { gene_id_a : id };
    } else {
        filter = { genea : id };
    }

    var tr =
        function (r) {
        
        var obj = {
                id : "monarch:disco/" + r.e_uid,
                type : "Association", 
                gene : { 
                    id : ncbiID,
                    label: label
                },
            
                ortholog : { 
                    id : r.gene_id_b// ,
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
//    filter = ["geneb:"+id];
    if (isNCBIGene === true) {
        filter = { gene_id_b : id };
    } else {
        filter = { geneb : id };
    }

    tr =
        function (r) {
        
        var obj = {
                id : "monarch:disco/" + r.e_uid,
                type : "Association", 
                gene : { 
                    id : ncbiID,
                    label: label
                },
            
                ortholog : { 
                    id : r.gene_id_a          
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
    
    if (noMap == true){
        return resultObj.results;
    }
    var mappedResults = [];
    var unique = {};
    
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
                        mappedResults = mappedResults.concat(resultObj.results[i]);
                        unique[ncbiGene] = 1;
                    }
                }
            }
        }
    }
    
    return mappedResults;    
};

bbop.monarch.Engine.prototype.trVariant = function(r,variant_type) {
    var variant = {};
    var engine = this;
    variant.id = r[variant_type+"_id"];
    if (typeof variant.id != 'undefined') {
        if (/^OMIM/.test(variant.id)) {
            variant.id = variant.id.replace(/\-SA$/,'');  
            variant.id = variant.id.replace(/_/,'.');
        }
        variant.label = r[variant_type+"_label"];
        if (typeof variant.label != 'undefined') {
            if (/^</.test(variant.label) && />$/.test(variant.label)) {
                variant.label = variant.label.replace(/[<>]/g,'');
            }
        }
        var vtype = {};
        var id = r[variant_type+"_type_id"];
        if (id != "" && typeof id != 'undefined') {
            vtype.id = r[variant_type+"_type_id"];
        }
        if (typeof r[variant_type+"_type_label"] != 'undefined') {
            //turn this into an array
            vtype.label = r[variant_type+"_type_label"];
        }
        //TODO test for multiple ids too, and make object
        if (typeof r[variant_type+"_type_labels"] != 'undefined') {
            vtype.label = r[variant_type+"_type_labels"].split(",");
        }
        variant.variant_type = vtype;
        

        if (typeof r.clinical_significance != 'undefined' && r.clinical_significance != '') {
            variant.pathogenicity = r.clinical_significance;
        }
        variant.coordinates = {};
        if (typeof r.cytogenetic_locations != 'undefined' && r.cytogenetic_locations != '') {
            variant.coordinates.band = r.cytogenetic_locations;
        }
        //maybe put this in the future
        /*if (typeof r.genomic_location != 'undefined' && r.genomic_location != '') {
            variant.coordinates.genomic_location = r.genomic_location;
            variant.coordinates.build = r.assembly;
        }*/
        if (typeof r.submitters != 'undefined' && r.submitters != '') {
            //for clinvar, they aggregate external submitter data, so add it as a source here
            var sources = r.submitters.split(/[,;]/);
            variant.sources = sources.map( function(s) { return {label : s} } );
            engine.info(variant.sources);
        }
    //TODO: add other affected genes
    } else {
        variant = {};
    } 

    //this.log("VARIANT: "+JSON.stringify(variant));
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
    this.log("INFO: fetching GeneAlleleAssociations for id:"+id);
    var engine = this;
    //TODO add clinvar
    //TODO may need to refactor WB format to uniformly handle the api
    var tax_to_resource_map = {
            '9606' : [
//temporarily removing OMIM as a source... most of this data will probably be in ClinVar anyway
//{id:'nif-0000-03216-9',label:'OMIM',col:'sequence_alteration'},
                      {id:'nlx_151671-1',label:'ClinVar',col:'sequence_alteration'}
                     ],    
            '6239'    : [{id:'nif-0000-00053-4',label:'WB',col:'sequence_alteration'},
//TODO                         {id:'nif-0000-00053-4',label:'WB',col:'variant_locus_alteration'}
                        ], 
            '10090'   : [{id:'nif-0000-00096-5',label:'MGI',col:'sequence_alteration'},{id:'nlx_151660-2',label:'IMPC',col:'sequence_alteration'}],
            '7955'  : [{id:'nif-0000-21427-11',label:'ZFIN',col:'sequence_alteration'}, 
//TODO change this at some point to being variant_locus_alteration
                       {id:'nif-0000-21427-12',label:'ZFIN',col:'targeted_gene_subregion'}
                      ]
    };

//TODO:  to be variant_locus_alteration
    var resultObj = {};
    var all_variant_results = [];
    resultObj.results = [];

    if (typeof tax == 'undefined') {
        return [];
    }
    var resource_list = tax_to_resource_map[tax.toString().replace(/NCBITaxon:/,'')];

    // check if in supported resources
    if (typeof resource_list == 'undefined') { 
        return []; 
    }


    var formattedID = id.replace(/NCBI_[Gg]ene:/,'NCBIGene:');

    for (var i=0; i<resource_list.length; i++){
        var resource = resource_list[i];
        var variant_type = resource.col; 
        var trAssoc = function (r) {
            var references = engine.makePublicationList(r);
            engine.info("REFS:"+JSON.stringify(references));
            var obj = {
                    id : "monarch:disco/" + r.v_uuid,
                    type : "Association",
                    variant : engine.trVariant(r,variant_type),
//TODO add references
                    references : references,
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
            //TODO HACK generally, it is gene_id, but in this case it is a list
            if (resource.label == 'ClinVar') {
                filter.push("gene_ids:"+formattedID);
            } else if (resource.label == 'IMPC') {
                filter.push("marker_id:"+formattedID);
            } else {
                filter.push("gene_id:"+formattedID);
            }
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

    this.log("|all_variant_results|="+all_variant_results.length);
    var uniqResults = engine.uniquifyResultSet(all_variant_results,["variant"]);
    this.log("|all_variant_results| uniq="+uniqResults.length);
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
    var engine = this;
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
        var uniqResults = engine.uniquifyResultSet(resultObj.results,["genotype"]);
        return uniqResults;
    } else {
        return [];
    }
}
/*
 * Function:fetchGenePhenotypeAsAssociation
 * 
 * Returns: ordered list of matches
 * 
 * Arguments: - id : single gene id, gene object, and taxon for filtering purposes
 * 
 */    
bbop.monarch.Engine.prototype.fetchGenePhenotypeAsAssociation = function(id,gene,tax) {
    var engine = this;
    var species_to_resource_map = {
        '10090' : { 
            resources : 
                [{id:'nif-0000-00096-6',label:'MGI',annotation_entity:'effective_genotype'},
                //MPD doesn't have gene ids
                 //{id:'nif-0000-03160-2',label:'MPD',annotation_entity :'strain',filter:{nstdev_abs : '>3.0'}},
                 {id:'nlx_151660-3',label:'IMPC',annotation_entity : 'effective_genotype'}], 
            default_taxon : {id : 'NCBITaxon:10090',label : 'Mus musculus'}},
        '7955' : {
            resources : [
                {id: 'nif-0000-21427-10',label:'ZFIN',annotation_entity:'effective_genotype'}], 
            default_taxon : {id : 'NCBITaxon:7955', label : 'Danio rerio'}},
        '7227' : {
            resources : 
                [{id: 'nif-0000-00558-2',label:'FB',annotation_entity:'effective_genotype'}],    
            default_taxon : {id : 'NCBITaxon:7227', label : 'Drosophila melanogaster'}},
        '6239' : {
            resources : 
                [{id: 'nif-0000-00053-4',label:'WB',annotation_entity:'sequence_alteration'}],    
            default_taxon : {id : 'NCBITaxon:6239', label : 'Caenorhabditis elegans'}},
        //TODO add clinvar, gwas?
    };

    if (typeof tax != 'undefined' && Object.keys(tax) != null && typeof tax.id != 'undefined') {
        tax = tax.id.replace(/NCBITaxon:/,'');
    }    
    var resource_map = species_to_resource_map[tax];
    
    if (typeof resource_map == 'undefined') { 
        return {results:[]}; 
    }

    var all_results=[];
    var filter = {};
    if (resource_map != null) {
    for (var i=0; i<resource_map.resources.length; i++) {
        var resource = resource_map.resources[i];

        if (resource.annotation_entity == 'effective_genotype') {
            filter = { implicated_gene_ids : id} ;
        } else if (resource.annotation_entity == 'sequence_alteration') {
            filter = { gene_id : id };
        }

        var tr =
            function (r) {
                var references = engine.makePublicationList(r);
                var obj = {
                    id : "monarch:disco/" + r.v_uuid,
                    type : "Association", 
                    gene : { 
                        id : gene.id,
                        label: gene.label
                    },
                    inferred_from : {
                        type : resource.annotation_entity,
                        id : r[resource.annotation_entity+'_id'],
                        label : r[resource.annotation_entity+'_label']
                    },
                    phenotype : { 
                        id : r.phenotype_id,
                        label : r.phenotype_label
                    },
                    references : references,

                    source : resource,
                    resource : resource.id
                };
            return obj;
        };
        var resultObj = this.fetchDataFromResource(null, 
                               resource.id,
                               tr,
                               null,
                               null,
                               filter,
                               null,
                               null,
                               null );

        all_results = all_results.concat(resultObj.results);
    }
    //engine.log("|GENEPHENOASSOCS=|"+all_results.length);
    //engine.log("ASSOCS:"+JSON.stringify(all_results));
    }
    var uniqResults = {};
    var unique = {};
    var uniquePhenoEvidence = {};
    uniqResults.results = [];

    for (var i=0; i<all_results.length; i++){
        var uniqPheno =  all_results[i].phenotype.id;
        var cat = all_results[i].phenotype.id;
        if (all_results[i].references != null && all_results[i].references[0]) {
            cat += all_results[i].references[0].id; 
        }
        //Combine references
        if (uniqPheno in unique){
            for (var j=0; j<uniqResults.results.length; j++){
                if ((uniqResults.results[j].phenotype.id == all_results[i].phenotype.id)&&
                        (!uniquePhenoEvidence[cat])){

                    uniqResults.results[j].references = 
                        uniqResults.results[j].references.concat(all_results[i].references);
                    uniquePhenoEvidence[cat]=1;
                }
            }
        } else {
            if (all_results[i].phenotype.id){
                uniqResults.results = uniqResults.results.concat(all_results[i]);
            }
            unique[uniqPheno] = 1;
            uniquePhenoEvidence[cat]=1;
        }
    }
    return uniqResults;
}
    

//This function will take a gene identifier, and generate
//a bunch of mappings by using the Monarch ID mapping table
//This function expects an NCBIGene identifier
bbop.monarch.Engine.prototype.fetchEquivalentGeneIds = function(id) {
    var resource_id = 'nlx_152525-4'; // ID map

    var engine = this;
    if (id != null) {
        id = id.replace(/NCBI_?[Gg]ene:/,'');
    }

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


bbop.monarch.Engine.prototype.fetchDiseasePhenotypeAsGeneAssocations = function(id,genObj) {

    var resource_id = 'nlx_151835-1'; // HARDCODE ALERT

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
                    label : r.disorder_name
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
    
    if (resultObj.results){
        return resultObj.results;
    } else {
        return [];
    }

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
// this.log("MyGene result="+JSON.stringify(ret,null,' '));
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
/* TODO delete me
bbop.monarch.Engine.prototype.fetchOmimDiseasePhenotypeAsAssocations = function(id, opts) {

    // so obviously it would be nicer to be more declarative here; abstract over
    // this a little, but this is fine to get us started
    // Example:
    // http://beta.neuinfo.org/services/v1/federation/data/nlx_151835-1.json?exportType=data&q=HP_0003797
    var engine = this;
    var resource = {id : 'nlx_151835-1', label : 'HPO'};  // HARDCODE ALERT


    // translate OMIM result into generic association object
    var trOmim =
        function (r) {
            // Repair IDs. TODO, fix in view?
            if (r.disorder_id > 0) {
                // is-numeric
                r.disorder_id = "OMIM:"+r.disorder_id;
            }
            var references = engine.makePublicationList(r);
            var evidence = {};
            if (typeof r.evidence_code_id != 'undefined' && r.evidence_code_id != null && r.evidence_code_id != '' && r.evidence_code_label != '') {
                evidence.type = {
                    id : r.evidence_code_id,
                    code : r.evidence_code_symbol,
                    label : r.evidence_code_label
                }
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
                    label : r.phenotype_label
                },

                onset : { id : r.onset_id, label : r.onset_label},
                frequency : r.frequency,
                evidence : evidence,
                // provenance
                source : resource,
                resource : resource.id,
                references : references
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
    else {
        engine.warn("Assuming ID is a phenotype: "+id);
    subclassFilters['phenotype_id'] = id;
    }
    filters["aspect"] = "O";
    //var filters = ["disorder_id:"+id,"aspect:O"];
    var resultObj = 
        engine.fetchDataFromResource(null, 
                resource.id,
                trOmim,
                null,
                null,
                filters,
                subclassFilters
                );

    return resultObj;
}
*/
/* TODO delete me
bbop.monarch.Engine.prototype.fetchHeritabilityForDisease = function(id) {
    var engine = this;
    var heritability = {};
    var resource = {id : 'nlx_151835-1', label : 'HPO'};  // HARDCODE ALERT


    // translate OMIM result into generic association object
    var trOmim =
        function (r) {
                return { disease : {
                    id : r.disorder_id,
                    label : r.disorder_name },
        inheritance : {
            id : r.phenotype_id,
            label : r.phenotype_label}
        } };

    var filters = {"aspect" : "I"};
    var subclassFilters = {"disorder_id" : id};

    var resultObj =
        engine.fetchDataFromResource(null,
                resource.id,
                trOmim,
                null,
        null,
                filters,
        subclassFilters
        );
    return resultObj;
}*/

// ?? this view is really gene-disease? <-- YES
// Function: fetchOmimGenePhenotypeAsAssocations
//
// Status: DEPRECATED
/* TODO delete me
bbop.monarch.Engine.prototype.fetchOmimGenePhenotypeAsAssocations = function(id) {
    var resource_id = 'nif-0000-03216-8'; // HARCODE ALERT

    var resultObj = 
        this.fetchDataFromResource(id, 
                resource_id
                // trOmimDGA TODO
                );
    return resultObj;
}
*/
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
/* TODO delete me
bbop.monarch.Engine.prototype.fetchOmimDiseaseGeneAsAssocations = function(id) {
    this.log("Fetching OMIM DiseaseGeneAssociations for"+id);
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
        //console.log("Fetching DiseaseGene Associations from " + resource.label + " ("+resource.id+") for "+id);
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
                    var gids = r.gene_ids.split(",");
                    var glabels = [];
                    if (r.gene_labels != null && typeof r.gene_labels != 'undefined') {
                        glabels = r.gene_labels.split(",");
                    }
                    for (var i=0; i< gids.length; i++) {
                        genes.push({id : gids[i].trim(), label : glabels[i].trim()});
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
                                if    (!(g.id.match(/NCBI/))) g.id = 'NCBIGene:'+g.id;
                                return {id : g.id, label : g.label};
                            });
                        }*//*
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
                //console.log('diseases:'+JSON.stringify(diseases));
                //console.log('genes:'+JSON.stringify(genes));
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
                        //console.log("assoc:"+JSON.stringify(assoc));
                        //console.log("sources:"+JSON.stringify(assoc.source));
                        //assoc.source.push( { id: resource.id, label : resource.label} );
                    
                        assoc.references.concat(engine.makePublicationList(r)),

                        assocs.push(assoc);
                        //this.log('ASSOC:'+JSON.stringify(assoc,null,' '));
                    }
                }

                return assocs;
            };
    // var filters = [
    // "omim_id:"+this.quote(engine.getFederationNifId(id)),
    // ];
    //var filters = null;
    var filters = {};
    if (resource.filter) {
        filters = resource.filter 
    }
    var query = null;
    var subclassQuery = null;
    if (type == 'gene') {
        filters['gene_id'] = id;
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
            //console.log("Got no results doing a subclassQuery; trying with a regular query.");
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

    // this.log('ASSOCIATIONS:'+JSON.stringify(assocLookup,null,' '));

    for (var key in assocLookup) {
        //this.log('key:'+key);
        results.push(assocLookup[key]);
    }
    var uniqResults = results;
    // this.log('RESULTS:'+JSON.stringify(results));
    //var uniqResults = this.uniquifyResultSet(results,["gene","disease"],true);
    if (type != 'gene'){
        uniqResults = engine.collapseEquivalencyClass(results,["gene"],'disease',true);
    } 
    return uniqResults;
}
*/

/* TODO: this is really just a variation on the fetchGenoPhenoAsAssociation - should i just call that function and use
 * it's results here, with the addition of non-genotype association views only in this function?  that would get rid
 * of the calls to the mod tables here...no need to write the same thing twice
*/
// currently expects the id to be a phenotype or disease id
bbop.monarch.Engine.prototype.fetchSequenceAlterationPhenotypeAsAssociations = function(id,sp) {
    this.log("Fetching SequenceAlterationPhenotypeAssociations: "+id);
    var species_to_resource_map = {    // HARDCODE ALERT
        '10090' : {id:'nif-0000-00096-5',label:'MGI',col:'implicated_sequence_alteration',   default_taxon : {id : 'NCBITaxon:10090',label : 'Mus musculus'}},
        '7955' : {id: 'nif-0000-21427-10',label:'ZFIN', col: 'implicated_sequence_alteration',  default_taxon : {id : 'NCBITaxon:7955', label : 'Danio rerio'}},
        '6239' : {id: 'nif-0000-00053-4',label:'WB', col: 'sequence_alteration',    default_taxon : {id : 'NCBITaxon:6239', label : 'Caenorhabditis elegans'}},
        '7227' : {id: 'nif-0000-00558-2',label:'FB', col: 'implicated_sequence_alteration',   default_taxon : {id : 'NCBITaxon:7227', label : 'Drosophila melanogaster'}},
        //'9606' : {id: 'nif-0000-03216-9',label:'OMIM', col: 'sequence_alteration', default_taxon : {id : 'NCBITaxon:9606', label : 'Homo sapiens'}}    // OMIM - this is a variant table
        '9606' : {id: 'nlx_151671-1',label:'ClinVar', col: 'sequence_alteration', default_taxon : {id : 'NCBITaxon:9606', label : 'Homo sapiens'}}    // OMIM - this is a variant table
    };
    var variant_type = 'sequence_alteration';
    var resource = species_to_resource_map[sp];
    var engine = this;
    var trAssoc = function (r) {
        var references = engine.makePublicationList(r);
        engine.info("REFS:"+JSON.stringify(references));
        var obj = {
            id : "monarch:disco/" + r.v_uuid,
            type : "Association",
            variant : engine.trVariant(r,resource.col),
            phenotype : {
                id : r.phenotype_id,
                label : r.phenotype_label,
                description : r.phenotype_description_free_text,
                inheritance : r.phenotype_inheritance },
            references : references,
            source : resource,
            resource : resource.id
        };
        return obj;
    };

    //todo, this will probably fail if you give it a sequence alteration id
    var subclassQuery = id;
    var resultObj =
        this.fetchDataFromResource(null,
                resource.id,
                trAssoc,
                null,
                subclassQuery
                );
//    return resultObj;

    //TODO uniquify

   // need to make this a function
    var uniqResults = {};
    var unique = {};
    uniqResults.results = [];
    var all_variant_results = resultObj.results;
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
    this.log("|all_variant_results| uniq="+uniqResults.results.length);
    return uniqResults;

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




bbop.monarch.Engine.prototype.makeNewGenotype = function(rows) {
    //TEMP
    var r = rows[0];
    if (typeof r == 'undefined') {
        return {};
    }

    var variant_loci = {
        type : "variant_loci",
        has_part : []
    }

    //set of variant_single_locus_complements
    var vslcs = [];

    var affected_genes = {};
    for (var i=0; i<rows.length; i++) {
        var r = rows[i];
        if (typeof r.gene_id != 'undefined') {
            affected_genes[r.gene_id] = r.gene_label;
        };
        if (typeof r.affected_gene_id != 'undefined') {
            affected_genes[r.affected_gene_id] = r.affected_gene_label;
        }
        if (typeof r.implicated_gene_ids != 'undefined') {
            var ids = r.implicated_gene_ids.split(/[;,]/).map(function(x) {return x.trim()});
            var labels = r.implicated_gene_labels.split(/[;,]/).map(function(x) {return x.trim()});
            for (var g=0; g<ids.length; g++) {
                var l = "";
                if (ids.length == labels.length) {
                    //assuming they appear in the same order
                    l = labels[g];
                }
                affected_genes[ids[g]] = l;
            }
        }

        var reference_locus =
        {
            id : r.gene_id,
            label : r.gene_label,
            //TODO add location
            type : "reference_locus"
        };

        var sequence_alteration =
        {
            id : r.sequence_alteration_id,
            label : r.sequence_alteration_label,
            has_mutation : r.mutation,
            //TODO add location
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
        variant_loci.has_part.push(variant_locus);

        //do a vslc lookup; attach the variant_loci to the vslc
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
        vslcs.push(vslc);
    }  //end loop over rows
    var genes = [];
    for (var id in affected_genes) {
        var gene = {id : id,label : affected_genes[id]};
        genes.push(gene);
    }

    r = rows[0];
    //assuming there is only one background
    var background = {
        id : r.genomic_background_id,
        label: r.genomic_background_label ,
        type : "genomic_background"
    };


    var genomic_variation_complement = {};
    if (typeof r.genomic_variation_complement_id != 'undefined') {
        genomic_variation_complement =
            {
                id : r.genomic_variation_complement_id,
                label : r.genomic_variation_complement_label,
                type : "genomic_variation_complement",
                has_part : vslcs
            };
    }
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
    var extrinsic_genotype = {};
    if (typeof r.extrinsic_genotype_id != 'undefined') {
        extrinsic_genotype =
            {
                id : r.extrinsic_genotype_id,
                label : r.extrinsic_genotype_label,
                type : "extrinsic_genotype"
            };
    }
    var geno = 
    {
        id : r.effective_genotype_id,
        label : r.effective_genotype_label,
        type : "effective_genotype",
        has_part : [
            intrinsic_genotype,
            extrinsic_genotype
            ],
        //has_variant_loci : variant_loci,
        has_affected_genes : genes,
        //has_sequence_alterations : [sequence_alteration],
        taxon : { id : r.taxon_id, label : r.taxon_label}
    };
    console.log("CACHE " + JSON.stringify(geno, null, ' '));

    return geno;

}



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
// This makes the assumption that all rows pertain to a single genotype
bbop.monarch.Engine.prototype.makeGenotype = function(rows) {
    var geno_obj = {};
    var background = {};
    var r = rows;
    if (r.map != null) {
        //temp
        r = rows[0];
    } 


    if (typeof r.strain_id != 'undefined') {
        background = {
            id : r.strain_id,
            label : r.strain_label,
            type : "genomic_background"
        };
      } else if (typeof r.genomic_background_id != 'undefined') {
        background = {
            id : r.genomic_background_id,
            label: r.genomic_background_label ,
            type : "genomic_background"
        };
      }
    // TODO: this isn't always a gene! but for now it's fine.
    var reference_locus = {};
    if (typeof r.gene_id != 'undefined') {
        reference_locus = {
            id : r.gene_id,
            label : r.gene_label,
            type : "reference_locus"
        };
    }
    var sequence_alteration = {};
    if (typeof r.sequence_alteration != 'undefined') {
        sequence_alteration = {
            id : r.sequence_alteration_id,
            label : r.sequence_alteration_label,
            has_mutation : r.mutation,
            type : "sequence_alteration",
        };
        geno_obj.has_sequence_alterations = [sequence_alteration];

    }

    var variant_locus = {};
    if (typeof r.variant_locus_id != 'undefined') {
        variant_locus = {
            id : r.variant_locus_id,
            label : r.variant_locus_label,
            type : "variant_locus",
            has_part : [
                reference_locus,
                sequence_alteration
            ]
        };
    }
    var variant_loci = {};
    if (Object.keys(variant_loci).length > 0 ) {
        variant_loci = {
            type : "variant_loci",
            has_part : [variant_locus]
        }
    geno_obj.has_variant_loci = variant_loci ;
    }

    // ** GENES **

    // genes are typically atomized when accessing genotype-only tables
    // whereas we typically get lists of genes when accessing genotype-phenotype/disease tables
    var affected_gene_collection = {};
    var affected_genes = [];
    var genelist_types = ["gene_id","gene_ids","implicated_gene_ids"];
    for (var j=0; j<genelist_types.length; j++) {
        var gtype = genelist_types[j]; 
        //engine.log("Finding genes in "+gtype);
        var gtype_label = gtype.replace("id","label"); 
        if (typeof r[gtype] != 'undefined' && r[gtype] != '' && r[gtype] != null) {
            //sometimes the datasource overloads gene_id with a list, so just make this assumption
            //also, upstream doesn't deliver proper json lists, just comma-delimited strings, so we must split
            var gids = r[gtype].split(/,/).map(function(x) {return x.trim()});
            var glabels = [];
            if (gids.length > 1) {
                glabels = r[gtype_label].split(/,/);
            } else {
                glabels = [r[gtype_label].trim()];
            }
            for (var i=0;i<gids.length; i++) {
                var g = {id : gids[i].trim()};
                if (gids.length == glabels.length) {
                    g.label = glabels[i].trim();
                }
                affected_genes.push(g) ;
            }
        }
    }
    //not sure i understand the "collection" pattern
    if (affected_genes.length > 0) {
        affected_gene_collection = { 
            type : "affected_gene_collection", 
             has_part : affected_genes
        };
        geno_obj.has_affected_genes = affected_genes;
    }


    var vslc = {};
    if (typeof r.variant_single_locus_complement_id != 'undefined') {
        vslc = {
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
    }
    var genomic_variation_complement = {};
    if (typeof r.genomic_variation_complement != 'undefined') {
        genomic_variation_complement = 
        // TODO: VSLC aren't given as a list...denormalized....how to aggregate?
        {
            id : r.genomic_variation_complement_id,
            label : r.genomic_variation_complement_label,
            type : "genomic_variation_complement",
            has_part : [vslc]
        };
    }
    var intrinsic_genotype = {};
    var intrinsic_genotype_parts = [];
    intrinsic_genotype_parts.push(background);
    if (typeof r.intrinsic_genotype_id != 'undefined') {
        intrinsic_genotype = {
            id : r.intrinsic_genotype_id,
            label : r.intrinsic_genotype_label,
        };
        intrinsic_genotype_parts.push(genomic_variation_complement);
    }
    intrinsic_genotype.type = "intrinsic_genotype";
    intrinsic_genotype.has_part = intrinsic_genotype_parts;
    geno_obj.has_part = [intrinsic_genotype];
    var extrinsic_genotype = {};
    if (typeof r.extrinsic_genotype != 'undefined') {
        extrinsic_genotype = {
            id : r.extrinsic_genotype_id,
            label : r.extrinsic_genotype_label_html,
            type : "extrinsic_genotype"
        };
        geno.has_part.push(extrinsic_genotype);
    }
    //some special cases when there are strain-phenotype annotations, as opposed to "genotypes".  probably should refactor
    //those views so that there is an effective_genotype_id col == strain_id
    if (typeof r.intrinsic_genotype_id == 'undefined' && typeof r.effective_genotype_id == 'undefined' && typeof r.extrinsic_genotype_id ==  'undefined' && typeof r.strain_id != 'undefined') {
        //an extra special case - we want to defer to the MGI ids here, before the other strain ids
        if (typeof r.mgi_strain_id != null && r.mgi_strain_id != '') {
            geno_obj.id = r.mgi_strain_id;
        } else {
            geno_obj.id = r.strain_id;
        }
        geno_obj.label = r.strain_label;
    } else {
        geno_obj.id = r.effective_genotype_id;
        geno_obj.label = r.effective_genotype_label;
    }
    geno_obj.type = "effective_genotype";
    if (typeof r.taxon_id != 'undefined' && r.taxon_id != null) {
        geno_obj.taxon = { id : r.taxon_id, label : r.taxon_label} ;
    }
    //this.log("MAKEGENO " + JSON.stringify(geno_obj, null, ' '));
    return geno_obj;
};


// i think this expects a genotype or it's parts as the identifier
bbop.monarch.Engine.prototype.fetchGenotype = function(id,sp) {

    var engine = this;
    var species_to_resource_map = {  // HARDCODE ALERT
        '10090' : {resources : [{id:'nif-0000-00096-5',label:'MGI'}], 
                   default_taxon : {id : 'NCBITaxon:10090',label : 'Mus musculus'}},
        //TODO add other resources
        '7955' : {resources : [{ id : 'nif-0000-21427-13', label : 'ZFIN'}],
                  default_taxon : {id : 'NCBITaxon:7955', label : 'Danio rerio'}},
        '6239' : {resources : [{id: 'nif-0000-00053-3', label : 'WB' }],    
                  default_taxon : {id : 'NCBITaxon:6239', label : 'Caenorhabditis elegans'}},   
        '7227' : {resources : [{ id: 'nif-0000-00558-2', label:'FB'}],    
                  default_taxon : {id : 'NCBITaxon:7227', label : 'Drosophila melanogaster'}},
    };

    if (sp == null || sp == {}) {
        return {};
    }

    var resources = species_to_resource_map[sp];

    if (resources == null) {
        return {};
    }


    var join_ids = {};
    
    //need to look in a variety of resources for genotype information,
    //but not sure how to merge it if it's found in all?
    var geno = {};
    for (var t=0; t<resources.resources.length; t++) {
        var resource = resources.resources[t];
            
        //var resultObj = this.fetchDataFromResource(id,resource.id);
        var filter = {};
        filter = { "effective_genotype_id" : id };

        var resultObj = engine.fetchDataFromResource(null,resource.id,null,null,null,filter);

        //TODO we need a merging function
        if (resultObj) {
            //geno = engine.makeGenotype(resultObj.results);
            geno = engine.makeNewGenotype(resultObj.results);
        }

        //set the intrinsic/extrinsic ids for joining
        if (geno.has_part != null) {
            join_ids=geno.has_part.map(function(x) {return { id : x.id, label : x.label, type : x.type } });
        }
    }

    engine.log("NEWGENO:"+JSON.stringify(geno),' ');
    return geno;
}

//this is just used for geno-pheno type of tables, and is very zfin specific
//we need a new function that will figure these out from the ontology of MP
bbop.monarch.Engine.prototype.makeInheresInFromAssociation = function(r) {
    var inheres_in = {};
    var col = 'affected_structure_or_process_1_superterm_id';
    if (typeof r[col] != 'undefined' && r[col] != null && r[col] != '') {
        inheres_in.type = {
            id : r.affected_structure_or_process_1_superterm_id,
            label : r.affected_structure_or_process_1_superterm_name
        };
    };
    col = 'affected_structure_or_process_1_subterm_id';
    if (typeof r[col] != 'undefined' && r[col] != null && r[col] != '') {
        inheres_in.part_of = {
            type : {
                id : r.affected_structure_or_process_1_subterm_id,
                label : r.affected_structure_or_process_1_subterm_name
            }
        };
    };
    return inheres_in;
}


bbop.monarch.Engine.prototype.fetchGenoPhenoAsAssociationsBySpecies = function(id,sp,type) {
    // a species to resource map // HARDCODE ALERT
    // TODO: will need to make array so that we can multiple source for each
    // species
    // TODO: - can eventually be dynamic with a service call
    var species_to_resource_map = {
        '10090' : {resources : [{id:'nif-0000-00096-6',label:'MGI'},{id:'nif-0000-03160-2',label:'MPD',filter:{nstdev_abs : '>3.0'}},{id:'nlx_151660-3',label:'IMPC'}], default_taxon : {id : 'NCBITaxon:10090',label : 'Mus musculus'}},
        '7955' : {resources : [{id: 'nif-0000-21427-10',label:'ZFIN'}], default_taxon : {id : 'NCBITaxon:7955', label : 'Danio rerio'}},
        '7227' : {resources : [{id: 'nif-0000-00558-2',label:'FB'}],    default_taxon : {id : 'NCBITaxon:7227', label : 'Drosophila melanogaster'}},
//also not genotypes, only variants
        '6239' : {resources : [{id: 'nif-0000-00053-4',label:'WB'}],    default_taxon : {id : 'NCBITaxon:6239', label : 'Caenorhabditis elegans'}},
//TODO remove OMIM, not genotype
        '9606' : {resources : [{id: 'nif-0000-03216-9',label:'OMIM'}],  default_taxon : {id : 'NCBITaxon:9606', label : 'Homo sapiens'}}    // OMIM - this is a variant table

    };

    var resources = species_to_resource_map[sp].resources;
    var default_taxon = species_to_resource_map[sp].default_taxon;

    var engine = this;
    var all_results = [];
    for (var i=0; i<resources.length; i++) {
    
        var resource = resources[i];

        //make geno-pheno assoc object
        var trAssoc = function (r) {
            var references = engine.makePublicationList(r);
            var geno = engine.makeGenotype(r);
            //var geno = engine.makeNewGenotype(r);
            if (geno.taxon == {} || typeof geno.taxon == 'undefined' || geno.taxon == null) {
                geno.taxon = default_taxon;
            } else if ((geno.taxon.label == 'undefined' || geno.taxon.label == '' || geno.taxon.label == null) && (geno.taxon.id == default_taxon.id)) {
                //sometimes we only get the id, not the label, from upstream; clean it up here
                geno.taxon.label = default_taxon.label;
            }
            var envo = {};
            if (typeof r.environment_id != 'undefined' && r.environment_id != null && r.environment_id != '') {
                envo.type = {};
                envo.type.id = r.environment_id;
            }
            if (typeof r.environment_label != 'undefined' && r.environment_label != null && r.environment_label != '') { 
                if (typeof envo.type == 'undefined') {
                    envo.type = {};
                    envo.type.label = r.environment_label;
                }
            }
            var evidence = {};
            if (typeof r.evidence_code_id != 'undefined' && r.evidence_code_id != null && r.evidence_code_id != '') {
                evidence.type = {
                    id : r.evidence_code_id,
                    code : r.evidence_code_symbol,
                    label : r.evidence_code_label
                }
            }

            var obj = {
                    id : "monarch:disco/" + r.v_uuid,
                    type : "Association",
                    has_genotype : geno,
                    has_environment : envo,
                    has_phenotype : {
                        description : r.phenotype_description_free_text,
                        type : {
                            id : r.phenotype_id,
                            label : r.phenotype_label
                        },
                        modifier : r.phenotype_modifier
                    },
                    inheres_in : engine.makeInheresInFromAssociation(r),
                    evidence : evidence,
                    references : references,
                    source : resource,
                    resource : resource.id
            };
            //TODO should we make sure that this is actually linked to a genotype?  like check if effective_genotype is not empty?
            return obj;
        };


        // TODO: may have to refactor this
        var resultObj = {};
        var filters = {};
        if (typeof resource.filter != 'undefined' && resource.filter != null) {
            filters = resource.filter;
        };
        if (type == 'phenotype') {
            resultObj =
                engine.fetchDataFromResource(null,
                        resource.id,
                        trAssoc,
                        null,
                        id,
                        resource.filter
                        );
        } else {
            resultObj = engine.fetchDataFromResource(id,resource.id,trAssoc,null,null,filters);
        }
        all_results = all_results.concat(resultObj.results);


    }  //end loop over resources
    //TODO uniquify
    var return_results = {};
    return_results.results = all_results;
    return return_results;

}  //end fetchGenoPhenoAsAssociationsBySpecies


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
            // this.log("CACHE " + JSON.stringify(geno, null, ' '));

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

    var engine = this;
    // translate
    var tr =
        function (r) {
            var obj = {

                disease : { 
                    id : r.disease_id,  // todo - disease_id often blank?
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
                      description: r.linkage_description,

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

    // this.log("CATEGORIES:"+JSON.stringify(categories));    
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
    if (atts == []) {
        return scored_profile;
    }
    var att_info =  JSON.parse(resultStr);
    scored_profile.features = att_info;
    if (nots.length > 0) {
        resultStr = this.fetchUrl(url,
                { a : nots,
                  r : categories },
                  'post');
        var not_info = JSON.parse(resultStr);
        // this.log("NOT array:"+JSON.stringify(nots));
        // this.log("NOTS:"+JSON.stringify(not_info));
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
 * Returns phenotypically similar entities of a given type, based on 
 * a call to OwlSim.
 * 
 * This is currently hardcoded to types per species, but will be expanded in the
 * future to be more customizable.
 * 
 * Status: IMPLEMENTED
 * 
 * Arguments: - query : a list of phenotype identifiers 
 *            - target_species : numeric fragment of NCBITaxon identifier 
 *            - target_type : genotype | disease | gene | variation (NOT IMPLEMENTED) 
 *              - cutoff : the number of items to search for 
 *              - metric : (not currently used)
 * 
 */
bbop.monarch.Engine.prototype.searchByPhenotypeProfile = function(query,target_species,target_type,cutoff,metric) {
    var engine = this;
    var defaultMetric = 'combinedScore';
    //this.log("trying to search by phenotype profile..." + JSON.stringify(query));

    var hashKey = engine.getPhenotypeProfileHashKey(query,target_species,target_type,
                            cutoff,metric);
    this.log("trying to find cached entry for "+hashKey);
    if (this.cache != null) {
        this.log("Checking cache for phenotype query..."+hashKey);
        var cached = this.cache.fetch('phenotypeprofile',hashKey);
        if (cached != null) {
            if (cached.apiVersionInfo == null ||
                cached.apiVersionInfo != this.apiVersionInfo()) {
                this.log("cached version is out of date - will not use");
            }
            else {
                return cached;
            }
        }
    } else {
        this.log("No cache for this engine");
    }



    // var id_list = query.split(/[\s,]+/); //assume it's just a simple string
    // list, convert to proper list type
    var id_list = query;
    this.log("Query:"+id_list);
    this.log("|Query| : "+ id_list.length);
    id_list = engine.mapIdentifiersToPhenotypes(id_list);

    var species_to_filter_map = {
            '10090' : { label : 'Mus musculus', target_idspace : 'MGI', b_type : 'gene', b_source : 'nif-0000-00096-6' },
            '9606' : { label : 'Homo sapiens', target_idspace : 'OMIM', b_type : 'disease',b_source : 'nlx_151835-1'},
            '7227' : { label : 'Drosophila melanogaster', target_idspace : 'FBgenoInternal', b_type : 'genotype',b_source : 'nif-0000-00558-2'},
            '7955' : { label : 'Danio rerio', target_idspace : 'ZFIN', b_type : 'gene', b_source : 'nif-0000-21427-10'},
        'UDP': { label :'UDP',target_idspace: 'UDP', b_type:'UDPICS patients',b_source: 'udpics'}
    };

    var resource = {};
    // set defaults
    if (typeof target_species !== 'undefined' && target_species != '' && target_species != null) {
      this.log("No target species supplied.  Fetching best matches for anything.");
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
        b_source.push(res.b_source);
      }
      resource.b_type = b_type.join(",");
      resource.b_source = b_source;
    };
    resource.a_type = 'phenotype_profile';
    resource.label = 'OwlSim Server: '+this.config.owlsim_services_url;

    cutoff = typeof cutoff !== 'undefined' ? cutoff : 5;
    metric = typeof metric !== 'undefined' ? metric : defaultMetric;   

    var taxon = {} ;
    this.log("trying to do comparison. target species is..."+target_species);
    this.log("target is..."+target);
    // TODO: this is currently hardcoded to a single type - needs to be flexible
    // should be based on the target_type
    if (typeof target_species != 'undefined' && target_species != '' && target_species != null) {
      var target = resource.target_idspace;  // HARDCODE

    // taxon is not used after this point
      taxon = { id : 'NCBITaxon:'+target_species, label : species_to_filter_map[target_species].label };
    } 
    else { target = null };                                                                    // ALERT
    console.log("looked up target. found..."+target);
    var queryLookup = {};
    var stuff = engine.searchByAttributeSet(id_list,target,cutoff);
    // this.log(JSON.stringify(stuff,null,' '));

    var similarThings = engine.makeSimComparisonResults(stuff.results,metric,target_type,target_species);

    similarThings.a = id_list;
    similarThings.cutoff = cutoff;
    similarThings.resource = 'OWLSim Server: '+engine.config.owlsim_services_url;
    similarThings.apiVersionInfo = this.apiVersionInfo();

    if (this.cache != null) {
    this.log("storing results for "+hashKey);
    this.cache.store('phenotypeprofile',hashKey,similarThings);
    }
    return similarThings;

}

/* 
 * Function: getPhenotypeProfileHashKye
 *
 * Take a similarity request and generate an appopriate hash key
 *
 * Arugents:
 *     query - a list of input phenotypes
 *     target_species : numeric fragment of NCBITaxon identifier 
 *     target_type : genotype | disease | gene | variation (NOT IMPLEMENTED) 
 *     cutoff : the number of items to search for 
 *    metric : (not currently used)
 * 
 */

bbop.monarch.Engine.prototype.getPhenotypeProfileHashKey  = 
    function(query,target_species,target_type,cutoff,metric) {

    // convert arguments into a string 
    // then hash it.

    // start with the list of the ids. to normalize, we will sort. 


    var hashString = query.sort().toString();
    hashString = hashString + target_species;
    if (target_type != null) {
    hashString = hashString +target_type.toString();
    }
    if (cutoff != null) {
    hashString = hashString +cutoff.toString();
    }
    if (metric != null) {
    hashString = hashString+metric.toString();
    }
    return this.hashCode(hashString);
}


/*
 * Function get Hash Key
 * generates a hash for a string.
 */
bbop.monarch.Engine.prototype.hashCode = function(str) {

    if (env.isRingoJS()) {
        var b64 = require('ringo/base64');
        var input = b64.encode(str);
    }
    else {
        var input = Buffer(str).toString('base64');
    }

    var hash = 5381;
    for (var i = 0; i < input.length; i++) {
        var char = input.charCodeAt(i);
        hash = ((hash << 5) + hash) + char; /* hash * 33 + c */
    }
    return hash;
}



/*
 * Function: makeSimComparisonResults
 * 
 * This will take the results of either a search or comparison (by attribute set)
 * asnd make the same-format returned object
 * 
 * Status: Implemented
 * 
 * Arguments: stuff: the results of the comparison,
 *            metric: the metric type to report in the score object
 *            target_type :  the type of the targets to decorate the results
 *            target_species : an object to decorate the results
 * 
 * Returns: JSON blob with info about the comparison
 */
bbop.monarch.Engine.prototype.makeSimComparisonResults = function(stuff, metric, target_type, target_species) {
    var engine = this;
    var results = [];
    var system_stats = {};
    if (stuff.length > 0) {
        var results_with_metadata = stuff.filter(function (i) { return "system_stats" in i;});
        if (results_with_metadata.length > 0) {
            system_stats = results_with_metadata[0].system_stats;
        }
    }
    
    //HARDCODE ALERT
    //TODO this should be the result of an owlsim call
    if (system_stats != null && typeof system_stats != 'undefined') {
        system_stats.metric_stats = {metric : metric, maxscore : '100', avgscore : '60', stdevscore : '4.32', comment:'These stats are approximations for this release'};
    } else {
        system_stats = {};
        system_stats.metric_stats = {metric : metric, maxscore : '100', avgscore : '60', stdevscore : '4.32', comment:'These stats are approximations for this release'};
    }
    
    for (var i=0; i<stuff.length; i++) {
        // rank is based on rank returned by owlsim, currently hardcoded to be combinedScore
        var r = stuff[i];
        
        var obj = {
            id : r.j.id,
            label : r.j.label,
            type : target_type,
            matches : r.matches,
            //note that the rank is really just relative to the result list, not in all of the database
            //for eaxmple single disease:disease comparisons the match will have rank 1
            score : {metric : metric, score : r[metric], rank : i} } ;
            obj.taxon = engine.mapMatchIdentifierToTaxon(r.j.id);
        if (r.j.id_list) {
            obj.id_list = r.j.id_list;
        }
        
        if (typeof obj.type === 'undefined' || obj.type === null){
            var id_type = engine.resolveIdToType(r.j.id);
            if (id_type) {
                obj.type = id_type;
            } else {
                obj.type = null;
            }
        }
        if (typeof r.matches != 'undefined' && r.matches.length > 0) {
            results.push(obj);
        }
        
    };

    if (results.length > 0) {

        var similarThings = {
            b : results,  // TODO: process results to select only a single
                            // metric, reformat, etc.
            metadata : system_stats,
            resource : {label:'OwlSim Server: '+this.config.owlsim_services_url},
        };
    } else {
        var similarThings = {
                metadata : system_stats
        };
    }

    return similarThings;
}


/*
 * Function: compareEntities
 * 
 * Given a query and one or more target entities (such as a disease, genotype, gene), 
 * this will map them to their phenotypes and perform an OwlSim comparison
 * between the phenotype profiles.  Does not leverage remarkable normality or 
 * NOT annotations. 
 * This function expects an array of ids for the query, and an array of arrays for the target.
 * Each may only have one value.  If you supply a non-phenotype id, this function
 * will attempt to map the entitiy to a list of phenotypes. If an entity is itself a list,
 * each will be mapped to a list of phenotypes and unioned.
 * There are no smarts here; if "opposite" phenotypes are supplied, the query set
 * will contain both of them (which may make a non-sensical query).
 *
 * Status: Implemented
 * 
 * Arguments: query_ids(list) : An array of identifiers, one of: IRI string, OBO-style ID or NIF-style
 *            target_id(list) : An array of identifiers, as for the query.
 * 
 * Returns: JSON blob with info about the comparison
 * TODO: add information profile?
 */
bbop.monarch.Engine.prototype.compareEntities = function(x,y) {
    var engine = this;
    var defaultMetric = 'combinedScore';
    
    if (x.map ==  null) {
        x = [x];
    }

    if (y.map == null) {
        y = [y];
    }
    console.info("X="+JSON.stringify(x)+"; Y="+JSON.stringify(y));
    
    var xphenotype_ids = engine.getPhenotypes(x);
    
    var results = [];
    //for each of the targets, expand them to the list of phenotypes.  then query with the list
    //each target may itself be a list of entities that needs further expansion
    for (var it=0; it<y.length; it++) { 
        var yphenotype_ids = engine.getPhenotypes(y[it]);

        var stuff = {};
    
        var resultObj = engine.fetchAttributeComparisonMatrix(xphenotype_ids,yphenotype_ids);
        if (resultObj != null && resultObj.results != null && typeof resultObj.results[0] != 'undefined') {
            stuff = resultObj.results[0];
        }

        //the target is the list of elements of it
        var target_id = y[it].join('+');

        //get the sciGraph node
        var node = engine.getGraphNodeByID(target_id, engine.config.scigraph_data_url);
        var graph = new bbop.model.graph();
        graph.load_json(node);
        var node = graph.get_node(target_id);
        if (node != null) {         
            stuff.j = { id : target_id, 
                        label : node.label(),
                        type : engine.mapIdentifierType(target_id),
                        id_list : yphenotype_ids};
        } else {
            stuff.j = { id : target_id, 
                        id_list : yphenotype_ids};
        }
        stuff.taxon = engine.fetchTaxon(target_id);

        results.push(stuff);
    }
    var comp = engine.makeSimComparisonResults(results,defaultMetric);

    //TODO abstract this out to a function!
    var a = {};
    if (x.length == 1) {
        var n = engine.getGraphNodeByID(x[0], engine.config.scigraph_data_url);
        var graph = new bbop.model.graph();
        graph.load_json(n);
        var node = graph.get_node(x[0]);
        a.id = x[0];
        a.label = node.label();
        a.type = engine.mapIdentifierType(x[0])   //TODO replace with a scigraph call
        a.taxon = engine.fetchTaxon(x[0]);  //TODO replace with a scigraph call
    } else {
        var xlabels = [];
        x.forEach( function (xid) {
            var n = engine.getGraphNodeByID(xid, engine.config.scigraph_url);
            var graph = new bbop.model.graph();
            graph.load_json(n);
            var node = graph.get_node(xid);
            if (node != null && !node.label()) {
                xlabels.push(node.label());
            } else {
                xlabels.push(xid);
            }
        })
        a.label = xlabels.join('+')
    }
    a.id_list = xphenotype_ids;

    comp.a = a;
    return comp;    
}
//Get the categories of a node
bbop.monarch.Engine.prototype.getCategories = function(id) {
    var engine = this;
    var categories = [];
    var nodeByID = engine.getGraphNodeByID(id, engine.config.scigraph_data_url);
    var graph = new bbop.model.graph();
    graph.load_json(nodeByID);
    var node = graph.get_node(id.replace('OBO:UPHENO_', 'UPHENO:'));
    if (node) {
        var metadata = node.metadata();

        if (metadata && metadata['category']) {
            var categories = metadata['category'];
        }
    }
    return categories;
};

/*
 * In comparison to getCategories, resolveIdToType attempts to select
 * a single category to represent to the "type" of the ID.  For example
 * a variant ID may be categorized as several types of variants
 * but in many cases we are only interested that an ID is a variant
 * 
 * Arguments
 *     - id - iri formatted as a curie
 * Returns
 *     - type: type as string or false if type cannot be determined
 */
bbop.monarch.Engine.prototype.resolveIdToType = function(id) {
    var engine = this;
    var type = false; //Return false if no type is found
    var nodeByID = engine.getGraphNodeByID(id, engine.config.scigraph_data_url);
    var graph = new bbop.model.graph();
    graph.load_json(nodeByID);
    var node = graph.get_node(id.replace('OBO:UPHENO_', 'UPHENO:'));
    if (node) {
        var metadata = node.metadata();

        var variant_categories = ['sequence alteration','variant locus','sequence feature'];
        var model_categories = ['cell line', 'organism'];

        if (metadata && metadata['category']) {
            var category = metadata['category'][0];
            if (metadata['category'].indexOf('disease') > -1) {
                type = 'disease';
            } else if (metadata['category'].indexOf('Phenotype') > -1) {
                type = 'phenotype';
            } else if (variant_categories.indexOf(category) > -1) {
                type = 'variant';
            } else if (model_categories.indexOf(category) > -1) {
                type = 'model';
            } else {
                // Take the first category
                // This works for now but may need improvement
                type = category.toLowerCase();
            }
        // TODO Remove when we push the latest scigraph
        } else {
            // See if we're a model
            if (/^(Coriell|FBst|JAX)/.test(id)) {
                type = 'model';
            }
        }
    }
    return type;
};

/*Converts RRID prefixed ids and fragments to curies
 * Arguments
 *     - id - fragment or RRID prefixed curie
 * Returns
 *     - id - id formatted as curie
 */
bbop.monarch.Engine.prototype.convertIdToCurie = function(id) {
    //Curify ID
    if (/_/.test(id) && !/\:/.test(id)){
        id = id.replace("_",":");
    }
    //If we're an RRID
    if (/^RRID:/.test(id)){
        id = id.replace("RRID:","");
    }
    return id;
};

//This function maps an identifer to a taxon, and is used
//particularly when retrieving phenotype matches from owlsim server
bbop.monarch.Engine.prototype.mapMatchIdentifierToTaxon = function(id) {
    var taxon = {};
    id = id.trim();
    if (id.match(/^MGI/)) {
        taxon.id = 'NCBITaxon:10090';
        taxon.label = 'Mus musculus';
    } else if (id.match(/^ZFIN/) || id.match(/ZDB/)) {
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
    } else if (id.match(/^NCBIGene/)) {
        taxon = this.fetchTaxon(id)
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
    if (str.match(/Biogrid/i)) {
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
   } else if (str.match(/GeneReviews/i)) {
        source.id = "omics_00269-1";
    } else if (str.match(/HGNC/)) {
        source.id = "nif-0000-02955";
    } else if (str.match(/HPO/)) {
        source.id = "nlx_151835";
    } else if (str.match(/IMPC/)) {
        source.id = "nlx_151660";
    } else if (str.match(/KEGG/)) {
        source.id = "nlx_31015";
    } else if (str.match(/MGI/)) {
        source.id = "nif-0000-00096";
    } else if (str.match(/MPD/)) {
        source.id = "nif-0000-03160";
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


// a helper function to determine if a non-phenotype object has phenotype associations
bbop.monarch.Engine.prototype.hasPhenotypeAssociations = function(id, type) {
    var engine = this;
    var info = {};

    engine.log("DETERMINING IF ORTHOLOGS HAVE PHENOTYPES FOR: "+id);

    if (type == null || type == '') {
        //need to resolve the id
        type = engine.mapIdentifierType(id);
    }
    //if we have a type, then it's easier
    switch (type) {
        case 'gene':
            info = engine.fetchGeneInfo(id);
            break;
        case 'genotype':
            info = engine.fetchGenotypeInfo(id);
            break;
        case 'disease':
            info = engine.fetchDiseaseInfo(id);
            break;
    }

    if (typeof info != 'undefined' && info != null && info != {}) {
        var ret = (info.phenotype_associations != null && info.phenotype_associations.length > 0);
        engine.log(ret);
        return ret;
    }

    return false;

}

// EXAMPLE:
// http://beta.neuinfo.org/services/v1/federation/data/nif-0000-00432-1.json?exportType=data&q=42757
bbop.monarch.Engine.prototype.fetchGeneInteractions = function(id) {
    var resource = { id : 'nif-0000-00432-1', label : 'BioGrid' }; // HARCODE ALERT
    var engine = this;    

    var resultObj = {};

    //repeat fetching for interactions in both directions
    ['a','b'].forEach( function(col) {
        var filter_col = 'interactor_'+col+'_gene_id';
        var filter = {}; filter[filter_col] = id;
        var geneacol = 'interactor_a';
        var genebcol = 'interactor_b';
        //swap if we are looking in reverse direction
        if (col =='b') {
            geneacol = 'interactor_b';
            genebcol = 'interactor_a';
        }
            
    
        //translate
        var tr = 
        function (r) {
            var sources = [resource];
            if (!r.source_database_label.match(/biogrid/i)) {
                sources.push({id : r.source_database_id, label : r.source_database_label});
            }
            var obj = {
            genea : {
                  id: r[geneacol+'_gene_id'],
                  label: r[geneacol+'_gene_label'],
                  taxon : { id : r[geneacol+'_taxon_id'], label : r[geneacol+'_taxon_label'] },
                },
            geneb : {
                  id: r[genebcol+'_gene_id'],
                  label: r[genebcol+'_gene_label'],
                  taxon : { id : r[genebcol+'_taxon_id'], label : r[genebcol+'_taxon_label'] },
                },
            interaction_type : {id : r.interaction_type_id, label : r.interaction_type_label },
            interaction_detection: r.interaction_detection_method_label,
            references: [{
                       id : 'PMID:' + r.pubmed_id
                    }],
            //TODO { id : r.publication_id },    
            // provenance
            sources : sources,
            resource : resource.id
            };
            return obj;
        };

        resultObj[col] =
            engine.fetchDataFromResource(null,
                                   resource.id,
                                   tr,
                                   null,
                                   null,
                                   filter,
                                   null,
                                   null );

        engine.log("Fetched "+resultObj[col].results.length+" interactions for direction "+col+" for "+id);
    });

    // Combine result objects
    var results = [];
    results = results.concat(resultObj["a"].results);
    results = results.concat(resultObj["b"].results);

    // need to make this a function
    var uniqResults = {};
    var unique = {};
    uniqResults.results = [];
    
    for (var i=0; i<results.length; i++){
        var cat = results[i].genea.id+
                  results[i].geneb.id+
                  results[i].interaction_type;
        if (cat in unique){
            continue;
        } else {
            uniqResults.results = uniqResults.results.concat(results[i]);
            unique[cat] = 1;
        }
    }
   
    //engine.log("UNIQ INX"+JSON.stringify(uniqResults));
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
    this.log("|Atts| = "+atts.lnegth);
    this.log("Atts:"+atts);
    this.log("Filter:"+JSON.stringify(tf));
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
                this.warn("Not supported: tf = "+tf.type);
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
        else if (tf.species == 'UDPICS') {
            ph.target = 'UDPICS';
        }
                else {
                    this.warn("Species not yet supported: " + tf.species);
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
            'post');
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
    this.log("|Atts| = "+atts.lnegth);
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
    this.log("STATS: "+JSON.stringify(stats));
    return stats;
}


//given two sets of phenotypes, it calls owlsim to perform the comparison
//we assume the inputs here to be lists of phenotypes
bbop.monarch.Engine.prototype.fetchAttributeComparisonMatrix = function(x,y) {

    var engine = this;

    engine.info("Comparing "+x+" to "+y);

    if (x.map == null) {
        x == [x];
    }

    if (y.map == null) {
        y == [y];
    }

    engine.log("X IDs="+x);
    engine.log("Y IDs="+y);

    var resultStr = this.fetchUrl(this.config.owlsim_services_url + '/compareAttributeSets',
            {
                a : x,
                b : y,
            },
            'post');
    return JSON.parse(resultStr);
}

// E.g. ('OMIM_127750', [model1, model2, ...])
// fetchAttributeComparisonMatrix can now handle multiple entities as targets
// Status: deprecated
bbop.monarch.Engine.prototype.fetchAttributeMultiComparisonMatrix = function(x,model_ids) {

    // TODO - remove this hardwired assumption (disease x model)
    var disease = this.fetchDiseaseInfo(x);


    var disease_phenotype_set = {};
    for (var j in disease.phenotype_associations) {
        disease_phenotype_set[disease.phenotype_associations[j].phenotype.id] = 1;
    }

    var model_phenotype_set = {};

    var models_by_phenotype_map = {};

    this.log("MOD_IDS=" + model_ids);
    for (var k in model_ids) {
        var model_id = model_ids[k];
        this.log(" MOD=" + model_id);
        var model = this.fetchGenotypeInfo(model_id);
        for (var j in model.phenotype_associations) {
            var pa = model.phenotype_associations[j];
            // if (pa.has_phenotype == null) {
            // this.log(" HUH?" + JSON.stringify(pa));
            // }
            var ph = pa.has_phenotype.type;
            this.log("   PHID=" + ph.id);
            model_phenotype_set[ph.id] = 1;
            if (models_by_phenotype_map[ph.id] == null) {
                models_by_phenotype_map[ph.id] = [];
            }
            models_by_phenotype_map[ph.id].push(model_id);
        }
    }

    var disease_phenotype_ids = Object.keys(disease_phenotype_set);
    var model_phenotype_ids = Object.keys(model_phenotype_set);

    this.log("DP IDs="+disease_phenotype_ids);
    this.log("MP IDs="+model_phenotype_ids);

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
    this.log("EXCLUDE PIDs: "+exclude_pids);
    this.log("PIDs (pre-filter): "+pids);
    pids = pids.filter( function(pid) { return exclude_pids.indexOf(pid) == -1 } );
    this.log("PIDs (post-filter): "+pids);
    return pids;
}

bbop.monarch.Engine.prototype.expandIdentifierToPhenotype = function(id) {
    var engine = this;
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
        this.log("Expanding disease ID to phenotype: "+id);
        resultObj = this.fetchOmimDiseasePhenotypeAsAssocations(id);
        phenotype_associations = phenotype_associations.concat(resultObj.results);
        return phenotype_associations.map( function(a) {return a.phenotype.id});
    }
    if (this.mapIdentifierType(id) == 'gene' || this.mapIdentifierType(id) == 'genotype') {
        if (this.mapIdentifierType(id) == 'gene') {
            this.log("Expanding gene ID "+id+" to phenotype: "+id);
            resultObj = engine.fetchGeneInfo(id.trim());
            engine.log("Found gene info: "+JSON.stringify(resultObj));
        } else {
            this.log("Expanding genotype ID "+id+" to phenotype: "+id);
            resultObj = engine.fetchGenotypeInfo(id.trim());
            engine.log("Found genotype info: "+JSON.stringify(resultObj));
        }
        if (resultObj != null ) {    
            phenotype_associations = phenotype_associations.concat(resultObj.phenotype_associations);
            return phenotype_associations.map( function(a) {
                if (typeof a.has_phenotype != 'undefined' && typeof a.has_phenotype.type != 'undefined') {
                    return a.has_phenotype.type.id;
                } else if (typeof a.phenotype != 'undefined') {
                    return a.phenotype.id}
                });
        }
    }
    this.log("Assuming id is a phenotype: "+id);
    return id;
}


/*
 * Given a list of identifiers, map each to one or more phenotypes using
 * SciGraph services 
 *
 */
bbop.monarch.Engine.prototype.getPhenotypes = function(id_list) {
    //should this return a list of nodes, or just a list of ids?  
    var engine = this;
    var expanded_list = [];
    
    for (var i=0; i<id_list.length; i++) {
        var id = id_list[i];
        var categories = engine.getCategories(id);
        if (categories.indexOf('Phenotype') > -1) {
            expanded_list.push(id);
        } else {
            var phenotype_list = engine.fetchPhenotypes(id);
            phenotype_list = engine.filterPhenotypeList(phenotype_list, true);
            expanded_list = expanded_list.concat(phenotype_list);
        }
    }
    
    return expanded_list;
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
    if (db == 'NCBIGene' || db == 'MGI' || db == 'ZFIN') {
        //TODO this wrongly assumes the MGI things are genes!!!  (could be anything)
        //TODO need a proper identifier resolver...right now we can't get non-ncbigenes
        return 'gene';
    }
    return null;
}

//not all items are indexed in the ontology.  this is a lookup
//to try to fetch it from our cached objects.  this definitely needs to get better
/* TODO delete me
bbop.monarch.Engine.prototype.getLabel = function(id) {
    var engine = this;
    var info = {};
    if (engine.mapIdentifierType(id) == 'phenotype') {
        info = engine.fetchPhenotypeInfo(id);
    }
    else if (engine.mapIdentifierType(id) == 'disease') {
        info = engine.fetchDiseaseInfo(id);
    }
    else if (engine.mapIdentifierType(id) == 'gene') {
        info = engine.fetchGeneInfo(id);
    } else { //fallback to genotype.  HACK
        info = engine.fetchGeneInfo(id); //try generic gene lookup just in case it's a non-ncbigene
        if (info == null || info == '{}') {
            info = engine.fetchGenotypeInfo(id);
        }
    }
    return info.label;
}
*/
// A generic wrapper to fetch all pathway information, given some pathway query
// Status: NOT IMPLEMENTED
bbop.monarch.Engine.prototype.fetchPathwayInfo = function(q) {
  // TODO: add cache checks here --uncomment
/*
 * if (this.cache != null) { var cached = this.cache.fetch('pathway', id); if
 * (cached != null) { if (cached.apiVersionInfo == null || cached.apiVersionInfo !=
 * this.apiVersionInfo()) { this.log("cached version is out of date - will
 * not use"); } else { this.log("Using Cached version of "+id); return
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
    this.log("Fetching GenesForPathway: "+id);
    resource_id = 'nlx_31015-3'; // HARDCODE ALERT
    // set default species to human
    if (typeof species == 'undefined') {
        this.log("ERROR: no species supplied for gene fetching. Defaulting to human, 9606.");
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
                            sources : []
                            };

            if (mappings[r.id]) {
                mapping = mappings[r.id];
            } else {
                mappings[r.id] = mapping;
            }
            mapping.sources.push({label : r.mapping_resource});
   
     return mapping;
    };
//    var filters = ["source:NCBIGene","mapped_id:"+this.quote(this.getFederationNifId(id))];
    var filters = { source : "NCBIGene", mapped_id : engine.getFederationNifId(id) };

    var resultObj = this.fetchDataFromResource(null, resource_id, tr,null,null,filters,null,null,null);

    if (resultObj.results == 0 ) {
        // no match
        // try splitting out any idspace/prefix and identifier before the query
        var idsplit=id.match(/(\w+)[\:_]([\w\-]+)/);
        this.log("ID MATCHES:"+idsplit);
        var idspace;
        var newid;
        if ((idsplit != null) && (idsplit.length > 2)){
            idspace = idsplit[1];
            newid = idsplit[2];
        }
        
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
    //this.log("NCBI:KEGG:"+JSON.stringify(ncbiToKeggGene));
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
//        var filters = ["gene_id:"+this.quote("NCBIGene:"+id)];
        var filters = { gene_id : "NCBIGene:"+id };

        var keggGeneToKO = this.fetchDataFromResource(null,kegg_ko_map_resource_id, keggtr, null, null,filters,null,null,null);
        return keggGeneToKO.results;
    //} else {
    //    return [];
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

    this.log("Looked up KO id: "+ko_id);
    this.log("Hacking the lookup for NIF -- removing preceding K from identifier until id queries are fixed");
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
        gene.pathways.push({id: r.pathway_id.replace("-",":"),
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

    // this.log('PATHWAY LOOKUP:'+JSON.stringify(resultObj));
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
     *  } } this.log(JSON.stringify(pathList));
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

    // this.log('PATHWAYBYDISEASE: '+JSON.stringify(resultObj,' ', null));

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
            var pathway = {id : pathway_ids[i].replace("-",":"), label : pathway_labels[j].trim()};
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
    // this.log(associations,null,' ');
    return associations;
}

/*
 * given a set of genes (in the gene_assoc list), fetch the pathways, and infer
 * that the diseases are linked to the pathways via the genes
 */
bbop.monarch.Engine.prototype.fetchInferredDiseasePathwayAssociations = function(id,label,gene_assoc) {
    var engine = this;
    var genes = gene_assoc.map(function(g) { return g.gene });
    // this.log('GENES:'+JSON.stringify(genes,null,' '));
    var associations = [];
    for (var i=0; i<genes.length; i++) {    
        var gene = genes[i];
        var genePathways = engine.fetchPathwaysForGene(gene.id);
        // this.log('GENEPATHWAYS:'+JSON.stringify(genePathways));
        if (genePathways == null || genePathways.pathways == null ) continue;
        for (var j=0; j<genePathways.pathways.length; j++) {    
            var pathway = genePathways.pathways[j];
            pathway.id = pathway.id.replace("-",":");
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

//Using for testing cached graph objects
bbop.monarch.Engine.prototype.getCacheFile= function(cacheDir,cacheName) {
    //Check cache
    if (this.cache != null) {
        var cached = this.cache.fetch(cacheDir, cacheName);
        if (cached != null) {
            return cached;
        }
    }
}

/*
 * Function: generateHistogram
 * 
 * Queries NIF using facets to get counts of data loaded into 
 * the Monarch application and generates a JSON object that
 * can be passed to D3 functions to create interactive histograms
 * 
 * Arguments:
 * id
 * levels
 * filter: TODO add functionality to filter on disease ID
 * 
 * Returns: JSON object that can be utilized with d3.layout.histogram()
 * 
 * Example Output: {"counts":[{"value":3252,"name":"Human"},
 *                 {"value":7044,"name":"Mouse"}],
 *                  "label":"Growth abnormality"}
 */
bbop.monarch.Engine.prototype.getPhenotypeDistro = function(id,levels,isCached) {
    //Check cache
    if (this.cache != null) {
        var cached = this.cache.fetch('stats', 'phenotype-annotation-distro');
        if (cached != null) {
            if (cached.apiVersionInfo == null || cached.apiVersionInfo != this.apiVersionInfo()) {
                this.log("cached version is out of date - will not use");
            }
            else {
                return cached;
            }
        }
    }
    
    var engine = this;
    var summary_statistics = {};
    //D3 JSON object
    var dataGraph = [];
    summary_statistics.apiVersionInfo = this.apiVersionInfo();
    var resultCount;
    //deincrement level
    if (levels){
        levels--;
    }
    //HARDCODE ALERT, 
    var resources = [ {id : 'nlx_151835-1',      label : 'Human'  },
                      {id : 'nif-0000-00096-6',  label : 'Mouse' }
                   // {id : 'nif-0000-21427-10', label : 'ZFIN'},
                   // {id : 'nif-0000-00053-4',  label : 'WB'  },
                   // {id : 'nif-0000-00558-2',  label : 'FB'  }
                    ];
    
    //Get HP terms and labels
    var hp_labels = engine.getDirectSubClasses(id);
    
    Object.keys(hp_labels).forEach(function(category) {
        var group = {};
        group.counts = [];
        group.label = hp_labels[category];
        //Reformat labels
        group.label = group.label.replace(/Abnormality of (the )?/,"");
        var capLabel = group.label.replace(/\b[a-z]/g, function() {
                       return arguments[0].toUpperCase()});
        group.label = capLabel;
        group.id = category;
        var subclassQuery = category;
        resources.forEach(function(resource) {

            var resultObj={};
            try {
                resultObj = engine.fetchDataFromResource(null,resource.id,
                        null,null,
                        subclassQuery,null,null,0);
            }
            catch(err){
                console.error("caught exception "+err+"for "+resource.id);
                var d3Bar = {
                         "value" : 0,
                         "name" : resource.label
                        };
                group.counts = group.counts.concat(d3Bar);
            }
            if (resultObj.results){
                var d3Bar = {
                             "value" : resultObj.resultCount,
                             "name" : resource.label
                            };
                group.counts = group.counts.concat(d3Bar);
            }
        });
        if (levels > 0){
            //Recursively call function
            var subGraph = engine.getPhenotypeDistro(category,levels);
            group.subGraph = subGraph.dataGraph;
        }
        dataGraph=dataGraph.concat(group);
    });

    engine.log(JSON.stringify(dataGraph));
    
    summary_statistics.dataGraph = dataGraph;

    if ((this.cache != null) && (isCached)) {
        this.cache.store('stats', 'phenotype-annotation-distro',summary_statistics);
    }
    return summary_statistics;
}

bbop.monarch.Engine.prototype.getDiseaseGeneDistro = function(id,levels,isCached) {
    var engine = this;
    //Check cache
    if (this.cache != null) {
        var cached = engine.cache.fetch('stats', 'disease-gene-distro');
        if (cached != null) {
            if (cached.apiVersionInfo == null || cached.apiVersionInfo != this.apiVersionInfo()) {
                engine.log("cached version is out of date - will not use");
            }
            else {
                return cached;
            }
        }
    }
    
    
    var summary_statistics = {};
    //D3 JSON object
    var dataGraph = [];
    summary_statistics.apiVersionInfo = this.apiVersionInfo();
    
    //deincrement level
    if (levels){
        levels--;
    }
    
    var subClasses = engine.getDirectSubClasses(id);
    
    Object.keys(subClasses).forEach(function(diseaseClass) {
        var group = {};
        group.counts = [];
        group.label = subClasses[diseaseClass];
        //Reformat labels
        group.label = group.label.replace(/Abnormality of (the )?/,"");
        var capLabel = group.label.replace(/\b[a-z]/g, function() {
                       return arguments[0].toUpperCase()});
        group.label = capLabel;
        group.id = diseaseClass;
        try {
            var geneAssoc = engine.fetchDiseaseGeneAssociations(diseaseClass,'disease');
            geneCount = engine.unique(geneAssoc.map(function(g) {return g.gene.id}));
        }
        catch(err){
            console.error("caught exception "+err);
            var d3Bar = {
                         "value" : 0,
                         "name" : 'Human'
                        };
            group.counts = group.counts.concat(d3Bar);
        }
        if (geneCount){
            var d3Bar = {
                         "value" : geneCount.length,
                         "name" : 'Human'
                        };
            group.counts = group.counts.concat(d3Bar);
        } else {
            var d3Bar = {
                     "value" : 0,
                     "name" : 'Human'
                    };
            group.counts = group.counts.concat(d3Bar);
        }
        if (levels > 0){
            //Recursively call function
            var subGraph = engine.getDiseaseGeneDistro(diseaseClass,levels);
            group.subGraph = subGraph.dataGraph;
        }
        dataGraph=dataGraph.concat(group);
    });

    engine.log(JSON.stringify(dataGraph));
    
    summary_statistics.dataGraph = dataGraph;
    
    if ((this.cache != null) && (isCached)) {
        this.cache.store('stats', 'disease-gene-distro',summary_statistics);
    }
    
    return summary_statistics;
    
}
//TODO eventually refactor all of these datagraph functions into this
bbop.monarch.Engine.prototype.getPhenotypeGenotypeDistro = function(id,levels,isCached,cacheName,countFn) {
    var engine = this;
    //Check cache
    if (this.cache != null) {
        var cached = engine.cache.fetch('stats', cacheName);
        if (cached != null) {
            if (cached.apiVersionInfo == null || cached.apiVersionInfo != this.apiVersionInfo()) {
                engine.log("cached version is out of date - will not use");
            }
            else {
                return cached;
            }
        }
    }
    
    var taxMap = {};
    
    /*var taxMap = {
            10090 : "Mouse",
            7955  : "Zebrafish",
            6239  : "Nematode",
            9606  : "Human",
            7227  : "Fruit Fly"
    };*/
    if (countFn == 'fetchGenoPhenoAsAssociationsBySpecies'){
        taxMap = {
                10090 : "Mouse" 
        };
    } else if (countFn == 'getPhenotypeGeneCounts') {
        taxMap = {
                9606  : 'Human',
                10090 : "Mouse"    
        };   
    } else {
        taxMap = {
                10090 : "Mouse"
        };
    }
    
    var summary_statistics = {};
    //D3 JSON object
    var dataGraph = [];
    summary_statistics.apiVersionInfo = this.apiVersionInfo();
    
    //deincrement level
    if (levels){
        levels--;
    }
    
    var subClasses = engine.getDirectSubClasses(id);
    
    Object.keys(subClasses).forEach(function(phenotypeClass) {
        var group = {};
        group.counts = [];
        group.label = subClasses[phenotypeClass];
        //Reformat labels
        group.label = group.label.replace(/Abnormality of (the )?/,"");
        var capLabel = group.label.replace(/\b[a-z]/g, function() {
                       return arguments[0].toUpperCase()});
        group.label = capLabel;
        group.id = phenotypeClass;
        Object.keys(taxMap).forEach(function(tax) {
            var statCount;
            if (countFn == 'fetchGenoPhenoAsAssociationsBySpecies') {
                try {
                    var genoCount = engine.fetchGenoPhenoAsAssociationsBySpecies(phenotypeClass,tax.toString(),'phenotype').results;
                    statCount = genoCount.length;
                }
                catch(err){
                    console.error("caught exception "+err);
                    var d3Bar = {
                            "value" : 0,
                            "name" : taxMap[tax]
                           };
                    group.counts = group.counts.concat(d3Bar);
                }
            } else if (countFn == 'getPhenotypeGeneCounts'){
                try {
                    var statCount = engine.getPhenotypeGeneCounts(phenotypeClass,tax);
                }
                catch(err){
                    console.error("caught exception "+err);
                    var d3Bar = {
                            "value" : 0,
                            "name" : taxMap[tax]
                           };
                    group.counts = group.counts.concat(d3Bar);
                }
            }
            if (statCount){
                var d3Bar = {
                             "value" : statCount.length,
                            "name" : taxMap[tax]
                            };
                group.counts = group.counts.concat(d3Bar);
            } else {
                var d3Bar = {
                            "value" : 0,
                            "name" : taxMap[tax]
                            };
                group.counts = group.counts.concat(d3Bar);
            }
        });
        if (levels > 0){
            //Recursively call function
            var subGraph = engine.getPhenotypeGenotypeDistro(phenotypeClass,levels,false,cacheName,countFn);
            group.subGraph = subGraph.dataGraph;
        }
        dataGraph=dataGraph.concat(group);
    });

    engine.log(JSON.stringify(dataGraph));
    
    summary_statistics.dataGraph = dataGraph;
    
    if ((this.cache != null) && (isCached)) {
        this.cache.store('stats', cacheName, summary_statistics);
    }
    
    return summary_statistics;
    
}

bbop.monarch.Engine.prototype.getPhenotypeGeneCounts = function(id,tax) {
    var engine = this;
    var genes = [];
    var geneCount;
    
    if (tax == 9606){

        var resultObj = engine.fetchOmimDiseasePhenotypeAsAssocations(id);
        var disease_associations = resultObj.results;
    
        for (var i = 0; i < disease_associations.length; i++) {
            var disease = disease_associations[i].disease;
            genes = genes.concat(engine.fetchDiseaseGeneAssocsInfo(disease.id));
        }
        geneCount = engine.unique(genes.map(function(g) {return g.gene.id}));
        return geneCount;
    } else {
        var genotype_associations = [];
        genotype_associations = genotype_associations.concat(engine.fetchGenoPhenoAsAssociationsBySpecies(id,tax.toString(),'phenotype').results);
        gene_associations = gene_associations.concat(this.makeInferredGenePhenotypeAssociations(genotype_associations));
        geneCount = engine.unique(gene_associations.map(function(g) {return g.gene.id}));
        return geneCount;        
    }
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
 * Services used: - SciGraph
 * 
 * Options: - level
 * 
 * 
 * Arguments: - id : An CURIE identifier
 * 
 * Returns: Class struct as JSON
 */
bbop.monarch.Engine.prototype.fetchClassInfo = function(id, opts) {

    var resultObj = {};
    var engine = this;
    
    var res = engine.getVocabularyTermByID(id);
    //TODO do we need to handle lists of >1
    resultObj = {};
    if (typeof res.concepts !== 'undefined' && 
            typeof res.concepts[0] != 'undefined'){
        resultObj = res.concepts[0];
    } else if (res != null) {
        resultObj = res;
    }
    
    resultObj.id = id; 
            
    if ('labels' in resultObj && resultObj.labels[0] != null) {
        resultObj.label = resultObj.labels[0];
    } else {
        resultObj.label = id;
    }
    
    var nodeByID = engine.getGraphNodeByID(id);
    var xrefs = "http://www.geneontology.org/formats/oboInOwl#hasDbXref";
    
    // Hack for OMIM IRIs
    if ('iri' in resultObj && /^http:\/\/purl\.obolibrary\.org\/obo\/OMIM_/.test(resultObj['iri'])) {
        resultObj['iri'] = resultObj['iri'].replace(/^http:\/\/purl\.obolibrary\.org\/obo\/OMIM_/,'http://www.omim.org/entry/');
    }
    
    var graph = new bbop.model.graph();
    graph.load_json(nodeByID);
    var node = graph.get_node(id);
    if (node){
        var metadata = node.metadata();
    
        if (metadata && metadata[xrefs]){
            resultObj.database_cross_reference = metadata[xrefs];
        }
        if (metadata && metadata['definition'] && !resultObj.definitions){
            resultObj.definitions = metadata['definition'];
        }
    }
     
    if (opts != null) {
        if (opts.level != null && opts.level > 0) {
            
            var neighbors = engine.getGraphNeighbors(id,opts.level);
            var triples = [];
            
            var ontoGraph = new bbop.model.graph();
            ontoGraph.load_json(neighbors);
            var children = ontoGraph.get_child_nodes(id, 'subClassOf');
            if (typeof children  != 'undefined' && children.length == 0){
                resultObj.isLeafNode = true;
            } else {
                if (id.match(/^OMIM/)) {
                    // Always treat OMIMs as leaf nodes. There may be some circumstances that lead to
                    // MESH IDs being placed under OMIMs
                    // https://github.com/monarch-initiative/monarch-disease-ontology/issues/16
                    resultObj.isLeafNode = true;
                }
                else {
                    resultObj.isLeafNode = false;
                }
            }
            // Iterating over edges to make triples
            // Maybe this is crazy and we should just have our upstream code
            // handle bbop graphs
            ontoGraph.all_edges().forEach(function(edge){
                var sub_metadata = ontoGraph.get_node(edge.subject_id()).metadata();
                var obj_metadata = ontoGraph.get_node(edge.object_id()).metadata();

                // Check to see if categories exist, designed to remove classes that we don't want display
                // on the front end ontology view
                if (!((typeof sub_metadata.category != 'undefined' && sub_metadata.category.length > 0)
                           && (typeof obj_metadata.category != 'undefined' && obj_metadata.category.length > 0))){
                    return;
                } 
                var triple = {
                        'subject' : {
                            'id' : edge.subject_id(),
                            'label' : ontoGraph.get_node(edge.subject_id()).label()
                        },
                        'property' : {
                            'id' : edge.predicate_id(),
                            'label' : edge.predicate_id()
                        },
                        'object' : {
                            'id' : edge.object_id(),
                            'label' : ontoGraph.get_node(edge.object_id()).label()
                        },
                        'source' : 'SciGraph'
                };
                    triples.push(triple);
            });
            resultObj.relationships = triples;
            
            var equivalentNodes = engine.getEquivalentNodes(id, ontoGraph);
            resultObj.equivalentNodes = equivalentNodes;
            resultObj.equivalentClasses = equivalentNodes.map(function (i) { return i.id; });
        }
    }
            
    return resultObj;
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
    var engine = this;
    var q = opts;
    q.content = txt;
    if (!opts || !'longestOnly' in opts || !opts.longestOnly){
        opts.longestOnly = 'false';
    }
    var annotate_url = this.config.scigraph_url + "annotations/entities.json";
    var res = 
        this.fetchUrl(annotate_url, q); 
    var results = JSON.parse(res);
    results.forEach(function(r) {
        if (r.token.id != null) {
            var url = r.token.id;
            r.token.url = url;
            r.token.id = url.replace(/.*\//g,"");
            r.token.taxon = '';
        }
    });
    
    // Fetch taxon
    var id_list = results.filter(function(i) { return (i.token.categories.indexOf('gene') > -1); })
                         .map( function(i) { return (i.token.id); });
    var neighbors = engine.getGraphNeighbors(id_list, 1, 'http://purl.obolibrary.org/obo/RO_0002162', 'BOTH', false, engine.config.scigraph_data_url);
    var graph = new bbop.model.graph();
    graph.load_json(neighbors);
    id_list.forEach(function (id) {
        var label = '';
        var taxon_list = graph.get_parent_nodes(id, 'http://purl.obolibrary.org/obo/RO_0002162');
        if (taxon_list && taxon_list.length > 0){
            label = taxon_list[0].label();
            var meta = taxon_list[0].metadata();
            if (meta && meta['synonym']) {
                label = meta['synonym'][0];
            }
            label = label.replace(/\b[a-z]/g, function() {
                return arguments[0].toUpperCase()
            });
        }
        for (i = 0; i < results.length; i++){
            if (results[i]['token']['id'] == id) {
                results[i]['token']['taxon'] = label;
            }
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
bbop.monarch.Engine.prototype.searchSubstring = function(term,categories,limit) {

    var engine = this;
    var results = [];
    if (limit == null){
        limit = 20;
    }
    if (categories == null){
        categories = engine.getDefaultCategories();
    }
    var searchSynonyms = true;
    var searchType = 'autocomplete';
    
    
    var sciObj = engine.getVocabularyByTerm(term,searchType,limit,categories,searchSynonyms);
    if (sciObj instanceof Object && 'list' in sciObj && sciObj.list instanceof Array){
        results = sciObj.list;
    } else if (sciObj instanceof Array) {
        results = sciObj;
    }

    results.forEach(function(r,i,resultList) {
        if (r.concept.curie != null){
            resultList[i].id = r.concept.curie;
        } else if (r.concept.fragment != null){
            resultList[i].id = r.concept.fragment;
        }
        if (r.concept.labels instanceof Array &&
            r.concept.labels[0] != null ){
            resultList[i].label = r.concept.labels[0];
        }
        if (r.concept.categories){
            r.concept.categories = r.concept.categories.map(function(i){return i.toLowerCase();});
        }
    });
    
    var filtered = [];

    // filter dups
    // TODO Do we need this with scigraph?
    for (var i =0; i < results.length; i++) {
        var rec = results[i];
        var found = false;
        for (var j =0; j < filtered.length; j++) {
             if (results[i].id === filtered[j].id) 
            {
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
    var engine = this;
    var results = [];
    var searchSynonyms = true;
    var categories = engine.getDefaultCategories();

    if (/\S+:\S+/.test(term)) {
        term = engine.quote(term);
    }
    
    var limit = 100;
    var searchType = 'search';
    
    var sciObj = engine.getVocabularyByTerm(term,searchType,limit,categories,searchSynonyms);
    //Remove if statement if we always return array
    if (sciObj instanceof Object && 'concepts' in sciObj && sciObj.concepts instanceof Array){
        results = sciObj.concepts;
    } else if (sciObj instanceof Array) {
        results = sciObj;
    }
    results.forEach(function(r,i,concepts){
        if (r.curie != null){
            concepts[i].id = r.curie;
        } else if (r.fragment != null){
            concepts[i].id = r.fragment;
        } 
    });
    
    // Fetch taxon
    var id_list = results.map(function(i) { return i.id; });
    var neighbors = engine.getGraphNeighbors(id_list, 1, 'http://purl.obolibrary.org/obo/RO_0002162', 'BOTH', false, engine.config.scigraph_data_url);
    var graph = new bbop.model.graph();
    graph.load_json(neighbors);
    id_list.forEach(function (id) {
        var label = '';
        var taxon_list = graph.get_parent_nodes(id, 'http://purl.obolibrary.org/obo/RO_0002162');
        if (taxon_list && taxon_list.length > 0){
            label = taxon_list[0].label();
            var meta = taxon_list[0].metadata();
            if (meta && meta['synonym']){
                label = meta['synonym'][0];
            }
            label = label.replace(/\b[a-z]/g, function() {
                return arguments[0].toUpperCase()
            });
        }
        for (i = 0; i < results.length; i++){
            if (results[i]['id'] == id) {
                results[i]['taxon'] = label;
            }
        }
    });
    
    // remove equivalent ids
    var eq_graph = engine.getGraphNeighbors(id_list, 3, 'equivalentClass', 'BOTH', false, engine.config.scigraph_data_url);
    var equivalent_graph = new bbop.model.graph();
    equivalent_graph.load_json(eq_graph);
    
    for (var i=0; i < results.length; i++) {
        var id = results[i]['id'];
        var eq_node_list = [];
        //Get all equivalent nodes of v[i][0]
        var equivalent_nodes = equivalent_graph.get_ancestor_subgraph(id, 'equivalentClass')
        .all_nodes();
        var other_eq_nodes = equivalent_graph.get_descendent_subgraph(id, 'equivalentClass')
        .all_nodes();
        
        eq_node_list = equivalent_nodes.map(function(i){return i.id();});
        var temp_list = other_eq_nodes.map(function(i){return i.id();});
        
        eq_node_list.push.apply(eq_node_list, temp_list);
        //equivalent_node_list.map
        
        for (var k=i+1; k < results.length; k++) {
            var node_id = results[k]['id'];
            if (node_id) {
                if (eq_node_list.indexOf(node_id) > -1){
                    
                    // If the id is from MESH
                    if (/^MESH/.test(id)){
                        results.splice(i,1)
                        i--;
                        break;
                    } else {
                        results.splice(k, 1);
                        k--;
                        continue;
                    }
                }
            }
    
        }
    }
    return results;
}

//basically, this will take the textual input, and attempt to map the string to one or more identifiers in 
//our monarch views.  the data can then be presented to the user for them to select what kind of 
//result they wish to peruse further.
//TODO we can consider parameterizing this so that one of the options is the resource
bbop.monarch.Engine.prototype.searchOverData = function(txt, opts) {
    //TODO This list should be maintained elsewhere
    var listOfSourcesWeCanHandle = [
        'nif-0000-03216', 'nif-0000-03215', 'nif-0000-00096', 'nif-0000-21427', 'nlx_152525', 'nif-0000-02801', 'nlx_151835', 'nif-0000-00053','nlx_151671','nlx_151660','nif-0000-03160','nlx_31805', 'nif-0000-21306','nlx_151653','omics_00269-1','nif-0000-00182'] ;
    //nif-0000-02683, CTD has lots of inferred results, but we aren't ready to deal with this yet.

    var resultCategories = ['gene','phenotype','disease','effective_genotype'];
    var engine = this;
    var results = [];

    engine.log("SEARCHING...");

    var fed_search_url = this.config.federation_services_url ;
    // direct to search
    fed_search_url += "search.json";

    var resultStr = engine.fetchUrl(fed_search_url,{q : txt});
    var fedObj = {};
    if (engine.config.jQuery != null) {
        // alert("parsing: "+resultStr);
        fedObj = jQuery.parseJSON(resultStr).result;
    }
    else {
        fedObj = JSON.parse(resultStr).result;
    }

    results = fedObj.results;
    //pull out the NIF views for each search
    //Can return the same resource with > 1 category
    var resources = {};
    engine.log("Found "+results.length+" resources with results");
    results.forEach(function(r) {
        if (Object.keys(resources).indexOf(r.nifId) == -1) {
            //the nifId is the view id; get the primary resource id
            var resource_id = r.nifId.substring(0,r.nifId.lastIndexOf('-'));
            resources[r.nifId] = {id : r.nifId, label : r.indexable, categories : [r.category], resource : {id : resource_id, label : r.db}};
        } else {
            resources[r.nifId].categories.push(r.category);
        }
    });
    //query each resulting resource for the relevant data
    //TODO should probably treat the monarch id mapping view separately
    results = [];
    var cat_results = {};
    resultCategories.forEach(function(cat) {
        cat_results[cat] = {};
    });
    var tr = function(r) {
        var obj = {};
        var taxon = {};
        if (typeof r.taxon_id != 'undefined' && r.taxon_id != null && r.taxon_id != '') {
            taxon = {id : r.taxon_id, label : r.taxon_label};
        }
        resultCategories.forEach(function(cat) {   
            if (typeof r[cat+"_id"] != 'undefined' && r[cat+"_id"] != null && r[cat+"_id"] != '') {
                obj[cat] = {id : r[cat+"_id"], label : r[cat+"_label"]};
                //TODO could add counter into hash so that we can sort the results by frequency in views
                cat_results[cat][r[cat+"_id"]] = {label : r[cat+"_label"]};
                if (taxon != {}) {
                    cat_results[cat][r[cat+"_id"]].taxon = taxon;
                    obj.taxon = taxon;
                }
            }
        });
        return obj;
    }
    Object.keys(resources).forEach(function (r) {
        var res = resources[r];
        if (listOfSourcesWeCanHandle.indexOf(res.resource.id) > -1) {
            engine.log("Fetching from "+r);
            var resultObj = engine.fetchDataFromResource(txt,res.id,tr);
            //engine.log(JSON.stringify(resultObj));
            results.push(resultObj.results);
        } else {
            engine.info("Skipping query in "+r);
        }
    });

    //make uniq results into proper object
    var results = {};
    Object.keys(cat_results).forEach(function(cat) {
        if (typeof results[cat] == 'undefined') {
            results[cat] = [];
        } 
        var res = cat_results[cat];
        Object.keys(res).forEach(function(r) {
            results[cat].push({id : r, label : res[r].label, taxon : res[r].taxon}) 
        });
        
    });
    engine.log("#search results="+Object.keys(results).map(function (cat) { return cat+":"+results[cat].length}).join(", "));
    //engine.log("FINAL RES"+JSON.stringify(results));
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
    //this.log(JSON.stringify(resultStr));
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
/* TODO DELETE THIS
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
*/
/*
 * Function: fetchSimilarPapersFromPMID
 * 
 * Services used: NIF literature call. See:
 * http://beta.neuinfo.org/services/resource_LiteratureService.html
 * 
 * Arguments: pmid: set of pmids
 * Returns: JSON structure { results: [ PUBLICATION-OBJECTS ] }
 *
 * Example:
 * http://beta.neuinfo.org/services/v1/literature/moreLikePmid.json?pmid=22080565
 */
/* TODO DELETE THIS
bbop.monarch.Engine.prototype.fetchSimilarPapersFromPMID = function(id) {
    var urlBase = this.config.literature_services_url;
    var params = {
        pmid : id,
    };
    var resultStr = this.fetchUrl(urlBase + "moreLikePmid.json", params);
    var pubObj = JSON.parse(resultStr);
    var trFunction = function(x) {return x};
    var results = [];
    if (pubObj != null) {
        for (var i in pubObj) {
            results.push(trFunction(pubObj[i]));
        }
    }
    return results;
}
*/
bbop.monarch.Engine.prototype.fetchDataDescriptions = function() {

    var t="resource_data_descriptions";
    var sources = env.readJSON('conf/'+t+'.json');

    //convert categories and ontologies to arrays
    for (var i=0;i<sources.length; i++) {
        var s = sources[i];
        if (typeof s.data_categories != 'undefined') {
            var categories = s.data_categories.split(';');
            sources[i].data_categories = categories;
        }
        if (typeof s.ontologies != 'undefined') {
            var ontologies = s.ontologies_or_vocabularies.split(';');
            sources[i].ontologies_or_vocabularies = ontologies;
        }
    }

    return sources;
}

//this function takes a row from a view lookup, and makes 
//an array of publication objects
/* TODO DELETE THIS
bbop.monarch.Engine.prototype.makePublicationList = function(r) {
    var publist = [];
    var ids = r.publication_ids;
    var labels = r.publication_labels;
    var urls = r.publication_urls;
    //some sources have "id" others have "ids", and either can be a list
    if (typeof r.publication_ids == 'undefined' || r.publication_ids == null) {
        ids = r.publication_id;
    }
    if (typeof r.publication_labels == 'undefined' || r.publication_labels == null) {
        labels = r.publication_label;
    }
    if (typeof r.publication_urls == 'undefined' || r.publication_urls == null) {
        urls = r.publication_url;
    }

    //need to add a looper reference variable to loop over, if there aren't ids for a reference
    if (ids != null && typeof ids != 'undefined' && ids != '') {
        ids = ids.trim();
        ids = ids.split(/[,;]/);
        if (labels != null && typeof labels != 'undefined') {
            labels = labels.trim();
            //TODO fix this when we get proper arrays of labels
            labels = labels.split(/[,\|]/);
        }
        if (urls != null && typeof urls != 'undefined') {
            urls = urls.trim();
            urls = urls.split(/[,;]/);
        }
        for (var i=0; i<ids.length; i++) {
            var ref = {};
            ref.id = ids[i].trim();
            if (labels != null && typeof labels != 'undefined') {
                ref.label = labels[i].trim();
            }
            if (urls != null && typeof urls != 'undefined' && typeof urls[i] != 'undefined') {
                ref.url = urls[i].trim();
            }
            publist.push(ref);
        }
    }
    return publist;
}
*/

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
    var exchangeObj = this.fetchUrlWithExchangeObject(url, params, method);

    if (exchangeObj.status != 200) {
        var qs = require('querystring').stringify(params);
        var errorMsg = '#fetchUrl ' + method + ' status: ' + exchangeObj.status + ' url: ' + url + '?' + qs;
        console.error(errorMsg);
        throw({
            type : "fetchUrl",
            url: url + '?' + qs,
            status: exchangeObj.status,
            message: errorMsg
        });
        // return null;
    }

    return exchangeObj.content;
}

/*
 * Function: fetchUrlWithExchangeObject
 * 
 * Generate fetch over HTTP
 * 
 * As fetchUrl, but include the complete Exchange object (see http://ringojs.org/api/v0.10/ringo/httpclient/)
 * 
 * This should be used with SciGraph calls, as SG gives a 404 for unfound objects
 * 
 * Arguments: url : string params : string OR list OR dict
 * 
 * Returns: Exchange object
 */

bbop.monarch.Engine.prototype.fetchUrlWithExchangeObject = function(url, params, method) {
    var data = '';
    if (params == null) {
        params = {};
    }

    if (logFetchTimes) {
        var timeDelta = Date.now();
        this.log("FETCHING: " + method + " " +url+" params="+JSON.stringify(params));
    }

    this._lastURL = url;
    var exchangeObj;
    if (env.isRingoJS()) {
        var httpclient = require('ringo/httpclient');
        if (method == 'post') {
            exchangeObj =  httpclient.post(url, params);
        }
        else {
            exchangeObj =  httpclient.get(url, params);
        }
    }
    else {
        if (method === 'post') {
            var postOptions = {
                uri: url,
                form: params,
                useQuerystring: true,
                method: 'POST'
            };

            var res = WaitFor.for(AsyncRequest.post, postOptions);
        }
        else {
            var getOptions = {
                url: url,
                qs: params,
                useQuerystring: true
            }
            // getOptions = url + '?' + require('querystring').stringify(params);
            var res = WaitFor.for(AsyncRequest.get, getOptions);
        }

        // console.log('fullurl: ', url + '?' + require('querystring').stringify(params));
        // console.log('res.rawHeaders:', res.rawHeaders);
        // console.log('res.toJSON:', res.toJSON());
        // console.log('body:', res.body.toString('utf-8'));

        exchangeObj = {
            status: res.statusCode,
            content: res.body.toString('utf-8')
        };
    }

    if (logFetchTimes) {
        timeDelta = Date.now() - timeDelta;
        var g;
        if (env.isRingoJS()) {
            g = module.singleton('monarchAPITiming',
                function () { return {
                                    _timingRequestCount: 0,
                                    _timingRequestTime: 0,
                                    _timingRequestLength: 0
                                };
                 });
        }
        else {
            g = this;
            if (typeof(g._timingRequestCount) === 'undefined') {
                g._timingRequestCount = 0;
                g._timingRequestTime = 0;
                g._timingRequestLength = 0;
            }
        }

        g._timingRequestCount = g._timingRequestCount + 1;
        g._timingRequestTime = g._timingRequestTime + timeDelta;
        g._timingRequestLength = g._timingRequestLength + exchangeObj.content.length;
        this.log("FETCHED status: " + exchangeObj.status + "  Length: " + exchangeObj.content.length + "  Time: " +
            timeDelta + "ms" +
            "  Total #" + g._timingRequestCount +
            "  Total Time: " + g._timingRequestTime +
            "  Total Length: " + g._timingRequestLength);
    }

    return exchangeObj;
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
 *                            rows from multiple sources
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
                if (isSourceNew == true && resultObj[i].source[0].id){
                    var index = unique[row];
                    uniqResults[index].source = 
                          uniqResults[index].source.concat(resultObj[i].source);
                    //Make sure source list is still unique
                    var uniqSource = this.uniquifyResultSet(uniqResults[index].source);
                    uniqResults[index].source = uniqSource;
                }
                //If we need to add the ref to ref list
                if (isRefNew == true && resultObj[i].references){
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

/*
 * Function:collapseEquivalencyClass
 * 
 * Returns: array of hashes
 * 
 * Arguments: - resultObj   : array of hashes in the monarch format
 *            - uniqOnKeys  : array of keys in which we want to make
 *                            unique based on equivalency class
 *            - colOnClass  : key in which to search for equivalent
 *                            classes               
 *            - isSourceNew : boolean, set to true if uniquifying
 *                            rows from multiple sources
 *            - isRefNew    : boolean, set to true if uniquifying
 *                            references from mutliple sources
 */
bbop.monarch.Engine.prototype.collapseEquivalencyClass = function(resultObj,uniqOnKeys,colOnClass,isSourceNew,isRefNew) {
    var uniqResults = [];
    var unique = {};
    var count = 0;
    var sciGraphCache = {};
    var engine = this;

    //Required vars, if not passed return resultObj
    if (!uniqOnKeys || !colOnClass){
        return resultObj;
    }
    
    if (resultObj){
        for (var i=0; i<resultObj.length; i++){
            var rows = [];
            var row = '';
            if (uniqOnKeys){
                for (var j=0; j<uniqOnKeys.length; j++){
                    
                    var rel = null; //reset rel
                    var uniqOnKey = uniqOnKeys[j];
                    if (resultObj[i][uniqOnKey].id){
                        row += resultObj[i][uniqOnKey].id;
                    }

                    rows.push((row+resultObj[i][colOnClass].id));
                    
                    //Get equivalency
                    if (sciGraphCache[resultObj[i][colOnClass].id]){
                        rel = sciGraphCache[ resultObj[i][colOnClass].id ];
                    } else if ((resultObj[i][colOnClass].id) &&
                        !(/ORPHA|KEGG/.test(resultObj[i][colOnClass].id))){
                        rel = engine.getEquivalentClassList(resultObj[i][colOnClass].id);
                        sciGraphCache[ resultObj[i][colOnClass].id ] = rel;
                    }

                    if (rel){
                        rel.forEach(function(c) {
                            rows.push((row+c));
                        });
                    }
                }
            } else {
                var rel;
                row = resultObj[i].id;
                rows.push((row+resultObj[i][colOnClass].id));

                if (sciGraphCache[ resultObj[i][colOnClass].id ]){
                    rel = sciGraphCache[ resultObj[i][colOnClass].id ];
                } else if ((resultObj[i][colOnClass].id) &&
                     !(/ORPHA|KEGG/.test(resultObj[i][colOnClass].id))){
                     rel = engine.getEquivalentClassList(resultObj[i][colOnClass].id);
                     sciGraphCache[ resultObj[i][colOnClass].id ] = rel;
                 }
                
                if (rel){
                    rel.forEach(function(c) {
                        rows.push((row+c));
                    });
                }
            }
            var isUnique = false;
            rows.forEach(function(r){
                //TODO DRY alert - break out into function
                if (r in unique){
                    
                    //If we need to add the source to source list
                    if (isSourceNew == true && resultObj[i].source[0].id){
                        var index = unique[r];
                        uniqResults[index].source = 
                          uniqResults[index].source.concat(resultObj[i].source);
                        //Make sure source list is still unique
                        var uniqSource = engine.uniquifyResultSet(uniqResults[index].source);
                        uniqResults[index].source = uniqSource;
                    }
                    //If we need to add the ref to ref list
                    if (isRefNew == true && resultObj[i].references){
                        var index = unique[r];
                        uniqResults[index].references = 
                          uniqResults[index].references.concat(resultObj[i].references);
                        //Make sure ref list is still unique
                        var uniqRef = engine.uniquifyResultSet(uniqResults[index].references);
                        uniqResults[index].references = uniqRef;
                    }
                } else {
                     if (r){
                         if (isUnique == true){
                             unique[r] = count-1;
                         } else {
                             uniqResults = uniqResults.concat(resultObj[i]);
                             unique[r] = count++;
                             isUnique = true;
                         }
                    }
                }
            }); 
        }
        return uniqResults;
    } else {
        return [];
    }
}

//Get list of equivalent classes given class ID
bbop.monarch.Engine.prototype.getEquivalentClassList = function(id, server) {
    var engine = this;
    if (!id){
        return null;
    }
    var equivClassList = [];
    var relationshipType = 'equivalentClass';
    var neighbors = engine.getGraphNeighbors(id, 1, relationshipType, 'BOTH', false, server);
    
    var ontoGraph = new bbop.model.graph();
    ontoGraph.load_json(neighbors);
    equivClassList = engine.getEquivalentClasses(id, ontoGraph);
    return equivClassList;
}

//Get list of equivalent classes given a bbop.model.graph
bbop.monarch.Engine.prototype.getEquivalentClasses = function(id, graph) {
    var classList = [];
    graph.all_edges().forEach( function(edge) {
        var equivClass;
        if (edge.predicate_id() == 'equivalentClass'){
            if (id == edge.subject_id()){
                equivClass = edge.object_id();
            } else {
                equivClass = edge.subject_id();
            }
            classList.push(equivClass);
        }
    });
    return classList;
}

bbop.monarch.Engine.prototype.getEquivalentNodes= function(id, graph) {
    var equivNodes = [];
    graph.all_edges().forEach( function(edge) {
        var equivNode;
        if (edge.predicate_id() == 'equivalentClass' || edge.predicate_id() == 'sameAs') {
            if (id == edge.subject_id()){
                equivNode = {
                        id : edge.object_id(),
                        lbl : graph.get_node( edge.object_id() ).label()
                };
            } else {
                equivNode = {
                        id : edge.subject_id(),
                        lbl : graph.get_node( edge.subject_id() ).label()
                };
            }
            equivNodes.push(equivNode);
        }
    });
    return equivNodes;
}

// translates an ID to a canonical form used by OntoQuest and other NIF services
bbop.monarch.Engine.prototype.getFederationNifId = function(id) {
    if (id.indexOf("http:") == 0) {
        var parts = id.split("/");
        id = parts[parts.length-1];
    }
    //only replace the underscore with a colon if there isn't already a colon present
    if (id.indexOf("_") > -1 && id.indexOf(":") < 0 ) { 
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
    //id = this.getOntoquestNifId(id);
    this.log("Resolved:"+id+"; now testing if exists in OntoQuest ");
    var cls = this.fetchClassInfo(id,{level:0});
    this.log("Fetched:"+JSON.stringify(cls));
    if (cls == null || cls.id == null || cls.id == "") {
        return id;
    }
    // hardcode alert - see
    // https://github.com/monarch-initiative/monarch-app/issues/33
//    if (cls.id.indexOf("DOID") == 0) {
        //check for equivalent classes
        this.log("Checking for equivalent classes to redirect");
        var altcls = this.fetchClassInfo(id,{level:1});
        for (var k in altcls.relationships) {
            var rel = altcls.relationships[k];
            if (rel.property.id == "equivalentClass") {
                var object = rel.object;
                this.log("Mapped using equivalence to:"+object.id);
                cls = this.fetchClassInfo(object.id,{level:0});
                break;
            }
        }

//    }
    
    this.log("Using:"+cls.id);
    return cls.id;
    //return id;
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
    var s = env.readJSON('conf/'+t+'.json');
    return s;
}

bbop.monarch.Engine.prototype.isProduction = function() {
    return this.config != null && this.config.type == 'production';
}

bbop.monarch.Engine.prototype.log = function(msg) {
    if (!this.isProduction()) {
        console.log(msg);
    }
}

bbop.monarch.Engine.prototype.info = function(msg) {
    if (!this.isProduction()) {
        console.info(msg);
    }
}

bbop.monarch.Engine.prototype.warn = function(msg) {
    if (!this.isProduction()) {
        console.warn(msg);
    }
}


////////////////////////////////////////////////////////////////////
//
//GENERIC SCIGRAPH ACCESS LAYER
//
//Current design is to have one function per operation, although
//these could be combined to more generic/flexible functions in
//the future
//
/////////////////////////////////////////////////////////////////////

//
bbop.monarch.Engine.prototype.getGraphNeighbors = function(id, depth, relationshipType, direction, blankNodes, server) {
    
    var params = {
            'depth' : depth,
            'relationshipType' : relationshipType,
            'direction' : direction,
            'blankNodes' : blankNodes
    };
    var parameters = Object.keys(params);
    parameters.forEach(function(r){
        if (!params[r]){
            delete params[r];
        }
    });
    var resultObj;
    var path = "";
    if (id instanceof Array) {
        id = id.join("&id=");
        path = "graph/neighbors?id="+id;
    } else {
        path = "graph/neighbors/"+id+'.json';
    }
    var resultObj = [];
    resultObj = this.querySciGraphGraphServices(path,params, server);
    return resultObj;
}

// Find concepts that match either a URI fragment or a CURIE. 
// Due to differences in representation "fragment"
// could refer to either of the following:     
//     http://example.org/thing#fragment
//     http://example.org/thing/fragment
//     A single concept response is probable but not guarenteed.
bbop.monarch.Engine.prototype.getVocabularyTermByID = function(id, server) {
    
    var params = null; //No parameters for this operation
    var path = "vocabulary/id/"+id+'.json';
    var resultObj = [];
    
    resultObj = this.querySciGraphVocabServices(path, params, server);
    return resultObj;
}

// Find concepts that match either a URI fragment or a CURIE. 
// Due to differences in representation "fragment"
// could refer to either of the following:     
//     http://example.org/thing#fragment
//     http://example.org/thing/fragment
//     A single concept response is probable but not guarenteed.
// Because not all nodes are in the vocabulary, we find the node here.
bbop.monarch.Engine.prototype.getGraphNodeByID = function(id, server) {
    var engine = this;
    var params = null; //No parameters for this operation
    var path = "graph/"+id+'.json';
    var resultObj = [];
    
    if (!server){
        server = engine.config.scigraph_url;
    }

    var uri = server+path;

    //Fetch URI
    var exchangeObj = engine.fetchUrlWithExchangeObject(uri,params);
    if (exchangeObj.status == 404) {
        this.log("not found: "+uri);
        return {nodes:[],edges:[]};
        //return null;
    }
    
    var sciObj = JSON.parse(exchangeObj.content);
    return sciObj;

}



// Searches the complete text of the term. Fragments of labels are matched
// (ie: "foo bar" would be returned by a search for "bar").
// Results are not guaranteed to be unique.
// Set searchType to autocomplete for autocomplete services
bbop.monarch.Engine.prototype.getVocabularyByTerm = function(term,searchType,limit,category,searchSynonyms,ontology) {

    var params = {
            'limit'          : limit,
            'category'       : category,
            'searchSynonyms' : searchSynonyms,
            'ontology'       : ontology
    };
    
    var engine = this;

    term = encodeURI(term);
    var path = "vocabulary/";
    
    //Use defaults if no params passed
    if (!params.searchSynonyms){
        //params.searchSynonyms = true;
    }
    var parameters = Object.keys(params);
    parameters.forEach(function(r) {
        if(!params[r]){
            delete params[r];
        }
    });

    //Build URI
    if (!searchType || searchType.match(/search/i)){
        path = path + 'search/'+term+'.json';
    } else if (searchType.match(/autocomplete/i)){
        path = path + 'autocomplete/'+term+'.json';
    }
    else if (searchType.match(/term/i)){
        path = path + 'term/'+term+'.json';
    }
    
    var resultObj = engine.querySciGraphVocabServices(path,params);
    return resultObj;
}

//Suggests terms based on a mispelled or mistyped term.
bbop.monarch.Engine.prototype.getSciGraphSuggestions = function(term, limit) {

    var params = {
         'limit': limit
    };
 
    var engine = this;

    term = encodeURI(term);
    var path = "vocabulary/";
 
    // Use defaults if no params passed
    if (!params.searchSynonyms){
        // params.searchSynonyms = true;
    }
    var parameters = Object.keys(params);
    parameters.forEach(function(r) {
        if(!params[r]){
            delete params[r];
        }
    });

    // Build URI
    path = path + 'suggestions/'+term+'.json';
    
    var resultObj = engine.querySciGraphVocabServices(path,params);
    return resultObj;
};

/*
 * Find concepts that match either a URI fragment or a CURIE. Due to differences in representation "fragment" could refer to either of the following:
 *
 *   http://example.org/thing#fragment
 *   http://example.org/thing/fragment
 *
 *   A single concept response is probable but not guaranteed.
 * 
 */
bbop.monarch.Engine.prototype.getVocabularyByID = function(id) {
    var engine = this;
    id = encodeURI(id);
    var path = "vocabulary/id/"+id+'.json';  
    var resultObj = engine.querySciGraphVocabServices(path);
    return resultObj;
}

// Query with an identifier and get the RDF type.  A node could have multiple
// types
// In SciGraph, node types are always directional: 
// I rdf:type C
bbop.monarch.Engine.prototype.getNodeTypes = function(id) {
    var engine = this;
    var types = [];
    var path = "graph/neighbors/"+id+".json"
    var params = {
            'depth' : 1,
            'relationshipType' : 'type',
            'direction' : 'out'
        };

    var resultObj = engine.querySciGraphGraphServices(path,params);
    var types = [];
    //process the nodes, and take the ones that are not == query
    if (resultObj != null && resultObj.nodes != null) {
        for (var it=0; it<length(resultObj.nodes); it++) {
            var n = resultObj.nodes[it];
            if (n.id != id) {
                types.push(n);
            }
            
        }
    }
    return types;

}


bbop.monarch.Engine.prototype.querySciGraphGraphServices = function(path, params, server) {
    
    var engine = this;
    
    if (!server){
        server = engine.config.scigraph_url;
    }

    var uri = server+path;

    //Fetch URI
    var exchangeObj = engine.fetchUrlWithExchangeObject(uri,params);
    if (exchangeObj.status == 404) {
        this.log("not found: "+uri);
        return {nodes:[],edges:[]};
        //return null;
    }
    
    var sciObj = JSON.parse(exchangeObj.content);
    return sciObj;
}

bbop.monarch.Engine.prototype.querySciGraphVocabServices = function(path, params, server) {

    var engine = this;

    if (!server){
        server = engine.config.scigraph_url;
    }
    var uri = server+path;

    //Fetch URI
    var exchangeObj = engine.fetchUrlWithExchangeObject(uri,params);
    if (exchangeObj.status == 404) {
        this.log("not found: "+uri);
        return {concepts:[]};
    }
    if (exchangeObj.status == 404) {
        // TODO: throw error
        return errorResponse(exchangeObj.content);
    }
    var sciObj = JSON.parse(exchangeObj.content);
    return sciObj;
}

bbop.monarch.Engine.prototype.querySciGraphDynamicServices = function(path,params) {

    var engine = this;

    //Fetch URI
    var uri = engine.config.scigraph_data_url+'dynamic/';
    //remove preceding slash
    uri = uri + path.replace(/^\//,'');
    if (!/\.((j|graph)son)|([gx(xgm|graph)]ml|jpeg|png)$/.test(uri)){
        uri = uri+".json";
    }
    var exchangeObj = engine.fetchUrlWithExchangeObject(uri,params);
    if (exchangeObj.status == 404) {
        this.log("not found: "+uri);
        return {concepts:[],nodes:[],edges:[]};
    }
    if (exchangeObj.status == 404) {
        // TODO: throw error
        return errorResponse(exchangeObj.content);
    }
    var sciObj = JSON.parse(exchangeObj.content);
    return sciObj;
}


/*
 * Scigraph/GOLR REFACTOR
 * 
 * Below are a number of functions, partially tested, that are developed
 * to work with scigraph and solr/golr services. Unit tests in apitests.js
 * 
 */


/*
 * Function: fetchAssociations
 * 
 * Status: Partially Implemented
 * 
 * Generic query to obtain an association between two entities given an ID and category
 * for example: Phenotypes associated with a Disease
 *              Genes associated with a Phenotype
 *              Variants associated with a Gene,
 *              etc.
 * 
 * Resources: GOlr index of the data ingest pipeline
 * 
 * Arguments: - id: An identifier. One of: IRI string, OBO-style ID
 *            - field: GOlr field in which to filter on the id
 *            - filter: list of hashes containing field and value, ex:
 *                      [
 *                       {
 *                          field: "subject_category",
 *                          value: 'phenotype"
 *                       }
 *                      ]
 *            - limit: limit number of results
 * 
 * Returns: GOlr Response Object (bbop.golr.response)
 * 
 */
bbop.monarch.Engine.prototype.fetchAssociations = function(id, field, filter, limit, personality, facet) {
    var engine = this;
    
    if (typeof limit === 'undefined'){
        limit = 10;
    }
    
    // Get configuration from self
    // Instantiated in webapp_launcher_*.js from conf/golr-conf.json
    var golrConf = new bbop.golr.conf(engine.config.golr);
    var golrServer = engine.config.golr_url;
    
    if (env.isRingoJS()) {
        var golrManager = new bbop.golr.manager.ringo(golrServer, golrConf);
    }
    else {
        var golrManager = new bbop.golr.manager.nodejs(golrServer, golrConf);
    }
    if (personality != null){
        golrManager.set_personality(personality);
    }
    if (facet != null){
        golrManager.facets(facet);
    }
    
    golrManager.lite(true); //only return fields in results in the conf file
    golrManager.add_query_filter(field, id, ['*']);
    golrManager.set_results_count(limit);
    golrManager.set_facet_limit(-1); //unlimited
    
    if (filter != null && filter instanceof Array && filter.length > 0){
        filter.forEach( function (val) {
            if (val.hasOwnProperty("plist")) {
                golrManager.add_query_filter(val.field, val.value, val.plist);
            } else {
                golrManager.add_query_filter(val.field, val.value, ['*']);
            }
        });
    }
    var url = golrManager.get_state_url();
    var raw = engine.fetchUrl(url);
    try {
        var jsonData = JSON.parse(raw);
    } catch (e) {
        console.log(e);
    }
    var response = new bbop.golr.response(jsonData);
    return response;
}

bbop.monarch.Engine.prototype.fetchAssociationCount = function(id, field, filter, facet) {
    var golrResponse = this.fetchAssociations(id, field, filter, 0, null, facet);
    var count = 0;
    if (facet != null){
        var facet_list = golrResponse.facet_field(facet);
        count = facet_list.length;
    } else {
        count = golrResponse.total_documents();

    }
    return count;
}

/*
 * Function: fetchCoreDiseaseInfo
 * 
 * Status: Partially Implemented
 * 
 * Fetch core information related to a disease, such as definition, xrefs
 * For now also get parent and subclass(es) and phenotype associations
 * 
 * Resources: SciGraph and GOlr
 * 
 * Arguments: - id: An identifier. One of: IRI string, OBO-style ID
 *            
 * 
 * Returns: JSON blob with info about the disease
 * 
 */
bbop.monarch.Engine.prototype.fetchCoreDiseaseInfo = function(id) {
    var engine = this;

    // every disease is represented as a class in the ontology
    var obj = this.fetchClassInfo(id, {level:1});

    obj.apiVersionInfo = this.apiVersionInfo();
    obj.phenotype_list = engine.fetchPhenotypes(id);

    return obj;
}

/*
 * Function: fetchSectionInfo
 * 
 * Status: Partially Implemented
 * 
 * Fetch phenotypes associated with a data type along with information about
 * the ID
 * 
 * Resources: SciGraph and GOlr
 * 
 * Arguments: 
 * - id: An identifier. One of: IRI string, OBO-style ID
 * - section: Section (either phenotype_list or genotype_list)
 *            
 * 
 * Returns: JSON blob with info about the disease
 * 
 */
bbop.monarch.Engine.prototype.fetchSectionInfo = function(id, section) {
    var engine = this;

    // every disease is represented as a class in the ontology
    var obj = {};

    obj.apiVersionInfo = this.apiVersionInfo();
    
    // HACK, we should improve how we decide this
    if (section == 'phenotype_list') {
        obj.phenotype_list = engine.fetchPhenotypes(id);
    } else if (section == 'genotype_list') {
        obj.genotype_list = engine.fetchGenotypes(id);
    }
    
    return obj;
}

/*
 * Function: fetchGenotypes
 * 
 * Status: Partially Implemented
 * 
 * Fetch genotypes associated with a data type along with information about
 * the ID
 * 
 * Resources: SciGraph and GOlr
 * 
 * Arguments: - id: An identifier. One of: IRI string, OBO-style ID
 *            
 * 
 * Returns: List of JSON objects containing the id and label of the genotype
 * 
 */
bbop.monarch.Engine.prototype.fetchGenotypes = function(id) {
    var engine = this;
    
    //Get phenotype associations
    var filter = [
                  {
                      field: 'subject_category',
                      value: 'genotype'
                  }
    ];
    var golrResponse = engine.fetchAssociations(id, 'object_closure', filter, 5000);
    
    var genotype_obj = {};
    var genotype_list = [];
    
    golrResponse.documents().forEach(function(doc){ 
        genotype_obj[doc.subject] = {
                     "label": doc.subject_label,
        };
    });
    if (genotype_obj){
        genotype_list = Object.keys(genotype_obj).map( function (k) {
            return { id: k, 
                     "label":  genotype_obj[k]['label']
                   };
            
        });
    }
    
    return genotype_list;
};

/*
 * Function: fetchPhenotypes
 * 
 * Status: Partially Implemented
 * 
 * Fetch phenotypes associated with a data type along with information about
 * the ID
 * 
 * Resources: SciGraph and GOlr
 * 
 * Arguments: - id: An identifier. One of: IRI string, OBO-style ID
 *            
 * 
 * Returns: JSON blob with info about the disease
 * 
 */
bbop.monarch.Engine.prototype.fetchPhenotypes = function(id) {
    var engine = this;
    
    //Get phenotype associations
    var filter = [
                  {
                      field: 'object_category',
                      value: 'phenotype'
                  }
    ];
    var golrResponse = engine.fetchAssociations(id, 'subject_closure', filter, 5000);
    
    var phenotype_obj = {};
    var phenotype_list = [];
    
    golrResponse.documents().forEach(function(doc){ 
        phenotype_obj[doc.object] = {
                     "label": doc.object_label, 
                     "observed": "positive",
                     "isPresent" : "true"
        };
    });
    if (phenotype_obj){
        phenotype_list = Object.keys(phenotype_obj).map( function (k) {
            return { id: k, 
                     "label":  phenotype_obj[k]['label'],
                    "observed": phenotype_obj[k]['observed'], 
                    "isPresent" : phenotype_obj[k]['isPresent']
                   };
            
        });
    }
    
    return phenotype_list;
};

// Basically a copy paste of fetchClassInfo that hits the SciGraph data server isntead of the ontology
// This should all be refactored into one function
bbop.monarch.Engine.prototype.fetchDataInfo = function(id, opts) {

    var resultObj = {};
    var engine = this;
    var server = engine.config.scigraph_data_url;
    var res = engine.getVocabularyTermByID(id, server);
    //TODO do we need to handle lists of >1
    resultObj = {};
    if (typeof res.concepts !== 'undefined' && 
            typeof res.concepts[0] != 'undefined'){
        resultObj = res.concepts[0];
    } else if (res != null) {
        resultObj = res;
    }
    
    resultObj.id = id; 
            
    if ('labels' in resultObj && resultObj.labels[0] != null) {
        resultObj.label = resultObj.labels[0];
    } else {
        resultObj.label = id;
    }
    
    var nodeByID = engine.getGraphNodeByID(id, server);
    var xrefs = "http://www.geneontology.org/formats/oboInOwl#hasDbXref";
    resultObj.database_cross_reference = [];
    
    var graph = new bbop.model.graph();
    graph.load_json(nodeByID);
    var node = graph.get_node(id);
    
    if (node){
        var metadata = node.metadata();
    
        if (metadata && metadata[xrefs]){
            resultObj.database_cross_reference = metadata[xrefs];
        }
        if (metadata && metadata['definition'] && !resultObj.definitions){
            resultObj.definitions = metadata['definition'];
        }
    }
    resultObj.isLeafNode = true;
    
    var neighbors = engine.getGraphNeighbors(id, 1, undefined, 'BOTH', false, server);
    var graph = new bbop.model.graph();
    graph.load_json(neighbors);
    
    var equivalentNodes = engine.getEquivalentNodes(id, graph);
    resultObj.equivalentNodes = equivalentNodes;
    resultObj.equivalentClasses = equivalentNodes.map(function (i) { return i.id; });
    
    //Uniquify equivalent class list
    var filteredList = {};
    resultObj.equivalentClasses = resultObj.equivalentClasses.filter(function(item) {
        return filteredList.hasOwnProperty(item) ? false : (filteredList[item] = true);
    });

    var taxon_list = graph.get_parent_nodes(id, 'RO_0002162');
    if (taxon_list == null || taxon_list.length == 0){
        taxon_list = graph.get_parent_nodes(id, 'http://purl.obolibrary.org/obo/RO_0002162');
    }

    var taxon = {};
    
    if (taxon_list){
        taxon_list.forEach(function (node){
            taxon.id = node.id();
            taxon.label = node.label();
            resultObj.taxon = taxon;
        });
    }
    
    return resultObj;
}

//Hack to get patient pages, will eventually go away in favor of getting this info from a golr document
bbop.monarch.Engine.prototype.fetchPatientInfo = function(id) {
    var info = {};
    var engine = this;
    var neighbors = engine.getGraphNeighbors(id,1, undefined, undefined, true, engine.config.scigraph_data_url);
    info.diseases = [];
    info.genotypes = [];
    info.phenotypes = [];
    info.phenotype_list = [];
    info.family = [];
    info.related = [];
    info.source = '';
    
    var ontoGraph = new bbop.model.graph();
    ontoGraph.load_json(neighbors);

    var genotype_nodes = ontoGraph.get_parent_nodes(id, 'GENO_0000222');
    var phenotype_nodes = ontoGraph.get_parent_nodes(id, 'RO_0002200');
    var related_list = ontoGraph.get_child_nodes(id, 'RO_0001000');
    var family_list = ontoGraph.get_parent_nodes(id, 'RO_0002350');
    
    
    if (ontoGraph.get_node(id)){
        info.id = ontoGraph.get_node(id).id();
        info.label = ontoGraph.get_node(id).label();
    }
    
    if (genotype_nodes){
        genotype_nodes.forEach(function (node){
            info.genotypes.push(node.id());
        });
    }
    
    if (family_list){
        family_list.forEach(function (node){
            if (/Coriell/.test(node.id())){
                info.source = 'Coriell';
            }
            info.family.push(node.id());
        });
    }
    
    if (related_list){
        related_list.forEach(function (node){
            if (/Coriell/.test(node.id())){
                info.source = 'Coriell';
            }
            info.related.push(node.id());
        });
    }
    
    
    if (phenotype_nodes){
        phenotype_nodes.forEach(function (node){
            if (node.metadata().category && node.metadata().category.indexOf('disease') != -1) {
                info.diseases.push({ id : node.id(),
                                    label : node.label()});
            } else {
                info.phenotypes.push({ id : node.id(),
                                       label : node.label()})
            }
        });
    }
    
    if (info.diseases){
        info.diseases.forEach(function (i){
            var disease_info = engine.fetchCoreDiseaseInfo(i.id); 
            if (disease_info && disease_info.phenotype_list)
                info.phenotype_list.push.apply(info.phenotype_list, disease_info.phenotype_list);
        });
    }
    if (info.phenotypes){
        var temp =  info.phenotypes.map(function(i){ 
            return {"id" : i.object, "label": i.object_label, "observed": "positive", "isPresent" : "true"}
        });
        info.phenotype_list.push.apply(info.phenotype_list, temp);
    }
    
    return info;
    
}


// Generate json blob 
bbop.monarch.Engine.prototype.getHealthCheck = function () {
    var engine = this;
    var health_status = {};
    var services = ['scigraph_url', 'scigraph_data_url', 'golr_url', 'owlsim_services_url'];
    services.forEach(function (i) {
        health_status[i] = {};
        health_status[i].url = engine.config[i];
    });

    // Test scigraph ontology
    try {
        engine.getGraphNodeByID('DOID:4', engine.config.scigraph_url);
        health_status.scigraph_url.status = 'pass';
    } catch (e){
        health_status.scigraph_url.status = 'fail';
    }
    
    // Test scigraph data
    try {
        engine.getGraphNodeByID('DOID:4', engine.config.scigraph_data_url);
        health_status.scigraph_data_url.status = 'pass';
    } catch (e){
        health_status.scigraph_data_url.status = 'fail';
    }
    
    // Test golr
    try {
        engine.fetchPhenotypes("OMIM:606693");
        health_status.golr_url.status = 'pass';
    } catch (e){
        health_status.golr_url.status = 'fail';
    }
    // Test owlsim
    try {
        engine.searchByAttributeSet(['HP:0100326', 'HP:0012393']);
        health_status.owlsim_services_url.status = 'pass';
    } catch (e){
        health_status.owlsim_services_url.status = 'fail';
    }
    
    return health_status;
};

/*
 * NOTE: Credit yuanzhou as this is copied from the phenogrid widget
 * 
 * Given an array of phenotype objects (either provided by users or monarch-app) edit the object array.
 * items are either ontology ids as strings,["HP:12345", "HP:23451"], in which case they are handled as is,
 * or they are objects of the form [{"id": "HP:12345", "observed":"positive"}, {"id: "HP:23451", "observed": "negative"}]
 * in that case take id if "observed" is "positive"
 */
bbop.monarch.Engine.prototype.filterPhenotypeList = function (phenotypelist, filterOnPositives) {
    var filteredList = {};
    var newlist = [];
    var pheno;
    for (var i in phenotypelist) {
        if ( ! phenotypelist.hasOwnProperty(i)) {
            break;
        }
        pheno = phenotypelist[i];
        
        // The input can only be one of the two formats - Joe
        // ["HP:12345", "HP:23451"] format
        if (typeof pheno === 'string') {
            newlist.push(pheno);
        }
        
        // [{"id": "HP:12345", "observed":"positive"}, {"id: "HP:23451", "observed": "negative"}, ...] format
        if (filterOnPositives) {
            if (pheno.observed === "positive") {
                newlist.push(pheno.id);
            }
        } else {
            newlist.push(pheno.id);
        }
    }
    
    // Now we have all the phenotype IDs ('HP:23451' like strings) in array,
    // since JavaScript Array push() doesn't remove duplicates,
    // we need to get rid of the duplicates. There are many duplicates from the monarch-app returned json - Joe
    // Based on "Smart" but naïve way - http://stackoverflow.com/questions/9229645/remove-duplicates-from-javascript-array - Joe
    // filter() calls a provided callback function once for each element in an array, 
    // and constructs a new array of all the values for which callback returns a true value or a value that coerces to true.
    newlist = newlist.filter(function(item) {
        return filteredList.hasOwnProperty(item) ? false : (filteredList[item] = true);
    });

    return newlist;
};

/* Function: getGolrDownloadUrl
 * 
 * This is a wrapper for the get_download_url() function in bbop.golr.manager
 * getGolrDownloadUrl takes care of determining the filters and column settings
 * that we want for the monarch proxy layer
 * 
 * For associations, this function examines available personalities set in 
 * global_golr_conf variable and returns false if the id type and association
 * is not found in this file
 * 
 * Arugments
 *     - id - id as a curie
 *     - format - format : tsv, csv, json are supported
 *     - association - associations we want to filter out (gene, phenotype, disease, etc.)
 *     
 * Returns 
 *     - url - download url as string or false if url cannot be generated
 */
bbop.monarch.Engine.prototype.getGolrDownloadUrl = function (id, format, association) {
    var engine = this;
    var url = false;
    var isQueryFound = true;
    // Instantiated in webapp_launcher_*.js from conf/golr-conf.json
    var golrConf = new bbop.golr.conf(engine.config.golr);
    var golrServer = engine.config.golr_url;
    
    var field_list;
    var args_hash = {
            rows : '100000',
            header : "true"
    }
    
    if (env.isRingoJS()) {
        var golrManager = new bbop.golr.manager.ringo(golrServer, golrConf);
    }
    else {
        var golrManager = new bbop.golr.manager.nodejs(golrServer, golrConf);
    }
    
    if (typeof format === 'undefined') {
        format = 'tsv'; //default to tsv
    } else if (format === 'csv') {
        args_hash['separator'] = ',';
    }
    
    if (typeof association === 'undefined') {
        //add_query_filter_as_string
        //subject_closure:"MGI:2676312" OR object_closure:"MGI:2676312"
        var filter = 'subject_closure:\"' + id + '\" OR object_closure:\"' 
                     + id + '\"';
        golrManager.add_query_filter_as_string(filter);
        field_list = ['subject', 'subject_label', 'subject_category',
                      'subject_taxon', 'subject_taxon_label',
                      'relation',
                      'object', 'object_label', 'object_category',
                      'object_taxon', 'object_taxon_label',
                      'evidence','source'];
        
    } else {
        // Look for association specific columns
        var type = engine.resolveIdToType(id).toLowerCase();
        var assocCategory = association.toLowerCase();
        var firstOrientation = type + '_' + assocCategory;
        var secondOrientation = assocCategory + '_' + type;
        
        if (type === 'gene' && assocCategory === 'gene') {
            firstOrientation = 'gene_homolog';
        }
        
        //Get personality list
        personality_classes = golrConf.get_classes();
        personalities = personality_classes.map (function (i) { return i._class.id; });
        
        if (personalities.indexOf(firstOrientation) > -1
                || personalities.indexOf(secondOrientation) > -1) {
            
            // Determine which one
            var personality;
            if (personalities.indexOf(firstOrientation) > -1) {
                personality = firstOrientation;
                golrManager.add_query_filter('subject_closure', id, ['*']);
                golrManager.add_query_filter('object_category', assocCategory, ['*']);
            } else {
                personality = secondOrientation;
                golrManager.add_query_filter('object_closure', id, ['*']);
                golrManager.add_query_filter('subject_category', assocCategory, ['*']);
            }
            
            
            // DRY violation, copied from golr-table.js,
            // refactor into one fucntion
            
            // Get fields from personality
            var fields_without_labels = ['source', 'is_defined_by', 'qualifier'];
            var result_weights = engine.config.golr[personality]['result_weights'].split(/\s+/);
            result_weights = result_weights.map( function (i) { return i.replace(/\^.+$/, ''); });
            
            var field_list = result_weights.slice();
            var splice_index = 1;
            result_weights.forEach( function (val, index) {
                if (fields_without_labels.indexOf(val) === -1) {
                    var result_label = val + '_label';
                    field_list.splice(index+splice_index, 0, result_label);
                    splice_index++;
                }
            });
            if (field_list.indexOf('qualifier') == -1) {
                field_list.push('qualifier');
            }
        } else {
            isQueryFound = false;
        }
    }
    
    if (isQueryFound) {
        if (format === 'json') {
            golrManager.set_results_count(args_hash['rows']);
            url = golrManager.get_query_url();
        } else {
            url = golrManager.get_download_url(field_list, args_hash);
        }
    }
    
    return url;
    
};

/*
 * Function: fetchLiteratureInfo
 *
 * Retrieves JSON block providing info about a publication, currently from NIF's
 * Literature Service.
 * 
 * This should be merged with fetchPubmedSummary()
 * 
 * Could theoretically be replaced with solr index, unless we anticipate users
 * entering pubmed IDs that are not indexed in solr (we only index information
 * about pub linked to assiociations in our database)
 *
 * Arguments: id : a PMID ID
 * Returns: JSON blob with info about the publication
 */
bbop.monarch.Engine.prototype.fetchLiteratureInfo = function(id) {
    var self = this;
    var url = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?';
    var opts = {
            'db' : 'pubmed',
            'retmode' : 'json',
            'id' : id
    };
    var info = {};
    var method = "GET";
    var obj = self.fetchUrl(url, opts, method);
    var summary = new eSummary.eSummaryResponse(obj);
    
    info.authorList = summary.getAuthorList(id);
    info.publicationTitle = summary.getTitle(id);

    info.journal = summary.getJournal(id);
    var date = summary.getDate(id);
    
    if (date) {
        //parse year
        var year;
        var dateRegex = /.*(\d{4}).*/;
        var match = dateRegex.exec(date);
        if (match.length > 0) {
            year = match[1];
        }
        if (typeof year !== 'undefined') {
            info.year = year
        }
    }
    
    return info;
}

