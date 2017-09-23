if (!jQuery) {
    var jQuery = require('jquery');
}
if (!_) {
    var _ = require('underscore');
}

import {monarch} from '../widgets/dove/dove';
import '../widgets/dove/css/dovegraph.css';

import './graph-config';

import {
    phenotypeGeneGolrSettings,
    phenotypeLandingConfig,
    diseaseGeneGolrSettings,
    geneLandingConfig,
    phenotypeGenotypeGolrSettings,
    genotypeLandingConfig,
    modelDiseaseGolrSettings,
    modelLandingConfig,
    diseasePhenotypeGolrSettings,
    diseaseLandingConfig,
    homePageConfig,
    homePageConfigSmall,
    diseaseGeneConfig,
    diseaseGeneConfigSmall,
    diseasePhenotypeConfig,
    diseasePhenotypeConfigSmall,
    genotypePhenotypeConfig,
    genotypePhenotypeConfigSmall,
    resizeConfig,
} from './graph-config';

function makePhenotypeLandingGraph(data){
    var graphDiv = ".dove-container";
    var tree = new monarch.model.tree(data);
    
    // global_golr_conf, global_solr_url, and scigrap_url are global variables
    // set in webapp.js using puptent
    var builder = new monarch.builder.tree_builder(global_solr_url, global_scigraph_url, global_golr_conf,
            tree, phenotypeGeneGolrSettings);
    
    var initGraph = function(){ 
        jQuery("#graph-loader").hide();
        tree = builder.tree;
        var graphObject = 
            new monarch.dovechart(phenotypeLandingConfig, tree, graphDiv, builder);
        setMinHeightWidth(graphObject, graphDiv);
    };
    builder.build_tree(['HP:0000118'], initGraph);
    
}

function makeGeneDiseaseLandingGraph(data){
    var graphDiv = ".gene-disease-container";
    var tree = new monarch.model.tree(data);

    // global_golr_conf, global_solr_url, and scigrap_url are global variables
    // set in webapp.js using puptent
    var builder = new monarch.builder.tree_builder(global_solr_url, global_scigraph_url, global_golr_conf,
            tree, diseaseGeneGolrSettings);
    
    var initGraph = function(){
        jQuery("#second-loader").hide();
        tree = builder.tree;
        var graphObject = 
            new monarch.dovechart(geneLandingConfig, tree, graphDiv, builder);
        setMinHeightWidth(graphObject, graphDiv);
    };
    builder.build_tree(['DOID:4'], initGraph);
    
}

function makeGenotypeLandingGraph(data){

    var graphDiv = ".dove-container";
    var tree = new monarch.model.tree(data);
    
    // global_golr_conf, global_solr_url, and scigrap_url are global variables
    // set in webapp.js using puptent
    var builder = new monarch.builder.tree_builder(global_solr_url, global_scigraph_url, global_golr_conf,
            tree, phenotypeGenotypeGolrSettings);
    
    var initGraph = function(){ 
        jQuery("#graph-loader").hide();
        tree = builder.tree;
        var graphObject = 
            new monarch.dovechart(genotypeLandingConfig, tree, graphDiv, builder);
        setMinHeightWidth(graphObject,graphDiv);
    };
    builder.build_tree(['HP:0000118'], initGraph);
    
}

function makeModelLandingGraph(data){
    var graphDiv = ".dove-container";
    var tree = new monarch.model.tree(data);

    // global_golr_conf, global_solr_url, and scigrap_url are global variables
    // set in webapp.js using puptent
    var builder = new monarch.builder.tree_builder(global_solr_url, global_scigraph_url, global_golr_conf,
            tree, modelDiseaseGolrSettings);
    
    var initGraph = function(){
        jQuery("#graph-loader").hide();
        tree = builder.tree;
        var graphObject = 
            new monarch.dovechart(modelLandingConfig, tree, graphDiv, builder);
        setMinHeightWidth(graphObject, graphDiv);
    };
    builder.build_tree(['DOID:4'], initGraph);
    
}

