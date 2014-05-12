////
//// ...
////

function CyExploreDemoInit(){

    ///
    /// Setup and preamble.
    ///
    
    //var DEBUG = false;
    var DEBUG = true;

    // Color/name context.
    var context = new bbop.context(amigo.data.context);
    var desired_spread = 1;
    var desired_layout = null;

    // HTML connctions.
    var demo_output_id = 'cydemo';
    var demo_output_elt = '#' + demo_output_id;
    var demo_input_id = 'demo_input';
    var demo_input_elt = '#' + demo_input_id;
    var auto_1_input_id = 'auto_1_input';
    var auto_1_input_elt = '#' + auto_1_input_id;
    var sel_1_input_id = 'sel_1_input';
    var sel_1_input_elt = '#' + sel_1_input_id;
    var sel_2_input_id = 'sel_2_input';
    var sel_2_input_elt = '#' + sel_2_input_id;

    // Aliases.
    var each = bbop.core.each;
    var ll = function(str){
	if( DEBUG && console && console.log ){
	    console.log(str);
	}
    };

    // For now, use a generic manager with a generic response.
    var manager = new bbop.rest.manager.jquery(bbop.rest.response.json);

    // Ready spinner for use.
    var spin = new bbop.widget.spinner('spinloc', '/image/waiting_ac.gif',
				       {'visible_p': false});
    function _spin_show(){
	spin.show();
    }
    function _spin_hide(){
	spin.hide();
    }
    ll('Start ready!');

    ///
    /// Renderer originally lifted from AmiGO 2 demo.
    ///

    // 
    var global_graph = null;
    var focus_nodes = {};
    // Destroy cytoscape graph as well as the resetting the global
    // graph object.
    function empty_graph(){
	global_graph = new bbop.model.graph();
	focus_nodes = {};
	jQuery(demo_output_elt).empty();
    }
    // Add to it.
    function add_to_graph(graph_json){

	// Ensure 
	if( ! global_graph ){
	    global_graph = new bbop.model.graph();
	}

	// graphs may be either a single object (short) or multiple
	// graph objects (simple). For now, fold them all in to a
	// single graph entity.
	if( ! bbop.core.is_array(graph_json) ){
	    graph_json = [graph_json];
	}
	each(graph_json,
	     function(grg){
		 var tmp_graph = new bbop.model.graph();
		 tmp_graph.load_json(grg);
		 global_graph.merge_in(tmp_graph);
	     });

	// Clear current contents of graph elt.
	jQuery(demo_output_elt).empty();

	CytoDraw(global_graph, bbop.core.get_keys(focus_nodes),
		 desired_layout, context, demo_output_id,
		 _spin_show, _spin_hide, data_call);
	
	// Update color explanations to the newest.
	var color_clust = [];
	var erels = global_graph.all_predicates();
	each(erels,
	     function(erel){
		 color_clust.push({
				      'label': context.readable(erel),
				      'color': context.color(erel),
				      'priority': context.priority(erel)
				  });
	     });
	color_clust.sort(function(a, b){ return b.priority - a.priority; });
	// Assemble HTML for label display.
	var fc = [];
	fc.push('<ul class="list-unstyled">');
	each(color_clust,
	     function(c){
		 fc.push('<li>');
		 fc.push('<span class="label" style="background-color:' +
			 c.color + ';">' + c.label + '</span>');
		 fc.push('</li>');
	     });
	fc.push('</ul>');
	// Add to DOM.
	jQuery('#color_exp').empty();
	jQuery('#color_exp').append(fc.join(''));
    }

    ///
    /// Demo runner.
    ///

    // Generic responder.
    function _success_callback(resp, man){
	// The response is a generic bbop.rest.response.json.
	// Peel out the graph and render it.
	if( resp.okay() ){
	    add_to_graph(resp.raw());
	}else{
	    ll('the response was not okay');	    
	}
	_spin_hide();
    }
    function _error_callback(resp, man){
	_spin_hide();
	alert('some kind of error?');
    }
    manager.register('success', 'draw', _success_callback);
    manager.register('error', 'oops', _error_callback);

    // Wrap up a data call with a single argument.
    function data_call(arg1){

	// 'Tis a focus node.
	focus_nodes[arg1] = true;

	// Data call setup.
	var base = 'http://kato.crbs.ucsd.edu:9000/scigraph/graph/neighbors/' +
	    arg1 + '.jsonp';
	var rsrc = base + '?' + 'depth=' + desired_spread;
	manager.resource(rsrc);
	manager.method('get');
	manager.use_jsonp(true);
	manager.jsonp_callback('callback');

	// Action.
	_spin_show();
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

    // Rewire the form to produce the graph.
    jQuery(demo_input_elt).submit(
	function(event){
	    event.preventDefault();
	    
	    var v1 = jQuery(auto_1_input_elt).val() || '';
	    var s1 = jQuery(sel_1_input_elt).val() || '';
	    var s2 = jQuery(sel_2_input_elt).val() || '';

	    // ...
	    if( v1 != '' && s1 != '' && s2 != '' ){

		// Clear out the graph on call.
		empty_graph();

		// alert('TODO: only using demo input; ignoring: ' +
		// 	 [v1, s1, s2].join(', '));
		desired_spread = s1;
		desired_layout = s2;
		focus_nodes[v1] = true;
		data_call(v1);
	    }else{
		alert('insufficient args: ' + [v1, s1, s2].join(', ') ); //+
	    }
	});

    ll('Done ready!');
};

// jQuery gets to bootstrap everything.
jQuery(document).ready(
    function(){
	CyExploreDemoInit();
    });
