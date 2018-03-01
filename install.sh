#!/bin/sh

echo "# install.sh for Monarch"
echo "# Checking Node and NPM versions"
npmv=`npm --version`
nodev=`node --version`
echo "npm: $npmv  node: $nodev"

npm install
./node_modules/.bin/gulp

./node_modules/.bin/webpack -p --config=utils/bbop-webpack.config.js
./node_modules/.bin/webpack -p --config=utils/phenogrid-webpack.config.js

NODE_ENV=production npm run wbs-webpack-build-prod
