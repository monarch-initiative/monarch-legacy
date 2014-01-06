#!/usr/bin/python

######
# Siegerunner.py
# 
# A utility script for using the Siege load testing tool 
# (http://www.joedog.org/siege-home/)  to bang on the Monarch services
# 
# This script will make requests of Monarch services, of the form
#   $HOST/disease/OMIM_XXXXXXX and
#   $host/phenotype/HP_XXXXXXX, simulating each request with some number of users as 
#     per siege 
# 
# Disease and HP identifiers will be chosen randomly, up to a given ceiling 
# (15,000 for HP and 1,000,000 for OMIM). This crude scheme guarantees that many of the 
# IDs will be chosen will not be hits, but that's ok for the purposes of load testing - 
# the Monarch services should still behave correctly. The range of possible values 
# can be adjusted if desired - see below
#
# January 2014, harryh@pitt.edu
###

import random
import os
import subprocess as sub
import re
import argparse
import sys

# Global parameter values, with defaults. Can be adjusted via
# command-line arguments
iterations = 5
timearg = "3s"
concurrent = 25
host = "http://tartini.crbs.ucsd.edu/"
siege_exec="/usr/local/bin/siege"

# parameters for choosing OMIM and HP IDs. These cannot be adjusted
# via command-line arguments, but the somewhat stable structure of these two
# ontologies should minimize the need for such configurability
max_omim_id = 1000000
omim_id_length = 6
max_hp_id = 15000
hp_id_length = 7

# generate a test for OMIM diseases

def test_disease():
    path = gen_path("disease","OMIM",max_omim_id,omim_id_length)
    result = test_url(path)
    return result

# generate a test for OMIM diseases
def test_phenotype():
    path = gen_path("phenotype","HP",max_hp_id,hp_id_length)
    result = test_url(path)
    return result


# Generate the path to test.
#  type: either disease or phenotype
#  maxno: largest possible ID number
#  length: # of characters in complete string. 
#
# maxno and length are both needed, to handle cases such as HP: although there are 
# 7 characters in an HP ID, the highest ID # (as of January 2014) is less than 15000
def gen_path(type,prefix,maxno,length):
    id = gen_id(maxno,length)
    path = host+type+"/"+prefix+"_"+id
    return path


# return a string representation of a randomly generated ontology ID
#  maxno: largest numeric value of the IDs for the given ontology
#  length: number of digits in the ID
def gen_id(maxno,length):
    randnum=random.randrange(maxno)
    #convert to string.. with leading 00 to length characters.
    rstring = str(randnum)
    return rstring.zfill(length)


# Build a URL, open a PIPE to call siege, and process the results.
# will return one of two values: True if all tests were successful,
# otherwise False.
# 
# False results include those that were caused by network problems or
# other exceptions.
def test_url(path):
    
    passed = True 
    try:
        # need something of form.."
        # siege -c <concurrent> -t time http://tartini.crbs.ucsd.edu/phenotype/HP_0000003
        execstring = siege_exec+" -c "+str(concurrent)+" -t "+timearg+" "+path
        p = sub.Popen(execstring,stdout=sub.PIPE,stderr=sub.PIPE,shell=True)
        output, errors = p.communicate()
        result = parse_siege_output(errors)
    except OSError as inst:
        print type(inst)
        print inst
        print inst.args
        print inst.strerror
        result = { 'success': 0, 'failure': 1}
    except Exception as inst:
        print type(inst)
        print inst
        print inst.args
        result = { 'success': 0, 'failure': 1}

    print path+"... success: "+ str(result['success'])+", failure: "+str(result['failure'])

    # if there were no successful tests, or any failed tests, we did not pass
    if result['success'] == 0:
        passed = False
    elif result['failure'] >0:
        passed = False

    return passed

## parse_siege_output
#  
#  Examine stderr output from siege to find content of the form
# ....
#Successful transactions:         306
#Failed transactions:               0
# 
# indicating number of successes and failured. Return marched integers
#  as a dict.
def parse_siege_output(errors):
    m=re.search('Successful transactions:\s+(\d+)\nFailed transactions:\s+(\d+)',errors)
    success = int(m.group(1))
    failure = int(m.group(2))
    return { 'success': success, 'failure': failure}



# run iterations # of tests. each iteration will include one disease
# and one phenotpe.
# 
# a running count of errors provides results for determining eventual
# return code from program.
def run_tests(iterations):
    errs=  0
    for i in range(iterations):
        passed  = test_disease()
        # add one to errs if passed is false
        errs = errs + int(passed == False)

        passed  = test_phenotype()
        # add one to errs if passed is false
        errs = errs + int(passed == False)

    # at this point, if errs is zero, it has never been incremented, and 
    # the script can return zero to indicate successful completion.
    # similarly, non-zero errs means some failure and therefore non-zero return from 
    # will tell shell that there was  problem.

    # to do this, return int value of err > 0. If errs = 0, errs > 0 is false and returned    #  value is zer0. Otherwise, it's one.

    return int(errs > 0)


def main():
    # todo get arguments from command line: iterations,      timearg,       concurrent,        host.

    global iterations
    global timearg
    global concurrent
    global host
    global siege_exec


    parser =argparse.ArgumentParser()
    parser.add_argument("-i","--iterations",help="# of iterations of testing",type=int)
    parser.add_argument("-t","--time",help="string of # of seconds to test - ie., 60s")
    parser.add_argument("-c","--concurrent",help="# of concurrent requests",type=int)
    parser.add_argument("-u","--url",help="base url to test")
    parser.add_argument("-e","--executable",help="executable file for siege")
    args = parser.parse_args()
    iterations = args.iterations or iterations
    concurrent = args.concurrent or concurrent
    timearg = args.time if args.time else timearg

    # make sure host ends with url 
    host = args.url if args.url is not None else host
    if host[-1:] != '/':
        host = host +"/"
    siege_exec = args.executable if args.executable is not None else siege_exec


    random.seed();

    res = run_tests(iterations)

    sys.exit(res)


if __name__ == "__main__":
    main()
