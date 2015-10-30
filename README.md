[![Build Status](https://travis-ci.org/monarch-initiative/monarch-app.svg?branch=master)](https://travis-ci.org/monarch-initiative/monarch-app) 

## About

This repo contains the JS API and web application to drive the Monarch Initiative web interface.

You can run the website locally (see below).

The live version of the Monarch Initiative web interface is at [http://monarchinitiative.org](http://monarchinitiative.org).

### Transitioned RingoJS vs NodeJS

The Monarch Initiative web application server has been migrated from the RingoJS server-side Javascript framework to the NodeJS framework. The current production version of Monarch is still based upon RingoJS, which uses the Rhino Javascript engine within a Java Virtual Machine. The same Javascript source code that implements Monarch is now able to run under NodeJS, although we are still performing tests and quality assurance. The instructions below refer to the NodeJS implementation unless otherwise clarified as RingoJS-specific.

## Quickstart

After downloading the Monarch GitHub repository, change your working directory to the downloaded source code and then type:

    ./install.sh

This will install the required modules, including NPM-based modules such as `gulp` and `mustache`, as well as the necessary NodeJS runtime tools.

After installation completes, start the server:

    ./start-server.sh

You're done! You now have a running Monarch Initiative web application.

Try it out by connecting your browser to:

 * http://127.0.0.1:8080/

Or view a particular disease, e.g:

 * http://127.0.0.1:8080/disease/DOID_14692

### Legacy RingoJS installation and launch instructions

1. Install RingoJS - http://ringojs.org

	./installRingo.sh

2. Run app

    ./ringo-server.sh

## Detailed Launch Instructions

Typically, the web application is started with:

	./start-server.sh

which can take an optional environment name parameter of: dev, stage, or production. For example:

	./start-server.sh stage

This `start-server.sh` script is a thin veneer upon the underlying command:

	NODE_PATH=./lib/monarch node lib/monarch/web/webapp_launcher.js

The `webapp_launcher.js` can take an optional `--port portNumber` parameter in addition to an optional environment name. For example:

	export NODE_PATH=./lib/monarch
	node lib/monarch/web/webapp_launcher.js stage --port 8888

## Launching via supervisor

On some deployments, it may be necessary to fully specify the path to the `node` executable. For example:

	/usr/local/bin/node lib/monarch/web/webapp_launcher.js stage --port 8080

## Documentation

Open doc/index.html in a web browser.

Alternative, connect to 127.0.0.1:8080 and select "documentation" from menubar.

## Making changes

See README-developers.md

## Scripts

See bin/README.md

