## About

Utilities for running and managing hte Monarch (monarchinitiative.org)
set of services

## Siegerunner.py

A utility script for running the siege load testing tool
(http://www.joedog.org/siege-home/)

Requirements 

* Python 2.x, residing at /usr/bin/python
* Siege, as installed from http://www.joedog.org/siege-home/.

"siegerunner.py -h" for detail on command-line arguments.

## Prepopulating Monarch Cache

first do this

```
export PH=$HOME/repos/phenotype-ontologies 
```

(or wherever you have phenotype-ontologies checked out)

then do this:

```
cut -f2 $PH/data/Homo_sapiens/Hs-disease-to-phenotype-O.txt | sort -u  | perl -npe 's/\t.*//;s/:/_/;chomp;print `wget monarchinitiative.org/phenotype/$_ -O /tmp/z.html`' 
```


