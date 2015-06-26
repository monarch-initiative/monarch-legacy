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
				PADDING = 50,
				BAND_HEIGHT = 50,
				LABEL_PADDING = 24,
				AXIS_SPACING = 4,
				STALK_SPACING = 3;

			var rangeTo,
				variantNumber;

			var target = d3.select(element[0]).append('svg');
			target.attr('id', scope.id + 'svg'); //take id from the scope
			target.attr({width: '100%'});

			if (scope.axis) {
				target.attr({height: scope.height + (2 * PADDING)});
			} else {
				target.attr({height: scope.height + PADDING});
			}

			var text = document.querySelector("input");
			var button = document.getElementById("getvariant");

			function loadVariants(){

				var subVar = [],
					copVar = [],
					seqVar = [],
					insVar = [];

				document.getElementById("NewHeader").style.visibility = 'visible';
				document.getElementById("Table").style.visibility = 'visible';
				document.getElementById("Form").style.visibility = 'visible';

				var variant = target.selectAll("chromosome" + " v")
					.data(Variants)
					.enter().append("g");

				var xscale = d3.scale.linear()
					.domain([dasModel.start, dasModel.stop])
					.range([0, rangeTo]);

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
					insMax = 0;

				//Create a text label to display when variant circles are hovered over
				var varLabel = target.append("text")
					.attr("class", "var-lbl")
					.attr("y", LABEL_PADDING - 7);

				function drawCircle(center, height, color, density, max){
					var densityMax = 0;
					var circle = target.append('circle')
						.attr('class', 'test')
						.attr('cx', center)
						.attr('cy', height)
						.attr('r', 5)
						.style('fill', function(){
							densityMax = max * 1.33;

							//Create a gradient based on desnity
							var scale = d3.scale.linear()
								.domain([-(densityMax * 0.25), (densityMax / 2), densityMax])
								.range(["white", color, "black"]);

							//Get the color reflective of the density on each band if there are more than 0 variants
							return scale(density);
						});

					circle.on("mouseover", function (m) {
						varLabel.text()
							.attr('x', xscale(m.START.textContent));
					});

					circle.on("mouseout", function () {
						varLabel.text(''); //empty the label
					});
				}

				function drawVariants(){
					//Variables for looping through arrays
					var sIndex = 0,
						cIndex = 0,
						qIndex = 0,
						iIndex = 0;

					band.each(function(m){
						//Booleans to see if the variation is in the band
						var sub = false,
							cop = false,
							seq = false,
							ins = false;
						var numCircle = 0;
						var height = BAND_HEIGHT - 6;
						var centerBand = xscale(m.START.textContent) + ((xscale(+m.END.textContent) - xscale(+m.START.textContent)) / 2);

						//Go through all the types of variants and check if they appear in the band
						for(var s = sIndex; s < subVar.length; s++){
							//If the array is past the ending point of the band, break
							if(subVar[s].start > m.END.textContent){
								//Make the index to start from on the next band, the last index
								sIndex = s;
								break;
							}else{
								sub = true;
								++numCircle;
								//If this is the last of the variant type, shut it down
								if((s + 1) >= subVar.length){
									sIndex = s + 1;
								}
							}
						}

						if(sub && subOn){
							//Change the max number of substitution variants one band has, if necessary
							if(subMax < numCircle){
								subMax = numCircle;
							}
							drawCircle(centerBand, height, "red", numCircle, subMax);
							numCircle = 0; //Reset for the next variant
							height = height - 10; //Next circle will be higher
						}

						//Go through all the types of variants and check if they appear in the band
						for(var c = cIndex; c < copVar.length; c++){
							//If the array is past the ending point of the band, break
							if(copVar[c].start > m.END.textContent){
								//Make the index to start from on the next band, the last index
								cIndex = c;
								break;
							}else{
								console.log(copVar[c].start + " < " + m.END.textContent);
								cop = true;
								++numCircle;
								//If this is the last of the variant type, shut it down
								if((c + 1) >= copVar.length){
									cIndex = c + 1;
								}
							}
						}

						if(cop && copOn){
							//Change the max number of copy variants one band has, if necessary
							if(copMax < numCircle){
								copMax = numCircle;
							}
							drawCircle(centerBand, height, "green", numCircle, copMax);
							numCircle = 0; //Reset for the next variant
							height = height - 10; //Next circle will be higher
						}

						//Go through all the types of variants and check if they appear in the band
						for(var q = qIndex; q < seqVar.length; q++){
							//If the array is past the ending point of the band, break
							if(seqVar[q].start > m.END.textContent){
								//Make the index to start from on the next band, the last index
								qIndex = q;
								break;
							}else{
								seq = true;
								++numCircle;
								//If this is the last of the variant type, shut it down
								if((q + 1) >= seqVar.length){
									qIndex = q + 1;
								}
							}
						}

						if(seq && seqOn){
							//Change the max number of sequence variants one band has, if necessary
							if(seqMax < numCircle){
								seqMax = numCircle;
							}
							drawCircle(centerBand, height, "blue", numCircle, seqMax);
							numCircle = 0; //Reset for the next variant
							height = height - 10; //Next circle will be higher
						}

						//Go through all the types of variants and check if they appear in the band
						for(var i = iIndex; i < insVar.length; i++){
							//If the array is past the ending point of the band, break
							if(insVar[i].start > m.END.textContent){
								//Make the index to start from on the next band, the last index
								iIndex = i;
								break;
							}else{
								ins = true;
								++numCircle;
								//If this is the last of the variant type, shut it down
								if((i + 1) >= insVar.length){
									iIndex = i + 1;
								}
							}
						}

						if(ins && insOn){
							//Change the max number of insertion variants one band has, if necessary
							if(insMax < numCircle){
								insMax = numCircle;
							}
							drawCircle(centerBand, height, "Turquoise", numCircle, insMax);
						}
					});
				}


				document.getElementById("substitution").onclick = function(){
					//Remove all the circles
					target.selectAll("circle")
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

				target.selectAll("circle")
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
				var golr_loc = 'http://geoffrey.crbs.ucsd.edu:8080/solr/feature-location/';
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
							.range([0, rangeTo]);

						band = target.selectAll("chromosome" + " g")
							.data(dasModel.bands)
							.enter().append("g");

						band.append("title")
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
							.attr('height', function (m) {
								return (m.TYPE.id === "band:stalk") ? (scope.height * STALK_MAG_PC) : scope.height;
							})
							.attr('width', function (m) {
								return xscale(+m.END.textContent) - xscale(+m.START.textContent);
							})
							.attr('x', function (m) {
								return xscale(m.START.textContent);
							})
							.attr('y', function (m) {
								return (m.TYPE.id === "band:stalk") ? (PADDING + STALK_SPACING) : BAND_HEIGHT;
							});

			/**			var key = target.append('rect')
							.attr('height', function(){
								return 85;
							})
							.attr('width', function(){
								return 500;
							})
							.attr('x', function(){
								return 20;
							})
							.attr('y', function(){
								return PADDING + 20;
							})
							.style('fill', "transparent")
							.style('stroke-width', "3")
							.style('stroke', "black");

						var data = ["Option 1", "Option 2", "Option 3"];

						var select = d3.select('body')
							.append('select')
							.attr('class','select')
							.on('change',onchange)

						var options = select.selectAll('option')
							.data(data).enter()
							.append('option')
							.text(function (d) { return d; })
							.attr('x', 30);

						function onchange() {
							selectValue = d3.select('select').property('value')
							d3.select('body')
								.append('p')
								.text(selectValue + ' is the last selected option.')
						};

						target.append('circle')
							.attr('cx', 20)
							.attr('cy', PADDING)
							.attr('r', 5)
							.style('fill', function(){
								//Create a scale with the color associated with the phenotype
								return "red";
							});

						target.append('text')
							.text("Nervous")
							.attr('y', PADDING + 40)
							.attr('x', 30);

						target.append('text')
							.text("Skeletal")
							.attr('y', PADDING + 65)
							.attr('x', 30);

						target.append('text')
							.text("Head and Neck")
							.attr('y', PADDING + 90)
							.attr('x', 30);


						target.append('text')
							.text("Hover over a band to see the band's id, and hover over a circle indicator to see how many phenotypes and of what kind are in a specific band.")
							.attr('y', PADDING + 40)
							.attr('x', 15);
					**/

						var label = target.append("text")
							.attr("class", "band-lbl")
							.attr("y", LABEL_PADDING + 5);

						band.on("mouseover", function (m) {
							label.text(m.id)
								.attr('x', xscale(m.START.textContent));
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
								.orient("bottom");

							target.append('g')
								.attr('class', 'bp-axis')
								.attr('transform', 'translate(0,' + (scope.height + BAND_HEIGHT + AXIS_SPACING) + ")")
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

			var AXIS_SPACING = 4;

			var options = (function () {
				return _.extend({}, {
					//DEFAULT OPTIONS
					height: 20,
					y:9
				}, opt || {});
			}());

			function makeRow(variant, table){
				var row = table.insertRow();
				row.insertCell(0).innerHTML = variant.id;
				row.insertCell(1).innerHTML = variant.feature_closure_label[2];
			}

			this.update = function updateTable(){
				var table = document.getElementById("myTable");
				table.innerHTML = "";
				table.insertRow().insertCell(0).innerHTML = "Empty";
				//Display selected bands information in table
				for(var v = 0; v < Variants.length; v++) {
					var obj = Variants[v];

					//Only display those that are actively selected
					if(obj.feature_closure_label[2] == "substitution" && subOn){
						if (obj.start >= self.start && obj.end <= self.end) {
							makeRow(obj, table);
						}
						else if (obj.start > self.end) {
							break;
						}
					}
					else if(obj.feature_closure_label[2] == "copy_number_variation" && copOn){
						if (obj.start >= self.start && obj.end <= self.end) {
							makeRow(obj, table);
						}
						else if (obj.start > self.end) {
							break;
						}
					}
					else if(obj.feature_closure_label[2] == "sequence_alteration" && seqOn){
						if (obj.start >= self.start && obj.end <= self.end) {
							makeRow(obj, table);
						}
						else if (obj.start > self.end) {
							break;
						}
					}
					else if(obj.feature_closure_label[2] == "insertion" && insOn){
						if (obj.start >= self.start && obj.end <= self.end) {
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
				table.innerHTML = "";
				_selector.remove();
				_initialized = false;
			};

			function triggerSelectionChange () {
				var ext = self.brush.extent();
				self.start = Math.round(ext[0]);
				self.end = Math.round(ext[1]);

				this.update();
			}

			//initialize the selector and table
			this.init = function (start, end) {
				self.brush = d3.svg.brush()
					.x(options.xscale)
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
					.attr('transform',"translate(0,"+ options.y +")")
					.call(self.brush);

				_selector.selectAll('rect')
					.attr('height', options.height + (AXIS_SPACING * 2));

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