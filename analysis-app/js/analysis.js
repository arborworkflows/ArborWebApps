// cache analysis info so we don't have to query the arborapi
// multiple times
var analyses = [];

// also cache what variables are input trees & what variables
// are input tables.  Same for outputs.
var input_trees = [];
var input_tables = [];
var output_trees = [];
var output_tables = [];

// this list keeps track of what parameters our analysis has.
// it is used during validation.
var analysis_parameters = [];

// populate our list of analyses
function populate_analyses()
{
  d3.json("/arborapi/projmgr/analysis", function (error, analysis_vals)
    {
    d3.select("#analysis").selectAll("option").remove();
    $.each(analysis_vals.sort(), function(unused, analysis_val)
      {
      d3.json("/arborapi/projmgr/analysis/" + analysis_val,
      function (error, result)
        {
        analyses[analysis_val] = result[0]["analysis"];
        var analysis_name = analyses[analysis_val]["@name"];
        $("#analysis").append($("<option>", {
          value: analysis_val,
          text: analysis_name
          }));
        });
      });
    });
}

// react to the user pressing the "Configure Analysis" button
d3.select("#configure_analysis").on("click", function ()
{
  analysis_val = $("#analysis").val();
  setup_analysis_dialog(analysis_val);
});

// set up a modal dialog for a particular analysis
function setup_analysis_dialog(analysis_val)
{
  analysis = analyses[analysis_val];

  // remove any previously loaded dynamic content
  // from the dialog
  $("#analysis_dialog_inputs").children("div").remove();
  $("#analysis_dialog_outputs").children("div").remove();
  $("#analysis_dialog_parameters").children("div").remove();

  // set title
  $("#analysis_dialog_title").text(analysis["@name"]);

  // setup "View Script" button
  d3.select("#view_script").on("click", function ()
    {
    window.open("/arborapi/projmgr/analysis/" + analysis_val + "/script");
    });

  // setup inputs
  input_tables.length = 0;
  input_trees.length = 0;
  // this concat trick is used to deal with the fact that this
  // sometimes returns an array, and sometimes returns an object
  // based on how many inputs this analysis requires.
  var $inputs = [].concat(analysis["inputs"]["input"]);
  $.each($inputs, function(unused, input)
    {
    var input_name = input["@name"];
    var input_type = input["@type"];
    setup_analysis_input(input_name, input_type);
  });

  // setup outputs
  output_tables.length = 0;
  output_trees.length = 0;
  var $outputs = [].concat(analysis["outputs"]["output"]);
  $.each($outputs, function(unused, output)
    {
    var output_name = output["@name"];
    var output_type = output["@type"];
    setup_analysis_output(output_name, output_type);
  });

  // setup parameters
  analysis_parameters.length = 0;
  var $parameters = [].concat(analysis["parameters"]["parameter"]);
  $.each($parameters, function(unused, parameter)
    {
    setup_analysis_parameter(parameter);
    analysis_parameters.push(parameter);
    });

  // display the dialog
  $("#analysis_dialog").modal();
}

// add an input to the analysis dialog
function setup_analysis_input(name, type)
{
  // create elements
  var $row = $("<div>", {class: "row-fluid"});
  var $label = $("<div>", {class: "span5"});
  var $select_div = $("<div>", {class: "span5 offset2"});
  var $select = $("<select>", {id: name});

  // set contents
  $label.text(name);
  switch (type)
    {
    case "Table":
      input_tables.push(name);
      var $options = $("#delete_table > option").clone()
      break;
    case "Tree":
      input_trees.push(name);
      var $options = $("#delete_tree > option").clone()
      break;
    }
  $select.append($options);

  // add elements to dialog
  $select_div.append($select);
  $row.append($label);
  $row.append($select_div);
  $("#analysis_dialog_inputs").append($row);
}

