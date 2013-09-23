/*jslint browser: true */
/*globals d3, $, data_collection */


function updateView() {
    if(viewport) {
        viewport.invalidateScene();
    }
}

// Method call at exit time
function stop() {
  if(false && connection.session) {
    viewport.unbind();
    connection.session.call('vtk:exit');
    connection.session.close();
    connection.session = null;
  }
}


//---------------------------------------
function run_vtk_vis(treeFile,tableFile) {
  var connection = {
sessionURL: "ws://" + window.location.host + "/ws",
            name: "WebTree",
            description: "Simple VTK Web demo application",
            application: "tree"
  },
      datacollection = $(".data-collection");
  viewport = null;

  // Connect to remote server
  vtkWeb.connect(connection, function(serverConnection) {
    connection = serverConnection;

    // Create viewport
    viewport = vtkWeb.createViewport({session:connection.session});
    viewport.bind(".viewport-container");

    datacollection.show();

    // Handle window resize
    $(window).resize(function() {
      if(viewport) {
      viewport.render();
      }
      }).trigger('resize');
    }, function(code, reason) {
    alert(reason);
    });
}


//---- TO BE REMOVED------
var data_collection =
[
{
  "name": "anolis",
  "treeFile": "data/anolis.phy",
  "tableFile": "data/anolisDataAppended.csv",
  "visualizationType": "TreeHeatmap"
},
{
  "name": "Plolytomies",
  "treeFile": "data/tempo_scrubbed_CONSTRAINT_rooted.dated.POLYTOMIES.tre",
  "tableFile": [],
  "visualizationType": "TreeHeatmap"
},
];


//-----------------------------------------
$(document).ready(function () {
  "use strict";
  var treeFile, tableFile;
  //Populate data list
  //d3.json("data_collection", function (error, data_collection) {
  var datalist = data_collection;
  d3.select("#datalist")
    .selectAll("li")
    .data(datalist).enter().append("li").append("a")
    .attr("href", "#")
    .text(function (d) { return d.name; })
    .on("click", function (d) {
      run_vtk_vis(d.treeFile, d.tableFile);
      d3.event.preventDefault();
      });
  // });



  });
