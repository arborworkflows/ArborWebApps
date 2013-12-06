// d3 phylotree vars
var root, d3_vis;

function initialize_dendrogram() {
  // initialize d3 phylo tree
  root = tangelo.data.tree({
    data: [{_id: {$oid: 0}}],
    id: {field: "_id.$oid"},
    idChild: {field: "$oid"},
    children: {field: "clades"}
  });

  d3_vis = $("#d3_vis").dendrogram({
      data: root,
      id: {field: "_id.$oid"},
      label: {field: "name"},
      distance: {field: "branch_length"},
      nodeLimit: 1000
  }).data("dendrogram");
}

// display a D3 phylotree
function d3_tree(selected_tree) {
  d3.json("/arborapi/projmgr/project/" + project + "/PhyloTree/" + selected_tree, function (error, collection) {

    // Get rid of "handle" node
    var filtered = [];
    collection.forEach(function (d) {
        if (!d.rooted) {
            filtered.push(d);
        }
    });

    root = tangelo.data.tree({
      data: filtered,
      id: {field: "_id.$oid"},
      idChild: {field: "$oid"},
      children: {field: "clades"}
    });

    d3_vis.option({data: root});
    d3_vis.reset();
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

