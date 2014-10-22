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

function log(msg) {
    setTimeout(function() {
        throw new Error(msg);
    }, 0);
}

function clearLocations() {
	infoWindow.close();
	for (i in markers) {
		markers[i].setMap(null);
		// CRL
		delete markerColorIndex[i];
	}
	markers.length = 0;
	markerIndex = {};
	for (i in overlays) {
		overlays[i].setMap(null);
	}
	// set index to last item so it will reset on next element
	iconIndex = 0;
}

// Can create serious problems as it doesn't delete markerIndex references!
function clearOneLocation(index) {
	var marker = markers[index];
	if (marker) {
		marker.setMap(null);
	}
	delete markers[index];
}

function clearOneId(id) {
	// if a marker has ID = id
	if (typeof markerIndex[id] != "undefined") {
		markerIndex[id].forEach(function(d) {
			clearOneLocation(d);
		});
		delete markerIndex[id];
	}
}

// returns true if there is at least 1 marker on the map with ID = _id
function markerExists(id) {
	if (typeof markerIndex[id] != "undefined" && markerIndex[id].length > 0)
		return true;
	else
		return false;
}


// ---- build node lists to aid traversal, finding locations or matching nodes

function addTaxaToTaxaList(treenode) {
  if ('children' in treenode) {
  	// case for intermediate nodes, continue traversal
  	for (var i=0;i<treenode.children.length;i++) {
  		addTaxaToTaxaList(treenode.children[i])
  	}
  } else {
  	// case for a taxon
  	phylomap.taxalist.push(treenode)
  }
}

// this is a pre-processing function that is called once each time a tree is loaded.  It runs throgh
// the tree and builds a list of all nodes, so searching doesn't have to involve recursive searching 
// each time.  The routine assumes phylomap.currentTree is valid.

function addAllNodesToAllNodeList(treenode) {
  phylomap.allnodelist.push(treenode)
  if ('children' in treenode) {
  	// case for intermediate nodes, continue traversal
  	for (var i=0;i<treenode.children.length;i++) {
  		addAllNodesToAllNodeList(treenode.children[i])
  	}
  }
}

// this is a pre-processing function that is called once each time a tree is loaded.  It runs throgh
// the tree and builds a list of the taxa, so searching doesn't have to involve recursive searching 
// each time.  The routine assumes phylomap.currentTree is valid.

function processTreeForMapLocations() {
	// clear out the previous list if there is one
	while (phylomap.taxalist.length > 0) {
		phylomap.taxalist.pop()
	}
	while (phylomap.allnodelist.length > 0) {
		phylomap.allnodelist.pop()
	}
	// start a recursive traversals to build lists of just taxa and of all the nodes for use later
	addTaxaToTaxaList(phylomap.currentTree)
	addAllNodesToAllNodeList(phylomap.currentTree)
	//console.log(phylomap.taxalist)
}


//------ end of build node lists

function searchLocationsNear(searchUrl) {
	d3.json(searchUrl, function(json) {
		var icon = getIcon();
		var bounds = new google.maps.LatLngBounds();
		json.result.data.forEach(function(d){
			var name = d.name;
			var id = d.ID.$oid;
			var latlng = new google.maps.LatLng(
				parseFloat(d.lat),
				parseFloat(d.lng));
			var text = "location: " + latlng + "<br>id: " + id;
			createMarker(latlng, name, text, id, icon);
			bounds.extend(latlng);
		});
	});
}


function findNodeInTreeByNodeId(currentTreeNode, nodeID) {
	for (var i = phylomap.allnodelist.length - 1; i >= 0; i--) {
		if (phylomap.allnodelist[i].node_data['nodeid'] == nodeID) {
			return phylomap.allnodelist[i]
		}
	}
}


function mapSingleNode(treeNode, rootNode,icon,selectionID) {
	var bounds = new google.maps.LatLngBounds();
	var name = treeNode.node_data['node name'];
	//console.log('map single node of id=',id, treeNode)

	// if this node has locations, then add them to the map
	if ('loc' in treeNode.node_data) {
		for (var i = 0; i< treeNode.node_data['loc'].length; i++) {
			var thisloc = treeNode.node_data['loc'][i]
			var latlng = new google.maps.LatLng(
				parseFloat(thisloc[1]),
				parseFloat(thisloc[0]));
				var text = "location: " + latlng + "<br>id: " + selectionID;
			createMarker(latlng, name, text, selectionID, icon);
			bounds.extend(latlng);
		};
	}
}


// recursive traversal of the current tree to uncover all nodes below the passed node and
// map them.  The clade root is passed so highlighting can be performed.

// *** had to use _children instead of children because of how the accessor algorithm 
// in phylotree re-names the attributes.  This search might fail sometimes, so testing
// for valid children references under either name

