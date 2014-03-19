/*jslint browser: true, unparam: true, nomen: true */
/*globals $, ace, d3 */

$(function () {
    "use strict";

    var editor;

    function initialize() {
        $("#control-panel").controlPanel();

        editor = ace.edit("editor");
        editor.setTheme("ace/theme/chrome");
        editor.setHighlightActiveLine(false);
        editor.setHighlightGutterLine(false);
        editor.setShowPrintMargin(false);
        editor.setReadOnly(true);
        editor.renderer.$cursorLayer.element.style.opacity = 0;

        d3.select("#show-script").on("click", function () {
            var hide = d3.select("#show-script").classed("active");
            // d3.select("#intro").classed("hidden", !hide);
            d3.select("#editor").classed("hidden", hide);
            editor.resize();
            d3.select("#show-script-icon").classed("glyphicon-eye-open", hide);
            d3.select("#show-script-icon").classed("glyphicon-eye-close", !hide);
            d3.select("#show-script-text").text(hide ? "Show script" : "Hide script");
            // if (analysis.collection._accessLevel > 0) {
            //     d3.select("#edit").classed("hidden", hide);
            //     d3.selectAll(".edit-controls").classed("hidden", !d3.select("#edit").classed("active") || hide);
            // }
        });
    }

    initialize();
});
