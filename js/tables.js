$(document).ready(function(){

    var table = $('.simpletable').stupidtable({
        "int": function(a, b) {
            return parseInt(a, 10) - parseInt(b, 10);
        },
        "float": function(a, b) {
            return parseFloat(a) - parseFloat(b);
        },
        "string": function(a, b) {
            if (a < b) return -1;
            if (a > b) return +1;
            return 0;
        },
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
        "inheritance": function(a, b) {
            return string(a, b);
        },
        "gene": function(a, b) {
            return string(a, b);
        }
    });
    
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
        th.eq(data.column).append('<span class="arrow">' + arrow +'</span>');
    });

});