function mapAllNodesInClade(treeNode, cladeRootNode,icon,selectionID) {
	//console.log('mapping everything below node:',treeNode.node_data['nodeid'])
		// highlight the path on the tree between the rootId and this node if a valid id was passed
	if (treeNode != null) {
			var id = cladeRootNode.node_data['nodeid'];
	        var colorToUse = getIconColor(id)
	        highlightLimitedPath(treeNode,cladeRootNode,colorToUse)
	}

	if (('_children' in treeNode) && (treeNode._children.length>0)) {
		for (var i = treeNode._children.length - 1; i >= 0; i--) {
			mapAllNodesInClade(treeNode._children[i], cladeRootNode)
		}
	} else if (('children' in treeNode) && (treeNode.children.length>0)) {
			console.log('mapAllNodesInClade: traversing -children- attribute to follow clade')
			for (var i = treeNode.children.length - 1; i >= 0; i--) {
				mapAllNodesInClade(treeNode.children[i], cladeRootNode)
			}
	} else {
		// we have reached the bottom of the hierarchy, write out the locations to the map
		// 
		mapSingleNode(treeNode, cladeRootNode,icon,selectionID)
	}
}

// This search is used only during highlight of entire clade.  
// Processing moved from a service to inline javascript when integrated with Arbor/TangeloHub. 
// the data element returned in the clicked node is a <g> element, so we need to look inside its
// '__data__' attribute to find the actual tree node record.  This 

function searchLocationsNearClade(selectedNode, callback) {
	var selectedNodeID = selectedNode.node_data['nodeid']
	//console.log("highlight clade below node id",selectedNodeID);
	// find the node with the id that matches the one the user clicked on
	rootOfClade = findNodeInTreeByNodeId(phylomap.currentTree, selectedNodeID)
	// traverse tree recursively, adding all locations in all taxa below this.  We create the
	// icon here so each selection maps to just one type of icon
	var icon = getIcon();
	mapAllNodesInClade(rootOfClade, rootOfClade, icon,iconIndex)
	// run the callback if one was passed.  Use for setting and clearing processing badge
	if (callback != null) callback();
}

function getIcon() {
	if (typeof iconIndex === "undefined" || iconIndex == null || iconIndex == iconList.length) {
		iconIndex = 0;
	}
	return iconList[iconIndex++];
}

// CRL : since iconIndex is incremented immediately after each use, we handle the wraparound case and
// generate a lagging index value.  Don't know why we have to adjust this, thought we caught the index
// before it it was incremeneted

function adjustColorIndex(index) {
    if (index>0) {
        return (index-1)
        }
    else {
        return (iconList.length-1)
        }
}

// CRL: lookup the color of the tree highlight by retrieving the color of the corresponding
// map icon and adjusting it (why adjustment needed?)

function getIconColor(id) {
    var colorToUse;
    colorToUse = treeHighlightColorList[adjustColorIndex(markerColorIndex[id])];
    console.log("getIconColor: id=",id," markerColorIndex=",markerColorIndex[id]," treeColor=",colorToUse)
    return colorToUse
}

function createMarker(latlng, name, text, id, icon) {
	var html = "<b>" + name + "</b><br>" + text;
	// save the color of this icon in a color index array
	markerColorIndex[id] = iconIndex;
	icon = ((icon != null) ? icon : getIcon());
	var marker = new google.maps.Marker({
		map: map,
		position: latlng,
		icon: icon
	});
	google.maps.event.addListener(marker, 'mouseover', function() {
		var node = nodeFromId(id);
		//highlightParents(node, "red", "3px");
		// CRL: color highlight path according to icon color
		highlightParents(node, getIconColor(id), "3px");
		textOn(node[0]);
	});
	google.maps.event.addListener(marker, 'mouseout', function() {
		if (typeof clickedOn === "undefined" || !clickedOn) {
			var node = nodeFromId(id);
			highlightParents(node, "#ccc", "1.5px");
			textOff(node[0], true);
		}
	});
	google.maps.event.addListener(marker, 'click', function() {
		clickedOn = clickedOn == true ? false : true;
		var node = nodeFromId(id);
		if (clickedOn) {
			infoWindow.setContent(html);
			infoWindow.open(map, marker);
			// CRL: change so highlights match icon colors
			highlightParents(node, getIconColor(id), "3px");
			//highlightParents(node, "red", "3px");
			textOn(node[0]);
		} else {
			infoWindow.close();
			highlightParents(node, "#ccc", "1.5px");
			textOff(node[0], true);
		}
	});
	// store in index the id/markerIndex key/value pair, easier to delete later.
	if (typeof markerIndex[id] === "object") {
		markerIndex[id].push(markers.length);
	} else {
		markerIndex[id] = [markers.length];
	}
	markers.push(marker);

}

function highlightParents (node, color, size) {
	// ensure our helper functions were included
	if (typeof highlightPath != 'undefined' && typeof nodeFromId != 'undefined') {
		if (node[0].length > 0) {
			highlightPath(node.datum(), color, size);
		}
	}
}

