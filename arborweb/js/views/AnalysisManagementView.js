/*jslint browser: true, nomen: true */

(function (flow, $, _, ace, Backbone, Blob, d3, girder, tangelo, URL) {
    "use strict";

   // The view for selecting, running, and editing analyses
    flow.AnalysisManagementView = Backbone.View.extend({
        formats: [
            'table:rows',
            'table:r.dataframe',
            'table:csv',
            'tree:nested',
            'tree:r.apetree',
            'string:text',
            'number:number',
            'image:png.base64',
            'r:object'
        ],

        events: {
            'click #show-script': function () {
                var hide = d3.select("#show-script").classed("active");
                flow.setDisplay(hide ? "vis" : "editor");
                this.editor.resize();
                d3.select("#show-script-icon").classed("glyphicon-eye-open", hide);
                d3.select("#show-script-icon").classed("glyphicon-eye-close", !hide);
                d3.select("#show-script-text").text(hide ? "Show script" : "Hide script");
                if (this.analysis.get('collection').get('_accessLevel') > 0) {
                    d3.select("#edit").classed("hidden", hide);
                    d3.selectAll(".edit-controls").classed("hidden", !d3.select("#edit").classed("active") || hide);
                }
            },

            'click #edit': function () {
                var edit = d3.select("#edit").classed("active");
                this.editor.setReadOnly(edit);
                this.editor.renderer.$cursorLayer.element.style.opacity = edit ? 0 : 1;
                d3.selectAll(".edit-controls").classed("hidden", edit);
            },

            'change #mode': function () {
                if (this.analysis) {
                    this.analysis.get('meta').analysis.mode = $("#mode").val();
                    this.editor.getSession().setMode("ace/mode/" + this.analysis.get('meta').analysis.mode);
                }
            },

            'click #save': function () {
                if (this.analysis) {
                    this.analysis.get('meta').analysis.script = this.editor.getValue();
                    d3.json(girder.apiRoot + '/item/' + this.analysis.id + '/metadata').send('put', JSON.stringify(this.analysis.get('meta')), function () {
                        // Trigger recreating the analysis UI
                        $("#analysis").change();
                    });
                }
            },

            'change #analysis': function () {
                this.changeAnalysis(this.analyses.get($("#analysis").val()));
            },

            'click #setup': function () {
                if (this.analysis) {
                    this.analysisSetupView.model = this.analysis;
                    this.analysisSetupView.render();
                }
            },

            'click #analysis-new': function () {
                var meta = {
                    analysis: {
                        name: $("#analysis-name").val(),
                        inputs: [],
                        outputs: [],
                        mode: "python",
                        script: ""
                    }
                };
                d3.json(girder.apiRoot + '/item/?name=' + encodeURIComponent(meta.analysis.name) + '&folderId=' + flow.saveLocation.get('analysisFolder')).post(_.bind(function (error, result) {
                    var analysisUri = girder.apiRoot + '/item/' + result._id;
                    d3.json(analysisUri + '/metadata').send('put', JSON.stringify(meta), _.bind(function (error, result) {
                        var model = new Backbone.Model(result);
                        model.id = model.get('_id');
                        this.analyses.add(model);
                        $("#analysis").val(model.cid);
                        $("#analysis").change();
                        $("#analysis-name").val("");
                    }, this));
                }, this));
            },

            'click #analysis-download': function () {
                var blob = new Blob([JSON.stringify(this.analysis.get('meta').analysis, null, "    ")]),
                    filename = this.analysis.get('meta').analysis.name + '.json',
                    anchor = $('<a href="' + URL.createObjectURL(blob) + '" download="' + filename + '" class="hidden"></a>');
                anchor[0].click();
            }

        },

        initialize: function (settings) {
            this.analysis = null;
            this.datasets = settings.datasets;
            this.analysisSetupView = new flow.AnalysisSetupView({
                el: $('#analysis-setup-dialog'),
                model: this.analysis,
                datasets: this.datasets
            });

            this.editor = ace.edit("editor");
            this.editor.setTheme("ace/theme/chrome");
            this.editor.setHighlightActiveLine(false);
            this.editor.setHighlightGutterLine(false);
            this.editor.setShowPrintMargin(false);
            this.editor.setReadOnly(true);
            this.editor.renderer.$cursorLayer.element.style.opacity = 0;

            this.analyses = settings.analyses;
            this.analysesView = new flow.ItemsView({el: this.$('#analysis'), itemView: flow.ItemOptionView, collection: this.analyses});
            this.analysesView.render();

            // Once the first analysis is added, make it the active analysis
            this.analyses.on('add', _.bind(function (item) {
                if (!this.analysis) {
                    this.changeAnalysis(item);
                }
            }, this));

            flow.events.on('flow:change-save-location', this.saveLocationChange, this);
        },

        changeAnalysis: function (analysis) {
            this.analysis = analysis;
            if (this.analysis) {
                this.editor.setValue(this.analysis.get('meta').analysis.script);
                this.editor.clearSelection();
                this.editor.getSession().setMode("ace/mode/" + this.analysis.get('meta').analysis.mode);
                this.setupVariableEditor('input-edit-', this.analysis.get('meta').analysis.inputs);
                this.setupVariableEditor('output-edit-', this.analysis.get('meta').analysis.outputs);
                this.$('#mode').val(this.analysis.get('meta').analysis.mode);
            } else {
                this.editor.setValue('');
                this.setupVariableEditor('input-edit-', []);
            }
        },

        saveLocationChange: function () {
            this.$('#new-analysis-form').toggleClass('hidden', flow.saveLocation === null);
        },

        setupVariableEditor: function(idPrefix, parameters) {
            var add = $("#" + idPrefix + "add"),
                name = $("#" + idPrefix + "name"),
                remove = $("#" + idPrefix + "remove"),
                format = $("#" + idPrefix + "format"),
                domain = $("#" + idPrefix + "domain"),
                select = $("#" + idPrefix + "select"),
                defaultValue = $("#" + idPrefix + "default"),
                parameterMap = {};

            parameters.forEach(function (d) {
                parameterMap[d.name] = d;
            });

            d3.select(format.get(0)).selectAll("option")
                .data(this.formats, function (d) { return d; })
                .enter().append("option")
                .text(function (d) { return d; })
                .attr("value", function (d) { return d; });

            function update() {
                var options = d3.select(select.get(0)).selectAll("option")
                    .data(parameters, function (d) { return d.name; });
                options.enter().append("option")
                    .text(function (d) { return d.name; })
                    .attr("value", function (d) { return d.name; });
                options.exit().remove();
            }

            add.off("click");
            add.click(function () {
                var param = {name: name.val(), type: "table", format: "rows"};
                parameters.push(param);
                parameterMap[param.name] = param;
                update();
                select.val(param.name);
                select.change();
                name.val("");
            });

            select.off("change");
            select.change(function () {
                var param = parameterMap[select.val()];
                if (param) {
                    format.val(param.type + ":" + param.format);
                    format.change();
                    if (param.domain) {
                        if (tangelo.isArray(param.domain)) {
                            domain.val(param.domain.join(","));
                        } else {
                            domain.val(JSON.stringify(param.domain));
                        }
                    } else {
                        domain.val("");
                    }
                    if (defaultValue && param["default"]) {
                        defaultValue.val(param["default"].data);
                    } else {
                        defaultValue.val("");
                    }
                }
            });

            format.off("change");
            format.change(function () {
                var param = parameterMap[select.val()],
                    parts = format.val().split(":");
                if (param) {
                    param.type = parts[0];
                    param.format = parts[1];
                }
                d3.select(domain.get(0)).classed("hidden", format.val() !== "string:text");
            });

            domain.off("focusout");
            domain.focusout(function () {
                var param = parameterMap[select.val()];
                if (param) {
                    if (domain.val() !== "") {
                        if (domain.val()[0] === "{") {
                            param.domain = JSON.parse(domain.val());
                        } else {
                            param.domain = domain.val().split(",");
                        }
                    } else {
                        delete param.domain;
                    }
                }
            });

            remove.off("click");
            remove.click(function () {
                var param = parameterMap[select.val()], index;
                if (param) {
                    index = parameters.indexOf(param);
                    parameters.splice(index, 1);
                    delete parameterMap[param.name];
                    update();
                    select.change();
                }
            });

            if (defaultValue) {
                defaultValue.remove("focusout");
                defaultValue.focusout(function () {
                    var param = parameterMap[select.val()];
                    if (param) {
                        if (defaultValue.val() !== "") {
                            if (param.type === "string") {
                                param['default'] = {format: "text", data: defaultValue.val()};
                            } else if (param.type === "number") {
                                param['default'] = {format: "number", data: parseFloat(defaultValue.val())};
                            }
                        } else {
                            delete param['default'];
                        }
                    }
                });
            }

            d3.select(select.get(0)).selectAll("option").remove();
            update();
            select.change();
        }
    });

}(window.flow, window.$, window._, window.ace, window.Backbone, window.Blob, window.d3, window.girder, window.tangelo, window.URL));
