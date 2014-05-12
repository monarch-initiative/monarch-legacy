////
//// An abstraction of the drawing routine used several places.
////

function CytoDraw(graph, focus_node_list,
		  layout_name, context, elt_id,
		  start_wait, stop_wait, data_call){
    
    var logger = new bbop.logger('CD');
    logger.DEBUG = true;
    function ll(str){ logger.kvetch(str); }

    // Aliases.
    var each = bbop.core.each;

    ll('in');

    // Convert the focus node list into a usable hash.
    var focus_nodes = {};
    each(focus_node_list,
	 function(fn){
	     focus_nodes[fn] = true;
	 });
    
    // Get the layout information into the position object
    // required by cytoscape.js for sugiyama in grid, if required.
    var position_object = {};
    if( layout_name == 'sugiyama' ){
	var renderer = new bbop.layout.sugiyama.render();
	var layout = renderer.layout(graph);
	var layout_nodes = layout.nodes;
	each(layout_nodes,
	     function(ln){
		 position_object[ln['id']] = {x: ln['x'], y: ln['y']};
	     });
    }
    function get_pos(cn){
	var po = position_object[cn.id()];
	return {row: po['y'], col: po['x']};
    }
	
    // Nodes.
    var cyroots = [];
    var cynodes = [];
    var info_lookup = {};
    each(graph.all_nodes(),
	 function(node){
	     ll('node: ' + node.id());
	     info_lookup[node.id()] = {
		 'id': node.id(), 
		 'label': node.label() || node.id()
	     };
	     if( graph.is_root_node(node.id()) ){
		 cyroots.push(node.id());
	     }
	     var node_opts = {
		 //'group': 'nodes',
		 'data': {
		     'id': node.id(), 
		     'label': node.label() || node.id()
		 },
		 'grabbable': true
	     };
	     // Highlight the focus if there.
	     if( focus_nodes[node.id()] ){
		 node_opts['css'] = { 'background-color': '#111111' };
	     }
	     cynodes.push(node_opts);
	 });
    
    // Edges.
    var cyedges = [];
    each(graph.all_edges(),
	 function(edge){
	     var sub = edge.subject_id();
	     var obj = edge.object_id();
	     var prd = edge.predicate_id();
	     var clr = context.color(prd);
             var eid = '' + prd + '_' + sub + '_' + obj;
	     ll('edge: ' + eid);
	     cyedges.push(
                 {
		     //'group': 'edges',
		     'data': {
                         'id': eid,
                         'pred': prd,
                         // 'source': sub,
                         // 'target': obj
                         'source': obj,
                         'target': sub
		     },
		     css: {
			 'line-color': clr
		     }
                 });
	 });

    // Render.
    var elements = {nodes: cynodes, edges: cyedges};
	
    var layout_opts = {
	'sugiyama': {
            'name': 'grid',
	    'padding': 30,
	    'position': get_pos
	},
	'random': {
	    name: 'random'//,
	    // fit: true
	},
	'grid': {
	    name: 'grid',
	    // fit: true,
	    padding: 30,
	    rows: undefined,
	    columns: undefined
	},
	'circle': {
	    name: 'circle'//,
	    //fit: true
	},
	'concentric': {
	    name: 'concentric'//,
	    //fit: true
	},
	'breadthfirst': {
            'name': 'breadthfirst',
            'directed': true,
            //'fit': true,
	    //'maximalAdjustments': 0,
	    'circle': false,
	    'roots': cyroots
	},
	// 'arbor': {
	// },
	'cose': {
            'name': 'cose'//,
            // 'directed': true,
            // //'fit': true,
	    // //'maximalAdjustments': 0,
	    // 'circle': false,
	    // 'roots': cyroots
	}
    };
    
    jQuery('#' + elt_id).cytoscape(
        {
	    userPanningEnabled: true, // pan over box select
	    'elements': elements,
	    'layout': layout_opts[layout_name],
	    hideLabelsOnViewport: true, // opt
	    hideEdgesOnViewport: true, // opt
	    textureOnViewport: true, // opt
	    'style': [
                {
		    selector: 'node',
		    css: {
                        'content': 'data(label)',
			'font-size': 8,
			'min-zoomed-font-size': 6, //10,
                        'text-valign': 'center',
                        'color': 'white',
			'shape': 'roundrectangle',
                        'text-outline-width': 2,
                        'text-outline-color': '#222222'
		    }
                },
                {
		    selector: 'edge',
		    css: {
                        //'content': 'data(pred)', // opt
                        'width': 2,
			//'curve-style': 'haystack', // opt
                        'line-color': '#6fb1fc'
                        //'source-arrow-shape': 'triangle' // opt
		    }
                }
	    ]
        });
    
    var cy = jQuery('#' + elt_id).cytoscape('get');

    // Bind event.
    cy.nodes().bind('click',
		    function(e){
			e.stopPropagation();
			var nid = e.cyTarget.id();
			start_wait(),
			data_call(nid);
		    });
    cy.nodes().bind('mouseover',
		    function(e){
			e.stopPropagation();
			var nid = e.cyTarget.id();
			var nlbl = info_lookup[nid]['label'];
 			var popt = {
			    title: nid,
			    content: nlbl,
			    animation: false,
			    placement: 'top',
			    trigger: 'manual'
			};
			//jQuery(this).popover(popt);
			//jQuery(this).popover('show');
			// TODO/BUG: this popover positioning got out of
			// hand; just rewrite doing it manually with a
			// div from bootstrap like normal people.
			// (couldn't do it the obvious way because the
			// canvas elements are just layers with nothing
			// to adere to).
			var epos = e.cyRenderedPosition;
			jQuery(e.originalEvent.target).popover(popt);
			jQuery(e.originalEvent.target).popover('show');
			jQuery('.arrow').hide();
			jQuery('.popover').css('top', epos.y -100);
			jQuery('.popover').css('left', epos.x -100);
			//ll('node: ' + nid);
		    });
    cy.nodes().bind('mouseout',
		    function(e){
			e.stopPropagation();
			jQuery(e.originalEvent.target).popover('destroy');
		    });
    // each(cy.nodes(),
    //      function(nkey, node){
    // 	 jQuery(node.element()).popover(popt);
    //      });

    cy.edges().unselectify(); // opt
    cy.boxSelectionEnabled(false);
    cy.resize();
    
    // Make sure re respect resizing.
    jQuery(window).off('resize');
    jQuery(window).on('resize',
		      function(){
			  cy.resize(); 
		      });
    
    stop_wait();
    ll('done');
    return cy;
}
