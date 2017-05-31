/*jslint browser: true, nomen: true */

(function (flow, $, girder) {
    'use strict';

    $(document).ready(function () {
        girder.apiRoot = '/girder/api/v1';
        var app = new flow.App({
            el: 'body'
        });


        app.readyToAnalyze = function () {
            if ("tree" in this) {
                d3.select("#analyze").classed('disabled', false);
            }
        };


        // override upload function for simple mode
        flow.DatasetManagementView.prototype.upload = function (file) {
            var reader = new FileReader();

            reader.onload = _.bind(function (e) {
                var dataset = {
                        name: file.name,
                        data: e.target.result
                    },
                    extension = file.name.split('.'),
                    typeFormat;

                extension = extension[extension.length - 1];
                typeFormat = flow.getTypeFormatsFromExtension(extension)[0];
                typeFormat = {type: typeFormat.type, format: typeFormat.format};
                _.extend(dataset, typeFormat);
                dataset = new Backbone.Model(dataset);

                if (typeFormat.type == "tree") {
                    app.tree = dataset.get('data');
                    d3.select("#tree-name").html('Tree: ' + file.name + ' <span class="glyphicon glyphicon-ok-circle"></span>');
                    $("#column-input").text("Click GO! to make plot...");
                }
                app.readyToAnalyze();

                this.datasets.off('add', null, 'set-collection').add(dataset);
            }, this);

            reader.readAsText(file);
        };



        $("#analyze").click(function() {
            $("#analyze").attr("disabled", "disabled");
            $("#analyze").text("Re-run");
            $("#notice").text("Parsing tree...");

            console.log(app.tree);



            <!-- Copyright 2016 Mike Bostock https://d3js.org -->

            var outerRadius = 960 / 2,
                innerRadius = outerRadius - 170;

            var color = d3.scaleOrdinal()
                .domain(["Bacteria", "Eukaryota", "Archaea"])
                .range(d3.schemeCategory10);

            var cluster = d3.cluster()
                .size([360, innerRadius])
                .separation(function(a, b) { return 1; });

            var svg = d3.select("body").append("svg")
                .attr("width", outerRadius * 2)
                .attr("height", outerRadius * 2);

            var legend = svg.append("g")
                .attr("class", "legend")
              .selectAll("g")
              .data(color.domain())
              .enter().append("g")
                .attr("transform", function(d, i) { return "translate(" + (outerRadius * 2 - 10) + "," + (i * 20 + 10) + ")"; });

            legend.append("rect")
                .attr("x", -18)
                .attr("width", 18)
                .attr("height", 18)
                .attr("fill", color);

            legend.append("text")
                .attr("x", -24)
                .attr("y", 9)
                .attr("dy", ".35em")
                .attr("text-anchor", "end")
                .text(function(d) { return d; });

            var chart = svg.append("g")
                .attr("transform", "translate(" + outerRadius + "," + outerRadius + ")");

            d3.text(app.tree, function(error, app.tree) {
              if (error) throw error;

              var root = d3.hierarchy(parseNewick(life), function(d) { return d.branchset; })
                  .sum(function(d) { return d.branchset ? 0 : 1; })
                  .sort(function(a, b) { return (a.value - b.value) || d3.ascending(a.data.length, b.data.length); });

              cluster(root);

              var input = d3.select("#show-length input").on("change", changed),
                  timeout = setTimeout(function() { input.property("checked", true).each(changed); }, 2000);

              setRadius(root, root.data.length = 0, innerRadius / maxLength(root));
              setColor(root);

              var linkExtension = chart.append("g")
                  .attr("class", "link-extensions")
                .selectAll("path")
                .data(root.links().filter(function(d) { return !d.target.children; }))
                .enter().append("path")
                  .each(function(d) { d.target.linkExtensionNode = this; })
                  .attr("d", linkExtensionConstant);

              var link = chart.append("g")
                  .attr("class", "links")
                .selectAll("path")
                .data(root.links())
                .enter().append("path")
                  .each(function(d) { d.target.linkNode = this; })
                  .attr("d", linkConstant)
                  .attr("stroke", function(d) { return d.target.color; });

              chart.append("g")
                  .attr("class", "labels")
                .selectAll("text")
                .data(root.leaves())
                .enter().append("text")
                  .attr("dy", ".31em")
                  .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (innerRadius + 4) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
                  .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
                  .text(function(d) { return d.data.name.replace(/_/g, " "); })
                  .on("mouseover", mouseovered(true))
                  .on("mouseout", mouseovered(false));

              function changed() {
                clearTimeout(timeout);
                var t = d3.transition().duration(750);
                linkExtension.transition(t).attr("d", this.checked ? linkExtensionVariable : linkExtensionConstant);
                link.transition(t).attr("d", this.checked ? linkVariable : linkConstant);
              }

              function mouseovered(active) {
                return function(d) {
                  d3.select(this).classed("label--active", active);
                  d3.select(d.linkExtensionNode).classed("link-extension--active", active).each(moveToFront);
                  do d3.select(d.linkNode).classed("link--active", active).each(moveToFront); while (d = d.parent);
                };
              }

              function moveToFront() {
                this.parentNode.appendChild(this);
              }
            });

            // Compute the maximum cumulative length of any node in the tree.
            function maxLength(d) {
              return d.data.length + (d.children ? d3.max(d.children, maxLength) : 0);
            }

            // Set the radius of each node by recursively summing and scaling the distance from the root.
            function setRadius(d, y0, k) {
              d.radius = (y0 += d.data.length) * k;
              if (d.children) d.children.forEach(function(d) { setRadius(d, y0, k); });
            }

            // Set the color of each node by recursively inheriting.
            function setColor(d) {
              var name = d.data.name;
              d.color = color.domain().indexOf(name) >= 0 ? color(name) : d.parent ? d.parent.color : null;
              if (d.children) d.children.forEach(setColor);
            }

            function linkVariable(d) {
              return linkStep(d.source.x, d.source.radius, d.target.x, d.target.radius);
            }

            function linkConstant(d) {
              return linkStep(d.source.x, d.source.y, d.target.x, d.target.y);
            }

            function linkExtensionVariable(d) {
              return linkStep(d.target.x, d.target.radius, d.target.x, innerRadius);
            }

            function linkExtensionConstant(d) {
              return linkStep(d.target.x, d.target.y, d.target.x, innerRadius);
            }

            // Like d3.svg.diagonal.radial, but with square corners.
            function linkStep(startAngle, startRadius, endAngle, endRadius) {
              var c0 = Math.cos(startAngle = (startAngle - 90) / 180 * Math.PI),
                  s0 = Math.sin(startAngle),
                  c1 = Math.cos(endAngle = (endAngle - 90) / 180 * Math.PI),
                  s1 = Math.sin(endAngle);
              return "M" + startRadius * c0 + "," + startRadius * s0
                  + (endAngle === startAngle ? "" : "A" + startRadius + "," + startRadius + " 0 0 " + (endAngle > startAngle ? 1 : 0) + " " + startRadius * c1 + "," + startRadius * s1)
                  + "L" + endRadius * c1 + "," + endRadius * s1;
            }


            $("#notice").text("Tree plot");


        });

        $("#help").click(function() {
            $("#upload").popover({
                title: 'Step #1',
                content: 'Upload your table (csv or tsv) and tree (newick) here',
                placement: 'bottom',
                trigger: 'manual'
            });
            $("#upload").popover('toggle');
            $("#column-input").popover({
                title: 'Step #2',
                content: 'Drag your column of interest here',
                placement: 'left',
                trigger: 'manual'
            });
            $("#column-input").popover('toggle');
            $("#analyze").popover({
                title: 'Step #3',
                content: 'Click on the "Go!" button',
                placement: 'bottom',
                trigger: 'manual'
            });
            $("#analyze").popover('toggle');

        });

        $("#table-preview").click(function() {
            toggleInputTablePreview();
        });

        app.render();
    });
}(window.flow, window.$, window.girder));
