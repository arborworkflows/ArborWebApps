/*
    TODO Add clipping mask to labels
    TODO Document the events from PixelLayer
    TODO Hide/Show labels depth > 1 with mouseover
    FIXME Labels w/ depth > 1 don't have gap
*/


/**
## BandScale
Produces a scale that can be used to draw a band of items, much like
d3.scale.ordinal().rangeBands(), but with fixed pixel padding.
**/
function BandScale() {
    var _padding = 0;
    var _outerPadding = 0;
    var _domain = []
    var _range = [0, 1];
    var _bandCache = null;

    var _scale = function (e) {
        var index = _domain.indexOf(e);
        if (index == 0) {
            return value = _outerPadding;
        } else {
            return index * (_scale.rangeBand() + _padding) + _outerPadding;
        }
    }

    /**
    #### .domain([array])
    Gets or sets the domain of the scale. Should be a set of ordinal values.
    **/
    _scale.domain = function (d) {
        if (!arguments.length) {
            return _domain;
        }
        _domain = d;
        _bandCache = null;
        return _scale;
    }

    /**
    #### .rangeBands(interval,[padding],[outerPadding])
    Sets the output range to the specified interval with the given fixed
    padding widths.
    **/
    _scale.rangeBands = function (r, p, o) {
        _range = r;
        _padding = p || 0;
        _outerPadding = o || 0;
        _bandCache = null;
        return _scale;
    }

    /**
    #### .rangeBand()
    Returns the width of a band.
    **/
    _scale.rangeBand = function () {
        if (_bandCache == null) {
            var width = Math.abs(_range[1] - _range[0]);
            var bandCount = _domain.length;
            _bandCache = (width - (2 * _outerPadding) - (_padding * (bandCount - 1))) / bandCount;
        }
        return _bandCache;
    }
    return _scale;
}


