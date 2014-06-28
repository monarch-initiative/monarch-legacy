/* This script document is primarily used for tab behavior on pages relating to
 * specific diseases, phenotypes, genes, or genotypes. */

$(document).ready(function(){

    /* All Disease, Phenotype, Gene, & Genotype Specific Pages */

    /* This displays the tooltips that display upon hover over tabs on disease,
     * phenotype, gene, and genotype pages. */
    $('.tabcontainer').hover(function() {
        $(this).on('mousemove', function(e) {
            $(this).find('.tabhover').css({'top': e.pageY - 20, 'left': e.pageX});
            $(this).find('.tabhover').show();
        });
    }, function(){
        $(document).off('mousemove');
        $(this).find('.tabhover').hide();
    });

    /* This changes the color and style of tabs upon click. */
    $('.contenttab').click(function() {
        $('.contenttab').css({'color': 'white', 'background-color': '#999', 'border-bottom': '1px solid black'});
        $(this).css({'color': 'black', 'background-color': 'white', 'border-bottom': '1px solid white'});
    });

    /* This changes the content that is displayed on disease, phenotype, gene, and
     * genotype pages upon clicking the various tabs. */
    $('#categories a').click(function(event) {
        var panel_id = $(this).attr('href');
        event.preventDefault();
        $('.category').hide();
        $(panel_id).show();
    });


    /* Literature Tab */
    
    /* This is used to display hidden authors on the literature tab (because only the
     * first three authors of a publications are currently displayed. */
    $('.etal').click(function(event) {
        $(this).hide();
        $(this).parent().find('.moreauthors').show();
        $(this).parent().find('.hideauthors').show();
    });

    /* This is used to hide authors on the literature tab (only three authors are
     * displayed after this). */
    $('.hideauthors').click(function(event) {
        $(this).parent().find('.moreauthors').hide();
        $(this).hide();
        $(this).parent().find('.etal').show();
    });

});
