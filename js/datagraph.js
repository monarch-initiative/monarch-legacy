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
	    
	    svg.append("g")
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

	    svg.append("g")
	    .attr("class", "y axis")
	    .call(yAxis)
	    .selectAll("text")  
	    .style("text-anchor", "end")
	    .attr("dx", "-.5em")
	    .attr("dy", ".15em")
	    .attr("transform", function(d) {
	        return "rotate(0)" 
	        });

	    var phenotype = svg.selectAll(".phenotype")
	        .data(data)
	        .enter().append("svg:a")
	        .attr("class", "bar")
	        .attr("xlink:href", function(d) { return "/Phenotype/"+ d.id; })
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
	      if (this.value === "grouped") transitionGrouped();
	      else transitionStacked();
	    }
	    
	    function transitionGrouped() {
		    x.domain([0, xGroupMax]);
		    y1.domain(groups).rangeRoundBands([0, y0.rangeBand()]);
		       
		    var t = svg.transition().duration(750);
		    t.select(".x.axis").call(xAxis);   

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
	});
});
