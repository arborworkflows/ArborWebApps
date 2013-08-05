#**vtk-phylo-app** 
is a web application enabled by "VTK Web" (VTK with the web support, 
which used to be in ParaviewWeb) that can render phylogenetic
trees with associated data with heatmap visulaizations and several interactions.

Note that this particual web appication is not a Tangelo app, it is enabled by "vtkpython".

#Steps to launch the application on the server:

1) Make sure you have the vtkWeb built on the server.


2) Run the following command (from this directory):
     
     ${VTK_BUILD}/bin/vtkpython vtk_web_tree.py  --content .  --tree ./data/anolis.phy --table ./data/anolisDataAppended.csv --port ${PORT}


3) open http://localhost:${PORT} in your browser.

