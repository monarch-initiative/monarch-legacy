var {convChars}  =  require("./utils");

// GENERIC
function genTable(spec, rows) {
    var content = "";
    content += "<table class='table table-striped table-condensed simpletable'>\n";
    if (rows != null) {
        content += "<thead>\n<tr>\n";
        for (var j = 0; j < spec.columns.length; j++) {
            var datatype = spec.columns[j].name;
            content += "<th data-sort='" + datatype + "'>" + datatype + "</th>\n";
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
    label = sourceImage(label);
    return '<a href="'+url+'" title="'+obj.label+'">'+label+'</a>';
}

function genExternalHref(type,obj,fmt) {
    if (obj == null) {
        return "";
    }
    if (obj.type != null && obj.type.id != null) {
        return genObjectHref(type, obj.type, fmt);
    }
    if (obj.map != null) {
        return obj.map(function(x){return genObjectHref(type,x,fmt)}).join(" ");
    }

    var label = obj.label;

    // must escape label here. How do to this in JAvascript.
    if (label == null || label=="") {
        label = obj.id;
    }
    else {
        label = convChars(label);
    }
    var url = makeExternalURL(obj.id);
    //label = sourceImage(label);
    if (url.match(/http/)) {
        return '<a href="'+url+'">'+label+'</a>';
    } else {
        return label;
    }
}

//TODO: make these from external config file
function makeExternalURL(id) {
    var url = id;
    if (id.match(/PMID/)) {
        url = "http://www.ncbi.nlm.nih.gov/pubmed/"+id.replace(/PMID:/,'');
    } else if (id.match(/OMIM/)) {
        url = "http://www.omim.org/entry/"+id.replace(/OMIM:/,'');
    } else if (id.match(/ISBN/)) {
        url = "http://www.lookupbyisbn.com/Search/Book/"+id.replace(/ISBN[\w-]*:/,'')+"/1";
    } 
    else if (id.match(/NCBI_gene/)) {
        url = "http://www.ncbi.nlm.nih.gov/gene?term="+id.replace(/NCBI_gene:/,'');
    } 
    else if (id.match(/Ensembl_gene/)) {
        url = "http://www.ensembl.org/Gene/Summary?g="+id.replace(/Ensembl_gene:/,'');
    } 
    else if (id.match(/KEGG:/)) {
        url = "http://www.genome.jp/kegg-bin/show_pathway?"+id.replace(/KEGG:/,'');
    } 
    else if (id.match(/MGI:/)) {
        url = "http://www.informatics.jax.org/marker/"+id;
    } 
    return url;
}

function genURL(type,id,fmt) {
    if (type == 'source') {
        // E.g. neurolex.org/wiki/Nif-0000-21427
        var toks = id.split("-");
        toks.pop();
        var id_trimmed = toks.join("-");
        return "http://neurolex.org/wiki/" + id_trimmed;
    }
    if (type == 'obopurl') {
        return "http://purl.obolibrary.org/obo/" + id;
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
    console.log("#Results="+results.length);
    return genTable(
        {
            columns: [
                {name: "category",
                 val: function(a){ return convChars(a.category) }
                },
                {name: "term",
                 val: function(a){ return genObjectHref(a.category, a) }
                },
                {name: "info",
                 val: function(a){ return convChars(a.comments) }
                }
            ]
        },
        results);
}

function genTableOfAnnotateTextResults(results, type) {
    console.log("#Results="+results.length);
    return genTable(
        {
            columns: [
                {name: "span",
                 val: function(a){ return a.start + ".." + a.end }
                },
                {name: "category",
                 val: function(a){ return a.entity.category }
                },
                {name: "term",
                 val: function(a){ return genObjectHref(type == null ? a.entity.category : type, a.entity) + " (" + a.entity.id + ")" }
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
                {name: "Combined score",
                 val: function(a){ return convChars(a.combinedScore.toString()) }
                },
                //{name: "SimGIC",
                //val: function(a){ return convChars(a.simGIC.toString()) }
                //},
                {name: "Most Informative Shared Phenotype",
                 val: function(a){ return genObjectHref('phenotype', a.maxIC_class) }
                },
                {name: "Other Matching Phenotypes",
                 val: function(a){ return genObjectHrefs('phenotype', 
                                                         a.matches.map(function(m){return m.lcs}).filter( function(lcs) {return lcs.id != a.maxIC_class.id} ))
                                 }
                }
            ]
        },
        results);
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
    console.log("#DPAs="+assocs.length);


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
                 val: function(a){ return convChars(a.onset) } // TODO - should be an object
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

function genTableOfGenePhenotypeAssociations(assocs) {
    console.log("#DPAs="+assocs.length);
    return genTable(
        {
            columns: [
                {name: "gene",
                 val: function(a){ return genObjectHref('gene', a.gene) }
                },
                {name: "phenotype",
                 val: function(a){ return genObjectHref('phenotype', a.phenotype) }
                },
                {name: "inferred from",
                 val: function(a){ return genObjectHref('disease', a.disease)}
                },makeReferencesFromAssociations(assocs),
                {name: "source",
                 val: function(a){ return genSourceHref('source', a.source) } 
                }
            ]
        },
        assocs);
}

function genTableOfGeneDiseaseAssociations(assocs) {
    return genTable({
        blob: assocs,
        columns: [
            {name: "gene",
             val: function(a){ return genObjectHref('gene', a.gene) }
            },
            {name: "disease",
             val: function(a){ return genObjectHref('disease', a.disease) }
            },  
             makeReferencesFromAssociations(assocs),
            {name: "source",
             val: function(a){ return genSourceHref('source', a.source) }
            }
        ]
    },
    assocs);
}

function genListOfGeneReferences(assocs){
    var refList = {};
    refList = makeReferencesFromAssociations(assocs);
    var linkList = {};
    linkList = refList.val(assocs);
    return linkList;
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
                 val: function(a){ return genObjectHref('disease', a.disease) }
                },
                {name: "mutation",
                 val: function(a){ return convChars(a.sequence_alteration.has_mutation) }
                },
                {name: "allele",
                 val: function(a){ return convChars(a.allele.label) }
                },
                {name: "source",
                 val: function(a){ return genSourceHref('source', a.source) }
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
                }
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
                }
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
                                // we need to use ko pathways instead of map pathways because map pathways do not have a kgml file
                                var keggId = "ko" + a.pathways[i].substring(8, 13);
                                var pathwayLabel = a.pathway_labels[i];
                                // data object for keggerator
                                var keggeratorAnnotation = "{ " +
                                    "pathways: ['" + keggId + "'], " +
                                    "phenotypes: [ " +
                                        "{ name: '" + convChars(a.label) + "', " +
                                            "genes: " + (JSON.stringify(a.gene_ko_ids)).replace(/\"/g, '\'')  + "}" +
                                    "]" +
                                "}" ;

                                // use this one if don't want to use keggerator :(
                                /**
                                pathResult = pathResult +
                                    '<span class=\'dropt\'><a href=\'http://www.genome.jp/kegg-bin/show_pathway?' + pathId.substring(5, 13) + '\' onmouseover=\'\'>pathwayLabel</a>' +
                                    '<span><img height=320 src=\'http://rest.kegg.jp/get/' + pathId.substring(5, 13) + '/image\'/><br/>' +
                                    '</span>' +
                                    '</span><br/>'
                                **/

                                pathResult = pathResult +
                                        "<a href='#' onClick=\"keggerator.init();keggerator.annotate(" + keggeratorAnnotation + ")\" >" + pathwayLabel  + "</a>" +
                                    "<br/>"


                            }
                        }
                        return pathResult
                    }
                },
                {name: "genes",
                    val: function (a) {
                        var geneResult = "";
                        if (a.gene_ids){
                        for (var i = 0; i < a.gene_ids.length; i++) {
                            geneResult = geneResult +
                                '<a href=\'/gene/' + a.gene_ids[i]  + '\'>' + a.gene_symbols[i] + '</a><br/>';
                        }
                        return geneResult;
                        }

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
                                a.references.forEach(
                                    function (ref) {
                                        if (ref.substring(0, 5) == 'PMID:') {
                                            refResult = refResult + '<div class="inlinesource"><a href=\'http://www.ncbi.nlm.nih.gov/pubmed/' + ref.substring(5, 13) + '\'><img class="source" src="../image/source-ncbi.png"/></a></div>'
                                        }
                                    }
                                )
                            }

                        return refResult
                    }
                }
            ]
        },
        pathways);
}

