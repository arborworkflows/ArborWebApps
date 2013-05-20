/*jslint browser: true */
/*globals d3, console, $ */

window.onload = function () {
    "use strict";

    var workflow, drag, vis, outputAnalysis, outputIndex, conn, analyses, analysisMap, analysisTypes;

    // Add properties to workflow to aid in interactive editing
    function prepareWorkflowForRuntime(workflow) {
        $("#name").val(workflow.name);
        analysisMap = {};
        workflow.analyses.forEach(function (a) {
            a.inputScale = d3.scale.linear().domain([0, a.inputs.length - 1]).range([25, 125]);
            a.outputScale = d3.scale.linear().domain([0, a.outputs.length - 1]).range([25, 125]);
            analysisMap[a.name] = a;
        });
        workflow.connections.forEach(function (c) {
            c.outputAnalysis = analysisMap[c.outputAnalysis];
            c.outputPos = c.outputAnalysis.outputScale(c.outputIndex);
            c.inputAnalysis = analysisMap[c.inputAnalysis];
            c.inputPos = c.inputAnalysis.inputScale(c.inputIndex);
        });
    }

    // Convert workflow to pure JSON (no references) for serialization
    function serializeWorkflow(workflow) {
        var serialized = {name: workflow.name, analyses: [], connections: []};
        workflow.analyses.forEach(function (analysis) {
            serialized.analyses.push({
                x: analysis.x,
                y: analysis.y,
                name: analysis.name,
                inputs: analysis.inputs,
                parameters: analysis.parameters,
                outputs: analysis.outputs
            });
        });
        workflow.connections.forEach(function (c) {
            serialized.connections.push({
                outputAnalysis: c.outputAnalysis.name,
                outputIndex: c.outputIndex,
                inputAnalysis: c.inputAnalysis.name,
                inputIndex: c.inputIndex
            });
        });
        return serialized;
    }

    // Update the SVG path for a connection
    function connectionPath(d) {
        var o = d.outputAnalysis.outputs[d.outputIndex],
            i = d.inputAnalysis.inputs[d.inputIndex],
            dist,
            delta,
            offset;
        delta = [d.outputAnalysis.x - d.inputAnalysis.x, d.outputAnalysis.y - d.inputAnalysis.y];
        dist = Math.sqrt(delta[0] * delta[0] + delta[1] * delta[1]);
        offset = 0.4 * dist - 50;
        offset = offset < 0 ? 0 : offset;
        return "M " + (d.outputAnalysis.x + d.outputPos) + " " + (d.outputAnalysis.y + 100)
            + " C " + (d.outputAnalysis.x + d.outputPos) + " " + (d.outputAnalysis.y + 100 + offset)
            + " " + (d.inputAnalysis.x + d.inputPos) + " " + (d.inputAnalysis.y - offset)
            + " " + (d.inputAnalysis.x + d.inputPos) + " " + d.inputAnalysis.y;
    }

    function updateConnections() {
        function connectionKey(d) {
            return d.inputAnalysis.name
                + "$"
                + d.inputIndex
                + "$"
                + d.outputAnalysis.name
                + "$"
                + d.outputIndex;
        }
        conn.selectAll("path").data(workflow.connections, connectionKey).enter().append("path")
            .style("stroke", "black")
            .style("stroke-width", 2)
            .style("fill", "none")
            .attr("d", connectionPath);
        conn.selectAll("path").data(workflow.connections, connectionKey).exit().remove();
    }

    function setupWorkflowAnalysis(analysis) {

        function portShape(type, x, y) {
            if (type === "table") {
                return "M " + x + " " + y
                    + "m -10, -10"
                    + "l 20, 0"
                    + "l 0, 20"
                    + "l -20, 0"
                    + "Z";
            } else if (type === "tree") {
                return "M " + x + " " + y
                    + "m -10, 10"
                    + "l 20, 0"
                    + "l -10, -20"
                    + "Z";
            }
            return "M " + x + " " + y
                + " m -10,0"
                + " a 10,10 0 1,0 20,0"
                + " a 10,10 0 1,0 -20,0";
        }

        d3.select(this).selectAll("path.input").data(analysis.inputs).enter().append("path")
            .classed("input", true)
            .attr("d", function (d, i) { return portShape(d.type, analysis.inputScale(i), 0); })
            .style("fill", "#eee")
            .style("stroke", "black")
            .style("stroke-width", 2)
            .on("mouseover", function (d) { d3.select(this).style("fill", "orange"); })
            .on("mouseout", function (d) { d3.select(this).style("fill", "#eee"); })
            .on("mouseup", function (d, i) {
                var existing;
                if (outputAnalysis !== undefined
                        && outputAnalysis.outputs[outputIndex].type === analysis.inputs[i].type) {

                    // Remove any existing connection to this input
                    workflow.connections.forEach(function (c, ci) {
                        if (c.inputAnalysis === analysis && c.inputIndex === i) {
                            existing = ci;
                        }
                    });
                    if (existing !== undefined) {
                        workflow.connections.splice(existing, 1);
                    }

                    // Add the new connection
                    workflow.connections.push({
                        outputAnalysis: outputAnalysis,
                        outputIndex: outputIndex,
                        outputPos: outputAnalysis.outputScale(outputIndex),
                        inputAnalysis: analysis,
                        inputIndex: i,
                        inputPos: analysis.inputScale(i)
                    });
                    updateConnections();
                    outputAnalysis = undefined;
                    outputIndex = undefined;
                }
            });

        d3.select(this).selectAll("path.output").data(analysis.outputs).enter().append("path")
            .classed("output", true)
            .attr("d", function (d, i) { return portShape(d.type, analysis.outputScale(i), 100); })
            .style("fill", "#eee")
            .style("stroke", "black")
            .style("stroke-width", 2)
            .on("mouseover", function (d) { d3.select(this).style("fill", "orange"); })
            .on("mouseout", function (d) { d3.select(this).style("fill", "#eee"); })
            .on("mousedown", function (o, i) {
                outputAnalysis = analysis;
                outputIndex = i;
                d3.event.stopPropagation();
            });
    }

    function updateAnalyses() {
        var g = vis.selectAll("g.analysis").data(workflow.analyses, function (d) { return d.name; })
            .enter().append("g")
            .classed("analysis", true);

        vis.selectAll("g.analysis").data(workflow.analyses, function (d) { return d.name; })
            .exit().remove();

        g.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; })
            .call(drag);

        g.append("rect")
            .each(function (d) {
                $(this).popover({title: d.name, content: "Here is a description of this filter. A form with options could go here too.", trigger: "click", html: true, container: "body"});
            })
            .attr("width", 150)
            .attr("height", 100)
            .attr("rx", 10)
            .attr("ry", 10)
            .style("fill", "#ccc")
            .style("stroke", "black")
            .style("stroke-width", 2);
        g.append("text")
            .attr("x", 75)
            .attr("y", 75)
            .style("text-anchor", "middle")
            .style("alignment-baseline", "central")
            .text(function (d) { return d.name; })
            .style("user-select", "none")
            .style("-webkit-user-select", "none")
            .style("pointer-events", "none");
        g.append("image")
            .attr("x", 75 - 16)
            .attr("y", 40 - 16)
            .attr("width", 32)
            .attr("height", 32)
            .attr("xlink:href", "simple.png");
        g.each(setupWorkflowAnalysis);
    }

    function clearWorkflow() {
        workflow = {name: "New Workflow", analyses: [], connections: []};
        prepareWorkflowForRuntime(workflow);
        updateAnalyses();
        updateConnections();
    }

    function addAnalysis(a) {
        console.log(a);
        var count,
            analysis = {
                x: 0,
                y: 0,
                name: a.name,
                inputs: a.inputs,
                parameters: [],
                outputs: a.outputs
            };
        a.parameters.forEach(function (param) {
            var p = {name: param.name, type: param.type, value: param.value};
            if (param.values) {
                p.values = param.values;
            }
            p.current = param.value;
            analysis.parameters.push(p);
        });
        analysis.inputScale = d3.scale.linear().domain([0, analysis.inputs.length - 1]).range([25, 125]);
        analysis.outputScale = d3.scale.linear().domain([0, analysis.outputs.length - 1]).range([25, 125]);
        count = 1;
        while (analysisMap[analysis.name] !== undefined) {
            analysis.name = a.name + " " + count;
            count += 1;
        }
        analysisMap[analysis.name] = analysis;
        workflow.analyses.push(analysis);
        updateAnalyses();
    }

    // Create main SVG object
    vis = d3.select("#main").append("svg");

    // Create group containing all connections
    conn = vis.append("g");

    // Define behavior for dragging analysis "g" elements
    drag = d3.behavior.drag()
        .on("drag", function (d) {
            d.x += d3.event.dx;
            d.y += d3.event.dy;
            d3.select(this)
                .attr("transform", "translate(" + d.x + "," + d.y + ")");
            $(d3.select(this).select("rect").node()).popover("hide");
            conn.selectAll("path")
                .attr("d", connectionPath);
        });

    // Start with an empty workflow
    clearWorkflow();

    d3.json("analysis", function (error, list) {
        analyses = list;
        d3.select("#analysis").selectAll("li")
            .data(list).enter().append("li").append("a")
            .attr("href", "#")
            .text(function (d) { return d.name; })
            .on("click", function (d) {
                addAnalysis(d);
                d3.event.preventDefault();
            });
    });

    // Define analysis types
    // TODO: This should be read from the database
    analysisTypes = {
        source: {name: "Source", inputs: [], outputs: [1, 2, 3]},
        analysis: {name: "Analysis", inputs: [1, 2, 3, 4], outputs: [1, 2, 3]},
        sink: {name: "Sink", inputs: [1, 2, 3, 4], outputs: []}
    };

    // Callback for adding analyses
    d3.select("#add-source").on("click", function () { addAnalysis(analysisTypes.source); });
    d3.select("#add-analysis").on("click", function () { addAnalysis(analysisTypes.analysis); });
    d3.select("#add-sink").on("click", function () { addAnalysis(analysisTypes.sink); });

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
        workflow = {name: "New Workflow", analyses: [], connections: []};
        d3.json("workflow").post(JSON.stringify(workflow), function (error, id) {
            d3.select("#workflow").append("option")
                .datum({id: id, name: workflow.name})
                .attr("value", id)
                .text(workflow.name);
            $("#workflow").val(id);
            updateAnalyses();
            updateConnections();
        });
    });

    // Save workflow
    d3.select("#save").on("click", function () {
        var cur = $("#workflow").val();

        workflow.name = $("#name").val();
        if (cur === "Select workflow") {
            d3.json("workflow").post(JSON.stringify(serializeWorkflow(workflow)), function (error, id) {
                d3.select("#workflow").append("option")
                    .datum({id: id, name: workflow.name})
                    .attr("value", id)
                    .text(workflow.name);
                $("#workflow").val(id);
            });
        } else {
            d3.json("workflow/" + $("#workflow").val()).send("put", JSON.stringify(serializeWorkflow(workflow)), function (error, result) {

                // Update the name in the dropdown menu
                d3.select("#workflow").select("option[value=\"" + cur + "\"]")
                    .datum({id: cur, name: workflow.name})
                    .text(workflow.name);
            });
        }
    });

    // Delete workflow
    d3.select("#delete").on("click", function () {
        var cur = $("#workflow").val();

        if (cur === "Select workflow") {
            clearWorkflow();
        } else {
            d3.json("workflow/" + cur).send("delete", "", function (error, result) {
                clearWorkflow();

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
        workflow.name = $("#name").val();
        d3.json("workflow").post(JSON.stringify(serializeWorkflow(workflow)), function (error, id) {
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
            clearWorkflow();
        } else {
            d3.json("workflow/" + $("#workflow").val(), function (error, w) {
                clearWorkflow();
                workflow = w;
                prepareWorkflowForRuntime(workflow);
                updateAnalyses();
                updateConnections();
            });
        }
    });
};