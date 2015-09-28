/*
 * Pup Analytics
 *
 * Simple object for keeping track of the outside world. NOTE/TODO:
 * Considering what puptent is already doing, it may be best to just
 * drop it in there.
 *
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  InteralAnalytics object
 */

/*
 * Constructor: require('pup-analytics')
 * 
 * Creates an instance of the Pup Analytics.
 *
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  An instance of the object.
 */
module.exports = function(){
    var self = this;

    // Collection variable.
    var stats = {};
    
    return {

	/*
	 * Method: hit
	 *
	 * Increment individual hits.
	 *
	 * Parameters: 
	 *  target - string representing the hit
	 *
	 * Returns:
	 *  integer
	 */
	'hit': function(target){
	    var retval = 0;
	    
	    if( target ){
		// Init if necessary.
		if( typeof(stats[target]) === 'undefined' ){
		    stats[target] = 0;
		}
		// Increment. 
		stats[target] = stats[target] + 1;
		
		retval = stats[target];
	    }
	},
	
	/*
	 * Method: report
	 *
	 * Report hits to targets.
	 *
	 * Parameters: 
	 *  target - string representing the hit
	 *
	 * Returns:
	 *  integer
	 */
	'report': function(target){
	    var retval = 0;
	    
	    if( stats[target] ){
		retval = stats[target];
	    }
	    
	    return retval;
	}
    };
}
