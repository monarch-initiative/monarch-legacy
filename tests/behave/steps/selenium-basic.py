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
    context.browser.get(context.target + page)

@given('I go to slow page "{page}" and wait for id "{id}"')
def step_impl(context, page, id):
    context.browser.get(context.target + page)
    element = WebDriverWait(context.browser, 30).until(EC.presence_of_element_located((By.ID, id)))

@given('I go to page "{page}" and wait for id "{id}" to be hidden')
def step_impl(context, page, id):
    context.browser.get(context.target + page)
    element = WebDriverWait(context.browser, 30).until(EC.presence_of_element_located((By.ID, id)))
    element = WebDriverWait(context.browser, 30).until(EC.invisibility_of_element_located((By.ID, id)))

@given('I go to slow page "{page}" and wait for class "{cls}"')
def step_impl(context, page, cls):
    #print(context.browser.title)
    context.browser.get(context.target + page)
    element = WebDriverWait(context.browser, 30).until(EC.presence_of_element_located((By.CLASS_NAME, cls)))

@when('I wait for id "{id}"')
def step_impl(context, id):
    try:
        # print("\n#######Wait for ", id, "\n")
        element = WebDriverWait(context.browser, 30).until(EC.presence_of_element_located((By.ID, id)))
        # print("\n#######Found ", id, element, "\n")

        # webelt = context.browser.find_element_by_tag_name('html')
        # print("###### webelt.text: %s" % webelt.text)
        # print("###### webelt.innerHTML: %s" % webelt.get_attribute('innerHTML'))
        # print("\n\n")
    except:
        print("\n#######Not Found ", id, "\n")
        #context.browser.quit()

## URL Check
@then('the url will be "{url}"')
def step_impl(context, url):
    full_url = context.target + url
    assert context.browser.current_url == full_url

## Title check.
@then('the title should be "{title}"')
def step_impl(context, title):
    # print('\n\n\n\n#####context.browser.title', context.browser.title)
    # print('#####title\n\n\n\n', title, '\n\n\n\n')
    assert context.browser.title == title

## The empty title check, a bit of a special case for known "bad" page
## titles.
@then('the title should be ""')
def step_impl(context):
    assert( context.browser.title == "" or context.browser.title == None )

## The document body should contain a certain piece of text.
@then('the document should contain "{text}"')
def step_impl(context, text):
    # print(context.browser.title)
    webelt = context.browser.find_element_by_tag_name('html')
    # print("###### text: %s" % text)
    # print("###### webelt.text: %s" % webelt.text)
    # print("###### webelt.innerHTML: %s" % webelt.get_attribute('innerHTML'))
    # print("###### rfind: %d" % webelt.text.rfind(text))
    assert webelt.text.rfind(text) != -1
    # webelt = context.browser.find_element_by_tag_name('body')
    # print(webelt.get_attribute('innerHTML'))
    # assert webelt.get_attribute('innerHTML').rfind(text) != -1

## The document body should contain a certain piece of text.
@then("the document should contain '{text}'")
def step_impl(context, text):
    # print(context.browser.title)
    webelt = context.browser.find_element_by_tag_name('html')
    # print(webelt.text)
    assert webelt.text.rfind(text) != -1

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
    #  print(context.browser.title, tabname, text)
    webelts = context.browser.find_elements_by_class_name("tab")
    found_tab = False
    for w in webelts:
        if w.text.rfind(tabname) != -1:
            found_tab = True
            parent = w.find_element_by_xpath("..")
            tab_href = parent.get_attribute("href")
            url = urlparse(tab_href)
            tab_id = url.fragment + '-panel';
            #print(tab_id)
            tab_area_elt = context.browser.find_element_by_id(tab_id)
            found = tab_area_elt.text.rfind(text);
            if found == -1:
                print("\n\n\n\n\n------- tab content not found ------\n\n\n\n\n")
                print(text)
                print(found)
                print(tab_area_elt.text)
                print("\n\n\n\n\n-------------\n\n\n\n\n")
            assert tab_area_elt and found != -1
    assert found_tab

@when('I click the link "{item}"')
def step_impl(context, item):
    #print(context.browser.title)
    webelt = context.browser.find_element_by_partial_link_text(item)
    webelt.click()

