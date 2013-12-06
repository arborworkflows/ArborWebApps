// vtkweb vars
var app = {};
app.key = null;
app.viewport = null;
app.connection = null;

// Shut down a running VTKWeb process.  Called at exit time, and when a new process
// is started up.
function stop_vtkweb() {
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
      }
    });
  }
}

// display a vtkTreeHeatmapItem
function vtk_tree_heatmap(tree, table) {
  var width = $(window).width();
  var height = $(window).height();
  var vis_URL = "/vtkweb/arbor/analysis-app/vtk_tree_heatmap.py?progargs=";
  vis_URL += encodeURIComponent("--baseURL " + baseURL);
  vis_URL += encodeURIComponent(" --projectName " + project);
  vis_URL += encodeURIComponent(" --width " + width);
  vis_URL += encodeURIComponent(" --height " + height);
  if (table != "Select...") {
    vis_URL += encodeURIComponent(" --tableName " + table);
  }
  if (tree != "Select...") {
    vis_URL += encodeURIComponent(" --treeName " + tree);
  }
  run_vtk_vis(vis_URL);
}

// helper function for vtkweb display.  copied from vtk-phylo-app
function run_vtk_vis(tURL) {
  stop_vtkweb();
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
      app.connection = serverConnection;

      // Create viewport
      app.viewport = vtkWeb.createViewport(
        {
        session:app.connection.session,
        "interactiveQuality": 100
        });
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
