$(document).ready(function(){

    $('.tabcontainer').hover(function() {
        $(this).find('.tabhover').css({'display': 'block'});
    }, function(){
        $(this).find('.tabhover').css({'display': 'none'});
    });

    $('.contenttab').click(function() {
        $('.contenttab').css({'color': 'white', 'background-color': '#999', 'border-bottom': '1px solid black'});
        $(this).css({'color': 'black', 'background-color': 'white', 'border-bottom': '1px solid white'});
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
        $('.contenttab').css({'color': 'white', 'background-color': '#999', 'border-bottom': '1px solid black'});
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
        $(contenttab).css({'color': 'black', 'background-color': 'white', 'border-bottom': '1px solid white'});
    });

});
