#!/bin/sh

echo "# install.sh for Monarch"
echo "# Checking Node and NPM versions"
npmv=`npm --version`
nodev=`node --version`
echo "npm: $npmv  node: $nodev"

# if [ "$npmv" != "3.4.0" ]; then
# 	echo "npm version $npmv does not match the required 3.4.0"
# #	exit 0
# fi

# if [ "$nodev" != "v0.12.2" ]; then
# 	echo "npm version $nodev does not match the required v0.12.2"
# #	exit 0
# fi

# echo "# Versions OK, continuing with installation."

#./installRingo.sh
npm install
./node_modules/.bin/gulp
rm -rf dist/*
./node_modules/webpack/bin/webpack.js --config webpack.build.js --bail
