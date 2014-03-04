#!/bin/sh
find ./cache -name "*.json" -exec rm -rf {} \;
rm log
sh ./start-server.sh >log 2>&1
