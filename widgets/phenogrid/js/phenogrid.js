/*
 *
 * Phenogrid - the Phenogrid widget.
 * 
 * implemented as a jQuery UI (jqueryui.com) widget, this can be instantiated on a jquery-enabled web page
 *  with a call of the form 
 *  $("#mydiv).phenogrid({phenotypeData: phenotypeList}).
 * 
 *  where 
 *
 *   #mydiv is the id of the div that will contain the phenogrid widget
 *   
 *   and phenotypeList takes one of two forms:
 *
 *   1. a list of hashes of the form 
 * [ {"id": "HP:12345", "observed" :"positive"}, {"id: "HP:23451", "observed" : "negative"},]
 *   2. a simple list of ids..
 *  [ "HP:12345", "HP:23451"], etc.
 *
 * Configuration options useful for setting species displayed, similarity calculations, and 
 * related parameters can also be passed in this hash. As of September
 * 2014, these options are currently being refactored - further
 * documentation hopefully coming soon.
 *
 *
 *  The phenogrid widget uses semantic similarity calculations
 *  provided by OWLSim (www.owlsim.org), as provided through APIs from
 *  the Monarch initiative (www.monarchinitiative.org). 
 * 
 *  Given an input list of phenotypes and parameters indicating
 *  desired source of matching models (humans, model organisms, etc.),
 *  the phenogrid will call the Monarch API to get OWLSim results
 *  consisting of arrays of the items of the following form:
 *  {
 *     "id":"HP_0000716_MP_0001413_MGI_006446",
 *     "label_a":"Depression",
 *     "id_a":"HP:0000716",
 *     "subsumer_label":"Abnormal emotion/affect behavior",
 *     "subsumer_id":"HP:0100851",
 *     "value":5.667960271407814,
 *     "label_b":"abnormal response to new environment",
 *     "id_b":"MP:0001413",
 *     "model_id":"MGI_006446",
 *     "model_label":"B10.Cg-H2<sup>h4</sup>Sh3pxd2b<sup>nee</sup>/GrsrJ",
 *     "rowid":"HP_0000716_HP_0100851"
 *  },
 *
 * These results will then be rendered in the phenogrid
 *
 *
 *
 *
 * NOTE: I probably need a model_url to render additional model info on 
 * the screen.  Alternatively I can load the data 
 * as a separate call in the init function.
 *
 * META NOTE (HSH - 8/25/2014): Can we remove this note, or at least clarify?
 */
var url = document.URL;

