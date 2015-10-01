// import angular from 'angular';
// import uirouter from 'angular-ui-router';

// import routing from './app.config';
// import landing from './features/landing';
// import about from './features/about';

// import "./themes/default/index.less";

// angular.module('app', [uirouter, landing, about])
//   .config(routing);

var jq = require('jquery');
window.jQuery = jq;
window.$ = jq;
global.jQuery = jq;

import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import '../css/monarch-common.css';
//import '../css/jquery-ui.css';

import 'underscore';
import './jquery-1.11.0.min.js';
import './jquery-ui-1.10.3.custom.min.js';
import 'bootstrap';
import 'd3';
import './search_form.js';
import './tabs.js';
import 'bbop';
window.getAnnotationScore = require("exports?getAnnotationScore!./monarch-common.js");
import './monarch.js';
import './jquery.cookie.js';
import './jquery.xml2json.js';

import './HomePage.js';
import '../css/bbop.css';
import './golr-table.js';
window.makeDiseaseLandingGraph = require("exports?makeDiseaseLandingGraph!./barchart-launcher.js");

