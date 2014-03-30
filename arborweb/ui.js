/*jslint browser: true, unparam: true, nomen: true */
/*globals ace, angular, d3, $, workflow, FileReader, console, tangelo */

$.fn.image = function(options) {
    "use strict";
    var data = options.data;
    if (options.data.indexOf("data:image/png;base64,") !== 0) {
        data = "data:image/png;base64," + options.data;
    }
    d3.select(this.get(0)).append("img")
        .attr("src", data);
};

$(document).ready(function () {
    "use strict";
    var datasetMap = {},
        datasetTypes = {"table": [], "tree": [], "string": [], "image": []},
        editor,
        analysis,
        analyses = [],
        analysisMap = {},
        token,
        taskId,
        taskBindings,
        activeCollections = [],
        collectionMap = {},
        currentCollection = null,
        visualizations = [
            {
                name: "table",
                options: [{name: "data", type: "table", format: "rows"}]
            },
            {
                name: "dendrogram",
                options: [
                    {name: "data", type: "tree", format: "nested"},
                    {name: "distance", type: "json", "default": {format: "inline", data: {"field": "edge_data.weight"}}},
                    {name: "lineStyle", type: "string", domain: ["axisAligned", "curved"]},
                    {name: "orientation", type: "string", domain: ["horizontal", "vertical"]}
                ]
            },
            {
                name: "image",
                options: [
                    {name: "data", type: "image", format: "png.base64"}
                ]
            }
        ],
        visualizationMap = {},
        visualization,
        webFormat = {
            "table": "rows",
            "tree": "nested",
            "string": "text",
            "number": "number",
            "image": "png.base64"
        },
        formats = [
            "table:rows",
            "table:r.dataframe",
            "tree:nested",
            "tree:r.apetree",
            "string:text",
            "number:number",
            "image:png.base64"
        ];

    $("#control-panel").controlPanel();

    editor = ace.edit("editor");
    editor.setTheme("ace/theme/chrome");
    editor.setHighlightActiveLine(false);
    editor.setHighlightGutterLine(false);
    editor.setShowPrintMargin(false);
    editor.setReadOnly(true);
    editor.renderer.$cursorLayer.element.style.opacity = 0;

    d3.json("/girder/api/v1/user/authentication", function (error, result) {
        if (!error && result.authToken) {
            token = result.authToken.token;
        }
    });

    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }

    function setDisplay(mode) {
        ["intro", "vis", "editor"].forEach(function (d) {
            d3.select("#" + d).classed("hidden", mode !== d);
        });
    }

    function updateDataSelectors() {
        ["table", "tree", "image"].forEach(function (type) {
            d3.selectAll("." + type + "-select")
                .each(function () {
                    var options = d3.select(this).selectAll("option")
                        .data(datasetTypes[type], function (d) {
                            return d.uri || d.name;
                        });
                    options.enter().append("option")
                        .text(function (d) { return d.name + " (" + (d.collection ? d.collection.name : "Local") + ")"; })
                        .attr("value", function (d) { return d.uri || d.name; });
                    options.exit().remove();
                });
        });
    }

    function addDataset(dataset) {
        if (!dataset.type) {
            if (endsWith(dataset.name, ".phy")) {
                dataset.type = "tree";
                dataset.format = "newick";
            } else if (endsWith(dataset.name, ".csv")) {
                dataset.type = "table";
                dataset.format = "csv";
            } else if (endsWith(dataset.name, ".png")) {
                dataset.type = "image";
                dataset.format = "png";
            }
        }
        if (dataset.type) {
            datasetMap[dataset.uri || dataset.name] = dataset;
            if (!datasetTypes[dataset.type]) {
                datasetTypes[dataset.type] = [];
            }
            datasetTypes[dataset.type].push(dataset);
        }
        updateDataSelectors();
    }

    function upload(file) {
        var reader = new FileReader();

        reader.onload = function (e) {
            var contents = e.target.result;
            addDataset({
                name: file.name,
                data: contents
            });
        };

        reader.readAsText(file);
    }

    function retrieveDatasetAsFormat(dataset, type, format, done) {
        var uri, parts;
        if (dataset.hasOwnProperty("data")) {
            if (dataset.format === format) {
                done(null, dataset);
            } else {
                uri = "/girder/api/v1/item/cardoon/" + type + "/" + dataset.format + "/" + format;
                d3.json(uri).post(dataset.data, done);
            }
        } else {
            parts = dataset.uri.split("/");
            parts.pop();
            uri = parts.join("/") + "/cardoon/" + type + "/" + dataset.format + "/" + format;
            d3.json(uri, done);
        }
    }

    $("#g-files").change(function (e) {
        var files = $('#g-files')[0].files;
        $.each(files, function (i, file) {
            upload(file);
        });
    });

    $('#upload').click(function (e) {
        $('#g-files').click();
    });

    $('#upload').on('dragenter', function (e) {
        e.stopPropagation();
        e.preventDefault();
        e.originalEvent.dataTransfer.dropEffect = 'copy';
        d3.select('#upload')
            .classed('btn-success', true)
            .classed('btn-primary', false)
            .html('<i class="glyphicon glyphicon-upload"></i> Drop files here');
    });

    $('#upload').on('dragleave', function (e) {
        e.stopPropagation();
        e.preventDefault();
        d3.select('#upload')
            .classed('btn-success', false)
            .classed('btn-primary', true)
            .html('<i class="glyphicon glyphicon-file"/></i> Browse or drop files');
    });

    $('#upload').on('dragover', function (e) {
        e.preventDefault();
    });

    $('#upload').on('drop', function (e) {
        var files = e.originalEvent.dataTransfer.files;
        e.stopPropagation();
        e.preventDefault();
        d3.select('#upload')
            .classed('btn-success', false)
            .classed('btn-primary', true)
            .html('<i class="glyphicon glyphicon-file"></i> Browse or drop files');
        $.each(files, function (i, file) {
            upload(file);
        });
    });

    function setupEditor(parent, idPrefix, parameters) {
        var controlMap = {},
            parameterMap = {};

        d3.select(parent).selectAll("*").remove();

        parameters.forEach(function (d) {
            parameterMap[d.name] = d;
        });

        parameters.forEach(function (input) {
            var div, control;

            div = d3.select(parent).append("div")
                .classed("form-group", true);
            div.append("label")
                .attr("for", idPrefix + input.name)
                .text(input.name);
            if (input.type === "table" || input.type === "tree" || input.type === "image") {
                controlMap[input.name] = div.append("select");
                controlMap[input.name]
                    .classed("form-control", true)
                    .classed(input.type + "-select", true)
                    .attr("id", idPrefix + input.name)
                    .selectAll("option")
                    .data(datasetTypes[input.type])
                    .enter().append("option")
                    .text(function (d) { return d.name + " (" + (d.collection ? d.collection.name : "Local") + ")"; })
                    .attr("value", function (d) { return d.uri || d.name; });
            } else if (input.type === "string" || input.type === "number" || input.type === "json") {
                if (input.domain) {
                    if (tangelo.isArray(input.domain)) {
                        control = div.append("select")
                            .classed("form-control", true)
                            .attr("id", idPrefix + input.name)
                            .selectAll("option")
                            .data(input.domain)
                            .enter().append("option")
                            .text(function (d) { return d; })
                            .attr("value", function (d) { return d; });
                    } else {
                        control = div.append("select")
                            .classed("form-control", true)
                            .attr("id", idPrefix + input.name);
                    }
                } else {
                    control = div.append("input")
                        .classed("form-control", true)
                        .attr("type", "text")
                        .attr("id", idPrefix + input.name);
                }
                controlMap[input.name] = control;
                if (input["default"]) {
                    if (input.type === "json" && input["default"].format === "inline") {
                        $(control.node()).val(JSON.stringify(input["default"].data));
                    } else {
                        $(control.node()).val(input["default"].data);
                    }
                }
            }
        });
        parameters.forEach(function (input) {
            var control;
            if (input.type === "string" || input.type === "number" || input.type === "json") {
                if (input.domain && tangelo.isObject(input.domain)) {
                    control = $(controlMap[input.domain.input].node());
                    control.change(function () {
                        var dataset = datasetMap[control.val()];
                        retrieveDatasetAsFormat(dataset, parameterMap[input.domain.input].type, input.domain.format, function (error, data) {
                            var options = controlMap[input.name].selectAll("option")
                                .data(data.data, function (d) { return d; });
                            options.enter().append("option")
                                .text(function (d) { return d; })
                                .attr("value", function (d) { return d; });
                            options.exit().remove();
                        });
                    });
                }
            }
        });
        parameters.forEach(function (input) {
            if (input.type === "table" || input.type === "tree" || input.type === "image") {
                $(controlMap[input.name].node()).change();
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
            defaultValue = $("#" + idPrefix + "default"),
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
            select.change();
            name.val("");
        });

        select.off("change");
        select.change(function () {
            var param = parameterMap[select.val()];
            if (param) {
                format.val(param.type + ":" + param.format);
                format.change();
                if (param.domain) {
                    if (tangelo.isArray(param.domain)) {
                        domain.val(param.domain.join(","));
                    } else {
                        domain.val(JSON.stringify(param.domain));
                    }
                } else {
                    domain.val("");
                }
                if (defaultValue && param["default"]) {
                    defaultValue.val(param["default"].data);
                } else {
                    defaultValue.val("");
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
                    if (domain.val()[0] === "{") {
                        param.domain = JSON.parse(domain.val());
                    } else {
                        param.domain = domain.val().split(",");
                    }
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

        if (defaultValue) {
            defaultValue.remove("focusout");
            defaultValue.focusout(function () {
                var param = parameterMap[select.val()];
                if (param) {
                    if (defaultValue.val() !== "") {
                        if (param.type === "string") {
                            param['default'] = {format: "text", data: defaultValue.val()};
                        } else if (param.type === "number") {
                            param['default'] = {format: "number", data: parseFloat(defaultValue.val())};
                        }
                    } else {
                        delete param['default'];
                    }
                }
            });
        }

        d3.select(select.get(0)).selectAll("option").remove();
        update();
        select.change();
    }

    d3.select("#show-script").on("click", function () {
        var hide = d3.select("#show-script").classed("active");
        setDisplay(hide ? "vis" : "editor");
        editor.resize();
        d3.select("#show-script-icon").classed("glyphicon-eye-open", hide);
        d3.select("#show-script-icon").classed("glyphicon-eye-close", !hide);
        d3.select("#show-script-text").text(hide ? "Show script" : "Hide script");
        if (analysis.collection._accessLevel > 0) {
            d3.select("#edit").classed("hidden", hide);
            d3.selectAll(".edit-controls").classed("hidden", !d3.select("#edit").classed("active") || hide);
        }
    });

    d3.select("#edit").on("click", function () {
        var edit = d3.select("#edit").classed("active");
        editor.setReadOnly(edit);
        editor.renderer.$cursorLayer.element.style.opacity = edit ? 0 : 1;
        d3.selectAll(".edit-controls").classed("hidden", edit);
    });

    $("#mode").change(function () {
        if (analysis) {
            analysis.data.mode = $("#mode").val();
            editor.getSession().setMode("ace/mode/" + analysis.data.mode);
        }
    });

    $("#save").click(function () {
        if (analysis) {
            analysis.data.script = editor.getValue();
            d3.json(analysis.uri + "/metadata").send("put", JSON.stringify({analysis: analysis.data}), function (error, result) {
                console.log(result);
            });
        }
    });

    function updateAnalysisList() {
        var options = d3.select("#analysis").selectAll("option")
            .data(analyses, function (d) { return d.uri; });
        options.enter().append("option")
            .text(function (d) { return d.data.name + " (" + (d.collection ? d.collection.name : "Local") + ")"; })
            .attr("value", function (d) { return d.uri; });
        options.exit().remove();
    }

    function loadAnalysisItems(folder, collection) {
        d3.json("/girder/api/v1/item?folderId=" + folder, function (error, items) {
            items.forEach(function (d) {
                var analysis;
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
                addDataset(dataset);
            });
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
        var items, itemsEnter;
        items = d3.select("#active-collections").selectAll("li")
            .data(activeCollections, function (d) { return d._id; });
        itemsEnter = items.enter().append("li")
            .classed("list-group-item", true)
            .text(function (d) { return d.name + " "; })
            .on("click", function (d) {
                if (d._accessLevel > 0) {
                    currentCollection = d;
                    d3.select("#active-collections").selectAll("li").selectAll(".current").classed("hidden", function (dd) { return dd !== d; });
                    d3.select("#new-analysis-form").classed("hidden", false);
                }
            });
        itemsEnter.append("span")
            .classed("glyphicon", true)
            .classed("glyphicon-pencil", function (d) { return d._accessLevel > 0; })
            .attr("title", function (d) { return d._accessLevel > 0 ? "Can edit" : ""; });
        itemsEnter.append("span").text(" ");
        itemsEnter.append("span")
            .classed("glyphicon", true)
            .classed("glyphicon-ok", true)
            .classed("hidden", true)
            .classed("current", true)
            .attr("title", "New analyses saved here");
        items.exit().remove();
    }

    $("#collection-add").click(function () {
        var collection = collectionMap[$("#collection").val()];
        if (activeCollections.indexOf(collection) !== -1) {
            return;
        }
        d3.json("/girder/api/v1/folder?parentType=collection&parentId=" + collection._id, function (error, folders) {
            collection.analysisFolder = null;
            collection.dataFolder = null;
            folders.forEach(function (f) {
                if (f.name === "Analyses") {
                    collection.analysisFolder = f._id;
                } else if (f.name === "Data") {
                    collection.dataFolder = f._id;
                }
            });

            if (collection.analysisFolder) {
                loadAnalysisItems(collection.analysisFolder, collection);
            }

            if (collection.dataFolder) {
                loadDataItems(collection.dataFolder, collection);
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

        if (currentCollection === collection) {
            currentCollection = null;
            d3.select("#new-analysis-form").classed("hidden", true);
        }

        $.each(analysisMap, function (key, value) {
            if (value.collection.name === collection.name) {
                delete analysisMap[key];
            }
        });

        toDelete = [];
        $.each(analyses, function (index, value) {
            if (value.collection.name === collection.name) {
                toDelete.push(index);
            }
        });
        while (toDelete.length > 0) {
            analyses.splice(toDelete.pop(), 1);
        }

        $.each(datasetMap, function (key, value) {
            if (value.collection && value.collection.name === collection.name) {
                delete datasetMap[key];
            }
        });

        $.each(datasetTypes, function (key, list) {
            toDelete = [];
            $.each(list, function (index, value) {
                if (value.collection && value.collection.name === collection.name) {
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
        var analysisUri = $("#analysis").val();
        if (analysisUri) {
            analysis = analysisMap[analysisUri];
            editor.setValue(analysis.data.script);
            editor.clearSelection();
            editor.getSession().setMode("ace/mode/" + analysis.data.mode);
            setupEditor("#inputs", "input-", analysis.data.inputs);
            setupVariableEditor("input-edit-", analysis.data.inputs);
            setupVariableEditor("output-edit-", analysis.data.outputs);
            $("#mode").val(analysis.data.mode);
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
            collection: currentCollection,
            data: {
                name: $("#analysis-name").val(),
                inputs: [],
                outputs: [],
                mode: "python",
                script: ""
            }
        };
        d3.json(window.location.origin + "/girder/api/v1/item/?name=" + encodeURIComponent(analysis.name) + "&folderId=" + currentCollection.analysisFolder).post(function (error, result) {
            var analysisUri = window.location.origin + "/girder/api/v1/item/" + result._id;
            d3.json(analysisUri + "/metadata").send("put", JSON.stringify({analysis: analysis.data}), function (error, result) {
                analysis.uri = analysisUri;
                analyses.push(analysis);
                analysisMap[analysis.uri] = analysis;
                updateAnalysisList();
                $("#analysis").val(analysis.uri);
                $("#analysis").change();
                $("#analysis-name").val("");
            });
        });
    });

    function checkTaskResult() {
        d3.json(analysis.uri + "/cardoon/" + taskId + "/status", function (error, result) {
            console.log(result.status);
            if (result.status === "SUCCESS") {
                d3.json(analysis.uri + "/cardoon/" + taskId + "/result", function (error, data) {
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
                        addDataset(output);
                    });
                    d3.select("#run")
                        .classed("btn-primary", true)
                        .classed("btn-default", false)
                        .attr("disabled", null);
                    d3.select("#error-message").classed("hidden", true);
                    d3.select("#info-message").classed("hidden", true);
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
                d3.select("#info-message").classed("hidden", true);
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

        analysis.data.inputs.forEach(function (input) {
            var value = $("#input-" + input.name).val();
            if (input.type === "table" || input.type === "tree" || input.type === "image") {
                bindings.inputs[input.name] = datasetMap[value];
            } else if (input.type === "string") {
                bindings.inputs[input.name] = {"type": input.type, "format": "text", "data": value};
            } else if (input.type === "number") {
                bindings.inputs[input.name] = {"type": input.type, "format": "number", "data": parseFloat(value)};
            }
        });
        analysis.data.outputs.forEach(function (output) {
            bindings.outputs[output.name] = {"type": output.type, "format": webFormat[output.type]};
        });
        taskBindings = bindings;
        d3.select("#success-message").classed("hidden", true);
        d3.select("#error-message").classed("hidden", true);
        d3.select("#info-message").classed("hidden", false).text("Running analysis ...");
        d3.json(analysis.uri + "/cardoon").post(JSON.stringify(bindings), function (error, result) {
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
        function loadInputs(inputs, options, done) {
            var input, dataset, value;
            if (inputs.length === 0) {
                done(options);
                return;
            }
            input = inputs[0];
            inputs = inputs.slice(1);
            value = $("#vis-input-" + input.name).val();
            if (input.type === "table" || input.type === "tree" || input.type === "image") {
                dataset = datasetMap[value];
                if (dataset.bindings) {
                    d3.select("#prov")
                        .text(JSON.stringify(dataset.bindings.inputs, null, "    "));
                }
                retrieveDatasetAsFormat(dataset, input.type, input.format, function (error, data) {
                    options[input.name] = data.data;
                    loadInputs(inputs, options, done);
                });
                return;
            }
            if (input.type === "string") {
                options[input.name] = value;
            } else if (input.type === "number") {
                options[input.name] = parseFloat(value);
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
            setDisplay("vis");

            // Untoggle the show script button if active
            if (d3.select("#show-script").classed("active")) {
                d3.select("#show-script").on("click")();
                d3.select("#show-script").classed("active", false);
            }

            d3.select("#show")
                .classed("btn-primary", true)
                .classed("btn-default", false)
                .attr("disabled", null);
        });
    });

    d3.select("#show-prov").on("click", function () {
        var hide = d3.select("#show-prov").classed("active");
        d3.select("#show-prov-icon").classed("glyphicon-eye-open", hide);
        d3.select("#show-prov-icon").classed("glyphicon-eye-close", !hide);
        d3.select("#show-prov-text").text(hide ? "Show provenance" : "Hide provenance");
        d3.select("#prov")
            .classed("hidden", hide);
    });

});
