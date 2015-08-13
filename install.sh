#!/bin/sh

./installRingo.sh
npm install --force
./node_modules/.bin/gulp assemble
