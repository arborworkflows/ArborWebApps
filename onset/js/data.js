var COMPOUND_COUNT = 225;

/**
## DataSource
The data source for general user-input data.
**/
var DataSource = function(samplesURL){
    var _elements     = null;
    var _cases        = null;
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
    function toDataCase(data){
        // Map the element names found in the data file to element objects found
        // in the compounds set and restrict to be a subset of the compounds set
        // The first element in the data is the case identifier, so it is
        // removed.
        var compounds = _obj.elements();
        var elements = data.slice(1)
        .map(function(d){ 
            return compounds.find(d);
        })
        .filter(function(d){ 
            return d != undefined || d != null; 
        });

        return DataCase(data[0], Set(elements, compoundHash));
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
    
    _obj.loadURL = function(data){
        compoundList = d3.map();
        // Get the compounds. They represent the elements of the universal set.
        d3.text(_samplesURL, function(err, txt){
            if(txt == null){ callListeners('fail', _obj, err); return; }
            d3.csv.parseRows(txt, extractCompounds);
            
            // Sort by number of occurences
            compoundListArray = d3.entries(compoundList).sort(function(a, b) {
                return b.value - a.value;
            })
            .map(function(d) {
                return {
                    // d3.map() inserts a NUL character at the beginning of its
                    // keys that needs to be removed. Otherwise, we won't ever
                    // be able to find items in the elements set.
                    'value': d['key'].replace("\x00", ""),
                    'fullCount': parseInt(d['value']),
                    'class': ''
                };
            });

            _elements = Set(compoundListArray, compoundHash);

            d3.text(_samplesURL, function(err, txt){
                if(txt == null){ callListeners('fail', _obj, err); return; }
                _cases = d3.csv.parseRows(txt, toDataCase);
                callListeners('success', _obj, _elements, _cases);
            });
        });

        return _obj;
    };
    
    _obj.loadCustomData = function(txt){
        compoundList = d3.map();
        // Get the compounds. They represent the elements of the universal set.
        
        if(txt == null){ callListeners('fail', _obj, err); return; }
        d3.csv.parseRows(txt, extractCompounds);
        
        // Sort by number of occurences
        compoundListArray = d3.entries(compoundList).sort(function(a, b) {
            return b.value - a.value;
        })
        .map(function(d) {
            return {
                // d3.map() inserts a NUL character at the beginning of its
                // keys that needs to be removed. Otherwise, we won't ever
                // be able to find items in the elements set.
                'value': d['key'].replace("\x00", ""),
                'fullCount': parseInt(d['value']),
                'class': ''
            };
        });

        _elements = Set(compoundListArray, compoundHash);

        _cases = d3.csv.parseRows(txt, toDataCase);
        callListeners('success', _obj, _elements, _cases);


        return _obj;
    };

    function extractCompounds(data) {
        data.slice(1)
        .forEach(function(d) {
            if(d == "") {
                return;
            } else if(compoundList.has(d)) {
                compoundList.set(d, compoundList.get(d) + 1);
            } else {
                compoundList.set(d, 1);
            }
        })
    }
    
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