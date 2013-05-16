import tangelo
import cherrypy
import json
import pymongo
import bson.objectid
import bson.json_util

@tangelo.restful
def put(id):
	coll = pymongo.Connection("mongo")["arbor"]["workflows"]
	doc = json.load(cherrypy.request.body)
	doc["_id"] = bson.objectid.ObjectId(id)
	coll.save(doc)
	return json.dumps("updated")

@tangelo.restful
def post():
	coll = pymongo.Connection("mongo")["arbor"]["workflows"]
	doc = json.load(cherrypy.request.body)
	coll.save(doc)
	return json.dumps(str(doc["_id"]))

@tangelo.restful
def get(id = None):
	coll = pymongo.Connection("mongo")["arbor"]["workflows"]
	if id == None:
		return [str(doc["_id"]) for doc in coll.find()]
	doc = coll.find_one(bson.objectid.ObjectId(id))
	if doc:
		del doc["_id"]
		return json.dumps(doc, default=bson.json_util.default)
	return tangelo.HTTPStatusCode(404)

@tangelo.restful
def delete(id):
	coll = pymongo.Connection("mongo")["arbor"]["workflows"]
	doc = coll.remove(bson.objectid.ObjectId(id))
	return json.dumps("deleted")