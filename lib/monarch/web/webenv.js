var env = require('serverenv.js');
var _ = require('underscore');

//
// This code provides an abstract interface to the NodeJS webserver, in this case,
// HAPI.js, as well as several utility functions related to handing web requests.
//
// Basic idea is to adopt the RingoJS of returning an object from a route handler.
// The Response object has the structure:
//  {
//      status: 200,    // HTTP status code
//      headers: ['Content-Type', 'text/html'],
//      body: ["Body Text Here"]
//  }
//
//  In Hapi, we build the Response object using convenience methods like
//  wrapHTML() and wrapJSON().
//
// EXAMPLE:
//  The following example shows how we can define a route handler:
//
//    web.wrapRouteGet(app, '/page/{page}', ['page'],
//         function(request, page) {
//             var info = {};
//             addCoreRenderers(info);
//
//             var output = pup_tent.render(page+'.mustache',info);
//             return web.wrapHTML(output);
//         }
//    );
//


// The kinds of types that we're likely to see.
var fileExtensionToTypes = {
    'js': {
            mimeType: 'application/javascript',
            encoding: 'utf8'
    },
    'css': {
            mimeType: 'text/css',
            encoding: 'utf8'
    },
    'map': {
            mimeType: 'text/css',
            encoding: 'utf8'
    },
    'json': {
            mimeType: 'application/json',
            encoding: 'utf8'
    },
    'yaml': {
            mimeType: 'application/yaml',
            encoding: 'utf8'
    },
    'sfnt': {
            mimeType: 'application/font-sfnt',
            encoding: 'binary'
    },
    'woff': {
            mimeType: 'application/font-woff',
            encoding: 'binary'
    },
    'woff2': {
            mimeType: 'application/font-woff2',
            encoding: 'binary'
    },
    'html': {
            mimeType: 'text/html',
            encoding: 'utf8'
    },
    'png': {
            mimeType: 'image/png',
            encoding: 'binary'
    },
    'svg': {
            mimeType: 'image/svg+xml',
            encoding: 'utf8'
    },
    'mustache': {
            mimeType: 'text/html',
            encoding: 'utf8'
    },
    'ttf': {
            mimeType: 'application/x-font-truetype',
            encoding: 'binary'
    }
};

function getFileInfo(filePath) {
  var extensionMatch = filePath.match(/^.+\.(.+)$/);
  var defaultResult = {
    mimeType: 'application/octet-stream',
    encoding: 'binary'
  };
  var result = defaultResult;

  if (extensionMatch) {
    var extension = extensionMatch[1];
    result = fileExtensionToTypes[extension];
  }

  if (!result) {
    result = defaultResult;
  }

  // console.log('getFileInfo: ', filePath, '-->', extension, '-->', result);

  return result;
}

function getEncodingForMimeType(mimeType) {
    var result = 'utf8';

    _.each(fileExtensionToTypes, function(t) {
        if (t.mimeType === mimeType) {
            result = t.encoding;
        }
    });

    // console.log('#getEncodingForMimeType(', mimeType, '):', result);
    return result;
}


/* eslint no-inner-declarations: 0 */

var WaitFor = require('wait.for');

function getParam(request, name) {
    var result = request.params[name];
    if (!result && request.query) {
        result = request.query[name];
    }
    if (!result && request.payload) {
        result = request.payload[name];
    }

    return result;
}

function wrapRedirect(uri) {
    var result = {
            status: 302,
            headers: {},    // "Content-Type": 'text/html'},
            body: [],
            uri: uri
        };

    return result;
}

function wrapResponse(request, reply, output) {
    var response = reply(output.body);

    var cdisp = output.headers['Content-Disposition'];
    if (cdisp && cdisp.length > 0) {
        response.header('Content-Disposition', cdisp);
    }

    response.header('X-Custom', 'some-value');

    var ctype = output.headers['Content-Type'] || output.headers['content-type'];
    response.type(ctype);
    response.encoding(getEncodingForMimeType(ctype));
    if (output.status === 302) {
        response.redirect(output.uri);
    }

    return output;
}

function wrapHTML(output, status) {
    var result = {
            status: status || 200,
            headers: {"Content-Type": 'text/html'},
            body: output
        };

    return result;
}

