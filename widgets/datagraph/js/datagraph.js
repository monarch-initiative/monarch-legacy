/* 
 * Package: datagraph.js
 * 
 * Namespace: monarch.bbop.datagraph
 * 
 */

// Module and namespace checking.
if (typeof bbop == 'undefined') { var bbop = {};}
if (typeof bbop.monarch == 'undefined') { bbop.monarch = {};}

bbop.monarch.datagraph = function(config){
    
    if (config == null || typeof config == 'undefined'){
        this.config = this.getDefaultConfig();
    } else {
        this.config = config;
    }
    this.setNonConfigurableParameters();
}
        
bbop.monarch.datagraph.prototype.init = function (html_div,DATA){
            
     conf = this.config;
     datagraph = this;
     var height;
     var width;
     
     //Check screen size on page load
     if ($(window).width() < 1500 || $(window).height() < 800){
         width = conf.width;
         height = conf.height;
     } else {
         width = conf.width;
         height = conf.height;
     }
     //console.log($(window).width());
     datagraph.makeGraphDOM(html_div);
     var d3Config = datagraph.initSVG(html_div,DATA,height,width);
     //Call function to draw graph
     datagraph.drawGraph(DATA,d3Config,html_div);
     
     window.addEventListener('resize', function(event){
         
         if ($(window).width() < 1500 || $(window).height() < 800){
             if (width == conf.width){
                 return;
             } else {
                 width = conf.width;
                 height = conf.height;
             }
         } else if (width == conf.width){
                 return;
         } else {
             width = conf.width;
             height = conf.height;
         }

         $(html_div).children().remove();
         
         datagraph.makeGraphDOM(html_div);
         var d3Config = datagraph.initSVG(html_div,DATA,height,width);
         datagraph.drawGraph(DATA,d3Config,html_div);
      });
}
        
//set X Axis limit for grouped configuration
bbop.monarch.datagraph.prototype.getGroupMax = function(data){
      return d3.max(data, function(d) { 
          return d3.max(d.counts, function(d) { return d.value; });
      });
}

//set X Axis limit for stacked configuration
bbop.monarch.datagraph.prototype.getStackMax = function(data){
      return d3.max(data, function(d) { 
          return d3.max(d.counts, function(d) { return d.x1; });
      }); 
}

//get largest Y axis label for font resizing
bbop.monarch.datagraph.prototype.getYMax = function(data){
      return d3.max(data, function(d) { 
          return d.label.length;
      });
}
  
bbop.monarch.datagraph.prototype.checkForSubGraphs = function(data){
      for (i = 0;i < data.length; i++) {
          if (Object.keys(data[i]).indexOf('subGraph') >= 0) {
              return true;
          } 
     }
     return false;
}
  
bbop.monarch.datagraph.prototype.getStackedStats = function(data,groups){
      //Add x0,x1 values for stacked barchart
      data.forEach(function (r){
          var count = 0;
          r.counts.forEach(function (i){
               i["x0"] = count;
               i["x1"] = i.value+count;
               if (i.value > 0){
                   count = i.value;
               }
           });
      });
      var lastElement = groups.length-1;
      data.sort(function(obj1, obj2) {
          if ((obj2.counts[lastElement])&&(obj1.counts[lastElement])){
              return obj2.counts[lastElement].x1 - obj1.counts[lastElement].x1;
          } else {
              return 0;
          }
      });
      return data;
}
  
bbop.monarch.datagraph.prototype.getGroups = function(data) {
      var groups = [];
      var unique = {};
      for (var i=0, len=data.length; i<len; i++) { 
          for (var j=0, cLen=data[i].counts.length; j<cLen; j++) { 
              unique[ data[i].counts[j].name ] =1;
          }
      }
      groups = Object.keys(unique);
      return groups;
},
  
//remove zero length bars
bbop.monarch.datagraph.prototype.removeZeroCounts = function(data){
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
 }
  
