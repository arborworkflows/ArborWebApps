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

// declare a spot for the analysis used by flow to filter a girder item. 
phylomap.aggregateAnalysisName = "Aggregate table by average"
phylomap.aggregateAnalysis = null


// for piechart rendering

var pieheight = 40
var piewidth = 40
var pieradius = 10
var enablePie = true

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
    	//console.log('results', results)
        phylomap.aggregateAnalysis = results["item"][0]._id;
        // populate the collections and dataset selectors
        console.log("found analysis at id:",phylomap.aggregateAnalysis)
        initializeDataSelection("Default","anolis")
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

        //processTreeForMapLocations()

		// initialize the display to show children nodes
		root.children.forEach(toggleAll);
		update(root);
	});
}

function TnT_tree_draw_fixed(newick) {
	console.log('drawing tree')
	var tree = tnt.tree();
    tree
        .data(tnt.tree.parse_newick(newick))
        .node_display(tree.node_display()
            .size(4)
            .fill("#888888")
        )
        .label (tnt.tree.label.text()
            .fontsize(12)
            .height(24)
        )
        .layout(tnt.tree.layout.vertical()
            .width(1050)
            .scale(false)
        );

	tree(document.getElementById("tree"));
}

// this collapsable tree looks nice, but it renders low and seems to gradually work down the
// page when changed.. 

function TnT_tree_draw_collapsing(newick) {

	//console.log('parsing')
 	var data = tnt.tree.parse_newick(newick);
 	//console.log('parsing complete')

    // Show different node shapes for collapsed/non-collapsed nodes
    var node_size = 7;
    var node_fill="lightgrey";
    var node_stroke="black";

    var expanded_node = tnt.tree.node_display.circle()
        .size(node_size)
        .fill(node_fill)
        .stroke(node_stroke);

    var collapsed_node = tnt.tree.node_display.triangle()
        .size(node_size)
        .fill(node_fill)
        .stroke(node_stroke);

    var node_display = tnt.tree.node_display()
        .size(15)
        .display (function (node) {
            if (node.is_collapsed()) {
                collapsed_node.display().call(this, node);
            } else {
                expanded_node.display().call(this, node);
            }
        });

    var tree = tnt.tree()
        .node_display(node_display)
        .data(data)
        .duration(500)
        .layout(tnt.tree.layout.vertical()
            .width(600)
            .scale(true)
        );

    tree.on ("click", function(node){
        node.toggle();
        tree.update();
    });

    // The tree renders at this point
    tree(document.getElementById("tree"));
}


function TnT_tree_draw_layouts(newick) {

    var div = document.getElementById("tree")
    var width = 760;
    var scale = false;

    // In the div, we set up a "select" to transition between a radial and a vertical layouts
    var menu_pane = d3.select(div)
        .append("div")
        .append("span")
        .text("Layout:  ");

    var sel = menu_pane
        .append("select")
        .on("change", function(d) {
            var layout = tnt.tree.layout[this.value]().width(width).scale(scale);
            tree.layout(layout);
            tree.update();
        });

    sel
        .append("option")
        .attr("value", "vertical")
        .attr("selected", 1)
        .text("vertical");

    sel
        .append("option")
        .attr("value", "radial")
        .text("radial");

    var trans_speed = menu_pane
        .append("span")
        .style("margin-left", "50px")
        .text("Transition speed: 100ms ");

    trans_speed
        .append("input")
        .attr("type", "range")
        .attr("min", 100)
        .attr("max", 5000)
        .attr("step", 100)
        .attr("value", 2000)
        .on("change", function(d) {
            tree.duration(this.value);
        });

    trans_speed
        .append("text")
        .text("5s");

    var tree = tnt.tree()
        .node_display(tnt.tree.node_display.circle()
            .size(5)
            .stroke('black')
            .fill('grey')
        )
        .label(tnt.tree.label.text()
            .fontsize(12)
            .height(20)
            .text(function (node) {
                if (node.is_leaf()) {
                    return node.node_name();
                }
                return "";
            })
        )
        .data(tnt.tree.parse_newick(newick))
        .layout(tnt.tree.layout.vertical()
            .width(width)
            .scale(scale)
        )
        .duration(1000);

    // The visualization renders at this point
    tree(div);
};



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

					// item/54a01a4456c02c0551c04d40/flow/tree/nested/nested
		    		var tree_return_url = 'item/'+itemId+'/flow/tree/newick/newick'
					girder.restRequest({path: tree_return_url})
		    			.done(_.bind(function (result) {

							//console.log('girder response:',result)
							// added with new Arbor datastore as more processing is in javascript
							phylomap.currentTree = result.data;
							root = phylomap.currentTree;
							//TnT_tree_draw_fixed(result.data)	
							//TnT_tree_draw_collapsing(result.data)
							TnT_tree_draw_layouts(result.data)
		    			}))
				}
			});
		});
	});

	// http://localhost:9080/girder/api/v1/item/543b374956c02c04bd338496/flow/tree/newick/nested
	
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
	                		.data(itemList)
	                		.enter().append("option")
	                		.text(function (d) { return d.name; });

            			d3.select("#data").on("change", function () {
                			var projectName = project.options[project.selectedIndex].text,
                    		dataName = dataselector.options[dataselector.selectedIndex].text;
                    		phylomap.currentProjectName = projectName;
                    		phylomap.currentDatasetName = dataName;

                    		console.log("*** rendering tree here ")

                    	});    
            			//performEvent(data, "change");
        			}));
				}));
			}));  // girder collectionID
		});
	}));  // end of girder projects
}


function initDatasetFromArbor() {
  console.log("initDatasetFrom Arbor stub")
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

	
}




//SGZ 4-11-13: Fixed this so it's just one call
// makes an async javascript call to load more tree levels
function onAllAndLoad() {
	drawSelectedTree(phylomap.currentProjectName,phylomap.currentDatasetName)
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
 width =  1600 - lMargin - rMargin;
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
	width = 1600 - lMargin - rMargin,
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


