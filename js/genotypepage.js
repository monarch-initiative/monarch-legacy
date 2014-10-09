
$(function () { 
    var id = this.location.pathname;
    var slash_idx = id.indexOf('/');
    id = id.substring(slash_idx+1);
    var phenotype_list = [];
    var species;
    console.log("genotype page ...id is..."+id);
    
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
	            // get the species
	           // from the first phenotype_associations
	          // grab the has_genotype.taxon.label
	         try {
		     species = data.phenotype_associations[0].has_genotype.taxon.label;
		 } catch(e) {
		 }
		}
    });
    $("#phen_vis").phenogrid({phenotypeData: phenotype_list, refSpecies: species});
});        
