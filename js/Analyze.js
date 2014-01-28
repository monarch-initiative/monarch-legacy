
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
