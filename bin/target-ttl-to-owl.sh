#!/bin/sh
for file in target/*.ttl
do
    BASE=`basename $file .ttl`
    owltools $file --set-ontology-id http://purl.obolibrary.org/obo/upheno/data/$BASE.owl -o -f ofn target/$BASE.owl 
done
