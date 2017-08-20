#
# Usage: runWebpackDevServer.sh [environmentName]
#	environmentName defaults to 'dev'
#	environmentName is passed to webapp_launcher.js
#

export environmentName=$1
echo "environmentName=${environmentName}"

rm -f webpack-assets.json
rm -rf dist
node_modules/.bin/webpack-dev-server --port 8081 --inline </dev/null &
echo "#Launched webpack-dev-server"
jobs

until [ -f webpack-assets.json ]
do
	echo "#Waiting for webpack-assets.json"
	sleep 1
done

echo "#Found webpack-assets.json"
jobs

USE_BUNDLE=1 USE_WEBPACK=1 NODE_PATH=lib/monarch \
	node_modules/nodemon/bin/nodemon.js -d 2 -V -- \
	lib/monarch/web/webapp_launcher.js ${environmentName}
