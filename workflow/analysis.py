import tangelo
import cherrypy
import json
import pymongo
import bson.objectid
import bson.json_util
#import rpy2.robjects as robjects
#from rpy2.robjects.packages import importr

@tangelo.restful
def put(id):
	coll = pymongo.Connection("mongo")["arbor"]["analyses"]
	doc = json.load(cherrypy.request.body)
	doc["_id"] = bson.objectid.ObjectId(id)
	coll.save(doc)
	return json.dumps("updated")

@tangelo.restful
def post(action = None):
	if action == None:
		coll = pymongo.Connection("mongo")["arbor"]["analyses"]
		doc = json.load(cherrypy.request.body)
		coll.save(doc)
		return json.dumps(str(doc["_id"]))
	elif action == "run":
		analysis = json.load(cherrypy.request.body)
		if analysis["type"] == "arbor.fit_continuous_bm":
			tree_data = analysis["inputs"][0]["data"]
			table_data = analysis["inputs"][0]["data"]
			#ape = importr("ape")
			#geiger = importr("geiger")
			#r = robjects.r
			#anoleTree = ape.read_tree(text=tree_data["content"])
			#kwargs = {"text": table_data["content"], "row.names": 1}
			#anoleData = r["read.csv"](**kwargs)
			#svl = anoleData[,1]
			#names(svl) = r.rownames(anoleData)
			#bmOut = geiger.fitContinuous(anoleTree, svl, model="BM")

			return analysis
		return analysis

@tangelo.restful
def get(id = None):
	coll = pymongo.Connection("mongo")["arbor"]["analyses"]
	if id == None:
		results = []
		for doc in coll.find():
			doc["id"] = str(doc["_id"])
			results.append(doc)
		return json.dumps(results, default=bson.json_util.default)
	doc = coll.find_one(bson.objectid.ObjectId(id))
	if doc:
		del doc["_id"]
		return json.dumps(doc, default=bson.json_util.default)
	return tangelo.HTTPStatusCode(404)

@tangelo.restful
def delete(id):
	coll = pymongo.Connection("mongo")["arbor"]["analyses"]
	doc = coll.remove(bson.objectid.ObjectId(id))
	return json.dumps("deleted")
