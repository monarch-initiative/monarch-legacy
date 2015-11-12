// Phenogrid loader
function loadPhenogrid(){
    var isGridLoading = false;
    jQuery('#categories a[href="#compare"]').click(function(event) {
        if (!(jQuery('#pg_svg_container').length)  && isGridLoading === false){
            isGridLoading = true;
            initPhenogrid();
        }
    });
    
    // Trigger a click event if we're loading the page on an href
    if ( window && window.location && window.location.hash &&
            window.location.hash != "" && window.location.hash == "#compare" ){
        jQuery('#categories a[href="#compare"]').click();
    }

    function initPhenogrid () {
        // Add spinner
        var spinner_div = makeSpinnerDiv();
        jQuery('#compare').append(spinner_div.to_string());
        
        var disease_id = window.location.pathname;
        var slash_idx = disease_id.indexOf('/');
        disease_id = disease_id.substring(slash_idx+1);
        var phenotype_list = [];
        var phenogridContainer = document.getElementById('phen_vis');
        jQuery.ajax({
            url : '/' + disease_id + '/phenotype_list.json',
            async : true,
            dataType : 'json',
            //timeout : 180000,
            error : function(jqXHR, textStatus, errorThrown) {
                jQuery('#' + spinner_div.get_id()).remove();
                var phenogridOpts = {
                                        phenotypeData: phenotype_list,
                                        serverURL: global_app_base
                                    };
                Phenogrid.createPhenogridForElement(phenogridContainer, phenogridOpts);
            },
            success : function(data) {
                jQuery('#' + spinner_div.get_id()).remove();
                phenotype_list = data.phenotype_list;

                var phenogridOpts = {
                                        phenotypeData: phenotype_list,
                                        serverURL: global_app_base
                                    };
                Phenogrid.createPhenogridForElement(phenogridContainer, phenogridOpts);
            }
        });
    }
}
