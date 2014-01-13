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
	this.config.owlsim_services_url = "http://owlsim.crbs.ucsd.edu/";

	// UNCOMMENT THIS FOR HACKATHON TUNNELING
	//this.config.owlsim_services_url = "http://localhost:80"; // sudo ssh  swdev@toaster.lbl.gov -L 80:toaster.lbl.gov:9031 -N

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
	//TODO: fill this in automatically with external config file value?
	return "monarch-api-2013-10-01";
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
	var similar_diseases = [];
	var similar_mice = [];
	var pathways = [];

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
		//TODO this should call a generig "get disease-gene association" which can map to multiple sources
		resultObj = this.fetchOmimDiseaseGeneAsAssocations(id);
		gene_associations = gene_associations.concat(resultObj.results);

		resultObj = this.fetchSequenceAlterationPhenotypeAsAssociations(id,'9606');
		alleles = alleles.concat(resultObj.results);	

		//resultObj = this.fetchOmimGeneAllelePhenotypeAsAssocations(id);
		//alleles = alleles.concat(resultObj.results);

		sim = sim.concat(this.fetchMonarchDiseaseByDiseasePrecompute(id).results);
		//fetch the top 25 similar diseases
		similar_diseases = similar_diseases.concat(this.fetchThingsSimilarToADisease(id,'9606',25));
		similar_mice = similar_mice.concat(this.fetchThingsSimilarToADisease(id,'10090',25));

		resultObj = this.fetchPathwaysForDisease(id);
		pathways = pathways.concat(resultObj.results);

	}
	obj.phenotype_associations = phenotype_associations;
	obj.gene_associations = gene_associations;
	obj.models = models;
	obj.similar_models = {'10090' : similar_mice};
	obj.alleles = alleles;
	obj.sim = sim
	obj.similar_diseases = similar_diseases;
	obj.pathways = pathways;

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

	//TODO: this should probably be smarter to figure out what species the phenotype is in and then only query the relevant species
	//TODO: is taxon id attached to the phenotype term?
	obj.genotype_associations = this.fetchGenoPhenoAsAssociationsBySpecies(id,'10090').results;  //Mouse
	obj.genotype_associations = obj.genotype_associations.concat(this.fetchGenoPhenoAsAssociationsBySpecies(id,'7955').results); //Fish  
	obj.genotype_associations = obj.genotype_associations.concat(this.fetchGenoPhenoAsAssociationsBySpecies(id,'6239').results);   //Worm
	obj.genotype_associations = obj.genotype_associations.concat(this.fetchGenoPhenoAsAssociationsBySpecies(id,'9606').results);   //Human


	//obj.genotype_associations = obj.genotype_associations.concat(this.fetchWormGenoPhenoAsAssocations(id).results);

	// ** GENES **
	// TODO:  based on the genotype_associations fetched, we shold be able to get the implicated genes
	// TODO


	if (this.cache != null) {
		this.cache.store('phenotype', id, obj);
	}

	return obj;
}

