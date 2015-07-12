// Phenogrid loader
function loadPhenogrid(){
    var isGridLoading = false;
    jQuery('#categories a[href="#compare"]').click(function(event) {
        if (!(jQuery('#pg_svg_container').length)  && isGridLoading === false){
            isGridLoading = true;
            initPhenogrid();
        }
    });

    function initPhenogrid () {
        var disease_id = this.location.pathname;
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
                var phenogridOpts = {
                                        phenotypeData: phenotype_list
                                    };
                Phenogrid.createPhenogridForElement(phenogridContainer, phenogridOpts);
            },
            success : function(data) {
                phenotype_list = data.phenotype_list;

                var phenogridOpts = {
                                        phenotypeData: phenotype_list
                                    };
                Phenogrid.createPhenogridForElement(phenogridContainer, phenogridOpts);
            }
        });
    }
}
