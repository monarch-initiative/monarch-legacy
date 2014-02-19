$(document).ready(function(){

    var table = $('.simpletable').stupidtable({
        "disease": function(a, b) {
            return string(a, b);
        },
        "phenotype": function(a, b) {
            return string(a, b);
        },
        "frequency": function(a, b) {
            a = frequency(a);
            b = frequency(b);
            if (a < b) return -1;
            if (a > b) return +1;
            return 0;
        },
        "gene": function(a, b) {
            return string(a, b);
        },
        "mutation": function(a, b) {
            return string(a, b);
        },
        "allele": function(a, b) {
            return string(a, b);
        },
        "disease B": function(a, b) {
            return string(a, b);
        },
        "score": function(a, b) {
            return float(a, b);
        },
        "rank": function(a, b) {
            return float(a, b);
        },
        "genotype": function(a, b) {
            return string(a, b);
        },
        "phenotype description": function(a, b) {
            return string(a, b);
        },
        "Hit": function(a, b) {
            return string(a, b);
        },
        "Combined score": function(a, b) {
            return float(a, b);
        },
        "Most Informative Shared Phenotype": function(a, b) {
            return string(a, b);
        },
        "Other Matching Phenotypes": function(a, b) {
            return string(a, b);
        }
    });
    
    function float(a, b) {
        return parseFloat(a, 10) - parseFloat(b, 10);
    };
    
    function string(a, b) {
        a = a.toLowerCase();
        b = b.toLowerCase();
        if (a < b) return -1;
        if (a > b) return +1;
        return 0;
    };
    
    function frequency(str) {
        if (str == "hallmark") {
            return 1;
        } else if (str == "typical") {
            return 2;
        } else if (str == "occasional") {
            return 3;
        }
        return 4;
    };

    table.bind('beforetablesort', function(event, data) {
        // data.column - the index of the column sorted after a click
        // data.direction - the sorting direction (either asc or desc)
    
        var th = $(this).find("th");
        th.find(".arrow").remove();
        var arrow = data.direction === "asc" ? "  ↑" : "  ↓";
        var type = th.eq(data.column).attr("data-sort");
        if (type == "disease" | type == "phenotype" | type == "frequency" | type == "gene" |
            type == "mutation" | type == "allele" | type == "disease B" | type == "score" |
            type == "rank" | type == "genotype" | type == "phenotype description" | type == "Hit" |
            type == "Combined score" | type == "Most Informative Shared Phenotype" |
            type == "Other Matching Phenotypes") {
            th.eq(data.column).append('<span class="arrow">' + arrow +'</span>');
        }
    });

});
