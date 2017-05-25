/*jslint browser: true, nomen: true */

(function (flow, $, girder) {
    'use strict';

    $(document).ready(function () {
        girder.apiRoot = '/girder/api/v1';
        var app = new flow.App({
            el: 'body'
        });

        // Lookup the ID of the analysis that we wish to perform.
        app.analysisName = "ltt_plot-app";
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
            if ("tree" in this && "analysisId" in this) {
                d3.select("#analyze").classed('disabled', false);
            }
        };


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

                if (typeFormat.type == "tree") {
                    app.tree = dataset.get('data');
                    d3.select("#tree-name").html('Tree: ' + file.name + ' <span class="glyphicon glyphicon-ok-circle"></span>');
                    $("#column-input").text("Click GO! to make plot...");
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
                tree:   {type: "tree",   format: "newick",           data: app.tree},
            };

            var outputs = {
                lttPlot: {type: "image", format: "png.base64"},
                data: {type: "table",  format: "rows"}
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
                        app.lttCoords = data.result.data.data;
                        console.log(app.lttCoords);


                        // render results
                        function getCol(matrix, col){
                            var column = [];
                            for(var i=0; i<matrix.length; i++){
                               column.push(matrix[i][col]);
                            }
                            return column;
                         }

                        var N = getCol(app.lttCoords.rows, "N");
                        var time = getCol(app.lttCoords.rows, "time")

                        console.log(N);
                        console.log(time);

                        var trace1 = {
                          x: time,
                          y: N,
                          mode: 'lines',
                          type: 'scatter'
                        };



                        var data = [trace1];

                        var layout = {
                          title:'LTT plot',
                          xaxis: {
                            title: 'Time before present',
                            showgrid: false,
                            zeroline: false,
                            nticks: 10
                          },
                          yaxis: {
                            title: 'Number of reconstructed lineages',
                            type: 'log',
                            showgrid: false,
                            zeroline: false,
                            nticks: 4
                          },
                        };

                        Plotly.newPlot('myDiv', data, layout);


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
