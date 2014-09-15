var {convChars}  =  require("./utils");

// GENERIC
function genTable(spec, rows) {
    var content = "";
    content += "<table class='table table-striped table-condensed simpletable'>\n";
    if (rows != null) {
        content += "<thead>\n<tr>\n";
        for (var j = 0; j < spec.columns.length; j++) {
            var colname = spec.columns[j].name;
            var datatype = tableSortDataType(colname);
            content += "<th data-sort='" + datatype + "'>" + colname;
            var sortingsupported = ["string", "float", "frequency"];
            if (sortingsupported.indexOf(datatype) != -1) {
                content += "<span class=\"arrow\"> &#x2195;</span>";
            }
            content += "</th>\n";
        }
        content += "</tr>\n</thead>\n<tbody>\n";
        for (var i = 0; i < rows.length; i++) {
            content += "<tr>\n";
            for (var j=0; j< spec.columns.length; j++) {
                var colspec = spec.columns[j];
                var ontSpace = "";
                if (j == 0 && spec.columns.length > 1) {
                    if (spec.columns[1].val(rows[i]) == "equivalentClass") {
                        ontSpace += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
                    } else if (spec.columns[1].val(rows[i]) == "subClassOf") {
                        ontSpace += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
                    }
                }
                content += "<td>"+ontSpace+colspec.val(rows[i])+"</td>";                    
            }
            content += "\n</tr>\n";            
        }
        content += "</tbody>\n";
    }
    content + "</table>\n";
    return content;
}

// Function: used to assign data types to each column for sortable tables
// - name: name of column
function tableSortDataType(name) {
    var string_types = ["allele", "associated with", "association type", "authors", "data type", "disease",
        "similar diseases", "evidence", "gene", "gene A", "gene B", "gene B organism", "genotype", "hit",
        "homolog", "homology class", "inferred from", "interaction detection method", "interaction type",
        "journal", "model", "model species", "model type", "most informative shared phenotype", "mutation",
        "onset", "organism", "other matching phenotypes", "pathway", "phenotype", "phenotype description",
        "qualifier", "reference", "references", "relationship", "species", "title", "variant"];
    var float_types = ["combined score", "phenotype similarity score", "rank", "year"];
    if (string_types.indexOf(name) != -1) {
        return "string";
    } else if (float_types.indexOf(name) != -1) {
        return "float";
    } else {
        return name;
    }
}

// Function:
// - type: object type/category
// - obj: either { id : id, label : label} or a list of these
function genObjectHref(type,obj,fmt) {
    if (obj == null) {
        return "";
    }
    if (obj.type != null && obj.type.id != null) {
        return genObjectHref(type, obj.type, fmt);
    }
    if (obj.map != null) {
        return obj.map(function(x){return genObjectHref(type,x,fmt)}).join(" ");
    }

	var url = genURL(type, obj, fmt);
    var label = obj.label;

    // must escape label here. How do to this in JAvascript.
    if (label == null || label=="") {
        label = obj.id;
    }
    else {
        label = convChars(label);
    }
    return '<a href="'+url+'">'+label+'</a>';
}
function genObjectHrefs(type,objs,fmt) {
    return objs.map(function(obj){return genObjectHref(type,obj,fmt)}).join(" . ");
}


function genSourceHref(type,obj,fmt) {
    if (obj == null) {
        return "";
    }
    if (obj.type != null && obj.type.id != null) {
        return genObjectHref(type, obj.type, fmt);
    }
    if (obj.map != null) {
        return obj.map(function(x){return genSourceHref(type,x,fmt)}).join(" ");
    }

    var url = genURL(type, obj, fmt);
    var label = obj.label;

    // must escape label here. How do to this in JAvascript.
    if (label == null || label=="") {
		if (obj.id == null || typeof obj.id == 'undefined') { 
			label = obj;
		} else {
			label = obj.id;
		}
    }
    else {
        label = convChars(label);
    }
    label = sourceImage(label);
    return '<a href="'+url+'" target="_blank">'+label+'</a>';
}

function genExternalHref(type,obj,fmt) {
    if (obj == null) {
        return "";
    }
    if (obj.type != null && obj.type.id != null) {
        return genExternalHref(type, obj.type, fmt);
    }
    if (obj.map != null) {
        return obj.map(function(x){return genExternalHref(type,x,fmt)}).join(", ");
    }

    var label = obj.label;

    // must escape label here. How do to this in JAvascript.
    if (label == null || label=="") {
		if  (obj.id == null) {
			return '';
		} else {
			label = obj.id.trim();
		}
    }

    else {
        label = convChars(label).toString().trim();
    }
	var url = '';
	if (typeof obj.url != 'undefined' && obj.url != null && obj.url != '') {
		url = obj.url;
	} else {
		url = makeExternalURL(obj.id);
	}
    //label = sourceImage(label);
    if (url != null && url.match(/http/)) {
        return '<a href="'+url+'" target="_blank">'+label+'</a>';
    } else {
        return label;
    }
}

function getXrefObjByPrefix(prefix) {
	var xrefBlob = {};
	if (prefix != null && typeof prefix != 'undefined') {
		xrefBlob = getConfig('xrefs')[prefix.toLowerCase()];
	}
	return xrefBlob;
}

