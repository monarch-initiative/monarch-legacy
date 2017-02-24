var joi = require('joi');
var env = require('serverenv.js');
var _ = require('underscore');
var useSwagger = false;

// Utility function to determine NodeJS vs RingoJS runtime environment
function isRingoJS() {
  return (typeof(org) != 'undefined' && typeof(org.ringo) != 'undefined' );
}

//
// Must be called before any wrapGet/Post calls
//
function setSwagger(enabled) {
    useSwagger = enabled;
}

//
// Abstractions over the Ringo/stick vs Node/HAPI http server interfaces.
//
// The goal:
//     Minimizing the changes to the existing RingoJS code base, specifically webapp.js, figure out a way
//  to avoid code duplication and allow the web application to be served via RingoJS and stick as well as via
//  NodeJS and HAPI.js.
//
// Challenges:
//  Different route syntaxes: '/docs/:file' vs '/docs/{file}'
//  Different route handler signatures. stick extracts values from URL path and makes them formal arguments
//  to the handler. Hapi extracts values and places them into the request.params object.
//  stick handlers write to the output by returning objects with .headers, .status, and .body fields; Hapi
//  handlers write to output by invoking methods on the 'reply' object.
//  stick handlers can invoke blocking operations, NodeJS handlers that block (without using Fibers or something)
//  will result in an unresponsive webserver while blocked.
//
// Solution:
// Basic idea is to adopt the RingoJS of returning an object from a route handler. The object (call it a Response
// to distinguish it from the ringojs 'response' module) has the structure:
//  {
//      status: 200,    // HTTP status code
//      headers: ['Content-Type', 'text/html'],
//      body: ["Body Text Here"]
//  }
//
//  Ringo uses static methods on the require('response') module to build these
//  Response structures. For example, the above example may be built (in
//  Ringo) with:
//      response.html("Body Text Here");
//
//  In Hapi, we must build the Response object explicitly. In order to have fewer conditionals, there are
//  wrappers provided below, wrapHTML() and wrapJSON(), which either invoke the Ringo response.html() or
//  response.json() methods, or construct the response object explicitly in Hapi:
//      wrapHTML("Body Text Here")
//
// EXAMPLE:
//  The following example shows how we can define a route using both stick and hapi syntax and still
//  enable a single handler definition to be used:
//
//    web.wrapRouteGet(app, '/page/:page', '/page/{page}', ['page'],
//         function(request, page) {
//             var info = {};
//             addCoreRenderers(info);

//             if ((page !== 'software')){
//                 info.pup_tent_css_libraries.push("/tour.css");
//             } else {
//                 info.pup_tent_css_libraries.push("/monarch-main.css");
//             }

//             var output = pup_tent.render(page+'.mustache',info);
//             return web.wrapHTML(output);
//         }
//    );
//
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

