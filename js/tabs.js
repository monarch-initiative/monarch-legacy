/* This script document is primarily used for tab behavior on pages relating to
 * specific diseases, phenotypes, genes, or genotypes. */

jQuery(document).ready(function(){

    /* All Disease, Phenotype, Gene, & Genotype Specific Pages */

    /* This displays the tooltips that display upon hover over tabs on disease,
     * phenotype, gene, and genotype pages. */
    jQuery('.tabcontainer').hover(function() {
        jQuery(this).on('mousemove', function(e) {
            jQuery(this).find('.tabhover').css({'top': e.pageY - 20, 'left': e.pageX});
            jQuery(this).find('.tabhover').show();
        });
    }, function(){
        jQuery(document).off('mousemove');
        jQuery(this).find('.tabhover').hide();
    });

    /* This changes the color and style of tabs upon click. */
    jQuery('.contenttab').click(function() {
        jQuery('.contenttab').css({'color': 'white', 'background-color': '#999', 'border-bottom': '1px solid black'});
        console.log(this);
        jQuery(this).css({'color': 'black', 'background-color': 'white', 'border-bottom': '1px solid white'});
    });

    /* This changes the content that is displayed on disease, phenotype, gene, and
     * genotype pages upon clicking the various tabs. */
    jQuery('#categories a').click(function(event) {
        var panel_id = jQuery(this).attr('href');
        // TODO: there has to be something better than this
        if(panel_id=='#jbrowse'){
            loadJBrowseFrame();
        }
        event.preventDefault();
        jQuery('.category').hide();
        jQuery(panel_id).show();
    });
    //HACK TO GET THE ANALYZE PAGE TO WORK, REFACTOR OUT
    jQuery('#internal-link').click(function(event) {
        var panel_id = jQuery(this).attr('href');
        event.preventDefault();
        jQuery('.category').hide();
        jQuery(panel_id).show();
        jQuery(".query-tab").css({'color': 'white', 'background-color': '#999', 'border-bottom': '1px solid black'});
        jQuery(".upload-tab").css({'color': 'black', 'background-color': 'white', 'border-bottom': '1px solid white'});
    });
    
    // Since we're a tabby version, we're going to try and open
    // any tabs defined by fragments.
    if ( window && window.location && window.location.hash &&
        window.location.hash != "" && window.location.hash != "#" ){
        var fragname = window.location.hash;
        
        jQuery('.first.category').hide();
        jQuery(fragname).show();
        
        jQuery('.contenttab').css({'color': 'white', 'background-color': '#999', 'border-bottom': '1px solid black'});
        jQuery('.tabcontainer a[href="' + fragname + '"]').children('.contenttab').css({'color': 'black', 'background-color': 'white', 'border-bottom': '1px solid white'}); 
    }

    /* Literature Tab */
    
    /* This is used to display hidden authors on the literature tab (because only the
     * first three authors of a publications are currently displayed. */
    jQuery('.etal').click(function(event) {
        jQuery(this).hide();
        jQuery(this).parent().find('.moreauthors').show();
        jQuery(this).parent().find('.hideauthors').show();
    });

    /* This is used to hide authors on the literature tab (only three authors are
     * displayed after this). */
    jQuery('.hideauthors').click(function(event) {
        jQuery(this).parent().find('.moreauthors').hide();
        jQuery(this).hide();
        jQuery(this).parent().find('.etal').show();
    });

});