//TODO: make these from external config file
function makeExternalURL(id) {
    var url = id;
    if (url != "" && id != null) {
        var strippedID = id.replace(/[\w-]+?:/,'');
	    var idSpace = id.replace(/:+?.*/,'');
	    if (idSpace == "OMIM") {
			//HACK
			strippedID = strippedID.replace('.','#');
		} else if (idSpace == "KEGG") {
			//HACK
			//kegg is an interesting one... need to replace the underscore with colon
			strippedID = strippedID.replace(/_/,':');
		}
		var xrefblob = getXrefObjByPrefix(idSpace.toLowerCase());
		if (xrefblob != null) {
			url = xrefblob.url_syntax;
			if (url != null) {
				url = url.replace(/\[example_id\]/,strippedID); 
			}
		}
    }
	/*if (id.match(/PMID/)) {
        url = "http://www.ncbi.nlm.nih.gov/pubmed/"+id.replace(/PMID:/,'');
    } else if (id.match(/OMIM/)) {
        url = "http://www.omim.org/entry/"+id.replace(/OMIM:/,'');
    } else if (id.match(/ISBN/)) {
        url = "http://www.lookupbyisbn.com/Search/Book/"+id.replace(/ISBN[\w-]*:/,'')+"/1";
    } 
    else if (id.match(/NCBIGene/)) {
        url = "http://www.ncbi.nlm.nih.gov/gene?term="+id.replace(/NCBIGene:/,'');
    } 
    else if (id.match(/Ensembl_gene/)) {
        url = "http://www.ensembl.org/Gene/Summary?g="+id.replace(/Ensembl_gene:/,'');
    } 
    else if (id.match(/KEGG:/)) {
        url = "http://www.genome.jp/kegg-bin/show_pathway?"+id.replace(/KEGG:/,'');
    } 
    else if (id.match(/MGI:/)) {
        url = "http://www.informatics.jax.org/marker/"+id;
    } */ 
    return url;
}

function genURL(type,obj,fmt) {
    var id = obj.id;
    var label = obj.label;
    if (id == null && label == null) {
        //HACK - backup case for when a plain id is given
        id = obj;
		label = id;
    }
    if (type == 'object') {
        // 'object' is a generic type that should be mapped to 
        // a more specific type, based on ID.
        // Note: currently incomplete
        if (/^(ORPHANET|OMIM|MIM)/.test(id)) {
            type = 'disease'
        }
        else if (/^(ORPHANET|OMIM|MIM)/.test(id)) {
            type = 'disease'
        }
        else if (/^(MP|HP|ZP)/.test(id)) {
            type = 'phenotype'
        }
        else {
            type = 'unknown';
            console.error("Could not map: "+id);
        }
    }
    if (type == 'source') {
		var xrefblob = getXrefObjByPrefix(label);
		var url = "";
		if (xrefblob != null) {
			url = xrefblob.generic_url;
		} else {
			//refer to the neurolex wiki, as before
			// E.g. neurolex.org/wiki/Nif-0000-21427
			if (id != null) {
				var toks = id.split("-");
				toks.pop();
				var id_trimmed = toks.join("-");
				url = "http://neurolex.org/wiki/"+id_trimmed;
			}
		}
		return url;
	}
	if (type == 'obopurl') {
		return "http://purl.obolibrary.org/obo/" + id
	}
    var url = '/'+type+'/'+id;
	
    if (fmt != null) {
        url = url + '.' + fmt;
    }
    return url;
}

function genTableOfClasses(type, id, objs) {
    return genTable(
        {
            columns: [
                {name: "class",
                 val: function(x){ return genObjectHref(type, x) }
                }
            ]
        },
        objs);
    
}


function genTableOfSearchResults(results) {
    return genTable(
        {
            columns: [
                {name: "category",
                 val: function(a){ return convChars(a.category) }
                },
                {name: "term",
                 val: function(a){ return genObjectHref(a.category, a) }
                }
//                {name: "info",
//                 val: function(a){ return convChars(a.definition) }
//                }
            ]
        },
        results);
}

function genTableOfSearchDataResults(results) {
    return genTable(
        {
            columns: [
                {name: "category",
                 val: function(a){ return convChars(a.category) }
                },
                {name: "match",
                 val: function(a){ return genObjectHref(a.category, a) }
                },
				{name: "taxon",
				val : function(a) {return genObjectHref('taxon',a.taxon) }
				}
            ]
        },
        results);
}



function genTableOfDataSources(sources) {
    return genTable(
        {
            columns: [
                {name: "Source",
                 val: function(a){ return genSourceHref('source', a.resource) }
                },
                {name: "Description",
                 val: function(a){ 
					var xrefblob = getXrefObjByPrefix(a.resource.toLowerCase());
					var name = "";
					if (xrefblob != null) {
						name = xrefblob.database;
						if (name == null || typeof name == 'undefined') {
							name = a.resource;
						}
					}
					return "<b>"+name+"</b><br />"+convChars(a.resource_description) }
                },
                {name: "How we use it",
                 val: function(a){ return convChars(a.monarch_use) }
                },
                {name: "Data categories",
                 val: function(a){ return convChars(a.data_categories) }
                },
                {name: "Ontologies/Vocabularies",
                 val: function(a){ return convChars(a.ontologies_or_vocabularies) }
                }
            ]
        },
        sources);
}

