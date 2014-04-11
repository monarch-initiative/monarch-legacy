#!/bin/sh
for file in target/*.ttl
do
    BASE=`basename $file .ttl`
    owltools $file -o -f ofn target/$BASE.owl 
done
