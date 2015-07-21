var env = require('../serverenv.js');

if (env.isRingoJS()) {
	load('lib/monarch/api.js');
	load('lib/monarch/web/widgets.js');
	load('lib/monarch/web/webapp.js');
}
else {
	eval(env.fs_readFileSync('lib/monarch/api.js')+'');
	eval(env.fs_readFileSync('lib/monarch/web/widgets.js')+'');
	eval(env.fs_readFileSync('lib/monarch/web/webapp.js')+'');
}
