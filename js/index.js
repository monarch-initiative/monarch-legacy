/* global window */


var jq = require('jquery');
window.jQuery = jq;
window.$ = jq;
global.jQuery = jq;

import '../image/home-splash.png';
import '../image/partner-do.png';

import 'underscore';
import 'jquery-ui';
import 'jquery-ui/ui/widgets/autocomplete';
import 'jquery-ui/ui/widgets/draggable';

import d3 from 'd3';
console.log('d3 version(s)', d3.version, window.d3.version);
// window.d3 = d3;

import {navbar_search_init} from './search_form';
window.navbar_search_init = navbar_search_init;

import 'bootstrap-sass';
import 'patternfly/dist/js/patternfly.min.js';
import 'font-awesome/css/font-awesome.min.css';

import 'monarchSCSS';
import 'monarchHomeCSS';
import '../css/monarch-common.css';
import '../css/monarch-specific.css';
import '../css/team.css';
import '../css/sources.css';
import '../css/search_results.css';
import '../css/annotate.css';

import bbop from 'bbop';
window.bbop = bbop;
if (bbop.monarch) {
  console.log('Unexpected monarch field in imported bbop', bbop);
}
else {
  bbop.monarch = {
    widget: {}
  };
}


import {InitSearchResults} from './search_results.js';
window.InitSearchResults = InitSearchResults;

import {InitMonarchBBOPHandler} from './lib/monarch/handler';
window.InitMonarchBBOPHandler = InitMonarchBBOPHandler;

import {InitMonarchBBOPLinker} from './lib/monarch/linker';
window.InitMonarchBBOPLinker = InitMonarchBBOPLinker;

import {InitMonarchBBOPWidgetBrowse} from './lib/monarch/widget/browse';
window.InitMonarchBBOPWidgetBrowse = InitMonarchBBOPWidgetBrowse;

import {InitMonarchBBOPWidgetDisplay} from './lib/monarch/widget/display/results_table_by_class_conf_bs3';
window.InitMonarchBBOPWidgetDisplay = InitMonarchBBOPWidgetDisplay;

import './jquery.cookie';
import './jquery.xml2json';

import {InitHomePage} from './HomePage';
window.InitHomePage = InitHomePage;

import {
  InitMonarchPage,
  getAnnotationScore,
  remove_equivalent_ids,
  makeSpinnerDiv,
  add_species_to_autocomplete,
  fetchPubmedAbstract,
  fetchPubmedSummary,
  makeAuthorSpan,
} from './monarch-common';
window.InitMonarchPage = InitMonarchPage;
window.getAnnotationScore = getAnnotationScore;
window.remove_equivalent_ids = remove_equivalent_ids;
window.makeSpinnerDiv = makeSpinnerDiv;
window.add_species_to_autocomplete = add_species_to_autocomplete;
window.fetchPubmedAbstract = fetchPubmedAbstract;
window.fetchPubmedSummary = fetchPubmedSummary;
window.makeAuthorSpan = makeAuthorSpan;

import {getTableFromSolr} from './golr-table';
window.getTableFromSolr = getTableFromSolr;

import
{
  getOntologyBrowser,
  launchBrowser,
  fetchLiteratureOverview,
  fetchGeneDescription,
} from './overview';
window.getOntologyBrowser = getOntologyBrowser;
window.launchBrowser = launchBrowser;
window.fetchLiteratureOverview = fetchLiteratureOverview;
window.fetchGeneDescription = fetchGeneDescription;

import {AnalyzeInit} from './Analyze';
window.AnalyzeInit = AnalyzeInit;

import './stupidtable.min';

import {InitTables} from './tables';
window.InitTables = InitTables;

import {InitStyles} from './styles';
window.InitStyles = InitStyles;

import {InitTabs} from './monarch-tabs';
window.InitTabs = InitTabs;

import FacetFilters from './lib/monarch/widget/facet-filters';
window.InitFacetFilters = FacetFilters.InitFacetFilters;

import 'phenogrid';
// import '../node_modules/phenogrid/dist/phenogrid-bundle.css';
import '../node_modules/phenogrid/css/phenogrid.css';
import {loadPhenogrid} from './phenogridloader-onclick';
window.loadPhenogrid = loadPhenogrid;

import {
  makeDiseaseLandingGraph,
  makePhenotypeLandingGraph,
  makeGenotypeLandingGraph,
  makeGeneDiseaseLandingGraph,
  makeModelLandingGraph,
  monarch
} from 'imports-loader?monarch=>monarch!./barchart-launcher.js';
window.monarch = monarch;

window.makeDiseaseLandingGraph = makeDiseaseLandingGraph;
window.makePhenotypeLandingGraph = makePhenotypeLandingGraph;
window.makeGenotypeLandingGraph = makeGenotypeLandingGraph;
window.makeGeneDiseaseLandingGraph = makeGeneDiseaseLandingGraph;
window.makeModelLandingGraph = makeModelLandingGraph;

import {createExacTable} from './exac_table.js';
window.createExacTable = createExacTable;

import {createExaxGeneSummaryTable} from './exac_gene_summary.js';
window.createExaxGeneSummaryTable = createExaxGeneSummaryTable;