/* Function: fetchGenotypeInfo
 *
 * Retrieves JSON block providing info about a genotype
 *
 * The structure follows geno, e.g.

 { id: ZDB-GENO-...?, label:, a<tm1>/a<+>;foo<x>/foo<x>(AB), type: effective_genotype
has_part : [

{ id: , label:, a<tm1>/a<+>;foo<x>/foo<x>(AB), type: intrinsic_genotype  ## aka SO:genotype
has_reference_part : {
id:.., label:AB, type: genomic_background
}
has_variant_part : {
id:.., label:, a<tm1>/a<+>;foo<x>/foo<x>, type: genomic_variation_complement,
has_variant_part : [
{
id:.., label:, a<tm1>/a<+>, type: variation_single_locus_complement,
has_variant_part : [
{
id: ZDB-ALT-, label: a<tm1>, type: variant_locus,
is_locus_instance_of : {
id: ZDB-GENE-..., label: a, type: gene_locus,
has_variant_part : {
id:, label: tm1, type: point_mutation
}
}
}
]
},
....
]
}
]
}
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
				console.log("Using Cached version of "+id);
				return cached;
			}
		}
	}

	//TODO: identifier resolver needed
	var obj = this.fetchGenotype(id,'10090'); //Mouse
	console.log("mouseGENO:"+JSON.stringify(obj));
	if (obj == null) {
		var obj = this.fetchGenotype(id,'7955'); //Fish
	} else {
		console.log("mouse genotype found");
	}
	if (obj == null) {
		var obj = this.fetchGenotype(id,'6239'); //Worm
	} else {
		console.log("worm genotype found");
	}
    	if (obj == null) {
        	var obj = this.fetchGenotype(id,'9606'); //Human
    	} else {
		console.log("human genotype found");
	}

	console.log("GENO:"+JSON.stringify(obj));

	// TODO - make this more elegant
	//TODO: should get this directly from the genotype... not sure why it's not there
	//    obj.phenotype_associations = this.fetchGenoPhenoAsAssociationsBySpecies(id,obj.taxon.id).results;
	if (obj == null) {
		obj = {};
		obj.id = id;
	}
    	obj.phenotype_associations = this.fetchGenoPhenoAsAssociationsBySpecies(id,'10090').results;  //Mouse
    	obj.phenotype_associations = obj.phenotype_associations.concat(this.fetchGenoPhenoAsAssociationsBySpecies(id,'7955').results); //Fish  
    	obj.phenotype_associations = obj.phenotype_associations.concat(this.fetchGenoPhenoAsAssociationsBySpecies(id,'6239').results); //Worm  
	obj.phenotype_associations = obj.phenotype_associations.concat(this.fetchGenoPhenoAsAssociationsBySpecies(id,'9606').results); //Human  

	obj.apiVersionInfo = this.apiVersionInfo();

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

	//obj.disease_associations = this.fetchOmimDiseaseAnatomyAsAssocations(id); // TODO - smarter query
	//obj.phenotype_associations = this.fetchOmimGenePhenotypeAsAssocations(id); // TODO - smarter query
	obj.phenotype_associations = this.fetchGenoPhenoAsAssociationsBySpecies(id,'9606').results;
	obj.gene_associations = this.fetchGeneExpressionAsAssocations(id);

	if (this.cache != null) {
		this.cache.store('anatomy', id, obj);
	}

	return obj;
}


/* Function: fetchGeneInfo
 *
 * Status: PARTIALLY IMPLEMENTED
 *
 * TODO - decide whether core gene info should come from ontology or federation
 *
 * Retrieves JSON block providing info about a gene, currently from MyGene
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
	//var obj = this.fetchClassInfo(id);
	//This will call MyGene services to get the basic gene information
	//can be augmented a lot.
	//See http://mygene.info/v2/api
	var obj = this.fetchGeneInfoFromMyGene(id);
	// TODO - enhance this object with calls to Federation services
	obj.pathways = this.fetchPathwaysForGene(id);
	//console.log("GENE("+id+")="+JSON.stringify(obj,null,' '));
	return obj;
}

bbop.monarch.Engine.prototype.fetchGeneInfoFromMyGene = function(id) {
	var mygene_url = "http://mygene.info/v2/";
	//if need be, we can expand this out a lot
	//http://mygene.info/v2/query?q=symbol:CDK2&species=9606
	var ret = this.fetchUrl(mygene_url + 'query?q=' + id);
	ret = JSON.parse(ret);
//	console.log("MyGene result="+JSON.stringify(ret,null,' '));
	if (ret.total > 0) {
	  var obj = ret.hits[0]; //return the first hit
	  obj.source =  "MyGene";
	} else { 
	  //need a fall-through case of looking this up in the id mapping table...will this get us KO ids?
	  //and/or looking this up in the KEGG tables
	  var obj = {id : id};
	  obj.source = "NOT FOUND";
	}
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
 *
 * Stability:
 *  - we may change the JSON object returned to be JSON-LD compliant
 *  - federation query may use ID mapping and OWL equivalence axioms in future
 *
 * Arguments:
 *  - id : An identifier. One of: IRI string, OBO-style ID or NIF-style ID
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
// Function: fetchOmimGenePhenotypeAsAssocations
//
// Status: DEPRECATED
bbop.monarch.Engine.prototype.fetchOmimGenePhenotypeAsAssocations = function(id) {
	var resource_id = 'nif-0000-03216-8'; // HARCODE ALERT

	var resultObj = 
		this.fetchDataFromResource(id, 
				resource_id
				//trOmimDGA TODO
				);
	return resultObj;
}

// Function: fetchOmimDiseaseGeneAsAssocations
//
// Status: IMPLEMENTED
//
// Given a query term (e.g. an ID, either disease or phenotype), return
// an association list object, with structure:
//
//     { resultCount : NUM, results: [ASSOC1, ...., ASSOCn] }
//
// Where ASSOC is an associative array representing a
// disease-gene association.
//
//
// Stability:
//  - we may change the JSON object returned to be JSON-LD compliant
//  - federation query may use ID mapping and OWL equivalence axioms in future
//
// Arguments:
//  - id : An identifier. One of: IRI string, OBO-style ID or NIF-style ID. E.g. OMIM_105830
//
// Returns: JSON representing list of D-G associations
///

// DGA
// EXAMPLE: https://neuinfo.org/mynif/search.php?q=Smith-Lemli-Opitz%20syndrome&t=indexable&list=cover&nif=nif-0000-03216-7
bbop.monarch.Engine.prototype.fetchOmimDiseaseGeneAsAssocations = function(id) {
	console.log("Fetching OMIM DiseaseGeneAssociations for"+id);
	var resource_id = 'nif-0000-03216-7'; // HARCODE ALERT
	var engine = this;
	// translate OMIM DiseaseGeneAssociation (DGA) result into generic association object
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
	  			source : "OMIM DiseaseGene associations",
		  	  	resource : resource_id
			};
			return obj;
		};

	// TODO: this currently uses a workaround, filtering on disease id, 
	// but it should should use the query 
        var filters = [
                "omim_phenotype_id:"+engine.getNifId(id),
                ];

	// note that we project a subset of the columns for efficiency
	var resultObj = 
		this.fetchDataFromResource(null,  //was id 
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


//TODO: this is really just a variation on the fetchGenoPhenoAsAssociation
bbop.monarch.Engine.prototype.fetchSequenceAlterationPhenotypeAsAssociations = function(id,sp) {
	console.log("Fetching SequenceAlterationPhenotypeAssociations: "+id);
    var species_to_resource_map = {    //HARDCODE ALERT
        '10090' : {id:'nif-0000-00096-6',label:'MGI'},  //MGI
        '7955' : {id:'nif-0000-21427-10',label:'ZFIN'},  //ZFIN
        '6239' : {id:'nif-0000-00053-4',label:'WB'},   //WB
        '7227' : {id:'nif-0000-00558-2',label:'FB'},   //FB
        '9606' : {id:'nif-0000-03216-9',label:'OMIM'}    //OMIM  
    };

  var resource_id = species_to_resource_map[sp].id;
  var engine = this;
  var tr =         
	function (r) {
        var geno = engine.makeGenotype(r);
 		var obj = {
			disease : {
                id : r.phenotype_id,
            	label : r.phenotype_label,
				description : r.phenotype_description_free_text,
				inheritance : r.phenotype_inheritance },
			sequence_alteration : geno.has_sequence_alterations[0],
			allele : geno.has_variant_loci.has_part[0],  //TODO: this is a list
			gene : geno.has_affected_genes[0],
			evidence : r.publication_id,  //TODO: this is a list  
			resource : resource_id,
            source : species_to_resource_map[sp],
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

// Function: fetchOmimGeneAllelePhenotypeAsAssociations
//
// Status: DEPRECATED

// EXAMPLE: https://beta.neuinfo.org/mynif/search.php?q=DOID_14692&t=indexable&nif=nif-0000-03216-6&b=0&r=20
bbop.monarch.Engine.prototype.fetchOmimGeneAllelePhenotypeAsAssocations = function(id) {
	var resource_id = 'nif-0000-03216-6'; // HARCODE ALERT

	// translate OMIM DiseaseGeneAssociation (DGA) result into generic association object
	var tr =
		function (r) {
			var obj = {
				// in the DGA view "phenotype" is disease
				disease : { 
					id : r.omim_phenotype_id,
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
};

//function:  makeGenotype
//
//Status:  MOSTLY IMPLEMENTED
//
//This is meant as an internal function to take a row (r) from NIF geno or pheno
//tables, and extract out the parts pertaining to a genotype, and build the JSON
//genotype object, following the GENO model.
//This will probably go away once we are able to get this data from D2R transformed
//datastore
//What is presently missing is the aggregation of genotype parts.  So, because
//the source data is denormalized, one genotype can have multiple rows, and
//will currently create multiple JSON objects with only partially-overlapping
//contents.  This will be confusing.
//
bbop.monarch.Engine.prototype.makeGenotype = function(r) {
	var background = {
		id : r.genomic_background_id,
     	label: r.genomic_background_label ,
     	type : "genomic_background"
	};

	//TODO: this isn't always a gene!  but for now it's fine.
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
	//TODO: is there a better way to get the gene ids?
	var affected_gene_collection = { 
		type : "affected_gene_collection", 
       	has_part : [r.gene_id].concat(r.implicated_gene_ids)  //implicated_gene_ids
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
		has_variant_part : variant_loci  //how do i get both?
	};

	var genomic_variation_complement = 
	//TODO: VSLC aren't given as a list...denormalized....how to aggregate?
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
	};
//	console.log("CACHE " + JSON.stringify(obj, null, ' '));
	return obj;
};


bbop.monarch.Engine.prototype.fetchGenotype = function(id,sp) {
	var species_to_resource_map = {  //HARDCODE ALERT
		'10090' : {id:'nif-0000-00096-5',label:'MGI'},  //MGI
		'7955' : {id: 'nif-0000-21427-13',label:'ZFIN'},  //ZFIN
		'6239' : {id: 'nif-0000-00053-3',label:'WB'},   //WB
		'7227' : {id: 'nif-0000-00558-1',label:'FB'},   //FB
		'9606' : {id: 'nif-0000-03216-9',label:'OMIM'}    //OMIM - this is a variant table  
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
			return geno;
		};

	var resultObj =
		this.fetchDataFromResource(id,
				resource_id,
				tr
				);

	// TODO 
	var geno = genoLookup[id];
	console.log("GENOLookup: "+JSON.stringify(geno));

/*	if (geno == null) {
		geno =
		{
			type : "genotype",
       		id : id,
       		source : {
				id : resource_id,
       		},
		resource : resource_id
		};
	} */
	return geno;
}


