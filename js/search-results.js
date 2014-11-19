////
//// Application-level code for creating the 
//// search results table from NIF
////

function search_results_init(term){
    var query = "/neurosearch/"+term+".json";

    $("#spinner").show();
    jQuery.getJSON(query, function(data) {
        var results = data;
        $("#spinner").hide();
        
        var genResultsTable = function() {return genTableOfSearchDataResults(results.otherResults) };
        var resultsTable = genResultsTable();
        $("#complete-info").append(resultsTable);
    });
    
    
    
}