/* 
	TooltipRender

	Pseudo Decorator/Builder-like object to render the content of a tooltip.
	The tooltip consist of two 'areas', 1.) basic info area, which provides general info
	such as id, label, rank, score, etc. Most object will have these attribute. it accounts 
	for absent attributes. 2.) the action or extended info area, which render content specific to 
	performing actions such as displaying expand buttons and other specialized info.	
*/
var TooltipRender = function(url) {  //parms
	 this.url = url;
};

TooltipRender.prototype = {
	constructor:TooltipRender,

	entityHreflink: function() {
		var s = "<a href=\"" + this.url +"/" +  this.data.type +"/"+ this.id 
				+ "\" target=\"_blank\">" + this.data.label + "</a>";
		return s;
	},

	// main method for rendering tooltip content
	html: function(parms) {
		this.parent = parms.parent;
		this.data = parms.data;
		this.id = parms.id;
		var inf =  "<strong>" + this._capitalizeString(this.data.type) + ": </strong> " + this.entityHreflink() + "<br/>" +
				   this._rank() + this._score() + this._ic();

		// depending on the type add extension info
		if (this.data.type =='phenotype'){
			inf += pheno(this);			
		} else if (this.data.type =='gene'){
			inf += gene(this);			
		} else if (this.data.type =='genotype'){
			inf += genotype(this);						
		}
		return inf;
	},
	_rank: function() {
		return (typeof(this.data.rank) !== 'undefined'?"<strong>Rank:</strong> " + this.data.rank+"<br/>":"");
	},
	_score: function() {
		return (typeof(this.data.score) !== 'undefined'?"<strong>Score:</strong> " + this.data.score+"<br/>":"");	
	},
	_ic: function() {
		return (typeof(this.data.IC) !== 'undefined'?"<strong>IC:</strong> " + this.data.IC.toFixed(2)+"<br/>":"");
	},
	_species: function() {
		return (typeof(this.data.species) !== 'undefined'?"<strong>Species:</strong> " + this.data.species+"<br/>":"");
	},

	_capitalizeString: function(word){
		if (word === undefined) {
			return "Undefined";
		} else {
			return word.charAt(0).toUpperCase() + word.slice(1);
		}
	}
};

function pheno(tooltip) {
	
	var returnHtml = "";
	var hpoExpand = false;
	var hpoData = "<br/><br/>";
	var hpoCached = tooltip.parent.state.hpoCacheHash.get(tooltip.id.replace("_", ":"));
	if (hpoCached !== null && hpoCached.active == 1){
		hpoExpand = true;

		//HACKISH, BUT WORKS FOR NOW.  LIMITERS THAT ALLOW FOR TREE CONSTRUCTION BUT DONT NEED TO BE PASSED BETWEEN RECURSIONS
		tooltip.parent.state.hpoTreesDone = 0;
		tooltip.parent.state.hpoTreeHeight = 0;
		var hpoTree = "<div id='hpoDiv'>" + tooltip.parent.buildHPOTree(tooltip.id.replace("_", ":"), hpoCached.edges, 0) + "</div>";
		if (hpoTree == "<br/>"){
			hpoData += "<em>No HPO Data Found</em>";
		} else {
			hpoData += "<strong>HPO Structure:</strong>" + hpoTree;
		}
	}
	if (!tooltip.parent.state.preloadHPO){
		if (hpoExpand){
			returnHtml = "<br/><br/>Click button to <b>collapse</b> HPO info &nbsp;&nbsp;";
			returnHtml += "<button class=\"collapsebtn\" type=\"button\" onClick=\"self._collapseHPO('" + tooltip.id + "')\"></button>";
			returnHtml += hpoData;
		} else {
			returnHtml = "<br/><br/>Click button to <b>expand</b> HPO info &nbsp;&nbsp;";
			returnHtml += "<button class=\"expandbtn\" type=\"button\" onClick=\"self._expandHPO('" + tooltip.id + "')\"></button>";
		}
	}
	else {
		returnHtml = hpoData;
	}
return returnHtml;		

}

function gene(tooltip) {
	var returnHtml = "";	
	// var instructions = "<br/><br/>Click button to <b>collapse</b> associated genotypes &nbsp;&nbsp;";
	// var button = $("<button>")
	// 				.attr("id", "thebutton")
	// 				.attr("class", "collapsebtn")
	// 				.attr("type", "button")
	// 				.attr("onClick", "self._collapseGenotypes('" + this.id + "')");
	// var h = $('<div>').append($('#thebutton').clone()).html();
	// for gene and species mode only, show genotype link
	if (tooltip.parent.state.targetSpeciesName != "Overview"){
		var isExpanded = false;
		var gtCached = tooltip.parent.state.expandedHash.get(tooltip.id);
		if (gtCached !== null) { isExpanded = gtCached.expanded;}

		//if found just return genotypes scores
		if (isExpanded) {
//					appearanceOverrides.offset = (gtCached.genoTypes.size() + (gtCached.genoTypes.size() * 0.40));   // magic numbers for extending the highlight
			returnHtml = "<br>Number of expanded genotypes: " + gtCached.genoTypes.size() +
				 "<br/><br/>Click button to <b>collapse</b> associated genotypes &nbsp;&nbsp;" +
				 "<button class=\"collapsebtn\" type=\"button\" onClick=\"self._collapseGenotypes('" + tooltip.id + "')\">" +
				 "</button>";
		} else {
			if (gtCached !== null) {
				returnHtml = "<br/><br/>Click button to <b>expand</b> <u>" + gtCached.genoTypes.size() + "</u> associated genotypes &nbsp;&nbsp;";
			} else {
				returnHtml = "<br/><br/>Click button to <b>expand</b> associated genotypes &nbsp;&nbsp;";
			}
			returnHtml += "<button class=\"expandbtn\" type=\"button\" onClick=\"self._expandGenotypes('" + tooltip.id + "')\"></button>";
		}
	}
	return returnHtml;	
}

function genotype(tooltip) {
	var returnHtml = "";
	if (typeof(info.parent) !== 'undefined' && info.parent !== null) {
		var parentInfo = tooltip.parent.state.modelListHash.get(info.parent);
		if (parentInfo !== null) {
			// var alink = this.url + "/" + parentInfo.type + "/" + info.parent.replace("_", ":");
			// var hyperLink = $("<a>")
			// 	.attr("href", alink)
			// 	.attr("target", "_blank")
			// 	.text(parentInfo.label);
			// return "<br/><strong>Gene:</strong> " + hyperLink;				

 			var genehrefLink = "<a href=\"" + tooltip.url + "/" + parentInfo.type + "/" + info.parent.replace("_", ":") + "\" target=\"_blank\">" + parentInfo.label + "</a>";
 			returnHtml = "<br/><strong>Gene:</strong> " + genehrefLink;
		}
	}
	return returnHtml;	
}
