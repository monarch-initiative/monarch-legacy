
$(function () { 
    var disease_id = this.location.pathname;
    var slash_idx = disease_id.indexOf('/');
    disease_id = disease_id.substring(slash_idx+1);
    var phenotype_list = []; 
    jQuery.ajax({ 
	url : '/' + disease_id + '/phenotype_associations.json', 
	async : false, 
	dataType : 'json', 
	success : function(data) { 
	    for (var idx=0;idx<data.phenotype_associations.length;idx++) { 
		phenotype_list.push({ "id" : data.phenotype_associations[idx].phenotype.id, 
		         "observed" : "positive"}); 
		 }
        }
        });


       //mt.initPhenotype($("#phen_vis"), phenotype_list);
       $("#phen_vis").modeltype({phenotypeData: phenotype_list});
});        
