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

## The document body should not contain a hyperlink with text.
@then('the document should not contain link with "{text}"')
def step_impl(context, text):
    try:
        context.browser.find_element_by_link_text(text)
    except NoSuchElementException:
        assert True
    assert False

## A given class should contain a given piece of text/content. Not
## generably usable by non-dev test writers.
@then('the class "{clss}" should contain "{text}"')
def step_impl(context, clss, text):
    #print(context.browser.title)
    #print(title)
    webelt = context.browser.find_element_by_class_name(clss)
    assert webelt.text.rfind(text) != -1

