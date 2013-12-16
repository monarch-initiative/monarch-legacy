$(document).ready(function(){

    $('.tab').click(function() {
        $('.tab').css({'color': '#999'});
        $(this).css({'color': 'white'});
    });

    $('#categories a').click(function() {
        var panel_id = $(this).attr('href');
        $('.category').hide();
        $(panel_id).show(400);
    });

    $('.special').click(function() {
        var panel_id = $(this).attr("id");
        $('.category').hide();
        $('.tab').css({'color': 'grey'});
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
        } else {
            panel = "#down";
            tab = '.downtab';
        }
        $(panel).show(400);
        $(tab).css({'color': 'white'});
    });

});
