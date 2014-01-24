var {convChars}  =  require("./utils");

// GENERIC
function genTable(spec, rows) {
    var content = "";

    content + "<table>\n"; // todo - use bbop
    if (rows != null) {
        for (var i= -1; i<rows.length; i++) {
            content += "  <tr>\n";            
            for (var j=0; j< spec.columns.length; j++) {
                var colspec = spec.columns[j];
                if (i<0) {
                    content += "<th>"+colspec.name+"</th>";                    
                }
                else {
                    content += "<td>"+colspec.val(rows[i])+"</td>";                    
                }
            }
            content += "\n  </tr>\n";            
        }
    }
    content + "</table>\n";
    return content;
}

// type: object type/category
// obj: either { id : id, label : label} or a list of these
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

    var url = genURL(type, obj.id, fmt);
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
    return objs.map(function(obj){return genObjectHref(type,obj,fmt)}).join(" ");
}

function genURL(type,id,fmt) {
    if (type == 'source') {
        // E.g. neurolex.org/wiki/Nif-0000-21427
        var toks = id.split("-");
        toks.pop();
        var id_trimmed = toks.join("-");
        return "http://neurolex.org/wiki/" + id_trimmed;
    }
    var url = '/'+type+'/'+id;
    if (fmt != null) {
        url = url + '.' + fmt;
    }
    return url;
}

function genOntologyGraphInfo(type, id, relationships) {
    console.log("ARELS="+relationships+" "+relationships.length);
    // TODO - anchor using id
    return genTable(
        {
            columns: [
                {name: "subject",
                 val: function(a){ return genObjectHref(type, a.subject) }
                },
                {name: "relationship",
                 val: function(a){ return genObjectHref(type, a.property) }
                },
                {name: "target",
                 val: function(a){ return genObjectHref(type, a.object) }
                },
                {name: "source",
                 val: function(a){ return '<a href="https://support.crbs.ucsd.edu/browse/LAMHDI-220">TODO</a>' }
                }
            ]
        },
        relationships);
    
}

function genTableOfSearchResults(results) {
    console.log("#Results="+results.length);
    return genTable(
        {
            columns: [
                {name: "Category",
                 val: function(a){ return convChars(a.category) }
                },
                {name: "Term",
                 val: function(a){ return genObjectHref(a.category, a) }
                },
                {name: "info",
                 val: function(a){ return convChars(a.comments) }
                },
            ]
        },
        results);
}

function genTableOfAnalysisSearchResults(results) {
    console.log("#Results="+results.length);
    return genTable(
        {
            columns: [
                {name: "Hit",
                 val: function(a){ return genObjectHref('gene', a.j) }
                },
                {name: "combined score",
                 val: function(a){ return convChars(a.combinedScore.toString()) }
                },
                {name: "SimGIC",
                 val: function(a){ return convChars(a.simGIC.toString()) }
                },
                {name: "Informative Phenotype",
                 val: function(a){ return genObjectHref('phenotype', a.maxIC_class) }
                },
                {name: "Matches",
                 val: function(a){ return genObjectHrefs('phenotype', a.matches) }
                },
            ]
        },
        results);
}


// SPECIFIC
function genTableOfDiseasePhenotypeAssociations(assocs) {
    console.log("#DPAs="+assocs.length);
    return genTable(
        {
            columns: [
                {name: "disease",
                 val: function(a){ return genObjectHref('disease', a.disease) }
                },
                {name: "onset",
                 val: function(a){ return convChars(a.onset) } // TODO - should be an object
                },
                {name: "frequency",
                 val: function(a){ return convChars(a.frequency.toString()) }
                },
                {name: "phenotype",
                 val: function(a){ return genObjectHref('phenotype', a.phenotype) }
                },
                {name: "source",
                 val: function(a){ return convChars(a.source) }
                }
            ]
        },
        assocs);
}

