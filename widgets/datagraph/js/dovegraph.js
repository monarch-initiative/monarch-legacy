/* 
 * Package: dovegraph.js
 * 
 * Namespace: monarch.dovegraph
 * 
 */

// Module and namespace checking.
if (typeof monarch == 'undefined') { var monarch = {};}

monarch.dovegraph = function(config){
    self = this;
    if (config == null || typeof config == 'undefined'){
        self.config = self.getDefaultConfig();
    } else {
        self.config = config;
    }
    
    //Check individual properties and set to default if null/undefined
    Object.keys(self).forEach(function(r) {
        if(self[r] == null){
            self[r] = self.getDefaultConfig()[r];
        }
    });
    
    self.setPolygonCoordinates();
    
    //Tooltip offsetting
    self.config.arrowOffset = {height: 21, width: -90};
    self.config.barOffset = {
                 grouped:{
                    height: 95,
                    width: 10
                  },
                  stacked:{
                    height: 80
                  }
    };
    
    if (self.config.isDynamicallyResized){
        self.config.graphSizingRatios = self.setSizingRatios();
    }

    self.level = 0;
    self.parents = [];
    
};
        
monarch.dovegraph.prototype.init = function(html_div,DATA){
     var self = this;
     var config = self.config;
     self.checkData(DATA);
     self.html_div = html_div;
     self.tooltip = d3.select(html_div)
         .append("div")
         .attr("class", "tip");

     self.groups = self.getGroups(DATA);
     
     if (config.isDynamicallyResized){
     
         if (jQuery(window).width() < (config.benchmarkWidth-100) || jQuery(window).height() < (config.benchmarkHeight-100)){
             self.setSizeConfiguration(config.graphSizingRatios);
             self.makeGraphDOM(html_div,DATA); 
             var d3Config = self.setD3Config(html_div,DATA);
             self.drawGraph(DATA,d3Config,html_div);
         } else {
             self.makeGraphDOM(html_div,DATA); 
             var d3Config = self.setD3Config(html_div,DATA);
             self.drawGraph(DATA,d3Config,html_div);
         }
     
         window.addEventListener('resize', function(event){
  
             if (jQuery(window).width() < (config.benchmarkWidth-100) || jQuery(window).height() < (config.benchmarkHeight-100)){
                 jQuery(html_div).children().remove();
                 self.setSizeConfiguration(config.graphSizingRatios);
                 self.makeGraphDOM(html_div,DATA); 
                 var d3Config = self.setD3Config(html_div,DATA);
                 self.drawGraph(DATA,d3Config,html_div);
             }
         });
     } else {
         self.makeGraphDOM(html_div,DATA); 
         var d3Config = self.setD3Config(html_div,DATA);
         self.drawGraph(DATA,d3Config,html_div);
     }
};

monarch.dovegraph.prototype.setSizeConfiguration = function(graphRatio){
    var self = this;
    var w = jQuery(window).width();
    var h = jQuery(window).height();
    var total = w+h;
    
    self.setWidth( ((w*graphRatio.width) / getBaseLog(12,w)) * 3);
    self.setHeight( ((h*graphRatio.height) / getBaseLog(12,h)) *3.5);
    self.setYFontSize( ((total*(graphRatio.yFontSize))/ getBaseLog(20,total)) * 3);
};

monarch.dovegraph.prototype.setSizingRatios = function(){
    var config = this.config;
    var graphRatio = {};
    
    if (!config.benchmarkHeight || !config.benchmarkWidth){
        console.log("Dynamic sizing set without "+
                    "setting benchmarkHeight and/or benchmarkWidth");
    }
    
    graphRatio.width = config.width / config.benchmarkWidth;
    graphRatio.height = config.height / config.benchmarkHeight;
    graphRatio.yFontSize = (config.yFontSize / (config.benchmarkHeight+config.benchmarkWidth));
    
    return graphRatio;
};

//Uses JQuery to create the DOM for the dovegraph
monarch.dovegraph.prototype.makeGraphDOM = function(html_div,data){
      var self = this;
      var config = self.config;
      var groups = self.getGroups(data);
      
      //Create html structure
      //Add graph title
      jQuery(html_div).append( "<div class=title"+
              " style=text-indent:" + config.title['text-indent'] +
              ";text-align:" + config.title['text-align'] +
              ";background-color:" + config.title['background-color'] +
              ";border-bottom-color:" + config.title['border-bottom-color'] +
              ";font-size:" + config.title['font-size'] +
              ";font-weight:" + config.title['font-weight'] +
              "; >"+config.chartTitle+"</div>" );
      jQuery(html_div).append( "<div class=interaction></div>" );
      jQuery(html_div+" .interaction").append( "<li></li>" );
         
      //Override breadcrumb config if subgraphs exist
      config.useCrumb = self.checkForSubGraphs(data);
      
      //add breadcrumb div
      if (config.useCrumb){
          jQuery(html_div+" .interaction li").append("<div class=breadcrumbs></div>");
          d3.select(html_div).select(".breadcrumbs")
              .append("svg")
              .attr("height",(config.bread.height+2))
              .attr("width",config.bcWidth);
      }
      
      jQuery(html_div+" .interaction li").append("<div class=settings></div>");
      
      //Add stacked/grouped form if more than one group
      if (groups.length >1){
          self.makeGroupedStackedForm(html_div);
      }
      
      self.makeLogScaleCheckBox(html_div);
      
      jQuery(html_div+" .interaction li .settings").append(" <form class=zero"+
              " style=font-size:" + config.settingsFontSize + "; >" +
              "<label><input type=\"checkbox\" name=\"zero\"" +
              " value=\"remove\"> Remove Empty Groups</label> " +
              "</form> ");

      //Update tooltip positioning
      if (!config.useCrumb && groups.length>1){
          config.arrowOffset.height = 12;
          config.barOffset.grouped.height = 102;
          config.barOffset.stacked.height = 81;
      } else if (!config.useCrumb){
          config.arrowOffset.height = -10;
          config.barOffset.grouped.height = 71;
          config.barOffset.stacked.height = 50;
      }
};

