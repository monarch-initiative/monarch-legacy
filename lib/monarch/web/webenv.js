// Utility function to determine NodeJS vs RingoJS runtime environment
function isRingoJS() {
  return (typeof(org) != 'undefined' && typeof(org.ringo) != 'undefined' );
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
//  Ringo uses static methods on the require('response') module to build these Response structures. For example, the above example
//  may be built (in Ringo) with:
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
        var ctype = output.headers['Content-Type'];
        if (ctype != 'text/html') {
            response.type(ctype);
        }
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

    function wrapBinary(output, ctype) {
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

    function wrapRouteGet(app, ringoPath, hapiPath, props, commonHandler, errorHandler) {
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

    function wrapRoutePost(app, ringoPath, hapiPath, props, commonHandler, errorHandler) {
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

}


exports.getParam = getParam;
exports.wrapRedirect = wrapRedirect;
exports.wrapResponse = wrapResponse;
exports.wrapHTML = wrapHTML;
exports.wrapTEXT = wrapTEXT;
exports.wrapBinary = wrapBinary;
exports.wrapJSON = wrapJSON;
exports.wrapRouteGet = wrapRouteGet;
exports.wrapRoutePost = wrapRoutePost;
