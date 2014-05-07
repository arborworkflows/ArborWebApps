/*jslint browser: true, nomen: true */

(function (flow, $, girder) {
    'use strict';

    $(document).ready(function () {
        girder.apiRoot = '/girder/api/v1';
        var app = new flow.App();


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
                    d3.select("#tree-name").html('tree: ' + file.name + ' <span class="glyphicon glyphicon-ok-circle"></span>');
                }

                this.datasets.off('add', null, 'set-collection').add(dataset);
            }, this);

            reader.readAsText(file);
        }

        $("#column-input").droppable({
            drop: function( event, ui ) {
                var COI = ui.draggable.text();
                d3.select("#column-input")
                    .classed('btn-primary', true)
                    .classed('btn-success', false)
                    .classed('bg-warning', false)
                    .html(COI + ' <span class="glyphicon glyphicon-ok-circle"></span>');
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



        app.render();
    });
}(window.flow, window.$, window.girder));
