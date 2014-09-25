#!/bin/sh
cd templates/labs
if [ -e "jbrowse" ]; then
    git pull
    git submodule foreach git pull
else
    git clone --recursive https://github.com/GMOD/jbrowse.git
fi
cd jbrowse
./setup.sh

