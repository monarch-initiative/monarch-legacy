####
#### Basic functions for checking external data resources.
####

from behave import *
import urllib2
import urllib
import httplib
import json
import jsonpath_rw

###
### Helpers.
###

## The basic and critical remote collector.
## It defines:
##  context.code
##  context.content_type
##  context.content
##  context.content_length
def get_and_process(context, url, data):

    ## Build request. 
    if data:
        req_data = urllib.urlencode(data)
        req = urllib2.Request(url, req_data)
    else:
        req = urllib2.Request(url)

    ## Make the attempt, or chatty fail.
    #httplib.HTTPConnection.debuglevel = 1    
    response = None
    try:
        response = urllib2.urlopen(req)
    except urllib2.URLError as e:
        print('Tried: ', url)
        if hasattr(e, 'reason'):
            print('Failed to reach server: ', e.reason)
        if hasattr(e, 'code'):
            print('Server error, code: ', e.code)
        if response and response.read():
            print('Response: ', response.read())
        assert True is False
    else:
        ## Final
        pass
    
    ## Parcel out what we have for downstream checking.    
    context.code = response.code
    ## https://docs.python.org/2/library/mimetools.html#mimetools.Message
    context.content_type = response.info().gettype()
    context.content = response.read()
    context.content_length = 0
    if context.content :
        context.content_length = len(context.content)

###
### Definitions.
###

## Collector for internal path.
@given('I collect data at path "{path}"')
def step_impl(context, path):
    full_url = context.target + path
    get_and_process(context, full_url, {})

## Collector for remote resource.
@given('I collect data at URL "{url}"')
def step_impl(context, url):
    get_and_process(context, url, {})

@then('the content type should be "{ctype}"')
def step_impl(context, ctype):
    if not context.content_type :
        ## Apparently no content type at all...
        assert True is False
    else:
        assert context.content_type == ctype

@then('the content should contain "{text}"')
def step_impl(context, text):
    if not context.content :
        ## Apparently no text at all...
        assert True is False
    else:
        assert context.content.rfind(text) != -1

## Adds:
##  context.content_json
@when('the content is converted to JSON')
def step_impl(context):
    if not context.content :
        ## Apparently no text at all...
        assert True is False
    else:
        context.content_json = json.loads(context.content)

@then('the JSON should have the top-level property "{prop}"')
def step_impl(context, prop):
    if not context.content_json :
        ## Apparently no JSON at all...
        assert True is False
    else:
        assert context.content_json.get(prop)

@then('the JSON should have the JSONPath "{jsonpath}"')
def step_impl(context, jsonpath):
    if not context.content_json :
        ## Apparently no JSON at all...
        assert True is False
    else:
        jsonpath_expr = jsonpath_rw.parse(jsonpath)
        res = jsonpath_expr.find(context.content_json)
        #assert len(res) > 0
        #print(res)
        assert res

@then('the JSON should have JSONPath "{jsonpath}" equal to "{thing}" "{value}"')
def step_impl(context, jsonpath, thing, value):
    if not context.content_json :
        ## Apparently no JSON at all...
        assert True is False
    else:
        jsonpath_expr = jsonpath_rw.parse(jsonpath)
        res = jsonpath_expr.find(context.content_json)
        if not res[0] :
            assert True is False
        else:
            if thing == "string":
                assert res[0].value == value
            elif thing == "integer":
                assert res[0].value == int(value)
            elif thing == "float":
                assert res[0].value == float(value)
            else:
                ## Not a thing we know how to deal with yet.
                assert True is False
