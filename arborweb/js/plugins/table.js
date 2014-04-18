/*jslint browser: true, unparam: true, nomen: true */

(function (tangelo, $) {
    "use strict";

    if (!($ && $.widget)) {
        return;
    }

    tangelo.widget("tangelo.table", {
        options: {
            data: null
        },

        _create: function () {
            this.div = $('<table class="table table-bordered table-striped"></table>');
            this.element.append(this.div);
        },

        _update: function () {
            var header = "<thead>",
                body = "<tbody>",
                headerSet = false;

            this.div.empty();

            $.each(this.options.data, function(key, value) {
                var row = "<tr>";
                $.each(value, function(key, value) {
                    if (key !== "_id") {
                        row += "<td>" + value + "</td>";
                        if (!headerSet) {
                            header += "<th>" + key + "</th>";
                        }
                    }
                });
                headerSet = true;
                row += "</tr>";
                body += row;
            });
            header += "</thead>";
            body += "</tbody>";
            this.div.append(header);
            this.div.append(body);
        }
    });
}(window.tangelo, window.jQuery));
