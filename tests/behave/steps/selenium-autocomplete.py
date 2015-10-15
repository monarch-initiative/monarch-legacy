####
#### Steps centered around dealing with the various
#### autocomplete/search boxes.
####
#### Right now, just the search box on the home page.
####

from behave import *
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

###
### Helper functions.
###

def text_to_input(context, elt_id, text):
    #print(context.browser.title)
    webelt = context.browser.find_element_by_id(elt_id)
    webelt.send_keys(text)

###
### Definitions.
###

@given('I type "{text}" into the home search')
def step_impl(context, text):
    text_to_input(context, 'home_search', text)

@given('I type "{text}" into the navbar search')
def step_impl(context, text):
    text_to_input(context, 'search', text)

@given('I type "{text}" into the phenotype analyze search')
def step_impl(context, text):
    text_to_input(context, 'analyze_auto_input', text)

## TODO/BUG: Make use of the explicit waits instead of the (rather
## lame) implicit waits:
## http://selenium-python.readthedocs.org/en/latest/waits.html
@given('I wait until "{item}" appears in the autocomplete')
def step_impl(context, item):

    ## Implicity poll for items to appear for 10 seconds.
    # context.browser.implicitly_wait(20) setup in environment.py for session

    webelt = context.browser.find_element_by_partial_link_text(item)

    ## TODO: 
    #     wait = WebDriverWait(context.browser, 10)
    #     element = wait.until(
    #             EC.element_to_be_clickable((By.ID,'someid'))
    #     )
    #     visibility_of_element_located(        
    #     element = WebDriverWait(context.browser, 1000).until(
    #     EC.text_to_be_present_in_element(
    #         context.browser.find_element_by_class_name('ui-autocomplete'), item
    #     )
    # )
    
@given('I click the autocomplete item "{item}"')
def step_impl(context, item):
    #print(context.browser.title)
    webelt = context.browser.find_element_by_partial_link_text(item)
    webelt.click()

@given('I click the autocomplete dropdown item "{item}" with category "{category}"')
def step_impl(context, item, category):
    link = item + ' ' + category;
    webelt = context.browser.find_element_by_link_text(link)
    webelt.click()

