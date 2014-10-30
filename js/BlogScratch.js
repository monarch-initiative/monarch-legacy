////
//// NOTE: This is test/demo code--don't worry too much about it.
////

jQuery(document).ready(function(){

    // Ready search form in corner, with non-standard names.
    // (Default should not load as the default ids do not exists here.)
    navbar_search_init('home_search', 'home_search_form');

    ///
    /// Do a demo carousel.
    ///
    /// We're going to do this as simply as possible by hand to keep
    /// it small and in control.
    ///

    // Run only if sensible.
    var timing = 10000; // 10s
    var mcid = '#' + "monarch-carousel";
    function _monarch_carousel_step(){
	if( jQuery(mcid).length ){ // determine existance

	    // First, determine how many items and which is currently
	    // visible.
	    var count = jQuery(mcid).children().length;
	    var current = null;
	    _.each(jQuery(mcid).children(), function(child, index){
		if( jQuery(child).hasClass('monarch-carousel-item') ){
		    if( jQuery(child).css('opacity') == '1' ||
			jQuery(child).css('opacity') == '1.0' ){
			current = index + 1;
		    }
		}
	    });
	    
	    // Another sanity check.
	    if( ! count || ! current ){
		// Couldn't figure out what's going on.
	    }else{ // Redo display as step.
		
		//alert(count + ', ' + current);
		
		// Get new numbers.
		var next = (current % count) + 1;
		
		// Since they are piled on top of eachother, just fade in
		// and out. Also, need positions, not indexes here, so +1.
		var curr_ref =
		    mcid + ' .monarch-carousel-item:nth-child(' + current + ')';
		var next_ref =
		    mcid + ' .monarch-carousel-item:nth-child(' + next + ')';
		jQuery(curr_ref).fadeTo('slow', '0.0');
		jQuery(next_ref).fadeTo('slow', '1.0', function(){
		    // Redo the blocks to look like an indicator.
		    var indid = '#' + "monarch-carousel-indicator";
		    if( jQuery(indid).length ){
			var cache = [];
			_.times(count, function(i){
			    if( i+1  != next){
				cache.push('&EmptySmallSquare;');
			    }else{
				cache.push('&FilledSmallSquare;');
			    }
			});
			jQuery(indid).html(cache.join(''));
		    }
		});
	    }	    
	}

	// Wait to run this again in timing ms.
	window.setTimeout(_monarch_carousel_step, timing);
    }

    // Initial run of the stepper, after timing ms.
    window.setTimeout(_monarch_carousel_step, timing);
});
