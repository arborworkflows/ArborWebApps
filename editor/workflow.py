import tangelo
import cherrypy
import json
import pymongo
import bson.objectid
import bson.json_util
import os

def getDatabase():
    if 'MONGOLAB_URI' in os.environ:
        mongo_uri = os.environ['MONGOLAB_URI']
        other_part, sep, mongo_db = mongo_uri.rpartition('/')
        return pymongo.MongoClient(mongo_uri)[mongo_db]
    return pymongo.MongoClient("mongo")["arbor"]

@tangelo.restful
def put(id):
    coll = getDatabase()["workflows"]
    doc = json.load(cherrypy.request.body)
    doc["_id"] = bson.objectid.ObjectId(id)
    coll.save(doc)
    return json.dumps("updated")

@tangelo.restful
def post():
    coll = getDatabase()["workflows"]
    doc = json.load(cherrypy.request.body)
    coll.save(doc)
    return json.dumps(str(doc["_id"]))

@tangelo.restful
def get(id = None):
    coll = getDatabase()["workflows"]
    if id == None:
        return [{"id": str(doc["_id"]), "name": doc["name"]} for doc in coll.find(fields=["name"])]
    doc = coll.find_one(bson.objectid.ObjectId(id))
    if doc:
        del doc["_id"]
        return json.dumps(doc, default=bson.json_util.default)
    return tangelo.HTTPStatusCode(404)

@tangelo.restful
def delete(id):
    coll = getDatabase()["workflows"]
    doc = coll.remove(bson.objectid.ObjectId(id))
    return json.dumps("deleted")