"""An example of a VTKWeb script for use with Tangelo's VTKWeb capabilities.

The add_arguments() function takes an argparse.ArgumentParser object, to which
the author may add possible command line flags, etc.

The initialize() function will be invoked by the VTKWeb framework in the
Protocol class's own initialize() method.  The VTK application logic goes here."""

import vtk
import math
import os.path
import csv
import pymongo
import json
import bson.objectid
import bson.json_util

def add_arguments(parser):
    parser.add_argument("--id", help="mongo data id", dest="id")

def getDBdata(id = None):
    coll = pymongo.Connection("mongo")["arbor"]["phylotree"]
    if id == None:
        return [{"id": str(doc["_id"]), "name": doc["name"]} for doc in coll.find(fields=["name"])]
    doc = coll.find_one(bson.objectid.ObjectId(id))
    if doc:
        del doc["_id"]
    return doc

def initialize(self, VTKWebApp, args):
    dataid = args.id
    treedata = getDBdata(dataid)
    VTKWebApp.tree1 = treedata["tree1"]
    VTKWebApp.tree2 = treedata["tree2"]
    VTKWebApp.table = dataid+ ".csv"

    # Create default pipeline (Only once for all the session)
    if not VTKWebApp.view:
        # read the trees
        treeReader1 = vtk.vtkNewickTreeReader()
        treeReader1.SetReadFromInputString(1)
        treeReader1.SetInputString(VTKWebApp.tree1)
        treeReader1.Update()
        tree1 = treeReader1.GetOutput()

        treeReader2 = vtk.vtkNewickTreeReader()
        treeReader2.SetReadFromInputString(1)
        treeReader2.SetInputString(VTKWebApp.tree2)
        treeReader2.Update()
        tree2 = treeReader2.GetOutput()

        # read the table
        tableReader = vtk.vtkDelimitedTextReader()
        tableReader.SetFileName(VTKWebApp.table)
        tableReader.SetHaveHeaders(True)
        tableReader.DetectNumericColumnsOn()
        tableReader.ForceDoubleOn()
        tableReader.Update()
        table = tableReader.GetOutput()

        # setup the tanglegram
        tanglegram = vtk.vtkTanglegramItem()
        tanglegram.SetTree1(tree1);
        tanglegram.SetTree2(tree2);
        tanglegram.SetTable(table);
        tanglegram.SetTree1Label("tree1");
        tanglegram.SetTree2Label("tree2");

        # setup the window
        view = vtk.vtkContextView()
        view.GetRenderer().SetBackground(1,1,1)
        view.GetRenderWindow().SetSize(800,600)

        iren = view.GetInteractor()
        iren.SetRenderWindow(view.GetRenderWindow())

        transformItem = vtk.vtkContextTransform()
        transformItem.AddItem(tanglegram)
        transformItem.SetInteractive(1)

        view.GetScene().AddItem(transformItem)
        view.GetRenderWindow().SetMultiSamples(0)

        iren.Initialize()
        view.GetRenderWindow().Render()

        # VTK Web application specific
        VTKWebApp.view = view.GetRenderWindow()
        self.Application.GetObjectIdMap().SetActiveObject("VIEW", view.GetRenderWindow())