monarch.dovegraph.prototype.makeLogScaleCheckBox = function (html_div){
    var config = this.config;
    jQuery(html_div+" .interaction li .settings").append(" <form class=scale"+
        " style=font-size:" + config.settingsFontSize + "; >" +
        "<label><input type=\"checkbox\" name=\"scale\"" +
        " value=\"log\"> Log Scale</label> " +
        "</form> ");
}

monarch.dovegraph.prototype.makeGroupedStackedForm = function (html_div){
    var config = this.config;
    jQuery(html_div+" .interaction li .settings").append(" <form class=configure"+
        " style=font-size:" + config.settingsFontSize + "; >" +
        "<label><input id=\"group\" type=\"radio\" name=\"mode\"" +
        " value=\"grouped\" checked> Grouped</label> " +
        "<label><input id=\"stack\" type=\"radio\" name=\"mode\"" +
        " value=\"stacked\"> Stacked</label>" +
        "</form>");
}
  
monarch.dovegraph.prototype.setD3Config = function (html_div,DATA){
    var self = this;
    var conf =  self.config;
    var d3Config = {};

    //Define scales
    d3Config.y0 = d3.scale.ordinal()
        .rangeRoundBands([0,conf.height], .1);

    d3Config.y1 = d3.scale.ordinal();
    
    d3Config.x0 = 0;

    d3Config.x = d3.scale.linear()
        .range([d3Config.x0, conf.width]);
      
    //Bar colors
    d3Config.color = d3.scale.ordinal()
        .range([conf.color.first,conf.color.second,conf.color.third,
                conf.color.fourth,conf.color.fifth,conf.color.sixth]);

    d3Config.xAxis = d3.svg.axis()
        .scale(d3Config.x)
        .orient("top")
        .tickFormat(d3.format(".2s"));
        //.ticks(5);

    d3Config.yAxis = d3.svg.axis()
        .scale(d3Config.y0)
        .orient("left");

    d3Config.svg = d3.select(html_div).append("svg")
        .attr("width", conf.width + conf.margin.left + conf.margin.right)
        .attr("height", conf.height + conf.margin.top + conf.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + conf.margin.left + "," + conf.margin.top + ")");
      
    return d3Config;
};

monarch.dovegraph.prototype.makeLegend = function (graphConfig){
    var config = this.config;
    var svg = graphConfig.svg;
    var groups = self.groups;
    var color = graphConfig.color;
    //Set legend
    var legend = svg.selectAll(".legend")
       .data(groups.slice())
       .enter().append("g")
       .attr("class", "legend")
       .attr("transform", function(d, i) { return "translate(0," + i * (config.legend.height+7) + ")"; });

    legend.append("rect")
       .attr("x", config.width+config.legend.width+37)//HARDCODE
       .attr("y", 6)
       .attr("width", config.legend.width)
       .attr("height", config.legend.height)
       .style("fill", color);

    legend.append("text")
       .attr("x", config.width+config.legend.width+32)
       .attr("y", 14)
       .attr("dy", config.legendText.height)
       .attr("font-size",config.legendFontSize)
       .style("text-anchor", "end")
       .text(function(d) { return d; });
};

monarch.dovegraph.prototype.makeNavArrow = function(data,navigate,triangleDim,barGroup,rect,graphConfig){
    var self = this;
    var config = self.config;
    
    var arrow = navigate.selectAll(".tick.major")
        .data(data)
        .append("svg:polygon")
        .attr("class", "wedge")
        .attr("points",triangleDim)
        .attr("fill", config.color.arrow.fill)
        .attr("display", function(d){
            if (d.subGraph && d.subGraph[0]){
                return "initial";
            } else {
                return "none";
            }
        })
        .on("mouseover", function(d){        
           if (d.subGraph && d.subGraph[0]){
               self.displaySubClassTip(self.tooltip,this)
           } 
        })
        .on("mouseout", function(){
            d3.select(this)
              .style("fill",config.color.arrow.fill);
            self.tooltip.style("display", "none");
        })
        .on("click", function(d){
            if (d.subGraph && d.subGraph[0]){
                self.transitionToNewGraph(graphConfig,d,
                        barGroup,rect,data);
            }
        });
};
//Adjusts the y axis labels in relation to axis ticks
monarch.dovegraph.prototype.setYAxisTextSpacing = function(dx,graphConfig){
    graphConfig.svg.select(".y.axis")
      .selectAll("text")
      .attr("dx", dx);
};

monarch.dovegraph.prototype.transitionToNewGraph = function(graphConfig,data,barGroup,rect,parents){
    self = this;
    config = self.config;
    self.tooltip.style("display", "none");
    graphConfig.svg.selectAll(".tick.major").remove();
    
    if (parents){
        self.level++;
        self.drawSubGraph(graphConfig,data.subGraph,parents);
        self.removeSVGWithSelection(barGroup,650,60,1e-6);
        self.removeSVGWithSelection(rect,650,60,1e-6);
    } else {
        self.redrawGraph(data,graphConfig);
        self.removeSVGWithSelection(barGroup,650,60,1e-6);
        self.removeSVGWithSelection(rect,650,60,1e-6);
        return;
    }
    //remove old bars
    self.removeSVGWithSelection(barGroup,650,60,1e-6);
    self.removeSVGWithSelection(rect,650,60,1e-6);
    
    if (config.useCrumb){
        self.makeBreadcrumb(graphConfig,data.label,self.groups,
                rect,barGroup,data.fullLabel);
    }
};

monarch.dovegraph.prototype.removeSVGWithSelection = function(select,duration,y,opacity){
    select.transition()
        .duration(duration)
        .attr("y", y)
        .style("fill-opacity", opacity)
        .remove();
};

monarch.dovegraph.prototype.removeSVGWithClass = function(graphConfig,cs,duration,y,opacity){
    graphConfig.svg.selectAll(cs).transition()
        .duration(duration)
        .attr("y", y)
        .style("fill-opacity", opacity)
        .remove();
};

monarch.dovegraph.prototype.displaySubClassTip = function(tooltip,d3Selection){
    var self = this;
    var config = self.config;
    d3.select(d3Selection)
      .style("fill", config.color.arrow.hover);

    var coords = d3.transform(d3.select(d3Selection.parentNode)
            .attr("transform")).translate;
    var h = coords[1];
    var w = coords[0];
    
    tooltip.style("display", "block")
    .html("Click to see subclasses")
    .style("top",h+config.margin.top+config.bread.height+
            config.arrowOffset.height+"px")
    .style("left",w+config.margin.left+config.arrowOffset.width+"px");
};

