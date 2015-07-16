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
 *    solr_url - Base URL for Solr service
 *    scigraph_url - Base URL of SciGraph REST API
 *    golr_conf - Congifuration for golr_manager
 *    tree - monarch.model.tree object
 *  
 */
monarch.builder.tree_builder = function(solr_url, scigraph_url, golr_conf,  tree){
    var self = this;
    self.solr_url = solr_url;
    // Turn into official golr conf object
    self.golr_conf = new bbop.golr.conf(golr_conf);
    self.scigraph_url = scigraph_url;
    if (typeof tree === 'undefined') {
        self.tree = new monarch.model.tree();
    } else {
        self.tree = tree;
    }
    
};

monarch.builder.tree_builder.prototype.build_tree = function(parents, final_function){
    var self = this;
    
    var personality = 'dovechart';
    var species_list = ["NCBITaxon:9606","NCBITaxon:10090","NCBITaxon:7955"];
    
    //golr_manager.set_personality(personality);
    var gene_filter = { field: 'subject_category', value: 'gene' };
    var facet = 'subject_taxon';
    var checkForData = true;
    
    // Check tree to see if we have classes, if so skip getting ontology
    // structure from SciGraph
    if (!self.tree.checkDescendants(parents)){
        //get data from ontology
        var final_callback = function(){
            self.getCountsForSiblings(parents, 'object_closure',species_list, gene_filter, personality, facet, final_function
        )};
        self.addOntologyToTree(parents[parents.length-1], 1, parents, final_callback);
    } else if (!self.tree.checkDescendants(parents, checkForData)){
        self.getCountsForSiblings(parents, 'object_closure',species_list, gene_filter, personality, facet, final_function);
    } else {
        final_function();
    }
    
};

/*
 * Function: addOntologyToTree
 * 
 * Parameters:
 *    id - string, root id as curie or url
 *    depth - string or int, how many levels to traverse
 *    
 * Returns:
 *    object, maybe should be monarch.model.tree?
 */
monarch.builder.tree_builder.prototype.addOntologyToTree = function(id, depth, parents, final_function){
    var self = this;
    
    // Some Hardcoded options for scigraph
    var direction = 'INCOMING';
    var relationship = 'subClassOf';
    
    var query = self.setGraphNeighborsUrl(id, depth, relationship, direction);
    
    jQuery.ajax({
        url: query,
        jsonp: "callback",
        dataType: "json",
        error: function(){
          console.log('ERROR: looking at: ' + query);
        },
        success: function(data) {
            var graph = new bbop.model.graph();
            graph.load_json(data);
            var child_nodes = graph.get_child_nodes(id);
            var siblings = child_nodes.map(function(i){
                return {'id' : i.id(),
                        'label' : self.processLabel(i.label())};
            });
            self.tree.addSiblingGroup(siblings, parents)
            if (typeof final_function != 'undefined'){
                final_function();
            }
        }
    });

};

/*
 * Function: getCountsForClass
 * 
 * Parameters:
 *    id -
 *    id_field -
 *    species -
 *    filters -
 *    
 * Returns:
 *    node object
 */
monarch.builder.tree_builder.prototype.setGolrManager = function(golr_manager, id, id_field, filter, personality){
    var self = this;
    
    golr_manager.reset_query_filters();
    golr_manager.add_query_filter(id_field, id, ['*']);
    golr_manager.set_results_count(0);
    golr_manager.lite(true);
    
    if (filter != null && filter.field && filter.value){
        golr_manager.add_query_filter(filter.field, filter.value, ['*']);
    }
    
    if (personality != null){
        golr_manager.set_personality(personality);
    }
    return golr_manager;
};

/*
 * Function: getCountsForClass
 * 
 * Parameters:
 *    id -
 *    id_field -
 *    species -
 *    filters -
 *    personality - 
 *    facet - 
 *    parents - 
 *    final_function -
 *    
 * Returns:
 *    JQuery Ajax Function
 */
monarch.builder.tree_builder.prototype.getCountsForSiblings = function(parents, id_field, species, filter, personality, facet, final_function){
    var self = this;
    
    var siblings = self.tree.getDescendants(parents);

    var promises = [];
    var success_callbacks = [];
    var error_callbacks = [];
    
    siblings.map(function(i){return i.id;}).forEach( function(i) {
        var ajax = self._getCountsForClass(i, id_field, species, filter, personality, facet, parents);
        promises.push(jQuery.ajax(ajax.qurl,ajax.jq_vars));
        success_callbacks.push(ajax.jq_vars['success']);
        error_callbacks.push(ajax.jq_vars['error']);
    });
    
    jQuery.when.apply(jQuery,promises).done(success_callbacks).done(function(){
        if (typeof final_function != 'undefined'){
            final_function();
        }
    }).fail(error_callbacks);
    
};

/*
 * Function: getCountsForClass
 * 
 * Parameters:
 *    id -
 *    id_field -
 *    species -
 *    filters -
 *    personality -
 *    facet - 
 *    parents -
 *    
 * Returns:
 *    JQuery Ajax Function
 */
monarch.builder.tree_builder.prototype._getCountsForClass = function(id, id_field, species, filter, personality, facet, parents){
    var self = this;
    var node = {"id":id, "counts": []};
    
    var golr_manager = new bbop.golr.manager.jquery(self.solr_url, self.golr_conf);
    
    //First lets override the update function
    golr_manager.update = function(callback_type, rows, start){
        
        // Get "parents" url first.
        var parent_update = bbop.golr.manager.prototype.update;
        var qurl = parent_update.call(this, callback_type, rows, start);

        if( ! this.safety() ){
        
        // Setup JSONP for Solr and jQuery ajax-specific parameters.
        this.jq_vars['success'] = this._callback_type_decider; // decide & run
        this.jq_vars['error'] = this._run_error_callbacks; // run error cbs

        return {qurl: qurl, jq_vars: this.jq_vars};
        }
    };
    
    /* No idea why I need to override this to comment out checking
     * for response.success(), hoping the error callbacks will 
     * catch any errors
     */
    golr_manager._callback_type_decider = function(json_data){
        var response = new bbop.golr.response(json_data);

            // 
            if( ! response.success() ){
                //throw new Error("Unsuccessful response from golr server!");
            }else{
                var cb_type = response.callback_type();
                if( cb_type == 'reset' ){
                    golr_manager._run_reset_callbacks(json_data);
                }else if( cb_type == 'search' ){
                    golr_manager._run_search_callbacks(json_data);
                }else{
                    throw new Error("Unknown callback type!");
                }
            }
        };
    
    golr_manager = self.setGolrManager(golr_manager, id, id_field, filter, personality);
    
    var makeDataNode = function(golr_response){
        var counts = [];
        var facet_counts = golr_response.facet_field(facet);
        facet_counts.forEach(function(i){
            counts.push({
                'name': self.getTaxonMap()[i[0]],
                'value' : i[1]});
        });
        self.tree.addCountsToNode(id,counts,parents)
    }
    var register_id = 'data_counts_'+id;
    
    golr_manager.register('search', register_id, makeDataNode);
    return golr_manager.update('search');
    
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

// Hardcoded taxon map
monarch.builder.tree_builder.prototype.getTaxonMap = function(){
    return {
        "NCBITaxon:10090" : "Mouse",
        "NCBITaxon:9606" : "Human",
        "NCBITaxon:7955" : "Zebrafish"
    };
};
