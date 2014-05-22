$(document).ready(function(){

    var table = $('.simpletable').stupidtable({
        "PMID": function(a, b) {
            return float(a.substring(5), b.substring(5));
        },
        "string": function(a, b) {
            return string(a, b);
        },
        "float": function(a, b) {
            return float(a, b);
        },
        "frequency": function(a, b) {
            a = frequency(a);
            b = frequency(b);
            if (a < b) return -1;
            if (a > b) return +1;
            return 0;
        },
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
        } else if (str == "rare") {
            return 4;
        } else if (str != "") {
            return 5;
        }
        return 6;
    };

    var sort = ["PMID", "string", "float", "frequency"];

    table.bind('beforetablesort', function(event, data) {
        // data.column - the index of the column sorted after a click
        // data.direction - the sorting direction (either asc or desc)
    
        $('.arrow').html(' &#x2195;');
        var th = $(this).find("th");
        var arrow = data.direction === "asc" ? "  ↑" : "  ↓";
        var type = th.eq(data.column).attr("data-sort");
        if (sort.indexOf(type) != -1) {
            th.eq(data.column).find('.arrow').text(arrow);
        }
    });

});
