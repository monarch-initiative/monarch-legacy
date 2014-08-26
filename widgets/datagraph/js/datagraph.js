var datagraph = {
  //Chart margins	
  margin : {top: 40, right: 80, bottom: 200, left: 320},
  width : 400,
  height : 580,
  
  //Tooltip offsets
  arrowOffset : {height: 50, width: 180},
  barOffset : {grouped:40, stacked:61},
  
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
  
  //Check browser
  isOpera : (!!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0),
  isChrome : (!!window.chrome && !isOpera),
  
  //X Axis Label
  xAxisLabel : "Number Of Annotations",
  
  title : "Phenotype Annotation Distribution",
  firstCrumb : "Phenotypic Abnormality",
  
  //Colors set in the order they appear in the JSON object
  COL : { 
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
  init : function (html_div,DATA){
	  
	var conf = this;
	
	//Create html structure
	//Add graph element
	$(html_div).append( "<div id=graph></div>" );
	//Add graph title
	$("#graph").append( "<div class=title>"+this.title+"</div>" );
	$("#graph").append( "<div class=interaction></div>" );
	$(".interaction").append( "<li></li>" );
	$(".interaction li").append("<div class=breadcrumbs></div>");
	
	
    //D3 starts here
    //Define scales
	var y0 = d3.scale.ordinal()
	    .rangeRoundBands([0,this.height], .1);

	var y1 = d3.scale.ordinal();

	var x = d3.scale.linear()
	    .range([0, this.width]);
    
	//Bar colors
	var color = d3.scale.ordinal()
	    .range([this.COL.first,this.COL.second,this.COL.third,
	            this.COL.fourth,this.COL.fifth,this.COL.sixth]);

	var xAxis = d3.svg.axis()
	    .scale(x)
	    .orient("top")
	    .tickFormat(d3.format(".2s"));

	var yAxis = d3.svg.axis()
	    .scale(y0)
	    .orient("left");

	var svg = d3.select("#graph").append("svg")
	    .attr("width", this.width + this.margin.left + this.margin.right)
	    .attr("height", this.height + this.margin.top + this.margin.bottom)
	    .append("g")
	    .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
	
	
	var crumbSVG = d3.select(".breadcrumbs")
        .append("svg")
        .attr("height",this.bcHeight)
        .attr("width",this.bcWidth);

	var tooltip = d3.select(html_div)
	    .append("div")
	    .attr("class", "bartip");
	
	//set X Axis limit for grouped configuration
	function getGroupMax(data){
		return d3.max(data, function(d) { 
            return d3.max(d.counts, function(d) { return d.value; });
        });
	}
	//set X Axis limit for stacked configuration
	function getStackMax(data){
		return d3.max(data, function(d) { 
	    	return d3.max(d.counts, function(d) { return d.x1; });
	    });
	}
	//get largest Y axis label for font resizing
	function getYMax(data){
		return d3.max(data, function(d) { 
	    	return d.phenotype.length;
	    });
	}
	
	function drawGraph (config) {

	    d3.json(DATA,function(error, json) {

	    var data = json.dataGraph;
	    var groups = getGroups(data);
	    
	    //Add stacked/grouped form if more than one group
	    if (groups.length >1){
	    	$(".interaction li").append(" <form class=configure>" +
			        "<label><input id=\"group\" type=\"radio\" name=\"mode\"" +
			            " value=\"grouped\" checked> Grouped</label> " +
					"<label><input id=\"stack\" type=\"radio\" name=\"mode\"" +
					    " value=\"stacked\"> Stacked</label>" +
				"</form> ");
	    }
	    
	    var parents = [];
		var level = 0;  //breadcrumb counter
	    
	    y0.domain(data.map(function(d) { return d.phenotype; }));
	    y1.domain(groups).rangeRoundBands([0, y0.rangeBand()]);
	    
	    var xGroupMax = getGroupMax(data);
        var xStackMax = getStackMax(data);
        var yMax = getYMax(data);
        
        x.domain([0, xGroupMax]);
        
        //Dynamically decrease font size for large labels
        var yFont = 'default';
        var yLabelPos = config.yOffset;
        var triangleDim = config.arrowDim;
	    var confList = getYFontSize(yMax);
	    yFont = confList[0];
	    yLabelPos = confList[1];
	    triangleDim = confList[2];
	    
	    
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

	    var yTicks = svg.append("g")
	        .attr("class", "y axis")
	        .call(yAxis)
	        .selectAll("text")
	        .filter(function(d){ return typeof(d) == "string"; })
	        .attr("font-size", yFont)
            .style("cursor", "pointer")
            .on("mouseover", function(d){
	            d3.select(this).style("fill", config.COL.yLabel.hover);
	            d3.select(this).style("text-decoration", "underline");
	        })
	        .on("mouseout", function(){
	            d3.select(this).style("fill", config.COL.yLabel.fill );
	            d3.select(this).style("text-decoration", "none");
	            tooltip.style("display", "none");
	         })
            .on("click", function(d){
        	    var monarchID = getPhenotype(d,data);
                document.location.href = "/phenotype/" + monarchID;
             })
	        .style("text-anchor", "end")
	        .attr("dx", yLabelPos);
	    
       var navigate = svg.selectAll(".y.axis");
       
       var arrow = navigate.selectAll(".tick.major")
            .data(data)
            .append("svg:polygon")
	        .attr("points",triangleDim)
		    .attr("fill", config.COL.arrow.fill)  
		    .on("mouseover", function(d){
			           
			       if (d.subGraph && d.subGraph[0]){
			        	   
			           d3.select(this)
				       .style("fill", config.COL.arrow.hover);
			           
			           var w = this.getBBox().width;
			           var coords = d3.transform(d3.select(this.parentNode).attr("transform")).translate;
			           var h = coords[1];
			           var heightOffset = this.getBBox().y;
			           
			           tooltip.style("display", "block")
			           .html("Click to see subclasses")
			           .style("top",h+config.margin.bottom+heightOffset-config.margin.top-config.arrowOffset.height+"px")
			           .style("left",config.width+w-config.arrowOffset.width+"px");
			           
			       } 
			})
			.on("mouseout", function(){
			    d3.select(this)
			        .style("fill",config.COL.arrow.fill);
			    tooltip.style("display", "none");
			 })
            .on("click", function(d){
	        	   if (d.subGraph && d.subGraph[0]){
	        		   
	        		   tooltip.style("display", "none");
                       svg.selectAll(".tick.major").remove();
	        		   level++;
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

	        		   makeBreadcrumb(level,d.phenotype,groups,rect,phenotype);
	        	   }
	       });
         
	    var phenotype = svg.selectAll(".phenotype")
	        .data(data)
	        .enter().append("svg:g")
	        .attr("class", ("bar"+level))
	      	.attr("transform", function(d) { return "translate(0," + y0(d.phenotype) + ")"; });

	    var rect = phenotype.selectAll("rect")
	       .data(function(d) { return d.counts; })
	       .enter().append("rect")
	       .attr("class",("rect"+level))
	       .attr("height", y1.rangeBand())
	       .attr("y", function(d) { return y1(d.name); })
	       .attr("x", function(){if (config.isChrome) {return 1;}else{ return 0;}})
	       .attr("width", function(d) { return x(d.value); })
	       .on("mouseover", function(d){
	           d3.select(this)
	           .style("fill", config.COL.bar.fill);
	           
	           var w = this.getBBox().width;
	           var coords = d3.transform(d3.select(this.parentNode).attr("transform")).translate;
	           var h = coords[1];
	           var heightOffset = this.getBBox().y;
	           
	           tooltip.style("display", "block")
	           .html("Counts: "+"<span style='font-weight:bold'>"+d.value+"</span>"+"<br/>"
	        		+"Organism: "+ "<span style='font-weight:bold'>"+d.name)
	           .style("top",h+config.margin.bottom+heightOffset-config.margin.top-config.barOffset.grouped+"px")
	           .style("left",config.width+w-70+"px");

	        })
	       .on("mouseout", function(){
	           d3.select(this)
	           .style("fill", function(d) { return color(d.name); });
	           
	           tooltip.style("display", "none");
	        })
	       .style("fill", function(d) { return color(d.name); });
	    
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
	    
	    //Make first breadcrumb
	    makeBreadcrumb(level,config.firstCrumb,groups,rect,phenotype);
	    
	    d3.selectAll("input").on("change", change);
	    
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
	 	         
	 	        var w = this.getBBox().width;
                var coords = d3.transform(d3.select(this.parentNode).attr("transform")).translate;
                var h = coords[1];
	            var heightOffset = this.getBBox().y;
	 		           
                tooltip.style("display", "block")
                .html("Counts: "+"<span style='font-weight:bold'>"+d.value+"</span>"+"<br/>"
	        		+"Organism: "+ "<span style='font-weight:bold'>"+d.name)
                .style("top",h+config.margin.bottom+heightOffset-config.margin.top-config.barOffset.grouped+"px")
                .style("left",config.width+w-70+"px");
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
		           
		           var w = this.getBBox().width;
		           var coords = d3.transform(d3.select(this.parentNode).attr("transform")).translate;
		           var h = coords[1];
		           var heightOffset = this.getBBox().y;
		           
		           tooltip.style("display", "block")
		           .html("Counts: "+"<span style='font-weight:bold'>"+d.value+"</span>"+"<br/>"
	        		+"Organism: "+ "<span style='font-weight:bold'>"+d.name)
		           .style("top",h+config.margin.bottom-config.margin.top+heightOffset-config.barOffset.stacked+"px")
		           .style("left",config.width+w-100+"px");

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
		
		function pickUpBreadcrumb(index,groups,rect,phenotype) {
			
			lastIndex = level;
			level = index;
	        superclass = parents[index];
    	    svg.selectAll(".tick.major").remove();
	        transitionSubGraph(superclass,groups);
	        
	        for (var i=(index+1); i <= parents.length; i++){
	  	        d3.select(".bread"+i).remove();
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
		    d3.select(".poly"+index)
			  .attr("fill", config.COL.crumb.top)
			  .on("mouseover", function(){})
		      .on("mouseout", function(){
                 d3.select(this)
                 .attr("fill", config.COL.crumb.top);
		      })
		      .on("click", function(){});
			
			d3.select(".text"+index)
			  .on("mouseover", function(){})
			  .on("mouseout", function(){
		           d3.select(this.parentNode)
		           .select("polygon")
	               .attr("fill", config.COL.crumb.top);
			  })
			  .on("click", function(){});
	    }
		
		function makeBreadcrumb(index,phenotype,groups,rect,phenoDiv) {
			
			if (!phenotype){
				phenotype = config.firstCrumb;
			}
			var lastIndex = (index-1);
			var phenLen = phenotype.length;
			var fontSize = config.bread.font;

			//Change color of previous crumb
			if (lastIndex > -1){
				d3.select(".poly"+lastIndex)
				  .attr("fill", config.COL.crumb.bottom)
				  .on("mouseover", function(){
	                  d3.select(this)
	                  .attr("fill", config.COL.crumb.hover);
			      })
			      .on("mouseout", function(){
	                  d3.select(this)
	                  .attr("fill", config.COL.crumb.bottom);
			      })
			      .on("click", function(){
			          pickUpBreadcrumb(lastIndex,groups,rect,phenoDiv);
				  });
				
				d3.select(".text"+lastIndex)
				  .on("mouseover", function(){
		               d3.select(this.parentNode)
		               .select("polygon")
		               .attr("fill", config.COL.crumb.hover);
				  })
				  .on("mouseout", function(){
			           d3.select(this.parentNode)
			           .select("polygon")
		               .attr("fill", config.COL.crumb.bottom);
				  })
				  .on("click", function(){
				        pickUpBreadcrumb(lastIndex,groups,rect,phenoDiv);
				  });
			}
			
            d3.select(".breadcrumbs")
		        .select("svg")
		        .append("g")  
		        .attr("class",("bread"+index))
		        .attr("transform", "translate(" + index*(config.bread.offset+config.bread.space) + ", 0)")
		        .append("svg:polygon")
		        .attr("class",("poly"+index))
	            .attr("points",index ? config.trailCrumbs : config.firstCr)
			    .attr("fill", config.COL.crumb.top);
            
            d3.select((".bread"+index))
            		.append("svg:title")
    				.text(phenotype);	
		
		    d3.select((".bread"+index))
		        .append("text")
		        .attr("class",("text"+index))
		        .attr("font-size", fontSize)
		        .each(function () {
		        	var words = phenotype.split(/\s|\/|\-/);
		        	var len = words.length;
		        	if (len > 2 && !phenotype.match(/head and neck/i)){
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
		
        function getYFontSize(yMax) {
        	//Dynamically decrease font size for large labels

    	    var yFont = 'default';
    	    var yOffset = config.yOffset;
    	    var arrowDim = config.arrowDim;
    	    
            if (yMax > 42 && yMax < 53){
        		yFont = ((1/yMax)*570);
            } else if (yMax >= 53 && yMax <66){
            	yFont = ((1/yMax)*620);
            	yOffset = "-1.55em";
            	arrowDim = "-20,-5, -9,1 -20,7";
            } else if (yMax >= 66){
            	yFont = ((1/yMax)*640);
            	yOffset = "-1.4em";
            	arrowDim = "-20,-5, -9,1 -20,7";
            }
            var retList = [yFont,yOffset,arrowDim];
            return retList; 	
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
		
	    function transitionSubGraph(subGraph,groups,parent) {
	    		    	
		    var isSubClass;
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

		    y0.domain(subGraph.map(function(d) { return d.phenotype; }));
		    y1.domain(groups).rangeRoundBands([0, y0.rangeBand()]);
		    
		    var xGroupMax = getGroupMax(subGraph);
	        var xStackMax = getStackMax(subGraph);
	        var yMax = getYMax(subGraph);
		    
	        //Dynamically decrease font size for large labels
	        var yFont = 'default';
	        var yLabelPos = config.yOffset;
	        var triangleDim = config.arrowDim;
		    var confList = getYFontSize(yMax);
		    yFont = confList[0];
		    yLabelPos = confList[1];
		    triangleDim = confList[2];
		    
		    var yTransition = svg.transition().duration(1000);
		    yTransition.select(".y.axis").call(yAxis);
		    
		    svg.select(".y.axis")
		        .selectAll("text")
		        .filter(function(d){ return typeof(d) == "string"; })
		        .attr("font-size", yFont)
	            .style("cursor", "pointer")
	            .on("mouseover", function(d){
		           d3.select(this).style("fill",config.COL.yLabel.hover);
		           d3.select(this).style("text-decoration", "underline");		           
		         })
		        .on("mouseout", function(){
		           d3.select(this).style("fill",config.COL.yLabel.fill);
		           d3.select(this).style("text-decoration", "none");
		           tooltip.style("display", "none");
		        })
	            .on("click", function(d){
	            	var monarchID = getPhenotype(d,subGraph);
	                document.location.href = "/phenotype/" + monarchID;
	            })
	            .style("text-anchor", "end")
	            .attr("dx", yLabelPos);
		    
		       var navigate = svg.selectAll(".y.axis");
		       var arrow = navigate.selectAll(".tick.major")
                    .data(subGraph)
		            .append("svg:polygon")
		            .attr("class","arr")
			        .attr("points",triangleDim)
		            .attr("fill",config.COL.arrow.fill)
		            .attr("display", function(d){
		            	if (d.subGraph && d.subGraph[0]){
		            		isSubClass=1; return "initial";
		                } else {
		                	return "none";}
		            })
		            .on("mouseover", function(d){
			           
			           if (d.subGraph && d.subGraph[0]){
			        	   
			        	   d3.select(this)
				           .style("fill",config.COL.arrow.hover);
			           
			               var w = this.getBBox().width;
			               var coords = d3.transform(d3.select(this.parentNode).attr("transform")).translate;
			               var h = coords[1];
			               var heightOffset = this.getBBox().y;
			           
			               tooltip.style("display", "block")
			               .html("Click to see subclasses")
			               .style("top",h+config.margin.bottom+heightOffset-config.margin.top-config.arrowOffset.height+"px")
			               .style("left",config.width+w-config.arrowOffset.width+"px");
			           
			           } 
			        })
			       .on("mouseout", function(){
			           d3.select(this)
			           .style("fill",config.COL.arrow.fill);
			           tooltip.style("display", "none");
			        })
		            .on("click", function(d){
			        	   if (d.subGraph && d.subGraph[0]){
			        		   
			        		   tooltip.style("display", "none");
			        		   svg.selectAll(".tick.major").remove();
			        		   level++;
			        		   transitionSubGraph(d.subGraph,groups,subGraph);
			        		   
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
			        		   
			        		   makeBreadcrumb(level,d.phenotype,groups,rect,phenotype);
			        	   }
			       });
		       
		       if (!isSubClass){
		    	   svg.selectAll("polygon.arr").remove();
		    	   svg.select(".y.axis")
			           .selectAll("text")
			           .attr("dx","0")
		    	       .on("mouseover", function(d){
			               d3.select(this).style("fill",config.COL.yLabel.hover);
			               d3.select(this).style("text-decoration", "underline");			           
			         });
		       }

			    var phenotype = svg.selectAll(".phenotype")
			        .data(subGraph)
			        .enter().append("svg:g")
			        .attr("class", ("bar"+level))
			      	.attr("transform", function(d) { return "translate(0," + y0(d.phenotype) + ")"; });

		    if ($('input[name=mode]:checked').val()=== 'grouped' || groups.length == 1) {
			    	  
		        x.domain([0, xGroupMax]);
		    
		        var xTransition = svg.transition().duration(1000);
		        xTransition.select(".x.axis")
		        //.attr("transform", "translate(0," + height + ")")
		        .call(xAxis);
		    
	            rect = phenotype.selectAll("rect")
	                .data(function(d) { return d.counts; })
	                .enter().append("rect")
	                .attr("class",("rect"+level))
	                .attr("height", y1.rangeBand())
	                .attr("y", function(d) { return y1(d.name); })
	                .attr("x", function(){if (config.isChrome) {return 1;}else{ return 0;}})
	                .attr("width", function(d) { return x(d.value); })
	                .on("mouseover", function(d){
	 	                d3.select(this)
		                  .style("fill",config.COL.bar.fill);
	 	                
	 		           var w = this.getBBox().width;
	 		           var coords = d3.transform(d3.select(this.parentNode).attr("transform")).translate;
	 		           var h = coords[1];
	 		           var heightOffset = this.getBBox().y;
	 		           
	 		           tooltip.style("display", "block")
	 		           .html("Counts: "+"<span style='font-weight:bold'>"+d.value+"</span>"+"<br/>"
	        		         +"Organism: "+ "<span style='font-weight:bold'>"+d.name)
	 		           .style("top",h+config.margin.bottom+heightOffset-config.margin.top-config.barOffset.grouped+"px")
	 		           .style("left",config.width+w-70+"px");
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
				//.attr("transform", "translate(0," + height + ")")
				.call(xAxis);
				    
			    rect = phenotype.selectAll("rect")
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
		               .style("fill", config.COL.bar.fill);
		           
		               var w = this.getBBox().width;
		               var coords = d3.transform(d3.select(this.parentNode).attr("transform")).translate;
		               var h = coords[1];
		               var heightOffset = this.getBBox().y;
		           
		               tooltip.style("display", "block")
		               .html("Counts: "+"<span style='font-weight:bold'>"+d.value+"</span>"+"<br/>"
	        		    +"Organism: "+ "<span style='font-weight:bold'>"+d.name)
		               .style("top",h+config.margin.bottom-config.margin.top+heightOffset-config.barOffset.stacked+"px")
		               .style("left",config.width+w-100+"px");

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
			        .attr("x", function(){if (config.isChrome) {return 1;}else{ return 0;}})
			        .attr("width", function(d) { return x(d.value); })	 
			        
			      rect.on("mouseover", function(d){
	 	                
	 		           var w = this.getBBox().width;
	 		           var coords = d3.transform(d3.select(this.parentNode).attr("transform")).translate;
	 		           var h = coords[1];
	 		           var heightOffset = this.getBBox().y;
	 		           
	 		           tooltip.style("display", "block")
	 		           .html("Counts: "+"<span style='font-weight:bold'>"+d.value+"</span>"+"<br/>"
	        		        +"Organism: "+ "<span style='font-weight:bold'>"+d.name)
	 		           .style("top",h+config.margin.bottom+heightOffset-config.margin.top-config.barOffset.grouped+"px")
	 		           .style("left",config.width+w-70+"px");
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
		           
		           var w = this.getBBox().width;
		           var coords = d3.transform(d3.select(this.parentNode).attr("transform")).translate;
		           var h = coords[1];
		           var heightOffset = this.getBBox().y;
		           
		           tooltip.style("display", "block")
		           .html("Counts: "+"<span style='font-weight:bold'>"+d.value+"</span>"+"<br/>"
	        		+"Organism: "+ "<span style='font-weight:bold'>"+d.name)
		           .style("top",h+config.margin.bottom-config.margin.top+heightOffset-config.barOffset.stacked+"px")
		           .style("left",config.width+w-100+"px");

		           })
		           .on("mouseout", function(){
		               tooltip.style("display", "none");
		           })
		      }
		    }
		}	    
	});
  }
  drawGraph(conf);
  }
};