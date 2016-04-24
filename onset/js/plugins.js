// Avoid `console` errors in browsers that lack a console.
(function() {
    var method;
    var noop = function () {};
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = (window.console = window.console || {});

    while (length--) {
        method = methods[length];

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
    }
}());


/**
#### createUUID()
Creates a Universally Unique Identifier. Taken from
http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
**/
function createUUID() {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
    s[8] = s[13] = s[18] = s[23] = "-";
    var uuid = s.join("");
    return uuid;
}


/**
#### gcd(int,int)
Calculates the greatest common divisor of two integers using Euclidian's 
algorithm.
**/
function gcd(a,b){
    var t;
    while (b != 0){
        t = b;
        b = a % b;
        a = t;
    }
    return a;
}


/**
#### lcm(int,int)
Calculates the least common multiple of two integers.
**/
function lcm(a,b){
    return (a * b / gcd(a, b));
}


/**
Creates all combinations of length m from an array using Chase's "twiddle"
algorithm. Adapted from http://www.netlib.no/netlib/toms/382.
**/
function combinations(arr, m){
    var m = m;
    var n = arr.length;
    var p = [];
    var combinations = [];
    if(n < m){ return combinations; }
    
    // Initialize the p array
    p[0] = n + 1;
    for(var i = 1; i <= n - m; i++){
        p[i] = 0;
    }
    var a = 1;
    for(var i = n - m + 1; i <= n; i++){
        p[i] = a;
        a++; 
    }
    p[n + 1] = -2;
    
    // Initialize the first combo
    var c = [];
    var a = n - m;
    for(var i = 0; i < m; i++){
        c[i] = arr[a];
        a++; 
    }
    combinations.push(c.slice(0));
    
    // Perform the "twiddle"
    var i,j,k;
    var x,y,z;
    function twiddle(){
        j = 1;
        while(p[j] <= 0){ j++; }
        if(p[j - 1] == 0){
            for(i = j -1; i != 1; i--){ p[i] = -1; }
            p[j] = 0;
            x = z = 0;
            p[1] = 1;
            y = j - 1;
        }
        else{
            if(j > 1){ p[j - 1] = 0; }
            do{
                j++;
            }while(p[j] > 0);
            k = j - 1;
            i = j;
            while(p[i] == 0){ p[i++] = -1; }
            if(p[i] == -1){
                p[i] = p[k];
                z = p[k] - 1;
                x = i - 1;
                y = k - 1;
                p[k] = -1;
            }
            else{
                if(i == p[0]){ return true; }
                else{
                    p[j] = p[i];
                    z = p[i] - 1;
                    p[i] = 0;
                    x = j - 1;
                    y = i - 1;
                }
            }
        }
        return false;
    }
    
    while(!twiddle()){
        c[z] = arr[x];
        combinations.push(c.slice(0));
    }
    return combinations;
}


/**
#### rectOverlap(bound, bound)
Given two bounding rectangles, returns true if they overlap or intersect.
**/
function rectOverlap(a, b){
    return (a.left < b.right && a.right > b.left &&
            a.top < b.bottom && a.bottom > b.top);
}


/**
#### pointDistance(p1, p2)
Calculates the distance between two points.
**/
function pointDistance(p1, p2){
  var xs = 0;
  var ys = 0;
  xs = p2.x - p1.x;
  xs = xs * xs;
  ys = p2.y - p1.y;
  ys = ys * ys;
  return Math.sqrt( xs + ys );
}

/**
#### isArray(object)
Returns true if the object is an array
**/
function isArray(item) {
    return Object.prototype.toString.call(item) === "[object Array]";
}


/**
#### isObject(object)
Returns true if the object is an object
**/
function isObject(item){
    return Object.prototype.toString.call(item) === "[object Object]";
}


/**
#### isFunction(object)
Returns true if the object is a function
**/
function isFunction(item){
    return Object.prototype.toString.call(item) === "[object Function]";
}


