var env = require('serverenv.js');

if (env.isRingoJS()) {
	load('lib/monarch/web/webapp.js');
}
else {
	eval(env.fs_readFileSync('lib/monarch/web/webapp.js')+'');
}

console.log("end of webapp_launcher.js");
