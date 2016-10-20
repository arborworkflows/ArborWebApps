/*jslint browser: true */

/*globals d3, vg, $ */

/*
------------------------------------------------------------------------
  Arbor Table Browser app
  Tangelo web framework
  Developed by Kitware,Inc & KnowledgeVis, LLC

  Copyright [2016] [KnowledgeVis, LLC]

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

 // This application allows the user to instantiate a tabular view of a dataset
 // accessed through the Arbor web framework.  The user can choose the collection and the dataset to explore
 // 

var tableExplorer = {}
tableExplorer['currentDatasetName'] = {}
var querydata = [];
var metadata = [];
var rowdata= [];
var editableGrid;
var currentProjectName = "";
var currentDatasetName = "";

// use a variable in case we want to move the location of the Arbor API
tableExplorer.girder_API_root = '../girder/api/v1'

// We want to tell the difference between ints and floats when filling the table, so we need to define this test.
// it is supposed to become part of the standard eventually:

if (!Number.isInteger) {
  Number.isInteger = function isInteger (nVal) {
    return typeof nVal === "number" && isFinite(nVal) && nVal > -9007199254740992 && nVal < 9007199254740992 && Math.floor(nVal) === nVal;
  };
}


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

});




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
            //d3.json(tableExplorer.girder_API_root+"/collection?text="+collectionName, function (error, collectionList) {
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
                            tableExplorer.currentProjectName = projectName;
                            tableExplorer.currentDatasetName = dataName;
                        });    
                        performEvent(data, "change");
                    }));
                }));
            }));  // girder collectionID
        });
    }));  // end of girder projects
}

function drawSelectedTableStub(collection,dataset) {
    console.log('drawing table for table',dataset,' in ',collection)
}


function drawSelectedTable(collection,dataset) {
    // use the girder API to extract the table.  Use the Girder API to find the collection, the
    // "Data" directory, and then the item from inside the Data folder by name
    console.log('drawing table for table',dataset,' in ',collection)

    // retrieve collection ID from the name
    var collectionId = null
    d3.json(tableExplorer.girder_API_root+"/collection?text="+collection, function (error, collectionList) {
        collectionId =  collectionList[0]["_id"]
        //console.log('collectionID=',collectionId);

        // build the query url for girder to list the contents of the selected Data folder in the collection
        // ex. http://localhost:9000/api/v1/folder?parentType=collection&parentId=5420814456c02c06f389739d&text=Data
        var data_folder_url = tableExplorer.girder_API_root+'/folder?parentType=collection&parentId='+collectionId+'&text=Data'
        var dataFolderId = null
        d3.json(data_folder_url, function (error, datasetFolderList) {
            dataFolderId = datasetFolderList[0]["_id"]
            //console.log('dataFolderID=',dataFolderId) 

            // now we can look up the items in the collection's Data Folder
            var itemlist_url = tableExplorer.girder_API_root+'/item?folderId='+dataFolderId
            d3.json(itemlist_url, function (error, itemList) {
                var itemId = null
                console.log('item list: ',itemList)
                for (var i = itemList.length - 1; i >= 0; i--) {
                    if (itemList[i]["name"]== dataset) {
                        itemId = itemList[i]["_id"]
                    }
                };
                if (itemId != null) {
                    console.log('found item number ',itemId)
                    tableExplorer.currentDatasetArchiveId = itemId

                    // item/54a01a4456c02c0551c04d40/flow/tree/nested/nested
                    // *** TODO.  add logic here to check the file extension and call the right
                    // flow conversion, based on csv, rows, etc.
                    var table_return_url = 'item/'+itemId+'/flow/table/csv/tsv'
                    var full_url = tableExplorer.girder_API_root+'/'+table_return_url
    
   			$('#heatmap').heatmap(
        		{
            			data: {
                		values: new jheatmap.readers.MatrixHeatmapReader({ url: full_url })
            		}
        		});

/**
                girder.restRequest({path: table_return_url})
                        .done(_.bind(function (result) {

                            console.log('girder response:',result)
                            // now call the rendering routine to draw the table in the interface.  pass the data
                            update_table(result.data,'species');
                        }))
                        **/
                }
            });
        });
    });
}

function update_table(data,key) {
	console.log('update_table')
}




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

    console.log('load');

    // this pulls the matrix from Arbor, draws the matrix, Only attempt this if it is a 
    // csv or tsv array
    drawSelectedTable(  tableExplorer.currentProjectName,tableExplorer.currentDatasetName);


}

/**
window.onload = function () {
    "use strict";
    var idx;
**/

$(document).ready(function(){
    initializeDataSelection("Default","default")
    d3.select("#load").on("click", load);
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

