
import json
import string
import requests
import tangelo


def run(usertoken):
    # Create an empty response object.
    response = {}
    collectionNames = []

    # build custom girder header for authenticated access
    girderheader = {'Girder-Token': usertoken}
    print 'girderheader:',girderheader

    # look through the collections in girder.  Return a list of collections that are in this local # Arbor instance
    girderlocation = 'http://localhost:9000'
    resp = requests.get(girderlocation+'/api/v1/collection',headers=girderheader)

    # nothing particularly interesting here
    #print resp.headers
    #print requests.utils.dict_from_cookiejar(resp.cookies)

    for entry in resp.json():
        collname = entry['name']
        print "found collection:", collname
        collectionNames.append(entry['name'])

    # Pack the results into the response object, and return it.
    response['result'] = collectionNames

    # Return the response object.
    tangelo.log(str(response))
    return json.dumps(response)
