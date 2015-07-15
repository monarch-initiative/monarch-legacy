/* 
 * Package: dovechart.js
 * 
 * Namespace: monarch.dovechart
 * 
 */

// Module and namespace checking.
if (typeof monarch == 'undefined') { var monarch = {};}

monarch.dovechart = function(config, tree, html_div){
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
    self.parents.push(tree.getRootID());
    self.html_div = html_div;
    self.tree = tree;

    self.tooltip = d3.select(html_div)
        .append("div")
        .attr("class", "tip");
    
    self.init = function(html_div, tree){
        var data = tree.getFirstSiblings();
        self.groups = self.getGroups(data);
        self.makeGraphDOM(html_div, data); 
        var histogram = new monarch.chart.barchart(config, html_div);
        var isFirstGraph = true;
        self.drawGraph(histogram, false, undefined, isFirstGraph);
    };
    
    self.init(html_div, tree);
};

//Uses JQuery to create the DOM for the dovechart
monarch.dovechart.prototype.makeGraphDOM = function(html_div, data){
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
      config.useCrumb = self.checkForChildren(data);
      
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

monarch.dovechart.prototype.makeLogScaleCheckBox = function (html_div){
    var config = this.config;
    jQuery(html_div+" .interaction li .settings").append(" <form class=scale"+
        " style=font-size:" + config.settingsFontSize + "; >" +
        "<label><input type=\"checkbox\" name=\"scale\"" +
        " value=\"log\"> Log Scale</label> " +
        "</form> ");
}

monarch.dovechart.prototype.makeGroupedStackedForm = function(html_div){
    var config = this.config;
    jQuery(html_div+" .interaction li .settings").append(" <form class=configure"+
        " style=font-size:" + config.settingsFontSize + "; >" +
        "<label><input id=\"stack\" type=\"radio\" name=\"mode\"" +
        " value=\"stacked\" checked> Stacked</label> " +
        "<label><input id=\"group\" type=\"radio\" name=\"mode\"" +
        " value=\"grouped\"> Grouped</label>" +
        "</form>");
}

monarch.dovechart.prototype.makeLegend = function(histogram){
    var config = this.config;
    var groups = self.groups;
    
    //Set legend
    var legend = histogram.svg.selectAll(".legend")
       .data(groups.slice())
       .enter().append("g")
       .attr("class", "legend")
       .attr("transform", function(d, i) { return "translate(0," + i * (config.legend.height+7) + ")"; });

    legend.append("rect")
       .attr("x", config.width+config.legend.width+37)//HARDCODE
       .attr("y", 6)
       .attr("width", config.legend.width)
       .attr("height", config.legend.height)
       .style("fill", histogram.color);

    legend.append("text")
       .attr("x", config.width+config.legend.width+32)
       .attr("y", 14)
       .attr("dy", config.legendText.height)
       .attr("font-size",config.legendFontSize)
       .style("text-anchor", "end")
       .text(function(d) { return d; });
};

monarch.dovechart.prototype.makeNavArrow = function(data, navigate, triangleDim, barGroup, bar, histogram){
    var self = this;
    var config = self.config;
    
    var arrow = navigate.selectAll(".tick")
        .data(data)
        .append("svg:polygon")
        .attr("class", "wedge")
        .attr("points",triangleDim)
        .attr("fill", config.color.arrow.fill)
        .attr("display", function(d){
            if (d.children && d.children[0]){ //TODO use tree API
                return "initial";
            } else {
                return "none";
            }
        })
        .on("mouseover", function(d){        
           if (d.children && d.children[0]){ //TODO use tree api
               self.displaySubClassTip(self.tooltip,this)
           } 
        })
        .on("mouseout", function(){
            d3.select(this)
              .style("fill",config.color.arrow.fill);
            self.tooltip.style("display", "none");
        })
        .on("click", function(d){
            if (d.children && d.children[0]){ //TODO use tree api
                self.transitionToNewGraph(histogram,d,
                        barGroup,bar, d.id);
            }
        });
};

monarch.dovechart.prototype.transitionToNewGraph = function(histogram,data,barGroup,bar, parent){
    self = this;
    config = self.config;
    self.tooltip.style("display", "none");
    histogram.svg.selectAll(".tick").remove();
    
    if (typeof parent != 'undefined'){
        self.level++;
        self.drawGraph(histogram, false, parent);
        self.removeSVGWithSelection(barGroup,650,60,1e-6);
        self.removeSVGWithSelection(bar,650,60,1e-6);
    } else {
        self.drawGraph(histogram);
        self.removeSVGWithSelection(barGroup,650,60,1e-6);
        self.removeSVGWithSelection(bar,650,60,1e-6);
        return;
    }
    //remove old bars
    self.removeSVGWithSelection(barGroup,650,60,1e-6);
    self.removeSVGWithSelection(bar,650,60,1e-6);
    
    if (config.useCrumb){
        self.makeBreadcrumb(histogram,data.label,self.groups,
                bar,barGroup,data.fullLabel);
    }
};

monarch.dovechart.prototype.removeSVGWithSelection = function(select,duration,y,opacity){
    select.transition()
        .duration(duration)
        .attr("y", y)
        .style("fill-opacity", opacity)
        .remove();
};

monarch.dovechart.prototype.removeSVGWithClass = function(histogram,htmlClass,duration,y,opacity){
    histogram.svg.selectAll(htmlClass).transition()
        .duration(duration)
        .attr("y", y)
        .style("fill-opacity", opacity)
        .remove();
};

monarch.dovechart.prototype.displaySubClassTip = function(tooltip,d3Selection){
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

monarch.dovechart.prototype.getCountMessage = function(value,name){
    return "Counts: "+"<span style='font-weight:bold'>"+value+"</span>"+"<br/>"
            +"Organism: "+ "<span style='font-weight:bold'>"+name;
};

monarch.dovechart.prototype.displayCountTip = function(tooltip,value,name,d3Selection,barLayout){
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

monarch.dovechart.prototype.setGroupPositioning = function (histogram,graphData) {
    var self = this;
    var data = self.setDataPerSettings(graphData);
    var groupPos = histogram.svg.selectAll()
       .data(data)
       .enter().append("svg:g")
       .attr("class", ("bar"+self.level))
       .attr("transform", function(d) { return "translate(0," + histogram.y0(d.id) + ")"; })
       .on("click", function(d){
           if (config.isYLabelURL){
               document.location.href = config.yLabelBaseURL + d.id;
           }
       });
    return groupPos;
};

monarch.dovechart.prototype.setXYDomains = function (histogram,data,groups) {
    var self = this;
    //Set y0 domain
    data = self.setDataPerSettings(data);
    histogram.y0.domain(data.map(function(d) { return d.id; }));
    
    if (jQuery('input[name=mode]:checked').val()=== 'grouped' || groups.length === 1){
        var xGroupMax = self.getGroupMax(data);
        histogram.x.domain([histogram.x0, xGroupMax]);
        histogram.y1.domain(groups)
        .rangeRoundBands([0, histogram.y0.rangeBand()]);
    } else if (jQuery('input[name=mode]:checked').val()=== 'stacked'){
        var xStackMax = self.getStackMax(data);
        histogram.x.domain([histogram.x0, xStackMax]);
        histogram.y1.domain(groups).rangeRoundBands([0,0]);
    } else {
        histogram.y1.domain(groups)
        .rangeRoundBands([0, histogram.y0.rangeBand()]);
    }
};

monarch.dovechart.prototype.makeBar = function (barGroup,histogram,barLayout,isFirstGraph) {
    var bar;
    var self = this;
    var config = self.config;
    
    //Create bars 
    if (barLayout == 'grouped'){
        bar = barGroup.selectAll("g")
          .data(function(d) { return d.counts; })
          .enter().append("rect")
          .attr("class",("rect"+self.level))
          .attr("height", histogram.y1.rangeBand())
          .attr("y", function(d) { return histogram.y1(d.name); })
          .attr("x", 1)
          .attr("width", 0)
          .on("mouseover", function(d){
            d3.select(this)
              .style("fill", config.color.bar.fill);
              self.displayCountTip(self.tooltip, d.value, d.name, this, 'grouped');
          })
          .on("mouseout", function(){
            d3.select(this)
              .style("fill", function(d) { return histogram.color(d.name); });
            self.tooltip.style("display", "none");
          })
          .style("fill", function(d) { return histogram.color(d.name); });
        
        if (isFirstGraph){
            self.transitionFromZero(bar,histogram,barLayout);
        } else {
            bar.attr("width", function(d) { 
                if (( jQuery('input[name=scale]:checked').val() === 'log' )
                        && ( d.value == 0 )){
                  return 1;
              } else {
                  return histogram.x(d.value); 
              }});
        }
        
    } else if (barLayout == 'stacked') {
        bar = barGroup.selectAll("g")
          .data(function(d) { return d.counts; })
          .enter().append("rect")
          .attr("class",("rect"+self.level))
          .attr("x", 1)
          .attr("width", 0)
          .attr("height", histogram.y0.rangeBand())
          .attr("y", function(d) { return histogram.y1(d.name); })
          .on("mouseover", function(d){
            d3.select(this)
              .style("fill", config.color.bar.fill);
            self.displayCountTip(self.tooltip,d.value,d.name,this,'stacked');

          })
          .on("mouseout", function(){
            d3.select(this)
              .style("fill", function(d) { return histogram.color(d.name); });
            self.tooltip.style("display", "none");
          })
          .style("fill", function(d) { return histogram.color(d.name); });
        
        if (isFirstGraph){
            self.transitionFromZero(bar,histogram,barLayout);
        } else {
            bar.attr("x", function(d){
                if (d.x0 == 0){
                    return 1;
                } else { 
                  return histogram.x(d.x0);
                } 
            })
                .attr("width", function(d) { 
                    if (d.x0 == 0 && d.x1 != 0){
                        return histogram.x(d.x1); 
                    } else if (( jQuery('input[name=scale]:checked').val() === 'log' ) &&
                            ( histogram.x(d.x1) - histogram.x(d.x0) == 0 )){
                        return 1;  
                    } else {
                        return histogram.x(d.x1) - histogram.x(d.x0); 
                    }
                });
        }
    }
    return bar;
};

//Transition bars from a width of 0 to their respective positions
monarch.dovechart.prototype.transitionFromZero = function (bar,histogram,barLayout) {
    var self = this;
    if (barLayout == 'grouped'){
        bar.transition()
        .duration(800)
        .delay(function(d, i, j) { return j * 20; })
        .attr("x", 1)
        .attr("width", function(d) { 
        if (( jQuery('input[name=scale]:checked').val() === 'log' )
                && ( d.value == 0 )){
          return 1;
      } else {
          return histogram.x(d.value); 
      }
        });     
    } else if (barLayout == 'stacked') {
        bar.transition()
        .duration(800)
        .delay(function(d, i, j) { return j * 20; })
        .attr("x", function(d){
            if (d.x0 == 0){
                return 1;
            } else { 
                return histogram.x(d.x0);
            } 
        })
        .attr("width", function(d) { 
            if (d.x0 == 0 && d.x1 != 0){
                return histogram.x(d.x1); 
            } else if (( jQuery('input[name=scale]:checked').val() === 'log' ) &&
                 ( histogram.x(d.x1) - histogram.x(d.x0) == 0 )){
                return 1;  
            } else {
                return histogram.x(d.x1) - histogram.x(d.x0); 
            }
        });
    }
};

monarch.dovechart.prototype.transitionGrouped = function (histogram,data,groups,bar) {
    var self = this;
    var config = self.config;
    self.setXYDomains(histogram,data,groups);
    histogram.transitionXAxisToNewScale(750);
          
    bar.transition()
      .duration(500)
      .delay(function(d, i, j) { return j * 30; })
      .attr("height", histogram.y1.rangeBand())
      .attr("y", function(d) { return histogram.y1(d.name); })  
      .transition()
      .attr("x", 1)
      .attr("width", function(d) { 
          if (( jQuery('input[name=scale]:checked').val() === 'log' ) &&
              ( d.value == 0 )){
              return 1;
          } else {
              return histogram.x(d.value); 
          }
      });
          
    bar.on("mouseover", function(d){
            
        d3.select(this)
        .style("fill", config.color.bar.fill);
        self.displayCountTip(self.tooltip,d.value,d.name,this,'grouped');
    })
    .on("mouseout", function(){
        self.tooltip.style("display", "none")
        d3.select(this)
        .style("fill", function(d) { return histogram.color(d.name); });
    })
};

monarch.dovechart.prototype.transitionStacked = function (histogram,data,groups,bar) {
    var self = this;
    var config = self.config;
    self.setXYDomains(histogram, data, groups, 'stacked');
    histogram.transitionXAxisToNewScale(750);
         
    bar.transition()
      .duration(500)
      .delay(function(d, i, j) { return j * 30; })
      .attr("x", function(d){
              if (d.x0 == 0){
                  return 1;
              } else { 
                return histogram.x(d.x0);
              } 
      })
      .attr("width", function(d) { 
          if (d.x0 == 0 && d.x1 != 0){
              return histogram.x(d.x1); 
          } else if (( jQuery('input[name=scale]:checked').val() === 'log' ) &&
                     ( histogram.x(d.x1) - histogram.x(d.x0) == 0 )){
              return 1;  
          } else {
              return histogram.x(d.x1) - histogram.x(d.x0); 
          }
      })
      .transition()
      .attr("height", histogram.y0.rangeBand())
      .attr("y", function(d) { return histogram.y1(d.name); })
      
    bar.on("mouseover", function(d){
            
        d3.select(this)
            .style("fill", config.color.bar.fill);
                self.displayCountTip(self.tooltip,d.value,d.name,this,'stacked');
    })
    .on("mouseout", function(){
        self.tooltip.style("display", "none");
        d3.select(this)
        .style("fill", function(d) { return histogram.color(d.name); });
    })
};

monarch.dovechart.prototype.drawGraph = function (histogram, isFromCrumb, parent, isFirstGraph) {
    var self = this;
    var config = self.config;
    
    if (typeof parent != 'undefined'){
        self.parents.push(parent);
    }
    
    var data = self.tree.getDescendants(self.parents);
    
    self.groups = self.getGroups(data);

    self.checkData(data);
    data = self.getStackedStats(data);
    data = self.sortDataByGroupCount(data, self.groups);

    if (!isFromCrumb){
        data = self.addEllipsisToLabel(data,config.maxLabelSize);
    }

    if (self.groups.length == 1 && isFirstGraph){
        config.barOffset.grouped.height = config.barOffset.grouped.height+8;
        config.barOffset.stacked.height = config.barOffset.stacked.height+8;
    }

    var height = self.resizeChart(data);
    //reset d3 config after changing height
    histogram.y0 = d3.scale.ordinal()
      .rangeRoundBands([0,height], .1);
            
    histogram.yAxis = d3.svg.axis()
      .scale(histogram.y0)
      .orient("left");
    
    self.setXYDomains(histogram, data, self.groups);
    if (isFirstGraph){
        histogram.setXTicks(config).setYTicks();
    }

    //Dynamically decrease font size for large labels
    var yFont = self.adjustYAxisElements(data.length);
    histogram.transitionYAxisToNewScale(1000);
    
    //Create SVG:G element that holds groups
    var barGroup = self.setGroupPositioning(histogram,data);
    var bar = self.setBarConfigPerCheckBox(histogram,data,self.groups,barGroup,isFirstGraph);
    
    self.setYAxisText(histogram,data, barGroup, bar);
    
    //Create navigation arrow
    var navigate = histogram.svg.selectAll(".y.axis");
    /*self.makeNavArrow(data,navigate,config.arrowDim,
                           barGroup,bar,histogram);
    if (!self.checkForChildren(data)){
        histogram.setYAxisTextSpacing(0);
        histogram.svg.selectAll("polygon.wedge").remove();
    }*/
    // We're just going to remove the wedges for now
    histogram.setYAxisTextSpacing(0);
    //histogram.svg.selectAll("polygon.wedge").remove();
    
    //Create legend
    if (config.useLegend){
        self.makeLegend(histogram);
    }

    //Make first breadcrumb
    if (config.useCrumb && isFirstGraph){
        self.makeBreadcrumb(histogram,self.tree.getRootLabel(),
                                 self.groups,bar,barGroup);
    }
    
    // Some functions to controll the configurations box
    d3.select(self.html_div).select('.configure')
      .on("change",function(){
          self.changeBarConfig(histogram,data,self.groups,bar);});
    
    d3.select(self.html_div).select('.scale')
    .on("change",function(){
        self.changeScalePerSettings(histogram);
        if (self.groups.length > 1){
            //reuse change bar config
            self.changeBarConfig(histogram,data,self.groups,bar);
        } else {
            self.transitionGrouped(histogram,data,self.groups,bar);
        }
    });
    
    d3.select(self.html_div).select('.zero')
    .on("change",function(){
        self.transitionToNewGraph(histogram,data,barGroup,bar);
    });
};

//
monarch.dovechart.prototype.setDataPerSettings = function(data){
    var self = this;
    if (self.getValueOfCheckbox('zero','remove')){
        data = self.removeZeroCounts(data);
    }
    return data;
}
// Generic function to check the value of a checkbox given it's name
// and value
monarch.dovechart.prototype.getValueOfCheckbox = function(name,value){
    var self = this;
    if (jQuery('input[name='+name+']:checked').val() === value){
        return true;
    } else if (typeof jQuery('input[name=zero]:checked').val() === 'undefined'){
        return false;
    }
};

monarch.dovechart.prototype.changeScalePerSettings = function(histogram){
    var self = this;
    if (self.getValueOfCheckbox('scale','log')){
        histogram.setLogScale(self.config.width);
    } else {
        histogram.setLinearScale(self.config.width);
    }
};

monarch.dovechart.prototype.changeBarConfig = function(histogram,data,groups,bar){
    var self = this;
    if (self.getValueOfCheckbox('mode','grouped')){
        self.transitionGrouped(histogram,data,groups,bar);
    } else if (self.getValueOfCheckbox('mode','stacked')) {
        self.transitionStacked(histogram,data,groups,bar);
    }
};

//Resize height of chart after transition
monarch.dovechart.prototype.resizeChart = function(data){
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

monarch.dovechart.prototype.pickUpBreadcrumb = function(histogram,index,groups,bar,barGroup) {
    var self = this;
    var config = self.config;
    var isFromCrumb = true;
    var rectClass = ".rect"+self.level;
    var barClass = ".bar"+self.level;
    //set global level
    self.level = index;
    var parentLen = self.parents.length;

    // Remove all elements following (index+1).
    // parentLen is greater than the number of elements remaining, but that's OK with splice()
    self.parents.splice(index + 1,(parentLen));

    histogram.svg.selectAll(".tick").remove();
    self.drawGraph(histogram,isFromCrumb);

    for (var i=(index+1); i <= parentLen; i++){
        d3.select(self.html_div).select(".bread"+i).remove();
    }
    self.removeSVGWithClass(histogram,barClass,750,60,1e-6);
    self.removeSVGWithClass(histogram,rectClass,750,60,1e-6);     
    
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

monarch.dovechart.prototype.makeBreadcrumb = function(histogram,label,groups,bar,phenoDiv,fullLabel) {
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
                self.pickUpBreadcrumb(histogram,lastIndex,groups,bar,phenoDiv);
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
                self.pickUpBreadcrumb(histogram,lastIndex,groups,bar,phenoDiv);
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

monarch.dovechart.prototype.setBarConfigPerCheckBox = function(histogram,data,groups,barGroup,isFirstGraph) {
    self = this;
    data = self.setDataPerSettings(data);
    if (jQuery('input[name=mode]:checked').val()=== 'grouped' || groups.length === 1) {
        self.setXYDomains(histogram,data,groups,'grouped');
        histogram.transitionXAxisToNewScale(1000);
        return self.makeBar(barGroup,histogram,'grouped',isFirstGraph);
    } else {     
        self.setXYDomains(histogram,data,groups,'stacked');
        histogram.transitionXAxisToNewScale(1000);
        return self.makeBar(barGroup,histogram,'stacked',isFirstGraph);
    }
};

monarch.dovechart.prototype.setYAxisText = function(histogram,data, barGroup, bar){
    self = this;
    config = self.config;
    data = self.setDataPerSettings(data);
    
    histogram.svg.select(".y.axis")
    .selectAll("text")
    .data(data)
    .text(function(d){ return self.getIDLabel(d.id,data) })
    .attr("font-size", yFont)
    .on("mouseover", function(){
        if (config.isYLabelURL){
            d3.select(this).style("cursor", "pointer");
            d3.select(this).style("fill", config.color.yLabel.hover);
            d3.select(this).style("text-decoration", "underline");
            self.displaySubClassTip(self.tooltip,this)
        }
    })
    .on("mouseout", function(){
        d3.select(this).style("fill", config.color.yLabel.fill );
        d3.select(this).style("text-decoration", "none");
        self.tooltip.style("display", "none");
    })
    .on("click", function(d){
        /*if (config.isYLabelURL){
            d3.select(this).style("cursor", "pointer");
            document.location.href = config.yLabelBaseURL + d;
        }*/
        if (d.children && d.children[0]){ //TODO use tree api
            self.transitionToNewGraph(histogram,d,
                    barGroup,bar, d.id);
        }
    })
    .style("text-anchor", "end")
    .attr("dx", config.yOffset)
    .append("svg:title")
    .text(function(d){
        if (/\.\.\./.test(self.getIDLabel(d.id,data))){
            var fullLabel = self.getFullLabel(self.getIDLabel(d.id,data),data);
              return (fullLabel);  
        } else if (yFont < 12) {//HARDCODE alert
              return (self.getIDLabel(d.id,data));
        }
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
monarch.dovechart.prototype.getGroupMax = function(data){
      return d3.max(data, function(d) { 
          return d3.max(d.counts, function(d) { return d.value; });
      });
};

//get X Axis limit for stacked configuration
monarch.dovechart.prototype.getStackMax = function(data){
      return d3.max(data, function(d) { 
          return d3.max(d.counts, function(d) { return d.x1; });
      }); 
};

//get largest Y axis label for font resizing
monarch.dovechart.prototype.getYMax = function(data){
      return d3.max(data, function(d) { 
          return d.label.length;
      });
};
  
monarch.dovechart.prototype.checkForChildren = function(data){
     for (i = 0;i < data.length; i++) {
          if ((Object.keys(data[i]).indexOf('children') >= 0 ) &&
             ( typeof data[i]['children'][0] != 'undefined' )){
              return true;
          } 
     }
     return false;
};
  
monarch.dovechart.prototype.getStackedStats = function(data){
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

monarch.dovechart.prototype.sortDataByGroupCount = function(data,groups){
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

monarch.dovechart.prototype.getGroups = function(data) {
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
monarch.dovechart.prototype.checkData = function(data){  
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
        // Make sure counts are always in same order
        var orderedCounts = [];
        //Check that we're not missing any group member
        self.groups.forEach(function (val, index){
            if (r.counts.map(function(i){return i.name;}).indexOf(val) == -1){
                var count = {'name': val, 'value': 0};
                orderedCounts.push(count);
            } else {
                var i = r.counts.map(function(i){return i.name;}).indexOf(val);
                orderedCounts[i] = (r['counts'][index]);
            }   
        });
        r.counts = orderedCounts;
        
    });
    return data;
};
  
//remove zero length bars
monarch.dovechart.prototype.removeZeroCounts = function(data){
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

monarch.dovechart.prototype.addEllipsisToLabel = function(data,max){
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

monarch.dovechart.prototype.getFullLabel = function (d,data){
    for (var i=0, len=data.length; i < len; i++){
        if (data[i].label === d){
            var fullLabel = data[i].fullLabel;
            return fullLabel;
            break;
        }
    }
};

monarch.dovechart.prototype.getGroupID = function (d,data){
    for (var i=0, len=data.length; i < len; i++){
        if (data[i].label === d){
            monarchID = data[i].id;
            return monarchID;
            break;
        }
    }
};

monarch.dovechart.prototype.getIDLabel = function (d,data){
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
monarch.dovechart.prototype.adjustYAxisElements = function(len){
   
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

monarch.dovechart.prototype.setWidth = function(w){
    this.config.width = w;
    return this.config.width;
};

monarch.dovechart.prototype.setHeight = function(h){
    this.config.height = h;
    return this.config.height;
};

monarch.dovechart.prototype.setYFontSize = function(fSize){
    this.config.yFontSize = fSize;
    return this.config.yFontSize;
};

monarch.dovechart.prototype.setxFontSize = function(fSize){
    this.config.xFontSize = fSize;
    return this.config.xFontSize;
};

monarch.dovechart.prototype.setXLabelFontSize = function(fSize){
    this.config.xLabelFontSize = fSize;
    return this.config.xLabelFontSize;
};

monarch.dovechart.prototype.setXAxisPos = function(w,h){
    this.config.xAxisPos = {dx:w,y:h};
    return this.config.xAxisPos;
};

/*
 * setSizeConfiguration and setSizingRatios() are from an incompleted attempt
 * to create dynamically resized charts.  If implementing something like this
 * could be added to the init function:
 * 
 *   if (config.isDynamicallyResized){
     
         if (jQuery(window).width() < (config.benchmarkWidth) || jQuery(window).height() < (config.benchmarkHeight)){
             self.setSizeConfiguration(config.graphSizingRatios);
             //init
         } else {
             //init
         }
     
         window.addEventListener('resize', function(event){
  
             if (jQuery(window).width() < (config.benchmarkWidth) || jQuery(window).height() < (config.benchmarkHeight)){
                 jQuery(html_div).children().remove();
                 self.setSizeConfiguration(config.graphSizingRatios);
                //init
             }
         });
     }
 */


monarch.dovechart.prototype.setSizeConfiguration = function(graphRatio){
    var self = this;
    var w = jQuery(window).width();
    var h = jQuery(window).height();
    var total = w+h;
    
    self.setWidth( ((w*graphRatio.width) / getBaseLog(12,w)) * 3);
    self.setHeight( ((h*graphRatio.height) / getBaseLog(12,h)) *3.5);
    self.setYFontSize( ((total*(graphRatio.yFontSize))/ getBaseLog(20,total)) * 3);
};

monarch.dovechart.prototype.setSizingRatios = function(){
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

//dovechart default SVG Coordinates
monarch.dovechart.prototype.setPolygonCoordinates = function(){
    
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

//dovechart default configurations
monarch.dovechart.prototype.getDefaultConfig = function(){
    
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