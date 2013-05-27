/*jslint browser: true */
/*globals d3, $, workflow, FileReader */

$(document).ready(function () {
    "use strict";

    var analyses,
        file,
        flow = workflow(d3.select("#workflow-editor"));

    // Set the name editor value
    $("#name").val(flow.data().name);

    // Populate analysis list
    d3.json("analysis", function (error, list) {
        analyses = list;
        d3.select("#analysis").selectAll("li")
            .data(list).enter().append("li").append("a")
            .attr("href", "#")
            .text(function (d) { return d.name; })
            .on("click", function (d) {
                flow.add(d);
                d3.event.preventDefault();
            });
    });

    // Populate workflow list
    d3.json("workflow", function (error, list) {
        list.unshift({"id": "Select workflow", "name": "Select workflow"});
        d3.select("#workflow").selectAll("option")
            .data(list).enter().append("option")
            .attr("value", function (d) { return d.id; })
            .text(function (d) { return d.name; });
    });

    // Create new workflow
    d3.select("#new").on("click", function () {
        flow.data({name: "New Workflow", analyses: [], connections: []});
        d3.json("workflow").post(JSON.stringify(flow.data()), function (error, id) {
            d3.select("#workflow").append("option")
                .datum({id: id, name: flow.data().name})
                .attr("value", id)
                .text(flow.data().name);
            $("#workflow").val(id);
            flow.update();
        });
    });

    // Save workflow
    d3.select("#save").on("click", function () {
        var cur = $("#workflow").val();

        flow.data().name = $("#name").val();
        if (cur === "Select workflow") {
            d3.json("workflow").post(JSON.stringify(flow.serialize()), function (error, id) {
                d3.select("#workflow").append("option")
                    .datum({id: id, name: flow.data().name})
                    .attr("value", id)
                    .text(flow.data().name);
                $("#workflow").val(id);
            });
        } else {
            d3.json("workflow/" + $("#workflow").val()).send("put", JSON.stringify(flow.serialize()), function (error, result) {

                // Update the name in the dropdown menu
                d3.select("#workflow").select("option[value=\"" + cur + "\"]")
                    .datum({id: cur, name: flow.data().name})
                    .text(flow.data().name);
            });
        }
    });

    // Delete workflow
    d3.select("#delete").on("click", function () {
        var cur = $("#workflow").val();

        if (cur === "Select workflow") {
            flow.clear();
            $("#name").val(flow.data().name);
        } else {
            d3.json("workflow/" + cur).send("delete", "", function (error, result) {
                flow.clear();
                $("#name").val(flow.data().name);

                // Remove workflow from select
                d3.select("#workflow").selectAll("option")
                    .each(function (d) {
                        if (d.id === cur) {
                            d3.select(this).remove();
                        }
                    });
            });
        }
    });

    // Copy workflow
    d3.select("#copy").on("click", function () {
        $("#name").val("Copy of " + $("#name").val());
        flow.data().name = $("#name").val();
        d3.json("workflow").post(JSON.stringify(flow.serialize()), function (error, id) {
            d3.select("#workflow").append("option")
                .datum({id: id, name: workflow.name})
                .attr("value", id)
                .text(workflow.name);
            $("#workflow").val(id);
        });
    });

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

    // Run workflow
    d3.select("#run").on("click", function () {
        flow.data().analyses.forEach(function (a, aIndex) {
            var analysisInfo, canRun, foundDoneInput;

            if (!a.state || a.state === "waiting") {
                canRun = true;
                analysisInfo = flow.serialize().analyses[aIndex];
                a.inputs.forEach(function (input, inputIndex) {
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
            outputs: [{name: "output", type: "table"}]
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

});