/*jslint browser: true */
/*globals d3, $ */

var app = {};
app.key = null;
app.viewport = null;

// Method call at exit time
function stop() {

    if (app.viewport) {
    app.viewport.unbind();
    //for future  RPC calls
    //connection.session.call('vtk:exit'); connection.session.close(); connection.session = null;
    }

    req = d3.xhr("/vtkweb/" + app.key);
    req.send("DELETE", function (e, resp) {
        if (resp.status !== "complete") {
            console.log(resp.status + " error: could not shut down vtkweb process");
        }
    });
}

window.onunload = window.onbeforeunload = stop;

function run_vtk_vis(treeFile, tableFile) {
    stop();
    console.log(treeFile);
    console.log(tableFile);
    tURL =  "/vtkweb/arbor/vtk-phylo-app/vtk_vis.py?progargs=" + encodeURIComponent("--tree "+treeFile+" --table "+tableFile)
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


//---------- select data set -------------------------------
$(document).ready(function () {
  "use strict";
  var treeFile, tableFile;
  //Populate data list, call data_collection.py, which returns a list
  d3.json("phylodata", function (error, list) {
      list.unshift({"id": "Select data to visulaize", "name": "Select data"});
      d3.select("#datalist")
          .selectAll("option")
          .data(list).enter().append("option")
          .text(function (d) { return d.name; })
          .attr("value", function(d) {return d.id;})
  });

  //select data set
  d3.select("select")
      .on("change",function(){
        var selectedDataId = $("#datalist").val();
        //obtain the files
        d3.json("phylodata/"+selectedDataId, function (error, result){
           console.log("restuls"+result);
           run_vtk_vis(result.treeFile, result.tableFile);
               //d3.event.preventDefault();
        });
     });

 });




