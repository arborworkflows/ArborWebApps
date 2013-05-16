if (!d3)
	throw "Missing dependency: d3.js not loaded.";

var phylogram;

function getDataNodes(callback)
{
	d3.json('/service/phylomongo/'
				+ phylogram.dataSource.server + '/'
				+ phylogram.dataSource.database + '/'
				+ phylogram.dataSource.collection + '/'
				+ '?maxdepth=' + 100000, callback);
} // end getDataNodes

function initializePhylogram(containerID)
{
	var w = 1000, h = 800;

	phylogram = {};
	phylogram.dataSource = {server: 'localhost', database: 'xdata', collection: 'ar_BadnaVirusStudy_PhyloTree_badna_100s_without_badly_aligned_with_RTBV'};
	phylogram.width = w;
	phylogram.height = h;

	// initialize phylogram function for creating SVG right-angle diagonals
	phylogram.rightAngleDiagonal = function()
	{
    	var projection = function(d) { return [d.y, d.x]; };
    
    	var path = function(pathData) { return "M" + pathData[0] + " " + pathData[1] + " " + pathData[2]; };

    	var diagonal = function(diagonalPath, i)
		{
			var source = diagonalPath.source,
				target = diagonalPath.target,
				midpointX = (source.x + target.x) / 2,
				midpointY = (source.y + target.y) / 2,
				pathData = [source, {x: target.x, y: source.y}, target];
			
			pathData = pathData.map(projection); // passing projection function
			
			return path(pathData);
    	}; // end diagonal function
		
		diagonal.projection = function(x)
		{
			if (!arguments.length)
				return projection;
			projection = x;
			return diagonal;
		}; // end diagonal.projection function
		
		diagonal.path = function(x)
		{
			if (!arguments.length)
				return path;
			path = x;
			return diagonal;
		}; // end diagonal.path function
		
		return diagonal;
	}; // end rightAngleDiagonal

	// initialize tooltip div
	phylogram.tooltip = d3.select("body").append("div")
		.attr("class", "tooltip")
		.style("opacity", 0.0);

	// initialize phylogram layout-er
	phylogram.layout = d3.layout.cluster()
		.size([h, w])
		.sort(function(node) { return node.children ? node.children.length : -1;})
		.children(function(node) { return node.clades; }); // needs to be changed if using different format

	// initialize visualization of phylogram
	phylogram.vis = d3.select(containerID).append("svg:svg")
		.attr("width", w + 300)
		.attr("height", h + 30)
		.attr("pointer-events", "all") // receives all pointer events
		.append("svg:g")
		.attr("transform", "translate(20, 20)")
		.call(d3.behavior.zoom().on("zoom", zoomGraph))
		.append("svg:g");

	phylogram.vis.append("svg:rect") // receives all zoom events instead of just the edges and nodes
		.attr("width", w + 300)
		.attr("height", h + 30)
		.attr("fill", "white")
		.attr("class", "background");

	// Complete the rest of the initialization once the data arrives.
	getDataNodes(function(jsonNodes)
	{
		if (jsonNodes.error)
		{
			alert(jsonNodes.error + '\n\n' + jsonNodes.traceback + ' [' + Object.keys(jsonNodes) + ']');
		}
		
		// Lay out retrieved data nodes. (Does not add to visualization yet)
		treeNodes = phylogram.layout(jsonNodes);

		// Add edges, or links, to visualization
		var link = phylogram.vis.selectAll('path.link')
			.data(phylogram.layout.links(treeNodes))
			.enter().append('svg:path')
				.attr('class', 'link')
				.attr('d', phylogram.rightAngleDiagonal());
	
		// Add nodes to visualization
		var node = phylogram.vis.selectAll('g.node')
			.data(treeNodes)
			.enter().append('svg:g')
				.attr('class', function(n)
				{
					if (n.children)
					{
						if (n.depth == 0)
							return "root node";
						else
							return "inner node";
					}
					else
					{
						return "leaf node";
					}
				})
				.attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });
	
		phylogram.vis.selectAll('g.leaf.node')
				.append('svg:circle')
					.attr('class', 'leaf')
					.attr('r', 4.5);
		
		phylogram.vis.selectAll('g.root.node')
			.append('svg:circle')
				.attr('class', 'root')
				.attr('r', 4.5);

		// Add labels to nodes
		labelNodes();

		// Add tooltip functionality to leaf nodes
		phylogram.vis.selectAll('g.leaf.node')
			.on('mouseover', function(d)
			{
				phylogram.tooltip.transition()
					.duration(300)
					.style('opacity', 1.0);
				phylogram.tooltip.text(d.taxonomies[0].scientific_name)
					.style('left', (d3.event.pageX + 15) + 'px')
					.style('top', (d3.event.pageY) + 'px');
			})
			.on('mouseout', function(d)
			{
				phylogram.tooltip.transition()
					.duration(600)
					.style('opacity', 0.0);
			});
	}); // end getDataNodes callback function
	
} // end initializePhylogram

