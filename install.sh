#!/bin/sh

echo "# install.sh for Monarch"
echo "# Checking Node and NPM versions"
npmv=`npm --version`
nodev=`node --version`
echo "npm: $npmv  node: $nodev"

npm install
./node_modules/.bin/gulp
# npm run build
NODE_ENV=production npm run wbs-webpack-build-prod

