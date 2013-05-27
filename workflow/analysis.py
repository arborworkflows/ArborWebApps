import tangelo
import cherrypy
import json
import pymongo
import bson.objectid
import bson.json_util
import rpy2.robjects as robjects
from rpy2.robjects.packages import importr

def fit_continuous_bm(analysis):
    tree_data = analysis["inputs"][0]["data"]
    table_data = analysis["inputs"][1]["data"]

    ape = importr("ape")
    geiger = importr("geiger")
    rjson = importr("rjson")

    r = robjects.r

    # anoleTree<-read.tree("anolis.phy")
    anoleTree = ape.read_tree(text=tree_data["content"])

    # anoleData<-read.csv("anolisDataAppended.csv", row.names=1)
    kwargs = {"text": table_data["content"], "row.names": robjects.Vector(1)}
    anoleData = r["read.csv"](**kwargs)

    # svl<-anoleData[,1]
    svl = anoleData.rx(True, 1)

    #names(svl) = r.rownames(anoleData)
    svl.names = r.rownames(anoleData)

    # bmOut<-fitContinuous(anoleTree, svl, model="BM")
    bmOut = geiger.fitContinuous(anoleTree, svl, model="BM")

    results = {
        "name": "results",
        "type": "table",
        "data": {
            "type": "json",
            "content": [json.loads(rjson.toJSON(bmOut.rx2("opt"))[0])]
        }
    }

    return [results]

def fit_continuous_ou(analysis):
    tree_data = analysis["inputs"][0]["data"]
    table_data = analysis["inputs"][1]["data"]

    ape = importr("ape")
    geiger = importr("geiger")
    rjson = importr("rjson")

    r = robjects.r

    # anoleTree<-read.tree("anolis.phy")
    anoleTree = ape.read_tree(text=tree_data["content"])

    # anoleData<-read.csv("anolisDataAppended.csv", row.names=1)
    kwargs = {"text": table_data["content"], "row.names": robjects.Vector(1)}
    anoleData = r["read.csv"](**kwargs)

    # svl<-anoleData[,1]
    svl = anoleData.rx(True, 1)

    #names(svl) = r.rownames(anoleData)
    svl.names = r.rownames(anoleData)

    # ouOut<-fitContinuous(anoleTree, svl, model="OU")
    ouOut = geiger.fitContinuous(anoleTree, svl, model="OU")

    results = {
        "name": "results",
        "type": "table",
        "data": {
            "type": "json",
            "content": [json.loads(rjson.toJSON(ouOut.rx2("opt"))[0])]
        }
    }

    #ouTree<-transform(anoleTree, "OU", ouOut$opt$alpha)
    ouTree = geiger.transform(anoleTree, "OU", ouOut.rx2("opt").rx2("alpha"))
    outTree = {
        "name": "transformed tree",
        "type": "tree",
        "data": {
            "type": "newick",
            "content": ape.write_tree(ouTree)[0]
        }
    }

    return [results, outTree]

def fit_continuous_eb(analysis):
    tree_data = analysis["inputs"][0]["data"]
    table_data = analysis["inputs"][1]["data"]

    ape = importr("ape")
    geiger = importr("geiger")
    rjson = importr("rjson")

    r = robjects.r

    # anoleTree<-read.tree("anolis.phy")
    anoleTree = ape.read_tree(text=tree_data["content"])

    # anoleData<-read.csv("anolisDataAppended.csv", row.names=1)
    kwargs = {"text": table_data["content"], "row.names": robjects.Vector(1)}
    anoleData = r["read.csv"](**kwargs)

    # svl<-anoleData[,1]
    svl = anoleData.rx(True, 1)

    #names(svl) = r.rownames(anoleData)
    svl.names = r.rownames(anoleData)

    # ebOut<-fitContinuous(anoleTree, svl, model="EB")
    ebOut = geiger.fitContinuous(anoleTree, svl, model="EB")

    results = {
        "name": "results",
        "type": "table",
        "data": {
            "type": "json",
            "content": [json.loads(rjson.toJSON(ebOut.rx2("opt"))[0])]
        }
    }

    #ebTree<-transform(anoleTree, "EB", ebOut$opt$a)
    ebTree = geiger.transform(anoleTree, "EB", ebOut.rx2("opt").rx2("a"))
    outTree = {
        "name": "transformed tree",
        "type": "tree",
        "data": {
            "type": "newick",
            "content": ape.write_tree(ebTree)[0]
        }
    }

    return [results, outTree]

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
            return fit_continuous_bm(analysis)
        if analysis["type"] == "arbor.fit_continuous_ou":
            return fit_continuous_ou(analysis)
        if analysis["type"] == "arbor.fit_continuous_eb":
            return fit_continuous_eb(analysis)

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
