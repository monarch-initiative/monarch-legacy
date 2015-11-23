####
#### Setup gross testing environment.
####
#### This currently includes the UI instance target and browser type
#### (FF vs PhantomJS).
####

import os
import time
from selenium import webdriver
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities

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
        d = DesiredCapabilities.PHANTOMJS
        d['loggingPrefs'] = {'browser': 'ALL', 'client': 'ALL', 'driver': 'ALL', 'performance': 'ALL', 'server': 'ALL'}
        context.browser = webdriver.PhantomJS(desired_capabilities=d)
        context.browser.desired_capabilities['loggingPrefs'] = {'browser': 'ALL', 'client': 'ALL', 'driver': 'ALL', 'performance': 'ALL', 'server': 'ALL'}
        print("# Using PhantomJS webdriver")
    else:
        d = DesiredCapabilities.FIREFOX
        lp = {'browser': 'SEVERE', 'client': 'OFF', 'driver': 'OFF', 'performance': 'OFF', 'server': 'OFF'}
        d['loggingPrefs'] = lp
        fp = webdriver.FirefoxProfile()

        fp.set_preference('javascript.options.showInConsole', True)
        fp.set_preference('browser.dom.window.dump.enabled', True)
        fp.set_preference('devtools.chrome.enabled', True)
        fp.set_preference('devtools.theme', 'dark')
        fp.set_preference("devtools.webconsole.persistlog", True)

        fp.set_preference("devtools.browserconsole.filter.jslog", True)
        fp.set_preference("devtools.browserconsole.filter.jswarn", True)
        fp.set_preference("devtools.browserconsole.filter.error", True)
        fp.set_preference("devtools.browserconsole.filter.warn", True)
        fp.set_preference("devtools.browserconsole.filter.info", True)
        fp.set_preference("devtools.browserconsole.filter.log", True)

        fp.set_preference("devtools.webconsole.filter.jslog", True)
        fp.set_preference("devtools.webconsole.filter.jswarn", True)
        fp.set_preference("devtools.webconsole.filter.error", True)
        fp.set_preference("devtools.webconsole.filter.warn", True)
        fp.set_preference("devtools.webconsole.filter.info", True)
        fp.set_preference("devtools.webconsole.filter.log", True)
        fp.set_preference("devtools.hud.loglimit.console", 5000)
        fp.set_preference("devtools.hud.loglimit.exception", 5000)
        # fp.set_preference("webdriver.log.driver", "DEBUG")
        # fp.set_preference("webdriver.development", True)
        # fp.set_preference("webdriver.firefox.useExisting", True)

        fp.set_preference("webdriver.log.file", os.getcwd() + "/webdriver.log")
        fp.set_preference("webdriver.firefox.logfile", os.getcwd() + "/firefox.log")

        # fp.add_extension(extension='firebug-2.0.13-fx.xpi')
        # fp.add_extension('consoleExport-0.5b5.xpi')

        # fp.set_preference("extensions.firebug.currentVersion", "2.0.13") #Avoid startup screen
        # fp.set_preference("extensions.firebug.console.enableSites", True)
        # fp.set_preference("extensions.firebug.console.logLimit", 5000)

        # fp.set_preference("extensions.firebug.net.enableSites", True)
        # fp.set_preference("extensions.firebug.script.enableSites", True)
        # fp.set_preference("extensions.firebug.allPagesActivation", "on")
        # fp.set_preference("extensions.firebug.defaultPanelName", "console")
        # fp.set_preference("extensions.firebug.framePosition", "detached")
        # fp.set_preference('extensions.firebug.showFirstRunPage', False)
        # fp.set_preference('extensions.firebug.delayLoad', False)
        # fp.set_preference('extensions.firebug.showJSWarnings', True)
        # fp.set_preference('extensions.firebug.showJSErrors', True)
        # fp.set_preference('extensions.firebug.showCSSErrors', True)
        # fp.set_preference('extensions.firebug.showStackTrace', True)

        # fp.set_preference('extensions.firebug.consoleexport.active', True)
        # fp.set_preference("extensions.firebug.consoleexport.defaultLogDir", os.getcwd());
        # fp.set_preference("extensions.firebug.consoleexport.active", True);
        # fp.set_preference("extensions.firebug.consoleexport.alwaysEnableAutoExport", True);
        # fp.set_preference("extensions.firebug.consoleexport.autoExportToFile", True);
        # fp.set_preference("extensions.firebug.consoleexport.autoExportToServer", True);
        # # fp.set_preference("extensions.firebug.consoleexport.format", "xml");
        # fp.set_preference("extensions.firebug.consoleexport.logFilePath", os.getcwd() + "/log.xml");
        # # fp.set_preference("extensions.firebug.consoleexport.serverURL", "http://127.0.0.1:8000/log.php");

        fp.update_preferences()
        context.browser = webdriver.Firefox(capabilities=d, firefox_profile=fp)

        # print("# Using Firefox webdriver. Make any adjustments. You have 15 seconds...")
        # time.sleep(15)

    #
    # Set a 30 second implicit wait - http://selenium-python.readthedocs.org/en/latest/waits.html#implicit-waits
    # Once set, the implicit wait is set for the life of the WebDriver object instance.
    #
    context.browser.set_window_size(1200, 900)
    context.browser.implicitly_wait(30) # seconds

## Do this after completing everything.
def after_all(context):
    context.browser.quit()
    pass

# Run this before each scenario
# This works around a problem with the FireFox driver where the window size periodically
# gets smaller and hides the navbar search field.
#
def before_scenario(context, scenario):
    context.browser.set_window_size(1100, 800)
    time.sleep(1)

def after_scenario(context, scenario):
    dump_log(context, scenario.name)
    # time.sleep(20)
    pass

def dump_log(context, scenarioName):
    log = context.browser.get_log("browser")
    print('')
    print('--------- console.log for: "' + scenarioName + '"')
    for l in log:
        # if l['level'] != 'WARNING':
        print(l['level'] + ': ' + l['message'])
    print('')

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
