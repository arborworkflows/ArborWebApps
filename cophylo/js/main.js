/*jslint browser: true, nomen: true */

(function (flow, $, girder) {
    'use strict';

    $(document).ready(function () {
        girder.apiRoot = '/girder/api/v1';
        var app = new flow.App();

        // Lookup the ID of the analysis that we wish to perform.
        app.analysisName = "cophylo-app";
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
            if ("tree1" in this && "tree2" in this && "analysisId" in this) {
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
        app.datasetsView.upload1 = function (file) {
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


                if (flow.extensionToType[extension].type == "tree") {
                    app.tree1 = dataset.get('data');
                    d3.select("#tree1-name").html('Tree 1: ' + file.name + ' <span class="glyphicon glyphicon-ok-circle"></span>');
                }
                app.readyToAnalyze();

                this.datasets.off('add', null, 'set-collection').add(dataset);
            }, this);

            reader.readAsText(file);
        };

        app.datasetsView.upload2 = function (file) {
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


                if (flow.extensionToType[extension].type == "tree") {
                    app.tree2 = dataset.get('data');
                    d3.select("#tree2-name").html('Tree 2: ' + file.name + ' <span class="glyphicon glyphicon-ok-circle"></span>');
                }
                app.readyToAnalyze();

                this.datasets.off('add', null, 'set-collection').add(dataset);
            }, this);

            reader.readAsText(file);
        };


        $("#analyze").click(function() {
            $("#analyze").attr("disabled", "disabled");
            $("#analyze").text("Re-run");
            $("#notice").text("Performing analysis...");

            var inputs = {
                tree1:   {type: "tree",   format: "newick",           data: app.tree},
                tree2:   {type: "tree",   format: "newick",           data: app.tree},
            };

            var outputs = {
                cophyloPlot: {type: "image", format: "png.base64"},
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
                        app.lttPlot = data.result.lttPlot.data;
                        app.lttCoords = data.result.lttCoords.data;
                        // render results
                        $("#ltt-plot").image({ data: app.lttPlot });



                        console.log(app.lttCoords)

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
