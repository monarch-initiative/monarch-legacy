#!/bin/sh
cut -f2 $PH/data/Homo_sapiens/Hs-disease-to-phenotype-O.txt | sort -u  | perl -npe 's/\t.*//;s/:/_/;chomp;print `wget monarchinitiative.org/phenotype/$_ -O /tmp/z.html`' 

