var {convChars}  =  require("./utils");

exports.middleware = function (next) {
   return function (request) {
       request.queryString = convChars(request.queryString);
       request.pathInfo = convChars(request.pathInfo);
       return next(request);
   };
};


