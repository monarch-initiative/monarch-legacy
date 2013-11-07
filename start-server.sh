#!/bin/sh
PATH_TO_ME=`which $0`
cd `dirname $PATH_TO_ME`
if [ $PORT ]
  then
   MARGS="--port $PORT"
  else
   MARGS="--port 8282"
fi
./ringojs/bin/ringo lib/monarch/web/webapp_launcher.js $MARGS