function makeDiseaseLandingGraph(data){

    var graphDiv = ".dove-container";
    var tree = new monarch.model.tree(data);

    
    // global_golr_conf, global_solr_url, and scigrap_url are global variables
    // set in webapp.js using puptent
    var builder = new monarch.builder.tree_builder(global_solr_url, global_scigraph_url, global_golr_conf,
            tree, diseasePhenotypeGolrSettings);
    
    var initGraph = function(){ 
        jQuery("#graph-loader").hide();
        tree = builder.tree;
        var graphObject = 
            new monarch.dovechart(diseaseLandingConfig, tree, graphDiv, builder);
        setMinHeightWidth(graphObject,graphDiv);
    };
    builder.build_tree(['DOID:4'], initGraph);
    
}


/*
 * The following are functions for the legacy graphs and will be removed
 */

function makeHomePageGraph(data){

    var graphDiv = '.graph-container';
    this.makeTwoSizeGraph(data,graphDiv,
            homePageConfig,
            homePageConfigSmall,
            640,640)
}

function makeDiseaseGeneGraph(data){

    var graphDiv = ".disease-gene-container";
    this.makeTwoSizeGraph(data,graphDiv,
                          diseaseGeneConfig,
                          diseaseGeneConfigSmall,
                          1900,950)
}

function makePhenotypeAnnotationGraph(data){

    var graphDiv = ".graph-container";
    this.makeTwoSizeGraph(data,graphDiv,
            homePageConfig,
            homePageConfig,
            1900,950)
}
                  
function makeDiseasePhenotypeGraph(data) {
    
    var graphDiv = ".disease-pheno-container";
    this.makeTwoSizeGraph(data,graphDiv,
            diseasePhenotypeConfig,
            diseasePhenotypeConfigSmall,
            1900,950)
}

function makePhenoGenoGraph(data) {
    
    var graphDiv = ".pheno-geno-container";
    this.makeTwoSizeGraph(data,graphDiv,
            genotypePhenotypeConfig,
            genotypePhenotypeConfigSmall,
            1900,950)
}

function makeTestGraph(data){
    
    var graphDiv = '.graph-container';
    this.makeResizableGraph(data,graphDiv,
            resizeConfig);
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
    setMinHeightWidth(graphObject,graphDiv);
    
    window.addEventListener('resize', function(event){
 
        if (jQuery(window).width() > width && jQuery(window).height() > height && sizeTracker != 'large'){
            jQuery(graphDiv).children().remove();
            graphObject = 
                new monarch.dovechart(largeConfig, tree, graphDiv);
            setMinHeightWidth(graphObject,graphDiv);
            sizeTracker = 'large';
        } else if (jQuery(window).width() < width && jQuery(window).height() < height && sizeTracker != 'small') {
            jQuery(graphDiv).children().remove();
            graphObject = 
                new monarch.dovechart(smallConfig, tree, graphDiv);
            setMinHeightWidth(graphObject,graphDiv);
            sizeTracker = 'small';
        }
    });
}

function makeResizableGraph(data,graphDiv,config){
    
    var graphObject = new bbop.monarch.datagraph(config);
    graphObject.init(graphDiv,data);
    setMinHeightWidth(graphObject,graphDiv);
    
    window.addEventListener('resize', function(event){
        setMinHeightWidth(graphObject,graphDiv);   
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


exports.makeDiseaseLandingGraph = makeDiseaseLandingGraph;
exports.makePhenotypeLandingGraph = makePhenotypeLandingGraph;
exports.makeGenotypeLandingGraph = makeGenotypeLandingGraph;
exports.makeGeneDiseaseLandingGraph = makeGeneDiseaseLandingGraph;
exports.makeModelLandingGraph = makeModelLandingGraph;
