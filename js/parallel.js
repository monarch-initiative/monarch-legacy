//var dimensions = [ "Human Phenotype", "Mammalian Phenotype" ];
var dimensions = [ "Human Phenotype", "Lowest Common Subsumer", "Mammalian Phenotype" ];

//IMPORTANT: the comparison_data variable represents the full dataset as it was initially loaded
var comparison_data = []; 
//IMPORTANT: the filtered_data is the data currently shown on the screen.  It is a subset of the comparison_data
var filtered_data = [];
//, axis_pos_list = [], axis_item_list = [], y_scale_list=[];
var y_scale = undefined, y_axis = undefined;

//this is required for deploying via moustache.  I think the $(document).ready function gets called for 
//each section of the page.  I just want it to load once.
var loaded_once = 0;

//this is temporary
var model_data = [], filtered_model_data = [], 
model_list = ["MGI_2654522", "MGI_3654636", "MGI_3758030", "MGI_3758072", "MGI_4421411", "MGI_5440841", "MGI_5441517", "Model_2", "Model_3"];


var col_starting_pos = 50, text_width = 150, clicked_data = undefined, xScale = undefined, text_length = 32;

//d3.rgb("#44a293") : d3.rgb("#a4d6d4")

var color_scale = d3.scale.linear().domain([0,1]).range([d3.rgb("#e5e5e5"), d3.rgb("#44a293")]);

var lcs_slider = $("#lcs_slider");

var model_width = model_list.length * 15;
var m = [ 30, 10, 10, 10 ], w = 1000 - m[1] - m[3], h = 1300 - m[0] - m[2];
var x = d3.scale.ordinal().rangePoints([ 0, w ], 1);
var line = d3.svg.line(), axis = d3.svg.axis().orient("left"), background, foreground;
var svg = undefined;


function createSvg() {
	//give me one svg Vassily one svg only please
	if (svg == undefined) {
		svg = d3.select("#svg_vis").append("svg").attr("width", w + m[1] + m[3]).attr(
				"height", h + m[0] + m[2]).append("g").attr("class", "svg_area").attr("transform",
				"translate(" + m[3] + "," + m[0] + ")");
	}

}

