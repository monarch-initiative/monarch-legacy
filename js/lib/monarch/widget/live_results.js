/*
 * NOTE: This is copypasta from bbop.widget.live_results so we can
 * override the bbop.widget.display.results_table_by_class_conf_b3._process_entry function
 * @kltm will update bbop to handler the Monarch category linking case
 * see https://github.com/monarch-initiative/monarch-app/issues/687#issuecomment-100042521
 */

/*
 * Package: live_results.js
 * 
 * Namespace: bbop.monarch.widget.live_results
 * 
 * BBOP JS widget to display the results of a search on callback.
 * 
 * TODO: Button insertion in other non-internal places.
 * 
 * This is a Bootstrap 3 widget.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if (typeof bbop.monarch == 'undefined') { bbop.monarch = {};}
if ( typeof bbop.monarch.widget == "undefined" ){ bbop.monarch.widget = {}; }

/*
 * Constructor: live_results
 * 
 * Contructor for the bbop.monarch.widget.live_results object.
 * 
 * Results table and optional buttons.
 *
 * Optional options looks like:
 *  callback_priority - default 0
 *  user_buttons - default [], should be any passable renderable button
 *  user_buttons_div_id - default null
 *  selectable_p - have selectable side buttons (default true)
 *
 * Arguments:
 *  interface_id - string id of the element to build on
 *  manager - the shared GOlr manager to use
 *  conf_class - the profile of the specific conf to use
 *  handler - handler to use in rendering
 *  linker - linker to use in rendering
 *  in_argument_hash - *[optional]* optional hash of optional arguments, described above
 * 
 * Returns:
 *  this object
 */
