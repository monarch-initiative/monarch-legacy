
$(function () { 
    var disease_id = this.location.pathname;
    var slash_idx = disease_id.indexOf('/');
    disease_id = disease_id.substring(slash_idx+1);
    var phenotype_list = [];
    console.log("disease page ...id is..."+disease_id);
    var url = '/' + disease_id + '/phenotype_associations.json'; 
    console.log("url is "+ url);

    jQuery.ajax({ 
	url : '/' + disease_id + '/phenotype_associations.json', 
	async : false, 
	dataType : 'json', 
	success : function(data) {
	    for (var idx=0;idx<data.phenotype_associations.length;idx++) { 
		phenotype_list.push({ "id" : data.phenotype_associations[idx].phenotype.id, "label" : data.phenotype_associations[idx].phenotype.label,
		         "observed" : "positive"}); 
		 }
        }
        });


       $("#phen_vis").phenogrid({phenotypeData: phenotype_list});
});        