/**
## PixelLayer(anchor, defs)
Draws a PixelLayer chart in the given SVG or G element.
**/
function PixelLayer(anchor) {
    var _anchor = anchor;
    var _root = d3.select(_anchor);
    var _g = null;
    var _innerG = null;
    var _outerG = null;
    var _defs = null;
    var _uuid = createUUID();
    var _chart = {};

    var _elements = null;
    var _expression = null;

    var _width = 184;
    var _height = 184;
    var _xPos = 0;
    var _yPos = 0;
    var _columns = 15;
    var _rows = 15;

    var _pixelGap = 3;
    var _pixelColor = function (d, i) {
        return d3.rgb(17, 110, 220);
    }
    var _labelColor = function (d, i) {
        return d3.rgb(17, 110, 220);
    }
    var _borderColor = d3.rgb(255, 255, 255);
    var _borderWidth = 0.5;
    var _groupColor = function (d, i) {
        return d3.rgb(255, 248, 191);
    }
    var _groupWidth = 1;

    var _valueAccessor = function (d, i) {
        return d.value;
    }
    var _groupAccessor = function (d, i) {
        return d.class;
    }

    var _faded = false;
    var _simple = false;
    var _highlight = true;
    var _highlightGroups = true;


    // The event listeners available for this chart
    var _listeners = {
        'dragstart': [],
        'drag': [],
        'dragend': [],
        'mouseenter': [],
        'mouseleave': [],
        'mousedown': [],
        'mouseup': [],
        'click': [],
        'mouseenter.pixel': [],
        'mouseleave.pixel': [],
        'mousedown.pixel': [],
        'mouseup.pixel': [],
        'click.pixel': [],
        'mouseenter.group': [],
        'mouseleave.group': [],
        'click.split': [],
        'drag.label': [],
        'change.operator': [],
    };

    // The drag behavior
    var _dragging = false;
    var _label = null;
    var _drag = d3.behavior.drag()
        .origin(function () {
            return {
                'x': _chart.x(),
                'y': _chart.y()
            };
        })
        .on('dragstart', function () {
            _dragging = true;
            // Cancel propogation so that the zoom behavior doesn't kick in
            d3.event.sourceEvent.stopPropagation();
            callListeners('dragstart', _chart);
        })
        .on('drag', function (d, i) {
            _chart.x(d3.event.x);
            _chart.y(d3.event.y);
            _g.attr('transform', "translate(" + _chart.x() + "," + _chart.y() + ")");
            d3.event.sourceEvent.stopPropagation();
            callListeners('drag', _chart);
            // If the drag originated with a label, we need to fire the "drag.label"
            // event.
            if (_label) {
                var data = {
                    parent: _label.parent,
                    node: _label.node,
                    depth: _label.depth,
                };
                callListeners('drag.label', _chart, data);
                _label = null;
            }
        })
        .on('dragend', function () {
            _dragging = false;
            _split = false;
            d3.event.sourceEvent.stopPropagation();
            callListeners('dragend', _chart);
        });

    /**
    #### reset()
    Resets the chart, clearing its main elements.
    **/
    function reset() {
        if (_g) {
            _g.remove();
        }

        _g = _root.append('svg:g').classed('pl', true);
        _outerG = _g.append('svg:g').classed('outer', true);
        _innerG = _outerG.append('svg:g').classed('inner', true);

        // Move to the x and y position
        _g.attr('transform', "translate(" + _chart.x() + "," + _chart.y() + ")");

        // Create the labels at the top of the PixelLayer. They do not change.
        drawCompositeLabels();

        // Create the border
        var borderWidth = _chart.borderWidth();
        _innerG.append('svg:rect')
            .classed('pl-box', true)
            .attr('width', _chart.width())
            .attr('height', _chart.height())
            .style('fill-opacity', 0.5)
            .style('stroke', _chart.borderColor())
            .style('stroke-width', _chart.borderWidth());

        // Create the area for pixels
        _innerG.append('svg:g')
            .classed('pl-pixels', true)
            .attr('transform', "translate(0,0)");

        // Create the area for expression labels
        _innerG.append('svg:g')
            .classed('pl-labels', true)
            .attr('transform', "translate(" + (0 - borderWidth) + "," + (_chart.height() - borderWidth) + ")");

        // Hook up the events
        _g
            .on('mouseenter', function () {
                if (!_dragging) {
                    callListeners('mouseenter', _chart);
                }
            })
            .on('mouseleave', function () {
                if (!_dragging) {
                    callListeners('mouseleave', _chart);
                }
            })
            .on('mousedown', function () {
                callListeners('mousedown', _chart);
            })
            .on('mouseup', function () {
                callListeners('mouseup', _chart);
            })
            .on('click', function () {
                callListeners('click', _chart);
            })
            .call(_drag);
    }

    /**
    #### createPixelGroups()
    Creates the data of the pixel groups.
    **/
    function createPixelGroups() {
        var columnCount = _chart.columns();
        var rowCount = _chart.rows();
        var total = (rowCount * columnCount);

        // Calculate the values of the pixels
        var expression = _chart.expression();
        var valueAccessor = _chart.valueAccessor();
        var groupAccessor = _chart.groupAccessor();
        var data = _chart.elements()
            .slice(0, total)
            .map(function (d, i) {
                var row = parseInt(i / rowCount);
                var col = i - row * rowCount;
                return {
                    value: valueAccessor(d),
                    pixelValue: expression.value(d),
                    group: groupAccessor(d),
                    element: d,
                    row: row,
                    column: col,
                    index: i,
                };
            });

        var count = data.length;
        if (count < total) {
            var pad = Array.apply(null, new Array(total - data.length))
                .map(function (d, i) {
                    var row = parseInt((i + count) / rowCount);
                    var col = (i + count) - row * rowCount;
                    return {
                        value: null,
                        pixelValue: null,
                        group: "",
                        element: null,
                        row: row,
                        column: col,
                        index: (i + count),
                    };
                });
            data = data.concat(pad);
        }

        // Nest by groups, calculating the top right and bottom left pixels that
        // belong to each group.
        var groupRectDict = {};
        var pixelsByGroup = d3.nest()
            .key(function (d) {
                return d.group;
            })
            .sortValues(function (a, b) {
                return d3.ascending(a.index, b.index);
            })
            .entries(data)
            .map(function (g) {
                g.tl = g.values[0];
                g.br = g.values[g.values.length - 1];
                return g;
            });

        return pixelsByGroup;
    }

    /**
    #### drawPixelGroups()
    Draws the groups of pixels of the chart.
    **/
    function drawPixelGroups() {
        var data = createPixelGroups();

        // Create the svg groups
        var pixelG = _innerG.select('g.pl-pixels')
        var groups = pixelG.selectAll('g.pixel')
            .data(data, function (d) {
                return d.key;
            })

        // ENTER GROUPS
        groups.enter()
            .append('svg:g')
            .classed('pixel', true)
            .on('mouseenter', function (d) {
                // Ignore the "null" group or when we are dragging
                if (d.key.trim() === "" || _dragging) {
                    return;
                }

                if (_highlightGroups) {
                    d3.select(this).select('rect.pixel-border')
                        .classed('invisible', false);
                }
                callListeners('mouseenter.group', this, d.key, _chart);
            })
            .on('mouseleave', function (d) {
                if (d.key.trim() === "" || _dragging) {
                    return;
                }
                if (_highlightGroups) {
                    d3.select(this).select('rect.pixel-border')
                        .classed('invisible', true);
                }
                callListeners('mouseleave.group', this, d.key, _chart);
            })
            .each(function (d) {
                // Create a border if the group is not null
                if (d.key.trim() != "") {
                    d3.select(this).append('svg:rect')
                        .datum(d)
                        .classed('pixel-border', true)
                        .classed('invisible', true);
                }
            });

        // ENTER + UPDATE GROUPS
        drawGroupBorders(groups);
        drawPixels(groups);

        // EXIT GROUPS
        groups.exit().remove();
    }

    /**
    #### drawPixels(selection)
    Draws the pixels within their groups.
    **/
    function drawPixels(groups) {
        var width = _chart.width() - _chart.borderWidth();
        var height = _chart.height() - _chart.borderWidth();
        var columnCount = _chart.columns();
        var rowCount = _chart.rows();
        var pixelGap = _chart.pixelGap();
        var pixelColor = _chart.pixelColor();
        var xScale = BandScale().domain(d3.range(columnCount))
            .rangeBands([0, width], pixelGap, 4);
        var yScale = BandScale().domain(d3.range(rowCount))
            .rangeBands([0, height], pixelGap, 4);

        var pixels = groups.selectAll('rect.pixel')
            .data(function (d) {
                return d.values;
            });

        // ENTER
        pixels.enter()
            .append('svg:rect')
            .classed('pixel', true)
            .classed('null', function (d) {
                return d.value == null;
            })
            .on('mouseenter', function (d, i) {
                if (_dragging || d.value == null) {
                    return;
                }
                if (_highlight) {
                    d3.select(this).classed('hover', true);
                }
                callListeners('mouseenter.pixel', this, d.element, i, _chart);
            })
            .on('mouseleave', function (d, i) {
                if (_dragging || d.value == null) {
                    return;
                }
                if (_highlight) {
                    d3.select(this).classed('hover', false);
                }
                callListeners('mouseleave.pixel', this, d.element, i, _chart);
            })
            .on('mousedown', function (d, i) {
                if (d.value == null) {
                    return;
                }
                callListeners('mousedown.pixel', this, d.element, i, _chart);
            })
            .on('mouseup', function (d, i) {
                if (d.value == null) {
                    return;
                }
                callListeners('mouseup.pixel', this, d.element, i, _chart);
            })
            .on('click', function (d, i) {
                if (d.value == null) {
                    return;
                }
                callListeners('click.pixel', this, d.element, i, _chart);
            });

        // ENTER + UPDATE
        pixels
            .classed('empty', function (d) {
                return d.pixelValue == 0;
            })
            .attr('width', xScale.rangeBand())
            .attr('height', yScale.rangeBand())
            .attr('transform', function (d, i) {
                return "translate(" + xScale(d.column) + "," + yScale(d.row) + ")";
            })
            .style('fill-opacity', function (d) {
                return d.pixelValue > 0 ? 1 : 0;
            })
            .style('fill', function (d, i) {
                var color = pixelColor.call(_chart, d, i);
                return d3.interpolateRgb(d3.rgb(0, 0, 0), color)(d.pixelValue);
            });

        // EXIT
        pixels.exit().remove();
    }

    /**
    #### drawGroups(selection)
    Draws the group borders around the pixels. This assumes that the pixels are
    ordered such that each group has arectangular area.
    **/
    function drawGroupBorders(groups) {
        var width = _chart.width() - _chart.borderWidth();
        var height = _chart.height() - _chart.borderWidth();
        var columnCount = _chart.columns();
        var rowCount = _chart.rows();
        var pixelGap = _chart.pixelGap();
        var groupWidth = _chart.groupWidth();
        var groupColor = _chart.groupColor();
        var xScale = BandScale().domain(d3.range(columnCount))
            .rangeBands([0, width], pixelGap, 4);
        var yScale = BandScale().domain(d3.range(rowCount))
            .rangeBands([0, height], pixelGap, 4);

        groups.select('rect.pixel-border')
            .attr('x', function (d) {
                return xScale(d.tl.column) - (pixelGap / 2);
            })
            .attr('y', function (d) {
                return yScale(d.tl.row) - (pixelGap / 2);
            })
            .attr('width', function (d) {
                return xScale(d.br.column) - xScale(d.tl.column) + pixelGap + xScale.rangeBand();
            })
            .attr('height', function (d) {
                return yScale(d.br.row) - yScale(d.tl.row) + pixelGap + yScale.rangeBand();
            })
            .style('stroke', groupColor)
            .style('stroke-width', groupWidth)
            .style('fill-opacity', 0);
    }

    /**
    #### drawLabels()
    Draws the labels around the chart.
    **/
    function drawLabels() {
        drawDataLabels();
        updateCompositeLabels();
    }

    /**
    #### drawDataLabels()
    Draws the labels at the bottom of the PixelLayer showing the structure.
    **/
    function drawDataLabels() {
        var width = _chart.width() + (2 * _chart.borderWidth());
        var margin = _chart.borderWidth() + _chart.pixelGap();
        var color = _chart.labelColor();
        var generator = LabelGenerator()
            .width(width)
            .labelHeight(20)
            .gap(2);

        var data = generator(_chart.expression().root());
        var count = data.length;
        var labelG = _innerG.select('g.pl-labels');
        var labels = labelG.selectAll('g.label')
            .data(data);

        // ENTER
        var newLabels = labels.enter()
            .append('svg:g')
            .classed('label', true)
            .on('mousedown', function (d) {
                _label = d;
            });
        newLabels.append('svg:rect')
            .classed('label', true);
        newLabels.append('svg:text')
            .classed('label', true);
        newLabels.append('svg:text')
            .classed('count', true);
        newLabels.append('svg:title')
            .text(function (d) {
                return (_expression.not() ? "NOT " : "") + d.label;
            });

        // ENTER + UPDATE
        labels
            .attr('transform', function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });
        labels.select('rect')
            .attr('width', function (d) {
                return d.dx;
            })
            .attr('height', function (d) {
                return d.dy;
            })
            .attr('fill', function (d, i) {
                return color.call(_chart, d, i);
            });
        labels.select('text.label')
            .attr('text-anchor', function (d) {
                //Can use 'this.getComputedTextLength()' to check if size of label is less than surrounding box.
                if (count == 1) {
                    return "start";
                } else {
                    return "middle";
                }
            })
            .attr('x', function (d) {
                if (count == 1) {
                    return margin;
                } else {
                    return d.dx / 2;
                }
            })
            .attr('y', 15)
            .attr('width', function (d) {
                return d.dx * 0.8;
            })
            .text(function (d) {
                return d.label;
            });
        labels.select('text.count')
            .attr('text-anchor', "end")
            .attr('x', width - margin)
            .attr('y', 15)
            .text(function (d) {
                return d.count;
            })
            .classed('hidden', function (d) {
                return count > 1;
            });
        labels.select('title')
            .text(function (d) {
                return (_expression.not() ? "NOT " : "") + d.label;
            });

        // EXIT
        labels.exit().remove();
    }

    /**
    ## LabelGenerator
    Creates a layout generator for the data labels. It functions similarly to
    d3.layout.partition, recursing a hierarchy to position nodes. The call
    to generate the labels returns an array of nodes to be drawn.
    **/
    var LabelGenerator = function () {
        var _gap;
        var _width;
        var _labelHeight;

        function recurse(node, parent, depth, x, dx, nodes) {
            var children = isOperatorNode(node) ? node.children() : null;
            var siblingCount = parent ? parent.children().length - 1 : null;
            var count = isOperatorNode(node) ? null : node.data().set().count();
            var label = isOperatorNode(node) ? node.operator() : (node.not() && siblingCount > 0 ? "NOT " : "") + node.data().label();
            var nodeObj = {
                depth: depth,
                node: node,
                parent: parent,
                label: label,
                count: count,
                x: x,
                y: (depth * _labelHeight),
                dx: dx,
                dy: _labelHeight,
            };
            if (depth > 0) {
                nodeObj.y += _gap;
            } // FIXME
            nodes.push(nodeObj);

            if (children) {
                var scale = BandScale()
                    .domain(d3.range(children.length))
                    .rangeBands([0, dx], _gap, 0);
                children.forEach(function (c, i) {
                    recurse(c, node, depth + 1, scale(i) + x, scale.rangeBand(), nodes);
                });
            }
        }

        var _obj = function (root) {
            var nodes = [];
            recurse(root, null, -1, 0, _width, nodes);
            nodes.shift();
            return nodes;
        };

        _obj.gap = function (g) {
            if (!arguments.length) {
                return _gap;
            }
            _gap = g;
            return _obj;
        };

        _obj.width = function (w) {
            if (!arguments.length) {
                return _width;
            }
            _width = w;
            return _obj;
        };

        _obj.labelHeight = function (h) {
            if (!arguments.length) {
                return _labelHeight;
            }
            _labelHeight = h;
            return _obj;
        };

        return _obj;
    };

    /**
    #### drawCompositeLabels
    Creates the labels for information about the PixelLayer if it is a composite
    of multiple data sets.
    **/
    function drawCompositeLabels() {
        var width = _chart.width() + (2 * _chart.borderWidth());
        var borderWidth = _chart.borderWidth();

        var cLabels = _outerG.append('svg:g')
            .classed('pl-composite-labels', true)
            .attr('transform', "translate(" + (0 - borderWidth) + "," + (borderWidth - 20) + ")");

        var opLabel = cLabels.append('svg:g')
            .classed('operator', true)
            .classed('hidden', true)
            .on('click', function () {
                var not = _chart.expression().not();
                if (_chart.expression().count() == 1) {
                    _chart.expression().not(!not);
                    _chart.redraw();
                    callListeners('change.operator', _chart, "NOT");
                } else {
                    _chart.operator(_chart.operator() == "AND" ? "OR" : "AND");
                    _chart.redraw();
                    callListeners('change.operator', _chart, _chart.operator());
                }
            });
        opLabel.append('svg:rect')
            .classed('operator', true)
            .attr('width', 40)
            .attr('height', 20);
        opLabel.append('svg:text')
            .classed('operator', true)
            .attr('text-anchor', "middle")
            .attr('x', 20)
            .attr('y', 15);

        var countLabel = cLabels.append('svg:g')
            .classed('count', true)
            .classed('hidden', true)
            .attr('transform', "translate(" + (width - 20) + ",0)");
        countLabel.append('svg:rect')
            .classed('count', true)
            .attr('width', 20)
            .attr('height', 20);
        countLabel.append('svg:text')
            .classed('count', true)
            .attr('text-anchor', "middle")
            .attr('x', 10)
            .attr('y', 15);

        var xLabel = cLabels.append('svg:g')
            .classed('x', true)
            .classed('hidden', true)
            .attr('transform', "translate(" + (width - borderWidth) + "," + 20 + ")")
            .on('click', function (d) {
                callListeners('click.split', _chart);
            });
        xLabel.append('svg:rect')
            .classed('x', true)
            .attr('width', 20)
            .attr('height', 20);
        xLabel.append('svg:text')
            .classed('x', true)
            .attr('text-anchor', "middle")
            .attr('x', 10)
            .attr('y', 15)
            .text('X');
    }

    /**
    #### updateCompositeLabels
    Updates the labels found at the top of the PixelLayer if it is a composite.
    **/
    function updateCompositeLabels() {
        var operator = _chart.expression().root().operator();
        var count = _chart.expression().count();
        var color = _chart.labelColor();

        if (count == 1) {
            var opLabel = _outerG.select('g.operator')
                .classed('hidden', false);
            opLabel.select('text')
                .text("NOT");

            if (_chart.expression().not()) {
                opLabel.select('rect')
                    .style('fill', function (d, i) {
                        return color.call(_chart, d, i);
                    })
                    .style('stroke', "none")
                    .style('fill-opacity', 1)
                    .attr('x', 0)
                    .attr('y', 0);

                opLabel.select('text')
                    .style('fill', "black")
            } else {
                opLabel.select('rect')
                    .style('stroke', _chart.borderColor())
                    .style('stroke-width', 0.5)
                    .style('fill', "black")
                    .style('fill-opacity', 0.5)
                    .attr('x', 0.5)
                    .attr('y', -0.5);

                opLabel.select('text')
                    .style('fill', function (d, i) {
                        return color.call(_chart, d, i);
                    })
            }

            _outerG.select('g.count')
                .classed('hidden', true);

            _outerG.select('g.x')
                .classed('hidden', true);
        } else {
            var opLabel = _outerG.select('g.operator')
                .classed('hidden', function () {
                    return count <= 1;
                });
            opLabel.select('rect')
                .style('stroke', "none")
                .style('fill', function (d, i) {
                    return color.call(_chart, d, i);
                })
                .style('fill-opacity', 1)
                .attr('x', 0)
                .attr('y', 0);
            opLabel.select('text')
                .style('fill', "black")
                .text(operator);

            var countLabel = _outerG.select('g.count')
                .classed("hidden", false);
            countLabel.select('rect')
                .style('fill', function (d, i) {
                    return color.call(_chart, d, i);
                });
            countLabel.select('text')
                .text(count);

            var splitLabel = _outerG.select('g.x')
                .classed("hidden", false);
            splitLabel.select('rect')
                .attr('fill', function (d, i) {
                    return color.call(_chart, d, i);
                });
        }

    }

    /**
    #### callListeners(event, this, [arg], ...)
    Calls the listeners of an event. Follows the same format as function.call().
    **/
    function callListeners(evt, thisObj) {
        var args = Array.prototype.slice.call(arguments, 2);
        for (var i = 0; i < _listeners[evt].length; i++) {
            _listeners[evt][i].apply(thisObj, args);
        }
    }

    /**
    #### applyListeners(event, this, [arg, ...])
    Calls the listeners of an event, except it takes an array of arguments
    instead of positional arguments, like function.apply()
    **/
    function applyListeners(evt, thisObj, args) {
        for (var i = 0; i < _listeners[evt].length; i++) {
            _listeners[evt][i].apply(thisObj, args);
        }
    }

    /**
    #### .select(selection)
    Executes a d3.select() within the context of this PixelLayer.
    **/
    _chart.select = function (s) {
        return _g.select(s);
    };

    /**
    #### .selectAll(selection)
    Executes a d3.selectAll() within the context of this PixelLayer.
    **/
    _chart.selectAll = function (s) {
        return _g.selectAll(s);
    };

    /**
    #### .render()
    Renders the chart from scratch.
    **/
    _chart.render = function () {
        reset();
        drawPixelGroups();
        drawLabels();
        return _chart;
    };

    /**
    #### .redraw()
    Redraws the chart in place.
    **/
    _chart.redraw = function () {
        drawPixelGroups();
        drawLabels();
        return _chart;
    };

    /**
    #### .preview()
    Redraws the chart pixels, but does not update the labels.
    **/
    _chart.preview = function () {
        drawPixelGroups();
        return _chart;
    };

    /**
    #### .remove()
    Removes the chart from the canvas.
    **/
    _chart.remove = function () {
        if (_g) {
            _g.remove();
        }
    };

    /**
    #### .moveToFront()
    Moves the chart to the front of the canvas.
    **/
    _chart.moveToFront = function () {
        if (_g) {
            _g.moveToFront();
        }
    };

    /**
    #### .moveToBack()
    Moves the chart to the back of the canvas.
    **/
    _chart.moveToBack = function () {
        if (_g) {
            _g.moveToBack();
        }
    };

    /**
    #### fadeIn(duration[,delay])
    Fades in this pixel layer
    **/
    _chart.fadeIn = function (dur, del) {
        var dur = dur != undefined ? dur : 500;
        var del = del != undefined ? del : 0;
        if (_g) {
            _g.transition()
                .duration(dur)
                .delay(del)
                .style('opacity', 1);
            _faded = false;
        }
    };

    /**
    #### .fadeOut(opacity[,duration][,delay])
    Fades out this pixel layer
    **/
    _chart.fadeOut = function (op, dur, del) {
        var op = op != undefined ? op : 0.5;
        var dur = dur != undefined ? dur : 500;
        var del = del != undefined ? del : 0;
        if (_g) {
            _g.transition()
                .duration(dur)
                .delay(del)
                .style('opacity', op);
            _faded = true;
        }
    };

    /**
    #### .faded()
    Returns true if this chart is faded.
    **/
    _chart.faded = function () {
        return _faded;
    };


    /**
    #### .highlight([boolean])
    Turns on or off automatic pixel highlighting
    **/
    _chart.highlight = function (b) {
        if (!arguments.length) {
            return _highlight;
        }
        _highlight = b;
        return _chart;
    }

    /**
    #### .highlight([boolean])
    Turns on or off automatic pixel group highlighting
    **/
    _chart.highlightGroups = function (b) {
        if (!arguments.length) {
            return _highlightGroups;
        }
        _highlightGroups = b;
        return _chart;
    }

    /**
    #### .elements([array])
    Gets or sets the elements represented by pixels. The input should be an
    array of SetElement objects. They will fill the pixel grid from left to
    right and top to bottom.
    **/
    _chart.elements = function (e) {
        if (!arguments.length) {
            return _elements;
        }
        _elements = e;
        return _chart;
    };

    /**
    #### .expression([SetExpression])
    Gets or sets the SetExpression drawn by this PixelLayer.
    **/
    _chart.expression = function (e) {
        if (!arguments.length) {
            return _expression;
        }
        _expression = e;
        return _chart;
    };

    /**
    #### .asSet()
    Returns the elements of the calculated expression as a set, i.e., the
    elements that are being drawn on the screen will be returned as a set. If
    an element has a pixel value greater than 0, it is considered to be in the 
    set.
    **/
    _chart.asSet = function () {
        var elements = _chart.elements();
        var expression = _chart.expression();
        var set = Set({}, _chart.valueAccessor());
        elements.forEach(function (e) {
            if (expression.value(e) > 0) {
                set.add(e);
            }
        });
        return set;
    }

    /**
    #### .uuid()
    Returns the universally unique identifier for this PixelLayer. Useful for
    determining if two objects are equal.
    **/
    _chart.uuid = function () {
        return _uuid;
    };

    /**
    #### .operator([value])
    Gets or sets the root operator for this PixelLayer.
    **/
    _chart.operator = function (o) {
        if (!arguments.length) {
            return _chart.expression().root().operator();
        }
        _chart.expression().root().operator(o);
        return _chart;
    };

    /**
    #### .width([value])
    Gets or sets the width of the PixelLayer, in pixels.
    **/
    _chart.width = function (w) {
        if (!arguments.length) {
            return _width;
        }
        _width = w;
        return _chart;
    };

    /**
    #### .height([value])
    Gets or sets the height of the PixelLayer, in pixels.
    **/
    _chart.height = function (h) {
        if (!arguments.length) {
            return _height;
        }
        _height = h;
        return _chart;
    };

    /**
    #### .x([value])
    Gets or sets the x posiiton of the top left corner of the chart
    **/
    _chart.x = function (x) {
        if (!arguments.length) {
            return _xPos;
        }
        _xPos = x;
        return _chart;
    };

    /**
    #### .y([value])
    Gets or sets the y posiiton of the top left corner of the chart
    **/
    _chart.y = function (y) {
        if (!arguments.length) {
            return _yPos;
        }
        _yPos = y;
        return _chart;
    };

    /**
    #### .rows([value])
    Gets or sets the number of rows in the chart. Default is 15.
    **/
    _chart.rows = function (n) {
        if (!arguments.length) {
            return _rows;
        }
        _rows = n;
        return _chart;
    };

    /**
    #### .columns([value])
    Gets or sets the number of columns in the chart. Default is 15.
    **/
    _chart.columns = function (n) {
        if (!arguments.length) {
            return _columns;
        }
        _columns = n;
        return _chart;
    };

    /**
    #### .borderWidth([value])
    Gets or sets the border thickness. Default is 0.5px
    **/
    _chart.borderWidth = function (w) {
        if (!arguments.length) {
            return _borderWidth;
        }
        _borderWidth = w;
        return _chart;
    };

    /**
    #### .borderColor([color])
    Gets or sets the border color. It can be a d3.color object (like d3.rgb())
    or a hex string
    **/
    _chart.borderColor = function (c) {
        if (!arguments.length) {
            return _borderColor;
        }
        _borderColor = c;
        return _chart;
    };

    /**
    #### .groupWidth([value])
    Gets or sets the group outline thickness. Default is 1px.
    **/
    _chart.groupWidth = function (w) {
        if (!arguments.length) {
            return _groupWidth;
        }
        _groupWidth = w;
        return _chart;
    };

    /**
    #### .groupColor([color])
    Gets or sets the group outline color. It can be a d3.color object or a hex 
    string
    **/
    _chart.groupColor = function (c) {
        if (!arguments.length) {
            return _groupColor;
        }
        _groupColor = c;
        return _chart;
    };

    /**
    #### .pixelGap([value])
    Gets or sets the width of the gap between pixels in the pixel layer. Default
    is 3px.
    **/
    _chart.pixelGap = function (v) {
        if (!arguments.length) {
            return _pixelGap;
        }
        _pixelGap = v;
        return _chart;
    };

    /**
    #### .pixelColor([function])
    Gets or sets function used to color pixels in the PixelLayer. The function
    will be passed the data and index of the pixel, i.e., compound, being
    colored and should return a color - either a d3.color object, like d3.rgb(),
    or a hex string. The context (i.e. 'this') is set to be this PixelLayer.
    **/
    _chart.pixelColor = function (f) {
        if (!arguments.length) {
            return _pixelColor;
        }
        _pixelColor = f;
        return _chart;
    };

    /**
    #### .labelColor([function])
    Gets or sets the function used to color the labels of the PixelLayer. The
    function will be passed the label object and index and should return a
    color - either a d3.color object, like d3.rgb(), or a hex string. Like
    .pixelColor(), the context of the function is set to be this PixelLayer
    object.
    **/
    _chart.labelColor = function (f) {
        if (!arguments.length) {
            return _labelColor;
        }
        _labelColor = f;
        return _chart;
    };

    /**
    #### .valueAccessor([function])
    Gets or sets the function used to examine an element's value. The default
    accessor looks for a .value property on the element.
    **/
    _chart.valueAccessor = function (f) {
        if (!arguments.length) {
            return _valueAccessor;
        }
        _valueAccessor = f;
        return _chart;
    };

    /**
    #### .groupAccessor([function])
    Gets or sets the function used to examine an element's group or hierarchy.
    For example, the AquaViz data set has elements such as Trigonelline, with
    a class of Amino Acid. The default accessor looks for a .class property.
    **/
    _chart.groupAccessor = function (f) {
        if (!arguments.length) {
            return _groupAccessor;
        }
        _groupAccessor = f;
        return _chart;
    };

    /**
    #### .composite()
    Returns true if this chart is a composite, meaning it has more than one
    data set.
    **/
    _chart.composite = function () {
        return _chart.expression().count() > 1;
    };

    /**
    #### .boundingRect([scale][,translation])
    Returns the bounding rectangle for this PixelLayer, relative to the parent
    container. An optional scale can be passed which will scale the values and
    an optional translate will translate them.
    **/
    _chart.boundingRect = function (s, t) {
        var scale = s == undefined ? 1 : s;
        var pan = t == undefined ? [0, 0] : t;
        var x = (_chart.x() * scale) + pan[0];
        var y = (_chart.y() * scale) + pan[1];
        var width = _chart.width() * scale;
        var height = _chart.height() * scale;
        return {
            'top': y,
            'left': x,
            'bottom': y + height,
            'right': x + width,
            'height': height,
            'width': width,
        };
    };

    /**
    #### .on(event,function)
    Attaches an event listener for events from this PixelLayer chart.
    **/
    _chart.on = function (e, _) {
        _listeners[e].push(_);
        return _chart;
    };

    return _chart;
}