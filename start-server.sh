#!/bin/sh
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
./ringojs/bin/ringo lib/monarch/web/webapp_launcher.js $MARGS