//current process: load a single row of JSON data: col A, subsumer, Col B as one row of Javascript data
function loadData() {
	loaded_once = 1;

	loadMouseModels();
	
	//TEMPORARY
	var temp_model_list = ["MGI_2654522", "MGI_3654636", "MGI_3758030", "MGI_3758072", "MGI_4421411", "MGI_5440841", "MGI_5441517", "MGI_2654522", "MGI_3654636", "MGI_3758030"];

	
	/*
	var current_disease_id =  window.location.pathname;
	var pos = current_disease_id.lastIndexOf('/');
	current_disease_id = current_disease_id.substring(pos+1);
	current_disease_id = current_disease_id.replace('_',':');
    jQuery.ajax({ url: window.location.pathname + "/sim.json",
    
    Use this url to retireve a list of models:
    jQuery.ajax({ url: window.location.pathname + "/models.json",
    
    clean the list and only retrieve mouse models "MGI:..."
*/
	
	for (var idx=0;idx<model_list.length;idx++) {
	//NOTE: This is currently hard-coded to a JSON dataset.  Obviously, this will reference a live dataset in the future
//		jQuery.ajax({ url: "/js/" + temp_model_list[idx] + ".json",
//		jQuery.ajax({ url: "/js/" + model_list[idx].id + ".json",

	    //var compare_url = "http://secret-harbor-1370.herokuapp.com/compare/";
	    var compare_url = "http://tartini.crbs.ucsd.edu/compare/";
		var current_disease_id =  window.location.pathname;
		var pos = current_disease_id.lastIndexOf('/');
		current_disease_id = current_disease_id.substring(pos+1);
		current_disease_id = current_disease_id.replace(':','_');
		jQuery.ajax({ url: compare_url + current_disease_id + "/" + model_list[idx].id + ".json",
			async:false,
			dataType: 'json', 
			success: function(data){
			// build the comparison_data variable
			//note: the attributes added in this method become the basis for the "columns"
		    //shown on the screen in the x.domain(dimensions = d3.keys... code
			//copy the LCS score into all the relationships
			data.forEach(function(data_item, i) {
				//build an object for each item returned in a row of data (column A, subsumer, column B)
				//these items will become the rectangles on the screen
				var colA_label = getCleanLabel(data_item.A.id,data_item.A.label);
				var itemA = {label: getCleanLabel(data_item.A.id,data_item.A.label), score: data_item.LCS_Score, id: data_item.A.id, 
						organism: getOrganism(data_item.A.id), axis: 0, rowid: i};
	
				var sub_label = getCleanLabel(data_item.LCS.id,data_item.LCS.label);
				var subsumer = {label: getCleanLabel(data_item.LCS.id,data_item.LCS.label), id: data_item.LCS.id, score: data_item.LCS_Score, 
				organism: getOrganism(data_item.LCS.id), axis: 1, rowid: i};
				
				var colB_label = getCleanLabel(data_item.B.id,data_item.B.label);
				var itemB = {label: getCleanLabel(data_item.B.id,data_item.B.label), score: data_item.LCS_Score, id: data_item.B.id, 
						organism: getOrganism(data_item.B.id), axis: 2, rowid: i};
				
				var singleRow = {id: getConceptId(data_item.A.id) + "_" + getConceptId(data_item.B.id) + "_" + getConceptId(model_list[idx].id), label_a: colA_label, id_a: data_item.A.id, organism_a: getOrganism(data_item.A.id),
						subsumer_label: sub_label, subsumer_id: data_item.LCS.id, value: data_item.LCS_Score, organism_a: getOrganism(data_item.LCS.id),
						label_b: colB_label, id_b: data_item.B.id, organism_b: getOrganism(data_item.B.id), model: model_list[idx].label, 
						//rowid: getConceptId(data_item.A.id) + "_" + getConceptId(data_item.B.id)};
				        rowid: getConceptId(data_item.A.id) + "_" + getConceptId(data_item.LCS.id)};
 
				
				model_data.push(singleRow);
	
			});
		}
		});
	}
	model_data.sort(function(a,b) { 
		if(a.subsumer_label.toLowerCase() < b.subsumer_label.toLowerCase()) return 1;
	    if(a.subsumer_label.toLowerCase() > b.subsumer_label.toLowerCase()) return -1;
	    return 0;
	});
	model_data.reverse();
	filtered_model_data = model_data.slice();
	
	var temp_array = filtered_model_data.map(function(d) {
		return d.value;
	});
	color_scale = d3.scale.linear().domain([d3.min(temp_array), d3.max(temp_array)]).range([d3.rgb("#e5e5e5"), d3.rgb("#44a293")]);
	//h = filtered_model_data.length*1.5;
	h = 600;


}

function loadMouseModels() {
	var model_idx = 0;
	model_list = [];
	jQuery.ajax({ url: window.location.pathname + "/models.json",
		async:false,
		dataType: 'json', 
		success: function(data){
		// extract a list of the models associated with the current disease
	    //TEMPORARY: just retrieve all the models and only show the first 10 Mouse models
		data.models.forEach(function(data_item, i) {
			if (data_item.model.id.indexOf("MGI:") != -1
					&& model_idx < 10) {
				var mouse_model = { id: data_item.model.id, label: data_item.model.label, taxon: data_item.model.taxon.id};
				model_list.push(mouse_model);
				//temporary just add 10 items for now...
				model_idx = model_idx + 1;
			}
		
		
		});
	}
	});

}

function createModelRegion() {
	//model_x_axis = undefined;
	xScale = d3.scale.ordinal()
        .domain(model_list)
        .rangePoints([0,model_width]);
	model_x_axis = d3.svg.axis().scale(xScale).orient("top");
	var model_region = svg.append("g").attr("transform",
			"translate(210,44)")
			.call(model_x_axis)
			.attr("class", "y_axis_text");
			//this be some voodoo...
			//to rotate the text, I need to select it as it was added by the axis

			
			/*
			 * 		    .selectAll("text") 
		       .each(function(d,i) { convertLabelHTML(this, d);});

			 */
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
    	  return 'changeThreshold(this,' + d + ');';
      })
      .attr("width", 26)
      .attr("height", 5)
      .attr("fill", "lightgrey");

	
	
	
}

