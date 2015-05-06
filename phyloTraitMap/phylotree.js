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

// global constants 
phylomap.currentProjectName = ''
phylomap.currentDatasetName = ''
phylomap.currentDatasetArchiveId = null
phylomap.currentTree = null

// added for authentication
phylomap.usertoken = ''

// this is a list of the taxa in the current tree so searching is faster
phylomap.taxalist = []
phylomap.allnodelist = []

// this table is updated dynamically during operations to list what has been enabled on the map
phylomap.selectedOccurrences = []

phylomap.girder_API_root = '../girder/api/v1'

// declare a spot for the analysis used by romanesco to filter a girder item. 
phylomap.aggregateAnalysisName = "Aggregate table by average"
phylomap.aggregateAnalysis = null

// when the document is loaded, try to load a default dataset.  This fails quietly if the
// dataset is not available

$(document).ready(function(){
	girder.apiRoot = '../girder/api/v1';
    girder.handleRouting = false;

	$('#login').click(function () {
	    var loginView = new girder.views.LoginView({
	        el: $('#dialog-container')
	    });
	    loginView.render();
	});

	$('#register').click(function () {
	    var registerView = new girder.views.RegisterView({
	        el: $('#dialog-container')
	    });
	    registerView.render();
	});

	$('#logout').click(function () {
	    girder.restRequest({
	        path: 'user/authentication',
	        type: 'DELETE'
	    }).done(function () {
	        girder.currentUser = null;
	        girder.events.trigger('g:login');
	    });
	});

	girder.events.on('g:login', function () {
	    if (girder.currentUser) {
	        $("#login").addClass("hidden");
	        $("#register").addClass("hidden");
	        $("#name").removeClass("hidden");
	        $("#logout").removeClass("hidden");
	        $("#name").text("Logged in as " + girder.currentUser.get('firstName') + " " +
	                        girder.currentUser.get('lastName'));

	        // Do anything else you would like to do on login.
	        // populate the collection selectors using the login status we have nows
	        initializeDataSelection()
	    } else {
	        $("#login").removeClass("hidden");
	        $("#register").removeClass("hidden");
	        $("#name").addClass("hidden");
	        $("#logout").addClass("hidden");

	        // Do anything else you would like to do on logout.
	        // populate the collection selectors using the anonymous (user=none) status we have nows
	        initializeDataSelection()
	    }
	});

	// Check who is logged in initially.
	girder.restRequest({
	    path: 'user/authentication',
	    error: null
	}).done(function () {
	    girder.events.trigger('g:login');
	});


	// Lookup the ID of the aggregation analysis that we will need to perform later.  This analysis accepts 
	// a table and a column to aggregate on.  

    girder.restRequest({
        path: 'resource/search',
        data: {
            q: phylomap.aggregateAnalysisName,
            types: JSON.stringify(["item"])
        }
    }).done(function (results) {
    	console.log('results', results)
        phylomap.aggregateAnalysis = results["item"][0]._id;
        // populate the collections and dataset selectors
        console.log("found analysis at id:",phylomap.aggregateAnalysis)
        initializeDataSelection("Default","anolis")
    });

    // initialize an empty grid object for table display
    editableGrid = new EditableGrid("DemoGridSimple", {
    enableSort: true, // true is the default, set it to false if you don't want sorting to be enabled
	editmode: "absolute", // change this to "fixed" to test out editorzone, and to "static" to get the old-school mode
	editorzoneid: "edition", // will be used only if editmode is set to "fixed"
	pageSize: 40
    });

});


//----- end of authentication --------


function performEvent(element, name) {
  if (document.createEvent !== undefined) {
    var evt = document.createEvent("HTMLEvents");
    evt.initEvent(name, false, true);
    element.dispatchEvent(evt);
  } else {
    element.fireEvent("on" + name);
  }
}


function drawSelectedTree_orig(projectName,datasetName) {
	// Can probably make this a better API
	d3.json('service/phylotree/' + projectName + '/' + datasetName, function(json) {
		// added with new Arbor datastore as more processing is in javascript
		phylomap.currentTree = json;
		root = json;
		//console.log("tree returned:",root)
		root.x0 = height / 2;
		root.y0 = 0;

		// this builds a list of the taxa nodes with their locations for 
        // faster searching and also a list of all nodes for finding nodes by id
        processTreeForMapLocations()

		// initialize the display to show children nodes
		root.children.forEach(toggleAll);
		update(root);
	});
}


