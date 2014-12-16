jQuery(document).ready(function(){
    
    // Conf.
    var gconf = new bbop.golr.conf(amigo.data.golr);
    var srv = 'http://toaster.lbl.gov:9000/solr/';
    var sd = new amigo.data.server();
    var defs = new amigo.data.definitions();
    var handler = new amigo.handler();
    var linker = new amigo.linker();
    var confc = gconf.get_class('annotation');
    
    // Other widget tests; start with manager.
    var srch = new bbop.golr.manager.jquery(srv, gconf);
    srch.set_id('HP:0001802');
    
    //srch.set_personality('annotation');
    //srch.add_query_filter('document_category', 'annotation', ['HP:0000001']);

    // Attach pager.
    var pager_opts = {
    };
    var pager = new bbop.widget.live_pager('bs3pager', srch, pager_opts);
    // Add results.
    var results_opts = {
    //'callback_priority': -200,
    'user_buttons_div_id': pager.button_span_id(),
    'user_buttons': []
    };
    var results = new bbop.widget.live_results('bs3results', srch, confc,
                           handler, linker, results_opts);
    // Initial run.
    srch.search();
    
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
    b.draw_browser('HP:0000001');
});