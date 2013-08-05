**vtk-phylo-app" is a web application enabled by vtk-web that could render phylogenetic trees with associated data with heatmap visulaizations and several interactions.

Steps to launch the application on the web:

1) Make sure you have the vtkWeb built on the server.

2) Run the following command (from this directory):
# Run a VTK Web Application
     ${VTK_BUILD}/bin/vtkpython vtk_web_tree.py  --content .  --tree ./data/anolis.phy --table ./data/anolisDataAppended.csv --port ${PORT}

3) open http://localhost:${PORT} in your browser.

