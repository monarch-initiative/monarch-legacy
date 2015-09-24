#!/bin/sh

./installRingo.sh
npm install --force
./node_modules/.bin/gulp assemble


# create Phenogrid bundle
cd node_modules/phenogrid
gulp bundle
