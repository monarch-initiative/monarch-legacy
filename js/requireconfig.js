//
//  requireconfig.js
//
//  This file is included when env variable USE_BUNDLE is not defined or not equal to '1',
//  which we will call non-bundled or Legacy Mode.
//  The Monarch UI uses [RequireJS](http://requirejs.org) in this case (non-bundled mode), to 
//  load various JS files and modules, and to ensure they are loaded in the correct order.
//

console.log('requireconfig.js');

require(['require', 'jquery'], function (_require, _jquery) {
    window.$ = _jquery;
    window.require = _jquery;
    window.jQuery = _jquery;
    window.jquery = _jquery;
    jQuery = _jquery;
    $ = _jquery;
    require = _require;
    window.require = _require;
    exports = {};
    _require(['jquery-ui', '/bootstrap.min.js', 'underscore', 'core', 'widget'], function () {
        _require(['/d3.min.js', '/search_form.js', '/bbop.js'], function (a, b, c) {
            bbop = exports.bbop;
            loaderGlobals.bbop = bbop;
            console.log('requireconfig exports:', bbop);
            _require(['/monarch-common.js',
                '/linker.js', '/handler.js', '/browse.js', '/results_table_by_class_conf_bs3.js', '/facet-filters.js'], function () {
                _require(['/search_form.js', '/monarch-tabs.js',
                         '/jquery.cookie.js', '/jquery.xml2json.js', '/HomePage.js', '/stupidtable.min.js', '/tables.js',
                         '/dove.min.js', '/golr-table.js', '/overview.js'], function () {
                    _require(['/barchart-launcher.js'], function (bl) {
                        loader();
                    });
                });
            });
        });
    });
});

requirejs.config({
    waitSeconds: 0,
    baseUrl: '/',
    paths: {
        // the left side is the module ID,
        // the right side is the path to
        // the jQuery file, relative to baseUrl.
        // Also, the path should NOT include
        // the '.js' file extension. This example
        // is using jQuery 1.9.0 located at
        // js/lib/jquery-1.9.0.js, relative to
        // the HTML page.
        jquery: 'jquery.min'
    }
});
