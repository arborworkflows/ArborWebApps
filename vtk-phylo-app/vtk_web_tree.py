r"""
    This module is a VTK Web server application.
    The following command line illustrate how to use it::

        $ vtkpython .../vtk_web_tree.py

    Any VTK Web executable script come with a set of standard arguments that
    can be overriden if need be::

        --port 8080
             Port number on which the HTTP server will listen to.

        --content /path-to-web-content/
             Directory that you want to server as static web content.
             By default, this variable is empty which mean that we rely on another server
             to deliver the static content and the current process only focus on the
             WebSocket connectivity of clients.

        --authKey vtk-secret
             Secret key that should be provided by the client to allow it to make any
             WebSocket communication. The client will assume if none is given that the
             server expect "vtk-secret" as secret key.
"""

# import to process args
import sys
import os

# import vtk modules.
import vtk
from vtkweb import web, vtkweb_wamp, vtkweb_protocols

# import annotations
from autobahn.wamp import exportRpc

try:
    import argparse
except ImportError:
    # since  Python 2.6 and earlier don't have argparse, we simply provide
    # the source for the same as _argparse and we use it instead.
    import _argparse as argparse

# =============================================================================
# Create custom File Opener class to handle clients requests
# =============================================================================

class _WebTree(vtkweb_wamp.ServerProtocol):

    # Application configuration
    view    = None
    authKey = "vtkweb-secret"
    treeFilePath = None
    csvFilePath = None

    def initialize(self):
    	global renderer, renderWindow, renderWindowInteractor, cone, mapper, actor

        # Bring used components
        self.registerVtkWebProtocol(vtkweb_protocols.vtkWebMouseHandler())
        self.registerVtkWebProtocol(vtkweb_protocols.vtkWebViewPort())
        self.registerVtkWebProtocol(vtkweb_protocols.vtkWebViewPortImageDelivery())
        self.registerVtkWebProtocol(vtkweb_protocols.vtkWebViewPortGeometryDelivery())

        # Update authentication key to use
        self.updateSecret(_WebTree.authKey)

        # Create default pipeline (Only once for all the session)
        if not _WebTree.view:
            # read in  a tree
            treeReader = vtk.vtkNewickTreeReader()
            treeReader.SetFileName(_WebTree.treeFilePath)
            treeReader.Update()
            reader = treeReader.GetOutput()

            # read in  a table
            tableReader = vtk.vtkDelimitedTextReader()
            tableReader.SetFileName(_WebTree.csvFilePath)
            tableReader.Update()
            table = tableReader.GetOutput()

            #play with the heatmap vis
            treeHeatmapItem = vtk.vtkTreeHeatmapItem()
            treeHeatmapItem.SetTree(reader);
            treeHeatmapItem.SetTable(table);

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
            _WebTree.view = view.GetRenderWindow()
            self.Application.GetObjectIdMap().SetActiveObject("VIEW", view.GetRenderWindow())

# =============================================================================
# Main: Parse args and start server
# =============================================================================

if __name__ == "__main__":
    # Create argument parser
    parser = argparse.ArgumentParser(description="VTK/Web Tree web-application")

    # Add default arguments
    web.add_arguments(parser)

     # Add local arguments
    parser.add_argument("--tree", help="path to phy tree file", dest="tree")
    parser.add_argument("--table", help="path to csv file", dest="table")

    # Exctract arguments
    args = parser.parse_args()

    # Configure our current application
    _WebTree.authKey = args.authKey
    _WebTree.treeFilePath = args.tree
    _WebTree.csvFilePath = args.table

    # Start server
    web.start_webserver(options=args, protocol=_WebTree)
