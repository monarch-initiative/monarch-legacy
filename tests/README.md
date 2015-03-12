## About

This is the test suite for Monarch-app. Currently there is a single
broad-purpose test module, which tests URLs for both various service
components and the Monarch app itself. It indirectly tests other
capabilities.

## Adding URLs to test

Members of the monarch team can add to the test of test URLs directly:

 * https://github.com/monarch-initiative/monarch-app/blob/master/tests/urltest_cfg.js

After editing, always check the status of the jenkins build

## Running URLs tests

    ringo tests/urltester.js -h

Or, if you installed ringo directly in your repo:

    ./ringojs/bin/ringo tests/urltester.js -h

## Continuous Integration Tests

Currently the following job runs the URL test:

 * http://build.berkeleybop.org/job/check-monarch-urls

## Testing Ancillary Modules

## Running Pup-Tent Tests

ringo -m ./modules/pup-tent/ -m ./modules/underscore/ -m ./modules/mustache/ tests/full-tmpl.js.tests

Or,

./ringojs/bin/ringo -m ./modules/pup-tent/ -m ./modules/underscore/ -m ./modules/mustache/ tests/full-tmpl.js.tests

## Also see

A different set of unit tests are also being developed in tests/behave.
There are centered around the behave testing framework.
