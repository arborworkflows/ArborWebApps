/*jslint browser: true */

/*globals d3, vg, $ */

/*
------------------------------------------------------------------------
  MongoDB Collection Browser app 
  Tangelo web framework
  Developed by Kitware,Inc & KnowledgeVis, LLC
 
  Copyright [2013] [KnowledgeVis, LLC]

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 
--------------------------------------------------------------------------
 */
 
 // This application allows the user to instantiate a paginated, tabular view of a dataset
 // accessed through the Tangelo web framework.  The user can choose the name of the collection
 // to browse and the number of records to explore.  
 
var querydata = [];
metadata = [];
var editableGrid;

var template = [
    "var scales = {};",
    "var encoders = {};",
    "var axes = [];",
    "var dom = null;",
    "var width = {{WIDTH}};",
    "var height = {{HEIGHT}};",
    "var padding = {{PADDING}};",
    "var duration = {{DURATION}};",
    "{{INIT_SCALES}}",
    "{{INIT_ENCODERS}}",
    "{{INIT_AXES}}",
    "{{INIT_DOM}}",
    "{{UPDATE_AXES}}",
    "{{UPDATE_MARKS}}"
];

function update() {
    "use strict";

    // create a variable to render into
    var rowdata=[];
    

    // learn how to browse javaScript objects introspectively 
    
    //console.log("query return is:  ",querydata[0])
    //console.log("stringified: ",JSON.stringify(querydata[0]))
    //var attrib;
    //var thisObject = querydata[0]
    //for (attrib in querydata[0]) {
    //    console.log("found attrib: ",attrib)
    //    console.log("type of: ",typeof thisObject[attrib])
    //}
    
    // build the metadata dynamically from the first object returned from the query.  This has the weakness that
    // if attributes are contained in a later object, but not in the first one, they won't be displayed.  
    // TODO: scan through results and adjust the metadata to include ALL attributes
    
    var attrib;
    metadata = [];
    var thisObject;
    var attriblist = [];
    var dataobject;
    var thisObject = querydata[0];
    for (i=0; i<querydata.length; i++) {
        dataobject = querydata[i]
        for (attrib in dataobject) {
            // if this attribute is not already stored in our array, then add it
            if (attriblist.indexOf(attrib)<0) {
                // don't display the "_id" attribute, since it is not interesting to non-technical users
                if (attrib != '_id') {
                    console.log("pushing: ",attrib)
                    metadata.push({ name: attrib, label:attrib, datatype: (typeof thisObject[attrib]), editable: false});
                    attriblist.push(attrib)
                }
            }
        }
    }
    
    // loop through the returned data and get it in the form the editableGrid is expecting.  Had to 
    // look at the editableGrid code and notice that the json is expecting an array of the form:
    //      [ {id: 1, values: { "fieldname": value, "fieldname2": value2, ...},
    //        {id: 2, values: { "fieldname": value, "fieldname2": value2, ...},...]
                
    for (var i = 0; i < querydata.length; i++) 
    {
      rowdata.push({id:i,values: querydata[i]})
    }

    console.log('update called');
    editableGrid.load({"metadata": metadata, "data": rowdata});
    editableGrid.renderGrid("tablecontent","testgrid"); 
    editableGrid.refreshGrid();
    // update paginator whenever the table is rendered (after a sort, filter, page change, etc.)
    editableGrid.updatePaginator();

    console.log('render complete');

}

// callback function invoked when the user changes the pageSize spinbox on the application webpage.  It forces
// the table to be re-rendered using the updated page size.  Then the paginator is updated to reflect the proper
// number of available pages. 

function changePageSize(size) {
    //console.log("setting page size to: ",size);
    editableGrid.setPageSize(size)
    editableGrid.renderGrid("tablecontent","testgrid"); 
    editableGrid.refreshGrid();
    editableGrid.updatePaginator();
    // remember this and leave the value sticky until changed again
    pageSize = size;
};

// global variables used to affect the editableGrid rendering
var pageSize = 10;
var currentFilter = '';

