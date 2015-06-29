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
 * Namespace: monarch.model.tree
 * 
 * Constructor: tree
 * 
 * Parameters:
 *  data - the JSON object as a string in the following format:
 * 
 *      [
 *        {
 *          "id": "HP:0000707",
 *          "label": "Nervous System",
 *          "counts": [
 *             {
 *               "value": 21290,
 *               "name": "Human"
 *             },
 *             {
 *              "value": 38136,
 *              "name": "Mouse"
 *             }
 *           ],
 *           "children":[
 *             {
 *               "label":"Nervous System Morphology",
 *               "id":"HP:0012639",
 *               "counts": [
 *                  {
 *                    "value":7431,
 *                    "name":"Human",
 *                  {
 *                    "value":24948,
 *                    "name":"Mouse"
 *                  }
 *               ],
 *             },...
 *         },...
 *      ]  
 *      
 * Returns:
 *  tree object
 */

monarch.model.tree = function(data){
    var self = this;
    self._data = data;
    self.checkSiblings(data.root.children); //Only checks the root's children
};

//Return entire tree data 
monarch.model.tree.prototype.getTree = function(){
    return this._data;
};

//Return entire tree data 
monarch.model.tree.prototype.getRootID = function(){
    return this._data.root.id;
};

monarch.model.tree.prototype.getRootLabel = function(){
    return this._data.root.label;
};

monarch.model.tree.prototype.getFirstSiblings = function(){
    return this._data.root.children;
};

//Return entire tree data 
//NOT IMPLEMENTED
monarch.model.tree.prototype.addBranch = function(){
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
    
    // Start with the first list of siblings
    var descendants = self.getFirstSiblings();
    
    if (typeof parents != 'undefined' && parents.length > 0){
        parents.forEach( function(r){
            if (!r.indexOf(
                    descendants.map(function(i){return i.id;}) > -1)){
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
            throw new Error ("No statistics for "+r.id+" in self.data object");
        }
        r.counts.forEach(function (i){
            if (i.value == null){
                r.value = 0;
            }
        });
    });
    return self;
};
