#!/bin/sh

for f in $(ls -1 ./ | grep '\.yaml' | sed 's/\.yaml//')
do
    sed 's/Gene Taxon/Species/g' $f.yaml > $f.yaml-bak
    mv $f.yaml-bak $f.yaml
done
