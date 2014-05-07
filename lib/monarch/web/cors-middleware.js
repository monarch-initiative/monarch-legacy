/* from https://gist.github.com/botic/4633909 
   See http://bugs.jquery.com/ticket/8283  for limitations, including why
   this will not work in IE10*/

exports.middleware = function(next, app) {
   return function accessControl(request) {
      var response;
 
      if (request.method === "OPTIONS") {
         // Handle possible preflight requests
         response = {
            status: 204, // NO CONTENT
            headers: {
               "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
		"Access-Control-Allow-Headers": "X-Requested-With, Content-Type",
		"Access-Control-Allow-Credentials": true,
                "Access-Control-Max-Age": 120
            },
            body: [""]
         };
      } else {
         response = next(request);
      }
 
      // Globally set the Allow-Origin header for CORS
      response.headers["Access-Control-Allow-Origin"] = "*";
 
      return response;
   };
};
