function InitMonarch() {
    var jq = require('jquery');
    if (typeof(globalUseBundle) === 'undefined' || !globalUseBundle) {
        var bbop = loaderGlobals.bbop;
    }
    else {
        var bbop = require('bbop');
    }

// Module and namespace checking.
// if ( typeof bbop == "undefined" ){ var bbop = {}; }

if ( typeof bbop.monarch == "undefined" ){ bbop.monarch = {}; }
if ( typeof bbop.monarch.widget == "undefined" ){ bbop.monarch.widget = {}; }

if (typeof(loaderGlobals) === 'object') {
    loaderGlobals.bbop = bbop;
}
if (typeof(global) === 'object') {
    global.bbop = bbop;
}
if( typeof(exports) != 'undefined' ) {
    exports.bbop = bbop;
}

// This is a prefixing header fragment of a JS file. It opens up a function scope closed by 
// the loaderFooter.js file.
// These files sandwich the other files in scripts/release-file-map.txt
//
/* 
 * Package: handler.js
 * 
 * Namespace: bbop.monarch.handler
 * 
 * External inks generated with conf/xrefs.json
 * Global variables passed by PupTent in webapp.js:
 * 
 * global_xrefs_conf: Xrefs conf file from conf/xrefs.json
 */

// The beginnings of a monarch specific handler, just a copy of amigo's
// handler right now

/*
 * Constructor: handler
 * 
 * Create an object that will run functions in the namespace with a
 * specific profile.
 * 
 * These functions have a well defined interface so that other
 * packages can use them (for example, the results display in
 * LiveSearch.js).
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  self
 */
bbop.monarch.handler = function (){
    this._is_a = 'bbop.monarch.handler';

    var is_def = bbop.core.is_defined;

    // Let's ensure we're sane.
    if(!global_xrefs_conf){
                throw new Error('global_xrefs_conf is missing!');
    }

    // Okay, since trying functions into existence is slow, we'll
    // create a cache of strings to functions.
    this.mangle = bbop.core.uuid();
    this.string_to_function_map = {};
    this.entries = 0; // a little extra for debugging and testing
};

/*
 * Function: dispatch
 * 
 * Return a string.
 * 
 * The fallback function is called if no match could be found in the
 * global_xrefs_conf. It is called with the name and context
 * arguments in the same order.
 * 
 * Arguments:
 *  data - the incoming thing to be handled
 *  name - the field name to be processed
 *  context - *[optional]* a string to add extra context to the call
 *  fallback - *[optional]* a fallback function to call in case nothing is found
 * 
 * Returns:
 *  string; null if it couldn't create anything
 */
bbop.monarch.handler.prototype.dispatch = function(data, name, context, fallback){
    
    // Aliases.
    var is_def = bbop.core.is_defined;
    
    // First, get the specific id for this combination.
    var did = name || '';
    did += '_' + this.mangle;
    if( context ){
	did += '_' + context;
    }

    // If the combination is not already in the map, fill it in as
    // best we can.
    if(!is_def(this.string_to_function_map[did])){
	
	this.entries += 1;

	// First, try and get the most specific.

	if( is_def(global_xrefs_conf[name]) ){

	    var field_hash = global_xrefs_conf[name];
	    var function_string = null;

	    if (is_def(field_hash['context']) 
                && is_def(field_hash['context'][context])){
		    // The most specific.
		    function_string = field_hash['context'][context];
	    } else {
		// If the most specific cannot be found, try and get
		// the more general one.
		if (is_def(field_hash['default'])){
		    function_string = field_hash['default'];
        }
    }

	    // At the end of this section, if we don't have a string
	    // to resolve into a function, the data format we're
	    // working from is damaged.
	    if (function_string == null){
            throw new Error('global_xrefs_conf appears to be damaged!');
        }
	    
	    // We have a string. Pop it into existance with eval.
	    var evalled_thing = eval(function_string);

	    // Final test, make sure it is a function.
	    if (! is_def(evalled_thing) 
	            || evalled_thing == null 
	            || bbop.core.what_is(evalled_thing) != 'function'){
            throw new Error('"' + function_string + '" did not resolve!');
	    } else {
            this.string_to_function_map[did] = evalled_thing;		
	    }

	} else if( is_def(fallback) ){
	    // Nothing could be found, so add the fallback if it is
	    // there.
	    this.string_to_function_map[did] = fallback;
	}else{
	    // Whelp, nothing there, so stick an indicator in.
	    this.string_to_function_map[did] = null;
	}
    }

    // We are now ensured that either we have a callable function or
    // null, so let's finish it--either the return value of the called
    // function or null.
    var retval = null;
    if(this.string_to_function_map[did] != null){
        var cfunc = this.string_to_function_map[did];
        retval = cfunc(data, name, context);
    }

    return retval;
};
/* 
 * Package: linker.js
 * 
 * Namespace: bbop.monarch.linker
 * 
 * Generic Monarch link generator
 * 
 * Server information generated from conf/server_config*
 * files
 * 
 * External inks generated with conf/xrefs.json
 * 
 * Global variables passed by PupTent in webapp.js:
 * 
 * global_app_base: App host address from conf/server_config*
 * global_xrefs_conf: Xrefs conf file from conf/xrefs.json
 * 
 */

/*
 * Constructor: linker
 * 
 * Create an object that can make URLs and/or anchors.
 * 
 * These functions have a well defined interface so that other
 * packages can use it.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  self
 */
bbop.monarch.linker = function (){
    this._is_a = 'bbop.monarch.linker';

    // With the new dispatcher, relative URLs no longer work, so we
    // have to bring in server data--first let's ensure it.
    if(typeof global_app_base === 'undefined'){
    throw new Error('we are missing access to global_app_base!');
    }
    // Easy app base.
    this.app_base = ""; //use relative path

    // Categories for different special cases (internal links).
    this.generic_item = {
        'subject': true,
        'object': true
    };
};

/*
 * Function: url
 * 
 * Return a url string.
 * 
 * Arguments:
 *  args - id
 *  xid - *[optional]* an internal transformation id
 *  modifier - *[optional]* modify xid; only used with xid
 * 
 * Returns:
 *  string (url); null if it couldn't create anything
 */
bbop.monarch.linker.prototype.url = function (id, xid, modifier, category){
    
    var retval = null;

    ///
    /// Monarch hard-coded internal link types.
    ///

    // For us, having an xid means that we will be doing some more
    // complicated routing.
    if(xid && xid != ''){

        // First let's do the ones that need an associated id to
        // function--either data urls or searches.
        if(id && id != ''){
            if(this.generic_item[xid]){
                if (typeof category === 'undefined'){
                    throw new Error('category is missing!');
                } else if (category != 'pathway' && !(/^_/.test(id))){
                    retval = this.app_base + '/' + category + '/' + id;
                }
            }
        }
    
        // Since we couldn't find anything with our explicit local
        // transformation set, drop into the great abyss of the xref data.
        if(!retval && id && id != ''){ // not internal, but still has an id
            if(!global_xrefs_conf){
                throw new Error('global_xrefs_conf is missing!');
            }
    
            // First, extract the probable source and break it into parts.
            var full_id_parts = bbop.core.first_split(':', id);
            if(full_id_parts && full_id_parts[0] && full_id_parts[1]){
                var src = full_id_parts[0];
                var sid = full_id_parts[1];
        
                // Now, check to see if it is indeed in our store.
                var lc_src = src.toLowerCase();
                var xref = global_xrefs_conf[lc_src];
                if (xref && xref['url_syntax']){
                    retval =
                        xref['url_syntax'].replace('[example_id]', sid, 'g');
                }
            }
        }
    }
    return retval;
};

/*
 * Function: img
 * 
 * Return a html img string.
 * 
 * Arguments:
 *  args - id
 *  xid - *[optional]* an internal transformation id
 *  modifier - *[optional]* modify xid; only used with xid
 * 
 * Returns:
 *  string (img tag); null if it couldn't create anything
 */
bbop.monarch.linker.prototype.img = function (id, xid, modifier, category){
    
    var retval = null;

    ///
    /// Monarch hard-coded internal link types.
    ///

    // For us, having an xid means that we will be doing some more
    // complicated routing.
    if(xid && xid != ''){

        if(!retval && id && id != ''){ // not internal, but still has an id
            if(!global_xrefs_conf){
                throw new Error('global_xrefs_conf is missing!');
            }
            var src;
            if (/^http/.test(id)){
                src = id.replace(/.*\/(\w+)\.ttl/, "$1");
            } else {
    
                // First, extract the probable source and break it into parts.
                var full_id_parts = bbop.core.first_split(':', id);
                if(full_id_parts && full_id_parts[0] && full_id_parts[1]){
                    src = full_id_parts[0];
                }
            }
            
            if (src) {
                
                // Now, check to see if it is indeed in our store.
                var lc_src = src.toLowerCase();
                var xref = global_xrefs_conf[lc_src];
                if (xref && xref['image_path']){
                    retval = '<img class="source" src="' + this.app_base 
                              + xref['image_path'] + '"/>';
                }
            }
        }
    }
    return retval;
};


/*
 * Function: anchor
 * 
 * Return a link as a chunk of HTML, all ready to consume in a
 * display.
 * 
 * If args['id'] is a list then iterate over this.set_anchor()
 * 
 * Arguments:
 *  args - hash--'id' required; 'label' and 'hilite' are inferred if not extant
 *  xid - *[optional]* an internal transformation id
 *  rest - *[optional]* modify xid; only used with xid
 * 
 * Returns:
 *  string (link); null if it couldn't create anything
 */
bbop.monarch.linker.prototype.anchor = function(args, xid, modifier){
    
    var anchor = this;
    var retval = null;

    // Don't even start if there is nothing.
    if(args){
        // Get what fundamental arguments we can.
        var id = args['id'];
        if (typeof id === 'string'){
            retval = this.set_anchor(id, args, xid, modifier);
        } else if (id instanceof Array){
            retval = '';
            for (var i = 0, l = id.length; i < l; i++){
                var anchor_tag = this.set_anchor(id[i], args, xid, modifier);
                
                if (anchor_tag){
                    retval = retval + ((retval) ? ', ' + anchor_tag : anchor_tag);
                } 
            }
            if (retval === ''){
                retval = null;
            }
        }
    }

    return retval;
};

/*
 * Function: set_anchor
 * 
 * Return a link as a chunk of HTML, all ready to consume in a
 * display.
 */
bbop.monarch.linker.prototype.set_anchor = function(id, args, xid, modifier){
    
    var retval = null;
    var label = args['label'];
    if (!label){ 
        label = id; 
    }
    
    // Infer hilite from label if not present.
    var hilite = args['hilite'];
    if (!hilite){ hilite = label; }
    
    var category = args['category'];
    
    // See if the URL is legit. If it is, make something for it.
    var url = this.url(id, xid, modifier, category);
    var img = this.img(id, xid, modifier, category);
    if (url){

        // If it wasn't in the special transformations, just make
        // something generic.
        if (!retval && img
                && xid == 'source-site'){
            retval = '<a title="' + id +
            ' (go to source page)" href="' + url + '">' + img + '</a>';
        } else if (!retval && img
                && xid == 'source'){
            retval = '<a title="' + id +
            ' (go to source page) " + href="' + url + '">' + id + '</a>';
        }
        else if (!retval){
            // We want to escape < and >
            // should probably break out into function
            hilite = hilite.replace(/\>/g,'&gt;');
            hilite = hilite.replace(/\</g,'&lt;');
            
            retval = '<a title="' + id +
            ' (go to the page for ' + label +
            ')" href="' + url + '">' + hilite + '</a>';
        }
    } else {
        // Check if id is an is_defined_by url
        var title = "";
        if (/^http/.test(id)){
            var src = id.replace(/.*\/(\w+)\.ttl/, "$1");
            var lc_src = src.toLowerCase();
            var xref = global_xrefs_conf[lc_src];
            if (xref && xref['database']){
                title = xref['database'];
            }
        }
        if (!retval && img
                && xid == 'is_defined_by'){
            retval = '<span title="' + title + '">' + img + '</span>';
        }
    }
    return retval;
}
    

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
 *  eq_id - string id of the original id (in cases in which we need to
 *          use the clique leader to generate the view
 *  eq_label - string label of the original label
 *  in_argument_hash - *[optional]* optional hash of optional arguments
 * 
 * Returns:
 *  this object
 */
bbop.monarch.widget.browse = function(server, manager, reference_id, root, interface_id, eq_id, eq_label,
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
    this._eq_id = eq_id;
    this._eq_label = eq_label;

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

            draw_layout(rich_layout);
            
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
                          lbl = lbl.replace(/\b'?[a-z]/g, function() {
                              if (!/'/.test(arguments[0])) {
                                  return arguments[0].toUpperCase()
                              } else {
                                  return arguments[0];
                              }
                          });
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
                          if (typeof anchor._eq_id != 'undefined') {
                              nid = anchor._eq_id;
                              lbl = anchor._eq_label;
                          }
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
        var each = bbop.core.each;
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
                var unique_list = {};
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
                for (var i=0; i < bracket.length; i++){
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
/*
 * Package: results_table_by_class_conf_bs3.js
 * 
 * Namespace: bbop.widget.display.results_table_by_class_conf_bs3
 * 
 * Subclass of <bbop.html.tag>.
 */

if ( typeof bbop.monarch.widget.display == "undefined" ){ bbop.monarch.widget.display = {}; }

/*
 * Function: results_table_by_class_conf_bs3
 *
 * Using a conf class and a set of data, automatically populate and
 * return a results table.
 *  
 * This is the Bootstrap 3 version of this display. It affixes itself
 * directly to the DOM using jQuery at elt_id.
 *  
 * Parameters:
 *  class_conf - a <bbop.golr.conf_class>
 *  golr_resp - a <bbop.golr.response>
 *  linker - a linker object; see <amigo.linker> for more details
 *  handler - a handler object; see <amigo.handler> for more details
 *  elt_id - the element id to attach it to
 *  selectable_p - *[optional]* whether to create checkboxes (default true)
 *
 * Returns:
 *  this object
 *
 * See Also:
 *  <bbop.widget.display.results_table_by_class>
 */
bbop.monarch.widget.display.results_table_by_class_conf_bs3 = function(cclass,
							      golr_resp,
							      linker,
							      handler,
							      elt_id,
							      selectable_p,
							      select_toggle_id,
							      select_item_name){

    //
    var anchor = this;

    // Temp logger.
    var logger = new bbop.logger();
    //logger.DEBUG = true;
    logger.DEBUG = false;
    function ll(str){ logger.kvetch('RTBCCBS3: ' + str); }

    // Tie important things down for cell rendering prototype.
    anchor._golr_response = golr_resp;
    anchor._linker = linker;
    anchor._handler = handler;

    // Conveience aliases.
    var each = bbop.core.each;
    var is_defined = bbop.core.is_defined;

    // The context we'll deliver to
    var display_context = 'bbop.widgets.search_pane';

    // Only want to compile once.
    var ea_regexp = new RegExp("\<\/a\>", "i"); // detect an <a>
    var br_regexp = new RegExp("\<br\ \/\>", "i"); // detect a <br />
    var sp_regexp = new RegExp("\&nbsp\;", "i"); // detect a &nbsp;
    var img_regexp = new RegExp("\<img", "i"); // detect a <img

    // // Sort out whether we want to display checkboxes. Also, give life
    // // to the necessary variables if they will be called upon.
    // var select_toggle_id = null;
    // var select_item_name = null;
    // if( is_defined(selectable_p) && selectable_p == true ){

    // }

    // Now take what we have, and wrap around some expansion code
    // if it looks like it is too long.
    var trim_hash = {};
    var trimit = 100;
    function _trim_and_store( in_str ){

	var retval = in_str;

	//ll("T&S: " + in_str);

	// Skip if it is too short.
	//if( ! ea_regexp.test(retval) && retval.length > (trimit + 50) ){
	if( retval.length > (trimit + 50) ){
	    //ll("T&S: too long: " + retval);

	    // Let there be tests.
	    var list_p = br_regexp.test(retval);
	    var anchors_p = ea_regexp.test(retval);
	    var space_p = sp_regexp.test(retval);

	    var tease = null;
	    if( ! anchors_p && ! list_p && ! space_p){
		// A normal string then...trim it!
		//ll("\tT&S: easy normal text, go nuts!");
		tease = new bbop.html.span(bbop.core.crop(retval, trimit, ''),
					   {'generate_id': true});
	    }else if( anchors_p && ! list_p ){
		// It looks like it is a link without a break, so not
		// a list. We cannot trim this safely.
		//ll("\tT&S: single link so cannot work on!");
	    }else{
		//ll("\tT&S: we have a list to deal with");
		
		var new_str_list = retval.split(br_regexp);
		if( new_str_list.length <= 3 ){
		    // Let's just ignore lists that are only three
		    // items.
		    //ll("\tT&S: pass thru list length <= 3");
		}else{
		    //ll("\tT&S: contruct into 2 plus tag");
		    var new_str = '';
		    new_str = new_str + new_str_list.shift();
		    new_str = new_str + '<br />';
		    new_str = new_str + new_str_list.shift();
		    tease = new bbop.html.span(new_str, {'generate_id': true});
		}
	    }

	    // If we have a tease, assemble the rest of the packet
	    // to create the UI.
	    if( tease ){
		// Setup the text for tease and full versions.
		function bgen(lbl, dsc){
		    var b = new bbop.html.button(
  			lbl,
			{
			    'generate_id': true,
			    'type': 'button',
			    'title': dsc || lbl,
			    //'class': 'btn btn-default btn-xs'
			    'class': 'btn btn-primary btn-xs'
			});
		    return b;
		}
		var more_b = new bgen('more...', 'Display the complete list');
		var full = new bbop.html.span(retval,
					      {'generate_id': true});
		var less_b = new bgen('less', 'Display the truncated list');
		
		// Store the different parts for later activation.
		var tease_id = tease.get_id();
		var more_b_id = more_b.get_id();
		var full_id = full.get_id();
		var less_b_id = less_b.get_id();
		trim_hash[tease_id] = 
		    [tease_id, more_b_id, full_id, less_b_id];
		
		// New final string.
		retval = tease.to_string() + " " +
		    more_b.to_string() + " " +
		    full.to_string() + " " +
		    less_b.to_string();
	    }
	}

	return retval;
    }

    // Create a locally mangled checkbox.
    function _create_select_box(val, id, name){
	if( ! is_defined(name) ){
	    name = select_item_name;	    
	}
	
	var input_attrs = {
	    'value': val,
	    'name': name,
	    'type': 'checkbox'
	};
	if( is_defined(id) ){
	    input_attrs['id'] = id;
	}
	var input = new bbop.html.input(input_attrs);
	return input;
    }

    ///
    /// Render the headers.
    ///

    // Start with score, and add the others by order of the class
    // results_weights field.
    // var headers = ['score'];
    // var headers_display = ['Score'];
    var headers = [];
    var headers_display = [];
    if( selectable_p ){
	// Hint for later.
	headers.push(select_toggle_id);

	// Header select for selecting all.
	var hinp = _create_select_box('', select_toggle_id, '');
	//headers_display.push('All ' + hinp.to_string());
	headers_display.push(hinp.to_string());
    }
    var results_order = cclass.field_order_by_weight('result');
    each(results_order,
	 function(fid){
	     // Store the raw headers/fid for future use.
	     headers.push(fid);
	     // Get the headers into a presentable state.
	     var field = cclass.get_field(fid);
	     if( ! field ){ throw new Error('conf error: not found:' + fid); }
	     //headers_display.push(field.display_name());
	     var fdname = field.display_name();
	     var fdesc = field.description() || '???';
	     var head_span_attrs = {
		 // TODO/NOTE: to make the tooltip work properly, since the
		 // table headers are being created each time,
		 // the tooltop initiator would have to be called after
		 // each pass...I don't know that I want to do that.
		 //'class': 'bbop-js-ui-hoverable bbop-js-ui-tooltip',
		 'class': 'bbop-js-ui-hoverable',
		 'title': fdesc
	     };
	     // More aggressive link version.
	     //var head_span = new bbop.html.anchor(fdname, head_span_attrs);
	     var head_span = new bbop.html.span(fdname, head_span_attrs);
	     headers_display.push(head_span.to_string());
	 });

    ///
    /// Render the documents.
    ///

    // Cycle through and render each document.
    // For each doc, deal with it as best we can using a little
    // probing. Score is a special case as it is not an explicit
    // field.
    var table_buff = [];
    var docs = golr_resp.documents();
    each(docs, function(doc){
	     
	// Well, they had better be in here, so we're just gunna cycle
	// through all the headers/fids.
	var entry_buff = [];
	each(headers, function(fid){
	    // Detect out use of the special selectable column and add
	    // a special checkbox there.
	    if( fid == select_toggle_id ){
		// Also
		var did = doc['id'];
		var dinp = _create_select_box(did);
		entry_buff.push(dinp.to_string());
	    }else if( fid == 'score' ){
		// Remember: score is also
		// special--non-explicit--case.
		var score = doc['score'] || 0.0;
		score = bbop.core.to_string(100.0 * score);
		entry_buff.push(bbop.core.crop(score, 4) + '%');
	    }else{
		
		// Not "score", so let's figure out what we can
		// automatically.
		var field = cclass.get_field(fid);
		
		// Make sure that something is there and that we can
		// iterate over whatever it is.
		var bits = [];
		if( doc[fid] ){
		    if( field.is_multi() ){
			//ll("Is multi: " + fid);
			bits = doc[fid];
		    }else{
			//ll("Is single: " + fid);
			bits = [doc[fid]];
		    }
		}
		//Terrible hack to add qualifier when relation is null
		if (fid == 'relation' && bits.length == 0) {
		    if( doc['qualifier'] ){
		        var qual_field = cclass.get_field('qualifier');
	            if( qual_field.is_multi() ){
	            //ll("Is multi: " + fid);
	            bits = doc['qualifier'];
	            }else{
	            //ll("Is single: " + fid);
	            bits = [doc['qualifier']];
	            }
	        }
		}
		// Render each of the bits.
		var tmp_buff = [];
		each(bits, function(bit){
		    var out = anchor.process_entry(bit, fid, doc, display_context);
		    tmp_buff.push(out);
		});
		// Join it, trim/store it, push to to output.
        var joined;
		//Terrible hack to remove breaks for images
		if (img_regexp.test(tmp_buff)){
		    joined = tmp_buff.join('&nbsp;&nbsp;');
		} else {
		    joined = tmp_buff.join('<br />');
		}
		
		entry_buff.push(_trim_and_store(joined));
	    }
	});
	table_buff.push(entry_buff);
    });
	
    // Add the table to the DOM.
    var final_table =
	new bbop.html.table(headers_display, table_buff,
			    {'class': 'table table-striped table-hover table-condensed'});
	// new bbop.html.table(headers_display, table_buff,
	// 		    {'class': 'bbop-js-search-pane-results-table'});
    jQuery('#' + elt_id).append(bbop.core.to_string(final_table));
    
    // Add the roll-up/down events to the doc.
    each(trim_hash, function(key, val){
	var tease_id = val[0];
	var more_b_id = val[1];
	var full_id = val[2];
	var less_b_id = val[3];
	
	// Initial state.
	jQuery('#' + full_id ).hide();
	jQuery('#' + less_b_id ).hide();
	
	// Click actions to go back and forth.
	jQuery('#' + more_b_id ).click(function(){
	    jQuery('#' + tease_id ).hide();
	    jQuery('#' + more_b_id ).hide();
	    jQuery('#' + full_id ).show('fast');
	    jQuery('#' + less_b_id ).show('fast');
	});
	jQuery('#' + less_b_id ).click(function(){
	    jQuery('#' + full_id ).hide();
	    jQuery('#' + less_b_id ).hide();
	    jQuery('#' + tease_id ).show('fast');
	    jQuery('#' + more_b_id ).show('fast');
	});
    });

    // Since we already added to the DOM in the table, now add the
    // group toggle if the optional checkboxes are defined.
    if( select_toggle_id && select_item_name ){
	jQuery('#' + select_toggle_id).click(function(){
	    var cstr = 'input[id=' + select_toggle_id + ']';
	    var nstr = 'input[name=' + select_item_name + ']';
	    if( jQuery(cstr).prop('checked') ){
		jQuery(nstr).prop('checked', true);
	    }else{
		jQuery(nstr).prop('checked', false);
	    }
	});
    }
};

/*
 * Function: process_entry
 *
 * The function used to render a single entry in a cell in the results
 * table. It can be overridden to specify special behaviour. There may
 * be multiple entries within a cell, but they will all have this
 * function individually run over them.
 *
 * This function can access this._golr_response (a
 * <bbop.golr.response>), this._linker (a <bbop.linker>), and
 * this._handler (a <bbop.handler>).
 *
 * Arguments:
 *  bit - string (?) for the one entry in the cell
 *  field_id - string for the field under consideration
 *  document - the single document for this item from the solr response
 *
 * Returns:
 *  string or empty string ('')
 */
bbop.monarch.widget.display.results_table_by_class_conf_bs3.prototype.process_entry = 
    function(bit, field_id, document, display_context){
	
    	var anchor = this;

	// First, allow the hanndler to take a whack at it. Forgive
	// the local return. The major difference that we'll have here
	// is between standard fields and special handler fields. If
	// the handler resolves to null, fall back onto standard.
	//ll('! B:' + bit + ', F:' + fid + ', D:' + display_context);
	var out = anchor._handler.dispatch(bit, field_id, display_context);
	if( bbop.core.is_defined(out) && out != null ){
	    return out;
	}

	// Otherwise, use the rest of the context to try and render
	// the item.
    	var retval = '';
    	var did = document['id'];
	
    	// BUG/TODO: First see if the filed will be multi or not.
    	// If not multi, follow the first path. If multi, break it
    	// down and try again.
	
    	// Get a label instead if we can.
    	var ilabel = anchor._golr_response.get_doc_label(did, field_id, bit);
    	if( ! ilabel ){
    	    ilabel = bit;
    	}
	
    	// Extract highlighting if we can from whatever our "label"
    	// was.
    	var hl = anchor._golr_response.get_doc_highlight(did, field_id, ilabel);
	
    	// See what kind of link we can create from what we got.
    	var ilink =
    	    anchor._linker.anchor({id:bit, label:ilabel, hilite:hl}, field_id);
	
    	//ll('processing: ' + [field_id, ilabel, bit].join(', '));
    	//ll('ilink: ' + ilink);
	
    	// See what we got, in order of how much we'd like to have it.
    	if( ilink ){
    	    retval = ilink;
    	}else if( ilabel ){
    	    retval = ilabel;
    	}else{
    	    retval = bit;
    	}
	
    	return retval;
    };
}	// Closes the InitMonarch function


if (typeof(loaderGlobals) === 'object') {
    loaderGlobals.InitMonarch = InitMonarch;
}
if (typeof(global) === 'object') {
    global.InitMonarch = InitMonarch;
}
