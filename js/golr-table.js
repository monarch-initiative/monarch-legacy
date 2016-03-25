/**
 * Arguments: - id: An identifier. One of: IRI string, OBO-style ID
 *            - field: GOlr field in which to filter on the id
 *            - div: div ID to put results table
 *            NOTE: This automatically creates a filter and pagings divs
 *                  the naming {div}-filter, {div}-paging-top, {div}_paging-bottom
 *            - filter: hash containing field and value, ex:
 *                      {
 *                          field: "subject_category"
 *                          value: 'phenotype"
 *                      }
 */

function getTableFromSolr(id, golr_field, div, filter, personality, tab_anchor){
    if (tab_anchor != null){
        var isTabLoading = false;
        jQuery('#categories a[href="'+tab_anchor+'"]').click(function(event) {
            if (!(jQuery('#'+div+' .table').length) && !isTabLoading){
                isTabLoading = true;
                getTable(id, golr_field, div, filter, personality);
            }
        });
        // Trigger a click event if we're loading the page on an href
        if ( window && window.location && window.location.hash &&
                window.location.hash != "" && window.location.hash != "#" ){
            jQuery('#categories a[href="'+window.location.hash+'"]').click();
        }
    } else {
        getTable(id, golr_field, div, filter, personality);
    }

    function getTable(id, golr_field, div, filter, personality) {
        // console.log('getTable(', id, golr_field, div, filter, personality);
        if (golr_field == null) {
            golr_field = 'object_closure';
        }

        if (personality == null){
            personality = 'generic_association';
        }

        //divs
        var pager_top_div = div+'-filter-pager-top';
        var pager_bot_div = div+'-filter-pager-bottom';
        var pager_filter = div+'-filter';

        // Conf.
        // Global golr and solr urls passed in from webapp.js addGolrStaticFiles
        var gconf = new bbop.golr.conf(global_golr_conf);
        var srv = global_solr_url;
        var handler = new bbop.monarch.handler();
        var linker = new bbop.monarch.linker();
        var confc = gconf.get_class(personality);

        // Other widget tests; start with manager.
        var golr_manager = new bbop.golr.manager.jquery(srv, gconf);

        golr_manager.set_personality(personality);
        //golr_manager.add_query_filter('document_category', 'annotation', ['*']);
        golr_manager.add_query_filter(golr_field, id, ['*']);
        golr_manager.query_variants['facet.method'] = 'enum';


        if (filter != null && filter instanceof Array && filter.length > 0){
            filter.forEach( function (val) {
                if (val != null && val.field && val.value){
                    golr_manager.add_query_filter(val.field, val.value, ['*']);
                }
            });
        }

        // Add filters.
        var f_opts = {
                'meta_label': 'Total:&nbsp;',
                'display_free_text_p': false,
                'display_meta_p': false,
                'display_accordion_p': true
        };

        // var filters = new bbop.widget.live_filters(pager_filter, golr_manager, gconf, f_opts);
        /* eslint new-cap: 0 */
        var filters = new bbop.widget.facet_filters(pager_filter, golr_manager, gconf, f_opts);
        filters.establish_display();

        //Remove sticky filter
        var remove_stick_filter = function(){

            jQuery('#'+pager_filter+' div')
                .filter(function() {
                    return this.id.match(/_sticky_filters\-id$/);
                })
                .remove();
        };

        //open species filter
        var open_species_filter = function(){
            console.log('open_species_filter');
            jQuery('#'+pager_filter+' div')
                .filter(function() {
                    return this.id.match(/^collapsible-subject_taxon_label/);
                })
                .removeClass('collapse')
                .addClass('in');
        };

        // Attach pager.
        var pager_opts = {
                'selection_counts': [10, 25, 50, 100, 5000]
        };
        var pager = new bbop.widget.live_pager(pager_top_div, golr_manager, pager_opts);
        var pager_bottom = new bbop.widget.live_pager(pager_bot_div, golr_manager, pager_opts);
        // Add results.
        var results_opts = {
                //'callback_priority': -200,
                // 'user_buttons_div_id': pager.button_span_id(),
                'user_buttons': [],
                'selectable_p' : false
        };

    bbop.widget.display.results_table_by_class_conf_b3 = bbop.monarch.widget.display.results_table_by_class_conf_bs3;
    bbop.widget.display.results_table_by_class_conf_b3.prototype.process_entry = function(bit, field_id, document, display_context){
        var anchor = this;

        // First, allow the handler to take a whack at it. Forgive
        // the local return. The major difference that we'll have here
        // is between standard fields and special handler fields. If
        // the handler resolves to null, fall back onto standard.
        var out = anchor._handler.dispatch(bit, field_id, display_context);
        if( bbop.core.is_defined(out) && out != null ){
            return out;
        }

        // Otherwise, use the rest of the context to try and render
        // the item.
        var retval = '';
        var did = document['id'];

        // Get a label instead if we can.
        var ilabel = anchor._golr_response.get_doc_label(did, field_id, bit);
        if( !ilabel ){
            ilabel = bit;
        }
        if (ilabel != null) {
            ilabel = ilabel.replace(/\>/g,'&gt;');
            ilabel = ilabel.replace(/\</g,'&lt;');
        }

        // Extract highlighting if we can from whatever our "label"
        // was.
        var hl = anchor._golr_response.get_doc_highlight(did, field_id, ilabel);
        if (hl != null) {
            hl = hl.replace(/\>/g,'&gt;');
            hl = hl.replace(/\</g,'&lt;');
        }

        //Get cateogry
        var category = anchor._golr_response.get_doc_field(did, field_id+'_category');

        // See what kind of link we can create from what we got.
        var ilink =
            anchor._linker.anchor({id:bit, label:ilabel, hilite:hl, category:category}, field_id);

        // See what we got, in order of how much we'd like to have it.
        if( ilink ){
            retval = ilink;
        }else if( ilabel ){
            retval = ilabel;
        }else{
            retval = bit;
        }

        return retval;
    };

    var results = new bbop.widget.live_results(div, golr_manager, confc,
                       handler, linker, results_opts);

    addDownloadButton(pager, golr_manager);

    //Hardcode for now
    if (personality === 'variant_phenotype') {
        addPhenoPacketButton(pager, golr_manager, id);
    }

    // Details for spinner
    var spinner_top_div = makeSpinnerDiv();
    var spinner_bot_div = makeSpinnerDiv();
    jQuery('#'+pager_top_div).prepend(spinner_top_div.to_string());

    // Add pre and post run spinner (borrow filter's for now).
    golr_manager.register('prerun', 'pre', function(){
        filters.spin_up();
        jQuery('#'+pager.button_span_id()).append(spinner_top_div.to_string());
        jQuery('#'+pager_bottom.button_span_id()).append(spinner_bot_div.to_string());
    });
    golr_manager.register('postrun', 'post', function(){
        filters.spin_down();
        open_species_filter();
    });

    // Initial run.
    golr_manager.search();

    jQuery('#'+pager_top_div).on('change', function() {
        var val = jQuery('#'+pager_top_div).find('select').val();
        disableBottomPager(val);
    });

    function disableBottomPager(value){
        if (value <= 10){
            jQuery('#'+pager_bot_div).hide();
        } else {
            jQuery('#'+pager_bot_div).show(2000);
        }
    }
    jQuery('#'+pager_bot_div).hide();
    }
}

