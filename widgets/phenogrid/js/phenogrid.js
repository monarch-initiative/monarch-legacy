/*
 *
 *	Phenogrid - the Phenogrid widget.
 * 
 *	implemented as a jQuery UI (jqueryui.com) widget, this can be instantiated on a jquery-enabled web page
 *	with a call of the form 
 *	$("#mydiv).phenogrid({phenotypeData: phenotypeList}).
 *	where #mydiv is the id of the div that will contain the phenogrid widget
 *	and phenotypeList takes one of two forms:
 *
 *	1. a list of hashes of the form 
 *		[ {"id": "HP:12345", "observed" :"positive"}, {"oid: "HP:23451", "observed" : "negative"},]
 *	2. a simple list of ids..
 *		[ "HP:12345", "HP:23451"], etc.
 *
 *	Configuration options useful for setting species displayed, similarity calculations, and 
 *	related parameters can also be passed in this hash. As of September
 *	2014, these options are currently being refactored - further
 *	documentation hopefully coming soon.
 *
 *	The phenogrid widget uses semantic similarity calculations
 *	provided by OWLSim (www.owlsim.org), as provided through APIs from
 *	the Monarch initiative (www.monarchinitiative.org). 
 * 
 *	Given an input list of phenotypes and parameters indicating
 *	desired source of matching models (humans, model organisms, etc.),
 *	the phenogrid will call the Monarch API to get OWLSim results
 *	consisting of arrays of the items of the following form:
 *	{
 *		"id":"HP_0000716_MP_0001413_MGI_006446",
 *		"label_a":"Depression",
 *		"id_a":"HP:0000716",
 *		"subsumer_label":"Abnormal emotion/affect behavior",
 *		"subsumer_id":"HP:0100851",
 *		"value":5.667960271407814,
 *		"label_b":"abnormal response to new environment",
 *		"id_b":"MP:0001413",
 *		"model_id":"MGI_006446",
 *		"model_label":"B10.Cg-H2<sup>h4</sup>Sh3pxd2b<sup>nee</sup>/GrsrJ",
 *		"rowid":"HP_0000716_HP_0100851"
 *	},
 *
 *	These results will then be rendered in the phenogrid
 *
 *	NOTE: I probably need a model_url to render additional model info on 
 *	the screen. Alternatively I can load the data 
 *	as a separate call in the init function.
 *
 *	META NOTE (HSH - 8/25/2014): Can we remove this note, or at least clarify?
 */
var url = document.URL;

function modelDataPoint(x,y) {
	this.model_id = x;
	this.pheno_id = y;
}

function modelDataPointEquals(point1,point2) {
	return point1.model_id === point2.model_id && point1.pheno_id === point2.pheno_id;
}

