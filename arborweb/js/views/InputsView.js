/*jslint browser: true, nomen: true */

(function (flow, _, tangelo) {
    "use strict";

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

}(window.flow, window._, window.tangelo));
