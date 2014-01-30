/*jslint browser: true, unparam: true */
/*globals d3, $ */

var workflow;
workflow = function (selection, details) {
    "use strict";

    var that,
        workflow,
        drag,
        vis,
        outputAnalysis,
        outputIndex,
        conn,
        analysisMap,
        stateScale,
        detailContent;


    // Add properties to workflow to aid in interactive editing
    function prepare() {
        analysisMap = {};
        workflow.analyses.forEach(function (a) {
            a.inputScale = d3.scale.linear().domain([0, a.inputs.input.length - 1]).range([25, 125]);
            a.outputScale = d3.scale.linear().domain([0, a.outputs.output.length - 1]).range([25, 125]);
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
        return "M " + (d.outputAnalysis.x + d.outputPos) + " " + (d.outputAnalysis.y + 100)
            + " C " + (d.outputAnalysis.x + d.outputPos) + " " + (d.outputAnalysis.y + 100 + offset)
            + " " + (d.inputAnalysis.x + d.inputPos) + " " + (d.inputAnalysis.y - offset)
            + " " + (d.inputAnalysis.x + d.inputPos) + " " + d.inputAnalysis.y;
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
            .style("stroke", "black")
            .style("stroke-width", 2)
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

        d3.select(this).selectAll("path.input").data(analysis.inputs.input).enter().append("path")
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
                //$(detail.node()).fadeIn(200);
            });

        g.append("rect")
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
            .text(function (d) { return d['@name']; })
            .style("user-select", "none")
            .style("-webkit-user-select", "none")
            .style("pointer-events", "none");
        g.append("image")
            .attr("x", 75 - 16)
            .attr("y", 40 - 16)
            .attr("width", 32)
            .attr("height", 32)
            .attr("xlink:href", "simple.png");

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
        //$(detail.node()).fadeOut(200);
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
        analysis.inputScale = d3.scale.linear().domain([0, analysis.inputs.input.length - 1]).range([25, 125]);
        analysis.outputScale = d3.scale.linear().domain([0, analysis.outputs.output.length - 1]).range([25, 125]);
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
        .range(["#ccc", "#ccc", "#cdf", "#cfc"]);

    // Create main SVG object
    vis = selection.append("svg").attr("width", "100%");

    // Create group containing all connections
    conn = vis.append("g");

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

    //detail = details.append("div")
        //.classed("dropdown", true)
        //.style("display", "none");
        //.style("position", "fixed")
        //.style("top", "100px")
        //.style("right", "400px");

    detailContent = details.append("div")
        .classed("panel", true)
        .classed("panel-default", true);

    detailContent.node().innerHTML =
        '<div class="panel-heading">'
        + '<h3 class="panel-title">Analysis Settings</h3>'
        + '</div>'
        + '<div class="panel-body"></div>';
        //.classed("dropdown-menu", true)
        //.style("display", "block")
        //.style("*width", "180px")
        //.append("li").append("div");
        //.classed("container", true);

    // Start with an empty workflow
    that.clear();

    return that;
};
