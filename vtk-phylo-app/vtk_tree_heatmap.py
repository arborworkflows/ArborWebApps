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
    VTKWebApp.tree = treedata["tree"]
    VTKWebApp.table = dataid+ ".csv"

    # Create default pipeline (Only once for all the session)
    if not VTKWebApp.view:
        treeHeatmapItem = vtk.vtkTreeHeatmapItem()

        # read in  a tree
        treeReader = vtk.vtkNewickTreeReader()
        treeReader.SetReadFromInputString(1)
        treeReader.SetInputString(VTKWebApp.tree)
        treeReader.Update()
        tree = treeReader.GetOutput()
        treeHeatmapItem.SetTree(tree)

        if (VTKWebApp.table != "none" and os.path.isfile(VTKWebApp.table)):
          # read in  a table
          tableReader = vtk.vtkDelimitedTextReader()
          tableReader.SetFileName(VTKWebApp.table)
          tableReader.SetHaveHeaders(1)
          tableReader.DetectNumericColumnsOn()
          tableReader.Update()
          table = tableReader.GetOutput()
          if (table):
              treeHeatmapItem.SetTable(table)


        # setup the window
        view = vtk.vtkContextView()
        view.GetRenderer().SetBackground(1,1,1)
        view.GetRenderWindow().SetSize(800,600)

        iren = view.GetInteractor()
        iren.SetRenderWindow(view.GetRenderWindow())

        transformItem = vtk.vtkContextTransform()
        transformItem.AddItem(treeHeatmapItem)
        transformItem.SetInteractive(1)

        view.GetScene().AddItem(transformItem)
        view.GetRenderWindow().SetMultiSamples(0)

        iren.Initialize()
        view.GetRenderWindow().Render()

        # adjust zoom so the item nicely fills the screen
        itemSize = [0, 0]
        treeHeatmapItem.GetSize(itemSize)

        itemSize.append(0)
        transformItem.GetTransform().MultiplyPoint(itemSize, itemSize)

        newWidth = view.GetScene().GetSceneWidth()
        newHeight = view.GetScene().GetSceneHeight()

        sx = newWidth * 0.9 / itemSize[0]
        sy = newHeight * 0.9 / itemSize[1]

        dx = math.fabs(sx - 1.0)
        dy = math.fabs(sy - 1.0)

        if dy > dx:
          transformItem.Scale(sy, sy)
        else:
          transformItem.Scale(sx, sx)

        # center the item within the screen
        itemCenter = [0, 0]
        treeHeatmapItem.GetCenter(itemCenter)
        itemCenter.append(0)

        centerPt = vtk.vtkPoints2D()
        centerPt.InsertNextPoint(newWidth / 2.0, newHeight / 2.0)
        transformItem.GetTransform().InverseTransformPoints(centerPt, centerPt)
        sceneCenter = [0, 0]
        centerPt.GetPoint(0, sceneCenter)

        dx = -1 * (itemCenter[0] - sceneCenter[0])
        dy = -1 * (itemCenter[1] - sceneCenter[1])

        transformItem.Translate(dx, dy)

        # VTK Web application specific
        VTKWebApp.view = view.GetRenderWindow()
        self.Application.GetObjectIdMap().SetActiveObject("VIEW", view.GetRenderWindow())
