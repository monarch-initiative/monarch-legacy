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

function genObjectHref(type,obj) {
    return '<a href="/'+type+'/'+obj.id+'">'+obj.label+'</a>';
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

