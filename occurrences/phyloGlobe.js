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
	//infoWindow.close();
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

	// cesium
	phylomap.cesium.billboards.removeAll();

	// clear occurrence compilation list
	phylomap.selectedOccurrences = []
	updateTableDisplay(phylomap.selectedOccurrences)
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

function processOccurrencesForMapLocations() {
	mapAllLocations()
	// start a recursive traversals to build lists of just taxa and of all the nodes for use later
	//addTaxaToTaxaList(phylomap.currentTree)
	//addAllNodesToAllNodeList(phylomap.currentTree)
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

// The next few routines below are involved in handling circles drawn on the map by the user. 
//  These routines check for observation points that lie within the radius of the drawn circle. 

// determine if a point (lat,lng) is inside the circle with center clat,clng, and given radius
function pointInCircle(lat,lng,clat,clng,radius) {
	var KPiDouble = 3.141592654
	var KDegreesToRadiansDouble = 0.01745329  // KPiDouble / 180.0
	var earthRadius = 6378137 // in meters
	clng = clng * KDegreesToRadiansDouble
	clat = clat * KDegreesToRadiansDouble
	var cradius = radius / earthRadius
	var lng = lng * KDegreesToRadiansDouble
	var lat = lat * KDegreesToRadiansDouble
	var angle = Math.acos(Math.sin(clat) * Math.sin(lat) + Math.cos(clat) * Math.cos(lat) * Math.cos(lng - clng))
	var decision = (angle < cradius)
	//if (decision) {
	//	console.log(lat,lng,clat,clng,angle,cradius,(angle < cradius))
    //}
	return decision
}



function addLocationToSelectedList(node,lat,lon) {
    //console.log('adding node to selection list.  Length now:',phylomap.selectedOccurrences.length)
    var record = {}
    // if there are extra attributes on this node, copy them over to the trait matrix selection entry
    for (attrib in node) {
    	record[attrib] = node[attrib]
    }
    record['lat'] = lat
    record['lon'] = lon
    if (typeof node['species'] != 'undefined') {
    	record['species'] = node['species']
    } else if (typeof node['name'] != 'undefined') {
    	record['species'] = node['name']
    } else if (typeof node['Species'] != 'undefined') {
    	record['species'] = node['Species']
    }
    phylomap.selectedOccurrences.push(record)
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
			var text = "species: " + name + "<br>id: " + selectionID;
			// add other attributes to display tag if they are present in the taxon node
			var attribs = []
			if ('attributes' in treeNode.node_data) {
				if (treeNode.node_data['attributes'].length >= i) {
					attribs = treeNode.node_data['attributes'][i]
					// add descriptions to the text markers
					for (var attrib in attribs) {
						text = text + ' [' + attrib+']:'+attribs[attrib]
					};
				}
			}

			createMarker(latlng, name, text, selectionID, icon);
			//bounds.extend(latlng);
			addLocationToSelectedList(treeNode,attribs,thisloc[1],thisloc[0])		
		};
	}
}




function mapAllLocations() {
		var selectionID = 0
		var icon = getIcon();
		for (var i = phylomap.currentRows.length - 1; i >= 0; i--) {
			var entry = phylomap.currentRows[i]


			// look for locations as under latidude, Latidue, Longitude, longitude, lat, long, or lng.  This won't
			// catch everything, but it allows some variation. 

			var point = {}
			if ( typeof entry.latitude != 'undefined') {
				point.latitude = entry.latitude
			} else if (typeof entry.lat != 'undefined') {
				point.latitude = entry.lat
			} else if (typeof entry.Latitude != 'undefined') {
				point.latitude = entry.Latitude
			}

			if ( typeof entry.longitude != 'undefined') {
				point.longitude = entry.longitude
			} else if (typeof entry.lon != 'undefined') {
				point.longitude = entry.lon
			} else if (typeof entry.long != 'undefined') {
				point.longitude = entry.long
			} else if (typeof entry.lng != 'undefined') {
				point.longitude = entry.lng
			} else if (typeof entry.Longitude != 'undefined') {
				point.longitude = entry.Longitude
			}

	

			var latlng = new google.maps.LatLng(parseFloat(point.latitude), parseFloat(point.longitude));
			createMarker(latlng, entry.name, '', selectionID, icon);
			addLocationToSelectedList(entry,point.latitude,point.longitude)
		};
	//updateTableDisplay(phylomap.selectedOccurrences)

}

