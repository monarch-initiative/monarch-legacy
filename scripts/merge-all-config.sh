#!/bin/sh

REF_DIR=../conf/golr-views
REF=oban-config.yaml
FILES=../conf/golr-views/single-tab/

echo "Merging YAML Files..."

for f in $(ls -1 $FILES | grep '\.yaml' | sed 's/\.yaml//')
do
    perl ./MergeYamlConf.pl --input $FILES/$f.yaml --reference $REF_DIR/$REF --output $REF_DIR/$f-$REF  
done

echo "done"

echo "Generating json conf file..."

perl ./confyaml2json.pl -i $REF_DIR >$REF_DIR/../golr-conf.json

echo "done"


