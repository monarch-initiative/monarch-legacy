/* 
 * Package: tree.js
 * 
 * Namespace: monarch.model
 * 
 */

// Module and namespace checking.
if (typeof monarch == 'undefined') { var monarch = {};}
if (typeof monarch.model == 'undefined') { monarch.model = {};}

/*
 * Constructor: tree
 * 
 * Parameters:
 *  data - the JSON object as a string in the following format:
 * {
     "root": {
         "id": "HP:0000118",
         "label": "Phenotypic Abnormality",
         "children": [
             {
                 "id": "HP:0000707",
                 "label": "Nervous System",
                 "counts": [
                     {
                         "value": 21290,
                         "name": "Human"
                     },
                     {
                         "value": 38136,
                         "name": "Mouse"
                     }
                 ],
                 "children": [
                     {
                         "label": "Nervous System Morphology",
                         "id": "HP:0012639",
                         "counts": [
                             {
                                 "value": 7431,
                                 "name": "Human"
                             },
                             {
                                 "value": 24948,
                                 "name": "Mouse"
                             }
                         ]
                     }
                 ]
             }
         ]
     }
 * }
 * Returns:
 *  tree object
 */
monarch.model.tree = function(data){
    var self = this;
    if (data){
        self._data = data;
        self.checkSiblings(data.root.children);
    }
};

//Return entire tree data 
monarch.model.tree.prototype.getTree = function(){
    return this._data;
};

//Set entire tree data 
monarch.model.tree.prototype.setTree = function(data){
    self._data = data;
};

monarch.model.tree.prototype.setRootID = function(root){
    this._data.root.id = root;
};

//Return entire tree data 
monarch.model.tree.prototype.getRootID = function(){
    return this._data.root.id;
};

monarch.model.tree.prototype.getRootLabel = function(){
    return this._data.root.label;
};

monarch.model.tree.prototype.hasRoot = function(){
    return (this._data.root && this.getRootID());
};

monarch.model.tree.prototype.getFirstSiblings = function(){
    return this._data.root.children;
};

//NOT IMPLEMENTED
monarch.model.tree.prototype.addBranch = function(branch, parents){
    
    
};

//Not implemented
/*
monarch.model.tree.prototype.addNode = function(node, parents){
    var self = this;
    var parent = self.getRootID();
    
    if (parents[0] != self.getRootID()){
        throw new Error ("first id in parent list is not root");
    }
    parents.shift();
    // Start at root
    var descendants = self.getFirstSiblings();
};*/


monarch.model.tree.prototype.addCountsToNode = function(node_id, counts, parents) {
    var self = this;
    
    //Check that parents lead to something
    var siblings = self.getDescendants(parents);
    if (siblings.map(function(i){return i.id;}).indexOf(node_id) == -1){
        throw new Error ("Error in locating node given "
                         + parents + " and ID: " + node_id);
    } else {
        var index = siblings.map(function(i){return i.id;}).indexOf(node_id);
        siblings[index]['counts'] = counts;
    }
    
    return self;
};

/*
 * Function: getDescendants
 * 
 * Return a descendant given a list of IDs leading to the descendant
 * 
 * Parameters:
 *  parents - list of IDs leading to descendant
 * 
 * Returns:
 *  object containing descendant data
 */
monarch.model.tree.prototype.getDescendants = function(parents){
    var self = this;
    
    // Start at root
    var descendants = self.getFirstSiblings();
    
    if (typeof parents != 'undefined' && parents.length > 0){
        
        if (parents[0] != self.getRootID()){
            throw new Error ("first id in parent list is not root");
        }
        
        parents.forEach( function(r,i){
            //skip root
            if (i == 0){
              return;
            }
            if (descendants.map(function(i){return i.id;}).indexOf(r) == -1){
                throw new Error ("Error in locating descendant given "
                                 + parents + " failed at ID: " + r);
            }
            descendants = descendants.filter(function(i){return i.id == r;});
            if (descendants.length > 1){
                throw new Error ("Cannot disambiguate id: " + r);
            }
            descendants = descendants[0].children;
        });
    } 
    
    return descendants;
};

//TODO improve checking
// Just checks top level of tree
monarch.model.tree.prototype.checkSiblings = function(siblings){
    if (typeof siblings === 'undefined'){
        throw new Error ("tree object is undefined");
    }
  
    siblings.forEach(function (r){
        //Check ID
        if (r.id == null){
            throw new Error ("ID is not defined in self.data object");
        }
        if (r.label == null){
            r.label = r.id;
        }
        if (r.counts == null){
            //throw new Error ("No statistics for "+r.id+" in self.data object");
        } else {
            r.counts.forEach(function (i){
                if (i.value == null){
                    r.value = 0;
                }
            });
        }
    });
    return self;
};

/* 
 * Node sub-object
 * TODO -  determine if this is needed
 * 
 * Namespace: monarch.model.tree
 * 
 */

// Module and namespace checking.
if (typeof monarch == 'undefined') { var monarch = {};}
if (typeof monarch.model == 'undefined') { monarch.model = {};}
if (typeof monarch.model.tree == 'undefined') { monarch.model.tree = {};}


monarch.model.tree.node = function(id, label, children){
    var self = this;
    self.id = id;
    
    if (typeof label != 'undefined'){
        self.label = label;
    } else {
        self.label = id;
    }
    
    if (typeof children != 'undefined'){
        self.children = children;
    } else {
        self.children = [];
    }
};
  
