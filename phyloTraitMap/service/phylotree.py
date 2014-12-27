import json
import tangelo
import requests


def decode(s, argname, resp):
	try:
		return bson.json_util.loads(s)
	except ValueError as e:
		resp['error'] = e.message + " (argument '%s' was '%s')" % (argname, s)
		raise

def decodeAndAdd(s, output, argname, resp):
	try:
		#output = dict(decode(s, argname, resp).items() + output.items())
		if argname is '_id':
			output[argname] = ObjectId(str(s))
		else:
			output[argname] = bson.json_util.loads(s)
	except ValueError as e:
		resp['error'] = e.message + " (argument '%s' was '%s')" % (argname, s)
		raise

def run(collectionName, itemName):

	# Construct an empty response object.
	response = {}

	girderlocation = 'http://localhost:9000'

	# lookup the Arbor collection
	resp = requests.get(girderlocation+'/api/v1/collection')
	for coll in resp.json():
		if (coll['name'] == collectionName):
			collectionId = coll['_id']
			print "found collectionID:",collectionId
			break


 	# get a list of all the folders inside this collection
 	datafolderresp = requests.get(girderlocation+'/api/v1/folder?parentType=collection&parentId='+collectionId)
    #print "found folder:", datafolderresp.text

	# find Data folder inside named collection
	for folder in datafolderresp.json():
		if (folder['name'] == 'Data'):
			folderId = folder['_id']
			print "found folderID:",folderId
			break	

	# find this particular item by name inside the Data folder
	itemresp = requests.get(girderlocation+'/api/v1/item?folderId='+folderId)
	for item in itemresp.json():
		if (item['name'] == itemName):
			itemId = item['_id']
			print "found itemId:",itemId
			break	

    # request the tree content in its json.nested for
	try:
		treeresp = requests.get(girderlocation+'/api/v1/item/'+itemId+'/romanesco/tree/nested/nested');
		return treeresp.json()['data']
	except ValueError:
		response['error'] = "Search for tree unsuccessful"
		return bson.json_util.dumps(response)
