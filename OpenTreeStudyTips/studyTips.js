// start with an empty array that will contain a record of the CSV content of the files.  
var treetips = {}
treetips.fileArray = []
treetips.fileCount = 0

// accumulation datastructures  This is used during the step of accumulating all values into a single 
// place as the studies are processed one at a time. 

treetips.fileArr = []
treetips.reference = []
treetips.processedStudyList = []

// this gets over-written by Flow
app = 0

treetips.studyAnalysisName = "Explore Study Trees from Taxon Name v2";
treetips.studyAnalysisId = 0

function findAllAnalyses() {
   // Lookup the IDs of the analyses that we wish to perform.
    girder.restRequest({
        path: 'resource/search',
        data: {
            q: treetips.studyAnalysisName,
            types: JSON.stringify(["item"])
        }
    }).done(function (results) {
        treetips.studyAnalysisId = results["item"][0]._id;
        console.log('found study analysis:',treetips.studyAnalysisName)
        console.log('id=',treetips.studyAnalysisId)
        //treetips.readyToAnalyze();
    });
  }


// this is automatically called when a file is dropped onto the file drop zone.   The text for the CSV files
// and the corresponding name are stored in the treetips.fileArray data structure.  This lets the user minimally edit
// the list before creating an output. 

function load(file) {
var xmlfilecontent = []
if (file==null)
  xmlfilecontent = "<header> <a>sometext</a> </header>"
  else {
  var reader = new FileReader();

  reader.onload = function(e) {
        // store the resulting file in browser local storage
        var fileDict = {}
        fileDict['name'] = file.name
        fileDict['contents'] = e.target.result
        treetips.fileArray.push(fileDict)
        treetips.fileCount = treetips.fileCount*1 + 1
        console.log('treetips file count now: ',treetips.fileCount)
        console.log(treetips.fileArray)
        // update the display lists on the web page and the delete selector (in case it is needed)
        initializeDatasetSelector();
  }
  reader.readAsText(file);
  //console.log(reader);
  }
}

// find the taxon name that has been entered in the interface and do a query of the OTL API
// to see what matching studies are returned

function getMatchingStudiesFromOpenTree() {

      var taxon = document.getElementById('taxon_name').value;
      console.log('taxon is:',taxon)
      var inputs = {
          taxonName:  {type: "string",  format: "text",    data: taxon}
      };

      var outputs = {
                returnedStudies: {type: "table", format: "rows"}
            };

      // now execute the method on the input data
      flow.performAnalysis(treetips.studyAnalysisId, inputs, outputs,
          _.bind(function (error, result) {
              treetips.taskId = result._id;
              setTimeout(_.bind(treetips.checkResult, window.app), 1000);
          }, window.app));

        // this is called repeately, once per second, to see if the computation result is done
        treetips.checkResult = function () {
            var check_url = '/item/' + treetips.studyAnalysisId + '/flow/' +  treetips.taskId + '/status'
            girder.restRequest({path: check_url}).done(_.bind(function (result) {
                console.log(result.status);
                if (result.status === 'SUCCESS') {
                    // get result data
                    var result_url = '/item/' + treetips.studyAnalysisId + '/flow/' +  treetips.taskId + '/result'
                    girder.restRequest({path: result_url}).done(_.bind(function (data) {
                        treetips.result = data.result.returnedStudies.data;
                        console.log(treetips.result.rows[0])
                        updateTableDisplay(treetips.result.rows)

                        // render results
          
                        $("#notice").text("Analysis succeeded!");

                    }, this));

                } else if (result.status === 'FAILURE') {
                    $("#analyze").removeAttr("disabled");
                    $("#notice").text("Analysis failed. " + result.message);
                } else {
                    setTimeout(_.bind(treetips.checkResult, this), 1000);
                }
            }, this));
        };



}


// the user has completed adding studies to compile and has selected processing to begin.  Each study is copied
// over one at a time and processed.  The accumulation is performed 

function findStudies() {
    console.log('find studies')
    var instring, testfile
    getMatchingStudiesFromOpenTree()

    //updateTableDisplay(treetips.processedStudyList)
     //writeOutput()
}

function writeAllToDatabase() {
  for (var i = 0; i < treetips.processedStudyList.length ; i++) {
    console.log(treetips.processedStudyList[i])
    writeSingleStudyToDatabase(treetips.processedStudyList[i])
  }
}

// this can process multiple studies at once.  The summary results are accumulated in data structures initialized here 
function prepareAccumulationStructures() {
 while(treetips.processedStudyList.length >0) {
    treetips.processedStudyList.pop()
 }
}

  function writeSingleStudyToDatabase(singleStudy) {

   serviceUrl = "service/writestudytodatastore"
        $.ajax({
        type: 'PUT',
        url: serviceUrl,
        data: {
           study: JSON.stringify(singleStudy)
           },
        dataType: "json",
        success: function (response) {
            // If the value could not be retrieved, set it to null and print
            // an error message on the console.
            if (response.error || response.result.length === 0) {
                max = null;

                if (response.error) {
                    tangelo.fatalError("something bad happened");
                }
            } else {
                console.log("received json response:",response)
                // we know the operation is complete now, so update the UI
                updateDisplayAfterDataStore()
            }
        }
        });

  }

// called after a successful store of a study in the database 
function updateDisplayAfterDataStore()  {

}



function writeOutput() {
    var content = treetips.fileArr;

     // write in the row names as the new first column
    for (var i = 0; i < treetips.reference.length; i++) {
      content[i].unshift(treetips.reference[i])
    };

    // write out arrays in CSV format
    var finalVal = '';
    for (var i = 0; i < content.length; i++) {
        var value = content[i];

        for (var j = 0; j < value.length; j++) {
            var innerValue =  value[j]===null?'':value[j].toString();
            var result = innerValue.replace(/"/g, '""');
            if (result.search(/("|,|\n)/g) >= 0)
                result = '"' + result + '"';
            if (j > 0)
                finalVal += ',';
            finalVal += result;
        }
        finalVal += '\n';
    }

    console.log(finalVal);
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(finalVal));
    pom.setAttribute('download', 'treetipsStudies.csv');
    pom.click();
}



(function (flow, $, girder) {
    'use strict';
  // this function is called as soon as the page is finished loading
  $(document).ready(function () {

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
      } else {
          $("#login").removeClass("hidden");
          $("#register").removeClass("hidden");
          $("#name").addClass("hidden");
          $("#logout").addClass("hidden");

          // Do anything else you would like to do on logout.
          // populate the collection selectors using the anonymous (user=none) status we have nows
      }
  });

  // Check who is logged in initially.
  girder.restRequest({
      path: 'user/authentication',
      error: null
  }).done(function () {
      girder.events.trigger('g:login');
  });


  app = new flow.App({
              el: 'body'
          });
    findAllAnalyses()

    // set a watcher on the UI buttons to take action when they are clicked


    d3.select("#processbutton")
       .on("click", findStudies);
    d3.select("#databasebutton")
       .on("click", writeAllToDatabase);
  });
}(window.flow, window.$, window.girder));
