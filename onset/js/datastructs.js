// TODO Add some caching of calculated values, similarities, etc.
// FIXME Fix bug(s) w/ arguments of Set constructor

/**
## SetDataSource
The "base" class for a source of set data. The source is responsible for
returning the elements of the "universal" set - all of the compounds
possible in a blood sample or all of the days in a month, for example - and
the individual data cases - sets of elements that are a subset of the
universal set.
**/
function SetDataSource(){
    var _obj = {};
    
    /**
    #### .elements()
    Returns the elements of the universal set. It is a Set object. See plugins.js.
    **/
    _obj.elements = function(){
        throw "NotImplemented";
    };
    
    /**
    #### .cases()
    The data cases - an array of DataCase objects containing a subset of the 
    universal set.
    **/
    _obj.cases = function(){
        throw "NotImplemented";
    };
    
    /**
    #### .load()
    Loads the data and returns a jQuery Deferred object. Callbacks can then be
    registered to be invoked using the deferred.then(), deferred.always(), 
    deferred.done(), and deferred.fail() methods. This is all chainable, too. 
    
    For example:
        source.load()
        .done(function(u,c){ console.log("Loaded data successfully"); })
        .fail(function(e){ console.log("Failed to load data: " + e); })
    
    When the data was loaded successfully, any applicable callbacks will be
    passed the elements and cases as parameters. If there was an error, the
    appropriate callbacks will be passed the error message. The this context is
    set to the SetDataSource object. For more details on the states, uses, etc. 
    of a jQuery Deferred object, see http://api.jquery.com/jQuery.Deferred/.
    **/
    _obj.load = function(callback){
        throw "NotImplemented";
    };
    
    return _obj;
}


/**
## Set([data][,hashFunction])
A set of objects.

A set is a collection of distinct, non-duplicate objects. In other words,
it is a collection of unique elements. A hash function is used by the set
to determine uniqueness when adding and comparing elements. Two objects are
identical iff their hashes are equal.

The set takes two optional arguments. The first is data to be stored in the
set on initialization. The second is the hash function - it is passed
objects to be stored in the set and should return a unique hash for a 
distinct object. If the hash function is not specified, an object's string
value will be used. This is rarely the desired behavior. You may also create
the set without initial data, but with a set hash function. To do this, pass
a function as the first argument.
**/
function Set(data, hash){
    var _data = {};
    var _hash = hash;
    var _obj = {};

    /**
    #### .add(element)
    Adds an element to the set.
    **/
    _obj.add = function(e){
        _data[_hash(e)] = e;
        return e;
    };

    /**
    #### .has(element)
    Returns true if the set contains the given element.
    **/
    _obj.has = function(e){
        return Object.prototype.hasOwnProperty.call(_data, _hash(e));
    };

    /**
    #### .remove(element)
    Removes an element from the set. It returns true if the element was
    contained in the set and removed, false otherwise.
    **/
    _obj.remove = function(e){
        var hashed = _hash(e);
        var existed = Object.prototype.hasOwnProperty.call(_data, hashed);
        delete _data[hashed];
        return existed;
    };

    /**
    #### .clear()
    Removes all elements from this set.
    **/
    _obj.clear = function(){
        _data = {};
        return true;
    };

    /**
    #### .find(hash)
    Finds an element by hash and returns it.
    **/
    _obj.find = function(h){
        return _data[h];
    };

    /**
    #### .count()
    Returns the number of elements in this set.
    **/
    _obj.count = function(){
        var count = 0;
        _obj.forEach(function(){ count++; })
        return count;
    };

    /**
    #### .intersection(Set)
    Produces the intersection of two sets. Returns a new set.
    **/
    _obj.intersection = function(other){
        var set = utils.Set({}, _hash);
        other.forEach(function(e){
            if(_obj.has(e)){ set.add(e); }
        });
        return set;
    };

    /**
    #### .union(Set)
    Produces the union of two sets. Returns a new set.
    **/
    _obj.union = function(other){
        var set = utils.Set({}, _hash);
        _obj.forEach(function(e){
            set.add(e);
        });
        other.forEach(function(e){
            set.add(e);
        });
        return set;
    };
      
    /**
    #### .subtraction(Set)
    Returns the result of subtracting another set from this set. Returns a
    new set.
    **/
    _obj.subtraction = function(other){
        var set = utils.Set({}, _hash);
        _obj.forEach(function(e){
            set.add(e);
        });
        other.forEach(function(e){
           set.remove(e); 
        });
        return set;
    };

    /**
    #### .hash()
    Gets the hash function used for this set.
    **/
    _obj.hash = function(){
        return _hash;
    };

    /**
    #### .elements()
    Returns all of the elements in this set as an array. The returned order
    is arbitrary, although it appears that - at least in Chrome - the
    returned order is the same as the insertion order, i.e., Set([a,b,c])
    will return [a,b,c].
    **/
    _obj.elements = function(){
        var elements = [];
        _obj.forEach(function(e){ elements.push(e); })
        return elements;
    };

    /**
    #### .forEach(function)
    Iterates over all the elements in the set, passing the element to the
    desired iterator function. If the iterator function returns
    utils.BREAKER, the loop will break and return. The returned order is
    arbitrary.
    **/
    _obj.forEach = function(iterator){
        for(var hash in _data) {
            if(_data.hasOwnProperty(hash)) {
                if(iterator.call(_obj, _data[hash]) === false) return;
            }
        }
    };
    
    // Initialize the set
    if(arguments.length < 2){
        if(utils.isFunction(data)){ _hash = data; }
        else{ _hash = function(e){ return "\x00" + e; }; }
    }
    if(isArray(data)){
        data.forEach(function(e){ _obj.add(e); });
    }
    
    return _obj;
};


