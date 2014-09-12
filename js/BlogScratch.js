////
//// NOTE: This is test/demo code--don't worry too much about it.
////

jQuery(document).ready(function(){

    // ///
    // /// Do a demo D3 chart from docs.
    // ///

    // var data = [4, 8, 15, 16, 23, 35, 42, 3, 3, 6, 9, 11, 18, 26];

    // var width = 420;
    // var barHeight = 20;

    // var x = d3.scale.linear()
    // 	.domain([0, d3.max(data)])
    // 	.range([0, width]);
    
    // var chart = d3.select("#d3-chart")
    // 	.attr("width", width)
    // 	.attr("height", barHeight * data.length);
    
    // var bar = chart.selectAll("g")
    // 	.data(data)
    // 	.enter().append("g")
    // 	.attr("transform", function(d, i) { return "translate(0," + i * barHeight + ")"; });
    
    // bar.append("rect")
    // 	.attr("width", x)
    // 	.attr("height", barHeight - 1);
    
    // bar.append("text")
    // 	.attr("x", function(d) { return x(d) - 3; })
    // 	.attr("y", barHeight / 2)
    // 	.attr("dy", ".35em")
    // 	.text(function(d) { return d; });

    ///
    /// Do a demo ticker.
    ///

    var ticker_cache = global_data_ticker;
    function _ticker_item_to_string(item){
	var buff = [
	    '<li class="list-group-item data-ticker-line">',
	    '<a href="' + '#' + '" data-toggle="tooltip" title="' + item['resource'] + '" data-content="' + item['monarch_use'] + '">',
	    item['resource'] || '???',
	    '</a>',
	    '</li>'
	    // '<dt>',
	    // item['resource'] || '???',
	    // '</dt>',
	    // '<dd>',
	    // item['data_categories'] || '???',
	    // '</dd>'
	];
	return buff.join('');
    }

    // Add the data to the doc at point.
    (function(){
	var cache = [] 
	_.each(ticker_cache, function(item){
	    cache.push(_ticker_item_to_string(item));
	});
	jQuery('#ticker-demo').empty();
	jQuery('#ticker-demo').append(cache.join("\n"));
	jQuery('#ticker-demo li a').popover({
	    'container': 'body',
	    'trigger': 'hover'
	});
    })();

    // The cycler.
    function _cycle_ticker(){

	// Rotate top item to end.
	var top = ticker_cache.shift();
	ticker_cache.push(top);
	
	// Slide up and remove. Plus removal step (arbitrary--could be below).
	jQuery('#ticker-demo li').first().slideUp(500, function(){
	    // Get rid of the disappeared element.
	    jQuery('#ticker-demo li').first().remove();
	}); 
	// Add and slide in. Plus restart wait (arbitrary--could be above).
	var new_elt = _ticker_item_to_string(top);
	// var new_elt = '<tr><td>' + top + '</td></tr>';
	jQuery(new_elt).hide().appendTo('#ticker-demo').slideDown(500,function(){
	    // When done, start countdown to new cycle.
	    window.setTimeout(_cycle_ticker, 3500);
	});
    }
    //_cycle_ticker(); // start cycling
    
});