// add an output to the analysis dialog
function setup_analysis_output(name, type)
{
  // create elements
  var $row = $("<div>", {class: "row-fluid"});
  var $label = $("<div>", {class: "span5"});
  var $input_div = $("<div>", {class: "span5 offset2"});
  var $input = $("<input>", {id: name, type: "text"});

  // set contents
  $label.text(name);

  switch (type)
    {
    case "Table":
      output_tables.push(name);
      break;
    case "Tree":
      output_trees.push(name);
      break;
    }

  // add elements to dialog
  $input_div.append($input);
  $row.append($label);
  $row.append($input_div);
  $("#analysis_dialog_outputs").append($row);
}

// add a parameter to the analysis dialog
function setup_analysis_parameter(parameter)
{
  // values used by all types of parameters
  var name = parameter["@name"];
  var type = parameter["@type"];
  var title = parameter["title"];
  var description = parameter["description"];

  // HTML elements used by all types of parameters
  var $row = $("<div>", {class: "row-fluid"});
  var $label = $("<div>", {class: "span5"});
  $label.text(title);
  var $help_div = $("<div>", {class: "span1"});
  var $help = $("<a>", {class: "btn btn-info btn-sm"});
  $help.text("?");
  var $param;
  $help_div.append($help);
  $row.append($label);
  $row.append($help_div);
  $help.tooltip(
    {
    "title": description,//title,
    //"content": description,
    "trigger": "hover",
    });
  $("#analysis_dialog_parameters").append($row);

  var $param_div = $("<div>", {class: "span5 offset1"});
  $row.append($param_div);

  // setup contents based on what type of parameter this is.
  switch (type)
    {
    case "Integer":
    case "Double":
      $param = $("<input>", {id: name});
      $param_div.append($param);
      $param.spinner({"numberFormat": "n"})
      if ("min" in parameter)
        {
        $param.spinner("option", "min", parseFloat(parameter["min"]));
        }
      if ("max" in parameter)
        {
        $param.spinner("option", "max", parseFloat(parameter["max"]));
        }
      if ("default" in parameter)
        {
        $param.spinner("value", parseFloat(parameter["default"]));
        }
      break;

    case "String":
      param = $("<input>", {id: name, type: "text"});
      $param_div.append($param);
      break;

    case "Enum":
      $param = $("<select>", {id: name});
      var options = parameter["option"];
      var contents = "<option>Select...</option>";
      $.each(options, function(key, value)
        {
        contents += "<option>" + value + "</option>";
        });
      $param.append(contents);
      $param_div.append($param);
      break;

    case "Column":
    case "Range":
      if (type == "Column")
        {
        $param = $("<select>", {id: name});
        }
      else if (type == "Range")
        {
        $param = $("<select>", {id: name, multiple: "multiple"});
        }
      // populate this <select> when the user chooses a selection
      // for the appropriate table input
      var table_input_name = parameter["table"];
      d3.select("#" + table_input_name).on("change." + name, function()
        {
        var selected_table = $(this).val();
        d3.json("/arborapi/projmgr/project/" + project + "/CharacterMatrix/" + selected_table, function (error, result)
          {
          // clear out previous contents
          $param.empty();
          var contents = "";
          var headerRow = result[0];
          var itr = 1;
          $.each(headerRow, function(key, value)
            {
            if (key != "_id")
              {
              if (type == "Range")
                {
                contents += "<option value=" + itr + ">" + key + "</option>";
                itr += 1;
                }
              else
                {
                contents += "<option>" + key + "</option>";
                }
              }
            });
          $param.append(contents);
          });
        });
      $param_div.append($param);
      break;
    }
}

