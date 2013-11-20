/*jslint browser: true, nomen: true, unparam: true */

// hardcoded project name for now
var project = "anolis";

// used by Python services to communicate with this server.
var baseURL = window.location.protocol + "//" + window.location.host;

// vtkweb vars
var app = {};
app.key = null;
app.viewport = null;

// d3 phylotree vars
var root, d3_vis;

(function (tangelo, $, d3) {
    "use strict";
    initialize();
}(window.tangelo, window.$, window.d3));

function initialize() {
    $("#vis_tree").prop("disabled", true);
    $("#vis_table").prop("disabled", true);

    populate_selects();

    // initialize d3 phylo tree
    root = tangelo.data.tree({
        data: [{_id: {$oid: 0}}],
        id: {field: "_id.$oid"},
        idChild: {field: "$oid"},
        children: {field: "clades"}
    });

    d3_vis = tangelo.vis.dendrogram({
        data: root,
        el: d3.select("#d3_vis").node(),
        id: {field: "_id.$oid"},
        label: {field: "name"},
        distance: {field: "branch_length"},
        nodeLimit: 1000
    });
}

// function to populate our select menus (except for parameter)
function populate_selects() {
    d3.json("/arborapi/projmgr/project/" + project + "/PhyloTree", function (error, trees) {
        trees.unshift("Select...");
        d3.select("#vis_tree").selectAll("option").remove();
        d3.select("#vis_tree").selectAll("option")
            .data(trees)
            .enter().append("option")
            .text(function (d) { return d; });
        d3.select("#analysis_tree").selectAll("option").remove();
        d3.select("#analysis_tree").selectAll("option")
            .data(trees)
            .enter().append("option")
            .text(function (d) { return d; });

        d3.json("/arborapi/projmgr/project/" + project + "/CharacterMatrix", function (error, tables) {
            tables.unshift("Select...");
            d3.select("#vis_table").selectAll("option").remove();
            d3.select("#vis_table").selectAll("option")
                .data(tables)
                .enter().append("option")
                .text(function (d) { return d; });
            d3.select("#analysis_table").selectAll("option").remove();
            d3.select("#analysis_table").selectAll("option")
                .data(tables)
                .enter().append("option")
                .text(function (d) { return d; });
        });
    });
}

// function called at exit time
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
            }
        });
    }
}

// actions performed when the user selects a visualization
d3.select("#vis").on("change", function() {
    var selected_vis = $("#vis").val();
    if (selected_vis == "VTK TreeHeatmap") {
        $("#vis_tree").prop("disabled", false);
        $("#vis_table").prop("disabled", false);
    } else if (selected_vis == "D3 Tree") {
        $("#vis_tree").prop("disabled", false);
        $("#vis_table").prop("disabled", true);
    } else if (selected_vis == "Table") {
        $("#vis_tree").prop("disabled", true);
        $("#vis_table").prop("disabled", false);
    } else {
        $("#vis_tree").prop("disabled", true);
        $("#vis_table").prop("disabled", true);
    }
    update_vis();
});

// actions performed when the user selects a tree to visualize
d3.select("#vis_tree").on("change", function() {
    if ($("#analysis_tree").val() == "Select...") {
        $("#analysis_tree").val($("#vis_tree").val());
    }
    update_vis();
});

// actions performed when the user selects a table to visualize
d3.select("#vis_table").on("change", function() {
    if ($("#analysis_table").val() == "Select...") {
        $("#analysis_table").val($("#vis_table").val());
    }
    update_vis();
});

// actions performed when the user selects an analysis
d3.select("#analysis").on("change", function() {
    update_analyze_button();
});

// actions performed when the user selects a tree for analysis
d3.select("#analysis_tree").on("change", function() {
    update_analyze_button();
});

// actions performed when the user selects a parameter for analysis
d3.select("#parameter").on("change", function() {
    update_analyze_button();
});

// actions performed when the user selects a table for analysis
d3.select("#analysis_table").on("change", function() {
    var selected_table = $("#analysis_table").val();
    if (selected_table != "Select...") {
        populate_parameter(selected_table);
    }
    update_analyze_button();

});

// enable or disable the analyze button
function update_analyze_button() {
    if ($("#analysis").val() != "Select..." &&
        $("#analysis_tree").val() != "Select..." &&
        $("#analysis_table").val() != "Select..." &&
        $("#parameter").val() &&
        $("#parameter").val() != "Select...") {
        $("#analyze").prop("disabled", false);
    } else {
        $("#analyze").prop("disabled", true);
    }
}

// populate the parameter element with a list of column names
function populate_parameter(selected_table) {
    d3.json("/arborapi/projmgr/project/" + project + "/CharacterMatrix/" + selected_table, function (error, result) {
        // clear out previous contents
        $("#parameter").empty();

        var contents = "<option>Select...</option>";
        var headerRow = result[0];
        $.each(headerRow, function(key, value) {
            if (key != "_id") {
                contents += "<option>" + key + "</option>";
            }
        });
        $("#parameter").append(contents);
    });
}

// display a visualization if appropriate
function update_vis() {
    var selected_vis = $("#vis").val();
    var selected_tree = $("#vis_tree").val();
    var selected_table = $("#vis_table").val();
    if (selected_vis == "VTK TreeHeatmap") {
        if (selected_tree != "Select..." || selected_table != "Select...") {
            $("#d3_tools").hide();
            $("#d3_vis").hide();
            $("#viewport").show();
            $("#grid").hide();
            vtk_tree_heatmap(selected_tree, selected_table);
        }
    } else if (selected_vis == "D3 Tree") {
        if (selected_tree != "Select...") {
            $("#d3_tools").show();
            $("#d3_vis").show();
            $("#viewport").hide();
            $("#grid").hide();
            d3_tree(selected_tree);
        }
    } else if (selected_vis == "Table") {
        if (selected_table != "Select...") {
            $("#d3_tools").hide();
            $("#d3_vis").hide();
            $("#viewport").hide();
            $("#grid").show();
            display_table(selected_table);
        }
    }
};