function zoomGraph()
{
	phylogram.vis.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
} // end zoomGraph

function updateVisualization()
{
	// resize the background rectangle
	phylogram.vis.selectAll('rect.background')
		.attr('width', phylogram.width + 300)
		.attr('height', phylogram.height + 30);
	
	// update the leaf node positions in the visualization
	phylogram.vis.selectAll('g.leaf.node')
		.attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

	// update the inner node positions in the visualization (the labels must be moved with them)
	phylogram.vis.selectAll('g.inner.node')
		.attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });
	
	// update the root node position in the visualization
	phylogram.vis.selectAll('g.root.node')
		.attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

	// update the edges to match up with the new positions of the nodes
	phylogram.vis.selectAll('path.link')
		.attr('d', phylogram.rightAngleDiagonal());
} // end updateVisualization

function increaseTreeWidth()
{
	changeTreeWidth(phylogram.width + 20);
} // end increaseTreeWidth

function decreaseTreeWidth()
{
	changeTreeWidth(Math.max(phylogram.width - 20, 1));
} // end decreaseTreeWidth

function changeTreeWidth(newWidth)
{
	// update phylogram tree width
	var oldWidth = phylogram.width;
	phylogram.width = newWidth;

	var scale = d3.scale.linear()
		.domain([0, oldWidth])
		.range([0, phylogram.width]);

	// Scale each model node's position accordingly
	treeNodes.forEach(function(d) { d.y = scale(d.y); });

	// Update visualization
	updateVisualization();
} // end changeTreeWidth

function increaseTreeHeight()
{
	changeTreeHeight(phylogram.height + 20);
} // end increaseTreeHeight

function decreaseTreeHeight()
{
	changeTreeHeight(Math.max(phylogram.height - 20, 1));
} // end decreaseTreeHeight

function changeTreeHeight(newHeight)
{
	// update phylogram tree width
	var oldHeight = phylogram.height;
	phylogram.height = newHeight;

	var scale = d3.scale.linear()
		.domain([0, oldHeight])
		.range([0, phylogram.height]);

	// Scale each model node's position accordingly
	treeNodes.forEach(function(d) { d.x = scale(d.x); });
	
	// Update visualization
	updateVisualization();
} // end changeTreeHeight

function labelNodes()
{
	// Apply labels to nodes
	phylogram.vis.selectAll('g.inner.node')
		.append('svg:text')
			.attr('class', 'label')
			.attr('dx', -6)
			.attr('dy', -6)
			.attr('text-anchor', 'end')
			.attr('font-size', '8px')
			.attr('fill', '#ccc')
			.text(function(d) { return d.branch_length; });

	phylogram.vis.selectAll('g.leaf.node')
		.append('svg:text')
			.attr('class', 'label')
			.attr('dx', 8)
			.attr('dy', 3)
			.attr('text-anchor', 'start')
			.attr('font-family', 'Helvetica Neue, Helvetica, sans-serif')
			.attr('font-size', '10px')
			.attr('fill', 'black')
			.text(function(d) { return d.taxonomies[0].scientific_name + ' (' + d.branch_length + ')'; });
} // end labelNodes

function unlabelNodes()
{
	phylogram.vis.selectAll('text.label')
		.remove();
} // end unlabelNodes
