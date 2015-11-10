[![Build Status](https://travis-ci.org/monarch-initiative/monarch-app.svg?branch=master)](https://travis-ci.org/monarch-initiative/monarch-app)

## About

This repo contains the source and configuration files used to implement the Monarch Initiative web interface.

You can run the website locally (see below).

The live version of the Monarch Initiative web interface is at [http://monarchinitiative.org](http://monarchinitiative.org).


<!-- MarkdownTOC -->

- [Recent Changes](#recent-changes)
	- [Transitioned RingoJS vs NodeJS](#transitioned-ringojs-vs-nodejs)
	- [Improved UI Tooling](#improved-ui-tooling)
- [Quickstart](#quickstart)
	- [Verify your NPM and NodeJS Installation](#verify-your-npm-and-nodejs-installation)
	- [Download and Install Monarch](#download-and-install-monarch)
	- [Start the Monarch application server](#start-the-monarch-application-server)
	- [Exercise the Application](#exercise-the-application)
- [Detailed Launch Instructions](#detailed-launch-instructions)
- [Launching via supervisor](#launching-via-supervisor)
- [Monarch Documentation](#monarch-documentation)
- [Making changes](#making-changes)
- [Scripts](#scripts)
- [Legacy RingoJS installation and launch instructions](#legacy-ringojs-installation-and-launch-instructions)

<!-- /MarkdownTOC -->


## Recent Changes

### Transitioned RingoJS vs NodeJS

The Monarch Initiative web application server has been migrated from the RingoJS server-side Javascript framework to the NodeJS framework. Previous production versions of Monarch prior to October 2015 were based upon RingoJS, which uses the Rhino Javascript engine within a Java Virtual Machine. The same Javascript source code that implements Monarch is now running under NodeJS. The instructions below refer to the NodeJS implementation unless otherwise clarified as RingoJS-specific.

### Improved UI Tooling

The Monarch web application was designed to support the integration of diverse JavaScript libraries and HTML fragments. This was to encourage experimentation with different visualization frameworks and technology. The Monarch web application associates a given route (e.g., `/page/about`) with a handler that generates the correct webpage by assembling pieces via the server-side pup-tent library. This allows different web pages within the Monarch app to have completely different Javascript and CSS resources, and has been useful in the development of Monarch's features.

Recently, we have been evolving the codebase to support modern web front-end tooling, including the use of preprocessors (e.g., LESS, JSHint), the bundling and minification of JS and CSS resources, and a more rapid development cycle. In the short term, we expect this will result in more effective and pleasant development experience, as well as a more efficient web application. In the longer term, we may choose to build Monarch as a single-page app, in which case this bundling is essential.


## Quickstart

### Verify your NPM and NodeJS Installation

You will need to have NodeJS and NPM installed. At the time of this writing, we are supporting the following versions, which can be reported via the `npm version` command:

	> npm version
		...
		  npm: '3.3.10',
		...
		  node: '0.12.7',


### Download and Install Monarch

After downloading the Monarch GitHub repository (via `git clone` or as a `.zip` or `.tar.gz`), change your working directory to the downloaded source code directory and then type:

    ./install.sh


This will install the required modules, including NPM-based modules such as `gulp` and `mustache`, as well as the necessary NodeJS runtime tools.

### Start the Monarch application server

After installation completes, start the server:

    ./start-server.sh

You're done! You now have a running Monarch Initiative web application.


### Exercise the Application

Try it out by connecting your browser to:

 * http://127.0.0.1:8080/

Or view a particular disease, e.g:

 * http://127.0.0.1:8080/disease/DOID_14692



## Detailed Launch Instructions

Typically, the web application is started with:

	./start-server.sh

which can take an optional environment name parameter of: dev, stage, or production. The 'dev' environment is the default. For example:

	./start-server.sh stage

This `start-server.sh` script is a thin veneer upon the underlying command:

	NODE_PATH=./lib/monarch node lib/monarch/web/webapp_launcher.js

The `webapp_launcher.js` can take an optional `--port portNumber` parameter in addition to an optional environment name. For example:

	export NODE_PATH=./lib/monarch
	node lib/monarch/web/webapp_launcher.js dev --port 8888


## Launching via supervisor

On some deployments, it may be necessary to fully specify the path to the `node` executable. For example:

	/usr/local/bin/node lib/monarch/web/webapp_launcher.js stage --port 8080


## Monarch Documentation

Open doc/index.html in a web browser.

Alternatively, connect to http://127.0.0.1:8080 and use the Documentation menu on the navbar to discover the information you want.

## Making changes

See CONTRIBUTIONS.md and README-developers.md

## Scripts

See bin/README.md


---

## Legacy RingoJS installation and launch instructions

1. Install RingoJS - http://ringojs.org

	./installRingo.sh

2. Run app

    ./ringo-server.sh



