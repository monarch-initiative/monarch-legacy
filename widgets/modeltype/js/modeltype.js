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
var url = document.URL;
//Save this for future use - this appends a link for a css file - for now the styles are embedded in the code 
/**$(document).ready(function(){    
	 //console.log(url);
	 if (url != "http://localhost:8080/page/widget"){
     $('head').append('<link href="/css/modelviewer.css" type="text/css" rel="stylesheet" />');} 
});*/

(function($) {
    
    $.widget("ui.modeltype", {

	options:   {
	    axis_pos_list: [],
		clickedData: undefined, 
		colorScaleB: undefined,
		colorScaleR: undefined,
		colStartingPos: 10,
		combinedModelData : [],
		combinedModelList : [],
		comparisonType : "genes",
		currModelIdx : 0,
	    currPhenotypeIdx : 0,
		currSelectedRect: undefined,
	    detailRectWidth: 240,   
        detailRectHeight: 140,
        detailRectStrokeWidth: 3,
	    dimensions: [ "Phenotype Profile", "Lowest Common Subsumer", "Phenotypes in common" ], 
		drag: undefined,
		filteredHumanModelData: [],
	    filteredModelData: [],
		filteredModelList: [],
	    filteredPhenotypeData: [],
		filteredFullModelData: [],
		filteredFullPhenotypeData: [],
		filteredOtherModelData: [],
	    globalViewWidth : 110,
	    globalViewHeight : 110,	
	    h : 0,
		highlightRect: undefined,
		inputPhenotypeData : [],	  	    
	    m :[ 30, 10, 10, 10 ], 
		maxICScore : 0,
	    modelData: [],
		modelDisplayCount : 30,
	    modelList: [],
	    modelWidth: undefined,
		multiOrganismCt: 10,
		multiOrgModelLimit: 750,
		orangeHighlight: "#ea763b",
		orgModelList: [],
		origPhenotypeData: [],
		phenotypeData: [],
	    phenotypeDisplayCount : 26,
		phenotypeLabels : [],
		phenotypeSortData: [],
		scriptpath : $('script[src]').last().attr('src').split('?')[0].split('/').slice(0, -1).join('/')+'/',
		selectedCalculation: 0,
		selectedColumn: undefined,
		selectedLabel: "Default",
		selectedOrder: 0,
		selectedRow: undefined,
		selectedSort: "Frequency",
		selectList: [{label: "Distance", calc: 0}, {label: "Ratio (q)", calc: 1}, {label: "Ratio (t)", calc: 3} , {label: "Uniqueness", calc: 2}],
		selectRectHeight : 0,
		selectRectWidth : 0,
		serverURL : "",
		sortList: [{type: "Alphabetic", order: 0},{type: "Frequency and Rarity", order:1} ,{type: "Frequency", order:2} ],
	    smallXScale: undefined,
	    smallYScale: undefined,	
		speciesList : [],		
	    svg: undefined,
		targetSpecies: "2",
		targetSpeciesList : [{ name: "Homo sapiens", taxon: "9606", color: 'rgb(25,59,143)'}, 
							 { name: "Mus musculus", taxon: "10090", color: 'rgb(70,19,19)'},
							 { name: "Danio rerio", taxon: "7955", color: 'rgb(1,102,94)'}, 
							 { name: "Drosophila melanogaster", taxon: "7227", color:'purple'} , 
							 { name: "Overview", taxon: "2"}], //, {name: "All", taxon: "1"}],
	    targetSpeciesName : "Overview",
		textLength: 34,
		textWidth: 200,
		unmatchedPhenotypes: [],
		w : 0,
	    xScale: undefined, 
		yAxis: [],
		yAxisMax : 0,
		yoffset: 85,
		yoffsetOver: 0,
	    yScale: undefined,	
		yTranslation: 0,
		//Overview data
		flydata : undefined,
		humandata : undefined,
		mousedata : undefined,
		zfishdata : undefined,
	},
	   		
		//reset option values if needed before reloading data
		_reset: function() {
			var self = this;

			self.options.currModelIdx = 0;
			self.options.currPhenotypeIdx = 0;						
			self.options.globalViewWidth = 110;
			self.options.globalViewHeight = 110;			
			self.options.maxICScore = 0;			
			self.options.modelDisplayCount = 30;
			self.options.modelWidth = undefined;			
			self.options.phenotypeDisplayCount = 26;
			self.options.selectRectHeight = 0;
			self.options.smallXScale = undefined;
			self.options.smallYScale = undefined;
			self.options.svg = undefined;
			self.options.xScale = undefined;
			self.options.yAxis = [];
			self.options.yAxisMax = 0;
			self.options.yoffset = 85;
			self.options.yoffsetOver = 0;
			self.options.yScale = undefined;			
			self.options.yTranslation = undefined;
			
			//reset data arrays
			self.options.combinedModelData = [];
			self.options.combinedModelList = [];
			self.options.filteredFullModelData = [];
			self.options.filteredFullPhenotypeData = [];
			self.options.filteredHumanModelData = [];
			self.options.filteredModelData = [];
			self.options.filteredModelList = [];
			self.options.filteredOtherModelData = [];
			self.options.filteredPhenotypeData = [];
			self.options.modelData = [];
			self.options.modelList = [];
			self.options.orgModelList = [];
			self.options.phenotypeSortData = [];	

			//Overview data
			self.options.flydata = undefined;
			self.options.humandata = undefined;
			self.options.mousedata = undefined;
			self.options.speciesList = [];
			self.options.zfishdata = undefined;
			
			//starting arrays:
			//self.options.modelData = [];
			//self.options.modelList = [];
			//self.options.filteredPhenotypeData = [];
			
			
	},
	
	
	//NOTE: I'm not too sure what the default init() method signature should be
	//given an imageDiv and phenotype_data list
	/**
	 * imageDiv - the place you want the widget to appear
	 * phenotype_data - a list of phenotypes in the following format:
	 * [ {"id": "HP:12345", "observed" :"positive"}, {"id: "HP:23451", "observed" : "negative"}, É]
	 */
	_create: function() {
	    
		//save a copy of the original phenotype data
		this.options.origPhenotypeData = this.options.phenotypeData.slice();
		this._setTargetSpeciesName(this.options.targetSpecies);
		this._setSelectedCalculation(this.options.selectedCalculation);
		this._setSelectedSort(this.options.selectedSort);
		this.options.yTranslation =(this.options.targetSpecies == '9606') ? 0 : 0;
		this.options.w = this.options.m[1]-this.options.m[3];
	    this.options.h = 1300 -this.options.m[0]-this.options.m[2];
	    this.options.currModelIdx = this.options.modelDisplayCount-1;
	    this.options.currPhenotypeIdx = this.options.phenotypeDisplayCount-1;
		this.options.phenotypeLabels = this._filterPhenotypeLabels(this.options.phenotypeData);
	    this.options.phenotypeData = this._filterPhenotypeResults(this.options.phenotypeData);
	    this.options.inputPhenotypeData = this.options.phenotypeData.slice();
		this._loadData();
		var modData = [];
		if (this.options.targetSpeciesName == "Overview") {
			modData = this.options.combinedModelData.slice();
			this.options.yoffsetOver = 30;
		}
		else {
			modData = this.options.modelData.slice();
			this.options.yoffsetOver = 0;
		}	    
		this._filterData(modData.slice());
		this.options.unmatchedPhenotypes = this._getUnmatchedPhenotypes();
		
	    if ((this.options.combinedModelData.length != 0) ||
		    (modData.length != 0 && this.options.phenotypeData.length != 0 && this.options.filteredPhenotypeData.length != 0)){	    
	         
	            //this._createYAxis();
	    	    //just pad the overall height by a skosh...
	    	    this.options.h = this.options.yAxisMax + 60;
	            this._initCanvas(); 
				this._addLogoImage();	        
	            this.options.svg
					.attr("width", "100%")
					.attr("height", 480); //this.options.h - 20 + this.options.yTranslation);
				this._createAccentBoxes();				
	            //this._createScrollBars();
	            this._createColorScale();
	            this._createModelRegion();
	    	    this._updateAxes();
				this._createGridlines();
	    	    this._createModelRects();
	    	    this._createRects();			
	    		//this._updateScrollCounts();
	    		this._createOverviewSection();
	    } 
	},
	
	//create this visualization if no phenotypes or models are returned
	_createEmptyVisualization: function(url, organism) {

		var self = this;
		var fullmsg = "There are no " + organism + " models for this disease. "
		d3.select("#svg_area").remove();
		this.element.append("<svg id='svg_area'></svg>");
        this.options.svg = d3.select("#svg_area");
        self.options.svg
			.attr("width", 1100)
			.attr("height", 70);
        self.options.h = 60;
        self.options.yoffset = 50;
        self.options.svg.append("text")
            .attr("x", 80)
            .attr("y", 60)
            .attr("height", 70)
            .attr("width", 200)
			.attr("id", "errmsg")
            .text(fullmsg);	
	
		var html = "<br /><div id='return'><button id='button' type='button'>Return</button></div>";	this.element.append(html);
					
		var btn = d3.selectAll("#button")
			.on("click", function(d,i){
				$("#return").remove();
				$("#errmsg").remove();
				d3.select("#svg_area").remove();
				self.options.phenotypeData = self.options.origPhenotypeData.slice();
				self.options.targetSpecies =  '2';
				self._reset();
				self._create();
		});
	},
	
	//adds light gray gridlines to make it easier to see which row/column selected matches occur
	_createGridlines: function() { 
		var self=this;
		
		//create a blank grid to match the size of the modelviewer grid				
		var data = new Array(),
			modelCt = 0;
		
		//This is for the new "Overview" target option 		
		//if (this.options.targetSpeciesName == "Overview"){ modelCt = self.options.multiOrganismCt * 3;}
		//else { modelCt = self.options.modelDisplayCount;}
		modelCt = self.options.modelDisplayCount;
		for (var k = 0; k < self.options.phenotypeDisplayCount; k++){
			for (var l = 0; l < modelCt; l++) {
			   var r = [];
			   r.push(k);
			   r.push(l);				   
			   data.push( r );
			}
		}
		self.options.svg.selectAll("rect.bordered")
				   .data(data)
				   .enter()
				   .append("rect")
				   .attr("id","gridline")
				   .attr("transform","translate(232, " + (self.options.yoffset + self.options.yoffsetOver + 5) +")")
				   .attr("x", function(d,i) { return d[1] * 18 })
				   .attr("y", function(d,i) { return d[0] * 13 })  
				   .attr("class", "hour bordered deselected")
				   .attr("width", 14)
				   .attr("height", 11.5);				      
	}, 
	
	//for the selection area, see if you can convert the selection to the idx of the x and y
	//then redraw the bigger grid 
	_createOverviewSection: function() {
		var self=this;
		
		if (this.options.phenotypeData.length < 26) {
			self.options.globalViewHeight = 30;
		}
		var globalview = self.options.svg.append("rect")
			//note: I had to make the rectangle slightly bigger to compensate for the strike-width
			.attr("x", self.options.axis_pos_list[2] + 42)
			.attr("y", self.options.yoffset + self.options.yoffsetOver+ 30 + this.options.yTranslation)
			.attr("id", "globalview")
			.attr("height", self.options.globalViewHeight + 6)
			.attr("width", self.options.globalViewWidth + 6);
			
		var scoretip = self.options.svg.append("text")
				.attr("transform","translate(" + (self.options.axis_pos_list[2] ) + "," + (self.options.yTranslation + self.options.yoffset - 6) + ")")
    	        .attr("x", 0)
				.attr("y", 0)
				.attr("class", "tip")
				.text("< Model Scores");			
		
		var tip	= self.options.svg
				.append("svg:image")				
				.attr("xlink:href", this.options.scriptpath + "../image/greeninfo30.png")
				.attr("transform","translate(" + (self.options.axis_pos_list[2] +102) + "," + (self.options.yTranslation + self.options.yoffset - 20) + ")")
				.attr("id","modelscores")
				.attr("x", 0)
				.attr("y", 0)
				.attr("width", 15)
    	        .attr("height", 15)		
				.on("click", function(d) {
					var name = "modelscores";					
					self._showDialog(name);
				});
		
		var rect_instructions = self.options.svg.append("text")
 			.attr("x", self.options.axis_pos_list[2] + 10)
			.attr("y", self.options.yoffset + self.options.yoffsetOver + 5 + this.options.yTranslation)
 			.attr("class", "instruct")
 			.text("Use the phenotype map below to");
 		
 		var rect_instructions = self.options.svg.append("text")
 			.attr("x", self.options.axis_pos_list[2] + 10)
			.attr("y", self.options.yoffset + self.options.yoffsetOver + 15 + this.options.yTranslation) 
 			.attr("class", "instruct")
 			.text("navigate the model view on the left");
			
	    var  sortDataList = [];
		
		for (i=0; i<self.options.phenotypeSortData.length; i++) {
			sortDataList.push(self.options.phenotypeSortData[i][0].id_a);  //rowid
		}
		var mods = [],
			modData = [];
		
		//This is for the new "Overview" target option 
		if (this.options.targetSpeciesName == "Overview") {
			mods = self.options.combinedModelList;
			modData = self.options.combinedModelData;
		}
		else {
			mods = self.options.modelList;
			modData = self.options.modelData;
		}
	
		this.options.smallYScale = d3.scale.ordinal()
		    .domain(sortDataList.map(function (d) {return d; }))				    
		    .rangePoints([0,self.options.globalViewHeight]);

		this.options.smallXScale = d3.scale.ordinal()
		    .domain(mods.map(function (d) {return d.model_id; }))
		    .rangePoints([0,self.options.globalViewWidth]);

  		//next assign the x and y axis using the full list
		//add the items using smaller rects

	     var model_rects = this.options.svg.selectAll(".mini_models")
	      	.data(modData, function(d) {
	      	    return d.id;
	      	});
			
	     model_rects.enter()
		  	  .append("rect")
		  	  .attr("transform",
		  		"translate(" + (self.options.axis_pos_list[2] + 42) + "," + (self.options.yoffset + self.options.yoffsetOver +30 + self.options.yTranslation) + ")")
		  	  .attr("class",  "mini_model")
		  	  .attr("y", function(d, i) { return self.options.smallYScale(d.id_a);})
		  	  .attr("x", function(d) { return self.options.smallXScale(d.model_id);})
		  	  .attr("width", 2)
		  	  .attr("height", 2)
		  	  .attr("fill", function(d, i) {
					//This is for the new "Overview" target option 
					if (self.options.targetSpeciesName == "Overview"){
						if (d.species == "Homo sapiens") {return self.options.colorScaleB(d.value);} 
						else if (d.species == "Mus musculus") {return self.options.colorScaleR(d.value);}
						else if (d.species == "Danio rerio") {return self.options.colorScaleG(d.value);}
					}	
					else {	
						return self.options.colorScaleB(d.value); 
				  }
		  	  });
			  
		selectRectHeight = self.options.smallYScale(self.options.phenotypeSortData[self.options.phenotypeDisplayCount-1][0].id_a); //rowid
		selectRectWidth = self.options.smallXScale(mods[self.options.modelDisplayCount-1].model_id);
		//create the "highlight" rectangle
		self.options.highlightRect = self.options.svg.append("rect")
			.attr("transform",												//133
		  		"translate(" + (self.options.axis_pos_list[2] + 41) + "," + (116+ self.options.yoffsetOver + self.options.yTranslation) + ")")
			.attr("x", 0)
			.attr("y", 0)		
			.attr("class", "draggable")					
			.call(d3.behavior.drag()
				.origin(function() {
					var current = d3.select(this);
					return {x: current.attr("x"), y: current.attr("y") };
				})
                .on("drag", function(d) {
                	
                	//notes: account for the width of the rectangle in my x and y calculations
                	//do not use the event x and y, they will be out of range at times.  use the converted values instead.
                	var rect = self.options.svg.select("#selectionrect");
        		  	rect.attr("transform","translate(0,0)")
        			//limit the range of the x value
        			var newX = d3.event.x - (self.options.axis_pos_list[2] + 45);
        		  	newX = Math.max(newX,0);
        		  	newX = Math.min(newX,(110-self.options.smallXScale(mods[self.options.modelDisplayCount-1].model_id)));
               	    rect.attr("x", newX + (self.options.axis_pos_list[2] + 45))
               	    //limit the range of the y value
        			var newY = d3.event.y - 119;					
        		  	newY = Math.max(newY,0);
        		  	newY = Math.min(newY,(self.options.globalViewHeight-self.options.smallYScale(self.options.phenotypeSortData[self.options.phenotypeDisplayCount-1][0].id_a)));  //rowid
               	    rect.attr("y", newY + 119 + self.options.yTranslation + self.options.yoffsetOver);
					
        			var xPos = newX;
        			
        			var leftEdges = self.options.smallXScale.range();
			        var width = self.options.smallXScale.rangeBand()+10;
			        var j;
			        for(j=0; xPos > (leftEdges[j] + width); j++) {}
			            //do nothing, just increment j until case fails
               	    var newModelPos = j+self.options.modelDisplayCount;

			  		var yPos = newY;
			  		
        			var leftEdges = self.options.smallYScale.range();
			        var height = self.options.smallYScale.rangeBand();// + self.options.yTranslation;
			        var j;
			        for(j=0; yPos > (leftEdges[j] + height); j++) {}
			            //do nothing, just increment j until case fails
               	    var newPhenotypePos = j+self.options.phenotypeDisplayCount;

                    self._updateModel(newModelPos, newPhenotypePos);
                
                }))


			.attr("id", "selectionrect")
			//set the height and width to match the number of items shown on the axes
			.attr("height", self.options.smallYScale(self.options.phenotypeSortData[self.options.phenotypeDisplayCount-1][0].id_a))  //rowid
			.attr("width", self.options.smallXScale(mods[self.options.modelDisplayCount-1].model_id));
	},

	_getUnmatchedPhenotypes : function(){
	
		var fullset = this.options.inputPhenotypeData,
			partialset = this.options.phenotypeSortData,
			full = [],
			partial = [],
			matchedset = [],
			unmatchedset = [];
			
			for (i=0; i < fullset.length; i++) {
				full.push(fullset[i]);
			}
			for (j=0; j < partialset.length; j++) {
				partial.push((partialset[j][0].id_a).replace("_", ":"));
			}
			for (k=0; k <full.length; k++) {
				//if no match in fullset
				if (partial.indexOf(full[k]) < 0) {	
					//if there unmatched set is empty, add this umatched phenotype
					unmatchedset.push(full[k]);
				}
			}
			unmatchedset = unmatchedset.slice();
						
			var dupArray = [];
			dupArray.push(unmatchedset[0]);	
			//check for dups
			for ( i=1; i < unmatchedset.length;i++){
				if (dupArray.indexOf(unmatchedset[i]) < 0) 
				{
					dupArray.push(unmatchedset[i]);
				}		
			}					
			if (dupArray[0] == undefined) {dupArray = []};
			
			/**self.options.phenotypeSortData.sort(function(a,b) {
		    var labelA = a.label.toLowerCase(), 
				labelB = b.label.toLowerCase();
			if (labelA < labelB) {return -1;}
			if (labelA > labelB) {return 1;}
			return 0;
			});	*/	
			
			
			return dupArray;
	},
	
	_showUnmatchedPhenotypes : function(){
		var self=this;
	
		var unmatched = self.options.unmatchedPhenotypes,
			dupLabels = [],
			text = "";
			
		/**unmatched.sort(function(a,b) {
			vst phenA = a.
		}*/
		
		var labels = self.options.phenotypeLabels;
		for (i = 0; i < unmatched.length; i++)
		{
			for (j=0; j<labels.length; j++){
				if ((labels[j].id).indexOf(unmatched[i]) != -1){					
					if (dupLabels.indexOf(labels[j].label) < 0) {
						var label = labels[j].label;
						//console.log(labels[j].label);
						var url_origin = self.document[0].location.origin;
						text = text + "<a href='" + url_origin + "/phenotype/" + unmatched[i] + "' target='_blank'>" + label + "</a><br />";
						dupLabels.push(label);
					}
				}

			}
		}
		return text;
	},
	
	_getUnmatchedLabels: function() {
	  	var unmatchedLabels = [];
		for (i=0;i<this.options.unmatchedPhenotypes.length; i++){
		
			jQuery.ajax({
				url : this.options.serverURL + "/phenotype/" + this.options.unmatchedPhenotypes[i] + ".json",
				async : false,
				dataType : 'json',
				success : function(data) {
					unmatchedLabels.push(data.label);
				}
			});
	   }
	   return unmatchedLabels;
	},

	
	_getPhenotypeLabel : function(id){
		var label = "";
		
		for (i=0; i < this.options.phenotypeSortData.length; i++){
			if(id == this.options.phenotypeSortData[i][0].id_a.replace("_",":"))
			{ 
				label = this.options.phenotypeSortData[i][0].label_a;
				break;
			}
		}
		return label;
	},
	
	_setComparisonType : function(comp){
		var self = this;
		
		if (comp != undefined || comp != null)
			{ this.options.comparisonType = comp + "s";}
		else {
			if (this.options.targetSpecies === "9606") {
				this.options.comparisonType = "models";
			}
			else {
				this.options.comparisonType = "genes";
			}
		}
	},
		
	_setTargetSpeciesName: function(taxonid) {
		var self = this;

	    if (typeof taxonid === 'undefined' || taxonid === null) {
		taxonid="10090";
	    }
	    var tempdata;
	    for (var i  = 0; i  <self.options.targetSpeciesList.length; i++) {
			if (self.options.targetSpeciesList[i].taxon === taxonid) {
				tempdata  = self.options.targetSpeciesList[i];
				break;
			}
	    }	    
	    self.options.targetSpeciesName = tempdata.name;
	    self.options.targetSpecies = tempdata.taxon;
	},

	_setSelectedCalculation: function(calc) {
		var self = this;
		
		var tempdata = self.options.selectList.filter(function(d) {
	    	return d.calc === calc;
	    });

		self.options.selectedLabel = tempdata[0].label;
		self.options.selectedCalculation = tempdata[0].calc;
	},

	_setSelectedSort: function(type) {
		var self = this;
		
		var tempdata = self.options.sortList.filter(function(d) {
	    	return d.type === type;
	    });

		self.options.selectedSort = tempdata[0].type;
		self.options.selectedOrder = tempdata[0].order;
	},

	//given the full dataset, return a filtered dataset containing the
	//subset of data bounded by the phenotype display count and the model display count
	_filterData: function(fulldataset) {
		var self = this;
		
		//Step 1:  Filter data so only unique phenotypes are represented (if a source phenotype matches two different targets, only keep one of them. 
		//Input: array of all data returned by query
		//Output: array of the unique phentypes for this disease
		//phenotypeArray: we should end up with an array with unique matched phenotypes
		var phenotypeArray = [];
		var dupArray = [];
		var ic = [];
		
    	for (var idx=0;idx<fulldataset.length;idx++) {
    		var result = $.grep(phenotypeArray, function(e){ return e.label_a == fulldataset[idx].label_a; });
    		if (result.length == 0) {
    			phenotypeArray.push(fulldataset[idx]);
    		}
			else {
			    var resultdup = $.grep(fulldataset, function(e){ return ( (e.label_a == fulldataset[idx].label_a)  &&  (e.model_id == fulldataset[idx].model_id) )});
				if (resultdup.length > 1) {
					var max = 0;
					for (var i = 0; i<resultdup.length; i++){
					     if(resultdup[i].value > max) {
						    max = resultdup[i].value;
						 }
					}
					//put this value back into the unique phenotype/model pair
					//should only be one of this phenotype in the phenotype array
					var resultmatch = $.grep(phenotypeArray, function(e){ return e.label_a == fulldataset[idx].label_a; });
					if(resultmatch.length > 0) resultmatch.value = max;
				}
			}
    	}
    	//copy the phenotypeArray to phenotypeData array - now instead of ALL phenotypes, it will be limited to unique phenotypes for this disease
		//do not alter this array: this.options.phenotypeData
    	this.options.phenotypeData = phenotypeArray.slice();

    	//we need to adjust the display counts and indexing if there are fewer phenotypes than the default phenotypeDisplayCount
    	if (this.options.phenotypeData.length < this.options.phenotypeDisplayCount) {
    		this.options.currPhenotypeIdx = this.options.phenotypeData.length-1;
    		this.options.phenotypeDisplayCount = this.options.phenotypeData.length;
    	}
		
		//Step 2: Select phenotype sort method based on options in #sortphenotypes dropdown
		//Alphabetic: sorted alphabetically
		//Frequency and Rarity: sorted by the sum of each phenotype across all models
		//Frequency: sorted by the count of number of model matches per phenotype
		switch(this.options.selectedSort) {
			case "Alphabetic":  this._alphabetizePhenotypes();
								break;
			case "Frequency and Uniqueness":    this._rankPhenotypes();
								break;
			case "Frequency": this._sortByModelMatches();
								break;
			default:			this._alphabetizePhenotypes();
		}
		
		//Soted phenotype data, "phenotypeSortData", is returned from each sorting function; 
		this.options.phenotypeSortData = this.options.phenotypeSortData.slice();
		
		//Step 3: Filter for the next n phenotypes based on phenotypeDisplayCount and update the y-axis
		this.options.filteredPhenotypeData = [];
		this.options.yAxis = [];
		this.options.filteredModelData = [];
		//begin to sort batches of phenotypes based on the phenotypeDisplayCount
		var startIdx = this.options.currPhenotypeIdx - (this.options.phenotypeDisplayCount -1);		
		//extract the new array of filtered Phentoypes
		//also update the axis
		//also update the modeldata
		var axis_idx = 0;
		var tempFilteredModelData = [];
		
		if (this.options.targetSpeciesName == "Overview") {
			modData = this.options.combinedModelData.slice();
		}
		else {
			modData = this.options.modelData.slice();
		}	 
		
		//get phenotype[startIdx] up to phenotype[currPhenotypeIdx] from the array of sorted phenotypes
		for (var i = startIdx;i <self.options.currPhenotypeIdx + 1;i++) {
			//move the ranked phenotypes onto the filteredPhenotypeData array
			self.options.filteredPhenotypeData.push(self.options.phenotypeSortData[i]);
			//update the YAxis   	
			//the height of each row
			var size = 10;
			//the spacing you want between rows
			var gap = 3;
			//push the rowid and ypos onto the yaxis array
			//so now the yaxis will be in the order of the ranked phenotypes
			var stuff = {"id": self.options.phenotypeSortData[i][0].id_a, "ypos" : ((axis_idx * (size+gap)) + self.options.yoffset)};// + self.options.yoffsetOver)};
			self.options.yAxis.push(stuff); 
			axis_idx = axis_idx + 1;
			//update the ModelData
			
			//find the rowid in the original ModelData (list of models and their matching phenotypes) and write it to tempdata if it matches this phenotypeSortData rowid.
			//In this case, the rowid is just the id_a value in the model data
			var tempdata = modData.filter(function(d) {
				return d.id_a == self.options.phenotypeSortData[i][0].id_a;
			});
			tempFilteredModelData = tempFilteredModelData.concat(tempdata);
		}
		
		for (var idx=0;idx<self.options.filteredModelList.length;idx++) {
			var tempdata = tempFilteredModelData.filter(function(d) {
				return d.model_id == self._getConceptId(self.options.filteredModelList[idx].model_id);
			});
			self.options.filteredModelData = self.options.filteredModelData.concat(tempdata);
		}
	},
		
	//1. Sort the array by source phenotype name
	//3. Get the number of model matches for this phenotype and add to array
	//4. Sort the array by matches. descending
	_sortByModelMatches: function() {
		
		var self = this;
		var modelDataForSorting = [];
		if (this.options.targetSpeciesName == "Overview") {
			modData = self.options.combinedModelData.slice();
		}
		else {
			modData = self.options.modelData.slice();
		}	    
		
		for (var idx=0;idx<self.options.phenotypeData.length;idx++) {			
			var tempdata = modData.filter(function(d) {
    	    	return d.id_a == self.options.phenotypeData[idx].id_a;
    	    });	
			modelDataForSorting.push(tempdata);
		}
		//sort the model list by rank
		modelDataForSorting.sort(function(a,b) { 
			return a.id_a - b.id_a; 
		});
		
		self.options.phenotypeData.sort(function(a,b) {
		return a.id_a-b.id_a;
	    });
	    
		for (var k =0; k < modelDataForSorting.length;k++) {
			var ct  = 0;
			var d = modelDataForSorting[k];
			if (d[0].id_a === self.options.phenotypeData[k].id_a){
				for (var i=0; i< d.length; i++)
				{
					ct+= 1;
				}
				d["count"] = ct;
				self.options.phenotypeSortData.push(d);
			}
	    }		
		//sort the phenotype list by sum of LCS
		self.options.phenotypeSortData.sort(function(a,b) { 
			return b.count - a.count; 
		});	 	
	},
	
	//`. Get all unique phenotypes in an array
	//2. Sort the array by source phenotype name
	//3. Get the sum of all of this phenotype's LCS scores and add to array
	//4. Sort the array by sums. descending
	_rankPhenotypes: function() {
		
		var self = this;
		var modelDataForSorting = [],
			modData = [];
		
		if (this.options.targetSpeciesName == "Overview") {
			modData = self.options.combinedModelData.slice();
		}
		else {
			modData = self.options.modelData.slice();
		}
		
		for (var idx=0;idx<self.options.phenotypeData.length;idx++) {			
			var tempdata = modData.filter(function(d) {
    	    	return d.id_a == self.options.phenotypeData[idx].id_a;
    	    });	
			modelDataForSorting.push(tempdata);
		}
		//sort the model list by rank
		modelDataForSorting.sort(function(a,b) { 
			return a.id - b.id; 
		});
		
		self.options.phenotypeData.sort(function(a,b) {
		return a.id_a-b.id_a;
	    });
	    
		for (var k =0; k < modelDataForSorting.length;k++) {
			var sum  = 0;
			var d = modelDataForSorting[k];
			if (d[0].id_a === self.options.phenotypeData[k].id_a){
				for (var i=0; i< d.length; i++)
				{
				sum+= +d[i].subsumer_IC;
				}
				d["sum"] = sum;
				self.options.phenotypeSortData.push(d);
			}
	    }		
		//sort the phenotype list by sum of LCS
		self.options.phenotypeSortData.sort(function(a,b) { 
			return b.sum - a.sum; 
		});
	},
	
	//`. Get all unique phenotypes in an array
	//2. Sort the array by source phenotype name
	//3. Get the sum of all of this phenotype's LCS scores and add to array
	//4. Sort the array by sums. descending
	_alphabetizePhenotypes: function() {
		
		var self = this;
		var modelDataForSorting = [],
			modData = [];
		
		if (this.options.targetSpeciesName == "Overview") {
			modData = self.options.combinedModelData.slice();
		}
		else {
			modData = self.options.modelData.slice();
		}
		
		for (var idx=0;idx<self.options.phenotypeData.length;idx++) {			
			var tempdata = modData.filter(function(d) {
    	    	return d.id_a == self.options.phenotypeData[idx].id_a;
    	    });	
			modelDataForSorting.push(tempdata);
		}
		//sort the model list by rank
		modelDataForSorting.sort(function(a,b) { 
			return a.id_a - b.id_a; 
		});
		 	
		for (var k =0; k < modelDataForSorting.length;k++) {
			var sum  = 0;
			var d = modelDataForSorting[k];
			if (d[0].id_a === self.options.phenotypeData[k].id_a){
				d["label"] = d[0].label_a;
				self.options.phenotypeSortData.push(d);
			}
	    }		
			
		self.options.phenotypeSortData.sort(function(a,b) {
		    var labelA = a.label.toLowerCase(), 
				labelB = b.label.toLowerCase();
			if (labelA < labelB) {return -1;}
			if (labelA > labelB) {return 1;}
			return 0;
		});		
	    //Save this - it works
		//this.options.phenotypeSortData = d3.nest().key(function(d, i){return //d.label_a}).sortKeys(d3.ascending).entries(self.options.phenotypeData);	    
	},
	
	//given a list of phenotypes, find the top n models
    //I may need to rename this method "getModelData".  It should extract the models and reformat the data 
    _loadData: function() {
		var url = '';
		var self=this;
    	var phenotypeList = this.options.phenotypeData;
		
		switch(this.options.targetSpeciesName){
			case "Overview": this._loadOverviewData(); break;
			case "All": 
					url = this.options.serverURL + "/simsearch/phenotype/?input_items=" + 
						phenotypeList.join(",");
					this._ajaxLoadData(this.options.targetSpeciesName, url);
					break;
			case "Mus musculus":
			case "Danio rerio":
			case "Homo sapiens":
			case "Drosophila melanogaster":
					url = this.options.serverURL + "/simsearch/phenotype/?input_items=" + 
						phenotypeList.join(",") + "&target_species=" + this.options.targetSpecies;
					this._ajaxLoadData(this.options.targetSpeciesName, url);
					break;
			default: url = this.options.serverURL + "/simsearch/phenotype/?input_items=" + 
						phenotypeList.join(",") + "&target_species=" + this.options.targetSpecies;
					this._ajaxLoadData(this.options.targetSpeciesName, url);
		}
    },
    
	_loadOverviewData: function() {
		var hurl = '',
			murl = '',
			zurl = '',
			furl = '',
			speciesWithData = [];
		
		var self=this;
		
    	var phenotypeList = this.options.phenotypeData;
		var limit = this.options.multiOrganismCt;
		//For the Overview, we need to create grid for human data first - top 10  models
		//Taxon is hard-coded since the targetSpecies is "Overview"
		hurl = this.options.serverURL + "/simsearch/phenotype/?input_items=" + 
						phenotypeList.join(",") + "&limit=" + limit + "&target_species=9606";
		this._ajaxLoadData("Homo sapiens", hurl);
		
		//Now get the other species' matches		
		murl = this.options.serverURL + "/simsearch/phenotype/?input_items=" + 
						phenotypeList.join(",") + "&limit=" + limit + "&target_species=10090";
		this._ajaxLoadData("Mus musculus", murl);
		var mousedata = this.options.mousedata;
		
		if(mousedata.length < limit) {limit = (limit - mousedata.length);}
		zurl = this.options.serverURL + "/simsearch/phenotype/?input_items=" + 
						phenotypeList.join(",") + "&limit=" + limit + "&target_species=7955";
		this._ajaxLoadData("Danio rerio", zurl);
		var zfishdata = this.options.zfishdata;
		
		if(zfishdata.length < limit) {limit = (limit - zfishdata.length);}
		furl = this.options.serverURL + "/simsearch/phenotype/?input_items=" + 
						phenotypeList.join(",") + "&limit=" + limit + "&target_species=7227";
		this._ajaxLoadData("Drosophila melanogaster", furl);
		
		//Now we have top 10 model matches for Human data in humandata, 
		//Top n model matches for Mouse data in mousedata
		//Top n model matches for zebrashish data in zfishdata
		//Top n model matches for flies in flydata
		
		//Concat all species data and process matches
		this._finishOverviewLoad();
	},
	
	_finishOverviewLoad : function () {
		var speciesData = [];
		
		var self = this,
			hdata=[],
			mdata=[],
			zdata=[],
			fdata=[],
			speciesList = [];
			
		var modList = [];
		
		if (this.options.humandata != null  && this.options.humandata.b.length > 0){
			for (var idx=0;idx<this.options.humandata.b.length;idx++) {
				 hdata.push(
				{model_id: self._getConceptId(this.options.humandata.b[idx].id), 
				 model_label: this.options.humandata.b[idx].label,
				 model_score: this.options.humandata.b[idx].score.score, 
				 model_rank: this.options.humandata.b[idx].score.rank});
				
				this._loadDataForModel(this.options.humandata.b[idx]);	
			} 
			speciesList.push("Homo sapiens");
		} 
		//sort the model list by rank
			hdata.sort(function(a,b) { return a.model_rank - b.model_rank; });			 
			modList= modList.concat(hdata.slice()); 
		
		if (this.options.mousedata != null  && this.options.mousedata.b.length > 0){
			for (var idx=0;idx<this.options.mousedata.b.length;idx++) {
				mdata.push(
				{model_id: self._getConceptId(this.options.mousedata.b[idx].id), 
				 model_label: this.options.mousedata.b[idx].label,
				 model_score: this.options.mousedata.b[idx].score.score, 
				 model_rank: this.options.mousedata.b[idx].score.rank});
				
				this._loadDataForModel(this.options.mousedata.b[idx]);			 
			} 
			speciesList.push("Mus musculus");			
		} 		
		//sort the model list by rank
		//sort the model list by rank
			mdata.sort(function(a,b) { return a.model_rank - b.model_rank; });			 
			modList = modList.concat(mdata.slice());  		
		
		if (this.options.zfishdata != null  && this.options.zfishdata.b.length > 0){
			for (var idx=0;idx<this.options.zfishdata.b.length;idx++) {
				zdata.push(
				{model_id: self._getConceptId(this.options.zfishdata.b[idx].id), 
				 model_label: this.options.zfishdata.b[idx].label,
				 model_score: this.options.zfishdata.b[idx].score.score, 
				 model_rank: this.options.zfishdata.b[idx].score.rank});
				
				this._loadDataForModel(this.options.zfishdata.b[idx]);			 
			} 
			speciesList.push("Danio rerio");
		} 
		//sort the model list by rank
		//sort the model list by rank
			zdata.sort(function(a,b) { return a.model_rank - b.model_rank; });			 
			modList = modList.concat(zdata.slice());  
		
		if (this.options.flydata != null  && this.options.flydata.b.length > 0){
			for (var idx=0;idx<this.options.flydata.b.length;idx++) {
				fdata.push(
				{model_id: self._getConceptId(this.options.flydata.b[idx].id), 
				 model_label: this.options.flydata.b[idx].label,
				 model_score: this.options.flydata.b[idx].score.score, 
				 model_rank: this.options.flydata.b[idx].score.rank});
				
				this._loadDataForModel(this.options.flydata.b[idx]);			 
			} 
			speciesList.push("Drosophila melanogaster");
		} 
		//sort the model list by rank
		 //sort the model list by rank
			fdata.sort(function(a,b) { return a.model_rank - b.model_rank; });			 
			modList = modList.concat(fdata.slice());  
		this.options.combinedModelList = modList.slice();	
		this.options.speciesList = speciesList.slice();
		//console.log("Combined Model List: ");		
		//console.log(this.options.combinedModelList);
		
		//we need to adjust the display counts and indexing if there are fewer models
		if (this.options.combinedModelList.length < this.options.modelDisplayCount) {
			this.options.currModelIdx = this.options.combinedModelList.length-1;
			this.options.modelDisplayCount = this.options.modelList.length;
		}
		
		//initialize the filtered model list
		for (var idx=0;idx<this.options.modelDisplayCount;idx++) {
			this.options.filteredModelList.push(this.options.combinedModelList[idx]);
		}
	},
		
	//generic ajax call for all queries
	_ajaxLoadData : function (target, url) {
			var self = this;
			jQuery.ajax({

			url: url, 
			async : false,
			dataType : 'json',
			success : function(data) {
			   if (Object.getOwnPropertyNames(data).length == 0)
			   {
					if (self.options.targetSpeciesName != "Overview") {
						self._createEmptyVisualization(url, self.options.targetSpeciesName);
					}
			   }
			   else {
					//This is for the new "Overview" target option 
					if (self.options.targetSpeciesName == "Overview") {
						switch(target){
							case "Homo sapiens": self.options.humandata = data;
							//extract the maxIC score
							self.options.maxICScore = data.metadata.maxMaxIC;
								break;
							case "Mus musculus": self.options.mousedata = data;
								break;
							case "Danio rerio": self.options.zfishdata = data;
								break;
							case "Drosophila melanogaster": self.options.flydata = data;
								break;
							default: break;						
						}
					}
					else {self._finishLoad(data);}			   
			   }
			},
			error: function ( xhr, errorType, exception ) { //Triggered if an error communicating with server  
				self._displayResult(xhr, errorType, exception);
			},  
		});
	},
	
	_displayResult : function(xhr, errorType, exception){
		var self = this;
		var msg = '';
		if (xhr.status === 0) {
			msg = 'Not connected.\n Verify Network.';
		} else if (xhr.status == 404) {
			msg = 'The requested page was not found.';
		} else if (xhr.status == 500) {
			msg = 'Due to an Internal Server Error, no phenotype data was retrieved.';
		} else if (xhr.status == 501) {
			msg = 'The server either does not recognize the request method, or it lacks the ability to fulfill the request';
		} else if (xhr.status == 502) {
			msg = 'The server was acting as a gateway or proxy and received an invalid response from the upstream server.';
		} else if (xhr.status == 503) {
			msg = 'The server is currently unavailable (because it is overloaded or down for maintenance).';
		} else if (xhr.status == 504) {
			msg = 'The server was acting as a gateway or proxy and did not receive a timely response from the upstream server.';
		} else if (xhr.status == 505) {
			msg = 'The server does not support the HTTP protocol version used in the request.';
		} else if (exception === 'parsererror') {
			msg = 'Requested JSON parse failed.';
		} else if (exception === 'timeout') {
			msg = 'Time out error.';
		} else if (exception === 'abort') {
			msg = 'Ajax request aborted.';
		} else {
			msg = 'Uncaught Error.\n' + xhr.responseText;
		}

		this._createEmptyVisualization(msg);
	},
	
	//Finish the data load after the ajax request
	//Create the modelList array: model_id, model_label, model_score, model_rank
	//Call _loadDataForModel to put the matches in an array
    _finishLoad: function(data) {
		var retData = data;
		//extract the maxIC score
		this.options.maxICScore = retData.metadata.maxMaxIC;
		var self= this;
		
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
		
		//TO DO: Check on the source field, it doesn't seem to be contain any data in general
		this._setComparisonType(retData.source.b_type);		
    },
    
    //for a given model, extract the sim search data including IC scores and the triple:
    //the a column, b column, and lowest common subsumer
    //for the triple's IC score, use the LCS score
    _loadDataForModel: function(newModelData) {
	
		//data is an array of all model matches
		
		data = newModelData.matches;
		
		
		var species = newModelData.taxon;
		var calculatedArray = [],
			normalizedArray = [],
							min,
							max,
							norm;
    	
		for (var idx=0;idx<data.length;idx++) {
			calculatedArray.push(this._normalizeIC(data[idx]));
		}
		
		min =  Math.min.apply(Math, calculatedArray);
		max = Math.max.apply(Math, calculatedArray);
		
		norm = max - min;
		
		for (var idx=0;idx<data.length;idx++) {
    	   
			var curr_row = data[idx];
			
			var lcs = calculatedArray[idx];
    	    var new_row = {"id": this._getConceptId(curr_row.a.id) + 
			          "_" + this._getConceptId(curr_row.b.id) + 
			          "_" + this._getConceptId(newModelData.id), 
   			   "label_a" : curr_row.a.label, 
			   "id_a" : this._getConceptId(curr_row.a.id), 
			   "IC_a" : parseFloat(curr_row.a.IC),
			   "subsumer_label" : curr_row.lcs.label, 
    	       "subsumer_id" : this._getConceptId(curr_row.lcs.id), 
			   "subsumer_IC" : parseFloat(curr_row.lcs.IC), 
			   "value" : parseFloat(lcs),
    		   "label_b" : curr_row.b.label, 
			   "id_b" : this._getConceptId(curr_row.b.id), 
			   "IC_b" : parseFloat(curr_row.b.IC),
			   "model_id" : this._getConceptId(newModelData.id),
    		   "model_label" : newModelData.label, 
			   "species": species.label,
			   "taxon" : species.id,
			   "rowid" : this._getConceptId(curr_row.a.id) + 
			              "_" + this._getConceptId(curr_row.lcs.id)
		  }; 
		//  console.log("New Row Value: "); console.log(new_row.value);
    	    if (new_row.subsumer_id.indexOf("0005753") > -1) {
    	    	console.out("got it");
    	    }
			if (this.options.targetSpeciesName == "Overview"){
					this.options.combinedModelData.push(new_row);	
					
			}
			else {    
					this.options.modelData.push(new_row); 
				 }
    	}
		//we may use this when normalization and ranking have been determined
		this._rankLCSScores();
		},
	
	//we may use this when normalization and ranking have been determined
	_rankLCSScores : function () {
	},

    //Different methods of calculation based on the selectedCalculationMethod
	_normalizeIC: function(datarow){
		var ics = [],
			aIC = datarow.a.IC,
			bIC = datarow.b.IC,
			lIC = datarow.lcs.IC,
			nic;
		
		var calcMethod = this.options.selectedCalculation;
		
		switch(calcMethod){
			case 2: nic = lIC;
					break;
			case 1: nic = ((lIC/aIC) * 100);
					break;
			case 0: nic = Math.sqrt((Math.pow(aIC-lIC,2)) + (Math.pow(bIC-lIC,2)));
					nic = (1 - (nic/+this.options.maxICScore)) * 100;					
					break;
			case 3: nic = ((lIC/bIC) * 100);
					break;
			default: nic = lIC;
		}				
		//console.log("AIC,BIC,LIC: " + aIC + ","+bIC+","+lIC+"  NIC: " + nic);
		return nic;
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
    
    	//use the max phenotype size to limit the number of phenotypes shown 
    	var yLength = self.options.phenotypeSortData.length > this.options.phenotypeDisplayCount ? this.options.phenotypeDisplayCount : self.options.phenotypeSortData.length;
    	for (var idx=0;idx<yLength;idx++) {
    		var stuff = {"id": self.options.phenotypeSortData[idx][0].id_a, "ypos" : ((idx * (size+gap)) + this.options.yoffset + 10)};
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
		
		var maxScore = 0,
			method = this.options.selectedCalculation;
		
		switch(method){
			case 2: maxScore = this.options.maxICScore;
					break;
			case 1: maxScore = 100;
					break;
			case 0: maxScore = 100;
					break;
			case 3: maxScore = 100;
					break;
			default: maxScore = this.options.maxICScore;
					break;
		}				
    	
	    this.options.colorScaleB = d3.scale.linear().domain([3, maxScore]);
        this.options.colorScaleB.domain([0, 0.2, 0.4, 0.6, 0.8, 1].map(this.options.colorScaleB.invert));

        //this.options.colorScaleB.range(['rgb(255,255,204)','rgb(199,233,180)','rgb(127,205,187)','rgb(65,182,196)','rgb(44,12//7,184)','rgb(37,52,148)']); 
		this.options.colorScaleB.range(['rgb(229,229,229)','rgb(164,214,212)','rgb(68,162,147)','rgb(97,142,153)','rgb(66,139,202)','rgb(25,59,143)']);
		  
 
		this.options.colorScaleR = d3.scale.linear().domain([3, maxScore]);
        this.options.colorScaleR.domain([0, 0.2, 0.4, 0.6, 0.8, 1].map(this.options.colorScaleR.invert));
        //this.options.colorScaleR.range(['rgb(255,255,178)','rgb(254,217,118)','rgb(254,178,76)','rgb(253,141,60)','rgb(240,59//,32)','rgb(189,0,38)']); 
		this.options.colorScaleR.range(['rgb(252,248,227)','rgb(249,205,184)','rgb(234,118,59)','rgb(221,56,53)','rgb(181,92,85)','rgb(70,19,19)']);
		//this.options.colorScaleR.range(['rgb(252,248,227)','rgb(230,209,178)','rgb(234,118,59)','rgb(221,56,53)','rgb(181,92,85)','rgb(70,19,19)']);
		
		
		this.options.colorScaleG = d3.scale.linear().domain([3, maxScore]);
		this.options.colorScaleG.domain([0, 0.2, 0.4, 0.6, 0.8, 1].map(this.options.colorScaleG.invert));
		//this.options.colorScaleG.range(['rgb(140,81,10)','rgb(216,179,101)','rgb(246,232,195)','rgb//(199,234,229)','rgb(90,180,172)','rgb(1,102,94)']);
		//this.options.colorScaleG.range(['rgb(1,102,94)','rgb(90,180,172)','rgb(199,234,229)','rgb(246,232,19//5)','rgb(216,179,101)','rgb(140,81,10)']);

		this.options.colorScaleG.range(['rgb(230,209,178)','rgb(210,173,116)','rgb(148,114,60)','rgb(68,162,147)','rgb(31,128,113)','rgb(3,82,70)']);
	},

    _initCanvas : function() {

    	var self= this;
		
		var species = '',
			optionhtml = '';
		
		//This is for the new "Overview" target option 
		if (this.options.targetSpeciesName == "Overview") {
			species = "All";
			optionhtml = "<span id='mtitle'><span id='s2title'><b>Cross-species Overview</b></span>";	
		} else {
			species= this.options.targetSpeciesName;
			optionhtml = "<span id='mtitle'><span id='stitle'><b>Phenotype comparison (grouped by " + species + " " + this.options.comparisonType + ")</b></span>";	
		}
		
		optionhtml = optionhtml + "<span id='faq'><img class='faq' src='" + this.options.scriptpath + "../image/greeninfo30.png' height='15px'></span><br /></span><div id='header'><span id='sort_div'><span id='slabel' >Sort Phenotypes<span id='sorts'></span></span><br /><span><select id=\'sortphenotypes\'>";	
			
		for (var idx=0;idx<self.options.sortList.length;idx++) {
    		var selecteditem = "";
    		if (self.options.sortList[idx].type === self.options.selectedSort) {
    			selecteditem = "selected";
    		}
			if (self.options.sortList[idx].order  === self.options.selectedOrder) {
    			selecteditem = "selected";
    		}
			optionhtml = optionhtml + "<option value='" + self.options.sortList[idx].order +"' "+ selecteditem +">" + self.options.sortList[idx].type +"</option>"
		}
		
		optionhtml = optionhtml + "</select></span>";			
	    this.element.append(optionhtml);
		
		var faqs = d3.selectAll("#faq")
			.on("click", function(d) {self._showDialog("faq");
		});	
					
		var sorts = d3.selectAll("#sorts")
			.on("click", function(d,i){
				self._showDialog( "sorts");
		});
		
		//add the handler for the select control
        $( "#sortphenotypes" ).change(function(d) {
        	self.options.selectedSort = self.options.sortList[d.target.selectedIndex].type;
        	self.options.selectedOrder = self.options.sortList[d.target.selectedIndex].order;
        	$("#unmatchedlabel").remove();
			$("#unmatchedlabelhide").remove();
			$("#unmatched").remove();
			$("#selects").remove();
			$("#org_div").remove();
			$("#calc_div").remove();
			$("#sort_div").remove();
			$("#mtitle").remove();
			$("#header").remove();
        	$("#svg_area").remove();
        	self.options.phenotypeData = self.options.origPhenotypeData.slice();
        	self._reset();
        	self._create();
        	});
			
		this.element.append("<svg id='svg_area'></svg>");		
		this.options.svg = d3.select("#svg_area");
			
    },

	_addLogoImage : function() {     
	  
	  var imgs = this.options.svg.selectAll("image").data([0]);
      imgs.enter()
                .append("svg:image")
                .attr("xlink:href", this.options.scriptpath + "../image/logo.png")
                .attr("x", 850)
                .attr("y", this.options.yTranslation - 10)
				.attr("id", "logo")
                .attr("width", "60")
                .attr("height", "90");       
    },
	
    _resetLinks: function() {
	    //don't put these styles in css file - these stuyles change depending on state
		this.options.svg.selectAll("#detail_content").remove();
    	var link_lines = d3.selectAll(".data_text");
    	link_lines.style("font-weight", "normal");
    	link_lines.style("text-decoration", "none");
    	link_lines.style("color", "black");
		link_lines.style("text-anchor", "end");
		var link_labels = d3.selectAll(".model_label");
    	link_labels.style("font-weight", "normal");
    	link_labels.style("text-decoration", "none");
    	link_labels.style("color", "black");
		link_labels.attr("fill", "black");
	},
	
	
    _selectData: function(curr_data, obj) {    	
    	
    	//create a highlight row
		var self=this;
		//create the related row rectangle
		var highlight_rect = self.options.svg.append("svg:rect")
		  	.attr("transform","translate(" + (self.options.axis_pos_list[1]) +"," + ( self.options.yTranslation + self.options.yoffsetOver + 4)  + ")")
			/**+ self.options.yoffsetOver) */
			.attr("x", 10)
			.attr("y", function(d) {return self._getYPosition(curr_data[0].id_a) ;}) //rowid
			.attr("class", "row_accent")
			.attr("width", this.options.modelWidth)
			.attr("height", 12);
	
    	this._resetLinks();
    	var alabels = this.options.svg.selectAll("text.a_text." + this._getConceptId(curr_data[0].id));
    	var txt = curr_data[0].label_a;
    	if (txt == undefined) {
    		txt = curr_data[0].id_a;
    	}
    	alabels.text(txt)
			   .on("click",function(d){
					self._clickPhenotype(self._getConceptId(curr_data[0].id_a), self.document[0].location.origin);
				});

    	var sublabels = this.options.svg.selectAll("text.lcs_text." + this._getConceptId(curr_data[0].id) + ", ." + this._getConceptId(curr_data[0].subsumer_id));
    	var txt = curr_data.subsumer_label;
    	
    	if (txt == undefined) {
    		txt = curr_data[0].subsumer_id;
    	}
    	sublabels.text(txt);
    	var all_links = this.options.svg.selectAll("." + this._getConceptId(curr_data[0].id) + ", ." + this._getConceptId(curr_data[0].subsumer_id));
    	all_links.style("font-weight", "bold");
		
    	/* TEMPORARY!!! REMOVE FOR HARRY's POSTER!!!
    	var retData = "What data do we want to show for phentoypes?";
	    this._updateDetailSection(retData, this._getXYPos(obj));
	    */    	
    },
	
	 _clickPhenotype: function(data, url_origin) {
    	var url = url_origin + "/phenotype/" + data;
    	var win = window.open(url, '_blank');
    },	

    _deselectData: function (curr_data) {
    	
		this.options.svg.selectAll(".row_accent").remove();
    	this._resetLinks();
		if (curr_data[0] == undefined) { var row = curr_data;}
		else {row = curr_data[0];}
		
		var alabels = this.options.svg.selectAll("text.a_text." + this._getConceptId(row.id));
		alabels.text(this._getShortLabel(row.label_a));

		var sublabels = this.options.svg.selectAll("text.lcs_text." + this._getConceptId(row.id));
		sublabels.text(this._getShortLabel(row.subsumer_label));		
    },

	//return a label for use in the list.  This label is shortened
	//to fit within the space in the column
    _getShortLabel: function(label, newlength) {
		if (label != undefined){
			var retLabel = label;
			if (!newlength) {
					newlength = this.options.textLength;
			}
			if (label.length > newlength) {
				retLabel = label.substring(0,newlength-3) + "...";
			}	
			return retLabel;
		}
		else return "Unknown";
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
    		var width = 100,
    		  el = d3.select(t),
    	      p = d3.select(t.parentNode),
			  x = +t.getAttribute("x"),
			  y = +t.getAttribute("y");
			
    	    p.append("text")
    	       	.attr('x', x + 15)
    	        .attr('y', y -5)
    	        .attr("width", width)
    	        .attr("id", self._getConceptId(data.model_id))
    	        .attr("model_id", data.model_id)
    	        .attr("height", 60)
    	        .attr("transform", function(d) {
    	        	return "rotate(-45)" 
    	        })
		        .on("click", function(d) {
					self._clickModel(data, self.document[0].location.origin);
				})
    	        .on("mouseover", function(d) {
    	    	   self._selectModel(data, this);
    	        })
    	        .on("mouseout", function(d) {
    	    	   self._clearModelData(d, d3.mouse(this));
				   self._deselectData(self.options.selectedRow);
    	        })
    	       .attr("class", this._getConceptId(data.model_id) + " model_label")
    	       .style("font-size", "12px")
    	       .text( function(d) {if (label == "") return ""; else return label;});
 
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
		var wdt = this.options.axis_pos_list[1] + ((this.options.axis_pos_list[2] - this.options.axis_pos_list[1])/2);
		var hgt = this.options.phenotypeDisplayCount*10 + this.options.yoffset, yv = 0;
		
		if (coords.y > hgt) { yv = coords.y - this.options.detailRectHeight - 10;}
		else {yv = coords.y + 20;}
		
		if (coords.x > wdt) { wv = coords.x - this.options.detailRectWidth - 70;}
		else {wv = coords.x + 20;}

	    this.options.svg.append("foreignObject")
		    .attr("width", w + 60)
			.attr("height", h)
			.attr("id", "detail_content")
			//add an offset.  Otherwise, the tooltip turns off the mouse event
			.attr("y", yv)
		    .attr("x", wv) 
			.append("xhtml:body")
			.attr("id", "detail_text")
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
	    } else if (d.id_a.indexOf("ZFIN") > -1) {
	    	aSpecies = "Zebrafish";
	    }else if (d.id_a.indexOf("FB") > -1) {
	    	aSpecies = "Fly";
	    }
		
	    var subSpecies = "Human";
	    if (d.subsumer_id.indexOf("MP") > -1) {
	    	subSpecies = "Mouse";
	    } else if (d.subsumer_id.indexOf("ZFIN") > -1) {
	    	subSpecies = "Zebrafish";
	    }else if (d.subsumer_id.indexOf("FB") > -1) {
	    	subSpecies = "Fly";
	    }

	    var bSpecies = "Human";
	    if (d.id_b.indexOf("MP") > -1) {
	    	bSpecies = "Mouse";
	    } else if (d.id_b.indexOf("ZFIN") > -1) {
	    	bSpecies = "Zebrafish";
	    }else if (d.id_b.indexOf("FB") > -1) {
	    	bSpecies = "Fly";
	    }
		
		var species = d.species,
		    taxon =   d.taxon;
		
		if (taxon != undefined || taxon!= null || taxon != '' || isNaN(taxon));{
			if (taxon.indexOf("NCBITaxon:") != -1) {taxon = taxon.slice(10);}
		}
		
		var calc = this.options.selectedCalculation;
		var suffix = "";
		var prefix = "";
		if (calc == 0 || calc == 1 || calc == 3) {suffix = '%';}
		if (calc == 0) {prefix = "Distance";}
		else if (calc == 1) {prefix = "Ratio (q)";}
		else if (calc == 2) {prefix = "Uniquesness";}
		else if (calc == 3) {prefix = "Ratio (t)";}
				
	    retData = "<strong>Query: </strong> " + d.label_a + " (IC: " + d.IC_a.toFixed(2) + ")"   
		    + "<br/><strong>Match: </strong> " + d.label_b + " (IC: " + d.IC_b.toFixed(2) +")"
			+ "<br/><strong>Common: </strong> " + d.subsumer_label + " (IC: " + d.subsumer_IC.toFixed(2) +")"
     	    + "<br/><strong>" + this._toProperCase(this.options.comparisonType).substring(0, this.options.comparisonType.length-1)  +": </strong> " + d.model_label
			+ "<br/><strong>" + prefix + ":</strong> " + d.value.toFixed(2) + suffix
			+ "<br/><strong>Species: </strong> " + d.species + " (" + taxon + ")";
	    this._updateDetailSection(retData, this._getXYPos(obj));
	  
    },
    	
    //I need to check to see if the modelData is an object.  If so, get the model_id
    _clearModelData: function(modelData) {
	    this.options.svg.selectAll("#detail_content").remove();
	    this.options.svg.selectAll(".model_accent").remove();
		var model_text = "";
	    if (modelData != null && typeof modelData != 'object') {
		    model_text = this.options.svg.selectAll("text#" + this._getConceptId(modelData));
		} else {model_text = this.options.svg.selectAll("text#" + this._getConceptId(modelData.model_id));}
		model_text.style("font-weight","normal");
		model_text.style("text-decoration", "none");
		model_text.style("fill", "black");    
    },


	//NOTE: I need to find a way to either add the model class to the phenotypes when they load OR
	//select the rect objects related to the model and append the class to them.
	//something like this: $( "p" ).addClass( "myClass yourClass" );
	 _createModelRects: function() {
		var self = this;
		var data = [];
		//This is for the new "Overview" target option 
		if (this.options.targetSpeciesName == "Overview"){	
			data = this.options.combinedModelData.slice();
		}
		else
		{
			data = this.options.filteredModelData.slice();
		}		  
		
		var model_rects = this.options.svg.selectAll(".models")
			.data( data, function(d) {
				return d.id;
			});
		model_rects.enter()
		    .append("rect")
		    .attr("transform",
			  "translate(" + ((this.options.textWidth + 30) + 4) + "," + (self.options.yTranslation + self.options.yoffsetOver + 15)+   ")")
		    .attr("class", function(d) { 
			  //append the model id to all related items
			  if (d.value > 0) {
			  var bla = self.options.svg.selectAll(".data_text." + self._getConceptId(d.id));	    	
					bla.classed(self._getConceptId(d.model_id), true);
			  }
			  return "models " + " " +  self._getConceptId(d.model_id) + " " +  self._getConceptId(d.id);
		    })
		    .attr("y", function(d, i) { 
				//console.log("Y Pos: " + (self._getYPosition(d.id_a) - 10) + 
				//"  X Pos: " + self.options.xScale(d.model_id) + "  Model Name: " + d.model_label +  "  Model Id: " + //d.model_id +
				//"  Phen: " + d.label_a  + 
				//"  IA_a: " + d.id_a );
			  return self._getYPosition(d.id_a) + (self.options.yTranslation + self.options.yoffsetOver  + 10) ;
		    })
		   .attr("x", function(d) { return self.options.xScale(d.model_id);})
		   .attr("width", 10)
		   .attr("height", 10)
		   .attr("rx", "3")
		   .attr("ry", "3")		 
		   //I need to pass this into the function
		  .on("mouseover", function(d) {
			  this.parentNode.appendChild(this);
				
			  //if this column and row are selected, clear the column/row and unset the column/row flag
			  if (self.options.selectedColumn != undefined && self.options.selectedRow != undefined) 
			  {
					self._clearModelData(self.options.selectedColumn);
					self.options.selectedColumn = undefined;
					self._deselectData(self.options.selectedRow);
					self.options.selectedRow = undefined;	
					if (this != self.options.currSelectedRect){
						self._highlightIntersection(d, d3.mouse(this));
						//put the clicked rect on the top layer of the svg so other events work
						this.parentNode.appendChild(this);
						self._enableRowColumnRects(this);
						//set the current selected rectangle
						self.options.currSelectedRect = this;  
					}
			   }
			   else {
					self._highlightIntersection(d, d3.mouse(this));
					this.parentNode.appendChild(this);
					self._enableRowColumnRects(this);
					self.options.currSelectedRect = this;  
			   }
			   self._showModelData(d, this);
		  })
		  .on("mouseout", function(d) {
			  self._clearModelData(d, d3.mouse(this));
			  self._deselectData(self.options.selectedRow);
		  })
		  .style('opacity', '1.0')
		  .attr("fill", function(d, i) {

			  //This is for the new "Overview" target option 
			  if (self.options.targetSpeciesName == "Overview"){
						if (d.species == "Homo sapiens") {return self.options.colorScaleB(d.value);} 
						else if (d.species == "Mus musculus")  {return self.options.colorScaleR(d.value);} 
						else if (d.species == "Danio rerio")  {return self.options.colorScaleG(d.value);} 
					}	
					else {	
						return self.options.colorScaleB(d.value); 
					}
			  });
		  		
		if (self.options.targetSpeciesName == "Overview") {
			this._highlightSpecies();
		}		
		  model_rects.transition()
			  .delay(20)
			  .style('opacity', '1.0')
			  .attr("y", function(d) {
			  return self._getYPosition(d.id_a) -10; //rowid
		  })
		  .attr("x", function(d) { return self.options.xScale(d.model_id);})

		  model_rects.exit().transition()
			.style('opacity', '0.0')
			.remove();
	
    },
	
	_highlightSpecies : function () {
		//create the related model rectangles
		var self = this;
		var list = self.options.speciesList;
		var ct = self.options.multiOrganismCt,
			vwidthAndGap = 13,
			hwidthAndGap = 18;
		
		
		var highlight_rect = self.options.svg.selectAll(".species_accent")
			.data(list)
			.enter()
			.append("rect")			
		  	.attr("transform",
		  			  "translate(" + (self.options.textWidth + 30) + "," +( self.options.yTranslation + self.options.yoffsetOver)+ ")")
			.attr("x", function(d,i) { return (i * (hwidthAndGap * ct));})
			.attr("y", self.options.yoffset)
			.attr("class", "species_accent")
			.attr("width", hwidthAndGap * ct)
			.attr("height", vwidthAndGap * self.options.phenotypeDisplayCount + 5)
			.attr("stroke", function(d,i){ return self.options.targetSpeciesList[i].color;})
			.attr("stroke-width", 3)
			.attr("fill", "none");
	},
	
	
	_enableRowColumnRects :  function(curr_rect){
		var self = this;
		
		var model_rects = self.options.svg.selectAll("rect.models")
			.filter(function (d) { return d.rowid == curr_rect.__data__.rowid;});
		for (var i = 0; i < model_rects[0].length; i++){
               model_rects[0][i].parentNode.appendChild(model_rects[0][i]);
		}
		var data_rects = self.options.svg.selectAll("rect.models")
			.filter(function (d) { return d.model_id == curr_rect.__data__.model_id;});
		for (var j = 0; j < data_rects[0].length; j++){
               data_rects[0][j].parentNode.appendChild(data_rects[0][j]);
		}
	},
	
	_highlightIntersection : function(curr_data, obj){
		var self=this;
		
		//Highlight Row
		var highlight_rect = self.options.svg.append("svg:rect")
		  	.attr("transform","translate(" + self.options.axis_pos_list[1] + ","+ (self.options.yTranslation + self.options.yoffsetOver + 4 ) + ")")
			.attr("x", 10)
			.attr("y", function(d) {return self._getYPosition(curr_data.id_a) ;}) //rowid
			.attr("class", "row_accent")
			.attr("width", this.options.modelWidth)
			.attr("height", 12);
	
    	this.options.selectedRow = curr_data;
		this.options.selectedColumn = curr_data;
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
		
		//Highlight Column
		var model_label = self.options.svg.selectAll("text#" + this._getConceptId(curr_data.model_id));
    	model_label.style("fill", "blue");
		model_label.style("text-decoration", "underline");

		//create the related model rectangles
		var highlight_rect2 = self.options.svg.append("svg:rect")
		  	.attr("transform",
		  			  "translate(" + (self.options.textWidth + 34) + "," +( self.options.yTranslation + self.options.yoffsetOver)+ ")")
			.attr("x", function(d) { return (self.options.xScale(curr_data.model_id)-2);})
			.attr("y", self.options.yoffset + 2 )
			.attr("class", "model_accent")
			.attr("width", 12)
			.attr("height", (self.options.phenotypeDisplayCount * 13));
	},
  
    _updateAxes: function() {
		var self = this;
		var data = [];
		
		//This is for the new "Overview" target option 
		if (this.options.targetSpeciesName == "Overview"){	
			data = this.options.combinedModelData;
		}
		else
		{
			data = self.options.filteredModelData;	
		}
		
		this.options.h = (data.length*2.5);
		self.options.yScale = d3.scale.ordinal()
			.domain(data.map(function (d) {return d.id_a; }))
		.range([0,data.length])
		.rangePoints([ self.options.yoffset + self.options.yoffsetOver, self.options.yoffset + self.options.yoffsetOver +this.options.h ]);
		
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
	
	//account for a grid with less than 14 phenotypes
		var y1 = 257,
			y2 = 273;
		if (this.options.filteredPhenotypeData.length < 14) {y1 = 172; y2 = 188;}
		
		
		var startModelIdx = (this.options.currModelIdx - this.options.modelDisplayCount) + 2;
		var max_count = ((this.options.modelDisplayCount + startModelIdx) >= this.options.modelList.length) ? this.options.modelList.length : this.options.modelDisplayCount + startModelIdx; 
		var display_text = "Matches [" + startModelIdx + "-"+ max_count + "] out of " + (this.options.modelList.length);
		var div_text = this.options.svg.append("svg:text")
			.attr("class", "scroll_text")
			.attr("x", this.options.axis_pos_list[2] +45)
			.attr("y", y1 + this.options.yTranslation)
			.text(display_text);
		
		var startPhenIdx = (this.options.currPhenotypeIdx - this.options.phenotypeDisplayCount) + 2
		;
		var max_count = ((this.options.phenotypeDisplayCount + startPhenIdx) >= this.options.phenotypeData.length) ? this.options.phenotypeData.length : this.options.phenotypeDisplayCount + startPhenIdx ; 
		var display_text = "Phenotypes [" + startPhenIdx + "-"+ max_count + "] out of " + (this.options.phenotypeData.length);
		var div_text = this.options.svg.append("svg:text")
			.attr("class", "scroll_text")
			.attr("x", this.options.axis_pos_list[2] +45)
			.attr("y", y2  + this.options.yTranslation)
			.text(display_text);
	},
	
	//NOTE: FOR FILTERING IT MAY BE FASTER TO CONCATENATE THE PHENOTYPE and MODEL into an attribute
	
	//change the list of phenotypes and filter the models accordling.  The 
	//movecount is an integer and can be either positive or negative
	_updateModel: function(modelIdx, phenotypeIdx) {
		var self = this;
		//This is for the new "Overview" target option 
		var modelData = [].
			modelList = [];
		if (this.options.targetSpeciesName == "Overview"){	
		    modelData = this.options.combinedModelData;
			modelList = this.options.combinedModelList;
		}
		else
		{
			modelData = this.options.modelData;
			modelList = this.options.modelList;
		}
		//check to see if the phenotypeIdx is greater than the number of items in the list
		if (phenotypeIdx > this.options.phenotypeData.length) {
			this.options.currPhenotypeIdx = this.options.phenotypeSortData.length;
		} else if (phenotypeIdx - (this.options.phenotypeDisplayCount -1) < 0) {
			//check to see if the min of the slider is less than the 0
			  this.options.currPhenotypeIdx = (this.options.phenotypeDisplayCount -1);
		} else {
			this.options.currPhenotypeIdx = phenotypeIdx;
		}
		var startPhenotypeIdx = this.options.currPhenotypeIdx - this.options.phenotypeDisplayCount;
		
		this.options.filteredPhenotypeData = [];
		this.options.yAxis = [];
		
		//fix model list
		//check to see if the max of the slider is greater than the number of items in the list
		if (modelIdx > modelList.length) {
			this.options.currModelIdx = modelList.length;
		} else if (modelIdx - (this.options.modelDisplayCount -1) < 0) {
			//check to see if the min of the slider is less than the 0
			  this.options.currModelIdx = (this.options.modelDisplayCount -1);
		} else {
			this.options.currModelIdx = modelIdx;
		}
		var startModelIdx = this.options.currModelIdx - this.options.modelDisplayCount;

		this.options.filteredModelList = [];
		this.options.filteredModelData = [];
				
		//extract the new array of filtered Phentoypes
		//also update the axis
		//also update the modeldata

		var tempFilteredModelData = [];
		var axis_idx = 0;
    	for (var idx=startModelIdx;idx<self.options.currModelIdx;idx++) {
    		self.options.filteredModelList.push(modelList[idx]);
    	}
		
		//extract the new array of filtered Phentoypes
		//also update the axis
		//also update the modeldata

		var tempFilteredModelData = [];
		var axis_idx = 0;
    	for (var idx=startPhenotypeIdx;idx<self.options.currPhenotypeIdx;idx++) {
    		self.options.filteredPhenotypeData.push(self.options.phenotypeSortData[idx]);
    		//update the YAxis   	    		
    		//the height of each row
        	var size = 10;
        	//the spacing you want between rows
        	var gap = 3;

    		var stuff = {"id": self.options.phenotypeSortData[idx][0].id_a, "ypos" : ((axis_idx * (size+gap)) + self.options.yoffset /**+ self.options.yoffsetOver +10*/)};
    		self.options.yAxis.push(stuff); 
    	    axis_idx = axis_idx + 1;
    	    //update the ModelData
    		var tempdata = modelData.filter(function(d) {
    	    	return d.id_a == self.options.phenotypeSortData[idx][0].id_a;
    	    });
    		tempFilteredModelData = tempFilteredModelData.concat(tempdata);
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
	    //model_x_axis.tickEndSize = 1;
				
		var model_region = self.options.svg.append("g")
	  		.attr("transform","translate(" + (self.options.textWidth +28) +"," + (self.options.yTranslation + self.options.yoffset /**+ self.options.yoffsetOver*/) + ")")
	  		.attr("class", "x axis")
	  		.call(model_x_axis)			
	  	    //this be some voodoo...
	  	    //to rotate the text, I need to select it as it was added by the axis
	  		.selectAll("text") 
	  		.each(function(d,i) { 
	  		    self._convertLabelHTML(this, self._getShortLabel(self.options.filteredModelList[i].model_label, 15),self.options.filteredModelList[i]);}); 
		
		//The pathline creates a line  below the labels. We don't want two lines to show up so fill=white hides the line.
		var w = self.options.modelWidth;		
		this.options.svg.selectAll("path.domain").remove();	
		self.options.svg.selectAll("text.scores").remove();
		self.options.svg.selectAll("#specieslist").remove();
				
		self.options.svg.append("line")
				.attr("transform","translate(" + (self.options.textWidth + 30) +"," + (self.options.yTranslation + self.options.yoffset - 16) + ")")
				.attr("x1", 0)
				.attr("y1", 0)
				.attr("x2", self.options.modelWidth)
				.attr("y2", 0)
				.attr("stroke", "#0F473E")
				.attr("stroke-width", 1);
				
		
		var scores = self.options.svg.selectAll("text.scores")
				.data(self.options.filteredModelList)
				.enter()	
				.append("text")
				.attr("transform","translate(" + (self.options.textWidth + 34) +"," + (self.options.yTranslation + self.options.yoffset - 3) + ")")
    	        .attr("id", "scorelist")
				.attr("x",function(d,i){return i*18})
				.attr("y", 0)
				.attr("width", 18)
    	        .attr("height", 10)
				.attr("class", "scores")
				.text(function (d,i){return self.options.filteredModelList[i].model_score;});
		
		self.options.svg.append("line")
				.attr("transform","translate(" + (self.options.textWidth + 30) +"," + (self.options.yTranslation + self.options.yoffset + 0) + ")")
				.attr("x1", 0)
				.attr("y1", 0)
				.attr("x2", self.options.modelWidth)
				.attr("y2", 0)
				.attr("stroke", "#0F473E")
				.attr("stroke-width", 1);
				
		if (self.options.targetSpeciesName == "Overview") {
		
			var speciesList = self.options.speciesList;
			
			var species = self.options.svg.selectAll("#specieslist")
					.data(speciesList)
					.enter()
					.append("text")
					.attr("transform","translate(" + (self.options.textWidth + 30) +"," + (self.options.yTranslation + self.options.yoffset + 10) + ")")
					.attr("x", function(d,i){return ((i+1) * (self.options.modelWidth/(speciesList.length))) - ((self.options.modelWidth/speciesList.length)/2);})
					.attr("id", "specieslist")
					.attr("y", 10)
					.attr("width", function(d,i){return self.options.modelWidth/speciesList.length;})
					.attr("height", 10)
					.attr("stroke", "#0F473E")
					.attr("stroke-width", 1)
					.text(function (d,i){return speciesList[i];})
					.attr("text-anchor","middle");
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
	    //this._updateScrollCounts();
	},
	
	_showDialog : function( dname ) {				
		
		var text = this._getDialogText(dname);
		var SplitText = "Title"
		var $dialog = $('<div></div>')
			.html(SplitText )
			.dialog({
				modal: true,
				minHeight: 200,
				maxHeight: 400,
				minWidth: 400,
				resizable: true,
				draggable:true,
				position: ['center', 'center'],
				title: 'Phenogrid Notes'});

		$dialog.dialog('open');
		$dialog.html(text);
	},
	
	_getDialogText : function(name){
	
		var text = "";
		switch(name){
			case "modelscores": text = "<h5>What is the score shown at the top of the grid?</h5><div>The score indicated at the top of each column, below the target label, is the overall similarity score between the query and target. Briefly, for each of the targets (columns) listed, the set of Q(1..n) phenotypes of the query are pairwise compared against all of the T(1..m) phenotypes in the target.<br /><br />Then, for each pairwise comparison of phenotypes (q x P1...n), the best comparison is retained for each q and summed for all p1..n. </div><br /><div>The raw score is then normalized against the maximal possible score, which is the query matching to itself. Therefore, range of scores displayed is 0..100. For more details, please see (Smedley et al, 2012 <a href='http://www.ncbi.nlm.nih.gov/pubmed/23660285' target='_blank'>http://www.ncbi.nlm.nih.gov/pubmed/23660285</a> and <a href='http://www.owlsim.org' target='_blank'>http://www.owlsim.org</a>).";
			break;
			case "calcs": text = "<h5>What do the different calculation methods mean?</h5><div>For each pairwise comparison of phenotypes from the query (q) and target (t), we can assess their individual similarities in a number of ways.  First, we find the phenotype-in-common between each pair (called the lowest common subsumer or LCS). Then, we can leverage the Information Content (IC) of the phenotypes (q,t,lcs) in a variety of combinations to interpret the strength of the similarity.</div><br /><div><b>**Uniqueness </b>reflects how often the phenotype-in-common is annotated to all diseases and genes in the Monarch Initiative knowledgebase.  This is simply a reflection of the IC normalized based on the maxIC. IC(PhenotypeInCommon)maxIC(AllPhenotypes)</div><br /><div><b>**Distance</b> is the euclidian distance between the query, target, and phenotype-in-common, computed using IC scores.<br/><center>d=(IC(q)-IC(lcs))2+(IC(t)-IC(lcs))2</center>  </div><br /><div>This is normalized based on the maximal distance possible, which would be between two rarely annotated leaf nodes that only have the root node (phenotypic abnormality) in common.  So what is depicted in the grid is 1-dmax(d)</div><br /><div><b>**Ratio(q)</b> is the proportion of shared information between a query phenotype and the phenotype-in-common with the target.<br /><center>ratio(q)=IC(lcs)IC(q)*100</center></div><br /><div><b>**Ratio(t)</b> is the proportion of shared information between the target phenotype and the phenotype-in-common with the query.<br /><center>ratio(t)=IC(lcs)IC(t)*100</center></div>";
			break;
			case "faq": text = "<h4>Phenogrid Faq</h4><h5>How are the similar targets obtained?</h5><div>We query our owlsim server to obtain the top 100 most-phenotypically similar targets for the selected organism.  The grid defaults to showing mouse.</div><h5>What are the possible targets for comparison?</h5><div>Currently, the phenogrid is configured to permit comparisons between your query (typically a set of disease-phenotype associations) and one of:<ul><li>human diseases</li><li>mouse genes</li><li>zebrafish genes</li></ul>You can change the target organism by selecting a new organism.  The grid will temporarily disappear, and reappear with the new target rendered.</div><h5>Can I compare the phenotypes to human genes?</h5><div>No, not yet.  But that will be added soon.</div><h5>Where does the data come from?</h5><div>The phenotype annotations utilized to compute the phenotypic similarity are drawn from a number of sources:<ul><li>Human disease-phenotype annotations were obtained from  <a href='http://human-phenotype-ontology.org' target='_blank'>http://human-phenotype-ontology.org</a>, which contains annotations for approx. 7,500 diseases.</li><li>Mouse gene-phenotype annotations were obtained from MGI <a href='www.informatics.jax.org'>(www.informatics.jax.org).</a> The original annotations were made between genotypes and phenotypes.  We then inferred the relationship between gene and phenotype based on the genes that were variant in each genotype.  We only perform this inference for those genotypes that contain a single variant gene.</li><li>Zebrafish genotype-phenotype annotations were obtained from ZFIN  <a href='www.zfin.org' target='_blank'>(www.zfin.org).</a> The original annotations were made between genotypes and phenotypes, with some of those genotypes created experimentally with the application of morpholino reagents.  Like for mouse, we inferred the relationship between gene and phenotype based on the genes that were varied in each genotype.  We only perform this inference for those genotypes that contain a single variant gene.</li><li>All annotation data, preformatted for use in OWLSim, is available for download from  <a href='http://code.google.com/p/phenotype-ontologies/' target='_blank'>http://code.google.com/p/phenotype-ontologies/ </a> </li></ul><h5>What does the phenogrid show?</h5><div>The grid depicts the comparison of a set of phenotypes in a query (such as those annotated to a disease or a gene) with one or more phenotypically similar targets.  Each row is a phenotype that is annotated to the query (either directly or it is a less-specific phenotype that is inferred), and each column is an annotated target (such as a gene or disease).  When a phenotype is shared between the query and target, the intersection is colored based on the selected calculation method (see What do the different calculation methods mean).   You can hover over the intersection to get more information about what the original phenotype is of the target, and what is in-common between the two.</div><h5>Where can I make suggestions for improvements or additions?</h5><div>Please email your feedback to <a href='mailto:info@monarchinitiative.org'>info@monarchinitiative.org.</a><h5>What happens to the phenotypes that are not shared?</h5><div>Phenotypes that were part of your query but are not shared by any of the targets can be seen by clicking the View Unmatched Phenotype link.</div><h5>Why do I sometimes see two targets that share the same phenotypes have very different overall scores?</h5><div>This is usually because of some of the phenotypes that are not shared with the query.  For example, if the top hit to a query matches each phenotype exactly, and the next hit matches all of them exactly plus it has 10 additional phenotypes that don&#39;t match it at all, it is penalized for those phenotypes are aren&#39;t in common, and thus ranks lower on the similarity scale. <div>";
			break;			
			//case "unmatched":  text = this._showUnmatchedPhenotypes();
			//break;
			default:
		
		}
	    return text;
	},
	
	//** Multiple Organism Overview affects these functions:
	//	 _createAccentBoxes - increase width of grid to add two verticla colmns between two separate grids
	//	 _createModelRegion - we now need two sets of models on the x-axis.
	//   _createRects - account for two separator columns and data from two seoarate arrays - Human and Other
	//   _updateModel - when overview select rectangle is moved, update the UI 
	
	_createAccentBoxes: function() {
	    var self=this;
	    //For Overview of Organisms 0 width = ((multiOrganismCt*2)+2) *18	
		//Add two  extra columns as separators

		this.options.modelWidth = this.options.filteredModelList.length * 18;
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
		.attr("y", self.options.yoffset + self.options.yoffsetOver + this.options.yTranslation )
		.attr("width", function(d, i) {
		    return i == 2 ? self.options.textWidth + 5 : self.options.textWidth + 5;
		})		
		.attr("height",  function(d, i) {
		    //return i == 2 ? self.options.h /**- 216*/ : self.options.h;
			return i == 2 ? self.options.h - 216 : (self.options.phenotypeDisplayCount *  13) + 10;  //phenotype count * height of rect + padding
		})
		.attr("id", function(d, i) {
		    if(i==0) {return "leftrect";} else if(i==1) {return "centerrect";} else {return "rightrect";}
		})	
		.style("opacity", '0.4')
		.attr("fill", function(d, i) {
		    return i != 1 ? d3.rgb("#e5e5e5") : "white";
		});
			
		if (self.options.targetSpeciesName == "Overview") { var ct = 0;}
		else { var ct = -15;}
			
	    //add text headers
	    var rect_headers = this.options.svg.selectAll("#text.accent")
		.data(this.options.dimensions, function(d) { return d;});
	    rect_headers.enter()
	    	.append("text")
		.attr("class", "accent")
		.attr("x", function(d, i) { return i == 0 ?(self.options.axis_pos_list[i]+10)+25 : (self.options.axis_pos_list[i]);})
		.attr("y", self.options.yoffset +(this.options.yTranslation) + ct) //+ self.options.yoffsetOver))
		.style("display", function(d, i) {
		    return i == 0 ? "" : "none";
		})
		.text(String);
	
	},
	
	
	_getModelScore : function(model) {
		var self = this;
		if (model != "")
		{
			for(var i=0;i<=self.options.orgModelList.length;i++)
			{	
				if(model == self._getConceptId(self.options.orgModelList[i].model_id))
				{
					return self.options.orgModelList[i].model_score;
				}
			}
		}
		else return "";
	},

	//this code creates the colored rectangles below the models
	_createModelRegion: function () {
	    var self=this;
		var list = [];
		
		//This is for the new "Overview" target option 
		if (this.options.targetSpeciesName == "Overview"){	
			list = this.options.combinedModelList.slice();			
			//this._createOrgOverviewXAxis();
		}
		else
		{		
			list =this.options.filteredModelList.slice();
		}
		
		this.options.xScale = d3.scale.ordinal()
		.domain(list.map(function (d) {
			return d.model_id; }))
			.rangeRoundBands([0,this.options.modelWidth]);
	   
		model_x_axis = d3.svg.axis()
			.scale(this.options.xScale).orient("top");

		var model_region = this.options.svg.append("g")
			.attr("transform","translate(" + (this.options.textWidth + 30) + "," + (this.options.yoffset  + this.options.yTranslation) + ")")
			.call(model_x_axis)
			.attr("class", "x axis")
			//this be some voodoo...
			//to rotate the text, I need to select it as it was added by the axis
			.selectAll("text") 
			.each(function(d,i) { 
					//This is for the new "Overview" target option 
					if (self.options.targetSpeciesName == "Overview"){	
						if (self.options.combinedModelList[i].model_label != undefined){
							self._convertLabelHTML(this, self._getShortLabel(self.options.combinedModelList[i].model_label, 15), self.options.combinedModelList[i]);
						} 
						else {
							self._convertLabelHTML(this, "", self.options.combinedModelList[i]);
						}
					 }
					else {
						self._convertLabelHTML(this, self._getShortLabel(self.options.filteredModelList[i].model_label, 15),self.options.filteredModelList[i]);
					}
			});
				
		var w = self.options.modelWidth;
		
		this.options.svg.selectAll("path.domain").remove();	
		self.options.svg.selectAll("text.scores").remove();
		self.options.svg.selectAll("#specieslist").remove();


		self.options.svg.append("line")
				.attr("transform","translate(" + (self.options.textWidth + 30) +"," + (self.options.yTranslation + self.options.yoffset - 16) + ")")
				.attr("x1", 0)
				.attr("y1", 0)
				.attr("x2", self.options.modelWidth)
				.attr("y2", 0)
				.attr("stroke", "#0F473E")
				.attr("stroke-width", 1);
				
		var scores = self.options.svg.selectAll("text.scores")
				.data(list)
				.enter()	
				.append("text")
				.attr("transform","translate(" + (self.options.textWidth + 34) +"," + (self.options.yTranslation + self.options.yoffset - 3) + ")")
				.attr("id", "scorelist")
				.attr("x",function(d,i){return i*18})
				.attr("y", 0)
				.attr("width", 18)
				.attr("height", 10)
				.attr("class", "scores")
				.text(function (d,i){return self.options.filteredModelList[i].model_score;});
				
		self.options.svg.append("line")
				.attr("transform","translate(" + (self.options.textWidth + 30) +"," + (self.options.yTranslation + self.options.yoffset + 0) + ")")
				.attr("x1", 0)
				.attr("y1", 0)
				.attr("x2", self.options.modelWidth)
				.attr("y2", 0);
	    				
		if (self.options.targetSpeciesName == "Overview") {
		
			var speciesList = self.options.speciesList;
					
			var species = self.options.svg.selectAll("#specieslist")
					.data(speciesList)
					.enter()
					.append("text")
					.attr("transform","translate(" + (self.options.textWidth + 30) +"," + (self.options.yTranslation + self.options.yoffset + 10) + ")")
					.attr("x", function(d,i){return ((i+1) * (self.options.modelWidth/(speciesList.length))) - ((self.options.modelWidth/speciesList.length)/2);})
					.attr("id", "specieslist")
					.attr("y", 10)
					.attr("width", function(d,i){return self.options.modelWidth/speciesList.length;})
					.attr("height", 10)
					.attr("stroke", "#0F473E")
					.attr("stroke-width", 1)
					.text(function (d,i){return speciesList[i];})
					.attr("text-anchor","middle");
		
		}
		
		var modData = [];
		
		//This is for the new "Overview" target option 
		if (this.options.targetSpeciesName == "Overview"){	
			modData = this.options.combinedModelData.slice();			
			//this._createOrgOverviewXAxis();
		}
		else
		{		
			modData =this.options.modelData.slice();
		}
		
		var temp_data = modData.map(function(d) { 
			return d.value;});
	    var diff = d3.max(temp_data) - d3.min(temp_data);
		//account for a grid with less than 5 phenotypes
		//No matches
		//var y1 = 307,
		//	y2 = 294;
		var y1 = 267,
			y2 = 254;
			
		if (this.options.filteredPhenotypeData.length < 14) {y1 =177; y2 = 164;} //{y1 =217; y2 = 204;}
	    //only show the scale if there is more than one value represented
	    //in the scale
	    if (diff > 0) {

			var color_values_blue = ['rgb(229,229,229)','rgb(164,214,212)','rgb(68,162,147)','rgb(97,142,153)','rgb(66,139,202)','rgb(25,59,143)'];
			
			var color_values_red =  ['rgb(252,248,227)','rgb(230,209,178)','rgb(234,118,59)','rgb(221,56,53)','rgb(181,92,85)','rgb(70,19,19)'];
			
			//var color_values_green =  //['rgb(140,81,10)','rgb(216,179,101)','rgb(246,232,195)','rgb(199,234,229)','rgb(90,180,172)','rgb(1,102,94)'];
			
			//var color_values_green = //['rgb(1,102,94)','rgb(90,180,172)','rgb(199,234,229)','rgb(246,232,195)','rgb(216,179,101)','rgb//(140,81,10)'];
			
			var color_values_green = ['rgb(230,209,178)','rgb(210,173,116)','rgb(148,114,60)','rgb(68,162,147)','rgb(31,128,113)','rgb(3,82,70)'];
			
			   
				var gradient_blue = this.options.svg.append("svg:linearGradient")
					.attr("id", "gradient_blue")
					.attr("x1", "0")
					.attr("x2", "100%")
					.attr("y1", "0%")
					.attr("y2", "0%");
					
				gradient_blue.append("svg:stop")
					.attr("offset", "20%")
					.style("stop-color", 'rgb(164,214,212)')
					.style("stop-opacity", 1);
				
				gradient_blue.append("svg:stop")
					.attr("offset", "40%")
					.style("stop-color", 'rgb(68,162,147)')
					.style("stop-opacity", 1);
				
				gradient_blue.append("svg:stop")
					.attr("offset", "60%")
					.style("stop-color", 'rgb(66,139,202)')
					.style("stop-opacity", 1);
					
				gradient_blue.append("svg:stop")
					.attr("offset", "80%")
					.style("stop-color", 'rgb(25,59,143)')
					.style("stop-opacity", 1);

				var legend_rects_blue = this.options.svg.append("rect")
					.attr("transform","translate(0,10)")
					.attr("class", "legend_rect")
					.attr("id","legendscale_blue")
					.attr("y", (y1 - 20) + this.options.yTranslation + self.options.yoffsetOver)
					.attr("x", self.options.axis_pos_list[2] + 12)
					.attr("rx",8)
					.attr("ry",8)
					.attr("width", 180)
					.attr("height", 15)
					.attr("fill", "url(#gradient_blue)");
					
				//This is for the new "Overview" target option 
				if (this.options.targetSpeciesName == "Overview" || this.options.targetSpeciesName == "All"){			
					
					var grad_text1 = self.options.svg.append("svg:text")
					.attr("class", "bluetext")
					.attr("y", y2  + this.options.yTranslation +15+ self.options.yoffsetOver)
					.attr("x", self.options.axis_pos_list[2] + 205)
					.style("font-size", "11px")
					.text("Homo sapiens");
					
					
					var gradient_red = this.options.svg.append("svg:linearGradient")
						.attr("id", "gradient_red")
						.attr("x1", "0")
						.attr("x2", "100%")
						.attr("y1", "0%")
						.attr("y2", "0%");
							
					//Red values: 
					/**var color_values_red =  ['rgb(252,248,227)','rgb(230,209,178)','rgb(234,118,59)','rgb(221,56,53)','rgb(181,92,85)','rgb(70,19,19)'];*/
					var color_values_red =  ['rgb(252,248,227)','rgb(249,205,184)','rgb(234,118,59)','rgb(221,56,53)','rgb(181,92,85)','rgb(70,19,19)'];
					
				gradient_red.append("svg:stop")
					.attr("offset", "20%")
					.style("stop-color", 'rgb(249,205,184)')

					.style("stop-opacity", 1);
				
				gradient_red.append("svg:stop")
					.attr("offset", "40%")
					.style("stop-color", 'rgb(234,118,5)')
					.style("stop-opacity", 1);
				
				gradient_red.append("svg:stop")
					.attr("offset", "60%")
					.style("stop-color", 'rgb(181,92,85)')
					.style("stop-opacity", 1);
				gradient_red.append("svg:stop")
					.attr("offset", "80%")
					.style("stop-color", 'rgb(70,19,19)')
					.style("stop-opacity", 1);

				var legend_rects_red = this.options.svg.append("rect")
					.attr("transform","translate(0,10)")
					.attr("class", "legend_rect")
					.attr("id","legendscale_red")

					.attr("y", (y1 + 0) + this.options.yTranslation + self.options.yoffsetOver)
					.attr("x", self.options.axis_pos_list[2] + 12)
					.attr("rx",8)
					.attr("ry",8)
					.attr("width", 180)
					.attr("height", 15)
					.attr("fill", "url(#gradient_red)");
					
				var grad_text2 = self.options.svg.append("svg:text")
					.attr("class", "redtext")
					.attr("y", (y2 + 35)  + this.options.yTranslation + self.options.yoffsetOver)
					.attr("x", self.options.axis_pos_list[2] + 205)
					.style("font-size", "11px")
					.text("Mus musculus");

				
				var gradient_green = this.options.svg.append("svg:linearGradient")
					.attr("id", "gradient_green")
					.attr("x1", "0")
					.attr("x2", "100%")
					.attr("y1", "0%")
					.attr("y2", "0%");
						
				//Green values: 				
				//new: var color_values_green = ['rgb(1,102,94)','rgb(90.180,172)','rgb(199,234,229)','rgb(246,232,195)','rgb(216,179,101)','rgb(140,81,10)'];
				//OLD: 'rgb(140,81,10)','rgb(216,179,101)','rgb(246,232,195)','rgb(199,234,229)','rgb(90,180,172)','rgb(1,102,94)']
				//NEWEST:	//'rgb(230,209,178)','rgb(210,173,116)','rgb(148,114,60)','rgb(68,162,147)','rgb(31,128,113)',//'rgb(3,82,70)'
				
				
				gradient_green.append("svg:stop")
					.attr("offset", "20%")
					.style("stop-color", 'rgb(210,173,116)')
					.style("stop-opacity", 1);
				
				gradient_green.append("svg:stop")
					.attr("offset", "40%")
					.style("stop-color", 'rgb(148,114,60)')
					.style("stop-opacity", 1);
				
				gradient_green.append("svg:stop")
					.attr("offset", "60%")
					.style("stop-color", 'rgb(31,128,113)')
					.style("stop-opacity", 1);
					
				gradient_green.append("svg:stop")
					.attr("offset", "80%")
					.style("stop-color", 'rgb(3,82,70)')
					.style("stop-opacity", 1);

				var legend_rects_green = this.options.svg.append("rect")
					.attr("transform","translate(0,10)")
					.attr("class", "legend_rect")
					.attr("id","legendscale_green")
					.attr("y", (y1 + 20) + this.options.yTranslation + self.options.yoffsetOver)
					.attr("x", self.options.axis_pos_list[2] + 12)
					.attr("rx",8)
					.attr("ry",8)
					.attr("width", 180)
					.attr("height", 15)
					.attr("fill", "url(#gradient_green)");
					
			var grad_text3 = self.options.svg.append("svg:text")
				.attr("class", "greentext")
				.attr("y", y2 + 55  + this.options.yTranslation + self.options.yoffsetOver)
				.attr("x", self.options.axis_pos_list[2] + 205)
				.style("font-size", "10px")
				.text("Danio rerieo");
			}
		  
			var calc = this.options.selectedCalculation,
				text1 = "",
				text2 = "",
				text3 = "";
			
			//account for a grid with less than 5 phenotypes
			var y1 = 267,
				y2 = 257;
			if (this.options.filteredPhenotypeData.length < 14) {y1 = 172; y2 = 162;}
			
			if (calc == 2) {text1 = "Lowest"; text2 = "Uniqueness"; text3 = "Highest";}
			else if (calc == 1) {text1 = "Less Similar"; text2 = "Ratio (q)"; text3 = "More Similar";}
			else if (calc == 3) {text1 = "Less Similar"; text2 = "Ratio (t)"; text3 = "More Similar";}
			else if (calc == 0) {text1 = "Min"; text2 = "Distance"; text3 = "Max";}
	
		    var div_text1 = self.options.svg.append("svg:text")
				.attr("class", "detail_text")
				.attr("y", y1  + this.options.yTranslation + self.options.yoffsetOver-15)
				.attr("x", self.options.axis_pos_list[2] + 10)
				.style("font-size", "10px")
				.text(text1);
		    
			var div_text2 = self.options.svg.append("svg:text")
				.attr("class", "detail_text")
				.attr("y", y2  + this.options.yTranslation + self.options.yoffsetOver -10)
				.attr("x", self.options.axis_pos_list[2] + 75)
				.style("font-size", "12px")
				.text(text2);
				
		    var div_text3 = self.options.svg.append("svg:text")
				.attr("class", "detail_text")
				.attr("y", y1 + this.options.yTranslation + self.options.yoffsetOver-15)
				.attr("x", self.options.axis_pos_list[2] + 125)
				.style("font-size", "10px")
				.text(text3);	
				
			//Position the max more carefully	
			if (text2 == "Distance") {
				div_text2.attr("x", "860px");			
			}
			if (text2 == "Uniqueness") {
				div_text2.attr("x", "845px");			
			}
			if (text3 == "Max") {
				div_text3.attr("x","945px");			
			}
			if (text3 == "Highest") {
				div_text3.attr("x",self.options.axis_pos_list[2] + 150);			
			}
						
			var selClass = "";

			//This is for the new "Overview" target option 
			if (self.options.targetSpeciesName == "Overview") {
				if (self.options.filteredPhenotypeData.length < 14) 
				{ 
					selClass = "overviewShortselects"; 
				} 
				else { selClass = "overviewselects"; }
			} 
			else{
				if (self.options.filteredPhenotypeData.length < 14) { selClass = "shortselects"; } else { selClass = "selects";}
			}
		
			var optionhtml = "<div id='selects' class='" + selClass + "'><div id='org_div'><div>Species</div><span><select id=\'organism\'>";

			for (var idx=0;idx<self.options.targetSpeciesList.length;idx++) {
				var selecteditem = "";
				if (self.options.targetSpeciesList[idx].name === self.options.targetSpeciesName) {
					selecteditem = "selected";
				}
				optionhtml = optionhtml + "<option value='" + self.options.targetSpeciesList[idx].label +"' "+ selecteditem +">" + self.options.targetSpeciesList[idx].name +"</option>"
			}
	
			optionhtml = optionhtml + "</select></span></div><div id='calc_div'><span id='clabel'>Display<span id='calcs'><img class='calcs' src='" + this.options.scriptpath + "../image/greeninfo30.png' height='15px'></span></span><br /><span id='calc_sel'><select id=\"calculation\">";
       	   

			for (var idx=0;idx<self.options.selectList.length;idx++) {
				var selecteditem = "";
				if (self.options.selectList[idx].label === self.options.selectedLabel) {
					selecteditem = "selected";
				}
				if (self.options.selectList[idx].calc === self.options.selectedCalculation) {
					selecteditem = "selected";
				}
				optionhtml = optionhtml + "<option value='" + self.options.selectList[idx].calc +"' "+ selecteditem +">" + self.options.selectList[idx].label +"</option>"
			}
			optionhtml = optionhtml + "</select></span></div></div>";
			this.element.append(optionhtml);			

			var calcs = d3.selectAll("#calcs")
				.on("click", function(d,i){
					self._showDialog( "calcs");
			});
			
			//add the handler for the select control
			$( "#organism" ).change(function(d) {
				//msg =  "Handler for .change() called." );
				self.options.targetSpecies = self.options.targetSpeciesList[d.target.selectedIndex].taxon;
				self.options.targetSpeciesName = self.options.targetSpeciesList[d.target.selectedIndex].name;
				$("#unmatchedlabel").remove();
				$("#unmatchedlabelhide").remove();
				$("#unmatched").remove();
				$("#selects").remove();
				$("#org_div").remove();
				$("#calc_div").remove();
				$("#sort_div").remove();
				$("#mtitle").remove();
				$("#header").remove();
				$("#svg_area").remove();
				self.options.phenotypeData = self.options.origPhenotypeData.slice();
				self._reset();
				self._create();
				});
			
        
			 $( "#calculation" ).change(function(d) {
				//msg =  "Handler for .change() called." );
				self.options.selectedCalculation = self.options.selectList[d.target.selectedIndex].calc;
				self.options.selectedLabel = self.options.selectList[d.target.selectedIndex].label;
				$("#unmatchedlabel").remove();
				$("#unmatchedlabelhide").remove();
				$("#unmatched").remove();
				$("#selects").remove();
				$("#calc_div").remove();
				$("#org_div").remove();
				$("#sort_div").remove();
				$("#mtitle").remove();
				$("#header").remove();
				$("#svg_area").remove();
				self.options.phenotypeData = self.options.origPhenotypeData.slice();
				self._reset();
				self._create();
			});
	    
		}
	},
	
	update: function() {
		this._updateAxes();
		this._createRects();
		this._createModelRects();
	},

	//this code creates the text and rectangles containing the text 
	//on either side of the model data
	_createRects : function() {
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
		.data(self.options.filteredPhenotypeData, function(d, i) {  return d[0].id_a; });//rowid
	    rect_text.enter()
		.append("text")
		.attr("class", function(d) {
		    return "a_text data_text " + self._getConceptId(d[0].id);
		})
	    //store the id for this item.  This will be used on click events
		.attr("ontology_id", function(d) {
		    return self._getConceptId(d[0].id_a);   
		})
		.attr("x", 208)
		.attr("y", function(d) {
			 return self._getYPosition(d[0].id_a) + (self.options.yTranslation) + 10;   //rowid
		})
		.on("mouseover", function(d) {
		    if (self.options.clickedData == undefined) {
			  self._selectData(d, this);
		    }
		})
		.on("mouseout", function(d) {
	    	if (self.options.clickedData == undefined) {
				self._deselectData(d, d3.mouse(this));
			}
		})
		.attr("width", self.options.textWidth)
		.attr("height", 50)
		.text(function(d) {
			var txt = d[0].label_a;
			if (txt == undefined) {
				txt = d[0].id_a;
			}
			return self._getShortLabel(txt);
		})
		
		if (this.options.unmatchedPhenotypes != undefined && this.options.unmatchedPhenotypes.length > 0){
			d3.select("#unmatchedlabel").remove();
			d3.select("#unmatchedlabelhide").remove();
			d3.select("#prebl").remove();
		
			var phenotypes = self._showUnmatchedPhenotypes();		
		
			var optionhtml3 = "<div id='prebl'><div id='unmatchedlabel' style='display:block;'>View Unmatched Phenotypes</div></div>";
			var el = this.element;
			el.append(optionhtml3);	

			var optionhtml4 = "<div id='unmatchedlabelhide' style='display:none;'>Hide Unmatched Phenotypes<br /><div id='unmatched' style='display:none;'>" + phenotypes + "</div></div>";
			el.append(optionhtml4)
			
			d3.select("#unmatchedlabel")
				.on("click", function(d) {
					$("#unmatchedlabel").hide();
					$("#unmatchedlabelhide").show();
					$("#unmatched").show();				
				});
				
			d3.select("#unmatchedlabelhide")
				.on("click", function(d) {
					$("#unmatchedlabel").show();
					$("#unmatchedlabelhide").hide();
					$("#unmatched").hide();			
				});
		}
		
		if (this.options.targetSpeciesName == "Overview") {var pad = 14;}
		else { var pad = 10;}
		
		rect_text.transition()
   		.style('opacity', '1.0')
		.delay(5)
		.attr("y", function(d) {
			//controls position of phenotype list
			return self._getYPosition(d[0].id_a) + (self.options.yTranslation + self.options.yoffsetOver) + pad;//rowid
		})
	    rect_text.exit()
	   	.transition()
	   	.delay(20)
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
				retData = "<strong>Label:</strong> " + "<a href=\"" + data.url + "\">"  
				+ data.label + "</a><br/><strong>Type:</strong> " + data.category;
			}
	    });
	    this._updateDetailSection(retData, this._getXYPos(data));
	},

	_toProperCase : function (oldstring) {
	    return oldstring.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
	},
	
	_selectModel: function(modelData, obj) {
		var self=this;
		//select the model label		
		var model_label = self.options.svg.selectAll("text#" + this._getConceptId(modelData.model_id));
    	model_label.style("fill", "blue");
		model_label.style("text-decoration", "underline");

		//create the related model rectangles
		var highlight_rect = self.options.svg.append("svg:rect")
		  	.attr("transform",
		  			  "translate(" + (self.options.textWidth + 30) + "," + 1 +( self.options.yTranslation + self.options.yoffsetOver)+ ")")
					  .attr("x", function(d) { return (self.options.xScale(modelData.model_id)-2);})
			.attr("y", self.options.yoffset + self.options.yoffsetOver)
			.attr("class", "model_accent")
			.attr("width", 14)
			.attr("height", (self.options.yAxisMax-75));

		var retData;
		//initialize the model data based on the scores
		retData = "<strong>" +  self._toProperCase(self.options.comparisonType).substring(0, self.options.comparisonType.length-1) +" Label:</strong> "   
			+ modelData.model_label + "<br/><strong>Rank:</strong> " + (parseInt(modelData.model_rank) + 1);

		//obj = try creating an ojbect with an attributes array including "attributes", but I may need to define
		//getAttrbitues
		//just create a temporary object to pass to the next method...
		var obj = {				
			attributes: [],
				getAttribute: function(keystring) {
					var ret = self.options.xScale(modelData.model_id)-2;
					if (keystring == "y") {
						ret = Number(self.options.yoffset + /**self.options.yoffsetOver)*/-190);
					}
					return ret;
				},
        };		
		obj.attributes['transform'] = {value: highlight_rect.attr("transform")};		
		this._updateDetailSection(retData, this._getXYPos(obj), undefined, 50);
	},

	//given an array of phenotype objects 
	//edit the object array.
	// items are either ontology ids as strings, in which case they are handled as is,
	// or they are objects of the form
	// { "id": <id>, "observed": <obs>} .
	// in that case take id  if  "observed" is "positive"
    _filterPhenotypeResults : function(phenotypelist) {
    	//this.options.phenotypeData = phenotypelist.slice();
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
    },   
  
  
    //given an array of phenotype objects 
	//Create a new array for only id and label 
    _filterPhenotypeLabels : function(phenotypelist) {
    	//this.options.phenotypeData = phenotypelist.slice();
		var newlist = [];

		for (var i = 0; i < phenotypelist.length; i++) {
			newlist.push({ "id" : phenotypelist[i].id, "label" : this._getShortLabel(phenotypelist[i].label)}); 
		}   	
    	//copy the list of ids and labels to phenotypeLabels array
    	return newlist;

    }  
  });
})(jQuery);
