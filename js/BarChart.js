function makeDiseaseGeneGraph(data){
    var disGraph = jQuery.extend(true, {}, datagraph);
    disGraph.height=240;
    disGraph.chartTitle = "Gene Disease Distribution";
    disGraph.firstCrumb = "Anatomical Entity";
    disGraph.xAxisLabel= "Number Of Associations";
    disGraph.useLegend= false;
    disGraph.yLabelBaseURL= "/disease/";
    disGraph.init(".disease-gene-container",data);
    var minWidth = disGraph.width + disGraph.margin.left + disGraph.margin.right + 35;
    var minHeight = disGraph.height + disGraph.margin.top + disGraph.margin.bottom;
    $(".disease-gene-container").parent().parent()
        .css( {"min-width" : minWidth+"px", "min-height" : minHeight+"px"});
    $(".disease-gene-container").parent()
        .css( {"width" : minWidth+"px", "height" : minHeight+125+"px"});
}

function makePhenotypeAnnotationGraph(data){

    var phenoGraph = jQuery.extend(true, {}, datagraph);
    phenoGraph.height=400;
    phenoGraph.init(".graph-container",data);
    var minWidth = phenoGraph.width + phenoGraph.margin.left + phenoGraph.margin.right + 35;
    var minHeight = phenoGraph.height + phenoGraph.margin.top + phenoGraph.margin.bottom;
    $(".graph-container").parent().parent()
        .css( {"min-width" : minWidth+"px", "min-height" : minHeight+"px"});
    $(".graph-container").parent()
    .css( {"width" : minWidth+"px", "height" : minHeight+125+"px"});
}
                  
function makeDiseasePhenotypeGraph(data) {
    var disPhenoGraph = jQuery.extend(true, {}, datagraph);
    disPhenoGraph.height=240;
    disPhenoGraph.chartTitle = "Disease Phenotype Distribution";
    disPhenoGraph.firstCrumb = "Anatomical Entity";
    disPhenoGraph.xAxisLabel= "Number Of Associations";
    disPhenoGraph.useLegend= false;
    disPhenoGraph.yLabelBaseURL= "/disease/";
    disPhenoGraph.init(".disease-pheno-container",data);
    var minWidth = disPhenoGraph.width + disPhenoGraph.margin.left + disPhenoGraph.margin.right + 35;
    var minHeight = disPhenoGraph.height + disPhenoGraph.margin.top + disPhenoGraph.margin.bottom;
    $(".disease-pheno-container").parent().parent()
        .css( {"min-width" : minWidth+"px", "min-height" : minHeight+"px"});
    $(".disease-pheno-container").parent()
        .css( {"width" : minWidth+"px", "height" : minHeight+125+"px"});
}

function makePhenoGenoGraph(data) {
    var genoGraph = jQuery.extend(true, {}, datagraph);
    genoGraph.height=340;
    genoGraph.chartTitle = "Phentotype Genotype Distribution";
    genoGraph.xAxisLabel= "Number Of Associations";
    genoGraph.color.first = "#A4D6D4";
    genoGraph.init(".pheno-geno-container",data);
    var minWidth = genoGraph.width + genoGraph.margin.left + genoGraph.margin.right + 35;
    var minHeight = genoGraph.height + genoGraph.margin.top + genoGraph.margin.bottom;
    $(".pheno-geno-container").parent().parent()
        .css( {"min-width" : minWidth+"px", "min-height" : minHeight+"px"});
    $(".pheno-geno-container").parent()
        .css( {"width" : minWidth+"px", "height" : minHeight+125+"px"});
}

function makePhenoGeneGraph(data) {
    var geneGraph = jQuery.extend(true, {}, datagraph);
    geneGraph.height=400;
    geneGraph.chartTitle = "Phenotype Gene Annotation Distribution";
    geneGraph.xAxisLabel= "Number Of Genes";
    geneGraph.init(".pheno-gene-container",data);
}