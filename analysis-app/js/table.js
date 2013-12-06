// display a table
function display_table(selected_table) {
  // get specified json table data
  d3.json("/arborapi/projmgr/project/" + project + "/CharacterMatrix/" + selected_table, function (error, result) {
    // clear out previous contents of table
    $("#grid_table").empty();

    var header = "<thead>";
    var body = "<tbody>";
    var headerSet = 0;
    $.each(result, function(key, value) {
      var row = "<tr>";
      $.each(value, function(key, value) {
        if (key != "_id") {
          row += "<td>" + value + "</td>";
          if (headerSet == 0) {
            header += "<th>" + key + "</th>";
          }
        }
      });
      headerSet = 1;
      row += "</tr>";
      body += row;
    });
    header += "</thead>";
    body += "</tbody>";
    $("#grid_table").append(header);
    $("#grid_table").append(body);
  });
}
