var datagraph = {
  //Chart margins    
  margin : {top: 40, right: 80, bottom: 30, left: 320},
  width : 400,
  height : 580,
  
  //X Axis Label
  xAxisLabel : "Number Of Annotations",
  
  //Chart title and first breadcrumb
  chartTitle : "Phenotype Annotation Distribution",
  firstCrumb : "Phenotypic Abnormality",
  
  //Title size/font settings
  title : {
            'margin-left' : '0px',
            'font-size' : '20px',
            'font-weight': 'bold'
  },
  
  //Yaxis links
  isYLabelURL : true,
  yLabelBaseURL : "/phenotype/",
  
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
           }
  },
  //Tooltip offsets
  arrowOffset : {height: 94, width: 231},
  barOffset : {
                grouped:{
                  height: 110,
                  width: 325
                },
                stacked:{
                  height: 99,
                  width: 300
                }
  },
  
  //Nav arrow (now triangle) 
  arrowDim : "-23,-6, -12,0 -23,6",
  
  //Breadcrumb dimensions
  firstCr : "0,0 0,30 90,30 105,15 90,0",
  trailCrumbs : "0,0 15,15 0,30 90,30 105,15 90,0",
  
  //breadcrumb div dimensions
  bcWidth : 560,
  bcHeight : 35,
  
  //Polygon dimensions
  bread : {width:105, height: 30, offset:90, space: 1, font:10},
  
  //Y axis positioning when arrow present
  yOffset : "-1.48em",
  
  //Turn on/off breadcrumbs
  useCrumb : false,
  
  //Turn on/off breadcrumbs
  useLegend : true,
  
  //Check browser
  isOpera : (!!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0),
  isChrome : (!!window.chrome && !(!!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0)),
  
  //set X Axis limit for grouped configuration
  getGroupMax : function(data){
      return d3.max(data, function(d) { 
          return d3.max(d.counts, function(d) { return d.value; });
      });
  },
  //set X Axis limit for stacked configuration
  getStackMax : function(data){
      return d3.max(data, function(d) { 
          return d3.max(d.counts, function(d) { return d.x1; });
      }); 
  },
  //get largest Y axis label for font resizing
  getYMax : function(data){
      return d3.max(data, function(d) { 
          return d.label.length;
      });
  },
  
  checkForSubGraphs : function(data){
      for (i = 0;i < data.length; i++) {
          if (Object.keys(data[i]).indexOf('subGraph') >= 0) {
              return true;
          } 
     }
     return false;
  },
  
  getStackedStats : function(data,groups){
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
  },
  
  //remove zero length bars
  removeZeroCounts : function(data){
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
  },
  
  // Adjust Y label font, arrow size, and spacing
  // when transitioning
  adjustYAxisElements : function(yMax,len){
      
      var h = this.height;
      var density = h/len;
      var isUpdated = false;
      
      var yFont = 'default';
      var yOffset = this.yOffset;
      var arrowDim = this.arrowDim;
      
      if (yMax > 41 && yMax < 53){
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
      
      //Check for density BETA
      /*
      if (density < 15 && !isUpdated){
          yFont = density;
          yOffset = "-1.4em";
          arrowDim = "-20,-5, -9,1 -20,7";
      }*/
      var retList = [yFont,yOffset,arrowDim];
      return retList;
  },
  
  init : function (html_div,DATA){
      
    var conf = this;
    
    //Create html structure
    //Add graph title
    $(html_div).append( "<div class=title"+
            " style=margin-left:" + conf.title['margin-left'] +
            ";font-size:" + conf.title['font-size'] +
            ";font-weight:" + conf.title['font-weight'] +
            "; >"+conf.chartTitle+"</div>" );
    $(html_div).append( "<div class=interaction></div>" );
    $(html_div+" .interaction").append( "<li></li>" );
    $(html_div+" .interaction li").append("<div class=breadcrumbs></div>");
    
    //D3 starts here
    //Define scales
    var y0 = d3.scale.ordinal()
        .rangeRoundBands([0,conf.height], .1);

    var y1 = d3.scale.ordinal();

    var x = d3.scale.linear()
        .range([0, conf.width]);
    
    //Bar colors
    var color = d3.scale.ordinal()
        .range([conf.color.first,conf.color.second,conf.color.third,
                conf.color.fourth,conf.color.fifth,conf.color.sixth]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("top")
        .tickFormat(d3.format(".2s"));

    var yAxis = d3.svg.axis()
        .scale(y0)
        .orient("left");

    var svg = d3.select(html_div).append("svg")
        .attr("width", conf.width + conf.margin.left + conf.margin.right)
        .attr("height", conf.height + conf.margin.top + conf.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + conf.margin.left + "," + conf.margin.top + ")");
    
    var crumbSVG = d3.select(html_div).select(".breadcrumbs")
        .append("svg")
        .attr("height",conf.bcHeight)
        .attr("width",conf.bcWidth);

    var tooltip = d3.select(html_div)
        .append("div")
        .attr("class", "tip");

    function drawGraph (config,data) {

        var groups = getGroups(data);
        data = config.getStackedStats(data,groups);
        config.useCrumb = config.checkForSubGraphs(data);
        
        //remove breadcrumb div
        if (!config.useCrumb){
            $(html_div+" .breadcrumbs").remove();
        }
        //Add stacked/grouped form if more than one group
        if (groups.length >1){
            $(html_div+" .interaction li").append(" <form class=configure>" +
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
        
        var xGroupMax = config.getGroupMax(data);
        var xStackMax = config.getStackMax(data);
        var yMax = config.getYMax(data);
        
        x.domain([0, xGroupMax]);
        
        //Dynamically decrease font size for large labels
        var confList = config.adjustYAxisElements(yMax,data.length);
        var yFont = confList[0];
        var yLabelPos = confList[1];
        var triangleDim = confList[2];
        
        //Set x axis ticks
        var xTicks = svg.append("g")
            .attr("class", "x axis")
            .call(xAxis)
            .append("text")
            .attr("transform", "rotate(0)")
            .attr("y", -29)
            .attr("dx", "20em")
            .attr("dy", "0em")
            .style("text-anchor", "end")
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
               .style("left",w+config.barOffset.grouped.width+widthOffset+"px");

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
                       .style("left",w+config.arrowOffset.width+"px");
                       
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
                           makeBreadcrumb(level,d.label,groups,rect,barGroup);
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
               .attr("width", 18)
               .attr("height", 18)
               .style("fill", color);

            legend.append("text")
               .attr("x", config.width+50)
               .attr("y", 12)
               .attr("dy", ".35em")
               .style("text-anchor", "end")
               .text(function(d) { return d; });
        }
        
        function getGroups(data) {
            var groups = [];
            var unique = {};
            for (var i=0, len=data.length; i<len; i++) { 
                for (var j=0, cLen=data[i].counts.length; j<cLen; j++) { 
                    unique[ data[i].counts[j].name ] =1;
                }
            }
            groups = Object.keys(unique);
            return groups;
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
                  
                var coords = d3.transform(d3.select(this.parentNode).attr("transform")).translate;
                var w = coords[0];
                var h = coords[1];
                var heightOffset = this.getBBox().y;
                var widthOffset = this.getBBox().width;
                   
                tooltip.style("display", "block")
                  .html("Counts: "+"<span style='font-weight:bold'>"+d.value+"</span>"+"<br/>"
                        +"Organism: "+ "<span style='font-weight:bold'>"+d.name)
                  .style("top",h+heightOffset+config.barOffset.grouped.height+"px")
                  .style("left",w+config.barOffset.grouped.width+widthOffset+"px");
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
                   
                var coords = d3.transform(d3.select(this.parentNode).attr("transform")).translate;
                var w = coords[0];
                var h = coords[1];
                var heightOffset = this.getBBox().y;
                var widthOffset = this.getBBox().width;
                   
                tooltip.style("display", "block")
                    .html("Counts: "+"<span style='font-weight:bold'>"+d.value+"</span>"+"<br/>"
                         +"Organism: "+ "<span style='font-weight:bold'>"+d.name)
                    .style("top",h+heightOffset+config.barOffset.stacked.height+"px")
                    .style("left",w+config.barOffset.stacked.width+widthOffset+"px");

            })
               .on("mouseout", function(){
                   tooltip.style("display", "none");
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
            transitionSubGraph(superclass);
            
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
        }
        
        function makeBreadcrumb(index,label,groups,rect,phenoDiv) {
            
            if (!label){
                label = config.firstCrumb;
            }
            var lastIndex = (index-1);
            var phenLen = label.length;
            var fontSize = config.bread.font;

            //Change color of previous crumb
            if (lastIndex > -1){
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
                
                d3.select(html_div).select(".text"+lastIndex)
                  .on("mouseover", function(){
                      d3.select(this.parentNode)
                       .select("polygon")
                       .attr("fill", config.color.crumb.hover);
                  })
                  .on("mouseout", function(){
                      d3.select(this.parentNode)
                       .select("polygon")
                       .attr("fill", config.color.crumb.bottom);
                  })
                  .on("click", function(){
                        pickUpBreadcrumb(lastIndex,groups,rect,phenoDiv);
                  });
            }
            
            d3.select(html_div).select(".breadcrumbs")
                .select("svg")
                .append("g")  
                .attr("class",("bread"+index))
                .attr("transform", "translate(" + index*(config.bread.offset+config.bread.space) + ", 0)")
                .append("svg:polygon")
                .attr("class",("poly"+index))
                .attr("points",index ? config.trailCrumbs : config.firstCr)
                .attr("fill", config.color.crumb.top);
            
            d3.select(html_div).select((".bread"+index))
                    .append("svg:title")
                    .text(label);    
        
            d3.select(html_div).select((".bread"+index))
                .append("text")
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
                                    return "0";
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
        function transitionSubGraph(subGraph,parent) {
            
            var groups = getGroups(subGraph);
            subGraph = config.getStackedStats(subGraph,groups);
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
            
            var xGroupMax = config.getGroupMax(subGraph);
            var xStackMax = config.getStackMax(subGraph);
            var yMax = config.getYMax(subGraph);
            
            //Dynamically decrease font size for large labels
            var confList = config.adjustYAxisElements(yMax,subGraph.length);
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
                         .style("left",w+config.barOffset.grouped.width+widthOffset+"px");
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
                            .style("left",w+config.barOffset.stacked.width+widthOffset+"px");

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
                         
                      var coords = d3.transform(d3.select(this.parentNode).attr("transform")).translate;
                      var w = coords[0];
                      var h = coords[1];
                      var heightOffset = this.getBBox().y;
                      var widthOffset = this.getBBox().width;
                       
                      tooltip.style("display", "block")
                          .html("Counts: "+"<span style='font-weight:bold'>"+d.value+"</span>"+"<br/>"
                            +"Organism: "+ "<span style='font-weight:bold'>"+d.name)
                          .style("top",h+heightOffset+config.barOffset.grouped.height+"px")
                          .style("left",w+config.barOffset.grouped.width+widthOffset+"px");
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
              
                       var coords = d3.transform(d3.select(this.parentNode).attr("transform")).translate;
                       var w = coords[0];
                       var h = coords[1];
                       var heightOffset = this.getBBox().y;
                       var widthOffset = this.getBBox().width;
                          
                       tooltip.style("display", "block")
                           .html("Counts: "+"<span style='font-weight:bold'>"+d.value+"</span>"+"<br/>"
                                +"Organism: "+ "<span style='font-weight:bold'>"+d.name)
                           .style("top",h+heightOffset+config.barOffset.stacked.height+"px")
                           .style("left",w+config.barOffset.stacked.width+widthOffset+"px");
                    })
                   .on("mouseout", function(){
                       tooltip.style("display", "none");
                   })
              }
            }
        }        
    //});
  }
  //Call function to draw graph
  drawGraph(conf,DATA);
  }
};