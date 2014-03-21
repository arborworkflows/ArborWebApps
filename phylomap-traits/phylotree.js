//---------------------------------------------------------
// Arbor Phylomap / Phylotree integrated solution
//
// Developed by Univ. of Central Florida and KnowledgeVis, LLC
//
// This version of the app presents an integrated view where the user
// can browse across a tree view or a map view of a dataset where
// occurrences have been added to the tips of the tree.   Several python
// services are used to support the functionality.  Queries can be
//---------------------------------------------------------

var phylomap = {}

// define the location of the Arbor API used to lookup projects and datasets
phylomap.arborapiurl = '/arborapi/projmgr'
phylomap.mongoserver = 'localhost'
phylomap.currentProjectName = ''
phylomap.currentDatasetName = ''

// when the document is loaded, try to load a default dataset
$(document).ready(function(){
    initializeDataSelection("anolis")
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


function drawSelectedTree(projectName,datasetName) {
	// Can probably make this a better API
	d3.json('service/phylomongo-v2/' + phylomap.mongoserver + '/' + projectName + '/' + datasetName + '?maxdepth=3', function(json) {
		root = json;
		root.x0 = height / 2;
		root.y0 = 0;
		// initialize the display to show children nodes
		root.clades.forEach(toggleAll);
		update(root);
	});
}


function initializeDataSelection(initialProject, initialData) {
var project = d3.select("#project").node(),
    data = d3.select("#data").node(),
    i;

d3.select("#project").selectAll("option").remove();
d3.json(phylomap.arborapiurl+"/project", function (error, projects) {
    //console.log(projects,"\n");
    d3.select("#project").selectAll("option")
        .data(projects)
        .enter().append("option")
        .text(function (d) { return d; });

    d3.select("#project").on("change", function () {
        var project = d3.select("#project").node(),
            projectName = project.options[project.selectedIndex].text;
        d3.json(phylomap.arborapiurl+"/project/" + projectName + "/PhyloTree", function (error, datasets) {
            d3.select("#data").selectAll("option").remove();
            d3.select("#data").selectAll("option")
                .data(datasets)
                .enter().append("option")
                .text(function (d) { return d; });
            d3.select("#data").on("change", function () {
                var projectName = project.options[project.selectedIndex].text,
                    dataName = data.options[data.selectedIndex].text;
                    phylomap.currentProjectName = projectName;
                    phylomap.currentDatasetName = dataName;
                    drawSelectedTree(projectName,dataName);
                });
            for (i = 0; i < data.options.length; i += 1) {
                if (data.options[i].text === initialData) {
                    data.selectedIndex = i;
                }
            }
            performEvent(data, "change");
        });
    });
    for (i = 0; i < project.options.length; i += 1) {
        if (project.options[i].text === initialProject) {
            project.selectedIndex = i;
        }
    }
    performEvent(project, "change");
});
}



function addLoadEvent(func) {
	var oldonload = window.onload;
	if (typeof window.onload != 'function') {
		window.onload = func;
	} else {
		window.onload = function() {
			if (oldonload) {
				oldonload();
			}
			func();
		}
	}
}

function elbow(d, i) {
	return "M" + d.source.y + "," + d.source.x + "V" + d.target.x + "H" + d.target.y;
}

function nodeFromId (id) {
	return vis.selectAll("g.node").filter(function (d,i) { return d._id == id ? this : null; });
}

// Toggle clades.
function toggle(d, node, callback) {
	calledAlready = false;
	if (d.clades) {
		d._clades = d.clades;
		d.clades = null;
		d.children = null;
	} else if (d._clades) {
		if (typeof(d._clades[0]) === "string") {
			calledAlready = true;
			updateJSON({
				oldJSON:d,
				node:node,
				callback:callback
			});
		} else {
			d.clades = d._clades;
			d._clades = null;
		}
	// end-node
	} else {
		// first time selecting the node
		if (typeof d.selected === "undefined") {
			d.selected = true;
		} else {
			d.selected = d.selected ? false : true;
		}
	}
	// execute callback function
	if (!calledAlready && callback && typeof(callback) === "function") {
		callback(d);
	}
}

function toggleAll(d, callback) {
	// counter for async control
    togCount++;
	if (d.clades) {
		d.clades.forEach(function(el) {toggleAll(el);});
		toggle(d);
	}
	togCount--;
	// if done and we have a callback function, execute it
	if (togCount === 0 && callback && typeof(callback) === "function") {
	    callback();
	}
}

function testing()
{
	console.log("testing");
	increaseHeight(40);
}

function zoomGraph()
{
	vis.attr("transform", "translate(" + d3.event.translate.join(",") + ")scale(" + d3.event.scale + ")");
	if (d3.event.sourceEvent.type === "mousewheel") {
	        var verticalScale = localStorage.getItem('phylotree:verticalScale') || '4.0'
		increaseHeight(d3.event.sourceEvent.wheelDelta * verticalScale);
		//console.log(d3.event.sourceEvent.wheelDelta);
	}
} // end zoomGraph

function off(d, callback) {
	// not an end node
	if (d.clades) {
		d._clades = d.clades;
		d.clades = null;
		d.children = null;
	}
	// end-node
	else if (!d._clades) {
		d.selected = false;
	}
	if (callback && typeof(callback) === "function") {
		callback(d);
	}
}

function offAll(d, callback) {
	// counter for async control
	togCount++;
	off(d);
	if (d._clades) {
		d._clades.forEach(function(el) {offAll(el);});
	}
	togCount--;
	// if done and we have a callback function, execute it
	if (togCount === 0 && callback && typeof(callback) === "function") {
	    callback();
	}
}

// turns on a specific node
function on(d, callback) {
	// do nothing if d.clades exists (not an end node)
	if (!d.clades && d._clades) {
		// ensure child is actually loaded in memory
		if (typeof(d._clades[0]) === "object") {
			d.clades = d._clades;
			d._clades = null;
		}
	} else if (!d.clades) {
		d.selected = true;
	}
	if (callback && typeof(callback) === "function") {
		callback(d);
	}
}

// turns on all nodes that have currently been loaded in memory
function onAll(d, callback) {
	// counter for async control
	togCount++;
	if (typeof(d.clades) === "object") {
		on(d);
		if (d.clades) {
			d.clades.forEach(function(el) {onAll(el);});
		}
	}

	togCount--;
	// if done and we have a callback function, execute it
	if (togCount === 0 && callback && typeof(callback) === "function") {
	    callback();
	}
}

// turns on all nodes in the tree, performs ajax calls to get more of the tree
// if necessary
// SGZ 4-11-13: Modified and consolidated to only use new updateJSON function
function onAllAndLoad(d, callback) {
	offAll(d, function() {
		updateJSON({
			oldJSON:d,
			maxDepth:100,
			callback:function(){onAll(d, function() {update(d);});}
		});
	});
}

function emptyTree() {
	offAll(root);
	update(root);
}

function entireTree() {
	onAll(root, function() {update(root);});
}

// allow a standard way to try for node naming a few different ways
function returnNodeName(d) {
if (d.scientific_name) {
	if (d.scientific_name) {
		return d.scientific_name;
	} else if (d.name ) {
		return d.name;
	} else if (d.taxonomies && d.taxonomies[0].scientific_name) {
		return d.taxonomies[0].scientific_name;
	} else {
	        // couldn't find a name, return empty so a test will return false
                return null;
	}
    }
}


function update(source) {
	// set animatio time, slow animation if alt key is pressed
	var duration = d3.event && d3.event.altKey ? 5000 : 500;

	// Compute the new tree layout
	nodes = cluster.nodes(root);

	// Update the nodes...
	var node = vis.selectAll("g.node")
		.data(nodes, function(d) {
			return d.id || (d.id = ++i);
		});

	// Enter any new nodes at the parent's previous position.
	var nodeEnter = node.enter().append("svg:g")
		.attr("class", "node")
		.attr("transform", function(d) {
			return "translate(" + source.y0 + "," + source.x0 + ")"; })
		.on("click", function(datum, index, el) {
			// if shift key is selected when on keypress
			if (d3.event.shiftKey || cladeSelectEnabled) {
				// display all nodes below this on map...
				mapAllChildNodes(datum, this);
			} else {
				toggle(datum, this, function() {
					update(datum);
					mapItem(datum);
				});
			}
		})
		.on("mouseover.text", function() {
			textOn(this);
		})
		.on("mouseout.text", function() {
			textOff(this, true);
		});

	nodeEnter.append("svg:circle")
		.attr("r", 1e-6)
		.style("fill", function(d) {
			return d._clades ? "lightsteelblue" : "#fff";
		});
	//	.on("mouseover.pathColor", function(d) {
	//		highlightPath(d);
	//	})
	//	.on("mouseout.pathColor", function(d) {
	//		highlightPath(d, pathColor, pathWidth);
	//	});

	nodeEnter.append("svg:text")
		.attr("x", function(d) {
			return d.clades || d._clades ? - 10 : 10; })
		.attr("dy", ".35em")
		.attr("text-anchor", function(d) {
			return d.clades || d._clades ? "end" : "start"; })
		.text(function(d) {
			// truncate ID's to last 4 characters; return name if there is a name assigned
                if (d.scientific_name) {
                                return d.scientific_name;
                        } else if (d.name ) {
                                return d.name;
                        } else if (d.taxonomies && d.taxonomies[0].scientific_name) {
                                return d.taxonomies[0].scientific_name;
			} else if (d.branch_length) {
				// round to 3 decimal places
				return d.branch_length.toString().substring(0,5);
			} else if (d._id) {
				return d._id.substring(d._id.length - 4);
			} else if (typeof (d) === "string") {
				return d.substring(d.length -4);
			}
		})
			//return d.taxonomies ? d.taxonomies[0].scientific_name : d._id.substring(d._id.length - 4); })
		.style("fill-opacity", 1e-6)
		.style("visibility", function() {
			return d3.select("#nodeNames").property("checked") ? "visible" : "hidden";
		});

	// Transition nodes to their new position.
	var nodeUpdate = node.transition()
		.duration(duration)
		.attr("transform", function(d) {
			return "translate(" + d.y + "," + d.x + ")";
		});

	nodeUpdate.select("circle")
		.attr("r", 4.5)
		.style("fill", function(d) {
			if (d._clades) {
				// non end-node color before it is clicked
				return "lightsteelblue";
			} else if (d.clades || d.selected) {
				// any node's color after being clicked
				return "#fff";
			} else {
				// end-node color that hasn't been clicked yet
				return "lightsteelblue";
			}
		});

	nodeUpdate.select("text")
		.style("fill-opacity", 1);

	// Transition existing nodes to their parent's new position.
	var nodeExit = node.exit().transition()
		.duration(duration)
		.attr("transform", function(d) {
			return "translate(" + source.y + "," + source.x + ")"; })
      	.remove();

	nodeExit.select("circle")
		.attr("r", 1e-6);

	nodeExit.select("text")
		.style("fill-opacity", 1e-6);

	// Update the links…
	var link = vis.selectAll("path.link")
	//	.data(tree.links(nodes), function(d) {
		.data(cluster.links(nodes), function(d) {
			return d.target.id;
		});

	// Enter any new links at the parent's previous position.
	link.enter().insert("svg:path", "g")
		.attr("class", "link")
		.attr("d", function(d) {
			var o = {x: source.x0 != null ? source.x0 : root.x , y: source.y0 != null ? source.y0 : root.y};
			return elbow({source: o, target: o});
		})
		.transition()
		.duration(duration)
		.attr("d", elbow);

	// Transition links to their new position.
	link.transition()
		.duration(duration)
		.attr("d", elbow);

	// Transition exiting nodes to the parent's new position.
	link.exit().transition()
		.duration(duration)
		.attr("d", function(d) {
			var o = {x: source.x, y: source.y};
			return elbow({source: o, target: o});
		})
		.remove();

	// Stash the old positions for transition.
	nodes.forEach(function(d) {
		d.x0 = d.x;
		d.y0 = d.y;
	});
}




//SGZ 4-11-13: Fixed this so it's just one call
// makes an async javascript call to load more tree levels
function updateJSON(options) {
	var oldJSON = options.oldJSON;
	var node = options.node || null;
	var callback = options.callback || null;
	var maxDepth = options.maxDepth || 3;

	if (node != null) {
		// on loading the data change the circle color to red
		d3.select(node.childNodes[0]).style("fill", "red");
	}

	d3.json('service/phylomongo-v2/' + phylomap.mongoserver + '/' + phylomap.currentProjectName+ '/' + phylomap.currentDatasetName
			 + '?maxdepth=' + maxDepth + '&_id=' + oldJSON._id, function(err, json) {
		toggleAll (json, function() {
			oldJSON.clades = json._clades;
			oldJSON._clades = null;
			if (callback && typeof(callback) === "function") {
				callback();
			}
		});
	});
}

// CRL: added to allow path to be highlighted only up to a certain ancestor.  At first we were calling "highlightPaths", but
// there is a subtle difference in the definition of what a "node" is (whether it is a mongoDB JSON node or a node gleaned
// by select from the DOM.  These have slightly different organizations, so the parent discovery below was changed to use
// node.ID.$oid instead of node._id, since we are calling this routine wit nodes returned from an AJAX search
function highlightLimitedPath(node, rootId, color, size) {
	color = ((color != null) ? color : "red");
	size = ((size != null) ? size : "3px");
	var id = node.ID.$oid;
        //console.log("highlight node: ",node);
        //console.log("highlightLimitedPath from id: ",node.ID.$oid, " with color: ",colorToUse);
	var parent = vis.selectAll("path").filter(function (d,i) { return d.target._id === id ? this : null; });
	// turn on the text for this node
	var domNode = nodeFromId(node.ID.$oid);
	// have to pick the first element from the dictionary, since DOM structure is returned
	textOn(domNode[0]);
	// highlight all parent paths as well
	while (parent[0].length > 0) {
		// highlight the path
		parent.style("stroke", color).style("stroke-width", size);
		// get the next parent
		parent = vis.selectAll("path").filter(function (d,i) { return d.target._id === parent.datum().source._id ? this : null; });
	}

}


function highlightPath(node, color, size) {
	color = ((color != null) ? color : "red");
	size = ((size != null) ? size : "3px");
	var id = node._id;
	// get the current path
	var parent = vis.selectAll("path").filter(function (d,i) { return d.target._id === id ? this : null; });

	// highlight all parent paths as well
	while (parent[0].length > 0) {
		// highlight the path
		parent.style("stroke", color).style("stroke-width", size);
		// get the next parent
		parent = vis.selectAll("path").filter(function (d,i) { return d.target._id === parent.datum().source._id ? this : null; });
	}
}

// CRL: clear away all the tree highlights.  Must be a simpler way, but
// SGZ: there is, implemented it
// CRL:  :-)
function clearAllHighlights(color, size) {
	color = ((color != null) ? color : pathColor);
	size = ((size != null) ? size : pathWidth);
	vis.selectAll("path").style("stroke", color).style("stroke-width", size);
	// added text off on all nodes
	if (d3.select("#nodeNames").property("checked") == false) {
		vis.selectAll("g.node").selectAll("text").style("visibility", "hidden")
	}
}

// turn on text label for a node
function textOn(node) {
	// if it's an array get the first item and store it as node
	node = node instanceof Array ? node[0] : node;
	d3.select(node).select("text").style("visibility", "visible");
}

// turn off text label for a node
function textOff(node, condition) {
	node = node instanceof Array ? node[0] : node;
	d3.select(node).select("text").style("visibility", function() {
		if (condition != true) return "hidden";
		// if condition is not set check the box #nodeNames
		else return d3.select("#nodeNames").property("checked") ? "visible" : "hidden";
	});
}

// turn text on or off all text labels based on what element (checkbox) is set to
function toggleText(element) {
	if (element.checked) {
		vis.selectAll("g.node").selectAll("text").style("visibility","visible")
	} else {
		vis.selectAll("g.node").selectAll("text").style("visibility","hidden")
	}
}

// state variable for automatic clade selection mode.  When set, click on clade will highlight all
// children below it in the tree (of all species)
var cladeSelectEnabled = false;

// turn text on or off cladeSelect based on what element (checkbox) is set to
function toggleCladeSelect(element) {
	if (element.checked) {
		cladeSelectEnabled = true;
	} else {
		cladeSelectEnabled = false;
	}
}

function mapItem(item) {
// update the phylomap!
	// ensure our helper functions have been included via javascript includes
	if (typeof createMarker != 'undefined' && typeof google.maps.LatLng != 'undefined') {
		// do we have location data, also must be an end node
		if (typeof item.loc != 'undefined') {
			// do markers already exist?
			if (markerExists(item._id)) {
				clearOneId(item._id);
			} else {
				// add markers
				var icon = getIcon();
				item.loc.forEach(function(d){
					var latlng = new google.maps.LatLng(
						parseFloat(d[1]),
						parseFloat(d[0]));
					var text = "location: " + latlng + "<br>id: " + item._id;
					var name = item.taxonomies[0].scientific_name;
					createMarker(latlng, name, text, item._id, icon);
				});
			}
		}
		//createMarker ()
	}
}

function clearBadge() {
	console.log("callback");
	$(document).ready(function() {
		$('#treebuttons').badger('');
	});
}



// CRL: changed embedded call to distinguish this case from other uses of searchLocations and highlight the clade in the tree
function mapAllChildNodes(d, node) {
	// ensure our helper functions have been included via javascript includes
	if (typeof createMarker != 'undefined' && typeof google.maps.LatLng != 'undefined') {
		// this process can take a long time, so put up a processing sign
		$('#treebuttons').badger('Processing');
		searchLocationsNearClade('service/phylomap-v2/' + phylomap.mongoserver + '/' + phylomap.currentProjectName + '/' +
		        phylomap.currentDatasetName +
			'/id/' + d._id, d._id, clearBadge);
				// this happens immediately regardless of gating
		//$('#treebuttons').badger('');
		//$(document).ready(function() {$('#treebuttons').badger('');});
	}
}

var phylotree = {}

phylotree.getMongoDBInfo = function() {
    "use strict";

    // Read in the config options regarding which MongoDB
    // server/database/collection to use.
    return {
        server: localStorage.getItem('phylotree:mongodb-server') || 'localhost',
        db: localStorage.getItem('phylotree:mongodb-db') || 'xdata',
        coll: localStorage.getItem('phylotree:mongodb-coll') || 'heliconia_new',
        verticalScale: localStorage.getItem('phylotree:verticalScale') || '4.0'
    };
};


function increaseHeight(delta) {
	var oldHeight = height;
	height = height + delta;
	height = Math.max(height, 20);
	var scale = d3.scale.linear()
		.domain([0, oldHeight])
		.range([0, height]);

	// scale each model node's position accordingly
	// tree is transposed so x is height.
	nodes.forEach(function(d){
		d.x = scale(d.x);
		d.x0 = scale(d.x0);
	});
	//update(root);
	updateVisualization();
}

// CRL: added based on increaseHeight
function increaseWidth(delta) {
	var oldWidth = width;
	width = width + delta;
	width = Math.max(width, 20);
	var scale = d3.scale.linear()
		.domain([0, oldWidth])
		.range([0, width]);

	// scale each model node's position accordingly
	// tree is transposed so y is width.
	nodes.forEach(function(d){
		d.y = scale(d.y);
		d.y0 = scale(d.y0);
	});
	updateVisualization();
}

// FIXME: this callback was removed, because it doesn't reset d3's state, so the first
// mouse event after reset goes back

function resetVisualization() {
 width =  1000 - lMargin - rMargin;
 height = 800 - tMargin - bMargin;
 vis.attr("transform", "translate(0,0), scale(1,1)");
 //vis.attr("transform", "scale(1,1)");
 updateVisualization();
}


function updateVisualization() {
	var duration = 500;
	vis.selectAll("rect.background")
		.attr("width", width + lMargin + rMargin)
		.attr("height", height + tMargin + bMargin);

	vis.selectAll("g.node")
//		.duration(duration)
		.attr("transform", function(d) {
			return "translate(" + d.y + "," + d.x + ")";
		});

	vis.selectAll("path.link")
//		.duration(duration)
		.attr("d", elbow);
}

// GLOBAL VARIABLES
var lMargin = 50, rMargin = 30, tMargin = 50, bMargin = 50,
	width = 1000 - lMargin - rMargin,
    height = 800 - tMargin - bMargin,
	i = 0,
	pathWidth = "1.5px", pathColor = "#ccc",
	root,
	togCount = 0;

var cluster = d3.layout.cluster()
	.size([height, width - 160])
	.children(function(d) {
		return (!d.clades || d.clades.length === 0) ? null : d.clades;
	});

var vis = d3.select("#tree").append("svg:svg")
	.attr("width", width + lMargin + rMargin)
	.attr("height", height + tMargin + bMargin)
	.attr("pointer-events", "all") // receives all pointer events
	.append("svg:g")
	.attr("transform", "translate(" + lMargin + "," + tMargin + ")")
	.call(d3.behavior.zoom().scaleExtent([0.75, 40]).on("zoom", zoomGraph))
	.append("svg:g");

vis.append("svg:rect")
	.attr("width", width + lMargin + rMargin)
	.attr("height", height + tMargin + bMargin)
	.attr("fill", "white")
	.attr("class", "background");

// ---------



