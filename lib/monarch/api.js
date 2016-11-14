/*
 * monarch/api.js
 *
 * Wrapper layer for various services, including:
 *  - golr
 *  - owlsim
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

var AsyncRequest = require('request').defaults({
    forever: true
});
var WaitFor = require('wait.for');


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

    this.fetchUrlImplementation = function(url) {
        var requestResult = WaitFor.for(AsyncRequest.get, url);
        return requestResult.body + '';
    };

    this.debugInfo =
        {
            dateServerStarted : new Date(Date.now()),
            serverInfo : require("child_process").exec('uname -a').unref(),
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


bbop.monarch.Engine.prototype.getPhenotypeList = function(assocs) {
    var res = [];
    for (var k in assocs) {
    var ph = assocs[k].phenotype;
    var item = { "id": ph.id, "label": ph.label, "observed": "positive"};
    res.push(item);
    }
    return res;
};

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

    var leader = engine.fetchCliqueLeader(id, engine.config.scigraph_data_url);
    var neighbors = engine.getGraphNeighbors(leader, 1, 'http://purl.obolibrary.org/obo/RO_0002162', 'BOTH', false, engine.config.scigraph_data_url);
    var graph = new bbop.model.graph();
    graph.load_json(neighbors);
    var tax = {};
    var taxon_list = graph.get_parent_nodes(leader, 'http://purl.obolibrary.org/obo/RO_0002162');
    if (taxon_list){
        taxon_list.forEach(function (node){
            tax.id = node.id();
            tax.label = node.label();
        });
    }
    return tax;
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
    // this.log("trying to find cached entry for "+hashKey);
    if (this.cache != null) {
        // this.log("Checking cache for phenotype query..."+hashKey);
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

    // TODO - nif sources are no longer used
    var species_to_filter_map = {
            '10090' : { label : 'Mus musculus', target_idspace : 'MGI', b_type : 'gene', b_source : 'nif-0000-00096-6' },
            '9606' : { label : 'Homo sapiens', target_idspace : 'OMIM', b_type : 'disease',b_source : 'nlx_151835-1'},
            '7227' : { label : 'Drosophila melanogaster', target_idspace : 'FlyBase', b_type : 'gene',b_source : 'nif-0000-00558-2'},
            '6239' : { label : 'C elegans', target_idspace : 'WormBase', b_type : 'gene',b_source : 'nif-0000-00558-2'},
            '7955' : { label : 'Danio rerio', target_idspace : 'ZFIN', b_type : 'gene', b_source : 'nif-0000-21427-10'},
            'case': { label :'Case',target_idspace: 'MONARCH', b_type:'case',b_source: 'case_data'}
    };

    var resource = {};
    // set defaults
    if (typeof target_species !== 'undefined' && target_species != '' && target_species != null) {
        this.log("No target species supplied.  Fetching best matches for anything.");
        //make a clone
        for( var key in species_to_filter_map[target_species] ) {
            resource[ key ] = species_to_filter_map[target_species][ key ];
        }

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
    engine.log("looked up target. found..."+target);
    var queryLookup = {};
    var monarchSimResults = {};
    monarchSimResults.b = [];
    var simResults = {};

    // Support for merging ID spaces,
    // see https://github.com/monarch-initiative/monarch-app/issues/1280
    /*if (target.constructor === Array) {
        simResults = engine.searchByAttributeSet(id_list,target,cutoff);
        monarchSimResults = engine.makeSimComparisonResults(simResults.results,metric,target_type,target_species);
        monarchSimResults.b = monarchSimResults.b.concat(monarchSimResults.b);
    } else {}*/

    simResults = engine.searchByAttributeSet(id_list,target,cutoff);
    monarchSimResults = engine.makeSimComparisonResults(simResults.results,metric,target_type,target_species);

    monarchSimResults.a = id_list;
    monarchSimResults.cutoff = cutoff;
    monarchSimResults.resource = 'OWLSim Server: '+engine.config.owlsim_services_url;
    monarchSimResults.apiVersionInfo = this.apiVersionInfo();

    if (this.cache != null) {
        this.log("storing results for "+hashKey);
        this.cache.store('phenotypeprofile',hashKey,monarchSimResults);
    }
    return monarchSimResults;

}

