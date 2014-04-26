/*
 * Constructor: bbop_context
 * 
 * Initial take from go-mme/js/bbop-mme-context.js
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  aiding object
 */
var bbop_context = function(){

    // Relations.
    // Colors are X11: http://cng.seas.rochester.edu/CNG/docs/x11color.html
    var entities = {
	'instance_of':
	{
	    readable: 'activity',
	    priority: 8,
	    aliases: [
		'activity'
	    ],
	    color: '#FFFAFA' // snow
	},
	'BFO:0000050':
	{
	    readable: 'part of',
	    priority: 15,
	    aliases: [
		//'http://purl.obolibrary.org/obo/BFO_0000050',
		//'http://purl.obolibrary.org/obo/part_of',
		'BFO_0000050',
		'part:of',
		'part of',
		'part_of'
	    ],
	    color: '#add8e6' // light blue
	},
	'BFO:0000051':
	{
	    readable: 'has part',
	    priority: 4,
	    aliases: [
		//'http://purl.obolibrary.org/obo/BFO_0000051',
		'has:part',
		'has part',
		'has_part'
	    ],
	    color: '#6495ED' // cornflower blue
	},
	'BFO:0000066':
	{
	    readable: 'occurs in',
	    priority: 12,
	    aliases: [
		//'http://purl.obolibrary.org/obo/BFO_0000066',
		//'BFO_0000066',
		'occurs:in',
		'occurs in',
		'occurs_in'
	    ],
	    color: '#66CDAA' // medium aquamarine
	},
	'RO:0002202':
	{
	    readable: 'develops from',
	    priority: 0,
	    aliases: [
		'develops:from',
		'develops from',
		'develops_from'
	    ],
	    color: '#A52A2A' // brown
	},
	'RO:0002211':
	{
	    readable: 'regulates',
	    priority: 16,
	    aliases: [
		//'http://purl.obolibrary.org/obo/RO_0002211'
		'regulates'
	    ],
	    color: '#2F4F4F' // dark slate grey
	},
	'RO:0002212':
	{
	    readable: 'negatively regulates',
	    priority: 17,
	    aliases: [
		//'http://purl.obolibrary.org/obo/RO_0002212'
		'negatively:regulates',
		'negatively regulates',
		'negatively_regulates'
	    ],
	    glyph: 'bar',
	    color: '#FF0000' // red
	},
	'RO:0002213':
	{
	    readable: 'positively regulates',
	    priority: 18,
	    aliases: [
		//'http://purl.obolibrary.org/obo/RO_0002213'
		'positively:regulates',
		'positively regulates',
		'positively_regulates'
	    ],
	    glyph: 'arrow',
	    color: '#008000' //green
	},
	'RO:0002233':
	{
	    readable: 'has input',
	    priority: 14,
	    aliases: [
		//'http://purl.obolibrary.org/obo/BFO_0000051',
		'has:input',
		'has input',
		'has_input'
	    ],
	    color: '#6495ED' // cornflower blue
	},
	'RO:0002234':
	{
	    readable: 'has output',
	    priority: 0,
	    aliases: [
		'has:output',
		'has output',
		'has_output'
	    ],
	    color: '#ED6495' // ??? - random
	},
	'RO:0002330':
	{
	    readable: 'genomically related to',
	    priority: 0,
	    aliases: [
		'genomically related to',
		'genomically_related_to'
	    ],
	    color: '#9932CC' // darkorchid
	},
	'RO:0002331':
	{
	    readable: 'involved in',
	    priority: 3,
	    aliases: [
		'involved:in',
		'involved in',
		'involved_in'
	    ],
	    color: '#E9967A' // darksalmon
	},
	'RO:0002332':
	{
	    readable: 'regulates level of',
	    priority: 0,
	    aliases: [
		'regulates level of',
		'regulates_level_of'
	    ],
	    color: '#556B2F' // darkolivegreen
	},
	'RO:0002333':
	{
	    readable: 'enabled by',
	    priority: 13,
	    aliases: [
		'RO_0002333',
		'enabled:by',
		'enabled by',
		'enabled_by'
	    ],
	    color: '#B8860B' // darkgoldenrod
	},
	'RO:0002334':
	{
	    readable: 'regulated by',
	    priority: 0,
	    aliases: [
		'RO_0002334',
		'regulated by',
		'regulated_by'
	    ],
	    color: '#86B80B' // ??? - random
	},
	'RO:0002335':
	{
	    readable: 'negatively regulated by',
	    priority: 0,
	    aliases: [
		'RO_0002335',
		'negatively regulated by',
		'negatively_regulated_by'
	    ],
	    color: '#0B86BB' // ??? - random
	},
	'RO:0002336':
	{
	    readable: 'positively regulated by',
	    priority: 0,
	    aliases: [
		'RO_0002336',
		'positively regulated by',
		'positively_regulated_by'
	    ],
	    color: '#BB0B86' // ??? - random
	},
	'activates':
	{
	    readable: 'activates',
	    priority: 0,
	    aliases: [
		'http://purl.obolibrary.org/obo/activates'
	    ],
	    //glyph: 'arrow',
	    //glyph: 'diamond',
	    //glyph: 'wedge',
	    //glyph: 'bar',
	    color: '#8FBC8F' // darkseagreen
	},
	'RO:0002406':
	{
	    readable: 'directly activates',
	    priority: 20,
	    aliases: [
		//'http://purl.obolibrary.org/obo/directly_activates',
		'directly:activates',
		'directly activates',
		'directly_activates'
	    ],
	    glyph: 'arrow',
	    color: '#2F4F4F' // darkslategray
	},
	'upstream_of':
	{
	    readable: 'upstream of',
	    priority: 2,
	    aliases: [
		//'http://purl.obolibrary.org/obo/upstream_of'
		'upstream:of',
		'upstream of',
		'upstream_of'
	    ],
	    color: '#FF1493' // deeppink
	},
	'RO:0002408':
	{
	    readable: 'directly inhibits',
	    priority: 19,
	    aliases: [
		//'http://purl.obolibrary.org/obo/directly_inhibits'
		'directly:inhibits',
		'directly inhibits',
		'directly_inhibits'
	    ],
	    glyph: 'bar',
	    color: '#7FFF00' // chartreuse
	},
	'indirectly_disables_action_of':
	{
	    readable: 'indirectly disables action of',
	    priority: 0,
	    aliases: [
		//'http://purl.obolibrary.org/obo/indirectly_disables_action_of'
		'indirectly disables action of',
		'indirectly_disables_action_of'
	    ],
	    color: '#483D8B' // darkslateblue
	},
	'provides_input_for':
	{
	    readable: 'provides input for',
	    priority: 0,
	    aliases: [
		'GOREL_provides_input_for',
		'http://purl.obolibrary.org/obo/GOREL_provides_input_for'
	    ],
	    color: '#483D8B' // darkslateblue
	},
	'RO:0002413':
	{
	    readable: 'directly provides input for',
	    priority: 1,
	    aliases: [
		'directly_provides_input_for',
		'GOREL_directly_provides_input_for',
		'http://purl.obolibrary.org/obo/GOREL_directly_provides_input_for'
	    ],
	    glyph: 'diamond',
	    color: '#483D8B' // darkslateblue
	},
	// New ones for monarch.
	'subclass_of':
	{
	    readable: 'subclass of',
	    priority: 100,
	    aliases: [
		'SUBCLASS_OF'
	    ],
	    glyph: 'diamond',
	    color: '#E9967A' // darksalmon
	},
	'superclass_of':
	{
	    readable: 'superclass of',
	    priority: 100,
	    aliases: [
		'SUPERCLASS_OF'
	    ],
	    glyph: 'diamond',
	    color: '#556B2F' // darkolivegreen
	},
	'annotation':
	{
	    readable: 'annotation',
	    priority: 100,
	    aliases: [
		'ANNOTATION'
	    ],
	    glyph: 'diamond',
	    color: '#483D8B' // darkslateblue
	}
    };

    // Compile entity aliases.
    var entity_aliases = {};
    bbop.core.each(entities,
		   function(ekey, eobj){
		       entity_aliases[ekey] = ekey; // identity
		       bbop.core.each(eobj['aliases'],
				      function(alias){
					  entity_aliases[alias] = ekey;
				      });
		   });

    // Helper fuction to go from unknown id -> alias -> data structure.
    this._dealias_data = function(id){
	
	var ret = null;
	if( id ){
	    if( entity_aliases[id] ){ // directly pull
		var tru_id = entity_aliases[id];
		ret = entities[tru_id];
	    }
	}

	return ret;
    };

    /* 
     * Function: readable
     *
     * Returns a human readable form of the inputted string.
     *
     * Parameters: 
     *  ind - incoming data id
     *
     * Returns:
     *  readable string or original string
     */
    this.readable = function(ind){
	var ret = ind;

	var data = this._dealias_data(ind);
	if( data && data['readable'] ){
	    ret = data['readable'];
	}
	
	return ret;
    };

    /* 
     * Function: color
     *
     * Return the string of a color of a rel.
     *
     * Parameters: 
     *  ind - incoming data id
     *
     * Returns:
     *  appropriate color string or 'grey'
     */
    this.color = function(ind){
	
	var ret = '#808080'; // grey

	var data = this._dealias_data(ind);
	if( data && data['color'] ){
	    ret = data['color'];
	}
	
	return ret;
    };

    /* 
     * Function: relation_glyph
     *
     * Return the string indicating the glyph to use for the edge marking.
     *
     * Parameters: 
     *  ind - incoming data id
     *
     * Returns:
     *  appropriate color string or null
     */
    this.glyph = function(ind){
	
	var ret = null; // default

	var data = this._dealias_data(ind);
	if( data && data['glyph'] ){
	    ret = data['glyph'];
	}
	
	return ret;
    };

    /* 
     * Function: priority
     *
     * Return a number representing the relative priority of the
     * entity under consideration.
     *
     * Parameters: 
     *  ind - incoming data id
     *
     * Returns:
     *  appropriate integer or 0
     */
    this.priority = function(ind){
	
	var ret = 0;

	var data = this._dealias_data(ind);
	if( data && data['priority'] ){
	    ret = data['priority'];
	}
	
	return ret;
    };

    /* 
     * Function: all_entities
     *
     * Return a list of the currently known entities.
     *
     * Parameters: 
     *  n/a
     *
     * Returns:
     *  list
     */
    this.all_entities = function(){	
	var rls = bbop.core.get_keys(entities);
	return rls;
    };

    /* 
     * Function: all_known
     *
     * Return a list of the currently known entities and their aliases.
     *
     * Parameters: 
     *  n/a
     *
     * Returns:
     *  list
     */
    this.all_known = function(){	
	var rls = bbop.core.get_keys(entity_aliases);
	return rls;
    };

};