var map;
var clickedOn;
var mapOptions;
var overlays = [];
var markers = [];
var markerColorIndex = [];
var markerIndex = {};
var infoWindow;
var locationSelect;
var phylotree = {};
var iconIndex = 0;
var iconList = [
	'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
	'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
	'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
	'http://maps.google.com/mapfiles/ms/icons/orange-dot.png',
	'http://maps.google.com/mapfiles/ms/icons/pink-dot.png',
	'http://maps.google.com/mapfiles/ms/icons/ltblue-dot.png',
	'http://maps.google.com/mapfiles/ms/icons/purple-dot.png',
	'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
	'http://maps.google.com/mapfiles/ms/icons/red-pushpin.png',
	'http://maps.google.com/mapfiles/ms/icons/blue-pushpin.png',
	'http://maps.google.com/mapfiles/ms/icons/grn-pushpin.png',
	'http://maps.google.com/mapfiles/ms/icons/pink-pushpin.png',
	'http://maps.google.com/mapfiles/ms/icons/ltblu-pushpin.png',
	'http://maps.google.com/mapfiles/ms/icons/purple-pushpin.png',
	'http://maps.google.com/mapfiles/ms/icons/ylw-pushpin.png',
]

// adding matching hightlight colors to match the icons, so the tree hightlight color matches the icon color
var treeHighlightColorList = [ "red","blue","green","orange","pink","lightblue","purple","yellow","red","blue","green","pink","lightblue","purple","yellow"]
/*
phylomap.getMongoDBInfo = function () {
    "use strict";

    // Read in the config options regarding which MongoDB
    // server/database/collection to use.
    return {
        server: localStorage.getItem('phylomap:mongodb-server') || 'localhost',
        db: localStorage.getItem('phylomap:mongodb-db') || 'xdata',
        coll: localStorage.getItem('phylomap:mongodb-coll') || 'anolis'
    };
};

phylomap.updateConfig = function() {
	"use strict";

	var server,
		db,
		coll;

	// Grab the elements
	server = document.getElementById("mongodb-server");
	db = document.getElementById("mongodb-db");
	coll = document.getElementById("mongodb-coll");

	// Write the options into DOM storage.
	localStorage.setItem('phylomap:mongodb-server', server.value);
	localStorage.setItem('phylomap:mongodb-db', db.value);
	localStorage.setItem('phylomap:mongodb-coll', coll.value);
};

phylomap.setConfigDefaults = function () {
    "use strict";

    var cfg;

    // Clear out the locally stored options.
    localStorage.removeItem('phylomap:mongodb-server');
    localStorage.removeItem('phylomap:mongodb-db');
    localStorage.removeItem('phylomap:mongodb-coll');

    // Retrieve the new config values, and set them into the fields.
    cfg = phylomap.getMongoDBInfo();
    d3.select("#mongodb-server").property("value", cfg.server);
    d3.select("#mongodb-db").property("value", cfg.db);
    d3.select("#mongodb-coll").property("value", cfg.coll);
};
*/

//function load() {

addLoadEvent(function () {
	mapOptions = {
		//center: new google.maps.LatLng(18.994609, -71.345215),
		//zoom: 6,
		center: new google.maps.LatLng(1.65, -70.0),
		zoom: 4,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	map = new google.maps.Map(d3.select("#map_canvas").node(),
		mapOptions);
	var drawingManager = new google.maps.drawing.DrawingManager({
		drawingMode: google.maps.drawing.OverlayType.CIRCLE,
		drawingControl: true,
		drawingControlOptions: {
			position: google.maps.ControlPosition.TOP_CENTER,
			drawingModes: [
			  google.maps.drawing.OverlayType.MARKER,
			  google.maps.drawing.OverlayType.CIRCLE,
			  google.maps.drawing.OverlayType.RECTANGLE
			]
		},
		markerOptions: {
			icon: new google.maps.MarkerImage('http://www.example.com/icon.png')
		}
	});
	drawingManager.setMap(map);

	google.maps.event.addListener(drawingManager, 'overlaycomplete', function(event) {
		var searchUrl;

		// create the restful style url to load data.  The named arguments we used to use had to be
		// replaced by positional arguments with a later version of Tangelo. Notice the /rect/id/long, etc.
		// using up positions in the URL since the names of the arguments didn't work anymore.

		if (event.type == google.maps.drawing.OverlayType.CIRCLE) {
	 		searchUrl = 'service/phylomap-v2/' + phylomap.mongoserver + '/' + phylomap.currentProjectName +
	 		        '/' + phylomap.currentDatasetName +
	 			'/circle/id' +
	 			 '/'+ event.overlay.getCenter().lng() +
	 			 '/'+ event.overlay.getCenter().lat() +
	 			 '/'+ event.overlay.getRadius();
	 	} else if (event.type == google.maps.drawing.OverlayType.RECTANGLE) {
	 		searchUrl = 'service/phylomap-v2/' + phylomap.mongoserver + '/' + phylomap.currentProjectName +
	 		        '/' + phylomap.currentDatasetName +
	 			'/rect/id/long/lat/radius/' +
				'/' + event.overlay.bounds.getSouthWest().lng() +
				'/' + event.overlay.bounds.getSouthWest().lat() +
				'/' + event.overlay.bounds.getNorthEast().lng() +
				'/' + event.overlay.bounds.getNorthEast().lat();
		}
		searchLocationsNear(searchUrl);
		overlays.push(event.overlay);
	});

	var mylatlng = new google.maps.LatLng(-25.363882,131.044922);
	infoWindow = new google.maps.InfoWindow();
});
