####
#### A set of basic steps.
####

from behave import *
from urlparse import urlparse
import time
import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait # available since 2.4.0
from selenium.webdriver.support import expected_conditions as EC # available since 2.26.0

## The basic and critical "go to page".
@given('I go to page "{page}"')
def step_impl(context, page):
    #print(context.browser.title)
    context.browser.get(context.target + page)
    # time.sleep(10)
    # from selenium.webdriver.support import expected_conditions as EC
    # wait = WebDriverWait(driver, 10)
    # element = wait.until(EC.element_to_be_clickable((By.ID,'someid')))

@given('I go to slow page "{page}" and wait for id "{id}"')
def step_impl(context, page, id):
    #print(context.browser.title)
    context.browser.get(context.target + page)
    #time.sleep(30)
    element = WebDriverWait(context.browser, 60).until(EC.presence_of_element_located((By.ID, id)))
    # try:
    #     print(id)
    #     element = WebDriverWait(context.browser, 30).until(EC.presence_of_element_located((By.ID, id)))
    # finally:
    #     print("FINALLY")
    #     #context.browser.quit()


## URL Check
@then('the url will be "{url}"')
def step_impl(context, url):
    full_url = context.target + url
    assert context.browser.current_url == full_url

## Title check.
@then('the title should be "{title}"')
def step_impl(context, title):
    #print(context.browser.title)
    #print(title)
    assert context.browser.title == title

## The empty title check, a bit of a special case for known "bad" page
## titles.
@then('the title should be ""')
def step_impl(context):
    assert( context.browser.title == "" or context.browser.title == None )

## The document body should contain a certain piece of text.
@then('the document should contain "{text}"')
def step_impl(context, text):
    print(context.browser.title)
    webelt = context.browser.find_element_by_tag_name('html')
    print(webelt.text)
    assert webelt.text.rfind(text) != -1
    # webelt = context.browser.find_element_by_tag_name('body')
    # print(webelt.get_attribute('innerHTML'))
    # assert webelt.get_attribute('innerHTML').rfind(text) != -1

## The document body should not contain a hyperlink with text.
@then('the document should not contain link with "{text}"')
def step_impl(context, text):
    from selenium.common.exceptions import NoSuchElementException
    isNotFound = False
    try:
        context.browser.find_element_by_link_text(text)
    except NoSuchElementException:
        isNotFound = True
    assert isNotFound

## The document body should not contain an internal hyperlink to {link}
@then('the document should not contain an internal link to "{link}"')
def step_impl(context, link):
    webelts = context.browser.find_elements_by_tag_name('a')
    isNotFound = True
    for elt in webelts:
        href = elt.get_attribute("href")
        if href.rfind(context.target+link) != -1:
            isNotFound = False
    assert isNotFound == True

## A given class should contain a given piece of text/content. Not
## generably usable by non-dev test writers.
@then('the class "{clss}" should contain "{text}"')
def step_impl(context, clss, text):
    #print(context.browser.title)
    #print(title)
    webelt = context.browser.find_element_by_class_name(clss)
    assert webelt.text.rfind(text) != -1

## A given tab should contain a given piece of text/content.
@then('the "{tabname}" tab should contain "{text}"')
def step_impl(context, tabname, text):
    # print(context.browser.title)
    webelts = context.browser.find_elements_by_class_name("tab")
    found_tab = False
    for w in webelts:
        if w.text.rfind(tabname) != -1:
            found_tab = True
            parent = w.find_element_by_xpath("..")
            tab_href = parent.get_attribute("href")
            url = urlparse(tab_href)
            tab_id = url.fragment
            # print(tab_id)
            tab_area_elt = context.browser.find_element_by_id(tab_id)
            # print(tab_area_elt.text)
            assert tab_area_elt and tab_area_elt.text.rfind(text) != -1
    assert found_tab

