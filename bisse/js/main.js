/*jslint browser: true, nomen: true */

(function (flow, $, girder) {
    'use strict';

    $(document).ready(function () {
        girder.apiRoot = '/girder/api/v1';
        var app = new flow.App({
            el: 'body'
        });

        // Lookup the ID of the analysis that we wish to perform.
        app.analysisName = "bisse-app";
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
            if ("column" in this && "table" in this && "tree" in this &&
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

        $("#column-input").droppable({
            drop: function( event, ui ) {
                var COI = ui.draggable.text();
                app.column = COI;
                d3.select("#column-input")
                    .classed('btn-primary', true)
                    .classed('btn-success', false)
                    .classed('bg-warning', false)
                    .html(COI + ' <span class="glyphicon glyphicon-ok-circle"></span>');
                app.readyToAnalyze();
            },
            over: function (event, ui) {
                d3.select("#column-input")
                    .classed('btn-success', true)
                    .classed('bg-warning', false);
            },
            out: function (event, ui) {
                d3.select("#column-input")
                    .classed('btn-success', false)
                    .classed('bg-warning', true);
            }
            });

        $("#analyze").click(function() {
            $("#analyze").attr("disabled", "disabled");
            $("#analyze").text("Re-run");
            $("#notice").text("Performing analysis...");

            var inputs = {
                table:  {type: "table",  format: app.tableFormat,    data: app.table},
                tree:   {type: "tree",   format: "newick",           data: app.tree},
                column: {type: "string", format: "text",             data: app.column}
            };

            var outputs = {
                statTable: {type: "table", format: "rows"},
                paramTable: {type: "table", format: "rows"}
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
                        app.result = data.result.statTable.data;
                        app.params = data.result.paramTable.data;

						console.log(app.result.rows[0])


                        // render results
						$("#result").append("<h2>Results:<\h2>");
						$("#result").append("<b>Column analyzed: <b>", app.column, "<br>");
            $("#result").append("<b>Statistical test: likelihood ratio</b><br>")
						$("#result").append("<b>BiSSE null model likelihood: <b>");
						$("#result").append("lnL = ", app.result.rows[0]["nullLik"].toFixed(2), "<br><br>")
            $("#result").append("<b>BiSSE full model likelihood: <b>");
						$("#result").append("lnL = ", app.result.rows[0]["bisLik"].toFixed(2), "<br><br>")

            $("#result").append("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Chi-squared test statistic: ", app.result.rows[0]["lrStat"].toFixed(2), "<br>")
							$("#result").append("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;P-value: ", app.result.rows[0]["lrPVal"].toFixed(3), "<br>")

							if(app.result.rows[0]["PVal"] < 0.05) {
								$("#result").append("<br><br><b>Conclusion: </b> Reject the null hypothesis, character-dependent model supported.<br>")
							} else {
								$("#result").append("<br><br><b>Conclusion: </b> Fail to reject the null hypothesis.<br>")
							}

              $("#result").append("<h2>Model parameter estimates:<\h2>");
              $("#result").append("Null model: lambda = ", app.params.rows[0]["null_lambda1"].toFixed(2), "; ");
              $("#result").append("mu = ", app.params.rows[0]["null_mu1"].toFixed(2), "<br>");
              $("#result").append("forward rate q01 = ", app.params.rows[0]["null_q01"].toFixed(2), "; ");
              $("#result").append("backward rate q10 = ", app.params.rows[0]["null_q10"].toFixed(2), "<br>");
              $("#result").append("<br><br>BiSSE model: lambda state 0 = ", app.params.rows[0]["bis_lambda0"].toFixed(2), "; ");
              $("#result").append("lambda state 1 = ", app.params.rows[0]["bis_lambda1"].toFixed(2), "<br>");
              $("#result").append("mu state 0 = ", app.params.rows[0]["bis_mu0"].toFixed(2), "; ");
              $("#result").append("mu state 1 = ", app.params.rows[0]["bis_mu1"].toFixed(2), "<br>");
              $("#result").append("forward rate q01 = ", app.params.rows[0]["bis_q01"].toFixed(2), "; ");
              $("#result").append("backward rate q10 = ", app.params.rows[0]["bis_q10"].toFixed(2), "<br>");


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
            $("#column-input").popover({
                title: 'Step #2',
                content: 'Drag your column of interest here',
                placement: 'left',
                trigger: 'manual'
            });
            $("#column-input").popover('toggle');
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
