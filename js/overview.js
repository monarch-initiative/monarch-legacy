/**
 * Module to generate overview tabs
 *
 * Initial goals are to replace mustache with jquery
 * Longer term we want to replace jquery with angular
 *
 * @module overview
 */
var Q = require('q');
var MonarchCommon = require('./monarch-common.js');
import {scaleLinear} from 'd3-scale';
import {axisTop} from 'd3-axis';
import {select} from 'd3-selection';

function launchBrowser(id, root, reference_id, reference_label) {

    // Conf
    // Global scigraph url passed in from webapp.js addCoreRenderers
    var srv = global_scigraph_url;

    var manager = new bbop.rest.manager.jquery(bbop.rest.response.json);

    if (!root) {
        root = "HP:0000118";
    }

    // Browser.
    var browser = new bbop.monarch.widget.browse(srv, manager, id, root, 'brw', reference_id, reference_label, {
        'info_icon': 'info',
        'current_icon': 'current_term',
        'base_icon_url': '/image',
        'image_type': 'gif',
        'info_button_callback':
            function (term_acc, term_doc) {
                // // Local form.
                // shield.draw(term_doc);
                // Remote form (works).
                //shield.draw(term_acc);
            }
    });

    browser.init_browser(id);
}

function getOntologyBrowser(id, label, root) {

    var spinner_args = {
        'generate_id': true,
        'class':
            'progress progress-striped active',
        'style': 'width: 3em; display:inline-block; margin-top:3px; margin-left:10px;'
    };
    var spinner = makeSpinnerDiv(spinner_args);

    jQuery('#brw').append(spinner.to_string());

    //Determine if ID is clique leader
    var qurl = global_scigraph_url + "dynamic/cliqueLeader/" + id + ".json";

    jQuery.ajax({
        url: qurl,
        dataType: "json",
        error: function () {
            console.log('error fetching clique leader');
            launchBrowser(id, root);
        },
        success: function (data) {
            var graph = new bbop.model.graph();
            graph.load_json(data);
            var node_list = [];
            node_list = graph.all_nodes();
            if (node_list.length !== 1) {
                // An error occurred, there can only be one
                launchBrowser(id, root);
            } else {
                var leader_id = node_list[0].id();
                launchBrowser(leader_id, root, id, label);
            }

        }
    });
}

function fetchLiteratureOverview(id) {
    var spinner = makeSpinnerDiv();
    jQuery('#overview').append(spinner.to_string());

    var parseEFetch = function (data) {
        jQuery('#' + spinner.get_id()).remove();
        var xml = jQuery(data);

        //Get abstract text and add to DOM
        var abstractText = xml.find("AbstractText");
        var abstractElt = '<p><span style=\"font-weight:bold\">Abstract</span>: '
            + abstractText.text() + '</p>';
        jQuery("#overview").append(abstractElt);

        //get MESH term description
        var meshHeadings = xml.find("MeshHeading");
        //console.log(meshHeadings);
        var meshTerms = [];
        meshHeadings.each(function (i, heading) {
            var headXML = jQuery(heading);
            meshTerms.push(headXML.children("DescriptorName").text());
        });
        var meshTermsAsString = meshTerms.join(', ');
        var meshElt = '</br><p><span style=\"font-weight:bold\">Mesh Terms</span>: '
            + meshTermsAsString + '</p>';
        jQuery("#overview").append(meshElt);
    };
    var onError = function (data) {
        jQuery('#' + spinner.get_id()).remove();
        console.log("Error fetching from ncbi EFetch Service");
    };

    Q(MonarchCommon.fetchPubmedAbstract(id)).then(parseEFetch, onError);

}

function countIsoforms(data) {

    let isoform_count = 0;
    // gene level
    for (let i in data) {
        let feature = data[i];
        feature.children.forEach(function (geneChild) {
            // isoform level
            if (geneChild.type == 'mRNA') {
                isoform_count += 1;
            }
        });
    }
    return isoform_count;
}

function findRange(data) {
    let fmin = -1;
    let fmax = -1;

    for (let d in data) {
        if (fmin < 0 || data[d].fmin < fmin) {
            fmin = data[d].fmin;
        }
        if (fmax < 0 || data[d].fmax > fmax) {
            fmax = data[d].fmax;
        }
    }


    return {
        fmin: fmin
        , fmax: fmax
    };
}