/**
## DataCase(label,data[,metadata])
A data case. Represents a subset of the universal element set with optional
metadata. The data passed in should be either an array or a Set. If it is an
array, the default set hash function will be used.
**/
function DataCase(label, data, meta){
    var _label  = label;
    var _set    = isArray(data) ? Set(data) : data;
    var _meta   = meta ? meta : {};
    var _obj    = {};
    var _events = Events(_obj, ['change']);

    /**
    #### .label([string])
    Gets or sets the label for this data case.
    **/
    _obj.label = function(l){
        if(!arguments.length){ return _label; }
        _label = l;
        _events.call('change');
        return _obj;
    };
    
    /**
    #### .set([elements])
    Gets or sets the elements associated with this case.
    **/
    _obj.set = function(d){
        if(!arguments.length){ return _set; }
        _set = isArray(d) ? Set(d) : d;
        _events.call('change');
        return _obj;
    };
    
    /**
    #### .meta([key],[value])
    Gets or sets metadata associated with this data case.
    **/
    _obj.meta = function(key,val){
        if(!arguments.length){ return _meta; }
        if(arguments.length == 1){
            if(isObject(key)){ _meta = key; return; } 
            return _meta[key]; 
        }
        _meta[key] = val;
        _events.call('change');
        return _obj;
    };
    
    return _obj;
}


