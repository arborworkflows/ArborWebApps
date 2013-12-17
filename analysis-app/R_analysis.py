"""Perform a remote R analysis.
Note that this script requires the requests module.
Install it with pip if necessary.
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
  # standard arguments.  As we parse info out of query_args, we
  # also delete it from the dictionary.  This way we are eventually
  # left with only our analysis parameters.
  baseURL = query_args["baseURL"]
  del query_args["baseURL"]
  projectName = query_args["projectName"]
  del query_args["projectName"]
  analysis = query_args["analysis"]
  del query_args["analysis"]

  # parse & load inputs
  inputs = []
  inputTypes = ["tables", "trees"]
  for inputType in inputTypes:
    key = "ARBOR_ANALYSIS_INPUT_%s" % inputType.upper()
    if key in query_args:
      input_names = query_args[key].split("&")
      for input_name in input_names:
        if inputType == "tables":
          inputTable = LoadInputTable(query_args[input_name], baseURL, projectName)
          inputTable["name"] = input_name
          inputs.append(inputTable)
        elif inputType == "trees":
          inputTree = LoadInputTree(query_args[input_name], baseURL, projectName)
          inputTree["name"] = input_name
          inputs.append(inputTree)
        del query_args[input_name]
      del query_args[key]

  # parse outputs
  outputs = []
  outputTypes = ["tables", "trees"]
  # outputMap is used later on to map outputs from the name in the R script
  # to the name that the user requested.
  outputMap = {}
  for outputType in outputTypes:
    key = "ARBOR_ANALYSIS_OUTPUT_%s" % outputType.upper()
    if key in query_args:
      output_names = query_args[key].split("&")
      for output_name in output_names:
        if outputType == "tables":
          outputs.append({"name": output_name, "type": "Table"})
          outputMap[output_name] = query_args[output_name]
        elif outputType == "trees":
          outputs.append({"name": output_name, "type": "Tree"})
          outputMap[output_name] = query_args[output_name]
        del query_args[output_name]
      del query_args[key]

  # get the script for this analysis
  r = requests.get(
    "%s/arborapi/projmgr/analysis/%s/script" % (baseURL, analysis))
  script = r.text

  # at this point, everything remaining in the query_args dict
  # is a parameter.  Replace each parameter key with its value in
  # our script.
  for key, value in query_args.iteritems():
    script = script.replace(key, value)

  # set up the JSON object to send to the remote processing server.
  analysisJson = {}
  analysisJson["name"] = analysis
  analysisJson["inputs"] = inputs
  analysisJson["outputs"] = outputs
  analysisJson["script"] = script

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

    # store each output in the Tree Store
    for analysisOutput in analysisOutputs:
      if analysisOutput["type"] == "Table":
        fileType = "csv"
        # get the result table & convert it to CSV
        tableSerialized = analysisOutput["data"]
        table = vtk_arbor_utils.DeserializeVTKTable(tableSerialized)
        data = vtk_arbor_utils.VTKTableToCSV(table)

      elif analysisOutput["type"] == "Tree":
        fileType = "newick"
        # get the tree (serialized VTK string) and convert it to newick
        treeSerialized = analysisOutput["data"]
        tree = vtk_arbor_utils.DeserializeVTKTree(treeSerialized)
        data = vtk_arbor_utils.VTKTreeToNewick(tree)

      # push this output into the database
      analysisOutputName = outputMap[analysisOutput["name"]]
      putURL = "%s/arborapi/projmgr/project/%s" % (baseURL, projectName)
      putURL += "?filename=%s&filetype=%s&datasetname=%s&data=%s" % (analysisOutputName, fileType, analysisOutputName, data)
      r = requests.put(putURL)

    return json.dumps({"status": "Success"})

  return json.dumps({"status": "Failure"})

# Download tree from ArborAPI & load it into JSON in the format our
#R engine expects: serialized VTK string
def LoadInputTree(treeName, baseURL, projectName):
  inputTree = {}
  inputTree["type"] = "Tree"

  r = requests.get(
    "%s/arborapi/projmgr/project/%s/PhyloTree/%s/newick" % (baseURL, projectName, treeName))
  newick = r.text
  tree = vtk_arbor_utils.NewickToVTKTree(newick)
  treeSerialized = vtk_arbor_utils.SerializeVTKTree(tree)
  inputTree["data"] = treeSerialized
  return inputTree

# Download table from ArborAPI & load it into JSON in the format our
#R engine expects: serialized VTK string
def LoadInputTable(tableName, baseURL, projectName):
  inputTable = {}
  inputTable["type"] = "Table"
  r = requests.get(
    "%s/arborapi/projmgr/project/%s/CharacterMatrix/%s/csv" % (baseURL, projectName, tableName))
  csv = r.text
  table = vtk_arbor_utils.CSVToVTKTable(csv)
  tableSerialized = vtk_arbor_utils.SerializeVTKTable(table)
  inputTable["data"] = tableSerialized
  return inputTable
