/*jslint browser: true, nomen: true, unparam: true */
/*globals console */

(function (tangelo, $, d3) {
    "use strict";

    d3.json("/arborapi/projmgr/project/test/PhyloTree/anolis", function (error, collection) {
        var root, vis;

        root = tangelo.data.tree({
            data: collection,
            id: {field: "_id.$oid"},
            idChild: {field: "$oid"},
            children: {field: "clades"}
        });

        vis = tangelo.vis.dendrogram({
            data: root,
            el: d3.select("#main").node(),
            id: {field: "_id.$oid"},
            label: {field: "name"},
            distance: {field: "branch_length"}
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

        d3.select("#reset").on("click", function () {
            vis.reset();
        });

        d3.select("#pdf").on("click", function () {
            vis.download("pdf");
        });
    });

}(window.tangelo, window.$, window.d3));