function drawSelectedTree(projectName,datasetName) {
	// use the girder API to extract the tree.  We used to use a tangelo service, which 
	// isn't included in TangeloHuvb anymore, so use the Girder API to find the collection, the
	// "Data" directory, and then the item from inside the Data folder by name


    // retrieve collection ID from the name
    var collectionId = null
    d3.json(phylomap.girder_API_root+"/collection?text="+projectName, function (error, collectionList) {
		collectionId =  collectionList[0]["_id"]
		//console.log('collectionID=',collectionId);

     	// build the query url for girder to list the contents of the selected Data folder in the collection
    	// ex. http://localhost:9000/api/v1/folder?parentType=collection&parentId=5420814456c02c06f389739d&text=Data
    	var data_folder_url = phylomap.girder_API_root+'/folder?parentType=collection&parentId='+collectionId+'&text=Data'
    	var dataFolderId = null
    	d3.json(data_folder_url, function (error, datasetFolderList) {
    		dataFolderId = datasetFolderList[0]["_id"]
			//console.log('dataFolderID=',dataFolderId)	

			// now we can look up the items in the collection's Data Folder
    		var itemlist_url = phylomap.girder_API_root+'/item?folderId='+dataFolderId
    		d3.json(itemlist_url, function (error, itemList) {
				var itemId = null
				console.log('item list: ',itemList)
				for (var i = itemList.length - 1; i >= 0; i--) {
					if (itemList[i]["name"]== datasetName) {
						itemId = itemList[i]["_id"]
					}
				};
				if (itemId != null) {
					console.log('found item number ',itemId)
					phylomap.currentDatasetArchiveId = itemId

					// item/54a01a4456c02c0551c04d40/romanesco/tree/nested/nested
		    		var tree_return_url = 'item/'+itemId+'/romanesco/tree/nested/nested'
					girder.restRequest({path: tree_return_url})
		    			.done(_.bind(function (result) {

							//console.log('girder response:',result)
							// added with new Arbor datastore as more processing is in javascript
							phylomap.currentTree = JSON.parse(result.data);
							root = phylomap.currentTree;
							//console.log("tree returned:",root)
							root.x0 = height / 2;
							root.y0 = 0;

							// this builds a list of the taxa nodes with their locations for 
					        // faster searching and also a list of all nodes for finding nodes by id
					        processTreeForMapLocations()

							// initialize the display to show children nodes
							root.children.forEach(toggleAll);
							update(root);
		    			}))
				}
			});
		});
	});

	// http://localhost:9080/girder/api/v1/item/543b374956c02c04bd338496/romanesco/tree/newick/nested

	
}

// initialize the Arbor collection and item viewers according to the dataset information
// that comes back from the Arbor instance

function initializeDataSelection(initialProject, initialData) {
	var project = d3.select("#project").node(),
	    dataselector = d3.select("#data").node(),
	    i;

	d3.select("#project").selectAll("option").remove();
	d3.select("#data").selectAll("option").remove();
	// add user token argument to allow authentication with remote collections
	girder.restRequest({path: "/collection"})
	  .done(_.bind(function (projects) {

	    console.log(projects,"\n");
	    d3.select("#project").selectAll("option")
	        .data(projects)
	        .enter().append("option")
	        .text(function (d) { return d.name; });

	    // read the collection selector and find the collection name
	    d3.select("#project").on("change", function () {
	        var project = d3.select("#project").node()
	        var collectionName = project.options[project.selectedIndex].text;
	        console.log('collectionName=',collectionName);

	        // retrieve collection ID from the name
	        var collectionId = null
	        //d3.json(phylomap.girder_API_root+"/collection?text="+collectionName, function (error, collectionList) {
	        girder.restRequest({path: "/collection?text="+collectionName})
		      .done(_.bind(function (collectionList) {
    			collectionId =  collectionList[0]["_id"]
    			console.log('collectionID=',collectionId);

	        	// build the query url for girder to list the contents of the selected Data folder in the collection
	        	// ex. http://localhost:9000/api/v1/folder?parentType=collection&parentId=5420814456c02c06f389739d&text=Data
	        	var data_folder_url = '/folder?parentType=collection&parentId='+collectionId+'&text=Data'
	        	var dataFolderId = null
	        	//d3.json(data_folder_url, function (error, datasetFolderList) {
	            girder.restRequest({path: data_folder_url})
		      	  .done(_.bind(function (datasetFolderList) { 		
	        		dataFolderId = datasetFolderList[0]["_id"]
    				console.log('dataFolderID=',dataFolderId)	

    				// now we can look up the items in the collection's Data Folder
	        		var itemlist_url = '/item?folderId='+dataFolderId
	        		//d3.json(itemlist_url, function (error, itemList) {
					girder.restRequest({path: itemlist_url})
		      		  .done(_.bind(function (itemList) {
  						d3.select("#data").selectAll("option").remove();
	            		d3.select("#data").selectAll("option")
	            			.filter(function(d) { return (d["name"].indexOf("nested-json") > -1) })
	                		.data(itemList)
	                		.enter().append("option")
	                		.text(function (d) { return d.name; });

            			d3.select("#data").on("change", function () {
                			var projectName = project.options[project.selectedIndex].text,
                    		dataName = dataselector.options[dataselector.selectedIndex].text;
                    		phylomap.currentProjectName = projectName;
                    		phylomap.currentDatasetName = dataName;
                    		// this pulls the tree from Arbor, draws the tree, and saves
                    		// the tree in the global phylomap.currentTree.  Only attempt this if it is a 
                    		// nested json type of tree
                    		if (dataName.indexOf("nested-json") > -1) {
                    			drawSelectedTree(projectName,dataName);
                    		}

                    	});    
            			performEvent(data, "change");
        			}));
				}));
			}));  // girder collectionID
		});
	}));  // end of girder projects
}


