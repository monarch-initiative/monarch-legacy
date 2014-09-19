
$(function () { 
    var id = this.location.pathname;
    var slash_idx = id.indexOf('/');
    id = id.substring(slash_idx+1);
    var phenotype_list = []; 
    jQuery.ajax({ 
		url : '/' + id + '/phenotype_associations.json', 
		async : false, 
		dataType : 'json', 
		success : function(data) {
			for (var idx=0;idx<data.phenotype_associations.length;idx++) {
				var assoc = data.phenotype_associations[idx];
				if (typeof assoc.has_phenotype != 'undefined' && typeof assoc.has_phenotype.type != 'undefined') {
					pheno = assoc.has_phenotype.type;
					pheno.observed = "positive";
					phenotype_list.push(pheno);
				}
			}
		}
    });

	$("#phen_vis").modeltype({phenotypeData: phenotype_list});
});        
