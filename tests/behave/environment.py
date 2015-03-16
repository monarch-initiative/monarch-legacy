####
#### Setup gross testing environment.
####
#### This currently includes the UI instance target and browser type
#### (FF vs PhantomJS).
####

import os
from selenium import webdriver

###
### Simple (but somewhat excessive for the data parts) environment.
###

## Run this before anything else.
def before_all(context):
    ## Determine the server target. Default: http://tartini.crbs.ucsd.edu.
    context.target = 'http://tartini.crbs.ucsd.edu'
    if 'TARGET' in os.environ:
        context.target = os.environ['TARGET']
    if 'BROWSER' in os.environ and os.environ['BROWSER'] == 'phantomjs':
        context.browser = webdriver.PhantomJS()
    else:
        context.browser = webdriver.Firefox()

## Do this after completing everything.
def after_all(context):
    context.browser.quit()

###
### Working on a more complex run environment for the future.
###

# ## Run this before anything else.
# def before_all(context):
#     ## Determine the server target. Default: http://tartini.crbs.ucsd.edu.
#     context.target = 'http://tartini.crbs.ucsd.edu'
#     if 'TARGET' in os.environ:
#         context.target = os.environ['TARGET']

# ## Run this before anything else.
# def before_feature(context, feature):
#     ## Get the browser we're going to use. Default: firefox.
#     if 'ui' in feature.tags: # only spin up browser when doing ui work
#         if 'BROWSER' in os.environ and os.environ['BROWSER'] == 'phantomjs':
#             context.browser = webdriver.PhantomJS()
#         else:
#             context.browser = webdriver.Firefox()

# ## Do this after completing every feature
# def after_feature(context, feature):
#     if 'ui' in feature.tags: # only spin up browser when doing ui work
#         context.browser.quit()

# ## Do this after completing everything.
# def after_all(context):
#     pass
