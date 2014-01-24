$(document).ready(function(){

    $('.tab').click(function() {
        $('.tab').css({'color': '#777', 'background-color': 'white'});
        $(this).css({'color': 'white', 'background-color': '#666'});
    });

    $('#categories a').click(function(event) {
        var panel_id = $(this).attr('href');
        $('.category').hide();
        event.preventDefault();
        $(panel_id).show();
    });

    $('.special').click(function(event) {
        var panel_id = $(this).attr("id");
        $('.category').hide();
        $('.tab').css({'color': '#777', 'background-color': 'white'});
        var panel;
        if (panel_id == "phen") {
            panel = '#phenotypes';
            tab = '.phentab';
        } else if (panel_id == "ont") {
            panel = '#ontology';
            tab = '.onttab';
        } else if (panel_id == "gen") {
            panel = '#genes';
            tab = '.gentab';
        } else if (panel_id == "alle") {
            panel = '#alleles';
            tab = '.alletab';
        } else if (panel_id == "mod") {
            panel = '#model';
            tab = '.modtab';
        } else if (panel_id == "simi") {
            panel = '#similarity';
            tab = '.simtab';
        } else if (panel_id == "path") {
            panel = '#pathways';
            tab = '.pathtab';
        } else if (panel_id == "over") {
            panel = '#overview';
            tab = '.overtab';
        } else if (panel_id == "dis") {
            panel = '#disease';
            tab = '.distab';
        } else if (panel_id == "geno") {
            panel = '#genotypes';
            tab = '.genotab';
        }
        event.preventDefault();
        $(panel).show();
        $(tab).css({'color': 'white', 'background-color': '#666'});
    });

});
