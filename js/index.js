/* global window */

var jq = require('jquery');
window.jQuery = jq;
window.$ = jq;
global.jQuery = jq;

import '../image/home-splash.png';
import '../image/partner-do.png';
// import '../node_modules/bootstrap/dist/css/bootstrap.min.css';

import 'underscore';
import 'bootstrap';
// '/bootstrap-theme.css',
import 'jquery-ui';
import 'jquery-ui/ui/widgets/autocomplete';
import 'jquery-ui/ui/widgets/draggable';

import 'd3';

import {navbar_search_init} from './search_form';
window.navbar_search_init = navbar_search_init;

import 'font-awesome/css/font-awesome.min.css';
import '../css/monarch.less';
import '../css/monarch-common.css';
import '../css/monarch-specific.css';
import '../css/monarch-home.css';

import bbop from 'bbop';
window.bbop = bbop;
if (bbop.monarch) {
  console.log('Unexpected monarch field in imported bbop', bbop);
}
else {
  bbop.monarch = {
    widget: {}
  }
}

// Core browser/server libraries
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

import '../css/bbop.css';
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

import './stupidtable.min';

import {InitTables} from './tables';
window.InitTables = InitTables;

import {InitTabs} from './monarch-tabs';
window.InitTabs = InitTabs;

import FacetFilters from './lib/monarch/widget/facet-filters';
window.InitFacetFilters = FacetFilters.InitFacetFilters;

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