/*
 * Function: getPhenotypeProfileHashKey
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

    var input = Buffer(str).toString('base64');

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
    // console.info("X="+JSON.stringify(x)+"; Y="+JSON.stringify(y));

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
    
    if (id.indexOf(":") === -1) {
        id = ':' + id;
    }
    
    /* This is a hack to accept both MONARCH:case1 and :case1
     * In the next release we will standardize all case curies to be
     * MONARCH:c0001
     */
    if (/^MONARCH/.test(id)) {
        id = id.replace(/^MONARCH/, "");
    }
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
            } else if (metadata['category'].indexOf('publication') > -1) {
                type = 'literature';
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
 * Solr/Golr
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


// TODO: check if this is deprecated/used
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

// TODO: see https://github.com/monarch-initiative/monarch-app/issues/975#issuecomment-238665637
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
 * TODO DELETE THE WHOLE FUNCTION WHEN #1387 is done
 * Function: golrHackForSearch
 */
bbop.monarch.Engine.prototype.golrHackForSearch = function(golrManager) {
    var search = golrManager.get_query();
    if (search.indexOf('"') == -1) {
        // sets an OR
        golrManager.set_query(search +  "+\""+ search +"\"");
    } else {
        golrManager.set_query(search);
    }

    golrManager.add_query_field("iri_std", 3.0);
    golrManager.add_query_field("iri_kw", 3.0);
    golrManager.add_query_field("iri_eng", 3.0);

    golrManager.add_query_field("id_std", 3.0);
    golrManager.add_query_field("id_kw", 3.0);
    golrManager.add_query_field("id_eng", 3.0);

    golrManager.add_query_field("label_std", 2.0);
    golrManager.add_query_field("label_kw", 2.0);
    golrManager.add_query_field("label_eng", 2.0);

    golrManager.add_query_field("definition_std", 1.0);
    golrManager.add_query_field("definition_kw", 1.0);
    golrManager.add_query_field("definition_eng", 1.0);

    golrManager.add_query_field("synonym_std", 1.0);
    golrManager.add_query_field("synonym_kw", 1.0);
    golrManager.add_query_field("synonym_eng", 1.0);

    golrManager.add_query_field("category_std", 1.0);
    golrManager.add_query_field("category_kw", 1.0);
    golrManager.add_query_field("category_eng", 1.0);

    golrManager.add_query_field("equivalent_iri_std", 1.0);
    golrManager.add_query_field("equivalent_iri_kw", 1.0);
    golrManager.add_query_field("equivalent_iri_eng", 1.0);

    golrManager.add_query_field("equivalent_curie_std", 1.0);
    golrManager.add_query_field("equivalent_curie_kw", 1.0);
    golrManager.add_query_field("equivalent_curie_eng", 1.0);
}

/*
 * Function: search
 *
 * Services used: Solr search core
 *
 * Arguments: term : search term
 *            filters: object of wanted filters
 *            facets: wanted facets, as array
 *            rows: number of docs to return
 *            start: offset of starting row
 * 
 * Returns: JSON structure
 */
bbop.monarch.Engine.prototype.search = function(term, filters, facets, rows, start) {
    var engine = this;

    var searchGolrManager = engine.initializeGolrManager("monarch_search", this.config.search_url);

    searchGolrManager.include_highlighting(true);
    searchGolrManager.set_query(term);

    // TODO DELETE THIS WHEN #1387 is done
    engine.golrHackForSearch(searchGolrManager);
    // END OF DELETE

    searchGolrManager.set_results_count(rows);

    if(filters != null && filters != undefined) {
        _.each(_.keys(filters), function(key) {
            _.each(filters[key], function(value) {
                searchGolrManager.add_query_filter(key, value);
            });
        });
    }

    if(facets != null && facets != undefined) {
        searchGolrManager.facets(facets);
    }

    var r = searchGolrManager.page(rows, start);

    // TODO DELETE THIS WHEN #1387 is done
    var postfixes = ["_eng", "_kw", "_std"];
    var zipped = _.zip(r._raw.response.docs, _.values(r._raw.highlighting));
    var hl = _.map(zipped, function(tuple) {
        var json = tuple[0];
        var highlight = tuple[1];

        return _.mapObject(json, function(val, key) {
            var keyPostfix = "impossiblev4lu3";
            _.each(postfixes, function(postfix) {
                // takes the last highlight element with postfix,
                // because we cannot break out from a each loop.
                if(highlight[key + postfix] != null) {
                    keyPostfix = key + postfix;
                }
            });

            if(highlight[keyPostfix] != null) {
                return highlight[keyPostfix];
            } else {
                return val;
            }
        });
    });
    r._raw.response.docs = hl;
    // END OF DELETE

    return r._raw;
}

/*
 * Function: autocomplete
 *
 * Services used: Solr search core
 *
 * Arguments: term : search term
 *            category: term category
 *            limit: number of results to return
 * 
 * Returns: JSON structure
 */
 bbop.monarch.Engine.prototype.autocomplete = function(term, category, limit) {
     var engine = this;
     
    // TODO return only fields of interest
    var searchGolrManager = engine.initializeGolrManager("monarch_search", this.config.search_url);

    searchGolrManager.include_highlighting(true);

    searchGolrManager.set_query(term);

    // TODO DELETE THIS WHEN #XXX is done
    engine.golrHackForSearch(searchGolrManager);
    // END OF DELETE

    searchGolrManager.set_results_count(limit);
    if(category != "" && category != null && category != undefined) {
        searchGolrManager.add_query_filter("category", category);
    }

    var r = searchGolrManager.search();

    //console.log(searchGolrManager.get_query_url())

    var zipped = _.zip(r.documents(), _.values(r._raw.highlighting));
    var hl = _.map(zipped, function(tuple) {
        var json = tuple[0];

        // filter out Class category
        if(_.contains(json.category, "Phenotype")) {
            json.category = "phenotype";
        } else if(_.contains(json.category, "disease")){
            json.category = "disease";
        } else {
            json.category = "gene";
        }

        // return a clean taxon field
        if (json.taxon_label != null || typeof json.taxon_label != 'undefined') {
            json.taxon = json.taxon_label;
        } else {
            json.taxon = "";
        }

        var keys = _.keys(tuple[1]);
        var values = _.values(tuple[1]);
        var completion = "";
        if(keys.length < 1) {
            completion = ids[index];
        } else {
            // skip highlighting on taxon fields, as they are not relevant for us
            var index = 0;
            while(index < keys.length && keys[index].indexOf("taxon") !== -1) {
                index++;
            }
            if(index >= keys.length) {
                completion =  values[0][0]; // first autocompleted field and first element of this array
            } else {
                completion = values[index][0];
            }
        }
        json.completion = completion;

        return json;
     });

    return _.values(hl);
 }


/*
 * Function: searchSubstring
 *
 * Services used: SciGraph vocabulary autocomplete
 *
 * Arguments: term : search term Returns: JSON structure - as per SciGraph vocabulary
 * services
 */
// TODO delete?
bbop.monarch.Engine.prototype.searchSubstring = function(term,categories,limit) {

    var engine = this;
    var results = [];
    if (limit == null){
        limit = 25;
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

    var limit = 500;
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
    try {
        var neighbors = engine.getGraphNeighbors(id_list, 1, 'http://purl.obolibrary.org/obo/RO_0002162',
                'BOTH', false, engine.config.scigraph_url);
        var graph = new bbop.model.graph();
        graph.load_json(neighbors);
        results = engine.addTaxonToGraph(results, id_list, graph);
    } catch(err) {
        //Issue is that request is too large for a GET, try again with just genes and diseases
        filt = results.filter( function(res){
            return (res.categories == 'gene' || res.categories == 'disease');
        })
        id_list = filt.map(function(i) { return i.id; });
        try {
            var neighbors = engine.getGraphNeighbors(id_list, 1, 'http://purl.obolibrary.org/obo/RO_0002162',
                    'BOTH', false, engine.config.scigraph_url);
            var graph = new bbop.model.graph();
            graph.load_json(neighbors);
            results = engine.addTaxonToGraph(results, id_list, graph);
            results.forEach(function (result) {
                if (!result['taxon']){
                    result['taxon'] = '';
                }
            });
        } catch(err2) {
            results.forEach(function (result) {
                result['taxon'] = '';
            });
        }
    }
    results.forEach(function (result) {
        result['categories'] = result['categories'].filter( function(category){
            return category != 'sequence feature';
        })
    })

    // Sort by the common taxa
    var temp = [];
    temp = temp.concat(results.filter( function (i){
        return i.taxon == 'Human' })
    );
    temp = temp.concat(results.filter( function (i){
        return i.taxon == 'Mouse' })
    );
    temp = temp.concat(results.filter( function (i){
        return i.taxon == 'Zebra Fish' })
    );
    temp = temp.concat(results.filter( function (i){
        return i.taxon == 'Fruit Fly' })
    );
    temp = temp.concat(results.filter( function (i){
        return i.taxon == 'Roundworm' })
    );
    results = temp.concat(results.filter( function (i){
        return ((i.taxon != 'Mouse')
              && (i.taxon != 'Human')
              && (i.taxon != 'Fruit Fly')
              && (i.taxon != 'Roundworm')
              && (i.taxon != 'Zebra Fish'))
        })
    );

    // remove equivalent ids
    var eq_graph = engine.getGraphNeighbors(id_list, 5, 'equivalentClass', 'BOTH', false, engine.config.scigraph_url);
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

bbop.monarch.Engine.prototype.addTaxonToGraph = function(results, id_list, graph) {
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
                if (label == 'Man') {
                    results[i]['taxon'] = 'Human'
                }
            }
        }
    });
    return results;
};


