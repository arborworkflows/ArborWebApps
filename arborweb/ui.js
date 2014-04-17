/*jslint browser: true, unparam: true, nomen: true, sloppy: true */
/*globals _, ace, atob, Backbone, Blob, d3, $, flow, girder, girderUpload, FileReader, console, tangelo, Uint8Array, URL */

$.fn.image = function (options) {
    "use strict";
    var data = options.data;
    if (options.data.indexOf("data:image/png;base64,") !== 0) {
        data = "data:image/png;base64," + options.data;
    }
    d3.select(this.get(0)).append("img")
        .attr("src", data);
};

$(document).ready(function () {
    "use strict";

    var flow = {
        events: _.clone(Backbone.Events),
        saveLocation: null,
        extensionToType: {
            phy: {type: 'tree', format: 'newick'},
            csv: {type: 'table', format: 'csv'},
            png: {type: 'image', format: 'png'},
            rds: {type: 'r', format: 'serialized'}
        }
    };

    flow.setDisplay = function setDisplay(mode) {
        ["intro", "vis", "editor"].forEach(function (d) {
            d3.select("#" + d).classed("hidden", mode !== d);
        });
    };

    // Converts a dataset (either a Girder-backed dataset or dataset
    // stored in the browser) into another format and returns the result
    // to the done function.
    flow.retrieveDatasetAsFormat = function(dataset, type, format, dataIsURI, done) {
        var uri,
            byteCharacters,
            byteNumbers,
            byteArray,
            i;
        if (dataIsURI) {
            dataset.set({data: girder.apiRoot + '/item/' + dataset.id + '/romanesco/' + type + '/' +
                dataset.format + '/' + format});
            if (girder.currentUser) {
                dataset.set({data: dataset.get('data') + '?token=' + girder.currentUser.get('token')});
            }
            done(null, dataset);
            return;
        }
        if (dataset.has('data')) {
            if (dataset.get('format') === format) {
                done(null, dataset);
                return;
            }
            if (dataset.get('type') === 'table' && dataset.get('format') === 'rows') {
                dataset = new Backbone.Model({type: 'table', format: 'rows.json', data: JSON.stringify(dataset.get('data'))});
            }
            if (dataset.get('type') === 'tree' && dataset.get('format') === 'nested') {
                dataset = new Backbone.Model({type: 'tree', format: 'nested.json', data: JSON.stringify(dataset.get('data'))});
            }
            if (dataset.get('format') === format) {
                done(null, dataset);
                return;
            }
            if (dataset.get('type') === 'image' && dataset.get('format') === 'png.base64' && format === 'png') {
                byteCharacters = atob(dataset.get('data'));
                byteNumbers = [];
                byteNumbers.length = byteCharacters.length;
                for (i = 0; i < byteCharacters.length; i += 1) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                byteArray = new Uint8Array(byteNumbers);
                done(null, new Backbone.Model({type: 'image', format: 'png', data: byteArray}));
                return;
            }
            uri = girder.apiRoot + '/item/romanesco/' + type + '/' + dataset.get('format') + '/' + format;
            d3.json(uri).post(dataset.get('data'), function (error, converted) {
                done(error, new Backbone.Model(converted));
            });
        } else {
            uri = girder.apiRoot + '/item/' + dataset.id + '/romanesco/' + type + '/' + dataset.get('format') + '/' + format;
            d3.json(uri, function (error, converted) {
                done(error, new Backbone.Model(converted));
            });
        }
    };

    // Generic view of a collection that creates and manages
    // views for items based on the constructor passed as itemView.
    // An optional filter sets key/value pairs that must be matched
    // in models in the collection for it to be displayed in the
    // view, which is useful for example in selecting all datasets
    // of a certain type. The itemOptions option specifies additional
    // constructor options to be passed to generated itemView views.
    flow.ItemsView = Backbone.View.extend({
        initialize: function (options) {
            this.filter = options.filter;
            this.listenTo(this.collection, 'add', this.add);
            this.listenTo(this.collection, 'remove', this.remove);
            this.itemViews = {};
            this.itemView = options.itemView;
            this.itemOptions = options.itemOptions;
            this.collection.forEach(_.bind(this.add, this));
        },

        matches: function (item) {
            var match = true;
            _.each(this.filter, function (value, key) {
                if (value !== item.get(key)) {
                    match = false;
                }
            });
            return match;
        },

        add: function (item) {
            if (this.matches(item)) {
                var view = new this.itemView(_.extend({model: item}, this.itemOptions));
                this.$el.append(view.render().$el);
                this.itemViews[item.cid] = view;
            }
        },

        remove: function (item) {
            if (this.itemViews[item.cid]) {
                this.itemViews[item.cid].$el.remove();
                delete this.itemViews[item.cid];
            }
        }
    });

    // View for displaying the set of collections and enabling
    // setting active collections and the save location
    flow.CollectionsView = flow.ItemsView.extend({
        add: function (item) {
            item.set('active', false);
            item.set('saveLocation', false);
            item.on('change:active', function () {
                this.trigger('flow:change-active', item);
            }, this);
            flow.ItemsView.prototype.add.apply(this, arguments);
        }
    });

    // View for displaying a collection that enables
    // setting it as active and/or the save location
    // for analyses and datasets
    flow.CollectionView = Backbone.View.extend({
        tagName: 'li',
        className: 'list-group-item',

        events: {
            'click .save-location': function () {
                if (this.model.get('_accessLevel') > 0) {
                    if (flow.saveLocation) {
                        flow.saveLocation.set({saveLocation: false});
                    }
                    flow.saveLocation = this.model;
                    flow.events.trigger('flow:change-save-location');
                    this.model.set({active: true, saveLocation: true});
                }
            },
            'click .active-state': function () {
                this.model.set({active: !this.model.get('active')});
                if (!this.model.get('active')) {
                    this.model.set({saveLocation: false});
                    flow.saveLocation = null;
                    flow.events.trigger('flow:change-save-location');
                    d3.select("#new-analysis-form").classed("hidden", true);
                    d3.select("#dataset-save").classed("hidden", true);
                }
            }
        },

        initialize: function () {
            this.model.on('change', this.render, this);
        },

        render: function () {
            this.$el.html($('#collection-template').html());
            this.$('.active-state').toggleClass('disabled-icon', !this.model.get('active'));
            this.$('.save-location').toggleClass('disabled-icon', !this.model.get('saveLocation'));
            this.$('.save-location').toggleClass('hidden', this.model.get('_accessLevel') <= 0);
            this.$('.name').text(this.model.get('name'));
            return this;
        }
    });

    // The view for managing data saving and downloading
    flow.DatasetManagementView = Backbone.View.extend({
        saveFormats: {
            table: ['csv', 'rows.json'],
            tree: ['nested.json', 'nexus', 'newick'],
            image: ['png'],
            r: ['serialized']
        },

        extensions: {
            "table:csv": "csv",
            "table:rows.json": "rows-json",
            "tree:nested.json": "nested-json",
            "tree:nexus": "nex",
            "tree:newick": "phy",
            "image:png": "png",
            "r:serialized": "rds"
        },

        events: {
            'change .datasets': 'updateDataset',

            'click .dataset-save': function () {
                var name = this.$('.dataset-name').val(),
                    format = this.$('.dataset-format-select').val(),
                    dataset = this.datasets.get(this.$('.datasets').val());
                flow.retrieveDatasetAsFormat(dataset, dataset.get('type'), format, false, _.bind(function (error, converted) {
                    var blob = new Blob([converted.get('data')]),
                        extension = this.extensions[dataset.get('type') + ":" + format],
                        parts = name.split('.'),
                        nameWithExtension = parts[parts.length - 1] === extension ? name : name + '.' + extension;
                    girderUpload(blob, nameWithExtension, flow.saveLocation.get('dataFolder'));
                }, this));
            },

            'click .dataset-download': function () {
                var name = this.$('.dataset-name').val(),
                    format = this.$('.dataset-format-select').val(),
                    dataset = this.datasets.get(this.$('.datasets').val());
                flow.retrieveDatasetAsFormat(dataset, dataset.get('type'), format, false, _.bind(function (error, converted) {
                    var blob = new Blob([converted.get('data')]),
                        extension = this.extensions[dataset.get('type') + ":" + format],
                        parts = name.split('.'),
                        nameWithExtension = parts[parts.length - 1] === extension ? name : name + '.' + extension,
                        anchor = $('<a href="' + URL.createObjectURL(blob) + '" download="' + nameWithExtension + '" class="hidden"></a>');
                    anchor[0].click();
                }, this));
            },

            'change #g-files': function (e) {
                var files = $('#g-files')[0].files;
                $.each(files, _.bind(function (i, file) {
                    this.upload(file);
                }, this));
            },

            'click #upload': function (e) {
                $('#g-files').click();
            },

            'dragenter #upload': function (e) {
                e.stopPropagation();
                e.preventDefault();
                e.originalEvent.dataTransfer.dropEffect = 'copy';
                d3.select('#upload')
                    .classed('btn-success', true)
                    .classed('btn-primary', false)
                    .html('<i class="glyphicon glyphicon-upload"></i> Drop files here');
            },

            'dragleave #upload': function (e) {
                e.stopPropagation();
                e.preventDefault();
                d3.select('#upload')
                    .classed('btn-success', false)
                    .classed('btn-primary', true)
                    .html('<i class="glyphicon glyphicon-file"/></i> Browse or drop files');
            },

            'dragover #upload': function (e) {
                e.preventDefault();
            },

            'drop #upload': function (e) {
                var files = e.originalEvent.dataTransfer.files;
                e.stopPropagation();
                e.preventDefault();
                d3.select('#upload')
                    .classed('btn-success', false)
                    .classed('btn-primary', true)
                    .html('<i class="glyphicon glyphicon-file"></i> Browse or drop files');
                $.each(files, _.bind(function (i, file) {
                    this.upload(file);
                }, this));
            }
        },

        initialize: function (settings) {
            this.datasets = settings.datasets;
            this.datasetsView = new flow.ItemsView({el: this.$('.datasets'), itemView: flow.ItemOptionView, collection: this.datasets});
            this.datasetsView.render();
            flow.events.on('flow:change-save-location', this.saveLocationChange, this);
            this.saveLocationChange();

            // Once the first dataset is added, make it the active dataset
            this.datasets.on('add', _.bind(function (item) {
                if (!this.dataset) {
                    this.updateDataset();
                }
            }, this));
        },

        upload: function (file) {
            var reader = new FileReader();

            reader.onload = _.bind(function (e) {
                var dataset = {
                        name: file.name,
                        data: e.target.result
                    },
                    extension = file.name.split('.');

                extension = extension[extension.length - 1];
                _.extend(dataset, flow.extensionToType[extension]);
                dataset = new Backbone.Model(dataset);
                console.log(dataset);

                this.datasets.add(dataset);
            }, this);

            reader.readAsText(file);
        },

        updateDataset: function () {
            var options, valid;
            this.dataset = this.datasets.get(this.$('.datasets').val());

            // If we don't know the format, don't let them download it
            valid = this.dataset.get('type') !== undefined && this.dataset.get('format') !== undefined;
            this.$('.dataset-save-form').toggleClass('hidden', !valid);

            if (valid) {
                this.$('.dataset-name').val(this.dataset.get('name'));
                options = d3.select('.dataset-format-select').selectAll('option')
                    .data(this.saveFormats[this.dataset.get('type')], function (d) { return d; });
                options.enter().append('option')
                    .text(function (d) { return d; })
                    .attr('value', function (d) { return d; });
                options.exit().remove();
            }
        },

        saveLocationChange: function () {
            this.$('.dataset-save').toggleClass('hidden', flow.saveLocation === null);
        }
    });

    // The view for a setting a single input to an analysis or
    // visualization based on its type
    flow.InputView = Backbone.View.extend({
        typeMetadata: {
            table: {dataset: true},
            tree: {dataset: true},
            image: {dataset: true},
            r: {dataset: true},
            string: {dataset: false},
            number: {dataset: false},
            json: {dataset: false}
        },

        initialize: function (settings) {
            var div;

            this.datasets = settings.datasets;
            this.idPrefix = settings.idPrefix;

            div = d3.select(this.el).append('div')
                .classed('form-group', true);
            div.append('label')
                .attr('for', this.idPrefix + this.model.get('name'))
                .text(this.model.get('name'));
            if (this.typeMetadata[this.model.get('type')].dataset) {
                this.view = new flow.ItemsView({
                    el: $('<select class="form-control"/>').appendTo(div.node()),
                    collection: this.datasets,
                    itemView: flow.ItemOptionView,
                    filter: {type: this.model.get('type')}
                });
            } else {
                if (this.model.get('domain')) {
                    if (tangelo.isArray(this.model.get('domain'))) {
                        this.domainArray = new Backbone.Collection(this.model.get('domain'));
                    } else {
                        this.domainArray = new Backbone.Collection([]);
                    }
                    this.view = new flow.ItemsView({
                        el: $('<select class="form-control"/>').appendTo(div.node()),
                        collection: this.domainArray,
                        itemView: flow.StringOptionView
                    });
                    if (this.model.get('default')) {
                        this.view.$el.val(this.model.get('default').data);
                    }
                } else {
                    this.view = div.append('input')
                        .classed('form-control', true)
                        .attr('type', 'text')
                        .attr('id', this.idPrefix + this.model.get('name'));
                    this.view = $(this.view.node());
                    if (this.model.get('default')) {
                        if (this.model.get('type') === 'json' && this.model.get('default').format === 'inline') {
                            this.view.val(JSON.stringify(this.model.get('default').data));
                        } else {
                            this.view.val(this.model.get('default').data);
                        }
                    }
                }
            }
        },

        render: function () {
            return this;
        }
    });

    // The view representing the form for a set of inputs to populate
    // for an analysis or visualization
    flow.InputsView = flow.ItemsView.extend({
        initialize: function (settings) {
            this.datasets = settings.datasets;
            flow.ItemsView.prototype.initialize.apply(this, [_.extend(settings, {itemView: flow.InputView, itemOptions: {datasets: this.datasets}})]);
        },

        render: function () {
            // For fancy domains such as column names, we need changes in an input dataset
            // dropdown to trigger pulling the data in a certain format (like column headers)
            // as the domain of another input
            this.collection.forEach(_.bind(function (input) {
                var view, referredInput;
                if (input.get('type') === 'string' || input.get('type') === 'number' || input.get('type') === 'json') {
                    if (input.get('domain') && tangelo.isObject(input.get('domain'))) {
                        referredInput = this.collection.findWhere({name: input.get('domain').input});
                        view = this.itemViews[referredInput.cid];
                        view.$el.change(_.bind(function () {
                            var dataset = this.datasets.get(view.view.$el.val());
                            flow.retrieveDatasetAsFormat(dataset, view.model.get('type'), input.get('domain').format, false, _.bind(function (error, dataset) {
                                dataset.get('data').sort();
                                this.itemViews[input.cid].view.collection.set(dataset.get('data'));
                            }, this));
                        }, this));
                    }
                }
            }, this));

            // Trigger a change event on each dataset dropdown so dependent inputs
            // can be initially populated
            this.collection.forEach(_.bind(function (input) {
                if (input.get('type') === 'table' || input.get('type') === 'tree' || input.get('type') === 'image' || input.get('type') === 'r') {
                    this.itemViews[input.cid].$el.change();
                }
            }, this));
        }
    });

    flow.AnalysisSetupView = Backbone.View.extend({
        el: $('#analysis-setup-dialog'),

        webFormat: {
            table: 'rows',
            tree: 'nested',
            string: 'text',
            number: 'number',
            image: 'png.base64',
            r: 'serialized'
        },

        events: {
            'click .run': function () {
                var bindings = {'inputs': {}, 'outputs': {}};

                d3.select('.run')
                    .classed('btn-primary', false)
                    .classed('btn-default', true)
                    .attr('disabled', true);

                _.each(this.inputsView.itemViews, _.bind(function (inputView) {
                    var input = inputView.model,

                        // Sometimes the view is a Backbone view, sometimes it is a plain control
                        value = inputView.view.$el ? inputView.view.$el.val() : inputView.view.val(),
                        dataset,
                        uri;

                    if (input.get('type') === 'table' || input.get('type') === 'tree' || input.get('type') === 'image' || input.get('type') === 'r') {
                        dataset = this.datasets.get(value);
                        uri = window.location.origin + girder.apiRoot + '/item/' + dataset.id + '/download';
                        if (girder.currentUser) {
                            dataset.uri += '?token=' + girder.currentUser.get('token');
                        }
                        bindings.inputs[input.get('name')] = _.extend(dataset.toJSON(), {uri: uri});
                    } else if (input.get('type') === 'string') {
                        bindings.inputs[input.get('name')] = {type: input.get('type'), format: 'text', data: value};
                    } else if (input.get('type') === 'number') {
                        bindings.inputs[input.get('name')] = {type: input.get('type'), format: 'number', data: parseFloat(value)};
                    }
                }, this));
                this.model.get('meta').analysis.outputs.forEach(_.bind(function (output) {
                    bindings.outputs[output.name] = {type: output.type, format: this.webFormat[output.type]};
                }, this));
                this.taskBindings = bindings;
                d3.select('.success-message').classed('hidden', true);
                d3.select('.error-message').classed('hidden', true);
                d3.select('.info-message').classed('hidden', false).text('Running analysis ...');
                d3.json(girder.apiRoot + '/item/' + this.model.id + '/romanesco').post(JSON.stringify(bindings), _.bind(function (error, result) {
                    this.taskId = result.id;
                    setTimeout(_.bind(this.checkTaskResult, this), 1000);
                }, this));
            }
        },

        initialize: function(settings) {
            this.datasets = settings.datasets;
            this.inputsView = new flow.InputsView({
                collection: new Backbone.Collection(),
                idPrefix: 'input-',
                el: this.$('.inputs'),
                datasets: this.datasets
            });
        },

        render: function () {
            this.inputsView.collection.set(this.model.get('meta').analysis.inputs);
            this.inputsView.render();
            this.$('.analysis-setup-title').text(this.model.get('meta').analysis.name);
            this.$('.success-message').addClass('hidden');
            this.$('.info-message').addClass('hidden');
            this.$('.error-message').addClass('hidden');
            this.$el.modal('show');
            return this;
        },

        checkTaskResult: function () {
            d3.json(girder.apiRoot + '/item/' + this.model.id + '/romanesco/' + this.taskId + '/status', _.bind(function (error, result) {
                console.log(result.status);
                if (result.status === 'SUCCESS') {
                    d3.json(girder.apiRoot + '/item/' + this.model.id + '/romanesco/' + this.taskId + '/result', _.bind(function (error, data) {
                        var result = data.result;
                        // Put data into list
                        $.each(result, _.bind(function (outputName, output) {
                            var index = 1;
                            output = new Backbone.Model(output);
                            output.set({name: this.model.get('name') + ' ' + outputName});
                            while (this.datasets.findWhere({name: output.get('name')})) {
                                output.set({name: this.model.get('name') + ' ' + outputName + ' (' + index + ')'});
                                index += 1;
                            }
                            output.set({bindings: this.taskBindings});
                            console.log(output);
                            this.datasets.off('add', null, 'set-collection').add(output);
                        }, this));
                        d3.select('.run')
                            .classed('btn-primary', true)
                            .classed('btn-default', false)
                            .attr('disabled', null);
                        d3.select('.error-message').classed('hidden', true);
                        d3.select('.info-message').classed('hidden', true);
                        d3.select('.success-message').classed('hidden', false).text('Success!');
                        console.log(data);
                    }, this));
                } else if (result.status === 'FAILURE') {
                    d3.select('.run')
                        .classed('btn-primary', true)
                        .classed('btn-default', false)
                        .attr('disabled', null);
                    console.log(result);
                    d3.select('.success-message').classed('hidden', true);
                    d3.select('.info-message').classed('hidden', true);
                    d3.select('.error-message').classed('hidden', false).text('Operation Failed. ' + result.message);
                } else {
                    setTimeout(_.bind(this.checkTaskResult, this), 1000);
                }
            }, this));
        }
    });

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
                    d3.json(girder.apiRoot + '/item/' + this.analysis.id + '/metadata').send('put', JSON.stringify(this.analysis.get('meta')), function (error, result) {
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
            }
        },

        initialize: function (settings) {
            this.analysis = null;
            this.datasets = settings.datasets;
            this.analysisSetupView = new flow.AnalysisSetupView({
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

    // An <option> tag in a <select> tag collection view defined
    // by an array of strings
    flow.StringOptionView = Backbone.View.extend({
        tagName: 'option',

        initialize: function () {
            this.model.on('change', this.render, this);
        },

        render: function () {
            // Attributes of a string model are {string: [object Object]},
            // so retrieve string with the first (and only) key name
            var text = this.model.keys()[0];
            this.$el.attr('value', text)
                .text(text);
            return this;
        }
    });

    // An <option> tag in a <select> tag collection view defined
    // by an array of Girder items that represent analyses or datasets
    flow.ItemOptionView = Backbone.View.extend({
        tagName: 'option',

        initialize: function () {
            this.model.on('change', this.render, this);
        },

        render: function () {
            this.$el.attr('value', this.model.cid)
                .text(this.model.get('name') + (this.model.get('collection') ? ' (' +  this.model.get('collection').get('name') + ')' : ''));
            return this;
        }
    });

    flow.VisualizationManagementView = Backbone.View.extend({
        events: {
            'change #visualization': 'changeVisualization',

            'click #show': function () {
                this.loadInputs(_.values(this.inputsView.itemViews), {}, _.bind(function (options) {
                    var inner = $('<div style="width:100%;height:100%"></div>');
                    $("#vis").empty();
                    $("#vis").append(inner);
                    inner[this.visualization.get('name')](options);
                    flow.setDisplay('vis');

                    // Untoggle the show script button if active
                    if (d3.select("#show-script").classed("active")) {
                        d3.select("#show-script").on("click")();
                        d3.select("#show-script").classed("active", false);
                    }
                }, this));
            }
        },

        initialize: function (settings) {
            this.datasets = settings.datasets;
            this.inputsView = new flow.InputsView({
                collection: new Backbone.Collection(),
                el: this.$('.inputs'),
                datasets: this.datasets
            });

            this.visualizations = settings.visualizations;
            this.visualizaitonsView = new flow.ItemsView({el: this.$('#visualization'), itemView: flow.ItemOptionView, collection: this.visualizations});
            this.visualizaitonsView.render();
            this.changeVisualization();
        },

        render: function () {
            if (this.visualization) {
                this.inputsView.collection.set(this.visualization.get('inputs'));
                this.inputsView.render();
            }
            return this;
        },

        changeVisualization: function () {
            this.visualization = this.visualizations.get($("#visualization").val());
            this.render();
        },

        loadInputs: function (inputViews, options, done) {
            var input, inputView, dataset, value;
            if (inputViews.length === 0) {
                done(options);
                return;
            }

            // Just handle the first input, recurse to handle the rest
            inputView = inputViews[0];
            inputViews = inputViews.slice(1);

            // Sometimes the view is a Backbone view, sometimes it is a plain control
            value = inputView.view.$el ? inputView.view.$el.val() : inputView.view.val();

            input = inputView.model;

            if (input.get('type') === 'table' || input.get('type') === 'tree' || input.get('type') === 'image' || input.get('type') === 'r') {
                dataset = this.datasets.get(value);
                if (dataset.get('bindings')) {
                    d3.select("#prov")
                        .text(JSON.stringify(dataset.get('bindings').inputs, null, "    "));
                }
                flow.retrieveDatasetAsFormat(dataset, input.get('type'), input.get('format'), false, _.bind(function (error, converted) {
                    options[input.get('name')] = converted.get('data');

                    // Handle the rest once we're done taking care of this one
                    this.loadInputs(inputViews, options, done);
                }, this));
                return;
            }
            if (input.get('type') === 'string') {
                options[input.get('name')] = value;
            } else if (input.get('type') === 'number') {
                options[input.get('name')] = parseFloat(value);
            } else if (input.get('type') === 'json') {
                options[input.get('name')] = JSON.parse(value);
            }
            this.loadInputs(inputViews, options, done);
        }

    });

    flow.DatasetCollection = girder.collections.ItemCollection.extend({
        fetch: function (params, reset) {
            var extension;

            if (reset) {
                this.offset -= this.length;
            }

            this.params = params || {};
            girder.restRequest({
                path: this.altUrl || this.resourceName,
                data: _.extend({
                    'limit': this.pageLimit + 1,
                    'offset': this.offset,
                    'sort': this.sortField,
                    'sortdir': this.sortDir
                }, this.params)
            }).done(_.bind(function (list) {
                if (list.length > this.pageLimit) {
                    // This means we have more pages to display still. Pop off
                    // the extra that we fetched.
                    list.pop();
                    this._hasMorePages = true;
                } else {
                    this._hasMorePages = false;
                }

                this.offset += list.length;

                list.forEach(_.bind(function (item) {
                    item.id = item._id;
                    extension = item.name.split('.');
                    extension = extension[extension.length - 1];
                    _.extend(item, flow.extensionToType[extension]);
                }, this));

                if (list.length > 0 || reset) {
                    if (this.append) {
                        this.add(list);
                    } else {
                        this.set(list);
                    }
                }

                this.trigger('g:changed');
            }, this));
        }
    });

    // The main app view
    flow.App = Backbone.View.extend({
        el: 'body',

        types: ['table', 'tree', 'string', 'image', 'r'],

        visualizationDescriptors: [
            {
                name: "table",
                inputs: [{name: "data", type: "table", format: "rows"}]
            },
            {
                name: "timeline",
                inputs: [
                    {name: "data", type: "table", format: "rows"},
                    {name: "date", type: "json", "default": {format: "inline", data: {"field": "Date"}}},
                    {name: "y", type: "json", "default": {format: "inline", data: [{"field": "y"}]}}
                ]
            },
            {
                name: "dendrogram",
                inputs: [
                    {name: "data", type: "tree", format: "nested"},
                    {name: "distance", type: "json", "default": {format: "inline", data: {"field": "edge_data.weight"}}},
                    {name: "lineStyle", type: "string", domain: ["axisAligned", "curved"]},
                    {name: "orientation", type: "string", domain: ["horizontal", "vertical"]}
                ]
            },
            {
                name: "image",
                inputs: [
                    {name: "data", type: "image", format: "png.base64"}
                ]
            },
            {
                name: "treeHeatmap",
                inputs: [
                    {
                        name: "tree",
                        type: "tree",
                        format: "vtktree.serialized",
                        dataIsURI: true
                    },
                    {
                        name: "table",
                        type: "table",
                        format: "vtktable.serialized",
                        dataIsURI: true
                    }
                ]
            }
        ],

        events: {
            'click #login': function () {
                girder.events.trigger('g:loginUi');
            },

            'click #logout': function () {
                girder.restRequest({
                    path: 'user/authentication',
                    type: 'DELETE'
                }).done(_.bind(function () {
                    girder.currentUser = null;
                    girder.events.trigger('g:login');
                }, this));
            },

            'click #register': function () {
                girder.events.trigger('g:registerUi');
            }
        },

        initialize: function (settings) {
            girder.restRequest({
                path: 'user/authentication',
                error: null
            }).done(_.bind(function (resp) {
                resp.user.token = resp.authToken.token;
                girder.currentUser = new girder.models.UserModel(resp.user);
                this.render();
            }, this)).error(_.bind(function () {
                this.render();
            }, this));

            this.$("#control-panel").controlPanel();

            this.collection = new girder.collections.CollectionCollection();
            this.collection.append = false;
            this.collection.pageLimit = 100;
            this.collection.fetch();

            this.view = new flow.CollectionsView({el: this.$('#collections'), itemView: flow.CollectionView, collection: this.collection});
            this.view.on('flow:change-active', this.collectionVisibilityChange, this);
            this.view.render();

            this.datasets = new flow.DatasetCollection();
            this.datasets.append = true;
            this.datasets.pageLimit = 100;
            this.datasetsView = new flow.DatasetManagementView({el: this.$('#dataset-management'), datasets: this.datasets});
            this.datasetsView.render();

            this.analyses = new girder.collections.ItemCollection();
            this.analyses.append = true;
            this.analyses.pageLimit = 100;
            this.analysesView = new flow.AnalysisManagementView({el: this.$('#analysis-management'), analyses: this.analyses, datasets: this.datasets});
            this.analysesView.render();

            this.visualizations = new Backbone.Collection(this.visualizationDescriptors);
            this.visualizationsView = new flow.VisualizationManagementView({el: this.$('#visualization-management'), visualizations: this.visualizations, datasets: this.datasets});
            this.visualizationsView.render();

            girder.events.on('g:loginUi', this.loginDialog, this);
            girder.events.on('g:registerUi', this.registerDialog, this);
            girder.events.on('g:login', this.login, this);
        },

        render: function () {
            if (girder.currentUser) {
                this.$("#logged-in").removeClass("hidden");
                this.$("#logged-out").addClass("hidden");
                this.$("#name").text("Logged in as " + girder.currentUser.get('firstName') + " " + girder.currentUser.get('lastName'));
            } else {
                this.$("#logged-in").addClass("hidden");
                this.$("#logged-out").removeClass("hidden");
            }
        },

        /**
         * Show a dialog allowing a user to login or register.
         */
        loginDialog: function () {
            if (!this.loginView) {
                this.loginView = new girder.views.LoginView({
                    el: this.$('#g-dialog-container')
                });
            }
            this.loginView.render();
        },

        registerDialog: function () {
            if (!this.registerView) {
                this.registerView = new girder.views.RegisterView({
                    el: this.$('#g-dialog-container')
                });
            }
            this.registerView.render();
        },

        collectionVisibilityChange: function (collection) {
            if (collection.get('active')) {
                d3.json(girder.apiRoot + '/folder?parentType=collection&parentId=' + collection.id, _.bind(function (error, folders) {
                    folders.forEach(function (f) {
                        if (f.name === "Analyses") {
                            collection.set({analysisFolder: f._id});
                        } else if (f.name === "Data") {
                            collection.set({dataFolder: f._id});
                        }
                    });

                    if (collection.get('analysisFolder')) {
                        this.analyses.offset = 0;
                        this.analyses.off('add', null, this).on('add', function (analysis) {
                            analysis.set({collection: collection});
                        }, this).fetch({
                            folderId: collection.get('analysisFolder')
                        });
                    }

                    if (collection.get('dataFolder')) {
                        this.datasets.offset = 0;
                        this.datasets.off('add', null, this).on('add', function (dataset) {
                            dataset.set({collection: collection});
                        }, this).fetch({
                            folderId: collection.get('dataFolder')
                        });
                    }
                }, this));
            } else {
                this.analyses.remove(this.analyses.where({collection: collection}));
                this.datasets.remove(this.datasets.where({collection: collection}));
            }
        },

        login: function () {
            this.render();
            this.collection.fetch({}, true);
        }
    });
    window.flow = flow;
});

$(document).ready(function () {
    girder.apiRoot = '/girder/api/v1';
    var app = new flow.App();
    app.render();
});