function genTableOfDiseaseGeneAssociations(assocs) {
    return genTable({
        blob: assocs,
        columns: [
            {name: "disease",
             val: function(a){ return genObjectHref('disease', a.disease) }
            },
            {name: "inheritance",
             val: function(a){ return convChars(a.inheritance) } // TODO - should be an object
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
function genTableOfDiseaseAlleleAssociations(assocs) {
    return genTable(
        {
            columns: [
                {name: "disease",
                 val: function(a){ return genObjectHref('disease', a.disease) }
                },
                {name: "mutation",
                 val: function(a){ return convChars(a.sequence_alteration.has_mutation) }
                },
                {name: "allele",
                 val: function(a){ return genObjectHref('allele', a.allele) }
                },
                {name: "source",
                 val: function(a){ return genObjectHref('source', a.source) }
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
                {name: "genotype",
                 val: function(a){ return genObjectHref('genotype', a.has_genotype) }
                },
                {name: "background",
                 val: function(a){ return genObjectHref('genotype', a.has_genotype.has_background) }
                },
                {name: "environment",
                 val: function(a){  return genObjectHref('genotype', a.has_environment) }
                },
                {name: "phenotype",
                 val: function(a){ return genObjectHref('phenotype', a.has_phenotype.type) }
                },
                {name: "phenotype description",
                 val: function(a){ return convChars(a.has_phenotype.description) }
                },
                {name: "affects",
                 val: function(a){ 
                     var html = "";
                     if (a.has_phenotype.inheres_in != null) {
                         html = genObjectHref('phenotype', a.has_phenotype.inheres_in.type);
                         if (a.has_phenotype.inheres_in.part_of != null) {
                             html = html + " of " + genObjectHref('phenotype', a.has_phenotype.inheres_in.part_of.type);
                         }
                     }
                     return html;
                 }
                },
                {name: "timing",
                 val: function(a){ 
                     if (a.has_phenotype.start_stage != null) {
                         if (a.has_phenotype.start_stage.id == a.has_phenotype.end_stage.id) {
                             return genObjectHref('phenotype', a.has_phenotype.start_stage.type);
                         }
                         else {
                             return genObjectHref('phenotype', a.has_phenotype.start_stage.type) + " " + genObjectHref('stage', a.has_phenotype.end_stage.type);
                         }
                     } 
                     else {
                         return "";
                     }
                 }
                },
                //{name: "evidence",
                // val: function(a){ return genObjectHref('evidence', a.evidence.type) }
                //},
                {name: "reference",
                 val: function(a){ return genObjectHref('reference', a.reference) }
                },
                {name: "source",
                 val: function(a){ return genObjectHref('source', a.source) }
                }
            ]
        },
        assocs);
}

function genTableOfDiseaseModelAssociations(assocs) {
    return genTable(
        {
            columns: [
                {name: "disease",
                 val: function(a){ return genObjectHref('disease', a.disease) }
                },
                {name: "association type",
                 val: function(a){ return convChars(a.type.label) } // TODO - make this an object
                },
                {name: "model",
                 val: function(a){ return genObjectHref('model', a.model) }
                },
                {name: "model species",
                 val: function(a){ return convChars(a.model.taxon.label) }
                },
                {name: "model type",
                 val: function(a){ return convChars(a.model.type.label +" (" + a.model.type.parent + ")") }
                },
                {name: "source",
                 val: function(a){ return convChars(a.source) }
                }
            ]
        },
        assocs) + "<div id='phen_vis'></div>"
        + "<script src=\"../js/modeltype.js\"></script> "
        + "<script>"
        + " $(function () { "
        + "   var disease_id = this.location.pathname;"
        + "   var slash_idx = disease_id.indexOf('/');" 
        + "   disease_id = disease_id.substring(slash_idx+1);"
        + "   var phenotype_list = []; "
        + "	  jQuery.ajax({ "
		+ "	url : '/' + disease_id + '/phenotype_associations.json', "
		+ "	async : false, "
		+"	dataType : 'json', "
		+ "	success : function(data) { "
		+ " for (var idx=0;idx<data.phenotype_associations.length;idx++) { "
		+ "   phenotype_list.push({ \"id\" : data.phenotype_associations[idx].phenotype.id, "
		+ "         \"observed\" : \"positive\"}); "
		+ "  }"
        + " } "
        	+ "});"
        + " modeltype.initPhenotype($(\"#phen_vis\"), phenotype_list); "
    	+ "});"        
        + "</script> ";
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
	console.log("#Sim Models:"+unnestedAssocs.length);
    return genTable(
        {   
            columns: [
                {name: "disease",
                 val: function(a){ return genObjectHref('disease', a.a) }
                },  
                {name: "model", 
                 val: function(a){ return genObjectHref('genotype', a.b) }
                }, 
                {name: "metric",
                 val: function(a){ return convChars(a.b.score.metric.toString()) }
                },
                {name: "score",
                 val: function(a){ return convChars(a.b.score.score.toString()) }
                },
                {name: "rank",
                 val: function(a){ return convChars(a.b.score.rank.toString()) }
                },
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
	console.log("#Sim Diseases:"+unnestedAssocs.length);

    return genTable(
        {
            columns: [
                {name: "disease A",
                 val: function(a){ return genObjectHref('disease', a.a) }
                },
                {name: "disease B",
                 val: function(a){ return genObjectHref('disease', a.b) }
                },
                {name: "metric",
                 val: function(a){ return convChars(a.b.score.metric.toString()) }
                },
                {name: "score",
                 val: function(a){ return convChars(a.b.score.score.toString()) }
                },
				{name: "rank",
				 val: function(a){ return convChars(a.b.score.rank.toString()) }
                },
            ]
        },
        unnestedAssocs);
}

function genTableOfSimilarDiseasesOrig(assocs) {
    console.log("#Sims="+assocs.length);
    return genTable(
        {
            columns: [
                {name: "disease A",
                 val: function(a){ return genObjectHref('disease', a.a) }
                },
                {name: "disease B",
                 val: function(a){ return genObjectHref('disease', a.b) }
                },
                {name: "metric",
                 val: function(a){ return convChars(a.metric.toString()) }
                },
                {name: "score",
                 val: function(a){ return convChars(a.score.toString()) }
                },
                {name: "values",
                 // TODO - special behavior for LCS
                 val: function(a){ return convChars(a.values) }
                },
            ]
        },
        assocs);
}


function getTableOfPathways(pathways) {
    // TODO: currently url hyperlinks are hardcoded to Kegg.  if nif provides urls will use them instead
    console.log("No. Pathways for rendering to table =" + pathways.length);
    console.log(JSON.stringify(pathways));


    return genTable(
        {
            columns: [
                {name: "pathways",
                    val: function (a) {
                        var pathResult = "";
                        if (a.pathways != null) {
                            for (var i = 0; i < a.pathways.length; i++) {
                                a.pathways[i].forEach(function (pathId) {
                                    pathResult = pathResult +
                                        '<span class=\'dropt\'><a href=\'http://www.genome.jp/kegg-bin/show_pathway?' + pathId.substring(5, 13) + '\' onmouseover=\'\'>Kegg</a>' +
                                        '<span><img height=320 src=\'http://rest.kegg.jp/get/' + pathId.substring(5, 13) + '/image\'/><br/>' +
                                        '</span>' +
                                        '</span><br/>'
                                })
                            }
                        }
                        return pathResult
                    }
                },
                {name: "disease",
                    val: function (a) {
                        return '<a href=\'http://www.genome.jp/dbget-bin/www_bget?' + a.id.substring(3, 9) + '\'>' + convChars(a.label) + '</a>';
                    }
                },
                {name: "references",
                    val: function (a) {
                        var refResult = "";
                        if (a.references != null) {
                            for (var i = 0; i < a.references.length; i++) {
                                a.references[i].forEach(
                                    function (ref) {
                                        if (ref.substring(0, 5) == 'PMID:') {
                                            refResult = refResult + '<a href=\'http://www.ncbi.nlm.nih.gov/pubmed/' + ref.substring(5, 13) + '\'>PubMed</a></br>'
                                        }
                                    }
                                )
                            }
                        }
                        return refResult
                    }
                }
            ]
        },
        pathways);

}

function searchBar() {
    // TODO
}

