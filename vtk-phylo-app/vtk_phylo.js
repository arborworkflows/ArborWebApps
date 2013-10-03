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

function run_vtk_tree_heatmap(id) {
    tURL =  "/vtkweb/arbor/vtk-phylo-app/vtk_tree_heatmap.py?progargs=" + encodeURIComponent("--id " + id);
    console.log(tURL);
    run_vtk_vis(tURL);

}

function run_vtk_tanglegram(id) {
    tableFile = id + ".csv";
    tURL =  "/vtkweb/arbor/vtk-phylo-app/vtk_tanglegram.py?progargs=" + encodeURIComponent("--id" + id);
    run_vtk_vis(tURL);
}


//---------- select data set -------------------------------
$(document).ready(function () {
  "use strict";
  var treeFile, tableFile;
  //Populate data list, call data_collection.py, which returns a list in json format
  d3.json("phylodata", function (error, list) {
      if (list){
          list.unshift({"id": "Select data", "name": "Select data"}); //add "Select data" to the top of the list
          d3.select("#datalist")
            .selectAll("option")
            .data(list).enter().append("option")
            .text(function (d) { return d.name; })
            .attr("value", function(d) {return d.id;})
      }else{
        alert("fail to query mongo database, no data found.");
      }
  });


  function showVis(selectedDataId) {
        d3.json("phylodata/" + selectedDataId, function (error, result){
           if (!result){
             console.log("error finding data with id:"+ selectedDataId);
           }
           $("#vistype").val(result.visualizationType);
           if (result.visualizationType === "Tree Heatmap" || result.visualizationType == "Tree" ){
               run_vtk_tree_heatmap(selectedDataId);
           }else if (result.visualizationType === "Tanglegram"){
               run_vtk_tanglegram(selectedDataId);
           }else{
               console.log("unknown visulization type: "+ result.visualizationType)
           }
        });
  }



  //select data set
  d3.select("select")
      .on("change",function(){
        var selectedDataId = $("#datalist").val();
        //calling the tangelo pythong service "phylodata.py" with the input argument selectedDataId
        if (selectedDataId !== "Select data"){
            showVis(selectedDataId);
        }else{
            $("#vistype").val("");
        }
     });

    function handleReaderProgress(evt) {
        if (evt.lengthComputable) {
            var loaded = (evt.loaded / evt.total);

            //$("#progressbar").progressbar({ value: loaded * 100 });
        }
    }

    function handleReaderLoadEnd(evt) {
       /* $("#progressbar").progressbar({ value: 100 });
        $("#droplabel").html("");
        $("#dropstatus").hide();
      */
        var data = d3.csv.parse(evt.target.result);
    }

 //upload data
  d3.select("body")
        .on("dragenter", function () {
            d3.event.stopPropagation();
            d3.event.preventDefault();
        })
        .on("dragexit", function () {
            d3.event.stopPropagation();
            d3.event.preventDefault();
        })
        .on("dragover", function () {
            d3.event.stopPropagation();
            d3.event.preventDefault();
        })
        .on("drop", function () {
            var file, files, count, reader;

            d3.event.stopPropagation();
            d3.event.preventDefault();

            files = d3.event.dataTransfer.files;
            count = files.length;
            console.log(count + " file is dropped");

            // Only call the handler if 1 or more files was dropped.
            if (count > 0) {
                file = files[0];

                console.log(file.name);
                /*
                $("#dropstatus").show();
                $("#droplabel").html("Processing " + file.name);
                 */
                reader = new FileReader();
                // init the reader event handlers
                reader.onprogress = function (evt) {
                    if (evt.lengthComputable) {
                        var loaded = (evt.loaded / evt.total);
                       // $("#progressbar").progressbar({ value: loaded * 100 });
                    }
                };
                reader.onloadend = function (evt) {
                    var data, a;
                    /*
                    $("#progressbar").progressbar({ value: 100 });
                    $("#droplabel").html("");
                    $("#dropstatus").hide();
                     */
                    function endsWith(str, suffix) {
                        return str.indexOf(suffix, str.length - suffix.length) !== -1;
                    }

                    data = null;
                    if (endsWith(file.name, ".csv")) {
                        // TODO: Load data into the database
                        console.log("TODO:load table data to database")
                        console.log(evt.target.result);

                    } else if (endsWith(file.name, ".phy") || endsWith(file.name, ".newick") || endsWith(file.name, ".tre")){
                        // Load data into the database
                        var treeString = evt.target.result;
                        if (treeString[treeString.length-1] == '\n'){
                            treeString = treeString.slice(0,-1); // get rid of '\n'
                        }
                        //console.log("tree string:["+treeString+"]");

                        // create a json format data entry
                        var dataentry = new Object();
                        dataentry.name = file.name;
                        dataentry.tree = treeString;
                        dataentry.table = "none";
                        dataentry.visualizationType = "Tree";

                       d3.json("phylodata").post(JSON.stringify(dataentry), function(error, id){
                            d3.select("#datalist").append("option")
                              .datum({id: id, name: file.name})
                              .attr("value",id)
                              .text(file.name);
                            $("#datalist").val(id);
                            showVis(id);
                    });
                   }
                };
                reader.readAsText(file);
            }
        });


 //delete data from mongo db
  d3.select("#delete").on("click", function () {
     var cur = $("#datalist").val();
     if (cur !== "Select data") {
         d3.json("phylodata/" + cur).send("delete", "", function (error, result) {
             d3.select("#datalist").selectAll("option")
               .each(function (d) {
                   if (d.id === cur) {
                       d3.select(this).remove();
                       $("#vistype").val("");
                   }
               });
        });
     }
  });


// init the widgets
// $("#progressbar").progressbar();

});




