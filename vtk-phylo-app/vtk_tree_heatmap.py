"""An example of a VTKWeb script for use with Tangelo's VTKWeb capabilities.

The add_arguments() function takes an argparse.ArgumentParser object, to which
the author may add possible command line flags, etc.

The initialize() function will be invoked by the VTKWeb framework in the
Protocol class's own initialize() method.  The VTK application logic goes here."""

import vtk

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

        # VTK Web application specific
        VTKWebApp.view = view.GetRenderWindow()
        self.Application.GetObjectIdMap().SetActiveObject("VIEW", view.GetRenderWindow())
