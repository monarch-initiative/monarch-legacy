#!/bin/sh

./installRingo.sh
npm install --force
gulp assemble