function genTableOfAnnotateTextResults(results, query, type) {
    return genTable(
        {
            columns: [
                {name: "span",
                 val: function(a){ return "[" + a.start + ", " + a.end + "]" }
                },
                {name: "text",
                 val: function(a){ return query.substring(a.start, a.end) }
                },
                {name: "category",
                 val: function(a){ return a.token.categories.length > 0 ? a.token.categories[0] : a.token.categories }
                },
                {name: "term",
                 val: function(a){ return genObjectHref(type == null ? a.token.categories[0] : type, a.token) + " (" + a.token.id + ")" }
                },
            ]
        },
        results);
}

function genTableOfAnalysisSearchResults(results, single_species) {
    if (single_species) {
        return genTable(
            {
                columns: [
                    {name: "hit",
                     val: function(a){ 
                         // TODO: refactor system such that type is always returned
                         // in search results. For now we make some basic assumptions
                         // about IDs in order to resolve
                         var type = 'gene';
                         if (/(OMIM|ORPHANET|DECIPHER|DOID)/.test(a.j.id)) {
                             type = 'disease';
                         }
                         return genObjectHref(type, a.j)
                     }
                    },
                    {name: "combined score",
                     val: function(a){ return convChars(a.combinedScore.toString()) }
                    },
                    //{name: "SimGIC",
                    //val: function(a){ return convChars(a.simGIC.toString()) }
                    //},
                    {name: "most informative shared phenotype",
                     val: function(a){ return genObjectHref('phenotype', a.maxIC_class) }
                    },
                    {name: "other matching phenotypes",
                     val: function(a){ return genObjectHrefs('phenotype', 
                                                             a.matches.map(function(m){return m.lcs}).filter( function(lcs) {return lcs.id != a.maxIC_class.id} ))
                                     }
                    }
                ]
            },
            results);
    } else {
        return genTable(
            {
                columns: [
                    {name: "species",
                     val: function(a){ return genExternalHref('source', mapIdentifierToTaxon(a.j.id)) }
                    },
                    {name: "hit",
                     val: function(a){ 
                         // TODO: refactor system such that type is always returned
                         // in search results. For now we make some basic assumptions
                         // about IDs in order to resolve
                         var type = 'gene';
                         if (/(OMIM|ORPHANET|DECIPHER|DOID)/.test(a.j.id)) {
                             type = 'disease';
                         }
                         return genObjectHref(type, a.j)
                     }
                    },
                    {name: "combined score",
                     val: function(a){ return convChars(a.combinedScore.toString()) }
                    },
                    //{name: "SimGIC",
                    //val: function(a){ return convChars(a.simGIC.toString()) }
                    //},
                    {name: "most informative shared phenotype",
                     val: function(a){ return genObjectHref('phenotype', a.maxIC_class) }
                    },
                    {name: "other matching phenotypes",
                     val: function(a){ return genObjectHrefs('phenotype', 
                                                             a.matches.map(function(m){return m.lcs}).filter( function(lcs) {return lcs.id != a.maxIC_class.id} ))
                                     }
                    }
                ]
            },
            results);
    }
}