monarch.dovegraph.prototype.getCountMessage = function(value,name){
    return "Counts: "+"<span style='font-weight:bold'>"+value+"</span>"+"<br/>"
            +"Organism: "+ "<span style='font-weight:bold'>"+name;
};

monarch.dovegraph.prototype.displayCountTip = function(tooltip,value,name,d3Selection,barLayout){
    var self = this;
    var config = self.config;
    var coords = d3.transform(d3.select(d3Selection.parentNode)
            .attr("transform")).translate;
    var w = coords[0];
    var h = coords[1];
    var heightOffset = d3Selection.getBBox().y;
    var widthOffset = d3Selection.getBBox().width;
    
    tooltip.style("display", "block")
    .html(self.getCountMessage(value,name));
    if (barLayout == 'grouped'){
        tooltip.style("top",h+heightOffset+config.barOffset.grouped.height+"px")
        .style("left",w+config.barOffset.grouped.width+widthOffset+
                config.margin.left+"px");
    } else if (barLayout == 'stacked'){
        tooltip.style("top",h+heightOffset+config.barOffset.stacked.height+"px")
        .style("left",w+config.barOffset.grouped.width+widthOffset+
                config.margin.left+"px");
    }
};

monarch.dovegraph.prototype.setGroupPositioning = function (graphConfig,graphData) {
    var self = this;
    var data = self.setDataPerSettings(graphData);
    var groupPos = graphConfig.svg.selectAll()
       .data(data)
       .enter().append("svg:g")
       .attr("class", ("bar"+self.level))
       .attr("transform", function(d) { return "translate(0," + graphConfig.y0(d.id) + ")"; });
    return groupPos;
};

monarch.dovegraph.prototype.setXYDomains = function (graphConfig,data,groups) {
    var self = this;
    //Set y0 domain
    data = self.setDataPerSettings(data);
    graphConfig.y0.domain(data.map(function(d) { return d.id; }));
    
    if (jQuery('input[name=mode]:checked').val()=== 'grouped' || groups.length === 1){
        var xGroupMax = self.getGroupMax(data);
        graphConfig.x.domain([graphConfig.x0, xGroupMax]);
        graphConfig.y1.domain(groups)
        .rangeRoundBands([0, graphConfig.y0.rangeBand()]);
    } else if (jQuery('input[name=mode]:checked').val()=== 'stacked'){
        var xStackMax = self.getStackMax(data);
        graphConfig.x.domain([graphConfig.x0, xStackMax]);
        graphConfig.y1.domain(groups).rangeRoundBands([0,0]);
    } else {
        graphConfig.y1.domain(groups)
        .rangeRoundBands([0, graphConfig.y0.rangeBand()]);
    }
};

monarch.dovegraph.prototype.makeBar = function (barGroup,graphConfig,barLayout) {
    var rect;
    var self = this;
    var config = self.config;
    
    //Create bars 
    if (barLayout == 'grouped'){
        rect = barGroup.selectAll("g")
          .data(function(d) { return d.counts; })
          .enter().append("rect")
          .attr("class",("rect"+self.level))
          .attr("height", graphConfig.y1.rangeBand())
          .attr("y", function(d) { return graphConfig.y1(d.name); })
          .attr("x", 1)
          .attr("width", function(d) { 
              if (( jQuery('input[name=scale]:checked').val() === 'log' )&&
                  ( d.value == 0 )){
                  return 1;
              } else {
                  return graphConfig.x(d.value); 
              }
           })
          .on("mouseover", function(d){
            d3.select(this)
              .style("fill", config.color.bar.fill);
              self.displayCountTip(self.tooltip, d.value, d.name, this, 'grouped');
          })
          .on("mouseout", function(){
            d3.select(this)
              .style("fill", function(d) { return graphConfig.color(d.name); });
            self.tooltip.style("display", "none");
          })
          .style("fill", function(d) { return graphConfig.color(d.name); });
        
    } else if (barLayout == 'stacked') {
        rect = barGroup.selectAll("g")
          .data(function(d) { return d.counts; })
          .enter().append("rect")
          .attr("class",("rect"+self.level))
          .attr("x", function(d){
              if (d.x0 == 0){
                  return 1;
              } else { 
                return graphConfig.x(d.x0);
              } 
          })
          .attr("width", function(d) { 
              if (d.x0 == 0 && d.x1 != 0){
                  return graphConfig.x(d.x1); 
              } else if (( jQuery('input[name=scale]:checked').val() === 'log' ) &&
                         ( graphConfig.x(d.x1) - graphConfig.x(d.x0) == 0 )){
                  return 1;  
              } else {
                  return graphConfig.x(d.x1) - graphConfig.x(d.x0); 
              }
          })
          .attr("height", graphConfig.y0.rangeBand())
          .attr("y", function(d) { return graphConfig.y1(d.name); })
          .on("mouseover", function(d){
            d3.select(this)
              .style("fill", config.color.bar.fill);
            self.displayCountTip(self.tooltip,d.value,d.name,this,'stacked');

          })
          .on("mouseout", function(){
            d3.select(this)
              .style("fill", function(d) { return graphConfig.color(d.name); });
            self.tooltip.style("display", "none");
          })
          .style("fill", function(d) { return graphConfig.color(d.name); });
    }
    return rect;
};

monarch.dovegraph.prototype.setLinearScale = function (graphConfig,data,groups,rect) {
    var self = this;
    var config = self.config;
    graphConfig.x0 = 0;
    
    graphConfig.x = d3.scale.linear()
        .range([graphConfig.x0, config.width]);

    graphConfig.xAxis = d3.svg.axis()
        .scale(graphConfig.x)
        .orient("top")
        .tickFormat(d3.format(".2s"));
    
    return graphConfig;
};

