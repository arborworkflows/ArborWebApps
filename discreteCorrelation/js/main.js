/*jslint browser: true, nomen: true */

(function (flow, $, girder) {
    'use strict';

    $(document).ready(function () {
        girder.apiRoot = '/girder/api/v1';
        var app = new flow.App({
            el: 'body'
        });

        // Lookup the ID of the analysis that we wish to perform.
        app.analysisName = "discreteCorrelation-app";
        girder.restRequest({
            path: 'resource/search',
            data: {
                q: app.analysisName,
                types: JSON.stringify(["item"])
            }
        }).done(function (results) {
            app.analysisId = results["item"][0]._id;
            console.log(app.analysisId)
            app.readyToAnalyze();
        });

        app.readyToAnalyze = function () {
            if ("column1" in this && "column2" in this && "table" in this && "tree" in this &&
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
                    $("#column-input1").text("Parsing column names...");
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
                        d3.select("#column-input1").html('Drag first column of interest here (must be a binary character) <span class="glyphicon glyphicon-exclamation-sign"></span>');
                    }, this));

                    flow.retrieveDatasetAsFormat(dataset, "table", "rows", false, _.bind(function (error, dataset) {
                      // show the input table to help the user understand if their data
                      // was parsed correctly or not
                      var rowData = dataset.get('data');
                      rowData.rows = rowData.rows.slice(0, 3);
                      d3.select("#input-table-vis-container").classed('hidden', false);
                      $("#input-table-vis").table({ data: rowData });
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

        $("#column-input1").droppable({
            drop: function( event, ui ) {
                var COI = ui.draggable.text();
                app.column1 = COI;
                d3.select("#column-input1")
                    .classed('btn-primary', true)
                    .classed('btn-success', false)
                    .classed('bg-warning', false)
                    .html(COI + ' <span class="glyphicon glyphicon-ok-circle"></span>');
                d3.select("#column-input2")
                        .html('Now place second variable of interest here...');

                app.readyToAnalyze();
            },
            over: function (event, ui) {
                d3.select("#column-input1")
                    .classed('btn-success', true)
                    .classed('bg-warning', false);
            },
            out: function (event, ui) {
                d3.select("#column-input1")
                    .classed('btn-success', false)
                    .classed('bg-warning', true);
            }
            });

            $("#column-input2").droppable({
                drop: function( event, ui ) {
                    var COI = ui.draggable.text();
                    app.column2 = COI;
                    d3.select("#column-input2")
                        .classed('btn-primary', true)
                        .classed('btn-success', false)
                        .classed('bg-warning', false)
                        .html(COI + ' <span class="glyphicon glyphicon-ok-circle"></span>');
                    app.readyToAnalyze();
                },
                over: function (event, ui) {
                    d3.select("#column-input2")
                        .classed('btn-success', true)
                        .classed('bg-warning', false);
                },
                out: function (event, ui) {
                    d3.select("#column-input2")
                        .classed('btn-success', false)
                        .classed('bg-warning', true);
                }
                });
        $("#analyze").click(function() {
            $("#analyze").attr("disabled", "disabled");
            $("#analyze").text("Re-run");
            $("#notice").text("Performing analysis...");

            console.log(app.column1, app.column2);

            var inputs = {
                table:  {type: "table",  format: app.tableFormat,    data: app.table},
                tree:   {type: "tree",   format: "newick",           data: app.tree},
                column1: {type: "string", format: "text",             data: app.column1},
                column2: {type: "string", format: "text",             data: app.column2},
            };

            var outputs = {
                dcResultTable: {type: "table", format: "rows"}
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
                    var result_url = '/item/' + this.analysisId + '/flow/' + this.taskId + '/result'
                    girder.restRequest({path: result_url}).done(_.bind(function (data) {
                        app.result = data.result.dcResultTable.data;

						console.log(app.result.rows[0])


                        // render results
						$("#result").append("<h2>Results:<\h2>");
						$("#result").append("<b>Columns analyzed: <b>", app.column1, app.column2, "<br>");
						$("#result").append("<b>Analysis type: Pagel correlation test <br>");

							$("#result").append("<b>Statistical test: likelihood ratio</b><br>")
							$("#result").append("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Likelihood ratio test statistic: ", app.result.rows[0]["lrStat"], "<br>")
              $("#result").append("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;D.f.: ", app.result.rows[0]["lrDF"], "<br>")
							$("#result").append("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;P-value: ", app.result.rows[0]["lrPVal"].toFixed(3), "<br>")

							if(app.result.rows[0]["lrPVal"] < 0.05) {
								$("#result").append("<br><br><b>Conclusion: </b> Characters are correlated (Reject the null hypothesis of no correlation).<br>")
							} else {
								$("#result").append("<br><br><b>Conclusion: </b> Fail to reject the null hypothesis of no correlation.<br>")
							}



                        $("#analyze").removeAttr("disabled");
                        $("#notice").text("Analysis succeeded!");

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
            $("#column-input1").popover({
                title: 'Step #2',
                content: 'Drag your column of interest here',
                placement: 'left',
                trigger: 'manual'
            });
            $("#column-input1").popover('toggle');
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
