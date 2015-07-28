####
#### Steps for operating on the various forms and their results.
####

from behave import *

###
### Submission.
###

## Submit analyze phenotype.
@when('I submit analyze phenotype')
def step_impl(context):
    webelt = context.browser.find_element_by_id('analyze-submit')
    webelt.click()

## Submit home search.
@given('I submit home search')
def step_impl(context):
    #print(context.browser.title)
    webelt = context.browser.find_element_by_id('home_search_form')
    webelt.submit()

###
### Example for input for a possible text area form.
###

@given('I input the following text into the textarea "{eid}"')
def step_impl(context, eid):
    input_box_text = context.text
    webelt = context.browser.find_element_by_id(eid)
    webelt.send_keys(input_box_text)

@when('I submit the form by clicking XPath "{xpath}"')
def step_impl(context, xpath):
    ## xpath like "/html/body/div[2]/div[4]/div/div/form/div[2]/button"
    webelt = context.browser.find_element_by_xpath(xpath)
    webelt.click()
