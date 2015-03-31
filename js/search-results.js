////
//// Application-level code for creating the 
//// search results table from NIF
////

function search_results_init(term){
    var query = "/neurosearch/"+term+".json";

    $("#ajax-cube").show();
    jQuery.getJSON(query, function(data) {
        var results = data;
        $("#ajax-cube").hide();
        
        if (results.otherResults.length > 0){
            var genResultsTable = function() {return genTableOfSearchDataResults(results.otherResults) };
            var resultsTable = genResultsTable();
        } else {
            resultsTable = "<span class=\"no-results\">&nbsp;&nbsp;No results found</span>";
            $("#text-search").remove();
        }
        
        $("#complete-info").append(resultsTable);
    });
    
    
    
}