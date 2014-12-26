  var grid;
  var grid_columns;
  var grid_options;
  var grid_data;



  




function updateTableDisplay(studyList) {

  var attrib;
    grid_columns = [];
    var thisObject;
    var attriblist = [];
    var dataobject;
    for (i=0; i<studyList.length; i++) {
        dataobject = studyList[i]
        for (attrib in dataobject) {
            // if this attribute is not already stored in our array, then add it
            if (attriblist.indexOf(attrib)<0) {
                grid_columns.push( {id: attrib, name: attrib, field: attrib} ) 
                attriblist.push(attrib)
            }
        }
    }

  // introspect to find the attributes for the table columns
  //grid_columns = []
  // for (var attrib in studyList[0]) {
  //grid_columns.push( {id: attrib, name: attrib, field: attrib} )  
 // }

  // global options for SlickGrid
  grid_options = {
    enableCellNavigation: true,
    enableColumnReorder: false,
    forceFitColumns: false,
    fullWidthRows: true
  };

  // re-instantiate the grid each time, it didn't seem to update correctly using the invalidate()
  // method, so safer to start afresh each time
  grid = new Slick.Grid("#tablecontent", studyList, grid_columns, grid_options);
 
}

/**  This is a sample initialization of Slick Grid with a static dataset

  var columns = [
    {id: "title", name: "Title", field: "title"},
    {id: "duration", name: "Duration", field: "duration"},
    {id: "%", name: "% Complete", field: "percentComplete"},
    {id: "start", name: "Start", field: "start"},
    {id: "finish", name: "Finish", field: "finish"},
    {id: "effort-driven", name: "Effort Driven", field: "effortDriven"}
  ];

  var options = {
    enableCellNavigation: true,
    enableColumnReorder: false,
    forceFitColumns: false,
    fullWidthRows: false
  };

  $(function () {
    var data = [];
    for (var i = 0; i < 500; i++) {
      data[i] = {
        title: "Task " + i,
        duration: "5 days",
        percentComplete: Math.round(Math.random() * 100),
        start: "01/01/2009",
        finish: "01/05/2009",
        effortDriven: (i % 5 == 0)
      };
    }

    grid = new Slick.Grid("#tablecontent", data, columns, options);
  })

*/

