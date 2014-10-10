
$(function () { 
    var id = this.location.pathname;
    var slash_idx = id.indexOf('/');
    id = id.substring(slash_idx+1);
    var phenotype_list = [];
    var species;
    
    jQuery.ajax({ 
		url : '/' + id + '/phenotype_list.json', 
	async : false,
	dataType : 'json', 
	success : function(data) {
	    phenotype_list = data.phenotype_list.phenotype_list;
	    species = data.phenotype_list.species;
	}
    });
    $("#phen_vis").phenogrid({phenotypeData: phenotype_list, refSpecies: species});
});        
