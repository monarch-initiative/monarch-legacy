/*
 * Package: browse.js
 * 
 * Namespace: monarch.widget.browse
 * 
 * BBOP object to draw various UI elements that have to do with
 * autocompletion.
 * 
 * This is a completely self-contained UI and manager.
 */

/*
 * Note, this heavily based on the bbop browse widget, and is attempt
 * to make functions more manager agnostic, i.e., this should accept
 * a golr jquery manager, or a more generic rest query manager.
 * 
 * As a starting point will just have this working with as a subclass of 
 *   
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.monarch == "undefined" ){ bbop.monarch = {}; }
if ( typeof bbop.monarch.widget == "undefined" ){ bbop.monarch.widget = {}; }

/*
 * Constructor: browse
 * 
 * Contructor for the bbop.widget.browse object.
 * 
 * This is a specialized (and widgetized) subclass of
 * <bbop.golr.manager.jquery>.
 * 
 * While everything in the argument hash is technically optional,
 * there are probably some fields that you'll want to fill out to make
 * things work decently. The options for the argument hash are:
 * 
 *  topology_graph_field -  the field for the topology graph
 *  transitivity_graph_field - the field for the transitivity graph
 *  info_button_callback - functio to call when info clicked, gets doc
 *  base_icon_url - the url base that the fragments will be added to
 *  image_type - 'gif', 'png', etc.
 *  current_icon - the icon fragment for the current term
 *  info_icon - the icon fragment for the information icon
 *  info_alt - the alt text and title for the information icon
 * 
 * The basic formula for the icons is: base_icon_url + '/' + icon +
 * '.' + image_type; then all spaces are turned to underscores and all
 * uppercase letters are converted into lowercase letters.
 * 
 * The functions for the callbacks look like function(<term acc>,
 * <json data for the specific document>){}. If no function is given,
 * an empty function is used.
 * 
 * Arguments:
 *  server - string url to SciGraph server;
 *  manager - a <bbop.rest.manager.jquery> object
 *  reference_id - starting ontology class ID
 *  interface_id - string id of the HTML element to build on
 *  in_argument_hash - *[optional]* optional hash of optional arguments
 * 
 * Returns:
 *  this object
 */