if (isRingoJS()) {
    var response = require('ringo/jsgi/response');

    function getParam(request, name) {
        return request.params[name];
    }

    function wrapRedirect(uri) {
        return response.redirect(uri);
    }

    function wrapResponse(request, reply, output) {
        return output;
    }

    function wrapHTML(output, status) {
        var result = response.html(output);
        if (status) {
            result.status = status;
        }
        return result;
    }
    

    function wrapJSON(output) {
        return response.json(output);
    }

    function wrapTEXT(output) {
        return {
            status: 200,
            headers: {"Content-Type": 'text/plain'},
            body: [output]
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
        return {
            body: [output],
            headers: {'Content-Type': ctype},
            status: 200
        };
    }

    function wrapRouteGet(app, ringoPath, hapiPath, props, commonHandler, errorHandler) {
        var that = this;
        function wrappedHandler(request, reply) {
            try {
                var output = commonHandler.apply(that, arguments);
                return wrapResponse(request, reply, output);
            }
            catch(err) {
                console.log('wrapRouteGet err:', Object.keys(err));
                console.log('wrapRouteGet err:', err);
                var errorStatus = err.status;
                var errorMessage = err.message;

                if (errorHandler) {
                    return errorHandler(errorStatus, errorMessage);
                }
                else {
                    console.log('webenv.wrapRouteGet() rethrowing error:' + err);
                    throw err;
                }
            }
        }

        app.get(ringoPath, wrappedHandler);
    }

    function wrapRoutePost(app, ringoPath, hapiPath, props, commonHandler, errorHandler) {
        var that = this;
        function wrappedHandler(request, reply) {
            try {
                var output = commonHandler.apply(that, arguments);
                return wrapResponse(request, reply, output);
            }
            catch(err) {
                var errorStatus = err.status;
                var errorMessage = err.message;

                if (errorHandler) {
                    return errorHandler(errorStatus, errorMessage);
                }
                else {
                    console.log('webenv.wrapRoutePost() rethrowing error:' + err);
                    throw err;
                }
            }
        }
        app.post(ringoPath, wrappedHandler);
    }
}
else {
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

    // function wrapContent(filePath) {
    //     var fileInfo = getFileInfo(filePath);
    //     var result;

    //     if (env.fs_existsSync(filePath)) {
    //         var ctype = fileInfo.mimeType;
    //         var output = 'Unknown encoding for: ' + filePath;
    //         if (fileInfo.encoding === 'utf8') {
    //           output = env.fs_readFileSync(filePath) + '';
    //         }
    //         else if (fileInfo.encoding === 'binary') {
    //           output = env.fs_readFileSyncBinary(filePath);
    //         }

    //         // console.log('###wrapContent(', filePath, ') info:', fileInfo, ' output[', typeof output, '] length:', output.length);
    //         result = {
    //                     status: 200,
    //                     headers: {"Content-Type": ctype},
    //                     body: output
    //                 };
    //     }
    //     else {
    //         console.log('###wrapContent(', filePath, ') does not exist');
    //         result = null;
    //     }
    //     return result;
    // }


    function getPropsFromHapiPath(hapiPath) {
        var re = /([^\{]*)\{([^\}]+)\}/g;
        var result = [];
        var seg;
        while (seg = re.exec(hapiPath)) {
            result.push(seg[2]);
        }

        return result;
    }

    function getPropsFromDocInfo(docInfo) {
        var result = [];

        if (docInfo && docInfo.paramInfo) {
            result = Object.keys(docInfo.paramInfo);
        }

        return result;
    }

    function getPathElementsFromHapiPath(hapiPath) {
        var lbracePos = hapiPath.indexOf('{');
        var pathPrefix = (lbracePos < 0) ? hapiPath : hapiPath.slice(0, lbracePos - 1);
        var pathElements = pathPrefix.split('/').slice(1);
        if (pathElements.length > 0) {
            if (pathElements[pathElements.length - 1].length == 0) {
                pathElements.pop();
            }
        }
        return pathElements;
    }

    function wrapStatic(app, hapiPath, filePrefix) {
        var props = getPropsFromHapiPath(hapiPath);
        app.route({
            method: 'GET',
            path: hapiPath,
            handler: function (request, reply) {
                reply.file(filePrefix + request.params[props[0]]);
            }
        });
    }


    function wrapMethod(app, method, hapiPath, commonHandler, errorHandler, docInfo) {
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
                });
        }


        var config = { handler: wrappedHandler };

        if (!useSwagger || docInfo === false) {
            // Inhibit docs
        }
        else {
            var props = getPropsFromHapiPath(hapiPath);
            var docInfoProps = getPropsFromDocInfo(docInfo);
            props = _.union(props, docInfoProps);
            var pathElements = getPathElementsFromHapiPath(hapiPath);
            var group = '';
            var item = ' ';
            if (pathElements.length === 1) {
                item = pathElements[0];
            }
            else if (pathElements.length > 1) {
                group = pathElements[0];
                item = pathElements[1];
            }
            var itemCap = '/' + item[0].toUpperCase() + item.slice(1);

            var params = {};
            props.forEach(function(i) {
                var ptype = 'string';
                var pdesc = 'Additional parameter "' + i + '"';
                var prequired = false;
                var pdefault = null;

                if (i === 'id') {
                    pdesc = 'Which Entity ID to get information about';
                    prequired = true;
                }
                else if (i === 'fmt') {
                    pdesc = 'The output format for the result';
                    pdefault = 'json';
                }

                if (docInfo && docInfo.paramInfo) {
                    var pinfo = docInfo.paramInfo[i];
                    if (pinfo) {
                        ptype = pinfo.type || ptype;
                        pdesc = pinfo.description || pdesc;
                        prequired = pinfo.required || prequired;
                        pdefault = pinfo.default || pdefault;
                    }
                }

                var p = joi.string();   // Consult ptype in the future
                p = p.description(pdesc);
                if (pdefault) {
                    p = p.default(pdefault);
                }
                if (prequired) {
                    p = p.required();
                }

                params[i] = p;
            });

            var description = 'Get Information about (' + item + ') by: ' + props;
            var notes = null;
            if (docInfo) {
                if (docInfo.description) {
                    description = docInfo.description;
                }
                if (docInfo.notes) {
                    notes = docInfo.notes;
                }
            }
            if (!notes) {
                notes = description;
            }

            Object.assign(config,
                            {
                                description: description,
                                notes: notes,
                                tags: ['api'],
                                validate: {
                                    params: params
                                }
                            });
        }

        app.route({
            method: method,
            path: hapiPath,
            config: config
        });
    }



    function wrapGet(app, hapiPath, commonHandler, errorHandler, docInfo) {
       wrapMethod(app, 'GET', hapiPath, commonHandler, errorHandler, docInfo);
    }



    function wrapPost(app, hapiPath, commonHandler, errorHandler, docInfo) {
       wrapMethod(app, 'POST', hapiPath, commonHandler, errorHandler, docInfo);
    }


    function wrapRouteGet(app, ringoPath, hapiPath, props, commonHandler, errorHandler) {
        wrapGet(app, hapiPath, commonHandler, errorHandler, props.length > 0 ? {} : false);
    }

    function wrapRoutePost(app, ringoPath, hapiPath, props, commonHandler, errorHandler) {
        wrapPost(app, hapiPath, commonHandler, errorHandler, props.length > 0 ? {} : false);
    }

}


exports.setSwagger = setSwagger;
exports.getParam = getParam;
exports.wrapRedirect = wrapRedirect;
exports.wrapResponse = wrapResponse;
exports.wrapHTML = wrapHTML;
exports.wrapTEXT = wrapTEXT;
exports.wrapBinary = wrapBinary;
exports.wrapJSON = wrapJSON;
exports.wrapFile = wrapFile;
exports.wrapStatic = wrapStatic;
exports.wrapGet = wrapGet;
exports.wrapPost = wrapPost;
exports.wrapRouteGet = wrapRouteGet;
exports.wrapRoutePost = wrapRoutePost;
// exports.wrapContent = wrapContent;
exports.getFileInfo = getFileInfo;