monarch.dovegraph.prototype.setLogScale = function (graphConfig,data,groups,rect) {
    var self = this;
    var config = self.config;
    graphConfig.x0 = .1;
    
    graphConfig.x = d3.scale.log()
        .range([graphConfig.x0, config.width]);

    graphConfig.xAxis = d3.svg.axis()
        .scale(graphConfig.x)
        .orient("top")
        .ticks(5);
    
    return graphConfig;
};

monarch.dovegraph.prototype.transitionGrouped = function (graphConfig,data,groups,rect) {
    var self = this;
    var config = self.config;
    self.setXYDomains(graphConfig,data,groups);
    self.transitionXAxisToNewScale(graphConfig,750);
          
    rect.transition()
      .duration(500)
      .delay(function(d, i) { return i * 10; })
      .attr("height", graphConfig.y1.rangeBand())
      .attr("y", function(d) { return graphConfig.y1(d.name); })  
      .transition()
      .attr("x", 1)
      .attr("width", function(d) { 
          if (( jQuery('input[name=scale]:checked').val() === 'log' ) &&
              ( d.value == 0 )){
              return 1;
          } else {
              return graphConfig.x(d.value); 
          }
      }); 
          
    rect.on("mouseover", function(d){
            
        d3.select(this)
        .style("fill", config.color.bar.fill);
        self.displayCountTip(self.tooltip,d.value,d.name,this,'grouped');
    })
    .on("mouseout", function(){
        self.tooltip.style("display", "none")
        d3.select(this)
        .style("fill", function(d) { return graphConfig.color(d.name); });
    })
};

monarch.dovegraph.prototype.transitionStacked = function (graphConfig,data,groups,rect) {
    var self = this;
    var config = self.config;
    self.setXYDomains(graphConfig,data,groups,'stacked');
    self.transitionXAxisToNewScale(graphConfig,750);
         
    rect.transition()
      .duration(500)
      .delay(function(d, i) { return i * 10; })
      .attr("x", function(d){
              if (d.x0 == 0){
                  return 1;
              } else { 
                return graphConfig.x(d.x0);
              } 
      })
      .attr("width", function(d) { 
          if (d.x0 == 0 && d.x1 != 0){
              return graphConfig.x(d.x1); 
          } else if (( jQuery('input[name=scale]:checked').val() === 'log' ) &&
                     ( graphConfig.x(d.x1) - graphConfig.x(d.x0) == 0 )){
              return 1;  
          } else {
              return graphConfig.x(d.x1) - graphConfig.x(d.x0); 
          }
      })
      .transition()
      .attr("height", graphConfig.y0.rangeBand())
      .attr("y", function(d) { return graphConfig.y1(d.name); })
      
    rect.on("mouseover", function(d){
            
        d3.select(this)
            .style("fill", config.color.bar.fill);
                self.displayCountTip(self.tooltip,d.value,d.name,this,'stacked');
    })
    .on("mouseout", function(){
        self.tooltip.style("display", "none");
        d3.select(this)
        .style("fill", function(d) { return graphConfig.color(d.name); });
    })
};

//HACK, need to refactor all draw functions into one
monarch.dovegraph.prototype.redrawGraph = function (data,graphConfig) {
    var self = this;
    var config = self.config;
    var groups = self.groups;

    data = self.getStackedStats(data);
    data = self.sortDataByGroupCount(data,groups);
    data = self.addEllipsisToLabel(data,config.maxLabelSize);
    
    var height = self.resizeChart(data);
    //reset d3 config after changing height
    graphConfig.y0 = d3.scale.ordinal()
      .rangeRoundBands([0,height], .1);
            
    graphConfig.yAxis = d3.svg.axis()
      .scale(graphConfig.y0)
      .orient("left");

    self.setXYDomains(graphConfig,data,groups);
        
    //Dynamically decrease font size for large labels
    var yFont = self.adjustYAxisElements(data.length);
    self.transitionYAxisToNewScale(graphConfig,1000);
    
    self.setYAxisText(graphConfig,data);

    var barGroup = self.setGroupPositioning(graphConfig,data);
    var rect = self.setBarConfigPerCheckBox(graphConfig,data,groups,barGroup);
    
    var navigate = graphConfig.svg.selectAll(".y.axis");
    self.makeNavArrow(data,navigate,config.arrowDim,
                           barGroup,rect,graphConfig);

    if (!self.checkForSubGraphs(data)){
        self.setYAxisTextSpacing(0,graphConfig);
        graphConfig.svg.selectAll("polygon.wedge").remove();
    }
    
    d3.select(self.html_div).select('.configure')
    .on("change",function(){
        self.changeBarConfig(graphConfig,data,groups,rect);
    });
  
    d3.select(self.html_div).select('.scale')
    .on("change",function(){
        self.changeScale(graphConfig,data,groups,rect);
        if (groups.length > 1){
            //reuse change bar config
            self.changeBarConfig(graphConfig,data,groups,rect);
        } else {
            self.transitionGrouped(graphConfig,data,groups,rect);
        }
    });
  
    d3.select(self.html_div).select('.zero')
    .on("change",function(){
        self.transitionToNewGraph(graphConfig,data,barGroup,rect);
    });
};