// react to the user pressing the "Perform Analysis" button
d3.select("#analyze").on("click", function ()
{
  var analysis_URL = "/arbor/analysis-app/R_analysis?";
  analysis_URL += "baseURL=" + encodeURIComponent(baseURL);
  analysis_URL += "&projectName=" + encodeURIComponent(project);
  var valid = true;

  // inputs
  $("#analysis_dialog_inputs").find("select").each(function()
    {
    if (this.value == "Select...")
      {
      alert("Please make a selection for " + this.id);
      valid = false;
      }
    analysis_URL += "&" + encodeURIComponent(this.id) +
                    "=" + encodeURIComponent(this.value);
    });
  if (!valid)
    {
    return;
    }

  // we also need to specify what variables are our inputs,
  // and what type of inputs they are.  This is accomplished
  // by the following two query parameters.
  if (input_tables.length > 0)
    {
    var input_table_str = "";
    for (var i = 0; i < input_tables.length; i++)
      {
      input_table_str += input_tables[i];
      if (i + 1 < input_tables.length)
        {
        input_table_str += "&";
        }
      }
    analysis_URL += "&ARBOR_ANALYSIS_INPUT_TABLES=" +
                    encodeURIComponent(input_table_str);
    }
  if (input_trees.length > 0)
    {
    var input_tree_str = "";
    for (var i = 0; i < input_trees.length; i++)
      {
      input_tree_str += input_trees[i];
      if (i + 1 < input_trees.length)
        {
        input_tree_str += "&";
        }
      }
    analysis_URL += "&ARBOR_ANALYSIS_INPUT_TREES=" +
                    encodeURIComponent(input_tree_str);
    }

  // outputs
  $("#analysis_dialog_outputs").find("input").each(function()
    {
    if (this.value == "")
      {
      alert("Please enter a value for " + this.id);
      valid = false;
      }
    analysis_URL += "&" + encodeURIComponent(this.id) +
                    "=" + encodeURIComponent(this.value);
    });
  if (!valid)
    {
    return;
    }
  if (output_tables.length > 0)
    {
    var output_table_str = "";
    for (var i = 0; i < output_tables.length; i++)
      {
      output_table_str += output_tables[i];
      if (i + 1 < output_tables.length)
        {
        output_table_str += "&";
        }
      }
    analysis_URL += "&ARBOR_ANALYSIS_OUTPUT_TABLES=" +
                    encodeURIComponent(output_table_str);
    }
  if (output_trees.length > 0)
    {
    var output_tree_str = "";
    for (var i = 0; i < output_trees.length; i++)
      {
      output_tree_str += output_trees[i];
      if (i + 1 < output_trees.length)
        {
        output_tree_str += "&";
        }
      }
    analysis_URL += "&ARBOR_ANALYSIS_OUTPUT_TREES=" +
                    encodeURIComponent(output_tree_str);
    }

  // parameters
  $("#analysis_dialog_parameters").find("input, select").each(function()
    {
    if (this.value == "Select..." || this.value == "")
      {
      alert("Please make a selection for " + this.id);
      valid = false;
      }

    if (this.type == "select-multiple")
      {
      var value = "c(";
      var i;
      for (i = 0; i < this.options.length; ++i)
        {
        if (this.options[i].selected)
          {
          value += this.options[i].value + ",";
          }
        }
      value = value.substring(0, value.length - 1);
      value += ")"
      analysis_URL += "&" + encodeURIComponent(this.id) +
                      "=" + encodeURIComponent(value);
      }
    else
      {
      analysis_URL += "&" + encodeURIComponent(this.id) +
                      "=" + encodeURIComponent(this.value);
      }
    });
  if (!valid)
    {
    return;
    }

  // analysis name
  analysis_URL += "&analysis=" + encodeURIComponent($("#analysis").val());

  $("#analysis_dialog").hide();
  run_analysis(analysis_URL);
});

// perform an analysis by accessing the given URL
function run_analysis(analysis_URL)
{
  d3.select("body").style("cursor","wait");

  d3.json(analysis_URL, function (error, result)
    {
    if (result)
      {
      alert("Analysis results: " + result.status);
      }
    d3.select("body").style("cursor","default");
    populate_selects();
  });
}

