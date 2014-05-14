/*jslint browser: true, nomen: true */

(function (flow, $, _, ace, Backbone, Blob, d3, FileReader, girder, tangelo, URL) {
    "use strict";

   // The view for selecting, running, and editing analyses
    flow.AnalysisManagementView = Backbone.View.extend({
        formats: [
            'table:rows',
            'table:r.dataframe',
            'table:csv',
            'table:tsv',
            'table:vtktable.serialized',
            'tree:nested',
            'tree:newick',
            'tree:r.apetree',
            'tree:vtktree.serialized',
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
                    this.analysis.get('meta').analysis.inputs = this.inputVariables.toJSON();
                    this.analysis.get('meta').analysis.outputs = this.outputVariables.toJSON();
                    console.log(this.analysis.get('meta'));
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

            'click .add-input-variable': function () {
                var model = new Backbone.Model();
                this.inputVariableEditView.model = model;
                this.inputVariables.add(model);
                this.inputVariableEditView.render();
            },

            'click .add-output-variable': function () {
                var model = new Backbone.Model();
                this.outputVariableEditView.model = model;
                this.outputVariables.add(model);
                this.outputVariableEditView.render();
            },

            'click #analysis-new': function () {
                var analysis = {
                    name: $("#analysis-name").val(),
                    inputs: [],
                    outputs: [],
                    mode: "python",
                    script: ""
                };
                this.createAnalysis(analysis);
            },

            'click #analysis-download': function () {
                var blob = new Blob([JSON.stringify(this.analysis.get('meta').analysis, null, "    ")]),
                    filename = this.analysis.get('meta').analysis.name + '.json',
                    anchor = $('<a href="' + URL.createObjectURL(blob) + '" download="' + filename + '" class="hidden"></a>');
                anchor[0].click();
            },

            'change #analysis-files': function () {
                var files = $('#analysis-files')[0].files;
                _.each(files, function (file) {
                    this.upload(file);
                }, this);
            },

            'click #analysis-upload': function () {
                $('#analysis-files').click();
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
            this.editor.setFontSize(14);
            this.editor.renderer.$cursorLayer.element.style.opacity = 0;

            this.analyses = settings.analyses;
            this.analysesView = new flow.ItemsView({el: this.$('#analysis'), itemView: flow.ItemOptionView, collection: this.analyses});
            this.analysesView.render();

            this.inputVariables = new Backbone.Collection();
            this.outputVariables = new Backbone.Collection();
            this.inputVariableEditView = new flow.VariableEditView({el: $('#input-variable-edit-dialog'), input: true});
            this.inputVariablesView = new flow.VariablesView({
                el: this.$('.input-variables'),
                itemView: flow.VariableView,
                itemOptions: {editView: this.inputVariableEditView, collection: this.inputVariables},
                collection: this.inputVariables
            });
            this.outputVariableEditView = new flow.VariableEditView({el: $('#output-variable-edit-dialog'), input: false});
            this.outputVariablesView = new flow.VariablesView({
                el: this.$('.output-variables'),
                itemView: flow.VariableView,
                itemOptions: {editView: this.outputVariableEditView, collection: this.outputVariables},
                collection: this.outputVariables
            });

            // Once the first analysis is added, make it the active analysis
            this.analyses.on('add', _.bind(function (item) {
                if (!this.analysis) {
                    this.changeAnalysis(item);
                }
            }, this));

            flow.events.on('flow:change-save-location', this.saveLocationChange, this);
        },

        changeAnalysis: function (analysis) {
            var checkCanEdit = function () {
                if (!this.analysis.get('collection') || this.analysis.get('collection').get('_accessLevel') > 0) {
                    d3.select("#edit").classed("hidden", false);
                    d3.selectAll(".edit-controls").classed("hidden", !d3.select("#edit").classed("active"));
                }
            };

            if (this.analysis) {
                this.analysis.off('change:collection', null, this);
            }

            this.analysis = analysis;
            if (this.analysis) {
                this.editor.setValue(this.analysis.get('meta').analysis.script);
                this.editor.clearSelection();
                this.editor.getSession().setMode("ace/mode/" + this.analysis.get('meta').analysis.mode);
                this.inputVariables.set(this.analysis.get('meta').analysis.inputs);
                this.outputVariables.set(this.analysis.get('meta').analysis.outputs);
                this.$('#mode').val(this.analysis.get('meta').analysis.mode);

                this.analysis.on('change:collection', checkCanEdit, this);
                _.bind(checkCanEdit, this)();
            } else {
                this.editor.setValue('');
                this.inputVariables.set([]);
                this.outputVariables.set([]);
            }
        },

        upload: function (file) {
            var reader = new FileReader();

            reader.onload = _.bind(function (e) {
                this.createAnalysis(JSON.parse(e.target.result));
            }, this);

            reader.readAsText(file);
        },

        createAnalysis: function (analysis) {
            d3.json(girder.apiRoot + '/item/?name=' + encodeURIComponent(analysis.name) + '&folderId=' + flow.saveLocation.get('analysisFolder')).post(_.bind(function (error, result) {
                var analysisUri = girder.apiRoot + '/item/' + result._id;
                d3.json(analysisUri + '/metadata').send('put', JSON.stringify({analysis: analysis}), _.bind(function (error, result) {
                    var model = new Backbone.Model(result);
                    model.id = model.get('_id');
                    this.analyses.add(model);
                    $("#analysis").val(model.cid);
                    $("#analysis").change();
                    $("#analysis-name").val("");
                }, this));
            }, this));
        },

        saveLocationChange: function () {
            this.$('#new-analysis-form').toggleClass('hidden', flow.saveLocation === null);
        },

    });

}(window.flow, window.$, window._, window.ace, window.Backbone, window.Blob, window.d3, window.FileReader, window.girder, window.tangelo, window.URL));