monarch.dovegraph.prototype.drawGraph = function (data,graphConfig) {
    var self = this;
    var config = self.config;
    var groups = self.groups;

    data = self.getStackedStats(data);
    data = self.sortDataByGroupCount(data,groups);
    data = self.addEllipsisToLabel(data,config.maxLabelSize);
    
    self.setXYDomains(graphConfig,data,groups);
    
    if (groups.length == 1){
        config.barOffset.grouped.height = config.barOffset.grouped.height+8;
        config.barOffset.stacked.height = config.barOffset.stacked.height+8;
    }
    
    //Dynamically decrease font size for large labels
    var yFont = self.adjustYAxisElements(data.length);
    
    //Set x axis ticks
    var xTicks = graphConfig.svg.append("g")
        .attr("class", "x axis")
        .call(graphConfig.xAxis)
        .style("font-size",config.xFontSize)
        .append("text")
        .attr("transform", "rotate(0)")
        .attr("y", config.xAxisPos.y)
        .attr("dx", config.xAxisPos.dx)
        .attr("dy", "0em")
        .style("text-anchor", "end")
        .style("font-size",config.xLabelFontSize)
        .text(config.xAxisLabel);
    
    //Set Y axis ticks and labels
    var yTicks = graphConfig.svg.append("g")
        .attr("class", "y axis")
        .call(graphConfig.yAxis);
        
    self.setYAxisText(graphConfig,data);
    
    //Create SVG:G element that holds groups
    var barGroup = self.setGroupPositioning(graphConfig,data);
    var rect = self.setBarConfigPerCheckBox(graphConfig,data,groups,barGroup);
    
    //Create navigation arrow
    var navigate = graphConfig.svg.selectAll(".y.axis");
    self.makeNavArrow(data,navigate,config.arrowDim,
                           barGroup,rect,graphConfig);
    if (!self.checkForSubGraphs(data)){
        self.setYAxisTextSpacing(0,graphConfig);
        graphConfig.svg.selectAll("polygon.wedge").remove();
    }
    
    //Create legend
    if (config.useLegend){
            self.makeLegend(graphConfig);
    }
    
    //Make first breadcrumb
    if (config.useCrumb){
        self.makeBreadcrumb(graphConfig,config.firstCrumb,
                                 groups,rect,barGroup);
    }
    
    d3.select(self.html_div).select('.configure')
      .on("change",function(){
          self.changeBarConfig(graphConfig,data,groups,rect);});
    
    d3.select(self.html_div).select('.scale')
    .on("change",function(){
        self.changeScale(graphConfig,data,groups,rect);
        if (groups.length > 1){
            //reuse change bar config
            self.changeBarConfig(graphConfig,data,groups,rect);
        } else {
            self.transitionGrouped(graphConfig,data,groups,rect);
        }
    });
    
    d3.select(self.html_div).select('.zero')
    .on("change",function(){
        self.transitionToNewGraph(graphConfig,data,barGroup,rect);
    });
};

//
monarch.dovegraph.prototype.setDataPerSettings = function(data){
    var self = this;
    if (self.getValueOfCheckbox('zero','remove')){
        data = self.removeZeroCounts(data);
    }
    return data;
}
// Generic function to check the value of a checkbox given it's name
// and value
monarch.dovegraph.prototype.getValueOfCheckbox = function(name,value){
    var self = this;
    if (jQuery('input[name='+name+']:checked').val() === value){
        return true;
    } else if (typeof jQuery('input[name=zero]:checked').val() === 'undefined'){
        return false;
    }
};

monarch.dovegraph.prototype.changeScale = function(graphConfig,data,groups,rect){
    var self = this;
    if (self.getValueOfCheckbox('scale','log')){
        self.setLogScale(graphConfig,data,groups,rect);
    } else {
        self.setLinearScale(graphConfig,data,groups,rect);
    }
};

monarch.dovegraph.prototype.changeBarConfig = function(graphConfig,data,groups,rect){
    var self = this;
    if (self.getValueOfCheckbox('mode','grouped')){
        self.transitionGrouped(graphConfig,data,groups,rect);
    } else if (self.getValueOfCheckbox('mode','stacked')) {
        self.transitionStacked(graphConfig,data,groups,rect);
    }
};

//Resize height of chart after transition
monarch.dovegraph.prototype.resizeChart = function(data){
    var self = this;
    var config = self.config;
    var height = config.height;
    data = self.setDataPerSettings(data);
    if (data.length < 25){
         height = data.length*26; 
         if (height > config.height){
             height = config.height;
         }
    }
    return height;
};

monarch.dovegraph.prototype.pickUpBreadcrumb = function(graphConfig,index,groups,rect,barGroup) {
    var self = this;
    var config = self.config;
    var lastIndex = self.level;
    var superclass = self.parents[index];
    var isFromCrumb = true;
    var parent;
    var rectClass = ".rect"+lastIndex;
    var barClass = ".bar"+lastIndex;
    //set global level
    self.level = index;
    
    graphConfig.svg.selectAll(".tick.major").remove();
    self.drawSubGraph(graphConfig,superclass,self.parents,isFromCrumb);
    
    for (var i=(index+1); i <= self.parents.length; i++){
        d3.select(self.html_div).select(".bread"+i).remove();
    }
    self.removeSVGWithClass(graphConfig,barClass,750,60,1e-6);
    self.removeSVGWithClass(graphConfig,rectClass,750,60,1e-6);

    self.parents.splice(index,(self.parents.length));        
    
    //Deactivate top level crumb
    if (config.useCrumbShape){
        d3.select(self.html_div).select(".poly"+index)
          .attr("fill", config.color.crumb.top)
          .on("mouseover", function(){})
          .on("mouseout", function(){
              d3.select(this)
                .attr("fill", config.color.crumb.top);
          })
          .on("click", function(){});
        
        d3.select(self.html_div).select(".text"+index)
        .on("mouseover", function(){})
        .on("mouseout", function(){
             d3.select(this.parentNode)
             .select("polygon")
             .attr("fill", config.color.crumb.top);
        })
        .on("click", function(){});
    } else {
        d3.select(self.html_div).select(".text"+index)
          .style("fill",config.color.crumbText)
          .on("mouseover", function(){})
          .on("mouseout", function(){})
          .on("click", function(){});
    }
};

