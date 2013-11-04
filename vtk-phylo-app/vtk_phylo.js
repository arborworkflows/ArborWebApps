/*jslint browser: true */
/*globals d3, $ */

var app = {};
app.key = null;
app.viewport = null;


//----------------------------------------------------
// Method call at exit time
function stop() {
    if (app.key) {
        req = d3.json("/vtkweb/" + app.key);
        console.log(req);
        req.send("DELETE", function (e, resp) {
            if (resp.status !== "complete") {
               console.log(" warning: could not shut down vtkweb process, might be closed already");
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


//----------------------------------------------------
function run_vtk_vis(tURL){
    stop();
    d3.select("body").style("cursor","wait");
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
            d3.select("body").style("cursor","default");

            // Handle window resize
            $(window).resize(function() {
                if(app.viewport) {
                    app.viewport.render();
                }
            }).trigger('resize');
        }, function(code, reason) {
            loading.hide();
            d3.select("body").style("cursor","default");
            alert(reason);
        });


        function updateView() {
            if(app.viewport) {
                app.viewport.invalidateScene(function(){
                d3.select("body").style("cursor","default");});
            }
           console.log("updateView");
        }

    });
}


//----------------------------------------------------
function run_vtk_tree_heatmap(id) {
    tURL =  "/vtkweb/arbor/vtk-phylo-app/vtk_tree_heatmap.py?progargs=" + encodeURIComponent("--id " + id);
    console.log(tURL);
    run_vtk_vis(tURL);

}


//----------------------------------------------------
function run_vtk_tanglegram(id) {
    tURL =  "/vtkweb/arbor/vtk-phylo-app/vtk_tanglegram.py?progargs=" + encodeURIComponent("--id " + id);
    console.log(tURL);
    run_vtk_vis(tURL);
}


//----------------------------------------------------
function showVis(selectedDataId) {
    d3.json("dbaccess/phylodata/" + selectedDataId, function (error, result){
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


//----------------------------------------------------
function showLastItem(){
  $('select#datalist').prop("selectedIndex",$("#datalist option").length-1);
  $('select#datalist').prop("text",$("#datalist").text());
  var id = $("#datalist").val();
  if (id !== "Select data"){
     showVis(id);
  }
}


//----------------------------------------------------
function handleReaderProgress(evt) {
        if (evt.lengthComputable) {
            var loaded = (evt.loaded / evt.total);
            //$("#progressbar").progressbar({ value: loaded * 100 });
        }
       console.log("handleReaderProgress")
  }


//----------------------------------------------------
function handleReaderLoadEnd(evt) {
      /* $("#progressbar").progressbar({ value: 100 });
       $("#droplabel").html("");
       $("#dropstatus").hide();
     */
       var data = d3.csv.parse(evt.target.result);
       console.log("handleReaderLoadEnd");
}

//----------------------------------------------------
function  uploadTreeFile(file) {
  d3.select("body").style("cursor","wait");
  var reader;
  var treeString;
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
    data = null;
    // Load data into the database
    treeString = evt.target.result;

    if (treeString[treeString.length-1] == '\n'){
      treeString = treeString.slice(0,-1); // get rid of '\n'
    }

    // create a json format data entry
    console.log("upload "+ file.name+ " to mongodb");
    var dataentry = new Object();
    dataentry.name = file.name;
    dataentry.tree = treeString;
    dataentry.table = "none";
    dataentry.visualizationType = "Tree";

    d3.json("dbaccess/phylodata").post(JSON.stringify(dataentry), function(error, id){
      d3.select("#datalist")
        .append("option")
        .datum({"id": id, "name": file.name})
        .attr("value", id)
        .text(file.name);
      $("#datalist").val(id);
      });

    d3.select("body").style("cursor","default");

  };
  reader.readAsText(file);
}


//----------------------------------------------------
function  uploadTreeTableFilePair(treefile, tablefile) {
//read csv file into a json string
  var treereader, tablereader;
  treereader = new FileReader();

  // init the reader event handlers
  treereader.onprogress = function (evt) {
    if (evt.lengthComputable) {
      var loaded = (evt.loaded / evt.total);
      // $("#progressbar").progressbar({ value: loaded * 100 });
    }
  };

  treereader.onloadend = function (evt) {
    var treeString = evt.target.result;

    //read the csv table file
    tablereader = new FileReader();
    tablereader.onloadend = function (evt) {
      var tableString = evt.target.result;

      // create a json format data entry
      var dataentry = new Object();

      var treeTableItemName  = treefile.name.substr(0, treefile.name.lastIndexOf('.'));
      dataentry.name = treeTableItemName;
      dataentry.tree = treeString;
      dataentry.table = tableString;
      dataentry.visualizationType = "Tree Heatmap";

      d3.json("dbaccess/phylodata").post(JSON.stringify(dataentry), function(error, id){
        d3.select("#datalist")
          .append("option")
          .datum({"id": id, "name": treeTableItemName})
          .attr("value", id)
          .text(treeTableItemName);
        $("#datalist").val(id);
      });
    };
    tablereader.readAsText(tablefile);
  };
  treereader.readAsText(treefile);
}


//----------------------------------------------------
function endsWith(str, suffix) {
      return str.indexOf(suffix, str.length - suffix.length) !== -1;
}


//----------------------------------------------------
function isTree(filename) {
  if (endsWith(filename, ".phy") || endsWith(filename, ".newick") || endsWith(filename, ".tre")){
    return true;
  } else {
    return false;
  }
}


//----------------------------------------------------
function isTable(filename) {
  if (endsWith(filename, ".csv")){
    return true;
  } else {
    return false;
  }
}







//----------------------------------------------------
window.onunload = window.onbeforeunload = stop;
$(document).ready(function () {
  "use strict";
  //Populate data list, call data_collection.py, which returns a list in json format
  d3.json("dbaccess/phylodata", function (error, list) {
      if (list){
          //add "Select data" to the top of the list
          list.unshift({"id": "Select data", "name": "Select data"});
          d3.select("#datalist")
            .selectAll("option")
            .data(list).enter().append("option")
            .text(function (d) { return d.name; })
            .attr("value", function(d) {return d.id;})
      }else{
        alert("fail to query mongo database, no data found.");
      }
  });


  d3.select("#viewport")
    .on("click", function(){
       d3.select("body").style("cursor", "default");
      });
// $("#progressbar").progressbar();

});


//drag and drop data file into the viewport
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
      var file, files, count;

      d3.event.stopPropagation();
      d3.event.preventDefault();

      files = d3.event.dataTransfer.files;
      count = files.length;

      // Only call the handler if 1 or more files was dropped.
      if (count > 0) {
          /*
          $("#dropstatus").show();
          $("#droplabel").html("Processing " + file.name);
           */
          console.log("dropped " + count+ " files");
          if (count == 2 ) {
            var file1 = files[0];
            var file2 = files[1];
            var treefile, tablefile;
            var IsTreeTablePair = false;
            if (isTable(file1.name) &&  isTree(file2.name)) {
                treefile = file2;
                tablefile = file1;
                IsTreeTablePair = true;
            } else if (isTable(file2.name) &&  isTree(file1.name)) {
                treefile = file1;
                tablefile = file2;
                IsTreeTablePair = true;
            }

            if (IsTreeTablePair){
              uploadTreeTableFilePair(treefile, tablefile);
            } else if (isTree(file2.name) &&  isTree(file1.name)) {
              uploadTreeFile(file1);
              uploadTreeFile(file2);
            } else {
              alert("Two csv files have been dropped: can not visualize tree data without the tree file!");
            }
          }
          else{
            for(var i = 0; i < count; i++){
              file = files[i];
              if (isTree(file.name)){
                 uploadTreeFile(file);
              }
            }
          }
       }
      // only visualize the last one uploaded
      d3.select("body").style("cursor","wait");
      setTimeout(function(){showLastItem()}, 3000);
    });

//delete data from mongo db
d3.select("#delete")
  .on("click", function () {
   var cur = $("#datalist").val();
   if (cur !== "Select data") {
       d3.json("dbaccess/phylodata/" + cur)
         .send("delete", "", function (error, result) {
           d3.select("#datalist").selectAll("option")
             .each(function (d) {
                 if (d.id === cur) {
                     d3.select(this).remove();
                     $("#datalist").val("Select data");
                     $("#vistype").val("");
                     stop();
                     //showLastItem();
                 }
             });
         });
       }
   });


//select data set
d3.select("select")
  .on("change",function(){
      var selectedDataId = $("#datalist").val();
      if (selectedDataId !== "Select data"){
          showVis(selectedDataId);
      }else{
          $("#vistype").val("");
      }
   });




