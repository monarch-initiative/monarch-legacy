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
        if (panel_id == "over") {
            panel = '#overview';
            tab = '.overtab';
        } else if (panel_id == "ont") {
            panel = '#ontology';
            tab = '.onttab';
        } else if (panel_id == "phen") {
            panel = '#phenotype';
            tab = '.phentab';
        } else if (panel_id == "gen") {
            panel = '#gene';
            tab = '.gentab';
        } else if (panel_id == "alle") {
            panel = '#allele';
            tab = '.alletab';
        } else if (panel_id == "mod") {
            panel = '#model';
            tab = '.modtab';
        } else if (panel_id == "simi") {
            panel = '#sim';
            tab = '.simtab';
        } else if (panel_id == "dis") {
            panel = '#disease';
            tab = '.distab';
        } else if (panel_id == "geno") {
            panel = '#geno';
            panel = '.genotab';
        } else {
            panel = "#down";
            tab = '.downtab';
        }
        event.preventDefault();
        $(panel).show();
        $(tab).css({'color': 'white', 'background-color': '#666'});
    });

});