monarch.dovegraph.prototype.makeBreadcrumb = function(graphConfig,label,groups,rect,phenoDiv,fullLabel) {
    var self = this;
    var config = self.config;
    var html_div = self.html_div;
    var index = self.level;
    
    if (!label){
        label = config.firstCrumb;
    }
    var lastIndex = (index-1);
    var phenLen = label.length;
    var fontSize = config.crumbFontSize;

    //Change color of previous crumb
    if (lastIndex > -1){
        if (config.useCrumbShape){
            d3.select(html_div).select(".poly"+lastIndex)
                .attr("fill", config.color.crumb.bottom)
                .on("mouseover", function(){
                d3.select(this)
                  .attr("fill", config.color.crumb.hover);
            })
            .on("mouseout", function(){
                d3.select(this)
               .attr("fill", config.color.crumb.bottom);
            })
            .on("click", function(){
                self.pickUpBreadcrumb(graphConfig,lastIndex,groups,rect,phenoDiv);
            });
        }
        
        d3.select(html_div).select(".text"+lastIndex)
          .on("mouseover", function(){
              d3.select(this.parentNode)
               .select("polygon")
               .attr("fill", config.color.crumb.hover);
              
              if (!config.useCrumbShape){
                  d3.select(this)
                    .style("fill",config.color.crumb.hover);
              }
          })
          .on("mouseout", function(){
              d3.select(this.parentNode)
               .select("polygon")
               .attr("fill", config.color.crumb.bottom);
              if (!config.useCrumbShape){
                  d3.select(this)
                    .style("fill",config.color.crumbText);
              }
          })
          .on("click", function(){
                self.pickUpBreadcrumb(graphConfig,lastIndex,groups,rect,phenoDiv);
          });
    }
    
    d3.select(html_div).select(".breadcrumbs")
    .select("svg")
    .append("g")  
    .attr("class",("bread"+index))
    .attr("transform", "translate(" + index*(config.bread.offset+config.bread.space) + ", 0)");
    
    if (config.useCrumbShape){
        
        d3.select(html_div).select((".bread"+index))
        .append("svg:polygon")
        .attr("class",("poly"+index))
        .attr("points",index ? config.trailCrumbs : config.firstCr)
        .attr("fill", config.color.crumb.top);
        
    } 
    
    //This creates the hover tooltip
    if (fullLabel){
        d3.select(html_div).select((".bread"+index))
            .append("svg:title")
            .text(fullLabel);
    } else { 
        d3.select(html_div).select((".bread"+index))
            .append("svg:title")
            .text(label);
    }
           
    d3.select(html_div).select((".bread"+index))
        .append("text")
        .style("fill",config.color.crumbText)
        .attr("class",("text"+index))
        .attr("font-size", fontSize)
        .each(function () {
            var words = label.split(/\s|\/|\-/);
            var len = words.length;
            if (len > 2 && !label.match(/head and neck/i)){
                words.splice(2,len);
                words[1]=words[1]+"...";
            }
            len = words.length;
            for (i = 0;i < len; i++) {
                if (words[i].length > 12){
                    fontSize = ((1/words[i].length)*150);
                    var reg = new RegExp("(.{"+8+"})(.+)");
                    words[i] = words[i].replace(reg,"$1...");
                }
            }
            //Check that we haven't increased over the default
            if (fontSize > config.crumbFontSize){
                fontSize = config.crumbFontSize;
            }
            for (i = 0;i < len; i++) {
                d3.select(this).append("tspan")
                    .text(words[i])
                    .attr("font-size",fontSize)
                    .attr("x", (config.bread.width)*.45)
                    .attr("y", (config.bread.height)*.42)
                    .attr("dy", function(){
                        if (i === 0 && len === 1){
                            return ".55em";
                        } else if (i === 0){
                            return ".1em";
                        } else if (i < 2 && len > 2 
                                   && words[i].match(/and/i)){
                            return ".1em";;
                        } else {
                            return "1.2em";
                        }
                    })
                    .attr("dx", function(){
                        if (index === 0){
                            return ".1em";
                        }
                        if (i === 0 && len === 1){
                            return ".2em";
                        } else if (i == 0 && len >2
                                   && words[1].match(/and/i)){
                            return "-1.2em";
                        } else if (i === 0){
                            return ".3em";
                        } else if (i === 1 && len > 2
                                   && words[1].match(/and/i)){
                            return "1.2em";
                        } else {
                            return ".25em";
                        }
                    })
                    .attr("text-anchor", "middle")
                    .attr("class", "tspan" + i);
            }
        });
};

monarch.dovegraph.prototype.transitionYAxisToNewScale = function(graphConfig,time) {
    graphConfig.svg.transition().duration(time)
      .select(".y.axis").call(graphConfig.yAxis);
};

monarch.dovegraph.prototype.transitionXAxisToNewScale = function(graphConfig,duration) {
    graphConfig.svg.transition()
      .duration(duration).select(".x.axis").call(graphConfig.xAxis);
};

monarch.dovegraph.prototype.setBarConfigPerCheckBox = function(graphConfig,data,groups,barGroup) {
    self = this;
    data = self.setDataPerSettings(data);
    if (jQuery('input[name=mode]:checked').val()=== 'grouped' || groups.length === 1) {
        self.setXYDomains(graphConfig,data,groups,'grouped');
        self.transitionXAxisToNewScale(graphConfig,1000);
        return self.makeBar(barGroup,graphConfig,'grouped');
    } else {     
        self.setXYDomains(graphConfig,data,groups,'stacked');
        self.transitionXAxisToNewScale(graphConfig,1000);
        return self.makeBar(barGroup,graphConfig,'stacked');
    }
};

monarch.dovegraph.prototype.setYAxisText = function(graphConfig,data){
    self = this;
    config = self.config;
    data = self.setDataPerSettings(data);
    
    graphConfig.svg.select(".y.axis")
    .selectAll("text")
    .text(function(d){ return self.getIDLabel(d,data) })
    .attr("font-size", yFont)
    .on("mouseover", function(d){
        if (config.isYLabelURL){
            d3.select(this).style("cursor", "pointer");
            d3.select(this).style("fill", config.color.yLabel.hover);
            d3.select(this).style("text-decoration", "underline");
        }
    })
    .on("mouseout", function(){
        d3.select(this).style("fill", config.color.yLabel.fill );
        d3.select(this).style("text-decoration", "none");
    })
    .on("click", function(d){
        if (config.isYLabelURL){
            d3.select(this).style("cursor", "pointer");
            document.location.href = config.yLabelBaseURL + d;
        }
    })
    .style("text-anchor", "end")
    .attr("dx", config.yOffset)
    .append("svg:title")
    .text(function(d){
        if (/\.\.\./.test(self.getIDLabel(d,data))){
            var fullLabel = self.getFullLabel(self.getIDLabel(d,data),data);
              return (fullLabel);  
        } else if (yFont < 12) {//HARDCODE alert
              return (self.getIDLabel(d,data));
        }
    });
};