/**
## SetExpression(root,elements)
An expression tree that represents operations applied to the sets of elements
associated with data cases. For example, we can take two sets of elements, 
union them together, and then ask "Is x in the unioned set?"

There are two data structures used to construct the expression tree: operator 
nodes and data nodes.

Operator nodes represent one of the set operators: AND (intersection) or OR
(union). They may have other nodes as children. Data nodes represent a set of 
items and compose the leaves of the tree.

The membership of an element (e.g. compound) in the data set represented by an
expression tree can be calculated by calling the value() function and passing
in the element. The value returned is in the range [0,1]. The OR operator can 
produce a non-integer number - rather than calculating a binary 0 or 1 if an 
element is in the unioned set, a fraction is returned representing how many of 
the subsets out of the total contain the element.
**/
function SetExpression(root,e){
    var _root     = root;
    var _elements = e;
    var _cache    = null;
    var _obj      = {};
    var _events   = Events(_obj, ['change']);
    
    /**
    #### bubbleChange()
    Bubbles up any changes that occur to the elements of the expression.
    **/
    function bubbleChange(){
        _events.call('change');
    };
    
    /**
    #### refreshCache()
    Refreshes the cache of values for each of the elements in this expression.
    **/
    function refreshCache(){
    };
    
    /**
    #### .root()
    Returns the root of the expression. It is an OperatorNode.
    **/
    _obj.root = function(){
        return _root;
    };
    
    /**
    #### .not()
    NOTs the expression. Only supported for single layers.
    **/
    _obj.not = function(b){
       if(_obj.count() > 1){ return false; }
       if(!arguments.length){ return _root.children()[0].not(); }
       _root.children()[0].not(b);
       return _obj; 
    };
    
    /**
    #### .value(element)
    Returns the calculated value of an element in the set after the operations
    have been performed. It is a value in the range [0,1].
    **/
    _obj.value = function(e){
        var visitor = ValueCalculator(e);
        _root.accept(visitor);
        return visitor.value();
    };
    
    /**
    #### .contains(case)
    Returns true if this expression contains the given data case
    **/
    _obj.contains = function(c){
        return _root.contains(c);
    };
    
    /**
    #### .count()
    Returns the number of data sets in this expression.
    **/
    _obj.count = function(){
        var visitor = SetCountCalculator();
        _root.accept(visitor);
        return visitor.count();
    };
    
    /**
    #### .jaccard(expression)
    Calculates the jaccard index between this and another expression.
    **/
    _obj.jaccard = function(o,e){
        var metric = 0;
        var union = 0;
        e.forEach(function(e){
            var visitor = ValueCalculator(e);
            var myValue;
            var otherValue;
            
            // Gather the statistics about the value and presence/absence of the
            // element in the two expressions.
            _root.accept(visitor);
            myValue = visitor.value();
            
            visitor.reset();
            
            o.accept(visitor);
            otherValue = visitor.value();
            
            // The element is found in the union of both sets
            if(myValue > 0 || otherValue > 0){
                union += 1;
            }
            
            // The element is found in both expressions; the similarity
            // increases.
            if(myValue > 0 && otherValue > 0){ 
                metric += 1;
                return; 
            }
        });
        
        return (parseFloat(metric) / union);
    }
    
    /**
    #### .similarity(expression, elements)
    Calculates the similarity between this expression and another one, based
    on the given element set.
    
    For each element, e, in the element set:
        If the value of e is 1 in one expression, and 0 in the other, the
        element is found in one expression, but not the other. The similarity
        metric is not increased.

        Otherwise, the metric increases by one.
    
    The metric is then divided by the total number of elements possible,
    normalizing it to a value between [0,1].
    **/
    _obj.similarity = function(o,e){
        var metric = 0;
        e.forEach(function(e){
            var visitor = ValueCalculator(e);
            var myValue;
            var otherValue;
            
            // Gather the statistics about the value and presence/absence of the
            // element in the two expressions.
            _root.accept(visitor);
            myValue = visitor.value();
            
            visitor.reset();
            
            o.accept(visitor);
            otherValue = visitor.value();
            
            // The element is found in both expressions; the similarity
            // increases.
            if(myValue > 0 && otherValue > 0){ 
                metric += 1;
                return; 
            }
            // The element is absent in both expressions; the similarity
            // increases.
            if(myValue == 0 && otherValue == 0){ 
                metric += 1;
                return;
            }
        });
        return (parseFloat(metric) / e.count());
    };
    
    /**
    #### .split([nested])
    Splits this expression into its subexpressions. If the nested flag is passed
    in, it will completely split the expression, otherwise only the top children
    are split. This is a destructive action. The original expression will be
    changed.
    **/
    _obj.split = function(n){
        var nested = n == undefined ? false : n;
        var newExprs = [];
        var split = _root.split(nested);
        var newExprs = [];
        
        split.forEach(function(n,i){
            var newRoot = null;
            if(isOperatorNode(n)){ newRoot = n; }
            else{
                newRoot = OperatorNode('AND');
                newRoot.addChild(n);
            }
            
            if(i == 0){
                _root = newRoot;
                newExprs.push(_obj);
            }
            else{
                newExprs.push(SetExpression(newRoot,_elements));
            }
        });
        
        return newExprs;
    };
    
    /**
    #### .merge(expression, flatten)
    Merges another SetExpression with this one.
    **/
    _obj.merge = function(e){
        var otherRoot = e.root();
        var composite = e.count() > 1;
        
        // Don't fire the change event for every little change. We will fire
        // it once after all changes have been made for the merge.
        _events.mute('change');
        if(composite){
            // The other expression is a composite expression. Create a new
            // level in the expression tree.
            var newRoot = OperatorNode('AND');
            newRoot.addChild(_root);
            newRoot.addChild(otherRoot);
            _root.removeListener('change', bubbleChange);
            _root = newRoot;
            _root.on('change', bubbleChange);
            _obj.flatten();
        }
        else{
            // The other expression is a single set.
            _root.addChild(otherRoot.children()[0]);
        }
        
        _events.unmute('change');
        _events.call('change');
        return _obj;
    };
    
    /**
    #### .flatten()
    Flattens this expression by moving any single layers up the tree.
    **/
    _obj.flatten = function(){
        var rChildren = _root.children();
        var nChildren = [];
        
        _events.mute('change');
        if(rChildren.length == 1 && isOperatorNode(rChildren[0])){
            // Change the root
            _root.removeListener('change', bubbleChange);
            _root = rChildren[0];
            _root.on('change', bubbleChange);
            return;
        }
        rChildren.forEach(function(n){
            if(isOperatorNode(n) && n.children().length == 1){
                var child = n.children()[0];
                n.removeChild(child);
                nChildren.push(child);
                return;
            }
            nChildren.push(n);
        });
        _root.clear();
        nChildren.forEach(function(n){ _root.addChild(n); });
        
        _events.unmute('change');
        _events.call('change');
        return _obj;
    }
    
    /**
    #### .preview(expression)
    Returns a copy of this expression merged with another.
    **/
    _obj.preview = function(e){
        // Clone the root and its children.
        var newRoot = OperatorNode(_root.operator())
        _root.children().forEach(function(n){
            newRoot.addChild(n);
        });
        var newExpr = SetExpression(newRoot, _elements);
        newExpr.merge(e);
        return newExpr;
    };
    
    /**
    #### .accept(visitor)
    Implements the visitor pattern to allow various operations on this expression.
    This performs a depth-first search.
    **/
    _obj.accept = function(v){
        _root.accept(v);
    };
    
    // Bubble up the root 'change' event
    _root.on('change', bubbleChange);
    
    // Listen to the 'change' event to refresh the value cache
    _obj.on('change', refreshCache);
    
    return _obj;
}


