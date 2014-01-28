
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

    ///
    /// Gunna go crazy without bbop-js, so adding a few things
    /// here: (stripped) logger and iterator.
    /// 

    var each = function(in_thing, in_function){
	// Probably an not array then.
	if( typeof(in_thing) == 'undefined' ){
	    // this is a nothing, to nothing....
	}else if( typeof(in_thing) != 'object' ){
	    throw new Error('Unsupported type in bbop.core.each: ' +
			    typeof(in_thing) );
	}else if( bbop.core.is_hash(in_thing) ){
	    // Probably a hash...
	    var hkeys = bbop.core.get_keys(in_thing);
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

    var ll = function(str){
	if( DEBUG && console && console.log ){
	    console.log(str);
	}
    };

    ///
    /// Ready analyze interface.
    ///

    ll('Starting ready!');

    // Action to perform when an item is selected from the dropdown
    // list.
    function select_item(id, label){
	ll('selected: ' + id + '/' + label);
	jQuery(analyze_auto_target_elt).append(id + '\n');
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
