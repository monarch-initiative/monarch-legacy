function loadPhenogrid(phenogrid_conf, view) {
    var isGridLoading = false;
    jQuery('#categories a[href="#compare"]').click(function(event) {
        if (!(jQuery('#pg_svg_container').length)  && isGridLoading === false){
            isGridLoading = true;
            initPhenogrid(phenogrid_conf, view);
        }
    });
    // Trigger a click event if we're loading the page on an href
    if ( window && window.location && window.location.hash &&
            window.location.hash != "" && window.location.hash == "#compare" ){
        jQuery('#categories a[href="#compare"]').click();
    }

    function initPhenogrid (phenogrid_conf, view) {
        // Add spinner
        var spinner_div = makeSpinnerDiv();
        jQuery('#compare-panel').append(spinner_div.to_string());

        var disease_id = window.location.pathname;
        var slash_idx = disease_id.indexOf('/');
        disease_id = disease_id.substring(slash_idx+1);
        var phenotype_list = [];
        var phenogridContainer = document.getElementById('phen_vis');
        var gridSkeletonData = {};
        
        if (typeof(view) !== 'undefined'
                && typeof(phenogrid_conf[view]) !== 'undefined') {
            gridSkeletonData = phenogrid_conf[view];
            gridSkeletonData.yAxis = phenotype_list;
        } else {
            // Default configuration
            gridSkeletonData = {
                "title": null,
                "xAxis": [
                    {
                        "groupId": "9606",
                        "groupName": "Homo sapiens"
                    },
                    {
                        "groupId": "10090",
                        "groupName": "Mus musculus"
                    },
                    {
                        "groupId": "7955",
                        "groupName": "Danio rerio"
                    },
                    {
                        "groupId": "7227",
                        "groupName": "Drosophila melanogaster"
                    },
                    {
                        "groupId": "6239",
                        "groupName": "Caenorhabditis elegans"
                    }
                ],
                "yAxis": phenotype_list
            };
        }

        jQuery.ajax({
            url : '/' + disease_id + '/phenotype_list.json',
            async : true,
            dataType : 'json',
            //timeout : 180000,
            error : function(jqXHR, textStatus, errorThrown) {
                jQuery('#' + spinner_div.get_id()).remove();
                var phenogridOpts = {
                                        gridSkeletonData: gridSkeletonData,
                                        serverURL: global_app_base
                                    };
                Phenogrid.createPhenogridForElement(phenogridContainer, phenogridOpts);
            },
            success : function(data) {
                jQuery('#' + spinner_div.get_id()).remove();
                gridSkeletonData.yAxis = data.phenotype_list;

                var phenogridOpts = {
                                        gridSkeletonData: gridSkeletonData,
                                        serverURL: global_app_base
                                    };
                Phenogrid.createPhenogridForElement(phenogridContainer, phenogridOpts);
            }
        });
    }
}
