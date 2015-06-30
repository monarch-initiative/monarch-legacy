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
 *    data_manager -
 *    scigraph_url -
 *    tree -
 *  
 */
monarch.builder.tree_builder = function(data_manager, scigraph_url, tree){
    var self = this;
    self.data_manager = data_manager;
    self.scigraph_url = scigraph_url;
    self.tree = tree;
};

monarch.builder.setScigraphUrl(id, level, relationship, direction){
    var url = self.scigraph_url+'graph/neighbors/'
}

