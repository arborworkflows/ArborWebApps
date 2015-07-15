
import json
import string
import requests
import tangelo


def run(username,password):
    # Create an empty response object.
    response = {}
    collectionNames = []


   # look through the collections in girder.  Return a list of collections that are in this local # Arbor instance
    girderlocation = 'http://localhost:8080'
    resp = requests.get(girderlocation+'/api/v1/user/authentication', auth=(username,password))

    if 'authToken' in resp.json():
        fulltoken = resp.json()['authToken']
        print "found token:", fulltoken
        # return only the operative part
        collectionNames.append(fulltoken['token'])

    # Pack the results into the response object, and return it.
    response['result'] = collectionNames

    # Return the response object.
    tangelo.log(str(response))
    return json.dumps(response)