function modelDataPointPrint(point) {
	return "Model:" + point.model_id + ", Pheno:" + point.pheno_id;
}

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
		yoffsetOver: 30,
		overviewGridTitleXOffset: 340,
		overviewGridTitleFaqOffset: 230,
		nonOverviewGridTitleXOffset: 220,
		nonOverviewGridTitleFaqOffset: 570,
		gridTitleYOffset: 20,
		baseYOffset: 150,
		faqImgSize: 15,
		dummyModelName: "dummy"
	},

	internalOptions: {
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
	//TO HASH
	_reset: function(type) {
		if (type == 'organism' || typeof(type) == 'undefined') {
			this.state.modelData = [];
			this.state.modelList = [];
			this.state.filteredModelData = [];
			this.state.filteredModelList = [];
		}

		// target species name might be provided as a name or as taxon. Make sure that we translate to name
		this.state.targetSpeciesName = this._getTargetSpeciesNameByTaxon(this,this.state.targetSpeciesName);

		this.state.yAxisMax = 0;
		this.state.yoffset = this.state.baseYOffset;

		this.state.modelName = "";
		this.state.h = this.config.h;
	},

	//this function will use the desired height to determine how many phenotype rows to display
	//the basic formula is: (height - headerAreaHeight)/14.
	//return -1 if the available space is too small to properly display the grid
	//IGNORE
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
	//IGNORE
	_getTargetSpeciesIndexByName: function(self,name) {
		var index = -1;
		if (typeof(self.state.targetSpeciesByName[name]) !== 'undefined') {
			index = self.state.targetSpeciesByName[name].index;
		}
		return index;
	},

	//IGNORE
	_getTargetSpeciesNameByIndex: function(self,index) {
		var species;
		if (typeof(self.state.targetSpeciesList[index]) !== 'undefined') {
			species = self.state.targetSpeciesList[index].name;
		}
		else {
			species = 'Overview';
		}
		return species;
	},

	//IGNORE
	_getTargetSpeciesTaxonByName: function(self,name) {
		var taxon;
		// first, find something that matches by name
		if (typeof(self.state.targetSpeciesByName[name]) !== 'undefined') {
			taxon = self.state.targetSpeciesByName[name].taxon;
		}
		//default to overview, so as to always do somethign sensible
		if (typeof(taxon) === 'undefined') {
			taxon ='Overview';
		}

		return taxon;
	},

	/**
	* some installations might send in a taxon - "10090" - as opposed to a name - "Mus musculus".
	* here, we make sure that we are dealing with names by translating back
	* this might be somewhat inefficient, as we will later translate to taxon, but it will
	* make other calls easier to be consitently talking in terms of species name
	*/
	//IGNORE
	_getTargetSpeciesNameByTaxon: function(self,name) {
		/// default - it actually was a species name
		var species = name;
		var found = false;

		// check to see if the name exists.
		// if it is found, then we say "true" and we're good.
		// if, however, it matches the taxon, take the index in the array.

		for (var sname in self.state.targetSpeciesByName) {
			// we've found a matching name.
			if (name == sname) {
				found = true;
			}

			if (name == self.state.targetSpeciesByName[sname].taxon) {
				found = true;
				species = sname;
				break;
			}
		}
		// if not found, it's overview.
		if (found === false) {
			species = "Overview";
		}
		return species;
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
	 //IGNORE
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
	//IGNORE
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
	//IGNORE
	_getResourceUrl: function(name,type) {
		var prefix = this.state.serverURL+'/widgets/phenogrid/js/';
		return prefix + 'res/' + name + '.' + type;
	},

	//TO HASH
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

		// target species name might be provided as a name or as
		// taxon. Make sure that we translate to name
		this.state.targetSpeciesName = this._getTargetSpeciesNameByTaxon(this,this.state.targetSpeciesName);

		this._loadData();

		// shorthand for top of model region
		this.state.yModelRegion = this.state.yoffsetOver + this.state.yoffset;

		var phenotypeArray = this._uniquifyPhenotypes(this.state.modelData);
		//copy the phenotypeArray to phenotypeData array - now instead of ALL phenotypes, it will be limited to unique phenotypes for this disease
		//do not alter this array: this.state.phenotypeData
		this.state.phenotypeData = phenotypeArray;
		this.state.phenoLength = this.state.phenotypeData.length;

		this._adjustPhenotypeCount(this.state.modelData);
		this._initializePhenotypeSortData();
		this._filterSelected("sortphenotypes");
		this.state.unmatchedPhenotypes = this._getUnmatchedPhenotypes();
		this.element.empty();
		this._createColorScale();

		this.reDraw();
	},

	//IGNORE
	_loadSpinner: function() {
		var element =$('<div><h3>Loading...</h3><div class="cube1"></div><div class="cube2"></div></div>');
		this._createSvgContainer();
		element.appendTo(this.state.svgContainer);
	},

	//TO HASH
	reDraw: function() {
		if (this.state.modelData.length !== 0 && this.state.phenoLength !== 0 && this.state.filteredPhenotypeData.length !== 0){
			this._setComparisonType();
			this._initCanvas();
			this._addLogoImage();

			this.state.svg
				.attr("width", "100%")
				.attr("height", this.state.phenotypeDisplayCount * this.state.widthOfSingleModel);
			var rectHeight = this._createRectangularContainers();

			this._createModelRegion();
			this._addGradients();

			this._addPhenogridControls();

			this._updateAxes();

			this._createGridlines();
			this._createModelRects();
			this._highlightSpecies();
			this._createRowLabels();
			this._createOverviewSection();

			var height = rectHeight + 40;

			var containerHeight = height + 15; //15 prevents the control panel from overlapping the grid
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

	//IGNORE
	_resetIndicies: function() {
		this.state.currModelIdx = this.state.modelDisplayCount-1;
		this.state.currPhenotypeIdx = this.state.phenotypeDisplayCount-1;
	},

	/* dummy option procedures as per 
	http://learn.jquery.com/jquery-ui/widget-factory/how-to-use-the-widget-factory/
	likely to have some content added as we proceed
	*/
	//IGNORE
	_setOption: function( key, value ) {
		this._super( key, value );
	},

	//IGNORE
	_setOptions: function( options ) {
		this._super( options );
	},

	//create this visualization if no phenotypes or models are returned
	//IGNORE
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
	//IGNORE
	_createGridlines: function() {
		var self = this;
		var mWidth = self.state.widthOfSingleModel;
		var mHeight = self.state.heightOfSingleModel;
		//create a blank grid to match the size of the phenogrid grid
		var data = [];
		var modelCt = self.state.modelDisplayCount;
		
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
	//IGNORE
	_createOverviewSection: function() {
		var self = this;
		// add-ons for stroke size on view box. Preferably even numbers
		var linePad = 2;
		var viewPadding = linePad * 2 + 2;

		// overview region is offset by xTranslation, yTranslation
		var xTranslation = 42;
		var yTranslation = 30;

		// these translations from the top-left of the rectangular region give the
		// absolute coordinates
		var overviewX = self.state.axis_pos_list[2] + xTranslation;
		var overviewY = self.state.yModelRegion + yTranslation;

		// size of the entire region - it is a square
		var overviewRegionSize = self.state.globalViewSize;
		if (this.state.phenoLength < this.state.defaultPhenotypeDisplayCount) {
			overviewRegionSize = self.state.reducedGlobalViewSize;
		}

		// create the legend for the modelScores
		self._createModelScoresLegend();

		// make it a bit bigger to ccont for widths
		var overviewBoxDim = overviewRegionSize + viewPadding;

		// create the main box and the instruction labels.
		self._initializeOverviewRegion(overviewBoxDim,overviewX,overviewY);

		// create the scales
		self._createSmallScales(overviewRegionSize);

		//add the items using smaller rects
		var modData = self._mergeHashEntries(self.state.modelDataHash);

		var model_rects = this.state.svg.selectAll(".mini_models")
			.data(modData, function(d) {return d.pheno_id + d.model_id;});
		overviewX++;	//Corrects the gapping on the sides
		overviewY++;
		var modelRectTransform = "translate(" + overviewX +	"," + overviewY + ")";
		model_rects.enter()
			.append("rect")
			.attr("transform",modelRectTransform)
			.attr("class", "mini_model")
			.attr("y", function(d, i) { return self.state.smallYScale(d.pheno_id) + linePad / 2;})
			.attr("x", function(d) { return self.state.smallXScale(d.model_id) + linePad / 2;})
			.attr("width", linePad)
			.attr("height", linePad)
			.attr("fill", function(d) {
				//console.log("_createOverviewSection: " + d + ", " + self._getAxisData(d.model_id).species + ", " + d.value[self.state.selectedCalculation]);
				return self._getColorForModelValue(self,self._getAxisData(d.model_id).species,d.value[self.state.selectedCalculation]);
			});

		var lastId = self._returnPhenoID(self.state.phenotypeDisplayCount - 1);
		var selectRectHeight = self.state.smallYScale(lastId);
		var lastMId = self._returnModelID(self.state.modelDisplayCount - 1);
		var selectRectWidth = self.state.smallXScale(lastMId);

		self.state.highlightRect = self.state.svg.append("rect")
			.attr("x",overviewX)
			.attr("y",overviewY)
			.attr("id", "selectionrect")
			.attr("height", selectRectHeight + 4)
			.attr("width", selectRectWidth + 4)
			.attr("class", "draggable")
			.call(d3.behavior.drag()
				.on("drag", function(d) {
					// drag the highlight in the overview window
					//notes: account for the width of the rectangle in my x and y calculations
					//do not use the event x and y, they will be out of range at times. Use the converted values instead.

					var current = d3.select(this);
					var curX = parseFloat(current.attr("x"));
					var curY = parseFloat(current.attr("y"));

					var rect = self.state.svg.select("#selectionrect");
					rect.attr("transform","translate(0,0)");

					//limit the range of the x value
					var newX = curX + d3.event.dx;
					var newY = curY + d3.event.dy;

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
					if (newX + selectRectWidth > overviewX + overviewRegionSize) {
						newX = overviewX + overviewRegionSize - selectRectWidth;
					}

					// bottom
					if (newY + selectRectHeight > overviewY + overviewRegionSize) {
						newY = overviewY + overviewRegionSize - selectRectHeight;
					}
					rect.attr("x", newX);
					//This changes for vertical positioning
					rect.attr("y", newY);

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

	//NEW
	_returnPhenoID: function(id){
		var searchArray = this.state.phenotypeListHash.entries();
		if (this.state.targetSpeciesName === "Overview") {
			searchArray = this._updateOverviewPos(searchArray);
		} 
		var results = false;
		for (var i in searchArray){
			if (searchArray[i][1].pos == id){
				results = searchArray[i][0];
				break;
			}
		}
		return results;
	},

	//NEW
	_returnModelID: function(id){
		var searchArray = this.state.modelListHash.entries();
		var results = false;
		for (var i in searchArray){
			if (searchArray[i][1].pos == id){
				results = searchArray[i][0];
				break;
			}
		}
		return results;
	},

	//NEW
	_mergeHashEntries: function(hashT){
		var premerged = hashT.entries();
		var merged = [];
		var key, value;
		for (var i in premerged){
			if (typeof(premerged[i][0].pheno_id) !== 'undefined'){
				premerged[i][1].pheno_id = premerged[i][0].pheno_id;
				premerged[i][1].model_id = premerged[i][0].model_id;
			} else {
				premerged[i][1].id = premerged[i][0];
			}
			merged[i] = premerged[i][1];
		}
		return merged;
	},

	/* we only have 3 color,s but that will do for now */
	//IGNORE
	_getColorForModelValue: function(self,species,score) {
		//This is for the new "Overview" target option
		var selectedScale = self.state.colorScale[species][self.state.selectedCalculation];
		return selectedScale(score);
	},

	//IGNORE
	_createModelScoresLegend: function() {
		var scoreTipY = self.state.yoffset;
		var faqY = scoreTipY - self.state.gridTitleYOffset;
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
			.attr("width", self.state.faqImgSize)
			.attr("height", self.state.faqImgSize)
			.attr("class", "faq_img")
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

	//IGNORE
	_createDiseaseTitleBox: function() {
		var self = this;
		var dTitleYOffset = self.state.yoffset - self.state.gridTitleYOffset/2;
		var dTitleXOffset = self.state.colStartingPos;
		var title = document.getElementsByTagName("title")[0].innerHTML;
		var dtitle = title.replace("Monarch Disease:", "");

		// place it at yoffset - the top of the rectangles with the phenotypes
		var disease = dtitle.replace(/ *\([^)]*\) */g,"");
		var shortDis = self._getShortLabel(disease,60);	//MAGIC NUM

		//Use until SVG2. Word Wraps the Disease Title
		this.state.svg.append("foreignObject")
			.attr("width", 205)
			.attr("height", 50)
			.attr("id","diseasetitle")
			.attr("transform","translate(" + dTitleXOffset + "," + dTitleYOffset + ")")
			.attr("x", 0)
			.attr("y", 0)
			.append("xhtml:div")
			.html(shortDis);
	},

	//IGNORE
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

	//IGNORE
	_createSmallScales: function(overviewRegionSize) {
		var self = this;
		var sortDataList = self._getSortedIDList(self.state.phenotypeListHash.entries());
		var modsHash = self.state.modelListHash.entries();

		if (this.state.targetSpeciesName === "Overview") {
			self._updateOverviewPos(modsHash);
		}

		var mods = self._getSortedIDList(modsHash);

		this.state.smallYScale = d3.scale.ordinal()
			.domain(sortDataList.map(function (d) {return d; }))
			.rangePoints([0,overviewRegionSize]);

		var modids = mods.map(function (d) {return d; });
		this.state.smallXScale = d3.scale.ordinal()
			.domain(modids)
			.rangePoints([0,overviewRegionSize]);
	},

	//NEW
	_getSortedIDList: function(hashArray){
		var resultArray = [];
		for (var j in hashArray) {
			resultArray[hashArray[j][1].pos] = hashArray[j][0];
		}
		return resultArray;
	},

	//NEW
	_updateOverviewPos: function(hashArray){
		for (var i in hashArray){
			for (var j in this.state.targetSpeciesList){
				if (hashArray[i][1].species == this.state.targetSpeciesList[j].name){
					hashArray[i][1].pos += (j * 10);
				}
			}
		}
		return hashArray;
	},

	//IGNORE
	_invertOverviewDragPosition: function(scale,value) {
		var leftEdges = scale.range();
		var size = scale.rangeBand();
		var j;
		for (j = 0; value > (leftEdges[j]+size); j++) {} // iterate until leftEdges[j]+size is past value
		return j;
	},

	//IGNORE
	_getComparisonType: function(organism){
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

	//IGNORE
	_setComparisonType: function(){
		var comp = this.state.defaultComparisonType;
		for (var i in this.state.comparisonTypes) {
			if (this.state.targetSpeciesName === this.state.comparisonTypes[i].organism) {
				comp = this.state.comparisonTypes[i];
			}
		}
		this.state.comparisonType = comp;
	},

	//IGNORE
	_setSelectedCalculation: function(calc) {
		var self = this;

		var tempdata = self.state.similarityCalculation.filter(function(d) {
			return d.calc == calc;
		});
		self.state.selectedCalculation = tempdata[0].calc;
	},

	//IGNORE
	_setSelectedSort: function(type) {
		var self = this;
		self.state.selectedSort = type;
	},

	//IGNORE
	_processSelected: function(processType){
		this._adjustPhenotypeCount();
		this._filterSelected(processType);
		this.state.unmatchedPhenotypes = this._getUnmatchedPhenotypes();
		this.element.empty();
		this.reDraw();
	},

	//given the full dataset, return a filtered dataset containing the
	//subset of data bounded by the phenotype display count and the model display count
	//IGNORE
	_adjustPhenotypeCount: function() {
		//we need to adjust the display counts and indexing if there are fewer phenotypes than the
		// default phenotypeDisplayCount
		if (this.state.phenoLength < this.state.phenotypeDisplayCount) {
			this.state.currPhenotypeIdx = this.state.phenoLength-1;
			this.state.phenotypeDisplayCount = this.state.phenoLength;
		}
	},

	//TO HASH
	_filterSelected: function(filterType){
		var self = this;
		if (filterType == "sortphenotypes"){
			//Sort the phenotypes based on what value is currently held in self.state.selectedSort
			this._sortingPhenotypes();
			this._sortPhenotypeHash();
		}

		//Step 2: Filter for the next n phenotypes based on phenotypeDisplayCount and update the y-axis
		this.state.filteredModelData = [];
		this.state.filteredPhenotypeData = [];
		this.state.yAxis = [];

		//Force Reset to Origin when changing Species, Sort or Display
		var startIdx = 0;
		var displayLimiter = this.state.phenotypeDisplayCount;
		if (filterType == 'updateModel') {
			startIdx = this.state.currPhenotypeIdx - this.state.phenotypeDisplayCount;
			displayLimiter = this.state.currPhenotypeIdx;
		}

		//extract the new array of filtered Phentoypes
		//also update the axis
		//also update the modeldata
		var axis_idx = 0;
		var tempFilteredModelData = [];
		var filteredData;

		this._filterPhenotypeHash(startIdx,displayLimiter-1);
		//get phenotype[startIdx] up to phenotype[currPhenotypeIdx] from the array of sorted phenotypes
		for (var i = startIdx; i < displayLimiter; i++) {
			filteredData = {"id_a": self.state.phenotypeSortData[i][0].id_a,"id": self.state.phenotypeSortData[i][0].id,"label_a": self.state.phenotypeSortData[i][0].label_a};
			self.state.filteredPhenotypeData.push(filteredData);
			//update the YAxis
			//the height of each row
			var size = 10;
			//the spacing you want between rows
			var gap = 3;
			//push the rowid and ypos onto the yaxis array
			//so now the yaxis will be in the order of the ranked phenotypes
			var ypos = (axis_idx * (size + gap)) + self.state.yoffset;
			var stuff = {"id": self.state.phenotypeSortData[i][0].id_a, "ypos" : ypos};
			self.state.yAxis.push(stuff);
			self._setYPosHash(self.state.phenotypeSortData[i][0].id_a, ypos); 
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

	//DELETE
	_uniquifyPhenotypes: function(fulldataset) {
		var phenotypeArray = [];
		//Step 1: Filter data so only unique phenotypes are represented (if a source phenotype matches two
		// different targets, only keep one of them. 
		//Input: array of all data returned by query
		//Output: array of the unique phentypes for this disease
		//phenotypeArray: we should end up with an array with unique matched phenotypes, each with the highest value
		// seen for that phenotype 
		for (var idx in fulldataset) {
			var match = null;
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

	//DELETE
	_sortPhenotypesModel: function(a,b) {
		var diff = b.count - a.count;
		if (diff === 0) {
			diff = a[0].id_a.localeCompare(b[0].id_a);
		}
		return diff;
	},

	//DELETE
	_sortPhenotypesRank: function(a,b) {
		return b.sum-a.sum;
	},

	//DELETE
	_sortPhenotypesAlphabetic: function(a,b) {
		var labelA = a.label.toLowerCase(), 
		labelB = b.label.toLowerCase();
		if (labelA < labelB) {return -1;}
		if (labelA > labelB) {return 1;}
		return 0;
	},

	//DELETE
	_initializePhenotypeSortData: function() {
		var self = this;
		self.state.phenotypeSortData = [];
		var modData = self.state.modelData;

		//1. Get all unique phenotypes in an array
		for (var idx in self.state.phenotypeData) {
			var tempdata = [];
			for (var midx in modData) {
				if (modData[midx].id_a == self.state.phenotypeData[idx].id_a) {
					tempdata.push(modData[midx]);
				}
			}

			// now, have all of the models that match
			// phenotypeData[idx].
			// must set up the atrtributes of this array needed
			// for sorting.

			var sortVal;
			// first alphabetic
			sortVal = tempdata[0].label_a;
			tempdata.label = sortVal;

			///then for frequency and freq/rarity, iterate over 
			var freq = 0;
			var num = 0;
			for (var i in tempdata) {
				freq += 1;
				num += tempdata[i].subsumer_IC;
			}
			tempdata.count = freq;
			tempdata.sum = num;

			// finally, push onto phenotypeSortData
			self.state.phenotypeSortData.push(tempdata);
		}
	},

	//DELETE
	_sortingPhenotypes: function() {
		var self = this;
		var sortType = self.state.selectedSort;
		var sortFunc;
		if (sortType == 'Frequency') {
			sortFunc = self._sortPhenotypesModel;
		} else if (sortType == 'Frequency and Rarity') {
			sortFunc = self._sortPhenotypesRank;
		} else if (sortType == 'Alphabetic') {
			sortFunc = self._sortPhenotypesAlphabetic;
		}

		if (typeof(sortFunc) !== 'undefined') {
			self.state.phenotypeSortData.sort(sortFunc);
		}
	},

	//given a list of phenotypes, find the top n models
	//I may need to rename this method "getModelData". It should extract the models and reformat the data 
	//IGNORE
	_loadData: function() {
		if (this.state.targetSpeciesName === "Overview") {
			this._loadOverviewData();
			this._finishOverviewLoad();
		} else {
			this._loadSpeciesData(this.state.targetSpeciesName);
			this._finishLoad();
		}
		this._loadHashTables();
		this._filterHashTables();
	},

	//IGNORE
	_loadSpeciesData: function(speciesName,limit) {
		var phenotypeList = this.state.phenotypeData;
		var taxon = this._getTargetSpeciesTaxonByName(this,speciesName);
		var url = this.state.serverURL + "/simsearch/phenotype?input_items=" + phenotypeList.join(",") + "&target_species=" + taxon;
		if (typeof(limit) !== 'undefined') {
			url += "&limit=" + limit;
		}

		var res = this._ajaxLoadData(speciesName,url);
		if (res !== null) {
			if (typeof(limit) !== 'undefined' && typeof(res.b) !== 'undefined' && res.b !== null && res.b.length < limit) {
				res = this._padSpeciesData(res,speciesName,limit);
			}
		}
		this.state.data[speciesName] = res;
	},

	// make sure there are limit items in res --
	// If we don't have enough, add some dummy items in. 
	// This will space things out appropriately, having dummy models take 
	// up some of the x axis space. Later, we will make sure not to show the 
	// labels for these dummies.
	//IGNORE
	_padSpeciesData: function(res,species,limit) {
		var toadd = limit - res.b.length;
		for (var i = 0; i < toadd; i++) {
			var dummyId = "dummy" + species + i;
			var newItem = { id: dummyId,
				label: this.state.dummyModelName,
				score: {score: 0, rank: Number.MAX_VALUE},
			};
			res.b.push(newItem);
		}
		return res;
	},

	//IGNORE
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
	},

	//IGNORE
	_finishOverviewLoad: function () {
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
				this.state.multiOrganismCt = specData.b.length;
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
			this.state.currModelIdx = this.state.modelList.length - 1;
			this.state.modelDisplayCount = this.state.modelList.length;
		}

		this._getFilteredModelList(0,this.state.modelDisplayCount);
	},

	//NEW
	_getCellData: function(point) {
		if (this.state.modelDataHash.containsKey(point)){
			return this.state.modelDataHash.get(point);
		} else {
			return false;
		}
	},

	//NEW
	_getAxisData: function(key) {
		if (typeof(key) === 'undefined'){
			console.log("UNDEFINED AXIS CALL");
			return false;
		}

		if (this.state.phenotypeListHash.containsKey(key)){
			return this.state.phenotypeListHash.get(key);
		}
		else if (this.state.modelListHash.containsKey(key)){
			return this.state.modelListHash.get(key);
		}
		else { return false; }
	},

	//NEW
	_loadHashTables: function() {
		//CHANGE LATER TO CUT DOWN ON INFO FROM _finishLoad & _finishOverviewLoad
		this.state.phenotypeListHash = new Hashtable();
		this.state.modelListHash = new Hashtable();
		this.state.modelDataHash = new Hashtable({hashCode: modelDataPointPrint, equals: modelDataPointEquals});
		var modelPoint, hashData, concept, type, score, x;
		var y = 0;

		for (var i in this.state.modelData)
		{
			//Setting phenotypeListHash
			if (typeof(this.state.modelData[i].id_a) !== 'undefined' && this.state.phenotypeListHash.containsKey(this.state.modelData[i].id_a) == false){
				hashData = {"label": this.state.modelData[i].label_a, "IC": this.state.modelData[i].IC_a, "pos": y, "count": 0, "sum": 0};
				this.state.phenotypeListHash.put(this.state.modelData[i].id_a, hashData);
				y++;
			}

			//Setting modelListHash
			type = this.state.defaultApiEntity;
			if (typeof(this.state.modelData[i].model_id) !== 'undefined' && this.state.modelListHash.containsKey(this.state.modelData[i].model_id) == false){

				concept = this._getConceptId(this.state.modelData[i].model_id);
				for (var j in this.state.apiEntityMap) {
					if (concept.indexOf(this.state.apiEntityMap[j].prefix) === 0) {
						type = this.state.apiEntityMap[j].apifragment;
					}
				}

				for (var m in this.state.modelList){
					if (this.state.modelList[m].model_id == this.state.modelData[i].model_id){
						x = this.state.modelList[m].model_rank;
						score = this.state.modelList[m].model_score;
					}
				}

				hashData = {"label": this.state.modelData[i].model_label, "species": this.state.modelData[i].species, "taxon": this.state.modelData[i].taxon, "type": type, "pos": x, "score": score};
				this.state.modelListHash.put(this.state.modelData[i].model_id, hashData);
			}

			//Setting modelDataHash
			modelPoint = new modelDataPoint(this.state.modelData[i].model_id, this.state.modelData[i].id_a);
			hashData = {"value": this.state.modelData[i].value, "subsumer_label": this.state.modelData[i].subsumer_label, "subsumer_id": this.state.modelData[i].subsumer_id, "subsumer_IC": this.state.modelData[i].subsumer_IC, "b_label": this.state.modelData[i].label_b, "b_id": this.state.modelData[i].id_b, "b_IC": this.state.modelData[i].IC_b};
			this._updateSortVals(this.state.modelData[i].id_a, this.state.modelData[i].subsumer_IC);
			this.state.modelDataHash.put(modelPoint, hashData);

		}
	},

	//NEW
	_updatePhenoPos: function(key,rank) {
		var values = this.state.phenotypeListHash.get(key);
		values.pos = rank;
		this.state.phenotypeListHash.put(key,values);
	},

	//NEW
	_setYPosHash: function(key,ypos) {
		var values = this.state.phenotypeListHash.get(key);
		values.ypos = ypos;
		this.state.phenotypeListHash.put(key,values);
	},

	//NEW
	_updateSortVals: function(key,subIC) {
		var values = this.state.phenotypeListHash.get(key);
		values.count += 1;
		values.sum += subIC;
		this.state.phenotypeListHash.put(key,values);
	},

	//NEW
	_filterHashTables: function () {
		this._sortPhenotypeHash();
		this._filterPhenotypeHash(0,25);
		this._filterModelListHash(0,this.state.modelDisplayCount);
		this.state.filteredModelDataHash = [];
		//NOT A HASH ACTUALLY.  RENAME AFTER ADOPTION
		var currentModelData = this.state.modelDataHash.entries();
		var filteredModel;
		for (var i in currentModelData){
			if (this.state.filteredModelListHash.containsKey(currentModelData[i][0].model_id) && this.state.filteredPhenotypeListHash.containsKey(currentModelData[i][0].pheno_id)){
				currentModelData[i][1].pheno_id = currentModelData[i][0].pheno_id;
				currentModelData[i][1].model_id = currentModelData[i][0].model_id
				this.state.filteredModelDataHash.push(currentModelData[i][1]);
			}
		}
	},

	//NEW
	_filterPhenotypeHash: function (start,end) {
		this.state.filteredPhenotypeListHash = new Hashtable();
		var oldHash = this.state.phenotypeListHash.entries();
		for (var i in oldHash){
			if (oldHash[i][1].pos >= start && oldHash[i][1].pos <= end){
				this.state.filteredPhenotypeListHash.put(oldHash[i][0],oldHash[i][1]);
			}
		}
	},

	//NEW
	_filterModelListHash: function (start,end) {
		this.state.filteredModelListHash = new Hashtable();
		var oldHash = this.state.modelListHash.entries();
		for (var i in oldHash){
			if (oldHash[i][1].pos >= start && oldHash[i][1].pos <= end){
				this.state.filteredModelListHash.put(oldHash[i][0],oldHash[i][1]);
			}
		}
	},

	//NEW
	_sortPhenotypeHash: function () {
		var self = this;
		var sortType = self.state.selectedSort;
		var sortFunc;
		var newHash = [];
		var origHash = self.state.phenotypeListHash.entries();
		for (var i in origHash){
			newHash.push({"id": origHash[i][0], "label": origHash[i][1].label.toLowerCase(), "count": origHash[i][1].count, "sum": origHash[i][1].sum});
		}
		if (sortType == 'Frequency') {
			sortFunc = self._sortPhenotypesModelHash;
		} else if (sortType == 'Frequency and Rarity') {
			sortFunc = self._sortPhenotypesRankHash;
		} else if (sortType == 'Alphabetic') {
			sortFunc = self._sortPhenotypesAlphabeticHash;
		}

		if (typeof(sortFunc) !== 'undefined') {
			newHash.sort(sortFunc);
			for (var j in newHash){
				self._updatePhenoPos(newHash[j].id,j);
			}
		}
	},

	//NEW
	_sortPhenotypesModelHash: function(a,b) {
		var diff = b.count - a.count;
		if (diff === 0) {
			diff = a.id.localeCompare(b.id);
		}
		return diff;
	},

	//NEW
	_sortPhenotypesRankHash: function(a,b) {
		return b.sum-a.sum;
	},

	//NEW
	_sortPhenotypesAlphabeticHash: function(a,b) {
		var labelA = a.label, 
		labelB = b.label;
		if (labelA < labelB) {return -1;}
		if (labelA > labelB) {return 1;}
		return 0;
	},

	//DELETE
	_getFilteredModelList: function(start,max) {
		this.state.filteredModelList = [];

		for (var i = start; i <max; i++) {
			this.state.filteredModelList.push(this.state.modelList[i]);
		}
	},

	//generic ajax call for all queries
	//IGNORE
	_ajaxLoadData: function (target, url) {
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

	//IGNORE
	_displayResult: function(xhr, errorType, exception){
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
				msg = "We're having some problems. Please try again soon.";
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
	//IGNORE
	_finishLoad: function() {
		var species = this.state.targetSpeciesName;
		var retData = this.state.data[species];
		//extract the maxIC score
		if (typeof (retData.metadata) !== 'undefined') {
			this.state.maxICScore = retData.metadata.maxMaxIC;
		}
		var self = this;

		this.state.modelList = [];

		if (typeof (retData.b) !== 'undefined') {
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

			this._getFilteredModelList(0,this.state.modelDisplayCount);
		}
	},

	//for a given model, extract the sim search data including IC scores and the triple:
	//the a column, b column, and lowest common subsumer
	//for the triple's IC score, use the LCS score
	//TO HASH
	_loadDataForModel: function(newModelData) {
		//data is an array of all model matches
		var data = newModelData.matches;
		if (typeof(data) !== 'undefined' && data.length > 0) {
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
					"value" : lcs,
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

	//Different methods of based on the selectedCalculationMethod
	//IGNORE
	_normalizeIC: function(datarow){
		var aIC = datarow.a.IC;
		var bIC = datarow.b.IC;
		var lIC = datarow.lcs.IC;
		var nic;

		var calcMethod = this.state.selectedCalculation;
		var ics = new Array(3);

		// get 0: similarity
		nic = Math.sqrt((Math.pow(aIC-lIC,2)) + (Math.pow(bIC-lIC,2)));
		nic = (1 - (nic/+this.state.maxICScore)) * 100;
		ics[0] = nic;

		// 1 - ratio(q)
		nic = ((lIC/aIC) * 100);
		ics[1] = nic;

		// 2 - uniquenss
		nic = lIC;
		ics[2] = nic;

		// 3: ratio(t)
		nic = ((lIC/bIC) * 100);
		ics[3] = nic;

		return ics;
	},

	//IGNORE
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
		/** 3 september 2014 still a bit clunky in handling many organisms, 
		but much less hardbound. */
		this.state.colorScale={};

		for (var i in this.state.targetSpeciesList) {
			var species = this.state.targetSpeciesList[i].name;
			this.state.colorScale[species] = new Array(4);
			for (var j = 0; j <4; j++) {
				maxScore = 100;
				if (j == 2) {
					maxScore = this.state.maxICScore;
				}
				if (typeof(this.state.colorRanges[i][j]) !== 'undefined') {
					this.state.colorScale[species][j] = this._getColorScale(i, maxScore);
				}
			}
		}
	},

	//IGNORE
	_getColorScale: function(speciesIndex,maxScore) {
		var cs = d3.scale.linear();
		cs.domain([3, maxScore]);
		cs.domain(this.state.colorDomains.map(cs.invert));
		cs.range(this.state.colorRanges[speciesIndex]);
		return cs;
	},

	//IGNORE
	_initCanvas: function() {
		this._createSvgContainer();
		var svgContainer = this.state.svgContainer;
		svgContainer.append("<svg id='svg_area'></svg>");
		this.state.svg = d3.select("#svg_area");
		this._addGridTitle();
		this._createDiseaseTitleBox();
	},

	//IGNORE
	_createSvgContainer: function() {
		var svgContainer = $('<div id="svg_container"></div>');
		this.state.svgContainer = svgContainer;
		this.element.append(svgContainer);
	},

	//IGNORE
	_addGridTitle: function() {
		var species = '';

		// set up defaults as if overview
		var xoffset = this.state.overviewGridTitleXOffset;
		var foffset = this.state.overviewGridTitleFaqOffset;
		var titleText = "Cross-Species Overview";

		if (this.state.targetSpeciesName !== "Overview") {
			species= this.state.targetSpeciesName;
			xoffset = this.state.nonOverviewGridTitleXOffset;
			foffset = this.state.nonOverviewGridTitleFaqOffset;
			var comp = this._getComparisonType(species);
			titleText = "Phenotype Comparison (grouped by " + species + " " + comp + ")";
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
			.attr("width", this.state.faqImgSize)
			.attr("height",this.state.faqImgSize)
			.attr("class","faq_img")
			.on("click", function(d) {
				self._showDialog("faq");
			});
	},

	//IGNORE
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

	//TO HASH
	_resetSelections: function(type) {
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

	//IGNORE
	_addLogoImage:	 function() { 
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

	//IGNORE
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

	//TO HASH
	_highlightMatchingModels: function(curr_data){
		var label = this._getAxisData(curr_data).label;
		var alabels = this.state.svg.selectAll("text");
		for (var j in alabels[0]){
			var shortTxt = self._getShortLabel(label,self.state.labelCharDisplayCount);
			if(alabels[0][j].id == curr_data){
				alabels[0][j].style.fill = "blue";
				alabels[0][j].innerHTML = label;
			}
		}
	},

	//TO HASH
	_deselectMatchingModels: function(curr_data){
		var alabels = this.state.svg.selectAll("text");
		var label = this._getAxisData(curr_data).label;
		for (var j in alabels[0]){
			var shortTxt = this._getShortLabel(label,self.state.labelCharDisplayCount);
			if(alabels[0][j].innerHTML == label){
				alabels[0][j].style.fill = "black";
				alabels[0][j].innerHTML = shortTxt;
			}
		}
	},

	//IGNORE
	_selectModel: function(modelData, obj) {
		var self = this;
		var modelInfo = self._getAxisData(modelData);
		//create the related model rectangles
		var highlight_rect = self.state.svg.append("svg:rect")
			.attr("transform","translate(" + (self.state.textWidth + 32) + "," + self.state.yoffsetOver + ")")
			.attr("x", function(d) { return (self.state.xScale(modelData) - 1);})
			.attr("y", self.state.yoffset + 2)
			.attr("class", "model_accent")
			.attr("width", 14)
			.attr("height", (self.state.phenotypeDisplayCount * self.state.heightOfSingleModel));

		// I don't know why I'm still seeing the un-processed concept id
		// var classlabel = "text#" +this._getConceptId(modelData.model_id);

		//Show that model label is selected. Change styles to bold, blue and full-length label
		var model_label = self.state.svg.selectAll("text#" + this._getConceptId(modelData))
			.style("font-weight", "bold")
			.style("fill", "blue")
			.html(modelInfo.label);

		var concept = self._getConceptId(modelData),
		type = this.state.defaultApiEntity;

		for (var i in this.state.apiEntityMap) {
			if (concept.indexOf(this.state.apiEntityMap[i].prefix) === 0) {
				type = this.state.apiEntityMap[i].apifragment;
			}
		}

		var width = (type === this.state.defaultApiEntity)?80:200;
		var height = (type === this.state.defaultApiEntity)?50:60;

		var retData = "<strong>" + modelInfo.type + ": </strong> " + modelInfo.label + "<br/><strong>Rank:</strong> " + modelInfo.rank;

		//obj is try creating an ojbect with an attributes array including "attributes", but I may need to define
		//getAttrbitues
		//just create a temporary object to pass to the next method...
		obj = {
			attributes: [],
			getAttribute: function(keystring) {
				var ret = self.state.xScale(modelData) + 15;
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

	//IGNORE
	//I need to check to see if the modelData is an object. If so, get the model_id
	_clearModelData: function(modelData,obj) {
		this.state.svg.selectAll("#detail_content").remove();
		this.state.svg.selectAll(".model_accent").remove();
		var model_text = "";
		var mod_id = this._getConceptId(modelData);
		var modelLabel = self._getAxisData(modelData).label;

		//Show that model label is no longer selected. Change styles to normal weight, black and short label
		if (mod_id !== "") {
			model_text = this.state.svg.selectAll("text#" + mod_id);
			model_text.style("font-weight","normal");
			model_text.style("text-decoration", "none");
			model_text.style("fill", "black");

			model_text.html(this._getShortLabel(modelLabel,self.state.labelCharDisplayCount));
			this._deselectMatchingPhenotypes(modelData);
		}
	},

	//IGNORE
	_selectData: function(curr_data, obj) {
		//create a highlight row
		var self = this;
		//create the related row rectangle
		var highlight_rect = self.state.svg.append("svg:rect")
			.attr("transform","translate(" + (self.state.axis_pos_list[1]) + "," + (self.state.yoffsetOver + 4) + ")")
			.attr("x", 12)
			.attr("y", function(d) {return self._getAxisData(curr_data).ypos; }) //rowid
			.attr("class", "row_accent")
			.attr("width", this.state.modelWidth - 4)
			.attr("height", 12);

		this._resetLinks();
		var alabels = this.state.svg.selectAll("text.a_text." + curr_data);
		var txt = this._getAxisData(curr_data).label;
		if (txt === undefined) {
			txt = curr_data;
		}
		alabels.text(txt)
			.style("font-weight", "bold")
			.style("fill", "blue")
			.on("click",function(d){
				self._clickPhenotype(self.state.serverURL,curr_data);
			});
		this._highlightMatchingModels(curr_data);
	},

	//IGNORE
	_deselectData: function (curr_data) {
		this.state.svg.selectAll(".row_accent").remove();
		this._resetLinks();
		var axisLabel = this._getAxisData(curr_data).label;
		var alabels = this.state.svg.selectAll("text.a_text." + curr_data);
		alabels.text(this._getShortLabel(axisLabel));
		var data_text = this.state.svg.selectAll("text.a_text");
		data_text.style("text-decoration", "none");
		data_text.style("fill", "black");

		this._deselectMatchingModels(curr_data);
	},

	//TO HASH
	_highlightMatchingPhenotypes: function(curr_data){
		console.log(curr_data);
		var self = this;
		var models = self.state.modelDataHash;
		var curModel = this._getConceptId(curr_data);
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

	//TO HASH
	_deselectMatchingPhenotypes: function(curr_data){
		var self = this;
		self.state.svg.selectAll("text.a_text")
			.style("fill","black");
	},

	//IGNORE
	_clickPhenotype: function(url_origin,data) {
		var url = url_origin + "/phenotype/" + data;
		var win = window.open(url, '_blank');
	},

	//IGNORE
	_clickModel: function(url_origin,data) {
		var concept = self._getConceptId(data);
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

	//return a label for use in the list. This label is shortened
	//to fit within the space in the column
	//IGNORE
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

	//This method extracts the unique id from a given URI
	//for example, http://www.berkeleybop.org/obo/HP:0003791 would return HP:0003791
	//Why? Two reasons. First it's useful to note that d3.js doesn't like to use URI's as ids.
	//Second, I like to use unique ids for CSS classes. This allows me to selectively manipulate related groups of items on the
	//screen based their relationship to a common concept (ex: HP000123). However, I can't use a URI as a class.
	//IGNORE
	_getConceptId: function (uri) {
		/*if (!uri) {
		return "";
		}
		var startpos = uri.lastIndexOf("/");
		var len = uri.length;
		//remove the last > if there is one
		var endpos = uri.indexOf(">") == len-1 ? len-1 : len;
		var retString = uri + "";
		if (startpos != -1) {
		retString = uri.substring(startpos+1,endpos);
		}
		//replace spaces with underscores. Classes are separated with spaces so
		//a class called "Model 1" will be two classes: Model and 1. Convert this to "Model_1" to avoid this problem. */
		var retString = uri;
		try {
			retString = retString.replace(" ", "_");
			retString = retString.replace(":", "_");
			return retString;
		} catch (exception) {}
	},

	//IGNORE
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
			.attr("id", this._getConceptId(data))
			.attr("model_id", data)
			.attr("height", 60)
			.attr("transform", function(d) {
				return "rotate(-45)";
			})
			.on("click", function(d) {
				self._clickModel(self.state.serverURL,data);
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
			.attr("class", this._getConceptId(data) + " model_label")
			.style("font-size", "12px")
			//don't show the label if it is a dummy.
			.text( function(d) {if (label == self.state.dummyModelName) return ""; else return label;});

		el.remove();
	},

	//IGNORE
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
			//add an offset. Otherwise, the tooltip turns off the mouse event
			.attr("y", yv)
			.attr("x", wv) 
			.append("xhtml:body")
			.attr("id", "detail_text")
			.html(htmltext);
	},

	//IGNORE
	_showModelData: function(d, obj) {
		var retData;
		var modelInfo = this._getAxisData(d.model_id);
		var phenoInfo = this._getAxisData(d.pheno_id);
		var species = modelInfo.species;
		var taxon = modelInfo.taxon;
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

		retData = "<strong>Query: </strong> " + phenoInfo.label + " (IC: " + phenoInfo.IC.toFixed(2) + ")" +
			"<br/><strong>Match: </strong> " + d.b_label + " (IC: " + d.b_IC.toFixed(2) +")" +
			"<br/><strong>Common: </strong> " + d.subsumer_label + " (IC: " + d.subsumer_IC.toFixed(2) +")" +
			"<br/><strong>" + modelInfo.type +": </strong> " + modelInfo.label +
			"<br/><strong>" + prefix + ":</strong> " + d.value[this.state.selectedCalculation].toFixed(2) + suffix +
			"<br/><strong>Species: </strong> " + species + " (" + taxon + ")";
		this._updateDetailSection(retData, this._getXYPos(obj));
	},

	//IGNORE
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

	//IGNORE
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
	//area. Therefore, this is a two step process: retreive any transform data and the (x,y) pair.
	//Return the (x,y) coordinates with the transform applied
	//IGNORE
	_getXYPos: function(obj) {
		var tform = { x: 0, y: 0};
		//if a transform exisits, apply it
		if (typeof obj.attributes.transform != 'undefined') {
			var transform_str = obj.attributes.transform.value;
			tform = this._extractTransform(transform_str);
		}
		return {x: Number(obj.getAttribute("x")) + tform.x, y: Number(obj.getAttribute("y")) + tform.y};
	},

	//NOTE: I need to find a way to either add the model class to the phenotypes when they load OR
	//select the rect objects related to the model and append the class to them.
	//something like this: $( "p" ).addClass( "myClass yourClass" );
	//TO HASH
	_createModelRects: function() {
		var self = this;
		var data = this.state.filteredModelDataHash;

		var rectTranslation = "translate(" + ((this.state.textWidth + 30) + 4) + "," + (self.state.yoffsetOver + 15)+ ")";
		var model_rects = this.state.svg.selectAll(".models")
			.data( data, function(d) {
				return d.model_id + d.pheno_id;
			});
		model_rects.enter()
			.append("rect")
			.attr("transform",rectTranslation)
			.attr("class", function(d) { 
				var dConcept = (d.model_id + d.pheno_id);
				var modelConcept = self._getConceptId(d.model_id);
				//append the model id to all related items
				if (d.value[self.state.selectedCalculation] > 0) {
					var bla = self.state.svg.selectAll(".data_text." + dConcept);
					bla.classed(modelConcept, true);
				}
				return "models " + " " + modelConcept + " " + dConcept;
			})
			.attr("y", function(d, i) {
				return self._getAxisData(d.pheno_id).ypos + self.state.yoffsetOver;
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
		.attr("fill", function(d) {
			return self._getColorForModelValue(self,self._getAxisData(d.model_id).species,d.value[self.state.selectedCalculation]);
		});

		model_rects.transition()
			.delay(20)
			.style('opacity', '1.0')
			.attr("y", function(d) {
				return self._getAxisData(d.pheno_id).ypos - 10; //rowid
			})
			.attr("x", function(d) { 
				return self.state.xScale(d.model_id);
			});
		model_rects.exit().transition()
			.style('opacity', '0.0')
			.remove();
	},

	//IGNORE
	_highlightSpecies: function () {
		//create the related model rectangles
		var self = this;
		var list = [];
		var ct;
		if (self.state.targetSpeciesName == "Overview"){
			list = self.state.speciesList;
			ct = self.state.multiOrganismCt;
		} else {
			list.push(self.state.targetSpeciesName);
			ct = self.state.modelDisplayCount;
		}

		var vwidthAndGap = self.state.heightOfSingleModel;
		var hwidthAndGap = self.state.widthOfSingleModel;
		var borderStroke = self.state.detailRectStrokeWidth;
		var totCt = 0;
		var parCt = 0;

		var border_rect = self.state.svg.selectAll(".species_accent")
			.data(list)
			.enter()
			.append("rect")
			.attr("transform","translate(" + (self.state.textWidth + 30) + "," +(self.state.yoffsetOver)+ ")")
			.attr("x", function(d,i) { 
				totCt += ct;
				if (i === 0) { return 0; }
				else {
					parCt = totCt - ct;
					return hwidthAndGap * parCt;
				}
			})
			.attr("y", self.state.yoffset+1)
			.attr("class", "species_accent")
			.attr("width", function(d,i) {
				return hwidthAndGap * ct;
			})
			.attr("height", vwidthAndGap * self.state.phenotypeDisplayCount + borderStroke*2)
			.attr("stroke", "black")
			.attr("stroke-width", borderStroke)
			.attr("fill", "none");
	},

	//IGNORE
	_enableRowColumnRects: function(curr_rect){
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

	//IGNORE
	_highlightIntersection: function(curr_data, obj){
		var self = this;

		//Highlight Row
		var highlight_rect = self.state.svg.append("svg:rect")
			.attr("transform","translate(" + self.state.axis_pos_list[1] + ","+ (self.state.yoffsetOver + 4 ) + ")")
			.attr("x", 12)
			.attr("y", function(d) {return self._getAxisData(curr_data.pheno_id).ypos; }) //rowid
			.attr("class", "row_accent")
			.attr("width", this.state.modelWidth - 4)
			.attr("height", 12);

		this.state.selectedRow = curr_data;
		this.state.selectedColumn = curr_data;
		this._resetLinks();

		//To get the phenotype label from the selected rect data, we need to concat the phenotype ids to the model id 
		// that is in the 0th position in the grid. No labels exist with the curr_data.id except for the first column
		//For the overview, there will be a 0th position for each species so we need to get the right model_id

		var phen_label = this.state.svg.selectAll("text.a_text." + curr_data.pheno_id);
		var txt = self._getAxisData(curr_data.pheno_id).label;
		if (txt === undefined) {
			txt = curr_data.pheno_id;
		}
		phen_label.text(txt)
			.style("font-weight", "bold")
			.style("fill", "blue");

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

	//TO HASH
	_updateAxes: function() {
		var self = this;
		var data = [];

		//This is for the new "Overview" target option 
		if (this.state.targetSpeciesName == "Overview"){
			data = this.state.modelData;
		} else {
			data = self.state.filteredModelData;
		}
		this.state.h = (data.length * 2.5);

		self.state.yScale = d3.scale.ordinal()
			.domain(data.map(function (d) {return d.id_a; }))
			.range([0,data.length])
			.rangePoints([self.state.yModelRegion,self.state.yModelRegion + this.state.h]);

		//update accent boxes
		self.state.svg.selectAll("#rect.accent").attr("height", self.state.h);
	},

	//NOTE: FOR FILTERING IT MAY BE FASTER TO CONCATENATE THE PHENOTYPE and MODEL into an attribute

	//change the list of phenotypes and filter the models accordingly. The 
	//movecount is an integer and can be either positive or negative
	//TO HASH
	_updateModel: function(modelIdx, phenotypeIdx) {
		var self = this;
		var tempdata;
		//This is for the new "Overview" target option 
		var modelData = this.state.modelData;
		var modelList = this.state.modelList;

		//check to see if the phenotypeIdx is greater than the number of items in the list
		if (phenotypeIdx > this.state.phenoLength) {
			this.state.currPhenotypeIdx = this.state.phenotypeSortData.length;
		} else if (phenotypeIdx - (this.state.phenotypeDisplayCount - 1) < 0) {
			//check to see if the min of the slider is less than the 0
			this.state.currPhenotypeIdx = (this.state.phenotypeDisplayCount - 1);
		} else {
			this.state.currPhenotypeIdx = phenotypeIdx;
		}
		var startPhenotypeIdx = this.state.currPhenotypeIdx - this.state.phenotypeDisplayCount;

		//fix model list
		//check to see if the max of the slider is greater than the number of items in the list
		if (modelIdx > modelList.length) {
			this.state.currModelIdx = modelList.length;
		} else if (modelIdx - (this.state.modelDisplayCount - 1) < 0) {
			//check to see if the min of the slider is less than the 0
			this.state.currModelIdx = (this.state.modelDisplayCount -1);
		} else {
			this.state.currModelIdx = modelIdx;
		}
		var startModelIdx = this.state.currModelIdx - this.state.modelDisplayCount;

		//extract the new array of filtered Phentoypes
		//also update the axis
		//also update the modeldata
		var axis_idx = 0;
		this._getFilteredModelList(startModelIdx,self.state.currModelIdx);

		this._filterSelected('updateModel');
		this._clearModelLabels();

		this._createModelRegion();
		this._createModelRects();
		this._highlightSpecies();
		this._createRowLabels();
	},

	//IGNORE
	_createModelLabels: function(self) {
		var model_x_axis = d3.svg.axis().scale(self.state.xScale).orient("top");
		var mods = self._getSortedIDList(self.state.filteredModelListHash.entries());

		self.state.svg.append("g")
			.attr("transform","translate(" + (self.state.textWidth + 28) + "," + self.state.yoffset + ")")
			.attr("class", "x axis")
			.call(model_x_axis)
			//this be some voodoo...
			//to rotate the text, I need to select it as it was added by the axis
			.selectAll("text") 
			.each(function(d,i) { 
				var labelM = self._getAxisData(mods[i]).label;
				self._convertLabelHTML(self, this, self._getShortLabel(labelM,self.state.labelCharDisplayCount),mods[i]);
			});
	},

	//IGNORE
	_clearModelLabels: function() {
		this.state.svg.selectAll("g .x.axis").remove();
		this.state.svg.selectAll("g .tick.major").remove();
	},

	//IGNORE
	_createModelLines: function() {
		var modelLineGap = 10;
		var lineY = this.state.yoffset-modelLineGap;
		this.state.svg.selectAll("path.domain").remove();
		this.state.svg.selectAll("text.scores").remove();
		this.state.svg.selectAll("#specieslist").remove();

		this.state.svg.append("line")
			.attr("transform","translate(" + (this.state.textWidth + 30) + "," + lineY + ")")
			.attr("x1", 0)
			.attr("y1", 0)
			.attr("x2", this.state.modelWidth)
			.attr("y2", 0)
			.attr("stroke", "#0F473E")
			.attr("stroke-width", 1);
	},

	//IGNORE
	_createTextScores: function(list) {
		var self = this;
		var xWidth = self.state.widthOfSingleModel;

		var translation ="translate(" + (this.state.textWidth + 34) + "," + this.state.yoffset + ")"; // was yoffset -3
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
				if (d === self.state.dummyModelName) {
					return "";
				} else {
					return self._getAxisData(d).score;
				}})
			.style("font-weight","bold")
			.style("fill",function(d) {
				//console.log("_createTextScores: " + d + ", " + self._getAxisData(d).species + ", " + self._getAxisData(d).score);
				return self._getColorForModelValue(self,self._getAxisData(d).species,self._getAxisData(d).score);
			});
	},

	//Add species labels to top of Overview
	//IGNORE
	_createOverviewSpeciesLabels: function () {
		var self = this;
		var speciesList = [];
		if (self.state.targetSpeciesName == "Overview") {
			speciesList = self.state.speciesList;
		} else{
			speciesList.push(self.state.targetSpeciesName);
		}
		var translation = "translate(" + (self.state.textWidth + 30) +"," + (self.state.yoffset + 10) + ")";

		var xPerModel = self.state.modelWidth/speciesList.length;
		var species = self.state.svg.selectAll("#specieslist")
			.data(speciesList)
			.enter()
			.append("text")
			.attr("transform",translation)
			.attr("x", function(d,i){ return (i + 1 / 2 ) * xPerModel;})
			.attr("id", "specieslist")
			.attr("y", 10)
			.attr("width", xPerModel)
			.attr("height", 10)
			.attr("fill", "#0F473E")
			.attr("stroke-width", 1)
			.text(function (d,i){return speciesList[i];})
			.attr("text-anchor","middle");
	},

	// we might want to modify this to do a dynamic http retrieval to grab the dialog components...
	//IGNORE
	_showDialog: function(name){
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

	//IGNORE
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
	 * scales
	 *
	 */
	 //IGNORE
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
			.attr("width", self.state.textWidth + 5)
			.attr("height", gridHeight)
			.attr("id", function(d, i) {
				if(i === 0) {return "leftrect";}
				else if(i == 1) {return "centerrect";}
				else {return "rightrect";}
			})	
			.style("opacity", '0.4')
			.attr("fill", function(d, i) {
				return i != 1 ? d3.rgb("#e5e5e5") : "white";
			});

		return gridHeight + self.state.yModelRegion;
	},

	/* Build out the positions of the 3 boxes */
	//TO HASH
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
	//IGNORE
	_createModelRegion: function () {
		var self = this;
		var modsHash = [];

		//This is for the new "Overview" target option 
		if (this.state.targetSpeciesName == "Overview"){
			modsHash = this._updateOverviewPos(this.state.modelListHash.entries());
		} else {
			modsHash = this.state.filteredModelListHash.entries();
		}
		var mods = self._getSortedIDList(modsHash);

		this.state.xScale = d3.scale.ordinal()
			.domain(mods.map(function (d) {return d; }))
			.rangeRoundBands([0,this.state.modelWidth]);

		this._createModelLabels(self);
		this._createModelLines();
		this._createTextScores(mods);
		this._createOverviewSpeciesLabels();
	},

	//IGNORE
	_addPhenogridControls: function() {
		var phenogridControls = $('<div id="phenogrid_controls"></div>');
		this.element.append(phenogridControls);
		this._createSelectionControls(phenogridControls);
	},
 
 	//TO HASH
	_addGradients: function() {
		var self = this;
		var modData = this.state.modelData;
		var temp_data = modData.map(function(d) { return d.value[self.state.selectedCalculation];} );
		var diff = d3.max(temp_data) - d3.min(temp_data);
		var y1;

		//only show the scale if there is more than one value represented
		//in the scale
		if (diff > 0) {
			// baseline for gradient positioning
			if (this.state.phenoLength < this.state.defaultPhenotypeDisplayCount) {
				y1 = 172;
			} else {
				y1 = 262;
			}
			this._buildGradientDisplays(y1);
			this._buildGradientTexts(y1);
		}
	},
	/**
	 * build the gradient displays used to show the range of colors
	 */
	//IGNORE
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
		} else {	//This is not the overview - determine species and create single gradient
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
	 * right. This is important because this region will extend 
	 * below the main grid if there are only a few phenotypes.
	 *
	 * y1 is the baseline for computing the y position of the gradient
	 */
	 //IGNORE
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
		y = (gradientHeight * (i + 1)) + y1 + self.state.yoffset;
		//BUG. IF LOOKING AT ONLY 1 SPECIES, SOMEHOW Y IS EITHER ADDED BY 180 OR 360 AT THIS POINT. NOT OTHER VARS CHANGED
		x = self.state.axis_pos_list[2] + 205;
		var gclass = "grad_text_" + i;
		var specName = this.state.targetSpeciesList[i].name;
		var grad_text = this.state.svg.append("svg:text")
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
	 //IGNORE
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
	 //IGNORE
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
	//IGNORE
	_createOrganismSelection: function(selClass) {
		var selectedItem;
		var optionhtml = "<div id='org_div'><span id='olabel'>Species</span><br>" +
		"<span id='org_sel'><select id='organism'>";

		for (var idx in this.state.targetSpeciesList) {
			selectedItem = "";
			if (this.state.targetSpeciesList[idx].name === this.state.targetSpeciesName) {
				selectedItem = "selected";
			}
			optionhtml += "<option value=\"" + this.state.targetSpeciesList[idx.name] +
			"\" " + selectedItem + ">" + this.state.targetSpeciesList[idx].name + "</option>";
		}
		// add one for overview.
		if (this.state.targetSpeciesName === "Overview") {
			selectedItem = "selected";
		} else {
			selectedItem = "";
		}
		optionhtml += "<option value=\"Overview\" " + selectedItem + ">Overview</option>";

		optionhtml += "</select></span></div>";
		return $(optionhtml);
	},

	/** 
	* create the html necessary for selecting the calculation 
	*/
	//IGNORE
	_createCalculationSelection: function () {
		var optionhtml = "<span id='calc_div'><span id='clabel'>Display</span>"+
			"<span id='calcs'> <img class='faq_img' src='" + this.state.scriptpath + "../image/greeninfo30.png'></span>" + 
			"<span id='calc_sel'><select id='calculation'>";

		for (var idx in this.state.similarityCalculation) {
			var selecteditem = "";
			if (this.state.similarityCalculation[idx].calc === this.state.selectedCalculation) {
				selecteditem = "selected";
			}
			optionhtml += "<option value='" + this.state.similarityCalculation[idx].calc + "' " + selecteditem + ">" +
				this.state.similarityCalculation[idx].label + "</option>";
		}
		optionhtml += "</select></span></span>";
		return $(optionhtml);
	},

	/** 
	* create the html necessary for selecting the sort
	*/
	//IGNORE
	_createSortPhenotypeSelection: function () {
		var optionhtml ="<span id='sort_div'> <span id='slabel' >Sort Phenotypes</span>" +
			"<span id='sorts'> <img class='faq_img' src='" + this.state.scriptpath + "../image/greeninfo30.png'></span>" +
			"<span><select id='sortphenotypes'>";

		for (var idx in this.state.phenotypeSort) {
			var selecteditem = "";
			if (this.state.phenotypeSort[idx] === this.state.selectedSort) {
				selecteditem = "selected";
			}
			optionhtml += "<option value='" + "' " + selecteditem + ">" + this.state.phenotypeSort[idx] + "</option>";
		}
		optionhtml += "</select></span>";
		return $(optionhtml);
	},

	//this code creates the text and rectangles containing the text 
	//on either side of the model data
	//IGNORE
	_createRowLabels: function() {
		// this takes some 'splaining
		//the raw dataset contains repeats of data within the
		//A,subsumer, and B columns.
		//If d3 sees the same label 4 times (ex: Abnormality of the
		//pharynx) then it will 
		//create a rectangle and text for it 4 times. Therefore, I
		//need to create a unique set of
		//labels per axis (because the labels can repeat across axes)
		var self = this;
		var pad = 14;

		var list = self._getSortedIDList(self.state.filteredPhenotypeListHash.entries());

		var rect_text = this.state.svg
			.selectAll(".a_text")
			.data(list, function(d) { return d; });
		rect_text.enter()
			.append("text")
			.attr("class", function(d) {
				return "a_text data_text " + d;
			})
		//store the id for this item. This will be used on click events
			.attr("ontology_id", function(d) {
				return d;
			})
			.attr("x", 208)
			.attr("y", function(d) {
				return self._getAxisData(d).ypos + 10;
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
				var txt = self._getAxisData(d).label;
				if (txt === undefined) {
					txt = d;
				}
				return self._getShortLabel(txt);
			});

		this._buildUnmatchedPhenotypeDisplay();

		rect_text.transition()
			.style('opacity', '1.0')
			.delay(5)
			.attr("y", function(d) {
				return self._getAxisData(d).ypos + self.state.yoffsetOver + pad;
			});
		rect_text.exit()
			.transition()
			.delay(20)
			.style('opacity', '0.0')
			.remove();
	},

	//TO HASH
	_getUnmatchedPhenotypes: function(){
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

	//TO HASH
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

	//TO HASH
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

	//TO HASH
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

	//IGNORE
	_matchedClick: function(checkboxEl) {
		if (checkboxEl.checked) {
			// Do something special
			$("#unmatched").show();
		} else {
			// Do something else
			$("#unmatched").hide();
		}
	},

	//IGNORE
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

	//IGNORE
	_toProperCase: function (oldstring) {
		return oldstring.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
	},

	//given an array of phenotype objects 
	//edit the object array.
	// items are either ontology ids as strings, in which case they are handled as is,
	// or they are objects of the form
	// { "id": <id>, "observed": <obs>} .
	// in that case take id if "observed" is "positive"
	//IGNORE
	_filterPhenotypeResults: function(phenotypelist) {
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
	}

	}); //end of widget code
})(jQuery);