function wrapTEXT(output) {
    return {
        status: 200,
        headers: {"Content-Type": 'text/plain'},
        body: output
    };
}

function wrapFile(output, fileName) {
    var disposition = 'attachment; filename="' + fileName + '"';
    return {
        status: 200,
        headers: {"Content-Type": 'application/octet-stream',
                  "Content-Disposition": disposition},
        body: output
    };
}

function wrapBinary(output, ctype) {
    console.log('wrapBinary ctype:', ctype);
    return {
        body: output,
        headers: {'Content-Type': ctype},
        status: 200
    };
}

function wrapJSON(output) {
    var result = {
            status: 200,
            headers: {"Content-Type": 'application/json'},
            body: output
        };

    return result;
}

function wrapContent(filePath) {
    var fileInfo = getFileInfo(filePath);
    var result;

    if (env.fs_existsSync(filePath)) {
        var ctype = fileInfo.mimeType;
        var output = 'Unknown encoding for: ' + filePath;
        if (fileInfo.encoding === 'utf8') {
          output = env.fs_readFileSync(filePath) + '';
        }
        else if (fileInfo.encoding === 'binary') {
          output = env.fs_readFileSyncBinary(filePath);
        }

        // console.log('###wrapContent(', filePath, ') info:', fileInfo, ' output[', typeof output, '] length:', output.length);
        result = {
                    status: 200,
                    headers: {"Content-Type": ctype},
                    body: output
                };
    }
    else {
        console.log('###wrapContent(', filePath, ') does not exist');
        result = null;
    }
    return result;
}

function wrapRouteGet(app, hapiPath, props, commonHandler, errorHandler) {
    var that = this;
    function wrappedHandler(request, reply) {
        WaitFor.launchFiber(
            function () {
                if (true) /*try*/ {
                    var     vals = [request];
                    for (var propIndex in props) {
                        vals.push(request.params[props[propIndex]]);
                    }

                    var output = commonHandler.apply(that, vals);
                    wrapResponse(request, reply, output);
                }
                // catch(err) {
                //     console.log('wrapRouteGet err:', Object.keys(err));
                //     console.log('wrapRouteGet err:', err);

                //     var errorStatus = err.status;
                //     var errorMessage = err.message;

                //     if (errorHandler) {
                //         var output = errorHandler(errorStatus, errorMessage);
                //         wrapResponse(request, reply, output);
                //     }
                //     else {
                //         console.log('webenv.wrapRouteGet() rethrowing error:' + err);
                //         throw err;
                //     }
                // }
            });
    }

    app.route({
        method: 'GET',
        path: hapiPath,
        handler: wrappedHandler
    });
}

function wrapRoutePost(app, hapiPath, props, commonHandler, errorHandler) {
    var that = this;
    function wrappedHandler(request, reply) {
        WaitFor.launchFiber(
            function () {
                try {
                    var     vals = [request];
                    for (var propIndex in props) {
                        vals.push(request.params[props[propIndex]]);
                    }

                    var output = commonHandler.apply(that, vals);
                    wrapResponse(request, reply, output);
                }
                catch(err) {
                    var errorStatus = err.status;
                    var errorMessage = err.message;

                    if (errorHandler) {
                        var output = errorHandler(errorStatus, errorMessage);
                        wrapResponse(request, reply, output);
                    }
                    else {
                        console.log('webenv.wrapRoutePost() rethrowing error:' + err);
                        throw err;
                    }
                }
            });
    }

    app.route({
        method: 'POST',
        path: hapiPath,
        handler: wrappedHandler
    });
}


exports.getParam = getParam;
exports.wrapRedirect = wrapRedirect;
exports.wrapResponse = wrapResponse;
exports.wrapHTML = wrapHTML;
exports.wrapTEXT = wrapTEXT;
exports.wrapBinary = wrapBinary;
exports.wrapJSON = wrapJSON;
exports.wrapFile = wrapFile;
exports.wrapRouteGet = wrapRouteGet;
exports.wrapRoutePost = wrapRoutePost;
exports.wrapContent = wrapContent;
exports.getFileInfo = getFileInfo;
