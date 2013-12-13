$(document).ready(function(){

    $('.tab').click(function() {
        $('.tab').css({'color': 'grey'});
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
        var panel;
        if (panel_id == "over") {
            panel = '#overview';
        } else if (panel_id == "ont") {
            panel = '#ontology';
        } else if (panel_id == "phen") {
            panel = '#phenotype';
        } else if (panel_id == "gen") {
            panel = '#gene';
        } else if (panel_id == "alle") {
            panel = '#allele';
        } else if (panel_id == "mod") {
            panel = '#model';
        } else {
            panel = '#sim';
        }
        $(panel).show(400);
    });

});
