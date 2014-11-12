////
//// NOTE: This is test/demo code--don't worry too much about it.
////

jQuery(document).ready(function(){

    // Ready search form in corner, with non-standard names.
    // (Default should not load as the default ids do not exists here.)
    navbar_search_init('home_search', 'home_search_form');

    ///
    /// Well...it again looks like I'm starting to rewrite some
    /// BBOP-JS stuff agagin. Maybe just import it?
    ///

    // RFC 4122 v4 compliant UUID generator.
    // From: http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523
    function _uuid(){
	// Replace x (and y) in string.
	function replacer(c) {
	    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
	    return v.toString(16);
	}
	var target_str = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
	return target_str.replace(/[xy]/g, replacer);
    }

    // Carousel clickable box object.
    function carousel_box(filled_p, position){

	var elt_id =  'monarch_carousel_box_' + _uuid();
	var cache = [];
	var str = '';
	
	var ucl = '';
	var ust = '';
	if( ! filled_p ){
	    ust = 'cursor: pointer; cursor: hand;';
	}

	cache.push('<span id='+ elt_id +' class="'+ ucl +'" style="'+ ust +'">');
	if( filled_p ){
	    cache.push('&FilledSmallSquare;');
	}else{
	    cache.push('&EmptySmallSquare;');
	}
	cache.push('</span>');
	str = cache.join('');

	this.get_id = function(){
	    return elt_id;
	};
	this.get_position = function(){
	    return position;
	};
	this.to_string = function(){
	    return str;
	};
	this.filled_p = function(){
	    return filled_p;
	};
    }

    ///
    /// Do a demo carousel.
    ///
    /// We're going to do this as simply as possible by hand to keep
    /// it small and in control.
    ///

    // Get the number of items.
    function _get_carousel_count(elt){
	var ret = null;
	if( jQuery(elt).length ){ // determine existance
	    ret = jQuery(elt).children().length
	}
	return ret;
    }

    // Get the currently exposed item, starting from 1.
    function _get_carousel_current(elt){
	var ret = null;
	if( jQuery(elt).length ){ // determine existance
	    _.each(jQuery(elt).children(), function(child, index){
		if( jQuery(child).hasClass('monarch-carousel-item') ){
		    if( jQuery(child).css('opacity') == '1' ||
			jQuery(child).css('opacity') == '1.0' ){
			ret = index + 1;
		    }
		}
	    });
	}
	return ret;
    }

    // Update the carousel boxes according to the current state.
    function _refresh_carousel_boxes(celt, belt){
	if( jQuery(celt).length && jQuery(belt).length ){ // determine existence

	    var count = _get_carousel_count(celt);
	    var current = _get_carousel_current(celt);
	    if( count && current ){
	    
		// Collect the new carousel_box objects.
		var cbox_cache = [];
		_.times(count, function(i){
		    var cbox = null;
		    if( i+1 != current ){
			cbox = new carousel_box(false, i+1);
		    }else{
			cbox = new carousel_box(true, i+1);
		    }
		    cbox_cache.push(cbox);
		});

		// Add them to the DOM.
		var out_cache = [];
		_.each(cbox_cache, function(cbox){
		    out_cache.push(cbox.to_string());
		});
		jQuery(belt).html(out_cache.join(''));
	    
		// Activate them.
		_.each(cbox_cache, function(cbox){
		    if( cbox.filled_p() ){
			// Filled do nothing.
		    }else{
			jQuery('#' + cbox.get_id()).click(function(){

			    // First, stop future timing.
			    _cancel_timers();

			    // Update to the new position.
			    var target_pos = cbox.get_position();
			    //alert('boom: ' + target_pos);
			    _update_from_to(count, target_pos, function(){
				_refresh_carousel_boxes(celt, belt);
			    });
			});
		    }
		});			
	    }	
	}
    }

    // Fade the current, move to the next.
    // WARNING: This one does little to no error checking.
    function _update_from_to(pos_count, to_pos, run_at_end_fun){

	// Since they are piled on top of eachother, just fade in
	// and out. Also, need positions, not indexes here, so +1.
	// There can be a race condition with the timer, so fade
	// everything out but the one to be displayed.
	_.times(pos_count, function(i){
	    var from_pos = i+1;
	    if( from_pos != to_pos ){
		var curr_ref =
		    mcid + ' .monarch-carousel-item:nth-child(' + from_pos + ')';
		if( jQuery(curr_ref).css('opacity') != '0' &&
		    jQuery(curr_ref).css('opacity') != '0.0' ){
		    jQuery(curr_ref).fadeTo('slow', '0.0');
		}
	    }
	});
	// Bring up next one.
	var next_ref =
	    mcid + ' .monarch-carousel-item:nth-child(' + to_pos + ')';
	jQuery(next_ref).fadeTo('slow', '1.0', function(){
	    if( run_at_end_fun ){
		run_at_end_fun();
	    }
	});
	
    }

    // Sloppy, but usable, way of stopping the timers when we want to.
    var init_timer = null;
    var step_timer = null;
    function _cancel_timers(){
	if( init_timer ){ clearTimeout(init_timer); }
	if( step_timer ){ clearTimeout(step_timer); }
    }

    // Run only if sensible.
    var timing = 10000; // 10s
    var mcid = '#' + "monarch-carousel"; // carousel
    var indid = '#' + "monarch-carousel-indicator"; // carousel boxes
    function _monarch_carousel_step(){
	if( jQuery(mcid).length ){ // determine existance

	    // First, determine how many items and which is currently
	    // visible.
	    var count = _get_carousel_count(mcid);
	    var current = _get_carousel_current(mcid);
	    
	    // Another sanity check.
	    if( ! count || ! current ){
		// Couldn't figure out what's going on.
	    }else{ // Redo display as step.
		
		// Get new numbers.
		var next = (current % count) + 1;
		
		//
		_update_from_to(count, next, function(){
		    // Fresh the indicator to the new status.
		    _refresh_carousel_boxes(mcid, indid);
		});
	    }	    
	}

	// Wait to run this again in timing ms.
	step_timer = window.setTimeout(_monarch_carousel_step, timing);
    }

    // Make carousel boxes active immediately.
    _refresh_carousel_boxes(mcid, indid);

    // Initial run of the stepper to get it started, after timing ms.
    init_timer = window.setTimeout(_monarch_carousel_step, timing);

    ///
    /// Do a rotating tabs section.
    ///

});
