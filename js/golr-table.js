/*
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
    
    function getTable(id, golr_field, div, filter, personality){
    if (golr_field == null) {
        golr_field = 'object_closure';
    }
    
    if (personality == null){
        personality = 'generic_association';
    }
    
    //divs
    var pager_top_div = div+'-pager-top';
    var pager_bot_div = div+'-pager-bottom';
    var pager_filter = div+'-filter';

    // Conf.
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
    
    if (filter != null && filter.field && filter.value){
        golr_manager.add_query_filter(filter.field, filter.value, ['*']);
    }
    
    // Add filters.
    var f_opts = {
	    'meta_label': 'Total:&nbsp;',
	    'display_free_text_p': true
    };
    var filters = new bbop.widget.live_filters(pager_filter, golr_manager, gconf, f_opts);
    filters.establish_display();

    // Attach pager.
    var pager_opts = {
        'selection_counts': [10, 25, 50, 100, 5000]
    };
    var pager = new bbop.widget.live_pager(pager_top_div, golr_manager, pager_opts);
    var pager_bottom = new bbop.widget.live_pager(pager_bot_div, golr_manager, pager_opts);
    // Add results.
    var results_opts = {
        //'callback_priority': -200,
        'user_buttons_div_id': pager.button_span_id(),
        'user_buttons': [],
        'selectable_p' : false
    };
    var results = new bbop.widget.live_results(div, golr_manager, confc,
                           handler, linker, results_opts);
    
    addDownloadButton(pager, golr_manager);

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
        if( ! ilabel ){
            ilabel = bit;
        }
        
        // Extract highlighting if we can from whatever our "label"
        // was.
        var hl = anchor._golr_response.get_doc_highlight(did, field_id, ilabel);

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
    
    // Details for spinner
    var spinner_top_div = makeSpinnerDiv();
    var spinner_bot_div = makeSpinnerDiv();
    jQuery('#'+pager_top_div).prepend(spinner_top_div.to_string());
    
    // Add pre and post run spinner (borrow filter's for now).
    golr_manager.register('prerun', 'foo', function(){
        filters.spin_up();
        jQuery('#'+pager.button_span_id()).append(spinner_top_div.to_string());
        jQuery('#'+pager_bottom.button_span_id()).append(spinner_bot_div.to_string());
    });
    golr_manager.register('postrun', 'foo', function(){
        filters.spin_down();
        //jQuery('#'+spinner_top_div.get_id()).hide();
        //jQuery('#'+spinner_bot_div.get_id()).hide();    
    });
    
    // Initial run.
    golr_manager.search();
        
    jQuery('#'+pager_top_div).on('change', function() {
        var val = jQuery('#'+pager_top_div).find('select').val()
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

function addDownloadButton(pager, manager){
    
    var fun_id = bbop.core.uuid();
    manager.register('search', fun_id, _drawDownloadButton, '-2');
    
    function _drawDownloadButton(){
    
    var span = pager.button_span_id();
    /// Add button to DOM.
    var button_props = {
    'generate_id': true,
    'class': 'btn btn-success'
    };
    var label = 'TSV';
    var title = 'Download data (up to 100,000 rows)';
    var button = new bbop.html.button(label, button_props);
    var button_elt = '#' + button.get_id();
    
    jQuery('#' + span).append('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'+button.to_string());
    jQuery(button_elt).attr('title',title);

    var forwardToDownload = function(){
        var field_list = ['subject', 'subject_taxon', 'relation', 'object', 'object_taxon', 'evidence','source'];
        var args_hash = {
                rows : '100000'
        }
        
        url = manager.get_download_url(field_list, args_hash);
        location.href = url;
    }
    
    jQuery('#' + button.get_id()).click(forwardToDownload);
    }

}

function makeSpinnerDiv(){
 // Details for spinner
    var inspan = new bbop.html.tag('span', {'class': 'sr-only'}, '...');
    var indiv = new bbop.html.tag('div', {'class': 'progress-bar',
                      'role': 'progressbar',
                      'aria-valuenow': '100',
                      'aria-valuemin': '0',
                      'aria-valuemax': '100',
                      'style': 'width: 100%;'},
                  inspan);
    var spinner_div =
    new bbop.html.tag('div',
              {'generate_id': true,
               'class':
               'progress progress-striped active',
               'style': 'width: 3em; position:absolute; display:inline-block; margin-top:3px; margin-left:10px;'},
              indiv);
    
    return spinner_div;
}
