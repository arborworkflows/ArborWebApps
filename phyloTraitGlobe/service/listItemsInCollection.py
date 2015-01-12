
import json
import string
import requests
import tangelo


def run(collectionName=None):
    # Create an empty response object.
    response = {}
    collectionNames = []

   # look through the collections in girder.  Return a list of collections that are in this local # Arbor instance

    girderlocation = 'http://localhost:9000'
    resp = requests.get(girderlocation+'/api/v1/collection')

    for coll in resp.json():
        if (coll['name'] == collectionName):
            collectionId = coll['_id']
            print "found collectionID:",collectionId
            break

    # get a list of all the folders inside this collection
    datafolderresp = requests.get(girderlocation+'/api/v1/folder?parentType=collection&parentId='+collectionId)
    print "found folder:", datafolderresp.text

    # find Data folder inside named collection
    for folder in datafolderresp.json():
        if (folder['name'] == 'Data'):
            folderId = folder['_id']
            print "found folderID:",collectionId
            break

    # loop through the folder
    dataitemsresp = requests.get(girderlocation+'/api/v1/item?folderId='+folderId)

    for item in dataitemsresp.json():
        collectionNames.append(item['name'])

    # Pack the results into the response object, and return it.
    response['result'] = collectionNames

    # Return the response object.
    tangelo.log(str(response))
    return json.dumps(response)
