/*jslint browser: true, nomen: true */

(function (flow, $, girder) {
    'use strict';

    $(document).ready(function () {
        girder.apiRoot = '/girder/api/v1';
        var app = new flow.App({
            el: 'body'
        });

        // Lookup the ID of the analysis that we wish to perform.
        app.analysisName = "PGLS_2traits-app";
        girder.restRequest({
            path: 'resource/search',
            data: {
                q: app.analysisName,
                types: JSON.stringify(["item"])
            }
        }).done(function (results) {
            app.analysisId = results["item"][0]._id;
            app.readyToAnalyze();
        });

        app.readyToAnalyze = function () {
            if ("column_x" in this && "column_y" in this && "table" in this && "tree" in this &&
                "analysisId" in this) {
                d3.select("#analyze").classed('disabled', false);
            }
        };

        function toggleInputTablePreview() {
            if ($("#table-preview-icon").hasClass("glyphicon-folder-close")) {
                $("#table-preview-icon").removeClass("glyphicon-folder-close");
                $("#table-preview-icon").addClass("glyphicon-folder-open");
                $("#table-preview-text").text(" Hide input table preview");
            }
            else {
                $("#table-preview-icon").removeClass("glyphicon-folder-open");
                $("#table-preview-icon").addClass("glyphicon-folder-close");
                $("#table-preview-text").text(" Show input table preview");
            }

            $("#input-table-vis").toggle('slow');
        }

        // override upload function for simple mode
        flow.DatasetManagementView.prototype.upload = function (file) {
            var reader = new FileReader();

            reader.onload = _.bind(function (e) {
                var dataset = {
                        name: file.name,
                        data: e.target.result
                    },
                    extension = file.name.split('.'),
                    typeFormat;

                extension = extension[extension.length - 1];
                typeFormat = flow.getTypeFormatsFromExtension(extension)[0];
                typeFormat = {type: typeFormat.type, format: typeFormat.format};
                _.extend(dataset, typeFormat);
                dataset = new Backbone.Model(dataset);

                // modifications for simple app begin here
                // if its a table, get the column names
                if (typeFormat.type == "table") {
                    app.table = dataset.get('data');
                    app.tableFormat = typeFormat.format;
                    d3.select("#table-name").html('Table: ' + file.name + ' <span class="glyphicon glyphicon-ok-circle"></span>');
                    $("#column-input").text("Parsing column names...");
                    $("#column-names").empty();
                    flow.retrieveDatasetAsFormat(dataset, "table", "column.names", false, _.bind(function (error, dataset) {
                        var columnNames = dataset.get('data');
                        for (var i = 0; i < columnNames.length; ++i) {
                            // create drag-and-drop elements here
                            $("#column-names").append('<div class="btn btn-info draggable">' + columnNames[i] + '</div>');
                        }
                        $(".draggable").draggable({
                             zIndex: 1, helper: "clone"
                        });
                        d3.select("#column-input").html('Drag column of interest here <span class="glyphicon glyphicon-exclamation-sign"></span>');
                    }, this));

                    flow.retrieveDatasetAsFormat(dataset, "table", "rows", false, _.bind(function (error, dataset) {
                      // show the input table to help the user understand if their data
                      // was parsed correctly or not
                      var rowData = dataset.get('data');
                      rowData.rows = rowData.rows.slice(0, 3);
                      d3.select("#input-table-vis-container").classed('hidden', false);
                      $("#input-table-vis").table({ data: rowData });
                      d3.select("#column-input-y").html('Drag response variable (Y) here <span class="glyphicon glyphicon-exclamation-sign"></span>');
                      d3.select("#column-input-x").html('Drag predictor variable (X) here <span class="glyphicon glyphicon-exclamation-sign"></span>');
                    }, this));

                }

                else if (typeFormat.type == "tree") {
                    app.tree = dataset.get('data');
                    d3.select("#tree-name").html('Tree: ' + file.name + ' <span class="glyphicon glyphicon-ok-circle"></span>');
                }
                app.readyToAnalyze();

                this.datasets.off('add', null, 'set-collection').add(dataset);
            }, this);

            reader.readAsText(file);
        };

        $("#column-input-y").droppable({
            drop: function( event, ui ) {
                var COI = ui.draggable.text();
                app.column_y = COI;
                d3.select("#column-input-y")
                    .classed('btn-primary', true)
                    .classed('btn-success', false)
                    .classed('bg-warning', false)
                    .html(COI + ' <span class="glyphicon glyphicon-ok-circle"></span>' + " (Y) ~");
                app.readyToAnalyze();
            },
            over: function (event, ui) {
                d3.select("#column-input-y")
                    .classed('btn-success', true)
                    .classed('bg-warning', false);
            },
            out: function (event, ui) {
                d3.select("#column-input-y")
                    .classed('btn-success', false)
                    .classed('bg-warning', true);
            }
            });

            $("#column-input-x").droppable({
                drop: function( event, ui ) {
                    var COI = ui.draggable.text();
                    app.column_x = COI;
                    d3.select("#column-input-x")
                        .classed('btn-primary', true)
                        .classed('btn-success', false)
                        .classed('bg-warning', false)
                        .html(COI + ' <span class="glyphicon glyphicon-ok-circle"></span>' + " (X)");
                    app.readyToAnalyze();
                },
                over: function (event, ui) {
                    d3.select("#column-input-x")
                        .classed('btn-success', true)
                        .classed('bg-warning', false);
                },
                out: function (event, ui) {
                    d3.select("#column-input-x")
                        .classed('btn-success', false)
                        .classed('bg-warning', true);
                }
                });

        function toggleCorrelationModel() {

                  if(document.getElementById("first_toggle").checked)
                  {
                    app.correlation="BM";
                  }
                  if(document.getElementById("second_toggle").checked)
                  {
                    app.correlation="OU";
                  }
                  if(document.getElementById("third_toggle").checked)
                  {
                    app.correlation="lambda";
                  }
        }

        $("#analyze").click(function() {
            $("#analyze").attr("disabled", "disabled");
            $("#analyze").text("Re-run");
            $("#notice").text("Performing analysis...");

            toggleCorrelationModel();

            var inputs = {
                table:  {type: "table",  format: app.tableFormat,    data: app.table},
                tree:   {type: "tree",   format: "newick",           data: app.tree},
                dep_variable: {type: "string", format: "text",             data: app.column_y},
                ind_variable: {type: "string", format: "text",             data: app.column_x},
                correlation: {type: "string", format: "text",             data: app.correlation}
            };

            var outputs = {
				        coefficients: {type: "table", format: "rows"},
                pglsPlot: {type: "image", format: "png.base64"},
                modelfit_summary: {type: "table", format: "rows"}
            };

            flow.performAnalysis(app.analysisId, inputs, outputs,
                _.bind(function (error, result) {
                    app.taskId = result._id;
                    setTimeout(_.bind(app.checkResult, app), 1000);
                }, app));

        app.checkResult = function () {
            var check_url = '/item/' + this.analysisId + '/flow/' + this.taskId + '/status'
            girder.restRequest({path: check_url}).done(_.bind(function (result) {
                console.log(result.status);
                if (result.status === 'SUCCESS') {
                    // get result data
                    var result_url = '/item/' + this.ASRId + '/flow/' + this.taskId + '/result'
                    girder.restRequest({path: result_url}).done(_.bind(function (data) {
                        app.modelPlot = data.result.pglsPlot.data;
                      // render tree plot
                      $("#model-plot").image({ data: app.modelPlot });
                      $("#analyze").removeAttr("disabled");
                      $("#notice").text("Analysis succeeded!");
                      $('html, body').animate({
                          scrollTop: $("#model-plot").offset().top
                      }, 1000);

                      var coeffTable = data.result.coefficients.data.rows;
                      var modelTable = data.result.modelfit_summary.data.rows;
                      console.log(modelTable);

                      // pretty results
                      $("#result").append("<h2>Results:<\h2>");
                      $("#result").append("<b>Equation fit: <b><br>");
                      $("#result").append(app.column_y," = ", app.column_x, "<br><br>");
                      $("#result").append("Model for residuals: ", app.correlation, "<br><br>");
                      if(app.correlation == "OU")
                        $("#result").append("alpha = ", coeffTable[2]["Value"].toFixed(3));
                      $("#result").append("<h3>Coefficients:<\h3><br>");
                      $("#result").append("Intercept =  ", coeffTable[0]["Value"].toFixed(3), ", P = ", coeffTable[0]["p-value"].toFixed(3), "<br>");
                      $("#result").append("Slope =  ", coeffTable[1]["Value"].toFixed(3), ", P = ", coeffTable[1]["p-value"].toFixed(3), "<br>");
                      $("#result").append("AIC for model = ", modelTable[0]["AIC"].toFixed(3), "<br>");
                      $("#result").append("lnL = ", modelTable[0]["loglik"].toFixed(3), "<br>");
                  }, this));

                } else if (result.status === 'FAILURE') {
                    $("#analyze").removeAttr("disabled");
                    $("#notice").text("Analysis failed. " + result.message);
                } else {
                    setTimeout(_.bind(this.checkResult, this), 1000);
                }
            }, this));
        };

        });

        $("#help").click(function() {
            $("#upload").popover({
                title: 'Step #1',
                content: 'Upload your table (csv or tsv) and tree (newick) here',
                placement: 'bottom',
                trigger: 'manual'
            });
            $("#upload").popover('toggle');
            $("#column-input-y").popover({
                title: 'Step #2',
                content: 'Drag your column of interest here',
                placement: 'left',
                trigger: 'manual'
            });
            $("#column-input-y").popover('toggle');
            $("#analyze").popover({
                title: 'Step #3',
                content: 'Click on the "Go!" button',
                placement: 'bottom',
                trigger: 'manual'
            });
            $("#analyze").popover('toggle');

        });

        $("#table-preview").click(function() {
            toggleInputTablePreview();
        });

        app.render();
    });
}(window.flow, window.$, window.girder));
