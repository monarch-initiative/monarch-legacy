#!/bin/sh

rm -rf node_modules
./installRingo.sh
npm install
gulp assemble
