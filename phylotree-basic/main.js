/*jslint browser: true, nomen: true, unparam: true */

(function (tangelo, $, d3) {
    "use strict";

    var root, vis;

    root = tangelo.data.tree({
        data: [{_id: {$oid: 0}}],
        id: {field: "_id.$oid"},
        idChild: {field: "$oid"},
        children: {field: "clades"}
    });

    vis = tangelo.vis.dendrogram({
        data: root,
        el: d3.select("#vis").node(),
        id: {field: "_id.$oid"},
        label: {field: "name"},
        distance: {field: "branch_length"},
        nodeLimit: 1000
    });

    d3.select("#mode-hide").on("click", function () {
        vis.update({mode: "hide"});
    });

    d3.select("#mode-focus").on("click", function () {
        vis.update({mode: "focus"});
    });

    d3.select("#mode-label").on("click", function () {
        vis.update({mode: "label"});
    });

    d3.select("#distance-unit").on("click", function () {
        vis.update({distance: {value: 1}});
    });

    d3.select("#distance-branch-length").on("click", function () {
        vis.update({distance: {field: "branch_length"}});
    });

    d3.select("#node-limit-500").on("click", function () {
        vis.update({nodeLimit: 500});
    });

    d3.select("#node-limit-1000").on("click", function () {
        vis.update({nodeLimit: 1000});
    });

    d3.select("#node-limit-2000").on("click", function () {
        vis.update({nodeLimit: 2000});
    });

    d3.select("#reset").on("click", function () {
        vis.reset();
    });

    d3.select("#pdf").on("click", function () {
        vis.download("pdf");
    });

    d3.select("#upload").on("click", function () {
        var reader = new window.FileReader(),
            file = d3.select("#file").node().files[0];

        reader.onload = function (e) {
            var project = d3.select("#project").node(),
                projectName = project.options[project.selectedIndex].text,
                dataName = file.name,
                content = e.target.result;

            d3.json("/arborapi/projmgr/project/" + projectName + "?filename=" + dataName + "&filetype=newick&datasetname=" + dataName + "&data=" + content)
                .send("put", content, function (error, data) {
                    initializeDataSelection(projectName, dataName);
                });
        };
        reader.readAsText(file);
    });

    function performEvent(element, name) {
        if (document.createEvent !== undefined) {
            var evt = document.createEvent("HTMLEvents");
            evt.initEvent(name, false, true);
            element.dispatchEvent(evt);
        } else {
            element.fireEvent("on" + name);
        }
    }

    function initializeDataSelection(initialProject, initialData) {
        var project = d3.select("#project").node(),
            data = d3.select("#data").node(),
            i;

        d3.json("/arborapi/projmgr/project", function (error, projects) {
            d3.select("#project").selectAll("option").remove();
            d3.select("#project").selectAll("option")
                .data(projects)
                .enter().append("option")
                .text(function (d) { return d; });
            d3.select("#project").on("change", function () {
                var project = d3.select("#project").node(),
                    projectName = project.options[project.selectedIndex].text;
                d3.json("/arborapi/projmgr/project/" + projectName + "/PhyloTree", function (error, datasets) {
                    d3.select("#data").selectAll("option").remove();
                    d3.select("#data").selectAll("option")
                        .data(datasets)
                        .enter().append("option")
                        .text(function (d) { return d; });
                    d3.select("#data").on("change", function () {
                        var projectName = project.options[project.selectedIndex].text,
                            dataName = data.options[data.selectedIndex].text;
                        d3.json("/arborapi/projmgr/project/" + projectName + "/PhyloTree/" + dataName, function (error, collection) {
                            root = tangelo.data.tree({
                                data: collection,
                                id: {field: "_id.$oid"},
                                idChild: {field: "$oid"},
                                children: {field: "clades"}
                            });

                            vis.update({data: root});
                        });
                    });
                });
            });
            for (i = 0; i < project.options.length; i += 1) {
                if (project.options[i].text === initialProject) {
                    project.selectedIndex = i;
                }
            }
            performEvent(project, "change");
            for (i = 0; i < data.options.length; i += 1) {
                if (data.options[i].text === initialData) {
                    data.selectedIndex = i;
                }
            }
            performEvent(data, "change");
        });
    }

    initializeDataSelection("other");

}(window.tangelo, window.$, window.d3));