// http://docs.mygene.info/en/latest/doc/data.html#species
function getSpeciesFromTaxId(taxid) {

    switch(taxid){
        case 9606:
            return 'Homo sapiens';
        case 10090:
            return 'Mus musculus';
        case 10116:
            return 'Rattus norvegicus';
        case 7227:
            return 'Drosophila melanogaster';
        case 6239:
            return 'Caenorhabditis elegans';
        case 7955:
            return 'Danio rerio';
        // unsupported
        // case 3702:
        //     return 'Arabidopsis thaliana';
        // case 8364:
        //     return 'Xenopus tropicalis';
        // case 9823:
        //     return 'Sus scrofa';
        default:
            return null;
    }



    
}

function hideGeneDescription(spinner) {
    console.log('fetchGeneDescription. No Genome Features fetched from mygene');
    jQuery('#mygene-feature').hide();
    jQuery('#' + spinner.get_id()).remove();
}

function fetchGeneDescription(geneID) {
    //https://mygene.info/v2/query?q=6469&fields=summary
    const spinnerArgs = {
        id: 'my-gene-spinner',
        class: 'progress progress-striped active',
        style: 'width: 3em;display:inline-block; margin:0;'
    };
    const spinner = MonarchCommon.makeSpinnerDiv(spinnerArgs);
    jQuery('#mygene-container').show();
    jQuery('#mygene-container .node-description').append(spinner.to_string());

    const serviceURL = 'https://mygene.info/v3/query';
    let formattedID = '';
    // http://docs.mygene.info/en/latest/doc/data.html#species
    //Format, see http://docs.mygene.info/en/latest/doc/query_service.html#available-fields
    var speciesParam = 'all';

    if (geneID.match(/^NCBIGene/)) {
        formattedID = geneID.replace(/\S+:(\d+)/, '$1');
    } else if (geneID.match(/^OMIM/)) {
        formattedID = geneID.replace(/\S+:(\d+)/, 'mim:$1');
        speciesParam = 'Homo sapiens'
    } else if (geneID.match(/^MGI/)) {
        formattedID = geneID.replace(/\S+:(\d+)/, 'mgi:MGI\\\\:$1');
        speciesParam = 'Mus musculus'
    } else if (geneID.match(/^FlyBase/)) {
        formattedID = geneID.replace(/\S+:(\d+)/, 'flybase:$1');
        speciesParam = 'Drosophila melanogaster'
    } else if (geneID.match(/^Wormbase/)) {
        formattedID = geneID.replace(/\S+:(\d+)/, 'wormbase:$1');
        speciesParam = 'Caenorhabditis elegans'
    } else if (geneID.match(/^ZFIN/)) {
        formattedID = geneID.replace(/\S+:(\d+)/, 'zfin:$1');
        speciesParam = 'Danio rerio'
    } else if (geneID.match(/^RGD/)) {
        formattedID = geneID.replace(/\S+:(\d+)/, 'rgd:$1');
        speciesParam = 'Rattus norvegicus'
    } else {
        formattedID = geneID
    }
    const params = {
        q: formattedID,
        fields: 'summary,genomic_pos,name,symbol,taxid',
        species: speciesParam
    };

    jQuery.ajax({
        url: serviceURL,
        dataType: 'json',
        data: params,
        error() {
            console.log('fetchGeneDescription. Error fetching info from mygene');
            jQuery('#mygene-container').hide();
            jQuery('#' + spinner.get_id()).remove();
        },
        success(data) {
            jQuery('#' + spinner.get_id()).remove();
            if (data.hits.length > 0 && 'genomic_pos' in data.hits[0]) {
                let hit = data.hits[0];
                let symbol = hit.symbol;
                let locationObj = hit.genomic_pos;
                let taxid = hit.taxid ;
                if (locationObj) {
                    // sometimes data is not on the genomic position
                    if(!taxid){
                        taxid = locationObj.taxid;
                    }
                    // use this mapping: http://docs.mygene.info/en/latest/doc/data.html#species
                    let thisSpecies = getSpeciesFromTaxId(taxid);
                    if(!thisSpecies){
                        console.log('Species not found from mygene.info.  Not showing genome features.');
                        hideGeneDescription(spinner);
                        return ;
                    }

                    let defaultTrackName = 'All Genes'; // this is the generic track name
                    let locationString = locationObj.chr + ':' + locationObj.start + '..' + locationObj.end;
                    let apolloServerPrefix = 'https://agr-apollo.berkeleybop.io/apollo/';
                    let trackDataPrefix = apolloServerPrefix + 'track/' + encodeURI(thisSpecies) + '/' + defaultTrackName + '/' + encodeURI(locationString) + '.json';
                    let trackDataWithHighlight = trackDataPrefix + '?name=' + symbol;


                    jQuery.ajax({
                        url: trackDataWithHighlight,
                        dataType: 'json',
                        error() {
                            console.log('Failed to fetch the genome feature data');
                        },
                        success(data) {
                            // http://jbrowse.alliancegenome.org/jbrowse/index.html?data=data%2FDanio rerio&tracks=All Genes&highlight=&lookupSymbol=sox9b
                            let externalUrl = 'http://jbrowse.alliancegenome.org/jbrowse/index.html?data=data%2F'+thisSpecies+'&tracks=All Genes&loc='+encodeURI(locationString);
                            let svgDataElt = '' +
                                '<a href="'+externalUrl+'">' +
                                '<svg id="genome-feature">' +
                                +'</svg>'
                            +'</a>';
                            jQuery('#mygene-feature').append(svgDataElt);


                            let dataRange = findRange(data);
                            let view_start = dataRange.fmin;
                            let view_end = dataRange.fmax;
                            let exon_height = 10; // will be white / transparent
                            let cds_height = 10; // will be colored in
                            let isoform_height = 40; // height for each isoform
                            let isoform_view_height = 20; // height for each isoform
                            let isoform_title_height = 0; // height for each isoform
                            let utr_height = 4; // this is the height of the isoform running all of the way through
                            let arrow_height = 20;
                            let arrow_width = 10;
                            let arrow_points = '0,0 0,' + arrow_height + ' ' + arrow_width + ',' + arrow_width;
                            let calculatedHeight = '600px';
                            let numberIsoforms = countIsoforms(data);
                            if (numberIsoforms > this.MAX_ISOFORMS) {
                                calculatedHeight = (this.MAX_ISOFORMS + 2) * isoform_height;
                            }
                            else {
                                calculatedHeight = (numberIsoforms + 1) * isoform_height;
                            }
                            let margin = {top: 8, right: 30, bottom: 30, left: 40},
                                width = 960 - margin.left - margin.right,
                                height = calculatedHeight - margin.top - margin.bottom;

                            // MEAT here
                            let x = scaleLinear()
                                .domain([view_start, view_end])
                                .range([0, width]);

                            let tickFormat = x.tickFormat(5, '.2s');

                            let xAxis = axisTop(x)
                                .ticks(10, 's')
                                .tickSize(8)
                                .tickFormat(tickFormat);

                            let viewer = select('#genome-feature')
                                .attr('width', width + margin.left + margin.right)
                                .attr('height', height + margin.top + margin.bottom)
                                .append('g')
                                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

                            let isoform_count = 0;
                            let MAX_ISOFORMS = 10;
                            for (let i in data) {

                                let feature = data[i];
                                let featureChildren = feature.children;
                                let selected = feature.selected;

                                featureChildren.forEach(function (featureChild) {
                                    let featureType = featureChild.type;
                                    if (featureType == 'mRNA') {
                                        if (isoform_count < MAX_ISOFORMS) {
                                            isoform_count += 1;

                                            viewer.append('polygon')
                                                .attr('class', 'GF trans_arrow')
                                                .attr('points', arrow_points)
                                                .attr('transform', function () {
                                                    if (feature.strand > 0) {
                                                        return 'translate(' + Number(x(feature.fmax)) + ',' + Number((isoform_view_height / 2.0) - (arrow_height / 2.0) + (isoform_height * isoform_count) + isoform_title_height) + ')';
                                                    }
                                                    else {
                                                        return 'translate(' + Number(x(feature.fmin)) + ',' + Number((isoform_view_height / 2.0) + (arrow_height / 2.0) + (isoform_height * isoform_count) + isoform_title_height) + ') rotate(180)';
                                                    }
                                                });

                                            viewer.append('rect')
                                                .attr('class', 'GF UTR')
                                                .attr('x', x(feature.fmin))
                                                .attr('y', isoform_height * isoform_count + isoform_title_height)
                                                .attr('transform', 'translate(0,' + ( (isoform_view_height / 2.0) - (utr_height / 2.0)) + ')')
                                                .attr('height', utr_height)
                                                .attr('width', x(feature.fmax) - x(feature.fmin));

                                            viewer.append('text')
                                                .attr('class', 'GF transcriptLabel')
                                                .attr('x', x(feature.fmin) + 30)
                                                .attr('y', isoform_height * isoform_count + isoform_title_height)
                                                .attr('fill', selected ? 'sandybrown' : 'gray')
                                                .attr('opacity', selected ? 1 : 0.5)
                                                .attr('height', isoform_title_height)
                                                .text(featureChild.name);

                                            // have to sort this so we draw the exons BEFORE the CDS
                                            featureChild.children = featureChild.children.sort(function (a, b) {
                                                if (a.type == 'exon' && b.type != 'exon') {
                                                    return -1;
                                                }
                                                else if (a.type == 'CDS' && b.type != 'CDS') {
                                                    return 1;
                                                }
                                                else {
                                                    return a - b;
                                                }
                                            });

                                            featureChild.children.forEach(function (innerChild) {
                                                let innerType = innerChild.type;
                                                if (innerType == 'exon') {
                                                    viewer.append('rect')
                                                        .attr('class', 'GF exon')
                                                        .attr('x', x(innerChild.fmin))
                                                        .attr('y', isoform_height * isoform_count + isoform_title_height)
                                                        .attr('transform', 'translate(0,' + ( (isoform_view_height / 2.0) - (exon_height / 2.0)) + ')')
                                                        .attr('height', exon_height)
                                                        .attr('z-index', 10)
                                                        .attr('width', x(innerChild.fmax) - x(innerChild.fmin));
                                                }
                                                else if (innerType == 'CDS') {
                                                    viewer.append('rect')
                                                        .attr('class', 'GF CDS')
                                                        .attr('x', x(innerChild.fmin))
                                                        .attr('y', isoform_height * isoform_count + isoform_title_height)
                                                        .attr('transform', 'translate(0,' + ( (isoform_view_height / 2.0) - (cds_height / 2.0)) + ')')
                                                        .attr('z-index', 20)
                                                        .attr('height', cds_height)
                                                        .attr('width', x(innerChild.fmax) - x(innerChild.fmin));
                                                }
                                            });
                                        }
                                        else if (isoform_count == MAX_ISOFORMS) {
                                            ++isoform_count;
                                            viewer.append('a')
                                                .attr('class', 'GF transcriptLabel')
                                                .attr('xlink:href', externalUrl)
                                                .attr('xlink:show', 'new')
                                                .append('text')
                                                .attr('x', x(feature.fmin) + 30)
                                                .attr('y', isoform_height * isoform_count + isoform_title_height)
                                                .attr('fill', 'red')
                                                .attr('opacity', 1)
                                                .attr('height', isoform_title_height)
                                                .text('Maximum features displayed.  See full view for more.');
                                        }
                                    }
                                });
                            }


                            if (isoform_count == 0) {
                                viewer.append('text')
                                    .attr('x', 30)
                                    .attr('y', isoform_title_height + 10)
                                    .attr('fill', 'orange')
                                    .attr('opacity', 0.6)
                                    // .attr('height', isoform_title_height)
                                    .text('Overview of non-coding genome features unavailable at this time.');
                            }
                            else {
                                viewer.append('g')
                                    .attr('class', 'GF axis')
                                    .attr('width', width)
                                    .attr('height', 20)
                                    .attr('transform', 'translate(0,20)')
                                    .call(xAxis);
                            }

                        }
                    });
                }
            }
            else {
                hideGeneDescription(spinner);
            }

            if (data.hits.length > 0 && 'summary' in data.hits[0]) {
                var hit = data.hits[0];
                var summary = hit.summary;
                var summaryElt = "<span>" + summary + ' [Retrieved from ' +
                    '<a href="' +
                    serviceURL + '?q=' + formattedID + '&fields=summary&species=all' +
                    '">Mygene.info</a>]</span>';
                jQuery('#mygene-description').append(summaryElt);

            }
            else {
                console.log('fetchGeneDescription. No Summary fetching info from mygene');
                jQuery('#mygene-description').hide();
                jQuery('#' + spinner.get_id()).remove();
            }
        }
    });
}

exports.getOntologyBrowser = getOntologyBrowser;
exports.launchBrowser = launchBrowser;
exports.fetchLiteratureOverview = fetchLiteratureOverview;
exports.fetchGeneDescription = fetchGeneDescription;

