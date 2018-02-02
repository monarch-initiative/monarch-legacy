import os
from behave import *
from urlparse import urlparse
import time
import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait # available since 2.4.0
from selenium.webdriver.support import expected_conditions as EC # available since 2.26.0

use_spa = (os.environ['USE_SPA'] == '1') if ('USE_SPA' in os.environ) else False

def ensure_content_loaded(context):
	if use_spa:
	    try:
	        element = WebDriverWait(context.browser, 60).until(EC.presence_of_element_located((By.ID, "selenium_id_content")))
	    except:
	        print("\n\n\n\nensure_content_loaded failed to find id=selenium_id_content. Non-fatal\n\n\n\n")
	        pass
	else:
		pass

def click_and_ensure_content_loaded(context, webelt):
	if use_spa:
	    selenium_id_element = context.browser.find_element_by_id("selenium_id_content")
	    if selenium_id_element != None:
	        context.browser.execute_script("arguments[0].id = null", selenium_id_element)
	        try:
	            selenium_id_element = context.browser.find_element_by_id("selenium_id_content")
	            print("\n\n\n\nFOUND after execute... BAD\n\n\n\n")
	        except:
	            # print("\n\n\n\nMISSING after execute... GOOD\n\n\n\n")
	            pass
	    webelt.click()
	    ensure_content_loaded(context)
	else:
	    webelt.click()
