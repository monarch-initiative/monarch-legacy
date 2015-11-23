function InitMonarch() {
    var jq = require('jquery');
    if (typeof(globalUseBundle) === 'undefined' || !globalUseBundle) {
        console.log('InitMonarch... using loaderGlobals bbop');
        var bbop = loaderGlobals.bbop;
    }
    else {
        console.log('InitMonarch... using require bbop');
        var bbop = require('bbop');
    }

// Module and namespace checking.
// if ( typeof bbop == "undefined" ){ var bbop = {}; }

if ( typeof bbop.monarch == "undefined" ){ bbop.monarch = {}; }
if ( typeof bbop.monarch.widget == "undefined" ){ bbop.monarch.widget = {}; }

if (typeof(loaderGlobals) === 'object') {
    loaderGlobals.bbop = bbop;
}
if (typeof(global) === 'object') {
    global.bbop = bbop;
}
if( typeof(exports) != 'undefined' ) {
    exports.bbop = bbop;
}

// This is a prefixing header fragment of a JS file. It opens up a function scope closed by 
// the loaderFooter.js file.
// These files sandwich the other files in scripts/release-file-map.txt
//
