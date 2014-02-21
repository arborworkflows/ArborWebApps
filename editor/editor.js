/*jslint browser: true, unparam: true */
/*globals d3, $, workflow, FileReader, console, tangelo */

$(document).ready(function () {
    "use strict";

    var analyses,
        projects,
        project,
        file,
        flow = workflow(d3.select("#workflow-editor"), d3.select("#workflow-details")),
        currentWorkflow;

    function loadWorkflow(d) {
        d3.json("/projectmanager/tangelo/projmgr/workflow/" + project + "/" + d, function (error, w) {
            flow.clear();
            flow.data(w);
            $("#name").val(flow.data().name);
            currentWorkflow = {id: d, name: flow.data().name};
        });
        d3.event.preventDefault();
    }

    // Populate project list
    d3.json("/projectmanager/tangelo/projmgr/project", function (error, list) {
        projects = list;
        d3.select("#project").selectAll("li")
            .data(list).enter().append("li").append("a")
            .attr("href", "#")
            .text(function (d) { return d; })
            .on("click", function (d) {
                project = d;
                d3.json("/projectmanager/tangelo/projmgr/workflow/" + project, function (error, workflows) {
                    d3.select("#workflow").selectAll("li")
                        .data(workflows).enter().append("li").append("a")
                        .attr("href", "#")
                        .text(function (d) { return d; })
                        .on("click", loadWorkflow);
                });
                d3.event.preventDefault();
            });
    });
    d3.select("#new-project").on("click", function () {
        d3.json("/projectmanager/tangelo/projmgr/project/" + $("#project-name").val()).send("put", function (error, d) {
            console.log("Put it!");
        });
    });

    // Set the name editor value
    $("#name").val(flow.data().name);

    // Populate analysis list
    d3.json("/projectmanager/tangelo/projmgr/analysis", function (error, list) {
        analyses = list;
        d3.select("#analysis").selectAll("a")
            .data(list).enter().append("a")
            .attr("href", "#")
            .classed("list-group-item", true)
            .text(function (d) { return d; })
            .on("click", function (d) {
                d3.json("/projectmanager/tangelo/projmgr/analysis/" + d, function (error, analysis) {
                    if (analysis.length !== 1) {
                        console.warn("[analysis on click]: Analysis not found");
                    }
                    analysis = analysis[0].analysis;
                    if (!tangelo.isArray(analysis.inputs.input)) {
                        analysis.inputs.input = [analysis.inputs.input];
                    }
                    if (!tangelo.isArray(analysis.outputs.output)) {
                        analysis.outputs.output = [analysis.outputs.output];
                    }
                    if (!tangelo.isArray(analysis.parameters.parameter)) {
                        analysis.parameters.parameter = [analysis.parameters.parameter];
                    }
                    console.log(analysis);
                    flow.add(analysis);
                });
                d3.event.preventDefault();
            });
    });

    // Create new workflow
    d3.select("#new").on("click", function () {
        flow.data({name: "New Workflow", analyses: [], connections: []});
        d3.json("/projectmanager/tangelo/projmgr/workflow/" + project + "?operation=newWorkflow&workflowName=" + flow.data().name).send("put", JSON.stringify(flow.data()), function (error, id) {
            currentWorkflow = {id: id, name: flow.data().name};
            d3.select("#workflow").append("li").append("a")
                .datum(currentWorkflow)
                .attr("href", "#")
                .text(flow.data().name)
                .on("click", loadWorkflow);
            flow.update();
        });
    });

    // Save workflow
    d3.select("#save").on("click", function () {
        flow.data().name = $("#name").val();
        if (!currentWorkflow) {
            d3.json("/projectmanager/tangelo/projmgr/workflow/" + project).send("put", JSON.stringify(flow.serialize()), function (error, id) {
                currentWorkflow = {id: id, name: flow.data().name};
                d3.select("#workflow").append("li").append("a")
                    .datum(currentWorkflow)
                    .attr("href", "#")
                    .text(flow.data().name)
                    .on("click", loadWorkflow);
            });
        } else {
            d3.json("/projectmanager/tangelo/projmgr/workflow/" + project + "/" + currentWorkflow.id).send("put", JSON.stringify(flow.serialize()), function (error, result) {
                // Update the name in the dropdown menu
                currentWorkflow.name = flow.data().name;
                d3.select("#workflow").selectAll("a")
                    .text(function (d) { return d.name; });
            });
        }
    });

    // Delete workflow
    d3.select("#delete").on("click", function () {
        if (!currentWorkflow) {
            flow.clear();
            $("#name").val(flow.data().name);
        } else {
            console.log(currentWorkflow);
            d3.json("/projectmanager/tangelo/projmgr/workflow/" + project + "/" + currentWorkflow.id).send("delete", "", function (error, result) {
                flow.clear();
                $("#name").val(flow.data().name);

                // Remove workflow from list
                d3.select("#workflow").selectAll("a")
                    .each(function (d) {
                        if (d.id === currentWorkflow.id) {
                            d3.select(this.parentNode).remove();
                        }
                    });
            });
        }
    });

    // Copy workflow
    d3.select("#copy").on("click", function () {
        $("#name").val("Copy of " + $("#name").val());
        flow.data().name = $("#name").val();
        d3.json("/projectmanager/tangelo/projmgr/workflow/" + project).post(JSON.stringify(flow.serialize()), function (error, id) {
            currentWorkflow = {id: id, name: workflow.name};
            d3.select("#workflow").append("li").append("a")
                .datum(currentWorkflow)
                .attr("href", "#")
                .text(workflow.name)
                .on("click", loadWorkflow);
        });
    });

    /*
    // Select workflow
    d3.select("#workflow").on("change", function (d) {
        if ($("#workflow").val() === "Select workflow") {
            flow.clear();
            $("#name").val(flow.data().name);
        } else {
            d3.json("workflow/" + $("#workflow").val(), function (error, w) {
                flow.clear();
                flow.data(w);
                $("#name").val(flow.data().name);
            });
        }
    });
    */

    // Run workflow
    d3.select("#run").on("click", function () {
        flow.data().analyses.forEach(function (a, aIndex) {
            var analysisInfo, canRun, foundDoneInput;

            if (!a.state || a.state === "waiting") {
                canRun = true;
                analysisInfo = flow.serialize().analyses[aIndex];
                a.inputs.forEach(function (input, inputIndex) {
                    if (input.optional) {
                        return;
                    }
                    foundDoneInput = false;
                    flow.data().connections.forEach(function (c) {
                        if (c.inputAnalysis === a
                                && c.inputIndex === inputIndex
                                && c.outputAnalysis.state === "done") {
                            foundDoneInput = true;
                            analysisInfo.inputs[inputIndex].data =
                                c.outputAnalysis.outputs[c.outputIndex].data;
                        }
                    });
                    if (!foundDoneInput) {
                        canRun = false;
                    }
                });
                if (canRun) {
                    a.state = "running";
                    flow.update();

                    /*
                    // TODO: Do ajax request to run the analysis.
                    // Update state to done when complete.
                    d3.json("analysis/run").send("post", JSON.stringify(analysisInfo), function (error, results) {
                        a.outputs.forEach(function (o, oIndex) {
                            o.data = results[oIndex].data;
                        });
                        console.log(a);
                        a.state = "done";
                        flow.update();
                    });
                    */
                }
            }
        });
    });

    function handleReaderProgress(evt) {
        if (evt.lengthComputable) {
            var loaded = (evt.loaded / evt.total);

            $("#progressbar").progressbar({ value: loaded * 100 });
        }
    }

    function handleReaderLoadEnd(evt) {
        $("#progressbar").progressbar({ value: 100 });
        $("#droplabel").html("");
        $("#dropstatus").hide();

        var data = d3.csv.parse(evt.target.result);

        flow.add({
            name: file.name,
            inputs: [],
            parameters: [],
            outputs: [{name: "output", type: "table", data: data}]
        });
    }

    // Handle file drag/drop events
    d3.select("body")
        .on("dragenter", function () {
            d3.event.stopPropagation();
            d3.event.preventDefault();
        })
        .on("dragexit", function () {
            d3.event.stopPropagation();
            d3.event.preventDefault();
        })
        .on("dragover", function () {
            d3.event.stopPropagation();
            d3.event.preventDefault();
        })
        .on("drop", function () {
            var files, count, reader;

            d3.event.stopPropagation();
            d3.event.preventDefault();

            files = d3.event.dataTransfer.files;
            count = files.length;

            // Only call the handler if 1 or more files was dropped.
            if (count > 0) {
                file = files[0];

                $("#dropstatus").show();
                $("#droplabel").html("Processing " + file.name);

                reader = new FileReader();

                // init the reader event handlers
                reader.onprogress = function (evt) {
                    if (evt.lengthComputable) {
                        var loaded = (evt.loaded / evt.total);
                        $("#progressbar").progressbar({ value: loaded * 100 });
                    }
                };
                reader.onloadend = function (evt) {
                    var data, a;

                    $("#progressbar").progressbar({ value: 100 });
                    $("#droplabel").html("");
                    $("#dropstatus").hide();

                    function endsWith(str, suffix) {
                        return str.indexOf(suffix, str.length - suffix.length) !== -1;
                    }

                    data = null;
                    if (endsWith(file.name, ".csv")) {
                        // TODO: Load data into the database
                        // by sending evt.target.result somewhere

                        flow.add({
                            name: file.name,
                            type: "arbor.database.table",
                            inputs: [],
                            state: "done",
                            parameters: [
                                {name: "project", type: "string", value: "default"},
                                {name: "type", type: "string", value: "CharacterMatrix"},
                                {name: "name", type: "string", value: file.name}
                            ],
                            outputs: [{
                                name: "output",
                                type: "table",
                                data: {
                                    type: "csv",
                                    content: evt.target.result
                                }
                            }]
                        });
                    } else if (endsWith(file.name, ".phy")) {
                        // TODO: Load data into the database
                        // by sending evt.target.result somewhere

                        flow.add({
                            name: file.name,
                            type: "arbor.database.tree",
                            state: "done",
                            inputs: [],
                            parameters: [
                                {name: "project", type: "string", value: "default"},
                                {name: "type", type: "string", value: "PhyloTree"},
                                {name: "name", type: "string", value: file.name}
                            ],
                            outputs: [{
                                name: "output",
                                type: "tree",
                                data: {
                                    type: "newick",
                                    content: evt.target.result
                                }
                            }]
                        });
                    }
                };

                // begin the read operation
                reader.readAsText(file);
            }
        });

    // init the widgets
    $("#progressbar").progressbar();
    $(".has-tooltip").tooltip();

});