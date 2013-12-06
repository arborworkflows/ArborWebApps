// react to the user pressing the "New Project" button
d3.select("#new_project").on("click", function () {
  var new_project = prompt("Please enter the name of your new project");
  if (new_project != null) {
    d3.json("/arborapi/projmgr/project/" + new_project)
    .send("put", new_project, function (error, data) {
      populate_projects();
      $("#project").val(new_project);
      project = new_project;
      populate_selects();
    });
  }
});

// react to the user pressing the "Delete Tree" button
d3.select("#delete_tree_button").on("click", function () {
  var selected_tree = $("#delete_tree").val();
  if (selected_tree == "Select...") { return; }
  var question = "Are you sure you want to delete tree '" + selected_tree +"' ?";
  if (confirm(question)) {
    var delete_url = "/arborapi/projmgr/project/" + project + "/PhyloTree/" + selected_tree;
    $.ajax({
      url: delete_url,
      type: 'DELETE',
      success: function(result) {
        alert(selected_tree + " successfully deleted!");
        populate_selects();
      }
    });
  }
});

// react to the user pressing the "Delete Table" button
d3.select("#delete_table_button").on("click", function () {
  var selected_table = $("#delete_table").val();
  if (selected_table == "Select...") { return; }
  var question = "Are you sure you want to delete table '" + selected_table +"' ?";
  if (confirm(question)) {
    var delete_url = "/arborapi/projmgr/project/" + project + "/CharacterMatrix/" + selected_table;
    $.ajax({
      url: delete_url,
      type: 'DELETE',
      success: function(result) {
        alert(selected_table + " successfully deleted!");
        populate_selects();
      }
    });
  }
});

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
        // TODO: verify that upload was actually successful somehow
        alert("Upload complete!");
        populate_selects();
      });
  };
  reader.readAsText(file);
});
