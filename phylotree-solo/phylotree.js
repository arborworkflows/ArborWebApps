var currentProjectName = "anolis";
var currentDatasetName = "anolis";

var pieheight = 40
var piewidth = 40
var pieradius = 15
var enablePie = true

// arrays used for pie charts on the nodes.  attribArray is deprecated in favor of the flexible value and name arrays
var attribArray = []
var attribValueArray = []
var attribNameArray = []


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
	        var verticalScale = localStorage.getItem('phylotree:verticalScale') || '2.0'
	        //var verticalScale = 0.5
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


// this function is used to examine the nodes currently being rendered and build an array of the attributes on the nodes
// for rendering pie charts on the nodes.   Javascript object introspection is used to traverse the "attribs" of the node object 
// and build up arrays used by d3's "data & select" engine to fill the pie charts instanced during the node.enter() procedure.

function updateAttribArray(nodes) {
	attribValueArray = []
	attribNameArray = []
	for (var i = nodes.length - 1; i >= 0; i--) {
		var characterValues = []
		var characterNames = []
		if ('characters' in nodes[0]) {
			for (attrib in nodes[i].characters) {
				var characterInfo = {}
				characterInfo.name = attrib
				characterInfo.value = nodes[i].characters[attrib]
				characterValues.push(characterInfo)
			};
			attribValueArray.push(characterValues)
			//attribNameArray.push(characterNames)
		}
	};
	//console.log("updated attribValueArray",attribValueArray);
	//console.log("updated attribNameArray",attribNameArray);
}


// this function is called whenever the d3 tree rendering needs to be updated.  It is called with the root of the part of the 
// tree that needs to be updated.  Nodes are added as needed, and node.enter() clasues are used to add popovers, titles, etc.
// if there is a character subobject to the node, a pie chart can be rendered just below the node, to show the relative percentages
// of attribute values.  the pie chart is enabled / disabled by a selector on the UI.  