function mapIdentifierToTaxon(id) {
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

function makeReferencesFromAssociations(a) {
    var references = 
            {name : "references",
             val: function (a) {
                      var refResult = "";
                      if (a.references != null) {
                          refResult += a.references.map(function(ref){return genExternalHref('source',ref)}).join(", ");
                      }
                      if (a.reference != null) {
                          refResult += genExternalHref('source',a.reference);
                      }
                      if (a.publications != null) {
                          refResult += a.publications.map(function(ref){return genExternalHref('source',ref)}).join(", ");
                      }
                      if (a.publication != null) {
                          refResult += genExternalHref('source',a.publication);
                      }
                      return refResult
                  } };
    return references;
}


// SPECIFIC
function genTableOfDiseasePhenotypeAssociations(assocs) {


    return genTable(
        {
            columns: [
                {name: "disease",
                 val: function(a){ return genObjectHref('disease', a.disease) }
                },
                {name: "phenotype",
                 val: function(a){ return genObjectHref('phenotype', a.phenotype) }
                },
                {name: "onset",
                 val: function(a){ return convChars(a.onset.label) } // TODO - should be an object
                },
                {name: "frequency",
                 val: function(a){ return convChars(a.frequency.toString()) }
                }, makeReferencesFromAssociations(assocs),
                {name: "source",
                 val: function(a){ return genSourceHref('source', a.source) } }
            ]
        },
        assocs);
}
/*
// This function is called to generate the phenotype table in gene pages.
function genTableOfGenePhenotypeAssociations(assocs) {
    var col;
    //This is a hack but it should work since all human phenotypes
    //  are inferred from a disease
    
    if (assocs[0].disease){
        col = [
               {name: "gene",
                val: function(a){ return genObjectHref('gene', a.gene) }
               },
               {name: "phenotype",
                val: function(a){ return genObjectHref('phenotype', a.phenotype) }
               },
               {name: "inferred from",
                val: function(a){ return genObjectHref('disease', a.disease)}
               },
               {name: "evidence",
                   val: function(a){ return genExternalHref('references', a.references)}
               },
               {name: "source",
                 val: function(a){ return genSourceHref('source', a.source) } 
               }
               ]
     } else {
       col = [
               {name: "gene",
                val: function(a){ return genObjectHref('gene', a.gene) }
               },
               {name: "phenotype",
                val: function(a){ return genObjectHref('phenotype', a.phenotype) }
               },
               {name: "evidence",
                   val: function(a){ return genExternalHref('references', a.references) }
               },
               {name: "source",
                val: function(a){ return genSourceHref('source', a.source) } 
               }
              ]
    } 

    return genTable(
        {
          columns: col
        },
        assocs);
}
*/

// This function is called to generate the gene table in phenotype pages.
// Currently, the gene table is only generated by finding the genes associated with
// diseases displaying the phenotype.
// Once genotypes (models) are incorporated into finding the genes associated, modify
// and un-comment the lines referring to genotype associations.
function genTableOfGenePhenotypeAssociations(assocs) {
    return genTable({
        columns: [
            {name: "gene",
			 val: function(a){ return genObjectHref('gene', a.gene); } 
            },
            {name: "phenotype",
             val: function(a){ return genObjectHref('phenotype', a.phenotype) }
            },
            {name: "inferred from",
            val: function(a){
					if (a.inferred_from != null && a.inferred_from !== 'undefined') {
						return genObjectHref(a.inferred_from.type, a.inferred_from);
					} else if (a.disease != null && typeof a.disease !== 'undefined') {
						return convChars('disease-phenotype association');
					//} else if (a.has_genotype != null && typeof a.has_genotype !== "undefined" && a.has_genotype.id != null && a.has_genotype.id !== 'undefined') {
					//return genObjectHref('genotype', a.has_genotype);
					} else '';
				}
            },
            {name: "associated with",
            val: function(a){ 
					if (a.disease != null && typeof a.disease !== 'undefined') {
						return genObjectHref('disease', a.disease);
					} else if (a.has_genotype != null &&  typeof a.has_genotype !== 'undefined' && a.has_genotype.id != null && a.has_genotype.id !== 'undefined') {
						return genObjectHref('genotype', a.has_genotype);
					} else '';
				}
            },
            {name: "evidence",
            val: function(a){ return genExternalHref('references', a.references)}
            },
            {name: "source",
            val: function(a){ return genSourceHref('source', a.source) } 
            }
        ]}, assocs);
}

function genTableOfGeneDiseaseAssociations(assocs) {
	
	var col;
    if (assocs[0].association_type){
    	col = [
              {name: "gene",
               val: function(a){ return genObjectHref('gene', a.gene) }
              },
              {name: "disease",
               val: function(a){ return genObjectHref('disease', a.disease) }
              },
              {name: "association type",
              	val: function(a){ return convChars(a.association_type)  }
              },
              {name: "species",
                val: function(a){ return convChars(a.model_species)  }
              },
              {name: "model gene",
            	val: function(a){ return genObjectHref('gene', a.model_gene) }
              },
              {name: "source",
               val: function(a){ return genSourceHref('source', a.source) }
              }
          ]	
    } else {
    
        col = [
              {name: "gene",
               val: function(a){ return genObjectHref('gene', a.gene) }
              },
              {name: "disease",
               val: function(a){ return genObjectHref('disease', a.disease) }
              },
               {name: "source",
               val: function(a){ return genSourceHref('source', a.source) }
              }
              ]
    }
    return genTable(
            {
              columns: col
            },
            assocs);
}

function genTableOfGeneXRefs(assocs) {
	console.log("GENEXREFS:"+JSON.stringify(assocs));
    return genTable({
        blob: assocs,
        columns: [
            {name: "source",
              val: function(a){ return genSourceHref('source', {id: a.source, label: a.source}) }
            },      
            {name: "IDs",
             val: function(a){ return  genExternalHref('gene', a.ids) }
            }
        ]
    },
    assocs);
}

function genTableOfGeneAlleleAssociations (assocs) {
    return genTable({
        blob: assocs,
        columns: [
            {name: "variant",
             val: function(a){ return genObjectHref('variant', a.variant) }
            },
			/*{name: "location",
			 val: function(a){ 
					if (a.variant.coordinates.genomic_location != '') {
						return convChars(a.variant.coordinates.genomic_location+" ("+a.variant.coordinates.build+")");
					} else {
						return '';
					}
				}
			},*/
            {name: "type",
             val: function(a){ return convChars(a.variant.variant_type.label) } 
            },
            {name: "pathogenicity",
                val: function(a){ return convChars(a.variant.pathogenicity) } 
            },
            {name: "evidence",
                val: function(a){ return genExternalHref('references', a.references) }
            },
            {name: "source",
             val: function(a){
					var sources = []; 
					if (a.source.map == null) {
						sources = [a.source];
					} else {
						sources = a.source; 
					}
					sources = sources.concat(a.variant.sources);
					return genSourceHref('source', sources);
				}
			}	
        ]
    },
    assocs);
}

function genTableOfGeneOrthologAssociations (assocs) {
    return genTable({
        blob: assocs,
        columns: [
            {name: "gene",
             val: function(a){ return genObjectHref('gene', a.gene) }
            },
            {name: "homolog",
             val: function(a){ return genObjectHref('gene', a.ortholog) }
            },
            {name: "organism",
            	val: function(a){ return convChars(a.organism)  }
            },
            {name: "homology class",
                val: function(a){ return convChars(a.orthology_class)  }
            },
            {name: "source",
             val: function(a){ return genSourceHref('source', a.source) }
            }
        ]
    },
    assocs);
}

function genTableOfGeneInteractionAssociations (assocs) {
    return genTable({
        blob: assocs,
        columns: [
            //{name: "gene A",
            // val: function(a){ return genObjectHref('gene', a.genea) }
            //},
            {name: "interaction type",
            	val: function(a){ return convChars(a.interaction_type.label)  }
            },
            {name: "gene B",
             val: function(a){ return genObjectHref('gene', a.geneb) }
            },
            {name: "gene B organism",
                val: function(a){ return convChars(a.geneb.taxon.label)  }
            },
            {name: "interaction detection method",
                val: function(a){ return convChars(a.interaction_detection)  }
            },
            {name: "evidence",
                val: function(a){ return genExternalHref('references', a.references) }
            },
            {name: "source",
             val: function(a){ return genSourceHref('source', a.sources) }
            }
        ]
    },
    assocs);
}

function genTableOfGeneGenotypeAssociations(assocs) {
    return genTable({
        blob: assocs,
        columns: [
            {name: "genotype",
             val: function(a){ return genObjectHref('genotype', a.genotype) }
            },
            {name: "background",
            	val: function(a){ return convChars(a.background)  }
            },
//            {name: "genes",
//            	val: function(a){ return convChars(a.genes)  }
//            },
//            {name: "evidence",
//                val: function(a){ return genExternalHref('references', a.references) }
//            },
            {name: "source",
             val: function(a){ return genSourceHref('source', a.source) }
            }
        ]
    },
    assocs);
}

function genListOfExternalIdentifierLinks(obj) {
    if (obj.map != null) {
	    return obj.map(function(o){return genExternalHref('source',o)}).join(", ")
	} else {
		return genExternalHref('source',obj); 
	}
}

function genTableOfDiseaseGeneAssociations(assocs) {
    return genTable({
        blob: assocs,
        columns: [
            {name: "disease",
             val: function(a){ return genObjectHref('disease', a.disease) }
            },
            //{name: "inheritance",
            // val: function(a){ return convChars(a.inheritance) } // TODO - should be an object
            //},
            {name: "gene",
             val: function(a){ return genObjectHref('gene', a.gene) }
            },
            //makeReferencesFromAssociations(assocs),
            {name: "source",
             //val: function(a){ return sourceImage(a.source) }
             val: function(a){ return genSourceHref('source', a.source) }
            }
        ]
    },
                    assocs);
}
function genTableOfDiseaseAlleleAssociations(assocs) {
    return genTable(
        {
            columns: [
                {name: "disease",
                 val: function(a){ return genObjectHref('disease', a.phenotype) }
                },
                {name: "variant",
                 //val: function(a){ return convChars(a.allele.label) }
                 val: function(a){ return genObjectHref('variant', a.variant) }
                },/*
				{name: "location",
				 val: function(a){ 
						if (a.variant.coordinates.genomic_location != '') {
							return convChars(a.variant.coordinates.genomic_location+" ("+a.variant.coordinates.build+")") 
						} else {
							return '';
						}
					  }
				 },*/
                {name: "band",
                 val: function(a){ return convChars(a.variant.coordinates.band) }
                 },
				{name: "type",
				 val: function(a){ return convChars(a.variant.variant_type.label) }
				},
				{name: "pathogenicity",
                 val: function(a){ return convChars(a.variant.pathogenicity) }
				},
				{name: "evidence",
                 val: function(a){ return genExternalHref('references', a.references) }
				},
				{name: "source",
				 val: function(a){
                    var sources = [];
                    if (a.source.map == null) {
                        sources = [a.source];
                    } else {
                        sources = a.source;
                    }
                    sources = sources.concat(a.variant.sources);
                    return genSourceHref('source', sources);
					}
				}
            ]
        },
        assocs);
}



/*
function genTableOfDiseaseAlleleAssociations(assocs) {
    return genTable(
        {
            columns: [
                {name: "disease",
                 val: function(a){ return genObjectHref('disease', a.disease) }
                },
                {name: "mutation",
                 val: function(a){ return convChars(a.allele.mutation) }
                },
                {name: "allele",
                 val: function(a){ return genObjectHref('allele', a.allele) }
                },
                {name: "source",
                 val: function(a){ return convChars(a.source) }
                }
            ]
        },
        assocs);
}
*/

function genTableOfGenotypePhenotypeAssociations(assocs) {
    return genTable(
        {
            columns: [
                {name: "association type",
                 val: function(a) { return convChars("direct") }
                },
                {name: "species",
                 val: function(a) { return genExternalHref('source', a.has_genotype.taxon) }
                },
                {name: "genotype",
                 val: function(a){ return genObjectHref('genotype', a.has_genotype) }
                },
                {name: "phenotype",
                 val: function(a){ return genObjectHref('phenotype', a.has_phenotype.type) }
                },
				{name: "qualifier",
				 val: function(a){ if (typeof a.has_phenotype.modifier == 'undefined') {return ''} else {return a.has_phenotype.modifier} } 
				},
                {name: "phenotype description",
                 val: function(a){ return convChars(a.has_phenotype.description) }
                },
                {name: "reference",
                 val: function(a){ return genObjectHref('reference', a.references) }
                },
                {name: "source",
                 val: function(a){ return genSourceHref('source', a.source) }
                }
            ]
        },
        assocs);
}

function genTableOfDiseaseModelAssociations(assocs) {
    return genTable(
        {
            columns: [
                {name: "association type",
                 val: function(a){ return convChars(a.type.label) } // TODO - make this an object
                },
                {name: "species",
                 val: function(a){ return genExternalHref('source', a.model.taxon) }
                },
                {name: "genotype",
                 val: function(a){ return genObjectHref('model', a.model) }
                },
                {name: "model type",
                 //val: function(a){ return convChars(a.model.type.label +" (" + a.model.type.parent + ")") }
				 val: function(a) { return convChars(a.model.type.label) }
                },
				{name: "description",
				 val: function(a){ return convChars(a.model.description) }
				},
                {name: "source",
                 val: function(a){ return genSourceHref('source', a.source) }
                }
            ]
        },
        assocs);
}

function genTableOfGeneExpressionAssocations(assocs) {
    return genTable(
        {
            columns: [
                {name: "location",
                 val: function(a){ return genObjectHref('anatomy', a.location) }
                },
                {name: "gene",
                 val: function(a){ return genObjectHref('gene', a.gene) }
                },
                {name: "source",
                 val: function(a){ return convChars(a.source) }
                }
            ]
        },
        assocs);
}

function genTableOfSimilarModels(assocs) {

    var myTable = "";

    var unnestedAssocs = [];

    for (var i= 0; i< assocs.length; i++) {
        var iset = assocs[i];
        for (var j=0; j<iset.b.length; j++) {
            unnestedAssocs = unnestedAssocs.concat({a:iset.a,b:iset.b[j]});
        };
    };
    return genTable(
        {   
            columns: [
                {name: "disease",
                 val: function(a){ return genObjectHref('disease', a.a) }
                },  
                {name: "model", 
                 val: function(a){ return genObjectHref('genotype', a.b) }
                }, 
///                {name: "metric",
///                 val: function(a){ return convChars(a.b.score.metric.toString()) }
///                },
                {name: "phenotype similarity score",
                 val: function(a){ return convChars(Math.floor(a.b.score.score * 10) + "") }
                },
                {name: "rank",
                 val: function(a){ return convChars(a.b.score.rank.toString()) }
                }
            ]   
        },       
        unnestedAssocs);
}



function genTableOfSimilarDiseases(assocs) {
    //unpack the assocs into a flat list

    var myTable = ""; 

    var unnestedAssocs = [];

    for (var i= 0; i< assocs.length; i++) {
        var iset = assocs[i];
        for (var j=0; j<iset.b.length; j++) {
            unnestedAssocs = unnestedAssocs.concat({a:iset.a,b:iset.b[j]});
        };
    };

    return genTable(
        {
            columns: [
                {name: "similar diseases",
                 val: function(a){ return genObjectHref('disease', a.b) }
                },
///                {name: "metric",
///                 val: function(a){ return convChars(a.b.score.metric.toString()) }
///                },
                {name: "phenotype similarity score",
                 val: function(a){ return convChars(Math.floor(a.b.score.score * 10) + "") }
                },
                {name: "rank",
                 val: function(a){ return convChars(a.b.score.rank.toString()) }
                }
            ]
        },
        unnestedAssocs);
}


//the label here is a fall-back for the disease label
function genTableOfDiseasePathwayAssociations(assocs) {
    return genTable(
        {
            columns: [
                {name: "disease",
                 val: function(a){ return genObjectHref('disease', a.disease) }
                },
				//TODO: add link for viewing pathway diagram here
                {name: "pathway",
                    val: function(a){ return genKeggeratorAction(a.pathway, a.references) }
                },
//                {name: "pathway",
//                 val: function(a){ return genExternalHref('source',a.pathway) }
//                },
                {name: "relationship",
                 val : function(a) {return a.type}
                },
                {name: "evidence",
                 val: function(a){ return genExternalHref('source', a.references) }
                },
                {name: "source",
                 val: function(a){ return genSourceHref('source', a.source) }                }
            ]
        },
        assocs);
}

// This functions generates the table of similar papers in the literature pages.
function genTableOfSimilarPapers(assocs) {
    for (var i = 0; i < assocs.length; i += 1) {
        var paper = assocs[i];
        var auths = paper.authors.slice(0, 3).join(", ");
        if (paper.authors.length > 3) {
            auths += ", <span class=\"littabmoreauthors\"><span class=\"etal\">et al</span><span class=\"moreauthors\">"
            auths += paper.authors.slice(3).join(", ") + ", " + "</span><span class=\"hideauthors\">hide</span></span>";
        }
        paper.authors = auths;
        var link = "<a href=\"http://www.ncbi.nlm.nih.gov/pubmed/" + paper.pmid + "\">";
        paper.title = link + paper.title + "</a>";
    }
    function sortByRecentYear(a, b) {
        if (a.year < b.year) {
            return 1;
        } else if (a.year > b.year) {
            return -1;
        }
        return 0;
    }
    assocs.sort(sortByRecentYear);

    return genTable(
        {
            columns: [
                {name: "title",
                    val: function(a) { return a.title }
                },
                {name: "year",
                    val: function(a) { return a.year }
                },
                {name: "authors",
                    val: function(a) { return a.authors }
                },
                {name: "journal",
                    val: function(a) { return a.journalShort }
                },
            ]
        },
        assocs);
}

// This functions generates the table of similar papers in the literature pages.
function genTableOfLiteratureGenes(assocs) {
    return genTable(
        {
            columns: [
                {name: "species",
                    val: function(a) { return genExternalHref('source', a.taxon) }
                },
                {name: "gene",
                    val: function(a) { return genObjectHref('gene', a.gene) }
                },
            ]
        },
        assocs);
}

// This function generates the table in the literature tab.
function genTableOfLiterature(assocs, pmidinfo) {
    var noinfo = [];
    for (var i = 0; i < assocs.length; i += 1) {
        var citation = assocs[i];
        for (var j = 0; j < pmidinfo.length; j += 1) {
            if (pmidinfo[j].pmid == citation.pub) {
                var info = pmidinfo[j];
                var auths = info.authors.slice(0, 3).join(", ");
                if (info.authors.length > 3) {
                    auths += ", <span class=\"littabmoreauthors\"><span class=\"etal\">et al</span><span class=\"moreauthors\">"
                    auths += info.authors.slice(3).join(", ") + ", " + "</span><span class=\"hideauthors\">hide</span></span>";
                }
                citation.authors = auths;
                citation.journal = info.journalShort;
                citation.year = info.year;
                var link = "<a href=\"http://www.ncbi.nlm.nih.gov/pubmed/" + citation.pub + "\">";
                citation.title = link + info.title + "</a>";
                break;
            }
            if (j == pmidinfo.length - 1) {
                noinfo.push(i);
            }
        }
    }
    // The LiteratureService sometimes does not provide information for PMID queries,
    // even though the publication does exist.
    // These lines account for this bug and thus do not show these publications on the
    // page. These lines also allow sorting to happen (without raising the "Comparison
    // method violates its general contract" error due to sorting with undefined items).
    for (var i = noinfo.length - 1; i > -1; i -= 1) {
        assocs.splice(noinfo[i], 1);
    }
    function sortByRecentYear(a, b) {
        if (a.year < b.year) {
            return 1;
        } else if (a.year > b.year) {
            return -1;
        }
        return 0;
    }
    assocs.sort(sortByRecentYear);
    return genTable(
        {
            columns: [
                {name: "year",
                    val: function(a) {return a.year}
                },
                {name: "authors",
                    val: function(a) {return a.authors}
                },
                {name: "title",
                    val: function(a) {return a.title}
                },
                {name: "journal",
                    val: function(a) {return a.journal}
                },
                {name: "data type",
                    val: function(a) {return a.type}
                },
                {name: "associated with",
                    val: function(a) {return genObjectHref(a.type, a.obj)}
                },
                {name: "source",
                    val: function(a) {return genSourceHref('source', a.source)}
                },
            ]
        },
        assocs);
}


function genKeggeratorAction(pathway, references) {

    var label = pathway.label;
    // escape the label here
    if (label == null || label=="") {
        label = pathway.id;
    }
    else {
        label = convChars(label);
    }

    // check if this is a kegg id
    var url = genKEGGShowPathwayLink(pathway, references, label);

    // alternative link if not a kegg id


    return url;

}

//function getTableOfPathways(pathways) {
//    // TODO: currently url hyperlinks are hardcoded to Kegg.  if nif provides urls will use them instead
//    console.log("No. Pathways for rendering to table =" + pathways.length);
//    console.log(JSON.stringify(pathways));
//
//	//want to unfold the disease-pathway associations, so there is one row per disease-pathway
//
//    return genTable(
//        {
//            columns: [
//                {name: "disease",
//                 val: function (a) {
//					//HARDCODE - kegg ids are strange, they have colons, convert to underscores
//					a.id = "KEGG:"+a.id.replace(/:/,"_");
//					return genObjectHref('disease',a);
//                    //return '<a href=\'http://www.genome.jp/dbget-bin/www_bget?' + a.id.substring(3, 9) + '\'>' + convChars(a.label) + '</a>';
//                    }
//                },
//
//                {name: "pathways",
//				val: function (a) {
//					console.log("A: "+JSON.stringify(a,null,' '));
//					var pathLinks = [];
//					var label = a.label || a.id;
//					var gene_ko_ids = [].concat.apply([],a.genes.map(function(g) {
//						return g.ko_ids }));
//					if (a.pathways != null && a.source != null && a.source.label == 'KEGG') {
//						for (var i=0; i<a.pathways.length; i++) {
//							var pathway = a.pathways[i];
//							var link = genKEGGShowPathwayLink(pathway,label,gene_ko_ids);
//							console.log("LINK:"+link);
//							if (link != null && link != "") {
//								pathLinks.push(link);
//							}
//							// use this one if don't want to use keggerator :(
//							//return (genKEGGPathwayThumbnailLink(pathway,a.label,a.gene_ko_ids));
//						}
//					}
//					return pathLinks.join(", ");
//                  }
//                },
//				//TODO reuse makeReferencesFromAssociations
//				{name: "references",
//				 val: function(a) {return genExternalHref('source',a.references)}
//				 //val: function(a) {return a.references.map(
//				//		function(i) {return genListOfExternalIdentifierLinks({id:i})}).join(", ")}
//				},
//                {name: "source",
//                     val: function(a){ return genSourceHref('source', a.source) }
//                }
//
//            ]
//        },
//        pathways);
//}

// use this one as alternative to keggerator
//function genKEGGPathwayThumbnailLink(pathway,label,gene_ko_ids) {
//    var id = pathway.id.replace(/path:/,"");
//	var link = '<span class=\'dropt\'><a href=\'http://www.genome.jp/kegg-bin/show_pathway?' +
//		id + '\' onmouseover=\'\'>'+pathway.label+'</a>' +
//		'<span><img height=320 src=\'http://rest.kegg.jp/get/' +
//		id + '/image\'/><br/>' +'</span>' +'</span><br/>' ;
//	return link;
//}


function genKEGGShowPathwayLink(pathway,references, label) {



	// we need to use hsa pathways because we are using ncbi genes
    var hsaPathId = pathway.id.replace(/KEGG:path:map/,"hsa");

	var gene_string = references[0].id.replace(/NCBIGene/,"hsa");

	var keggeratorAnnotation = 
		"{ " + "pathways: ['" + hsaPathId + "'], " +
		"phenotypes: [ " +
		    "{ " +
                "name: '" + label + "', " +
		        "genes: ['" + gene_string + "']" +
            "}" +
		"]" +
		"}}" ;

    var link =
        "<a href='#' onClick=\"$('#keggerator_div').keggerator({ annotations: " +
            keggeratorAnnotation +
            ") \" >" + pathway.label + "</a>";

    return link;
}


function genTableOfGenePathwayAssociations(assocs) {
    return genTable(
        {
            columns: [
                //TODO: add link for viewing pathway diagram here
                {name: "pathway",
                 val: function(a){ return genExternalHref('source',a.pathway) }
                },
                {name: "relationship",
                 val : function(a) {return a.type}
                },
                {name: "evidence",
                 val: function(a){ return genExternalHref('source', a.references) }
                },
                {name: "source",
                 val: function(a){ return genSourceHref('source', a.source) }                }
            ]
        },
        assocs);
}

/** Replaces a string SOURCE with an image tag with the source's logo. */
function sourceImage(source) {
    var image = source;
    if (source == null || source == "") {
        return source;
    } else if (source.match(/Biogrid/i)) {
        image = '<img class="source" src="../image/source-biogrid.ico"/>';
    } else if (source.match(/ClinVar/)) {
        image = '<img class="source" src="../image/source-clinvar.png"/>';
    } else if (source.match(/Coriell/)) {
        image = '<img class="source" src="../image/source-coriell.png"/>';
    } else if (source.match(/CTD/)) {
        image = '<img class="source" src="../image/source-ctd.png"/>';
    } else if (source.match(/DECIPHER/i)) {
        image = '<img class="source" src="../image/source-decipher.png"/>';
    } else if (source.match(/Ensembl/)) {
        image = '<img class="source" src="../image/source-ensembl.png"/>';
    } else if (source.match(/FB|FlyBase/i)) {
        image = '<img class="source" src="../image/source-flybase.png"/>';
    } else if (source.match(/GeneReviews/i)) {
        image = '<img class="source" src="../image/source-genereviews.png"/>';
    } else if (source.match(/HGNC/)) {
        image = '<img class="source" src="../image/source-hgnc.ico"/>';
    } else if (source.match(/HPO/)) {
        image = '<img class="source" src="../image/source-hpo.png"/>';
    } else if (source.match(/IMPC/)){
        image = '<img class="source" src="../image/source-impc.png"/>';
    } else if (source.match(/KEGG/)){
        image = '<img class="source" src="../image/source-kegg.png"/>';
    } else if (source.match(/MGI/)) {
        image = '<img class="source" src="../image/source-mgi.png"/>';
    } else if (source.match(/MPD/)) {
        image = '<img class="source" src="../image/source-mpd.jpg"/>';
    } else if (source.match(/mygene/i)) {
        image = '<img class="source" src="../image/source-mygene.png"/>';
//    } else if (source.match(/OMIA/)) {
//        image = '<img class="source" src="../image/source-omia.png"/>';
    } else if (source.match(/O?MIM/)) {
        image = '<img class="source" src="../image/source-omim.png"/>';
    } else if (source.match(/ORPHANET/i)) {
        image = '<img class="source" src="../image/source-orphanet.png"/>';
    } else if (source.match(/PANTHER/i)) {
        image = '<img class="source" src="../image/source-panther.jpg"/>';
    } else if (source.match(/PharmGKB/i)) {
        image = '<img class="source" src="../image/source-pharmgkb.png"/>';
    } else if (source.match(/PubMed|NCBI|PMID|Entrez/i)) {
        image = '<img class="source" src="../image/source-ncbi.png"/>';
    } else if (source.match(/Uniprot/)) {
        image = '<img class="source" src="../image/source-uniprot.ico"/>';
    } else if (source.match(/Vega/i)) {
        image = '<img class="source" src="../image/source-vega.png"/>';
    } else if (source.match(/WB|WormBase/i)) {
        image = '<img class="source" src="../image/source-wormbase.png"/>';
    } else if (source.match(/ZFIN/)) {
        image = '<img class="source" src="../image/source-zfin.png"/>';
    }
    return image;
}

function searchBar() {
    // TODO
}

function genPhenoGraph(dataGraph) {
	 var content = '<script type="text/javascript">'+
	               'jQuery(document).ready(function(){' +
	               'var data=' + JSON.stringify(dataGraph) +';'+
	               'datagraph.init(".graph-container",data);' +
	               '});' +
	               '</script>';

	 return content;
}