// display a vtkTreeHeatmapItem
function vtk_tree_heatmap(tree, table) {
    var vis_URL = "/vtkweb/arbor/analysis-app/vtk_tree_heatmap.py?progargs=";
    vis_URL += encodeURIComponent("--baseURL " + baseURL);
    vis_URL += encodeURIComponent(" --projectName " + project);
    if (table != "Select...") {
        vis_URL += encodeURIComponent(" --tableName " + table);
    }
    if (tree != "Select...") {
        vis_URL += encodeURIComponent(" --treeName " + tree);
    }
    run_vtk_vis(vis_URL);
}

// display a D3 phylotree
function d3_tree(selected_tree) {
    d3.json("/arborapi/projmgr/project/" + project + "/PhyloTree/" + selected_tree, function (error, collection) {
        root = tangelo.data.tree({
            data: collection,
            id: {field: "_id.$oid"},
            idChild: {field: "$oid"},
            children: {field: "clades"}
        });

        d3_vis.update({data: root});
    });
}

// display a table
function display_table(selected_table) {
    // get specified json table data
    d3.json("/arborapi/projmgr/project/" + project + "/CharacterMatrix/" + selected_table, function (error, result) {
        // clear out previous contents of table
        $("#grid_table").empty();

        var header = "<thead>";
        var body = "<tbody>";
        var headerSet = 0;
        $.each(result, function(key, value) {
            var row = "<tr>";
            $.each(value, function(key, value) {
                if (key != "_id") {
                    row += "<td>" + value + "</td>";
                    if (headerSet == 0) {
                        header += "<th>" + key + "</th>";
                    }
                }
            });
            headerSet = 1;
            row += "</tr>";
            body += row;
        });
        header += "</thead>";
        body += "</tbody>";
        $("#grid_table").append(header);
        $("#grid_table").append(body);
    });
}

// react to the user pressing the "Perform Analysis" button
d3.select("#analyze").on("click", function () {
    var tree = $("#analysis_tree").val();
    var table = $("#analysis_table").val();
    var prefix = $("#prefix").val();
    var parameter = $("#parameter").val();
    if ($("#analysis").val() == "Early Burst") {
        var analysis_URL = "/arbor/analysis-app/EB?";
        analysis_URL += "baseURL=" + encodeURIComponent(baseURL);
        analysis_URL += "&projectName=" + encodeURIComponent(project);
        analysis_URL += "&tableName=" + encodeURIComponent(table);
        analysis_URL += "&treeName=" + encodeURIComponent(tree);
        analysis_URL += "&prefix=" + encodeURIComponent(prefix);
        analysis_URL += "&parameter=" + encodeURIComponent(parameter);
        run_analysis(analysis_URL);
    }
});

// perform an analysis by accessing the given URL
function run_analysis(analysis_URL) {
    d3.select("body").style("cursor","wait");

    d3.json(analysis_URL, function (error, result) {
        if (result) {
            alert("Analysis results: " + result.status);
        }
        d3.select("body").style("cursor","default");
        populate_selects();
    });
}

// upload data button clicked
d3.select("#upload").on("click", function () {
    var reader = new window.FileReader(),
        file = d3.select("#file").node().files[0];

    reader.onload = function (e) {
        var fileName = file.name;
        var dataName = file.name.replace(/\.[^/.]+$/, "")
        var content = e.target.result;
        var fileType;

        if (/csv$/.test(fileName)) { fileType = "csv"; }
        else { fileType = "newick"; }

        d3.json("/arborapi/projmgr/project/" + project + "?filename=" + fileName + "&filetype=" + fileType + "&datasetname=" + dataName + "&data=" + encodeURIComponent(content))
            .send("put", content, function (error, data) {
                populate_selects();
            });
    };
    reader.readAsText(file);
});

// helper function for vtkweb display.  copied from vtk-phylo-app
function run_vtk_vis(tURL) {
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
            app.viewport = vtkWeb.createViewport(
              {
              session:connection.session,
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

// d3 phylotree support functions begin here

d3.select("#mode-hide").on("click", function () {
    d3_vis.update({mode: "hide"});
});

d3.select("#mode-focus").on("click", function () {
    d3_vis.update({mode: "focus"});
});

d3.select("#mode-label").on("click", function () {
    d3_vis.update({mode: "label"});
});

d3.select("#distance-unit").on("click", function () {
    d3_vis.update({distance: {value: 1}});
});

d3.select("#distance-branch-length").on("click", function () {
    d3_vis.update({distance: {field: "branch_length"}});
});

d3.select("#node-limit-500").on("click", function () {
    d3_vis.update({nodeLimit: 500});
});

d3.select("#node-limit-1000").on("click", function () {
    d3_vis.update({nodeLimit: 1000});
});

d3.select("#node-limit-2000").on("click", function () {
    d3_vis.update({nodeLimit: 2000});
});

d3.select("#reset").on("click", function () {
    d3_vis.reset();
});

d3.select("#pdf").on("click", function () {
    d3_vis.download("pdf");
});

function performEvent(element, name) {
    if (document.createEvent !== undefined) {
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent(name, false, true);
        element.dispatchEvent(evt);
    } else {
        element.fireEvent("on" + name);
    }
}

// end of d3 phylotree functions
