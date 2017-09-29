####
#### Setup gross testing environment.
####
#### This currently includes the UI instance target and browser type
#### (FF vs PhantomJS).
####

import os
import time
from selenium import webdriver
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.firefox.firefox_binary import FirefoxBinary
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities

###
### Simple (but somewhat excessive for the data parts) environment.
###
window_width = 1200
window_height = 825
implicit_wait_seconds = 30


## Run this before anything else.
def before_all(context):
    ## Determine the server target. Default: http://beta.monarchinitiative.org.
    context.target = 'http://beta.monarchinitiative.org'
    if 'TARGET' in os.environ:
        context.target = os.environ['TARGET']
    if 'BROWSER' in os.environ and os.environ['BROWSER'] == 'phantomjs':
        d = DesiredCapabilities.PHANTOMJS
        d['loggingPrefs'] = {'browser': 'ALL', 'client': 'ALL', 'driver': 'ALL', 'performance': 'ALL', 'server': 'ALL'}
        context.browser = webdriver.PhantomJS(desired_capabilities=d)
        context.browser.desired_capabilities['loggingPrefs'] = {'browser': 'ALL', 'client': 'ALL', 'driver': 'ALL', 'performance': 'ALL', 'server': 'ALL'}
        print("# Using PhantomJS webdriver")
    else:
        d = DesiredCapabilities.FIREFOX
        d['marionette'] = True
        # d['binary'] = '/Applications/Firefox.app/Contents/MacOS/firefox-bin'
        d['loggingPrefs'] = {'browser': 'ALL', 'client': 'ALL', 'driver': 'ALL', 'performance': 'ALL', 'server': 'ALL'}

        # fp.set_preference('javascript.options.showInConsole', True)
        # fp.set_preference('browser.dom.window.dump.enabled', True)
        # fp.set_preference('devtools.chrome.enabled', True)
        # fp.set_preference('devtools.theme', 'dark')
        # fp.set_preference("devtools.webconsole.persistlog", True)

        # fp.set_preference("devtools.browserconsole.filter.jslog", True)
        # fp.set_preference("devtools.browserconsole.filter.jswarn", True)
        # fp.set_preference("devtools.browserconsole.filter.error", True)
        # fp.set_preference("devtools.browserconsole.filter.warn", True)
        # fp.set_preference("devtools.browserconsole.filter.info", True)
        # fp.set_preference("devtools.browserconsole.filter.log", True)

        # fp.set_preference("devtools.webconsole.filter.jslog", True)
        # fp.set_preference("devtools.webconsole.filter.jswarn", True)
        # fp.set_preference("devtools.webconsole.filter.error", True)
        # fp.set_preference("devtools.webconsole.filter.warn", True)
        # fp.set_preference("devtools.webconsole.filter.info", True)
        # fp.set_preference("devtools.webconsole.filter.log", True)
        # fp.set_preference("devtools.hud.loglimit.console", 5000)
        # fp.set_preference("devtools.hud.loglimit.exception", 5000)
        # fp.set_preference("webdriver.log.driver", "DEBUG")
        # fp.set_preference("webdriver.development", True)
        # fp.set_preference("webdriver.firefox.useExisting", True)
        # fp.set_preference("webdriver.log.file", os.getcwd() + "/webdriver.log")
        # fp.set_preference("webdriver.firefox.logfile", os.getcwd() + "/firefox.log")
        # fp.update_preferences()

        fp = webdriver.FirefoxProfile()
        fp.set_preference('devtools.jsonview.enabled', False)
        context.browser = webdriver.Firefox(capabilities=d, firefox_profile=fp, executable_path='/usr/local/bin/geckodriver')
        context.browser._is_remote = False

    #
    # Set a 30 second implicit wait - http://selenium-python.readthedocs.org/en/latest/waits.html#implicit-waits
    # Once set, the implicit wait is set for the life of the WebDriver object instance.
    #
    context.browser.set_window_size(window_width, window_height)
    context.browser.implicitly_wait(implicit_wait_seconds) # seconds
    #time.sleep(15)

## Do this after completing everything.
def after_all(context):
    context.browser.quit()
    pass

# Run this before each scenario
# This works around a problem with the FireFox driver where the window size periodically
# gets smaller and hides the navbar search field.
#
def before_scenario(context, scenario):
    # Dimensions should be smaller than those /usr/bin/Xvfb config in .travis.yml
    # Currently .travis.yml uses 1280x1024x16
    context.browser.set_window_size(window_width, window_height)
    # time.sleep(1)
    pass

def after_scenario(context, scenario):
    # dump_log(context, scenario.name)
    # time.sleep(1)
    pass

def dump_log(context, scenarioName):
    log = context.browser.get_log("browser")
    print('')
    print('--------- console.log for: "' + scenarioName + '"')
    for l in log:
        # if l['level'] != 'WARNING':
        print(l['level'] + ': ' + l['message'])
    print('')
