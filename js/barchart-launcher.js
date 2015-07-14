function makeDoveGraph(data){

    var graphDiv = ".dove-container";
    var tree = new monarch.model.tree(data);
    
    // Some testing for the ajax version
    var personality = 'dovechart';
    var species_list = ["NCBITaxon:9606","NCBITaxon:10090","NCBITaxon:7955"];
    
    //golr_manager.set_personality(personality);
    var gene_filter = { field: 'subject_category', value: 'gene' };
    
    // global_golr_conf, global_solr_url, and scigrap_url are global variables
    // set in webapp.js using puptent
    var builder = new monarch.builder.tree_builder(global_solr_url, global_scigraph_url, global_golr_conf);
    builder.getCountsForSiblings('object_closure',species_list, gene_filter, personality);
    builder.getOntology('HP:0000118', 1);
    
    var initGraph = function(){ 
        jQuery("#graph-loader").hide();
    
        graphObject = 
            new monarch.dovechart(bbop.monarch.homePageConfig, tree, graphDiv);
    };
    
}

function makeHomePageGraph(data){

    var graphDiv = '.graph-container';
    this.makeTwoSizeGraph(data,graphDiv,
            bbop.monarch.homePageConfig,
            bbop.monarch.homePageConfigSmall,
            640,640)
}

function makeDiseaseGeneGraph(data){

    var graphDiv = ".disease-gene-container";
    this.makeTwoSizeGraph(data,graphDiv,
                          bbop.monarch.diseaseGeneConfig,
                          bbop.monarch.diseaseGeneConfigSmall,
                          1900,950)
}

function makePhenotypeAnnotationGraph(data){

    var graphDiv = ".graph-container";
    this.makeTwoSizeGraph(data,graphDiv,
            bbop.monarch.homePageConfig,
            bbop.monarch.homePageConfig,
            1900,950)
}
                  
function makeDiseasePhenotypeGraph(data) {
    
    var graphDiv = ".disease-pheno-container";
    this.makeTwoSizeGraph(data,graphDiv,
            bbop.monarch.diseasePhenotypeConfig,
            bbop.monarch.diseasePhenotypeConfigSmall,
            1900,950)
}

function makePhenoGenoGraph(data) {
    
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