/**
#### Events(object, events)
Given an object and array of event names, it will create the mechanisms for 
event callbacks. The object passed in will have the following methods defined:
 .on(evt, function)
    Registers a listener for the given event
 .removeListener(evt, function)
    Removes a listener for the given event

The function returns the Events object, which has the following methods:
  .call(evt[, arg1][, arg2][, ...])
    Calls the listeners for the given event with the arguments. The context (
    i.e, 'this') will be the object passed in to createEvents().
  .callWith(evt, context[, arg1][, arg2][, ...])
    Calls the listeners for the given event with the given context and arguments.
  .apply(evt[, args])
    Calls the listeners for the given event with the arguments given as an array.
    The context (i.e., 'this') will be the object passed in to createEvents().
  .applyWith(evt, context[, args])
    Calls the listeners for the given event with the given context and the 
    arguments given as an array.
  .mute(evt)
    Prevents an event from firing.
  .unmute(evt)
    Un-mutes an event, allowing it to fire again.
**/
function Events(obj, evts){
    var _listeners = {};
    var _muted     = {};
    var _obj       = {};
    
    // Create the callback handlers. We use the jQuery.Callbacks() object
    evts.forEach(function(d,i){
        _listeners[d] = $.Callbacks();
    });
    
    // Methods defined on the object passed in *********************************
    obj.on = function(e,f){
        _listeners[e].add(f);
        return obj;
    };
    
    obj.removeListener = function(e,f){
        _listeners[e].remove(f);
        return obj;
    };
    
    // Methods defined on the Event object returned ****************************
    _obj.call = function(evt){
        if(_muted[evt]){ return; }
        var args = Array.prototype.slice.call(arguments, 2);
        _listeners[evt].fireWith(obj, args);
        return _obj;
    };
    
    _obj.callWith = function(evt, thisObj){
        if(_muted[evt]){ return; }
        var args = Array.prototype.slice.call(arguments, 2);
        _listeners[evt].fireWith(thisObj, args);
        return _obj;
    };
    
    _obj.apply = function(evt, args){
        if(_muted[evt]){ return; }
        _listeners[evt].fireWith(obj, args);
        return _obj;
    };
    
    _obj.applyWith = function(evt, thisObj, args){
        if(_muted[evt]){ return; }
        _listeners[evt].fireWith(thisObj, args);
        return _obj;
    };
    
    _obj.mute = function(evt){
        _muted[evt] = true;
    };
    
    _obj.unmute = function(evt){
        _muted[evt] = false;
    };
    
    return _obj;
}


/**
#### .moveToFront()
Moves a D3 selection to the front of its parent. Taken from
http://stackoverflow.com/questions/14167863/how-can-i-bring-a-circle-to-the-front-with-d3
**/
d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};


/**
#### .moveToBack()
Moves a D3 selection to the back of its parent. Taken from
http://stackoverflow.com/questions/14167863/how-can-i-bring-a-circle-to-the-front-with-d3
**/
d3.selection.prototype.moveToBack = function() { 
    return this.each(function() { 
        var firstChild = this.parentNode.firstChild; 
        if (firstChild) { 
            this.parentNode.insertBefore(this, firstChild); 
        } 
    }); 
};

/**
#### d3.dispatch()
Augments d3.dispatch to allow for the muting and unmuting of events.
**/
d3.dispatch = function() {
    var dispatch = new mutable_dispatch(), i = -1, n = arguments.length;
    while (++i < n) dispatch[arguments[i]] = mutable_dispatch_event(dispatch);
    return dispatch;
};

function mutable_dispatch() {}

mutable_dispatch.prototype.on = function(type, listener) {
    var i = type.lastIndexOf("."), name = "";
    if (i >= 0) {
        name = type.substring(i + 1);
        type = type.substring(0, i);
    }
    if (type) return arguments.length < 2 ? this[type].on(name) : this[type].on(name, listener);
    if (arguments.length === 2) {
        if (listener == null) for (type in this) {
            if (this.hasOwnProperty(type)) this[type].on(name, null);
        }
        return this;
    }
};

/**
#### .mute(type[, muted])
Mutes or unutes the event type. 

The type string follows the same convention as d3.dispatch.on(). An optional
namespace may be appended, such as "click.foo" to mute or unmute the event with
that specific namespace. 

If no namespace is appended, all listeners for the event type are muted or
unmuted. For example, dispatch.mute('click', true) will mute all "click" events,
including "click" and "click.foo". This means if you want to mute just the
non-namespaced "click" event, you will have to unmute the namespaced events
afterward.

Passing in just the namespace mutes or unmutes all events with that namespace.
For example, dispatch.mute('.foo', true) will mute all events namespaced with 
".foo".

If muted is not specified, the current muted status for the event is returned.
**/
mutable_dispatch.prototype.mute = function(type, muted){
    var i = type.lastIndexOf("."), name = "";
    if(i >= 0){
        name = type.substring(i + 1);
        type = type.substring(0, i);
    }
    if(type){ return arguments.length < 2 ? this[type].mute(name) : this[type].mute(name, muted); }
    if(arguments.length === 2){
        for(type in this){
            if(this.hasOwnProperty(type)){ this[type].mute(name, muted); }
        }
        return this;
    }
};

function mutable_dispatch_event(dispatch) {
    var listeners = [], listenerByName = d3.map();
    
    function event() {
        var z = listeners, i = -1, n = z.length, l;
        while (++i < n) if ((l = z[i].on) && !z[i].muted) l.apply(this, arguments);
        return dispatch;
    }
    
    event.on = function(name, listener) {
        var l = listenerByName.get(name), i;
        if (arguments.length < 2) return l && l.on;
        if (l) {
            l.on = null;
            l.muted = false;
            listeners = listeners.slice(0, i = listeners.indexOf(l)).concat(listeners.slice(i + 1));
            listenerByName.remove(name);
        }
        if (listener) listeners.push(listenerByName.set(name, {
            on: listener,
            muted: false,
        }));
        return dispatch;
    };
    
    event.mute = function(name, muted){
        if(name == ""){
            var z = listeners, i = -1, n = z.length;
            while(++i < n){ z[i].muted = muted; }
        }
        else{
            var l = listenerByName.get(name), i;
            if(arguments.length < 2){ return l && l.muted; }
            if(l){ l.muted = muted; }
        }
        return dispatch;
    };
    
    return event;
}