function CyPathDemoInit(){

    ///
    /// Setup and preamble.
    ///
    
    //var DEBUG = false;
    var DEBUG = true;

    // Color/name context.
    var context = new bbop_context();
    var desired_layout = null;

    // HTML connctions.
    var demo_output_id = 'cydemo';
    var demo_output_elt = '#' + demo_output_id;
    var demo_input_id = 'demo_input';
    var demo_input_elt = '#' + demo_input_id;
    var auto_1_input_id = 'auto_1_input';
    var auto_1_input_elt = '#' + auto_1_input_id;
    var auto_2_input_id = 'auto_2_input';
    var auto_2_input_elt = '#' + auto_2_input_id;
    var sel_1_input_id = 'sel_1_input';
    var sel_1_input_elt = '#' + sel_1_input_id;
    var sel_2_input_id = 'sel_2_input';
    var sel_2_input_elt = '#' + sel_2_input_id;
    var sel_3_input_id = 'sel_3_input';
    var sel_3_input_elt = '#' + sel_3_input_id;

    // Aliases.
    var each = bbop.core.each;
    var ll = function(str){
	if( DEBUG && console && console.log ){
	    console.log(str);
	}
    };

    // Ready spinner for use.
    var spin = new bbop.widget.spinner('spinloc', '/image/waiting_ac.gif',
				       {'visible_p': false});
    ll('Start ready!');

    ///
    /// Renderer originally lifted from AmiGO 2 demo.
    ///

    // 
    function draw_graph(graph_json, focus_id){

	// graphs may be either a single object (short) or multiple
	// graph objects (simple). For now, fold them all in to a
	// single graph entity.
	var graph = new bbop.model.graph();
	if( ! bbop.core.is_array(graph_json) ){
	    graph_json = [graph_json];
	}
	each(graph_json,
	     function(grg){
		 graph.load_json(grg);
	     });

	// Clear current contents of graph elt.
	jQuery(demo_output_elt).empty();

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
		 var clr;
		 if( focus && node.id() == focus_id ){
		     
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
		 if( focus_id && node.id() == focus_id ){
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
	
	// Select which layout we want to use.
	var layout_opts = {
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
	var lo = layout_opts[desired_layout];
	if( ! lo ){
	    alert('your selected layout does not exist: ' + desired_layout);   
	}

	jQuery(demo_output_elt).cytoscape(
            {
		userPanningEnabled: true, // pan over box select
		'elements': elements,
		'layout': lo,
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

	var cy = jQuery(demo_output_elt).cytoscape('get');

	// Bind events.
	// cy.nodes().bind('click',
	// 		function(e){
	// 		    e.stopPropagation();
	// 		    var nid = e.cyTarget.id();
	// 		    man.set_id(nid);
	// 		    //spin.show();
	// 		    man.search();
	// 		});
	cy.nodes().bind('mouseover',
			function(e){
			    e.stopPropagation();

			    // TODO/BUG: this popover positioning got out of
			    // hand; just rewrite doing it manually with a
			    // div from bootstrap like normal people.
			    // (couldn't do it the obvious way because the
			    // canvas elements are just layers with nothing
			    // to adere to).
			    var nid = e.cyTarget.id();
			    var nlbl = info_lookup[nid]['label'];
 			    var popt = {
				title: nid,
				content: nlbl,
				// container: 'body',
				animation: false,
				placement: 'top',
				trigger: 'manual'
			    };
			    var epos = e.cyRenderedPosition;
			    jQuery(e.originalEvent.target).popover(popt);
			    jQuery(e.originalEvent.target).popover('show');
			    jQuery('.arrow').hide();
			    jQuery('.popover').css('top', epos.y -100);
			    jQuery('.popover').css('left', epos.x -100);
			    // TODO/BUG: Also, unfortunately, I cannot
			    // figure out why I am stuck with the
			    // single frozen pop-up (cannot change
			    // from the intial, probably a quirk of
			    // bs3). Manually change it.
			    var new_html = '<div style="display: none;" class="arrow"></div><h3 class="popover-title">' + nid + '</h3><div class="popover-content">' + nlbl + '</div>';
			    jQuery('.popover').html(new_html);

			    //ll('node: ' + nid);
			});
	cy.nodes().bind('mouseout',
			function(e){
			    e.stopPropagation();
			    jQuery(e.originalEvent.target).popover('destroy');
			});

	// 
	cy.edges().unselectify(); // opt
	cy.boxSelectionEnabled(false);
	cy.resize();

	// Make sure re respect resizing.
	jQuery(window).off('resize');
	jQuery(window).on('resize',
			  function(){
			      cy.resize(); 
			  });

	//ll('done draw');
    }

    ///
    /// Demo runner.
    ///

    // For now, use a generic manager with a generic response.
    var manager = new bbop.rest.manager.jquery(bbop.rest.response.json);
    // Generic responder.
    function _success_callback(resp, man){
	// The response is a generic bbop.rest.response.json.
	// Peel out the graph and render it.
	if( resp.okay() ){
	    draw_graph(resp.raw());
	}else{
	    ll('the response was not okay');	    
	}
	spin.hide();
    }
    function _error_callback(resp, man){
	spin.hide();
	alert('some kind of error?');
    }
    manager.register('success', 'draw', _success_callback);
    manager.register('error', 'oops', _error_callback);
    function data_call(arg1, arg2, arg3, arg4){
	var base = 'http://kato.crbs.ucsd.edu:9000/scigraph/graph/paths/' + arg4;
	var rsrc = base + '/' + arg1 + '/' + arg2 + '.jsonp?length=' + arg3;
	manager.resource(rsrc);
	manager.method('get');
	manager.use_jsonp(true);
	manager.jsonp_callback('callback');
	spin.show();
	manager.action();
    }

    ///
    /// Activate autocomplete and actions on inputs for demo.
    ///

    // Arguments for autocomplete box.
    var ac_args = {
	position : {
       	    my: "left top",
            at: "left bottom",
	    collision: "none"
	},
	source: function(request, response) {
	    console.log("trying autocomplete on " + request.term);

	    // Argument response from source gets map as argument.
	    var _parse_data_item = function(item){
		
		// If has a category, append that; if not try to use
		// namespace; otherwise, nothing.
		var appendee = '';
		if( item ){
		    if( item['concept']['categories'] &&
			! bbop.core.is_empty(item['concept']['categories']) ){
			appendee = item['concept']['categories'].join(' ');
		    }else if( item['concept']['fragment'] ){
			// Get first split on '_'.
			var fspl =
			    bbop.core.first_split('_',
						  item['concept']['fragment']);
			if( fspl[0] ){
			    appendee = fspl[0];
			}
		    }
		}

		return {
		    label: item['completion'],
		    tag: appendee,
		    name: item['concept']['fragment']
		};
	    };
	    var _on_success = function(data) {

		// Get the list out of the return.
		if( data && data['list'] ){

		    var ldata = data['list'];

		    // // Pare out duplicates. Assume existance of structure.
		    // var pared_data = [];
		    // var seen_ids = {};
		    // for( var di = 0; di < ldata.length; di++ ){
		    // 	var datum = ldata[di];
		    // 	var datum_id = datum['concept']['uri'];
		    // 	if( ! seen_ids[datum_id] ){
		    // 	    // Only add new ids to pared data list.
		    // 	    pared_data.push(datum);
			    
		    // 	    // Block them in the future.
		    // 	    seen_ids[datum_id] = true;
		    // 	}
		    // }

		    // Map out into the display format.
		    //var map = jQuery.map(pared_data, _parse_data_item);
		    var map = jQuery.map(data['list'], _parse_data_item);
		    response(map);
		}
	    };

	    // Define and run request on service.
	    var query =
		'http://kato.crbs.ucsd.edu:9000/scigraph/vocabulary/prefix/' +
		request.term +
		'.jsonp?limit=20&searchSynonyms=true';
	    jQuery.ajax({
			    'url': query,
			    'dataType': 'jsonp',
			    'jsonp': 'callback',
			    'success': _on_success
			});
	},
	messages: {
            noResults: '',
	    results: function() {}
        }
    };

    // Create our own custom rendering to make the categories a little
    // nicer to look at (as minor data).
    // http://jqueryui.com/autocomplete/#custom-data
    function _sub_render(ul, item){
	var li = jQuery('<li>');
	li.append('<a alt="'+ item.name +'" title="'+ item.name +'">' +
		  '<span class="autocomplete-main-item">' +
		  item.label +
		  '</span>' + 
		  '&nbsp;' + 
		  '<span class="autocomplete-tag-item">' +
		  item.tag +
		  '</span>' + 
		  '</a>');
	li.appendTo(ul);
	return li;
    }

    // Activate first autocomplete.
    ac_args['select'] = function(event, ui) {
	event.preventDefault();
	if (ui.item !== null) { 
	    ll('got: ' + ui.item.name);
	    jQuery(auto_1_input_elt).val(ui.item.name);
	}
    };	
    var jac1 = jQuery(auto_1_input_elt).autocomplete(ac_args);
    jac1.data('ui-autocomplete')._renderItem = _sub_render;

    // Activate second autocomplete.
    ac_args['select'] = function(event, ui) {
	event.preventDefault();
	if (ui.item !== null) {
	    ll('got: ' + ui.item.name);
	    jQuery(auto_2_input_elt).val(ui.item.name);
	}
    };	
    var jac2 = jQuery(auto_2_input_elt).autocomplete(ac_args);
    jac2.data('ui-autocomplete')._renderItem = _sub_render;

    // Rewire the form to produce the graph.
    jQuery(demo_input_elt).submit(
	function(event){
	    event.preventDefault();
	    
	    var v1 = jQuery(auto_1_input_elt).val() || '';
	    var v2 = jQuery(auto_2_input_elt).val() || '';
	    var s1 = jQuery(sel_1_input_elt).val() || '';
	    var s2 = jQuery(sel_2_input_elt).val() || '';
	    var s3 = jQuery(sel_3_input_elt).val() || '';

	    // TODO:
	    if( v1 != '' && v2 != '' && s1 != '' && s2 != '' && s3 != '' ){
		// alert('TODO: only using demo input; ignoring: ' +
		// 	 [v1, v2, s1].join(', '));
		desired_layout = s3;
		data_call(v1, v2, s1, s2);
	    }else{
		alert('insufficient args: ' + [v1, v2, s1, s2].join(', ') ); //+
		//       '; fall back on demo');
		// // TODO: need good data source
		// // This demo lifted from: http://beta.neuinfo.org:9000/graphdemo/graph/path/short/UBERON_0000004/UBERON_0001062.jsonp?length=5
		// var dgraph = {"nodes":[{"id":"http://purl.obolibrary.org/obo/UBERON_0000004","lbl":"olfactory apparatus"},{"id":"http://purl.obolibrary.org/obo/UBERON_0004121","lbl":"ectoderm-derived structure"},{"id":"http://purl.obolibrary.org/obo/UBERON_0000061","lbl":"anatomical structure"},{"id":"http://purl.obolibrary.org/obo/UBERON_0000465","lbl":"material anatomical entity"},{"id":"http://purl.obolibrary.org/obo/UBERON_0001062","lbl":"anatomical entity"}],"edges":[{"sub":"http://purl.obolibrary.org/obo/UBERON_0000004","obj":"http://purl.obolibrary.org/obo/UBERON_0004121","pred":"SUBCLASS_OF"},{"sub":"http://purl.obolibrary.org/obo/UBERON_0004121","obj":"http://purl.obolibrary.org/obo/UBERON_0000061","pred":"SUBCLASS_OF"},{"sub":"http://purl.obolibrary.org/obo/UBERON_0000061","obj":"http://purl.obolibrary.org/obo/UBERON_0000465","pred":"SUBCLASS_OF"},{"sub":"http://purl.obolibrary.org/obo/UBERON_0000465","obj":"http://purl.obolibrary.org/obo/UBERON_0001062","pred":"SUBCLASS_OF"}]};
		// // TODO: need real managed data source; see above
		// var dg = new bbop.model.graph();
		// dg.load_json(dgraph);
		// draw_graph(dg);
	    }

	});

    ll('Done ready!');
};

// jQuery gets to bootstrap everything.
jQuery(document).ready(
    function(){
	CyPathDemoInit();
    });
