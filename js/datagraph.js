$(document).ready(function() {

	var margin = {top: 30, right: 80, bottom: 200, left: 320},
	width = 1000 - margin.left - margin.right,
	height = 900 - margin.top - margin.bottom;

	var y0 = d3.scale.ordinal()
	    .rangeRoundBands([0,height], .1);

	var y1 = d3.scale.ordinal();

	var x = d3.scale.linear()
	    .range([0, width]);

	var color = d3.scale.ordinal()
	    .range(["#44A293","#A4D6D4"]);

	var xAxis = d3.svg.axis()
	    .scale(x)
	    .orient("bottom")
	    .tickFormat(d3.format(".2s"));

	var yAxis = d3.svg.axis()
	    .scale(y0)
	    .orient("left");
	    //.tickFormat(d3.format(".2s"));

	var svg = d3.select("#graph").append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	    .append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	d3.json("/labs/datagraph.json", function(error, json) {

	    var groups = json.groups;
	    var data = json.dataGraph;

	    y0.domain(data.map(function(d) { return d.phenotype; }));
	    y1.domain(groups).rangeRoundBands([0, y0.rangeBand()]);
	    
	    var xGroupMax = d3.max(data, function(d) { 
            return d3.max(d.counts, function(d) { return d.value; }); });
        var xStackMax = d3.max(data, function(d) { 
	    	return d3.max(d.counts, function(d) { return d.x1; }); });
        
        x.domain([0, xGroupMax]);
	    
	    var xTicks = svg.append("g")
	        .attr("class", "x axis")
	        .attr("transform", "translate(0," + height + ")")
	        .call(xAxis)
	        .append("text")
	        .attr("transform", "rotate(0)")
	        .attr("y", 6)
	        .attr("dx", "27em")
	        .attr("dy", "3em")
	        .style("text-anchor", "end")
	        .text("Number Of Annotations");

	    var yTicks = svg.append("g")
	    .attr("class", "y axis")
	    .call(yAxis)
	    .selectAll("text")
	    .filter(function(d){ return typeof(d) == "string"; })
        .style("cursor", "pointer")
        .on("mouseover", function(){
	           d3.select(this).style("fill", "#EA763B");
	           d3.select(this).style("text-decoration", "underline");
	     })
	    .on("mouseout", function(){
	           d3.select(this).style("fill", "#000000" );
	           d3.select(this).style("text-decoration", "none");
	     })
        .on("click", function(d){
        	var monarchID;
        	for (var i=0, len=data.length; i < len; i++){
        		if (data[i].phenotype === d){
        			monarchID = data[i].id;
        			break;
        		}
        	}
            document.location.href = "/phenotype/" + monarchID;
         })
	    .style("text-anchor", "end")
	    .attr("dx", "-.5em")
	    .attr("dy", ".15em")
	    .attr("transform", function(d) {return "rotate(0)"});
	    
	    var phenotype = svg.selectAll(".phenotype")
	        .data(data)
	        .enter().append("svg:g")
	        .attr("class", "bar")
	        //.attr("xlink:href", function(d) { return "/Phenotype/"+ d.id; })
	        .on("click", function(d){
	        	   if (d.subGraph){
	        		   
	    		       transitionSubGraph(d,groups);
	    		       //remove old bars
	    		       rect.transition()
		   		        .duration(750)
		   		        .attr("y", 60)
		   		        .style("fill-opacity", 1e-6)
		   		        .remove();
	        	   }
	    	   
	       })
	        .attr("transform", function(d) { return "translate(0," + y0(d.phenotype) + ")"; });

	    var rect = phenotype.selectAll("rect")
	       .data(function(d) { return d.counts; })
	       .enter().append("rect")
	       .attr("height", y1.rangeBand())
	       .attr("y", function(d) { return y1(d.value); })
	       .attr("x", 0)
	       .attr("width", function(d) { return x(d.value); })
	       .on("mouseover", function(){
	           d3.select(this)
	           .style("fill", "#EA763B");
	        })
	       .on("mouseout", function(){
	           d3.select(this)
	           .style("fill", function(d) { return color(d.name); });
	        })
	       .style("fill", function(d) { return color(d.name); });
	    
	    //rect.transition()
	    //.delay(function(d, i) { return i * 100; });
	    
	    var legend = svg.selectAll(".legend")
	       .data(groups.slice())
	       .enter().append("g")
	       .attr("class", "legend")
	       .attr("transform", function(d, i) { return "translate(0," + i * 25 + ")"; });

	    legend.append("rect")
	       .attr("x", width+55)
	       .attr("y", 4)
	       .attr("width", 18)
	       .attr("height", 18)
	       .style("fill", color);

	    legend.append("text")
	       .attr("x", width+50)
	       .attr("y", 12)
	       .attr("dy", ".35em")
	       .style("text-anchor", "end")
	       .text(function(d) { return d; });   
	    
	    d3.selectAll("input").on("change", change);

	    function change() {
	      if (this.value === "grouped"){
	    	  transitionGrouped();	  
	      } else {
	    	  transitionStacked();
	      }
	    }
	    
	    
	    function transitionGrouped() {
		    x.domain([0, xGroupMax]);
		    y1.domain(groups).rangeRoundBands([0, y0.rangeBand()]);
		       
		    var xTransition = svg.transition().duration(750);
		    xTransition.select(".x.axis").call(xAxis);   

		    rect.transition()
		        .duration(500)
		        .delay(function(d, i) { return i * 10; })
		        .attr("height", y1.rangeBand())
		        .attr("y", function(d) { return y1(d.value); })  
		        .transition()
		        .attr("x", 0)
		        .attr("width", function(d) { return x(d.value); })
		}

		function transitionStacked() {
		    x.domain([0, xStackMax]);
		    y1.domain(groups).rangeRoundBands([0,0]);
		    
		    var t = svg.transition().duration(750);
		    t.select(".x.axis").call(xAxis);

		    rect.transition()
		        .duration(500)
		        .delay(function(d, i) { return i * 10; })
		        .attr("x", function(d) { return x(d.x0); })
			    .attr("width", function(d) { return x(d.x1) - x(d.x0); })
			    .transition()
			    .attr("height", y0.rangeBand())
			    .attr("y", function(d) { return y1(d.value); })
		}
		
	    function transitionSubGraph(d,groups) {
	    	
	    	var subGraph = d.subGraph;
		    var groups = groups;
		    
		    if (subGraph.length < 4){
		        height = 200;
		    } else if ((subGraph.length > 4)&&(subGraph.length < 8)){
		    	height = 300;
		    } else if ((subGraph.length > 8)&&(subGraph.length < 12)){
		    	height = 400;
		    } else {
		    	height = 500;
		    }
		    
			y0 = d3.scale.ordinal()
		        .rangeRoundBands([0,height], .1);
			
			yAxis = d3.svg.axis()
		        .scale(y0)
		        .orient("left");
			
		    console.log($('input[name=mode]:checked').val());

		    y0.domain(subGraph.map(function(d) { return d.phenotype; }));
		    y1.domain(groups).rangeRoundBands([0, y0.rangeBand()]);
		    
		    var xGroupMax = d3.max(subGraph, function(d) { 
	            return d3.max(d.counts, function(d) { return d.value; }); });
		    
		    var xStackMax = d3.max(data, function(d) { 
		    	return d3.max(d.counts, function(d) { return d.x1; }); });
		    
		    var yTransition = svg.transition().duration(750);
		    yTransition.select(".y.axis").call(yAxis)
		    
		    svg.select(".y.axis")
		        .selectAll("text")
		        .filter(function(d){ return typeof(d) == "string"; })
	            .style("cursor", "pointer")
	            .on("mouseover", function(){
		           d3.select(this).style("fill", "#EA763B");
		           d3.select(this).style("text-decoration", "underline");
		         })
		        .on("mouseout", function(){
		           d3.select(this).style("fill", "#000000" );
		           d3.select(this).style("text-decoration", "none");
		        })
	            .on("click", function(d){
	        	    var monarchID;
	        	    for (var i=0, len=subGraph.length; i < len; i++){
	        		    if (subGraph[i].phenotype === d){
	        			    monarchID = subGraph[i].id;
	        			    break;
	        		    }
	        	    }
	                document.location.href = "/phenotype/" + monarchID;
	            });
		  

		    var newPhenotype = svg.selectAll(".newPhenotype")
	            .data(subGraph)
	            .enter().append("svg:g")
	            .attr("class", "bar")
	            .on("click", function(d){
	        	    if (d.subGraph){

	    		       transitionSubGraph(d,groups);
	    		       rect.transition()
		   		        .duration(750)
		   		        .attr("y", 60)
		   		        .style("fill-opacity", 1e-6)
		   		        .remove();
	        	    }
	    	   
	             })
	             .attr("transform", function(d) {
	            	 return "translate(0," + y0(d.phenotype) + ")"; });
		    
		    
		    if ($('input[name=mode]:checked').val()=== 'grouped') {
			    	  
		          x.domain([0, xGroupMax]);
		    
		    var xTransition = svg.transition().duration(500);
		    xTransition.select(".x.axis")
		    .attr("transform", "translate(0," + height + ")")
		    .call(xAxis);
		    
	        var rect = newPhenotype.selectAll("rect")
	            .data(function(d) { return d.counts; })
	            .enter().append("rect")
	            .attr("height", y1.rangeBand())
	            .attr("y", function(d) { return y1(d.value); })
	            .attr("x", 0)
	            .attr("width", function(d) { return x(d.value); })
	            .on("mouseover", function(){
	 	           d3.select(this)
		           .style("fill", "#EA763B");
		        })
	            .on("mouseout", function(){
	                d3.select(this)
	                  .style("fill", function(d) { return color(d.name); });
	            })
	            .style("fill", function(d) { return color(d.name); });
	        } else {
	        	
		          x.domain([0, xStackMax]);
		          y1.domain(groups).rangeRoundBands([0,0]);
				    
				    var xTransition = svg.transition().duration(500);
				    xTransition.select(".x.axis")
				    .attr("transform", "translate(0," + height + ")")
				    .call(xAxis);
				    
			        var rect = newPhenotype.selectAll("rect")
			            .data(function(d) { return d.counts; })
			            .enter().append("rect")
			            .attr("x", function(d) { return x(d.x0); })
			            .attr("width", function(d) { return x(d.x1) - x(d.x0); })
			            .attr("height", y0.rangeBand())
			            .attr("y", function(d) { return y1(d.value); })
			            .on("mouseover", function(){
			 	           d3.select(this)
				           .style("fill", "#EA763B");
				        })
			            .on("mouseout", function(){
			                d3.select(this)
			                  .style("fill", function(d) { return color(d.name); });
			            })
			            .style("fill", function(d) { return color(d.name); });
	        }
	        	 	
	        //Remove old bars
			
	
		}

	});
});