/**
## OperatorNode(operator)
Creates an operator node with the given operator. The current operators
supported are: "AND", "OR". Default is "AND". Each operator node may have other
nodes as children to form an expression tree.
**/
function OperatorNode(operator){
    var _operator = operator;
    var _children = [];
    var _obj      = {};
    var _events   = Events(_obj, ['change']);
    
    function bubbleChange(){
        _events.call('change');
    };
    
    /**
    #### .addChild(node)
    Adds a child node to this operator.
    **/
    _obj.addChild = function(n){
        _children.push(n);
        _events.call('change');
        // Bubble up the "change" event from any added nodes
        n.on('change', bubbleChange);
        return _obj;
    };
    
    /**
    #### .removeChild(node)
    Removes a child node from this operator.
    **/
    _obj.removeChild = function(n){
        for(var i = 0; i < _children.length; i++){
            if(_children[i] === n){ 
                _children.splice(i, 1);
                _events.call('change');
                // No longer listen to the "change" event from the removed child
                n.removeListener('change', bubbleChange);
                return _obj; 
            }
        }
        return _obj;
    };
    
    /**
    #### .children()
    Returns the children of this node.
    **/
    _obj.children = function(){
        return _children.slice(0);
    };
    
    /**
    #### .clear()
    Removes the children from this operator.
    **/
    _obj.clear = function(){
        // No longer listen to the "change" event from the removed children
        _children.forEach(function(n){
            n.removeListener('change', bubbleChange);
        });
        
        _children = [];
        _events.call('change');
        return _obj;
    };
    
    /**
    #### .operator()
    Gets or sets the operator for this node.
    **/
    _obj.operator = function(o){
        if(!arguments.length){ return _operator; }
        _operator = o;
        _events.call('change');
        return _obj;
    };
    
    /**
    #### .contains(case)
    Returns true if the subtree under this operator contains the given data
    case
    **/
    _obj.contains = function(c){
        for(var i = 0; i < _children.length; i++){
            if(_children[i].contains(c)){ return true; }
        }
        return false;
    }; 
    
    /**
    #### .split([nested])
    Splits any subexpressions from this OperatorNode and returns an array of
    OperatorNodes representing the split. This is a destructive action; the
    children of this node will be removed. If nested is true, it will 
    recursively split all of the subexpressions down the tree.
    **/
    _obj.split = function(n){
        var nested = n == undefined ? false : n;
        var newNodes = [];
        
        _children.forEach(function(c){
            if(isOperatorNode(c)){
                if(nested){ newNodes = [].concat.apply(newNodes, c.split(nested)); }
                else{ newNodes.push(c); }
            }
            else{
                newNodes.push(c);
            }
        });
        _obj.clear();
        return newNodes;
    };

    /**
    #### .accept(visitor)
    Implements the visitor pattern to allow various operations on this node.
    This performs a depth-first search.
    **/
    _obj.accept = function(v){
        v.visitPre(_obj);
        _children.forEach(function(c){ c.accept(v); });
        v.visitPost(_obj);
    };

    return _obj;
}


