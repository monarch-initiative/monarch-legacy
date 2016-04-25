// Phenogrid loader
function loadPhenogrid(){

    function initPhenogrid () {
        // Add spinner
        var spinner_div = makeSpinnerDiv();
        jQuery('#compare').append(spinner_div.to_string());

        var disease_id = window.location.pathname;
        var slash_idx = disease_id.indexOf('/');
        disease_id = disease_id.substring(slash_idx+1);
        var phenotype_list = [];
        var phenogridContainer = document.getElementById('phen_vis');
        
        
        
        var gridSkeletonData = {
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
        
        
        jQuery.ajax({
            url : '/' + disease_id + '/phenotype_list.json', // Fetching this list takes several seconds which causes empty page conten - Zhou
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
                // Phenogrid will remove the duplicated phenotypes in this monarch-app returned phenotype_list
                // before sending the ajax POST to simsearch - Zhou
                gridSkeletonData.yAxis = data.phenotype_list;

                var phenogridOpts = {
                                        gridSkeletonData: gridSkeletonData,
                                        serverURL: "https://beta.monarchinitiative.org"//global_app_base
                                    };
                Phenogrid.createPhenogridForElement(phenogridContainer, phenogridOpts);
            }
        });
    }

    initPhenogrid();
}