/* This script document is solely used for table sorting on all pages relating to
 * specific diseases, phenotypes, genes, or genotypes that have tables of data with
 * sortable information.
 *
 * As a general style note, try not to add more sortable data types (unless there is
 * something that needs to be sorted specially and does not fall within the categories
 * of string, float, or frequency.
 *
 * The sorting type of tables is defined in the tableSortDataType function in
 * widgets.js. To make a table sortable, add the column name of the table to the
 * appropriate dictionary for sortable type. */

jQuery(document).ready(function(){

    /* This provides functions for comparing elements by datatype. */
    var table = jQuery('.simpletable').stupidtable({
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
    
    /* This compares two floating point numbers or integers. */
    function float(a, b) {
        return parseFloat(a, 10) - parseFloat(b, 10);
    };
    
    /* This compares two strings. */
    function string(a, b) {
        a = a.toLowerCase();
        b = b.toLowerCase();
        if (a < b) return -1;
        if (a > b) return +1;
        return 0;
    };
    
    /* This compares two strings that refer to the frequency of certain traits. */
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

    var sort = ["string", "float", "frequency"];

    /* This changes the sorting arrows that appear on table columns depending on the
     * direction the items are sorted in. */
    table.bind('beforetablesort', function(event, data) {
        // data.column - the index of the column sorted after a click
        // data.direction - the sorting direction (either asc or desc)
    
        jQuery('.arrow').html(' &#x2195;');
        var th = jQuery(this).find("th");
        var arrow = data.direction === "asc" ? "  ↑" : "  ↓";
        var type = th.eq(data.column).attr("data-sort");
        if (sort.indexOf(type) != -1) {
            th.eq(data.column).find('.arrow').text(arrow);
        }
    });

});
