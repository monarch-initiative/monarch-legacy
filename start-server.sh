#!/bin/sh

RUNENV=$1
if [ ! $RUNENV ]; then
	RUNENV=dev
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
export RINGO_MODULE_PATH=./modules/:$RINGO_MODULE_PATH
tools/ringo lib/monarch/web/webapp_launcher_$RUNENV.js $MARGS
