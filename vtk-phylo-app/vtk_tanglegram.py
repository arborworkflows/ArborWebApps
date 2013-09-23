"""An example of a VTKWeb script for use with Tangelo's VTKWeb capabilities.

The add_arguments() function takes an argparse.ArgumentParser object, to which
the author may add possible command line flags, etc.

The initialize() function will be invoked by the VTKWeb framework in the
Protocol class's own initialize() method.  The VTK application logic goes here."""

import vtk

def add_arguments(parser):
    parser.add_argument("--tree1", help="path to phy tree1 file", dest="tree1")
    parser.add_argument("--tree2", help="path to phy tree2 file", dest="tree2")
    parser.add_argument("--table", help="path to csv file", dest="table")

def initialize(self, VTKWebApp, args):
    VTKWebApp.tree1FilePath = args.tree1
    VTKWebApp.tree2FilePath = args.tree2
    VTKWebApp.csvFilePath = args.table

    # Create default pipeline (Only once for all the session)
    if not VTKWebApp.view:
        # read the trees
        treeReader1 = vtk.vtkNewickTreeReader()
        treeReader1.SetFileName(vtkWebApp.tree1FilePath)
        treeReader1.Update()
        tree1 = treeReader1.GetOutput()

        treeReader2 = vtk.vtkNewickTreeReader()
        treeReader2.SetFileName(vtkWebApp.tree2FilePath)
        treeReader2.Update()
        tree2 = treeReader2.GetOutput()

        # read the table
        tableReader = vtk.vtkDelimitedTextReader()
        tableReader.SetFileName(vtkWebApp.csvFilePath)
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
