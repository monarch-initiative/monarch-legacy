## About

This repo contains the JS API and RingoJS application to drive the
current prototype web interface.

You can run the website locally (see below).

There may be an instance up and running here:

 * http://toaster.lbl.gov:8282/

We are also experimenting with Heroku

## Quickstart

Just type

    ./install.sh

Then start the server:

    ./start-server.sh

You're done!

Connect on localhost:

 * http://127.0.0.1:8282/

Or a particular disease, e.g:

 * http://127.0.0.1:8282/disease/DOID_14692

## Alternate installation instructions

1. Install RingoJS - http://ringojs.org

2. Install stick

    ringo-admin install ringo/stick

3. Run app

    ringo lib/monarch/web/webapp_launcher.js --port 8282

## Documentation

Open doc/index.html in a web browser.

Alternative, connect to 127.0.0.1:8282 and select "documentation" from menubar.

## Making changes

See README-developers.md

## Scripts

See bin/README.md
