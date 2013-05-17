/*jslint browser: true */
/*globals d3, console, $ */

window.onload = function () {
    "use strict";

    var workflow, drag, vis, outputAnalysis, outputIndex, conn, analysisMap, analysisTypes;

    // Add properties to workflow to aid in interactive editing
    function prepareWorkflowForRuntime(workflow) {
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
        var serialized = {analyses: [], connections: []};
        workflow.analyses.forEach(function (analysis) {
            serialized.analyses.push({
                x: analysis.x,
                y: analysis.y,
                name: analysis.name,
                inputs: analysis.inputs,
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
        conn.selectAll("path").data(workflow.connections).enter().append("path")
            .style("stroke", "black")
            .style("stroke-width", 2)
            .style("fill", "none")
            .attr("d", connectionPath);
        conn.selectAll("path").data(workflow.connections).exit().remove();
    }

    function setupWorkflowAnalysis(analysis) {
        d3.select(this).selectAll("circle.input").data(analysis.inputs).enter().append("circle")
            .classed("input", true)
            .attr("cx", function (o, i) { return analysis.inputScale(i); })
            .attr("cy", 0)
            .attr("r", 10)
            .style("fill", "#eee")
            .style("stroke", "black")
            .style("stroke-width", 2)
            .on("mouseover", function (d) { d3.select(this).style("fill", "orange"); })
            .on("mouseout", function (d) { d3.select(this).style("fill", "#eee"); })
            .on("mouseup", function (d, i) {
                if (outputAnalysis !== undefined) {
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

        d3.select(this).selectAll("circle.output").data(analysis.outputs).enter().append("circle")
            .classed("output", true)
            .attr("cx", function (o, i) { return analysis.outputScale(i); })
            .attr("cy", 100)
            .attr("r", 10)
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
        workflow = {analyses: [], connections: []};
        updateAnalyses();
        updateConnections();
    }

    function addAnalysis(type) {
        var count,
            analysis = {x: 0, y: 0, name: type.name, inputs: type.inputs, outputs: type.outputs};
        analysis.inputScale = d3.scale.linear().domain([0, analysis.inputs.length - 1]).range([25, 125]);
        analysis.outputScale = d3.scale.linear().domain([0, analysis.outputs.length - 1]).range([25, 125]);
        count = 1;
        while (analysisMap[analysis.name] !== undefined) {
            analysis.name = type.name + " " + count;
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
        list.unshift("Select workflow");
        d3.select("#workflow").selectAll("option")
            .data(list).enter().append("option")
            .text(function (d) { return d; });
    });

    // Create new workflow
    d3.select("#new").on("click", function () {
        workflow = {analyses: [], connections: []};
        d3.json("workflow").post(JSON.stringify(workflow), function (error, id) {
            d3.select("#workflow").append("option").text(id);
            $("#workflow").val(id);
            updateAnalyses();
            updateConnections();
        });
    });

    // Save workflow
    d3.select("#save").on("click", function () {
        if ($("#workflow").val() === "Select workflow") {
            d3.json("workflow").post(JSON.stringify(serializeWorkflow(workflow)), function (error, id) {
                d3.select("#workflow").append("option").text(id);
                $("#workflow").val(id);
            });
        } else {
            d3.json("workflow/" + $("#workflow").val()).send("put", JSON.stringify(serializeWorkflow(workflow)), function (error, result) {
                console.log(result);
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
                        if (d === cur) {
                            d3.select(this).remove();
                        }
                    });
            });
        }
    });

    // Copy workflow
    d3.select("#copy").on("click", function () {
        d3.json("workflow").post(JSON.stringify(serializeWorkflow(workflow)), function (error, id) {
            d3.select("#workflow").append("option").text(id);
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