//  Transition to new graph
//  NOTE - this will be refactored as AJAX calls
monarch.dovegraph.prototype.drawSubGraph = function(graphConfig,subGraph,parent,isFromCrumb) {
    var self = this;
    var config = self.config;
    
    self.checkData(subGraph);

    self.groups = self.getGroups(subGraph);
    var groups = self.groups;
  
    subGraph = self.getStackedStats(subGraph);
    subGraph = self.sortDataByGroupCount(subGraph,groups);
    
    if (!isFromCrumb){
        subGraph = self.addEllipsisToLabel(subGraph,config.maxLabelSize);
    }
    
    if (parent){
        self.parents.push(parent);
    }
        
    var height = self.resizeChart(subGraph);
    //reset d3 config after changing height
    graphConfig.y0 = d3.scale.ordinal()
      .rangeRoundBands([0,height], .1);
            
    graphConfig.yAxis = d3.svg.axis()
      .scale(graphConfig.y0)
      .orient("left");

    self.setXYDomains(graphConfig,subGraph,groups);
        
    //Dynamically decrease font size for large labels
    var yFont = self.adjustYAxisElements(subGraph.length);
    self.transitionYAxisToNewScale(graphConfig,1000);
    
    self.setYAxisText(graphConfig,subGraph);

    var barGroup = self.setGroupPositioning(graphConfig,subGraph);
    var rect = self.setBarConfigPerCheckBox(graphConfig,subGraph,groups,barGroup);
    
    var navigate = graphConfig.svg.selectAll(".y.axis");
    self.makeNavArrow(subGraph,navigate,config.arrowDim,
                           barGroup,rect,graphConfig);

    if (!self.checkForSubGraphs(subGraph)){
        self.setYAxisTextSpacing(0,graphConfig);
        graphConfig.svg.selectAll("polygon.wedge").remove();
    }

    d3.select(self.html_div).select('.configure')
    .on("change",function(){
        self.changeBarConfig(graphConfig,subGraph,groups,rect);});
  
    d3.select(self.html_div).select('.scale')
    .on("change",function(){
        self.changeScale(graphConfig,subGraph,groups,rect);
        if (groups.length > 1){
            //reuse change bar config
            self.changeBarConfig(graphConfig,subGraph,groups,rect);
        } else {
            self.transitionGrouped(graphConfig,subGraph,groups,rect);
        }
    });
  
    d3.select(self.html_div).select('.zero')
    .on("change",function(){
        self.transitionToNewGraph(graphConfig,subGraph,barGroup,rect);
    });
};

////////////////////////////////////////////////////////////////////
//
//Data object manipulation
//
//The functions below manipulate the data object for
//various functionality
//

//get X Axis limit for grouped configuration
monarch.dovegraph.prototype.getGroupMax = function(data){
      return d3.max(data, function(d) { 
          return d3.max(d.counts, function(d) { return d.value; });
      });
};

//get X Axis limit for stacked configuration
monarch.dovegraph.prototype.getStackMax = function(data){
      return d3.max(data, function(d) { 
          return d3.max(d.counts, function(d) { return d.x1; });
      }); 
};

//get largest Y axis label for font resizing
monarch.dovegraph.prototype.getYMax = function(data){
      return d3.max(data, function(d) { 
          return d.label.length;
      });
};
  
monarch.dovegraph.prototype.checkForSubGraphs = function(data){
     for (i = 0;i < data.length; i++) {
          if ((Object.keys(data[i]).indexOf('subGraph') >= 0 ) &&
             ( typeof data[i]['subGraph'][0] != 'undefined' )){
              return true;
          } 
     }
     return false;
};
  
monarch.dovegraph.prototype.getStackedStats = function(data){
      //Add x0,x1 values for stacked barchart
      data.forEach(function (r){
          var count = 0;
          r.counts.forEach(function (i){
               i["x0"] = count;
               i["x1"] = i.value+count;
               if (i.value > 0){
                   count = i["x1"];
               }
           });
      });
      return data;
};

monarch.dovegraph.prototype.sortDataByGroupCount = function(data,groups){
    var self = this;
    //Check if total counts have been calculated via getStackedStats()
    if (data[0].counts[0].x1 == null){
        data = self.getStackedStats(data);
    }
    
    var lastElement = groups.length-1;
    data.sort(function(obj1, obj2) {
        if ((obj2.counts[lastElement])&&(obj1.counts[lastElement])){
            return obj2.counts[lastElement].x1 - obj1.counts[lastElement].x1;
        } else {
            return 0;
        }
    });
    return data;
};

monarch.dovegraph.prototype.getGroups = function(data) {
      var groups = [];
      var unique = {};
      for (var i=0, len=data.length; i<len; i++) { 
          for (var j=0, cLen=data[i].counts.length; j<cLen; j++) { 
              unique[ data[i].counts[j].name ] =1;
          }
      }
      groups = Object.keys(unique);
      return groups;
};

//TODO improve checking
monarch.dovegraph.prototype.checkData = function(data){  
    if (typeof data === 'undefined'){
        throw new Error ("Data object is undefined");
    }
    
    data.forEach(function (r){
        //Check ID
        if (r.id == null){
            throw new Error ("ID is not defined in data object");
        }
        if (r.label == null){
            r.label = r.id;
        }
        if (r.counts == null){
            throw new Error ("No statistics for "+r.id+" in data object");
        }
        r.counts.forEach(function (i){
            if (i.value == null){
                r.value = 0;
            }
        });
    });
    return data;
};
  
//remove zero length bars
monarch.dovegraph.prototype.removeZeroCounts = function(data){
      trimmedGraph = [];
      data.forEach(function (r){
          var count = 0;
          r.counts.forEach(function (i){
               count += i.value;
           });
          if (count > 0){
              trimmedGraph.push(r);
          }
      });
      return trimmedGraph;
};

monarch.dovegraph.prototype.addEllipsisToLabel = function(data,max){
    var reg = new RegExp("(.{"+max+"})(.+)");
    var ellipsis = new RegExp('\\.\\.\\.$');
    data.forEach(function (r){
        if ((r.label.length > max) && (!ellipsis.test(r.label))){
            r.fullLabel = r.label;
            r.label = r.label.replace(reg,"$1...");      
        } else {
            r.fullLabel = r.label;
        }
    });
    return data;
};

monarch.dovegraph.prototype.getFullLabel = function (d,data){
    for (var i=0, len=data.length; i < len; i++){
        if (data[i].label === d){
            var fullLabel = data[i].fullLabel;
            return fullLabel;
            break;
        }
    }
};