function addPhenoPacketButton(pager, manager, id){

    var fun_id = bbop.core.uuid();
    manager.register('search', fun_id, _drawPhenoPacketBtn, '-3');
   
    function _drawPhenoPacketBtn() {
        
        // Make download button
        var span = pager.button_span_id();

        // / Add button to DOM.
        var button_props = {
            'generate_id' : true,
            'class' : 'btn btn-warning',
            'style': 'margin-left:15px;'
        };
        var label = 'PhenoPacket';
        var title = 'Download PhenoPacket';
        var button = new bbop.html.button(label, button_props);
        var button_elt = '#' + button.get_id();
        
        jQuery('#' + span).append(button.to_string());
        jQuery(button_elt).attr('title', title);

        jQuery('#' + button.get_id()).click( function() {
            var solrParams = manager.get_filter_query_string();
            solrParams = solrParams.replace('sfq=', 'fq=', 'g');
            var personality = manager.get_personality();
            var personalityParam = "&personality="+personality
            var qurl = global_app_base + '/phenopacket?' + solrParams
                       + personalityParam;
            location.href = qurl;
        });
    }
}

function addDownloadButton(pager, manager){

    var fun_id = bbop.core.uuid();
    manager.register('search', fun_id, _drawDownloadButton, '-2');

    function _drawDownloadButton() {

        var span = pager.button_span_id();
        // / Add button to DOM.
        var button_props = {
            'generate_id' : true,
            'class' : 'btn btn-success',
            'style': 'margin-left:15px;margin-right:5px;'
        };
        var label = 'TSV';
        var title = 'Download data (up to 100,000 rows)';
        var button = new bbop.html.button(label, button_props);
        var button_elt = '#' + button.get_id();

        jQuery('#' + span).append(button.to_string());
        jQuery(button_elt).attr('title', title);

        // Get fields from personality
        var fields_without_labels = [ 'source', 'is_defined_by', 'qualifier' ];

        var personality = manager.get_personality();

        // We have a bbop.golr.conf api that may be able to replace this
        // Global scigraph url passed in from webapp.js addGolrStaticFiles
        var result_weights = global_golr_conf[personality]['result_weights']
                .split(/\s+/);
        result_weights = result_weights.map(function(i) {
            return i.replace(/\^.+$/, '');
        });

        var fields = result_weights.slice();
        var splice_index = 1;
        result_weights.forEach(function(val, index) {
            if (fields_without_labels.indexOf(val) === -1) {
                var result_label = val + '_label';
                fields.splice(index + splice_index, 0, result_label);
                splice_index++;
            }
        });
        if (fields.indexOf('qualifier') == -1) {
            fields.push('qualifier');
        }

        var forwardToDownload = function() {
            var field_list = fields;
            var args_hash = {
                rows : '100000',
                header : "true"
            };

            var url = manager.get_download_url(field_list, args_hash);
            location.href = url;
        };

        jQuery('#' + button.get_id()).click(forwardToDownload);
    }

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
            launch_browser(id, root);
        },
        success: function ( data ){
            var graph = new bbop.model.graph();
            graph.load_json(data);
            var node_list = [];
            node_list = graph.all_nodes();
            if (node_list.length > 1) {
                // An error occurred, there can only be one
                launch_browser(id, root);
            } else {
                var leader_id = node_list[0].id();
                launch_browser(leader_id, root, id, label);
            }

        }
    });

    function launch_browser(id, root, reference_id, reference_label) {

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
}

function getInteractiveOntologyBrowser(id, root){
    // Conf
    // Global scigraph url passed in from webapp.js addCoreRenderers
    var srv = global_scigraph_url;

    var manager = new bbop.rest.manager.jquery(bbop.rest.response.json);

    if (!root){
        root = "HP:0000118";
    }

    // Browser.
    var b = new bbop.monarch.widget.interactive_browse(srv, manager, id, root, 'brw', {
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

    b.init_browser(id);
}

if (typeof(loaderGlobals) === 'object') {
    loaderGlobals.getTableFromSolr = getTableFromSolr;
    loaderGlobals.getOntologyBrowser = getOntologyBrowser;
}
if (typeof(global) === 'object') {
    global.getTableFromSolr = getTableFromSolr;
    global.getOntologyBrowser = getOntologyBrowser;
}