// Adjust Y label font, arrow size, and spacing
// when transitioning
bbop.monarch.datagraph.prototype.adjustYAxisElements = function(yMax,len){
      
      var conf = this.config;
      var h = conf.height;
      var density = h/len;
      var isUpdated = false;
      
      //var yFont = 'default';
      yFont = conf.yFontSize;
      var yOffset = conf.yOffset;
      var arrowDim = conf.arrowDim;
      
      if (yMax > 31 && yMax < 41){
          yFont = ((1/yMax)*450);
          isUpdated = true;
      }else if (yMax > 41 && yMax < 53){
          yFont = ((1/yMax)*565);
          arrowDim = "-20,-5, -9,1 -20,7";
          isUpdated = true;
      } else if (yMax >= 53 && yMax <66){
          yFont = ((1/yMax)*615);
          yOffset = "-1.45em";
          arrowDim = "-20,-5, -9,1 -20,7";
          isUpdated = true;
      } else if (yMax >= 66){
          yFont = ((1/yMax)*640);
          yOffset = "-1.4em";
          arrowDim = "-20,-5, -9,1 -20,7";
          isUpdated = true;
      }
      
      if (isUpdated && yFont > conf.yFontSize){
          yFont = conf.yFontSize;
      }
      
      //Check for density BETA
      if (density < 15 && density < yFont ){
          yFont = density+2;
          yOffset = "-2em";
          arrowDim = "-20,-3, -11,1 -20,5";
      }
      var retList = [yFont,yOffset,arrowDim];
      return retList;
}
  
bbop.monarch.datagraph.prototype.addEllipsisToLabel = function(data,max){
      var reg = new RegExp("(.{"+max+"})(.+)");
      data.forEach(function (r){
          if (r.label.length > max){
              r.fullLabel = r.label;
              r.label = r.label.replace(reg,"$1...");      
          }
      });
      return data;
}
  
bbop.monarch.datagraph.prototype.getFullLabel = function (d,data){
      for (var i=0, len=data.length; i < len; i++){
          if (data[i].label === d){
              var fullLabel = data[i].fullLabel;
              return fullLabel;
              break;
          }
      }
}
  
bbop.monarch.datagraph.prototype.makeGraphDOM = function(html_div){
      
      var conf = this.config;
      
      //Create html structure
      //Add graph title
      $(html_div).append( "<div class=title"+
              " style=text-indent:" + conf.title['text-indent'] +
              ";text-align:" + conf.title['text-align'] +
              ";background-color:" + conf.title['background-color'] +
              ";border-bottom-color:" + conf.title['border-bottom-color'] +
              ";font-size:" + conf.title['font-size'] +
              ";font-weight:" + conf.title['font-weight'] +
              "; >"+conf.chartTitle+"</div>" );
      $(html_div).append( "<div class=interaction></div>" );
      $(html_div+" .interaction").append( "<li></li>" );
      $(html_div+" .interaction li").append("<div class=breadcrumbs></div>");
}
  
bbop.monarch.datagraph.prototype.initSVG = function (html_div,DATA,height,width){
      
      var d3Config = {};
      var conf =  this.config;
      
      //D3 starts here
      //Define scales
      d3Config.y0 = d3.scale.ordinal()
          .rangeRoundBands([0,height], .1);

      d3Config.y1 = d3.scale.ordinal();

      d3Config.x = d3.scale.linear()
          .range([0, width]);
      
      //Bar colors
      d3Config.color = d3.scale.ordinal()
          .range([conf.color.first,conf.color.second,conf.color.third,
                  conf.color.fourth,conf.color.fifth,conf.color.sixth]);

      d3Config.xAxis = d3.svg.axis()
          .scale(d3Config.x)
          .orient("top")
          .tickFormat(d3.format(".2s"));

      d3Config.yAxis = d3.svg.axis()
          .scale(d3Config.y0)
          .orient("left");

      d3Config.svg = d3.select(html_div).append("svg")
          .attr("width", width + conf.margin.left + conf.margin.right)
          .attr("height", height + conf.margin.top + conf.margin.bottom)
          .append("g")
          .attr("transform", "translate(" + conf.margin.left + "," + conf.margin.top + ")");
      
      d3Config.crumbSVG = d3.select(html_div).select(".breadcrumbs")
          .append("svg")
          .attr("height",conf.bcHeight)
          .attr("width",conf.bcWidth);

      d3Config.tooltip = d3.select(html_div)
          .append("div")
          .attr("class", "tip");
      
      return d3Config;
}

