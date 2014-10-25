////
//// NOTE: This is test/demo code--don't worry too much about it.
////

jQuery(document).ready(function(){

    // Conf.
    var gconf = new bbop.golr.conf(amigo.data.golr);

    // Search pane.
    var search = new bbop.widget.search_pane('http://toaster.lbl.gov:9000/solr/',
					     gconf, 'a2sp');
    search.include_highlighting(true);
    search.set_personality('annotation');
    search.add_query_filter('document_category', 'annotation', ['*']);
    search.establish_display();
    search.reset();
    
    // Browser.
    var sd = new amigo.data.server();
    var b = new bbop.widget.browse('http://toaster.lbl.gov:9000/solr/',
				   gconf, 
				   'brw',
				   {
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
    b.draw_browser('HP:0000118');
});
