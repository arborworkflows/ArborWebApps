/*jslint browser: true, nomen: true, unparam: true */

// hardcoded default project name for now
var project = "anolis";

// used by Python services to communicate with this server.
var baseURL = window.location.protocol + "//" + window.location.host;

(function (tangelo, $, d3) {
  "use strict";
  initialize();
}(window.tangelo, window.$, window.d3));

function initialize() {
  $("#vis_tree").prop("disabled", true);
  $("#vis_table").prop("disabled", true);
  $("#control-panel").controlPanel();

  populate_projects();
  initialize_dendrogram();
}

// populate the list of available projects
function populate_projects() {
  d3.json("/arborapi/projmgr/project", function (error, projects) {
    d3.select("#project").selectAll("option").remove();
    d3.select("#project").selectAll("option")
      .data(projects)
      .enter().append("option")
      .text(function (d) { return d; });

    project = $("#project").val();
    populate_selects();
    });
}

// populate the table & tree selects
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
    d3.select("#delete_tree").selectAll("option").remove();
    d3.select("#delete_tree").selectAll("option")
      .data(trees)
      .enter().append("option")
      .text(function (d) { return d; });

    d3.json("/arborapi/projmgr/project/" + project + "/CharacterMatrix", function (error, tables) {
      $.each(tables, function(key, value) {
        $("#delete_list").append($("<option>", value).text(value))});
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
      d3.select("#delete_table").selectAll("option").remove();
      d3.select("#delete_table").selectAll("option")
        .data(tables)
        .enter().append("option")
        .text(function (d) { return d; });
      });
  });
}

// actions performed when the user selects a project
d3.select("#project").on("change", function() {
  project = $("#project").val();
  populate_selects();
});

// actions performed when the user selects a visualization
d3.select("#vis").on("change", function() {
  var selected_vis = $("#vis").val();
  if (selected_vis == "VTK TreeHeatmap") {
    $("#vis_tree").prop("disabled", false);
    $("#vis_table").prop("disabled", false);
  } else if (selected_vis == "D3 Tree") {
    $("#vis_tree").prop("disabled", false);
    $("#vis_table").prop("disabled", true);
  } else if (selected_vis == "OneZoom Tree") {
    $("#vis_tree").prop("disabled", false);
    $("#vis_table").prop("disabled", true);
  } else if (selected_vis == "Table") {
    $("#vis_tree").prop("disabled", true);
    $("#vis_table").prop("disabled", false);
  } else {
    $("#vis_tree").prop("disabled", true);
    $("#vis_table").prop("disabled", true);
  }
  update_visualize_button();
});

// actions performed when the user selects a tree to visualize
d3.select("#vis_tree").on("change", function() {
  if ($("#analysis_tree").val() == "Select...") {
    $("#analysis_tree").val($("#vis_tree").val());
  }
  update_visualize_button();
});

// actions performed when the user selects a table to visualize
d3.select("#vis_table").on("change", function() {
  if ($("#analysis_table").val() == "Select...") {
    $("#analysis_table").val($("#vis_table").val());
    check_populate_parameter();
  }
  update_visualize_button();
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
  check_populate_parameter();
});

// attempt to populate the parameter select
function check_populate_parameter() {
  var selected_table = $("#analysis_table").val();
  if (selected_table != "Select...") {
    populate_parameter(selected_table);
  }
  update_analyze_button();
}

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

// check if we should enable or disable the "Visualize" button
function update_visualize_button() {
  var selected_vis = $("#vis").val();
  var selected_tree = $("#vis_tree").val();
  var selected_table = $("#vis_table").val();
  if (selected_vis == "VTK TreeHeatmap" && (selected_tree != "Select..." ||
    selected_table != "Select...")) {
    $("#visualize").prop("disabled", false);
  } else if (selected_vis == "D3 Tree" && selected_tree != "Select...") {
    $("#visualize").prop("disabled", false);
  } else if (selected_vis == "OneZoom Tree" && selected_tree != "Select...") {
    $("#visualize").prop("disabled", false);
  } else if (selected_vis == "Table" && selected_table != "Select...") {
    $("#visualize").prop("disabled", false);
  } else {
    $("#visualize").prop("disabled", true);
  }
};

// react to user clicking the "Visualize" button
d3.select("#visualize").on("click", function () {
  var selected_vis = $("#vis").val();
  var selected_tree = $("#vis_tree").val();
  var selected_table = $("#vis_table").val();
  if (selected_vis == "VTK TreeHeatmap") {
    if (selected_tree != "Select..." || selected_table != "Select...") {
      $("#d3_tools").hide();
      $("#d3_vis").hide();
      $("#viewport").show();
      $("#grid").hide();
      $("#intro").hide();
      $("#onezoom").hide();
      vtk_tree_heatmap(selected_tree, selected_table);
    }
  } else if (selected_vis == "D3 Tree") {
    if (selected_tree != "Select...") {
      $("#d3_tools").show();
      $("#d3_vis").show();
      $("#viewport").hide();
      $("#grid").hide();
      $("#intro").hide();
      $("#onezoom").hide();
      d3_tree(selected_tree);
    }
  } else if (selected_vis == "OneZoom Tree") {
    if (selected_tree != "Select...") {
      $("#d3_tools").hide();
      $("#d3_vis").hide();
      $("#viewport").hide();
      $("#grid").hide();
      $("#intro").hide();
      $("#onezoom").show();
      onezoom_tree(selected_tree);
    }
  } else if (selected_vis == "Table") {
    if (selected_table != "Select...") {
      $("#d3_tools").hide();
      $("#d3_vis").hide();
      $("#viewport").hide();
      $("#grid").show();
      $("#intro").hide();
      $("#onezoom").hide();
      display_table(selected_table);
    }
  }
});