(function($) {
	$.widget("ui.phenogrid", {
		// core commit. Not changeable by options. 
	config: {
		scriptpath : $('script[src]').last().attr('src').split('?')[0].split('/').slice(0, -1).join('/')+'/',        
		colorDomains: [0, 0.2, 0.4, 0.6, 0.8, 1],
		colorRanges: [['rgb(229,229,229)','rgb(164,214,212)','rgb(68,162,147)','rgb(97,142,153)','rgb(66,139,202)','rgb(25,59,143)'],
			['rgb(252,248,227)','rgb(249,205,184)','rgb(234,118,59)','rgb(221,56,53)','rgb(181,92,85)','rgb(70,19,19)'],
			['rgb(230,209,178)','rgb(210,173,116)','rgb(148,114,60)','rgb(68,162,147)','rgb(31,128,113)','rgb(3,82,70)'],
			['rgb(229,229,229)','rgb(164,214,212)','rgb(68,162,147)','rgb(97,142,153)','rgb(66,139,202)','rgb(25,59,143)']],
		emptySvgX: 1100,
		emptySvgY: 70,
		overviewCount: 3,
		colStartingPos: 10,
		detailRectWidth: 300,
		detailRectHeight: 140,
		detailRectStrokeWidth: 3,
		globalViewSize : 110,
		reducedGlobalViewSize: 50,
		minHeight: 225,
		h : 526,
		m :[ 30, 10, 10, 10 ],
		multiOrganismCt: 10,
		multiOrgModelLimit: 750,
		phenotypeSort: ["Alphabetic", "Frequency and Rarity", "Frequency" ],
		similarityCalculation: [{label: "Similarity", calc: 0, high: "Max", low: "Min"}, 
			{label: "Ratio (q)", calc: 1, high: "More Similar", low: "Less Similar"}, 
			{label: "Ratio (t)", calc: 3, high: "More Similar", low: "Less Similar"} , 
			{label: "Uniqueness", calc: 2, high: "Highest", low: "Lowest"}],
		smallestModelWidth: 400,
		textLength: 34,
		textWidth: 200,
		w : 0,
		headerAreaHeight: 160,
		comparisonTypes: [ { organism: "Homo sapiens", comparison: "diseases"}],
		defaultComparisonType: { comparison: "genes"},
		speciesLabels: [ { abbrev: "HP", label: "Human"},
			{ abbrev: "MP", label: "Mouse"},
			{ abbrev: "ZFIN", label: "Zebrafish"},
			{ abbrev: "ZP", label: "Zebrafish"},
			{ abbrev: "FB", label: "Fly"},
			{ abbrev: "GO", label: "Gene Ontology"}],
		modelDisplayCount : 30,
		phenotypeDisplayCount : 26,
		labelCharDisplayCount : 20,
		defaultPhenotypeDisplayCount: 26,
		apiEntityMap: [ {prefix: "HP", apifragment: "disease"},
			{prefix: "OMIM", apifragment: "disease"}],
		defaultApiEntity: "gene",
		tooltips: {},
		widthOfSingleModel: 18,
		heightOfSingleModel: 13,
		overviewGap: 30,
		nonOverviewGap: 5,
		overviewGridTitleXOffset: 340,
		overviewGridTitleFaqOffset: 230,
		nonOverviewGridTitleXOffset: 220,
		nonOverviewGridTitleFaqOffset: 570,
		gridTitleYOffset: 20,
		baseYOffset: 150,
		dummyModelName: "dummy"
	},

	internalOptions:   {
		/// good - legit options
		serverURL: "",
		selectedCalculation: 0,
		selectedSort: "Frequency",
		targetSpeciesName : "Overview",
		refSpecies: "Homo sapiens",
		targetSpeciesList : [{ name: "Homo sapiens", taxon: "9606"},
			{ name: "Mus musculus", taxon: "10090" },
			{ name: "Danio rerio", taxon: "7955"},
			{ name: "Drosophila melanogaster", taxon: "7227"}]
	},
	
	//reset state values that must be cleared before reloading data
	_reset: function(type) {
		if (type !== 'sortphenotypes') {
			this.state.modelData = [];
			this.state.modelList = [];
			this.state.filteredModelData = [];
			this.state.filteredModelList = [];
		}

		this.state.yAxisMax = 0;
		this.state.yoffset  = this.state.baseYOffset;
		//basic gap for a bit of space above modelregion
		this.state.yoffsetOver = this.state.nonOverviewGap;
		if (this.state.targetSpeciesName == "Overview") {
			this.state.yoffsetOver = this.state.overviewGap;
		}

		this.state.modelName = "";
		//  this.state.yTranslation = 0;
		// must reset height explicitly
		this.state.h = this.config.h;

		this.data = {};
	},

	//this function will use the desired height to determine how many phenotype rows to display
	//the basic formula is: (height - headerAreaHeight)/14.
	//return -1 if the available space is too small to properly display the grid   
	_calcPhenotypeDisplayCount: function() {
		var self = this;

		var pCount = Math.round((self.state.h - self.state.headerAreaHeight) / 14);
		if (pCount < 10) {
			pCount = -1;
		}
		return pCount;
	},

	/** Several procedures for various aspects of filtering/identifying appropriate entries
	    in the target species list.. */
	_getTargetSpeciesIndexByName: function(self,name) {
		var index = -1;
		if (typeof(self.state.targetSpeciesByName[name]) !== 'undefined') {
			index  = self.state.targetSpeciesByName[name].index;
		}
		return index;
	},

	_getTargetSpeciesNameByIndex: function(self,index) {
		var species;
		if  (typeof(self.state.targetSpeciesList[index]) !== 'undefined') {
			species = self.state.targetSpeciesList[index].name;
		}
		else {
			species = 'Overview';
		}
		return species;
	},

	_getTargetSpeciesTaxonByName: function(self,name) {
		var taxon;
		if (typeof(self.state.targetSpeciesByName[name]) !== 'undefined') {
			taxon  = self.state.targetSpeciesByName[name].taxon;
		}
		return taxon;
	},

	//NOTE: I'm not too sure what the default init() method signature should be
	//given an imageDiv and phenotype_data list
	/**
	 * imageDiv - the place you want the widget to appear
	 * phenotype_data - a list of phenotypes in the following format:
	 * [ {"id": "HP:12345", "observed" :"positive"}, {"id: "HP:23451", "observed" : "negative"},]
	 * or simply a list of IDs.
	 * [ "HP:12345", "HP:23451", ...]
	 */
	_create: function() {
		// must be available from js loaded in a separate file...
		this.configoptions = configoptions;
		/** check these */
		// important that config options (from the file) and this. options (from
		// the initializer) come last
		this.state = $.extend({},this.internalOptions,this.config,this.configoptions,this.options);
		this.state.data = {};
		// will this work?
		this.configoptions = undefined;
		this._createTargetSpeciesIndices();
		// index species
		this._reset();
	},

	// create a shortcut index for quick access to target species by name - to get index (position) and
	// taxon
	_createTargetSpeciesIndices: function() {
		this.state.targetSpeciesByName={};
		for (var j in this.state.targetSpeciesList) {
			// list starts as name, taxon pairs
			var name = this.state.targetSpeciesList[j].name;
			var taxon = this.state.targetSpeciesList[j].taxon;
			var entry = {};
			entry.index = j;
			entry.taxon = taxon;
			this.state.targetSpeciesByName[name]= entry;
		}
	},

	// HACK WARNING - 20140926, harryh@pitt.edu
	// phenogrid assumes a path of /js/res relative to the scriptpath directory. This will contain configuration files
	// that will be loaded via urls constructed in this function.
	// As of 9/26/2014, the puptent application used in monarch-app breaks this.
	// thus, a workaround is included below to set the path correctly if it come up as '/'.
	// this should not impact any standalone uses of phenogrid, and will be removed once monarch-app is cleaned up.
	_getResourceUrl: function(name,type) {
		var prefix;
		if (typeof(this.config.scriptpath) !== 'undefined' && this.config.scriptpath !== null && this.config.scriptpath !== '' && this.config.scriptpath != '/') {
			prefix = this.config.scriptpath;
		} else {
			prefix ='/widgets/phenogrid/js/';
		}
		return prefix+'res/'+name+'.'+type;
	},

	_init: function() {
		this.element.empty();
		this._loadSpinner();
		this.state.phenotypeDisplayCount = this._calcPhenotypeDisplayCount();
		//save a copy of the original phenotype data
		this.state.origPhenotypeData = this.state.phenotypeData.slice();

		this._setSelectedCalculation(this.state.selectedCalculation);
		this._setSelectedSort(this.state.selectedSort);
		//this.state.yTranslation = 0;
		this.state.w = this.state.m[1]-this.state.m[3];

		this.state.currModelIdx = this.state.modelDisplayCount-1;
		this.state.currPhenotypeIdx = this.state.phenotypeDisplayCount-1;
		this.state.phenotypeData = this._filterPhenotypeResults(this.state.phenotypeData);
		this._loadData();

		// shorthand for top of model region
		this.state.yModelRegion = this.state.yoffsetOver+this.state.yoffset;

		this._filterData(this.state.modelData);
		this._filterSelected("sortphenotypes");
		this.state.unmatchedPhenotypes = this._getUnmatchedPhenotypes();
		this.element.empty();
		this.reDraw();
	},

	_loadSpinner: function() {
		var element =$('<div id="spinner"><h3>Loading...</h3><div class="cube1"></div><div class="cube2"></div></div>');
		this._createSvgContainer();
		element.appendTo(this.state.svgContainer);
	},

	reDraw: function() {
		if (this.state.modelData.length !== 0 && this.state.phenotypeData.length !== 0 && this.state.phenotypeSortData.length !== 0){
			this._setComparisonType();
			this._initCanvas();
			this._addLogoImage();

			this.state.svg
				.attr("width", "100%")
				.attr("height", this.state.phenotypeDisplayCount * this.state.widthOfSingleModel);
			var rectHeight = this._createRectangularContainers();
			this._createColorScale();

			this._createModelRegion();

			this._updateAxes();

			this._createGridlines();
			this._createModelRects();
			this._createRowLabels();
			this._createOverviewSection();

			var height = rectHeight + 40;

			var containerHeight = height + 10; // MAGIC NUMBER? OR OVERVIEW OFFSET?
			$("#svg_area").css("height",height);
			$("#svg_container").css("height",containerHeight);
		} else {
			var msg;
			if (this.state.targetSpeciesName == "Overview"){
				msg = "There are no models available.";
				this._createSvgContainer();
				this._createEmptyVisualization(msg);
			}else{
				msg = "There are no " + this.state.targetSpeciesName + " models available.";
				this._createSvgContainer();
				this._createEmptyVisualization(msg);
			}
		}
	},

	_resetIndicies: function() {
		this.state.currModelIdx = this.state.modelDisplayCount-1;
		this.state.currPhenotypeIdx = this.state.phenotypeDisplayCount-1;
	},

	/* dummy option procedures as per 
	http://learn.jquery.com/jquery-ui/widget-factory/how-to-use-the-widget-factory/
	likely to have some content added as we proceed
	*/
	_setOption: function( key, value ) {
		this._super( key, value );
	},

	_setOptions: function( options ) {
		this._super( options );
	},

	//create this visualization if no phenotypes or models are returned
	_createEmptyVisualization: function(msg) {
		var self = this;
		var html;
		d3.select("#svg_area").remove();
		this.state.svgContainer.append("<svg id='svg_area'></svg>");
		this.state.svg = d3.select("#svg_area");

		var svgContainer = this.state.svgContainer;
		svgContainer.append("<svg id='svg_area'></svg>");
		this.state.svg = d3.select("#svg_area")
			.attr("width", this.state.emptySvgX)
			.attr("height", this.state.emptySvgY);

		//var error = "<br /><div id='err'><h4>" + msg + "</h4></div><br /><div id='return'><button id='button' type='button'>Return</button></div>";
		//this.element.append(error);
		if (this.state.targetSpeciesName != "Overview"){
			html = "<h4 id='err'>" + msg + "</h4><br /><div id='return'><button id='button' type='button'>Return</button></div>";
			this.element.append(html);

			var btn = d3.selectAll("#button")
				.on("click", function(d,i){
					$("#return").remove();
					$("#errmsg").remove();
					d3.select("#svg_area").remove();

					self.state.phenotypeData = self.state.origPhenotypeData.slice();
					self._reset();
					self.state.targetSpeciesName ="Overview";
					self._init();
				});
		}else{
			html = "<h4 id='err'>"+msg+"</h4><br />";
			this.element.append(html);
		}
	},

	//adds light gray gridlines to make it easier to see which row/column selected matches occur
	_createGridlines: function() { 
		var self = this;
		var mWidth = self.state.widthOfSingleModel;
		var mHeight = self.state.heightOfSingleModel;
		//create a blank grid to match the size of the phenogrid grid				
		var data = [],
		modelCt = 0;

		//This is for the new "Overview" target option 		
		//if (this.state.targetSpeciesName == "Overview"){ modelCt = self.state.multiOrganismCt * 3;}
		//else { modelCt = self.state.modelDisplayCount;}
		modelCt = self.state.modelDisplayCount;
		for (var k = 0; k < self.state.phenotypeDisplayCount; k++){
			for (var l = 0; l < modelCt; l++) {
				var r = [];
				r.push(k);
				r.push(l);
				data.push( r );
			}
		}
		self.state.svg.selectAll("rect.bordered")
			.data(data)
			.enter()
			.append("rect")
			.attr("id","gridline")
			.attr("transform","translate(232, " + (this.state.yModelRegion + 5) +")")
			.attr("x", function(d,i) { return d[1] * mWidth;})
			.attr("y", function(d,i) { return d[0] * mHeight;})  
			.attr("class", "hour bordered deselected")
			.attr("width", 14)
			.attr("height", 11.5);
	},

	//for the selection area, see if you can convert the selection to the idx of the x and y
	//then redraw the bigger grid 
	_createOverviewSection: function() {
		var self = this;
		// add-ons for stroke size on view box. Preferably even numbers
		var linePad = 2;
		var viewPadding = linePad*2+2;

		// overview region is offset by xTranslation, yTranslation
		var xTranslation = 42;
		var yTranslation = 30;

		// these translations from the top-left of the rectangular region give the
		// absolute coordinates
		var overviewX = self.state.axis_pos_list[2]+xTranslation;
		var overviewY = self.state.yModelRegion+yTranslation;

		// size of the entire region - it is a square
		var overviewRegionSize = self.state.globalViewSize;
		if (this.state.phenotypeData.length < this.state.defaultPhenotypeDisplayCount) {
			overviewRegionSize = self.state.reducedGlobalViewSize;
		}

		// create the legend for the modelScores
		self._createModelScoresLegend();

		// make it a bit bigger to ccont for widths
		// MAGIC NUMBER ALERT
		var overviewBoxDim = overviewRegionSize+viewPadding;

		// create the main box and the instruction labels.
		self._initializeOverviewRegion(overviewBoxDim,overviewX,overviewY);

		// create the scales
		self._createSmallScales(overviewRegionSize);

		//add the items using smaller rects
		var mods = self.state.modelList;
		var modData = self.state.modelData;

		var model_rects = this.state.svg.selectAll(".mini_models")
			.data(modData, function(d) {return d.id;});
		overviewX++;	//Corrects the gapping on the sides
		overviewY++;
		var modelRectTransform = "translate(" + overviewX +	"," + overviewY + ")";
		model_rects.enter()
			.append("rect")
			.attr("transform",modelRectTransform)
			.attr("class",  "mini_model")
			.attr("y", function(d, i) { return self.state.smallYScale(d.id_a)+linePad/2;})
			.attr("x", function(d) { return self.state.smallXScale(d.model_id)+linePad/2;})
			.attr("width", linePad)
			.attr("height", linePad)
			.attr("fill", function(d) { return self._getColorForModelValue(self,d.species,d.value);});

		var lastId = self.state.phenotypeSortData[self.state.phenotypeDisplayCount-1][0].id_a; //rowid
		var selectRectHeight = self.state.smallYScale(lastId);
		var selectRectWidth = self.state.smallXScale(mods[self.state.modelDisplayCount-1].model_id);
		self.state.highlightRect = self.state.svg.append("rect")
			.attr("x",overviewX)
			.attr("y",overviewY)
			.attr("id", "selectionrect")
			.attr("height", selectRectHeight+4)
			.attr("width", selectRectWidth+4)
			.attr("class", "draggable")	
			.call(d3.behavior.drag()
				.on("drag", function(d) {
					// drag the highlight in the overview window
					//notes: account for the width of the rectangle in my x and y calculations
					//do not use the event x and y, they will be out of range at times.  use the converted values instead.

					var current = d3.select(this);
					var curX = parseFloat(current.attr("x"));
					var curY = parseFloat(current.attr("y"));

					var rect = self.state.svg.select("#selectionrect");
					rect.attr("transform","translate(0,0)");

					//limit the range of the x value
					var newX = curX+d3.event.dx;
					var newY = curY+d3.event.dy;

					// Restrict Movement if no need to move map
					if (selectRectHeight == overviewRegionSize) {
						newY = overviewY;
					}
					if (selectRectWidth == overviewRegionSize) {
						newX = overviewX;
					}

					// block from going out of bounds on left
					if (newX < overviewX) {
						newX = overviewX;
					}
					//top
					if (newY < overviewY) {
						newY = overviewY;
					}
					// right
					if (newX + selectRectWidth > overviewX+overviewRegionSize) {
						newX = overviewX+overviewRegionSize-selectRectWidth;
					}

					// bottom
					if (newY + selectRectHeight > overviewY+overviewRegionSize) {
						newY = overviewY+overviewRegionSize-selectRectHeight;
					}
					rect.attr("x", newX);
					//This changes for vertical positioning
					rect.attr("y", newY); //self.state.yoffset+yTranslation); 

					// adjust x back to have 0,0 as base instead of overviewX, overviewY
					newX = newX - overviewX;
					newY = newY - overviewY;

					// invert newX and newY into posiions in the model and phenotype lists.
					var j = self._invertOverviewDragPosition(self.state.smallXScale,newX);
					var newModelPos = j + self.state.modelDisplayCount;

					var jj = self._invertOverviewDragPosition(self.state.smallYScale,newY);
					var newPhenotypePos = jj + self.state.phenotypeDisplayCount;
					self._updateModel(newModelPos, newPhenotypePos);
		}));
		//set this back to 0 so it doesn't affect other rendering
	},

	/* we only have 3 color,s but that will do for now */
	_getColorForModelValue: function(self,species,score) {
		//This is for the new "Overview" target option
		var selectedScale = self.state.colorScale[species];
		return selectedScale(score);
	},

	_createModelScoresLegend: function() {
		var faqOffset = 20;
		var scoreTipY = self.state.yoffset;
		var faqY = scoreTipY - faqOffset;
		var tipTextLength = 92;
		var explYOffset = 15;
		var explXOffset = 10;
		var scoretip = self.state.svg.append("text")
			.attr("transform","translate(" + (self.state.axis_pos_list[2] ) + "," + scoreTipY + ")")
			.attr("x", 0)
			.attr("y", 0)
			.attr("class", "tip")
			.text("< Model Scores");

		var tip	= self.state.svg
			.append("svg:image")
			.attr("xlink:href", this.state.scriptpath + "../image/greeninfo30.png")
			.attr("transform","translate(" + (self.state.axis_pos_list[2] + tipTextLength) + "," + faqY + ")")
			.attr("id","modelscores")
			.attr("x", 0)
			.attr("y", 0)
			.attr("width", 15)
			.attr("height", 15)
			.on("click", function(d) {
				var name = "modelscores";
				self._showDialog(name);
			});

		var expl = self.state.svg.append("text")
			.attr("x",self.state.axis_pos_list[2] + explXOffset)
			.attr("y",scoreTipY + explYOffset)
			.attr("class","tip")
			.text("best matches left to right.");
	},

	_initializeOverviewRegion: function(overviewBoxDim,overviewX,overviewY) {
		//rectangular border for overview
		var globalview = self.state.svg.append("rect")
			.attr("x", overviewX)
			.attr("y", overviewY)
			.attr("id", "globalview")
			.attr("height", overviewBoxDim)
			.attr("width", overviewBoxDim);

		var overviewInstructionHeightOffset = 50;
		var lineHeight = 12;

		var y = self.state.yModelRegion + overviewBoxDim + overviewInstructionHeightOffset;
		var rect_instructions = self.state.svg.append("text")
			.attr("x", self.state.axis_pos_list[2] + 10)
			//This changes for vertical positioning
			.attr("y", y)
			.attr("class", "instruct")
			.text("Use the phenotype map above to");

		rect_instructions = self.state.svg.append("text")
			.attr("x", self.state.axis_pos_list[2] + lineHeight)
			//This changes for vertical positioning
			.attr("y", y + 10) 
			.attr("class", "instruct")
			.text("navigate the model view on the left");
	},

	_createSmallScales: function(overviewRegionSize) {
		var sortDataList = [];
		var self=this;
		for (var i in self.state.phenotypeSortData) {
			sortDataList.push(self.state.phenotypeSortData[i][0].id_a);  //rowid
		}
		var mods = self.state.modelList;

		this.state.smallYScale = d3.scale.ordinal()
			.domain(sortDataList.map(function (d) {return d; }))    
			.rangePoints([0,overviewRegionSize]);

		var modids = mods.map(function (d) {return d.model_id; });
		this.state.smallXScale = d3.scale.ordinal()
			//.domain(mods.map(function (d) {return d.model_id; }))
			.domain(modids)
			.rangePoints([0,overviewRegionSize]);
	},

	_invertOverviewDragPosition: function(scale,value) {
		var leftEdges = scale.range();
		var size = scale.rangeBand();
		var j;
		for (j = 0; value > (leftEdges[j]+size); j++) {} // iterate until leftEdges[j]+size is past value
		return j;
	},

	_getComparisonType : function(organism){
		var label = "";

		for (var i in this.state.comparisonTypes) {
			if (organism === this.state.comparisonTypes[i].organism){
				label = this.state.comparisonTypes[i].comparison;
			}
		}
		if (label === ""){
			label = this.state.defaultComparisonType.comparison;
		}
		return label;
	}, 

	_setComparisonType : function(){
		var comp = this.state.defaultComparisonType;
		for (var i in this.state.comparisonTypes) {
			if (this.state.targetSpeciesName === this.state.comparisonTypes[i].organism) {
				comp = this.state.comparisonTypes[i];
			}
		}
		this.state.comparisonType = comp;
	},

	_setSelectedCalculation: function(calc) {
		var self = this;

		var tempdata = self.state.similarityCalculation.filter(function(d) {
			return d.calc == calc;
		});
		self.state.selectedCalculation = tempdata[0].calc;
	},

	_setSelectedSort: function(type) {
		//console.log("calling selected sort on ..."+type);
		var self = this;
		self.state.selectedSort = type;
	},

	_processSelected: function(processType){
		this._filterSelected(processType);
		this._filterData(this.state.modelData);
		this.state.unmatchedPhenotypes = this._getUnmatchedPhenotypes();
		this.element.empty();
		this.reDraw();
	},

	//given the full dataset, return a filtered dataset containing the
	//subset of data bounded by the phenotype display count and the model display count
	_filterData: function(fulldataset) {
		var phenotypeArray = this._uniquifyPhenotypes(fulldataset);
		//copy the phenotypeArray to phenotypeData array - now instead of ALL phenotypes, it will be limited to unique phenotypes for this disease
		//do not alter this array: this.state.phenotypeData
		this.state.phenotypeData = phenotypeArray;

		//we need to adjust the display counts and indexing if there are fewer phenotypes than the default phenotypeDisplayCount
		if (this.state.phenotypeData.length < this.state.phenotypeDisplayCount) {
			this.state.currPhenotypeIdx = this.state.phenotypeData.length-1;
			this.state.phenotypeDisplayCount = this.state.phenotypeData.length;
		}
	},

	_filterSelected: function(filterType){
		var self = this;
		if (filterType == "sortphenotypes"){
			//Sort the phenotypes based on what value is currently held in self.state.selectedSort
			self.state.phenotypeSortData = [];
			this._sortingPhenotypes();
		}else if (filterType == "calculation"){
			//If not here, changing the calculations will remove everything from phenogrid.  Find a way to move or remove some point
			if (this.state.targetSpeciesName === "Overview") {
				this._finishOverviewLoad();
			}
			else {
				this._finishLoad();
			}
		}

		//Step 2: Filter for the next n phenotypes based on phenotypeDisplayCount and update the y-axis
		this.state.filteredModelData = [];
		this.state.yAxis = [];

		//Force Reset to Origin when changing Species, Sort or Display
		var startIdx = 0;
		var displayLimiter = this.state.phenotypeDisplayCount;

		//This code down here needs fixing if navigation methods are changed in the future
		//var startIdx = this.state.currPhenotypeIdx - (this.state.phenotypeDisplayCount -1);
		//var displayLimiter = self.state.currPhenotypeIdx;
		//if (startIdx > 0){
			//Hack.  StartIDX at any point after init is 1 value too high and will show values 1 off.  Can crash as well
			//startIdx--;
		//} else{
			//Only on init or on the top, currPhenotypeIdx can be 1 short, so it wont display values on the last row
			//displayLimiter++;
		//}

		//extract the new array of filtered Phentoypes
		//also update the axis
		//also update the modeldata
		var axis_idx = 0;
		var tempFilteredModelData = [];
		//get phenotype[startIdx] up to phenotype[currPhenotypeIdx] from the array of sorted phenotypes
		for (var i = startIdx; i < displayLimiter; i++) {
			//update the YAxis
			//the height of each row
			var size = 10;
			//the spacing you want between rows
			var gap = 3;
			//push the rowid and ypos onto the yaxis array
			//so now the yaxis will be in the order of the ranked phenotypes
			var stuff = {"id": self.state.phenotypeSortData[i][0].id_a, "ypos" : ((axis_idx * (size+gap)) + self.state.yoffset)};
			self.state.yAxis.push(stuff); 
			axis_idx++;
			//update the ModelData			
			//find the rowid in the original ModelData (list of models and their matching phenotypes) and write it to tempdata if it matches this phenotypeSortData rowid.
			//In this case, the rowid is just the id_a value in the model data
			for (var midx in this.state.modelData) {
				var mod = this.state.modelData[midx];
				if (mod.id_a == self.state.phenotypeSortData[i][0].id_a) {
					tempFilteredModelData.push(mod);
				}
			}		
		}

		for (var idx in self.state.filteredModelList) {
			for (var tdx in tempFilteredModelData) {
				if (tempFilteredModelData[tdx].model_id == self._getConceptId(self.state.filteredModelList[idx].model_id)) {
					self.state.filteredModelData.push(tempFilteredModelData[tdx]);
				}
			}
		}
	},

	_uniquifyPhenotypes: function(fulldataset) {
		var phenotypeArray = [];
		//Step 1:  Filter data so only unique phenotypes are represented (if a source phenotype matches two
		// different targets, only keep one of them. 
		//Input: array of all data returned by query
		//Output: array of the unique phentypes for this disease
		//phenotypeArray: we should end up with an array with unique matched phenotypes, each with the highest value
		// seen for that phenotype 
		for (var idx in fulldataset) {
			var match =  null;
			for (var pidx in phenotypeArray) {
				if (phenotypeArray[pidx].label_a == fulldataset[idx].label_a) {
					match = phenotypeArray[pidx];
					break;
				}
			}
			//	var result = $.grep(phenotypeArray, function(e){ return e.label_a == fulldataset[idx].label_a; });
			//	if (result.length == 0) {
			if (match === null) {
				phenotypeArray.push(fulldataset[idx]);
			}
			else {
				if (fulldataset[idx].value > match.value) {
					match.value = fulldataset[idx].value;
				}
			}
		}
		return phenotypeArray;
	},

	_sortPhenotypesModel: function(a,b) {
		var diff = b.count-a.count;
		if (diff === 0) {
			diff = a[0].id_a.localeCompare(b[0].id_a);
		}
		return diff;
	},

	_sortPhenotypesRank: function(a,b) {
		return b.sum-a.sum;
	},

	_sortPhenotypesAlphabetic: function(a,b) {
		var labelA = a.label.toLowerCase(), 
		labelB = b.label.toLowerCase();
		if (labelA < labelB) {return -1;}
		if (labelA > labelB) {return 1;}
		return 0;
	},

	_sortingPhenotypes: function() {
		var self = this;
		var sortType = self.state.selectedSort;
		var modelDataForSorting = [];
		var modData = self.state.modelData;
		var sortFunc, sortSet;
		if (sortType == 'Frequency') {
			sortFunc = self._sortPhenotypesModel;
			sortSet = "count";
		} else if (sortType == 'Frequency and Rarity') {
			sortFunc = self._sortPhenotypesRank;
			sortSet = "sum";
		} else if (sortType == 'Alphabetic') {
			sortFunc = self._sortPhenotypesAlphabetic;
			sortSet = "label";
		}

		//1. Get all unique phenotypes in an array
		//console.log("at start of sorting models..."+self.state.modelData.length);
		for (var idx in self.state.phenotypeData) {
			var tempdata = [];
			for (var midx in modData) {
				if (modData[midx].id_a == self.state.phenotypeData[idx].id_a) {
					tempdata.push(modData[midx]);
				}
			}
			modelDataForSorting.push(tempdata);
		}
		//console.log("modelDataForSorting..."+modelDataForSorting.length);
		//console.log("filtered model data..."+this.state.filteredModelData.length);

		//2. Sort the array by source phenotype name 
		modelDataForSorting.sort(function(a,b) { 
			return a.id_a-b.id_a;
		});

		self.state.phenotypeData.sort(function(a,b) {
			return a.id_a-b.id_a;
		});

		//3. Get the sum of all of this phenotype's LCS scores and add to array
		for (var k in modelDataForSorting) {
			var num = 0;
			var d = modelDataForSorting[k];
			var sortVal;
			if (d[0].id_a === self.state.phenotypeData[k].id_a){
				if (sortType == 'Alphabetic'){
					sortVal = d[0].label_a;
				}else{
					for (var i in d){
						if (sortType == 'Frequency'){num+= 1;}
						else {num+= d[i].subsumer_IC;}
					}
					sortVal = num;
				}
				d[sortSet] = sortVal;
				self.state.phenotypeSortData.push(d);
			}
		}

		if (typeof(sortFunc) !== 'undefined') {
			self.state.phenotypeSortData.sort(sortFunc);
		}
	},

	//given a list of phenotypes, find the top n models
	//I may need to rename this method "getModelData".  It should extract the models and reformat the data 
	_loadData: function() {
		if (this.state.targetSpeciesName === "Overview") {
			this._loadOverviewData();
		} else {
			this._loadSpeciesData(this.state.targetSpeciesName);
			this._finishLoad();
		}
	},

	_loadSpeciesData: function(speciesName,limit) {
		var phenotypeList = this.state.phenotypeData;
		var url = this.state.serverURL+"/simsearch/phenotype?input_items="+phenotypeList.join(",")+"&target_species="+this._getTargetSpeciesTaxonByName(this,speciesName);
		if (typeof(limit) !== 'undefined') {
			url = url +"&limit="+limit;
		}

		var res = this._ajaxLoadData(speciesName,url);
		if (res !== null) {
			if (typeof(limit) !== 'undefined' && typeof(res.b) !== 'undefined' && res.b !== null && res.b.length < limit) {
				res = this._padSpeciesData(res,speciesName,limit);
			}
		}
		this.state.data[speciesName]= res;
	},

	// make sure there are limit items in res --
	// If we don't have enough, add some dummy items in. 
	// This will space things out appropriately, having dummy models take 
	// up some of the x axis space. Later, we will make sure not to show the 
	// labels for these dummies.
	_padSpeciesData: function(res,species,limit) {
		var toadd = limit-res.b.length;
		for (var i = 0; i < toadd; i++) {
			var dummyId = "dummy"+species+i;
			var newItem = { id: dummyId,
				label: this.state.dummyModelName,
				score: {score: 0, rank: Number.MAX_VALUE},
			};
			res.b.push(newItem);
		}
		return res;
	},

	_loadOverviewData: function() {
		var limit = this.state.multiOrganismCt;
		for (var i in this.state.targetSpeciesList) {
			var species = this.state.targetSpeciesList[i].name;
			this._loadSpeciesData(species,limit);
			if (species === this.state.refSpecies && typeof(species) !== 'undefined') { // if it's the one we're reffering to
				if (typeof(this.state.data[species].metadata) !== 'undefined'){
					this.state.maxICScore = this.state.data[species].metadata.maxMaxIC;
				}
			}
			else {
				var data = this.state.data[species];
				if(typeof(data) !== 'undefined' && data.length < limit) {
					limit = (limit - data.length);
				}
			}
		}
		//Now we have top 10 model matches for Human data in humandata, 
		//Top n model matches for Mouse data in mousedata
		//Top n model matches for zebrashish data in zfishdata
		//Top n model matches for flies in flydata
		//Concat all species data and process matches
		this._finishOverviewLoad();
	},

	_finishOverviewLoad : function () {
		var speciesList = [];
		var modList = [];
		var orgCtr = 0;

		for (var i in this.state.targetSpeciesList) {
			var species = this.state.targetSpeciesList[i].name;
			var specData = this.state.data[species];
			if (specData !== null && typeof(specData.b) !== 'undefined' && specData.b.length > 0) {
				var data = [];
				for (var idx in specData.b) {
					var item = specData.b[idx];
					var newItem = {model_id: this._getConceptId(item.id),
						model_label: item.label,
						model_score: item.score.score,
						species: species,
						model_rank: item.score.rank};
					data.push(newItem);
					this._loadDataForModel(item);
				}
				this.state.multiOrganismCt=specData.b.length;
				speciesList.push(species);
				orgCtr++;
				data.sort(function(a,b) { return a.model_rank - b.model_rank;});
				modList = modList.concat(data);
			}
		}

		for (var dmx in this.state.modelData) {
			this.state.filteredModelData.push(this.state.modelData[dmx]);
		}

		this.state.modelList = modList;
		this.state.speciesList = speciesList;
		if (this.state.modelList.length < this.state.modelDisplayCount) {
			this.state.currModelIdx = this.state.modelList.length-1;
			this.state.modelDisplayCount = this.state.modelList.length;
		}

		//initialize the filtered model list
		for (var edx=0; edx<this.state.modelDisplayCount; edx++) {
			this.state.filteredModelList.push(this.state.modelList[edx]);
		}
	},

	//generic ajax call for all queries
	_ajaxLoadData : function (target, url) {
		var self = this;
		var res;
		jQuery.ajax({
			url: url, 
			async : false,
			dataType : 'json',
			success : function(data) {
				res = data;
			},
			error: function (xhr, errorType, exception) { //Triggered if an error communicating with server  
				self._displayResult(xhr, errorType, exception);
			} 
		});
		return res;
	},

	_displayResult : function(xhr, errorType, exception){
		var msg;

		switch(xhr.status){
			case 404:
			case 500:
			case 501:
			case 502:
			case 503:
			case 504:
			case 505:
			default:
				msg = "We're having some problems.  Please try again soon.";
				break;
			case 0: 
				msg = "Please check your network connection.";
				break;
		}

		/**if (xhr.status === 0) {
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
		} */

		this._createEmptyVisualization(msg);
	},

	//Finish the data load after the ajax request
	//Create the modelList array: model_id, model_label, model_score, model_rank
	//Call _loadDataForModel to put the matches in an array
	_finishLoad: function() {
		var species = this.state.targetSpeciesName;
		var retData  = this.state.data[species];
		//   var retData = data;
		//extract the maxIC score
		if (typeof (retData.metadata) !== 'undefined') {
			this.state.maxICScore = retData.metadata.maxMaxIC;
		}
		var self = this;

		this.state.modelList = [];

		if (typeof (retData.b)  !== 'undefined') {
			for (var idx in retData.b) {
				this.state.modelList.push(
					{model_id: self._getConceptId(retData.b[idx].id), 
					model_label: retData.b[idx].label, 
					model_score: retData.b[idx].score.score, 
					species: species,
					model_rank: retData.b[idx].score.rank}
				);
				this._loadDataForModel(retData.b[idx]);
			}
			//sort the model list by rank
			this.state.modelList.sort(function(a,b) { 
				return a.model_rank - b.model_rank; 
			});

			for (var dmx in this.state.modelData) {
				this.state.filteredModelData.push(this.state.modelData[dmx]);
			}

			//we need to adjust the display counts and indexing if there are fewer models
			if (this.state.modelList.length < this.state.modelDisplayCount) {
				this.state.currModelIdx = this.state.modelList.length-1;
				this.state.modelDisplayCount = this.state.modelList.length;
			}

			this.state.filteredModelList=[];
			//initialize the filtered model list
			for (var edx = 0; edx < this.state.modelDisplayCount; edx++) {
				this.state.filteredModelList.push(this.state.modelList[edx]);
			}
		}
	},

	//for a given model, extract the sim search data including IC scores and the triple:
	//the a column, b column, and lowest common subsumer
	//for the triple's IC score, use the LCS score
	_loadDataForModel: function(newModelData) {
		//data is an array of all model matches	    
		var data = newModelData.matches;
		if (typeof(data) !== 'undefined' &&  data.length > 0) {
			var species = newModelData.taxon;

			for (var idx in data) {
				var curr_row = data[idx],
				lcs = this._normalizeIC(curr_row),
				new_row = {"id": this._getConceptId(curr_row.a.id) + "_" + this._getConceptId(curr_row.b.id) + "_" + this._getConceptId(newModelData.id), 
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
					"taxon" : species.id
				}; 
				this.state.modelData.push(new_row); 
			}
		}
	},
	
	//we may use this when normalization and ranking have been determined
	_rankLCSScores : function () {
	},

	//Different methods of  based on the selectedCalculationMethod
	_normalizeIC: function(datarow){
		var aIC = datarow.a.IC,
		bIC = datarow.b.IC,
		lIC = datarow.lcs.IC,
		nic;

		var calcMethod = this.state.selectedCalculation;

		switch(calcMethod){
			case 2: nic = lIC;
				break;
			case 1: nic = ((lIC/aIC) * 100);
				break;
			case 0: nic = Math.sqrt((Math.pow(aIC-lIC,2)) + (Math.pow(bIC-lIC,2)));
				nic = (1 - (nic/+this.state.maxICScore)) * 100;
				break;
			case 3: nic = ((lIC/bIC) * 100);
				break;
			default: nic = lIC;
		}
		return nic;
	},

	//create a y-axis from the model data
	//for each item in the data model, push the rowid
	//and calculate the y position
	_createYAxis: function() {
		var self = this;
		//the height of each row
		var size = 10;
		//the spacing you want between rows
		var gap = 3;

		//use the max phenotype size to limit the number of phenotypes shown 
		var yLength = self.state.phenotypeSortData.length > this.state.phenotypeDisplayCount ?
			this.state.phenotypeDisplayCount : self.state.phenotypeSortData.length;
		for (var idx = 0; idx < yLength; idx++) {
			var stuff = {"id": self.state.phenotypeSortData[idx][0].id_a,
				"ypos" : ((idx * (size+gap)) + this.state.yoffset + 10)};
			this.state.yAxis.push(stuff);
			if (((idx * (size+gap)) + this.state.yoffset) > this.state.yAxisMax) {
				this.state.yAxisMax = (idx * (size+gap)) + this.state.yoffset;
			}
		}
	},

	//given a rowid, return the y-axis position
	_getYPosition: function(newRowId) {
		var retValue = this.state.yoffset;

		for (var i in this.state.yAxis) {
			if (this.state.yAxis[i].id == newRowId) {
				retValue = this.state.yAxis[i].ypos;
			}
		}
		return retValue;
	},

	_createColorScale: function() {
		var maxScore = 0,
		method = this.state.selectedCalculation;

		switch(method){
			case 2: maxScore = this.state.maxICScore;
			break;
			case 1: maxScore = 100;
			break;
			case 0: maxScore = 100;
			break;
			case 3: maxScore = 100;
			break;
			default: maxScore = this.state.maxICScore;
			break;
		}	
		/** 3 september 2014  still a bit clunky in handling many organisms, 
		but much less hardbound. */
		this.state.colorScale={};

		for (var i in this.state.targetSpeciesList) {
			if (typeof(this.state.colorRanges[i]) !== 'undefined') {
				var species = this.state.targetSpeciesList[i].name;
				this.state.colorScale[species] = this._getColorScale(i, maxScore);
			}
		}
	},

	_getColorScale: function(speciesIndex,maxScore) {
		var cs =  d3.scale.linear();
		cs.domain([3, maxScore]);
		cs.domain(this.state.colorDomains.map(cs.invert));
		cs.range(this.state.colorRanges[speciesIndex]);
		return cs;
	},

	_initCanvas : function() {
		this._createSvgContainer();
		var svgContainer = this.state.svgContainer;
		svgContainer.append("<svg id='svg_area'></svg>");
		this.state.svg = d3.select("#svg_area");
		this._addGridTitle();
	},

	_createSvgContainer : function() {
		var svgContainer = $('<div id="svg_container"></div>');
		this.state.svgContainer =  svgContainer;
		this.element.append(svgContainer);
	},

	_addGridTitle: function() {
		var species = '';
		var faqWidth = 15;
		var faqHeight = 15;

		// set up defaults as if overview
		var xoffset = this.state.overviewGridTitleXOffset;
		var foffset = this.state.overviewGridTitleFaqOffset;
		var titleText = "Cross-Species Overview";

		if (this.state.targetSpeciesName !== "Overview") {
			species= this.state.targetSpeciesName;
			xoffset = this.state.nonOverviewGridTitleXOffset;
			foffset = this.state.nonOverviewGridTitleFaqOffset;
			var comp = this._getComparisonType(species);
			titleText = "Phenotype Comparison (grouped by " + species + " " +   comp + ")";
		}

		var mtitle = this.state.svg.append("svg:text")
			.attr("class","gridtitle")
			.attr("id","toptitle2")
			.attr("x",xoffset)
			.attr("y",this.state.gridTitleYOffset)
			.text(titleText);

		// foffset is the offset to place the icon at the right of the grid title.
		//ideally should do this by dynamically grabbing the width of mtitle,
		// but that doesn't seem to work.
		var faq	= this.state.svg
			.append("svg:image")
			.attr("xlink:href", this.state.scriptpath + "../image/greeninfo30.png")
			.attr("x",xoffset+foffset)
			.attr("id","faqinfo")
			.attr("width", faqWidth)
			.attr("height",faqHeight)
			.on("click", function(d) {
				self._showDialog("faq");
			});

		var title = document.getElementsByTagName("title")[0].innerHTML;
		var dtitle = title.replace("Monarch Disease:", "");

		// place it at yoffset - the top of the rectangles with the phenotypes
		var disease = dtitle.replace(/ *\([^)]*\) */g,"");

		//Use until SVG2. Word Wraps the Disease Title
		this.state.svg.append("foreignObject")
			.attr("width", 200)
			.attr("height", 50)
			.attr("id","diseasetitle")
			.attr("y", this.state.yoffset)
			.append("xhtml:div")
			.html(disease);
	},

	_configureFaqs: function() {
		var sorts = $("#sorts")
			.on("click", function(d,i){
				self._showDialog( "sorts");
			});

		//var calcs = d3.selectAll("#calcs")
		var calcs = $("#calcs")
			.on("click", function(d){
				self._showDialog( "calcs");
			});
	},

	_resetSelections : function(type) {
		var self = this;
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

		if (type === "organism"){
			self.state.phenotypeData = self.state.origPhenotypeData.slice();
			self.state.phenotypeSortData = [];
			self._reset("organism");
			self._init();
		}
		else if (type === "calculation"){
			self._reset("calculation");
		}
		else if (type === "sortphenotypes"){
			self._reset("sortphenotypes");
		}
	},

	_addLogoImage :	 function() { 
		var start = 0;
		if(this.state.filteredModelData.length < 30){
			//Magic Nums
			start = 680;
		} else { 
			start = 850;
		}
		//var imgs = this.state.svg.selectAll("image").data([0]);
		//imgs.enter()
		this.state.svg.append("svg:image")
			.attr("xlink:href", this.state.scriptpath + "../image/logo.png")
			.attr("x", start)
			.attr("y",0)
			.attr("id", "logo")
			.attr("width", "60")
			.attr("height", "90");
	},

	_resetLinks: function() {
		//don't put these styles in css file - these stuyles change depending on state
		this.state.svg.selectAll("#detail_content").remove();
		var link_lines = d3.selectAll(".data_text");
			link_lines.style("font-weight", "normal");
			link_lines.style("text-decoration", "none");
			link_lines.style("fill", "black");
			link_lines.style("text-anchor", "end");
		var link_labels = d3.selectAll(".model_label");
			link_labels.style("font-weight", "normal");
			link_labels.style("text-decoration", "none");
			link_labels.style("fill", "black");
	},

	_highlightMatchingModels : function(curr_data){
		var self = this;
		var alabels = this.state.svg.selectAll("text");
		for (var i in curr_data){
			var label = curr_data[i].model_label;
			for (var j in alabels[0]){
				var shortTxt = self._getShortLabel(label,self.state.labelCharDisplayCount);
				if(alabels[0][j].innerHTML == shortTxt){
					alabels[0][j].style.fill = "blue";
					alabels[0][j].innerHTML = label;
				}
			}
		}
	},

	_deselectMatchingModels : function(curr_data){
		var alabels = this.state.svg.selectAll("text");
		for (var i in curr_data){
			var label = curr_data[i].model_label;
			for (var j in alabels[0]){
				var shortTxt = this._getShortLabel(label,self.state.labelCharDisplayCount);
				if(alabels[0][j].innerHTML == label){
					alabels[0][j].style.fill = "black";
					alabels[0][j].innerHTML = shortTxt;
				}
			}
		}
	},

	_selectModel: function(modelData, obj) {
		var self = this;

		//create the related model rectangles
		var highlight_rect = self.state.svg.append("svg:rect")
			.attr("transform","translate(" + (self.state.textWidth + 32) + "," + self.state.yoffsetOver+ ")")
			.attr("x", function(d) { return (self.state.xScale(modelData.model_id)-1);})
			.attr("y", self.state.yoffset + 2)
			.attr("class", "model_accent")
			.attr("width", 14)
			.attr("height", (self.state.phenotypeDisplayCount * self.state.heightOfSingleModel));

		// I don't know why I'm still seeing the un-processed concept id
		// var classlabel = "text#" +this._getConceptId(modelData.model_id);

		//Show that model label is selected. Change styles to bold, blue and full-length label
		var model_label = self.state.svg.selectAll("text#" + this._getConceptId(modelData.model_id))
			.style("font-weight", "bold")
			.style("fill", "blue")
			.html(modelData.model_label);

		var concept = self._getConceptId(modelData.model_id),
		type = this.state.defaultApiEntity;

		for (var i in this.state.apiEntityMap) {
			if (concept.indexOf(this.state.apiEntityMap[i].prefix) === 0) {
				type = this.state.apiEntityMap[i].apifragment;
			}
		}

		var width = (type === this.state.defaultApiEntity)?80:200;
		var height = (type === this.state.defaultApiEntity)?50:60;

		var retData;
		//initialize the model data based on the scores
		retData = "<strong>" + self._toProperCase(type).substring(0, type.length) + ": </strong> " + modelData.model_label + "<br/><strong>Rank:</strong> " + (parseInt(modelData.model_rank) );

		//obj is try creating an ojbect with an attributes array including "attributes", but I may need to define
		//getAttrbitues
		//just create a temporary object to pass to the next method...
		obj = {
			attributes: [],
			getAttribute: function(keystring) {
				var ret = self.state.xScale(modelData.model_id) + 15;
				if (keystring == "y") {
					ret = Number(self.state.yoffset - 100);
				}
				return ret;
			},
		};
		obj.attributes.transform = {value: highlight_rect.attr("transform")};
		this._updateDetailSection(retData, this._getXYPos(obj), width, height);
		self._highlightMatchingPhenotypes(modelData);
	},

	//I need to check to see if the modelData is an object.  If so, get the model_id
	_clearModelData: function(modelData,obj) {
		this.state.svg.selectAll("#detail_content").remove();
		this.state.svg.selectAll(".model_accent").remove();
		var model_text = "",
		mod_id = "";
		if (modelData !== null && typeof modelData != 'object') {
			mod_id = this._getConceptId(modelData);   
		} else if (typeof (modelData.model_id) !== 'undefined') {
			mod_id = this._getConceptId(modelData.model_id);
		}

		//Show that model label is no longer selected. Change styles to normal weight, black and short label
		if (mod_id !== "") {
			model_text = this.state.svg.selectAll("text#" + mod_id);
			model_text.style("font-weight","normal");
			model_text.style("text-decoration", "none");
			model_text.style("fill", "black");
			model_text.html(this._getShortLabel(modelData.model_label,self.state.labelCharDisplayCount));
			this._deselectMatchingPhenotypes(modelData);
		}
	},

	_selectData: function(curr_data, obj) {
		//create a highlight row
		var self = this;
		//create the related row rectangle
		var highlight_rect = self.state.svg.append("svg:rect")
			.attr("transform","translate(" + (self.state.axis_pos_list[1]) +"," + (self.state.yoffsetOver + 4)  + ")")
			.attr("x", 12)
			.attr("y", function(d) {return self._getYPosition(curr_data[0].id_a) ;}) //rowid
			.attr("class", "row_accent")
			.attr("width", this.state.modelWidth - 4)
			.attr("height", 12);

		this._resetLinks();
		var alabels = this.state.svg.selectAll("text.a_text." + curr_data[0].id);//this._getConceptId(curr_data[0].id));
		var txt = curr_data[0].label_a;
		if (txt === undefined) {
			txt = curr_data[0].id_a;
		}
		alabels.text(txt)
			.style("font-weight", "bold")
			.style("fill", "blue")
			.on("click",function(d){
				self._clickPhenotype(curr_data[0].id_a, self.document[0].location.origin);
			});

		this._highlightMatchingModels(curr_data);
	},

	_deselectData: function (curr_data) {
		this.state.svg.selectAll(".row_accent").remove();
		this._resetLinks();
		var row;
		if (curr_data[0] === undefined) {row = curr_data;}
		else {row = curr_data[0];}

		//var alabels = this.state.svg.selectAll("text.a_text." + row.id); //this._getConceptId(row.id));
		var alabels = this.state.svg.selectAll("text.a_text." + this._getConceptId(row.id));
		alabels.text(this._getShortLabel(row.label_a));
		var data_text = this.state.svg.selectAll("text.a_text");
		data_text.style("text-decoration", "none");
		data_text.style("fill", "black");    

		this._deselectMatchingModels(curr_data);
	},

	_highlightMatchingPhenotypes: function(curr_data){
		var self = this;
		var models = self.state.modelData;
		var curModel = this._getConceptId(curr_data.model_id);
		for (var i in models){
			//models[i] is the matching model that contains all phenotypes
			if (models[i].model_id == curModel){
				var alabels = this.state.svg.selectAll("text.a_text");
				var mtxt = models[i].label_a;
				if (mtxt === undefined) {
					mtxt = models[i].id_a;
				}
				var shortTxt = self._getShortLabel(mtxt);
				for (var j in alabels[0]){
					if (alabels[0][j].innerHTML == shortTxt){
						alabels[0][j].style.fill = "blue";
						break;
					}
				}
			}
		}
	},

	_deselectMatchingPhenotypes : function(curr_data){
		var self = this;
		self.state.svg.selectAll("text.a_text")
			.style("fill","black");
	},

	_clickPhenotype: function(data, url_origin) {
		var url = url_origin + "/phenotype/" + data;
		var win = window.open(url, '_blank');
	},

	_clickModel: function(data, url_origin) {
		var concept = self._getConceptId(data.model_id);
		// hardwire check
		var apientity = this.state.defaultApiEntity;
		for (var i in this.state.apiEntityMap) {
			if (concept.indexOf(this.state.apiEntityMap[i].prefix) === 0) {
				apientity = this.state.apiEntityMap[i].apifragment;
			}
		}
		var url = url_origin + "/" + apientity + "/" + concept;
		var win = window.open(url, '_blank');
	},

	//return a label for use in the list.  This label is shortened
	//to fit within the space in the column
	_getShortLabel: function(label, newlength) {
		if (label !== undefined){
			var retLabel = label;
			if (!newlength) {
				newlength = this.state.textLength;
			}
			if (label.length > newlength) {
				retLabel = label.substring(0,newlength-3) + "...";
			}	
			return retLabel;
		}else {
			return "Unknown";
		}
	},
	
	//return a useful label to use for visualizing the rectangles
	_getCleanLabel: function (uri, label) {
		if (label && label !== "" && label != "null") {
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
		/*if (!uri) {
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
		//a class called "Model 1" will be two classes: Model and 1.  Convert this to "Model_1" to avoid this problem. */
		var retString = uri;
		try {
			retString = retString.replace(" ", "_");
			retString = retString.replace(":", "_");
			return retString;
		} catch (exception) {}
	},

	_convertLabelHTML: function (self, t, label, data) {
		self = this;
		var width = 100,
		el = d3.select(t),
		p = d3.select(t.parentNode),
		x = +t.getAttribute("x"),
		y = +t.getAttribute("y");

		p.append("text")
			.attr('x', x + 15)
			.attr('y', y)
			.attr("width", width)
			//       .attr("id", data.model_id) //this._getConceptId(data.model_id))
			.attr("id", this._getConceptId(data.model_id))
			.attr("model_id", data.model_id)
			.attr("height", 60)
			.attr("transform", function(d) {
				return "rotate(-45)";
			})
			.on("click", function(d) {
				self._clickModel(data, self.document[0].location.origin);
			})
			.on("mouseover", function(d) {
				self._selectModel(data, this);
			})
			.on("mouseout", function(d) {
				self._clearModelData(data, d3.mouse(this));
				if(self.state.selectedRow){
					self._deselectData(self.state.selectedRow);
				}
			})
			.attr("class", this._getConceptId(data.model_id) + " model_label")
			//.attr("class", data.model_id + " model_label")
			.style("font-size", "12px")
			//don't show the label if it is a dummy.
			.text( function(d) {if (label == self.state.dummyModelName) return ""; else return label;});

		el.remove();
	},

	_updateDetailSection: function(htmltext, coords, width, height) {
		this.state.svg.selectAll("#detail_content").remove();

		var w = this.state.detailRectWidth-(this.state.detailRectStrokeWidth*2);
		var h = this.state.detailRectHeight-(this.state.detailRectStrokeWidth*2);
		if (width !== undefined) {
			w = width;
		}
		if (height !== undefined) {
			h = height;
		}
		var wdt = this.state.axis_pos_list[1] + ((this.state.axis_pos_list[2] - this.state.axis_pos_list[1])/2);
		var hgt = this.state.phenotypeDisplayCount*10 + this.state.yoffset;
		var yv, wv;

		if (coords.y > hgt) { yv = coords.y - this.state.detailRectHeight - 10;}
		else {yv = coords.y + 20;}

		if (coords.x > wdt) { wv = coords.x - w - 20;}
		else {wv = coords.x + 20;}

		this.state.svg.append("foreignObject")
			.attr("width", w)
			.attr("height", h)
			.attr("id", "detail_content")
			//add an offset.  Otherwise, the tooltip turns off the mouse event
			.attr("y", yv)
			.attr("x", wv) 
			.append("xhtml:body")
			.attr("id", "detail_text")
			.html(htmltext);
	},
	
	_showModelData: function(d, obj) {
		var retData;
		/* we aren't currently using these, but we might later.*/
		//var aSpecies = this._(d.id_a);
		//var subSpecies = this._getSpeciesLabel(d.subsumer_id);
		//var bSpecies = this._(d.id_b);

		var species = d.species;
		var taxon = d.taxon;
		var prefix;
		var type = this._getComparisonType(species);

		if (taxon !== undefined || taxon !== null || taxon !== '' || isNaN(taxon)) {
			if (taxon.indexOf("NCBITaxon:") != -1) {
				taxon = taxon.slice(10);
			}
		}

		for (var idx in this.state.similarityCalculation) {	
			if (this.state.similarityCalculation[idx].calc === this.state.selectedCalculation) {
				prefix = this.state.similarityCalculation[idx].label;
				break;
			}
		}

		var suffix = "";
		//If the selected calculation isn't percentage based (aka similarity) make it a percentage
		if (this.state.selectedCalculation != 2) {suffix = '%';}

		retData = "<strong>Query: </strong> " + d.label_a + " (IC: " + d.IC_a.toFixed(2) + ")" +  
			"<br/><strong>Match: </strong> " + d.label_b + " (IC: " + d.IC_b.toFixed(2) +")" +
			"<br/><strong>Common: </strong> " + d.subsumer_label + " (IC: " + d.subsumer_IC.toFixed(2) +")" +
			"<br/><strong>" + this._toProperCase(type).substring(0, type.length-1)  +": </strong> " + d.model_label +
			"<br/><strong>" + prefix + ":</strong> " + d.value.toFixed(2) + suffix +
			"<br/><strong>Species: </strong> " + d.species + " (" + taxon + ")";
		this._updateDetailSection(retData, this._getXYPos(obj));
	},

	_showThrobber: function() {
		this.state.svg.selectAll("#detail_content").remove();
		this.state.svg.append("svg:text")
			.attr("id", "detail_content")
			.attr("y", (26+this.state.detailRectStrokeWidth))
			.attr("x", (440+this.state.detailRectStrokeWidth))
			.style("font-size", "12px")
			.text("Searching for data");
		this.state.svg.append("svg:image")
			.attr("width", 16)
			.attr("height", 16)
			.attr("id", "detail_content")
			.attr("y", (16+this.state.detailRectStrokeWidth))
			.attr("x", (545+this.state.detailRectStrokeWidth))
			.attr("xlink:href","/widgets/phenogrid/image/throbber.gif");
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
		if (typeof obj.attributes.transform != 'undefined') {
			var transform_str = obj.attributes.transform.value;
			tform = this._extractTransform(transform_str);
		}
		return {x: Number(obj.getAttribute("x")) + tform.x, y: Number(obj.getAttribute("y")) + tform.y};
	},

	_getSpeciesLabel: function(idstring) {
		var label;
		for (var i in this.state.speciesLabels) {
			var labinfo = this.state.speciesLabels[i];
			if (idstring.indexOf(labinfo.abbrev) > -1) {
				label = labinfo.label;
				break;
			}
		}
		return label;
	},

	//NOTE: I need to find a way to either add the model class to the phenotypes when they load OR
	//select the rect objects related to the model and append the class to them.
	//something like this: $( "p" ).addClass( "myClass yourClass" );
	_createModelRects: function() {
		var self = this;
		var data = this.state.filteredModelData;

		var rectTranslation = "translate(" + ((this.state.textWidth + 30) + 4) + "," + (self.state.yoffsetOver + 15)+   ")";
		var model_rects = this.state.svg.selectAll(".models")
			.data( data, function(d) {
				return d.id;
			});
		model_rects.enter()
			.append("rect")
			.attr("transform",rectTranslation)
			.attr("class", function(d) { 
				var dConcept = self._getConceptId(d.id);
				var modelConcept = self._getConceptId(d.model_id);
				//append the model id to all related items
				if (d.value > 0) {
					var bla = self.state.svg.selectAll(".data_text." + dConcept);
					bla.classed(modelConcept, true);
				}
				return "models " + " " + modelConcept + " " + dConcept;
			})
			.attr("y", function(d, i) { 
				return self._getYPosition(d.id_a) + self.state.yoffsetOver;
			})
			.attr("x", function(d) { return self.state.xScale(d.model_id);})
			.attr("width", 10)
			.attr("height", 10)
			.attr("rx", "3")
			.attr("ry", "3")
			//I need to pass this into the function
			.on("mouseover", function(d) {
				this.parentNode.appendChild(this);
				//if this column and row are selected, clear the column/row and unset the column/row flag
				if (self.state.selectedColumn !== undefined && self.state.selectedRow !== undefined) {
					self._clearModelData(self.state.selectedColumn);
					self.state.selectedColumn = undefined;
					self._deselectData(self.state.selectedRow);
					self.state.selectedRow = undefined;	
					if (this != self.state.currSelectedRect){
						self._highlightIntersection(d, d3.mouse(this));
						//put the clicked rect on the top layer of the svg so other events work
						// ???this.parentNode.appendChild(this);
						self._enableRowColumnRects(this);
						//set the current selected rectangle
						self.state.currSelectedRect = this;  
					}
				} else {
					self._highlightIntersection(d, d3.mouse(this));
					self._enableRowColumnRects(this);
					self.state.currSelectedRect = this;  
				}
			self._showModelData(d, this);
			})
			.on("mouseout", function(d) {
				self._clearModelData(data, d3.mouse(this));
				if(self.state.selectedRow){
					self._deselectData(self.state.selectedRow);
				}
			})
			.style('opacity', '1.0')
			.attr("fill", function(d) { return self._getColorForModelValue(self,d.species,d.value);});

		if (self.state.targetSpeciesName == "Overview") {
			this._highlightSpecies();
		}
		model_rects.transition()
			.delay(20)
			.style('opacity', '1.0')
			.attr("y", function(d) {
				return self._getYPosition(d.id_a)-10; //rowid
			})
			.attr("x", function(d) { 
				return self.state.xScale(d.model_id);
			});
		model_rects.exit().transition()
			.style('opacity', '0.0')
			.remove();
	},

	_highlightSpecies : function () {
		//create the related model rectangles
		var self = this;
		var list = self.state.speciesList;
		var ct = self.state.multiOrganismCt,
		vwidthAndGap = self.state.heightOfSingleModel,
		hwidthAndGap = self.state.widthOfSingleModel,
		totCt = 0,
		parCt = 0;

		var highlight_rect = self.state.svg.selectAll(".species_accent")
			.data(list)
			.enter()
			.append("rect")
			.attr("transform","translate(" + (self.state.textWidth + 30) + "," +(self.state.yoffsetOver)+ ")")
			//.attr("x", function(d,i) { return (i * (hwidthAndGap * ct));})
			.attr("x", function(d,i) { totCt += self.state.multiOrganismCt; 
				if (i === 0) { return 0; }
				else {
					parCt = totCt - self.state.multiOrganismCt;  
					return hwidthAndGap * parCt;
				}
			})
			.attr("y", self.state.yoffset)
			.attr("class", "species_accent")
			.attr("width",  function(d,i) { return (hwidthAndGap * self.state.multiOrganismCt);})
			.attr("height", vwidthAndGap * self.state.phenotypeDisplayCount + 5)
			.attr("stroke", "black")
			.attr("stroke-width", 3)
			.attr("fill", "none");
	},

	_enableRowColumnRects :  function(curr_rect){
		var self = this;

		var model_rects = self.state.svg.selectAll("rect.models")
			.filter(function (d) { return d.rowid == curr_rect.__data__.rowid;});
		for (var i in model_rects[0]){
			model_rects[0][i].parentNode.appendChild(model_rects[0][i]);
		}
		var data_rects = self.state.svg.selectAll("rect.models")
			.filter(function (d) { return d.model_id == curr_rect.__data__.model_id;});
		for (var j in data_rects[0]){
			data_rects[0][j].parentNode.appendChild(data_rects[0][j]);
		}
	},

	_getFirstModelId:  function(phenotype){
		var firstModel=""; 
		for (var i in this.state.filteredModelData){
			if (this.state.filteredModelData[i].id_a === phenotype){
				firstModel = this.state.filteredModelData[i].id;
				break;
			}
		}
		return firstModel;
	},

	_highlightIntersection : function(curr_data, obj){
		var self=this;

		//Highlight Row
		var highlight_rect = self.state.svg.append("svg:rect")
			.attr("transform","translate(" + self.state.axis_pos_list[1] + ","+ (self.state.yoffsetOver + 4 ) + ")")
			.attr("x", 12)
			.attr("y", function(d) {return self._getYPosition(curr_data.id_a) ;}) //rowid
			.attr("class", "row_accent")
			.attr("width", this.state.modelWidth - 4)
			.attr("height", 12);

		this.state.selectedRow = curr_data;
		this.state.selectedColumn = curr_data;
		this._resetLinks();

		//To get the phenotype label from the selected rect data, we need to concat the phenotype ids to the model id 
		// that is in the 0th position in the grid. No labels exist with the curr_data.id except for the first column
		//For the overview, there will be a 0th position for each species so we need to get the right model_id

		var mid = this._getFirstModelId(curr_data.id_a);
		var phen_label = this.state.svg.selectAll("text.a_text." + this._getConceptId(mid));
		var txt = curr_data.label_a;
		if (txt === undefined) {
			txt = curr_data.id_a;
		}
		phen_label.text(txt)
			.style("font-weight", "bold")
			.style("fill", "blue");
			//.on("click",function(d){
			//self._clickPhenotype(curr_data.id_a, self.document.location.origin);
			// });

		//Highlight Column
		var model_label = self.state.svg.selectAll("text#" + this._getConceptId(curr_data.model_id));
		model_label.style("font-weight", "bold");
		model_label.style("fill", "blue");

		//create the related model rectangles
		var highlight_rect2 = self.state.svg.append("svg:rect")
			.attr("transform","translate(" + (self.state.textWidth + 34) + "," +self.state.yoffsetOver+ ")")
			.attr("x", function(d) { return (self.state.xScale(curr_data.model_id) - 1);})
			.attr("y", self.state.yoffset + 2 )
			.attr("class", "model_accent")
			.attr("width", 12)
			.attr("height", (self.state.phenotypeDisplayCount * self.state.heightOfSingleModel));
	},

	_updateAxes: function() {
		var self = this;
		var data = [];

		//This is for the new "Overview" target option 
		if (this.state.targetSpeciesName == "Overview"){
			data = this.state.modelData;
		} else {
			data = self.state.filteredModelData;
		}
		this.state.h = (data.length*2.5);

		self.state.yScale = d3.scale.ordinal()
			.domain(data.map(function (d) {return d.id_a; }))
			.range([0,data.length])
			.rangePoints([ self.state.yModelRegion,self.state.yModelRegion +this.state.h ]);

		//update accent boxes
		self.state.svg.selectAll("#rect.accent").attr("height", self.state.h);
	},

	//NOTE: FOR FILTERING IT MAY BE FASTER TO CONCATENATE THE PHENOTYPE and MODEL into an attribute

	//change the list of phenotypes and filter the models accordingly.  The 
	//movecount is an integer and can be either positive or negative
	_updateModel: function(modelIdx, phenotypeIdx) {
		var self = this;
		var tempdata;
		//This is for the new "Overview" target option 
		var modelData = this.state.modelData;
		var modelList = this.state.modelList;

		//check to see if the phenotypeIdx is greater than the number of items in the list
		if (phenotypeIdx > this.state.phenotypeData.length) {
			this.state.currPhenotypeIdx = this.state.phenotypeSortData.length;
		} else if (phenotypeIdx - (this.state.phenotypeDisplayCount -1) < 0) {
			//check to see if the min of the slider is less than the 0
			this.state.currPhenotypeIdx = (this.state.phenotypeDisplayCount -1);
		} else {
			this.state.currPhenotypeIdx = phenotypeIdx;
		}
		var startPhenotypeIdx = this.state.currPhenotypeIdx - this.state.phenotypeDisplayCount;

		this.state.yAxis = [];

		//fix model list
		//check to see if the max of the slider is greater than the number of items in the list
		if (modelIdx > modelList.length) {
			this.state.currModelIdx = modelList.length;
		} else if (modelIdx - (this.state.modelDisplayCount -1) < 0) {
			//check to see if the min of the slider is less than the 0
			this.state.currModelIdx = (this.state.modelDisplayCount -1);
		} else {
			this.state.currModelIdx = modelIdx;
		}
		var startModelIdx = this.state.currModelIdx - this.state.modelDisplayCount;

		this.state.filteredModelList = [];
		//if (this.state.targetSpeciesName !== "Overview") { this.state.filteredModelData = [];}
		this.state.filteredModelData = [];

		//extract the new array of filtered Phentoypes
		//also update the axis
		//also update the modeldata
		var axis_idx = 0;
		for (var idx=startModelIdx;idx<self.state.currModelIdx;idx++) {
			self.state.filteredModelList.push(modelList[idx]);
		}

		//extract the new array of filtered Phentoypes
		//also update the axis
		//also update the modeldata

		var tempFilteredModelData = [];
		axis_idx = 0;
		for (var dmx = startPhenotypeIdx; dmx < self.state.currPhenotypeIdx; dmx++) {
			//update the YAxis
			//the height of each row
			var size = 10;
			//the spacing you want between rows
			var gap = 3;
			var stuff = {"id": self.state.phenotypeSortData[dmx][0].id_a,"ypos" : ((axis_idx * (size+gap)) + self.state.yoffset)};
			self.state.yAxis.push(stuff); 
			axis_idx++;
			//update the ModelData
			tempdata = modelData.filter(function(d) {
				return d.id_a == self.state.phenotypeSortData[dmx][0].id_a;
			});
			tempFilteredModelData = tempFilteredModelData.concat(tempdata);
		}

		self.state.svg.selectAll("g .x.axis")
			.remove();
		self.state.svg.selectAll("g .tick.major")
			.remove();
		//update the x axis
		self.state.xScale = d3.scale.ordinal()
			.domain(self.state.filteredModelList.map(function (d) {return d.model_id; }))
			.rangeRoundBands([0,self.state.modelWidth]);
		this._createModelLabels(self);

		//The pathline creates a line  below the labels. We don't want two lines to show up so fill=white hides the line.
		this._createModelLines();
		this._createTextScores(this.state.filteredModelList);

		if (self.state.targetSpeciesName == "Overview") {
			this._createOverviewSpeciesLabels();
		}

		//  if (this.state.targetSpeciesName !== "Overview") {
		//now, limit the data returned by models as well
		for (var edx in self.state.filteredModelList) {
			tempdata = tempFilteredModelData.filter(function(d) {
				return d.model_id == self.state.filteredModelList[edx].model_id;
			});
			self.state.filteredModelData = self.state.filteredModelData.concat(tempdata);
		}
		// }

		this._createModelRects();
		this._createRowLabels();
	},

	_createModelLabels: function(self) {
		var model_x_axis = d3.svg.axis().scale(self.state.xScale).orient("top");

		self.state.svg.append("g")
			.attr("transform","translate(" + (self.state.textWidth +28) +"," + self.state.yoffset + ")")
			.attr("class", "x axis")
			.call(model_x_axis)
			//this be some voodoo...
			//to rotate the text, I need to select it as it was added by the axis
			.selectAll("text") 
			.each(function(d,i) { 
				self._convertLabelHTML(self, this, self._getShortLabel(self.state.filteredModelList[i].model_label,self.state.labelCharDisplayCount),self.state.filteredModelList[i]);
			});
	},

	_createModelLines: function() {
		var modelLineGap = 10;
		var lineY = this.state.yoffset-modelLineGap;
		this.state.svg.selectAll("path.domain").remove();
		this.state.svg.selectAll("text.scores").remove();
		this.state.svg.selectAll("#specieslist").remove();

		this.state.svg.append("line")
			.attr("transform","translate(" + (this.state.textWidth + 30) +"," + lineY + ")")
			.attr("x1", 0)
			.attr("y1", 0)
			.attr("x2", this.state.modelWidth)
			.attr("y2", 0)
			.attr("stroke", "#0F473E")
			.attr("stroke-width", 1);
	},

	_createTextScores: function(list) {
		var self = this;
		var xWidth = self.state.widthOfSingleModel;

		var translation ="translate(" + (this.state.textWidth + 34) +"," + this.state.yoffset + ")"; // was yoffset -3
		this.state.svg.selectAll("text.scores")
			.data(list)
			.enter()
			.append("text")
			.attr("transform",translation)
			.attr("id", "scorelist")
			.attr("x",function(d,i){return i * xWidth;})
			.attr("y", 0)
			.attr("width", xWidth)
			.attr("height", 10)
			.attr("class", "scores")
			// don't show score if it is a dummy model.
			.text(function (d){ 
				if (d.model_label === self.state.dummyModelName) {
					return "";
				} else {
					return d.model_score;
				}})
			.style("font-weight","bold")
			.style("fill",function(d) { return self._getColorForModelValue(self,d.species,d.model_score);});
	},

	//Add species labels to top of Overview
	_createOverviewSpeciesLabels: function () {
		var self = this;
		var speciesList = self.state.speciesList;
		var translation = "translate(" + (self.state.textWidth + 30) +"," + (self.state.yoffset + 10) + ")";

		var xPerModel = self.state.modelWidth/speciesList.length;
		var species = self.state.svg.selectAll("#specieslist")
			.data(speciesList)
			.enter()
			.append("text")
			.attr("transform",translation)
			.attr("x", function(d,i){ return (i+1/2)*xPerModel;})
			// return ((i+1) * xPerModel ) - 
			//(xPerModel/2);})
			.attr("id", "specieslist")
			.attr("y", 10)
			.attr("width", xPerModel) // function(d,i){return xPerModel;})
			.attr("height", 10)
			.attr("fill", "#0F473E")
			.attr("stroke-width", 1)
			.text(function (d,i){return speciesList[i];})
			.attr("text-anchor","middle");
	},

	// we might want to modify this to do a dynamic http retrieval to grab the dialog components...
	_showDialog : function(name){
		var self = this;
		var url = this._getResourceUrl(name,'html');
		if (typeof(self.state.tooltips[name]) === 'undefined') {
			$.ajax( {url: url,
				dataType: 'html',
				async: 'false',
				success: function(data) {
					self._populateDialog(self,name,data);
				},
				error: function ( xhr, errorType, exception ) { //Triggered if an error communicating with server  
					self._populateDialog(self,"Error", "We are having problems with the server. Please try again soon. Error:" + xhr.status);
				}
			});
		}
		else {
			this._populateDialog(self,name,self.state.tooltips[name]);
		}
	},

	_populateDialog: function(self,name,text) {
		var SplitText = "Title";
		var $dialog = $('<div></div>')
			.html(SplitText )
			.dialog({
				modal: true,
				minHeight: 200,
				height: 250,
				maxHeight: 300,
				minWidth: 400,
				resizable: false,
				draggable:true,
				position: { my: "top", at: "top+25%",of: "#svg_area"},
				title: 'Phenogrid Notes'});
		$dialog.html(text);
		$dialog.dialog('open');
		self.state.tooltips[name]=text;
	},

	/**
	 * Build the three main left-right visual components: the rectangle containing the 
	 * phenotypes, the main grid iself, and the right-hand side including the overview and color 
	 *   scales
	 *
	 */
	_createRectangularContainers: function() {
		var self=this;
		this._buildAxisPositionList();

		var gridHeight = self.state.phenotypeDisplayCount * self.state.heightOfSingleModel + 10;
		if (gridHeight < self.state.minHeight) {
			gridHeight = self.state.minHeight;
		}

		var y = self.state.yModelRegion;
		//create accent boxes
		var rect_accents = this.state.svg.selectAll("#rect.accent")
			.data([0,1,2], function(d) { return d;});
		rect_accents.enter()
			.append("rect")
			.attr("class", "accent")
			.attr("x", function(d, i) { return self.state.axis_pos_list[i];})
			.attr("y", y)
			.attr("width", self.state.textWidth+5)
			.attr("height",  gridHeight)
			.attr("id", function(d, i) {
				if(i === 0) {return "leftrect";}
				else if(i == 1) {return "centerrect";}
				else {return "rightrect";}
			})	
			.style("opacity", '0.4')
			.attr("fill", function(d, i) {
				return i != 1 ? d3.rgb("#e5e5e5") : "white";
			});

		return gridHeight+self.state.yModelRegion;
	},

	/* Build out the positions of the 3 boxes 
	 * TODO: REMOVE MAGIC NUMBERS... 
	 */

	_buildAxisPositionList: function() {
		//For Overview of Organisms 0 width = ((multiOrganismCt*2)+2) *this.state.widthOfSingleModel	
		//Add two extra columns as separators
		this.state.axis_pos_list = [];

		//calculate width of model section
		this.state.modelWidth = this.state.filteredModelList.length * this.state.widthOfSingleModel;
		//add an axis for each ordinal scale found in the data
		for (var i = 0; i < 3; i++) {
			//move the last accent over a bit for the scrollbar
			if (i == 2) {
				//make sure it's not too narrow i
				var w = this.state.modelWidth;
				if(w < this.state.smallestModelWidth) {
					w = this.state.smallestModelWidth;
				}
				this.state.axis_pos_list.push((this.state.textWidth + 30) + this.state.colStartingPos + w);
			} else {
				this.state.axis_pos_list.push((i*(this.state.textWidth + 10)) + this.state.colStartingPos);
			}
		}	
	},

	//this code creates the labels for the models, the lines, scores, etc..
	_createModelRegion: function () {
		var self = this;
		var list = [];
		var y1, ymax;

		//This is for the new "Overview" target option 
		if (this.state.targetSpeciesName == "Overview"){
			list = this.state.modelList;
		} else {
			list = this.state.filteredModelList;
		}

		this.state.xScale = d3.scale.ordinal()
			.domain(list.map(function (d) {return d.model_id; }))
			.rangeRoundBands([0,this.state.modelWidth]);

		this._createModelLabels(self);
		this._createModelLines();
		this._createTextScores(list);
		if (self.state.targetSpeciesName == "Overview") {
			this._createOverviewSpeciesLabels();
		}

		var modData = this.state.modelData;
		var temp_data = modData.map(function(d) { return d.value;} );
		var diff = d3.max(temp_data) - d3.min(temp_data);

		//only show the scale if there is more than one value represented
		//in the scale
		if (diff > 0) {
			// baseline for gradient positioning
			if (this.state.phenotypeData.length < this.state.defaultPhenotypeDisplayCount) {
				y1 = 172;
			} else {
				y1 = 262;
			}
			ymax = this._buildGradientDisplays(y1);
			this._buildGradientTexts(y1);
		}

		var phenogridControls = $('<div id="phenogrid_controls"></div>');
		this.element.append(phenogridControls);
		this._createSelectionControls(phenogridControls);
	},

	/**
	 * build the gradient displays used to show the range of colors
	 */
	_buildGradientDisplays: function(y1) {
		var ymax = 0;
		var y;
		//If this is the Overview, get gradients for all species with an index
		if (this.state.targetSpeciesName == "Overview" || this.state.targetSpeciesName == "All") {
			//this.state.overviewCount tells us how many fit in the overview
			for (var i = 0; i < this.state.overviewCount; i++) {
				y = this._createGradients(i,y1);
				if (y > ymax) {
					ymax = y;
				}
			}
		} else {  //This is not the overview - determine species and create single gradient
			var j = this._getTargetSpeciesIndexByName(this,this.state.targetSpeciesName);
			y = this._createGradients(j,y1);
			if (y > ymax) {
				ymax = y;
			}
		}
		return ymax;
	},

	/*
	 * add the gradients to the grid, returning the max x so that
	 * we know how much space the grid will need vertically on the
	 * right.  This is important because this region will extend 
	 * below the main grid if there are only a few phenotypes.
	 *
	 * y1 is the baseline for computing the y position of the
	 *    gradient
	 */
	_createGradients: function(i, y1){
		self = this;
		var y;
		var gradientHeight = 20;

		var gradient = this.state.svg.append("svg:linearGradient")
			.attr("id", "gradient_" + i)
			.attr("x1", "0")
			.attr("x2", "100%")
			.attr("y1", "0%")
			.attr("y2", "0%");
		for (var j in this.state.colorDomains){
			gradient.append("svg:stop")
				.attr("offset", this.state.colorDomains[j])
				.style("stop-color", this.state.colorRanges[i][j])
				.style("stop-opacity", 1);
		}
		/* gradient + gap is 20 pixels */
		y = y1 + (gradientHeight * i) + self.state.yoffset;
		var x = self.state.axis_pos_list[2] + 12;
		var translate = "translate(0,10)";
		var legend = this.state.svg.append("rect")
			.attr("transform",translate)
			.attr("class", "legend_rect_" + i)
			.attr("id","legendscale_" + i)
			.attr("y", y)
			.attr("x", x)
			.attr("rx",8)
			.attr("ry",8)
			.attr("width", 180)
			.attr("height", 15)
			.attr("fill", "url(#gradient_" + i + ")");

		/* text is 20 below gradient */
		y = y1 + gradientHeight* (i + 1) + self.state.yoffset;
		x = self.state.axis_pos_list[2] + 205;
		var gclass = "grad_text_" + i;
		var specName = this.state.targetSpeciesList[i].name;
		var grad_text = self.state.svg.append("svg:text")
			.attr("class", gclass)
			.attr("y", y)
			.attr("x", x)
			.style("font-size", "11px")
			.text(specName);

		y += gradientHeight;

		return y;
	},

	/**
	 * Show the labels next to the gradients, including descriptions of min and max sides 
	 * y1 is the baseline to work from
	 */
	_buildGradientTexts: function(y1) {
		var lowText, highText, labelText;
		for (var idx in this.state.similarityCalculation) {	
			if (this.state.similarityCalculation[idx].calc === this.state.selectedCalculation) {
				lowText = this.state.similarityCalculation[idx].low;
				highText = this.state.similarityCalculation[idx].high;
				labelText = this.state.similarityCalculation[idx].label;
				break;
			}
		}

		var ylowText = y1 + self.state.yoffset;
		var xlowText = self.state.axis_pos_list[2] + 10;
		var div_text1 = self.state.svg.append("svg:text")
			.attr("class", "detail_text")
			.attr("y", ylowText)
			.attr("x", xlowText)
			.style("font-size", "10px")
			.text(lowText);

		var ylabelText = y1 + self.state.yoffset;
		var xlabelText = self.state.axis_pos_list[2] + 75;
		var div_text2 = self.state.svg.append("svg:text")
			.attr("class", "detail_text")
			.attr("y", ylabelText)
			.attr("x", xlabelText)
			.style("font-size", "12px")
			.text(labelText);

		var yhighText = y1 + self.state.yoffset;
		var xhighText = self.state.axis_pos_list[2] + 125;
		var div_text3 = self.state.svg.append("svg:text")
			.attr("class", "detail_text")
			.attr("y", yhighText)
			.style("font-size", "10px")
			.text(highText);
		if (highText == "Max" || highText == "Highest"){
			div_text3.attr("x", xhighText + 25);
		} else {
			div_text3.attr("x", xhighText);
		}
	},

	/**
	 * build controls for selecting organism and comparison. Install handlers
	 * 
	 */
	_createSelectionControls: function(container) {
		var optionhtml ='<div id="selects"></div>';
		var options = $(optionhtml);
		var orgSel = this._createOrganismSelection();
		options.append(orgSel);
		var sortSel = this._createSortPhenotypeSelection();
		options.append(sortSel);
		var calcSel = this._createCalculationSelection();
		options.append(calcSel);
		container.append(options);
		//add the handler for the select control
		$( "#organism" ).change(function(d) {
			//msg =  "Handler for .change()
			//called." );
			self.state.targetSpeciesName = self._getTargetSpeciesNameByIndex(self,d.target.selectedIndex);
			self._resetSelections("organism");
		});

		$( "#calculation" ).change(function(d) {
			self.state.selectedCalculation = self.state.similarityCalculation[d.target.selectedIndex].calc;
			self._resetSelections("calculation");
			self._processSelected("calculation");
		});

		//add the handler for the select control
		$( "#sortphenotypes" ).change(function(d) {
			self.state.selectedSort = self.state.phenotypeSort[d.target.selectedIndex];
			self._resetSelections("sortphenotypes");
			self._processSelected("sortphenotypes");
		});

		self._configureFaqs();
	},

	/**
	* construct the HTML needed for selecting organism
	*/
	_createOrganismSelection: function(selClass) {
		var selectedItem;
		var optionhtml = "<div id='org_div'><span id='olabel'>Species</span><br />"+"<span id='org_sel'><select id=\'organism\'>";

		for (var idx in this.state.targetSpeciesList) {
			selectedItem = "";
			if (this.state.targetSpeciesList[idx].name === this.state.targetSpeciesName) {
				selectedItem = "selected";
			}
			optionhtml = optionhtml +
			"<option value=\""+this.state.targetSpeciesList[idx.name] +
			"\" " + selectedItem +">" + this.state.targetSpeciesList[idx].name + "</option>";
		}
		// add one for overview.
		if (this.state.targetSpeciesName === "Overview") {
			selectedItem = "selected";
		} else {
			selectedItem = "";
		}
		optionhtml = optionhtml + "<option value=\"Overview\" "+ selectedItem +">Overview</option>";

		optionhtml = optionhtml + "</select></span></div>";
		return $(optionhtml);
	},

	/** 
	* create the html necessary for selecting the calculation 
	*/
	_createCalculationSelection: function () {
		var optionhtml = "<span id='calc_div'><span id='clabel'>Display"+
			"<span id='calcs'><img class='calcimg' src='" +
			this.state.scriptpath +  "../image/greeninfo30.png' height='15px'>"+
			"</span></span><br />";

		optionhtml = optionhtml+"<span id=\'calc_sel\'><select id=\"calculation\">";
		for (var idx in this.state.similarityCalculation) {
			var selecteditem = "";
			if (this.state.similarityCalculation[idx].calc === this.state.selectedCalculation) {
				selecteditem = "selected";
			}
			optionhtml = optionhtml + "<option value='" +
				this.state.similarityCalculation[idx].calc +"' "+ selecteditem +">" +
				this.state.similarityCalculation[idx].label +"</option>";
		}
		optionhtml = optionhtml + "</select></span></span>";
		return $(optionhtml);
	},

	/** 
	* create the html necessary for selecting the sort
	*/
	_createSortPhenotypeSelection: function () {
		var optionhtml ="<span id='sort_div'>"+
			"<span id='slabel' >Sort Phenotypes<span id=\"sorts\">"+
			"<img src=\"" +this.state.scriptpath + "../image/greeninfo30.png\" height=\"15px\"></span>"+
			"</span>"+
			"<span><select id=\'sortphenotypes\'>";

		for (var idx in this.state.phenotypeSort) {
			var selecteditem = "";
			if (this.state.phenotypeSort[idx] === this.state.selectedSort) {
				selecteditem = "selected";
			}
			optionhtml = optionhtml + "<option value='" +"' "+ selecteditem +">" + this.state.phenotypeSort[idx]+"</option>";
		}
		optionhtml = optionhtml + "</select></span>";
		return $(optionhtml);
	},

	//this code creates the text and rectangles containing the text 
	//on either side of the model data
	_createRowLabels: function() {
		// this takes some 'splaining
		//the raw dataset contains repeats of data within the
		//A,subsumer, and B columns.   
		//If d3 sees the same label 4 times (ex: Abnormality of the
		//pharynx) then it will 
		//create a rectangle and text for it 4 times.  Therefore, I
		//need to create a unique set of  
		//labels per axis (because the labels can repeat across axes)
		var self=this;
		var rect_text = this.state.svg
			.selectAll(".a_text")
			.data(self.state.phenotypeSortData, function(d, i) {  return d[0].id_a; });//rowid
		rect_text.enter()
			.append("text")
			.attr("class", function(d) {
				return "a_text data_text " + d[0].id;//self._getConceptId(d[0].id);
			})
		//store the id for this item.  This will be used on click events
			.attr("ontology_id", function(d) {
				return d[0].id_a; //self._getConceptId(d[0].id_a);   
			})
			.attr("x", 208)
			.attr("y", function(d,i) {
			//return i;
				return self._getYPosition(d[0].id_a)+10;
			})
			.on("mouseover", function(d) {
				self._selectData(d, d3.mouse(this));
			})
			.on("mouseout", function(d) {
				self._deselectData(d, d3.mouse(this));
			})
			.attr("width", self.state.textWidth)
			.attr("height", 50)
			.text(function(d) {
				var txt = d[0].label_a;
				if (txt === undefined) {
					txt = d[0].id_a;
				}
				return self._getShortLabel(txt);
			});

		this._buildUnmatchedPhenotypeDisplay();

		//   if (this.state.targetSpeciesName == "Overview") {var pad = 14;}
		// else { var pad = 10;}
		var pad =14;

		rect_text.transition()
			.style('opacity', '1.0')
			.delay(5)
			.attr("y", function(d) {
				var newy;
				//controls position of phenotype list
				newy = self._getYPosition(d[0].id_a) + (self.state.yoffsetOver) + pad;
				return newy;
			});
		rect_text.exit()
			.transition()
			.delay(20)
			.style('opacity', '0.0')
			.remove();
	},

	_getUnmatchedPhenotypes : function(){
		var fullset = this.state.origPhenotypeData,
		partialset = this.state.phenotypeSortData,
		full = [],
		partial = [],
		unmatchedset = [];

		for (var i in fullset) {
			full.push(fullset[i]);
		}
		for (var j in partialset) {
			partial.push((partialset[j][0].id_a).replace("_", ":"));
		}
		for (var k in full) {
			//if no match in fullset
			if (partial.indexOf(full[k].id) < 0) {
				//if there unmatched set is empty, add this umatched phenotype
				unmatchedset.push(full[k]);
			}
		}
		var dupArray = [];
		dupArray.push(unmatchedset[0]);	
		//check for dups
		for (var l in unmatchedset){
			var found = false;
			for (var m in dupArray) {
				if (dupArray[m].id == unmatchedset[l].id) {
					found = true;
				}
			}
			if (found === false) {
				dupArray.push(unmatchedset[l]);
			}
		}
		if (dupArray[0] === undefined) {
			dupArray = [];
		}

		return dupArray;
	},

	_getUnmatchedLabels: function() {
		var unmatchedLabels = [];
		for (var i in this.state.unmatchedPhenotypes){
			jQuery.ajax({
				url : this.state.serverURL + "/phenotype/" + this.state.unmatchedPhenotypes[i] + ".json",
				async : false,
				dataType : 'json',
				success : function(data) {
					unmatchedLabels.push(data.label);
				},
				error: function ( xhr, errorType, exception ) { //Triggered if an error communicating with server  
					self._populateDialog(self,"Error", "We are having problems with the server. Please try again soon. Error:" + xhr.status);
				}
			});
		}
		return unmatchedLabels;
	},

	_getPhenotypeLabel : function(id){
		var label = "";

		for (var i in this.state.phenotypeSortData){
			if(id == this.state.phenotypeSortData[i][0].id_a.replace("_",":"))
			{ 
				label = this.state.phenotypeSortData[i][0].label_a;
				break;
			}
		}
		return label;
	}, 

	_buildUnmatchedPhenotypeDisplay: function() {
		var optionhtml;
		var prebl = $("#prebl");
		if (prebl.length === 0) {
			var preblHtml ="<div id='prebl'></div>";
			this.element.append(preblHtml);
			prebl = $("#prebl");
		}
		prebl.empty();

		if (this.state.unmatchedPhenotypes !== undefined && this.state.unmatchedPhenotypes.length > 0){
			//var phenotypes = this._showUnmatchedPhenotypes();		
			optionhtml = "<div class='clearfix'><form id='matches'><input type='checkbox' name='unmatched' value='unmatched' >&nbsp;&nbsp;View Unmatched Phenotypes<br /><form><div id='clear'></div>";
			var phenohtml = this._buildUnmatchedPhenotypeTable();
			optionhtml = optionhtml + "<div id='unmatched' style='display:none;'>" + phenohtml + "</div></div>";
			prebl.append(optionhtml);	
		} else { // no unmatched phenotypes
			optionhtml = "<div id='unmatchedlabel' style='display:block;'>No Unmatched Phenotypes</div>";
			prebl.append(optionhtml);
		}

		$('#matches :checkbox').click(function() {
			var $this = $(this);
			// $this will contain a reference to the checkbox   
			if ($this.is(':checked')) {
				// the checkbox was checked 
				$("#unmatched").show();
			} else {
				// the checkbox was unchecked
				$("#unmatched").hide();
			}
		});
	},

	_buildUnmatchedPhenotypeTable: function(){
		var self = this;
		var columns = 4;
		var outer1 = "<table id='phentable'>",
		outer2 = "</table>",
		inner = "";

		var unmatched = self.state.unmatchedPhenotypes;
		var text = "";
		var i = 0;
		while (i < unmatched.length) {
			inner += "<tr>"; 
			text = "";
			for (var j = 0; j < columns; j++){
				var label = unmatched[i].label;
				var id = self._getConceptId(unmatched[i++].id);
				var url_origin = self.document[0].location.origin;
				text += "<td><a href='" + url_origin + "/phenotype/" + id + "' target='_blank'>" + label + "</a></td>";
				if (i == unmatched.length) {
					break;
				}
			}
			inner += text + "</tr>";
		}
		return outer1 + inner + outer2;
	},

	_matchedClick: function(checkboxEl) {
		if (checkboxEl.checked) {
			// Do something special
			$("#unmatched").show();
		} else {
			// Do something else
			$("#unmatched").hide();
		}
	},

	_rectClick: function(data) {
		var retData;
		this._showThrobber();
		jQuery.ajax({
			url : this.state.serverURL + "/phenotype/" + data.attributes.ontology_id.value + ".json",
			async : false,
			dataType : 'json',
			success : function(data) {
				retData = "<strong>Label:</strong> " + "<a href=\"" + data.url + "\">" + data.label + "</a><br/><strong>Type:</strong> " + data.category;
			},
			error: function ( xhr, errorType, exception ) { //Triggered if an error communicating with server  
				self._populateDialog(self,"Error", "We are having problems with the server. Please try again soon. Error:" + xhr.status);
			},
		});
		this._updateDetailSection(retData, this._getXYPos(data));
	},

	_toProperCase : function (oldstring) {
		return oldstring.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
	},

	//given an array of phenotype objects 
	//edit the object array.
	// items are either ontology ids as strings, in which case they are handled as is,
	// or they are objects of the form
	// { "id": <id>, "observed": <obs>} .
	// in that case take id  if  "observed" is "positive"
	_filterPhenotypeResults : function(phenotypelist) {
		//this.state.phenotypeData = phenotypelist.slice();
		var newlist = [];
		var pheno;
		for (var i in phenotypelist) {
			pheno = phenotypelist[i];
			if (typeof pheno ==='string') {
				newlist.push(pheno);
			}
			if (pheno.observed==="positive") {
				newlist.push(pheno.id);
			}
		}
		return newlist;
	},   

	//given an array of phenotype objects 
	//Create a new array for only id and label 
	_filterPhenotypeLabels : function(phenotypelist) {
		var newlist = [];
		for (var i in phenotypelist) {
			newlist.push({ "id" : phenotypelist[i].id, "label" : phenotypelist[i].label});
		}
		//copy the list of ids and labels to phenotypeLabels array
		return newlist;
	}

	}); //end of widget code
})(jQuery);
