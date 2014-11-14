function makeDiseaseGeneGraph(data){
    var disGraph = 
        new bbop.monarch.datagraph(bbop.monarch.diseaseGeneConfig);
    disGraph.init(".disease-gene-container",data);
    
    //Add min width and height for bootstrap
    var minWidth = disGraph.config.width + disGraph.config.margin.left + disGraph.config.margin.right + 35;
    var minHeight = disGraph.config.height + disGraph.config.margin.top + disGraph.config.margin.bottom;
    $(".disease-gene-container").parent().parent()
        .css( {"min-width" : minWidth+"px", "min-height" : minHeight+"px"});
    $(".disease-gene-container").parent()
        .css( {"width" : minWidth+"px", "height" : minHeight+125+"px"});
 
    window.addEventListener('resize', function(event){
       minWidth = disGraph.config.width + disGraph.config.margin.left + disGraph.config.margin.right + 35;
       minHeight = disGraph.config.height + disGraph.config.margin.top + disGraph.config.margin.bottom;

        $(".disease-gene-container").parent().parent()
        .css( {"min-width" : minWidth+"px", "min-height" : minHeight+"px"});
        $(".disease-gene-container").parent()
        .css( {"width" : minWidth+"px", "height" : minHeight+125+"px"});
    });
}

function makePhenotypeAnnotationGraph(data){

    var phenoGraph = 
        new bbop.monarch.datagraph(bbop.monarch.phenotypeAnnotationConfig);
    phenoGraph.init(".graph-container",data);
    
    //Add min width and height for bootstrap
    var minWidth = phenoGraph.config.width + 
                   phenoGraph.config.margin.left + 
                   phenoGraph.config.margin.right + 35;
    var minHeight = phenoGraph.config.height + 
                    phenoGraph.config.margin.top + 
                    phenoGraph.config.margin.bottom;
    $(".graph-container").parent().parent()
        .css( {"min-width" : minWidth+"px", "min-height" : minHeight+"px"});
    $(".graph-container").parent()
    .css( {"width" : minWidth+"px", "height" : minHeight+125+"px"});
    
    window.addEventListener('resize', function(event){
        minWidth = phenoGraph.config.width + 
                   phenoGraph.config.margin.left + 
                   phenoGraph.config.margin.right + 35;
        
        minHeight = phenoGraph.config.height + 
                    phenoGraph.config.margin.top + 
                    phenoGraph.config.margin.bottom;

        $(".graph-container").parent().parent()
        .css( {"min-width" : minWidth+"px", "min-height" : minHeight+"px"});
        $(".graph-container").parent()
        .css( {"width" : minWidth+"px", "height" : minHeight+125+"px"});
    });
}
                  
function makeDiseasePhenotypeGraph(data) {

    var disPhenoGraph = 
        new bbop.monarch.datagraph(bbop.monarch.diseasePhenotypeConfig);
    disPhenoGraph.init(".disease-pheno-container",data);
    
    //bootstrap
    var minWidth = disPhenoGraph.config.width + disPhenoGraph.config.margin.left + disPhenoGraph.config.margin.right + 35;
    var minHeight = disPhenoGraph.config.height + disPhenoGraph.config.margin.top + disPhenoGraph.config.margin.bottom;
    $(".disease-pheno-container").parent().parent()
        .css( {"min-width" : minWidth+"px", "min-height" : minHeight+"px"});
    $(".disease-pheno-container").parent()
        .css( {"width" : minWidth+"px", "height" : minHeight+125+"px"});
    
    window.addEventListener('resize', function(event){
        minWidth = disPhenoGraph.config.width + disPhenoGraph.config.margin.left + disPhenoGraph.config.margin.right + 35;
        minHeight = disPhenoGraph.config.height + disPhenoGraph.config.margin.top + disPhenoGraph.config.margin.bottom;
        $(".disease-pheno-container").parent().parent()
            .css( {"min-width" : minWidth+"px", "min-height" : minHeight+"px"});
        $(".disease-pheno-container").parent()
            .css( {"width" : minWidth+"px", "height" : minHeight+125+"px"});
    });
}

function makePhenoGenoGraph(data) {
    var genoGraph = 
        new bbop.monarch.datagraph(bbop.monarch.genotypePhenotypeConfig);
    genoGraph.init(".pheno-geno-container",data);
    
    //bootstrap
    var minWidth = genoGraph.config.width + genoGraph.config.margin.left + genoGraph.config.margin.right + 35;
    var minHeight = genoGraph.config.height + genoGraph.config.margin.top + genoGraph.config.margin.bottom;
    $(".pheno-geno-container").parent().parent()
        .css( {"min-width" : minWidth+"px", "min-height" : minHeight+"px"});
    $(".pheno-geno-container").parent()
        .css( {"width" : minWidth+"px", "height" : minHeight+125+"px"});
    
    window.addEventListener('resize', function(event){
        minWidth = genoGraph.config.width + genoGraph.config.margin.left + genoGraph.config.margin.right + 35;
        minHeight = genoGraph.config.height + genoGraph.config.margin.top + genoGraph.config.margin.bottom;
        $(".pheno-geno-container").parent().parent()
            .css( {"min-width" : minWidth+"px", "min-height" : minHeight+"px"});
        $(".pheno-geno-container").parent()
            .css( {"width" : minWidth+"px", "height" : minHeight+125+"px"});
    });
}
//TODO implement when graph is available
function makePhenoGeneGraph(data) {
   /* var geneGraph = jQuery.extend(true, {}, datagraph);
    geneGraph.height=400;
    geneGraph.margin.right = 40;
    geneGraph.chartTitle = "Phenotype Gene Annotation Distribution";
    geneGraph.xAxisLabel= "Number Of Genes";
    geneGraph.init(".pheno-gene-container",data);
    */
}