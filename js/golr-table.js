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
        jQuery('#categories a[href="'+tab_anchor+'"]').click(function(event) {
            if (!(jQuery('#'+div+' .table').length)){
                getTable(id, golr_field, div, filter, personality);
            }
        });
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
    pager_top_div = div+'-pager-top';
    pager_bot_div = div+'-pager-bottom';
    pager_filter = div+'-filter';

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
    
    // Add pre and post run spinner (borrow filter's for now).
    golr_manager.register('prerun', 'foo', function(){
    filters.spin_up();
    });
    golr_manager.register('postrun', 'foo', function(){
    filters.spin_down();
    });
    
    // Initial run.
    golr_manager.search();
    }
}

function getOntologyBrowser(id){
    
    // Conf.
    var gconf = new bbop.golr.conf(amigo.data.golr);
    var srv = 'http://toaster.lbl.gov:9000/solr/';
    var sd = new amigo.data.server();
    var defs = new amigo.data.definitions();
    var handler = new amigo.handler();
    var linker = new amigo.linker();
    var confc = gconf.get_class('annotation');
    
    // Browser.
    var b = new bbop.widget.browse(srv, gconf, 'brw', {
        'transitivity_graph_field':
        'regulates_transitivity_graph_json',
        'base_icon_url': sd.image_base(),
        'info_icon': 'info',
        'current_icon': 'current_term',
        'image_type': 'gif',
        'info_button_callback':
            function(term_acc, term_doc){
                // // Local form.
                // shield.draw(term_doc);
                // Remote form (works).
                //shield.draw(term_acc);
            }
    });
    b.draw_browser(id);
}

function LaunchEverything(){
  
    if( queryID ){ // globally declared from webapp.js
    
     getTableFromSolr(queryID);
     getOntologyBrowser(queryID);
    }
}
