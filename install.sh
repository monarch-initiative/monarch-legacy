#!/bin/sh

./installRingo.sh
./update_dependencies.sh
npm install
gulp assemble
