/*jslint browser: true, unparam: true, nomen: true */
var app = {key: null};

function stop_vtkweb() {
    "use strict";
    if (app.key) {
        tangelo.vtkweb.terminate(app.key);
        app.key = null;
    }
}

(function (tangelo, $) {
    "use strict";
    // When the page is closed, make sure to close any processes
    // that were running.
    window.onbeforeunload = window.onunload = stop_vtkweb;

    if (!($ && $.widget)) {
        return;
    }

    tangelo.widget("tangelo.treeHeatmap", {
        options: {
            table: null,
            tree: null,
        },

        _create: function () {
            this.div = $('<div id="viewport"></div>');
            this.element.append(this.div);
        },

        _update: function () {
            this.div.empty();

            var width = $(window).width(), height = $(window).height(),
                args = "--width " + width;
            args += " --height " + height;
            args += " --table " + this.options.table;
            args += " --tree " + this.options.tree;

            tangelo.vtkweb.launch({
                //url: "cone.py",
                url: "vtk_tree_heatmap.py",
                argstring: args,
                viewport: "#viewport",
                callback: function (key, error) {
                    if (error) {
                        console.warn("error!");
                        console.warn(error);
                        return;
                    }
                    app.key = key;
                }
            });
        }
    });
}(window.tangelo, window.jQuery));
