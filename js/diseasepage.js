
$(function () { 
    var disease_id = this.location.pathname;
    var slash_idx = disease_id.indexOf('/');
    disease_id = disease_id.substring(slash_idx+1);
    var phenotype_list = [];

    jQuery.ajax({ 
	url : '/' + disease_id + '/phenotype_list.json', 
	async : false, 
	dataType : 'json', 
	success : function(data) {
	    phenotype_list = data.phenotype_list;
        }
        });

       $("#phen_vis").phenogrid({phenotypeData: phenotype_list});
});        
