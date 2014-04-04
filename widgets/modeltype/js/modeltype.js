/*
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


NOTE: I probably need a model_url to render additional model info on the screen.  Alternatively I can load the data
as a separate call in the init function.
 */

(function($) {
    
    $.widget("ui.modeltype", {

	options:   {

	    colStartingPos: 10,
	    textWidth: 200,
	    clickedData: undefined, 
	    xScale: undefined, 
	    textLength: 34,
	    svg: undefined,
	    yScale: undefined,
	    modelData: [],
	    filteredModelData: [],
	    filteredPhenotypeData: [],
	    phenotypeData: [],
	    filteredModelList: [],
	    detailRectWidth: 240,
        detailRectHeight: 70,
        detailRectStrokeWidth: 3,
	    dimensions: [ "Phenotype Profile", "Lowest Common Subsumer", "Phenotypes in common" ], 
	    m :[ 30, 10, 10, 10 ], 
	    w : 0,
	    h : 0,
	    yoffset: 100,
	    yAxis: [],
	    modelList: [],
	    modelWidth: undefined,
	    phenotypeData: [],
	    colorScale: undefined,
	    targetSpecies: "10090",
	    yAxisMax : 0,
	    serverURL : "",
	    phenotypeDisplayCount : 26,
	    currPhenotypeIdx : 0,
	    modelDisplayCount : 20,
	    currModelIdx : 0,
	    axis_pos_list: [],
	    defaultComparisonSpecies : "Mus musculus",
	    defaultComparisonType : "genes",
	    minColorScale : "#D6D6D6",
	    maxColorScale : "#44a293",
	    orangeHighlight: "#ea763b",
	    maxICScore : 0,
	    		
	},

	//NOTE: I'm not too sure what the default init() method signature should be
	//given an imageDiv and phenotype_data list
	/**
	 * imageDiv- the place you want the widget to appear
	 * phenotype_data - a list of phenotypes in the following format:
	 * [ {"id": "HP:12345", "observed" :"positive"}, {"id: "HP:23451", "observed" : "negative"}, É]
	 */
	_create: function() {
	    
	    this.options.w = this.options.m[1]-this.options.m[3];
	    this.options.h = 1300 -this.options.m[0]-this.options.m[2];
	    this.options.currModelIdx = this.options.modelDisplayCount-1;
	    this.options.currPhenotypeIdx = this.options.phenotypeDisplayCount-1;
	    this.options.phenotypeData = 
		this._filterPhenotypeResults(this.options.phenotypeData);
	    this._loadData(this.options.phenotypeData);
            //this.options.filteredModelData = this.options.modelData.slice();

            this._filterData(this.options.modelData.slice());
            this._createYAxis();
    	    //just pad the overall height by a skosh...
    	    this.options.h = this.options.yAxisMax + 60;
            this._initCanvas(); 
        
            // set canvas size
            this.options.svg
		.attr("width", 1100)
		.attr("height", this.options.h);

            this._createTitle();
            this._createAccentBoxes();
            this._createScrollBars();
            this._createColorScale();
            this._createModelRegion();
    	    this._updateAxes();
    	    this._createModelRects();
    	    this._createRects();
    		this._updateScrollCounts();

	},

	_createTitle: function() {
		var self = this;
	    var div_text1 = self.options.svg.append("svg:text")
		.attr("transform","translate(0,0)")
		.attr("class", "title_text")
		.attr("y", "16")
		.style("font-size", "16px")
		.text("Phenotype comparison (grouped by " + this.options.defaultComparisonSpecies + " " + this.options.defaultComparisonType + ")");

	},
	
	//given the full dataset, return a filtered dataset containing the
	//subset of data bounded by the phenotype display count and the model display count
	_filterData: function(fulldataset) {
		var self = this;
		
    	var phenotypeArray = [];
    	for (var idx=0;idx<fulldataset.length;idx++) {
    		var result = $.grep(phenotypeArray, function(e){ return e.rowid == fulldataset[idx].rowid; });
    		if (result.length == 0) {
    			phenotypeArray.push(fulldataset[idx]);
    		}
    	}

    	//copy the phenotype data
    	this.options.phenotypeData = phenotypeArray.slice();

    	//we need to adjust the display counts and indexing if there are fewer phenotypes
    	if (this.options.phenotypeData.length < this.options.phenotypeDisplayCount) {
    		this.options.currPhenotypeIdx = this.options.phenotypeData.length-1;
    		this.options.phenotypeDisplayCount = this.options.phenotypeData.length;
    	}

    	
		this.options.filteredPhenotypeData = [];
		this.options.yAxis = [];
		this.options.filteredModelData = [];
		var startIdx = this.options.currPhenotypeIdx - (this.options.phenotypeDisplayCount -1);

		
		//extract the new array of filtered Phentoypes
		//also update the axis
		//also update the modeldata

		var tempFilteredModelData = [];
		var axis_idx = 0;
    	for (var idx=startIdx;idx<self.options.currPhenotypeIdx;idx++) {
    		self.options.filteredPhenotypeData.push(self.options.phenotypeData[idx]);
    		//update the YAxis   	
    		
    		//the height of each row
        	var size = 10;
        	//the spacing you want between rows
        	var gap = 3;

    		var stuff = {"id": self.options.phenotypeData[idx].rowid, "ypos" : ((axis_idx * (size+gap)) + self.options.yoffset)};
    		self.options.yAxis.push(stuff); 
    	    axis_idx = axis_idx + 1;
    	    //update the ModelData
    		var tempdata = self.options.modelData.filter(function(d) {
    	    	return d.rowid == self.options.phenotypeData[idx].rowid;
    	    });
    		tempFilteredModelData = tempFilteredModelData.concat(tempdata);

    	}
    	
    	//now, limit the data returned by models as well
    	for (var idx=0;idx<self.options.filteredModelList.length;idx++) {
    		var tempdata = tempFilteredModelData.filter(function(d) {
    	    	return d.model_id == self._getConceptId(self.options.filteredModelList[idx].model_id);
    	    });
    		self.options.filteredModelData = self.options.filteredModelData.concat(tempdata);
    		
    	}

    	

	},
	
    //given a list of phenotypes, find the top n models
    //I may need to rename this method "getModelData".  It should extract the models and reformat the data 
    _loadData: function() {
  
	var self=this;
    	var phenotypeList = this.options.phenotypeData;
    	//NOTE: just temporary until the calls are ready
		jQuery.ajax({
			//url : "data/sample_model_data.json",
			url: this.options.serverURL + "/simsearch/phenotype/?input_items=" + 
			    phenotypeList.join(",") + "&target_species="+this.options.targetSpecies, 
			async : false,
			dataType : 'json',
			success : function(data) {
			   self._finishLoad(data);
			}

		});
    },
	
    _finishLoad: function(data) {

	var retData = data;
	var self= this;

	///EXTRACT MOUSE MODEL INFORMATION FIRST
	this.options.modelList = [];
	for (var idx=0;idx<retData.b.length;idx++) {
	    this.options.modelList.push(
		{model_id: self._getConceptId(retData.b[idx].id), 
		 model_label: retData.b[idx].label, 
		 model_score: retData.b[idx].score.score, 
		 model_rank: retData.b[idx].score.rank});
	    this._loadDataForModel(retData.b[idx]);
	}
	//sort the model list by rank
	this.options.modelList.sort(function(a,b) { 
	    return a.model_rank - b.model_rank; } );
	
	//we need to adjust the display counts and indexing if there are fewer models
	if (this.options.modelList.length < this.options.modelDisplayCount) {
		this.options.currModelIdx = this.options.modelList.length-1;
		this.options.modelDisplayCount = this.options.modelList.length;
	}

	//initialize the filtered model list
	for (var idx=0;idx<this.options.modelDisplayCount;idx++) {
		this.options.filteredModelList.push(this.options.modelList[idx]);
	}
	//extract the maxIC score
	this.options.maxICScore = retData.metadata.maxMaxIC;
    
    },
    
    //for a given model, extract the sim search data including IC scores and the triple:
    //the a column, b column, and lowest common subsumer
    //for the triple's IC score, use the A score
    _loadDataForModel: function(newModelData) {
	
	data = newModelData.matches;
    	for (var idx=0;idx<data.length;idx++) {
    	    var curr_row = data[idx];
    	    var new_row = {"id": this._getConceptId(curr_row.a.id) + 
			          "_" + this._getConceptId(curr_row.b.id) + 
			          "_" + this._getConceptId(newModelData.id), 
   			   "label_a" : curr_row.a.label, 
			   "id_a" : this._getConceptId(curr_row.a.id), 
			   "subsumer_label" : curr_row.lcs.label, 
    	     	           "subsumer_id" : this._getConceptId(curr_row.lcs.id), 
			   "value" : parseFloat(curr_row.a.IC),
    			   "label_b" : curr_row.b.label, 
			   "id_b" : this._getConceptId(curr_row.b.id), 
			   "model_id" : this._getConceptId(newModelData.id),
    			   "model_label" : newModelData.label, 
			   "rowid" : this._getConceptId(curr_row.a.id) + 
			              "_" + this._getConceptId(curr_row.lcs.id)
		  }; 
    	    if (new_row.subsumer_id.indexOf("0005753") > -1) {
    	    	console.out("got it");
    	    }
    	    this.options.modelData.push(new_row);
    	}
    },
    
    
    //create a y-axis from the model data
    //for each item in the data model, push the rowid
    //and calculate the y position
    _createYAxis: function() {
    	var self=this;
    	//the height of each row
    	var size = 10;
    	//the spacing you want between rows
    	var gap = 3;
    	//yoffset
 
    	
    	//use the max phenotype size to limit the number of phenotypes shown 
    	var yLength = self.options.phenotypeData.length > this.options.phenotypeDisplayCount ? this.options.phenotypeDisplayCount : self.options.phenotypeData.length;
    	for (var idx=0;idx<yLength;idx++) {
    		var stuff = {"id": self.options.phenotypeData[idx], "ypos" : ((idx * (size+gap)) + this.options.yoffset)};
    	    this.options.yAxis.push(stuff);
    	    if (((idx * (size+gap)) + this.options.yoffset) > this.options.yAxisMax) {
    	    	this.options.yAxisMax = (idx * (size+gap)) + this.options.yoffset;
    	    }
    	}
    },
    
    //given a rowid, return the y-axis position
    _getYPosition: function(newRowId) {
    	var retValue = this.options.yoffset;
    	var newObj = this.options.yAxis.filter(function(d){
	    	return d.id == newRowId;
	    });
    	if (newObj[0]) {
    		retValue = newObj[0].ypos;
    	}
    	return retValue;
    },
    
    _createColorScale: function() {
    	/*var temp_array = this.options.filteredModelData.map(function(d) {
    	    return d.value;
    	});
    	this.options.colorScale = d3.scale.linear().domain([d3.min(temp_array), d3.max(temp_array)]).range([d3.rgb(this.options.minColorScale), d3.rgb(this.options.maxColorScale)]);
    	*/
    	this.options.colorScale = d3.scale.linear().domain([0,this.options.maxICScore]).range([d3.rgb(this.options.minColorScale), d3.rgb(this.options.maxColorScale)]);
    },


    _initCanvas : function() {

        this.element.append("<svg id='svg_area'></svg>");
        this.options.svg = d3.select("#svg_area");

    },
    
    _resetLinks: function() {
	    this.options.svg.selectAll("#detail_content").remove();

    	var link_lines = d3.selectAll(".data_text");
    	link_lines.style("font-weight", "normal");
    	link_lines.style("text-decoration", "none");
    	link_lines.style("color", "black");
    },

    _selectData: function(curr_data, obj) {
    	
    	//  		  return self._getYPosition(d.rowid);

    	//create a highlight row
		var self=this;
		//create the related row rectangle
		//var ypos = self._getYPosition(curr_data.rowid);
		var highlight_rect = self.options.svg.append("svg:rect")
		  	.attr("transform","translate(" + self.options.axis_pos_list[1] + ",18)")
			.attr("x", 0)
			.attr("y", function(d) {return self._getYPosition(curr_data.rowid);})
//		.attr("y", self.options.yoffset)
			.attr("class", "row_accent")
			.attr("width", this.options.modelWidth)
			.attr("fill", d3.rgb(self.options.orangeHighlight))
			.attr("opacity", '0.5')
			.attr("height", 14);

    	
    	this._resetLinks();
    	var alabels = this.options.svg.selectAll("text.a_text." + this._getConceptId(curr_data.id));
    	var txt = curr_data.label_a;
    	if (txt == undefined) {
    		txt = curr_data.id_a;
    	}
    	alabels.text(txt);

    	var sublabels = this.options.svg.selectAll("text.lcs_text." + this._getConceptId(curr_data.id) + ", ." + this._getConceptId(curr_data.subsumer_id));
    	var txt = curr_data.subsumer_label;
    	if (txt == undefined) {
    		txt = curr_data.subsumer_id;
    	}
    	sublabels.text(txt);
    	var all_links = this.options.svg.selectAll("." + this._getConceptId(curr_data.id) + ", ." + this._getConceptId(curr_data.subsumer_id));
    	all_links.style("font-weight", "bold");

    	/* TEMPORARY!!! REMOVE FOR HARRY's POSTER!!!
    	var retData = "What data do we want to show for phentoypes?";
	    this._updateDetailSection(retData, this._getXYPos(obj));
	    */    	

    },

    _deselectData: function (curr_data) {
    	this.options.svg.selectAll(".row_accent").remove();
    	this._resetLinks();
    	var alabels = this.options.svg.selectAll("text.a_text." + this._getConceptId(curr_data.id));
    	alabels.text(this._getShortLabel(curr_data.label_a));

    	var sublabels = this.options.svg.selectAll("text.lcs_text." + this._getConceptId(curr_data.id));
    	sublabels.text(this._getShortLabel(curr_data.subsumer_label));
    },


  //return a label for use in the list.  This label is shortened
  //to fit within the space in the column
    _getShortLabel: function(label, newlength) {
	var retLabel = label;
	if (!newlength) {
    	    newlength = this.options.textLength;
	}
	if (label.length > newlength) {
  	    retLabel = label.substring(0,newlength-3) + "...";
	}	
    return retLabel;
    },

  //return a useful label to use for visualizing the rectangles
   _getCleanLabel: function (uri, label) {
  	if (label && label != "" && label != "null") {
  		return label;
  	} 
      var temp = this._getConceptId(uri);
      return temp;
   },

  //This method extracts the unique id from a given URI
  //for example, http://www.berkeleybop.org/obo/HP:0003791 would return HP:0003791
  //Why?  Two reasons.  First it's useful to note that d3.js doesn't like to use URI's as ids.
  //Second, I like to use unique ids for CSS classes.  This allows me to selectively manipulate related groups of items on the
  //screen based their relationship to a common concept (ex: HP000123).  However, I can't use a URI as a class.
  _getConceptId: function (uri) {
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
  },

    _convertLabelHTML: function (t, label, data) {
    	
    	    var self = this;
    		var width = 100;
    		var el = d3.select(t);
    	    var p = d3.select(t.parentNode);
    	    p.append("foreignObject")
    	        .attr('x', t.getAttribute("x")+15)
    	        .attr('y', t.getAttribute("y")-13)
    	       // .attr('dx', t.dx)
    	       // .attr('dy', t.dy)
    	        .attr("width", width)
    	        .attr("id", self._getConceptId(data.model_id))
    	        .attr("model_id", data.model_id)
    	        .attr("height", 20)

    	        .attr("transform", function(d) {
    	        	return "rotate(-45)" 
    	         })
    	      .append("xhtml:p")

		        .on("click", function(d) {
					self._clickModel(data, self.document[0].location.origin);
				})
    	       .on("mouseover", function(d) {
    	    	   self._selectModel(data, this);
    	       })
    	       .on("mouseout", function(d) {
    	    	   self._clearModelData(d, d3.mouse(this));
    	       })
		
    	       .attr("id", this._getConceptId(data.model_id))
    	       .attr("class", this._getConceptId(data.model_id) + " model_label")
    	        //.attr('style','word-wrap: break-word; text-align:center;')
				.style("font-size", "12px")
    	        .html(label);    

    	    el.remove();

    },
    
    _clickModel: function(data, url_origin) {
    	var url = url_origin + "/gene/" + data.model_id;
    	var win = window.open(url, '_blank');
    },

    _updateDetailSection: function(htmltext, coords, width, height) {

	    this.options.svg.selectAll("#detail_content").remove();
	    
	    var w = this.options.detailRectWidth-(this.options.detailRectStrokeWidth*2);
	    var h = this.options.detailRectHeight-(this.options.detailRectStrokeWidth*2);
	    if (width != undefined) {
	    	w = width;
	    }
	    if (height != undefined) {
	    	h = height;
	    }

	    this.options.svg.append("foreignObject")
		    .attr("width", w)
			.attr("height", h)
			.attr("id", "detail_content")

			//add an offset.  Otherwise, the tooltip turns off the mouse event
			.attr("y", coords.y+10)
		    .attr("x", coords.x+10)
  		    
			.append("xhtml:body")
			.style("font-size", "10px")
			.style("background-color", d3.rgb("#F09F76"))
			.html(htmltext);
    	
    },
    
    _showThrobber: function() {
	    this.options.svg.selectAll("#detail_content").remove();
	    this.options.svg.append("svg:text")
			.attr("id", "detail_content")
			.attr("y", (26+this.options.detailRectStrokeWidth))
		    .attr("x", (440+this.options.detailRectStrokeWidth))
			.style("font-size", "12px")
			.text("Searching for data")
	    this.options.svg.append("svg:image")
			.attr("width", 16)
			.attr("height", 16)
			.attr("id", "detail_content")
			.attr("y", (16+this.options.detailRectStrokeWidth))
		    .attr("x", (545+this.options.detailRectStrokeWidth))
		    .attr("xlink:href","/widgets/modeltype/image/throbber.gif");

	       
    },
    
    //extract the x,y values from a SVG transform string (ex: transform(200,20))
    _extractTransform: function(dataString) {
    	var startIdx = dataString.indexOf("(");
    	var commaIdx = dataString.indexOf(",");
    	var x_data = Number(dataString.substring(startIdx+1,commaIdx));
    	var y_data = Number(dataString.substring(commaIdx+1, dataString.length-1));
    	return { x: x_data, y: y_data};
    },
    
    //the the "SVG" XY position of an element
    //The mouse position returned by d3.mouse returns the poistion within the page, not the SVG
    //area.  Therefore, this is a two step process: retreive any transform data and the (x,y) pair.
    //Return the (x,y) coordinates with the transform applied
    _getXYPos: function(obj) {
    	var tform = { x: 0, y: 0};
    	//if a transform exisits, apply it
    	if (typeof obj.attributes["transform"] != 'undefined') {
	      var transform_str = obj.attributes["transform"].value;
	      tform = this._extractTransform(transform_str);
    	}
	    return {x: Number(obj.getAttribute("x")) + tform.x, y: Number(obj.getAttribute("y")) + tform.y};
    },
    
    _showModelData: function(d, obj) {
	    var retData;
	    var aSpecies = "Human";
	    if (d.id_a.indexOf("MP") > -1) {
	    	aSpecies = "Mouse";
	    }
	    var subSpecies = "Human";
	    if (d.subsumer_id.indexOf("MP") > -1) {
	    	subSpecies = "Mouse";
	    }
	    
	    retData = "<strong>Input: </strong> " + d.label_a + " (" + aSpecies + ")"   
		    + "<br/><strong>Match: </strong> " + d.subsumer_label + " (" + subSpecies + ")"
     	    + "<br/><strong>Model Label: </strong> " + d.model_label
     	+ "<br/><strong>Similarity Score: </strong> " + d.value.toFixed(2);
	    this._updateDetailSection(retData, this._getXYPos(obj));
	  
    },
    	
    //I need to check to see if the modelData is an object.  If so, get the model_id
    _clearModelData: function(modelData) {
	    this.options.svg.selectAll("#detail_content").remove();
	    this.options.svg.selectAll(".model_accent").remove();
	    if (modelData != null && typeof modelData != 'object') {
		    var model_text = this.options.svg.selectAll("p#" + this._getConceptId(modelData));
		    model_text.style("font-weight","normal");
		    model_text.style("text-decoration", "none");
		    model_text.style("color", "black");

	    }
    },


  //NOTE: I need to find a way to either add the model class to the phenotypes when they load OR
  //select the rect objects related to the model and append the class to them.
  //something like this: $( "p" ).addClass( "myClass yourClass" );
  _createModelRects: function() {
      var self = this;
      var model_rects = this.options.svg.selectAll(".models")
      	.data(this.options.filteredModelData, function(d) {
      	    return d.id;
      	});
      model_rects.enter()
  	  .append("rect")
  	  .attr("transform",
  		"translate(" + (this.options.textWidth + 20) + ",20)")
      //"translate(210," + this.options.yoffset + ")")
  	  .attr("class", function(d) { 
  	      //append the model id to all related items
  	      if (d.value > 0) {
  		  var bla = self.options.svg.selectAll(".data_text." + self._getConceptId(d.id));	    	
  		    	bla.classed(self._getConceptId(d.model_id), true);
  	      }
  	      return "models " + " " +  self._getConceptId(d.model_id) + " " +  self._getConceptId(d.id);
  	  })
  	  .attr("y", function(d, i) {     	
  	      //return self.options.yScale(d.id);
  		  return self._getYPosition(d.rowid);
  	  })
  	  .attr("x", function(d) { return self.options.xScale(d.model_id);})
  	  .attr("width", 10)
  	  .attr("height", 10)
  	  .attr("rx", "3")
  	  .attr("ry", "3")
  	  //I need to pass this into the function
  	  .on("mouseover", function(d) {
  		  self._showModelData(d, this);
	  })
	  .on("mouseout", function(d) {
		  self._clearModelData(d, d3.mouse(this));
	  })

  	  .attr("fill", function(d, i) {
  	      return self.options.colorScale(d.value);
  	  });
      model_rects.transition()
	  .delay(20)
  	  .attr("y", function(d) {
  	      //return self.options.yScale(d.id);
  		  return self._getYPosition(d.rowid);
  	  })
  	  .attr("x", function(d) { return self.options.xScale(d.model_id);})

      model_rects.exit().transition()
          .duration(20)
          //.attr("x", 600)
          .style('opacity', '0.0')
  	  .remove();
  },

    
    _updateAxes: function() {
	var self = this;
  	this.options.h = (this.options.filteredModelData.length*2.5);
  	//this.options.svg.selectAll("yaxis").remove();
  	self.options.yScale = d3.scale.ordinal()
      	    .domain(self.options.filteredModelData.map(function (d) {return d.rowid; }))
      	    
  		.range([0,self.options.filteredModelData.length])
  		.rangePoints([ self.options.yoffset, self.options.yoffset+this.options.h ]);
	    //update accent boxes
  	    self.options.svg.selectAll("#rect.accent").attr("height", self.options.h);


	},

	_createScrollBars: function() {
		var self = this;
		//show the vertical scrollbar if necessary
		if (this.options.phenotypeData.length > this.options.phenotypeDisplayCount) {
			var xpos = self.options.axis_pos_list[2] - 20;
			var ypos = self.options.yAxisMax -16;
			var vert_slider_background = this.options.svg.append("svg:rect")
				//.attr("transform","translate(" + self.options.axis_pos_list[1] + "," + self.options.yoffset +")")
				.attr("class", "vert_slider")
				.attr("x", xpos)
				.attr("width", 16)
				.attr("y", this.options.yoffset+ 18)
				.attr("height", this.options.h - (this.options.yoffset+ 50))
				.attr("fill", "lightgrey");
			
			var rect_slider_up = this.options.svg.append("svg:image")
				.attr("class", "vert_slider")
				.attr("x", xpos)
				.attr("width", 16)
				.attr("y", this.options.yoffset+ 18)
				.attr("height", 16)
				.on("click", function(d) {
					self._clickPhenotypeSlider(-1);
				})
			    .attr("xlink:href","/widgets/modeltype/image/up_arrow.png");
	
			
			var rect_slider_down = this.options.svg.append("svg:image")
				.attr("class", "vert_slider")
				.attr("x", xpos)
				.attr("width", 16)
				.attr("y", this.options.yAxisMax +18)
				.attr("height", 16)
				.on("click", function(d) {
					self._clickPhenotypeSlider(1);
				})
			    .attr("xlink:href","/widgets/modeltype/image/down_arrow.png");
		}
		//show the model scrollbar if necessary
		if (this.options.modelList.length > this.options.modelDisplayCount) {
			var xpos = self.options.axis_pos_list[1] -5;
			var xpos2 = self.options.axis_pos_list[2] - 37;
			var horz_slider_background = this.options.svg.append("svg:rect")
				//.attr("transform","translate(" + self.options.axis_pos_list[1] + "," + self.options.yoffset +")")
				.attr("class", "horz_slider")
				.attr("x", xpos)
				.attr("width", xpos2-xpos)
				.attr("y", this.options.yAxisMax+ 33)
				.attr("height", 16)
				.attr("fill", "lightgrey");
		
			var rect_slider_left = this.options.svg.append("svg:image")
				.attr("class", "horz_slider")
				.attr("x", xpos)
				.attr("width", 16)
				.attr("y", this.options.yAxisMax+ 33)
				.attr("height", 16)
				.on("click", function(d) {
					self._clickModelSlider(-1);
				})
			    .attr("xlink:href","/widgets/modeltype/image/left_arrow.png");
		
			
			var rect_slider_right = this.options.svg.append("svg:image")
				.attr("class", "horz_slider")
				.attr("x", xpos2)
				.attr("width", 16)
				.attr("y", this.options.yAxisMax+ 33)
				.attr("height", 16)
				.on("click", function(d) {
					self._clickModelSlider(1);
				})
			    .attr("xlink:href","/widgets/modeltype/image/right_arrow.png");
		}
	},
	
	//change the text shown on the screen as the scrollbars are used
	_updateScrollCounts: function() {
		this.options.svg.selectAll(".scroll_text").remove();

		var startModelIdx = (this.options.currModelIdx - this.options.modelDisplayCount) + 2;
		var max_count = ((this.options.modelDisplayCount + startModelIdx) >= this.options.modelList.length) ? this.options.modelList.length : this.options.modelDisplayCount + startModelIdx; 
		var display_text = "Matches [" + startModelIdx + "-"+ max_count + "] out of " + (this.options.modelList.length);
		var div_text = this.options.svg.append("svg:text")
			.attr("class", "scroll_text")
			.attr("x", this.options.axis_pos_list[2] +10)
			.attr("y", "55")
			.style("font-size", "9px")
			.text(display_text);
		
		var startPhenIdx = (this.options.currPhenotypeIdx - this.options.phenotypeDisplayCount) + 2;
		var max_count = ((this.options.phenotypeDisplayCount + startPhenIdx) >= this.options.phenotypeData.length) ? this.options.phenotypeData.length : this.options.phenotypeDisplayCount + startPhenIdx ; 
		var display_text = "Phenotypes [" + startPhenIdx + "-"+ max_count + "] out of " + (this.options.phenotypeData.length);
		var div_text = this.options.svg.append("svg:text")
			.attr("class", "scroll_text")
			.attr("x", this.options.axis_pos_list[2] +10)
			.attr("y", "70")
			.style("font-size", "9px")
			.text(display_text);
	},
	
	//NOTE: FOR FILTERING IT MAY BE FASTER TO CONCATENATE THE PHENOTYPE and MODEL into an attribute
	
	
	//change the list of phenotypes and filter the models accordling.  The 
	//movecount is an integer and can be either positive or negative
	_clickPhenotypeSlider: function(movecount) {
		var self = this;
		
		//increment/decrement the count
		var tempIdx = this.options.currPhenotypeIdx + movecount;
		//check to see if the max of the slider is greater than the number of items in the list
		if (tempIdx > this.options.phenotypeData.length) {
			this.options.currPhenotypeIdx = this.options.phenotypeData.length;
		} else if (tempIdx - (this.options.phenotypeDisplayCount -1) < 0) {
			//check to see if the min of the slider is less than the 0
			  this.options.currPhenotypeIdx = (this.options.phenotypeDisplayCount -1);
		} else {
			this.options.currPhenotypeIdx = tempIdx;
		}
		var startIdx = this.options.currPhenotypeIdx - (this.options.phenotypeDisplayCount -1);
		
		this.options.filteredPhenotypeData = [];
		this.options.yAxis = [];
		this.options.filteredModelData = [];
		
		
		//extract the new array of filtered Phentoypes
		//also update the axis
		//also update the modeldata

		var tempFilteredModelData = [];
		var axis_idx = 0;
    	for (var idx=startIdx;idx<self.options.currPhenotypeIdx;idx++) {
    		self.options.filteredPhenotypeData.push(self.options.phenotypeData[idx]);
    		//update the YAxis   	
    		
    		//the height of each row
        	var size = 10;
        	//the spacing you want between rows
        	var gap = 3;

    		var stuff = {"id": self.options.phenotypeData[idx].rowid, "ypos" : ((axis_idx * (size+gap)) + self.options.yoffset)};
    		self.options.yAxis.push(stuff); 
    	    axis_idx = axis_idx + 1;
    	    //update the ModelData
    		var tempdata = self.options.modelData.filter(function(d) {
    	    	return d.rowid == self.options.phenotypeData[idx].rowid;
    	    });
    		tempFilteredModelData = tempFilteredModelData.concat(tempdata);

    	}
    	
    	//now, limit the data returned by models as well
    	for (var idx=0;idx<self.options.filteredModelList.length;idx++) {
    		var tempdata = tempFilteredModelData.filter(function(d) {
    	    	return d.model_id == self.options.filteredModelList[idx].model_id;
    	    });
    		self.options.filteredModelData = self.options.filteredModelData.concat(tempdata);
    		
    	}

    	
	    this._createModelRects();
	    this._createRects();
	    this._updateScrollCounts();

	},

	//change the list of phenotypes and filter the models accordling.  The 
	//movecount is an integer and can be either positive or negative
	_clickModelSlider: function(movecount) {
		var self = this;
		
		//increment/decrement the count
		var tempIdx = this.options.currModelIdx + movecount;
		//check to see if the max of the slider is greater than the number of items in the list
		if (tempIdx > this.options.modelList.length) {
			this.options.currModelIdx = this.options.modelList.length;
		} else if (tempIdx - (this.options.modelDisplayCount -1) < 0) {
			//check to see if the min of the slider is less than the 0
			  this.options.currModelIdx = (this.options.modelDisplayCount -1);
		} else {
			this.options.currModelIdx = tempIdx;
		}
		var startIdx = this.options.currModelIdx - (this.options.modelDisplayCount -1);

		this.options.filteredModelList = [];
		this.options.filteredModelData = [];
		
		
		//extract the new array of filtered Phentoypes
		//also update the axis
		//also update the modeldata

		var tempFilteredModelData = [];
		var axis_idx = 0;
    	for (var idx=startIdx;idx<self.options.currModelIdx;idx++) {
    		self.options.filteredModelList.push(self.options.modelList[idx]);
    		//update the YAxis   	
    		
    		var tempdata = self.options.modelData.filter(function(d) {
    	    	return d.model_id == self.options.modelList[idx].model_id;
    	    });
    		tempFilteredModelData = tempFilteredModelData.concat(tempdata);

    	}

    	//now, limit the data returned by phenotypes as well
    	for (var idx=0;idx<self.options.filteredPhenotypeData.length;idx++) {
    		var tempdata = tempFilteredModelData.filter(function(d) {
    	    	return d.rowid == self.options.filteredPhenotypeData[idx].rowid;
    	    });
    		self.options.filteredModelData = self.options.filteredModelData.concat(tempdata);
    		
    	}

    	
    	self.options.svg.selectAll("g .x.axis")
          .remove();
    	self.options.svg.selectAll("g .tick.major")
        	.remove();
    	//update the x axis
    	self.options.xScale = d3.scale.ordinal()
  			.domain(self.options.filteredModelList.map(function (d) {
  				return d.model_id; }))
  	        .rangeRoundBands([0,self.options.modelWidth]);
  	    model_x_axis = d3.svg.axis()
  			.scale(self.options.xScale).orient("top");
  	    var model_region = self.options.svg.append("g")
	  		.attr("transform","translate(" + (self.options.textWidth + 20) +"," + self.options.yoffset + ")")
	  		.attr("class", "x axis")
	  		.call(model_x_axis)
	  	    //this be some voodoo...
	  	    //to rotate the text, I need to select it as it was added by the axis
	  		.selectAll("text") 
	  		.each(function(d,i) { 
	  		    self._convertLabelHTML(this,
	  			self._getShortLabel(self.options.filteredModelList[i].model_label, 15),self.options.filteredModelList[i]);}); 

 	    this._createModelRects();
	    this._createRects();
	    this._updateScrollCounts();

	},

	_createAccentBoxes: function() {
	    var self=this;
	    
	    this.options.modelWidth = this.options.filteredModelList.length * 18
	    //add an axis for each ordinal scale found in the data
	    for (var i=0;i<this.options.dimensions.length;i++) {
	    	//move the last accent over a bit for the scrollbar
			if (i == 2) {
				self.options.axis_pos_list.push((this.options.textWidth + 30) 
					       + this.options.colStartingPos 
					       + this.options.modelWidth);
			} else {
				self.options.axis_pos_list.push((i*(this.options.textWidth + 10)) + 
					       this.options.colStartingPos);
			}
	    }
	
	    //create accent boxes
	    var rect_accents = this.options.svg.selectAll("#rect.accent")
		.data(this.options.dimensions, function(d) { return d;});
	    rect_accents.enter()
	    	.append("rect")
		.attr("class", "accent")
		.attr("x", function(d, i) { return self.options.axis_pos_list[i];})
		.attr("y", self.options.yoffset)
		.attr("width", self.options.textWidth + 5)
		.attr("height", self.options.h)
		.style("opacity", '0.4')
		.attr("fill", function(d, i) {
		    return i != 1 ? d3.rgb("#e5e5e5") : "white";
		});
	    
	    //add text headers
	    var rect_headers = this.options.svg.selectAll("#text.accent")
		.data(this.options.dimensions, function(d) { return d;});
	    rect_headers.enter()
	    	.append("text")
		.attr("class", "accent")
		.attr("x", function(d, i) { return (self.options.axis_pos_list[i]+10);})
		.attr("y", self.options.yoffset-10)
		//.attr("width", self.options.textWidth + 5)
		//.attr("height", self.options.h)
		//.style("opacity", '0.4')
		.style("display", function(d, i) {
		    return i != 1 ? "" : "none";
		})
		.text(String);
},
    
//IMPORTANT!! THIS 
	//this code creates the colored rectangles below the models
	_createModelRegion: function () {
	    //model_x_axis = undefined;
	    var self=this;
	    this.options.xScale = d3.scale.ordinal()
		.domain(this.options.filteredModelList.map(function (d) {
		    return d.model_id; }))
	        .rangeRoundBands([0,this.options.modelWidth]);
	    model_x_axis = d3.svg.axis()
			.scale(this.options.xScale).orient("top");
	    var model_region = this.options.svg.append("g")
			.attr("transform","translate(" + (this.options.textWidth + 20) +"," + this.options.yoffset + ")")
			.call(model_x_axis)
			.attr("class", "x axis")
		    //this be some voodoo...
		    //to rotate the text, I need to select it as it was added by the axis
			.selectAll("text") 
			.each(function(d,i) { 
			    self._convertLabelHTML(this,
				self._getShortLabel(self.options.filteredModelList[i].model_label, 15),self.options.filteredModelList[i]);}); 


	    var temp_data = this.options.modelData.map(function(d) { 
			return d.value;});
	    var diff = d3.max(temp_data) - d3.min(temp_data);
	    //only show the scale if there is more than one value represented
	    //in the scale
	    if (diff > 0) {
		    //create a scale
		    var color_values = [];
		    var temp_data = this.options.modelData.map(function(d) { 
			return d.value;});
		    var diff = d3.max(temp_data) - d3.min(temp_data);
		    var step = (diff/5);
		    for (var idx=0;idx<6;idx++) {
			var t = d3.min(temp_data);
			var t2 = t + (idx * step);
			color_values.push(t2);
		    }
/*		    //color_values.reverse();
		    var legend_rects = this.options.svg.selectAll("#legend_rect")
			.data(color_values);
		    legend_rects.enter()
			.append("rect")
			.attr("transform","translate(15,10)")
			.attr("class", "legend_rect")
			.attr("y", "39")
			.attr("x", function(d, i) {
			    return (i* 32);
			})
			.attr("width", 20)
			.attr("height", 20)
			.attr("fill", function(d) {
			    return self.options.colorScale(d);
			});
		    var legend_text = self.options.svg.selectAll("#legend_text")
		        .data(color_values);
		    legend_text.enter()
			.append("text")
			.attr("transform","translate(15,10)")
			.attr("class", "legend_text")
			.attr("y", "35")
			.attr("x", function(d, i) {
			    return (i* 32);
			})
			.text(function(d) {
			    return d.toFixed(1);
			});
			*/
		    
		    //start # a4 d6 d4
		    //stop # 44 a2 93
		    var gradient = this.options.svg.append("svg:linearGradient")
				.attr("id", "gradient")
				.attr("x1", "0")
				.attr("x2", "100%")
				.attr("y1", "0%")
				.attr("y2", "0%");
				//.attr("gradientUnits", "userSpaceOnUse")
				//.attr("spreadMethod", "pad");

			gradient.append("svg:stop")
				.attr("offset", "0%")
				.style("stop-color", this.options.minColorScale)
				.style("stop-opacity", 1);
			
			gradient.append("svg:stop")
				.attr("offset", "100%")
				.style("stop-color", this.options.maxColorScale)
				.style("stop-opacity", 1);

		    var legend_rects = this.options.svg.append("rect")
			.attr("transform","translate(0,10)")
			.attr("class", "legend_rect")
			.attr("y", "29")
			.attr("x", 15)
			.attr("width", 180)
			.attr("height", 20)
			.attr("fill", "url(#gradient)");

	
		    var div_text1 = self.options.svg.append("svg:text")
				.attr("transform","translate(0,10)")
				.attr("class", "detail_text")
				.attr("y", "22")
				.style("font-size", "10px")
				.text("Less Similar");
		    var div_text = self.options.svg.append("svg:text")
				.attr("transform","translate(65,10)")
				.attr("class", "detail_text")
				.attr("y", "22")
				.style("font-size", "12px")
				.text("Similarity Scale");
		    var div_text2 = self.options.svg.append("svg:text")
				.attr("transform","translate(160,10)")
				.attr("class", "detail_text")
				.attr("y", "22")
				.style("font-size", "10px")
				.text("More Similar");
			
	    }
	},
	
	
	update: function() {
		this._updateAxes();
		this._createRects();
		this._createModelRects() ;
	},

	changeThreshold: function(obj, value) {
		//reset the color on all the other controls
	    var controls = this.options.svg.selectAll(".legend_control");
	    controls[0].forEach(function(ctl) {
		ctl.setAttribute('fill', 'lightgrey');
	    });
	    //set the selected control to black
	    obj.setAttribute('fill', 'black');
	    
	    var new_data = this.options.modelData.filter(function(d){
	    	return d.value.toFixed(6) >= value.toFixed(6);
	    });
	    this.options.filteredModelData = new_data.slice();
	    
	    // var new_data2 = comparison_data.filter(function(d){
	    //	 return d.score.toFixed(6) >= value.toFixed(6);
	    // });
	    this.options.filteredModelData = new_data.slice();
	    //filtered_data = new_data2.slice();
	    
	    var data_size = this.options.filteredModelData.length/2;
	    //this.options.svg.setAttribute('height', data_size *20);
	    //this.options.svg.attr('height') = data_size *20;
	    //this.options.svg.height = data_size*20;
	    //h = data_size*5;
	    //this.options.svg.style('height', data_size*20);
	    //init();
	    update();
	},


	//this code creates the text and rectangles containing the text 
	//on either side of the model data
	_createRects: function() {
	    // this takes some 'splaining
	    //the raw dataset contains repeats of data within the
	    //A,subsumer, and B columns.   
	    //If d3 sees the same label 4 times (ex: Abnormality of the
	    //pharynx) then it will 
	//create a rectangle and text for it 4 times.  Therefore, I
	    //need to create a unique set of  
	//labels per axis (because the labels can repeat across axes)

	    var self=this;
	    var rect_text = this.options.svg
		.selectAll(".a_text")
		.data(this.options.filteredPhenotypeData, function(d) { return d.rowid; });
	    rect_text.enter()
		.append("text")
		.attr("class", function(d) {
		    return "a_text data_text " + self._getConceptId(d.id);
		})
	    //store the id for this item.  This will be used on click events
		.attr("ontology_id", function(d) {
		    return self._getConceptId(d.id_a);
		})
		.attr("x", 15)
		.attr("y", function(d) {
		    //return self.options.yScale(d.rowid)+28;
		    return self._getYPosition(d.rowid) +28;
		})
		.on("mouseover", function(d) {
		    if (self.options.clickedData == undefined) {
			self._selectData(d, this);
		    }
		})
		.on("mouseout", function(d) {
//	    	self.options.svg.selectAll(".row_accent").remove();
		    if (self.options.clickedData == undefined) {
			self._deselectData(d, d3.mouse(this));
		    }
		})
/*		.on("click", function(d) {
		    self._rectClick(this);
		})*/
		.attr("width", self.options.textWidth)
		.attr("height", 50)
		.style("font-size", "12px")
		.text(function(d) {
			var txt = d.label_a;
			if (txt == undefined) {
				txt = d.id_a;
			}
		    return self._getShortLabel(txt);
		})
	    rect_text.transition()
		.delay(20)
		.attr("y", function(d) {
		    //return self.options.yScale(d.rowid)+28;
			return self._getYPosition(d.rowid)+28;
		})
	    rect_text.exit()
	   	.transition()
	   	.delay(20)
	   	.style('opacity', '0.0')

	   	//.attr("y", 1600)
		.remove();
	    
	    
	    var rect_text2 = this.options.svg
		.selectAll(".lcs_text")
		.data(self.options.filteredPhenotypeData, function(d) { return d.rowid; });
	    rect_text2.enter()
		.append("text")
		.attr("class", function(d,i) {
		    if (i==0 || (self.options.filteredPhenotypeData[i-1].subsumer_label != d.subsumer_label)) {
			return "lcs_text data_text " + self._getConceptId(d.id) + " " + self._getConceptId(d.subsumer_id);
		    }
		    
		})
	    //store the id for this item.  This will be used on click events
		.attr("ontology_id", function(d) {
		    return self._getConceptId(d.subsumer_id);
		})
//		.attr("x", self.options.textWidth + 15 + self.options.colStartingPos + self.options.modelWidth)
	     .attr("x", self.options.axis_pos_list[2]+3)
		.attr("y", function(d) {
		    //return self.options.yScale(d.rowid)+28;
			return self._getYPosition(d.rowid)+28;
		})
		.on("mouseover", function(d) {
		    if (self.options.clickedData == undefined) {
			self._selectData(d, this);
		    }
		})
		.on("mouseout", function(d) {
//	    	self.options.svg.selectAll(".row_accent").remove();
			
		    if (self.options.clickedData == undefined) {
			self._deselectData(d, d3.mouse(this));
		    }
		})
/*		.on("click", function(d) {
		    self._rectClick(this);
		})*/
		.attr("width", self.options.textWidth)
		.attr("height", 50)
		.style("font-size", "12px")
		.text(function(d,i) {
		    if (i==0) {
		    	var txt = d.subsumer_label;
		    	if (txt == undefined) {
		    		txt = d.subsumer_id;
		    	}
			return self._getShortLabel(txt);
		    }
		    if (self.options.filteredPhenotypeData[i-1].subsumer_label != d.subsumer_label) {
		    	var txt = d.subsumer_label;
		    	if (txt == undefined) {
		    		txt = d.subsumer_id;
		    	}
			    return self._getShortLabel(txt);
		    }
		})
	    rect_text2.transition()
		.delay(20)
		.attr("y", function(d) {
		    //return self.options.yScale(d.rowid)+28;
			return self._getYPosition(d.rowid)+28;
		})
	    rect_text2.exit()
		.transition()
		.delay(20)
		//.attr("y", 1600)
		.style('opacity', '0.0')

		.remove();
	    
	},

	_rectClick: function(data) {
	    var retData;
	    this._showThrobber();
	    jQuery.ajax({
		url : this.options.serverURL + "/phenotype/" + data.attributes["ontology_id"].value + ".json",
		async : false,
		dataType : 'json',
		success : function(data) {
		    //retData = data;
		    retData = "<strong>Label:</strong> " + "<a href=\"" + data.url + "\">"  
			+ data.label + "</a><br/><strong>Type:</strong> " + data.category;
		}
	    });
	    //this._updateDetailSection(retData, d3.mouse(data));
	    this._updateDetailSection(retData, this._getXYPos(data));

	},

	_selectModel: function(modelData, obj) {
		var self=this;
	    //this._showThrobber();
		//select the model label
		
		
		var model_label = self.options.svg.selectAll("p#" + this._getConceptId(modelData.model_id));
    	model_label.style("color", "blue");
		model_label.style("text-decoration", "underline");

		//create the related model rectangles
		var highlight_rect = self.options.svg.append("svg:rect")
		  	  .attr("transform",
		  			  "translate(" + (self.options.textWidth + 20) + ",20)")
			.attr("x", function(d) { return (self.options.xScale(modelData.model_id)-2);})
			.attr("y", self.options.yoffset)
			.attr("class", "model_accent")
			.attr("width", 14)
			.attr("fill", d3.rgb(self.options.orangeHighlight))
			.attr("opacity", '0.5')
			.attr("height", (self.options.yAxisMax-87));

		var retData;
		//initialize the model data based on the scores
		retData = "<strong>Gene Label:</strong> "   
			+ modelData.model_label + "<br/><strong>Rank:</strong> " + (parseInt(modelData.model_rank) + 1)
			+ "<br/><strong>Score:</strong> " + modelData.model_score;

/*		jQuery.ajax({
			url : this.options.serverURL +"/genotype/" + this._getConceptId(modelData.model_id) + ".json",
			async : false,
			dataType : 'json',
			success : function(data) {
				//retData = data;
				retData = "<strong>Gene Label:</strong> "   
				+ modelData.model_label + "<br/><strong>Rank:</strong> " + (parseInt(modelData.model_rank) + 1)
				+ "<br/><strong>Score:</strong> " + modelData.model_score;
				
				/* REMOVED the gentoype info for now...
				+ "<br/><strong>Genotype(s):</strong> ";
			    //generate a unique list of genotypes
			    var temp_list = [];
			    for (var idx=0;idx<data.phenotype_associations.length;idx++) {
				var str_temp = data.phenotype_associations[idx].has_genotype.label;
				//the genotypes frequently contain <> signs.  Escape them before
				//trying to display them.
				str_temp = str_temp.replace(/</g, "&lt;");
				str_temp = str_temp.replace(/>/g, "&gt;");
				if (temp_list.indexOf(str_temp) == -1) {
				    temp_list.push(str_temp);
				}
			    }
			    for (var idx=0;idx<temp_list.length;idx++) {
				retData = retData + temp_list[idx] + "<br/>";
			    }
			    //console.log("data: " + retData);*/
/*			}
		});
*/
		//obj = try creating an ojbect with an attributes array including "attributes", but I may need to define
		//getAttrbitues
		//just create a temporary object to pass to the next method...
		var obj = {
				attributes: [],
				getAttribute: function(keystring) {
					var ret = self.options.xScale(modelData.model_id)-2;
					if (keystring == "y") {
						ret = Number(self.options.yoffset)-120;
					}
					return ret;
				},
        };
		
		obj.attributes['transform'] = {value: highlight_rect.attr("transform")};
		
		this._updateDetailSection(retData, this._getXYPos(obj), undefined, 45);
	    //this._updateDetailSection(retData);

	    /*
    	// Get the d3js SVG element
    	var tmp = document.getElementById("phen_vis");
    	var svg = tmp.getElementsByTagName("svg")[0];
    	// Extract the data as SVG text string
    	var svg_xml = (new XMLSerializer).serializeToString(svg);

    	console.log(svg_xml);
*/
	},


    //given an array of phenotype objects 
	//edit the object array.
	// items are either ontology ids as strings, in which case they are handled as is,
	// or they are objects of the form
	// { "id": <id>, "observed": <obs>} .
	// in that case take id  if  "observed" is "positive"
    _filterPhenotypeResults : function(phenotypelist) {

    	var newlist = [];

	for (var i = 0; i < phenotypelist.length; i++) {
	    pheno = phenotypelist[i];
	    if (typeof pheno ==='string') {
		newlist.push(pheno);
	    }
	    if (pheno.observed==="positive")
		newlist.push(pheno.id);
	}
    	
    	return newlist;
    }
    
  });


})(jQuery);
