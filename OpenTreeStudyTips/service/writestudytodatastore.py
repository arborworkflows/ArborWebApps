#
# file:  converttabletojson.py
# title: convert a CSV string from a dropped file into json documents and store them in mongo
#
# modified:
# CRL - 4/26/14 - found upload was storing numbers as strings (e.g. '5.43') instead of as numbers.  added conversion.


import bson.json_util
import pymongo
import json
from bson import ObjectId
from pymongo import Connection
import string
import tangelo
import time
import csv

# we have to explicitly test if we can convert fields to numbers, becasuse otherwise we will make the mistake of
# storing everything as a string (e.g. "5.4332" instead of 5.4332).  This test is used and if it fails, then the value is
# a true string.

def convertIfNumber(s):
    try:
        int(s)
        return int(s)
    except ValueError:
        try:
            float(s)
            return float(s)
        except ValueError:
            return s



def run(study=None,projectName='cardiac'):
    # Create an empty response object.
    global nodeCount
    response = {}

    # first decode the argument from being passed through a URL
    jsonObj =  bson.json_util.loads(study)

    # Append the project name to the "table_" prefix, so this dataset
    # will be read as a IVAaN tabular dataset.   Then any dashes are replaced with 
    # underscores to avoid dashes in mongo collection names

    print "using project name: ",projectName
    # build name from "table" + date + dropped filename
    collectionName = 'table_'+projectName
    collectionNameNoDashes = string.replace(collectionName,'-','_')
    print "modified collection name: ",collectionNameNoDashes

    # open a database connection
    connection = Connection('localhost', 27017)
    db = connection["ivaan"]
    data_coll = db[collectionNameNoDashes]

    # we have a single JSON object here with all the fields to store, but some of them are floating point numbers which
    # are coming across as strings  (e.g.  "4.555") instead of a number 4.555.  To fix this, we will iterate through the fields
    # and convert values into numbers if they are convertable

    storageDict = {}
    for attrib in jsonObj.keys():
        if isinstance(jsonObj[attrib],list):
            storageDict[attrib] = jsonObj[attrib]
        else:
            storageDict[attrib] = convertIfNumber(jsonObj[attrib])
    try:
        data_coll.insert(storageDict)

    except ValueError:
        response['error'] = "Could not convert to JSON"
        return bson.json_util.dumps(response)

    connection.close()

    # Pack the results into the response object, and return it.
    #response['result'] = jsonoutput
    response['result'] = 'OK'

    # Return the response object.
    tangelo.log(str(response))
    return bson.json_util.dumps(response)