bbop.monarch.Engine.prototype.fetchGenoPhenoAsAssociationsBySpecies = function(id,sp) {
	//a species to resource map // HARDCODE ALERT
	//TODO: will need to make array so that we can multiple source for each species
	//TODO:  - can eventually be dynamic with a service call
	var species_to_resource_map = {
		'10090' : {id:'nif-0000-00096-6',label:'MGI'},  //MGI
		'7955' : {id:'nif-0000-21427-10',label:'ZFIN'},  //ZFIN
		'6239' : {id:'nif-0000-00053-4',label:'WB'},   //WB
		'7227' : {id:'nif-0000-00558-2',label:'FB'},   //FB
		'9606' : {id:'nif-0000-03216-9',label:'OMIM'}    //OMIM  
	};

	var resource_id = species_to_resource_map[sp].id;

    var engine = this;
	var tr =
		function (r) {

			//TODO: this is very zfin-specific -- do we need to generalize this 
			//and do some lookups into the ontology for mappings to anatomy?
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
					id : r.publication_id,
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
	      			}
	       		},
				source : species_to_resource_map[sp],
				taxon : {
					id : r.taxon_id,
     				label: r.taxon_label
				},
				resource : species_to_resource_map[sp].id
			};
		return obj;
	};


	var resultObj = this.fetchDataFromResource(id,resource_id,tr);

	return resultObj;
}


