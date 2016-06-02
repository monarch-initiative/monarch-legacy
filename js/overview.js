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

function launchBrowser(id, root, reference_id, reference_label) {

        // Conf
        // Global scigraph url passed in from webapp.js addCoreRenderers
        var srv = global_scigraph_url;

        var manager = new bbop.rest.manager.jquery(bbop.rest.response.json);

        if (!root){
            root = "HP:0000118";
        }

        // Browser.
        var browser = new bbop.monarch.widget.browse(srv, manager, id, root, 'brw', reference_id, reference_label, {
            'info_icon': 'info',
            'current_icon': 'current_term',
            'base_icon_url': '/image',
            'image_type': 'gif',
            'info_button_callback':
                function(term_acc, term_doc){
                    // // Local form.
                    // shield.draw(term_doc);
                    // Remote form (works).
                    //shield.draw(term_acc);
                }
        });

        browser.init_browser(id);
}

function getOntologyBrowser(id, label, root){

    var spinner_args = {'generate_id': true,
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
        dataType:"json",
        error: function (){
            console.log('error fetching clique leader');
            launchBrowser(id, root);
        },
        success: function ( data ){
            var graph = new bbop.model.graph();
            graph.load_json(data);
            var node_list = [];
            node_list = graph.all_nodes();
            if (node_list.length > 1) {
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
        jQuery('#'+spinner.get_id()).remove();
        var xml = jQuery(data);
        
        //Get abstract text and add to DOM
        var abstractText = xml.find( "AbstractText" );
        var abstractElt = '<p><span style=\"font-weight:bold\">Abstract</span>: '
            + abstractText.text() + '</p>';
        jQuery("#overview").append(abstractElt);
        
        //get MESH term description
        var meshHeadings = xml.find("MeshHeading");
        //console.log(meshHeadings);
        var meshTerms = [];
        meshHeadings.each( function (i, heading) {
            var headXML = jQuery(heading);
            meshTerms.push(headXML.children("DescriptorName").text());
        });
        var meshTermsAsString = meshTerms.join(', ');
        var meshElt = '</br><p><span style=\"font-weight:bold\">Mesh Terms</span>: '
            + meshTermsAsString + '</p>';
        jQuery("#overview").append(meshElt);
    };
    var onError = function (data) {
        jQuery('#'+spinner.get_id()).remove();
        console.log("Error fetching from ncbi EFetch Service");
    };
    
    Q(MonarchCommon.fetchPubmedAbstract(id)).then(parseEFetch, onError);
    
}

if (typeof (loaderGlobals) === 'object') {
    loaderGlobals.getOntologyBrowser = getOntologyBrowser;
    loaderGlobals.launchBrowser = launchBrowser;
    loaderGlobals.fetchLiteratureOverview = fetchLiteratureOverview;
}
if (typeof (global) === 'object') {
    global.getOntologyBrowser = getOntologyBrowser;
    global.launchBrowser = launchBrowser;
    global.fetchLiteratureOverview = fetchLiteratureOverview;
}