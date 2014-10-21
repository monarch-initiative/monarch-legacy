#!/bin/sh
find ./cache/anatomy -name "*.json" -exec rm -rf {} \;
find ./cache/class -name "*.json" -exec rm -rf {} \;
find ./cache/disease -name "*.json" -exec rm -rf {} \;
find ./cache/gene -name "*.json" -exec rm -rf {} \;
find ./cache/genotype -name "*.json" -exec rm -rf {} \;
find ./cache/overview -name "*.json" -exec rm -rf {} \;
find ./cache/phenotype -name "*.json" -exec rm -rf {} \;
find ./cache/phenotypeprofile -name "*.json" -exec rm -rf {} \;
rm log
sh ./start-server.sh >log 2>&1
