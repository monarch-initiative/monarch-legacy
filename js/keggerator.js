/**
 *
 * Keggerator - image annotator
 * Jeremy Espino MD MS
 * Copyright 2013
 *
 */
var keggerator = function () {

    var colors = ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00", "#ffff33", "#a65628", "#f781bf", "#999999"];
    var pathwayId = {};
    var data = [];
    var dataShown = [];
    var diseases = [];
    var pathwayImageWidth, pathwayImageHeight;
    var acetate = {};
    var canvasSize = 1;
    var imageDiv = {};

    // set the div where pathway will be drawn
    function setImageDiv(myImageDiv) {

        imageDiv = myImageDiv;

    }

    // initialize the contents of the pathway div
    function init() {
        pathwayId = {};
        data = [];
        dataShown = [];
        diseases = [];


        imageDiv.empty();
        imageDiv.append("<svg id='acetate'></svg>");
        acetate = d3.select("#acetate");

    }

    // draw the pathway with annotations
    // annotations object example is
    //    {
    //        pathways: ["hsa05010", "hsa05012"],
    //            phenotypes: [
    //        {
    //            "name": "diseasea",
    //            "link": "http://",
    //            "genes": ["hsa:348", "hsa:10975", "hsa:842"]
    //        },
    //        {
    //            "name": "diseaseb",
    //            "link": "http://",
    //            "genes": ["hsa:348", "hsa:120892", "hsa:10975"]
    //        },
    //        {
    //            "name": "diseasec",
    //            "link": "http://",
    //            "genes": ["hsa:348", "hsa:120892", "hsa:10975"]
    //        }
    //    ]
    //    }
    function annotate(annotations) {
        var pathway_ids = annotations.pathways;
        var phenotypeList = annotations.phenotypes;

        pathwayId = pathway_ids[0];
        diseases = phenotypeList;
        var pathwayType = "kegg";

        // if kegg pathway type
        // fill in select element options
        $.get("http://rest.kegg.jp/get/" + pathwayId + "/kgml", function (xml) {
            var kgmlJson = $.xml2json(xml);

            // update the data var with the rectangle info
            $.each(kgmlJson.entry, function () {
                // only use rectangles
                if (this.graphics.type == "rectangle") {
                    // populate data array
                    data.push({"label": this.graphics.name, "x": this.graphics.x, "y": this.graphics.y, "width": this.graphics.width, "height": this.graphics.height, "graph_id": this.name, "color": ""});
                }
            });


            // update the data to be shown shown with those genes that should be shown
            dataShown = [];
            dataShownHash = {};
            var geneShift = 2;
            for (var j = 0; j < diseases.length; j++) {
                diseases[j].color = colors[j];
                for (var i = 0; i < data.length; i++) {
                    if (data[i] && data[i].graph_id && (diseases[j].genes.indexOf(data[i].graph_id) > -1)) {

                        if (dataShownHash[data[i].graph_id] == null) {
                            dataShownHash[data[i].graph_id] = {};
                            dataShownHash[data[i].graph_id].count = -1;
                        }
                        dataShownHash[data[i].graph_id].count = dataShownHash[data[i].graph_id].count + 1; // increment counter of how many times seen this gene

                        var myData = jQuery.extend(true, {}, data[i]) //deep copy since we are in inner loop and will use data[i] again
                        myData.color = diseases[j].color;
                        myData.disease = diseases[j];
                        // shift the annotation of seen before
                        myData.x = parseInt(myData.x) + (dataShownHash[data[i].graph_id].count * geneShift);
                        myData.y = parseInt(myData.y) + (dataShownHash[data[i].graph_id].count * geneShift);

                        dataShown.push(myData);

                    }
                }
            }

            // formulate image url
            var imgSrc = "http://rest.kegg.jp/get/" + pathwayId + "/image";
            drawPathway(imgSrc);

        });
    }

    // draw the pathway image
    function drawPathway(imgSrc) {
        // preload the image to get its width and height which
        // we need to set the canvas size
        var myImage = new Image();
        myImage.name = imgSrc;
        myImage.onload = function () {
            pathwayImageHeight = this.height;
            pathwayImageWidth = this.width;
            //console.log(pathwayImageHeight + "," + pathwayImageWidth);

            // add pathway image as background
            acetate.append("svg:image")
                .attr("id", "pathwayImage")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", Math.floor(pathwayImageWidth * canvasSize))
                .attr("height", Math.floor(pathwayImageHeight * canvasSize))
                .attr("style", "padding: 0px 0px 0px 0px;")
                .attr("xlink:href", imgSrc);

            // set canvas size to image size
            acetate
                .attr("width", Math.floor(pathwayImageWidth * canvasSize))
                .attr("height", Math.floor(pathwayImageHeight * canvasSize));

            // draw the annotations
            drawRects();

        };

        // set the image source and let magic happen
        myImage.src = imgSrc;

    }


    function drawRects() {

        acetate = d3.select("#acetate");

        // draw disease/phenotype lables at top
        var dxWidth = 200;
        var dxHeight = 20;
        var disease = acetate.selectAll(".disease").data(diseases).enter().append("rect")
            .classed("disease", true)
            .attr("x", function (d, i) {
                return 5 + (((dxWidth * canvasSize)+ 5) * i)
            })
            .attr("y", function (d, i) {
                return 10 * canvasSize
            })
            .attr("width", function (d) {
                return dxWidth * canvasSize
            })
            .attr("height", function (d) {
                return dxHeight * canvasSize
            })
            .style("fill", function (d) {
                return d.color
            })
            .style("opacity", 0.7);

        acetate.selectAll(".diseaseTxt").data(diseases).enter().append("text")
            .classed("diseaseTxt", true)
            .attr("x", function (d, i) {
                return 10 + (((dxWidth * canvasSize) + 5) * i)
            })
            .attr("y", function () {
                return 20 * canvasSize
            })
            .attr("dy", ".35em")
            .text(function (d) {
                return d.name;
            })
            .style("fill", "white")
            .style("font", (10 * canvasSize) + "px sans-serif")
            .style("text-anchor", "center");


        // draw rects
        acetate.selectAll(".gene").data(dataShown).enter().append("rect")
            .classed("gene", true)
            .attr("x", function (d, i) {
                return (Math.floor(d.x * canvasSize) - Math.floor(d.width / 2 * canvasSize)) - 2
            })
            .attr("y", function (d, i) {
                return (Math.floor(d.y * canvasSize) - Math.floor(d.height / 2 * canvasSize)) - 2
            })
            .attr("width", function (d) {
                return Math.floor(d.width * canvasSize) + 4
            })
            .attr("height", function (d) {
                return Math.floor(d.height * canvasSize) + 4
            })
            .style("fill", function (d) {
                return d.color
            })
            .style("opacity", 0.7);
    }


// public methods and vars
    return {
        init: init,
        setImageDiv: setImageDiv,
        annotate: annotate
    };

}
    ();


