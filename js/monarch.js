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

// Module and namespace checking.
if (typeof bbop == 'undefined') { var bbop = {};}
if (typeof bbop.monarch == 'undefined') { bbop.monarch = {};}

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
    if( ! global_app_base ){
    throw new Error('we are missing access to global_app_base!');
    }
    // Easy app base.
    this.app_base = global_app_base;

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
                }
                retval = this.app_base + '/' + category + '/' + id;
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
                if(xref && xref['url_syntax']){
                    retval =
                        xref['url_syntax'].replace('[example_id]', sid, 'g');
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
        if(id){

            // Infer label from id if not present.
            var label = args['label'];
            if(!label){ 
                label = id; 
            }
            
            // Infer hilite from label if not present.
            var hilite = args['hilite'];
            if( ! hilite ){ hilite = label; }
            
            var category = args['category'];
            
            // See if the URL is legit. If it is, make something for it.
            var url = this.url(id, xid, modifier, category);
            if(url){

                // If it wasn't in the special transformations, just make
                // something generic.
                if( ! retval ){
                    retval = '<a title="' + id +
                    ' (go to the page for ' + label +
                    ')" href="' + url + '">' + hilite + '</a>';
                }
            }
        }
    }

    return retval;
};/*
 * Package: results_table_by_class_conf_bs3.js
 * 
 * Namespace: bbop.widget.display.results_table_by_class_conf_bs3
 * 
 * Subclass of <bbop.html.tag>.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.monarch == "undefined" ){ bbop.monarch = {}; }
if ( typeof bbop.monarch.widget == "undefined" ){ bbop.monarch.widget = {}; }
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
bbop.monarch.widget.display.results_table_by_class_conf_b3 = function(cclass,
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

    // Conveience aliases.
    var each = bbop.core.each;
    var is_defined = bbop.core.is_defined;

    // The context we'll deliver to
    var display_context = 'bbop.widgets.search_pane';

    // Only want to compile once.
    var ea_regexp = new RegExp("\<\/a\>", "i"); // detect an <a>
    var br_regexp = new RegExp("\<br\ \/\>", "i"); // detect a <br />

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

	    var tease = null;
	    if( ! anchors_p && ! list_p ){
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

    // Some of what we'll do for each field in each doc (see below).
    // var ext = cclass.searchable_extension();
    function _process_entry(fid, iid, doc){

	var retval = '';
	var did = doc['id'];

	// BUG/TODO: First see if the filed will be multi or not.
	// If not multi, follow the first path. If multi, break it
	// down and try again.

	// Get a label instead if we can.
	var ilabel = golr_resp.get_doc_label(did, fid, iid);
	if( ! ilabel ){
	    ilabel = iid;
	}

	// Extract highlighting if we can from whatever our "label"
	// was.
	var hl = golr_resp.get_doc_highlight(did, fid, ilabel);
	
    //get category
    var category = golr_resp.get_doc_field(did, fid+'_category');

	// See what kind of link we can create from what we got.
	var ilink = linker.anchor({id: iid, label: ilabel, hilite: hl, category: category}, fid);
	
	ll('processing: ' + [fid, ilabel, iid].join(', '));
	//ll('ilink: ' + ilink);

	// See what we got, in order of how much we'd like to have it.
	if( ilink ){
	    retval = ilink;
	}else if( ilabel ){
	    retval = ilabel;
	}else{
	    retval = iid;
	}

	return retval;
    }

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
		
		// Render each of the bits.
		var tmp_buff = [];
		each(bits, function(bit){
		    
		    // The major difference that we'll have here is
		    // between standard fields and special handler
		    // fields. If the handler resolves to null, fall
		    // back onto standard.
		    ll('! B:' + bit + ', F:' + fid + ', D:' + display_context);
		    var out = handler.dispatch(bit, fid, display_context);
		    if( is_defined(out) && out != null ){
			// Handler success.
			tmp_buff.push(out);
		    }else{
			// Standard output.   
			out = _process_entry(fid, bit, doc);
			//ll('out: ' + out);
			tmp_buff.push(out);
		    }
		});
		// Join it, trim/store it, push to to output.
		var joined = tmp_buff.join('<br />');
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