function updateAxes() {
	h= 600;
	//h = filtered_model_data.length*1.5;
	y_scale = d3.scale.ordinal()
    	.domain(filtered_model_data.map(function (d) {return d.rowid; }))
    	.rangePoints([ 44, h ]);
    	//.rangeBands([ h, 0 ], 2);
	y_axis = d3.svg.axis()
	  .tickSize(5,0,0).ticks(15)
	  .orient("left")
	  .scale(y_scale);
	svg.attr("height", h);
	svg.selectAll("yaxis").remove();
	//svg.selectAll("yaxis")
	   svg.append("g")
	       .attr("class", "yaxis")
	       .attr("transform", "translate(-100,30)")
	       .call(y_axis);
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

function init() {
	var axis_pos_list = [];
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
	      .attr("y", "40")
	      .attr("width", text_width + 5)
	      .attr("height", h -20)
	      .style("opacity", '0.4')
	      .attr("fill", function(d, i) {
	    	  return i != 1 ? d3.rgb("#e5e5e5") : "white";
	      });

    
}


//this is a temporary function.
//some comparisons will not involve different organisms
function getOrganism(uri) {
	var pos = uri.indexOf("HP_");
	if (pos == -1) {
		return "Mouse";
	} else {
		return "Human";
	}
}

//return a label for use in the list.  This label is shortened
//to fit within the space in the column
function getShortLabel(label) {
  var retLabel = label;
  if (label.length > text_length) {
	  retLabel = label.substring(0,text_length-3) + "...";
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
	uri = uri + "";
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
			    return "a_text data_text " + getConceptId(d.id) + " " + getConceptId(d.subsumer_id);
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
				rect_click(d.id_a);
			})
		    .attr("width", text_width)
		    .attr("height", 50)
		    .style("font-size", "8pt")
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
				rect_click(d.subsumer_id);
			})
		    .attr("width", text_width)
		    .attr("height", 50)
		    .style("font-size", "8pt")
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

function rect_click(id) {
	 window.location.href = '/phenotype/' + getConceptId(id);
	    return false;
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
			"translate(210,18)")
	    .attr("class", function(d) { 
	    	//append the model id to all related items
	    	if (d.value > 0) {
		    	var bla = svg.selectAll(".data_text." + getConceptId(d.id));	    	
		    	bla.classed(getConceptId(d.model), true);
	    	}
	    	return "models " + " " +  getConceptId(d.model) + " " +  getConceptId(d.id);
	    })
	    .attr("y", function(d, i) {     	
			return y_scale(d.id);
	    })
	    .attr("x", function(d) { return xScale(d.model);})
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

var convertLabelHTML = function (t, d) {
	/*
	 * 		        .style("text-anchor", "start")
			        .style("font-size", "8pt")
			        .attr("x", 15)
			        .attr("y", -5)
			        .attr("dx", "-.8em")
			        .attr("dy", ".15em")
			        .attr("transform", function(d) {
			            return "rotate(-45)" 
			            })
			        .append("foreignObject")
			        .append("xhtml:body")
			            .style("font-size", "8px")
			            .html(String);
	 */
		
		var width = 300;
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
	        .style("font-size", "8pt")
	        .html(decodeURI(d.label));    

	    el.remove();

	};


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

	 var new_data2 = comparison_data.filter(function(d){
    	 return d.score.toFixed(6) >= value.toFixed(6);
	 });
	 filtered_model_data = new_data.slice();
	 filtered_data = new_data2.slice();
	 
	 var data_size = filtered_data.length/2;
	 //svg.setAttribute('height', data_size *20);
	 //svg.attr('height') = data_size *20;
	    //svg.height = data_size*20;
	    //h = data_size*5;
	 //svg.style('height', data_size*20);
     //init();
	 update();

}

function update() {
	updateAxes();
	createRects();
	createModelRects() ;
}
/*
loadData();
init();
createModelRegion();
update();
*/


