[![Build Status](https://travis-ci.org/monarch-initiative/monarch-app.svg?branch=master)](https://travis-ci.org/monarch-initiative/monarch-app)

## Welcome to Monarch

This repo contains the source and configuration files used to implement the
Monarch Initiative web application and associated tools.

You can build and run the web application yourself via the instructions below
in [Quickstart](#quickstart), or you can use the production version of the
Monarch Initiative web interface at
[http://monarchinitiative.org](http://monarchinitiative.org).

The audience for this README is primarily developers and integrators of the
Monarch technology. The Monarch web application has its own user-level
documentation as described in [Monarch Documentation](#monarch-documentation)
below.

<!-- MarkdownTOC -->

- [Recent Changes](#recent-changes)
    - [Transitioned RingoJS vs NodeJS](#transitioned-ringojs-vs-nodejs)
    - [Updated front-end modules](#updated-front-end-modules)
    - [Improved UI Tooling and Bundling](#improved-ui-tooling-and-bundling)
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
- [Non-bundled use of `require.js`](#non-bundled-use-of-requirejs)
- [New UI Tools and Bundling Instructions](#new-ui-tools-and-bundling-instructions)
    - [Running Monarch in Bundled Mode, without `webpack-dev-server`](#running-monarch-in-bundled-mode-without-webpack-dev-server)
    - [Running Monarch with `webpack-dev-server`](#running-monarch-with-webpack-dev-server)
    - [Documentation on the Tooling](#documentation-on-the-tooling)
        - [BrowserSync](#browsersync)
- [Legacy RingoJS installation and launch instructions](#legacy-ringojs-installation-and-launch-instructions)

<!-- /MarkdownTOC -->


## Recent Changes

### Transitioned RingoJS vs NodeJS

The Monarch Initiative web application server has been migrated from the RingoJS server-side Javascript framework to the NodeJS framework. Previous production versions of Monarch prior to October 2015 were based upon RingoJS, which uses the Rhino Javascript engine within a Java Virtual Machine. The same Javascript source code that implements Monarch is now running under NodeJS. The instructions herein refer to the NodeJS implementation unless otherwise clarified as RingoJS-specific.

### Updated front-end modules

Monarch now uses up-to-date NPM modules to provide common libraries such as jQuery, Mustache, D3, and more. Previously, these libraries were duplicated into the Monarch code base and were very out of date with respect to the NPM-available versions. This change required the adoption of `require.js`, a JS library that manages module dependencies in the browser. See [Non-bundled use of `require.js`](#non-bundled-use-of-requirejs) in this document for more details. Note that require.js is only used in the non-bundled mode.

### Improved UI Tooling and Bundling

The Monarch web application was designed to support the integration of diverse JavaScript libraries and HTML fragments. This was to encourage experimentation with different visualization frameworks and technology. The Monarch web application associates a given route (e.g., `/page/about`) with a handler that generates the correct webpage by assembling pieces via the server-side pup-tent library. This allows different web pages within the Monarch app to have completely different Javascript and CSS resources, and has been useful in the development of Monarch's features.

Recently, we have been evolving the codebase to support modern web front-end tooling, including the use of preprocessors (e.g., LESS, JSHint), the bundling and minification of JS and CSS resources, and a more rapid development cycle. In the short term, we expect this will result in more effective and pleasant development experience, as well as a more efficient web application. In the longer term, we may choose to build Monarch as a single-page app, in which case this bundling is essential.

Details on how to use the new tech are later in this document at [New UI Tools and Bundling Instructions](#new-ui-tools-and-bundling-instructions).


*As of November, 2015, we are making the new tooling available to developers of Monarch, but are preserving the non-bundled version of Monarch for production use. Once we get everyone familiar and confident in the performance and behavior of the bundled version of Monarch, then we will migrate completely to that version.*


## Quickstart

### Verify your NPM and NodeJS Installation

You will need to have NodeJS and NPM installed. At the time of this writing, we are supporting the following versions, which can be reported via the `npm version` command:

    > npm version
        ...
          npm: '3.4.0,
        ...
          node: '4.2.2',

About Node Versioning: Node 4.x is the immediate successor to the 0.12.x version of NodeJS. The version number jumped from 0.12.2 to 4.0.0 as a result of the NodeJS committee adjusting their version-numbering system recently. More information is in the [V4.0 Release Notes](https://nodejs.org/en/blog/release/v4.0.0/).


### Download and Install Monarch

After downloading the Monarch GitHub repository (via `git clone` or as a `.zip` or `.tar.gz`), change your working directory to the downloaded source code directory and then type:

    ./install.sh

This will install the required modules, including NPM-based modules such as `gulp` and `mustache`, as well as the necessary NodeJS runtime tools.

### Start the Monarch application server

After installation completes, start the server:

    > ./start-server.sh

You're done! You now have a running Monarch Initiative web application.


### Exercise the Application

Try it out by connecting your browser to:

 * [http://127.0.0.1:8080/](http://127.0.0.1:8080/)

Or view a particular disease, e.g:

 * [http://127.0.0.1:8080/disease/DOID_14692](http://127.0.0.1:8080/disease/DOID_14692)



## Detailed Launch Instructions

Typically, the web application is started with:

    > cd monarch-app
    > ./start-server.sh

which can take an optional environment name parameter of: 'dev', 'stage', or 'production'. The 'dev' environment is the default. For example:

    > ./start-server.sh stage

This `start-server.sh` script is a thin veneer upon the underlying command:

    NODE_PATH=./lib/monarch node lib/monarch/web/webapp_launcher.js

The `webapp_launcher.js` can take an optional `--port portNumber` parameter in addition to an optional environment name. For example:

    > export NODE_PATH=./lib/monarch
    > node lib/monarch/web/webapp_launcher.js dev --port 8888


## Launching via supervisor

On some deployments, it may be necessary to fully specify the path to the `node` executable. For example:

    /usr/local/bin/node lib/monarch/web/webapp_launcher.js stage --port 8080


## Monarch Documentation

The Monarch application contains a variety of documentation, available via the 'Documentation' menu on the navbar in the locally running app at [http://127.0.0.1:8080](http://127.0.0.1:8080) or in the production app at [http://monarchinitiative.org](http://monarchinitiative.org).

The Monarch API documentation can be viewed directly from the monarch-app source directory by opening the file `doc/index.html` in a web browser.


## Making changes

See [CONTRIBUTIONS.md](CONTRIBUTIONS.md) to learn about the Monarch developer workflow and code submission process.

See [README-developers.md](README-developers.md) for information on the Monarch architecture, internals, and means of extending and integrating Monarch.


## Scripts

See [bin/README.md](bin/README.md).

## Non-bundled use of `require.js`

When env variable USE_BUNDLE is not defined or not equal to '1', which we will
call non-bundled or Legacy Mode, the Monarch UI uses
[RequireJS](http://requirejs.org) to load various JS files and modules, and to
ensure they are loaded in the correct order.

The file `requireconfig.js` is included via `monarch_base.mustache` by RequireJS and this file
contains a set of `require` statements that include other JS files used by the Monarch front-end.


## New UI Tools and Bundling Instructions

By default, when you run the Monarch server via `./start-server.sh`, Monarch will operate in non-bundled mode. This means that when the web server delivers a page (e.g., `/page/about`), it will invoke a particular handler in `lib/monarch/web/webapp.js` and that handler (`pageByPageHandler`, in this example) will generate a custom HTML page by expanding a set Mustache templates and streaming the result back to the web browser. The custom HTML page includes CSS and JS file references that support the particular page being delivered.

One of the things that Monarch has relied on up to this point is the ability for different handlers to present different CSS and JS files to the browser, enabling us to experiment with diverse libraries and frameworks as we extend and integrate Monarch. Unfortunately, this technique is at odds with many of the goals of delivering a high-performance modern website, which encourages bundling, minification and caching of assets (CSS, JS) in the browser.

We have improved our front-end page generation pipeline to accommodate the current on-the-fly page composition technique as well as to allow for the use of modern tooling to bundle and minify CSS and JS assets for efficient delivery and caching. This bundled mode is disabled by default when Monarch is invoked by `./start-server.sh`, but it can be easily used to speed up front-end development and for the Monarch developers to get an understanding of any pros and cons associated with the bundling and tooling.

### Running Monarch in Bundled Mode, without `webpack-dev-server`

The bundle behavior is currently controlled via the environment variable `USE_BUNDLE`, which directs `webapp.js` to include `dist/app.bundle.js` and `dist/app.bundle.css` into the dynamically generated page. This is in contrast to non-bundled mode, where a variety of page-specific JS and CSS resources are included.

Here's one way to experiment with the bundled execution:

	> npm run build    # This takes a minute or so, generates dist/app.bundle.* and other dist/*
	> npm run bstart   # defines USE_BUNDLE=1, then runs webapp_launcher.js

Alternatively:

	> rm -rf dist/*
	> webpack --config webpack.build.js --bail -p
	> USE_BUNDLE=1 NODE_PATH=./lib/monarch node lib/monarch/web/webapp_launcher.js


### Running Monarch with `webpack-dev-server`

One drawback to the use of bundled mode above is that any time a developer
edits a front-end resource (e.g., a CSS or JS file), they will have to
regenerate the bundle using the above commands, which is slow and tedious. That is why most rapid development will occur usig the `webpack-dev-server`, which allows a developer to make a change to a CSS/JS file and immediately see the result delivered to their browser, without restarting any servers. The only time the slow-bundle needs to occur is during a production build (or during the unit tests prior to a pull request).

To exercise the rapid development tools:

	> npm run dev 			# Starts webapp, webpack-dev-server, browsersync, nodemon

Note that your default web browser will open up automatically and you will be pointed to the BrowserSync proxy URL: [http://localhost:3000/](http://localhost:3000/). If you want to see the application without BrowserSync, use the url: [http://localhost:8081/](http://localhost:8081/). This 8081 URL is also the one to use when running behave tests:

    > cd tests/behave
    > source bin/activate
    > TARGET=http://localhost:8081/ behave

### Documentation on the Tooling

#### BrowserSync

[BrowserSync](http://www.browsersync.io/) is a free and open source tool and library that is useful for web designers and QA folk for debugging and testing UIs under a variety of browsers and conditions. We at Monarch are primarily using it to provide us with automatic browser reload when we change an asset, but it has many other features.

[WebPack](https://webpack.github.io/) is a free and open source tool and library that provides bundling, preprocessing and an efficient module system based upon Browserify and NodeJS `require` statements. WebPack is very extensible, and the Monarch tooling includes several preprocessors as part of the build chain:

- LESS Preprocessor
- Babel ES6
- Babel ESLint
- Uglify
- JSON, CSS, JS, and other asset loaders

[`webpack-dev-server`](https://webpack.github.io/docs/webpack-dev-server.html) is a NodeJS server that integrates with WebPack to deliver bundled assets incrementally to a web browser during active development. It enables a developer to see the effect of their changes immediately in the browser, and then later they can perform the slower and more thorough `npm run build` operation.


---

## Legacy RingoJS installation and launch instructions

1. Install RingoJS - http://ringojs.org

    ./installRingo.sh

2. Run app

    ./ringo-server.sh



