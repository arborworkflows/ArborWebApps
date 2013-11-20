"""Perform the Early-burst model fitting analysis on a tree and its
associated character matrix.  Note that this script requires the
requests module.  Install it with pip if necessary.
"""

import bson.objectid
import json
import pymongo
import requests
import tangelo
import vtk
import vtk_arbor_utils
from time import sleep

import sys

@tangelo.restful
def get(*pargs, **query_args):
  # parse arguments
  baseURL = query_args["baseURL"]
  projectName = query_args["projectName"]
  tableName = query_args["tableName"]
  treeName = query_args["treeName"]
  prefix = query_args["prefix"]
  parameter = query_args["parameter"]
  analysis = query_args["analysis"]

  # Populate the request for the analysis server
  # TODO: move this analysis-specific initialization into a separate file
  analysisJson = {}
  if analysis == "Early Burst model fitting":
    model = "EB"
    analysisJson["script"] = "library(geiger)\ndata<-as.numeric(input_table$%s)\nnames(data)<-input_table[[1]]\no<-fitContinuous(input_tree, data, model=\"%s\",SE=0)\nresult=o$opt\n%s_table=list(parameter=\"value\",z0=result$z0,sigsq=result$sigsq,a=result$a,\" \"=\" \",lnL=result$lnL,AIC=result$aic,AICc=result$aicc)\n%s_tree<-transform(input_tree, \"%s\", o$opt$a)\n" % (parameter, model, model, model,model)
  else:
    model = "OU"
    analysisJson["script"] = "library(geiger)\ndata<-as.numeric(input_table$%s)\nnames(data)<-input_table[[1]]\no<-fitContinuous(input_tree, data, model=\"%s\",SE=0)\nresult=o$opt\n%s_table=list(parameter=\"value\",z0=result$z0,sigsq=result$sigsq,alpha=result$alpha,\" \"=\" \",lnL=result$lnL,AIC=result$aic,AICc=result$aicc)\n%s_tree<-transform(input_tree, \"%s\", o$opt$alpha)\n" % (parameter, model, model, model,model)
  analysisJson["name"] = "Early-burst model fitting";
  analysisJson["outputs"] = [
    { "name": "%s_tree" % model, "type": "Tree"},
    { "name": "%s_table" % model, "type": "Table"}]
  analysisJson["parameters"] = [
    { "name": "column_name", "type": "String", "value": "" }]

  # initialize input information for this analysis
  inputs = []
  inputTree = {}
  inputTree["name"] = "input_tree"
  inputTree["type"] = "Tree"
  inputTable = {}
  inputTable["name"] = "input_table"
  inputTable["type"] = "Table"

  # Load input data into JSON in the format our R engine expects:
  # serialized VTK strings
  r = requests.get(
    "%s/arborapi/projmgr/project/%s/PhyloTree/%s/newick" % (baseURL, projectName, treeName))
  newick = r.text
  tree = vtk_arbor_utils.NewickToVTKTree(newick)
  treeSerialized = vtk_arbor_utils.SerializeVTKTree(tree)
  inputTree["data"] = treeSerialized

  r = requests.get(
    "%s/arborapi/projmgr/project/%s/CharacterMatrix/%s/csv" % (baseURL, projectName, tableName))
  csv = r.text
  table = vtk_arbor_utils.CSVToVTKTable(csv)
  tableSerialized = vtk_arbor_utils.SerializeVTKTable(table)
  inputTable["data"] = tableSerialized

  # add input data to the analysis request
  inputs.append(inputTree)
  inputs.append(inputTable)
  analysisJson["inputs"] = inputs

  # send the request to the analysis server & get the task ID
  r = requests.post(
    "http://arbor.kitware.com/service/tasks/celery/visomics/vtk/r",
    json.dumps(analysisJson),
    auth=requests.auth.HTTPDigestAuth('bob', 'tree'))
  jResponse = r.json()
  taskID = jResponse["id"]

  # check the status of our job
  jobDone = False
  while(not jobDone):
    r = requests.get(
      "http://arbor.kitware.com/service/tasks/celery/%s/status" % taskID,
      auth=requests.auth.HTTPDigestAuth('bob', 'tree'))
    jResponse = r.json()
    status = jResponse["status"]
    if status == "PENDING":
      sleep(1)
    else:
      jobDone = True

  if status == "SUCCESS":
    # get the results of the analysis
    r = requests.get(
      "http://arbor.kitware.com/service/tasks/celery/%s/result" % taskID,
      auth=requests.auth.HTTPDigestAuth('bob', 'tree'))
    analysisOutputs = r.json()["result"]["output"]

    # get the tree (serialized VTK string) and convert it to newick
    treeSerialized = analysisOutputs[0]["data"]
    tree = vtk_arbor_utils.DeserializeVTKTree(treeSerialized)
    newick = vtk_arbor_utils.VTKTreeToNewick(tree)

    # push the tree into the database
    outputName = "%stree" % prefix
    putURL = "%s/arborapi/projmgr/project/%s" % (baseURL, projectName)
    putURL += "?filename=%s&filetype=newick&datasetname=%s&data=%s" % (outputName, outputName, newick)
    r = requests.put(putURL)

    # get the result table & convert it to CSV
    tableSerialized = analysisOutputs[1]["data"]
    table = vtk_arbor_utils.DeserializeVTKTable(tableSerialized)
    csv = vtk_arbor_utils.VTKTableToCSV(table)

    # push the table into the database
    outputName = "%stable" % prefix
    putURL = "%s/arborapi/projmgr/project/%s" % (baseURL, projectName)
    putURL += "?filename=%s&filetype=csv&datasetname=%s&data=%s" % (outputName, outputName, csv)
    r = requests.put(putURL)

    return json.dumps({"status": "Success"})

  return json.dumps({"status": "Failure"})
