
function AnalyzeInit(){
    
    //var DEBUG = false;
    var DEBUG = true;

    ///
    /// HTML connctions.
    ///

    var analyze_auto_input_id = 'analyze_auto_input';
    var analyze_auto_input_elt = '#' + analyze_auto_input_id;
    var analyze_auto_target_id = 'analyze_auto_target';
    var analyze_auto_target_elt = '#' + analyze_auto_target_id;
    var analyze_auto_list_id = 'analyze_auto_list';
    var analyze_auto_list_elt = '#' + analyze_auto_list_id;

    ///
    /// Gunna go crazy without bbop-js, so adding a few things
    /// here: (stripped) logger and iterator.
    /// 

    var ll = function(str){
	if( DEBUG && console && console.log ){
	    console.log(str);
	}
    };

    var uuid = function(){

	// Replace x (and y) in string.
	function replacer(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
	}
	var target_str = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
	return target_str.replace(/[xy]/g, replacer);
    };

    var is_array = function(in_thing){
	var retval = false;
	if( in_thing &&
            typeof(in_thing) == 'object' &&
            typeof(in_thing.push) == 'function' &&
            typeof(in_thing.length) == 'number' ){
		retval = true;
	    }
	return retval;
    };
    
    var is_hash = function(in_thing){
	var retval = false;
	if( in_thing &&
            typeof(in_thing) == 'object' &&
            (! is_array(in_thing)) ){
            retval = true;
	}
	return retval;
    };

    var get_keys = function (arg_hash){
	
	if( ! arg_hash ){ arg_hash = {}; }
	var out_keys = [];
	for (var out_key in arg_hash) {
            if (arg_hash.hasOwnProperty(out_key)) {
		out_keys.push(out_key);
            }
	}
	
	return out_keys;
    };

    var each = function(in_thing, in_function){

	// Probably an not array then.
	if( typeof(in_thing) == 'undefined' ){
            // this is a nothing, to nothing....
	}else if( typeof(in_thing) != 'object' ){
            throw new Error('Unsupported type in bbop.core.each: ' +
                            typeof(in_thing) );
	}else if( is_hash(in_thing) ){
            // Probably a hash...
            var hkeys = get_keys(in_thing);
            for( var ihk = 0; ihk < hkeys.length; ihk++ ){
		var ikey = hkeys[ihk];
		var ival = in_thing[ikey];
		in_function(ikey, ival);
            }
	}else{
            // Otherwise likely an array.
            for( var iai = 0; iai < in_thing.length; iai++ ){
		in_function(in_thing[iai], iai);
            }
	}
    };

    ///
    /// Ready analyze interface.
    ///

    ll('Starting ready!');

    var search_set = {};
    var delete2val = {};

    function update_form_value(){
	jQuery(analyze_auto_target_elt).val('');
	var vals = get_keys(search_set);
	var vals_str = vals.join(' ');
	jQuery(analyze_auto_target_elt).val(vals_str);
    }

    function redraw_form_list(){

	// Get ready to redraw list.
	var draw_cache = [];
	var saw_something = false;
	each(search_set,
	     function(skey, slabel){
		 saw_something = true;
		 var nid = uuid();
		 delete2val[nid] = skey;
		 draw_cache.push('<li class="list-group-item">');
		 draw_cache.push(slabel + ' (' + skey + ')');
		 draw_cache.push('<span id="'+ nid +'" class="badge">X</span>');
		 draw_cache.push('</li>');
	     });

	// Wipe list.
	jQuery(analyze_auto_list_elt).empty();

	// Redraw it.
	if( ! saw_something ){
	    // Placeholder when there is nothing.
	    jQuery(analyze_auto_list_elt).append('<li class="list-group-item">Empty: Add items using the input above.</li>');
	}else{
	    jQuery(analyze_auto_list_elt).append(draw_cache.join(''));	
	}


	// TODO: Add events to it.
	each(delete2val,
	     function(did, val){
		 jQuery('#' + did).click(
		     function(){
			 //alert('did: ' + did + ', val: ' + val);
			 delete_item(val);
		     }
		 );
	     });
    }

    function delete_item(id){
	ll('deleting: ' + id);

	// Delete the item.
	delete search_set[id];

	// Update.
	update_form_value();
	redraw_form_list();	
    }

    // Action to perform when an item is selected from the dropdown
    // list.
    function select_item(id, label){
	ll('selected: ' + id + '/' + label);

	// Add the item.
	search_set[id] = label;

	// Update.
	update_form_value();
	redraw_form_list();

	// Remove the current input.
	jQuery(analyze_auto_input_elt).val('');
    }

    var auto_args = {
	source: function(request, response) {
	    var query = "/autocomplete/" + request.term + ".json";
	    jQuery.ajax({
			    url: query,
			    dataType: 'json',
			    error: function(){
				ll('ERROR: looking at: ' + query);
			    },
			    success: function(data) {
				ll("auto success");
				response(jQuery.map(data,
						    function(item) {
							return {
							    'label': item.term,
							    'id': item.id
							};
						    }));
			    }
			});
	},
	select: function(event, ui){
	    
	    // Get the selected input.
	    var id = null;
	    var lbl = null;
	    if( ui.item && ui.item.id ){ id = ui.item.id; }
	    if( ui.item && ui.item.label ){ lbl = ui.item.label; }

	    // If okay, do whatever...?
	    if( ! id || ! lbl ){
		ll('input issues');
	    }else{
		select_item(id, lbl);
	    }

	    return false;
	}
    };
    jQuery(analyze_auto_input_elt).autocomplete(auto_args);

    ll('Done ready!');
};

// jQuery gets to bootstrap everything.
jQuery(document).ready(
    function(){
	AnalyzeInit();
    });
