// import angular from 'angular';
// import uirouter from 'angular-ui-router';

// import routing from './app.config';
// import landing from './features/landing';
// import about from './features/about';

// import "./themes/default/index.less";

// angular.module('app', [uirouter, landing, about])
//   .config(routing);

var $ = require('jquery');
window.jQuery = $;
window.$ = $;

//import '../css/bootstrap.min.css';
//import '../css/monarch-common.css';
//import '../css/jquery-ui.css';

import './underscore-min.js';
import './jquery-1.11.0.min.js';
import './jquery-ui-1.10.3.custom.min.js';
import './bootstrap.min.js';
import './d3.min.js';
import './search_form.js';
import './tabs.js';
window.getAnnotationScore = require("exports?getAnnotationScore!./monarch-common.js");
window.makeDiseaseLandingGraph = require("exports?makeDiseaseLandingGraph!./barchart-launcher.js");
import 'bbop';
import './monarch.js';
import './golr-table.js';
import './jquery.cookie.js';
import './jquery.xml2json.js';

import './HomePage.js';