// BUG: a total redraw has pie charts turned on
function update(source) {
	// set animatio time, slow animation if alt key is pressed
	var duration = d3.event && d3.event.altKey ? 5000 : 500;


	// Compute the new tree layout
	nodes = cluster.nodes(root);
	//console.log('nodes:',nodes)
	updateAttribArray(nodes);

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

	// add the circle for a node and put a title popover on the circle so the user can hover over the circle to see the 
	// name, branch_length, and any characters which are assgned to the node

	nodeEnter.append("svg:circle")
		.attr("r", 1e-6)
		.style("fill", function(d) {
			return d._clades ? "lightsteelblue" : "#fff";
		})
		.append("title")
		.text(function(d) {
			  var msg = "";
			  if (d.name) {
		                    msg += "name: " + d.name + "\n";
		                  }
		                  if (d.Species) {
		                    msg += "Species: " + d.Species + "\n";
		                  }
		                   if (d.branch_length) {
		                        msg += "branch_length: " + d.branch_length + "\n";
		                  }
		                  // if there are characters on this node, add them to the popover hover.  The values
		                  // are truncated to fewer decimal places to shorten the display
			     if ('characters' in d) {
				for (character in d.characters) {
					msg += character + ": " + d[character].toString().substring(0,6) + '\n'
				}

			     }
		                  return msg;
	});

	// add text to the new node added in the tree.  There is inconsistency in the naming and attribute declarations in
	// the early Arbor datasets, so several different names are allowed here until standardization occurs. 

	nodeEnter.append("svg:text")
		.attr("x", function(d) {
			return d.clades || d._clades ? - 10 : 10; })
		.attr("dy", ".35em")
		.attr("text-anchor", function(d) {
			return d.clades || d._clades ? "end" : "start"; })
		.text(function(d) {
			// truncate ID's to last 4 characters
			var msg = "";
			if (d.name ) {
			    msg += d.name + "\n";
			} else if (d.Species) {
			    msg +=  d.Species + '\n';
			} else if (d.scientific_name) {
			    return d.scientific_name;
			} else if (d.display_name) {
			    return d.display_name;
			} else if (d.taxonomies && d.taxonomies[0].scientific_name) {
				return d.taxonomies[0].scientific_name;
			} else if (d.branch_length) {
				// round to 3 decimal places
				msg += d.branch_length.toString().substring(0,5)+ '\n';
			} else if (d._id) {
				return d._id.substring(d._id.length - 4);
			} else if (typeof (d) === "string") {
				return d.substring(d.length -4);
			}
			
			return msg
		})
			//return d.taxonomies ? d.taxonomies[0].scientific_name : d._id.substring(d._id.length - 4); })
		.style("fill-opacity", 1e-6)
		.style("font-size", fontsize.toString()+"px")
		.style("visibility", function() {
			return d3.select("#nodeNames").property("checked") ? "visible" : "hidden";
		});

	// add a piechart at each node that displays
	// the value of characters at this node

        	var pievis = nodeEnter.append("svg:svg")              //create the SVG element inside the <body>
        		.data(attribValueArray)
       		.attr("width", piewidth)           //set the width and height of our visualization (these will be attributes of the <svg> tag
        		.attr("height", pieheight)
        		.attr("class","piechart")
        		.append("svg:g")                //make a group to hold our pie chart
        		.attr("transform", "translate(" + pieradius + "," + 1.5*pieradius + ")")    //move the center of the pie chart from 0, 0 to radius, radius

        	var arc = d3.svg.arc()              //this will create <path> elements for us using arc data
        		.outerRadius(pieradius);

        	var pie = d3.layout.pie()        //this will create arc data for us given a list of values
        		.value(function (d) {return d.value});    //we must tell it out to access the value of each element in our data array

       	 var arcs = pievis.selectAll("g.slice")     //this selects all <g> elements with class slice (there aren't any yet)
        		.data(pie)                          //associate the generated pie data (an array of arcs, each having startAngle, endAngle and value properties)
        		.enter()                            //this will create <g> elements for every "extra" data element that should be associated with a selection. The result is creating a <g> for every object in the data array
        		.append("svg:g")                    //create a group to hold each slice (we will have a <path> and a <text> element associated with each slice)
        		.attr("class", "slice");            //allow us to style things in the slices (like text)

        	piecolor = d3.scale.category10();     //builtin range of colors

        	arcs.append("svg:path")
                	.attr("fill", function(d, i) { return piecolor(i); } ) //set the color for each slice to be chosen from the color function defined above
                	.attr("d", arc)                                  //this creates the actual SVG path using the associated data (pie) with the arc drawing
		
	/***	
	pievis.append("title")
		.data(attribValueArray)
		.text(function(d,i) {
		  var msg  = "characters" ;
		  // logic here to parse character values and fill the message
                  	return msg;
		});
	***/

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

	d3.json('service/phylomongo-v2/' + mongo.server + '/' + currentProjectName + '/' +
			currentDatasetName + '?maxdepth=' + maxDepth + '&_id=' + oldJSON._id, function(json) {
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


// turn text on or off all piecharts  based on what element (checkbox) is set.  We had to look for svg.piechart
// because of the order of the hierarchy in the DOM

function togglePiechart(element) {
	if (element.checked) {
		vis.selectAll("g.node").selectAll("svg.piechart").style("visibility","visible")
	} else {
		vis.selectAll("g.node").selectAll("svg.piechart").style("visibility","hidden")
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

/***
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
		searchLocationsNearClade('service/phylomap/' + mongo.server + '/' + mongo.db + '/' + mongo.coll +
			'/?boundary_type=id' + '&_id=' + d._id, d._id, clearBadge);
				// this happens immediately regardless of gating
		//$('#treebuttons').badger('');
		//$(document).ready(function() {$('#treebuttons').badger('');});
	}
}
***/

var phylotree = {}

phylotree.getMongoDBInfo = function() {
    "use strict";

    // Read in the config options regarding which MongoDB
    // server/database/collection to use.
    return {
        //server: localStorage.getItem('phylotree:mongodb-server') || 'localhost',
        //db: localStorage.getItem('phylotree:mongodb-db') || 'arbor',
        //coll: localStorage.getItem('phylotree:mongodb-coll') || 'apeTree',
        server: 'localhost',
        db: 'xdata',
        coll:  'ar_anolis_PhyloTree_svlø',
        verticalScale: localStorage.getItem('phylotree:verticalScale') || '4.0'
    };
};

phylotree.updateConfig = function() {
	"use strict";

	var server,
		db,
		coll,
		verticalScale;

	// Grab the elements
	server = document.getElementById("mongodb-server");
	db = document.getElementById("mongodb-db");
	coll = document.getElementById("mongodb-coll");
	verticalScale = document.getElementById("verticalScale");

	// Write the options into DOM storage.
	localStorage.setItem('phylotree:mongodb-server', server.value);
	localStorage.setItem('phylotree:mongodb-db', db.value);
	localStorage.setItem('phylotree:mongodb-coll', coll.value);
	localStorage.setItem('phylotree:verticalScale',verticalScale.value);
};

phylotree.setConfigDefaults = function() {
    "use strict";

    var cfg;

    // Clear out the locally stored options.
    localStorage.removeItem('phylotree:mongodb-server');
    localStorage.removeItem('phylotree:mongodb-db');
    localStorage.removeItem('phylotree:mongodb-coll');
    localStorage.removeItem('phylotree:verticalScale');

    // Retrieve the new config values, and set them into the fields.
    cfg = phylotree.getMongoDBInfo();
    d3.select("#mongodb-server").property("value", cfg.server);
    d3.select("#mongodb-db").property("value", cfg.db);
    d3.select("#mongodb-coll").property("value", cfg.coll);
    d3.select("#verticalScale").property("value", cfg.verticalScale);
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

  //if (width < $(window).width()*0.8) {
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
   //}
}

// FIXME: this callback was removed, because it doesn't reset d3's state, so the first
// mouse event after reset goes back

function resetVisualization() {
 width =  $("#tree").width() - lMargin - rMargin;
 height = $("#tree").height() - tMargin - bMargin;
 vis.attr("transform", "translate(0,0), scale(1,1)");
 //vis.attr("transform", "scale(1,1)");
 updateVisualization();
}


// resize the rendering if the window changes
function resizeRendering() {
    width = $("#tree").width()*0.95;
    height = $("#tree").height()*0.8;
    console.log("setting h,w to:",height,width,"\n")
    //cluster.size([height,width-160])
}

function updateVisualization() {
	var duration = 500;
	//resizeRendering()
	vis.selectAll("rect.background")
		.attr("width", $(window).width()*0.95 + lMargin + rMargin)
		.attr("height", $(window).height()*0.9 + tMargin + bMargin);

	vis.selectAll("g.node")
//		.duration(duration)
		.attr("transform", function(d) {
			return "translate(" + d.y + "," + d.x + ")";
		});

	vis.selectAll("path.link")
//		.duration(duration)
		.attr("d", elbow);
	console.log("update\n");
}

function increaseFontSize(delta) {
        console.log("increase font")
        fontsize = fontsize + delta
        fontstring = fontsize.toString()
        $('.node').css('font-size',fontstring)
}

// GLOBAL VARIABLES
var lMargin = 50, rMargin = 30, tMargin = 50, bMargin = 150,
	width = $("#tree").width() - lMargin - rMargin,
    height = ($("#tree").height())*0.9 - tMargin - bMargin,
	i = 0,
	pathWidth = "1.5px", pathColor = "#ccc",
	root,
	togCount = 0,
	fontsize = 11,
	loadComplete = 0;

var cluster = d3.layout.cluster()
	.size([$(window).height()*0.75, ($(window).width()*0.9)-150])
	.children(function(d) {
		return (!d.clades || d.clades.length === 0) ? null : d.clades;
	});

var vis = d3.select("#tree").append("svg:svg")
	.attr("width", $("#tree").width() + lMargin + rMargin)
	.attr("height", $("#tree").height() + tMargin + bMargin)
	.attr("pointer-events", "all") // receives all pointer events
	.append("svg:g")
	.attr("transform", "translate(" + lMargin + "," + tMargin + ")")
	.call(d3.behavior.zoom().scaleExtent([0.75, 40]).on("zoom", zoomGraph))
	.append("svg:g");

vis.append("svg:rect")
	.attr("width", $("#tree").width() + lMargin + rMargin)
	.attr("height", $("#tree").height() + tMargin + bMargin)
	.attr("fill", "white")
	.attr("class", "background");


// the routine that actually performs the AJAX call to get a JSON representation from a partial tree.  Then the update() method
// is called to render the initial tree "stub" since we are loading the first as only a partial -  three levels in.

function drawSelectedTree(projectName,datasetName) {
        currentProjectName = projectName;
        currentDatasetName = datasetName
	// Can probably make this a better API
	d3.json('service/phylomongo-v2/' + mongo.server + '/' + projectName + '/' + datasetName + '?maxdepth=3', function(json) {
		root = json;
		root.x0 = height / 2;
		root.y0 = 0;
		// initialize the display to show children nodes
		root.clades.forEach(toggleAll);
		update(root);
	});
}


addLoadEvent(function () {
	mongo = phylotree.getMongoDBInfo();
		d3.select("#mongodb-server").property("value", mongo.server);
		d3.select("#mongodb-db").property("value", mongo.db);
		d3.select("#mongodb-coll").property("value", mongo.coll);


	// Can probably make this a better API
	d3.json('service/phylomongo-v2/' + mongo.server + '/' + currentProjectName + '/' + currentDatasetName + '?maxdepth=3', function(json) {
		root = json;
		root.x0 = height / 2;
		root.y0 = 0;

		// initialize the display to show children nodes
		root.clades.forEach(toggleAll);
		update(root);
	});
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


// the user is presented with a project and dataset dialog to pick from.  When a new project is selected, pull the first dataset
// and automatically load the first element.  When a different dataset is selected, automatically load the first element only.   When
// this rendering is ported to use girder, then we can just initialize the tree differently and everything else will probably work 
// correctly. 

function initializeDataSelection(initialProject, initialData) {
var project = d3.select("#project").node();
var data = d3.select("#data").node();
var i;

d3.json("/arborapi/projmgr/project", function (error, projects) {
    console.log(projects);
    d3.select("#project").selectAll("option").remove();
    d3.select("#project").selectAll("option")
        .data(projects)
        .enter().append("option")
        .text(function (d) { return d; });

    d3.select("#project").on("change", function () {
        var project = d3.select("#project").node(),
            projectName = project.options[project.selectedIndex].text;
        d3.json("/arborapi/projmgr/project/" + projectName + "/PhyloTree", function (error, datasets) {
            d3.select("#data").selectAll("option").remove();
            d3.select("#data").selectAll("option")
                .data(datasets)
                .enter().append("option")
                .text(function (d) { return d; });
            d3.select("#data").on("change", function () {
                var projectName = project.options[project.selectedIndex].text,
                    dataName = data.options[data.selectedIndex].text;
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

initializeDataSelection("anolis")