function getIcon(nodeid) {
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

    // if this has been called before any markers are created for this node, set the indexes appropriately
    if (typeof markerColorIndex[id] == "undefined") {
    	markerColorIndex[id] = iconIndex;
    }
    colorToUse = treeHighlightColorList[adjustColorIndex(markerColorIndex[id])];
    //console.log("getIconColor: id=",id," markerColorIndex=",markerColorIndex[id]," treeColor=",colorToUse)
    return colorToUse
}


 function addCesiumPointBillboard(scene, ellipsoid) {
        // add an empty billboard collection.  Points will be added later
        phylomap.cesium.billboards = new Cesium.BillboardCollection();
        phylomap.cesium.scene.primitives.add(phylomap.cesium.billboards);
        phylomap.cesium.labels = phylomap.cesium.scene.primitives.add(new Cesium.LabelCollection());
        var label = phylomap.cesium.labels.add()
        var ellipsoid = phylomap.cesium.scene.globe.ellipsoid;

 // If the mouse is over the billboard, show a text label with the species name
    handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    handler.setInputAction(
        function (movement) {
                var pickedObject = scene.pick(movement.endPosition);
                 var cartesian = scene.camera.pickEllipsoid(movement.endPosition, ellipsoid);
                if (Cesium.defined(pickedObject))  {
                	var pickedId = pickedObject.id
                	//console.log('picked species: ',phylomap.selectedOccurrences[pickedId]['species'])
                	label.show = true;
                	// should disable picking of label text, but labels are stil pickable in v1.5
                	label.allowPicking = false;
                	var cartographic = ellipsoid.cartesianToCartographic(cartesian);
                	// this is the scale for the text label
                	label.scale = 0.65;
            		label.text = phylomap.selectedOccurrences[pickedId]['species'] +' (' + Cesium.Math.toDegrees(cartographic.longitude).toFixed(2) + ', ' + Cesium.Math.toDegrees(cartographic.latitude).toFixed(2) + ')\n';
          		label.position = cartesian;
          			// display the attributes in the table on the UI
          			displayOccurrenceAttributes(phylomap.selectedOccurrences[pickedId])
                } else {
                    label.text = ''
                    clearOccurrenceAttributes()
                }
        },
        Cesium.ScreenSpaceEventType.MOUSE_MOVE
    );
}

function displayOccurrenceAttributes(entry) {
	// add other attributes to display tag if they are present in the observation table

	// use the prettier Bootstrap list group instead of the old style output list
        d3.select("#attributes").selectAll("a").remove();
        var datasetTable = []
	     for (attrib in entry) {
        	attribtext =  ' <b>[' + attrib+']: </b>'+entry[attrib]
           datasetTable.push(attribtext)
        };
        
        //attempt to reset so second list is draggable, but it doesn't work
        //d3.select("#currentdatasetlist").attr("ondragstart","dragStartHandler(event)");	
      
	  for (var i = 0; i < datasetTable.length; ++i) {
           // create drag-and-drop elements here
           var myurl = datasetTable[i]
           $("#attributes")
           		.append('<a href="'+myurl+'" class="list-group-item draggable="false" data-value="'+datasetTable[i]+'">'+ datasetTable[i] + '</a>');
      }	
}

function clearOccurrenceAttributes() {
	d3.select("#attrbitues").selectAll("a").remove();
}


// this function adds one new pointBillboard to an existing billboard collection in Cesium
function addPointToCesiumBillboard(scene, ellipsoid,lng,lat,colorIndex,index) {
   	var canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
      	var context2D = canvas.getContext('2d');
        context2D.beginPath();
        context2D.arc(8, 8, 8, 0, Cesium.Math.TWO_PI, true);
        context2D.closePath();
        context2D.fillStyle = 'rgb(255, 255, 255)';
        context2D.fill();

 		//phylomap.cesium.billboards = new Cesium.BillboardCollection();
 		// lookup the color that matches the tree.  See the global list in the beginning of this file
 		var colortuple = treeHighLightColorListAsRGB[colorIndex]
 		//console.log(colortuple)

        phylomap.cesium.billboards.add({
            position : ellipsoid.cartographicToCartesian(Cesium.Cartographic.fromDegrees(lng,lat)),
            color : {'red': colortuple[0],'green': colortuple[1],
            				'blue': colortuple[2], 'alpha': colortuple[3]},
            // size of the location dots (0.5 is a bit small when zoomed up, 1.0 is too big when far away)
            scale : 0.75,
            id : index,
            image : canvas,
            imageIndex : 0
        });
        //phylomap.cesium.scene.primitives.add(phylomap.cesium.billboards);
}


function createMarker(latlng, name, text, id, icon) {
	var html = "<b>" + name + "</b><br>" + text;
	// save the color of this icon in a color index array
	markerColorIndex[id] = iconIndex;
	//console.log('saving marketColorIndex[',id,'] = ',iconIndex)
	icon = ((icon != null) ? icon : getIcon());

	// add point to the cesium globe view
	var ellipsoid = phylomap.cesium.scene.globe.ellipsoid;
	addPointToCesiumBillboard(
			phylomap.cesium.scene,
			ellipsoid,
			latlng.lng(),
			latlng.lat(),
			iconIndex,
			// set index for points to be unique
			phylomap.selectedOccurrences.length
		);

	// still create a GMap marker for compatibility
	var marker = new google.maps.Marker({
		map: map,
		position: latlng,
		icon: icon
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
 colors referenced from: http://cloford.com/resources/colours/500col.htm
lightblue 	191	239	255
 purple		128	0	128	
 yellow     255 255 0
 cobaltgreen 61	145	64
 darkgreen 0 75 0 
*/

var treeHighLightColorListAsRGB = [
		[1,1,1,1.0],[1,0,0,1.0], [0,0,1,1.0], [0.0,1,0.0,1.0], [1,0.64,0,1.0],
		[1,0.71,0.75,1.0],[0.746,0.933,1,1.0],[0.5,0,0.5,1],[1,1,0,1],
		[1,0,0,1.0], [0,0,1,1.0], [0,1,0,1.0], [1,0.64,0,1.0],
		[1,0.71,0.75,1.0],[0.746,0.933,1,1.0],[0.5,0,0.5,1],[1,1,0,1]]


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
	    phylomap.cesium.viewer = new Cesium.Viewer('cesiumContainer',{baseLayerPicker : true});
	    phylomap.cesium.scene = phylomap.cesium.viewer.scene;
    	phylomap.cesium.ellipsoid = phylomap.cesium.scene.globe.ellipsoid;
    	addCesiumPointBillboard(phylomap.cesium.scene,phylomap.cesium.ellipsoid)
});
