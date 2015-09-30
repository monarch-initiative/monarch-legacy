////
//// ...
////

//
if (!jQuery) {
	var jQuery = require('jquery');
}
if (!_) {
	var _ = require('underscore');
}

function MonarchCarousel(carousel_elt, tabber_elt, next_id, prev_id){

    var self = this;

    var celt = carousel_elt;
    var telt = tabber_elt;

	var prev_elt = jQuery(prev_id);
	var next_elt = jQuery(next_id);

	prev_elt.click(function(){
		_cancel_timers();
    	var count = self.get_count();
    	var current = self.get_current();
    	var new_index = (current === 1) ? count : (current - 1);
		self.update_carousel_to(new_index, function(){
			    self.update_tabber_to(new_index);
			});
	});

	next_elt.click(function(){
		_cancel_timers();
    	var count = self.get_count();
    	var current = self.get_current();
    	console.log('count:', count, ' current:', current);
    	var new_index = (current === count) ? 1 : (current + 1);
    	self.update_carousel_to(new_index, function(){
    		    self.update_tabber_to(new_index);
    		});
	});


    // The classes to switch on the tabber during cycling.
    var on_class = 'monarch-tabber-on-item';
    var off_class = 'monarch-tabber-off-item';
    // var on_class = 'btn-default';
    // var off_class = 'btn-primary';

    var timing = 10000; // 10s

    var count = null; // total # "tabs"

    // Sloppy, but usable, way of stopping the timers when we want to.
    //var init_timer = null;
    var step_timer = null;
    function _cancel_timers(){
	//if( init_timer ){ clearTimeout(init_timer); }
	if( step_timer ){ clearTimeout(step_timer); }
    }

    // Test the tabber structure to be sane or not. Perform no
    // operations in insane structures.
    self.okay_p = function(){
	var ret = false;
	
	// Count errors.
	// Yes, I'm cycling through all--it makes debugging easier and
	// costs almost nothing.
	var strikes = 0;

	// Double check carsousel/slide structure.
	if( jQuery(celt).length && jQuery(telt).length &&
	    (jQuery(celt).length == jQuery(telt).length) ){
	    // Good.
	}else{ strikes = strikes + 1; }

	// Probe tabber structure.
	if( jQuery(telt).length && // determine existance
	    jQuery(telt).children() &&
	    jQuery(telt).children().children() ){
	    var kids = jQuery(telt).children().children();
	    _.each(kids, function(child, index){
		if( jQuery(child).children() ){
		    if( jQuery(jQuery(child).children()[0]).is('a') ){
			// Only safe place!
		    }else{ strikes = strikes + 1;}
		}else{ strikes = strikes + 1;}
	    });
	}else{ strikes = strikes + 1;}
	
	// Only good if no strikes.
	if( strikes == 0 ){
	    ret = true;
	}
	
	return ret;
    };
    
    // Get the number of items.
    self.get_count = function(){
	var ret = null;
	ret = jQuery(telt).children().children().length
	return ret;
    }
    
    // Get the currently exposed item, starting from 1.
    // Yes, I'm cycling through all--it makes debugging easier and 
    // costs almost nothing.
    self.get_current = function(){
	var ret = null;
	_.each(jQuery(telt).children().children(), function(child, index){
	    if( jQuery(jQuery(child).children()[0]).hasClass(on_class) ){
		ret = index + 1;
	    }
	});
	return ret;
    }

    // Fade the current, move to the next.
    self.update_carousel_to = function(to_pos, run_at_end_fun){

	// Since they are piled on top of eachother, just fade in
	// and out. Also, need positions, not indexes here, so +1.
	// There can be a race condition with the timer, so fade
	// everything out but the one to be displayed.
	_.times(count, function(i){
	    var from_pos = i+1;
	    if( from_pos != to_pos ){
		var curr_ref =
		    celt + ' .monarch-carousel-item:nth-child(' + from_pos + ')';
		if( jQuery(curr_ref).css('opacity') != '0' &&
		    jQuery(curr_ref).css('opacity') != '0.0' ){
		    jQuery(curr_ref).fadeTo('slow', '0.0');
		    jQuery(curr_ref).zIndex('0');
		}
	    }
	});
	// Bring up next one.
	var next_ref = celt +' .monarch-carousel-item:nth-child('+ to_pos +')';
	jQuery(next_ref).fadeTo('slow', '1.0', function(){
	    jQuery(next_ref).zIndex('1');
	    if( run_at_end_fun ){
		run_at_end_fun();
	    }
	});
    }

    // 
    self.update_tabber_to = function(to_pos){

	// Rotate tabber location.
	var from_pos = 1;
	_.each(jQuery(telt).children().children(), function(child, index){
	    if( from_pos != to_pos ){
		jQuery(jQuery(child).children()[0]).removeClass(on_class);
		jQuery(jQuery(child).children()[0]).addClass(off_class);
	    }else{
		jQuery(jQuery(child).children()[0]).removeClass(off_class);
		jQuery(jQuery(child).children()[0]).addClass(on_class);
	    }
	    
	    from_pos = from_pos + 1;	    
	});	
    }

    // This is a step in the timed loop.
    function _step(){
	    
    	// First, determine how many items and which is currently
    	// visible.
    	var count = self.get_count();
    	var current = self.get_current();
	
    	// Get new numbers.
    	var next = (current % count) + 1;
	    
    	//
    	self.update_carousel_to(next, function(){
    	    // Fresh the indicator to the new status.
    	    self.update_tabber_to(next);
    	});
	
	// Wait to run this again in timing ms.
	step_timer = window.setTimeout(_step, timing);
    }

    self.start_cycle = function(tcount){

	// Override default.
	if( tcount ){ timing = tcount; }

	step_timer = window.setTimeout(_step, timing);	
    }

    ///
    /// Init.
    ///

    if( ! self.okay_p() ){
	console.log('bad MonarchCarousel setup');
    }else{

	// Init our internal count.
	count = self.get_count();

	// Activate tabber buttons.
	_.each(jQuery(telt).children().children(), function(child, index){
	    // Add new event.
	    jQuery(jQuery(child).children()[0]).click(function(){

		// First, stop future timing.
    		_cancel_timers();
		
		// Then move on to click event.
		//alert('boom: ' + target_pos);
    		self.update_carousel_to(index+1, function(){
    		    self.update_tabber_to(index+1);
    		});
	    });
	});
    }
}

//
if (location.pathname === '/') {
jQuery(document).ready(function(){

    // Ready search form in corner, with non-standard names.
    // (Default should not load as the default ids do not exists here.)
    //navbar_search_init('home_search', 'home_search_form');

    // Start carsousel.
    var mcid = '#' + "monarch-carousel"; // carousel series
    var mtid = '#' + "monarch-tabber"; // carousel tabber
    var nextid = '#' + "monarch-tabber-next"; // carousel tabber
    var previd = '#' + "monarch-tabber-prev"; // carousel tabber
    var car = new MonarchCarousel(mcid, mtid, nextid, previd);
    car.start_cycle();

    // Get explore popovers ready.
    jQuery('[data-toggle="popover"]').popover({'trigger':'hover'})
});
}

