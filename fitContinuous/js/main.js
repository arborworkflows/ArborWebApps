/*jslint browser: true, nomen: true */

(function (flow, $, girder) {
    'use strict';

    $(document).ready(function () {
        girder.apiRoot = '/girder/api/v1';
        var app = new flow.App();
        app.fitContinuousId = "536d2f2d2028ea64be83bd26";

        app.readyToAnalyze = function () {
            if ("column" in this && "table" in this && "tree" in this) {
                d3.select("#analyze").classed('hidden', false)
            }
        }

        // override upload function for simple mode
        app.datasetsView.upload = function (file) {
            var reader = new FileReader();

            reader.onload = _.bind(function (e) {
                var dataset = {
                        name: file.name,
                        data: e.target.result
                    },
                    extension = file.name.split('.');

                extension = extension[extension.length - 1];
                _.extend(dataset, flow.extensionToType[extension]);
                dataset = new Backbone.Model(dataset);

                // modifications for simple app begin here
                // if its a table, get the column names
                if (flow.extensionToType[extension].type == "table") {
                    app.table = dataset.get('data');
                    d3.select("#table-name").html('table: ' + file.name + ' <span class="glyphicon glyphicon-ok-circle"></span>');
                    $("#column-input").text("Parsing column names...");
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
                }
                else if (flow.extensionToType[extension].type == "tree") {
                    app.tree = dataset.get('data');
                    d3.select("#tree-name").html('tree: ' + file.name + ' <span class="glyphicon glyphicon-ok-circle"></span>');
                }
                app.readyToAnalyze();

                this.datasets.off('add', null, 'set-collection').add(dataset);
            }, this);

            reader.readAsText(file);
        }

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
            $("#notice").text("Performing fit continuous analysis...");

            var inputs = {
                table: {type: "table", format: "csv", data: app.table},
                tree: {type: "tree", format: "newick", data: app.tree},
                column: {type: "string", format: "text", data: app.column},
                model: {type: "string", format: "text", data: "EB"}
            };

            var outputs = {
                result: {type: "tree", format: "newick"},
                fit: {type: "table", format: "rows"}
            };

            flow.performAnalysis(app.fitContinuousId, inputs, outputs,
                _.bind(function (error, result) {
                    app.taskId = result.id;
                    setTimeout(_.bind(app.checkFitContinuousResult, app), 1000);
                }, app));

        app.checkFitContinuousResult = function () {
            d3.json(girder.apiRoot + '/item/' + this.fitContinuousId + '/romanesco/' + this.taskId + '/status', _.bind(function (error, result) {
                console.log(result.status);
                if (result.status === 'SUCCESS') {
                    // get result data
                    d3.json(girder.apiRoot + '/item/' + this.fitContinuousId + '/romanesco/' + this.taskId + '/result', _.bind(function (error, data) {
                        app.fitTable = data.result.fit.data;
                        app.fitTree = data.result.result.data;

                        // render fit table
                        $("#fit_table").table({ data: app.fitTable });

                        // perform tree comparison
                        $("#analyze").removeAttr("disabled");
                        $("#notice").text("Fit continuous succeeded!  Comparing results to input...");
                    }, this));

                } else if (result.status === 'FAILURE') {
                    $("#analyze").removeAttr("disabled");
                    $("#notice").text("Analysis failed. " + result.message);
                } else {
                    setTimeout(_.bind(this.checkFitContinuousResult, this), 1000);
                }
            }, this));
        }


        });

        app.render();
    });
}(window.flow, window.$, window.girder));