// EXAMPLE: https://beta.neuinfo.org/mynif/search.php?t=indexable&list=cover&nif=nif-0000-00096-2&q=MP_0000854
// EXAMPLE: https://beta.neuinfo.org/mynif/search.php?&t=indexable&nif=nif-0000-21427-10&b=0&r=20&q=cerebellum
// https://neuinfo.org/mynif/search.php?q=worm&t=indexable&list=cover&nif=nif-0000-00053-2&q=synapse
// http://beta.neuinfo.org/services/v1/federation/data/nif-0000-00053-2.json?includePrimaryData=true&q=synapse
/*
//THIS FUNCTION IS NOW DEPRECATED
   bbop.monarch.Engine.prototype.fetchWormGenoPhenoAsAssocations = function(id) {
   var resource_id = 'nif-0000-00053-2'; // HARCODE ALERT

   var tr =
   function (r) {

   var obj = {
evidence : { 
type : {
id : "ECO:0000006",
code : "EXP",
label : "inferred from experiment"
}
},
reference : {
id: r.wb_citation_id,
},
has_genotype : 
{
id : r.allele_id,
label : r.allele_name,
type : r.allele_type_id,

// we repeat the background object - it also appears inside genotype_context

// A 'parent' genotype (i.e. genetic context) is split into experiment and 'organismal' part (i.e. genotype context)
has_part : [
{
is_sequence_variant_of : {
id : r.affected_gene_id,
label : r.affected_gene_name
}
}
]
},
has_phenotype : {
description : r.free_text_phenotype_description,
type :
{
id : r.phenotype_id,
label : r.phenotype_label,
},
//inheres_in : inheres_in,
start_stage :
{
type : {
id : r.start_stage_id,
label : r.start_stage_label
}
},
end_stage :
{
type : {
id : r.end_stage_id,
label : r.end_stage_label
}
},
},
source : {
id : resource_id,
label : "WormBase GenoPheno associations",
},                    
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
// WORM
*/





// EXAMPLE: https://neuinfo.org/mynif/search.php?q=MGI_4420313&first=true&t=indexable&nif=nif-0000-00096-3
// EXAMPLE: http://beta.neuinfo.org/services/v1/federation/data/nif-0000-00096-3.json?includePrimaryData=true&q=MGI_4420313
// Note: the id may be for any part of a genotype - e.g. if query by a background ID then the results may include all
// genotypes with this as part

// THIS FUNCTION IS NOW DEPRECATED - most functionality has been replicated by
// fetchGenotype(id,sp), which is a generic version of this function.
bbop.monarch.Engine.prototype.fetchMgiGenotype = function(id) {
	var resource_id = 'nif-0000-00096-3'; // HARCODE ALERT


	var genoLookup = {};

	var tr =
		function (r) {
			// note: id might not match genotype_id (e.g. it may match background)
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
			console.log("CACHE " + JSON.stringify(geno, null, ' '));

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
			//geno.allele_complement = r.allele_complement; //???



			// TODO - check w Matt and Nicole if background is part of geno or g2a assoc?
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
	//geno.alleles =
	//    resultObj.results;
	// TODO 
	var geno = genoLookup[this.getOboId(id)];
	if (geno == null) {
		geno = 
		{
			type : "genotype",
       		id : id,
       		source : {
				id : resource_id,
     			label : "MGI GenoAllele"
       		},
			resource : resource_id
		};
	}
	return geno;
}




// EXAMPLE: http://beta.neuinfo.org/services/v1/federation/data/nif-0000-21427-8.json?includePrimaryData=true&q=ZDB-GENO-030619-2
// Note: the id may be for a genomic_variant_complement_id or an allele.
// This does NOT find all alleles for the whole context
// bbop.monarch.Engine.prototype.fetchZfinGenomicVariantComplements = function(id) {
//     var resource_id = 'nif-0000-00096-3'; // ZFIN:GenotypeAllele

//     var genoLookup = {};

//     var tr =
//         function (r) {
//             // note: id might not match genotype_id (e.g. it may match background)
//             var geno = {
//                 id : r.genomic_variant_complement_id,
//                 label : r.genomic_variant_complement_name,
//                 type : "genomic_variant_complement", 
//                 zygosity : zygosity,
//                 has_part : [],
//                 source : {
//                     id : r.resource_id,
//                     label : "ZFIN GenoAllele",
//                 }
//             };

//             // these are properties of the container
//             if (genoLookup[geno.id]) {
//                 geno = genoLookup[geno.id];
//             }
//             else {
//                 genoLookup[geno.id] = geno;
//             }

//             var vslc = {
//                 id : r.allele_complement_id,
//                 label : r.allele_complement_label,
//                 type : "variant_single_locus_complement",
//                 is_sequence_variant_of : {
//                     id : r.locus_id,
//                     symbol : r.locus_symbol,
//                     label : r.locus_name,
//                     type : "gene"
//                 },
//                 has_variant_part : [
//                     {
//                         id: r.allele_1_id,
//                         label: r.allele_1_label
//                     },
//                     {
//                         id: r.allele_2_id,
//                         label: r.allele_2_label
//                     }
//                 ]
//             };
//             //geno.allele_complement = r.allele_complement; //???



//             // TODO - check w Matt and Nicole if background is part of geno or g2a assoc?
//             // @Deprecated
//             var obj = {
//                 type : "GenotypeAlleleAssociation",
//                 zygosity : r.zygosity,
//                 genomic_variation_complement : r.genomic_variation_complement,
//                 has_background : background,
//                 allele_complement: r["Allele Complement"],
//                 has_locus : { id : r.locus_id,
//                               symbol : r.locus_symbol,
//                               label : r.locus_name },
//                 // TODO allele stuff

//                 source : "ZFIN GenoAllele",
//                 resource : resource_id
//             };
//             return obj;
//         };


//     var resultObj = 
//         this.fetchDataFromResource(id, 
//                                    resource_id,
//                                    tr
//                                   );
//     //geno.alleles =
//     //    resultObj.results;
//     // TODO 
//     var geno = genoLookup[id];
//     if (geno == null) {
//         geno = 
//             {
//                 type : "genotype",
//                 id : id,
//                 source : "ZFIN GenoAllele",
//                 resource : resource_id
//             };
//     }

//     print("GENO = "+geno);

//     return geno;
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

};

