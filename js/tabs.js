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
            contenttab = '.phentab';
        } else if (panel_id == "ont") {
            panel = '#ontology';
            contenttab = '.onttab';
        } else if (panel_id == "gen") {
            panel = '#genes';
            contenttab = '.gentab';
        } else if (panel_id == "alle") {
            panel = '#alleles';
            contenttab = '.alletab';
        } else if (panel_id == "mod") {
            panel = '#model';
            contenttab = '.modtab';
        } else if (panel_id == "simi") {
            panel = '#similarity';
            contenttab = '.simtab';
        } else if (panel_id == "path") {
            panel = '#pathways';
            contenttab = '.pathtab';
        } else if (panel_id == "over") {
            panel = '#overview';
            contenttab = '.overtab';
        } else if (panel_id == "dis") {
            panel = '#disease';
            contenttab = '.distab';
        } else if (panel_id == "geno") {
            panel = '#genotypes';
            contenttab = '.genotab';
        }
        event.preventDefault();
        $(panel).show();
        $(contenttab).css({'color': 'white', 'background-color': '#666'});
    });

});