monarch.dovegraph.prototype.getGroupID = function (d,data){
    for (var i=0, len=data.length; i < len; i++){
        if (data[i].label === d){
            monarchID = data[i].id;
            return monarchID;
            break;
        }
    }
};

monarch.dovegraph.prototype.getIDLabel = function (d,data){
    for (var i=0, len=data.length; i < len; i++){
        if (data[i].id === d){
            label = data[i].label;
            return label;
            break;
        }
    }
};
////////////////////////////////////////////////////////////////////
//End data object functions
////////////////////////////////////////////////////////////////////

//Log given base x
function getBaseLog(x, y) {
    return Math.log(y) / Math.log(x);
};

//Adjust Y label font, arrow size, and spacing
//when transitioning
//this is getting funky with graph resizing, maybe should do away
monarch.dovegraph.prototype.adjustYAxisElements = function(len){
   
   var conf = this.config;
   var h = conf.height;
   var density = h/len;
   var isUpdated = false;
   
   yFont = conf.yFontSize;
   var yOffset = conf.yOffset;
   var arrowDim = conf.arrowDim;
   
   //Check for density BETA
   if (density < 15 && density < yFont ){
       yFont = density+2;
       //yOffset = "-2em";
       //arrowDim = "-20,-3, -11,1 -20,5";
       isUpdated = true;
   }
    
   if (isUpdated && yFont > conf.yFontSize){
       yFont = conf.yFontSize;
   }
   return yFont;
};
///////////////////////////////////
//Setters for sizing configurations

monarch.dovegraph.prototype.setWidth = function(w){
    this.config.width = w;
    return this.config.width;
};

monarch.dovegraph.prototype.setHeight = function(h){
    this.config.height = h;
    return this.config.height;
};

monarch.dovegraph.prototype.setYFontSize = function(fSize){
    this.config.yFontSize = fSize;
    return this.config.yFontSize;
};

monarch.dovegraph.prototype.setxFontSize = function(fSize){
    this.config.xFontSize = fSize;
    return this.config.xFontSize;
};

monarch.dovegraph.prototype.setXLabelFontSize = function(fSize){
    this.config.xLabelFontSize = fSize;
    return this.config.xLabelFontSize;
};

monarch.dovegraph.prototype.setXAxisPos = function(w,h){
    this.config.xAxisPos = {dx:w,y:h};
    return this.config.xAxisPos;
};

//dovegraph default SVG Coordinates
monarch.dovegraph.prototype.setPolygonCoordinates = function(){
    
    //Nav arrow (now triangle) 
    if (this.config.arrowDim == null || typeof this.config.arrowDim == 'undefined'){
        this.config.arrowDim = "-23,-6, -12,0 -23,6";
    }
    
    //Breadcrumb dimensions
    if (this.config.firstCr == null || typeof this.config.firstCr == 'undefined'){
        this.config.firstCr = "0,0 0,30 90,30 105,15 90,0";
    }
    if (this.config.trailCrumbs == null || typeof this.config.trailCrumbs == 'undefined'){
        this.config.trailCrumbs = "0,0 15,15 0,30 90,30 105,15 90,0";
    }
    
    //Polygon dimensions
    if (this.config.bread == null || typeof this.config.bread == 'undefined'){
        this.config.bread = {width:105, height: 30, offset:90, space: 1};
    }
    
    //breadcrumb div dimensions
    this.config.bcWidth = 560;
    
    //Y axis positioning when arrow present
    if (this.config.yOffset == null || typeof this.config.yOffset == 'undefined'){
        this.config.yOffset = "-1.48em";
    }
    
    //Check that breadcrumb width is valid
    if (this.config.bcWidth > this.config.width+this.config.margin.right+this.config.margin.left){
        this.config.bcWidth = this.config.bread.width+(this.config.bread.offset*5)+5;
    }
};

//dovegraph default configurations
monarch.dovegraph.prototype.getDefaultConfig = function(){
    
    var defaultConfiguration = {
            
            //Chart margins    
            margin : {top: 40, right: 140, bottom: 5, left: 255},
            
            width : 375,
            height : 400,
            
            //X Axis Label
            xAxisLabel : "Some Metric",
            xLabelFontSize : "14px",
            xFontSize : "14px",
            xAxisPos : {dx:"20em",y:"-29"},
            
            //Chart title and first breadcrumb
            chartTitle : "Chart Title",
            firstCrumb : "first bread crumb",
            
            //Title size/font settings
            title : {
                      'text-align': 'center',
                      'text-indent' : '0px',
                      'font-size' : '20px',
                      'font-weight': 'bold',
                      'background-color' : '#E8E8E8',
                      'border-bottom-color' : '#000000'
            },
            
            //Yaxis links
            yFontSize : 'default',
            isYLabelURL : true,
            yLabelBaseURL : "/phenotype/",
            
            //Font sizes
            settingsFontSize : '14px',
            
            //Maximum label length before adding an ellipse
            maxLabelSize : 31,
            
            //Turn on/off legend
            useLegend : true,
            
            //Fontsize
            legendFontSize : 14,
            //Legend dimensions
            legend : {width:18,height:18},
            legendText : {height:".35em"},
            
            //Colors set in the order they appear in the JSON object
            color : { 
                     first  : '#44A293',
                     second : '#A4D6D4',
                     third  : '#EA763B',
                     fourth : '#496265',
                     fifth  : '#44A293',
                     sixth  : '#A4D6D4',
                       
                     yLabel : { 
                       fill  : '#000000',
                       hover : '#EA763B'
                     },
                     arrow : {
                       fill  : "#496265",
                       hover : "#EA763B"
                     },
                     bar : {
                       fill  : '#EA763B'
                     },
                     crumb : {
                       top   : '#496265',
                       bottom: '#3D6FB7',
                       hover : '#EA763B'
                     },
                     crumbText : '#FFFFFF'
            },
            
            //Turn on/off breadcrumbs
            useCrumb : false,
            crumbFontSize : 10,
            
            //Turn on/off breadcrumb shapes
            useCrumbShape : true
    };
    return defaultConfiguration;
};