// Function: fetchSimilarThings
//
// Status:  Partially Implemented
//
// This function will take some kind of identifier (disease, genotype), and find those "things"
// that are similar.  
// First implementation will take a disease or genotype identifier, and find the top "cutoff" things
// (either diseases or animal models) based on the owlsim precomputed piepline.  These are
// loaded statically in the NIF/Monarch tables, with a resource identification map to 
// locate the correct precomputed table in NIF.
// Defaults are set for cutoff(25) and metric (BMAasymIC), but the query id and target_species should be supplied
// in order to know what table needs to be fetched
// This currently does an iterative lookup in order to get all the labels.  Note sure if that is
// the best strategy.
// This wrapping function could easily have precomputed or on-the-fly functions added or swapped.
//
// TODO: this can be extended to apply other kinds of filters to limit the data considered,
//       or only specific classes or whatever.  Lots of possiblities for the future.
// TODO: this should really have a target_type filter, and the selection of the precomputed dataset
//       should be based on the combination of source_taxid, target_taxid, a_type, and b_type.
//
bbop.monarch.Engine.prototype.fetchThingsSimilarToADisease = function(id,target_species,cutoff,metric) {
	//currently, we only have disease x (disease or mouse models) in tables
	//TODO: load other precomputed data sources
	//TODO: types should be fetched from CM services
	//HARDCODE ALERT:  these assume selection by target_species -- could be other filters
	var species_to_resource_map = {
		'9606' : {
			id:'nlx_152525-3', label:'OwlSim: Disease-x-disease',
			a_type:"disorder", b_type:"disorder",
			a_source:'nlx_151835-1', b_source:'nlx_151835-1' },
		'10090' : {
			id:'nlx_152525-10', label:'OwlSim: Disease-x-mouse_genotypes',
			a_type:"disorder", b_type:"effective_genotype",
			a_source:'nlx_151835-1', b_source:'nif-0000-00096-6' },
//		'7995' : {id:'',label'zebrafish models'}
	};

	//set defaults	
	if (typeof target_species == 'undefined') {
		console.log("ERROR: no target_species supplied. Defaulting to human, 9606.");
		target_species = '10090'
	};


	//TODO: these defaults probably should be in a config
	cutoff = typeof cutoff !== 'undefined' ? cutoff : 5;
	metric = typeof metric !== 'undefined' ? metric : 'BMAasymIC';   //HARDCODE

	//TODO: need to write a proper function to find the correct precomputed thing
	//      based on source and target types in addition to species.

	var resource = species_to_resource_map[target_species];
	var engine = this;

    var queryLookup = {};

    var tr =
        function (r) {
		    var query = { 
        	    //id : r.a,
				id : engine.getNifId(r.a),
            	label : engine.fetchInstanceLabelByType(r.a,resource.a_source,resource.a_type).results[0].label,
            	type : resource.a_type,
        	};
            
			// these are properties of the container
            if (queryLookup[query.id]) {
                query = queryLookup[r.a];
            }
            else {
                queryLookup[query.id] = query;
            }
            console.log("CACHE " + JSON.stringify(query, null, ' '));

			var target = {
                    id : r.b,
                    label : engine.fetchInstanceLabelByType(r.b,resource.b_source,resource.b_type).results[0].label,
                    type: resource.b_type,
                	score : {'metric' : r.metric, 'score' : r.score, 'rank' : r.rank } 
			};
			/*
            var obj = {
				//TODO: should this be querying OQ or vocab service to get the labels instead?
                a : {
					id : r.a,
					label : engine.fetchInstanceLabelByType(r.a,resource.a_source,resource.a_type).results[0].label, 
                    type : resource.a_type,
                    },
                b : { 
					id : r.b,
					label : engine.fetchInstanceLabelByType(r.b,resource.b_source,resource.b_type).results[0].label, 
					type: resource.b_type,
                	},
				
				score : {'metric' : r.metric, 'score' : r.score, 'rank' : r.rank },
				//metric : r.metric,
                //score : r.score,  
                //value : r.value,
				
				//TODO: these are totally made up, and probably should be an owlsim function call?
				//add ontology and other properties of the run, date, etc.?  maybe a link to a README?
                metadata : { metric_stats: {metric : 'BMAasymIC', maxscore : '8.45'}, avgIC : '8.567', maxIC : '12.234'}, 
				
				// provenance
                source : resource,
                resource : resource.id
            };*/
			return target;
			//return obj if you want a flat structure; use target if you want it nested
			//            return obj;
        };

	var filters = [
		"a:"+id,
		"rank:<"+cutoff,
		"metric:"+metric];

    var resultObj =
        this.fetchDataFromResource(null,
                resource.id,
                tr,
				null, 
				filters,
				null,
				'rank'
                );

    //var query = queryLookup[id];
	var query = queryLookup[this.getNifId(id)];
	
	var similarThings = {
		a : query,
		b : resultObj.results,
		cutoff : cutoff,
		metadata : { metric_stats: {metric : 'BMAasymIC', maxscore : '8.45'}, avgIC : '8.567', maxIC : '12.234'},
		source : resource,
		resource : resource.id
	};
    return similarThings;

//    return resultObj;

}


