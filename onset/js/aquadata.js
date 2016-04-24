var COMPOUND_COUNT = 225;

/**
## AquaDataSource
The data source for AquaViz data.
**/
var AquaDataSource = function(compoundsURL, samplesURL){
    var _elements     = null;
    var _cases        = null;
    var _compoundsURL = compoundsURL;
    var _samplesURL   = samplesURL;
    var _obj          = SetDataSource();
    
    var _listeners    = {
        'success': [],
        'fail': [],
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
    
    // Converts the data read in from the compounds data file into a "clean"
    // object ready to be stored in a Set.
    function toElement(d){
        return {
            'value': d['Row Labels'],
            'fullCount': parseInt(d['Count of ALL']),
            'class': d['HMDB Class'],
        };
    }
    
    // Converts data from the samples data file into DataCase objects.
    function toDataCase(d){
        // Map the element names found in the data file to element objects found
        // in the compounds set and restrict to be a subset of the compounds set
        var compounds = _obj.elements();
        var elements = d.slice(1)
            .map(function(d){ 
                return compounds.find(d);
            })
            .filter(function(d){ 
                return d != undefined || d != null; 
            });
            
        return DataCase(d[0], Set(elements, compoundHash));
    }
    
    // Used as the hash function to store compounds in sets.
    function compoundHash(e){
        return e.value;
    }
    
    _obj.elements = function(){
        return _elements;
    };
    
    _obj.cases = function(){
        return _cases;
    };
    
    _obj.load = function(){
        // Get the compounds. They represent the elements of the universal set.
        d3.csv(_compoundsURL, toElement, function(err, rows){
            if(rows == null){ callListeners('fail', _obj, err); return; }
            
            _elements = Set(rows, compoundHash);
            
            // Get the data cases (samples). We loaded the compounds first so
            // that we can map the elements in the samples to the elements in
            // the compound set, i.e., we want the samples to contain the same
            // objects as the compound set, complete with metadata, such as
            // class, count, etc.
            d3.text(_samplesURL, function(err, txt){
                if(txt == null){ callListeners('fail', _obj, err); return; }
                _cases = d3.csv.parseRows(txt, toDataCase);
                callListeners('success', _obj, _elements, _cases);
            });
        });

        return _obj;
    };
    
    /**
    #### .on(event,function)
    Attaches an event listener for events from this PixelLayer chart.
    **/
    _obj.on = function(e,f){
        _listeners[e].push(f);
        return _obj;
    };
    
    return _obj;
};