/**
 * Created by paulparsons on 1/27/15.
 */

(function() {

	var angularChromosomeVis = angular.module('angularChromosomeVis', []);

	/**
	 * service that retrieves DAS model
	 */
	angularChromosomeVis.factory('dasLoader', function() {
		return {
			loadModel: function (segment, assembly) {
				return JSDAS.Simple.getClient("http://www.ensembl.org/das/Homo_sapiens.GRCh" + assembly + ".karyotype");
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
			deleteChrSelectors: function (chr) {
				selectors = _.reject(selectors, function(sel) {
					return sel.chr == chr;
				});
				$rootScope.$broadcast('selectors:updated', selectors);
			},
			deleteAll: function () {
				selectors = [];
				$rootScope.$broadcast('selectors:updated', selectors); //notify listeners and provide the new selectors array
				$rootScope.$broadcast('selectors:deleted');
			}
		};
	}])

	angularChromosomeVis.directive('chromosome', ['dasLoader', 'chrSelectors', function(dasLoader, chrSelectors) {

		/**
		 * API to inject into dependee directives
		 * @param $scope, directive scope
		 */
		function chrAPI ($scope) {
			/**
			 * Return bands under the active selector
			 * @returns {{dasModel: *, getSelectedBands: Function}}
			 */
			this.getActiveSelection = function () {
				return {
					dasModel: $scope.dasModel,
					getSelectedBands: function() {
						var sel = $scope.activeSelector;
						this.selStart = sel.start;
						this.selEnd = sel.end;
						this.sensitivity = getSensitivityValue(sel.start, sel.end);

						var selectedBands = [];

						if (typeof this.dasModel!== 'undefined' && !_.isEmpty(this.dasModel)) {
							for (var i = 0; i < this.dasModel.bands.length; ++i) {
								var band = this.dasModel.bands[i];

								var bStart = +band.START.textContent;
								var bEnd = +band.END.textContent;

								var selStart = this.selStart - this.sensitivity;
								var selEnd = this.selEnd + this.sensitivity;

								if ((selStart >= bStart && selStart < bEnd) ||
									(selEnd > bStart && selEnd <= bEnd) ||
									(selStart <= bStart && selEnd >= bEnd)) {

									selectedBands.push({
										start: bStart,
										end: bEnd,
										id: band.id,
										type: band.TYPE.id
									});
								}
							}
						}

						return {
							bands: selectedBands,
							sensitivity: getSensitivityValue(sel.start, sel.end)
						};
					}
				};
			}

			this.getActiveSelector = function () {
				return $scope.activeSelector;
			}

			this.getAttrs = function () {
				if ($scope.width === 'inherit') {
					return {
						chr: $scope.chr,
						width: $scope.widthVal
					}
				}

			}
		};

		/**
		 * Get sensitivity value to search on both directions
		 * Unit is base pairs, not width/pixels of svg
		 * @param start, selector start point
		 * @param end, selector end point
		 */
		function getSensitivityValue(start, end) {

			// Max value to search
			var defaultMax = 1000000;

			// Default % for one side
			var s = (end - start) * 0.10;

			return s > defaultMax ? defaultMax : s;
		}

		function link(scope, element, attr) {

			//set default scope values if not provided
			scope.relSize = angular.isDefined(scope.relSize) ? scope.relSize : true;
			scope.assembly = angular.isDefined(scope.assembly) ? scope.assembly : 37;
			scope.height = angular.isDefined(scope.height) ? scope.height : 20;
			scope.axis = angular.isDefined(scope.axis) ? scope.axis : true;
			scope.mode = angular.isDefined(scope.mode) ? scope.mode : "multi";
			scope.centromere = angular.isDefined(scope.centromere) ? scope.centromere : "line";
			scope.geneviewMap = angular.isDefined(scope.geneviewMap) ? scope.geneviewMap : false;

			var dasModel;
			scope.selectors = { list: [] }; //holds selector objects
			scope.selectorsSelected = function() {
				var sel = false;
				angular.forEach(scope.selectors.list, function(val, key) {
					if (val.selected === true)
						sel = true;
				});
				return sel;
			}

			scope.activeSelector = {}; //currently selected selector

			var CHR1_BP_END = 248956422,
				STALK_MAG_PC = 0.8,
				PADDING = 30,
				LABEL_PADDING = 24,
				AXIS_SPACING = 4,
				STALK_SPACING = 3;

			var containerHeight = scope.axis ? scope.height + (2 * PADDING) : scope.height + PADDING;

			var target = d3.select(element[0]).select('.chromosome')
				.style({"height": containerHeight + "px"})
				.append('svg')
				.attr('id', scope.id + 'svg') //take id from the scope
				.attr({width: '100%'})
				.attr({height: containerHeight});

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
						scope.dasModel = dasModel;

						var rangeTo;

						if (scope.width === 'inherit') {
							var svgWidth = target[0][0].getBoundingClientRect().width;
							scope.widthVal = svgWidth;
							rangeTo = scope.relSize ? ((+dasModel.stop / CHR1_BP_END) * svgWidth) : svgWidth;
						}
						else {
							rangeTo = scope.relSize ? ((+dasModel.stop / CHR1_BP_END) * scope.width)  : scope.width;
						}

						var xscale = d3.scale.linear()
							.domain([dasModel.start, dasModel.stop])
							.range([0, rangeTo]);

						var band = target.selectAll("chromosome" + " g")
							.data(dasModel.bands)
							.enter().append("g");

						band.append("title")
							.text(function(m) {return m.id; });

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
								return (m.TYPE.id === "band:stalk") ? (PADDING + STALK_SPACING) : PADDING;
							});

						//centromere options
						if (scope.centromere === 'line') {
							// Centromere line option
							target.append('line')
								.style('stroke', 'red')
								.style('stroke-width', 2)
								.attr('x1', xscale(centromereLocation))
								.attr('y1', PADDING)
								.attr('x2', xscale(centromereLocation))
								.attr('y2', PADDING + scope.height);
						}

						else if (scope.centromere === 'dot') {
							//centromere dot option
							target.append('circle')
								.classed('centromere', true)
								.attr('cx', xscale(centromereLocation))
								.attr('cy', PADDING - 6)
								.attr('r', 5);
						}

						var label = target.append("text")
							.attr("class", "band-lbl")
							.attr("y", LABEL_PADDING);

						band.on("mouseover", function (m) {
							label.text(m.id)
								.attr('x', (xscale(m.START.textContent)));
						});

						band.on("mouseout", function (m) {
							label.text(''); //empty the label
						});

						band.on("click", function (m) {
							var start = +m.START.textContent,
								end = +m.END.textContent;

							if (scope.mode === 'multi' || (scope.mode === "single" && scope.selectors.list.length == 0)) {
								var newSel = newSelector(scope, xscale, start, end, (PADDING - AXIS_SPACING)).draw(); //create new selector and draw it
								addSelector(newSel);//add new selector to local scope
								chrSelectors.addSelector(newSel); //add new location to the service
							}
						});

						drawSelectorMap();

						if (scope.axis) {
							var bpAxis = d3.svg.axis()
								.scale(xscale)
								.tickFormat(d3.format('s'))
								.orient("bottom");

							target.append('g')
								.attr('class', 'bp-axis')
								.attr('transform', 'translate(0,' + (scope.height + PADDING + AXIS_SPACING) + ")")
								.call(bpAxis);
						}
					}

                    function drawSelectorMap() {
                        /**
                         * Draw selector mapping to geneview directive
                         */
                        if (scope.geneviewMap) {
                            var gvmapContainer = target.append('g')
                                .classed('geneview-map', true)
                                .attr('transform', 'translate(0,' + (scope.height + PADDING + AXIS_SPACING) + ")");

                            var gvpoly = gvmapContainer.append('polygon');

	                        //handle case of width being inherited from DOM parent
	                        if (scope.width === 'inherit') {
		                        var gvScale = d3.scale.linear()
			                        .range([0, +scope.widthVal]);
	                        } else {
		                        var gvScale = d3.scale.linear()
			                        .range([0, +scope.width]);
	                        }

                            scope.$on("selector:activated", function(e, arg) {
                                var sensitivity = Math.round(getSensitivityValue(arg.start, arg.end));

                                //console.log(arg.end - arg.start, sensitivity);
                                gvScale.domain([arg.start - sensitivity, arg.end + sensitivity]);

                                var p1x = xscale(arg.end),
                                    p1y = 0,

                                    p2x = xscale(arg.start),
                                    p2y = 0,

                                    p3x = gvScale(arg.start),
                                    p3y = LABEL_PADDING + 2,

                                    p4x = gvScale(arg.end),
                                    p4y = LABEL_PADDING + 2;

                                //console.log("[",p1x, p1y,"]","[", p2x, p2y ,"]", "[",p3x, p3y,"]", "[",p4x, p4y,"]");

                                gvpoly.attr('points', p1x + "," + p1y + " " + p2x + "," + p2y + " " + p3x + "," + p3y + " " + p4x + "," + p4y)
                                    .style({
                                        "fill": "#7f7f7f",
                                        "opacity": 0.4,
                                        "stroke": "black",
                                        "stroke-width" : 1
                                    });


                            });
                        }

                    }
				}, function (err) {
					target.append("text").attr("y", 30).text("Error retrieving data model for chromosome " + scope.chr + ". Message from server: " + err.id + ", " + err.msg);
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
			}

			function newSelector(scope, xscale, start, end, yshift) {
				return new Selector({
					scope: scope,
					xscale: xscale,
					y: yshift,
					target: '#' + scope.id + 'svg'
				}).init(start, end);
			};

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

				if (self.selected) options.scope.$broadcast("selector:activated", self);
			}

			//initialize the selector
			this.init = function (start, end) {
				var brushStart;
				var brushEnd;

				self.brush = d3.svg.brush()
					.x(options.xscale)
					.extent([start, end]);

				self.start = Math.round(start);
				self.end = Math.round(end);
				self.chr = options.scope.chr;
				self.selected = false;

				self.brush.on("brush", function () {
					triggerSelectionChange();
					options.scope.$apply();
				});

				self.brush.on("brushstart", function () {
					var ext = self.brush.extent();
					brushStart = ext[0];
					brushEnd = ext[1];
				});

				//uncomment to use
				self.brush.on("brushend", function () {
					var ext = self.brush.extent();
					var newStart = ext[0];
					var newEnd = ext[1];

					//if there was no movement--i.e., just a click
					if (brushStart === newStart && brushEnd === newEnd) {

						options.scope.activeSelector = self;
						self.selected = !self.selected;
						if (_selector.classed('selector')) {
							_selector.classed('selector', false);
							_selector.classed('selected', true);
						}
						else {
							_selector.classed('selector', true);
							_selector.classed('selected', false);
						}
						options.scope.$apply();

						if (self.selected) {
							options.scope.$broadcast("selector:activated", self);
							options.scope.$broadcast('selector:newLoc'); //will draw the geneview
						}

					}

					//if there was movement
					else {
						options.scope.$broadcast('selector:newLoc'); //will redraw the geneview
					}
				});

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
				_selector.call(self.brush);
				_selector.select('.background').remove();
				return self;
			};

			this.move = function (to, from) {
				self.brush.extent([to, from]);
				var selector;
				if (self.selected === true) {
					selector = d3.select(options.target + ' .selected');
				}
				else {
					selector = d3.select(options.target + ' .selector');
				}
				selector.call(self.brush);
				return self;
			};

		};

		return {
			link: link,
			controller: chrAPI,
			restrict: 'AE',
			transclude:true,
			//template:'<div class=\"chromosome\"></div> <div ng-transclude></div>',
			templateUrl: 'views/templates/chrTempl.html',
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
			}
		}
	}]);

})();