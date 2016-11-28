/* This script document is primarily used for tab behavior on pages relating to
 * specific diseases, phenotypes, genes, or genotypes. */

function InitTabs() {

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
    jQuery('.contenttab').click(function(e) {
        jQuery('.contenttab').css({'color': 'white', 'background-color': '#999', 'border-bottom': '1px solid darkgray'});
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
        event.stopPropagation();
        jQuery('.category').hide();
        jQuery(panel_id + '-panel').show();
        window.location.hash = panel_id;
    });
    
    function adjustTabColor(panel_id) {
        // Since we're a tabby version, we're going to try and open
           // any tabs defined by fragments.
           if ( window && window.location && window.location.hash &&
               window.location.hash != "" && window.location.hash != "#" ){

               if (panel_id !== '#overview') {
                   jQuery('.first.category').hide();
                   jQuery(panel_id).show();

                   jQuery('.contenttab').css({'color': 'white', 'background-color': '#999', 'border-bottom': '1px solid darkgray'});
                   jQuery('.tabcontainer a[href="' + panel_id + '"]').children('.contenttab').css({'color': 'black', 'background-color': 'white', 'border-bottom': '1px solid white'});
               }
           }
    }
    
    //Hack to get links to internal html anchors to work
    jQuery('#internal-link').click(function(event) {
        var panel_id = jQuery(this).attr('href');
        jQuery('#categories a[href="'+panel_id+'"]').click();
        adjustTabColor(panel_id);
        
    });
    
    adjustTabColor(window.location.hash);
    
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

}

if (typeof loaderGlobals === 'object') {
    loaderGlobals.InitTabs = InitTabs;
}
if (typeof global === 'object') {
    global.InitTabs = InitTabs;
}