// TODO: document this
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

    if (logFetchTimes) {
        timeDelta = Date.now() - timeDelta;
        var g;
        g = this;
        if (typeof(g._timingRequestCount) === 'undefined') {
            g._timingRequestCount = 0;
            g._timingRequestTime = 0;
            g._timingRequestLength = 0;
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
bbop.monarch.Engine.prototype.initializeGolrManager = function(personality, golrServer) {
    var golr_response = require('bbop-response-golr');
    var sync_engine = require('bbop-rest-manager').sync_request;
    var golr_manager = require('bbop-manager-golr');
    var golr_conf = require('golr-conf');
    var engine_to_use = new sync_engine(golr_response);
    engine_to_use.method('GET');

    var golrConf = new golr_conf.conf(this.config.golr);
    if (typeof(golrServer) === 'undefined') golrServer = this.config.golr_url;

    var golrManager = new golr_manager(golrServer, golrConf, engine_to_use, 'sync');
    if(personality != null) {
        golrManager.set_personality(personality);
    }
    return golrManager;
}

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

    var golrManager = engine.initializeGolrManager(personality);

    if (typeof limit === 'undefined'){
        limit = 10;
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
    
    if (logFetchTimes) {
        var timeDelta = Date.now();
        this.log("FETCHING: " + "GET" + " " + golrManager.get_state_url());
    }

    return golrManager.search();
};

// Fetch solr documents given query, filters, personality, and limit
// Essentially the same as fetchAssociations() with different parameters
// some small DRY violations
bbop.monarch.Engine.prototype.fetchSolrDocuments = function (query, filters, personality, limit) {
    var engine = this;
    
    var golrManager = engine.initializeGolrManager(personality);

    golrManager.set_query(query);

    if (filters != null && filters instanceof Array && filters.length > 0){
        filters.forEach( function (filter) {
            golrManager.add_query_filter_as_string(filter);
        });
    }

    if (typeof limit !== 'undefined'){
        golrManager.set_results_count(limit);
    }
    
    if (logFetchTimes) {
        var timeDelta = Date.now();
        this.log("FETCHING: " + "GET" + " " + golrManager.get_state_url());
    }
    
    return golrManager.search();
};

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

// TODO: DELETE THIS: SEE: https://github.com/monarch-initiative/monarch-app/issues/975#issuecomment-238665637
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

//Hack to get patient pages, will eventually go away in favor of getting this info from a golr document
bbop.monarch.Engine.prototype.fetchCliqueLeader = function(id, server) {
    var engine = this;
    var leader = null;
    var path = "dynamic/cliqueLeader/"+id+'.json';
    var resultObj = [];

    if (!server){
        server = engine.config.scigraph_data_url;
    }

    var uri = server+path;
    var exchangeObj = engine.fetchUrlWithExchangeObject(uri);

    if (exchangeObj.status == 404) {
        this.log("not found: "+uri);
        return {concepts:[],nodes:[],edges:[]};
    }
    if (exchangeObj.status == 404) {
        // TODO: throw error
        return errorResponse(exchangeObj.content);
    }
    var sciObj = JSON.parse(exchangeObj.content);
    var graph = new bbop.model.graph();
    graph.load_json(sciObj);
    var node_list = graph.all_nodes();
    if (node_list.length == 1) {
        leader = node_list[0].id()
    }
    return leader;
}

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

    resultObj.cliqueLeader = engine.fetchCliqueLeader(id);

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

    var golrManager = new bbop.golr.manager.nodejs(golrServer, golrConf);

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
