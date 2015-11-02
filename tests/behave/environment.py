####
#### Setup gross testing environment.
####
#### This currently includes the UI instance target and browser type
#### (FF vs PhantomJS).
####

import os
import time
from selenium import webdriver

###
### Simple (but somewhat excessive for the data parts) environment.
###

## Run this before anything else.
def before_all(context):
    ## Determine the server target. Default: http://beta.monarchinitiative.org.
    context.target = 'http://beta.monarchinitiative.org'
    if 'TARGET' in os.environ:
        context.target = os.environ['TARGET']
    if 'BROWSER' in os.environ and os.environ['BROWSER'] == 'phantomjs':
        context.browser = webdriver.PhantomJS()
        print("# Using PhantomJS")
    else:
        context.browser = webdriver.Firefox()
    #
    # Set a 30 second implicit wait - http://selenium-python.readthedocs.org/en/latest/waits.html#implicit-waits
    # Once set, the implicit wait is set for the life of the WebDriver object instance.
    #
    context.browser.set_window_size(1440, 900)
    context.browser.implicitly_wait(30) # seconds

## Do this after completing everything.
def after_all(context):
    context.browser.quit()

# Run this before each scenario
# This works around a problem with the FireFox driver where the window size periodically
# gets smaller and hides the navbar search field.
#
def before_scenario(context, scenario):
    context.browser.set_window_size(1100, 800)
    time.sleep(1)

def after_scenario(context, scenario):
    time.sleep(20)
    pass


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
