[![Build Status](https://travis-ci.org/monarch-initiative/monarch-app.svg?branch=master)](https://travis-ci.org/monarch-initiative/monarch-app)

## About

This repo contains the JS API and web application to drive the Monarch Initiative web interface.

You can run the website locally (see below).

The live version of the Monarch Initiative web interface is at [http://monarchinitiative.org](http://monarchinitiative.org).

### Transitioning RingoJS vs NodeJS

The Monarch Initiative web application server is being migrated from the RingoJS server-side Javascript framework to a NodeJS framework. The current version of Monarch is still based upon RingoJS, which uses the Rhino Javascript engine within a Java Virtual Machine. The same Javascript source code that implements Monarch is now able to run under NodeJS, although we are still performing tests and quality assurance before we migrate completely to NodeJS. The instructions below refer to the RingoJS implementation unless otherwise clarified as NodeJS-specific.

## Quickstart

After downloading the Monarch GitHub repository, change your working directory to the downloaded source code and then type:

    ./install.sh

This will install the required modules, including NPM-based modules such as `gulp` and `mustache`, as well as the necessary RingoJS runtime.

After installation completes, start the server:

    ./start-server.sh

You're done! You now have a running Monarch Initiative web application.

Try it out by connecting your browser to:

 * http://127.0.0.1:8080/

Or view a particular disease, e.g:

 * http://127.0.0.1:8080/disease/DOID_14692

### Manual RingoJS installation and launch instructions

1. Install RingoJS - http://ringojs.org

2. Install stick

    ringo-admin install ringo/stick

3. Run app

    ringo lib/monarch/web/webapp_launcher.js --port 8080

## Widgets and sub-components

Monarch-app includes a home-grown widget framework for including
functionality components that are required for the operation of the
monarch-app, but not included in the monarch-app distribution.

Currently, there is only one such widget - the [phenogrid
browser](https://github.com/monarch-initiative/phenogrid).

Monarch-app will clone this repository into an appropriate location -
./widgets/phenogrid - upon installation. The phenogrid code will be
updated via a pull upon start of the process.  These steps will be
managed via the update_dependencies.sh script.

Note that the .gitignore file explicitly ignores these components that
are pulled in separately.

Further components should be added in a similar manner.


## Documentation

Open doc/index.html in a web browser.

Alternative, connect to 127.0.0.1:8080 and select "documentation" from menubar.


## Making changes

See README-developers.md

## Scripts

See bin/README.md

