$(document).ready(function() {

	var margin = {top: 30, right: 80, bottom: 200, left: 320},
	width = 800 - margin.left - margin.right,
	height = 800 - margin.top - margin.bottom;

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
	
	var tooltip = d3.select("#graph")
	    .append("div")
	    .attr("class", "bartip");

	d3.json("/labs/datagraph.json", function(error, json) {

	    var groups = json.groups;
	    var data = json.dataGraph;
	    var parents = [];	    

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
        .on("mouseover", function(d){
	           d3.select(this).style("fill", "#EA763B");
	           d3.select(this).style("text-decoration", "underline");
	           
	           var monarchID = getPhenotype(d,data);
	           var w = this.getBBox().width;
	           var coords = d3.transform(d3.select(this.parentNode).attr("transform")).translate;
	           var h = coords[1];
	           var offset = 100*(1/w);
	           
	           tooltip.style("display", "block")
	           .html(window.location.hostname +"<br/>"+"/phenotype/"+ monarchID)
	           .style("top",h+margin.bottom-97+"px")
	           .style("left",width-offset-w-margin.right-165+"px");
	     })
	    .on("mouseout", function(){
	           d3.select(this).style("fill", "#000000" );
	           d3.select(this).style("text-decoration", "none");
	           tooltip.style("display", "none");
	     })
        .on("click", function(d){
        	var monarchID = getPhenotype(d,data);
            document.location.href = "/phenotype/" + monarchID;
         })
	    .style("text-anchor", "end")
	    .attr("dx", "-.5em");
	    
	    var phenotype = svg.selectAll(".phenotype")
	        .data(data)
	        .enter().append("svg:g")
	        .attr("class", "bar")
	        .on("click", function(d){
	        	   if (d.subGraph && d.subGraph[0]){
	        		   
	    		       transitionSubGraph(d.subGraph,groups,data);
	    		       
		        	   //remove old bars
	    		       phenotype.transition()
		   		        .duration(750)
		   		        .attr("y", 60)
		   		        .style("fill-opacity", 1e-6)
		   		        .remove();
	        		   
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
	       .attr("y", function(d) { return y1(d.name); })
	       .attr("x", 0)
	       .attr("width", function(d) { return x(d.value); })
	       .on("mouseover", function(d){
	           d3.select(this)
	           .style("fill", "#EA763B");
	           
	           var w = this.getBBox().width;
	           var coords = d3.transform(d3.select(this.parentNode).attr("transform")).translate;
	           var h = coords[1];
	           var heightOffset = this.getBBox().y;
	           
	           tooltip.style("display", "block")
	           .html("Counts: "+"<span style='font-weight:bold'>"+d.value+"</span>"+"<br/>"+"Click to see subclasses")
	           .style("top",h+margin.bottom+heightOffset-margin.top-62+"px")
	           .style("left",width+w-70+"px");

	        })
	       .on("mouseout", function(){
	           d3.select(this)
	           .style("fill", function(d) { return color(d.name); });
	           
	           tooltip.style("display", "none");
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
		        .attr("y", function(d) { return y1(d.name); })  
		        .transition()
		        .attr("x", 0)
		        .attr("width", function(d) { return x(d.value); })
		        
		    rect.on("mouseover", function(d){
	 	         
	 	        var w = this.getBBox().width;
                var coords = d3.transform(d3.select(this.parentNode).attr("transform")).translate;
                var h = coords[1];
	            var heightOffset = this.getBBox().y;
	 		           
                tooltip.style("display", "block")
                .html("Counts: "+"<span style='font-weight:bold'>"+d.value+"</span>"+"<br/>"+"Click to see subclasses")
                .style("top",h+margin.bottom+heightOffset-margin.top-62+"px")
                .style("left",width+w-70+"px");
		       })
	          .on("mouseout", function(){
                  tooltip.style("display", "none")
               })
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
			    .attr("y", function(d) { return y1(d.name); })
			    
			rect.on("mouseover", function(d){
		           
		           var w = this.getBBox().width;
		           var coords = d3.transform(d3.select(this.parentNode).attr("transform")).translate;
		           var h = coords[1];
		           var heightOffset = this.getBBox().y;
		           
		           tooltip.style("display", "block")
		           .html("Counts: "+"<span style='font-weight:bold'>"+d.value+"</span>"+"<br/>"+"Click to see subclasses")
		           .style("top",h+margin.bottom-margin.top+heightOffset-87+"px")
		           .style("left",width+w-100+"px");

		        })
		       .on("mouseout", function(){
		           tooltip.style("display", "none");
		        })
		}
		
		function getPhenotype(d,data){
            for (var i=0, len=data.length; i < len; i++){
     	       if (data[i].phenotype === d){
     			   monarchID = data[i].id;
     			   return monarchID;
     			   break;
     		   }
     	   }
        }
		
	    function transitionSubGraph(subGraph,groups,parent) {
	    		    	
		    var groups = groups;
		    var rect;
		    if (parent){
		        parents.unshift(parent);
		    }
		    
		    if (parents[0]){
		    	 $('.superbtn').css('background-color', '#44A293');
		    	 $('.superbtn').mouseenter(function () {
		    		  $(this).css("background-color", "#38787B");
                 });
		    	 $('.superbtn').mouseleave(function () {
		    		  $(this).css('background-color', '#44A293');
                 });
		    } else {
		    	$('.superbtn').css('background-color', '#2C2B33');
		    	$('.superbtn').mouseenter(function () {
		    		  $(this).css("background-color", "#2C2B33");
               });
		    	 $('.superbtn').mouseleave(function () {
		    		  $(this).css('background-color', '#2C2B33');
               });
		    }
		    
		    if (subGraph.length < 10){
		         height = subGraph.length*40;
		    } else if (subGraph.length < 20){
		         height = subGraph.length*30;
		    } else if (subGraph.length < 25){
		         height = subGraph.length*26;
		    } else {
		    	 height = 800 - margin.top - margin.bottom;
		    }
		    
		    
			y0 = d3.scale.ordinal()
		        .rangeRoundBands([0,height], .1);
			
			yAxis = d3.svg.axis()
		        .scale(y0)
		        .orient("left");

		    y0.domain(subGraph.map(function(d) { return d.phenotype; }));
		    y1.domain(groups).rangeRoundBands([0, y0.rangeBand()]);
		    
		    var xGroupMax = d3.max(subGraph, function(d) { 
	            return d3.max(d.counts, function(d) { return d.value; }); });
		    
		    var xStackMax = d3.max(subGraph, function(d) { 
		        return d3.max(d.counts, function(d) { return d.x1; }); });
		    
		    var yTransition = svg.transition().duration(750);
		    yTransition.select(".y.axis").call(yAxis);
		    
		    svg.select(".y.axis")
		        .selectAll("text")
		        .filter(function(d){ return typeof(d) == "string"; })
	            .style("cursor", "pointer")
	            //.style("font-size","12px")
	            .on("mouseover", function(d){
		           d3.select(this).style("fill", "#EA763B");
		           d3.select(this).style("text-decoration", "underline");
		           
		           var monarchID = getPhenotype(d,subGraph);
		           var w = this.getBBox().width;
		           var coords = d3.transform(d3.select(this.parentNode).attr("transform")).translate;
		           var h = coords[1];
		           var offset = 100*(1/w);
		           
		           tooltip.style("display", "block")
		           .html(window.location.hostname+"/phenotype/" + monarchID)
		           .style("top",h+margin.bottom-97+"px")
		           .style("left",width-offset-w-margin.right-170+"px");
		           
		         })
		        .on("mouseout", function(){
		           d3.select(this).style("fill", "#000000" );
		           d3.select(this).style("text-decoration", "none");
		           tooltip.style("display", "none");
		        })
	            .on("click", function(d){
	            	var monarchID = getPhenotype(d,subGraph);
	                document.location.href = "/phenotype/" + monarchID;
	            })
	            .style("text-anchor", "end")
	            .attr("dx", "-.5em");

		    var phenotype = svg.selectAll(".phenotype")
	            .data(subGraph)
	            .enter().append("svg:g")
	            .attr("class", "bar")
	            .on("click", function(d){
	        	    if (d.subGraph && d.subGraph[0]){

	        	    	transitionSubGraph(d.subGraph,groups,subGraph);
	        	    	
	                    phenotype.transition()
			   		        .duration(750)
			   		        .attr("y", 60)
			   		        .style("fill-opacity", 1e-6)
			   		        .remove();
		    		       
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
		    
		        var xTransition = svg.transition().duration(1000);
		        xTransition.select(".x.axis")
		        .attr("transform", "translate(0," + height + ")")
		        .call(xAxis);
		    
	            rect = phenotype.selectAll("rect")
	                .data(function(d) { return d.counts; })
	                .enter().append("rect")
	                .attr("height", y1.rangeBand())
	                .attr("y", function(d) { return y1(d.name); })
	                .attr("x", 0)
	                .attr("width", function(d) { return x(d.value); })
	                .on("mouseover", function(d){
	 	                d3.select(this)
		                  .style("fill", "#EA763B");
	 	                
	 		           var w = this.getBBox().width;
	 		           var coords = d3.transform(d3.select(this.parentNode).attr("transform")).translate;
	 		           var h = coords[1];
	 		           var heightOffset = this.getBBox().y;
	 		           
	 		           tooltip.style("display", "block")
	 		           .html("Counts: "+"<span style='font-weight:bold'>"+d.value+"</span>"+"<br/>"+"Click to see subclasses")
	 		           .style("top",h+margin.bottom+heightOffset-margin.top-62+"px")
	 		           .style("left",width+w-70+"px");
		            })
	                .on("mouseout", function(){
	                    d3.select(this)
	                      .style("fill", function(d) { return color(d.name); });
	                    tooltip.style("display", "none")
	                })
	                .style("fill", function(d) { return color(d.name); });
	        } else {
	        	
		        x.domain([0, xStackMax]);
		        y1.domain(groups).rangeRoundBands([0,0]);
				    
				var xTransition = svg.transition().duration(1000);
				xTransition.select(".x.axis")
				.attr("transform", "translate(0," + height + ")")
				.call(xAxis);
				    
			    rect = phenotype.selectAll("rect")
			        .data(function(d) { return d.counts; })
			        .enter().append("rect")
			        .attr("x", function(d) { return x(d.x0); })
			        .attr("width", function(d) { return x(d.x1) - x(d.x0); })
			        .attr("height", y0.rangeBand())
			        .attr("y", function(d) { return y1(d.name); })
			        .on("mouseover", function(d){
		               d3.select(this)
		               .style("fill", "#EA763B");
		           
		               var w = this.getBBox().width;
		               var coords = d3.transform(d3.select(this.parentNode).attr("transform")).translate;
		               var h = coords[1];
		               var heightOffset = this.getBBox().y;
		           
		               tooltip.style("display", "block")
		               .html("Counts: "+"<span style='font-weight:bold'>"+d.value+"</span>"+"<br/>"+"Click to see subclasses")
		               .style("top",h+margin.bottom-margin.top+heightOffset-87+"px")
		               .style("left",width+w-100+"px");

		        })
		        .on("mouseout", function(){
		            d3.select(this)
		            .style("fill", function(d) { return color(d.name); });
		            tooltip.style("display", "none");
		        })
		        .style("fill", function(d) { return color(d.name); });
	        }
		    
		    d3.selectAll("input").on("change", change);

		    function change() {
		      if (this.value === "grouped"){
			    	
			      x.domain([0, xGroupMax]);
				  y1.domain(groups).rangeRoundBands([0, y0.rangeBand()]);
				       
				  var xTransition = svg.transition().duration(750);
				  xTransition.select(".x.axis").call(xAxis);
				    
		    	  rect.transition()
			        .duration(500)
			        .delay(function(d, i) { return i * 10; })
			        .attr("height", y1.rangeBand())
			        .attr("y", function(d) { return y1(d.name); })  
			        .transition()
			        .attr("x", 0)
			        .attr("width", function(d) { return x(d.value); })	 
			        
			      rect.on("mouseover", function(d){
	 	                
	 		           var w = this.getBBox().width;
	 		           var coords = d3.transform(d3.select(this.parentNode).attr("transform")).translate;
	 		           var h = coords[1];
	 		           var heightOffset = this.getBBox().y;
	 		           
	 		           tooltip.style("display", "block")
	 		           .html("Counts: "+"<span style='font-weight:bold'>"+d.value+"</span>"+"<br/>"+"Click to see subclasses")
	 		           .style("top",h+margin.bottom+heightOffset-margin.top-62+"px")
	 		           .style("left",width+w-70+"px");
		            })
	                .on("mouseout", function(){
	                    tooltip.style("display", "none")
	                })
		      } else {
		    	  
					
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
				    .attr("y", function(d) { return y1(d.name); })
				    
				   rect.on("mouseover", function(d){
		           
		           var w = this.getBBox().width;
		           var coords = d3.transform(d3.select(this.parentNode).attr("transform")).translate;
		           var h = coords[1];
		           var heightOffset = this.getBBox().y;
		           
		           tooltip.style("display", "block")
		           .html("Counts: "+"<span style='font-weight:bold'>"+d.value+"</span>"+"<br/>"+"Click to see subclasses")
		           .style("top",h+margin.bottom-margin.top+heightOffset-87+"px")
		           .style("left",width+w-100+"px");

		           })
		           .on("mouseout", function(){
		               tooltip.style("display", "none");
		           })
		      }
		    }
		    
		    d3.select(".superbtn").on("click", function(){
		    	
		    	if (parents[0]){
		    	    superclass = parents[0];
		    	    parents.shift();
		    	    transitionSubGraph(superclass,groups);
    	    	
                    phenotype.transition()
	   		            .duration(750)
	   		            .attr("y", 60)
	   		            .style("fill-opacity", 1e-6)
	   		            .remove();
    		       
    		        rect.transition()
	   		            .duration(750)
	   		            .attr("y", 60)
	   		            .style("fill-opacity", 1e-6)
	   		            .remove();
		    	}
		    });
		}
	});
});
