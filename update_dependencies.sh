#!/bin/sh

# get/update phenogrid
# eventually, if needed, figure out a way to make this nicely iterate over lists of pairs of
# directory names and github repos.
CWD=`pwd`
if [ ! -d ./widgets/phenogrid ]; then
    cd ./widgets
    git clone https://github.com/monarch-initiative/phenogrid.git
    cd $CWD
else 
    cd ./widgets/phenogrid
    git pull
    cd $CWD
fi

