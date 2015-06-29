#!/bin/sh

# get/update phenogrid
# eventually, if needed, figure out a way to make this nicely iterate over lists of pairs of
# directory names and github repos.
# TODO: move to proper dependency management system (e.g. npm)
# TODO: this does not work within a daemonize command. See: https://github.com/monarch-initiative/monarch-app/issues/597
CWD=`pwd`
if [ ! -d ./widgets/phenogrid ]; then
    cd ./widgets
    echo "Cloning phenogrid via Git"
    git clone https://github.com/monarch-initiative/phenogrid.git
    cd $CWD
else
    cd ./widgets/phenogrid
	if [ -d ./.git ]; then
		echo "Updating phenogrid via Git"
    	git pull
    else
		echo "Using Monarch version of phenogrid"
    fi
    cd $CWD
fi
