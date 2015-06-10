/**
 * Created by paulparsons on 1/27/15. Extended by Mark Paraschuk 06/2015.
 */

(function() {

	var angularChromosomeVis = angular.module('angularChromosomeVis', []);

	/**
	 * service that retrieves DAS model
	 */
	angularChromosomeVis.factory('dasLoader', function() {
		return {
			loadModel: function (segment, assembly) {
				var returnStuff = JSDAS.Simple.getClient("http://www.ensembl.org/das/Homo_sapiens.GRCh" + assembly + ".karyotype");
				//returnStuff.push();
				return returnStuff ; 
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
			scope.selectors = { list: [] }; //holds selector objects

			var CHR1_BP_END = 248956422,
				STALK_MAG_PC = 0.8,
				PADDING = 100,
				BAND_HEIGHT = 50,
				LABEL_PADDING = 24,
				AXIS_SPACING = 4,
				STALK_SPACING = 3;

			var target = d3.select(element[0]).append('svg');
			target.attr('id', scope.id + 'svg'); //take id from the scope
			target.attr({width: '100%'});

			if (scope.axis) {
				target.attr({height: scope.height + (2 * PADDING)});
			} else {
				target.attr({height: scope.height + PADDING});
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


					//Example JSON with variants
					var TBands = [{"id":"p11.1","TYPE":{"id":"band:acen","vid1":"nervous","variant1":"3","vid2":"skeletal","variant2":"11","category":"structural","textContent":"band:acen"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"121700001"},"END":{"textContent":"123400000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"p11.2","TYPE":{"id":"band:gneg","category":"structural","textContent":"band:gneg"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"120400001"},"END":{"textContent":"121700000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"p12","TYPE":{"id":"band:gpos50","category":"structural","textContent":"band:gpos50"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"117200001"},"END":{"textContent":"120400000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"p13.1","TYPE":{"id":"band:gneg","vid1":"nervous","variant1":"5","vid2":"head","variant2":"20","category":"structural","textContent":"band:gneg"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"115500001"},"END":{"textContent":"117200000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"p13.2","TYPE":{"id":"band:gpos50","vid1":"skeletal","variant1":"10","category":"structural","textContent":"band:gpos50"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"111200001"},"END":{"textContent":"115500000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"p13.3","TYPE":{"id":"band:gneg","vid1":"skeletal","variant1":"2","vid2":"nervous","variant2":"11","category":"structural","textContent":"band:gneg"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"106700001"},"END":{"textContent":"111200000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"p21.1","TYPE":{"id":"band:gpos100","category":"structural","textContent":"band:gpos100"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"101800001"},"END":{"textContent":"106700000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"p21.2","TYPE":{"id":"band:gneg","vid1":"nervous","variant1":"15","vid2":"skeletal","variant2":"5","category":"structural","textContent":"band:gneg"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"99300001"},"END":{"textContent":"101800000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"p21.3","TYPE":{"id":"band:gpos75","category":"structural","textContent":"band:gpos75"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"94300001"},"END":{"textContent":"99300000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"p22.1","TYPE":{"id":"band:gneg","category":"structural","textContent":"band:gneg"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"91500001"},"END":{"textContent":"94300000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"p22.2","TYPE":{"id":"band:gpos75","category":"structural","textContent":"band:gpos75"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"87900001"},"END":{"textContent":"91500000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"p22.3","TYPE":{"id":"band:gneg","vid1":"head","variant1":"6","vid2":"skeletal","variant2":"13","category":"structural","textContent":"band:gneg"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"84400001"},"END":{"textContent":"87900000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"p31.1","TYPE":{"id":"band:gpos100","category":"structural","textContent":"band:gpos100"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"69300001"},"END":{"textContent":"84400000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"p31.2","TYPE":{"id":"band:gneg","vid1":"skeletal","variant1":"12","category":"structural","textContent":"band:gneg"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"68500001"},"END":{"textContent":"69300000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"p31.3","TYPE":{"id":"band:gpos50","category":"structural","textContent":"band:gpos50"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"60800001"},"END":{"textContent":"68500000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"p32.1","TYPE":{"id":"band:gneg","category":"structural","textContent":"band:gneg"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"58500001"},"END":{"textContent":"60800000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"p32.2","TYPE":{"id":"band:gpos50","category":"structural","textContent":"band:gpos50"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"55600001"},"END":{"textContent":"58500000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"p32.3","TYPE":{"id":"band:gneg","vid1":"nervous","variant1":"4","vid2":"skeletal","variant2":"15","vid3":"head","variant3":"9","category":"structural","textContent":"band:gneg"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"50200001"},"END":{"textContent":"55600000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"p33","TYPE":{"id":"band:gpos75","category":"structural","textContent":"band:gpos75"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"46300001"},"END":{"textContent":"50200000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"p34.1","TYPE":{"id":"band:gneg","category":"structural","textContent":"band:gneg"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"43700001"},"END":{"textContent":"46300000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"p34.2","TYPE":{"id":"band:gpos25","vid1":"head","variant1":"9","vid2":"skeletal","variant2":"26","category":"structural","textContent":"band:gpos25"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"39600001"},"END":{"textContent":"43700000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"p34.3","TYPE":{"id":"band:gneg","category":"structural","textContent":"band:gneg"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"34300001"},"END":{"textContent":"39600000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"p35.1","TYPE":{"id":"band:gpos25","vid1":"skeletal","variant1":"18","vid2":"head","variant2":"6","category":"structural","textContent":"band:gpos25"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"32300001"},"END":{"textContent":"34300000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"p35.2","TYPE":{"id":"band:gneg","vid1":"skeletal","variant1":"6","category":"structural","textContent":"band:gneg"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"29900001"},"END":{"textContent":"32300000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"p35.3","TYPE":{"id":"band:gpos25","category":"structural","textContent":"band:gpos25"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"27600001"},"END":{"textContent":"29900000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"p36.11","TYPE":{"id":"band:gneg","category":"structural","textContent":"band:gneg"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"23600001"},"END":{"textContent":"27600000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"p36.12","TYPE":{"id":"band:gpos25","vid1":"head","variant1":"4","category":"structural","textContent":"band:gpos25"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"20100001"},"END":{"textContent":"23600000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"p36.13","TYPE":{"id":"band:gneg","category":"structural","textContent":"band:gneg"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"15900001"},"END":{"textContent":"20100000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"p36.21","TYPE":{"id":"band:gpos50","category":"structural","textContent":"band:gpos50"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"12500001"},"END":{"textContent":"15900000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"p36.22","TYPE":{"id":"band:gneg","category":"structural","textContent":"band:gneg"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"9100001"},"END":{"textContent":"12500000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"p36.23","TYPE":{"id":"band:gpos25","category":"structural","textContent":"band:gpos25"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"7100001"},"END":{"textContent":"9100000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"p36.31","TYPE":{"id":"band:gneg","vid1":"head","variant1":"25","vid2":"skeletal","variant2":"5","vid3":"nervous","variant3":"16","category":"structural","textContent":"band:gneg"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"5300001"},"END":{"textContent":"7100000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"p36.32","TYPE":{"id":"band:gpos25","vid1":"nervous","variant1":"3","vid2":"skeletal","variant2":"6","category":"structural","textContent":"band:gpos25"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"2300001"},"END":{"textContent":"5300000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"p36.33","TYPE":{"id":"band:gneg","category":"structural","textContent":"band:gneg"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"1"},"END":{"textContent":"2300000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"q11","TYPE":{"id":"band:acen","category":"structural","textContent":"band:acen"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"123400001"},"END":{"textContent":"125100000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"q12","TYPE":{"id":"band:gvar","vid1":"skeletal","variant1":"9","category":"structural","textContent":"band:gvar"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"125100001"},"END":{"textContent":"143200000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"q21.1","TYPE":{"id":"band:gneg","category":"structural","textContent":"band:gneg"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"143200001"},"END":{"textContent":"147500000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"q21.2","TYPE":{"id":"band:gpos50","category":"structural","textContent":"band:gpos50"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"147500001"},"END":{"textContent":"150600000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"q21.3","TYPE":{"id":"band:gneg","vid1":"skeletal","variant1":"19","category":"structural","textContent":"band:gneg"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"150600001"},"END":{"textContent":"155100000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"q22","TYPE":{"id":"band:gpos50","category":"structural","textContent":"band:gpos50"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"155100001"},"END":{"textContent":"156600000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"q23.1","TYPE":{"id":"band:gneg","category":"structural","textContent":"band:gneg"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"156600001"},"END":{"textContent":"159100000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"q23.2","TYPE":{"id":"band:gpos50","category":"structural","textContent":"band:gpos50"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"159100001"},"END":{"textContent":"160500000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"q23.3","TYPE":{"id":"band:gneg","vid1":"nervous","variant1":"40","vid2":"skeletal","variant2":"23","category":"structural","textContent":"band:gneg"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"160500001"},"END":{"textContent":"165500000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"q24.1","TYPE":{"id":"band:gpos50","category":"structural","textContent":"band:gpos50"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"165500001"},"END":{"textContent":"167200000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"q24.2","TYPE":{"id":"band:gneg","category":"structural","textContent":"band:gneg"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"167200001"},"END":{"textContent":"170900000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"q24.3","TYPE":{"id":"band:gpos75","category":"structural","textContent":"band:gpos75"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"170900001"},"END":{"textContent":"173000000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"q25.1","TYPE":{"id":"band:gneg","vid1":"head","variant1":"11","category":"structural","textContent":"band:gneg"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"173000001"},"END":{"textContent":"176100000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"q25.2","TYPE":{"id":"band:gpos50","category":"structural","textContent":"band:gpos50"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"176100001"},"END":{"textContent":"180300000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"q25.3","TYPE":{"id":"band:gneg","category":"structural","textContent":"band:gneg"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"180300001"},"END":{"textContent":"185800000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"q31.1","TYPE":{"id":"band:gpos100","category":"structural","textContent":"band:gpos100"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"185800001"},"END":{"textContent":"190800000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"q31.2","TYPE":{"id":"band:gneg","vid1":"nervous","variant1":"17","vid2":"skeletal","variant2":"14","category":"structural","textContent":"band:gneg"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"190800001"},"END":{"textContent":"193800000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"q31.3","TYPE":{"id":"band:gpos100","category":"structural","textContent":"band:gpos100"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"193800001"},"END":{"textContent":"198700000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"q32.1","TYPE":{"id":"band:gneg","category":"structural","textContent":"band:gneg"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"198700001"},"END":{"textContent":"207100000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"q32.2","TYPE":{"id":"band:gpos25","category":"structural","textContent":"band:gpos25"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"207100001"},"END":{"textContent":"211300000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"q32.3","TYPE":{"id":"band:gneg","vid1":"nervous","variant1":"7","category":"structural","textContent":"band:gneg"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"211300001"},"END":{"textContent":"214400000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"q41","TYPE":{"id":"band:gpos100","category":"structural","textContent":"band:gpos100"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"214400001"},"END":{"textContent":"223900000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"q42.11","TYPE":{"id":"band:gneg","category":"structural","textContent":"band:gneg"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"223900001"},"END":{"textContent":"224400000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"q42.12","TYPE":{"id":"band:gpos25","vid1":"head","variant1":"16","category":"structural","textContent":"band:gpos25"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"224400001"},"END":{"textContent":"226800000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"q42.13","TYPE":{"id":"band:gneg","vid1":"skeletal","variant1":"24","category":"structural","textContent":"band:gneg"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"226800001"},"END":{"textContent":"230500000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"q42.2","TYPE":{"id":"band:gpos50","vid1":"skeletal","variant1":"9","vid2":"nervous","variant2":"17","category":"structural","textContent":"band:gpos50"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"230500001"},"END":{"textContent":"234600000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"q42.3","TYPE":{"id":"band:gneg","category":"structural","textContent":"band:gneg"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"234600001"},"END":{"textContent":"236400000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"q43","TYPE":{"id":"band:gpos75","category":"structural","textContent":"band:gpos75"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"236400001"},"END":{"textContent":"243500000"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]},{"id":"q44","TYPE":{"id":"band:gneg","category":"structural","textContent":"band:gneg"},"METHOD":{"id":"ensembl","textContent":"ensembl"},"START":{"textContent":"243500001"},"END":{"textContent":"248956422"},"SCORE":{"textContent":"-"},"ORIENTATION":{"textContent":"."},"GROUP":[{"id":"1","label":"Chromosome 1","type":"chromosome:1"}]}]

					if (typeof dasModel.err === 'undefined') {

						var rangeTo;

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

						var band = target.selectAll("chromosome" + " g")
							.data(TBands)
							.enter().append("g");

						var Variants1 = [];
						var Variants2 = [];
						var Variants3 = [];

						band.append("title")
							.text(function(m) {
								//Push all the bands that have variants
								if(m.TYPE.vid1){
									Variants1.push(m);
								}
								if(m.TYPE.vid2){
									Variants2.push(m);
								}
								if(m.TYPE.vid3){
									Variants3.push(m);
								}
								return m.id;
							});

						var variation1 = target.selectAll("chromosome" + " v")
							.data(Variants1)
							.enter().append("g");

						var variation2 = target.selectAll("chromosome" + " b")
							.data(Variants2)
							.enter().append("g");

						var variation3 = target.selectAll("chromosome" + " n")
							.data(Variants3)
							.enter().append("g");


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


						band.append('rect')
							.attr('class', function (m) {
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
			 **/

						target.append('text')
							.text("Hover over a band to see the band's id, and hover over a circle indicator to see how many phenotypes and of what kind are in a specific band.")
							.attr('y', PADDING + 40)
							.attr('x', 15);

						var label = target.append("text")
							.attr("class", "band-lbl")
							.attr("y", LABEL_PADDING - 7);

						var varLabel = target.append("text")
							.attr("class", "var-lbl")
							.attr("y", LABEL_PADDING - 10);

						variation1.on("mouseover", function(m){
							varLabel.text(m.TYPE.vid1 + ": " + m.TYPE.variant1)
								.attr('x', xscale(m.START.textContent));
						});

						variation1.on("mouseout", function(){
							varLabel.text('');
						});

						variation1.on("click", function(m){
							//Zoom in on band?
						});

						variation2.on("mouseover", function(m){
							varLabel.text(m.TYPE.vid2 + ": " + m.TYPE.variant2)
								.attr('x', xscale(m.START.textContent))
						});

						variation2.on("mouseout", function(){
							varLabel.text('');
						});

						variation2.on("click", function(m){
							//Zoom in on band?
						});

						variation3.on("mouseover", function(m){
							varLabel.text(m.TYPE.vid3 + ": " + m.TYPE.variant3)
								.attr('x', xscale(m.START.textContent))
						});

						variation3.on("mouseout", function(){
							varLabel.text('');
						});

						variation3.on("click", function(m){
							//Zoom in on band?
						});

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

		};


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
		'{{selector.start}}:{{selector.end}}' +
		'</p>'
		}
	}]);

})();