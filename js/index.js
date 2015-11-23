// import angular from 'angular';
// import uirouter from 'angular-ui-router';

// import routing from './app.config';
// import landing from './features/landing';
// import about from './features/about';

// import "./themes/default/index.less";

// angular.module('app', [uirouter, landing, about])
//   .config(routing);

// require("babel-core/register");

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
// import './jquery-1.11.0.min.js';
// import './jquery-ui-1.10.3.custom.min.js';
import 'd3';
import './search_form.js';
import './search-results.js';
import './monarch-tabs.js';

import '../css/monarch.less';
import '../css/monarch-specific.css';
import '../css/monarch-main.css';
import '../css/monarch-home.css';
import '../css/monarch-common.css';

//console.log('before import bbop:', Object.keys(bbop));
import _bbop from 'bbop';
var bbop = _bbop;
window.getAnnotationScore = require("exports?getAnnotationScore!./monarch-common.js");

import './monarch.js';
import './jquery.cookie.js';
import './jquery.xml2json.js';

import './HomePage.js';
import '../css/bbop.css';
import './golr-table.js';
import './stupidtable.min.js';
window.InitTables = require("exports?InitTables!./tables.js");

var bl = require("exports?makeDiseaseLandingGraph,makePhenotypeLandingGraph,makeDiseaseLandingGraph,makeGeneDiseaseLandingGraph,makeGenotypeLandingGraph!./barchart-launcher.js");
global.makeDiseaseLandingGraph = bl.makeDiseaseLandingGraph;
global.makePhenotypeLandingGraph = bl.makePhenotypeLandingGraph;
global.makeGenotypeLandingGraph = bl.makeGenotypeLandingGraph;
global.makeDiseaseLandingGraph = bl.makeDiseaseLandingGraph;
global.bbop = bbop;
console.log('index.js bbop:', bbop);
if (typeof(loaderGlobals) === 'object') {
	loaderGlobals.bbop = global.bbop;
	loaderGlobals.InitTabs = global.InitTabs;
	loaderGlobals.InitTables = global.InitTables;
	loaderGlobals.InitMonarch = global.InitMonarch;
	loaderGlobals.makeDiseaseLandingGraph = global.makeDiseaseLandingGraph;
	loaderGlobals.makePhenotypeLandingGraph = global.makePhenotypeLandingGraph;
	loaderGlobals.makeGenotypeLandingGraph = global.makeGenotypeLandingGraph;
	loaderGlobals.makeGeneDiseaseLandingGraph = global.makeGeneDiseaseLandingGraph;
	loaderGlobals.getTableFromSolr = global.getTableFromSolr;
	loaderGlobals.getOntologyBrowser = global.getOntologyBrowser;
}
