////
//// NOTE: This is test/demo code--don't worry too much about it.
////

jQuery(document).ready(function(){

    // Conf.
    var gconf = new bbop.golr.conf(amigo.data.golr);
    var srv = 'http://toaster.lbl.gov:9000/solr/';
    var sd = new amigo.data.server();
    var defs = new amigo.data.definitions();
    var handler = new amigo.handler();
    var linker = new amigo.linker();
    var confc = gconf.get_class('annotation');

    /* Search pane.
    var search = new bbop.widget.search_pane(srv, gconf, 'a2sp');
    search.include_highlighting(true);
    search.set_personality('annotation');
    search.add_query_filter('document_category', 'annotation', ['*']);
    search.establish_display();
    search.reset();*/
    
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

    // Other widget tests; start with manager.
    var srch = new bbop.golr.manager.jquery(srv, gconf);
    srch.set_id('HP:0000001');
    //srch.set_personality('annotation');
    //srch.add_query_filter('document_category', 'annotation', ['*']);
    // Add filters.
    /*var f_opts = {
	'meta_label': 'Total:&nbsp;',
	'display_free_text_p': true
    };*/
    /*var filters = new bbop.widget.live_filters('bs3filter', srch, gconf, f_opts);
    filters.establish_display();*/
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
    /* Add pre and post run spinner (borrow filter's for now).
    srch.register('prerun', 'foo', function(){
	filters.spin_up();
    });
    srch.register('postrun', 'foo', function(){
	filters.spin_down();
    });*/
    // Initial run.
    srch.search();
});
