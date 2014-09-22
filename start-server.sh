#!/bin/sh
# get/update phenogrid
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

PATH_TO_ME=`which $0`
cd `dirname $PATH_TO_ME`
if [ $PORT ]
  then
   MARGS="--port $PORT"
  else
   echo using default port
   MARGS="--port 8080"
fi
echo starting server
./ringojs/bin/ringo lib/monarch/web/webapp_launcher_dev.js $MARGS
