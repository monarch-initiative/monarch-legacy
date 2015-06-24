/* 
 * Class: barchart.js
 * 
 * Namespace: monarch.dovegraph.chart.barchart
 * 
 */

// Module and namespace checking.
if (typeof monarch == 'undefined') { var monarch = {};}
if (typeof monarch.chart == 'undefined') { monarch.chart = {};}

monarch.chart.barchart = function(config, html_div){
    var self = this;

    //Define scales
    // Lower value of a bar vertically
    self.y0 = d3.scale.ordinal()
        .rangeRoundBands([0,config.height], .1);
    
    //Upper value of a bar vertically
    self.y1 = d3.scale.ordinal();
    
    // Lower value of a bar horizontally
    self.x0 = 0;

    // Upper value of a bar horizontally
    self.x = d3.scale.linear()
        .range([self.x0, config.width]);
  
    //Bar colors
    self.color = d3.scale.ordinal()
        .range([config.color.first,config.color.second,config.color.third,
                config.color.fourth,config.color.fifth,config.color.sixth]);

    self.xAxis = d3.svg.axis()
        .scale(self.x)
        .orient("top")
        .tickFormat(d3.format(".2s"));

    self.yAxis = d3.svg.axis()
        .scale(self.y0)
        .orient("left");

    self.svg = d3.select(html_div).append("svg")
        .attr("width", config.width + config.margin.left + config.margin.right)
        .attr("height", config.height + config.margin.top + config.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + config.margin.left + "," + config.margin.top + ")");
};

monarch.chart.barchart.prototype.setLinearScale = function(width) {
    var self = this;
    self.x0 = 0;
    
    self.x = d3.scale.linear()
        .range([self.x0, width]);

    self.xAxis = d3.svg.axis()
        .scale(self.x)
        .orient("top")
        .tickFormat(d3.format(".2s"));
    
    return self;
};

monarch.chart.barchart.prototype.setLogScale = function(width) {
    var self = this;
    self.x0 = .1;
    
    self.x = d3.scale.log()
        .range([self.x0, width]);

    self.xAxis = d3.svg.axis()
        .scale(self.x)
        .orient("top")
        .ticks(5);
    
    return self;
};

monarch.chart.barchart.prototype.transitionYAxisToNewScale = function(duration) {
    var self = this;
    self.svg.transition().duration(duration)
        .select(".y.axis").call(self.yAxis);
};

monarch.chart.barchart.prototype.transitionXAxisToNewScale = function(duration) {
    var self = this;
    self.svg.transition()
        .duration(duration).select(".x.axis").call(self.xAxis);
};

//Adjusts the y axis labels in relation to axis ticks
monarch.chart.barchart.prototype.setYAxisTextSpacing = function(dx){
    self.svg.select(".y.axis")
      .selectAll("text")
      .attr("dx", dx);
};