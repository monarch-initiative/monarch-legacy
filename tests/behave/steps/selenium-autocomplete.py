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
    # print('-----------elt_id---------------')
    # print(elt_id)
    # print('-----------elt_id.text----------------')
    # print(webelt.text)
    # print('-----------elt_id.get_attribute(innerHTML)----------------')
    # print(webelt.get_attribute('innerHTML'))
    # print('----------------------------')

###
### Definitions.
###

import time

@given('I type "{text}" into the navbar search')
def step_impl(context, text):
    webelt = WebDriverWait(context.browser, 30).until(EC.presence_of_element_located((By.CSS_SELECTOR, '.ui-autocomplete')))
    # time.sleep(1)
    # ac = context.browser.find_elements_by_tag_name('html')
    # for i in ac:
    #     print('-----------i---------------')
    #     print(i)
    #     print('-----------i.text----------------')
    #     print(i.text)
    #     print('-----------i.get_attribute(innerHTML)----------------')
    #     print(i.get_attribute('innerHTML'))
    #     print('----------------------------')
    #
    # log = context.browser.get_log("browser")
    # print('-----------log---------------')
    # for l in log:
    #     print(l['message'])
    text_to_input(context, 'search', text)

@given('I type "{text}" into the phenotype analyze search')
def step_impl(context, text):
    # time.sleep(15)
    # ac = context.browser.find_elements_by_tag_name('html')
    # for i in ac:
    #     print('-----------i---------------')
    #     print(i)
    #     print('-----------i.text----------------')
    #     print(i.text)
    #     print('-----------i.get_attribute(innerHTML)----------------')
    #     print(i.get_attribute('innerHTML'))
    #     print('----------------------------')
    # log = context.browser.get_log("browser")
    # print('-----------log---------------')
    # for l in log:
    #     print(l['message'])
    # assert False
    webelt = WebDriverWait(context.browser, 30).until(EC.presence_of_element_located((By.CSS_SELECTOR, '.ui-autocomplete')))
    text_to_input(context, 'analyze_auto_input', text)

## http://selenium-python.readthedocs.org/en/latest/waits.html
@given('I wait until "{item}" appears in the autocomplete')
def step_impl(context, item):
    # webelt = context.browser.find_element_by_partial_link_text(item)
    # print(webelt.text)

    webelt = WebDriverWait(context.browser, 30).until(EC.presence_of_element_located((By.CSS_SELECTOR, '.ui-autocomplete .ui-menu-item')))
    # print('-----------wait.text---------------')
    # print(webelt.text)
    # print('-----------wait.html---------------')
    # print(webelt.get_attribute('innerHTML'))
    #
    # ac = context.browser.find_elements_by_partial_link_text(item)
    # for i in ac:
    #     print('-----------i---------------')
    #     print(i)
    #     print('-----------i.text----------------')
    #     print(i.text)
    #     print('-----------i.get_attribute(innerHTML)----------------')
    #     print(i.get_attribute('innerHTML'))
    #     print('----------------------------')

    webelt = context.browser.find_element_by_partial_link_text(item)
    # print(webelt.text)

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

