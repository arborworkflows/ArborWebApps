/*jslint browser: true, unparam: true, nomen: true */
/*globals ace, angular, d3, $, workflow, FileReader, console, tangelo */

$(document).ready(function () {
    "use strict";
    var datasetMap = {},
        datasetTypes = {"table": [], "tree": [], "string": []},
        editor,
        analysis,
        analyses = [],
        analysisUri,
        analysisMap = {},
        token,
        taskId,
        taskBindings,
        activeCollections = [],
        collectionMap = {},
        analysisFolder,
        dataFolder,
        visualizations = [
            {
                name: "table",
                options: [{name: "data", type: "table", format: "rows"}]
            },
            {
                name: "dendrogram",
                options: [
                    {name: "data", type: "tree", format: "nested"},
                    {name: "distance", type: "json", data: '{"field": "edge_data.weight"}'},
                    {name: "lineStyle", type: "string", domain: ["axisAligned", "curved"]},
                    {name: "orientation", type: "string", domain: ["horizontal", "vertical"]}
                ]
            }
        ],
        visualizationMap = {},
        visualization,
        webFormat = {
            "table": "rows",
            "tree": "nested"
        },
        formats = [
            "table:rows",
            "table:r.dataframe",
            "tree:nested",
            "tree:r.apetree",
            "string:text"
        ];

    editor = ace.edit("editor");
    editor.setTheme("ace/theme/github");
    editor.setHighlightActiveLine(false);
    editor.setShowPrintMargin(false);
    editor.setReadOnly(true);

    d3.json("/girder/api/v1/user/authentication", function (error, result) {
        if (!error && result.authToken) {
            token = result.authToken.token;
        }
    });

    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }

    function setupEditor(parent, idPrefix, parameters) {
        d3.select(parent).selectAll("*").remove();
        parameters.forEach(function (input) {
            var div, control;

            div = d3.select(parent).append("div")
                .classed("form-group", true);
            div.append("label")
                .attr("for", idPrefix + input.name)
                .text(input.name);
            if (input.type === "table" || input.type === "tree") {
                div.append("select")
                    .classed("form-control", true)
                    .classed(input.type + "-select", true)
                    .attr("id", idPrefix + input.name)
                    .selectAll("option")
                    .data(datasetTypes[input.type])
                    .enter().append("option")
                    .text(function (d) { return d.name + " (" + d.collection + ")"; })
                    .attr("value", function (d) { return d.uri || d.name; });
            } else if (input.type === "string" || input.type === "int" || input.type === "json") {
                if (input.domain) {
                    control = div.append("select")
                        .classed("form-control", true)
                        .attr("id", idPrefix + input.name)
                        .selectAll("option")
                        .data(input.domain)
                        .enter().append("option")
                        .text(function (d) { return d; })
                        .attr("value", function (d) { return d; });
                } else {
                    control = div.append("input")
                        .classed("form-control", true)
                        .attr("type", "text")
                        .attr("id", idPrefix + input.name);
                }
                if (input.data) {
                    $(control.node()).val(input.data);
                }
            }
        });
    }

    function setupVariableEditor(idPrefix, parameters) {
        var add = $("#" + idPrefix + "add"),
            name = $("#" + idPrefix + "name"),
            remove = $("#" + idPrefix + "remove"),
            format = $("#" + idPrefix + "format"),
            domain = $("#" + idPrefix + "domain"),
            select = $("#" + idPrefix + "select"),
            parameterMap = {};

        parameters.forEach(function (d) {
            parameterMap[d.name] = d;
        });

        d3.select(format.get(0)).selectAll("option")
            .data(formats, function (d) { return d; })
            .enter().append("option")
            .text(function (d) { return d; })
            .attr("value", function (d) { return d; });

        function update() {
            var options = d3.select(select.get(0)).selectAll("option")
                .data(parameters, function (d) { return d.name; });
            options.enter().append("option")
                .text(function (d) { return d.name; })
                .attr("value", function (d) { return d.name; });
            options.exit().remove();
        }

        add.off("click");
        add.click(function() {
            var param = {name: name.val(), type: "table", format: "rows"};
            parameters.push(param);
            parameterMap[param.name] = param;
            update();
            select.val(param.name);
            name.val("");
        });

        select.off("change");
        select.change(function () {
            var param = parameterMap[select.val()];
            if (param) {
                format.val(param.type + ":" + param.format);
                if (param.domain) {
                    domain.val(param.domain.join(","));
                }
            }
        });

        format.off("change");
        format.change(function () {
            var param = parameterMap[select.val()],
                parts = format.val().split(":");
            if (param) {
                param.type = parts[0];
                param.format = parts[1];
            }
            d3.select(domain.get(0)).classed("hidden", format.val() !== "string:text");
        });

        domain.off("focusout");
        domain.focusout(function () {
            var param = parameterMap[select.val()];
            if (param) {
                if (domain.val() !== "") {
                    param.domain = domain.val().split(",");
                } else {
                    delete param.domain;
                }
            }
        });

        remove.off("click");
        remove.click(function() {
            var param = parameterMap[select.val()], index;
            if (param) {
                index = parameters.indexOf(param);
                parameters.splice(index, 1);
                delete parameterMap[param.name];
                update();
                select.change();
            }
        });

        d3.select(select.get(0)).selectAll("option").remove();
        update();
        select.change();
    }

    d3.select("#show-script").on("click", function () {
        var hide = d3.select("#show-script").classed("active");
        d3.select("#editor").classed("hidden", hide);
        editor.resize();
        d3.select("#show-script-icon").classed("glyphicon-eye-open", hide);
        d3.select("#show-script-icon").classed("glyphicon-eye-close", !hide);
        d3.select("#show-script-text").text(hide ? "Show script" : "Hide script");
        d3.select("#edit").classed("hidden", hide);
        d3.selectAll(".edit-controls").classed("hidden", !d3.select("#edit").classed("active") || hide);
    });

    d3.select("#edit").on("click", function () {
        var edit = d3.select("#edit").classed("active");
        editor.setReadOnly(edit);
        d3.selectAll(".edit-controls").classed("hidden", edit);
    });

    $("#mode").change(function () {
        if (analysis) {
            analysis.mode = $("#mode").val();
            editor.getSession().setMode("ace/mode/" + analysis.mode);
        }
    });

    $("#save").click(function () {
        if (analysis) {
            analysis.script = editor.getValue();
            d3.json(analysisUri + "/metadata").send("put", JSON.stringify({analysis: analysis}), function (error, result) {
                console.log(result);
            });
        }
    });

    function updateDataSelectors() {
        ["table", "tree"].forEach(function (type) {
            d3.selectAll("." + type + "-select")
                .each(function () {
                    var options = d3.select(this).selectAll("option")
                        .data(datasetTypes[type], function (d) {
                            return d.uri || d.name;
                        });
                    options.enter().append("option")
                        .text(function (d) { return d.name + " (" + d.collection + ")"; })
                        .attr("value", function (d) { return d.uri || d.name; });
                    options.exit().remove();
                });
        });
    }

    function updateAnalysisList() {
        var options = d3.select("#analysis").selectAll("option")
            .data(analyses, function (d) { return d.uri; });
        options.enter().append("option")
            .text(function (d) { return d.data.name + " (" + d.collection + ")"; })
            .attr("value", function (d) { return d.uri; });
        options.exit().remove();
    }

    function loadAnalysisItems(folder, collection) {
        d3.json("/girder/api/v1/item?folderId=" + folder, function (error, items) {
            items.forEach(function (d) {
                var analysis;
                console.log(d);
                if (d.meta && d.meta.analysis) {
                    analysis = {
                        name: d.name,
                        collection: collection,
                        data: d.meta.analysis,
                        uri: window.location.origin + "/girder/api/v1/item/" + d._id
                    };
                    analysisMap[analysis.uri] = analysis;
                    analyses.push(analysis);
                }
            });
            updateAnalysisList();
            $("#analysis").change();
        });
    }

    function loadDataItems(folder, collection) {
        d3.json("/girder/api/v1/item?folderId=" + folder, function (error, items) {
            items.forEach(function (d) {
                var dataset = {
                    name: d.name,
                    collection: collection,
                    uri: window.location.origin + "/girder/api/v1/item/" + d._id + "/download"
                };
                if (token) {
                    dataset.uri += "?token=" + token;
                }
                if (endsWith(d.name, ".phy")) {
                    dataset.type = "tree";
                    dataset.format = "newick";
                } else if (endsWith(d.name, ".csv")) {
                    dataset.type = "table";
                    dataset.format = "csv";
                }
                if (dataset.type) {
                    datasetMap[dataset.uri] = dataset;
                    if (!datasetTypes[dataset.type]) {
                        datasetTypes[dataset.type] = [];
                    }
                    datasetTypes[dataset.type].push(dataset);
                }
            });
            updateDataSelectors();
        });
    }

    d3.json("/girder/api/v1/collection", function (error, collections) {
        collections.forEach(function (c) {
            collectionMap[c._id] = c;
        });
        d3.select("#collection").selectAll("options")
            .data(collections)
            .enter().append("option")
            .text(function (d) { return d.name; })
            .attr("value", function (d) { return d._id; });
    });

    function updateActiveCollectionsList() {
        var items = d3.select("#active-collections").selectAll("li")
            .data(activeCollections, function (d) { return d._id; });
        items.enter().append("li")
            .classed("list-group-item", true)
            .text(function (d) { return d.name; });
        items.exit().remove();
    }

    $("#collection-add").click(function () {
        var collection = collectionMap[$("#collection").val()];
        if (activeCollections.indexOf(collection) !== -1) {
            return;
        }
        d3.json("/girder/api/v1/folder?parentType=collection&parentId=" + collection._id, function (error, folders) {
            analysisFolder = null;
            dataFolder = null;
            folders.forEach(function (f) {
                if (f.name === "Analyses") {
                    analysisFolder = f._id;
                } else if (f.name === "Data") {
                    dataFolder = f._id;
                }
            });

            if (analysisFolder) {
                loadAnalysisItems(analysisFolder, collection.name);
            }

            if (dataFolder) {
                loadDataItems(dataFolder, collection.name);
            }
            activeCollections.push(collection);
            updateActiveCollectionsList();
        });
    });

    $("#collection-hide").click(function () {
        var collection = collectionMap[$("#collection").val()],
            collectionIndex = activeCollections.indexOf(collection),
            toDelete;

        if (collectionIndex === -1) {
            return;
        }
        activeCollections.splice(collectionIndex, 1);
        updateActiveCollectionsList();

        $.each(analysisMap, function (key, value) {
            if (value.collection === collection.name) {
                delete analysisMap[key];
            }
        });

        toDelete = [];
        $.each(analyses, function (index, value) {
            if (value.collection === collection.name) {
                toDelete.push(index);
            }
        });
        while (toDelete.length > 0) {
            analyses.splice(toDelete.pop(), 1);
        }

        $.each(datasetMap, function (key, value) {
            if (value.collection === collection.name) {
                delete datasetMap[key];
            }
        });

        $.each(datasetTypes, function (key, list) {
            toDelete = [];
            $.each(list, function (index, value) {
                if (value.collection === collection.name) {
                    toDelete.push(index);
                }
            });
            while (toDelete.length > 0) {
                list.splice(toDelete.pop(), 1);
            }
        });

        updateDataSelectors();
        updateAnalysisList();
        $("#analysis").change();
    });

    $("#analysis").change(function() {
        analysisUri = $("#analysis").val();
        if (analysisUri) {
            analysis = analysisMap[analysisUri].data;
            editor.setValue(analysis.script);
            editor.clearSelection();
            editor.getSession().setMode("ace/mode/" + analysis.mode);
            setupEditor("#inputs", "input-", analysis.inputs);
            setupVariableEditor("input-edit-", analysis.inputs);
            setupVariableEditor("output-edit-", analysis.outputs);
            $("#mode").val(analysis.mode);
        } else {
            analysis = null;
            editor.setValue("");
            setupEditor("#inputs", "input-", []);
            setupVariableEditor("input-edit-", []);
            setupVariableEditor("output-edit-", []);
        }
    });

    visualizations.forEach(function (d) {
        visualizationMap[d.name] = d;
    });

    // Populate visualization list
    d3.select("#visualization").selectAll("option")
        .data(visualizations)
        .enter().append("option")
        .text(function (d) { return d.name; })
        .attr("value", function (d) { return d.name; });

    $("#visualization").change(function() {
        visualization = visualizationMap[$("#visualization").val()];
        setupEditor("#vis-inputs", "vis-input-", visualization.options);
    });
    $("#visualization").change();

    $("#analysis-new").click(function () {
        analysis = {
            name: $("#analysis-name").val(),
            inputs: [],
            outputs: [],
            mode: "python",
            script: ""
        };
        d3.json(window.location.origin + "/girder/api/v1/item/?name=" + encodeURIComponent(analysis.name) + "&folderId=" + analysisFolder).post(function (error, result) {
            analysisUri = window.location.origin + "/girder/api/v1/item/" + result._id;
            d3.json(analysisUri + "/metadata").send("put", JSON.stringify({analysis: analysis}), function (error, result) {
                var newAnalysis = {
                    name: analysis.name,
                    uri: analysisUri,
                    data: analysis
                };
                analyses.push(newAnalysis);
                analysisMap[newAnalysis.uri] = newAnalysis;
                updateAnalysisList();
                $("#analysis").val(newAnalysis.uri);
                $("#analysis").change();
                $("#analysis-name").val("");
            });
        });
    });

    function checkTaskResult() {
        d3.json(analysisUri + "/cardoon/" + taskId + "/status", function (error, result) {
            console.log(result.status);
            if (result.status === "SUCCESS") {
                d3.json(analysisUri + "/cardoon/" + taskId + "/result", function (error, data) {
                    var result = data.result;
                    // Put data into list
                    $.each(result, function (outputName, output) {
                        var index = 1;
                        output.name = analysis.name + " " + outputName;
                        while (datasetMap[output.name]) {
                            output.name = analysis.name + " " + outputName + " (" + index + ")";
                            index += 1;
                        }
                        output.bindings = taskBindings;
                        datasetMap[output.name] = output;
                        datasetTypes[output.type].push(output);
                    });
                    updateDataSelectors();
                    d3.select("#run")
                        .classed("btn-primary", true)
                        .classed("btn-default", false)
                        .attr("disabled", null);
                    d3.select("#error-message").classed("hidden", true);
                    d3.select("#success-message").classed("hidden", false).text("Success!");
                    console.log(data);
                });
            } else if (result.status === "FAILURE") {
                d3.select("#run")
                    .classed("btn-primary", true)
                    .classed("btn-default", false)
                    .attr("disabled", null);
                console.log("FAILURE");
                console.log(result);
                d3.select("#success-message").classed("hidden", true);
                d3.select("#error-message").classed("hidden", false).text("Operation Failed. " + result.message);
            } else {
                setTimeout(checkTaskResult, 1000);
            }
        });
    }

    // Run analysis
    d3.select("#run").on("click", function () {
        var bindings = {"inputs": {}, "outputs": {}};

        d3.select("#run")
            .classed("btn-primary", false)
            .classed("btn-default", true)
            .attr("disabled", true);

        analysis.inputs.forEach(function (input) {
            var value = $("#input-" + input.name).val();
            if (input.type === "table" || input.type === "tree") {
                bindings.inputs[input.name] = datasetMap[value];
            } else if (input.type === "string" || input.type === "int") {
                bindings.inputs[input.name] = {"type": input.type, "format": "text", "data": value};
            }
        });
        analysis.outputs.forEach(function (output) {
            bindings.outputs[output.name] = {"type": output.type, "format": webFormat[output.type]};
        });
        taskBindings = bindings;
        d3.json(analysisUri + "/cardoon").post(JSON.stringify(bindings), function (error, result) {
            taskId = result.id;
            setTimeout(checkTaskResult, 1000);
        });
    });

    // Show visualization
    d3.select("#show").on("click", function () {
        d3.select("#show")
            .classed("btn-primary", false)
            .classed("btn-default", true)
            .attr("disabled", true);
        d3.select("#prov")
            .classed("hidden", true);
        function loadInputs(inputs, options, done) {
            var input, dataset, value, uri, parts;
            if (inputs.length === 0) {
                done(options);
                return;
            }
            input = inputs[0];
            inputs = inputs.slice(1);
            value = $("#vis-input-" + input.name).val();
            if (input.type === "table" || input.type === "tree") {
                dataset = datasetMap[value];
                if (dataset.bindings) {
                    d3.select("#prov")
                        .text(JSON.stringify(dataset.bindings.inputs, null, "    "))
                        .classed("hidden", false);
                }
                if (dataset.hasOwnProperty("data")) {
                    options[input.name] = dataset.data;
                } else {
                    parts = dataset.uri.split("/");
                    parts.pop();
                    uri = parts.join("/") + "/cardoon/" + input.type + "/" + dataset.format + "/" + input.format;
                    d3.json(uri, function (error, data) {
                        options[input.name] = data.data;
                        loadInputs(inputs, options, done);
                    });
                    return;
                }
            } else if (input.type === "string") {
                options[input.name] = value;
            } else if (input.type === "int") {
                options[input.name] = parseInt(value, 10);
            } else if (input.type === "json") {
                options[input.name] = JSON.parse(value);
            }
            loadInputs(inputs, options, done);
        }
        loadInputs(visualization.options, {}, function (options) {
            var inner = $("<div></div>");
            $("#vis").empty();
            $("#vis").append(inner);
            inner[visualization.name](options);
            d3.select("#show")
                .classed("btn-primary", true)
                .classed("btn-default", false)
                .attr("disabled", null);
        });
    });

});
