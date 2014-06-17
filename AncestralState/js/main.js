/*jslint browser: true, nomen: true */

(function (flow, $, girder) {
    'use strict';

    $(document).ready(function () {
        girder.apiRoot = '/girder/api/v1';
        var app = new flow.App();
        app.ASRId = "537a642dd591e45a509043f6";

        app.readyToAnalyze = function () {
            if ("column" in this && "table" in this && "tree" in this) {
                d3.select("#analyze").classed('disabled', false)
                $("#upload").popover('hide');
            }
        }

        function toggleInputTablePreview() {
            if ($("#folder-icon").hasClass("glyphicon-folder-open")) {
                $("#folder-icon").removeClass("glyphicon-folder-open");
                $("#folder-icon").addClass("glyphicon-folder-close");
                $("#folder-icon").text(" Hide input table preview");
            }
            else {
                $("#folder-icon").removeClass("glyphicon-folder-close");
                $("#folder-icon").addClass("glyphicon-folder-open");
                $("#folder-icon").text(" Show input table preview");
            }

            $("#input-table-vis").toggle('slow');
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
                    app.tableFormat = flow.extensionToType[extension].format;
                    d3.select("#table-name").html('table: ' + file.name + ' <span class="glyphicon glyphicon-ok-circle"></span>');
                    $("#column-input").text("Parsing column names...");
                    $("#column-names").empty();
                    flow.retrieveDatasetAsFormat(dataset, "table", "column.names.discrete", false, _.bind(function (error, dataset) {
                        var columnNames = dataset.get('data');
                        for (var i = 0; i < columnNames.length; ++i) {
                            // create drag-and-drop elements here
                            $("#column-names").append('<div class="btn btn-info draggable discrete">' + columnNames[i] + '</div>');
                        }
                        $(".draggable").draggable({
                             zIndex: 1, helper: "clone"
                        });
                        d3.select("#column-input").html('Drag column of interest here <span class="glyphicon glyphicon-exclamation-sign"></span>');
                    }, this));
                    flow.retrieveDatasetAsFormat(dataset, "table", "column.names.continuous", false, _.bind(function (error, dataset) {
                        var columnNames = dataset.get('data');
                        for (var i = 0; i < columnNames.length; ++i) {
                            // create drag-and-drop elements here
                            $("#column-names").append('<div class="btn btn-info draggable continuous">' + columnNames[i] + '</div>');
                        }
                        $(".draggable").draggable({
                             zIndex: 1, helper: "clone"
                        });
                    }, this));

                    flow.retrieveDatasetAsFormat(dataset, "table", "rows", false, _.bind(function (error, dataset) {
                      // show the input table to help the user understand if their data
                      // was parsed correctly or not
                      var rowData = dataset.get('data');
                      rowData.rows = rowData.rows.slice(0, 3);
                      d3.select("#input-table-vis-container").classed('hidden', false);
                      $("#input-table-vis").table({ data: rowData });
                      setTimeout(function() {
                        toggleInputTablePreview();
                      }, 7000);
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
                app.type = "discrete";
                if (ui.draggable.hasClass("continuous")) {
                    app.type = "continuous";
                }
                app.column = COI;
                d3.select("#column-input")
                    .classed('btn-primary', true)
                    .classed('btn-success', false)
                    .classed('bg-warning', false)
                    .html(COI + ' <span class="glyphicon glyphicon-ok-circle"></span>');
                app.readyToAnalyze();
                $("#column-input").popover('hide');
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
            $("#analyze").popover('hide');
            $("#analyze").attr("disabled", "disabled");
            $("#analyze").text("Re-run");
            $("#notice").text("Performing ancestral state reconstruction analysis...");

            var inputs = {
                table:  {type: "table",  format: app.tableFormat,    data: app.table},
                tree:   {type: "tree",   format: "newick",           data: app.tree},
                column: {type: "string", format: "text",             data: app.column},
                type:   {type: "string", format: "text",             data: app.type},
                method: {type: "string", format: "text",             data: "marginal"}
            };

            var outputs = {
                res: {type: "table", format: "rows"},
                treePlot: {type: "image", format: "png.base64"}
            };

            flow.performAnalysis(app.ASRId, inputs, outputs,
                _.bind(function (error, result) {
                    app.taskId = result.id;
                    setTimeout(_.bind(app.checkASRResult, app), 1000);
                }, app));

        app.checkASRResult = function () {
            d3.json(girder.apiRoot + '/item/' + this.ASRId + '/romanesco/' + this.taskId + '/status', _.bind(function (error, result) {
                console.log(result.status);
                if (result.status === 'SUCCESS') {
                    // get result data
                    d3.json(girder.apiRoot + '/item/' + this.ASRId + '/romanesco/' + this.taskId + '/result', _.bind(function (error, data) {
                        app.treePlot = data.result.treePlot.data;

                        // render tree plot
                        $("#tree-plot").image({ data: app.treePlot });
                        $("#analyze").removeAttr("disabled");
                        $("#notice").text("Ancestral state reconstruction succeeded!");
                        $('html, body').animate({
                            scrollTop: $("#tree-plot").offset().top
                        }, 1000);
                    }, this));

                } else if (result.status === 'FAILURE') {
                    $("#analyze").removeAttr("disabled");
                    $("#notice").text("Analysis failed. " + result.message);
                } else {
                    setTimeout(_.bind(this.checkASRResult, this), 1000);
                }
            }, this));
        }

        });

        $("#help").click(function() {
            $("#upload").popover({
                'title': 'Step #1',
                'content': 'Upload your table (csv or tsv) and tree (newick) here',
                'placement': 'top'
            });
            $("#upload").popover('toggle');
            $("#column-input").popover({
                'title': 'Step #2',
                'content': 'Drag your column of interest here',
                'placement': 'left'
            });
            $("#column-input").popover('toggle');
            $("#analyze").popover({
                'title': 'Step #3',
                'content': 'Click on the "Go!" button',
                'placement': 'bottom'
            });
            $("#analyze").popover('toggle');
            $("#tree-plot").popover({
                'title': 'Step #4',
                'content': 'If all goes according to plan, your results will be appear here',
                'placement': 'right'
            });
            $("#tree-plot").popover('toggle');
        });

        $("#folder-icon").click(function() {
            toggleInputTablePreview();
        });

        app.render();
    });
}(window.flow, window.$, window.girder));
