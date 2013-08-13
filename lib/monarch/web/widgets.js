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

function genObjectHref(type,obj,fmt) {
    if (obj == null) {
        //return "";
    }
    var url = genURL(type, obj.id, fmt);
    var label = obj.label;
    if (label == null) {
        label = obj.id;
    }
    return '<a href="'+url+'">'+obj.label+'</a>';
}

function genURL(type,id,fmt) {
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
                {name: "Type",
                 val: function(a){ return a.type }
                },
                {name: "Term",
                 val: function(a){ return genObjectHref(a.type, a) }
                },
                {name: "info",
                 val: function(a){ return a.comments }
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
                 val: function(a){ return a.onset } // TODO - should be an object
                },
                {name: "frequency",
                 val: function(a){ return a.frequency }
                },
                {name: "phenotype",
                 val: function(a){ return genObjectHref('phenotype', a.phenotype) }
                },
                {name: "source",
                 val: function(a){ return a.source }
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
             val: function(a){ return a.inheritance } // TODO - should be an object
            },
            {name: "gene",
             val: function(a){ return genObjectHref('gene', a.gene) }
            },
            {name: "source",
             val: function(a){ return a.source }
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
                 val: function(a){ return a.allele.mutation }
                },
                {name: "allele",
                 val: function(a){ return genObjectHref('allele', a.allele) }
                },
                {name: "source",
                 val: function(a){ return a.source }
                }
            ]
        },
        assocs);
}

function genTableOfGenotypePhenotypeAssociations(assocs) {
    return genTable(
        {
            columns: [
                {name: "genotype",
                 val: function(a){ return genObjectHref('genotype', a.has_genotype.type) }
                },
                {name: "background",
                 val: function(a){ return genObjectHref('background', a.has_genotype.has_part) }
                },
                {name: "phenotype",
                 val: function(a){ return genObjectHref('phenotype', a.has_phenotype.type) }
                },
                {name: "phenotype description",
                 val: function(a){ return a.has_phenotype.description }
                },
                {name: "evidence",
                 val: function(a){ return genObjectHref('evidence', a.evidence.type) }
                },
                {name: "reference",
                 val: function(a){ return genObjectHref('reference', a.reference) }
                },
                {name: "source",
                 val: function(a){ return a.source }
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
                 val: function(a){ return a.type.label } // TODO - make this an object
                },
                {name: "model",
                 val: function(a){ return genObjectHref('model', a.model) }
                },
                {name: "model species",
                 val: function(a){ return a.model.taxon.label }
                },
                {name: "model type",
                 val: function(a){ return a.model.type.label +" (" + a.model.type.parent + ")" }
                },
                {name: "source",
                 val: function(a){ return a.source }
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
                 val: function(a){ return a.source }
                }
            ]
        },
        assocs);
}


function genTableOfSimilarDiseases(assocs) {
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
                 val: function(a){ return a.metric }
                },
                {name: "score",
                 val: function(a){ return a.score }
                },
                {name: "values",
                 // TODO - special behavior for LCS
                 val: function(a){ return a.values }
                },
            ]
        },
        assocs);
}

function searchBar() {
    // TODO
}