/**
## DataNode(dataCase)
This node represents a data case/data set in the boolean expression tree. These 
nodes are found at the leaves of the tree. The data node can be NOTed.
**/
function DataNode(dataCase){
    var _data = dataCase;
    var _obj = {};
    var _events = Events(_obj, ['change']);
    var _not = false;
    
    /**
    #### .data()
    Returns the DataCase object associated with this node.
    **/
    _obj.data = function(){
        return _data;
    };
    
    /**
    #### .not([boolean])
    Gets or sets whether this data node is NOTed.
    **/
    _obj.not = function(b){
        if(!arguments.length){ return _not; }
        _not = b;
        return _obj;
    }
    
    /**
    #### .value(element)
    Returns 0 or 1 to indicate if the element exists in the data case.
    **/
    _obj.value = function(e){
        if(_not){ return _data.set().has(e) ? 0 : 1; }
        else{ return _data.set().has(e) ? 1 : 0; }
    };
    
    /**
    #### .contains(case)
    Returns true if this data node contains the given data case.
    **/
    _obj.contains = function(c){
        return c.label() === _data.label();
    };
    
    /**
    #### .accept(visitor)
    Implements the visitor pattern to allow various operations on this node.
    **/
    _obj.accept = function(v){
        v.visitPre(_obj);
        v.visitPost(_obj);
    };
    
    // Pass along the "change" event from the data case
    _data.on('change', function(){ _events.call('change'); });
    
    return _obj;
}

/**
#### isOperatorNode(node)
Returns true if the node is an Operator node using duck-typing.
**/
function isOperatorNode(n){
    return Object.prototype.toString.call(n.operator) === "[object Function]";
}

/**
## ValueCalculator(expression)
An object that uses the visitor pattern to calculate the value of an element
in the data sets of an expression tree. If you are going to re-use the same
object, call reset() before passing it to accept().

After the visitor is done, call value() to retrieve the calculated value. For
additional details, the presenceCount() and absenceCount() give the number of
sets at the TOP level that contain or do not contain the element, respectively.
**/
function ValueCalculator(element){
    var _element = element;
    var _obj = {};
    var _operatorStack = [];
    var _dataStack = [[],];
    var _presenceCount = 0;
    var _absenceCount = 0;
    
    _obj.visitPre = function(n){
        if(isOperatorNode(n)){
            _operatorStack.push(n.operator());
            _dataStack.push([]);
        }
    };
    
    _obj.visitPost = function(n){
        if(isOperatorNode(n)){
            var operator = _operatorStack.pop();
            var parentOp = _operatorStack.pop();
            var data = _dataStack.pop();
            var ret  = _dataStack.pop();
            
            // We apply a simplification rule here: X && (Y && Z) = X && Y && Z
            // and X || (Y || Z) = X || Y || Z.
            if(operator === parentOp){
                ret = ret.concat(data);
            }
            else{
                // The operators are very similar in nature, so we can reduce
                // share a good chunk of code
                var sum = 0;
                _presenceCount = 0;
                data.forEach(function(d){
                    if(d){ _presenceCount++ };
                    sum += d;
                });
                _absenceCount = data.length - _presenceCount;
                
                if(operator === "AND"){ ret.push(_absenceCount >= 1 ? 0 : 1); }
                else if(operator === "OR"){ ret.push(parseFloat(sum) / data.length); }
            }
            _dataStack.push(ret);
            _operatorStack.push(parentOp);
            return;
        }
        else{
            var data = _dataStack.pop();
            data.push(n.value(_element));
            _dataStack.push(data);
            return;
        }
    };
    
    _obj.value = function(){
        return _dataStack[0][0];
    };
    
    _obj.presenceCount = function(){
        return _presenceCount;
    };
    
    _obj.absenceCount = function(){
        return _absenceCount;
    };
    
    _obj.reset = function(){
        _presenceCount = 0;
        _absenceCount = 0;
        _dataStack = [[],];
    };
    
    return _obj;
}

/**
## SetCountCalculator
Counts the number of data sets in an expression tree.
**/
function SetCountCalculator(){
    var _obj = {};
    var _count = 0;
    
    _obj.visitPre = function(n){
        if(!isOperatorNode(n)){ _count++; }
    };
    
    _obj.visitPost = function(n){};
    
    _obj.count = function(){
        return _count;
    };
    
    _obj.reset = function(){
        _count = 0;
    };
    
    return _obj;
}
