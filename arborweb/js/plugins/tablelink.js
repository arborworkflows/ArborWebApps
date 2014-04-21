/*jslint browser: true, unparam: true */

(function ($, tangelo, vg) {
    "use strict";

    $.fn.tablelink = function (spec) {
        var nodes = [],
            nodeMap = {},
            source = tangelo.accessor({field: spec.source}),
            target = tangelo.accessor({field: spec.target}),
            that = this[0];

        spec.data.rows.forEach(function (link) {
            var s = source(link),
                t = target(link);
            if (!nodeMap[s]) {
                nodeMap[s] = {id: s};
                nodes.push(nodeMap[s]);
            }
            if (!nodeMap[t]) {
                nodeMap[t] = {id: t};
                nodes.push(nodeMap[t]);
            }
        });

        return $(that).nodelink({
            data: {nodes: nodes, links: spec.data.rows},
            nodeId: {field: "id"},
            linkSource: source,
            linkTarget: target
        });
    };

}(window.jQuery, window.tangelo, window.vg));
