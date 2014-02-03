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
    var canvasSize = .5;

    function init(imageDiv) {

        initCanvas(imageDiv);

    }

    function initCanvas(imageDiv) {

        imageDiv.append("<svg id='acetate'></svg>");

    }

    function updateCanvas(pathway_id) {

        var imgSrc = "http://rest.kegg.jp/get/" + pathway_id + "/image";
        acetate = d3.select("#acetate");

        // retrieve image size
        drawPathway(imgSrc);
    }

    function drawRects() {

        acetate = d3.select("#acetate");


        // draw disease
        var dxWidth = 100;
        var dxHeight = 20;
        var disease = acetate.selectAll(".disease").data(diseases).enter().append("rect")
            .classed("disease", true)
            .attr("x", function (d, i) {
                return 5 + ((dxWidth + 5) * i)
            })
            .attr("y", function (d, i) {
                return 10
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
            .classed("diseaseTxt",true)
            .attr("x", function (d, i) {
                return 10 + ((dxWidth + 5) * i)
            })
            .attr("y", function () {
                return 20
            })
            .attr("dy", ".35em")
            .text(function (d) {
                return d.name;
            })
            .style("fill", "white")
            .style("font", "10px sans-serif")
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


    function drawPathway(imgSrc) {
        console.log("got image source " + imgSrc);
        var myImage = new Image();
        myImage.name = imgSrc;
        myImage.onload = function () {
            pathwayImageHeight = this.height;
            pathwayImageWidth = this.width;
            console.log(pathwayImageHeight + "," + pathwayImageWidth);

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

            drawRects();

        };
        myImage.src = imgSrc;

    }


    function annotate(pathway_ids, diseaseList) {
        pathwayId = pathway_ids[0];
        diseases = diseaseList;
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
            for (var i = 0; i < data.length; i++) {
                var d = data[i];
                for (var j = 0; j < diseases.length; j++) {
                    diseases[j].color = colors[j];
                    if (d && d.graph_id && diseases[j].genes.indexOf(d.graph_id) > -1) {
                        d.color = colors[j];
                        dataShown.push(d);
                    }
                }
            }

            // update image
            updateCanvas(pathwayId);

        });


    }


// public methods and vars
    return {
        init: init,
        annotate: annotate
    };

}
    ();