function initDatasetFromArbor() {
	var project = d3.select("#project").node()
    var projectName = project.options[project.selectedIndex].text
    var data = d3.select("#data").node();
    dataName = data.options[data.selectedIndex].text;
    phylomap.currentProjectName = projectName;
    phylomap.currentDatasetName = dataName;
    phylomap.selectedOccurrences = [];
    updateTableDisplay(phylomap.selectedOccurrences);
    drawSelectedTree(projectName,dataName);
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
	return vis.selectAll("g.node").filter(function (d,i) { return d.node_data['nodeid'] == id ? this : null; });
}

// Toggle clades.
function toggle(d, node, callback) {
	calledAlready = false;
	if (d.children) {
		d._children = d.children;
		d.children = null;
	} else if (d._children) {
		if (typeof(d._children[0]) === "string") {
			calledAlready = true;
			updateJSON({
				oldJSON:d,
				node:node,
				callback:callback
			});
		} else {
			d.children = d._children;
			d._children = null;
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
	if (d.children) {
		d.children.forEach(function(el) {toggleAll(el);});
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
	if (d.children) {
		d._children = d.children;
		d.children = null;

	}
	// end-node
	else if (!d._children) {
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
	if (d._children) {
		d._children.forEach(function(el) {offAll(el);});
	}
	togCount--;
	// if done and we have a callback function, execute it
	if (togCount === 0 && callback && typeof(callback) === "function") {
	    callback();
	}
}

// turns on a specific node
function on(d, callback) {
	// do nothing if d.children exists (not an end node)
	if (!d.children && d._children) {
		// ensure child is actually loaded in memory
		if (typeof(d._children[0]) === "object") {
			d.children = d._children;
			d._children = null;
		}
	} else if (!d.children) {
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
	if (typeof(d.children) === "object") {
		on(d);
		if (d.children) {
			d.children.forEach(function(el) {onAll(el);});
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
if (d['node_data']) {
	if (d['node_data']['node name']) {
		return d['node_data']['node name'];
	} else {
	        // couldn't find a name, return empty so a test will return false
            return '';
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
			return d.selectionid || (d.selectionid = ++i);
		});

	// Enter any new nodes at the parent's previous position.
	var nodeEnter = node.enter().append("svg:g")
		.attr("class", "node")
		// copy the unique ID into the DOM, so selections on nodes can return the nodeID.  This is important
		// to highlight all the children in a clade.  When the user selects a node, the 'nodeid'
		// is returned as an attribute of the <g> element selected amd passed to the callback
		.attr("nodeid", function(d) { return d.node_data['nodeid']})		
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
			return d._children ? "lightsteelblue" : "#fff";
		});
//		.on("mouseover.pathColor", function(d) {
//			highlightPath(d);
//		})
//		.on("mouseout.pathColor", function(d) {
//			highlightPath(d, pathColor, pathWidth);
//		});

	nodeEnter.append("svg:text")
		.attr("x", function(d) {
			return d.children || d._children ? - 10 : 10; })
		.attr("dy", ".35em")

		.attr("text-anchor", function(d) {
			return d.children || d._children ? "end" : "start"; })
		.text(function(d) {
			// truncate ID's to last 4 characters; return name if there is a name assigned
            if (d.node_data['node name']) {
                return d.node_data['node name'];  
			} else if (d.node_data['node weight']) {
				// round to 3 decimal places
				return d.node_data['node weight'].toString().substring(0,5);
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
			if (d._children) {
				// non end-node color before it is clicked
				return "lightsteelblue";
			} else if (d.children || d.selected) {
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
			return d.target.node_data['nodeid'];
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
	var tree_return_url = 'item/'+phylomap.currentDatasetArchiveId+'/romanesco/tree/nested/nested'
	girder.restRequest({path: tree_return_url})
		.done(_.bind(function (result) {
		console.log('json:',result)
		var json = JSON.parse(result.data)
		toggleAll (json, function() {
			oldJSON.children = json._children;
			oldJSON._children = null;
			if (callback && typeof(callback) === "function") {
				callback();
			}
		});
	}));
}

// CRL: added to allow path to be highlighted only up to a certain ancestor.  At first we were calling "highlightPaths", but
// there is a subtle difference in the definition of what a "node" is (whether it is a mongoDB JSON node or a node gleaned
// by select from the DOM.  These have slightly different organizations, so the parent discovery below was changed to use
// node.ID.$oid instead of node._id, since we are calling this routine wit nodes returned from an AJAX search
function highlightLimitedPath(node, rootId, color, size) {
	color = ((color != null) ? color : "red");
	size = ((size != null) ? size : "3px");
	var id = node.node_data['nodeid']
        //console.log("highlight node: ",node);
        //console.log("highlightLimitedPath from id: ",id, " with color: ",color);
	var parent = vis.selectAll("path").filter(function (d,i) { return d.target.node_data['nodeid'] === id ? this : null; });
	// turn on the text for this node
	var domNode = nodeFromId(id);
	// have to pick the first element from the dictionary, since DOM structure is returned
	textOn(domNode[0]);
	// highlight all parent paths as well
	while (parent[0].length > 0) {
		// highlight the path
		parent.style("stroke", color).style("stroke-width", size);
		// get the next parent
		parent = vis.selectAll("path").filter(function (d,i) { return d.target.node_data['nodeid'] === parent.datum().source.node_data['nodeid'] ? this : null; });
	}

}

// The traversal back up the DOM hierarchy is somewhat magical. Reviewing the paths in the browser doesn't show the node linkage 
// traversed by the parent.datum().source.xxxx link, but it works to traverse back to the root of the tree.  Can't really see how it
// is built either, likely the d3 path stores node information somewhere... 

function highlightPath(node, color, size) {
	color = ((color != null) ? color : "red");
	size = ((size != null) ? size : "3px");
	var id = node.node_data['nodeid'];
	// get the current path
	var parent = vis.selectAll("path").filter(function (d,i) { return d.target.node_data['nodeid'] === id ? this : null; });
	//console.log('parent ',parent)

	// highlight all parent paths as well
	while (parent[0].length > 0) {
		// highlight the path
		parent.style("stroke", color).style("stroke-width", size);
		// get the next parent
		parent = vis.selectAll("path").filter(function (d,i) { return d.target.node_data['nodeid'] === parent.datum().source.node_data['nodeid'] ? this : null; });
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
var cladeSelectEnabled = true;

// turn text on or off cladeSelect based on what element (checkbox) is set to
function toggleCladeSelect(element) {
	if (element.checked) {
		cladeSelectEnabled = true;
	} else {
		cladeSelectEnabled = false;
	}
}

// state variable for display of the trait scatterplot.  When set, click on tree or matrix will update
// the matrix to show the pairwise relations between all traits in the dataset
var scatterplotEnabled = false;

function toggleScatterplot(element) {
	if (element.checked) {
		scatterplotEnabled = true;
		updateTableDisplay(phylomap.selectedOccurrences)
	} else {
		scatterplotEnabled = false;
		// clear out content from any previous scatterplot
  		$('#morphplot').empty()
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
					var name = item['node_data']['node name'];
					createMarker(latlng, name, text, item._id, icon);
				});
			}
		}
		//createMarker ()
	}
}

function setProcessingBadge() {
	$(document).ready(function() {
		$('#treebuttons').badger('Processing');
	});
}

function clearBadge() {
	//console.log("callback");
	$(document).ready(function() {
		$('#treebuttons').badger('');
	});
}



// CRL: changed embedded call to distinguish this case from other uses of searchLocations and highlight the clade in the tree
function mapAllChildNodes(d, node) {
	// ensure our helper functions have been included via javascript includes
	if (typeof createMarker != 'undefined' && typeof google.maps.LatLng != 'undefined') {
		// this process can take a long time, so put up a processing sign
		setProcessingBadge()

		// we receive an element from the DOM corresponding to a node in the tree, so we need
		// to traverse inside the <g> element and find the attached true tree node by using the 
		// '__data__' attribute of the element
		var treeNodeElement = node.__data__;
		searchLocationsNearClade(treeNodeElement, clearBadge);
	}
}

var phylotree = {}

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
		return (!d.children || d.children.length === 0) ? null : d.children;
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