bbop.monarch.datagraph.prototype.drawGraph = function (data,graphConfig,html_div) {
        var datagraph = this;
        var config = this.config;
        var groups = datagraph.getGroups(data);
        data = datagraph.getStackedStats(data,groups);
        data = datagraph.addEllipsisToLabel(data,config.maxLabelSize);
        
        //Override breadcrumb config if subgraphs exist
        config.useCrumb = datagraph.checkForSubGraphs(data);
        
        var y0       = graphConfig.y0;
        var y1       = graphConfig.y1;
        var x        = graphConfig.x;
        var color    = graphConfig.color;
        var xAxis    = graphConfig.xAxis;
        var yAxis    = graphConfig.yAxis;
        var svg      = graphConfig.svg;
        var crumbSVG = graphConfig.crumbSVG;
        var tooltip  = graphConfig.tooltip;
            
        
        //remove breadcrumb div
        if (!config.useCrumb){
            $(html_div+" .breadcrumbs").remove();
        }
        //Add stacked/grouped form if more than one group
        if (groups.length >1){
            $(html_div+" .interaction li").append(" <form class=configure"+
                    " style=font-size:" + config.settingsFontSize + "; >" +
                    "<label><input id=\"group\" type=\"radio\" name=\"mode\"" +
                        " value=\"grouped\" checked> Grouped</label> " +
                    "<label><input id=\"stack\" type=\"radio\" name=\"mode\"" +
                        " value=\"stacked\"> Stacked</label>" +
                "</form> ");
        }
        //Update tooltip positioning
        if (!config.useCrumb && groups.length>1){
            config.arrowOffset.height = 86;
            config.barOffset.grouped.height = 102;
            config.barOffset.stacked.height = 81;
        } else if (!config.useCrumb){
            config.arrowOffset.height = 55;
            config.barOffset.grouped.height = 71;
            config.barOffset.stacked.height = 50;
        }
        
        if (groups.length == 1){
            config.barOffset.grouped.height = config.barOffset.grouped.height+8;
            config.barOffset.stacked.height = config.barOffset.stacked.height+8;
        }
        
        var parents = [];
        var level = 0;  //breadcrumb counter
        
        y0.domain(data.map(function(d) { return d.label; }));
        y1.domain(groups).rangeRoundBands([0, y0.rangeBand()]);
        
        var xGroupMax = datagraph.getGroupMax(data);
        var xStackMax = datagraph.getStackMax(data);
        var yMax = datagraph.getYMax(data);
        
        x.domain([0, xGroupMax]);
        
        //Dynamically decrease font size for large labels
        var confList = datagraph.adjustYAxisElements(yMax,data.length);
        var yFont = confList[0];
        var yLabelPos = confList[1];
        var triangleDim = confList[2];
        
        //Set x axis ticks
        var xTicks = svg.append("g")
            .attr("class", "x axis")
            .call(xAxis)
            .style("font-size",config.xFontSize)
            .append("text")
            .attr("transform", "rotate(0)")
            .attr("y", -29)
            .attr("dx", config.xAxisPos)
            .attr("dy", "0em")
            .style("text-anchor", "end")
            .style("font-size",config.xLabelFontSize)
            .text(config.xAxisLabel);

        //Set Y axis ticks and labels
        var yTicks = svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .selectAll("text")
            .filter(function(d){ return typeof(d) == "string"; })
            .attr("font-size", yFont)
            .on("mouseover", function(d){
                if (config.isYLabelURL){
                    d3.select(this).style("cursor", "pointer");
                    d3.select(this).style("fill", config.color.yLabel.hover);
                    d3.select(this).style("text-decoration", "underline");
                }
                if (/\.\.\./.test(d)){
                    var fullLabel = datagraph.getFullLabel(d,data);
                    d3.select(this).append("svg:title")
                    .text(fullLabel);
                //Hardcode alert
                } else if (yFont < 12) {
                    d3.select(this).append("svg:title")
                    .text(d);
                }
            })
            .on("mouseout", function(){
                d3.select(this).style("fill", config.color.yLabel.fill );
                d3.select(this).style("text-decoration", "none");
             })
            .on("click", function(d){
                if (config.isYLabelURL){
                    d3.select(this).style("cursor", "pointer");
                    var monarchID = getGroupID(d,data);
                    document.location.href = config.yLabelBaseURL + monarchID;
                }
             })
            .style("text-anchor", "end")
            .attr("dx", yLabelPos);
       
        //Create SVG:G element that holds groups
        var barGroup = svg.selectAll(".barGroup")
            .data(data)
            .enter().append("svg:g")
            .attr("class", ("bar"+level))
              .attr("transform", function(d) { return "translate(0," + y0(d.label) + ")"; });
        
        //Create bars 
        var rect = barGroup.selectAll("g")
           .data(function(d) { return d.counts; })
           .enter().append("rect")
           .attr("class",("rect"+level))
           .attr("height", y1.rangeBand())
           .attr("y", function(d) { return y1(d.name); })
           .attr("x", function(){if (config.isChrome) {return 1;}else{ return 0;}})
           .attr("width", function(d) { return x(d.value); })
           .on("mouseover", function(d){
               d3.select(this)
               .style("fill", config.color.bar.fill);
               
               var coords = d3.transform(d3.select(this.parentNode).attr("transform")).translate;
               var w = coords[0];
               var h = coords[1];
               var heightOffset = this.getBBox().y;
               var widthOffset = this.getBBox().width;
               
               tooltip.style("display", "block")
               .html("Counts: "+"<span style='font-weight:bold'>"+d.value+"</span>"+"<br/>"
                    +"Organism: "+ "<span style='font-weight:bold'>"+d.name)
               .style("top",h+heightOffset+config.barOffset.grouped.height+"px")
               .style("left",w+config.barOffset.grouped.width+widthOffset+conf.margin.left+"px");

            })
           .on("mouseout", function(){
               d3.select(this)
               .style("fill", function(d) { return color(d.name); });
               
               tooltip.style("display", "none");
            })
           .style("fill", function(d) { return color(d.name); });
        
        //Create navigation arrow
        var navigate = svg.selectAll(".y.axis");
        makeNavArrow(data,navigate,triangleDim,barGroup,rect);
        
        //Create legend
        if (config.useLegend){
            makeLegend();
        }
        
        //Make first breadcrumb
        if (config.useCrumb){
            makeBreadcrumb(level,config.firstCrumb,groups,rect,barGroup);
        }
        
        d3.select(html_div).selectAll("input").on("change", change);
        
        function makeNavArrow(data,navigate,triangleDim,barGroup,rect){
            var isSubClass;
            var arrow = navigate.selectAll(".tick.major")
            .data(data)
            .append("svg:polygon")
            .attr("points",triangleDim)
            .attr("fill", config.color.arrow.fill)
            .attr("display", function(d){
                 if (d.subGraph && d.subGraph[0]){
                     isSubClass=1; return "initial";
                 } else {
                     return "none";
                 }
            })
            .on("mouseover", function(d){
                       
                   if (d.subGraph && d.subGraph[0]){
                           
                       d3.select(this)
                       .style("fill", config.color.arrow.hover);

                       var coords = d3.transform(d3.select(this.parentNode).attr("transform")).translate;
                       var h = coords[1];
                       var w = coords[0];
                       
                       tooltip.style("display", "block")
                       .html("Click to see subclasses")
                       .style("top",h+config.arrowOffset.height+"px")
                       .style("left",w+config.margin.left+config.arrowOffset.width+"px");
                       
                   } 
            })
            .on("mouseout", function(){
                d3.select(this)
                    .style("fill",config.color.arrow.fill);
                tooltip.style("display", "none");
             })
            .on("click", function(d){
                   if (d.subGraph && d.subGraph[0]){
                       
                       tooltip.style("display", "none");
                       svg.selectAll(".tick.major").remove();
                       level++;
                       transitionSubGraph(d.subGraph,data);
                       
                       //remove old bars
                       barGroup.transition()
                           .duration(750)
                           .attr("y", 60)
                           .style("fill-opacity", 1e-6)
                           .remove();
                       
                       rect.transition()
                           .duration(750)
                           .attr("y", 60)
                           .style("fill-opacity", 1e-6)
                           .remove();
                       if (config.useCrumb){
                           makeBreadcrumb(level,d.label,groups,rect,barGroup,d.fullLabel);
                       }
                   }
           });
           return isSubClass;
        }
        
        function makeLegend(){
            //Set legend
            var legend = svg.selectAll(".legend")
               .data(groups.slice())
               .enter().append("g")
               .attr("class", "legend")
               .attr("transform", function(d, i) { return "translate(0," + i * 25 + ")"; });

            legend.append("rect")
               .attr("x", config.width+55)
               .attr("y", 4)
               .attr("width", config.legend.width)
               .attr("height", config.legend.height)
               .style("fill", color);

            legend.append("text")
               .attr("x", config.width+50)
               .attr("y", 12)
               .attr("dy", config.legendText.height)
               .attr("font-size",config.legendFontSize)
               .style("text-anchor", "end")
               .text(function(d) { return d; });
        }

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
                .attr("x", function(){if (config.isChrome) {return 1;}else{ return 0;}})
                .attr("width", function(d) { return x(d.value); })
                
            rect.on("mouseover", function(d){
                
                d3.select(this)
                .style("fill", config.color.bar.fill);
                  
                var coords = d3.transform(d3.select(this.parentNode).attr("transform")).translate;
                var w = coords[0];
                var h = coords[1];
                var heightOffset = this.getBBox().y;
                var widthOffset = this.getBBox().width;
                   
                tooltip.style("display", "block")
                  .html("Counts: "+"<span style='font-weight:bold'>"+d.value+"</span>"+"<br/>"
                        +"Organism: "+ "<span style='font-weight:bold'>"+d.name)
                  .style("top",h+heightOffset+config.barOffset.grouped.height+"px")
                  .style("left",w+config.barOffset.grouped.width+widthOffset+conf.margin.left+"px");
            })
                .on("mouseout", function(){
                  tooltip.style("display", "none")
                  d3.select(this)
                  .style("fill", function(d) { return color(d.name); });
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
                .attr("x", function(d){
                    if (d.x0 == 0){
                        if (config.isChrome){return 1;}
                        else {return d.x0;}
                    } else { 
                        return x(d.x0);
                    }
                })
                .attr("width", function(d) { return x(d.x1) - x(d.x0); })
                .transition()
                .attr("height", y0.rangeBand())
                .attr("y", function(d) { return y1(d.name); })
                
            rect.on("mouseover", function(d){
                
                d3.select(this)
                .style("fill", config.color.bar.fill);
                   
                var coords = d3.transform(d3.select(this.parentNode).attr("transform")).translate;
                var w = coords[0];
                var h = coords[1];
                var heightOffset = this.getBBox().y;
                var widthOffset = this.getBBox().width;
                   
                tooltip.style("display", "block")
                    .html("Counts: "+"<span style='font-weight:bold'>"+d.value+"</span>"+"<br/>"
                         +"Organism: "+ "<span style='font-weight:bold'>"+d.name)
                    .style("top",h+heightOffset+config.barOffset.stacked.height+"px")
                    .style("left",w+config.barOffset.grouped.width+widthOffset+conf.margin.left+"px");
            })
               .on("mouseout", function(){
                   tooltip.style("display", "none");
                   d3.select(this)
                   .style("fill", function(d) { return color(d.name); });
            })
        }
        
        function getGroupID(d,data){
            for (var i=0, len=data.length; i < len; i++){
                if (data[i].label === d){
                    monarchID = data[i].id;
                    return monarchID;
                    break;
                }
            }
        }
        
        function pickUpBreadcrumb(index,groups,rect,barGroup) {
            
            lastIndex = level;
            level = index;
            superclass = parents[index];
            svg.selectAll(".tick.major").remove();
            var isFromCrumb = true;
            var parent = undefined;
            transitionSubGraph(superclass,parents,isFromCrumb);
            
            for (var i=(index+1); i <= parents.length; i++){
                d3.select(html_div).select(".bread"+i).remove();
            }
   
            svg.selectAll((".rect"+lastIndex)).transition()
                   .duration(750)
                   .attr("y", 60)
                   .style("fill-opacity", 1e-6)
                   .remove();
            
            svg.selectAll((".bar"+lastIndex)).transition()
                .duration(750)
                .attr("y", 60)
                .style("fill-opacity", 1e-6)
                .remove();
            
            parents.splice(index,(parents.length));        
            
            //Deactivate top level crumb
            if (config.useCrumbShape){
                d3.select(html_div).select(".poly"+index)
                  .attr("fill", config.color.crumb.top)
                  .on("mouseover", function(){})
                  .on("mouseout", function(){
                      d3.select(this)
                        .attr("fill", config.color.crumb.top);
                  })
                  .on("click", function(){});
                
                d3.select(html_div).select(".text"+index)
                .on("mouseover", function(){})
                .on("mouseout", function(){
                     d3.select(this.parentNode)
                     .select("polygon")
                     .attr("fill", config.color.crumb.top);
                })
                .on("click", function(){});
            } else {
                d3.select(html_div).select(".text"+index)
                  .style("fill",config.color.crumbText)
                  .on("mouseover", function(){})
                  .on("mouseout", function(){})
                  .on("click", function(){});
            }
        }
        
        function makeBreadcrumb(index,label,groups,rect,phenoDiv,fullLabel) {
            
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
                        pickUpBreadcrumb(lastIndex,groups,rect,phenoDiv);
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
                        pickUpBreadcrumb(lastIndex,groups,rect,phenoDiv);
                  });
            }
            
            if (config.useCrumbShape){
                d3.select(html_div).select(".breadcrumbs")
                  .select("svg")
                  .append("g")  
                  .attr("class",("bread"+index))
                  .attr("transform", "translate(" + index*(config.bread.offset+config.bread.space) + ", 0)");
                
                d3.select(html_div).select((".bread"+index))
                .append("svg:polygon")
                .attr("class",("poly"+index))
                .attr("points",index ? config.trailCrumbs : config.firstCr)
                .attr("fill", config.color.crumb.top);
                
            } else {
                d3.select(html_div).select(".breadcrumbs")
                .select("svg")
                .append("g")  
                .attr("class",("bread"+index))
                .attr("transform", "translate(" + index*70 + ", 0)");
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
                        }
                    }
                    for (i = 0;i < len; i++) {
                        d3.select(this).append("tspan")
                            .text(words[i])
                            .attr("font-size",fontSize)
                            .attr("x", (config.bread.width)*.45)
                            .attr("y", (config.bread.height)*.42)
                            .attr("dy", function(){
                                if (i == 0 && len == 1){
                                    return ".55em";
                                } else if (i == 0){
                                    return ".1em";
                                } else if (i < 2 && len > 2 
                                           && words[i].match(/and/i)){
                                    return ".1em";;
                                } else {
                                    return "1.2em";
                                }
                            })
                            .attr("dx", function(){
                                if (i == 0 && len == 1){
                                    return ".8em";
                                } else if (i == 0 && len >2
                                           && words[1].match(/and/i)){
                                    return "-1.2em";
                                } else if (i == 0){
                                    return ".3em";
                                } else if (i == 1 && len > 2
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
        }

        //Resize height of chart after transition
        function resizeChart(subGraph){
            
            var height = config.height;
            if (subGraph.length < 10){
                 height = subGraph.length*40;
                 if (height > config.height){
                     height = config.height;
                 }
            } else if (subGraph.length < 20){
                 height = subGraph.length*30;
                 if (height > config.height){
                     height = config.height;
                 }
            } else if (subGraph.length < 25){
                 height = subGraph.length*26;
                 if (height > config.height){
                     height = config.height;
                 }
            }
            return height;
        }
        //TODO DRY - there is quite a bit of duplicated code
        //     here from the parent drawGraph() function
        //     NOTE - this will be refactored as AJAX calls
        function transitionSubGraph(subGraph,parent,isFromCrumb) {
            
            var groups = datagraph.getGroups(subGraph);
            subGraph = datagraph.getStackedStats(subGraph,groups);
            if (!isFromCrumb){
                subGraph = datagraph.addEllipsisToLabel(subGraph,config.maxLabelSize);
            }
            var rect;
            if (parent){
                parents.push(parent);
            }
            
            height = resizeChart(subGraph);
            
            y0 = d3.scale.ordinal()
                .rangeRoundBands([0,height], .1);
            
            yAxis = d3.svg.axis()
                .scale(y0)
                .orient("left");

            y0.domain(subGraph.map(function(d) { return d.label; }));
            y1.domain(groups).rangeRoundBands([0, y0.rangeBand()]);
            
            var xGroupMax = datagraph.getGroupMax(subGraph);
            var xStackMax = datagraph.getStackMax(subGraph);
            var yMax = datagraph.getYMax(subGraph);
            
            //Dynamically decrease font size for large labels
            var confList = datagraph.adjustYAxisElements(yMax,subGraph.length);
            var yFont = confList[0];
            var yLabelPos = confList[1];
            var triangleDim = confList[2];

            
            var yTransition = svg.transition().duration(1000);
            yTransition.select(".y.axis").call(yAxis);
            
            svg.select(".y.axis")
                .selectAll("text")
                .filter(function(d){ return typeof(d) == "string"; })
                .attr("font-size", yFont)
                .on("mouseover", function(d){
                    if (config.isYLabelURL){
                        d3.select(this).style("cursor", "pointer");
                        d3.select(this).style("fill", config.color.yLabel.hover);
                        d3.select(this).style("text-decoration", "underline");
                    }
                    if (/\.\.\./.test(d)){
                        var fullLabel = datagraph.getFullLabel(d,subGraph);
                        d3.select(this).append("svg:title")
                        .text(fullLabel);  
                    } else if (yFont < 12) {//HARDCODE alert
                    d3.select(this).append("svg:title")
                    .text(d);
                    }
                })
                .on("mouseout", function(){
                    d3.select(this).style("fill", config.color.yLabel.fill );
                    d3.select(this).style("text-decoration", "none");
                })
                .on("click", function(d){
                    if (config.isYLabelURL){
                        d3.select(this).style("cursor", "pointer");
                        var monarchID = getGroupID(d,subGraph);
                        document.location.href = config.yLabelBaseURL + monarchID;
                    }
                })
                .style("text-anchor", "end")
                .attr("dx", yLabelPos);
            
            var barGroup = svg.selectAll(".barGroup")
                .data(subGraph)
                .enter().append("svg:g")
                .attr("class", ("bar"+level))
                .attr("transform", function(d) { return "translate(0," + y0(d.label) + ")"; });

            if ($('input[name=mode]:checked').val()=== 'grouped' || groups.length == 1) {
                      
                x.domain([0, xGroupMax]);
            
                var xTransition = svg.transition().duration(1000);
                    xTransition.select(".x.axis")
                    .call(xAxis);
            
                rect = barGroup.selectAll("g")
                    .data(function(d) { return d.counts; })
                    .enter().append("rect")
                    .attr("class",("rect"+level))
                    .attr("height", y1.rangeBand())
                    .attr("y", function(d) { return y1(d.name); })
                    .attr("x", function(){if (config.isChrome) {return 1;}else{ return 0;}})
                    .attr("width", function(d) { return x(d.value); })
                    .on("mouseover", function(d){
                         d3.select(this)
                          .style("fill",config.color.bar.fill);
                         
                         var coords = d3.transform(d3.select(this.parentNode).attr("transform")).translate;
                         var w = coords[0];
                         var h = coords[1];
                         var heightOffset = this.getBBox().y;
                         var widthOffset = this.getBBox().width;
                        
                         tooltip.style("display", "block")
                         .html("Counts: "+"<span style='font-weight:bold'>"+d.value+"</span>"+"<br/>"
                              +"Organism: "+ "<span style='font-weight:bold'>"+d.name)
                         .style("top",h+heightOffset+config.barOffset.grouped.height+"px")
                         .style("left",w+config.barOffset.grouped.width+widthOffset+conf.margin.left+"px");
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
                    .call(xAxis);
                    
                rect = barGroup.selectAll("g")
                    .data(function(d) { return d.counts; })
                    .enter().append("rect")
                    .attr("class",("rect"+level))
                    .attr("x", function(d){
                        if (d.x0 == 0){
                            if (config.isChrome){return 1;}
                            else {return d.x0;}
                        } else { 
                            return x(d.x0);
                        }
                    })
                    .attr("width", function(d) { return x(d.x1) - x(d.x0); })
                    .attr("height", y0.rangeBand())
                    .attr("y", function(d) { return y1(d.name); })
                    .on("mouseover", function(d){
                       d3.select(this)
                       .style("fill", config.color.bar.fill);
                   
                       
                        var coords = d3.transform(d3.select(this.parentNode).attr("transform")).translate;
                        var w = coords[0];
                        var h = coords[1];
                        var heightOffset = this.getBBox().y;
                        var widthOffset = this.getBBox().width;
                           
                        tooltip.style("display", "block")
                            .html("Counts: "+"<span style='font-weight:bold'>"+d.value+"</span>"+"<br/>"
                                 +"Organism: "+ "<span style='font-weight:bold'>"+d.name)
                            .style("top",h+heightOffset+config.barOffset.stacked.height+"px")
                            .style("left",w+config.barOffset.grouped.width+widthOffset+conf.margin.left+"px");

                 })
                .on("mouseout", function(){
                    d3.select(this)
                    .style("fill", function(d) { return color(d.name); });
                    tooltip.style("display", "none");
                })
                .style("fill", function(d) { return color(d.name); });
            }
            
            var navigate = svg.selectAll(".y.axis");
            var isSubClass = makeNavArrow(subGraph,navigate,triangleDim,barGroup,rect);
               
            if (!isSubClass){
                svg.selectAll("polygon.arr").remove();
                svg.select(".y.axis")
                    .selectAll("text")
                    .attr("dx","0")
                    .on("mouseover", function(d){
                           d3.select(this).style("cursor", "pointer");
                           d3.select(this).style("fill",config.color.yLabel.hover);
                           d3.select(this).style("text-decoration", "underline");                       
                     });
            }
            
            d3.select(html_div).selectAll("input").on("change", change);

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
                    .attr("x", function(){if (config.isChrome) {return 1;}else{ return 0;}})
                    .attr("width", function(d) { return x(d.value); })     
                    
                  rect.on("mouseover", function(d){
                      
                      d3.select(this)
                      .style("fill", config.color.bar.fill);
                         
                      var coords = d3.transform(d3.select(this.parentNode).attr("transform")).translate;
                      var w = coords[0];
                      var h = coords[1];
                      var heightOffset = this.getBBox().y;
                      var widthOffset = this.getBBox().width;
                       
                      tooltip.style("display", "block")
                          .html("Counts: "+"<span style='font-weight:bold'>"+d.value+"</span>"+"<br/>"
                            +"Organism: "+ "<span style='font-weight:bold'>"+d.name)
                          .style("top",h+heightOffset+config.barOffset.grouped.height+"px")
                          .style("left",w+config.barOffset.grouped.width+widthOffset+conf.margin.left+"px");
                     })
                     .on("mouseout", function(){
                         tooltip.style("display", "none")
                         d3.select(this)
                         .style("fill", function(d) { return color(d.name); });
                     })
              } else {
                  x.domain([0, xStackMax]);
                  y1.domain(groups).rangeRoundBands([0,0]);
                    
                  var t = svg.transition().duration(750);
                  t.select(".x.axis").call(xAxis);
                    
                  rect.transition()
                    .duration(500)
                    .delay(function(d, i) { return i * 10; })
                    .attr("x", function(d){
                        if (d.x0 == 0){
                            if (config.isChrome){return 1;}
                            else {return d.x0;}
                        } else { 
                            return x(d.x0);
                        }
                    })
                    .attr("width", function(d) { return x(d.x1) - x(d.x0); })
                    .transition()
                    .attr("height", y0.rangeBand())
                    .attr("y", function(d) { return y1(d.name); })
                    
                   rect.on("mouseover", function(d){
                       
                       d3.select(this)
                       .style("fill", config.color.bar.fill);
              
                       var coords = d3.transform(d3.select(this.parentNode).attr("transform")).translate;
                       var w = coords[0];
                       var h = coords[1];
                       var heightOffset = this.getBBox().y;
                       var widthOffset = this.getBBox().width;
                          
                       tooltip.style("display", "block")
                           .html("Counts: "+"<span style='font-weight:bold'>"+d.value+"</span>"+"<br/>"
                                +"Organism: "+ "<span style='font-weight:bold'>"+d.name)
                           .style("top",h+heightOffset+config.barOffset.stacked.height+"px")
                           .style("left",w+config.barOffset.grouped.width+widthOffset+conf.margin.left+"px");
                    })
                   .on("mouseout", function(){
                       tooltip.style("display", "none");
                       d3.select(this)
                       .style("fill", function(d) { return color(d.name); });
                   })
              }
            }
        }        
    //});
}
//datagraph default configurations
bbop.monarch.datagraph.prototype.setNonConfigurableParameters = function(){
    
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
    this.config.bcHeight = 35;
    
    //Y axis positioning when arrow present
    if (this.config.yOffset == null || typeof this.config.yOffset == 'undefined'){
        this.config.yOffset = "-1.48em";
    }
    
    //Tooltip offsetting
    this.config.arrowOffset = {height: 94, width: -90};
    this.config.barOffset = {
                 grouped:{
                    height: 110,
                    width: 10
                  },
                  stacked:{
                    height: 95,
                    width: 10
                  }
    };
    
    //Check browser
    this.config.isOpera = (!!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0);
    this.config.isChrome = (!!window.chrome && !(!!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0));
    
    //Check that breadcrumb width is valid
    if (this.config.bcWidth > this.config.width+this.config.margin.right+this.config.margin.left){
        this.config.bcWidth = this.config.width+this.config.margin.right+this.config.margin.left-140;
    }
}

bbop.monarch.datagraph.prototype.getDefaultConfig = function(){
    
    var defaultConfiguration = {
            
            //Chart margins    
            margin : {top: 40, right: 140, bottom: 5, left: 255},
            
            width : 375,
            height : 400,
            
            //X Axis Label
            xAxisLabel : "Some Metric",
            xLabelFontSize : "14px",
            xFontSize : "14px",
            xAxisPos : "20em",
            
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
}