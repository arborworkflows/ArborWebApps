/*jslint browser: true, unparam: true */
/*globals d3, $ */

var workflow;
workflow = function (selection, details) {
    "use strict";

    var that,
        workflow,
        drag,
        dragPort,
        svg,
        vis,
        outputAnalysis,
        outputIndex,
        conn,
        analysisMap,
        stateScale,
        detailContent,
        dragConnection,
        dragPath,
        portOffset = 20,
        strokeColor = "#333";


    // Add properties to workflow to aid in interactive editing
    function prepare() {
        analysisMap = {};
        workflow.analyses.forEach(function (a) {
            a.inputScale = d3.scale.linear().domain([0, a.inputs.input.length - 1]).range([25, 75]);
            a.outputScale = d3.scale.linear().domain([0, a.outputs.output.length - 1]).range([25, 75]);
            analysisMap[a['@name']] = a;
        });
        workflow.connections.forEach(function (c) {
            c.outputAnalysis = analysisMap[c.outputAnalysis];
            c.outputPos = c.outputAnalysis.outputScale(c.outputIndex);
            c.inputAnalysis = analysisMap[c.inputAnalysis];
            c.inputPos = c.inputAnalysis.inputScale(c.inputIndex);
        });
    }

    // Update the SVG path for a connection
    function connectionPath(d) {
        var dist,
            delta,
            offset;
        delta = [d.outputAnalysis.x - d.inputAnalysis.x, d.outputAnalysis.y - d.inputAnalysis.y];
        dist = Math.sqrt(delta[0] * delta[0] + delta[1] * delta[1]);
        offset = 0.4 * dist - 50;
        offset = offset < 0 ? 0 : offset;
        return "M " + (d.outputAnalysis.x + 150 + portOffset) + " " + (d.outputAnalysis.y + d.outputPos)
            + " C " + (d.outputAnalysis.x + 150 + portOffset + offset) + " " + (d.outputAnalysis.y + d.outputPos)
            + " " + (d.inputAnalysis.x  - portOffset - offset) + " " + (d.inputAnalysis.y + d.inputPos)
            + " " + (d.inputAnalysis.x - portOffset) + " " + (d.inputAnalysis.y + d.inputPos);
    }

    function updateConnections() {
        function connectionKey(d) {
            return d.inputAnalysis['@name']
                + "$"
                + d.inputIndex
                + "$"
                + d.outputAnalysis['@name']
                + "$"
                + d.outputIndex;
        }
        conn.selectAll("path").data(workflow.connections, connectionKey).enter().append("path")
            .style("stroke", strokeColor)
            .style("stroke-width", 10)
            .style("fill", "none")
            .attr("d", connectionPath);
        conn.selectAll("path").data(workflow.connections, connectionKey).exit().remove();
    }

    function updateAnalysis(analysis) {

        function portShape(type, x, y) {
            if (type === "table") {
                return "M " + x + " " + y
                    + "m -10, -10"
                    + "l 20, 0"
                    + "l 0, 20"
                    + "l -20, 0"
                    + "Z";
            }
            if (type === "tree") {
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

        d3.select(this).selectAll("path.input-line")
            .data(analysis.inputs.input)
            .enter().append("path")
            .classed("input-line", true)
            .attr("d", function (d, i) { return "M 0 " + analysis.inputScale(i) + "l " + -portOffset + " 0"; })
            .style("stroke", strokeColor)
            .style("stroke-width", 2);

        d3.select(this).selectAll("path.output-line")
            .data(analysis.outputs.output)
            .enter().append("path")
            .classed("output-line", true)
            .attr("d", function (d, i) { return "M 150 " + analysis.outputScale(i) + "l " + portOffset + " 0"; })
            .style("stroke", strokeColor)
            .style("stroke-width", 2);

        d3.select(this).selectAll("path.input").data(analysis.inputs.input).enter().append("path")
            .classed("input", true)
            .attr("d", function (d, i) { return portShape(d.type, -portOffset, analysis.inputScale(i)); })
            .style("fill", "whitesmoke")
            .style("stroke", strokeColor)
            .style("stroke-width", 2)
            .on("mouseover", function (d) { d3.select(this).style("fill", "#428BCA"); })
            .on("mouseout", function (d) { d3.select(this).style("fill", "whitesmoke"); })
            .on("mouseup", function (d, i) {
                var existing;
                if (outputAnalysis !== undefined
                        && outputAnalysis.outputs.output[outputIndex].type === analysis.inputs.input[i].type) {

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

        d3.select(this).selectAll("path.output").data(analysis.outputs.output).enter().append("path")
            .classed("output", true)
            .attr("d", function (d, i) { return portShape(d.type, 150 + portOffset, analysis.outputScale(i)); })
            .style("fill", "#eee")
            .style("stroke", strokeColor)
            .style("stroke-width", 2)
            .on("mouseover", function (d) { d3.select(this).style("fill", "#428BCA"); })
            .on("mouseout", function (d) { d3.select(this).style("fill", "whitesmoke"); })
            .on("mousedown", function (o, i) {
                outputAnalysis = analysis;
                outputIndex = i;
                dragConnection = {
                    outputAnalysis: analysis,
                    outputPos: outputAnalysis.outputScale(i),
                    inputAnalysis: {x: analysis.x + 150 + portOffset + 20, y: analysis.y + analysis.outputScale(i)},
                    inputPos: 0
                };
                d3.event.stopPropagation();
            })
            .call(dragPort);
    }

    function updateAnalyses() {
        var g = vis.selectAll("g.analysis").data(workflow.analyses, function (d) { return d['@name']; })
            .enter().append("g")
            .classed("analysis", true);

        vis.selectAll("g.analysis").data(workflow.analyses, function (d) { return d['@name']; })
            .exit().remove();

        g.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; })
            .call(drag)
            .on("click", function (d) {
                var panelBody;

                detailContent.selectAll("*").remove();
                detailContent.append("div").classed("panel-heading", true)
                    .append("h3").classed("panel-title", true).text(d['@name']);
                panelBody = detailContent.append("div").classed("panel-body", true)
                    .style("height", "100%");
                panelBody.selectAll("div.param")
                    .data(d.parameters.parameter)
                    .enter().append("div")
                    .classed("param", true)
                    .each(function (p) {
                        var sel,
                            param = d3.select(this).append("div").classed("form-group", true),
                            paramId = "param-" + p['@name'];
                        param.append("label").attr("for", paramId).text(p['@name']);
                        if (p.type === "enum") {
                            sel = param.append("select")
                                .attr("id", paramId)
                                .classed("form-control", true);
                            sel.selectAll("option")
                                .data(p.options)
                                .enter().append("option")
                                .text(function (o) { return o; });
                            $(sel.node()).val(p.current);
                        } else {
                            param.append("input")
                                .attr("id", paramId)
                                .attr("type", "text")
                                .classed("form-control", true)
                                .attr("value", p.current);
                        }
                    });
                panelBody.append("div").append("button")
                    .classed("btn btn-primary", true)
                    .text("Update")
                    .on("click", function () {
                        detailContent.selectAll("div.param").each(function (p) {
                            if (p.type === "enum") {
                                p.current = $(this).find("select").val();
                            } else if (p.type === "int") {
                                p.current = Math.floor(+d3.select(this).select("input").property("value"));
                            } else if (p.type === "float") {
                                p.current = +d3.select(this).select("input").property("value");
                            } else if (p.type === "string") {
                                p.current = d3.select(this).select("input").property("value");
                            }
                        });
                    });
            });

        g.append("rect")
            .attr("width", 150)
            .attr("height", 100)
            .attr("rx", 10)
            .attr("ry", 10)
            .style("fill", "whitesmoke")
            .style("stroke", strokeColor)
            .style("stroke-width", 2);

        g.append("text")
            .attr("x", 75)
            .attr("y", 50)
            .style("fill", strokeColor)
            .style("text-anchor", "middle")
            .style("alignment-baseline", "central")
            .text(function (d) { return d['@name']; })
            .style("user-select", "none")
            .style("-webkit-user-select", "none")
            .style("pointer-events", "none");

        g.each(updateAnalysis);

        vis.selectAll("g.analysis").selectAll("rect")
            .style("fill", function (d) {
                return stateScale(d.state);
            });
    }

    that = {};

    that.clear = function () {
        workflow = {name: "New Workflow", analyses: [], connections: []};
        prepare();
        that.update();
    };

    that.add = function (a) {
        var count,
            analysis = {
                x: 200,
                y: 200,
                '@name': a['@name'],
                type: a.type,
                state: a.state,
                inputs: a.inputs,
                parameters: {parameter: []},
                outputs: a.outputs
            };
        a.parameters.parameter.forEach(function (param) {
            var p = {'@name': param['@name'], type: param.type, value: param.value, options: param.options};
            p.current = param.value;
            analysis.parameters.parameter.push(p);
        });
        analysis.inputScale = d3.scale.linear().domain([0, analysis.inputs.input.length - 1]).range([25, 75]);
        analysis.outputScale = d3.scale.linear().domain([0, analysis.outputs.output.length - 1]).range([25, 75]);
        count = 1;
        while (analysisMap[analysis['@name']] !== undefined) {
            analysis['@name'] = a['@name'] + " " + count;
            count += 1;
        }
        analysisMap[analysis['@name']] = analysis;
        workflow.analyses.push(analysis);
        updateAnalyses();
        return analysis;
    };

    that.data = function (d) {
        if (d === undefined) {
            return workflow;
        }
        workflow = d;
        prepare();
        that.update();
    };

    // Convert workflow to pure JSON (no references) for serialization
    that.serialize = function () {
        var serialized = {name: workflow.name, analyses: [], connections: []};
        workflow.analyses.forEach(function (analysis) {
            serialized.analyses.push({
                x: analysis.x,
                y: analysis.y,
                '@name': analysis['@name'],
                type: analysis.type,
                state: analysis.state,
                inputs: analysis.inputs,
                parameters: analysis.parameters,
                outputs: analysis.outputs
            });
        });
        workflow.connections.forEach(function (c) {
            serialized.connections.push({
                outputAnalysis: c.outputAnalysis['@name'],
                outputIndex: c.outputIndex,
                inputAnalysis: c.inputAnalysis['@name'],
                inputIndex: c.inputIndex
            });
        });
        return serialized;
    };

    that.update = function () {
        updateAnalyses();
        updateConnections();
    };

    stateScale = d3.scale.ordinal()
        .domain([undefined, "waiting", "running", "done"])
        .range(["whitesmoke", "whitesmoke", "#cdf", "#cfc"]);

    function zoom() {
        vis.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    // Create main SVG object
    svg = selection.append("svg").append("g");

    // Overlay to capture mouse events
    // Add zoom behavior a la http://bl.ocks.org/mbostock/3680999
    svg.append("rect")
        .attr("class", "overlay")
        .style("fill", "none")
        .style("pointer-events", "all")
        .attr("width", $(selection.node()).width())
        .attr("height", $(selection.node()).height())
        .call(d3.behavior.zoom().scaleExtent([0.25, 8]).on("zoom", zoom));

    // Vis group for everything else
    vis = svg.append("g");

    // Create group containing all connections
    conn = vis.append("g");

    // Create path for dragged path
    dragPath = vis.append("path")
        .style("stroke", strokeColor)
        .style("stroke-width", 10)
        .style("fill", "none");

    // Define behavior for dragging analysis "g" elements
    drag = d3.behavior.drag()
        .on("drag", function (d) {
            d.x += d3.event.dx;
            d.y += d3.event.dy;
            d3.select(this)
                .attr("transform", "translate(" + d.x + "," + d.y + ")");

            conn.selectAll("path")
                .attr("d", connectionPath);
        });

    // Define behavior for dragging output port elements
    dragPort = d3.behavior.drag()
        .on("dragstart", function (d) {
            dragPath.attr("visibility", "visible");
            dragPath.attr("d", connectionPath(dragConnection));
        })
        .on("drag", function (d) {
            dragConnection.inputAnalysis.x += d3.event.dx;
            dragConnection.inputAnalysis.y += d3.event.dy;
            dragPath.attr("d", connectionPath(dragConnection));
        })
        .on("dragend", function (d) {
            dragPath.attr("visibility", "hidden");
        });

    detailContent = details.append("div")
        .classed("panel", true)
        .classed("panel-default", true);

    detailContent.node().innerHTML =
        '<div class="panel-heading">'
        + '<h3 class="panel-title">Analysis Settings</h3>'
        + '</div>'
        + '<div class="panel-body"></div>';

    // Start with an empty workflow
    that.clear();

    return that;
};
