$(function () {
    var id = window.location.pathname;
    var slash_idx = id.indexOf('/');
    id = id.substring(slash_idx+1);
    var phenotype_list = [];
    var phenogridContainer = document.getElementById('phen_vis');
    var species;

    jQuery.ajax({
      url : '/' + id + '/phenotype_list.json',
      async : true,
      //timeout: 180000,
      dataType : 'json',
      error : function(jqXHR, textStatus, errorThrown) {
          var phenogridOpts = {
                                  phenotypeData: phenotype_list,
                                  refSpecies: species
                              };
          Phenogrid.createPhenogridForElement(phenogridContainer, phenogridOpts);
      },
      success : function(data) {
          phenotype_list = data.phenotype_list.phenotype_list;
          species = data.phenotype_list.species;

          var phenogridOpts = {
                                  phenotypeData: phenotype_list,
                                  refSpecies: species
                              };
          Phenogrid.createPhenogridForElement(phenogridContainer, phenogridOpts);
      }
    });
});
