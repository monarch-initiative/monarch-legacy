/**
 *
 * Keggerator - image annotator
 * Jeremy Espino MD MS
 * Copyright 2013 University of Pittsburgh
 *
 *


 USAGE:  the keggSource option is used to specify the base of the url to retrieve KGML data.  If omitted it defaults to
 a kegg proxy that starts with /kegg/get which is what is in monarch-ui


          var annotations = {
            pathways: ["hsa05010"],
            phenotypes: [
                {
                    "name": "diseasea",
                    "link": "http://",
                    "genes": ["hsa:348", "hsa:10975", "hsa:842"]
                },
                {
                    "name": "diseaseb",
                    "link": "http://",
                    "genes": ["hsa:348", "hsa:120892", "hsa:10975"]
                },
                {
                    "name": "diseasec",
                    "link": "http://",
                    "genes": ["hsa:348", "hsa:120892", "hsa:10975"]
                }
            ]
        }

 jQuery(document).ready(
 function () {

                    $("#keggerator").keggerator({keggSource: "./demodata", annotations: annotations});

                });
 *
 */



(function ($) {

    $.widget("ui.keggerator", {


            pathwayId: {},
            data: [],
            dataShown: [],
            diseases: [],
            pathwayImageWidth: 0,
            pathwayImageHeight: 0,
            acetate: {},
            canvasSize: 1,
            imageDiv: {},

            options: {
                colors: ["#44a293", "#dd3835", "#461313", "#a4d6d4", "#ea763b" ],
                keggSource: "/kegg/get",
                annotations: {}

            },

            _create: function () {
                this.imageDiv = this.element;

                this._init();
                this._annotate();

                return this;

            },

            _init: function () {
                this.pathwayId = {};
                this.data = [];
                this.dataShown = [];
                this.diseases = [];

                this.imageDiv.empty();
                this.imageDiv.append("<svg id='acetate'></svg>");
                this.acetate = d3.select("#acetate");

                return this;
            },

            _annotate: function () {



                // fill in select element options

                (function (self) {
                    $.get(self.options.keggSource + "/" + self.options.annotations.pathways[0]+ "/kgml", function (xml) {

                        self.diseases = self.options.annotations.phenotypes;
                        self.pathwayId = self.options.annotations.pathways[0];

                        var kgmlJson = $.xml2json(xml);

                        // update the data var with the rectangle info
                        (function (self) {
                            $.each(kgmlJson.entry, function () {
                                // only use rectangles
                                if (this.graphics.type == "rectangle") {
                                    // populate data array
                                    self.data.push({"label": this.graphics.name, "x": this.graphics.x, "y": this.graphics.y, "width": this.graphics.width, "height": this.graphics.height, "graph_id": this.name, "color": ""});
                                }
                            });
                        })(self)


                        // update the data to be shown shown with those genes that should be shown
                        self.dataShown = [];
                        self.dataShownHash = {};
                        var geneShift = 2; // the pixel offset for overlapping highlighted boxes
                        for (var j = 0; j < self.options.annotations.phenotypes.length; j++) {
                            self.diseases[j].color = self.options.colors[j];
                            for (var i = 0; i < self.data.length; i++) {
                                if (self.data[i] && self.data[i].graph_id && self.data[i].x && self.data[i].y && (self.diseases[j].genes.indexOf(self.data[i].graph_id) > -1)) {

                                    // create a new hash entry for the count
                                    var graphHashID = self.data[i].graph_id + self.data[i].x + self.data[i].y;  //uniquely identifies a pathway box
                                    if (self.dataShownHash[graphHashID] == null) {
                                        self.dataShownHash[graphHashID] = {};
                                        self.dataShownHash[graphHashID].count = -1;
                                    }
                                    self.dataShownHash[graphHashID].count = self.dataShownHash[graphHashID].count + 1;

                                    var myData = jQuery.extend(true, {}, self.data[i]) //deep copy since we are in inner loop and will use data[i] again
                                    myData.color = self.diseases[j].color;
                                    myData.disease = self.diseases[j];
                                    // shift the annotation of seen before
                                    myData.x = parseInt(myData.x) + (self.dataShownHash[graphHashID].count * geneShift);
                                    myData.y = parseInt(myData.y) + (self.dataShownHash[graphHashID].count * geneShift);

                                    self.dataShown.push(myData);

                                }
                            }
                        }


                        // formulate image url
                        var imgSrc = "http://rest.kegg.jp/get/" + self.pathwayId + "/image";
                        self._drawPathway(imgSrc);

                    });
                })(this);

            },


            // draw the pathway image
            _drawPathway: function (imgSrc) {
                var self = this;

                // preload the image to get its width and height which
                // we need to set the canvas size
                var myImage = new Image();
                myImage.name = imgSrc;
                myImage.onload = function () {
                    self.pathwayImageHeight = this.height;
                    self.pathwayImageWidth = this.width;
                    //console.log(pathwayImageHeight + "," + pathwayImageWidth);

                    var filter = self.acetate.append("defs")
                        .append("filter")
                        .attr("id", "greyscale")
                        .append("feColorMatrix")
                        .attr("type", "matrix")
                        .attr("values", "0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0 0 0 1 0");


                    self.acetate.append("svg:image")
                        .attr("id", "pathwayImage")
                        .attr("x", 0)
                        .attr("y", 0)
                        .attr("width", Math.floor(self.pathwayImageWidth))
                        .attr("height", Math.floor(self.pathwayImageHeight))
                        .attr("style", "padding: 0px 0px 0px 0px;")
                        .attr("filter", "url(#greyscale)")
                        .attr("xlink:href", imgSrc);

                    // set canvas size to image size
                    self.acetate
                        .attr("width", Math.floor(self.pathwayImageWidth))
                        .attr("height", Math.floor(self.pathwayImageHeight));

                    // draw the annotations
                    self._drawRects();

                };

                // set the image source and let magic happen
                myImage.src = imgSrc;

            },

            _drawRects: function () {
                var self = this;
                self.acetate = d3.select("#acetate");

                // draw disease/phenotype labels at top
                var dxWidth = 200;
                var dxHeight = 20;
                var disease = self.acetate.selectAll(".disease").data(self.diseases).enter().append("rect")
                    .classed("disease", true)
                    .attr("x", function (d, i) {
                        return 5 + (((dxWidth * self.canvasSize) + 5) * i)
                    })
                    .attr("y", function (d, i) {
                        return 10 * self.canvasSize
                    })
                    .attr("width", function (d) {
                        return dxWidth * self.canvasSize
                    })
                    .attr("height", function (d) {
                        return dxHeight * self.canvasSize
                    })
                    .style("fill", function (d) {
                        return d.color
                    })
                    .style("opacity", 1)

                    .on('mouseover', function (d) {
                        d3.selectAll("[disease=" + d.name.replace(/\s+/g, '_')).transition()
                            .ease('cubic-out')
                            .duration('200')
                            .style("stroke-width", function (d) {
                                return 7
                            });
                    })
                    .on('mouseout', function (d) {
                        d3.selectAll("[disease=" + d.name.replace(/\s+/g, '_')).transition()
                            .ease('cubic-out')
                            .duration('200')
                            .style("stroke-width", function (d) {
                                return 3
                            });
                    });


                self.acetate.selectAll(".diseaseTxt").data(self.diseases).enter().append("text")
                    .classed("diseaseTxt", true)
                    .attr("x", function (d, i) {
                        return 10 + (((dxWidth) + 5) * i)
                    })
                    .attr("y", function () {
                        return 20
                    })
                    .attr("dy", ".35em")
                    .text(function (d) {
                        return d.name;
                    })
                    .style("fill", "white")
                    .style("font", (10 * self.canvasSize) + "px sans-serif")
                    .style("text-anchor", "center");


                // draw rects
                self.acetate.selectAll(".gene").data(self.dataShown).enter().append("rect")
                    .attr("disease", function (d) {
                        return d.disease.name.replace(/\s+/g, '_')
                    })
                    .classed("gene", true)
                    .attr("x", function (d, i) {
                        return (Math.floor(d.x) - Math.floor(d.width / 2)) - 1
                    })
                    .attr("y", function (d, i) {
                        return (Math.floor(d.y) - Math.floor(d.height / 2)) - 2
                    })
                    .attr("width", function (d) {
                        return Math.floor(d.width) + 4
                    })
                    .attr("height", function (d) {
                        return Math.floor(d.height) + 4
                    })
                    .style("fill", function (d) {
                        return "none"
                    })
                    .style("stroke", function (d) {
                        return d.color
                    })
                    .style("stroke-width", function (d) {
                        return 3
                    })
                    .style("opacity", 1);
            }



        }
    );


})(jQuery);

