$(document).ready(function() {

var margin = {top: 30, right: 60, bottom: 200, left: 180},
width = 1300 - margin.left - margin.right,
height = 600 - margin.top - margin.bottom;

var x0 = d3.scale.ordinal()
    .rangeRoundBands([0, width], .1);

var x1 = d3.scale.ordinal();

var y = d3.scale.linear()
    .range([height, 0]);

var color = d3.scale.ordinal()
    .range(["#8a89a6","#98abc5", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

var xAxis = d3.svg.axis()
    .scale(x0)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .tickFormat(d3.format(".2s"));

var svg = d3.select("#graph").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.json("/labs/datagraph.json", function(error, json) {

    var groups = json.groups;
    var data = json.dataGraph;

    x0.domain(data.map(function(d) { return d.phenotype; }));
    x1.domain(groups).rangeRoundBands([0, x0.rangeBand()]);
    y.domain([0, d3.max(data, function(d) { 
    	return d3.max(d.counts, function(d) { return d.value; }); })]);
    
    svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis)
    .selectAll("text")  
        .style("text-anchor", "end")
        .attr("dx", "-.5em")
        .attr("dy", ".15em")
        .attr("transform", function(d) {
            return "rotate(-30)" 
            });

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Diseases");

    var phenotype = svg.selectAll(".phenotype")
        .data(data)
        .enter().append("svg:a")
        .attr("class", "bar")
        .attr("xlink:href", function(d) { return "/Phenotype/"+ d.id; })
        .attr("transform", function(d) { return "translate(" + x0(d.phenotype) + ",0)"; });

    phenotype.selectAll("rect")
       .data(function(d) { return d.counts; })
       .enter().append("rect")
       .attr("width", x1.rangeBand())
       .attr("x", function(d) { return x1(d.name); })
       .attr("y", function(d) { return y(d.value); })
       .attr("height", function(d) { return height - y(d.value); })
       .on("mouseover", function(){
           d3.select(this)
           .style("fill", "#71B291");
        })
       .on("mouseout", function(){
           d3.select(this)
           .style("fill", function(d) { return color(d.name); });
        })
       .style("fill", function(d) { return color(d.name); });
    
    var legend = svg.selectAll(".legend")
       .data(groups.slice())
       .enter().append("g")
       .attr("class", "legend")
       .attr("transform", function(d, i) { return "translate(0," + i * 25 + ")"; });

    legend.append("rect")
       .attr("x", width - 115)
       .attr("width", 18)
       .attr("height", 18)
       .style("fill", color);

    legend.append("text")
       .attr("x", width - 120)
       .attr("y", 9)
       .attr("dy", ".35em")
       .style("text-anchor", "end")
       .text(function(d) { return d; });   
    });
});