//  Function:  fetchThingsSimilarToAListOfPhenotypes
//  Status: PARTIALLY IMPLEMENTED
//  This function takes a comma-delimited list of phenotype identifiers, together with a target species and type, cutoff
//  and metric, and will return the user a list of semantically similar things (of type target_type).
//  This is currently hardcoded to types per species, but will be expanded in the future to be more customizable.
//  Note that target_type ought to be of the type:  genotype | disease | gene | variation
bbop.monarch.Engine.prototype.fetchThingsSimilarToAListOfPhenotypes = function(query,target_species,target_type,cutoff,metric) {
//TODO: This assumes that the target type is either a disease or a genotype!
//      But it could be genes or other feature types.
	var engine = this;

	var id_list = query.split(/[\s,]+/);  //assume it's just a simple string list, convert to proper list type
        console.log("Query:"+id_list);
	console.log("|Query| : "+ id_list.length);
	id_list = engine.mapIdentifiersToPhenotypes(id_list);

	var species_to_filter_map = {
			'10090' : { id_space : 'MGI', target_type : 'genotype' },
			'9606' : { id_space : 'OMIM', target_type : 'disease'},
			'7995' : { id_space : 'ZFIN', target_type : 'genotype'}
	};

	//set defaults  
	if (typeof target_species == 'undefined') {
			console.log("ERROR: no target_species supplied. Defaulting to human, 9606.");
			target_species = '9606'
	};
	cutoff = typeof cutoff !== 'undefined' ? cutoff : 5;
	metric = typeof metric !== 'undefined' ? metric : 'BMAasymIC';   //HARDCODE
	target_type = typeof target_type != 'undefined' ? target_type : 'disease';

	var resource = species_to_filter_map[target_species];

	//TODO: this is currently hardcoded to a single type - needs to be flexible
    //      should be based on the target_type
    var target = species_to_filter_map[target_species].id_space;  //HARDCODE ALERT

    var queryLookup = {};
    var stuff = engine.searchByAttributeSet(id_list,target,cutoff);

    var results = [];
    metric = 'bmaAsymIC';
    for (var i=0; i<stuff.results.length; i++) {
	//TODO: what's odd here is that i'm postumously assigning rank, but i don't know what the sort order is!
	    var r = stuff.results[i];
	    var obj = {
		    id : r.j.id, 
		    label : r.j.label, 
		    matches : r.matches,
		    type : target_type, 
		    score : {metric : metric, score : r[metric], rank : i} } ;
	    results.push(obj);
    };

    var similarThings = {
			a : id_list,  //TODO: look up the id info - return this info
			b : results,  //TODO: process results to select only a single metric, reformat, etc.
			cutoff : cutoff,
			//TODO: this metadata should be an owlsim call, or perhaps returned with the object itself
			metadata : { metric_stats: {metric : 'BMAasymIC', maxscore : '8.45'}, avgIC : '8.567', maxIC : '12.234', avgsumIC : '80.345', n : '7123'},
			source : resource,
			resource : resource.id
	};
    console.log('SIMILAR:'+JSON.stringify(similarThings,null,' '));
    return similarThings;

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
				a : { 
					type : "disease",
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
			a : { 
				id: r.interactor_a_gene_id,
	    		label: r.interactor_a_gene_name},
    		b : { 
				id: r.interactor_b_gene_id,
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

/* Function: searchByAttributeSet
 * 
 * Returns: ordered list of matches
 * 
 * Arguments:
 * - atts : list of class identifiers
 * - target: (optional) e.g. MGI
 * - limit : number of results to return
 * 
 */
bbop.monarch.Engine.prototype.searchByAttributeSet = function(atts, target, limit) {
	console.log("|Atts| = "+atts.lnegth);
	console.log("Atts:"+atts);
	console.log("Tgt:"+target);
	var ph = 
	{
		a : atts
	};
	if (target != null) {
		ph.target = target;
	}
	if (limit != null) {
		ph.limit = limit;
	}
	var resultStr = this.fetchUrl(this.config.owlsim_services_url + '/searchByAttributeSet',
			ph,
			'get');
	return JSON.parse(resultStr);
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
			//if (pa.has_phenotype == null) {
			//console.log(" HUH?" + JSON.stringify(pa));
			//}
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
     //lcs_label : lcsObj.label,
     lcs_score : lcsObj.LCS_Score
		};
		attMatchList.push(am);
	}

}

return attMatchList;
}

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
	// TODO avoid hard-cording assumptions
	if (db == 'MP' || db == 'HP' || db == 'WBbt' || db == 'ZP') {
		return id;
	}
	if (db == 'OMIM' || db == 'DECIPHER' || db == 'ORPHANET') {
		console.log("Expanding disease ID to phenotype: "+id);
		resultObj = this.fetchOmimDiseasePhenotypeAsAssocations(id);
		phenotype_associations = phenotype_associations.concat(resultObj.results);
		return phenotype_associations.map( function(a) {return a.phenotype.id});
	}
	console.log("Assuming id is a phenotype: "+id);
	return id;
}

