$(document).ready(function(){

    $('.contenttab').click(function() {
        $('.contenttab').css({'color': '#777', 'background-color': 'white'});
        $(this).css({'color': 'white', 'background-color': '#666'});
    });

    $('#categories a').click(function(event) {
        var panel_id = $(this).attr('href');
        event.preventDefault();
        $('.category').hide();
        $(panel_id).show();
    });

    $('.special').click(function(event) {
        var panel_id = $(this).attr("id");
        $('.category').hide();
        $('.contenttab').css({'color': '#777', 'background-color': 'white'});
        var panel;
        if (panel_id == "phen") {
            panel = '#phenotypes';
        } else if (panel_id == "ont") {
            panel = '#ontology';
        } else if (panel_id == "gen") {
            panel = '#genes';
        } else if (panel_id == "alle") {
            panel = '#alleles';
        } else if (panel_id == "mod") {
            panel = '#model';
        } else if (panel_id == "simi") {
            panel = '#similarity';
        } else if (panel_id == "path") {
            panel = '#pathways';
        } else if (panel_id == "over") {
            panel = '#overview';
        } else if (panel_id == "dis") {
            panel = '#disease';
        } else if (panel_id == "geno") {
            panel = '#genotypes';
        } else if (panel_id == "que") {
            panel = '#query';
        } else if (panel_id == "res") {
            panel = '#result';
        } else if (panel_id == "gri") {
            panel = '#grid';
        }
        contenttab = '.' + panel_id + 'tab';
        event.preventDefault();
        $(panel).show();
        $(contenttab).css({'color': 'white', 'background-color': '#666'});
    });

});
