####
#### Setup gross testing environment.
####
#### This currently includes the UI instance target and browser type
#### (FF vs PhantomJS).
####

import os
from selenium import webdriver

## Run this before anything else.
def before_all(context):
    ## Determine the server target. Default: http://tartini.crbs.ucsd.edu.
    context.target = 'http://tartini.crbs.ucsd.edu'
    if 'UI_TARGET' in os.environ:
        context.target = os.environ['UI_TARGET']
    ## Get the browser we're going to use. Default: firefox.
    if 'BROWSER' in os.environ and os.environ['BROWSER'] == 'phantomjs':
        context.browser = webdriver.PhantomJS()
    else:
        context.browser = webdriver.Firefox()

## Do this after completing everything.
def after_all(context):
    context.browser.quit()
