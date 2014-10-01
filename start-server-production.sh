#!/bin/sh

sh ./update_dependencies.sh

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
export RINGO_MODULE_PATH=./modules/:$RINGO_MODULE_PATH
./ringojs/bin/ringo lib/monarch/web/webapp_launcher_production.js $MARGS