bbop.monarch.widget.live_results = function(interface_id, manager, conf_class,
				    handler, linker, in_argument_hash){
    this._is_a = 'bbop.widget.live_results';

    var anchor = this;
    var each = bbop.core.each;
    
    // Per-UI logger.
    var logger = new bbop.logger();
    logger.DEBUG = false;
    //logger.DEBUG = true;
    function ll(str){ logger.kvetch('LR: ' + str); }

    var results_table = null;

    // Some top-level variable defined.
    // Special id and names for optional select column.
    var local_mangle = bbop.core.uuid();
    var select_column_id = 'rtbcc_select_' + local_mangle;
    var select_item_name = 'rtbcc_select_name_' + local_mangle;

    ///
    /// Deal with incoming arguments.
    ///

    // Our argument default hash.
    var default_hash = {
	'callback_priority': 0,
	'user_buttons': [],
	'user_buttons_div_id': null,
	'selectable_p': true
    };
    var folding_hash = in_argument_hash || {};
    var arg_hash = bbop.core.fold(default_hash, folding_hash);
    // 
    var callback_priority = arg_hash['callback_priority'];
    var user_buttons = arg_hash['user_buttons'];
    var user_buttons_div_id = arg_hash['user_buttons_div_id'];
    var selectable_p = arg_hash['selectable_p'];

    //
    var fun_id = bbop.core.uuid();

    ///
    /// Set the callbacks.
    ///

    // Add the "disabled" property to a button if the boolean
    // value says so.
    function _disable_if(bttn, disbool){
	if( disbool ){
	    jQuery('#' + bttn.get_id()).attr('disabled','disabled');
	}
    }
    
    // (Re)draw the user-defined buttons in the meta
    // information area.  Will naturally fail if there is no
    // meta div that has been nested with the user button
    // element.
    function _draw_user_buttons(button_definitions, loc_id){
	function _button_rollout(button_def_hash){
	    var default_hash = {
		label : '?',
		disabled_p : false,
		click_function_generator :
		function(anchor, manager){
		    return function(anchor, manager){
			alert('No callback defined for this button--' +
			      'the generator may have been empty!');
		    };
		}
    	    };
	    var folding_hash = button_def_hash || {};
	    var arg_hash = bbop.core.fold(default_hash, folding_hash);
	    
	    var label = arg_hash['label'];
	    var disabled_p = arg_hash['disabled_p'];
	    var click_function_generator = arg_hash['click_function_generator'];
	    
	    /// Add button to DOM.
	    var b_props = {
		'generate_id': true,
		'class': 'btn btn-primary'
	    };
	    var b = new bbop.html.button(label, b_props);
	    jQuery('#' + loc_id).append(b.to_string());
	    _disable_if(b, disabled_p);
	    
	    // Bind function to action.
	    var click_fun = click_function_generator(anchor, manager);
	    jQuery('#' + b.get_id()).click(click_fun);
	}
	
	// Check that we're not about to do the impossible.
	if( ! jQuery('#' + loc_id) ){
	    alert('cannot refresh buttons without a place to draw them');
	}else{
	    jQuery('#' + loc_id).empty();
	    bbop.core.each(button_definitions, _button_rollout);
	}
    }

    // Draw a table at the right place or an error message.
    function _draw_table_or_something(resp, manager){

	// Wipe interface.
	jQuery('#' + interface_id).empty();

	// Vary by what we got.
	if( ! resp.success() || resp.total_documents() == 0 ){
	    jQuery('#' + interface_id).append('<em>No results given your input and search fields. Please refine and try again.</em>');
	}else{

	    // Render the buttons.
	    //console.log('user_buttons: ', user_buttons);
	    if( user_buttons && user_buttons.length && user_buttons.length > 0 ){

		// Ensure we have somewhere to put our buttons. If not
		// supplied with an injection id, make our own and use
		// it.
		var insert_div_id = user_buttons_div_id;
		if( ! user_buttons_div_id ){

		    // Generate new dic and add it to the display.
		    var ubt_attrs = {
			'generate_id': true
		    };
		    var ubt = new bbop.html.tag('div', ubt_attrs);
		    jQuery('#' + interface_id).append(ubt.to_string());
		    
		    // Ensure the id.
		    insert_div_id = ubt.get_id();
		}

		// Add all of the defined buttons after the spacing.
		_draw_user_buttons(user_buttons, insert_div_id);
	    }

	    // Display results.
	    var bwd = bbop.monarch.widget.display;
	    
	    results_table =
		bwd.results_table_by_class_conf_b3(conf_class, resp, linker,
						   handler, interface_id,
						   selectable_p,
						   select_column_id,
						   select_item_name); 
	}
    }
    manager.register('search', fun_id, _draw_table_or_something,
		     callback_priority);
    
    // Somehow report an error to the user.
    //  error_message - a string(?) describing the error
    //  manager - <bbop.golr.manager> that we initially registered with
    function _draw_error(error_message, manager){
    	ll("draw_error: " + error_message);
    	alert("Runtime error: " + error_message);
    	//_spin_down();
    };
    manager.register('error', fun_id, _draw_error, callback_priority);

    ///
    /// External API.
    ///

    /*
     * Function: item_name
     *
     * Return a string of the name attribute used by the checkboxes if
     * we selected for checkboxes to be displayed.
     * 
     * Parameters:
     *  n/a
     *
     * Returns:
     *  string or null if displaying checkboxes was false
     */
    this.item_name = function(){	
	return select_item_name;
    };

    /*
     * Function: toggle_id
     *
     * Return a string of the id of the checkbox in the header if we
     * selected for checkboxes to be displayed.
     * 
     * Parameters:
     *  n/a
     *
     * Returns:
     *  string or null if displaying checkboxes was false
     */
    this.toggle_id = function(){	
	return select_column_id;
    };
    
    /*
     * Function: get_selected_items
     * 
     * The idea is to return a list of the items selected (with
     * checkboxes) in the display. This means that there are three
     * possibilities. 1) We are not using checkboxes or the display
     * has not been established, so we return null; 2) no or all items
     * have been selected, so we get back an empty list (all == none
     * in our view); 3) a subset list of strings (ids).
     * 
     * NOTE: Naturally, does not function until the display is established.
     * 
     * Parameters:
     *  n/a
     *
     * Returns
     *  string list or null
     */
    this.get_selected_items = function(){
	var retval = null;

	// 
	if( selectable_p ){
	    retval = [];

	    // Cycle through and pull out the values of the checked
	    // ones.
	    var total_count = 0;
	    var nstr = 'input[name=' + select_item_name + ']';
	    jQuery(nstr).each(
		function(){
		    if( this.checked ){
			var val = jQuery(this).val();
			retval.push(val);
		    }
		    total_count++;
		});

	    // If we are selecting all of the items on this page, that
	    // is the same as not selecting any in our world, so reset
	    // and warn.
	    if( total_count > 0 && total_count == retval.length ){
		alert('You can "select" all of the items on a results page by not selecting any (all being the default). This will also get your results processed faster and cause significantly less overhead on the servers.');
		retval = [];
	    }	    
	}

	return retval;
    };

};
