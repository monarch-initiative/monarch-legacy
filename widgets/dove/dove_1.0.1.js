/* 
 * Package: dovechart.js
 * 
 * Namespace: monarch.dovechart
 * 
 */

// Module and namespace checking.
if (typeof monarch == 'undefined') { var monarch = {};}

monarch.dovechart = function(config, tree, html_div, tree_builder){
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
    self.config.arrowOffset = {height: 21, width: -100};
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

    self.level = 0; //Do away with this and just use self.parents.length
    self.config.initialHeight = config.height;
    self.parents = [];
    self.parents.push(tree.getRootID());
    self.html_div = html_div;
    self.tree = tree;
    self.tree_builder = tree_builder;

    self.tooltip = d3.select(self.html_div)
        .append("div")
        .attr("class", "tip");
        
    self.init = function(html_div, tree){
        var data = tree.getFirstSiblings();
        data = self.sortDataByGroupCount(data);
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
      var groups = self.groups;
      
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
              " value=\"remove\" checked> Remove Empty Groups</label> " +
              "</form> ");
      
      // Ajax spinner
      // TODO replace with a font awesome spinner
      jQuery(html_div+" .interaction li .settings").append("<div class=\"ajax-spinner\">"+
                          "<div class=\"ortholog-spinner\" > " +
                            "<div class=\"spinner-container container1\">" +
                              "<div class=\"circle1\"></div>" +
                              "<div class=\"circle2\"></div>" +
                              "<div class=\"circle3\"></div>" +
                              "<div class=\"circle4\"></div>" +
                            "</div>" +
                            "<div class=\"spinner-container container2\"> " +
                              "<div class=\"circle1\"></div>" +
                              "<div class=\"circle2\"></div>" +
                              "<div class=\"circle3\"></div>" +
                              "<div class=\"circle4\"></div>" +
                            "</div>" +
                            "<div class=\"spinner-container container3\">" +
                              "<div class=\"circle1\"></div>" +
                              "<div class=\"circle2\"></div>" +
                              "<div class=\"circle3\"></div>" +
                              "<div class=\"circle4\"></div>" +
                            "</div>" +
                          "</div>" +
                          "<div class='fetching'>Fetching Data...</div></div>" +
                          "<div class='error-msg'>Error Fetching Data</div>" +
                          "<div class='leaf-msg'></div>");
      //jQuery(".ajax-spinner").show();
      //Update tooltip positioning
      if (!config.useCrumb && groups.length>1){
          config.arrowOffset.height = 14;
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

monarch.dovechart.prototype.makeLegend = function(histogram, barGroup){
    var self = this;
    var config = self.config;
    var data = self.tree.getDescendants(self.parents);
    
    //Set legend
    var legend = histogram.svg.selectAll(".barchart")
       .data(self.groups.slice())
       .enter().append("g")
       .attr("class", function(d) {return "legend-"+d; })
       .style("opacity", function(d) {
           if (self.config.category_filter_list.indexOf(d) > -1) {
               return '.5';
           } else {
               return '1';
           }
       })
       .on("mouseover", function(){
           d3.select(this)
             .style("cursor", "pointer")
           d3.select(this).selectAll("rect")
             .style("stroke", histogram.color)
             .style("stroke-width", '2');
           d3.select(this).selectAll("text")
           .style('font-weight', 'bold');
        })
        .on("mouseout", function(){
           d3.select(this).selectAll("rect")
             .style("fill", histogram.color)
             .style("stroke", 'none');
           d3.select(this).selectAll("text")
             .style('fill', 'black')
             .style('font-weight', 'normal');
        })
        .on("click", function(d){
            if (self.config.category_filter_list.indexOf(d) > -1) {
                //Bring data back
                var index = self.config.category_filter_list.indexOf(d);
                self.config.category_filter_list.splice(index,1);
                
                self.transitionToNewGraph(histogram, data, barGroup);

                d3.select(this).style("opacity", '1');
                
            } else {
                self.config.category_filter_list.push(d);
                self.transitionToNewGraph(histogram, data, barGroup);
                d3.select(this).style("opacity", '.5');
            }
        })
       .attr("transform", function(d, i) { return "translate(0," + i * (config.legend.height+7) + ")"; });

    legend.append("rect")
       .attr("x", config.width+config.legend.width+45)//HARDCODE
       .attr("y", 6)
       .attr("width", config.legend.width)
       .attr("height", config.legend.height)
       .style("fill", histogram.color);

    legend.append("text")
       .attr("x", config.width+config.legend.width+40)
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

monarch.dovechart.prototype.transitionToNewGraph = function(histogram, data, barGroup, bar, parent){
    self = this;
    config = self.config;
    self.tooltip.style("display", "none");
    histogram.svg.selectAll(".tick").remove();
    
    if (typeof bar === 'undefined') {
        var barClass = '.bar' + (self.parents.length-1);
        bar = d3.select(self.html_div).selectAll(barClass).selectAll('rect');
    }
    
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

monarch.dovechart.prototype.removeSVGWithSelection = function(select, duration, y, opacity){
    select.transition()
        .duration(duration)
        .attr("y", y)
        .style("fill-opacity", opacity)
        .remove();
};

monarch.dovechart.prototype.removeSVGWithClass = function(histogram, htmlClass, duration, y, opacity){
    d3.select(self.html_div+'.barchart').selectAll(htmlClass).transition()
        .duration(duration)
        .attr("y", y)
        .style("fill-opacity", opacity)
        .remove();
};

monarch.dovechart.prototype.removeRectInGroup = function(histogram, barGroup, duration, y, opacity){
    d3.select(self.html_div+'.barchart').selectAll(barGroup).selectAll("rect").transition()
        .duration(duration)
        .attr("y", y)
        .style("fill-opacity", opacity)
        .remove();
};

monarch.dovechart.prototype.displaySubClassTip = function(tooltip, d3Selection){
    var self = this;
    var config = self.config;
    d3.select(d3Selection)
      .style("fill", config.color.arrow.hover);

    var coords = d3.transform(d3.select(d3Selection.parentNode)
            .attr("transform")).translate;
    var h = coords[1];
    var w = coords[0];
    
    tooltip.style("display", "block")
      .html('Click&nbsp;to&nbsp;see&nbsp;subclasses')
      .style("top",h+config.margin.top+config.bread.height+
             config.arrowOffset.height+"px")
      .style("left",w+config.margin.left+config.arrowOffset.width+"px");
};

monarch.dovechart.prototype.getCountMessage = function(value, name){
    return "Counts: "+"<span style='font-weight:bold'>"+value+"</span>"+"<br/>"
            +"Organism: "+ "<span style='font-weight:bold'>"+name;
};

monarch.dovechart.prototype.displayCountTip = function(tooltip, value, name, d3Selection, barLayout){
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

monarch.dovechart.prototype.setGroupPositioning = function (histogram, data) {
    var self = this;

    var groupPos = histogram.svg.selectAll()
       .data(data)
       .enter().append("svg:g")
       .attr("class", ("bar"+self.level))
       .attr("transform", function(d) { return "translate(0," + histogram.y0(d.id) + ")"; })
       .on("click", function(d){
           if (self.config.isYLabelURL){
               document.location.href = self.config.yLabelBaseURL + d.id;
           }
       });
    return groupPos;
};

monarch.dovechart.prototype.setXYDomains = function (histogram, data, groups) {
    var self = this;
    //Set y0 domain
    // TODO remove groups arg in favor of generating this dynamically
    // for category faceting
    var groups = self.getGroups(data);

    histogram.y0.domain(data.map(function(d) { return d.id; }));
    
    if (jQuery(self.html_div + ' input[name=mode]:checked').val()=== 'grouped' || groups.length === 1){
        var xGroupMax = self.getGroupMax(data);
        histogram.x.domain([histogram.x0, xGroupMax]);
        histogram.y1.domain(groups)
        .rangeRoundBands([0, histogram.y0.rangeBand()]);
    } else if (jQuery(self.html_div + ' input[name=mode]:checked').val()=== 'stacked'){
        var xStackMax = self.getStackMax(data);
        histogram.x.domain([histogram.x0, xStackMax]);
        histogram.y1.domain(groups).rangeRoundBands([0,0]);
    } else {
        histogram.y1.domain(groups)
        .rangeRoundBands([0, histogram.y0.rangeBand()]);
    }
};

monarch.dovechart.prototype.makeBar = function (barGroup, histogram, barLayout, isFirstGraph) {
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
                if (( jQuery(self.html_div + ' input[name=scale]:checked').val() === 'log' )
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
                    } else if (( jQuery(self.html_div + ' input[name=scale]:checked').val() === 'log' ) &&
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
monarch.dovechart.prototype.transitionFromZero = function (bar, histogram, barLayout) {
    var self = this;
    if (barLayout == 'grouped'){
        bar.transition()
        .duration(800)
        .delay(function(d, i, j) { return j * 20; })
        .attr("x", 1)
        .attr("width", function(d) { 
        if (( jQuery(self.html_div + ' input[name=scale]:checked').val() === 'log' )
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
            } else if (( jQuery(self.html_div + ' input[name=scale]:checked').val() === 'log' ) &&
                 ( histogram.x(d.x1) - histogram.x(d.x0) == 0 )){
                return 1;  
            } else {
                return histogram.x(d.x1) - histogram.x(d.x0); 
            }
        });
    }
};

monarch.dovechart.prototype.transitionGrouped = function (histogram, data, groups, bar) {
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
          if (( jQuery(self.html_div + ' input[name=scale]:checked').val() === 'log' ) &&
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

monarch.dovechart.prototype.transitionStacked = function (histogram, data, groups, bar) {
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
          } else if (( jQuery(self.html_div + ' input[name=scale]:checked').val() === 'log' ) &&
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

monarch.dovechart.prototype.drawGraph = function (histogram, isFromCrumb, parent, isFirstGraph, isFromResize) {
    var self = this;
    var config = self.config;
    
    if (typeof parent != 'undefined'){
      //  self.parents.push(parent);
    }
    
    var data = self.tree.getDescendants(self.parents);

    self.checkData(data);
    data = self.setDataPerSettings(data);
    
    if (!isFromCrumb){
        data = self.addEllipsisToLabel(data,config.maxLabelSize);
    }
    
    // Some updates to dynamically increase the size of the graph
    // This is a bit hacky and needs refactoring
    // To fix we need to remove the svg selection in 
    // barchart.js (this should be decoupled and added in this class instead)
    if (data.length > 25 && self.config.height == self.config.initialHeight){
        self.config.height = data.length * 14.05;
        jQuery(self.html_div + ' .barchart').remove();
        histogram = new monarch.chart.barchart(self.config, self.html_div);
        self.drawGraph(histogram, isFromCrumb, undefined, false, true);
        return;
    } else if (data.length > 25 && self.config.height != self.config.initialHeight && !isFromResize){
        self.config.height = data.length * 14.05;
        jQuery(self.html_div + ' .barchart').remove();
        histogram = new monarch.chart.barchart(self.config, self.html_div);
        self.drawGraph(histogram, isFromCrumb, undefined, false, true);
        return;
    } else if (data.length <= 25 && self.config.height != self.config.initialHeight ) {
        self.config.height = self.config.initialHeight;
        jQuery(self.html_div + ' .barchart').remove();
        histogram = new monarch.chart.barchart(self.config, self.html_div);
        self.drawGraph(histogram, isFromCrumb, undefined, false, true);
        return;
    } else if (isFromCrumb && !isFromResize) {
        self.config.height = self.config.initialHeight;
        jQuery(self.html_div + ' .barchart').remove();
        histogram = new monarch.chart.barchart(self.config, self.html_div);
        self.drawGraph(histogram, isFromCrumb, undefined, false, true);
        return;
    }
    
    data = self.getStackedStats(data);
    // This needs to be above the removeCategories() call to avoid
    // Y axis labels reordering when adding/removing categories
    data = self.sortDataByGroupCount(data);
    
    if (self.config.category_filter_list.length > 0 ) {
        data = self.removeCategories(data, self.config.category_filter_list);
    }

    if (self.groups.length == 1 && isFirstGraph && !isFromResize){
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
    
    self.changeScalePerSettings(histogram);
    
    self.setXYDomains(histogram, data, self.groups);
    if (isFirstGraph || isFromResize){
        histogram.setXTicks(config).setYTicks();
    }

    //Dynamically decrease font size for large labels
    var yFontSize = self.adjustYAxisElements(data.length);
    
    histogram.transitionYAxisToNewScale(1000);
    
    //Create SVG:G element that holds groups
    var barGroup = self.setGroupPositioning(histogram,data);
    
    // showTransition controls if a new view results in bars expanding
    // from zero to their respective positions
    var showTransition = false;
    if (isFirstGraph || isFromCrumb) {
        showTransition = true;
    }
    //Make legend
    if (isFirstGraph || isFromResize || isFromCrumb){
        //Create legend
        if (config.useLegend){
            self.makeLegend(histogram, barGroup);
        }
    }

    var bar = self.setBarConfigPerCheckBox(histogram,data,self.groups,barGroup,showTransition);
    
    self.setYAxisText(histogram,data, barGroup, bar, yFontSize);
    
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
    
    //Make first breadcrumb
    if (config.useCrumb && isFirstGraph && !isFromResize){
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
    data = self.removeIdWithoutLabel(data);
    return data;
}
// Generic function to check the value of a checkbox given it's name
// and value
monarch.dovechart.prototype.getValueOfCheckbox = function(name,value){
    var self = this;
    if (jQuery(self.html_div + ' input[name='+name+']:checked').val() === value){
        return true;
    } else if (typeof jQuery(self.html_div + ' input[name=zero]:checked').val() === 'undefined'){
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

monarch.dovechart.prototype.changeBarConfig = function(histogram, data, groups, bar){
    var self = this;
    if (typeof bar === 'undefined') {
        var barClass = '.bar' + (self.parents.length-1);
        bar = d3.select(self.html_div).selectAll(barClass).selectAll('rect');
    }
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

    if (data.length < 25){
         height = data.length*26; 
         if (height > config.height){
             height = config.height;
         }
    }
    return height;
};

monarch.dovechart.prototype.pickUpBreadcrumb = function(histogram, index, groups, bar, barGroup) {
    var self = this;
    var config = self.config;
    var isFromCrumb = true;
    var barClass = ".bar"+self.level;
    //set global level
    self.level = index;
    var parentLen = self.parents.length;
    
    jQuery(self.html_div+" .leaf-msg").hide();

    // Remove all elements following (index+1).
    // parentLen is greater than the number of elements remaining, but that's OK with splice()
    self.parents.splice(index + 1,(parentLen));

    d3.select(self.html_div+'.barchart').selectAll(".tick").remove();
    self.drawGraph(histogram,isFromCrumb);

    for (var i=(index+1); i <= parentLen; i++){
        d3.select(self.html_div).select(".bread"+i).remove();
    }
    self.removeSVGWithClass(histogram,barClass,750,60,1e-6);
    self.removeRectInGroup(histogram,barClass,750,60,1e-6);
    
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

monarch.dovechart.prototype.makeBreadcrumb = function(histogram, label, groups, bar, phenoDiv, fullLabel) {
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

monarch.dovechart.prototype.setBarConfigPerCheckBox = function(histogram, data, groups, barGroup, isFirstGraph) {
    self = this;

    if (jQuery(self.html_div + ' input[name=mode]:checked').val()=== 'grouped' || groups.length === 1) {
        self.setXYDomains(histogram,data,groups,'grouped');
        histogram.transitionXAxisToNewScale(1000);
        return self.makeBar(barGroup,histogram,'grouped',isFirstGraph);
    } else {     
        self.setXYDomains(histogram,data,groups,'stacked');
        histogram.transitionXAxisToNewScale(1000);
        return self.makeBar(barGroup,histogram,'stacked',isFirstGraph);
    }
};

monarch.dovechart.prototype.setYAxisText = function(histogram, data, barGroup, bar, yFont){
    var self = this;
    config = self.config;
    
    histogram.svg.select(".y.axis")
    .selectAll("text")
    .data(data)
    .text(function(d){ return self.getIDLabel(d.id,data) })
    .attr("font-size", yFont)
    .on("mouseover", function(){
        d3.select(this).style("cursor", "pointer");
        d3.select(this).style("fill", config.color.yLabel.hover);
        d3.select(this).style("text-decoration", "underline");
        self.displaySubClassTip(self.tooltip,this)
    })
    .on("mouseout", function(){
        d3.select(this).style("fill", config.color.yLabel.fill );
        d3.select(this).style("text-decoration", "none");
        self.tooltip.style("display", "none");
    })
    .on("click", function(d){
        self.getDataAndTransitionOnClick(d, histogram, data, barGroup, bar);
    })
    .style("text-anchor", "end")
    .attr("dx", config.yOffset)
    .append("svg:title")
    .text(function(d){
        if (/\.\.\./.test(self.getIDLabel(d.id,data))){
            var fullLabel = self.getFullLabel(d.id, data);
            var title = fullLabel +" (" + d.id.replace(/(.*):(.*)/, "$1") + ")";
              return title;  
        } else if (yFont < 12) {//HARDCODE alert
            var label = self.getIDLabel(d.id,data);
            var title = label +" (" + d.id.replace(/(.*):(.*)/, "$1") + ")";
            return title;
        }
    });
};


monarch.dovechart.prototype.disableYAxisText = function(histogram, data, barGroup, bar){
    self = this;
    config = self.config;
    
    histogram.svg.select(".y.axis")
    .selectAll("text")
    .on("mouseover", function(){
        d3.select(this).style("cursor", "arrow");
    })
    .on("mouseout", function(){
        d3.select(this).style("fill", config.color.yLabel.fill );
        d3.select(this).style("text-decoration", "none");
        self.tooltip.style("display", "none");
    })
    .on("click", function(d){
    });
    
};

monarch.dovechart.prototype.activateYAxisText = function(histogram, data, barGroup, bar){
    self = this;
    config = self.config;
    
    histogram.svg.select(".y.axis")
    .selectAll("text")
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
        self.getDataAndTransitionOnClick(d, histogram, data, barGroup, bar);
    });
    
};

monarch.dovechart.prototype.getDataAndTransitionOnClick = function(node, histogram, data, barGroup, bar){
    var self = this;
    // Clear these in case they haven't faded out
    jQuery(self.html_div+" .leaf-msg").hide();
    jQuery(self.html_div+" .error-msg").hide();
    
    if (!self.tree_builder){
        self.parents.push(node.id);
        if (node.children && node.children[0]){ //TODO use tree api
            self.transitionToNewGraph(histogram,node,
                barGroup,bar, node.id);
        }
    } else {
        self.disableYAxisText(histogram,data, barGroup, bar);
        self.parents.push(node.id);
        jQuery(self.html_div+" .ajax-spinner").show();
        var transitionToGraph = function(){
            jQuery(self.html_div+" .ajax-spinner").hide();
            self.tree = self.tree_builder.tree;
            // Check if we've found a new class
            if (!self.tree.checkDescendants(self.parents)){
                self.parents.pop();
                jQuery(self.html_div+" .leaf-msg").html('There are no subclasses of <br/>'+node.fullLabel);
                jQuery(self.html_div+" .leaf-msg").show().delay(3000).fadeOut();
                self.activateYAxisText(histogram,data, barGroup, bar);
                // Scroll to top of chart
                if (jQuery(window).scrollTop() - jQuery(self.html_div).offset().top > 100) {
                    jQuery('html, body').animate({ scrollTop: jQuery(self.html_div).offset().top - 50 }, 0);
                }
            } else {
                self.transitionToNewGraph(histogram, node, barGroup,bar, node.id);
                if (jQuery(window).scrollTop() - jQuery(self.html_div).offset().top > 100) {
                    jQuery('html, body').animate({ scrollTop: jQuery(self.html_div).offset().top - 50 }, 0);
                }
            }
        };
    
        var showErrorMessage = function(){
            self.parents.pop();
            jQuery(self.html_div+" .ajax-spinner").hide();
            self.activateYAxisText(histogram,data, barGroup, bar);
            jQuery(self.html_div+" .error-msg").show().delay(3000).fadeOut();
        };
    
        self.tree_builder.build_tree(self.parents, transitionToGraph, showErrorMessage);
    }
    
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

monarch.dovechart.prototype.sortDataByGroupCount = function(data){
    var self = this;
    //Check if total counts have been calculated via getStackedStats()
    if (!data[0] || !data[0].counts ||  !data[0].counts[0] || data[0].counts[0].x1 == null){
        data = self.getStackedStats(data);
    }
    
    data.sort(function(obj1, obj2) {
        var obj2LastElement = obj2.counts.length - 1;
        var obj1LastElement = obj1.counts.length - 1;
        if ((obj2.counts[obj2LastElement])&&(obj1.counts[obj1LastElement])){
            return obj2.counts[obj2LastElement].x1 - obj1.counts[obj1LastElement].x1;
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
                orderedCounts[index] = (r['counts'][i]);
            }   
        });
        r.counts = orderedCounts;
        
    });
    return data;
};
  
//remove zero length bars
monarch.dovechart.prototype.removeZeroCounts = function(data){
      trimmedGraph = [];
      trimmedGraph = data.filter(function (r){
          var count = 0;
          r.counts.forEach(function (i){
               count += i.value;
           });
          return (count > 0);
      });
      return trimmedGraph;
};

/* Remove a category from the view
 * removeCategory pushes the category to 
 * the self.config.category_filter_list instance variable
 */
monarch.dovechart.prototype.removeCategory = function(data, category){
      trimmedGraph = [];
      trimmedGraph = data.map(function (r){
          var group = JSON.parse(JSON.stringify(r)); //make copy
          group.counts = r.counts.filter(function (i){
               return (i.name !== category);
           });
          return group;
      });
      
      if (trimmedGraph.length === 0) {
          // Reset original as a backup
          trimmedGraph = data;
      }
      //recalculate stacked stats
      trimmedGraph = self.getStackedStats(trimmedGraph);
      self.config.category_filter_list.push(category);
      return trimmedGraph;
};

/*
 * Remove a list of categories
 * This is not simply a wrapper for removeCategory since
 * we do not want to push these values to the 
 * self.config.category_filter_list
*/
monarch.dovechart.prototype.removeCategories = function(data, categories){
      trimmedGraph = [];
      
          trimmedGraph = data.map(function (r){
              var group = JSON.parse(JSON.stringify(r)); //make copy
              group.counts = r.counts.filter(function (i){
                  return (categories.indexOf(i.name) === -1);
              });
              return group;
          });
      
      //recalculate stacked stats
      trimmedGraph = self.getStackedStats(trimmedGraph);
      return trimmedGraph;
};

//remove classes without labels, see https://github.com/monarch-initiative/monarch-app/issues/894
monarch.dovechart.prototype.removeIdWithoutLabel = function(data){
      trimmedGraph = [];
      trimmedGraph = data.filter(function (r){
          return (r.label != null && r.id != r.label);
      });
      return trimmedGraph;
};

monarch.dovechart.prototype.addEllipsisToLabel = function(data, max){
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

monarch.dovechart.prototype.getFullLabel = function (id, data){
    for (var i=0, len=data.length; i < len; i++){
        if (data[i].id === id){
            var fullLabel = data[i].fullLabel;
            return fullLabel;
        }
    }
};

monarch.dovechart.prototype.getGroupID = function (id, data){
    for (var i=0, len=data.length; i < len; i++){
        if (data[i].label === id){
            monarchID = data[i].id;
            return monarchID;
        }
    }
};

monarch.dovechart.prototype.getIDLabel = function (id, data){
    for (var i=0, len=data.length; i < len; i++){
        if (data[i].id === id){
            label = data[i].label;
            return label;
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
   
   var yFont = conf.yFontSize;
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
    this.config.bcWidth = 700;
    
    //Y axis positioning when arrow present
    if (this.config.yOffset == null || typeof this.config.yOffset == 'undefined'){
        this.config.yOffset = "-1.48em";
    }
    
    //
    // This is a hack to keep the breadcrumbs area from being too large, which 
    // causes horizontal scrolling.
    //
    this.config.bcWidth = this.config.bread.width + 9 * (this.config.bread.offset + this.config.bread.space);
};

//dovechart default configurations
monarch.dovechart.prototype.getDefaultConfig = function(){
    
    var defaultConfiguration = {
            
            category_filter_list :[],
            
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
};/* 
 * Package: tree.js
 * 
 * Namespace: monarch.model
 * 
 */

// Module and namespace checking.
if (typeof monarch == 'undefined') { var monarch = {};}
if (typeof monarch.model == 'undefined') { monarch.model = {};}

/*
 * Constructor: tree
 * 
 * Parameters:
 *  data - the JSON object as a string in the following format:
 * {
     "root": {
         "id": "HP:0000118",
         "label": "Phenotypic Abnormality",
         "children": [
             {
                 "id": "HP:0000707",
                 "label": "Nervous System",
                 "counts": [
                     {
                         "value": 21290,
                         "name": "Human"
                     },
                     {
                         "value": 38136,
                         "name": "Mouse"
                     }
                 ],
                 "children": [
                     {
                         "label": "Nervous System Morphology",
                         "id": "HP:0012639",
                         "counts": [
                             {
                                 "value": 7431,
                                 "name": "Human"
                             },
                             {
                                 "value": 24948,
                                 "name": "Mouse"
                             }
                         ]
                     }
                 ]
             }
         ]
     }
 * }
 * Returns:
 *  tree object
 */
monarch.model.tree = function(data){
    var self = this;
    if (data){
        self._data = data;
        self.checkSiblings(data.root.children);
    } else {
        self._data = {'root' : {'id' : '', 'label' : ''}};
    }
};

//Return entire tree data 
monarch.model.tree.prototype.getTree = function(){
    return this._data;
};

//Set entire tree data 
monarch.model.tree.prototype.setTree = function(data){
    self._data = data;
};

monarch.model.tree.prototype.setRoot = function(node){
    this._data.root = node;
};

monarch.model.tree.prototype.getRoot = function(){
    return this._data.root;
};

monarch.model.tree.prototype.setRootID = function(id){
    this._data.root.id = id;
};

//Return entire tree data 
monarch.model.tree.prototype.getRootID = function(){
    return this._data.root.id;
};

monarch.model.tree.prototype.getRootLabel = function(){
    return this._data.root.label;
};

monarch.model.tree.prototype.hasRoot = function(){
    return (this._data.root && this.getRootID());
};

monarch.model.tree.prototype.getFirstSiblings = function(){
    return this._data.root.children;
};

monarch.model.tree.prototype.setFirstSiblings = function(siblings){
    this._data.root.children = siblings;
};


monarch.model.tree.prototype.addCountsToNode = function(node_id, counts, parents) {
    var self = this;
    
    //Check that parents lead to something
    var siblings = self.getDescendants(parents);
    var index = siblings.map(function(i){return i.id;}).indexOf(node_id);
    
    if (index == -1){
        throw new Error ("Error in locating node given "
                         + parents + " and ID: " + node_id);
    } else {
        siblings[index]['counts'] = counts;
    }
    
    return self;
};

monarch.model.tree.prototype.addSiblingGroup = function(nodes, parents) {
    var self = this;
    
    //Check that parents lead to something
    var p_clone = JSON.parse(JSON.stringify(parents));
    var root = p_clone.pop();
    
    if (p_clone.length == 0){
        self.setFirstSiblings(nodes);
    } else {
        var siblings = self.getDescendants(p_clone);
        var index = siblings.map(function(i){return i.id;}).indexOf(root);
    
        if (index == -1){
            throw new Error ("Error in locating node given "
                         + p_clone + " and ID: " + root);
        } else {
            siblings[index]['children'] = nodes;
        }
    }
    
    return self;
};

/*
 * Function: checkDescendants
 * 
 * Check if we have descendants given a list of parents
 * 
 * Parameters:
 *  parents - list of IDs leading to descendant
 *  checkForData - boolean - optional flag to check if descendants have count data
 * 
 * Returns:
 *  boolean 
 */
monarch.model.tree.prototype.checkDescendants = function(parents, checkForData){
    var self = this;
    var areThereDescendants = true;
    var descendants =[];
    
    if (typeof parents != 'undefined' && parents.length > 0){
        
        if (parents[0] != self.getRootID()){
            throw new Error ("first id in parent list is not root");
        }
        descendants = self.getFirstSiblings();
        for (var i = 0; i < (parents.length); i++) {
            //skip root
            if (i == 0){
                continue;
            } else {
                var branch = self._jumpOneLevel(parents[i], descendants);
                descendants = branch.children;
            }
        }
        
    } else {
        return self.hasRoot();
    }
    
    if (typeof descendants != 'undefined' && descendants.length > 0 
            && 'id' in descendants[0] 
            && typeof descendants[0].id != 'undefined'){
        areThereDescendants = true;
        
            if ( checkForData && !('counts' in descendants[0]) ){
                areThereDescendants = false;
            }
    } else {
        areThereDescendants = false;
    }

    return areThereDescendants;
};
    

/*
 * Function: getDescendants
 * 
 * Return a descendant given a list of IDs leading to the descendant
 * 
 * Parameters:
 *  parents - list of IDs leading to descendant
 * 
 * Returns:
 *  object containing descendant data
 */
monarch.model.tree.prototype.getDescendants = function(parents){
    var self = this;
    
    // Start at root
    var descendants = [];
    
    if (typeof parents != 'undefined' && parents.length > 0){
        
        if (parents[0] != self.getRootID()){
            throw new Error ("first id in parent list is not root");
        }

        parents.forEach( function(r,i){
            //skip root
            if (i == 0){
              descendants = self.getFirstSiblings();
            } else {
                var branch = self._jumpOneLevel(r, descendants);
                descendants = branch.children;
            }
        });
    } else {
        descendants = self.getRoot();
    }
    
    return descendants;
};

/*
 * Function: _jumpOneLevel
 * 
 * Return a descendant given a list of IDs leading to the descendant
 * 
 * Parameters:
 *  id - id to move into on branch
 *  branch - branch of a tree
 * 
 * Returns:
 *  object containing branch of data where id is the root
 */
monarch.model.tree.prototype._jumpOneLevel = function(id, branch){
    branch = branch.filter(function(i){return i.id == id;});
    if (branch.length > 1){
        throw new Error ("Cannot disambiguate id: " + id);
    } else if (branch.length == 0){
        throw new Error ("Error in locating descendants given id: "+id);
    }
    return branch[0];
}

//TODO improve checking
// Just checks top level of tree
monarch.model.tree.prototype.checkSiblings = function(siblings){
    if (typeof siblings === 'undefined'){
        throw new Error ("tree object is undefined");
    }
  
    siblings.forEach(function (r){
        //Check ID
        if (r.id == null){
            throw new Error ("ID is not defined in self.data object");
        }
        if (r.label == null){
            r.label = r.id;
        }
        if (r.counts == null){
            //throw new Error ("No statistics for "+r.id+" in self.data object");
        } else {
            r.counts.forEach(function (i){
                if (i.value == null){
                    r.value = 0;
                }
            });
        }
    });
    return self;
};/* 
 * Package: tree_builder.js
 * 
 * Namespace: monarch.builder
 * 
 */

// Module and namespace checking.
if (typeof monarch == 'undefined') { var monarch = {};}
if (typeof monarch.builder == 'undefined') { monarch.builder = {};}

/*
 * Constructor: tree_builder
 * 
 * Parameters:
 *    solr_url - Base URL for Solr service
 *    scigraph_url - Base URL of SciGraph REST API
 *    golr_conf - Congifuration for golr_manager
 *    tree - monarch.model.tree object
 *  
 */
monarch.builder.tree_builder = function(solr_url, scigraph_url, golr_conf, tree, config){
    var self = this;
    self.solr_url = solr_url;
    // Turn into official golr conf object
    self.golr_conf = new bbop.golr.conf(golr_conf);
    self.scigraph_url = scigraph_url;
    if (typeof tree === 'undefined') {
        self.tree = new monarch.model.tree();
    } else {
        self.tree = tree;
    }
    if (config == null || typeof config == 'undefined'){
        self.config = self.getDefaultConfig();
    } else {
        self.config = config;
    }
    
};

monarch.builder.tree_builder.prototype.build_tree = function(parents, final_function, error_function){
    var self = this;
    
    var checkForData = true;
    
    // Check tree to see if we have classes, if so skip getting ontology
    // structure from SciGraph
    if (!self.tree.checkDescendants(parents)){
        //get data from ontology
        var final_callback = function(){
            self.getCountsForSiblings(parents, final_function, error_function
        )};
        self.addOntologyToTree(parents[parents.length-1], 1, parents, final_callback, error_function);
    } else if (!self.tree.checkDescendants(parents, checkForData)){
        self.getCountsForSiblings(parents, final_function, error_function);
    } else {
        final_function();
    }
    
};

/*
 * Function: addOntologyToTree
 * 
 * Parameters:
 *    id - string, root id as curie or url
 *    depth - string or int, how many levels to traverse
 *    
 * Returns:
 *    object, maybe should be monarch.model.tree?
 */
monarch.builder.tree_builder.prototype.addOntologyToTree = function(id, depth, parents, final_function, error_function){
    var self = this;
    
    // Some Hardcoded options for scigraph
    var direction = 'INCOMING';
    var relationship = 'subClassOf';
    
    var query = self.setGraphNeighborsUrl(id, depth, relationship, direction);
    
    jQuery.ajax({
        url: query,
        jsonp: "callback",
        dataType: "json",
        error: function(){
          console.log('ERROR: looking at: ' + query);
          if (typeof error_function != 'undefined'){
              error_function();
          }
        },
        success: function(data) {
            var graph = new bbop.model.graph();
            graph.load_json(data);
            var child_nodes = graph.get_child_nodes(id);
            var siblings = child_nodes.map(function(i){
                return {'id' : i.id(),
                        'label' : self.processLabel(i.label())};
            });
            self.tree.addSiblingGroup(siblings, parents)
            if (typeof final_function != 'undefined'){
                final_function();
            }
        }
    });

};

/*
 * Function: getCountsForClass
 * 
 * Parameters:
 *    id -
 *    id_field -
 *    species -
 *    filters -
 *    
 * Returns:
 *    node object
 */
monarch.builder.tree_builder.prototype.setGolrManager = function(golr_manager, id, id_field, filter, personality){
    var self = this;
    var config = self.config;
    
    golr_manager.reset_query_filters();
    golr_manager.add_query_filter(config.id_field, id, ['*']);
    golr_manager.set_results_count(0);
    golr_manager.lite(true);
    
    if (config.filter instanceof Array && config.filter.length > 0){
        config.filter.forEach(function(val){
            if (val != null && val.field && val.value){
                golr_manager.add_query_filter(val.field, val.value, ['*']);
            }
        });
    }
    
    if (config.personality != null){
        golr_manager.set_personality(config.personality);
    }
    return golr_manager;
};

/*
 * Function: getCountsForClass
 * 
 * Parameters:
 *    id -
 *    id_field -
 *    species -
 *    filters -
 *    personality - 
 *    facet - 
 *    parents - 
 *    final_function -
 *    
 * Returns:
 *    JQuery Ajax Function
 */
monarch.builder.tree_builder.prototype.getCountsForSiblings = function(parents, final_function, error_function){
    var self = this;
    
    var siblings = self.tree.getDescendants(parents);

    var promises = [];
    var success_callbacks = [];
    var error_callbacks = [];
    
    siblings.map(function(i){return i.id;}).forEach( function(i) {
        var ajax = self._getCountsForClass(i, parents);
        promises.push(jQuery.ajax(ajax.qurl,ajax.jq_vars));
        success_callbacks.push(ajax.jq_vars['success']);
        error_callbacks.push(ajax.jq_vars['error']);
    });
    
    jQuery.when.apply(jQuery,promises).done(success_callbacks).done(function(){
        if (typeof final_function != 'undefined'){
            final_function();
        }
    }).fail(error_callbacks).fail(function (){
        if (typeof error_function != 'undefined'){
            error_function();
        }
    });
    
};

/*
 * Function: getCountsForClass
 * 
 * Parameters:
 *    id -
 *    id_field -
 *    species -
 *    filters -
 *    personality -
 *    facet - 
 *    parents -
 *    
 * Returns:
 *    JQuery Ajax Function
 */
monarch.builder.tree_builder.prototype._getCountsForClass = function(id, parents){
    var self = this;
    var node = {"id":id, "counts": []};
    
    var golr_manager = new bbop.golr.manager.jquery(self.solr_url, self.golr_conf);
    
    //First lets override the update function
    golr_manager.update = function(callback_type, rows, start){
        
        // Get "parents" url first.
        var parent_update = bbop.golr.manager.prototype.update;
        var qurl = parent_update.call(this, callback_type, rows, start);

        if( ! this.safety() ){
        
        // Setup JSONP for Solr and jQuery ajax-specific parameters.
        this.jq_vars['success'] = this._callback_type_decider; // decide & run
        this.jq_vars['error'] = this._run_error_callbacks; // run error cbs

        return {qurl: qurl, jq_vars: this.jq_vars};
        }
    };
    
    /* No idea why I need to override this to comment out checking
     * for response.success(), hoping the error callbacks will 
     * catch any errors
     */
    golr_manager._callback_type_decider = function(json_data){
        var response = new bbop.golr.response(json_data);

            // 
            if( ! response.success() ){
                //throw new Error("Unsuccessful response from golr server!");
            }else{
                var cb_type = response.callback_type();
                if( cb_type == 'reset' ){
                    golr_manager._run_reset_callbacks(json_data);
                }else if( cb_type == 'search' ){
                    golr_manager._run_search_callbacks(json_data);
                }else{
                    throw new Error("Unknown callback type!");
                }
            }
        };
    
    golr_manager = self.setGolrManager(golr_manager, id);
    
    var makeDataNode = function(golr_response){
        var counts = [];
        if (typeof self.config.facet != 'undefined'){
            var facet_counts = golr_response.facet_field(self.config.facet);
            facet_counts.forEach(function(i){
                if (typeof self.getTaxonMap()[i[0]] != 'undefined') {
                    var index = counts.map(function(d){return d.name}).indexOf(self.getTaxonMap()[i[0]]);
                    if (index != -1){
                        counts[index]['value'] += i[1];
                    } else {
                        counts.push({
                               'name': self.getTaxonMap()[i[0]],
                               'value' : i[1]
                        });
                    }
                } else {
                    var index = counts.map(function(d){return d.name}).indexOf('Other');
                    if (index != -1){
                        counts[index]['value'] += i[1];
                    } else {
                        counts.push({
                            'name': 'Other',
                            'value' : i[1]
                        });
                    }
                }
            });
        } else if (typeof self.config.single_group != 'undefined') {
            counts.push({
                'name': self.config.single_group,
                'value' : golr_response.total_documents()
            });
        } else {
            throw new Error("Either facet or single_group required in config");
        }
        self.tree.addCountsToNode(id,counts,parents)
    }
    var register_id = 'data_counts_'+id;
    
    golr_manager.register('search', register_id, makeDataNode);
    return golr_manager.update('search');
    
};


/*
 * Function: setGraphNeighborsUrl
 * 
 * Construct SciGraph URL for Rest Server
 * 
 * Parameters:
 *    id - string, root id as curie or url
 *    depth - string or int, how many levels to traverse 
 *    relationship - string, relationship between terns, defaults as subClassOf
 *    direction - string, direction of relationship, INCOMING,
 *                        OUTGOING, or BOTH will work
 *                        
 * Returns: 
 *    string
 */
monarch.builder.tree_builder.prototype.setGraphNeighborsUrl = function(id, depth, relationship, direction){
    var self = this;
    if (typeof relationship === 'undefined') {
        relationship = "subClassOf";
    }
    if (typeof direction === 'undefined') {
        direction = 'INCOMING';
    }
    var url = self.scigraph_url + 'graph/neighbors/' + id + '.json?depth='
              + depth + '&blankNodes=false&relationshipType='
              + relationship + '&direction=' + direction + '&project=*';
    
    return url;
};

/*
 * Function: convertGraphToTree
 * 
 * Edit label to make more readable
 * 
 * Parameters:
 *    graph - bbop.model.graph
 *    root - root object
 *    
 * Returns:
 *    monarch.model.tree
 */
monarch.builder.tree_builder.prototype.convertGraphToTree = function(graph, root){
    var self = this;
    if (!graph._is_a === 'bbop.model.graph'){
        throw new Error ("Input is not a bbop.model.graph");
    }
    
    var tree = new monarch.model.tree();
    
};

/*
 * Function: processLabel
 * 
 * Edit label to make more readable
 * 
 * Parameters:
 *    label - string, label to be processed
 *    
 * Returns:
 *    string
 */
monarch.builder.tree_builder.prototype.processLabel = function(label){
    if (typeof label != 'undefined'){
        label = label.replace(/Abnormality of (the )?/, '');
        label = label.replace(/abnormal(\(ly\))? /, '');
        label = label.replace(/ phenotype$/, '');
    
        label = label.replace(/\b'?[a-z]/g, function() {
            if (!/'/.test(arguments[0])) {
                return arguments[0].toUpperCase()
            } else {
                return arguments[0];
            }
        });
    }
    
    return label;
};

// Hardcoded taxon map
monarch.builder.tree_builder.prototype.getTaxonMap = function(){
    return {
        "NCBITaxon:10090" : "Mouse",
        "NCBITaxon:9606" : "Human",
        "NCBITaxon:7955" : "Zebrafish",
        "NCBITaxon:57486" : "Mouse",
        "NCBITaxon:39442" : "Mouse",
        "NCBITaxon:10092" : "Mouse",
        "NCBITaxon:10091" : "Mouse",
        "NCBITaxon:9823" : "Pig",
        "NCBITaxon:10116" : "Rat",
        "NCBITaxon:9913" : "Cow",
        "NCBITaxon:6239" : "Worm",
        "NCBITaxon:7227" : "Fly",
        //"NCBITaxon:8364" : "Frog",
        "NCBITaxon:9544" : "Monkey",
        "NCBITaxon:9258" : "Platypus",
        "NCBITaxon:9685" : "Cat",
        //"NCBITaxon:9986" : "Rabit",
        "NCBITaxon:9615" : "Dog",
        "NCBITaxon:9031" : "Chicken"
    };
};

monarch.builder.tree_builder.prototype.addFilter = function(filter_args){
    var self = this;
    self.config.filter.push(filter_args);
}


monarch.builder.tree_builder.prototype.getDefaultConfig = function(){
    var config = {
            id_field : 'object_closure',
            personality : 'dovechart',
            filter : [{ field: 'subject_category', value: 'gene' }],
    }
    return config;
}
/* 
 * Package: barchart.js
 * 
 * Namespace: monarch.chart.barchart
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
    barColors = config.color.bars;
    self.color = d3.scale.ordinal()
        .range(Object.keys(barColors).map(function(k) { return barColors[k] }));

    self.xAxis = d3.svg.axis()
        .scale(self.x)
        .orient("top")
        .tickFormat(d3.format(".2s"));

    self.yAxis = d3.svg.axis()
        .scale(self.y0)
        .orient("left");

    self.svg = d3.select(html_div).append("svg")
        .attr("class", "barchart")
        .attr("width", config.width + config.margin.left + config.margin.right)
        .attr("height", config.height + config.margin.top + config.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + config.margin.left + "," + config.margin.top + ")");
};

monarch.chart.barchart.prototype.setXTicks = function(config) {
    var self = this;
    //Set x axis ticks
    self.svg.append("g")
        .attr("class", "x axis")
        .call(self.xAxis)
        .style("font-size", config.xFontSize)
        .append("text")
        .attr("transform", "rotate(0)")
        .attr("y", config.xAxisPos.y)
        .attr("dx", config.xAxisPos.dx)
        .attr("dy", "0em")
        .style("text-anchor", "end")
        .style("font-size",config.xLabelFontSize)
        .text(config.xAxisLabel);
    
    return self;
};

monarch.chart.barchart.prototype.setYTicks = function() {
    var self = this;
    //Set Y axis ticks and labels
    self.svg.append("g")
        .attr("class", "y axis")
        .call(self.yAxis);
    
    return self;
}

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
    var self = this;
    self.svg.select(".y.axis")
      .selectAll("text")
      .attr("dx", dx);
};