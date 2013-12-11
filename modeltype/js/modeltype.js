/**
 *
 * modeltype - 

 * TO USE:
 * create an instance of the widget on your page like this:
 * 
 * 		modeltype.init(html_div, data);
 *  where: 
 *         -html_div is the location on the page where you want the widget to appear
 *  
 *  	   -data is an array of the phenotype and model information.  Each record of the array should
 *            contain the following information in a Javascript object:
 *  {
      "id":"HP_0000716_MP_0001413_MGI_006446",
      "label_a":"Depression",
      "id_a":"HP:0000716",
      "subsumer_label":"Abnormal emotion/affect behavior",
      "subsumer_id":"HP:0100851",
      "value":5.667960271407814,
      "label_b":"abnormal response to new environment",
      "id_b":"MP:0001413",
      "model_id":"MGI_006446",
      "model_label":"B10.Cg-H2<sup>h4</sup>Sh3pxd2b<sup>nee</sup>/GrsrJ",
      "rowid":"HP_0000716_HP_0100851"
   },


NOTE: I probably need a model_url to access the model info on the screen.  Alternatively I can load the data
as a separate call in the init function.
 */
var modeltype = function () {

    var col_starting_pos = 50, text_width = 150, clicked_data = undefined, xScale = undefined, text_length = 32;
    var svg;
    var model_data = [], filtered_model_data = [];
    var dimensions = [ "Human Phenotype", "Lowest Common Subsumer", "Mammalian Phenotype" ];
    var m = [ 30, 10, 10, 10 ], w = 1000 - m[1] - m[3], h = 1300 - m[0] - m[2];

    var yoffset = 100;
    //temporary
    //var model_list = ["MGI_2182936", "MGI_3654636", "MGI_3758030", "MGI_3758072", "MGI_4421411", "MGI_5440841", "MGI_5441517", "Model_2", "Model_3"];
    var model_list = [];
    var model_width;

    function getModelList() {
    	var unique_model_id = [];
    	model_list = [];
    	for (var t_idx = 0;t_idx < model_data.length; t_idx++) {
    		if (unique_model_id.indexOf(model_data[t_idx].model_id) == -1)
    		{
    			model_list.push({model_id: model_data[t_idx].model_id, model_label: model_data[t_idx].model_label});
    			unique_model_id.push(model_data[t_idx].model_id);
    		}
    	} 
    }
    
    function createColorScale() {
    	var temp_array = filtered_model_data.map(function(d) {
    		return d.value;
    	});
    	color_scale = d3.scale.linear().domain([d3.min(temp_array), d3.max(temp_array)]).range([d3.rgb("#e5e5e5"), d3.rgb("#44a293")]);
 
    }


    function initCanvas(imageDiv) {

        imageDiv.append("<svg id='svg_area'></svg>");
        svg = d3.select("#svg_area");

    }
    
    //walk through the data array and extract a list of the
    //models: {model_id, model_label}
    function extractModelList(data_array) {
    	
    }
    
    function resetLinks() {
    	var link_lines = d3.selectAll(".data_text");
    	link_lines.style("font-weight", "normal");
    }

    function selectData(curr_data) {
    	resetLinks();
    	var alabels = svg.selectAll("text.a_text." + getConceptId(curr_data.id));
    	alabels.text(curr_data.label_a);

    	var sublabels = svg.selectAll("text.lcs_text." + getConceptId(curr_data.id) + ", ." + getConceptId(curr_data.subsumer_id));
    	sublabels.text(curr_data.subsumer_label);
    	var all_links = svg.selectAll("." + getConceptId(curr_data.id) + ", ." + getConceptId(curr_data.subsumer_id));
    	//all_links.style("opacity", "1.0");
    	//all_links.style("stroke", d3.rgb("#ea763b"));
    	all_links.style("font-weight", "bold");
    }

    function deselectData(curr_data) {
    	resetLinks();
    	var alabels = svg.selectAll("text.a_text." + getConceptId(curr_data.id));
    	alabels.text(getShortLabel(curr_data.label_a));

    	var sublabels = svg.selectAll("text.lcs_text." + getConceptId(curr_data.id));
    	sublabels.text(getShortLabel(curr_data.subsumer_label));
        //var all_links = svg.selectAll("." + getConceptId(curr_data.id));
    	//all_links.style("opacity", "1.0");
    	//all_links.style("stroke", d3.rgb("#ea763b"));
    	//all_links.style("font-weight", "bold");
    }

    function updateClass(obj, classname) {
    	obj.addClass(classname);
    }

  //return a label for use in the list.  This label is shortened
  //to fit within the space in the column
  function getShortLabel(label, newlength) {
    var retLabel = label;
    if (!newlength) {
    	newlength = text_length;
    }
    if (label.length > newlength) {
  	  retLabel = label.substring(0,newlength-3) + "...";
    }	
    return retLabel;
  }

  //return a useful label to use for visualizing the rectangles
  function getCleanLabel(uri, label) {
  	if (label && label != "" && label != "null") {
  		return label;
  	} 
      var temp = getConceptId(uri);
      return temp;
  }

  //This method extracts the unique id from a given URI
  //for example, http://www.berkeleybop.org/obo/HP:0003791 would return HP:0003791
  //Why?  Two reasons.  First it's useful to note that d3.js doesn't like to use URI's as ids.
  //Second, I like to use unique ids for CSS classes.  This allows me to selectively manipulate related groups of items on the
  //screen based their relationship to a common concept (ex: HP000123).  However, I can't use a URI as a class.
  function getConceptId(uri) {
	  if (!uri) {
		  return "";
	  }
  	var startpos = uri.lastIndexOf("/");
  	var len = uri.length;
  	//remove the last > if there is one
  	var endpos = uri.indexOf(">") == len-1 ? len-1 : len;
  	var retString =  uri + "";
  	if (startpos != -1) {
  		retString = uri.substring(startpos+1,endpos);
  	}
  	//replace spaces with underscores.  Classes are separated with spaces so
  	//a class called "Model 1" will be two classes: Model and 1.  Convert this to "Model_1" to avoid this problem.
  	retString = retString.replace(" ", "_");
  	retString = retString.replace(":", "_");
  	return retString;
  }

    
    var convertLabelHTML = function (t, d) {
    		
    		var width = 100;
    		var el = d3.select(t);
    	    var p = d3.select(t.parentNode);
    	    p.append("foreignObject")
    	        .attr('x', t.getAttribute("x")+15)
    	        .attr('y', t.getAttribute("y")-13)
    	       // .attr('dx', t.dx)
    	       // .attr('dy', t.dy)
    	        .attr("width", width)
    	        .attr("height", 200)
    	        .attr("transform", function(d) {
    	        	return "rotate(-45)" 
    	         })
    	      .append("xhtml:p")

    	        //.attr('style','word-wrap: break-word; text-align:center;')
    	        .html(d);    

    	    el.remove();

    };


  //NOTE: I need to find a way to either add the model class to the phenotypes when they load OR
  //select the rect objects related to the model and append the class to them.
  //something like this: $( "p" ).addClass( "myClass yourClass" );
  function createModelRects() {
  	var model_rects = svg.selectAll(".models")
      	.data(filtered_model_data, function(d) {
      		return d.id;
      	});
  	model_rects.enter()
  		.append("rect")
  		.attr("transform",
  			"translate(210,20)")
  			//"translate(210," + yoffset + ")")
  	    .attr("class", function(d) { 
  	    	//append the model id to all related items
  	    	if (d.value > 0) {
  		    	var bla = svg.selectAll(".data_text." + getConceptId(d.id));	    	
  		    	bla.classed(getConceptId(d.model_id), true);
  	    	}
  	    	return "models " + " " +  getConceptId(d.model_id) + " " +  getConceptId(d.id);
  	    })
  	    .attr("y", function(d, i) {     	
  			return y_scale(d.id);
  	    })
  	    .attr("x", function(d) { return xScale(d.model_id);})
  	    .attr("width", 10)
  	    .attr("height", 10)
  	    .attr("rx", "3")
  	    .attr("ry", "3")

  	    .attr("fill", function(d, i) {
  	  	  return color_scale(d.value);
  	    });
  	model_rects.transition()
      .delay(1000)
  	.attr("y", function(d) {
  		return y_scale(d.id);
  	})
  	model_rects.exit().transition()
        .duration(1000)
        .attr("x", 600)
        .style('opacity', '0.0')
  	  .remove();


  }

    function updateAxes() {
    	//h= 500;
    	h = (filtered_model_data.length*2.5);
    	svg.selectAll("yaxis").remove();
    	y_scale = d3.scale.ordinal()
        	.domain(filtered_model_data.map(function (d) {return d.rowid; }))
        	
    	    .range([0,filtered_model_data.length])
    	    .rangePoints([ yoffset, yoffset+h ]);
//    	    .rangeBands([ 0, h ]);
    	y_axis = d3.svg.axis()
    	  //.tickSize(5,0,0).ticks(15)
    	  .orient("left")
    	  .scale(y_scale);
 //   	svg.attr("height", h);
    	//svg.selectAll("yaxis")
    	   svg.append("g")
    	       .attr("class", "yaxis")
    	       .attr("transform", "translate(550," + yoffset + ")");
//    	       .call(y_axis);
    	   /*
    	       		    .selectAll("text")  
    		        .style("text-anchor", "end")
    		        .style("font-size", "12pt");*/
    /*
     * .tickSize(-HEIGHT,0,0).ticks(15)
     * 
     * 
     * 	
     * 		    .selectAll("text")  
    		        .style("text-anchor", "end")
    		        .style("font-size", "8pt")

    	var model_region = svg.append("g").attr("transform",
    	"translate(210,44)")
    	.call(model_x_axis)
    	.attr("class", "axes")
    */
    	
        //update accent boxes
    	svg.selectAll("#rect.accent").attr("height", h);


    }

	function createAccentBoxes() {
		var axis_pos_list = [];
		model_width = model_list.length * 18
		//add an axis for each ordinal scale found in the data
		for (var i=0;i<dimensions.length;i++)
		{ 
			if (i == 2) {
				axis_pos_list.push((text_width + 10) + col_starting_pos + model_width);
			} else {
				axis_pos_list.push((i*(text_width + 10)) + col_starting_pos);
			}
		}
	
	    //create accent boxes
		var rect_accents = svg.selectAll("#rect.accent")
		      .data(dimensions, function(d) { return d;});
	    rect_accents.enter()
	    	.append("rect")
		      .attr("class", "accent")
		      .attr("x", function(d, i) { return axis_pos_list[i];})
		      .attr("y", yoffset)
		      .attr("width", text_width + 5)
		      .attr("height", h)
		      .style("opacity", '0.4')
		      .attr("fill", function(d, i) {
		    	  return i != 1 ? d3.rgb("#e5e5e5") : "white";
		      });
	}
    
	function createModelRegion() {
		//model_x_axis = undefined;
		xScale = d3.scale.ordinal()
	    .domain(model_list.map(function (d) {return d.model_id; }))
	                    .rangeRoundBands([0,model_width]);
		model_x_axis = d3.svg.axis().scale(xScale).orient("top");
		var model_region = svg.append("g").attr("transform",
				"translate(210," + yoffset + ")")
				.call(model_x_axis)
				.attr("class", "axes")
				//this be some voodoo...
				//to rotate the text, I need to select it as it was added by the axis
			    .selectAll("text") 
			       .each(function(d,i) { convertLabelHTML(this, getShortLabel(model_list[i].model_label, 25));});


		//create a scale
		var color_values = [];
		var temp_data = model_data.map(function(d) { return d.value;});
		var diff = d3.max(temp_data) - d3.min(temp_data);
		var step = (diff/5);
		for (var idx=0;idx<6;idx++) {
			var t = d3.min(temp_data);
			var t2 = t + (idx * step);
			color_values.push(t2);
		}
		color_values.reverse();
		var legend_rects = svg.selectAll("#legend_rect")
		        .data(color_values);
		    legend_rects.enter()
		        .append("rect")
		          .attr("transform","translate(330,30)")
			      .attr("class", "legend_rect")
			      .attr("x", "240")
			      .attr("y", function(d, i) {
			    	  return 150 + (i* 25);
			      })
			      .attr("width", 20)
			      .attr("height", 20)
			      .attr("fill", function(d) {
				  	  return color_scale(d);
				  });
		var legend_text = svg.selectAll("#legend_text")
	        .data(color_values);
	    legend_text.enter()
		      .append("text")
		          .attr("transform","translate(330,30)")
			      .attr("class", "legend_text")
			      .attr("x", "275")
			      .attr("y", function(d, i) {
			    	  return (175 + (i* 25));
			      })
			      .text(function(d) {
			    	  return d.toFixed(5);
			      });

		var legend_control = svg.selectAll("#legend_control")
	    .data(color_values);
	     legend_rects.enter()
	    .append("rect")
	      .attr("transform","translate(330,30)")
	      .attr("class", "legend_control")
	      .attr("value", function(d) {
	    	  return d.toFixed(6);
	      })
	      .attr("x", "237")
	      .attr("y", function(d, i) {
	    	  return (175 + (i* 25))-5;
	      })
	      //	  .attr('onclick', function(d) { return 'select_column(this,"' + d + '");';}) 

	      .attr("onclick", function(d) {
	    	  return 'modeltype.changeThreshold(this,' + d + ');';
	      })
	      .attr("width", 26)
	      .attr("height", 5)
	      .attr("fill", "lightgrey");

		
		
		
	}
	
	function update() {
		updateAxes();
		createRects();
		createModelRects() ;
	}

	//todo: the filtering has changed.  I need to filter the model_data, not the comparison_data
	function changeThreshold(obj, value) {
		//reset the color on all the other controls
		var controls = svg.selectAll(".legend_control");
		controls[0].forEach(function(ctl) {
			ctl.setAttribute('fill', 'lightgrey');
		});
		//set the selected control to black
		obj.setAttribute('fill', 'black');

		 var new_data = model_data.filter(function(d){
	    	 return d.value.toFixed(6) >= value.toFixed(6);
		 });
		 filtered_model_data = new_data.slice();

		// var new_data2 = comparison_data.filter(function(d){
	    //	 return d.score.toFixed(6) >= value.toFixed(6);
		// });
		 filtered_model_data = new_data.slice();
		 //filtered_data = new_data2.slice();
		 
		 var data_size = filtered_model_data.length/2;
		 //svg.setAttribute('height', data_size *20);
		 //svg.attr('height') = data_size *20;
		    //svg.height = data_size*20;
		    //h = data_size*5;
		 //svg.style('height', data_size*20);
	     //init();
		 update();

	}



	function createRects() {
		// this takes some 'splaining
		//the raw dataset contains repeats of data within the A,subsumer, and B columns.
		//if d3 sees the same label 4 times (ex: Abnormality of the pharynx) then it will
		//create a rectangle and text for it 4 times.  Therefore, I need to create a unique set of 
		//labels per axis (because the labels can repeat across axes)
	/*	
		//check to see if I need this...the data may already be unique
		var unique_labels = [];
		var unique_data = [];
		for (var x=0;x < axis_list.length;x++) {
			var temp_data = filtered_data.filter(function(d) { return d.axis == x;});
			var temp_unique_labels = [];
			temp_data.forEach(function(data_item) {
				if (temp_unique_labels.indexOf(data_item.label) == -1) {
					temp_unique_labels.push(data_item.label);
					unique_data.push(data_item);
				}
			});
		}*/

		var rect_text = svg
		   .selectAll(".a_text")
		   .data(filtered_model_data, function(d) { return d.rowid; });
		rect_text.enter()
		   		.append("text")
			    .attr("class", function(d) {
				    return "a_text data_text " + getConceptId(d.id);
			    })
				.attr("x", 50)
				.attr("y", function(d) {
					  return y_scale(d.rowid)+28;
			     })
				.on("mouseover", function(d) {
					if (clicked_data == undefined) {
						selectData(d);
					}
				})
				.on("mouseout", function(d) {
					if (clicked_data == undefined) {
						deselectData(d);
					}
				})
				.on("click", function(d) {
					rect_click(d);
				})
			    .attr("width", text_width)
			    .attr("height", 50)
			     .text(function(d) {
			    	 return getShortLabel(d.label_a);
			     })
		rect_text.transition()
		    .delay(1000)
			.attr("y", function(d) {
				return y_scale(d.rowid)+28;
			})
	   	rect_text.exit()
	   	    .transition()
	   	      .delay(500)
	   	      .attr("y", 1600)
			.remove();


		var rect_text2 = svg
		   .selectAll(".lcs_text")
		   .data(filtered_model_data, function(d) { return d.rowid; });
		rect_text2.enter()
		   		.append("text")
			    .attr("class", function(d,i) {
			    	 if (i==0 || (filtered_model_data[i-1].subsumer_label != d.subsumer_label)) {
			    		 return "lcs_text data_text " + getConceptId(d.id) + " " + getConceptId(d.subsumer_id);
			    	 }
				    
			    })
				.attr("x", text_width + 10 + col_starting_pos + model_width)
				.attr("y", function(d) {
					  return y_scale(d.rowid)+28;
			     })
				.on("mouseover", function(d) {
					if (clicked_data == undefined) {
						selectData(d);
					}
				})
				.on("mouseout", function(d) {
					if (clicked_data == undefined) {
						deselectData(d);
					}
				})
				.on("click", function(d) {
					rect_click(d);
				})
			    .attr("width", text_width)
			    .attr("height", 50)
			     .text(function(d,i) {
			    	 if (i==0) {
			    		 return getShortLabel(d.subsumer_label);
			    	 }
			    	 if (filtered_model_data[i-1].subsumer_label != d.subsumer_label) {
			    		 return getShortLabel(d.subsumer_label);
			    	 }
			     })
		rect_text2.transition()
		    .delay(1000)
			.attr("y", function(d) {
				return y_scale(d.rowid)+28;
			})
		rect_text2.exit()
		    .transition()
		      .delay(500)
		      .attr("y", 1600)
			.remove();

	}



    function init(imageDiv, data) {
        model_data = data;
        filtered_model_data = model_data.slice();

        getModelList();
        initCanvas(imageDiv);
        
        // set canvas size
        svg
            .attr("width", 1100)
            .attr("height", 1300);

        createAccentBoxes();
        createColorScale();
        createModelRegion();
    	updateAxes();
    	createRects();
    	createModelRects();
   }
    


    // public methods and vars
    return {
        init: init,
        changeThreshold: changeThreshold,
    };

}();



