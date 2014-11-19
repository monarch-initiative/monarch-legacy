function makeHomePageGraph(data){
    /*var phenoGraph = 
        new bbop.monarch.datagraph(bbop.monarch.homePageConfig);
    phenoGraph.init(".graph-container",data);

    this.setMinHeightWidth(phenoGraph,".graph-container");*/
    var graphDiv = '.graph-container';
    this.makeTwoSizeGraph(data,graphDiv,
            bbop.monarch.homePageConfig,
            bbop.monarch.homePageConfigSmall,
            640,640)
}

function makeDiseaseGeneGraph(data){
    /*var disGraph = 
        new bbop.monarch.datagraph(bbop.monarch.diseaseGeneConfig);
    disGraph.init(".disease-gene-container",data);*/

    var graphDiv = ".disease-gene-container";
    this.makeTwoSizeGraph(data,graphDiv,
                          bbop.monarch.diseaseGeneConfig,
                          bbop.monarch.diseaseGeneConfigSmall,
                          1900,950)
}

function makePhenotypeAnnotationGraph(data){

    /*var phenoGraph = 
        new bbop.monarch.datagraph(bbop.monarch.phenotypeAnnotationConfig);
    phenoGraph.init(".graph-container",data);*/
    var graphDiv = ".graph-container";
    this.makeTwoSizeGraph(data,graphDiv,
            bbop.monarch.phenotypeAnnotationConfig,
            bbop.monarch.homePageConfig,
            1900,950)
}
                  
function makeDiseasePhenotypeGraph(data) {

    /*var disPhenoGraph = 
        new bbop.monarch.datagraph(bbop.monarch.diseasePhenotypeConfig);
    disPhenoGraph.init(".disease-pheno-container",data);*/
    
    var graphDiv = ".disease-pheno-container";
    this.makeTwoSizeGraph(data,graphDiv,
            bbop.monarch.diseasePhenotypeConfig,
            bbop.monarch.diseasePhenotypeConfigSmall,
            1900,950)
}

function makePhenoGenoGraph(data) {
    /*var genoGraph = 
        new bbop.monarch.datagraph(bbop.monarch.genotypePhenotypeConfig);
    genoGraph.init(".pheno-geno-container",data);*/
    
    var graphDiv = ".pheno-geno-container";
    this.makeTwoSizeGraph(data,graphDiv,
            bbop.monarch.genotypePhenotypeConfig,
            bbop.monarch.genotypePhenotypeConfigSmall,
            1900,950)
}

function makeTwoSizeGraph(data,graphDiv,largeConfig,smallConfig,width,height){

    var sizeTracker;
    var graphObject;
    //console.log($(window).width());
    //console.log(width);
      
    //Check screen size on page load
    if ($(window).width() > width && $(window).height() > height){
        graphObject = 
            new bbop.monarch.datagraph(largeConfig);
        graphObject.init(graphDiv,data);
        sizeTracker = 'large';
    } else {
        graphObject = 
            new bbop.monarch.datagraph(smallConfig);
        graphObject.init(graphDiv,data);
        sizeTracker = 'small';
    }
    this.setMinHeightWidth(graphObject,graphDiv);
    
    window.addEventListener('resize', function(event){
 
        if ($(window).width() > width && $(window).height() > height && sizeTracker != 'large'){
            $(graphDiv).children().remove();
            graphObject = 
                new bbop.monarch.datagraph(largeConfig);
            graphObject.init(graphDiv,data);
            this.setMinHeightWidth(graphObject,graphDiv);
            sizeTracker = 'large';
        } else if (sizeTracker != 'small') {
            $(graphDiv).children().remove();
            graphObject = 
                new bbop.monarch.datagraph(smallConfig);
            graphObject.init(graphDiv,data);
            this.setMinHeightWidth(graphObject,graphDiv);
            sizeTracker = 'small';
        }
    });
}

function setMinHeightWidth(graphObject,div){
    
    var minWidth = graphObject.config.width + graphObject.config.margin.left + graphObject.config.margin.right + 35;
    var minHeight = graphObject.config.height + graphObject.config.margin.top + graphObject.config.margin.bottom;

    if (_.isEqual($(div).parent(),$(div).parent('.panel.panel-default'))){
        $(div).parent().parent()
            .css( {"min-width" : minWidth+"px", "min-height" : minHeight+"px"});
        $(div).parent()
            .css( {"width" : minWidth+"px", "height" : minHeight+125+"px"});
    } else {
        $(div).parent()
            .css( {"width" : minWidth+"px", "height" : minHeight+125+"px"});
    }
}
