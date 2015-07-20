/* 
 * Package: tree_builder.js
 * 
 * Namespace: monarch.builder
 * 
 */

// Module and namespace checking.
if (typeof monarch == 'undefined') { var monarch = {};}
if (typeof monarch.builder == 'undefined') { monarch.builder = {};}

/*
 * Constructor: tree_builder
 * 
 * Parameters:
 *    data_manager - SoLR Manager, such as a GOlr manager,
 *                   should probably just rename golr manager
 *    scigraph_url - Base URL of SciGraph REST API
 *    tree - monarch.model.tree object
 *  
 */
monarch.builder.tree_builder = function(data_manager, scigraph_url, tree){
    var self = this;
    self.data_manager = data_manager;
    self.scigraph_url = scigraph_url;
    if (typeof tree === 'undefined') {
        self.tree = new monarch.model.tree();
    } else {
        self.tree = tree;
    }
};

/*
 * Function: getOntology
 * 
 * Parameters:
 *    id - string, root id as curie or url
 *    depth - string or int, how many levels to traverse
 *    
 * Returns:
 *    object, maybe should be monarch.model.tree?
 */
monarch.builder.tree_builder.prototype.getOntology = function(id, depth){
    var self = this;
    var tree = new monarch.model.tree();
    
    // var graph = new bbop.model.graph();
    
    // Some Hardcoded options for scigraph
    var direction = 'INCOMING';
    var relationship = 'subClassOf';
    
    var query = self.setGraphNeighborsUrl(id, depth, relationship, direction);
    
    jQuery.ajax({
        url: query,
        jsonp: "callback",
        dataType: "jsonp",
        error: function(){
          console.log('ERROR: looking at: ' + query);
        },
        success: function(data) {
           console.log(data);
        }
    });
};

/*
 * Function: addOntologyToTree
 * 
 * Parameters:
 *    ontology - object, ontology structured as monarch.model.tree
 *    tree - monarch.model.tree object, empty or containing data
 *    parents - parents of "root" if adding a branch to an existing ontology
 *    
 * Returns:
 *    monarch.model.tree
 */
monarch.builder.tree_builder.prototype.addOntologyToTree = function(ontology, tree, parents){
    var self = this;
    // Throw error is parents are defined and there is no root
    // Add root to tree if it doesn't exist 
};

/*
 * Function: setGraphNeighborsUrl
 * 
 * Construct SciGraph URL for Rest Server
 * 
 * Parameters:
 *    id - string, root id as curie or url
 *    depth - string or int, how many levels to traverse 
 *    relationship - string, relationship between terns, defaults as subClassOf
 *    direction - string, direction of relationship, INCOMING,
 *                        OUTGOING, or BOTH will work
 *                        
 * Returns: 
 *    string
 */
monarch.builder.tree_builder.prototype.setGraphNeighborsUrl = function(id, depth, relationship, direction){
    var self = this;
    if (typeof relationship === 'undefined') {
        relationship = "subClassOf";
    }
    if (typeof direction === 'undefined') {
        direction = 'INCOMING';
    }
    var url = self.scigraph_url + 'graph/neighbors/' + id + '.json?depth='
              + depth + '&blankNodes=false&relationshipType='
              + relationship + '&direction=' + direction + '&project=*';
    
    return url;
};

/*
 * Function: convertGraphToTree
 * 
 * Edit label to make more readable
 * 
 * Parameters:
 *    graph - bbop.model.graph
 *    root - root object
 *    
 * Returns:
 *    monarch.model.tree
 */
monarch.builder.tree_builder.prototype.convertGraphToTree = function(graph, root){
    var self = this;
    if (!graph._is_a === 'bbop.model.graph'){
        throw new Error ("Input is not a bbop.model.graph");
    }
    
    var tree = new monarch.model.tree();
    
};

/*
 * Function: processLabel
 * 
 * Edit label to make more readable
 * 
 * Parameters:
 *    label - string, label to be processed
 *    
 * Returns:
 *    string
 */
monarch.builder.tree_builder.prototype.processLabel = function(label){   
    label = label.replace(/Abnormality of (the )?/, '');
    label = label.replace(/abnormal(\(ly\))? /, '');
    label = label.replace(/ phenotype$/, '');
    
    label = label.replace(/\b[a-z]/g, function() {
        return arguments[0].toUpperCase()});
    
    return label;
};


