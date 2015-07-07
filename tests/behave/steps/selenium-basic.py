####
#### A set of basic steps.
####

from behave import *

## The basic and critical "go to page".
@given('I go to page "{page}"')
def step_impl(context, page):
    #print(context.browser.title)
    context.browser.get(context.target + page)

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
    #print(context.browser.title)
    #print(title)
    webelt = context.browser.find_element_by_tag_name('html')
    assert webelt.text.rfind(text) != -1

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
    #print(context.browser.title)
    #print(title)
    webelts = context.browser.find_elements_by_class_name("tab")
    for w in webelts:
        if w.text.rfind(tabname) != -1:
            print(tabname)
            print(w)
            print(w.id)
            print(w.text)
            print(w.parent)
            #parent_id = w.parent.id
            parent = w.find_element_by_xpath("..")
            parent_id = parent.id
            tab_area_elt = context.browser.find_element_by_id(parent_id)
            assert tab_area_elt.text.rfind(text) != -1
        else:
            assert 1 == 0
