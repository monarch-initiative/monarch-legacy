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

	var Variants = [];

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

				document.getElementById("NewHeader").style.visibility = 'visible';
				document.getElementById("Table").style.visibility = 'visible';

				var variant = target.selectAll("chromosome" + " v")
					.data(Variants)
					.enter().append("g");

				var xscale = d3.scale.linear()
					.domain([dasModel.start, dasModel.stop])
					.range([0, rangeTo]);

				//For every variant, find which band it's on and have the band register it
				variant.each(function(v){
					band.each(function(m) {
						if (parseInt(m.START.textContent) <= parseInt(v.start) && parseInt(v.start) <= parseInt(m.END.textContent)) {
							m.density.push(v);
						}
					});
				});

				//Variable to hold the number of variants the most populated band has
				var densityMax = 0;
				var densityMult = true;
				var variant_circle;

				variant_circle = band.append('circle')
							.attr('cx', function(m){
								//Loop through all the bands to get the densityMax before the style below
								if(densityMax < m.density.length){
									densityMax = m.density.length;
								}

								//Return the middle of the band as the x value
								return xscale(m.START.textContent) + ((xscale(+m.END.textContent) - xscale(+m.START.textContent)) / 2);
							})
							.attr('cy', function(){
								return BAND_HEIGHT - 6;
							})
							.attr('r', 5)
							.style('fill', function(m) {
								//Make the densityMax good for a domain just once
								if(densityMult){
									densityMax = densityMax * 1.33;
									densityMult = false;
								}

								//Create a gradient of redness
								var scale = d3.scale.linear()
									.domain([0, (densityMax / 2), densityMax])
									.range(["white", "red", "black"]);

								//Get the color reflective of the density on each band
						return scale(Number(m.density.length));
					});

				//Create a text label to display when variant circles are hovered over
				var varLabel = target.append("text")
					.attr("class", "var-lbl")
					.attr("y", LABEL_PADDING - 7);

				variant_circle.on("mouseover", function (m) {
					varLabel.text("Variants: " + m.density.length)
						.attr('x', xscale(m.START.textContent));
				});

				variant_circle.on("mouseout", function () {
					varLabel.text(''); //empty the label
				});
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
/*
						var variation1 = target.selectAll("chromosome" + " v")
							.data(Variants1)
							.enter().append("g");

						var variation2 = target.selectAll("chromosome" + " b")
							.data(Variants2)
							.enter().append("g");

						var variation3 = target.selectAll("chromosome" + " n")
							.data(Variants3)
							.enter().append("g");

*/

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
/*
						variation1.append('circle')
							.attr('cx', function(m){
									return xscale(m.START.textContent) + ((xscale(+m.END.textContent) - xscale(+m.START.textContent)) / 2);
							})
							.attr('cy', function(){
								return BAND_HEIGHT - 6;
							})
							.attr('r', 5)
							.style('fill', function(m){
								//Create a scale with the color associated with the phenotype
								if(m.TYPE.vid1 === "nervous"){
									var scale = d3.scale.linear()
										.domain([-2, 20, 40])
										.range(["white", "red", "black"]);
								}
								else if(m.TYPE.vid1 === "skeletal"){
									var scale = d3.scale.linear()
										.domain([-5, 20, 40])
										.range(["white", "green", "black"]);
								}
								else if(m.TYPE.vid1 === "head"){
									var scale = d3.scale.linear()
										.domain([-5, 20, 40])
										.range(["white", "blue", "black"]);
								}

								var num = Number(m.TYPE.variant1); //Get how many variants are on a band

								//Don't want the dot to get full black
								if(num >= 30){
									num = 30;
								}

								return scale(num); //Return a relative shade of red

							});

						variation2.append('circle')
							.attr('cx', function(m){
								return xscale(m.START.textContent) + ((xscale(+m.END.textContent) - xscale(+m.START.textContent)) / 2);
							})
							.attr('cy', function(){
								return BAND_HEIGHT - 16;
							})
							.attr('r', 5)
							.style('fill', function(m){
								//Create a scale with the color associated with the phenotype
								if(m.TYPE.vid2 === "nervous"){
									var scale = d3.scale.linear()
										.domain([-2, 20, 40])
										.range(["white", "red", "black"]);
								}
								else if(m.TYPE.vid2 === "skeletal"){
									var scale = d3.scale.linear()
										.domain([-5, 20, 40])
										.range(["white", "green", "black"]);
								}
								else if(m.TYPE.vid2 === "head"){
									var scale = d3.scale.linear()
										.domain([-5, 20, 40])
										.range(["white", "blue", "black"]);
								}

								var num = Number(m.TYPE.variant2); //Get how many variants are on a band

								//Don't want the dot to get full black
								if(num >= 30){
									num = 30;
								}

								return scale(num); //Return a relative shade of red

							});

						variation3.append('circle')
							.attr('cx', function(m){
								return xscale(m.START.textContent) + ((xscale(+m.END.textContent) - xscale(+m.START.textContent)) / 2);
							})
							.attr('cy', function(){
								return BAND_HEIGHT - 26;
							})
							.attr('r', 5)
							.style('fill', function(m){
								//Create a scale with the color associated with the phenotype
								if(m.TYPE.vid3 === "nervous"){
									var scale = d3.scale.linear()
										.domain([-2, 20, 40])
										.range(["white", "red", "black"]);
								}
								else if(m.TYPE.vid3 === "skeletal"){
									var scale = d3.scale.linear()
										.domain([-5, 20, 40])
										.range(["white", "green", "black"]);
								}
								else if(m.TYPE.vid3 === "head"){
									var scale = d3.scale.linear()
										.domain([-5, 20, 40])
										.range(["white", "blue", "black"]);
								}

								var num = Number(m.TYPE.variant3); //Get how many variants are on a band

								//Don't want the dot to get full black
								if(num >= 30){
									num = 30;
								}

								return scale(num); //Return a relative shade of red

							});

*/

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
								//Display selected bands information in table
								var table = document.getElementById("myTable");
								table.insertRow().insertCell(0).innerHTML = "Empty";

								for(var variant in Variants) {
									var obj = Variants[variant];
									if (obj.start >= start && obj.end <= end) {
										var row = table.insertRow();
										row.insertCell(0).innerHTML = obj.id;
										row.insertCell(1).innerHTML = obj.feature_closure_label[2];
									}
									else if (obj.start > end) {
										break;
									}
								}

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

			this.delete = function () {
				_selector.remove();
				_initialized = false;
			};

			function triggerSelectionChange () {
				var ext = self.brush.extent();
				self.start = Math.round(ext[0]);
				self.end = Math.round(ext[1]);

				var table = document.getElementById("myTable");
				table.innerHTML = "";
				table.insertRow();
				//Display selected bands information in table
				for(var variant in Variants) {
					var obj = Variants[variant];

					if (obj.start >= self.start && obj.end <= self.end) {
						var row = table.insertRow();
						row.insertCell(0).innerHTML = obj.id;
						row.insertCell(1).innerHTML = obj.feature_closure_label[2];
					}
					else if (obj.start > self.end) {
						break;
					}
				}
			}

			//initialize the selector
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