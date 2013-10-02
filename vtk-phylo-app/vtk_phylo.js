/*jslint browser: true */
/*globals d3, $ */

var app = {};
app.key = null;
app.viewport = null;

// Method call at exit time
function stop() {
    if (app.key) {
        req = d3.json("/vtkweb/" + app.key);
        req.send("DELETE", function (e, resp) {
            if (resp.status !== "complete") {
               console.log(" error: could not shut down vtkweb process");
            }
            if (app.viewport) {
              app.viewport.unbind();
              $("#viewport").empty();
              //for future  RPC calls
              //connection.session.call('vtk:exit'); connection.session.close(); connection.session = null;
            }
      });
    }
}

window.onunload = window.onbeforeunload = stop;



function run_vtk_vis(tURL){
    stop();

    proc = d3.json(tURL);
    proc.post(function (e, resp) {
        console.log(resp);
        if (resp.status !== "complete") {
            console.log("oops :(");
            console.log(e);
            console.log(resp);
            return;
        }

        var connection = {
            sessionURL: resp.url,
            name: "WebTree",
            description: "Simple VTK Web demo application",
            application: "tree"
        },
        loading = $(".loading");
        app.viewport = null;

        app.key = resp.key;

        console.log(connection.sessionURL);

        // Connect to remote server
        vtkWeb.connect(connection, function(serverConnection) {
            connection = serverConnection;

            // Create viewport
            app.viewport = vtkWeb.createViewport({session:connection.session});
            //app.viewport.bind(".viewport-container");
            app.viewport.bind("#viewport");

            loading.hide();

            // Handle window resize
            $(window).resize(function() {
                if(app.viewport) {
                    app.viewport.render();
                }
            }).trigger('resize');
        }, function(code, reason) {
            loading.hide();
            alert(reason);
        });


        function updateView() {
            if(app.viewport) {
                app.viewport.invalidateScene();
            }
        }

    });
}

function run_vtk_tree_heatmap(treeFile, tableFile) {
    tURL =  "/vtkweb/arbor/vtk-phylo-app/vtk_tree_heatmap.py?progargs=" + encodeURIComponent("--tree "+treeFile+" --table "+tableFile);
    console.log(treeFile  +"  "+ tableFile);
    run_vtk_vis(tURL);
}

function run_vtk_tanglegram(tree1File, tree2File, tableFile) {
    tURL =  "/vtkweb/arbor/vtk-phylo-app/vtk_tanglegram.py?progargs=" + encodeURIComponent("--tree1 "+tree1File+" --tree2 "+tree2File+" --table "+tableFile);
    console.log(tree1File + "  " + tree2File +"  "+ tableFile);
    run_vtk_vis(tURL);
}


//---------- select data set -------------------------------
$(document).ready(function () {
  "use strict";
  var treeFile, tableFile;
  //Populate data list, call data_collection.py, which returns a list in json format
  d3.json("phylodata", function (error, list) {
      if (list){
          list.unshift({"id": "Select data to visualize", "name": "Select data"});
          d3.select("#datalist")
            .selectAll("option")
            .data(list).enter().append("option")
            .text(function (d) { return d.name; })
            .attr("value", function(d) {return d.id;})
      }else{
        alert("fail to query mongo database, no data found.");
      }
  });

  //select data set
  d3.select("select")
      .on("change",function(){
        var selectedDataId = $("#datalist").val();
        console.log("data id=" + selectedDataId);
        //calling the tangelo pythong service "phylodata.py" with the input argument selectedDataId
        d3.json("phylodata/" + selectedDataId, function (error, result){
           $("#vistype").val(result.visualizationType);
           if (result.visualizationType === "Tree Heatmap"){
               run_vtk_tree_heatmap(result.treeFile, result.tableFile);
           }else if (result.visualizationType === "Tanglegram"){
               run_vtk_tanglegram(result.tree1File, result.tree2File, result.tableFile);
           }else{
               console.log("unknown visulization type: "+ result.visualizationType)
           }
        });
     });

 //upload data

// init the widgets
// $("#progressbar").progressbar({ value: false });

});




