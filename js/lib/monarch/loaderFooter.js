}	// Closes the InitMonarch function


console.log('define InitMonarch');
if (typeof(loaderGlobals) === 'object') {
    loaderGlobals.InitMonarch = InitMonarch;
    // console.log('define InitMonarch loaderGlobals', loaderGlobals);
    // console.log('define InitMonarch bbop', bbop);
    // console.log('define InitMonarch loaderGlobals.bbop', loaderGlobals.bbop);
}
if (typeof(global) === 'object') {
    global.InitMonarch = InitMonarch;
    console.log('define InitMonarch global');
}
