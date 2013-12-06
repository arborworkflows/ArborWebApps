// react to the user pressing the "Perform Analysis" button
d3.select("#analyze").on("click", function () {
  var tree = $("#analysis_tree").val();
  var table = $("#analysis_table").val();
  var prefix = $("#prefix").val();
  var parameter = $("#parameter").val();
  var analysis = $("#analysis").val();
  var analysis_URL = "/arbor/analysis-app/EB?";
  analysis_URL += "baseURL=" + encodeURIComponent(baseURL);
  analysis_URL += "&projectName=" + encodeURIComponent(project);
  analysis_URL += "&tableName=" + encodeURIComponent(table);
  analysis_URL += "&treeName=" + encodeURIComponent(tree);
  analysis_URL += "&prefix=" + encodeURIComponent(prefix);
  analysis_URL += "&parameter=" + encodeURIComponent(parameter);
  analysis_URL += "&analysis=" + encodeURIComponent(analysis);
  run_analysis(analysis_URL);
});

// perform an analysis by accessing the given URL
function run_analysis(analysis_URL) {
  d3.select("body").style("cursor","wait");

  d3.json(analysis_URL, function (error, result) {
    if (result) {
      alert("Analysis results: " + result.status);
    }
    d3.select("body").style("cursor","default");
    populate_selects();
  });
}
