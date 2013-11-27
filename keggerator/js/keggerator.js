/**
 *
 * Keggerator - image annotator
 * Jeremy Espino MD MS
 * Copyright 2013
 *
 */
var keggerator = function () {

    var pathwayId = {};
    var selectList = {};
    var data = [];
    var pic_real_width, pic_real_height;

    function initCanvas(imageDiv) {

        imageDiv.append("<svg id='acetate'></svg>");

    }

    function updateCanvas(pathway_id, pathwayType) {

        var imgSrc = "http://rest.kegg.jp/get/" + pathway_id + "/image";
        var acetate = d3.select("#acetate");

        setImageSize(imgSrc);

        // add pathway image as background
        acetate.append("svg:image")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 1104)
            .attr("height", 969)
            .attr("style", "padding: 0px 0px 0px 0px;")
            .attr("xlink:href", imgSrc);

        // set canvas size
        acetate
            .attr("width", 1104)
            .attr("height", 969);

        // draw rects
        var rects = acetate.selectAll("g").data(data).enter().append("g")
            .attr("transform", function (d, i) {
                return "translate(" + (d.x - Math.floor(d.width / 2)) + "," + (d.y - Math.floor(d.height / 2)) + ")";
            });
        rects.append("rect")
            .attr("width", function (d) {
                return d.width
            })
            .attr("height", function (d) {
                return d.height
            })
            .style("fill", "red")
            .style("opacity", 0.5);


    }

    function setImageSize(imgSrc) {

        $("<img/>") // Make in memory copy of image to avoid css issues
            .attr("src", imgSrc)
            .load(function () {
                pic_real_width = this.width;   // Note: $(this).width() will not
                pic_real_height = this.height; // work for in memory images.
            });
    }


    function init(imageDiv, select_list) {
        selectList = select_list;

        initCanvas(imageDiv);
    }

    function setPathwayId(pathway_id, pathwayType) {
        pathwayId = pathway_id;

        // if kegg pathway type
        // fill in select element options
        $.get("http://rest.kegg.jp/get/" + pathway_id + "/kgml", function (xml) {
            var kgmlJson = $.xml2json(xml);

            // update the select list options
            selectList.empty(); // remove old options
            $.each(kgmlJson.entry, function () {
                // only use rectangles
                if (this.graphics.type == "rectangle") {
                    selectList.append($("<option></option>").attr("value", this.name).text(this.graphics.name));
                    // populate data array
                    data.push({"label": this.graphics.name, "x": this.graphics.x, "y": this.graphics.y, "width": this.graphics.width, "height": this.graphics.height, "graph_id": this.graphics.name});
                }
            });

            // update image

            updateCanvas(pathway_id, pathwayType);

        });

        // if wikipathway type

    }


    // public methods and vars
    return {
        init: init,
        setPathwayId: setPathwayId
    };

}();


