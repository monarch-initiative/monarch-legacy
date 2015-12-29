////
//// ...
////

function CyPathDemoInit(){

    ///
    /// Setup and preamble.
    ///
    
    //var DEBUG = false;
    var DEBUG = true;

    // Color/name context.
    var context = new bbop.context(amigo.data.context);
    var desired_spread = 1;
    var desired_layout = null;

    var global_graph = null;
    var focus_nodes = {};

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
    function draw_graph(graph_json){
	
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
		 var graph = new bbop.model.graph();
		 graph.load_json(grg);
		 global_graph.merge_in(graph);
	     });
	
	// Clear current contents of graph elt.
	jQuery(demo_output_elt).empty();
	
	CytoDraw(global_graph, focus_nodes,
		 desired_layout, context, demo_output_id,
		 _spin_show, _spin_hide, data_call_explore);

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
	_spin_hide();
    }
    function _error_callback(resp, man){
	_spin_hide();
	alert('some kind of error?');
    }
    manager.register('success', 'draw', _success_callback);
    manager.register('error', 'oops', _error_callback);

    function data_call_path(arg1, arg2, arg3, arg4){

	// 'Tis focus nodes.
	focus_nodes[arg1] = true;
	focus_nodes[arg2] = true;

	var base = 'http://kato.crbs.ucsd.edu:9000/scigraph/graph/paths/' + arg4;
	var rsrc = base + '/' + arg1 + '/' + arg2 + '.json?length=' + arg3;
	manager.resource(rsrc);
	manager.method('get');
	manager.use_jsonp(true);
	manager.jsonp_callback('callback');
	_spin_show();
	manager.action();
    }

    // Wrap up a data call with a single argument.
    function data_call_explore(arg1){

	// 'Tis a focus node.
	focus_nodes[arg1] = true;

	// Data call setup.
	var base = 'http://kato.crbs.ucsd.edu:9000/scigraph/graph/neighbors/' +
	    arg1 + '.json';
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
		    }else if( item['concept']['curie'] ){
			// Get first split on '_'.
			var fspl =
			    bbop.core.first_split('_',
						  item['concept']['curie']);
			if( fspl[0] ){
			    appendee = fspl[0];
			}
		    }
		}

		return {
		    label: item['completion'],
		    tag: appendee,
		    name: item['completion']
		};
	    };
	    var _on_success = function(data) {

		// Get the list out of the return.
		if( data ){

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
		    var map = jQuery.map(data, _parse_data_item);
		    console.log(map);
		    response(map);
		}
	    };

	    // Define and run request on service.
	    var query =
	        "/autocomplete/"+request.term+".json";
	    jQuery.ajax({
			    'url': query,
			    'dataType': 'json',
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
		data_call_path(v1, v2, s1, s2);
	    }else{
		alert('insufficient args: ' + [v1, v2, s1, s2].join(', ') ); //+
	    }

	});

    ll('Done ready!');
};



if (typeof(loaderGlobals) === 'object') {
    loaderGlobals.CyPathDemoInit = CyPathDemoInit;
}
if (typeof(global) === 'object') {
    global.CyPathDemoInit = CyPathDemoInit;
}