bbop.monarch.widget.browse = function(server, manager, reference_id, root, interface_id,
                  in_argument_hash){

    // Per-UI logger.
    var logger = new bbop.logger();
    logger.DEBUG = true;
    function ll(str){ logger.kvetch('B (widget): ' + str); }

    this._is_a = 'monarch.widget.browse';

    var anchor = this;
    var loop = bbop.core.each;
    
    // Our argument default hash.
    // Let's keep these in case we want to refactor to include a GOlr manager
    var default_hash =
    {
        'info_button_callback' : function(){},
        'base_icon_url' : null,
        'image_type' : 'gif',
        'current_icon' : 'this',
        'info_icon' : 'info',
        'info_alt' : 'Click for more information.'
    };
    var folding_hash = in_argument_hash || {};
    var arg_hash = bbop.core.fold(default_hash, folding_hash);

    // There should be a string interface_id argument.
    this._interface_id = interface_id;
    this._info_button_callback = arg_hash['info_button_callback'];
    var base_icon_url = arg_hash['base_icon_url'];
    var image_type = arg_hash['image_type'];
    var current_icon = arg_hash['current_icon'];
    var info_icon = arg_hash['info_icon'];
    var info_alt = arg_hash['info_alt'];
   
    // The current acc that we are interested in.
    this._current_acc = null;
    this._reference_id = reference_id;
    
    if (!root){
        root = "HP:0000118";
    }
    this._root = root;

    this.server = server;
    this.manager = manager;
    var isInitialRun = true;

    // Successful callbacks call draw_rich_layout.
    manager.register('success', 'do', draw_rich_layout);

    // Recursively draw a rich layout using nested uls.
    function draw_rich_layout(resp){
        
        var topo_graph = new bbop.model.bracket.graph();
        topo_graph.load_json(resp._raw);
        
        var subclass_manager = new bbop.rest.manager.jquery(bbop.rest.response.json);
        var rsrc =  anchor.server + "graph/neighbors/" + anchor._reference_id + ".json?&depth=1&blankNodes=false&relationshipType=subClassOf&direction=INCOMING&project=%2A";

        subclass_manager.resource(rsrc);
        subclass_manager.method('get');
        subclass_manager.jsonp_callback('callback');
        subclass_manager.register('success', 'do', combine_graphs);
        subclass_manager.update('search');
        
        function combine_graphs(resp){
            var subclass_graph = new bbop.model.bracket.graph();
            subclass_graph.load_json(resp._raw);
            topo_graph.merge_in(subclass_graph);
            
          ///
            /// Get the rich layout from the returned document if
            /// possible. Note the use of JSON, supplied by jQuery,
            /// instead of out internal method bbop.json.parse.
            ///

            var nodes_to_exclude = ['MESH:C', 'MESH:D035583', 'http://www.w3.org/2002/07/owl#Thing', 'HP:0000001'];
            
            var clean_graph = new bbop.model.bracket.graph();
            
            // Remove nodes with an underscore, also fix equivalencies so they always appear under a node
            loop(topo_graph.all_nodes(), function(ref_node){
                if (!/^_/.test(ref_node.id())){
                    clean_graph.add_node(ref_node);
                }
                var children = topo_graph.get_child_nodes(ref_node.id());
                    loop(children, function(n){
                        if (!/^_/.test(n.id()) && nodes_to_exclude.indexOf(ref_node.id()) == -1
                                && nodes_to_exclude.indexOf(n.id()) == -1 ){
                            
                            
                            var edge = new bbop.model.edge(n, ref_node, 
                                                           topo_graph.get_predicates(n.id(), ref_node.id())[0]);
                            
                            if (n.id() == anchor._current_acc 
                                    && topo_graph.get_predicates(n.id(), ref_node.id())[0] == 'equivalentClass' ){
                                edge = new bbop.model.edge(ref_node, n, 'equivalentClass');
                                clean_graph.add_edge(edge);
                            } else {
                                clean_graph.add_edge(edge);
                            }
                        }
                    });
                var parents = topo_graph.get_parent_nodes(ref_node.id());
                    loop(parents, function(n){
                        if (!/^_/.test(n.id()) && nodes_to_exclude.indexOf(ref_node.id()) == -1
                              && nodes_to_exclude.indexOf(n.id()) == -1){
                            
                            if (ref_node.id() != anchor._current_acc 
                                    && topo_graph.get_predicates(ref_node.id(), n.id())[0] != 'equivalentClass' ) {    
                               
                                var edge = new bbop.model.edge(ref_node, n, 
                                                               topo_graph.get_predicates(ref_node.id(), n.id())[0]);
                                clean_graph.add_edge(edge); 
                            }
                        }
                    });
            });
            topo_graph = clean_graph;

            
            var ancestors = topo_graph.get_ancestor_subgraph(anchor._current_acc, 'subClassOf');
            
            var trans_graph = new bbop.model.graph()
            
            loop(ancestors.all_nodes(), function(n){
                trans_graph.add_node(n);
                var edge = new bbop.model.edge(anchor._current_acc, n.id(), 'subClassOf');
                trans_graph.add_edge(edge);
            });
            

            var rich_layout = topo_graph.monarch_bracket_layout(anchor._current_acc,
                                     trans_graph);
            
            /* Fetch Equivalencies of each node
             * We can eliminate the last node in each list to shorten our call to
             * scigraph
             */
            var equivalent_graph_nodes = [];
          
            rich_layout.forEach(function (i) {
                i.forEach(function (val, index) {
                    if (index != i.length-1){
                        equivalent_graph_nodes.push(val[0]);
                    }
                });
            });
 
            if (equivalent_graph_nodes.length > 0){
            
                var jq_params = {
                        'relationshipType' : 'equivalentClass',
                        'depth' : 10,
                        'blankNodes' : 'false',
                        'direction' : 'BOTH'
                };
                var url = anchor.server + "graph/neighbors?id="+equivalent_graph_nodes.join("&id=");
                
                jQuery.ajax({
                    url: url,
                    data: jq_params,
                    jsonp: "callback",
                    dataType: "json",
                    error: function(){
                        console.log('ERROR: looking at: ' + query);
                        if (typeof error_function != 'undefined'){
                            error_function();
                        }
                    },
                    success: function(data) {
                    
                        var equivalent_graph = new bbop.model.graph();
                        equivalent_graph.load_json(data);
                    
                        rich_layout.forEach(function (v) {
                            if (v.length == 1){
                                return;
                            } else {
                                for (var i=0; i < v.length; i++) {
                                    var id = v[i][0];
                                    if (id) {
                                        var eq_node_list = [];
                                        //Get all equivalent nodes of v[i][0]
                                        var equivalent_nodes = equivalent_graph.get_ancestor_subgraph(id, 'equivalentClass')
                                        .all_nodes();
                                        var other_eq_nodes = equivalent_graph.get_descendent_subgraph(id, 'equivalentClass')
                                        .all_nodes();
                                    
                                        eq_node_list = equivalent_nodes.map(function(i){return i.id();});
                                        var temp_list = other_eq_nodes.map(function(i){return i.id();});
                                    
                                        eq_node_list.push.apply(eq_node_list, temp_list);
                                        //equivalent_node_list.map
                                
                                        for (var k=i+1; k < v.length; k++) {
                                            var node_id = v[k][0];
                                            if (node_id) {
                                                //console.log('comparing id: ' + id + ' to: ' + node_id);
                                                if (eq_node_list.indexOf(node_id) > -1){
                                                    
                                                    // If the id is from MESH
                                                    if (/^MESH/.test(id)){
                                                        //console.log('removing equivalent node '+ id);
                                                        v.splice(i,1)
                                                        i--;
                                                        break;
                                                    } else {
                                                        //console.log('removing equivalent node '+node_id);
                                                        v.splice(k, 1);
                                                        k--;
                                                        continue;
                                                    }
                                                }
                                            }
                                    
                                        }
                                    }
                                }
                            }
                        });
                    
                        draw_layout(rich_layout);
                    }
                });
            } else {
                draw_layout(rich_layout);
            }
            
            function draw_layout(rich_layout) {
            ///
            /// Next, produce the raw HTML skeleton.
            /// TODO: Keep a cache of the interesting ids for adding
            /// events later.
            ///

            // I guess we'll just start by making the list.
            var tl_attrs = {
                'class': 'bbop-js-ui-browse'
            };
            var top_level = new bbop.html.list([], tl_attrs);

            // Store the navigation anf info buttons.
            var nav_button_hash = {};
            var info_button_hash = {};

            // Cycle down through the brackets, adding spaces every time
            // we go down another level.
            var spacing = '&nbsp;&nbsp;&nbsp;&nbsp;';
            var spaces = spacing;
            loop(rich_layout, // for every level
                 function(layout_level){
                 loop(layout_level, // for every item at this level
                      function(level_item){           

                      var nid = level_item[0];
                      var lbl = level_item[1];
                      if (lbl) {
                          lbl = lbl.replace(/\b[a-z]/g, function() {
                              return arguments[0].toUpperCase()});
                          lbl = lbl.replace(/Abnormal\(Ly\)/,'Abnormal(ly)');
                      }
                      var rel = level_item[2];
                      
                      // For various sections, decide to run image
                      // (img) or text code depending on whether
                      // or not it looks like we have a real URL.
                      var use_img_p = true;
                      if( base_icon_url == null || base_icon_url == '' ){
                          use_img_p = false;
                      }

                      // Clickable acc span.
                      // No images, so the same either way. Ignore
                      // it if we're current.
                      var nav_b = null;
                      if(anchor._current_acc == nid){
                          var inact_attrs = {
                          'class': 'bbop-js-text-button-sim-inactive',
                          'title': 'Current term ( ' + nid + ' )',
                          'style': 'background-color: #4F5F65; color: white;'
                          };
                          nav_b = new bbop.html.span(lbl, inact_attrs);
                      }else{
                          var node = topo_graph.get_node(nid);
                          var metadata = node.metadata();
                          var bttn_title = 'Go to page for '+ nid;
                          if (metadata && metadata['definition']){
                              bttn_title = bttn_title + ": " + metadata['definition'];
                          }
                          var tbs = bbop.widget.display.text_button_sim;

                          var btn_attrs = {'style': 'background-color: #e3efff; border-style: none;'
                              };
                          if (anchor._reference_id == nid){
                              btn_attrs = {
                                  'style': 'background-color: #9EBFCB; border-style: none;'
                              };
                          }
                          nav_b = new tbs(lbl, bttn_title, null, btn_attrs);
                          nav_button_hash[nav_b.get_id()] = nid;
                      }

                      // Clickable info span. A little difference
                      // if we have images.
                      var info_b = null;
                      if( use_img_p ){
                          // Do the icon version.
                          var imgsrc = bbop.core.resourcify(base_icon_url,
                                        info_icon,
                                        image_type);
                          info_b =
                          new bbop.html.image({'alt': info_alt,
                                       'title': 'Go to page for '+lbl,
                                       'src': imgsrc,
                                       'style': 'cursor:pointer;',
                                       'generate_id': true});
                      }else{
                          // Do a text-only version.
                          info_b =
                          new bbop.html.span('<b>[i]</b>',
                                     {'generate_id': true});
                      }
                      info_button_hash[info_b.get_id()] = nid;

                      // "Icon". If base_icon_url is defined as
                      // something try for images, otherwise fall
                      // back to this text ick.
                      var icon = null;
                      if( use_img_p ){
                          // Do the icon version.
                          var ialt = '[' + rel + ']';
                          var isrc = null;
                          if(anchor._current_acc == nid){
                          isrc = bbop.core.resourcify(base_icon_url,
                                              current_icon,
                                          image_type);
                          }else{
                          isrc = bbop.core.resourcify(base_icon_url,
                                              rel, image_type);
                          }
                          icon =
                          new bbop.html.image({'alt': ialt,
                                       'title': rel,
                                       'src': isrc,
                                       'generate_id': true});
                      }else{
                          // Do a text-only version.
                          if(anchor._current_acc == nid){
                          icon = '[[->]]';
                          }else if( rel && rel.length && rel.length > 0 ){
                          icon = '[' + rel + ']';
                          }else{
                          icon = '[???]';
                          }
                      }
                      var spinner = makeSpinnerDiv();
                      // Stack the info, with the additional
                      // spaces, into the div.
                      if (nid != anchor._root){
                          top_level.add_to(spaces,
                                  //info_b.to_string(),
                                  icon,
                                  nav_b.to_string(),
                                  '&nbsp;', spinner);
                      } else {
                          top_level.add_to(spaces,  nav_b.to_string(), '&nbsp;', spinner); 
                      }
                      }); 
                 spaces = spaces + spacing;
                 }); 

            // Add the skeleton to the doc.
            jQuery('#' + anchor._interface_id).empty();
            jQuery('#' + anchor._interface_id).append(top_level.to_string());
            
            if (isInitialRun) {
                isInitialRun = false;
            } else {
                jQuery('html, body').animate({
                    scrollTop: jQuery(".bbop-js-text-button-sim-inactive").offset().top - 45
                }, 500);
            }

            ///
            /// Finally, attach any events to the browser HTML doc.
            ///

            // Navigation.
            loop(nav_button_hash,
                 function(button_id, node_id){

                 jQuery('#' + button_id).click(
                     function(){
                         
                         var tid = jQuery(this).attr('id');
                         var call_time_node_id = nav_button_hash[tid];
                         var newurl = "/resolve/"+call_time_node_id;
                         window.location.href = newurl;
                     });
                 });

            // Information.
            loop(info_button_hash,
                 function(button_id, node_id){

                 jQuery('#' + button_id).click(
                     function(){
                         var tid = jQuery(this).attr('id');
                         var call_time_node_id = info_button_hash[tid];
                         var newurl = "/resolve/"+call_time_node_id;
                         window.location.href = newurl;
                     
                     });
             });
             }
            
            
        }
    
        
    };
    
    /*
     * Function: draw_browser
     * 
     * Bootstraps the process.
     * 
     * Parameters:
     *  term_acc - acc of term we want to have as the term of interest
     * 
     * Returns
     *  n/a
     */
    this.draw_browser = function(root, middle, leaf, term_acc){
        anchor._current_acc = term_acc;
        // Data call setup
        // http://geoffrey.crbs.ucsd.edu:9000/scigraph/dynamic/browser/branch?start_id=MP%3A0005266&root_id=HP%3A0000118&leaf_id=HP%3A0011014
        var rsrc = this.server + "dynamic/browser/branch.json" + "?root_id=" + root 
                               + "&start_id=" + middle
                               + "&leaf_id=" + leaf + "&relationship=subClassOf|partOf|isA";
       
        anchor.manager.resource(rsrc);
        anchor.manager.method('get');
        anchor.manager.jsonp_callback('callback');
        
        anchor.manager.update('search');
    };
    
    /*
     * Function: init_browser
     * 
     * Bootstraps the process.
     * 
     * Parameters:
     *  term_acc - acc of term we want to have as the term of interest
     * 
     * Returns
     *  n/a
     */
    this.init_browser = function(term_acc){
        anchor._current_acc = term_acc;
        // Data call setup
        // var rsrc = this.server + "dynamic/browser.json" + "?start_id=" + term_acc + "&root_id=" + anchor._root+ "&relationship=subClassOf|partOf|isA";
        var rsrc = this.server + "graph/neighbors/" + term_acc + ".json?&depth=25&blankNodes=false&relationshipType=subClassOf&direction=OUTGOING&project=%2A";
       
        anchor.manager.resource(rsrc);
        anchor.manager.method('get');
        anchor.manager.jsonp_callback('callback');
        
        anchor.manager.update('search');
    };
    
    bbop.model.graph.prototype.get_descendent_subgraph = function(obj_id, pred){   
        var anchor = this;
        var edge_list = new Array();
        var descendent_graph = new bbop.model.graph();
        if (typeof anchor.seen_node_list === 'undefined') {
            anchor.seen_node_list = [obj_id];
        }
        
        anchor.get_child_nodes(obj_id, pred).forEach( function(sub_node) {
            var sub_id = sub_node.id();
            if (anchor.seen_node_list.indexOf(sub_id) > -1){
                return;
            }
            anchor.seen_node_list.push(sub_id);
            descendent_graph.add_edge(anchor.get_edge(sub_id, obj_id, pred));
            descendent_graph.add_node(anchor.get_node(sub_id));
            descendent_graph.add_node(anchor.get_node(obj_id));
            descendent_graph.merge_in(anchor.get_descendent_subgraph(sub_id, pred));
        });
            
        return descendent_graph; 
    };
    
    bbop.model.bracket.graph.prototype.monarch_bracket_layout = function(term_acc, transitivity_graph){
        var anchor = this;
        each = bbop.core.each;
        // First, lets just get our base bracket layout.
        var layout = anchor.bracket_layout(term_acc);
        var curr_acc;
        var isChildOfTerm = false;
        // So, let's go through all the rows, looking on the
        // transitivity graph to see if we can find the predicates.
        var bracket_list = [];
        each(layout, function(layout_level){
            var bracket = [];
            each(layout_level, function(layout_item){
            
            // The defaults for what we'll pass back out.
            curr_acc = layout_item;
            //var pred_id = 'is_a';
            // BUG/TODO: This is the temporary workaround for
            // incomplete transitivity graphs in some cases:
            // https://github.com/kltm/bbop-js/wiki/TransitivityGraph#troubleshooting-caveats-and-fail-modes
            
            // CHANGE FOR MONACH - MAKE DEFAULT CURRENT TERM
            var pred_id = 'current term';
            var curr_node = anchor.get_node(curr_acc);
            var label = curr_node.label() || layout_item;
            
            // Now we just have to determine predicates. If we're
            // the one, we'll just use the defaults.
            if( curr_acc == term_acc ) {
                // Try to get siblings here
                unique_list = {};
                loop(anchor.get_parent_nodes(curr_acc), function (n) {
                    loop(anchor.get_child_nodes(n.id()), function (sibling) {
                        if (sibling.id() != term_acc 
                                && !( sibling.id() in unique_list )) {
                            bracket.push([sibling.id(), sibling.label(),
                                          anchor.get_predicates(sibling.id(), n.id())[0]]);
                        }
                        unique_list[sibling.id()] = 1;
                    });
                });
            } else {
                // Since the transitivity graph only stores
                // ancestors, we can also use it to passively test
                // if these are children we should be looking for.
                var trels =
                transitivity_graph.get_predicates(term_acc, curr_acc);
                if( ! bbop.core.is_empty(trels) ){
                // Not children, so decide which of
                // the returned edges is the best.
                pred_id = anchor.dominant_relationship(trels);
                }else{
                // Probably children, so go ahead and try and
                // pull the direct parent/child relation.
                isChildOfTerm = true;
                var drels = anchor.get_predicates(curr_acc, term_acc);
                if( ! bbop.core.is_empty(drels) ){
                    pred_id = anchor.dominant_relationship(drels);
                }
                }
            }
            
            // Turn our old layout item into a new-info
            // rich list.
            bracket.push([curr_acc, label, pred_id]);
            });
            // Sort alphanum and then re-add to list. Skip if current_acc
            if( curr_acc != term_acc ) {
           
                bracket.sort(function(a, b) {
                    if( a[1] < b[1] ){
                        return -1;
                    } else if( a[1] > b[1] ) {
                        return 1;
                    } else {
                        return 0;
                    }
                });
            }
            if ( isChildOfTerm ) {
                // Make sure the class with additional children is at the bottom of the list        
                for (i=0; i < bracket.length; i++){
                    if (anchor.get_child_nodes(bracket[i][0]).length > 0){
                        bracket.splice((bracket.length-1), 0, bracket.splice(i, 1)[0]);
                        break;
                    }
                }
            }
            bracket_list.push(bracket);
            
            // This only works because we know there is only one relationship
            // from child to the starting class
            if ( isChildOfTerm ) {
                function addToBracket(id) {
                    var new_bracket = [];
                    loop(anchor.get_child_nodes(id), function (n) {
                        new_bracket.push([n.id(), n.label(),
                                      anchor.get_predicates(n.id(), id)[0]]);
                        bracket_list.push(new_bracket);
                        addToBracket(n.id());
                    });            
                }
                if (bracket.length-1 > 0){
                    addToBracket(bracket[bracket.length-1][0]);
                }
            }
        });
        return bracket_list;
    };
    function makeSpinnerDiv(){
        // Details for spinner
           var inspan = new bbop.html.tag('span', {'class': 'sr-only'}, '...');
           var indiv = new bbop.html.tag('div', {'class': 'progress-bar',
                             'role': 'progressbar',
                             'aria-valuenow': '100',
                             'aria-valuemin': '0',
                             'aria-valuemax': '100',
                             'style': 'width: 100%;'},
                         inspan);
           var spinner_div =
           new bbop.html.tag('div',
                     {'generate_id': true,
                      'class':
                      'progress progress-striped active',
                      'style': 'width: 3em; position:absolute; display:inline-block; display:none; margin-bottom:3px;'},
                     indiv);
           
           return spinner_div;
       }
};