function load() {
    "use strict";

    var host,
        db,
        collection,
        query,
        limit;

    host = d3.select("#host")[0][0].value;
    db = d3.select("#db")[0][0].value;
    collection = d3.select("#collection")[0][0].value;
    query = d3.select("#query")[0][0].value;
    limit = +d3.select("#limit")[0][0].value;
    //console.log(query);
    
    // instantiate the grid with a fixed pageSize, so pagination is enabled.  Other advanced features, not yet supported,
    // by this demo, can be attached to the grid cells to enable updates.  the pageSize is updated by a spinbox on the 
    // application webpage.  
    
    editableGrid = new EditableGrid("DemoGridSimple", {
    	enableSort: true, // true is the default, set it to false if you don't want sorting to be enabled
	editmode: "absolute", // change this to "fixed" to test out editorzone, and to "static" to get the old-school mode
	editorzoneid: "edition", // will be used only if editmode is set to "fixed"
	pageSize: pageSize
    });
    
    // bind page size selector, so user selection invokes a re-render of the table with new pageSize
    $("#pagesize").val(pageSize).change(function() { changePageSize($("#pagesize").val()); });

    // Maybe this is designed to preserve filter values between database queries?   but the input box on the
    // page get redrawn empty during a load, so we have a filter still active, but the filter value doesn't show. 
    // This behavior will be confusing to new users, so this was defeated and we currently start with an empty
    // filter each time a new query is performed.
        
    //_$('filter').value = currentFilter ? currentFilter : '';
    
    // this has the desired effect of leaving the entry in the filter box and active until it is changed 
    // or cleared by the user
    
    currentFilter = '';
    
    // filter when something is typed into filter
    _$('filter').onkeyup = function() { editableGrid.filter(_$('filter').value); editableGrid.updatePaginator(); };

    $.ajax({
        type: 'POST',
        url: '/service/mongo/' + host + '/' + db + '/' + collection,
        data: {query: query, limit: limit},
        dataType: "json",
        success: function (response) {
            var i,
                d,
                e;

            console.log('response length= ',response.result.count);
            console.log(response);
            querydata = response.result.data;
                update();

        }
    });
}

window.onload = function () {
    "use strict";

    var idx;

/*
    // initialize the metadata array to match the collection
    metadata.push({ name: "_id", label: "ObjectId", datatype: "object", editable: true});
    metadata.push({ name: "branch_length", label:"Branch Length", datatype: "double", editable: true});
    metadata.push({ name: "clades", label: "clades", datatype: "array", editable: true});
    metadata.push({ name: "scientific_name", label: "Scientific Name", datatype: "string", editable: true});
*/
    d3.select("#load").on("click", load);

};

// helper function to get path of a demo image.  Used by the paginator 
function image(relativePath) {
	return "images/" + relativePath;
}

// This function handles the behavior of moving through pages in a multipage table.  Depending on the pageSize
// variable (which indicates how many table lines to display at a time), the database query output is broken 
// up into separate pages and the "paginator" section of the webpage allows the user to move through the pages. 

// function to render the paginator control
EditableGrid.prototype.updatePaginator = function()
{
	var paginator = $("#paginator").empty();
	var nbPages = this.getPageCount();

	// get interval
	var interval = this.getSlidingPageInterval(20);
	if (interval == null) return;
	
	// get pages in interval (with links except for the current page)
	var pages = this.getPagesInInterval(interval, function(pageIndex, isCurrent) {
		if (isCurrent) return "" + (pageIndex + 1);
		return $("<a>").css("cursor", "pointer").html(pageIndex + 1).click(function(event) { editableGrid.setPageIndex(parseInt($(this).html()) - 1); editableGrid.updatePaginator();});
	});
		
	// "first" link
	var link = $("<a>").html("<img src='"+image("gofirst.png") + "'/>&nbsp;");
	if (!this.canGoBack()) link.css({ opacity : 0.4, filter: "alpha(opacity=40)" });
	else link.css("cursor", "pointer").click(function(event) { editableGrid.firstPage(); editableGrid.updatePaginator(); });
	paginator.append(link);

	// "prev" link
	link = $("<a>").html("<img src='" + image("prev.png") + "'/>&nbsp;");
	if (!this.canGoBack()) link.css({ opacity : 0.4, filter: "alpha(opacity=40)" });
	else link.css("cursor", "pointer").click(function(event) { editableGrid.prevPage(); editableGrid.updatePaginator(); });
	paginator.append(link);

	// pages
	for (p = 0; p < pages.length; p++) paginator.append(pages[p]).append(" | ");
	
	// "next" link
	link = $("<a>").html("<img src='" + image("next.png") + "'/>&nbsp;");
	if (!this.canGoForward()) link.css({ opacity : 0.4, filter: "alpha(opacity=40)" });
	else link.css("cursor", "pointer").click(function(event) { editableGrid.nextPage(); editableGrid.updatePaginator(); });
	paginator.append(link);

	// "last" link
	link = $("<a>").html("<img src='" + image("golast.png") + "'/>&nbsp;");
	if (!this.canGoForward()) link.css({ opacity : 0.4, filter: "alpha(opacity=40)" });
	else link.css("cursor", "pointer").click(function(event) { editableGrid.lastPage(); editableGrid.updatePaginator(); });
	paginator.append(link);
};
