  var grid;
  var grid_columns;
  var grid_options;
  var grid_data;




function updateTableDisplay(studyList) {

  // introspect to find the attributes for the table columns
  grid_columns = [{id: "selected", name: "Selected", width: 80, minWidth: 20, maxWidth: 80, cssClass: "cell-effort-driven", field: "selected", formatter: Slick.Formatters.Checkmark, editor: Slick.Editors.Checkbox}]
  var attribsToRender = ['ot:focalCladeOTTTaxonName','ot:studyYear','ot:curatorName','ot:studyId']
  for (var attrib in attribsToRender) {
    grid_columns.push( {id: attribsToRender[attrib], 
      name: attribsToRender[attrib], field: attribsToRender[attrib]} )  
  }
  console.log('grid_columns:',grid_columns)

  // global options for SlickGrid
  // *** added editable, autoEdit to allow checkmark to be editable. Two editing lines are not needed for display
  grid_options = {
    enableCellNavigation: true,
    enableColumnReorder: false,
    forceFitColumns: true,
    fullWidthRows: true,
    editable: true,
    autoEdit: true
  };

  // since we are adding a selected column, we need to copy the data
  grid_data = []
  for (index in studyList) {
    var row = $.extend(studyList[index],{'selected':true})
    grid_data.push(row)
  }
  console.log(grid_data)
 
   // define the table the first time through, after this just update its values
   if  (grid === undefined) {
     grid = new Slick.Grid("#tablecontent", grid_data, grid_columns, grid_options);
   } else {
    console.log("attempting to redraw the grid")
    grid.invalidate()
    grid = new Slick.Grid("#tablecontent", studyList, grid_columns, grid_options);
   }
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

