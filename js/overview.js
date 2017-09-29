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
    // http://docs.mygene.info/en/latest/doc/data.html#species
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
                var hit = data.hits[0];
                var symbol = hit.symbol;
                var locationObj = hit.genomic_pos;
                if (locationObj) {
                    var thisSpecies = speciesParam;
                    var defaultTrackName = 'All Genes'; // this is the generic track name
                    var locationString = locationObj.chr + ':' + locationObj.start + '..' + locationObj.end;
                    var apolloServerPrefix = 'https://agr-apollo.berkeleybop.io/apollo/';
                    var trackDataPrefix = apolloServerPrefix + 'track/' + encodeURI(thisSpecies) + '/' + defaultTrackName + '/' + encodeURI(locationString) + '.json';
                    var trackDataWithHighlight = trackDataPrefix + '?name=' + symbol;
                    var trackDataElt = '<a href="' + trackDataWithHighlight + '">link</a>';
                    jQuery('#mygene-feature').append(trackDataElt);

                    jQuery.ajax({
                        url: trackDataWithHighlight,
                        dataType: 'json',
                        error() {
                            console.log('Failed to fetch the genome feature data');
                        },
                        success(data) {
                            var svgDataElt = '' +
                                '<svg id="genome-feature">' +
                                +'</svg>';
                            jQuery('#mygene-feature').append(svgDataElt);
                            // var genomeFeature =window.document.getElementById('genome-feature') ;
                            // let calculatedHeight = this.props.height;
                            // if (!this.props.isLoading) {
                            //     let numberIsoforms = this.countIsoforms(this.props.data);
                            //     if (numberIsoforms > this.MAX_ISOFORMS) {
                            //         calculatedHeight = (this.MAX_ISOFORMS + 2) * isoform_height;
                            //     }
                            //     else {
                            //         calculatedHeight = (numberIsoforms + 1) * isoform_height;
                            //     }
                            // }
                            let calculatedHeight = 300;
                            let margin = {top: 8, right: 30, bottom: 30, left: 40},
                                width = 960 - margin.left - margin.right,
                                height = calculatedHeight - margin.top - margin.bottom;
                            let viewer = select('#genome-feature')
                                    .attr('width', width + margin.left + margin.right)
                                    .attr('height', height + margin.top + margin.bottom)
                                    .append('g')
                                    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
                            let isoform_title_height = 30;
                            viewer.append('text')
                                .attr('x',  30)
                                .attr('y',  isoform_title_height+10 )
                                .attr('fill', 'orange')
                                .attr('opacity', 0.6 )
                                // .attr('height', isoform_title_height)
                                .text('Overview of non-coding genome features unavailable at this time.');

                        }
                    });
                }
            }
            else {
                console.log('fetchGeneDescription. No Genome Features fetched from mygene');
                jQuery('#mygene-feature').hide();
                jQuery('#' + spinner.get_id()).remove();
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

