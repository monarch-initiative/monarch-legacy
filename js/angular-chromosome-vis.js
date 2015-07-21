/**
 * Created by paulparsons on 1/27/15. Extended by Mark Paraschuk 06/2015.
 */

(function() {

	$(document).ready(function(){
		var counter = 0;
		$("#myTable th").each(function(){
			var width = $('.MyTable tr:last td:eq(' + counter + ')').width();
			$("#NewHeader tr").append(this);
			this.width = width;
			counter++;
		});
	});

	var angularChromosomeVis = angular.module('angularChromosomeVis', []);

	var Variants = [],
		subOn = true,
		copOn = true,
		seqOn = true,
		insOn = true;

	var vertical = true;

	/**
	 * service that retrieves DAS model
	 */

	angularChromosomeVis.factory('dasLoader', function() {
		return {
			loadModel: function (scope, assembly) {

				var returnStuff = JSDAS.Simple.getClient("http://www.ensembl.org/das/Homo_sapiens.GRCh" + assembly + ".karyotype");

				return returnStuff;
			}
		}
	});


	/**
	 * service that maintains an array of selectors. can be injected into any controller, directive, etc.
	 */
	angularChromosomeVis.factory('chrSelectors', ['$rootScope', function($rootScope) {
		"use strict";
		var selectors = []; //holds a list of all selectors that are input by the user

		return {
			getSelectors: function () {
				return selectors;
			},
			addSelector: function (selector) {
				selectors.push(selector);
				$rootScope.$broadcast('selectors:updated', selectors); //notify listeners and provide the new selectors array
			},
			deleteSelector: function (selector) {
				selectors = _.without(selectors, selector);
				$rootScope.$broadcast('selectors:updated', selectors); //notify listeners and provide the new selectors array
			},
			deleteAll: function () {
				selectors = [];
				$rootScope.$broadcast('selectors:updated', selectors); //notify listeners and provide the new selectors array
				$rootScope.$broadcast('selectors:deleted');
			}
		};
	}]);

	angularChromosomeVis.directive('chromosome', ['dasLoader', 'chrSelectors', function(dasLoader, chrSelectors) {

		function link(scope, element, attr) {

			//set default scope values if not provided
			scope.relSize = angular.isDefined(scope.relSize) ? scope.relSize : true;
			scope.assembly = angular.isDefined(scope.assembly) ? scope.assembly : 37;
			scope.height = angular.isDefined(scope.height) ? scope.height : 100;
			scope.axis = angular.isDefined(scope.axis) ? scope.axis : true;
			scope.mode = angular.isDefined(scope.mode) ? scope.mode : "multi";
			scope.centromere = angular.isDefined(scope.centromere) ? scope.centromere : "line";

			var dasModel;
			var band;

			scope.selectors = { list: [] }; //holds selector objects

			var CHR1_BP_END = 248956422,
				STALK_MAG_PC = 0.8,
				PADDING = 70,
				BAND_HEIGHT = 70,
				LABEL_PADDING = 125,
				AXIS_SPACING = 5,
				STALK_SPACING = 3;

			var rangeTo,
				variantNumber;

			var target = d3.select(element[0]).append('svg');
			target.attr('id', scope.id + 'svg'); //take id from the scope
			target.attr({height: '450px'});

			if (scope.axis) {
				target.attr({width: scope.height + (5 * PADDING)});
			} else {
				target.attr({width: scope.height + PADDING});
			}

			var text = document.getElementById("numberVariants");
			var button = document.getElementById("getVariant");

			function loadVariants(){

				console.log(Variants);
				var subVar = [],
					copVar = [],
					seqVar = [],
					insVar = [];

				document.getElementById("Table").style.visibility = 'visible';
				document.getElementById("Form").style.visibility = 'visible';

				var variant = target.selectAll("chromosome" + " v")
					.data(Variants)
					.enter().append("g");

				var xscale = d3.scale.linear()
					.domain([dasModel.start, dasModel.stop])
					.range([0, rangeTo / 2]);

				//Classify each type of variant
				//For every variant, find which band it's on and have the band register it
				variant.each(function(v){
					if (v.feature_closure_label[2] == "copy_number_variation") {
						copVar.push(v);
					}
					else if (v.feature_closure_label[2] == "sequence_alteration") {
						seqVar.push(v);
					}
					else if (v.feature_closure_label[2] == "insertion") {
						insVar.push(v);
					}
					else {
						subVar.push(v);
					}
					band.each(function(m) {
						if (m.START.textContent <= v.start && v.start <= m.END.textContent) {
							m.density.push(v);
						}
					});
				});

				//Variables to hold the number of variants the most populated band has
				var subMax = 0,
					copMax = 0,
					seqMax = 0,
					insMax = 0,
					subLine = 0,
					copLine = 0,
					seqLine = 0,
					insLine = 0;

				//Create a text label to display when variant circles are hovered over
				var varLabel = target.append("text")
					.attr("class", "var-lbl")
					.attr("x", LABEL_PADDING + 13);


				function drawCircle(center, height, color, density, max, type, start, end){
					var circle = target.append('circle')
						.attr('cy', center)
						.attr('cx', height)
						.attr('r', 5)
						.style('fill', function(){
							var densityMax = max * 1.33;

							//Create a gradient based on density
							var scale = d3.scale.linear()
								.domain([-(densityMax * 0.25), (densityMax / 2), densityMax])
								.range(["white", color, "black"]);

							//Get the color reflective of the density on each band
							return scale(density);
						});

					circle.on("mouseover", function () {
						varLabel.text(type + ": " + density)
							.attr('y', center);
					});

					circle.on("mouseout", function () {
						varLabel.text(''); //empty the label
					});

					circle.on("click", function () {
						if (scope.mode === 'multi' || (scope.mode === "single" && scope.selectors.list.length == 0)) {
							var newSel = newSelector(scope, xscale, start, end, (BAND_HEIGHT - AXIS_SPACING)).draw(); //create new selector and draw it
							addSelector(newSel);//add new selector to local scope
							chrSelectors.addSelector(newSel); //add new location to the service
						}
					});

				}

				//Create a text label to display when variant lines are hovered over
				var lineLabel = target.append("text")
					.attr("class", "var-lbl")
					.attr("x", LABEL_PADDING + 13);

				function drawLine(center, destination, height, prevHeight, color, density, max, type, start, end){
					var line = target.append('line')
						.attr('y1', function(){
							if(center > destination){
								return center - 5;
							}else{
								return center + 5;
							}
						})
						.attr('y2', destination)
						.attr('x1', height)
						.attr('x2', function(){
							if(center > destination){
								return prevHeight;
							}else{
								return height;
							}
						})
						.attr('stroke', color)
						.attr('stroke-width', function(){
							var densityMax = max * 1.33;

							//Create a gradient based on density
							var scale = d3.scale.linear()
								.domain([-(densityMax * 0.25), (densityMax / 2), densityMax])
								.range([0, 2.5, 5]);

							//Get the color reflective of the density on each band
							return scale(density);
						});

					line.on("mouseover", function(){
						lineLabel.text(type + ": " + density)
							.attr('y', function(){
								return (center + destination) / 2;
							});
					});

					line.on("mouseout", function () {
						lineLabel.text(''); //empty the label
					});

					line.on("click", function () {
						if (scope.mode === 'multi' || (scope.mode === "single" && scope.selectors.list.length == 0)) {
							var newSel = newSelector(scope, xscale, start, end, (BAND_HEIGHT - AXIS_SPACING)).draw(); //create new selector and draw it
							addSelector(newSel);//add new selector to local scope
							chrSelectors.addSelector(newSel); //add new location to the service
						}
					});
				}

				function drawVariants(){
					//Variables for looping through arrays
					var sIndex = 0,
						cIndex = 0,
						qIndex = 0,
						iIndex = 0,
						copHolder = BAND_HEIGHT + scope.height + 6,
						seqHolder = BAND_HEIGHT + scope.height + 6,
						insHolder = BAND_HEIGHT + scope.height + 6;


					band.each(function(m){
						//Booleans to see if the variation is in the band
						var sub = false,
							cop = false,
							seq = false,
							ins = false,
							lineEnd = false,
							lineStart = false;
						var numCircle = 0,
						    numLineEnd = 0,
							numLineStart = 0,
							lineDistance = 0,
							startHolder = 0,
							endHolder = 0;
						var height = BAND_HEIGHT + scope.height + 6,
							prevHeight = height;
						var centerBand = xscale(m.START.textContent) + ((xscale(+m.END.textContent) - xscale(+m.START.textContent)) / 2),
							startBand = m.START.textContent,
							endBand = m.END.textContent;

						if(subOn){
							//Go through all the types of variants and check if they appear in the band
							for(var s = sIndex; s < subVar.length; s++){
								//If the array is past the ending point of the band, break
								if(subVar[s].start > m.END.textContent){
									break;
								}else{
									//The variant is on the band if the end is passed the beginning
									if(subVar[s].end >= m.START.textContent){
										sub = true;
										++numCircle;

										//If the variant keeps going, draw a line to indicate so
										if(subVar[s].end > m.END.textContent){
											//For selector purposes, find the largest overlapping variant
											if(lineDistance < subVar[s].end - subVar[s].start){
												startHolder = subVar[s].start;
												endHolder = subVar[s].end;
												lineDistance = endHolder - startHolder;
											}
											prevHeight = height;
											lineEnd = true;
											++numLineEnd;
										}

										//If the variant began before, draw a line to indicate so
										if(subVar[s].start < m.START.textContent){
											//For selector purposes, find the largest overlapping variant
											if(lineDistance < subVar[s].end - subVar[s].start){
												startHolder = subVar[s].start;
												endHolder = subVar[s].end;
												lineDistance = endHolder - startHolder;
											}
											lineStart = true;
											++numLineStart;
										}

									}
								}
							}

							if(sub){
								//Change the max number of substitution variants one band has, if necessary
								if(subMax < numCircle){
									subMax = numCircle;
								}
								if(subLine < numLineEnd){
									subLine = numLineEnd;
								}
								if(subLine < numLineStart){
									subLine = numLineStart;
								}
								drawCircle(centerBand, height, "red", numCircle, subMax, "Substitutions", startBand, endBand);

								if(lineEnd){
									drawLine(centerBand, xscale(endBand), height, height, "red", numLineEnd, subLine, "Substitutions", startHolder, endHolder);
								}
								if(lineStart){
									drawLine(centerBand, xscale(startBand), height, height, "red", numLineStart, subLine, "Substitutions", startHolder, endHolder);
								}
								numCircle = 0; //Reset for the next variant
								height = height + 10; //Next circle will be higher
								lineEnd = false;
								lineStart = false;
								numLineEnd = 0;
								numLineStart = 0;
								startHolder = 0;
								endHolder = 0;
								lineDistance = 0;
							}
						}

						if(copOn){
							//Go through all the types of variants and check if they appear in the band
							for(var c = cIndex; c < copVar.length; c++){
								//If the array is past the ending point of the band, break
								if(copVar[c].start > m.END.textContent){
									break;
								}else{
									//The variant is on the band if the end is passed the beginning
									if(copVar[c].end >= m.START.textContent){
										cop = true;
										++numCircle;

										//If the variant keeps going, draw a line to indicate so
										if(copVar[c].end > m.END.textContent){
											//For selector purposes, find the largest overlapping variant
											if(lineDistance < (copVar[c].end - copVar[c].start)){
												startHolder = copVar[c].start;
												endHolder = copVar[c].end;
												lineDistance = endHolder - startHolder;
											}
											//Indicate the height for the next band to be able to correct
											prevHeight = height;
											lineEnd = true;
											++numLineEnd;
										}

										//If the variant began before, draw a line to indicate so
										if(copVar[c].start < m.START.textContent){
											//For selector purposes, find the largest overlapping variant
											if(lineDistance < (copVar[c].end - copVar[c].start)){
												startHolder = copVar[c].start;
												endHolder = copVar[c].end;
												lineDistance = endHolder - startHolder;
											}
											lineStart = true;
											++numLineStart;
										}
									}
								}
							}


							if(cop){
								//Change the max number of copy variants one band has, if necessary
								if(copMax < numCircle){
									copMax = numCircle;
								}
								if(copLine < numLineEnd){
									copLine = numLineEnd;
								}
								if(copLine < numLineStart){
									copLine = numLineStart;
								}
								drawCircle(centerBand, height, "green", numCircle, copMax, "Copy Number Variations", startBand, endBand);
								if(lineEnd){
									drawLine(centerBand, xscale(endBand), height, copHolder, "green", numLineEnd, copLine, "Copy Number Variations", startHolder, endHolder);
								}
								if(lineStart){
									drawLine(centerBand, xscale(startBand), height, copHolder, "green", numLineStart, copLine, "Copy Number Variations", startHolder, endHolder);
								}
								numCircle = 0; //Reset for the next variant
								height = height + 10; //Next circle will be higher
								copHolder = prevHeight; //The height of the current variant is saved
								lineEnd = false;
								lineStart = false;
								numLineEnd = 0;
								numLineStart = 0;
								startHolder = 0;
								endHolder = 0;
								lineDistance = 0;
							}
						}

						if(seqOn){
							//Go through all the types of variants and check if they appear in the band
							for(var q = qIndex; q < seqVar.length; q++){
								//If the array is past the ending point of the band, break
								if(seqVar[q].start > m.END.textContent){
									break;
								}else{
									//The variant is on the band if the end is passed the beginning
									if(seqVar[q].end >= m.START.textContent){
										seq = true;
										++numCircle;

										//If the variant keeps going, draw a line to indicate so
										if(seqVar[q].end > m.END.textContent){
											//For selector purposes, find the largest overlapping variant
											if(lineDistance < seqVar[q].end - seqVar[q].start){
												startHolder = seqVar[q].start;
												endHolder = seqVar[q].end;
												lineDistance = endHolder - startHolder;
											}
											//Indicate the height for the next band to be able to correct
											prevHeight = height;
											lineEnd = true;
											++numLineEnd;
										}

										//If the variant began before, draw a line to indicate so
										if(seqVar[q].start < m.START.textContent){
											//For selector purposes, find the largest overlapping variant
											if(lineDistance < seqVar[q].end - seqVar[q].start){
												startHolder = seqVar[q].start;
												endHolder = seqVar[q].end;
												lineDistance = endHolder - startHolder;
											}
											lineStart = true;
											++numLineStart;
										}
									}
								}
							}

							if(seq){
								//Change the max number of sequence variants one band has, if necessary
								if(seqMax < numCircle){
									seqMax = numCircle;
								}
								if(seqLine < numLineEnd){
									seqLine = numLineEnd;
								}
								if(seqLine < numLineStart){
									seqLine = numLineStart;
								}
								drawCircle(centerBand, height, "blue", numCircle, seqMax, "Sequence Alterations", startBand, endBand);
								if(lineEnd){
									drawLine(centerBand, xscale(endBand), height, seqHolder, "blue", numLineEnd, seqLine, "Sequence Alterations", startHolder, endHolder);
								}
								if(lineStart){
									drawLine(centerBand, xscale(startBand), height, seqHolder, "blue", numLineStart, seqLine, "Sequence Alterations", startHolder, endHolder);
								}
								numCircle = 0; //Reset for the next variant
								height = height + 10; //Next circle will be higher
								seqHolder = prevHeight; //The height of the current variant is saved
								lineEnd = false;
								lineStart = false;
								numLineEnd = 0;
								numLineStart = 0;
								startHolder = 0;
								endHolder = 0;
								lineDistance = 0;
							}
						}

						if(insOn){
							//Go through all the types of variants and check if they appear in the band
							for(var i = iIndex; i < insVar.length; i++){
								//If the array is past the ending point of the band, break
								if(insVar[i].start > m.END.textContent){
									break;
								}else{
									//The variant is on the band if the end is passed the beginning
									if(insVar[i].end >= m.START.textContent){
										ins = true;
										++numCircle;

										//If the variant keeps going, draw a line to indicate so
										if(insVar[i].end > m.END.textContent){
											//For selector purposes, find the largest overlapping variant
											if(lineDistance < insVar[i].end - insVar[i].start){
												startHolder = insVar[i].start;
												endHolder = insVar[i].end;
												lineDistance = endHolder - startHolder;
											}
											//Indicate the height for the next band to be able to correct
											prevHeight = height;
											lineEnd = true;
											++numLineEnd;
										}

										//If the variant began before, draw a line to indicate so
										if(insVar[i].start < m.START.textContent){
											//For selector purposes, find the largest overlapping variant
											if(lineDistance < insVar[i].end - insVar[i].start){
												startHolder = insVar[i].start;
												endHolder = insVar[i].end;
												lineDistance = endHolder - startHolder;
											}
											lineStart = true;
											++numLineStart;
										}
									}
								}
							}

							if(ins){
								//Change the max number of insertion variants one band has, if necessary
								if(insMax < numCircle){
									insMax = numCircle;
								}
								if(insLine < numLineEnd){
									insLine = numLineEnd;
								}
								if(insLine < numLineStart){
									insLine = numLineStart;
								}
								drawCircle(centerBand, height, "Turquoise", numCircle, insMax, "Insertions", startBand, endBand);

								if(lineEnd){
									drawLine(centerBand, xscale(endBand), height, insHolder, "Turquoise", numLineEnd, insLine, "Insertions", startHolder, endHolder);
								}
								if(lineStart){
									drawLine(centerBand, xscale(startBand), height, insHolder, "Turquoise", numLineStart, insLine, "Insertions", startHolder, endHolder);
								}
								insHolder = prevHeight; //The height of the current variant is saved
							}
						}
					});
				}


				document.getElementById("substitution").onclick = function(){
					//Remove all the circles
					target.selectAll("circle")
						.remove();

					//Remove all the lines
					target.selectAll("line")
						.remove();

					if(this.checked){
						subOn = true;
					}else{
						subOn = false;
					}

					//Redraw the circles
					drawVariants();

					//Update the table
					angular.forEach (scope.selectors.list, function(sel) {
						"use strict";
						sel.update();
					});
				};

				document.getElementById("copy_number").onclick = function(){
					//Remove all the circles
					target.selectAll("circle")
						.remove();

					//Remove all the lines
					target.selectAll("line")
						.remove();

					if(this.checked){
						copOn = true;
					}else{
						copOn = false;
					}

					//Redraw the circles
					drawVariants();

					//Update the table
					angular.forEach (scope.selectors.list, function(sel) {
						"use strict";
						sel.update();
					});
				};

				document.getElementById("sequence_alteration").onclick = function(){
					//Remove all the circles
					target.selectAll("circle")
						.remove();

					//Remove all the lines
					target.selectAll("line")
						.remove();

					if(this.checked){
						seqOn = true;
					}else{
						seqOn = false;
					}

					//Redraw the circles
					drawVariants();

					//Update the table
					angular.forEach (scope.selectors.list, function(sel) {
						"use strict";
						sel.update();
					});
				};

				document.getElementById("insertion").onclick = function(){
					//Remove all the circles
					target.selectAll("circle")
						.remove();

					//Remove all the lines
					target.selectAll("line")
						.remove();

					if(this.checked){
						insOn = true;
					}else{
						insOn = false;
					}

					//Redraw the circles
					drawVariants();

					//Update the table
					angular.forEach (scope.selectors.list, function(sel) {
						"use strict";
						sel.update();
					});
				};

				drawVariants();

				//Refresh the drawings so that the maxes are absolute
				target.selectAll("circle")
					.remove();

				target.selectAll("line")
					.remove();

				drawVariants();
			}

			button.addEventListener("click", function(){
				//Check if the input is a number
				if(!isNaN(text.value) && text.value != ''){
					//Get the variants
					variantNumber = parseInt(text.value);
					golrCall();
				}
			});

			function golrCall(){
				var gconf = new bbop.golr.conf(amigo.data.golr);
				var golr_loc = 'http://sirius.monarchinitiative.org:8080/solr/feature-location/';
				//var golr_loc = 'http://geoffrey.crbs.ucsd.edu:8080/solr/feature-location/';
				var GolrManager = new bbop.golr.manager.jquery(golr_loc, gconf);

				var customCallBack = function (res) {
					//Get the array of variants
					Variants = res._raw.response.docs;

					//Sort the variants in the order they appear on the chromosome
					Variants.sort(function(a, b){
						return Number(a.start) - Number(b.start);
					});

					loadVariants();
				};

				GolrManager.register('search', 'foo', customCallBack);
				GolrManager.set_query('*:*');
				GolrManager.set_results_count(variantNumber);
				GolrManager.search();
			}


			dasLoader.loadModel(scope.chr, scope.assembly)
				.features({segment: scope.chr}, function (res) {
					//success response
					if (res.GFF.SEGMENT.length > 0) {
						dasModel = {
							id: res.GFF.SEGMENT[0].id,
							start: res.GFF.SEGMENT[0].start,
							stop: res.GFF.SEGMENT[0].stop,
							bands: res.GFF.SEGMENT[0].FEATURE
						};
					} else {
						console.log("JSDAS results empty for segment");
					}


					if (typeof dasModel.err === 'undefined') {

						if (scope.width === 'inherit') {
							var svgWidth = target[0][0].width.baseVal.value;
							rangeTo = scope.relSize ? ((+dasModel.stop / CHR1_BP_END) * svgWidth) - PADDING : svgWidth - PADDING;
						}
						else {
							rangeTo = scope.relSize ? ((+dasModel.stop / CHR1_BP_END) * scope.width) - PADDING : scope.width - PADDING;
						}

						var xscale = d3.scale.linear()
							.domain([dasModel.start, dasModel.stop])
							.range([0, (rangeTo / 2)]);

						band = target.selectAll("chromosome" + " g")
							.data(dasModel.bands)
							.enter().append("g");

						band.append('title')
							.text(function(m) {
								//Add a variable to hold the variants on the band
								m.density = [];
								return m.id;
							});

						var centromereLocation;

						band.append('rect')
							.attr('class', function (m) {
								//Calculate centromere location
								if(m.TYPE.id === "band:acen" && (m.id.indexOf('p')==0)) {
									centromereLocation = m.END.textContent;
								}
								return m.TYPE.id.replace(':', ' ');
							})
							.attr('width', function (m) {
								return (m.TYPE.id === "band:stalk") ? (scope.height * STALK_MAG_PC) : scope.height;
							})
							.attr('height', function (m) {
								return xscale(+m.END.textContent) - xscale(+m.START.textContent);
							})
							.attr('y', function (m) {
								return xscale(m.START.textContent);
							})
							.attr('x', function (m) {
								return (m.TYPE.id === "band:stalk") ? (PADDING + STALK_SPACING) : BAND_HEIGHT;
							});


						var label = target.append("text")
							.attr("class", "band-lbl")
							.attr("x", LABEL_PADDING + 10);

						band.on("mouseover", function (m) {
							label.text(m.id)
								.attr('y', (xscale(m.START.textContent) + xscale(m.END.textContent)) / 2);
						});

						band.on("mouseout", function () {
							label.text(''); //empty the label
						});

						band.on("click", function (m) {
							var start = +m.START.textContent,
								end = +m.END.textContent;

							if (scope.mode === 'multi' || (scope.mode === "single" && scope.selectors.list.length == 0)) {
								var newSel = newSelector(scope, xscale, start, end, (BAND_HEIGHT - AXIS_SPACING)).draw(); //create new selector and draw it
								addSelector(newSel);//add new selector to local scope
								chrSelectors.addSelector(newSel); //add new location to the service
							}
						});

						if (scope.axis) {
							var bpAxis = d3.svg.axis()
								.scale(xscale)
								.tickFormat(d3.format('s'))
								.orient("left");

							target.append('g')
								.attr('class', 'bp-axis')
								.attr('transform', function(){
									if(vertical){
										return 'translate(' + (BAND_HEIGHT - AXIS_SPACING) + ')'
									}else{
										return 'translate(0,' + (scope.height + BAND_HEIGHT + AXIS_SPACING) + ')'
									}
								})
								.call(bpAxis);
						}
					}

				}, function (err) {
					//error response handler
					console.log("Error from DAS loader: " + err);
				});


			function addSelector(sel) {
				"use strict";
				scope.$apply(function() {
					scope.selectors.list.push(sel);
				})
			}

			//when all selectors have been deleted from outside
			scope.$on('selectors:deleted', function(event) {
				angular.forEach (scope.selectors.list, function(sel) {
					"use strict";
					sel.delete();
				});
				scope.selectors.list = []; //delete locally
			});

			scope.delSelector = function(sel) {
				"use strict";
				sel.delete();
				scope.selectors.list = _.without(scope.selectors.list, sel) //delete locally
				chrSelectors.deleteSelector(sel); //delete from the service
			};

			function newSelector(scope, xscale, start, end, yshift) {
				return new Selector({
					scope: scope,
					xscale: xscale,
					y: yshift,
					target: '#' + scope.id + 'svg'
				}).init(start, end);
			}
		}

		/**
		 * selector object for chromosome. uses D3 brush
		 * @param opt - options for the selector
		 * @constructor
		 */
		function Selector (opt) {

			var self = this,
				_selector,
				_initialized;

			var AXIS_SPACING = 4,
				BAND_HEIGHT = 70;

			var options = (function () {
				return _.extend({}, {
					//DEFAULT OPTIONS
					height: 20,
					y:9
				}, opt || {});
			}());

			function makeRow(variant, table){
				var row = table.insertRow();
				row.insertCell(0).innerHTML = variant.feature[0];
				row.insertCell(1).innerHTML = variant.feature_closure_label[0];
				row.insertCell(2).innerHTML = variant.chromosome_closure_label[0];
				row.insertCell(3).innerHTML = variant.start;
				row.insertCell(4).innerHTML = variant.end;
			}

			this.update = function (){
				var table = document.getElementById("myTable");
			//	document.getElementById("Table").style.width = table.offsetWidth;
				//Delete all the previous rows
				for(var i = (table.rows.length - 1); i > 0; i--){
					table.deleteRow(i);
				}
				//Display selected bands information in table
				for(var v = 0; v < Variants.length; v++) {
					var obj = Variants[v];

					//Only display those that are actively selected
					if(obj.feature_closure_label[2] == "substitution" && subOn){
						if (obj.start <= self.end && obj.end >= self.start) {
							makeRow(obj, table);
						}
						else if (obj.start > self.end) {
							break;
						}
					}
					else if(obj.feature_closure_label[2] == "copy_number_variation" && copOn){
						if (obj.start <= self.end && obj.end >= self.start) {
							makeRow(obj, table);
						}
						else if (obj.start > self.end) {
							break;
						}
					}
					else if(obj.feature_closure_label[2] == "sequence_alteration" && seqOn){
						if (obj.start <= self.end && obj.end >= self.start) {
							makeRow(obj, table);
						}
						else if (obj.start > self.end) {
							break;
						}
					}
					else if(obj.feature_closure_label[2] == "insertion" && insOn){
						if (obj.start <= self.end && obj.end >= self.start) {
							makeRow(obj, table);
						}
						else if (obj.start > self.end) {
							break;
						}
					}
				}
			};

			this.delete = function () {
				var table = document.getElementById("myTable");
				//Delete all the previous rows
				for(var j = (table.rows.length - 1); j > 0; j--){
					table.deleteRow(j);
				}
				_selector.remove();
				_initialized = false;
			};

			function triggerSelectionChange () {
				var ext = self.brush.extent();
				self.start = Math.round(ext[0]);
				self.end = Math.round(ext[1]);

				self.update();
			}

			//initialize the selector and table
			this.init = function (start, end) {
				self.brush = d3.svg.brush()
					.y(options.xscale)
					.extent([start, end]);

				self.start = Math.round(start);
				self.end = Math.round(end);

				self.brush.on("brush", function () {
					triggerSelectionChange();
					options.scope.$apply();
				});

				//uncomment to use
				//self.brush.on("brushend", function () {
				//	//do something here on brush end
				//});

				_selector = d3.select(options.target).append("g")
					.classed('selector', true)
					.attr('transform',"translate(" + BAND_HEIGHT + ")")
					.call(self.brush);

				_selector.selectAll('rect')
					.attr('width', options.height + (AXIS_SPACING * 2));

				_initialized = true;

				this.update();

				return self;
			};


			this.draw = function () {
				if (!_initialized) self.init();
				_selector.select('.background').remove();
				_selector.call(self.brush);
				return self;
			};

			this.move = function (to, from) {
				self.brush.extent([to, from]);
				var selector = d3.select(options.target + ' .selector');
				selector.call(self.brush);
				this.update();
				return self;
			};

		}


		return {
			link: link,
			restrict: 'AE',
			scope: {
				chr: '@',
				relSize: '=?',
				assembly: '=?',
				width: '@',
				height: '=?',
				axis: '=?',
				mode: '@',
				id: '@',
				centromere: '@',
				geneviewMap: '=?'
			},
		template: '<h5>Chromosome {{chr}}</h5>' +
		'<p ng-repeat="selector in selectors.list">' +
		'<input type="number" ng-model="selector.start" ng-change="selector.move(selector.end, selector.start)"> : <input type="number" ng-model="selector.end" ng-change="selector.move(selector.end, selector.start)"> ' +
		'<button class="btn btn-xs btn-danger" ng-click="delSelector(selector)">delete</button>' +
		'</p>'
		}
	}]);

})();