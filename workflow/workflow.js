/*jslint browser: true */
/*globals d3, console, $ */

window.onload = function () {
    "use strict";

    var workflow, drag, vis, outputItem, outputIndex, conn, itemMap, itemTypes;

    workflow = {
        items: [],
        connections: []
    };

    function prepareWorkflowForRuntime(workflow) {
        itemMap = {};
        workflow.items.forEach(function (item) {
            item.inputScale = d3.scale.linear().domain([0, item.inputs.length - 1]).range([25, 125]);
            item.outputScale = d3.scale.linear().domain([0, item.outputs.length - 1]).range([25, 125]);
            itemMap[item.name] = item;
        });
        workflow.connections.forEach(function (c) {
            c.outputItem = itemMap[c.outputItem];
            c.outputPos = c.outputItem.outputScale(c.outputIndex);
            c.inputItem = itemMap[c.inputItem];
            c.inputPos = c.inputItem.outputScale(c.inputIndex);
        });
    }

    function serializeWorkflow(workflow) {
        var serialized = {items: [], connections: []};
        workflow.items.forEach(function (item) {
            serialized.items.push({
                x: item.x,
                y: item.y,
                name: item.name,
                inputs: item.inputs,
                outputs: item.outputs
            });
        });
        workflow.connections.forEach(function (c) {
            serialized.connections.push({
                outputItem: c.outputItem.name,
                outputIndex: c.outputIndex,
                inputItem: c.inputItem.name,
                inputIndex: c.inputIndex
            });
        });
        return serialized;
    }

    prepareWorkflowForRuntime(workflow);

    d3.json("workflow").post(JSON.stringify({data: "This is some data"}), function (error, id) {
        d3.json("workflow/" + id, function (error, doc) {
            console.log(doc);
            d3.json("workflow/" + id).send("put", JSON.stringify({data: "This is some other data"}), function (error, doc) {
                d3.json("workflow/" + id, function (error, doc) {
                    console.log(doc);
                    d3.json("workflow/" + id).send("delete", "", function (error, result) {
                        console.log(result);
                        d3.json("workflow/" + id, function (error, doc) {
                            console.log(doc);
                            d3.json("workflow", function (error, list) {
                                console.log(list);
                            });
                        });
                    });
                });
            });
        });
    });

    function connectionPath(d) {
        var o = d.outputItem.outputs[d.outputIndex],
            i = d.inputItem.inputs[d.inputIndex],
            dist,
            delta,
            offset;
        delta = [d.outputItem.x - d.inputItem.x, d.outputItem.y - d.inputItem.y];
        dist = Math.sqrt(delta[0] * delta[0] + delta[1] * delta[1]);
        offset = 0.4 * dist - 50;
        offset = offset < 0 ? 0 : offset;
        return "M " + (d.outputItem.x + d.outputPos) + " " + (d.outputItem.y + 100)
            + " C " + (d.outputItem.x + d.outputPos) + " " + (d.outputItem.y + 100 + offset)
            + " " + (d.inputItem.x + d.inputPos) + " " + (d.inputItem.y - offset)
            + " " + (d.inputItem.x + d.inputPos) + " " + d.inputItem.y;
    }

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

    function updateConnections() {
        conn.selectAll("path").data(workflow.connections).enter().append("path")
            .style("stroke", "black")
            .style("stroke-width", 2)
            .style("fill", "none")
            .attr("d", connectionPath);
        conn.selectAll("path").data(workflow.connections).exit().remove();
    }

    function setupWorkflowItem(item) {
        d3.select(this).selectAll("circle.input").data(item.inputs).enter().append("circle")
            .classed("input", true)
            .attr("cx", function (o, i) { return item.inputScale(i); })
            .attr("cy", 0)
            .attr("r", 10)
            .style("fill", "#eee")
            .style("stroke", "black")
            .style("stroke-width", 2)
            .on("mouseover", function (d) { d3.select(this).style("fill", "orange"); })
            .on("mouseout", function (d) { d3.select(this).style("fill", "#eee"); })
            .on("mouseup", function (d, i) {
                if (outputItem !== undefined) {
                    workflow.connections.push({
                        outputItem: outputItem,
                        outputIndex: outputIndex,
                        outputPos: outputItem.outputScale(outputIndex),
                        inputItem: item,
                        inputIndex: i,
                        inputPos: item.inputScale(i)
                    });
                    updateConnections();
                    console.log("connect!");
                    outputItem = undefined;
                    outputIndex = undefined;
                }
            });

        d3.select(this).selectAll("circle.output").data(item.outputs).enter().append("circle")
            .classed("output", true)
            .attr("cx", function (o, i) { return item.outputScale(i); })
            .attr("cy", 100)
            .attr("r", 10)
            .style("fill", "#eee")
            .style("stroke", "black")
            .style("stroke-width", 2)
            .on("mouseover", function (d) { d3.select(this).style("fill", "orange"); })
            .on("mouseout", function (d) { d3.select(this).style("fill", "#eee"); })
            .on("mousedown", function (o, i) {
                outputItem = item;
                outputIndex = i;
                d3.event.stopPropagation();
            });
    }

    vis = d3.select("#main").append("svg");
    conn = vis.append("g");

    function updateItems() {
        var g = vis.selectAll("g.analysis").data(workflow.items, function (d) { return d.name; })
            .enter().append("g")
            .classed("analysis", true);

        vis.selectAll("g.analysis").data(workflow.items, function (d) { return d.name; })
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
        g.each(setupWorkflowItem);
    }

    updateItems();
    updateConnections();

    itemTypes = {
        source: {name: "Source", inputs: [], outputs: [1, 2, 3]},
        analysis: {name: "Analysis", inputs: [1, 2, 3, 4], outputs: [1, 2, 3]},
        sink: {name: "Sink", inputs: [1, 2, 3, 4], outputs: []},
    };

    function addItem(type) {
        var count,
            item = {x: 0, y: 0, name: type.name, inputs: type.inputs, outputs: type.outputs};
        item.inputScale = d3.scale.linear().domain([0, item.inputs.length - 1]).range([25, 125]);
        item.outputScale = d3.scale.linear().domain([0, item.outputs.length - 1]).range([25, 125]);
        count = 1;
        while (itemMap[item.name] !== undefined) {
            item.name = type.name + " " + count;
            count += 1;
        }
        itemMap[item.name] = item;
        workflow.items.push(item);
        updateItems();
    }

    d3.select("#add-source").on("click", function () { addItem(itemTypes.source); });
    d3.select("#add-analysis").on("click", function () { addItem(itemTypes.analysis); });
    d3.select("#add-sink").on("click", function () { addItem(itemTypes.sink); });
};