//A generic wrapper to fetch all pathway information, given some pathway query
//Status: NOT IMPLEMENTED
bbop.monarch.Engine.prototype.fetchPathwayInfo = function(q) {
  //TODO: add cache checks here --uncomment
/*    if (this.cache != null) {
        var cached = this.cache.fetch('pathway', id);
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
 */
	//TODO: in the future allow lookups for any pathway table
	resource_id = 'nlx_31015-3'; //HARDCODE ALERT
  	var engine = this;
  	var tr = 
		function (r) {
  			var obj = {
      			id : r.pathway_id,
      			label : r.pathway_label,
				description : r.description, //TODO- we don't yet have the data
      			genes : engine.fetchGenesForPathway(r.pathway_id).results,
				//diseases : engine.fetchDiseasesForPathway(r.pathway_id).results,
				resource : resource_id,
				source : { id : resource_id,label : 'KEGG'}
  			};
        	return obj;
		};
	var resultObj =
		this.fetchDataFromResource(q,resource_id,tr);

    return resultObj;
}

//Given a pathway ID, fetch the list of genes that are annotated to it
//Can be optionally filtered by Species
//Status: NOT IMPLEMENTED
bbop.monarch.Engine.prototype.fetchGenesForPathway = function(id,species) {
	console.log("Fetching GenesForPathway: "+id);
	resource_id = 'nlx_31015-3'; //HARDCODE ALERT
	//set default species to human
    if (typeof species == 'undefined') {
        console.log("ERROR: no species supplied for gene fetching. Defaulting to human, 9606.");
        species = '9606'
    };

  	var engine = this;
  	var tr =
		function (r) {
			var obj = {
					//TODO: need to properly list the genes, with id and label
					//TODO: need to map the ko ids to the appropriate species
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

//Status: NOT IMPLEMENTED
bbop.monarch.Engine.prototype.fetchDiseasesForPathway = function(id) {
  	return {};
}

//A helper function to map any gene ID to a kegg KO id
bbop.monarch.Engine.prototype.mapGeneToKO = function(id) {
	var resource_id = 'nlx_31015-4'; //gene-to-KO map //HARDCODE
	var resource_id = 'nlx_152525-4'; //ID map
    return {};
}



//Given a gene id, fetch all pathways that are annotated to it.
//At first, use the KEGG pathways, which required operating via KO class 
//Status: NOT IMPLEMENTED
//TODO: operate on a list!
bbop.monarch.Engine.prototype.fetchPathwaysForGene = function(id) {
	var resource_id = 'nlx_31015-4'; //gene-to-KO map //HARDCODE
	var resource_id = 'nlx_31015-3'; //pathway-to-KO map //HARDCODE
	var engine = this;

	//for now, assume user is coming in with a KO id.
    //var ko_id = this.mapGeneToKO(id);
    var geneLookup = {};

    var tr =
        function (r) {
			var gene = { id : id, pathways : [] };//, pathways : [{id: r.pathway_id,label : r.pathway_label}] };
			if (geneLookup[id]) {
				gene = geneLookup[id];
			} else {
				geneLookup[id] = gene;
			}
		gene.pathways.push({id: r.pathway_id,label : r.pathway_label});
        return gene;
    };

    var resultObj =
        this.fetchDataFromResource(id,
                resource_id,
                tr
                );

	var stuff = {
					pathways : geneLookup[id].pathways, 
                    id : id, //TODO: temp, for testing
                    resource : resource_id,
                    source : {
                        id: resource_id,
                        label: 'KEGG' }
                };
    //console.log(JSON.stringify(stuff));
	return stuff;
}

//Given a disease id, fetch all pathways that are annotated to it.

//Status: NOT IMPLEMENTED
//TODO: add inferred linkages via disease genes (which might not be curated from KEGG
bbop.monarch.Engine.prototype.fetchPathwaysForDisease = function(id) {
	var resource_id = 'nlx_31015-2'; //HARDCODE ALERT
	var engine = this;
	
	var tr =
        function (r) {
			var obj = {
				id : r.disease_id,
				label : r.disease_label,
				pathways : [ r.pathway_ids.split(", ") ],
				references : [ r.publication_ids.split(", ")  ]
			};
			return obj;
    };

	
	var resultObj = this.fetchDataFromResource(id, resource_id, tr);

	return resultObj;
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

//Search a specified resource for a value, filtered by it's type
bbop.monarch.Engine.prototype.fetchInstanceLabelByType = function(id, resource_id,type_label) {
	var nif_id = this.getNifId(id); //formats an identifier for nif-style
    
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
			console.log("Fetched: "+JSON.stringify(obj));
            return obj;
        };

	var filters = [type_label+"_id:"+nif_id];	
	var cols = [type_label+"_name",type_label+"_label"];

	//TODO: when this ticket is closed, we don't have to limit the filter:
	//https://support.crbs.ucsd.edu/browse/NIF-9875
    var resultObj =
        this.fetchDataFromResource(null,
                resource_id,
                tr,
                cols, 
				filters,
				1  //just fetch the first match, and hope it's right!
                );

    return resultObj;
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
	var xmlStr = this.fetchUrl(url);
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
 * Services used: NIF federation call. See: http://beta.neuinfo.org/services/resource_FederationService.html#path__federation_data_-nifId-.html
 *
 * This currently relies on OntoQuest magic to ensure that the input ontology class ID is
 * expanded to all relevant https://support.crbs.ucsd.edu/browse/LAMHDI-140
 *
 * Arguments:
 *   q : query. Arbitrary term or NIF ID
 *   resource_id : E.g. nlx_151835-1
 *   trFunction : a function to be applied to each result object which returns a transformed object
 *   project    : a list of columns to project (select)
 *   filters    : a list of filters to be applied at fetching time
 * Returns: JSON structure { resultCount : NUM, results: [ TRANSFORMED-OBJECTS ] }
 */
bbop.monarch.Engine.prototype.fetchDataFromResource = function(id, resource_id, trFunction, projectCols, filters,limit,sortField) {
	// Example: http://beta.neuinfo.org/services/v1/federation/data/nif-0000-03216-7.json?includePrimaryData=true&q=Smith
	if (id != null) {
		var nif_id = this.getNifId(id);
	}  else { var nif_id = '*'};

	//presently, system maxes at 1000 results
    var LIMIT = ((typeof limit !== 'undefined') && (limit !== null)) ? limit : 1000;
	//var LIMIT = 1000;

	var params = 
	{
		includePrimaryData : true, 
		count : LIMIT,
		q : nif_id
	};
	if (projectCols != null && projectCols.length > 0) {
		params.project = projectCols;
	}

    if (filters != null && filters.length > 0) {
		params.filter = filters;
	}
	if (sortField != null && sortField.length > 0) {
		params.sortField = sortField
	}

	// flat results transformed into nested json objects
	var results = [];

	var resultStr = this.fetchUrl(this.config.federation_services_url + 'data/' +  resource_id + '.json', 
			params
			);
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
bbop.monarch.Engine.prototype.fetchUrl = function(url, params, method) {
    var data = '';
    if (params != null) {


        // be flexible in what params can be..
        if (params.map != null) {
            // params is a list of "K=V" strings
            data = params.join("&");
        }
        else {
            // params is a dictionary, with each value an atom or a list
            data = "";
            for (var k in params) {
                var vs = params[k];
                if (vs.map == null) {
                    vs = [vs];
                }
                data = data + vs.map( function(v) { return k+"="+v }).join("&") + "&";
            }
        }

    }
    console.log("FETCHING: "+url+" data="+data);
    //print("URL: "+url);
    if (method == 'post') {
        // TODO - refactor
        var httpclient = require('ringo/httpclient');
        console.log("URL: "+url);
        var exchangeObj =  httpclient.post(url, data);
        console.log("RESULT: "+exchangeObj);
        console.log("STATUS: "+exchangeObj.status);
        return exchangeObj.content;
    }
    else {
		if ((data != '') && (typeof data != 'undefined')) {
			url = url + "?" + data;
		}
        this._lastURL = url;
        return this.fetchUrlLowLevel(url);

//        this._lastURL = url + "?" + data;
//        return this.fetchUrlLowLevel(url + "?"+data); 
    }
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
		category = 'phenotype';
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

bbop.monarch.Engine.prototype.getOboId = function(id) {
	if (id.indexOf("_") > -1) {
		id = id.replace("_",":");
	}
	return id;
}

/* Function: resolveClassId
 *
 * Resolves one of the many identifier styles to a canonical NIF-style class ID
 *
 * Example: resolveClassId("OMIM:123456") returns "OMIM_123456"
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
		// properties:
		has_genotype: "GENO:0000222",   //TODO: why does a relationship have a class id?
		has_background: "GENO:0000010",

		// classes:
		environment : "GENO:0000099",
		genotype : "GENO:0000000",
		intrinsic_genotype : "GENO:0000000",
		extrinsic_genotype : "GENO:0000524",
		effective_genotype : "GENO:0000525",
		genomic_variation_complement : "GENO:0000009", //GENO_0000520?
		//ExperimentalGenotype : "GENO:0000438",
		genomic_background : "GENO:0000010",
		//genetic_context : "GENO:0000427",
		sequence_alteration_collection : "GENO:0000025",
		variant_loci : "GENO:0000027", //variant_locus_collection?
		//reference_loci : "GENO:0000024", //reference_locus_collection?
		variant_locus : "GENO:0000481", //variant_locus  //"GENO:0000062", //sequence-variant_gene_locus
		reference_locus : "GENO:0000036", //reference_locus  //GENO_0000501, wild-type locus?
		gene_locus : "GENO:0000014",  //GENO_0000184
		sequence_alteration : "SO:0001059",
		zygosity : "GENO:0000133", //zygosity
		chromosome : "GENO:0000323", //chromosome
		chromosomal_region : "GENO:0000390", //chromosomal_region
		morpholino : "GENO:0000417", //morpholino

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



