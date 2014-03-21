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
            $("#name").val(d);
            flow.clear();
            flow.data(w);
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
                // set the current project in the name field
                $("#project-name").val(project);
                // fill the workflow dropdown with the workflows in this project
                d3.json("/projectmanager/tangelo/projmgr/project/" + project+"/Workflow", function (error, workflows) {
                    d3.select("#workflow").selectAll("li")
                        .data(workflows).enter().append("li").append("a")
                        .attr("href", "#")
                        .text(function (d) { return d; })
                        .on("click", loadWorkflow);
                });
                d3.event.preventDefault();
            });
    });
    // create a new project in the datastore
    d3.select("#new-project").on("click", function () {
        d3.json("/projectmanager/tangelo/projmgr/project/" + $("#project-name").val()).send("put", function (error, d) {
            console.log("create new project!");
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
                    analysis = analysis[0];
                    if (!tangelo.isArray(analysis.inputs)) {
                        analysis.inputs = [analysis.inputs];
                    }
                    if (!tangelo.isArray(analysis.outputs)) {
                        analysis.outputs = [analysis.outputs];
                    }
                    if (!tangelo.isArray(analysis.parameters)) {
                        analysis.parameters = [analysis.parameters];
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
        var workflowname = $("#name").val();
        var serializedWorkflow = JSON.stringify(flow.serialize());
        var operationStringToSend = "?operation=updateWorkflowFromString&workflowName="+workflowname+"&data="+serializedWorkflow
        console.log("serialize to save: ",operationStringToSend+serializedWorkflow)
        d3.json("/projectmanager/tangelo/projmgr/workflow/" + project+ operationStringToSend).send("put", serializedWorkflow, function (error, result) {
                console.log("result: ", result)
                if (error)
                    console.log("error: ", error)
        });
    });

    // Delete workflow
    d3.select("#delete").on("click", function () {
        if (!currentWorkflow) {
            flow.clear();
            $("#name").val(flow.data().name);
        } else {
            console.log(currentWorkflow);
            d3.json("/projectmanager/tangelo/projmgr/workflow/" + project + "/" + currentWorkflow.name).send("delete", "", function (error, result) {
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



    // Run workflow
    d3.select("#run").on("click", function () {
          var postRequest = "operation=executeWorkflow&workflowName="+ $("#name").val()+"&projname="+$("#project-name").val();
          console.log("run request: ",postRequest)
          d3.json("/projectmanager/tangelo/projmgr/workflow/").send("put", postRequest, function (error, results) {
                console.log("workflow executed");
                //flow.update();
          });
    });



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
