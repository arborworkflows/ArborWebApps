import tangelo
import cherrypy
import json
import csv
import pymongo
import bson.objectid
import bson.json_util

@tangelo.restful
def put(id):
    coll = pymongo.Connection("mongo")["arbor"]["phylotree"]
    doc = json.load(cherrypy.request.body)
    doc["_id"] = bson.objectid.ObjectId(id)
    coll.save(doc)
    return json.dumps("updated")

@tangelo.restful
def post():
    coll = pymongo.Connection("mongo")["arbor"]["phylotree"]
    doc = json.load(cherrypy.request.body)
    coll.save(doc)
    return json.dumps(str(doc["_id"]))

@tangelo.restful
def get(id = None):
    coll = pymongo.Connection("mongo")["arbor"]["phylotree"]
    if id == None:
        return [{"id": str(doc["_id"]), "name": doc["name"]} for doc in coll.find(fields=["name"])]
    doc = coll.find_one(bson.objectid.ObjectId(id))
    if doc:
        del doc["_id"]
        treedata = json.dumps(doc, default=bson.json_util.default)
        #---------------------------------
        # Temp solution: save the table  blob into a csv file
        tableString = doc["table"]
        if (not tableString == "none"):
            filename = id + ".csv"
            #print("query "+ doc["name"]+ " save table file into " +filename)
            o = open(filename,'wb+')
            o.write(tableString)
            o.close()
        return treedata
    return tangelo.HTTPStatusCode(404)

@tangelo.restful
def delete(id):
    coll = pymongo.Connection("mongo")["arbor"]["phylotree"]
    doc = coll.remove(bson.objectid.ObjectId(id))
    return json.dumps("deleted")
