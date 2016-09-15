var golr_conf = require('golr-conf');
var golr_response = require('bbop-response-golr');
var golr_manager = require('bbop-manager-golr');
var jquery_engine = require('bbop-rest-manager').jquery;
var bbop_widgets = require('bbop-widget-set');

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
        var gconf = new golr_conf.conf(global_golr_conf);
        var engine = new jquery_engine(golr_response);
        engine.JQ = jQuery;
        engine.use_jsonp(true);

        var srv = global_solr_url;
        var handler = new bbop.monarch.handler();
        var linker = new bbop.monarch.linker();
        var confc = gconf.get_class(personality);

        // Other widget tests; start with manager.
        var molr_manager = new golr_manager(srv, gconf, engine, 'async');
        molr_manager.use_jsonp = true
        molr_manager.set_personality(personality);
        molr_manager.add_query_filter(golr_field, id, ['*']);
        molr_manager.query_variants['facet.method'] = 'enum';

        if (filter != null && filter instanceof Array && filter.length > 0){
            filter.forEach( function (val) {
                if (val != null && val.field && val.value){
                    molr_manager.add_query_filter(val.field, val.value, ['*']);
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

        // var filters = new bbop.widget.live_filters(pager_filter, molr_manager, gconf, f_opts);
        /* eslint new-cap: 0 */
        var filters = new bbop.widget.facet_filters(pager_filter, molr_manager, gconf, f_opts);
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
        var pager = new bbop_widgets.live_pager(pager_top_div, molr_manager, pager_opts);
        var pager_bottom = new bbop_widgets.live_pager(pager_bot_div, molr_manager, pager_opts);
        // Add results.
        var results_opts = {
                //'callback_priority': -200,
                // 'user_buttons_div_id': pager.button_span_id(),
                'user_buttons': [],
                'selectable_p' : false
        };

    bbop_widgets.display.results_table_by_class_conf = bbop.monarch.widget.display.results_table_by_class_conf_bs3;
    bbop_widgets.display.results_table_by_class_conf.prototype.process_entry = function(bit, field_id, document, display_context){
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

    var results = new bbop_widgets.live_results(div, molr_manager, confc,
                       handler, linker, results_opts);

    addDownloadButton(pager, molr_manager);

    //Hardcode for now
    if (personality === 'variant_phenotype') {
        addPhenoPacketButton(pager, molr_manager, id);
    }

    // Details for spinner
    var spinner_top_div = makeSpinnerDiv();
    var spinner_bot_div = makeSpinnerDiv();
    jQuery('#'+pager_top_div).prepend(spinner_top_div.to_string());

    // Add pre and post run spinner (borrow filter's for now).
    molr_manager.register('prerun', function(){
        filters.spin_up();
        jQuery('#'+pager.button_span_id()).append(spinner_top_div.to_string());
        jQuery('#'+pager_bottom.button_span_id()).append(spinner_bot_div.to_string());
    });
    molr_manager.register('postrun', function(){
        filters.spin_down();
        open_species_filter();
    });

    // Initial run.
    molr_manager.search();

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
    manager.register('search', _drawPhenoPacketBtn, '-3', fun_id);
   
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
        jQuery(button_elt).append("<span class=\"badge beta-badge\">BETA</span>");
        //var infoIcon = "<i class=\"fa fa-info-circle pheno-info\"></i>";
        //jQuery('#' + span).append(infoIcon);

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
    manager.register('search', _drawDownloadButton, '-2', fun_id);

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

if (typeof(loaderGlobals) === 'object') {
    loaderGlobals.getTableFromSolr = getTableFromSolr;
}
if (typeof(global) === 'object') {
    global.getTableFromSolr = getTableFromSolr;
}
