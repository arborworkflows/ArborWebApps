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
