/*******************************************************************************
main.js
*******************************************************************************/
// TODO Refine mask for bands (currently just a rectangle over the pixel area)?
// TODO Calculate similarities up front (w/ loading screen?)
// TODO Filter based on similarity?
// TODO "Overview" mode
// TODO Be able to select which bands to show based on sample
// TODO Better positioning when composites are split and layers are added **
// TODO Refine dropping rules? How do I create (X || Y) && (Z || A) && (B || C)?
// TODO semantic zooming
// TODO zooming with buttons should go from center of canvas

$(document).ready(function(){
    // Global functions used to customize PixelLayer display and behavior
    var valueAccessor = function(d){ return d.value; };
    var groupAccessor = function(d){ return d.class; };
    var pixelColor    = function(){
        // 'this' is the PixelLayer
        var count = this.expression().count();
        var not = this.expression().not();
        if(this.__old__){ return d3.rgb(239,72,95); }
        else if(not){ return "#ff983e"; }
        else if(count == 1){ return d3.rgb(79,137,207); }
        else if(this.operator() === "OR"){ return d3.rgb(255,255,0); }
        else{ return d3.rgb(156,247,71); }
    };
    var labelColor    = function(){
        // 'this' is the PixelLayer
        if(this.expression().not()){ return "#ff983e"; }
        else if(isComposite(this)){ return d3.rgb(156,247,71); }
        else{ return d3.rgb(79,137,207); }
    };
    var bandColor     = function(d){
        var baseColor = d3.rgb(84,84,84);
        if(d.a.faded() || d.b.faded()){
            return d3.interpolateRgb(d3.rgb(0,0,0), baseColor)(0.3);
        }
        return baseColor;
    }
    var bandScale     = d3.scale.linear()
    .domain([0,1])
    .range([2,35])
    .clamp(true);
    var zoomRange     = [0.05, 20];
    var zoomBtnScale  = d3.scale.pow()
    .domain([0,20])
    .range(zoomRange)
    .clamp(true)
    .exponent(2.5);
    
    /**
    #### isComposite(PixelLayer)
    Returns true if this PixelLayer contains more than one data set
    **/
    function isComposite(p){
        return p.expression().count() > 1;
    }
    
    /**
    ## ListController(element, dataSource)
    The controller for the lists on the page. Populates the lists from the data
    source.
    **/
    var ListController = function(el, ds){
        var _controls    = d3.select(el);
        var _elementBtn  = _controls.select('#elements-btn');
        var _elementList = _controls.select('#elements');
        var _caseBtn     = _controls.select('#samples-btn');
        var _caseList    = _controls.select('#samples');
        var _caseCount   = _controls.select('#sample-count');
        var _addAllBtn   = _controls.select('#add-all-btn');
        var _caseListObj = null;
        var _dataSource  = ds;
        var _obj         = {};
        
        var _listeners = {
            'mouseenter.element': [],
            'mouseenter.case': [],
            'mouseleave.element': [],
            'mouseleave.case': [],
            'click.element': [],
            'click.case': [],
            'add.case': [],
            'populated.elements': [],
            'populated.cases': [],
            'searched.elements': [],
            'searched.cases': [],
        };

        /**
        #### callListeners(event, this, [arg], ...)
        Calls the listeners of an event. Follows the same format as function.call().
        **/
        function callListeners(evt, thisObj){
            var args = Array.prototype.slice.call(arguments, 2);
            for(var i = 0; i < _listeners[evt].length; i++){
                _listeners[evt][i].apply(thisObj, args);
            }
        }

        /**
        #### applyListeners(event, this, [arg, ...])
        Calls the listeners of an event, except it takes an array of arguments
        instead of positional arguments, like function.apply()
        **/
        function applyListeners(evt, thisObj, args){
            for(var i = 0; i < _listeners[evt].length; i++){
                _listeners[evt][i].apply(thisObj, args);
            }
        }
        
        /**
        #### populateElements(elements)
        Populates the list of elements.
        **/
        function populateElements(elements){
            var options = {
                valueNames: ['name'],
                page: elements.length,
            };
            var items = _elementList.select('.list').selectAll('li')
            .data(elements);

            var newItems = items.enter()
            .append('li')
            .on('mouseenter.el', function(d){ callListeners('mouseenter.element', this, d); })
            .on('mouseleave.el', function(d){ callListeners('mouseleave.element', this, d); })
            .on('click.el', function(d){ callListeners('click.element', this, d); })

            newItems
            .append('span')
            .classed('name', true)
            .html(function(d){ return d.value; });

            elementList = new List('elements', options);
            elementList.sort('name');
            callListeners('populated.elements', _obj, elementList);
            
            elementList.on('searchStart', function(){
                var matching = elementList.matchingItems;
                callListeners('searched.elements', _obj, matching);
            });
        };
        
        /**
        #### populateCases
        Populates the list of cases.
        **/
        function populateCases(cases){
            // Create a searchable, sortable list using list.js and d3
            var options = {
                valueNames: ['name', 'count', 'class'],
            };
            var scale = d3.scale.linear()
            .domain([0, d3.max(cases, function(d){ return d.set().count(); })])
            .range([0, 100]);

            // Populate the list of samples
            var items = _caseList.select('.list').selectAll('li')
            .data(cases);
            var newItems = items.enter()
            .append('li')
            .on('mouseenter', function(d){ callListeners('mouseenter.case', _obj, d); })
            .on('mouseleave', function(d){ callListeners('mouseleave.case', _obj, d); });
            
            newItems.append('span')
            .classed('name', true)
            .html(function(d){ return d.label(); });
            newItems.append('span')
            .classed('count', true)
            .classed('hidden', true)
            .html(function(d){ return d.set().count(); });
            newItems.append('div')
            .classed('bar', true)
            .style('width', function(d){ return scale(d.set().count()) + "%"; });
            newItems.append('button')
            .attr('title', "Add")
            .html("+")
            .on('click', function(d){ callListeners('add.case', _obj, d); });
            
            
            // It appears that list.js is storing some things when a List
            // object is created, preventing things from working correctly if
            // you attempt to just re-create a List object where there was an
            // old one. Therefore, we must only create the List object once,
            // but we are free to completely replace the HTML with the original
            // values when the 'Def.' button is clicked
            if(!_caseListObj){
                _caseListObj = new List('samples', options);
                _caseList.select('.clear-sort')
                .on('click', function(d){
                    d3.selectAll('#samples .sort')
                    .classed('asc', false)
                    .classed('desc', false);
                    d3.selectAll('#samples .list li').remove();
                    populateCases(cases);
                });

                var matching = _caseListObj.matchingItems;
                var str = matching.length + " sample" + (matching.length == 1 ? "" : "s");
                _caseCount.text(str);
                
                _caseListObj.on('searchComplete', function(){
                    var matching = _caseListObj.matchingItems;
                    var str = matching.length + " sample" + (matching.length == 1 ? "" : "s");
                    _caseCount.text(str);
                    callListeners('searched.cases', _obj, matching);
                });
            }
        }
        
        /**
        #### .init()
        Initializes the controller and lists
        **/
        _obj.init = function(){
            var elements = _dataSource.elements().elements();
            populateElements(elements);
            populateCases(_dataSource.cases());
            
            // Hook up the list buttons
            _caseBtn.on('click', function(){
                _elementList.classed('hidden', true);
                _caseList.classed('hidden', function(){
                    return !d3.select(this).classed('hidden');
                });
            });
            _elementBtn.on('click', function(){
                _caseList.classed('hidden', true);
                _elementList.classed('hidden', function(){
                    return !d3.select(this).classed('hidden');
                });
            });
            _addAllBtn.on('click', function(){
                var cases = _caseList.select('.list').selectAll('li');
                var delta = 1.00 / cases[0].length;
                
                cases.each(function(d,i){
                    callListeners('add.case', _obj, d);
                });
            });
            
            return _obj;
        };
        
        /**
        #### .on(event,function)
        Attaches an event listener for events from this controller.
        **/
        _obj.on = function(e,f){
            _listeners[e].push(f);
            return _obj;
        };
        
        return _obj;
    };
    
    
    /**
    ## Controller(canvas, trash, bandsCB, zoom, DataSource)
    The main controller for the page.
    **/
    var Controller = function(canvas, trash, bandsCB, zoom, dataSource){
        var _canvas = canvas;
        var _trash = trash;
        var _data = dataSource;
        var _bandsCB = bandsCB;
        var _zoomDiv = zoom;
        var _obj = {};
        
        var _pixelLayers = [];
        var _dirtyLayers = [];
        var _similarityBands = [];
        var _masks = [];
        
        var _trashBounds = null;
        var _overlap = null;
        var _trashOverlap = false;
        
        var _zoom = d3.behavior.zoom()
        .scaleExtent(zoomRange);
        var _zoomScale = _zoom.scale();
        var _zoomPan   = _zoom.translate();
        var _zoomThrottle = null;
        
        var _selection = [];
        var _cleared;
        var _jaccard = false;
        
        /**
        #### .onMousedown()
        Handles the mousedown event from a PixelLayer.
        **/
        _obj.onMousedown = function(){};
        
        /**
        #### .onMouseup()
        Handles the mouseup event from a PixelLayer.
        **/
        _obj.onMouseup = function(){};
        
        
        _obj.onMouseEnter = function(){};
        
        
        _obj.onMouseLeave = function(){
            if(_selection.length >=1){
                d3.select('#element-label').html(_selection[4]);
                d3.select('#class-label').html(_selection[5]).classed("similar", true);
            }
        }
        
        
        /**
        #### .onCaseMouseenter(case)
        Handles the mouseenter event for a case
        **/
        _obj.onCaseMouseenter = function(c){
            if(_selection.length >= 1){ return; }
            // Find the pixel layers that contain the data case and fade the
            // others that do not contain it.
            _pixelLayers.forEach(function(p){
                if(!p.faded() && !p.expression().contains(c)){ p.fadeOut(0.4); }
            });
            
            d3.selectAll('path.band')
            .each(function(d){
                    // Bring the non-faded bands to the front
                    if(d.a.faded() || d.b.faded()){ d3.select(this).moveToBack(); }
                    // if(!d.a.faded() || !d.b.faded()){ d3.select(this).moveToFront(); }
                })
            .transition()
            .duration(500)
            .style('stroke', function(d){ 
                    // We spoof our own fading function to fade the 
                    if(!d.a.faded() || !d.b.faded()){ 
                        d = {
                            a: {faded: function(){ return false; }},
                            b: {faded: function(){ return false; }}
                        };
                    }
                    return bandColor(d); 
                });
        };
        
        /**
        #### .onCaseMouseleave(case)
        Handles the mouseleave event for a case
        **/
        _obj.onCaseMouseleave = function(c){
            if(_selection.length >= 1){ return; }
            // Return the pixel layers to full opacity
            _pixelLayers.forEach(function(p){
                if(p.faded()){ p.fadeIn(); }
            });
            d3.selectAll('path.band')
            .each(function(d){
                    // Bring the non-faded bands to the front
                    if(d.a.faded() || d.b.faded()){ d3.select(this).moveToBack(); }
                    // if(!d.a.faded() && !d.b.faded()){ d3.select(this).moveToFront(); }
                })
            .transition()
            .duration(500)
            .style('stroke', function(d){ return bandColor(d); });
        };
        
        /**
        #### .onElementMouseenter(element)
        Handles the mouseenter event for an element/pixel.
        **/
        _obj.onElementMouseenter = function(element, i, layer){
            if(_selection.length >=1){
                if(layer == null){ return; }
                else if(_selection.indexOf(layer.uuid()) == -1){ return; }
                else{             
                    var value = valueAccessor(element);
                    d3.select('#element-label').html(value);
                    _selection[3].a.selectAll('rect.pixel').classed('hover', function(d){
                        return valueAccessor(d) === value;
                    });
                    _selection[3].b.selectAll('rect.pixel').classed('hover', function(d){
                        return valueAccessor(d) === value;
                    });
                    return;
                }
            }
            
            var value = valueAccessor(element);
            var empty = d3.select(this).classed('empty');
            
            d3.select('#element-label').html(value);
            
            if(!empty){
                // Highlight any other instances of that element
                d3.selectAll('rect.pixel').classed('hover', function(d){
                    return valueAccessor(d) === value;
                });
                
                // Fade any pixel layers that do not contain the element
                _pixelLayers.forEach(function(p){
                    if(!p.faded() && !p.expression().value(element)){ p.fadeOut(0.4); }
                });
                
                // Update the band colorings, fading out if the band is
                // connected to a faded PixelLayer.
                fadeBands();
            }
        };
        
        /**
        #### .onElementMouseleave(element)
        Handles the mouseleave event for an element/pixel.
        **/
        _obj.onElementMouseleave = function(element, i, layer){
            if(_selection.length >=1){
                if(layer == null){ return; }
                else if(_selection.indexOf(layer.uuid()) == -1){ return; }
                else{
                    d3.select('#element-label').html("");
                    // d3.select('#element-label').html(_selection[4]);
        //                     d3.select('#class-label').html(_selection[5]);
        _selection[3].a.selectAll('rect.pixel').classed('hover', false);
        _selection[3].b.selectAll('rect.pixel').classed('hover', false);
        return;
        }
    }

        d3.select('#element-label').html("");
        d3.selectAll('rect.pixel').classed('hover', false);

        _pixelLayers.forEach(function(p){
        if(p.faded()){ p.fadeIn(); }
    });

            // Update the band colorings, fading in if applicable
            fadeBands();
        };
        
        /**
        #### .onGroupMouseenter(element)
        Handles the mouseenter event for a group of elements/pixels.
        **/
        _obj.onGroupMouseenter = function(group, layer){
            if(_selection.length >=1){
                if(layer == null){ return; }
                else if(_selection.indexOf(layer.uuid()) == -1){ return; }
            }
            d3.select('#class-label').html(group).classed('similar', false);
        };
        
        /**
        #### .onGroupMouseleave(element)
        Handles the mouseleave event for a group of elements/pixels.
        **/
        _obj.onGroupMouseleave = function(group, layer){
            if(_selection.length >=1){
                if(layer == null){ return; }
                else if(_selection.indexOf(layer.uuid()) == -1){ return; }
            }
            d3.select('#class-label').html("").classed('similar', false);
        };
        
        /**
        #### .onDragstart()
        Called when the dragging operation on a PixelLayer object starts.
        **/
        _obj.onDragstart = function(){
            clearSelection();
            // Bring the dragged PixelLayer object to the front of the layers
            // externally and internally
            moveToFront(this);
            // Display the trash icon
            d3.select('#trash').classed("hidden", false);
        };
        
        /**
        #### .onDrag()
        Called whenever a PixelLayer is dragged about the canvas.
        **/
        _obj.onDrag = function(){
            // Cancel event propagation so that the zoom behavior doesn't kick
            // in.
            d3.event.sourceEvent.stopPropagation();
            checkLayerOverlap(this);
            checkTrashOverlap(this);
            drawBands();
            setMasks();
        };
        
        /**
        #### checkLayerOverlap(PixelLayer)
        Performs checks to determine if a PixelLayer has been dragged on top
        of another one. The onLayerOverlapEnter and onLayerOverlapLeave
        functions are called when the state changes.
        **/
        function checkLayerOverlap(pl){
            var mouse = d3.mouse(d3.select(_canvas).node());
            var mouseX = mouse[0];
            var mouseY = mouse[1];
            var bounds = {
                'top': mouse[1],
                'left': mouse[0],
                'bottom': mouse[1],
                'right': mouse[0],
            };
            var uuid = pl.uuid();
            var overlap = null;
            // Find the first layer that is overlapped
            for(var i = 0; i < _pixelLayers.length; i++){
                var p = _pixelLayers[i];
                if(p.uuid() === uuid){ continue; }
                if(rectOverlap(bounds, p.boundingRect(_zoomScale, _zoomPan))){ 
                    overlap = p; 
                    break;
                }
            }
            if(_overlap == null && overlap != null){
                _overlap = p;
                _obj.onLayerOverlapEnter(pl, _overlap);
            }
            else if(_overlap != null && overlap == null){
                _obj.onLayerOverlapLeave(pl, _overlap);
                _overlap = null;
            }
            else if(_overlap != null && overlap != null){
                // We passed from one overlapping item to another without
                // breaking
                if(p.uuid() != _overlap.uuid()){
                    _obj.onLayerOverlapLeave(pl, _overlap);
                    _overlap = p;
                    _obj.onLayerOverlapEnter(pl, _overlap);
                }
            }
        }
        
        /**
        #### checkTrashOverlap(PixelLayer)
        Checks for overlap between the given PixelLayer and the trash icon.
        The onTrashOverlapEnter and onTrashOverlapLeave functions are called
        when the state changes.
        **/
        function checkTrashOverlap(pl){
            var overlap = rectOverlap(pl.boundingRect(_zoomScale, _zoomPan), _trashBounds);
            if(!_trashOverlap && overlap){
                _trashOverlap = true;
                _obj.onTrashOverlapEnter(pl);
            }
            else if(_trashOverlap && !overlap){
                _trashOverlap = false;
                _obj.onTrashOverlapLeave(pl);
            }
        }
        
        /**
        #### getTrashBounds()
        Returns the bounding rectangle for the trash icon. Requires jQuery
        **/
        function getTrashBounds(){
            // By far, the easiest way to do this is with jQuery. They handle a
            // lot of cross-browser and calculation junk for you.
            var trash = $('#trash');
            var x = trash.offset().left;
            var y = trash.position().top;
            var width = trash.outerWidth();
            var height = trash.outerHeight();
            return {
                top: y,
                left: x,
                bottom: y + height,
                right: x + width,
                width: width,
                height: height,
            };
        }
        
        /**
        #### .onDragend()
        Called when the dragging of a PixelLayer ends. Calls the onLayerDrop
        function if the PixelLayer is dropped onto another one.
        **/
        _obj.onDragend = function(){
            if(_trashOverlap){ 
                _obj.onTrashDrop(this);
                _trashOverlap = false;
            }
            else if(_overlap != null){ 
                _obj.onLayerDrop(this, _overlap); 
                _overlap = null;
            }
            
            // Hide the trash icon
            d3.select('#trash').classed("hidden", true);
        };
        
        /**
        #### .onLayerOverlapEnter(dragged,overlapped)
        Called when a PixelLayer beings overlapping another.
        **/
        _obj.onLayerOverlapEnter = function(a,b){
            // Preview the merge that would occur if the layer is dropped onto
            // the other.
            a.__old__ = a.expression();
            b.__old__ = b.expression();
            
            var previewExpr = b.__old__.preview(a.__old__);
            // Force the preview to display an "AND"
            previewExpr.root().operator('AND'); 
            a.expression(previewExpr).preview();
            b.expression(previewExpr).preview();
        };
        
        /**
        #### .onLayerOverlapLeave(dragged,overlapped)
        Called when a PixelLayer is no longer overlapping another.
        **/
        _obj.onLayerOverlapLeave = function(a,b){
            // Restore the layers to their "non-preview" state
            a.expression(a.__old__);
            b.expression(b.__old__);
            delete a.__old__;
            delete b.__old__;
            a.redraw();
            b.redraw();
        };
        
        /**
        #### .onLayerDrop(dragged,target)
        Called when a PixelLayer is dragged and dropped upon another.
        **/
        _obj.onLayerDrop = function(a,b){
            // Restore the non-preview layers
            _obj.onLayerOverlapLeave(a,b);
            
            // Merge the layers to create a "composite" layer
            b.expression().merge(a.expression(), false);
            b.redraw();
            removeLayer(a);
            
            // Update the similarity bands
            updateBands([b]);
        };
        
        /**
        #### .onTrashOverlapEnter(PixelLayer)
        Called when a PixelLayer is dragged over the trash icon.
        **/
        _obj.onTrashOverlapEnter = function(p){
            d3.select('#trash').classed('hover', true);
        };
        
        /**
        #### .onTrashOverlapLeave(PixelLayer)
        Called when a PixelLayer no longer overlaps the trash icon.
        **/
        _obj.onTrashOverlapLeave = function(p){
            d3.select('#trash').classed('hover', false);
        };
        
        /**
        #### .onTrashDrop(PixelLayer)
        Called when a PixelLayer is dragged and dropped onto the trash icon.
        **/
        _obj.onTrashDrop = function(p){
            // Call some of the event handlers to reset the state of things
            _obj.onTrashOverlapLeave(p);
            if(_overlap != null){ _obj.onLayerOverlapLeave(p,_overlap); }
            _obj.onElementMouseleave();
            _obj.onGroupMouseleave();
            _overlap = null;
            
            removeLayer(p);
            updateBands();
        };
        
        /**
        #### removeLayer(PixelLayer)
        Removes a PixelLayer from the canvas.
        **/
        function removeLayer(p){
            var uuid = p.uuid();
            for(var i = 0; i < _pixelLayers.length; i++){
                if(_pixelLayers[i].uuid() === uuid){
                    _pixelLayers.splice(i,1);
                    break;
                }
            }
            p.remove();
        }
        
        /**
        #### moveToFront(PixelLayer)
        Moves a PixelLayer to the front of the canvas
        **/
        function moveToFront(p){
            p.moveToFront();
            var uuid = p.uuid();
            for(var i = 0; i < _pixelLayers.length; i++){
                if(_pixelLayers[i].uuid() === uuid){
                    _pixelLayers.splice(i,1);
                    _pixelLayers.unshift(p);
                    break;
                }
            }
        }
        
        /**
        #### .onLabelDrag(label)
        Called when a label belonging to a PixelLayer is dragged.
        **/
        _obj.onLabelDrag = function(l){
            // We only split when a label with depth 0 is dragged
            if(!isComposite(this) || l.depth > 0){ return; }
            
            // Split the composite layer
            var node = l.node;
            var newExpr;
            if(isOperatorNode(node)){
                newExpr = SetExpression(node, _data.elements());
            }
            else{
                var newOp = OperatorNode('AND');
                newOp.addChild(node);
                newExpr = SetExpression(newOp, _data.elements());
            }
            
            l.parent.removeChild(node);
            
            // Flatten the remaining expression.
            var oldExpr = this.expression();
            oldExpr.flatten();
            
            // Create a new PixelLayer in the position of this one.
            createPixelLayer(oldExpr)
            .x(this.x())
            .y(this.y())
            .render();
            // Change the expression of this PixelLayer to be the expression
            // split off from the old. This keeps the dragging intact.
            moveToFront(this);
            this.expression(newExpr).redraw();
            
            // Update the similarity bands
            updateBands([this,]);
        };
        
        
        /**
        #### split(PixelLayer)
        Splits a pixel layer into its composed layers. Only the first level is
        split.
        **/
        function split(pl){
            var newExprs = pl.expression().split();
            newExprs.forEach(function(e){
                createPixelLayer(e).render();
            });
            removeLayer(pl);
            updateBands();
        }
        
        /**
        #### .onSplitClick()
        Handles the 'click.split' event from a PixelLayer
        **/
        _obj.onSplitClick = function(){
         split(this); 
     };

        /**
        #### .onOperatorChange(PixelLayer)
        Called when the operator of a pixel layer changes
        **/
        _obj.onOperatorChange = function(d){
            updateBands([this,]);
        };
        
        /**
        #### clipPoint(point, point, rect)
        Uses a simplified Lian-Barsky algorithm to determine the clip point of a
        line (specified by two points) within a rectangle.
        **/
        function clipPoint(p1, p2, rect){
            var p = [p1.x - p2.x, p2.x - p1.x, p1.y - p2.y, p2.y - p1.y];
            var q = [p1.x - rect.left, rect.right - p1.x, p1.y - rect.top, rect.bottom - p1.y];
            
            var u1 = 0;
            var u2 = 1;
            d3.range(4).forEach(function(k){
                // Completely outside the rectangle
                if(p[k] == 0){
                    if(q[k] < 0){ return null; }
                }
                else{
                    var u = q[k] / p[k];
                    // Outside -> inside
                    if(p[k] < 0 && u1 < u){ u1 = u; }
                    // Inside -> outside
                    else if(p[k] > 0 && u2 > u){ u2 = u; }
                }
            });
            
            // Completely outside the rectangle
            if (u1 > u2){ return null; }
            
            // Return the clipping point of the line where it passes from inside
            // of the rectangle to the outside
            return {
                x: p1.x + (p[1] * u2), 
                y: p1.y + (p[3] * u2),
            };
        }
        
        /**
        #### toggleBands([boolean])
        Shows/hides the similarity bands. Default behavior is to toggle the
        current state. A boolean can be passed in to force a state.
        **/
        _obj.toggleBands = function(b){
            clearSelection();
            var bands = d3.select(_canvas).select('g.bands');
            var hide  = b == undefined ? !bands.classed('hidden') : !b;
            bands.classed('hidden', hide);
            showMetric(b);
            return _obj;
        };
        
        
        function showMetric(b){
            var metric = d3.select('#metric');
            var zoom = d3.select('#zoom');
            
            if(b){
                metric.classed('hidden', false);
                metric.transition()
                .duration(500)
                .style('height', "22px")
                .style('padding-bottom', "2px")
                .each('end', function(){
                    d3.select(this).select('select')
                    .classed('invisible', false);
                });
                zoom.transition()
                .duration(500)
                .style('top', "109px");
            }
            else{
                metric.select('select')
                .classed('invisible', true);
                metric.transition()
                .duration(500)
                .style('height', "0px")
                .style('padding-bottom', "0px")
                .each('end', function(){ d3.select(this).classed('hidden', true); })
                zoom.transition()
                .duration(500)
                .style('top', "85px");
            }
            
            
            
        }
        
        
        /**
        #### .onBandMouseenter()
        Called when the mouse enters a similarity band.
        **/
        _obj.onBandMouseenter = function(d){
            if(_selection.length >= 1){ return; }
            d3.select(this).classed('hover', true);
            
            _pixelLayers.forEach(function(p){
                var uuid = p.uuid();
                if(uuid === d.a.uuid() || uuid === d.b.uuid()){ return; }
                p.fadeOut();
            });
            fadeBands();
            
            // Find the common elements (intersection) and highlight them
            var setA = d.a.asSet();
            var setB = d.b.asSet();
            var common = setA.intersection(setB);
            d.a.selectAll('rect.pixel')
            .classed('similar', function(d){ return common.has(d); });
            d.b.selectAll('rect.pixel')
            .classed('similar', function(d){ return common.has(d); });

            if(_jaccard){
                var format = d3.format(".3f");
                d3.select('#element-label').html("Jaccard similarity: " + format(d.similarity));
            }
            else{
                var count = _data.elements().count();
                // Round to deal with floating point errors
                var matched = Math.round(d.similarity * count);
                d3.select('#element-label').html(matched + " matched states");
            }
            d3.select('#class-label').html(common.count() + " shared elements");
            d3.select('#class-label').classed('similar', true);
        };
        
        /**
        #### .onBandMouseleave()
        Called when the mouse leaves a similarity band.
        **/
        _obj.onBandMouseleave = function(d){
            if(_selection.length >= 1){ return; }
            
            d3.select(this).classed('hover', false);
            d3.select('#element-label').html("");
            d3.select('#class-label').html("");
            d3.select('#class-label').classed('similar', false);
            
            _pixelLayers.forEach(function(p){
                p.fadeIn();
            });
            fadeBands();

            if(_selection.indexOf(d.a) == -1){
                d.a.selectAll('rect.pixel')
                .classed('similar', false);
            }
            if(_selection.indexOf(d.b) == -1){
                d.b.selectAll('rect.pixel')
                .classed('similar', false);
            }
        };
        
        /**
        #### .onBandClick()
        Called when a similarity band is pressed
        **/
        _obj.onBandClick = function(d){
            if(_cleared){ return; }
            var label1 = d3.select('#element-label').html()
            var label2 = d3.select('#class-label').html();
            
            _selection = [d.a.uuid(), d.b.uuid(), this, d, label1, label2];
            d3.event.stopPropagation();
            
            _pixelLayers.forEach(function(p){
                p.highlight(false);
                if(_selection.indexOf(p.uuid()) == -1){
                    p.highlightGroups(false);
                }
            });
        };
        
        /** 
        #### updateBands(dirty)
        Helper function that updates the similarity bands on the page. The
        function tries to update them intelligently, only recalculating
        similarities if there is a new band to add or remove, but if any "dirty"
        pixel layers are passed in to the function, bands connected to them will
        for sure be updated.
            **/
        function updateBands(d){
            var dirty = d == undefined ? [] : d;
            _similarityBands = createBands(dirty);
            drawBands();
            setMasks();
        }
        
        /**
        #### fadeBands()
        Fades the similarity bands on the page
        **/
        function fadeBands(){
            d3.selectAll('path.band')
            .each(function(d){
                    // Bring the non-faded bands to the front
                    if(d.a.faded() || d.b.faded()){ d3.select(this).moveToBack(); }
                    // if(!d.a.faded() && !d.b.faded()){ d3.select(this).moveToFront(); }
                })
            .transition()
            .duration(500)
            .style('stroke', function(d){ return bandColor(d); });
        }
        
        /**
        #### .drawBands()
        Draws the similarity bands on the chart
        **/
        function drawBands(){
            var path = d3.svg.diagonal()
            .source(function(d){
                return {
                    x: d.a.x() + (d.a.width() / 2),
                    y: d.a.y() + (d.a.height() / 2),
                };
            })
            .target(function(d){
                return {
                    x: d.b.x() + (d.b.width() / 2),
                    y: d.b.y() + (d.b.height() / 2),
                };
            });
            
            var bandG = d3.select(_canvas).select('g.bands');
            var bands = bandG.selectAll('path.band')
            .data(_similarityBands);

            // ENTER
            bands.enter()
            .append('path')
            .classed('band', true);

            // ENTER + UPDATE
            bands
            .attr('d', path)
            .style('stroke-width', function(d){ return bandScale(d.similarity); })
            .style('stroke', function(d){ return bandColor(d); })
            .style('fill', "none")
            .each(function(d){
                    // Bring the non-faded bands to the front
                    if(d.a.faded() || d.b.faded()){ d3.select(this).moveToBack(); }
                    // if(!d.a.faded() && !d.b.faded()){ d3.select(this).moveToFront(); }
                })
            .on('mouseenter', _obj.onBandMouseenter)
            .on('mouseleave', _obj.onBandMouseleave)
            .on('click', _obj.onBandClick);
            
            // EXIT
            bands.exit().remove();
        }
        
        /**
        #### setMasks()
        Sets the masks for masking the bands to the PixelLayers
        **/
        function setMasks(){
            var maskG = d3.select(_canvas).select('g.masks');
            var masks = maskG.selectAll('rect.mask')
            .data(_pixelLayers, function(p){ return p.uuid(); });

            // ENTER
            masks.enter()
            .append('svg:rect')
            .attr('id', function(p){ return "mask-" + p.uuid(); })
            .classed('mask', true);

            // UPDATE + ENTER
            masks
            .attr('x', function(p){ return p.x(); })
            .attr('y', function(p){ return p.y(); })
            .attr('width', function(p){ return p.width(); })
            .attr('height', function(p){ return p.height() + 20; })
            .attr('fill', "black");
            
            masks.exit().remove();
        }
        
        /**
        #### createBands(dirty)
        Calculates the similarity metric for all PixelLayers on the canvas and
        creates the corresponding data structures for drawing them. Any pixels
        layers passed in an array to the function will have the bands recreated,
        forcing an update.
        **/
        function createBands(d){
            // Create all pairs of pixelLayers
            var combos = combinations(_pixelLayers, 2);
            var dirty = d == undefined ? [] : d;
            var bands = [];
            var elements = _data.elements();
            var dirtyCount = 0;
            var reusedCount = 0;
            var createdCount = 0;
            var removedCount = 0;
            
            function findBand(p){
                var uuid0 = p[0].uuid();
                var uuid1 = p[1].uuid();
                var found = null;
                
                _similarityBands.forEach(function(sb){
                    var uuidA = sb.a.uuid();
                    var uuidB = sb.b.uuid();
                    if((uuid0 === uuidA && uuid1 === uuidB) ||
                     (uuid0 === uuidB && uuid1 === uuidA)){
                     found = sb;
                 return;
                     }
                 });
                return found;
            }
            
            combos.forEach(function(p){
                var uuid0 = p[0].uuid();
                var uuid1 = p[1].uuid();
                
                // Reuse any existing bands unless a pixel layer has been marked
                // as dirty.
                var reuse = true;
                dirty.forEach(function(pl){
                    var uuid = pl.uuid();
                    if(uuid === uuid0 || uuid === uuid1){
                        dirtyCount += 1;
                        reuse = false; 
                    }
                });
                
                if(reuse){
                    var found = findBand(p);
                    if(found != null){ 
                        reusedCount += 1;
                        bands.push(found);
                        return;
                    }
                }
                
                var similarity;
                if(_jaccard){
                    similarity = p[0].expression().jaccard(p[1].expression(), elements);
                }
                else{
                    similarity = p[0].expression().similarity(p[1].expression(), elements);
                }

                // Create a new band
                bands.push({
                    a: p[0],
                    b: p[1],
                    similarity: similarity
                });
                createdCount += 1;
            });
            removedCount = Math.max(_similarityBands.length - bands.length, 0);
            return bands;
        }   

        function clearSelection(){
            if(_selection.length < 1){ 
                _cleared = false;
                return; 
            }
            var _this = _selection[2];
            var band = _selection[3];
            _selection = [];
            _obj.onBandMouseleave.call(_this, band);
            _pixelLayers.forEach(function(p){
                p.highlight(true);
                p.highlightGroups(true);
            });
            _cleared = true;
        }

        /**
        #### .onZoomstart()
        Called when the zoom event starts.
        **/
        _obj.onZoomstart = function(){};

        
        /**
        #### .onZoom()
        Called when the zoom event occurs.
        **/
        _obj.onZoom = function(){
            d3.select(_canvas + " g.layers")
            .attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
            d3.select(_canvas + " g.masks")
            .attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
            d3.select(_canvas + " g.bands")
            .attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
            _zoomScale = _zoom.scale();
            _zoomPan   = _zoom.translate();
            
            var zoomDiv = d3.select(_zoomDiv);
            zoomDiv.select('#zoom-level').html(Math.round(_zoomScale * 100) + "%");
            zoomDiv.select('#zoom-out-btn').classed('disabled', function(d){ return zoomRange[0] == _zoomScale; });
            zoomDiv.select('#zoom-in-btn').classed('disabled', function(d){ return zoomRange[1] == _zoomScale; });
        };

        /**
        #### .onZoomend()
        Called when the zoom event ends.
        **/ 
        _obj.onZoomend = function(){

        };
        
        /**
        #### .scale()
        Gets or sets the current zoom scale.
        **/
        _obj.scale = function(s){
            if(!arguments.length){ return _zoomScale; }
            _zoom.scale(s);
            _zoomScale = _zoom.scale();
            _zoom.event(d3.select(_canvas));
            return _obj;
        };
        
        /**
        #### createPixelLayer(expression)
        Creates a new pixellayer object from the given set expression.
        **/
        function createPixelLayer(expression){
            var row = parseInt(_pixelLayers.length / 5);
            var col = _pixelLayers.length - row * 5;
            
            //Calculate rows and columns
            var numrows = 20;
            var numcols = 20;
            var numElements = _data.elements().elements().length;
            if(numElements < 400) { 
                numrows = Math.ceil(Math.sqrt(numElements));
                numcols = numrows;
            }
            
            var pl = PixelLayer(_canvas + " g.layers")
            .elements(_data.elements().elements())
            .expression(expression)
            .pixelColor(pixelColor)
            .labelColor(labelColor)
            .x((col * (184 + 30) + 30) - _zoomPan[0])
            .y((row * (184 + 30) + 60) - _zoomPan[1])
            .rows(numrows)
            .columns(numcols)
            .on('mousedown', _obj.onMousedown)
            .on('mouseup', _obj.onMouseup)
            .on('mouseenter', _obj.onMouseEnter)
            .on('mouseleave', _obj.onMouseLeave)
            .on('mouseenter.pixel', _obj.onElementMouseenter)
            .on('mouseleave.pixel', _obj.onElementMouseleave)
            .on('mouseenter.group', _obj.onGroupMouseenter)
            .on('mouseleave.group', _obj.onGroupMouseleave)
            .on('dragstart', _obj.onDragstart)
            .on('drag', _obj.onDrag)
            .on('dragend', _obj.onDragend)
            .on('drag.label', _obj.onLabelDrag)
            .on('change.operator', _obj.onOperatorChange)
            .on('click.split', _obj.onSplitClick);
            _pixelLayers.unshift(pl);
            return pl;
        }
        
        /**
        #### .drawPixelLayer(dataCase)
        Draws a new PixelLayer.
        **/
        _obj.drawPixelLayer = function(dataCase){
            clearSelection();
            
            // Construct the SetExpression
            var node = DataNode(dataCase);
            var operator = OperatorNode('AND');
            var expression = SetExpression(operator, _data.elements());
            operator.addChild(node);
            
            expression.not();
            
            // Create and render the pixel layer
            var pl = createPixelLayer(expression).render();
            updateBands();
        };
        
        /**
        #### .init()
        Initializes the contoller.
        **/
        _obj.init = function(){    
            // In order to get the correct boundaries of the trash icon, we
            // need to briefly unhide it.
            d3.select(_trash).classed('hidden', false);
            _trashBounds = getTrashBounds();
            d3.select(_trash).classed('hidden', true);
            
            // Create the groups for the bands and the pixelLayers
            var bandG = d3.select(_canvas).append('svg:g');
            bandG.append('svg:g')
            .classed('bands', true)
            .classed('hidden', true);
            bandG.append('svg:g')
            .classed('masks', true);
            
            d3.select(_canvas).append('svg:g')
            .classed('layers', true);

            // Hook up zoom events
            _zoom
            .on('zoomstart', _obj.onZoomstart)
            .on('zoom', _obj.onZoom)
            .on('zoomend', _obj.onZoomend);
            d3.select(_canvas).call(_zoom);

            // Hook up the similarity checkbox
            d3.select(_bandsCB)
            .on('change', function(d){ _obj.toggleBands(this.checked); });

            // Hook up the zoom buttons
            var zoomStep = 0;
            d3.select(_zoomDiv).select('#zoom-in-btn')
            .on('mousedown', function(d){
                    // TODO: Set interval to listen to repeated mouse clicks
                    var invert = zoomBtnScale.invert(_zoomScale) + 1;
                    _obj.scale(zoomBtnScale(invert)); 
                });
            d3.select(_zoomDiv).select('#zoom-out-btn')
            .on('click', function(d){ 
                var invert = zoomBtnScale.invert(_zoomScale) - 1;
                _obj.scale(zoomBtnScale(invert)); 
            });

            // Hook up the metric selection
            d3.select('#metric select').on('change', function(){
                var option = this.options[this.selectedIndex].value;
                if(option == "jaccard"){ _jaccard = true; }
                else{ _jaccard = false; }
                updateBands(_pixelLayers);
            });

            // Hook up events to clear the selection
            d3.select(_canvas).on('mousedown', clearSelection);
            return _obj;
        };
        
        return _obj;
    };

    //Check if data is custom or template
    var datatype = sessionStorage.getItem("datatype");
    if(datatype === "custom") {
        var dataSource = DataSource()
        .on('success', dataLoaded);
        dataSource.loadCustomData(sessionStorage.getItem("data"));
    } else if(datatype === "template") {
        // Load the data
        var dataSource = DataSource(sessionStorage.getItem("url"))
        .on('success', dataLoaded);
        dataSource.loadURL();

    } else {

    }   

    function dataLoaded(elements, cases){
        // Initialize the main controller
        var controller = Controller("#canvas", "#trash", "#bands-cb", "#zoom", this).init();
        
        // Initialize the lists
        var listController = ListController('#controls', this)
        // Set up cross-controller communication
        .on('add.case', controller.drawPixelLayer)
        .on('mouseenter.element', controller.onElementMouseenter)
        .on('mouseenter.element', function(d){ controller.onGroupMouseenter(groupAccessor(d)); })
        .on('mouseleave.element', controller.onElementMouseleave)
        .on('mouseleave.element', function(d){ controller.onGroupMouseleave(groupAccessor(d)); })
        .on('mouseenter.case', controller.onCaseMouseenter)
        .on('mouseleave.case', controller.onCaseMouseleave)
        .init();

        //Open list of elements
        document.getElementById("samples-btn").click();
    }
});
