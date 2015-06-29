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
            bbop.monarch.homePageConfig,
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

function makeTestGraph(data){
    
    var graphDiv = '.graph-container';
    this.makeResizableGraph(data,graphDiv,
            bbop.monarch.resizeConfig);
}

function makeDoveGraph(data){

    var graphDiv = ".dove-container";
    var tree = new monarch.model.tree(data);
    graphObject = 
        new monarch.dovechart(bbop.monarch.homePageConfig, tree, graphDiv);
}

function makeTwoSizeGraph(data,graphDiv,largeConfig,smallConfig,width,height){

    var sizeTracker;
    var graphObject;
    var tree = new monarch.model.tree(data);
      
    //Check screen size on page load
    if (jQuery(window).width() > width && jQuery(window).height() > height){
        graphObject = 
            new monarch.dovechart(largeConfig, tree, graphDiv);
        sizeTracker = 'large';
    } else {
        graphObject = 
            new monarch.dovechart(smallConfig, tree, graphDiv);
        sizeTracker = 'small';
    }
    this.setMinHeightWidth(graphObject,graphDiv);
    
    window.addEventListener('resize', function(event){
 
        if (jQuery(window).width() > width && jQuery(window).height() > height && sizeTracker != 'large'){
            jQuery(graphDiv).children().remove();
            graphObject = 
                new monarch.dovechart(largeConfig, tree, graphDiv);
            this.setMinHeightWidth(graphObject,graphDiv);
            sizeTracker = 'large';
        } else if (jQuery(window).width() < width && jQuery(window).height() < height && sizeTracker != 'small') {
            jQuery(graphDiv).children().remove();
            graphObject = 
                new monarch.dovechart(smallConfig, tree, graphDiv);
            this.setMinHeightWidth(graphObject,graphDiv);
            sizeTracker = 'small';
        }
    });
}

function makeResizableGraph(data,graphDiv,config){
    
    var graphObject = new bbop.monarch.datagraph(config);
    graphObject.init(graphDiv,data);
    this.setMinHeightWidth(graphObject,graphDiv);
    
    window.addEventListener('resize', function(event){
        this.setMinHeightWidth(graphObject,graphDiv);   
    });
}

// Run all all landing pages.
function setMinHeightWidth (graphObject, div){

    var conf = graphObject.config

    // Figure out what mins we want.
    var minWidth = conf.width + conf.margin.left + conf.margin.right + 35;
    //var minHeight = conf.height + conf.margin.top + conf.margin.bottom;
    
    if( _.isEqual(jQuery(div).parent(),
              jQuery(div).parent('.panel.panel-default')) ){
        jQuery(div).parent().parent().css({
            "min-width": minWidth + "px"//,
            //"min-height": minHeight + "px"
        });
        jQuery(div).parent().css({
            "min-width": minWidth + "px"//,
            //"height": minHeight + 125 + "px"
        });
    }else{
        jQuery(div).parent().css({
        "min-width": minWidth + "px"//,
        //"height": minHeight + 125 + "px"
    });
    }
    jQuery(div).parent().parent().css({
    "min-width": minWidth + "px"//,
    //"height": minHeight + 125 + "px"
    });
}
