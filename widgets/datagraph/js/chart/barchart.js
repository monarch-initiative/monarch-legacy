/* 
 * Class: barchart.js
 * 
 * Namespace: monarch.dovegraph.chart.barchart
 * 
 */

// Module and namespace checking.
if (typeof monarch == 'undefined') { var monarch = {};}
if (typeof monarch.dovegraph == 'undefined') { monarch.dovegraph = {};}
if (typeof monarch.dovegraph.chart == 'undefined') { monarch.dovegraph.chart = {};}

monarch.dovegraph.chart.barchart = function(config){
    var self = this;

    //Define scales
    self.y0 = d3.scale.ordinal()
        .rangeRoundBands([0,conf.height], .1);

    self.y1 = d3.scale.ordinal();

    self.xMin = 0;

    self.x = d3.scale.linear()
        .range([self.xMin, conf.width]);
  
    //Bar colors
    self.color = d3.scale.ordinal()
        .range([conf.color.first,conf.color.second,conf.color.third,
                conf.color.fourth,conf.color.fifth,conf.color.sixth]);

    self.xAxis = d3.svg.axis()
        .scale(self.x)
        .orient("top")
        .tickFormat(d3.format(".2s"));
        //.ticks(5);

    self.yAxis = d3.svg.axis()
        .scale(self.y0)
        .orient("left");

    self.svg = d3.select(html_div).append("svg")
        .attr("width", conf.width + conf.margin.left + conf.margin.right)
        .attr("height", conf.height + conf.margin.top + conf.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + conf.margin.left + "," + conf.margin.top + ")");
};

monarch.dovegraph.chart.barchart.prototype.transitionYAxisToNewScale = function(duration) {
    var self = this;
    self.svg.transition().duration(time)
      .select(".y.axis").call(graphConfig.yAxis);
};

monarch.dovegraph.chart.barchart.prototype.transitionXAxisToNewScale = function(duration) {
    var self = this;
    self.svg.transition()
      .duration(duration).select(".x.axis").call(graphConfig.xAxis);
};