function genTableOfGenePathways(pathways) {
    // TODO: currently url hyperlinks are hardcoded to Kegg.  if nif provides urls will use them instead
    return genTable(
            {
                columns: [
                    {name: "pathway",
                     val: function(a){ return convChars(a.label) }
                    },makeReferencesFromAssociations(pathways),
                    {name: "source",
                     val: function(a){ return genSourceHref('source', a.source) } 
                    }
                ]
            },
            pathways);

}

/** Replaces a string SOURCE with an image tag with the source's logo. */
function sourceImage(source) {
    var image = source;
    if (source == null || source == "") {
        return source;
    } else if (source.match(/HPO/)) {
        image = '<img class="source" src="../image/source-hpo.png"/>';
    } else if (source.match(/MGI/)) {
        image = '<img class="source" src="../image/source-mgi.png"/>';
    } else if (source.match(/OMIM/)) {
        image = '<img class="source" src="../image/source-omim.png"/>';
    } else if (source.match(/ZFIN/)) {
        image = '<img class="source" src="../image/source-zfin.png"/>';
    } else if (source == "PubMed" || source.match(/NCBI/i) || source.match(/PMID/)) {
        image = '<img class="source" src="../image/source-ncbi.png"/>';
    } else if (source.match(/ORPHANET/i)) {
        image = '<img class="source" src="../image/source-orphanet.png"/>';
    } else if (source.match(/ClinVar/i)) {
        image = '<img class="source" src="../image/source-clinvar.png"/>';
    } else {}
    return image;
}

function searchBar() {
    // TODO
}

