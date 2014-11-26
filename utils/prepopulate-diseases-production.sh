#!/bin/sh
perl -npe 's/\t.*//;s/:/_/;chomp;print `wget monarchinitiative.org/disease/$_ -O /tmp/z.html`' $PH/data/Homo_sapiens/Hs-disease-labels.txt 
