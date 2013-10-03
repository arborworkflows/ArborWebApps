"""An example of a VTKWeb script for use with Tangelo's VTKWeb capabilities.

The add_arguments() function takes an argparse.ArgumentParser object, to which
the author may add possible command line flags, etc.

The initialize() function will be invoked by the VTKWeb framework in the
Protocol class's own initialize() method.  The VTK application logic goes here."""

import vtk
import math

def add_arguments(parser):
    parser.add_argument("--tree", help="path to phy tree file", dest="tree")
    parser.add_argument("--table", help="path to csv file", dest="table")

def initialize(self, VTKWebApp, args):
    VTKWebApp.treeFilePath = args.tree
    VTKWebApp.csvFilePath = args.table

    # Create default pipeline (Only once for all the session)
    if not VTKWebApp.view:
        treeHeatmapItem = vtk.vtkTreeHeatmapItem()

        # read in  a tree
        treeReader = vtk.vtkNewickTreeReader()
        treeReader.SetFileName(VTKWebApp.treeFilePath)
        treeReader.Update()
        tree = treeReader.GetOutput()
        treeHeatmapItem.SetTree(tree)

        if (VTKWebApp.csvFilePath != "none"):
          # read in  a table
          tableReader = vtk.vtkDelimitedTextReader()
          tableReader.SetFileName(VTKWebApp.csvFilePath)
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
