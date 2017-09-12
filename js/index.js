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
import './search_form';
import './monarch-tabs';
import './lib/monarch/widget/facet-filters';

import 'font-awesome/css/font-awesome.min.css';
import '../css/monarch.less';
import '../css/monarch-common.css';
import '../css/monarch-specific.css';
import '../css/monarch-home.css';

//console.log('before import bbop:', Object.keys(bbop));
import _bbop from 'bbop';
var bbop = _bbop;
window.getAnnotationScore = require('exports-loader?getAnnotationScore!./monarch-common');


// Core browser/server libraries
import './lib/monarch/handler';
import './lib/monarch/linker';
import './lib/monarch/widget/browse';
import './lib/monarch/widget/display/results_table_by_class_conf_bs3';

import './jquery.cookie';
import './jquery.xml2json';

import './HomePage';
import '../css/bbop.css';
import './golr-table';
import './overview';
import './stupidtable.min';
import './Cluster';
window.InitTables = require('exports-loader?InitTables!./tables');

var bl = require('exports-loader?makeDiseaseLandingGraph,makePhenotypeLandingGraph,makeDiseaseLandingGraph,makeGeneDiseaseLandingGraph,makeGenotypeLandingGraph!./barchart-launcher.js');
global.makeDiseaseLandingGraph = bl.makeDiseaseLandingGraph;
global.makePhenotypeLandingGraph = bl.makePhenotypeLandingGraph;
global.makeGenotypeLandingGraph = bl.makeGenotypeLandingGraph;
global.makeDiseaseLandingGraph = bl.makeDiseaseLandingGraph;
global.bbop = bbop;

/* global loaderGlobals */

if (typeof loaderGlobals === 'object') {
	loaderGlobals.bbop = global.bbop;
	loaderGlobals.InitTabs = global.InitTabs;
	loaderGlobals.InitTables = global.InitTables;
	loaderGlobals.InitFacetFilters = global.InitFacetFilters;
	loaderGlobals.InitMonarchBBOPHandler = global.InitMonarchBBOPHandler;
	loaderGlobals.InitMonarchBBOPLinker = global.InitMonarchBBOPLinker;
	loaderGlobals.InitMonarchBBOPWidgetBrowse = global.InitMonarchBBOPWidgetBrowse;
	loaderGlobals.InitMonarchBBOPWidgetDisplay = global.InitMonarchBBOPWidgetDisplay;

	loaderGlobals.makeDiseaseLandingGraph = global.makeDiseaseLandingGraph;
	loaderGlobals.makePhenotypeLandingGraph = global.makePhenotypeLandingGraph;
	loaderGlobals.makeGenotypeLandingGraph = global.makeGenotypeLandingGraph;
	loaderGlobals.makeGeneDiseaseLandingGraph = global.makeGeneDiseaseLandingGraph;
	loaderGlobals.getTableFromSolr = global.getTableFromSolr;
	loaderGlobals.getOntologyBrowser = global.getOntologyBrowser;
}
