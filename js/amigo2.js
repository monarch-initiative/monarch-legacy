// If it looks like we're in an environment that supports CommonJS
// Modules 1.0, bbop-js might not be extant in this namespace. Try and
// get at it. Otherwise, if we're in browser-land, it should be
// included in the global and we can proceed.
if( typeof(exports) != 'undefined' ){
    var bbop = require('bbop').bbop;
}
/* 
 * Package: version.js
 * 
 * Namespace: amigo.version
 * 
 * This package was automatically generated during the build process
 * and contains its version information--this is the release of the
 * API that you have.
 */

if ( typeof amigo == "undefined" ){ var amigo = {}; }
if ( typeof amigo.version == "undefined" ){ amigo.version = {}; }

/*
 * Variable: revision
 *
 * Partial version for this library; revision (major/minor version numbers)
 * information.
 */
amigo.version.revision = "2.2.3";

/*
 * Variable: release
 *
 * Partial version for this library: release (date-like) information.
 */
amigo.version.release = "20140928";
/*
 * Package: api.js
 * 
 * Namespace: amigo.api
 * 
 * Core for AmiGO 2 remote functionality.
 * 
 * Provide methods for accessing AmiGO/GO-related web resources from
 * the host server. A loose analog to the perl AmiGO.pm top-level.
 * 
 * This module should contain nothing to do with the DOM, but rather
 * methods to access and make sense of resources provided by AmiGO and
 * its related services on the host.
 * 
 * WARNING: This changes very quickly as parts get spun-out into more
 * stable packages.
 */

// Module and namespace checking.
if( typeof amigo == "undefined" ){ var amigo = {}; }

/*
 * Constructor: api
 * 
 * Contructor for the AmiGO API object.
 * Hooks to useful things back on AmiGO.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  AmiGO object
 */
amigo.api = function(){

    ///
    /// General AmiGO (perl server) AJAX response checking (after
    /// parsing).
    ///

    this.response = {};

    // Check to see if the server thinks we were successful.
    this.response.success = function(robj){
	var retval = false;
	if( robj && robj.success && robj.success == 1 ){
	    retval = true;
	}
	return retval;
    };

    // Check to see what the server thinks about its own condition.
    this.response.type = function(robj){
	var retval = 'unknown';
	if( robj && robj.type ){
	    retval = robj.type;
	}
	return retval;
    };

    // Check to see if the server thinks the data was successful.
    this.response.errors = function(robj){
	var retval = new Array();
	if( robj && robj.errors ){
	    retval = robj.errors;
	}
	return retval;
    };

    // Check to see if the server thinks the data was correct.
    this.response.warnings = function(robj){
	var retval = new Array();
	if( robj && robj.warnings ){
	    retval = robj.warnings;
	}
	return retval;
    };

    // Get the results chunk.
    this.response.results = function(robj){
	var retval = {};
	if( robj && robj.results ){
	    retval = robj.results;
	}
	return retval;
    };

    // Get the arguments chunk.
    this.response.arguments = function(robj){
	var retval = {};
	if( robj && robj.arguments ){
	    retval = robj.arguments;
	}
	return retval;
    };

    ///
    /// Workspaces' linking.
    ///

    function _abstract_head_template(head){
	return head + '?';
    }

    // Convert a hash (with possible arrays as arguments) into a link
    // string.
    // NOTE: Non-recursive--there are some interesting ways to create
    // cyclic graph hashes in SpiderMonkey, and I'd rather not think
    // about it right now.
    function _abstract_segment_template(segments){
	
	var maxibuf = new Array();
	for( var segkey in segments ){

	    var segval = segments[segkey];

	    // If the value looks like an array, iterate over it and
	    // collect.
	    if( segval &&
		segval != null &&
		typeof segval == 'object' &&
		segval.length ){

		for( var i = 0; i < segval.length; i++ ){
		    var minibuffer = new Array();
		    minibuffer.push(segkey);
		    minibuffer.push('=');
		    minibuffer.push(segval[i]);
		    maxibuf.push(minibuffer.join(''));
		}

	    }else{
		var minibuf = new Array();
		minibuf.push(segkey);
		minibuf.push('=');
		minibuf.push(segval);
		maxibuf.push(minibuf.join(''));
	    }
	}
	return maxibuf.join('&');
    }

    // Similar to the above, but creating a solr filter set.
    function _abstract_solr_filter_template(filters){
	
	var allbuf = new Array();
	for( var filter_key in filters ){

	    var filter_val = filters[filter_key];

	    // If the value looks like an array, iterate over it and
	    // collect.
	    if( filter_val &&
		filter_val != null &&
		typeof filter_val == 'object' &&
		filter_val.length ){

		    for( var i = 0; i < filter_val.length; i++ ){
			var minibuffer = new Array();
			var try_val = filter_val[i];
			if( typeof(try_val) != 'undefined' &&
			try_val != '' ){
			    minibuffer.push('fq=');
			    minibuffer.push(filter_key);
			    minibuffer.push(':');
			    minibuffer.push('"');
			    minibuffer.push(filter_val[i]);
			    minibuffer.push('"');
			    allbuf.push(minibuffer.join(''));
			}
		    }		    
		}else{
		    var minibuf = new Array();
		    if( typeof(filter_val) != 'undefined' &&
			filter_val != '' ){
			    minibuf.push('fq=');
			    minibuf.push(filter_key);
			    minibuf.push(':');
			    minibuf.push('"');
			    minibuf.push(filter_val);
			    minibuf.push('"');
			    allbuf.push(minibuf.join(''));
			}
		}
	}
	return allbuf.join('&');
    }

    // Construct the templates using head and segments.
    function _abstract_link_template(head, segments){	
	return _abstract_head_template(head) +
	    _abstract_segment_template(segments);
    }

    // // Construct the templates using the segments.
    // function _navi_client_template(segments){
    // 	segments['mode'] = 'layers_graph';
    // 	return _abstract_link_template('amigo_exp', segments);
    // }

    // // Construct the templates using the segments.
    // function _navi_data_template(segments){
    // 	segments['mode'] = 'navi_js_data';
    // 	return _abstract_link_template('aserve_exp', segments);
    // }

    // Construct the templates using the segments.
    function _ws_template(segments){
	segments['mode'] = 'workspace';
	return _abstract_link_template('amigo_exp', segments);
    }

    // // Construct the templates using the segments.
    // function _ls_assoc_template(segments){
    // 	segments['mode'] = 'live_search_association';
    // 	return _abstract_link_template('aserve', segments);
    // }
    // function _ls_gp_template(segments){
    // 	segments['mode'] = 'live_search_gene_product';
    // 	return _abstract_link_template('aserve', segments);
    // }
    // function _ls_term_template(segments){
    // 	segments['mode'] = 'live_search_term';
    // 	return _abstract_link_template('aserve', segments);
    // }

    // Construct the templates using the segments.
    function _completion_template(segments){
    	return _abstract_link_template('completion', segments);
    }

    // // Construct the templates using the segments.
    // function _nmatrix_template(segments){
    // 	segments['mode'] = 'nmatrix';
    // 	return _abstract_link_template('amigo_exp', segments);
    // }

    this.api = {};
    this.link = {};
    this.html = {};

    //     // Some handling for a workspace object once we get one.
    //     this.util.workspace = {};
    //     this.util.workspace.get_terms = function(ws){
    // 	var all_terms = new Array();
    // 	for( var t = 0; t < ws.length; t++ ){
    // 	    var item = ws[t];
    // 	    if( item.type == 'term' ){
    // 		all_terms.push(item.key);
    // 	    }
    // 	}
    // 	return all_terms;
    //     };

    ///
    /// JSON? JS? API functions for workspaces.
    ///

    this.workspace = {};

    this.workspace.remove = function(ws_name){
	return _ws_template({
	    action: 'remove_workspace',
	    workspace: ws_name
	});
    };
    this.workspace.add = function(ws_name){
	return _ws_template({
	    action: 'add_workspace',
	    workspace: ws_name
	});
    };
    this.workspace.copy = function(ws_from_name, ws_to_name){
	return _ws_template({
	    action: 'copy_workspace',
	    workspace: ws_from_name,
	    copy_to_workspace: ws_to_name
	});
    };
    this.workspace.clear = function(ws_name){
	return _ws_template({
	    action: 'clear_workspace',
	    workspace: ws_name
	});
    };
    this.workspace.list = function(ws_name){
	return _ws_template({
	    action: 'list_workspaces',
	    workspace: ws_name
	});
    };

    // API functions for workspace items.
    //     this.workspace.add_item = function(ws_name, key, type, name){
    this.workspace.add_item = function(ws_name, key, name){
	return _ws_template({
	    action: 'add_item',
	    workspace: ws_name,
	    key: key,
            // _t_y_p_e_: _t_y_p_e_, // prevent naturaldocs from finding this
	    name: name
	});
    };
    this.workspace.remove_item = function(ws_name, key){
	return _ws_template({
	    action: 'remove_item',
	    workspace: ws_name,
	    key: key
	});
    };
    this.workspace.list_items = function(ws_name){
	return _ws_template({
	    action: 'list_items',
	    workspace: ws_name
	});
    };

    // Just the workspace and item status. Essentially do nothing and
    // link to the current session status.
    this.workspace.status = function(){
	return _ws_template({ action: '' });
    };

    ///
    /// API function for completion/search information.
    ///

    this.completion = function(args){

	var format = 'amigo';
	var type = 'general';
	var ontology = null;
	var narrow = 'false';
	var query = '';
	if( args ){
	    if( args['format'] ){ format = args['format']; }
	    if( args['type'] ){ type = args['type']; }
	    if( args['ontology'] ){ontology = args['ontology']; }
	    if( args['narrow'] ){narrow = args['narrow']; }
	    if( args['query'] ){query = args['query']; }
	}

	return _completion_template({format: format,
				     type: type,
				     ontology: ontology,
				     narrow: narrow,
				     query: encodeURIComponent(query)});
    };

    ///
    /// API functions for live search.
    ///
    this.live_search = {};

    // General search:
    // http://accordion.lbl.gov:8080/solr/select?indent=on&version=2.2&q=annotation_class_label%3Abinding&fq=&start=0&rows=10&fl=*%2Cscore&qt=standard&wt=json&explainOther=&hl.fl=
    // Facet on date:
    // http://accordion.lbl.gov:8080/solr/select?indent=on&version=2.2&q=annotation_class_label%3Abinding&fq=&start=0&rows=10&fl=*%2Cscore&qt=standard&wt=json&explainOther=&hl.fl=&facet=true&facet.field=date    
    this.live_search.golr = function(in_args){

	if( ! in_args ){ in_args = {}; }
	var default_query_args =
	    {
		// TODO/BUG? need jsonp things here?
		qt: 'standard',
		indent: 'on',
		wt: 'json',
		version: '2.2',
		rows: 10,
		//start: 1,
		start: 0, // Solr is offset indexing
		fl: '*%2Cscore',

		// Control of facets.
		facet: '',
		'facet.field': [],

		// Facet filtering.
		fq: [],

		// Query-type stuff.
		q: '',

		// Our bookkeeping.
		packet: 0
	    };
	var final_query_args = bbop.core.fold(default_query_args, in_args);
		
	var default_filter_args =
	    {
		// Filter stuff.
		document_category: [],
		type: [],
		source: [],
		taxon: [],
		evidence_type: [],
		evidence_closure: [],
		isa_partof_label_closure: [],
		annotation_extension_class_label: [],
		annotation_extension_class_label_closure: []
	    };
	var final_filter_args = bbop.core.fold(default_filter_args, in_args);

	// ...
	//return _abstract_link_template('select', segments);	
	var complete_query = _abstract_head_template('select') +
	    _abstract_segment_template(final_query_args);
	var addable_filters = _abstract_solr_filter_template(final_filter_args);
	if( addable_filters.length > 0 ){
	    complete_query = complete_query + '&' + addable_filters;
	}
	return complete_query;
    };

    ///
    /// API functions for the ontology.
    ///
    this.ontology = {};
    this.ontology.roots = function(){
	return _abstract_link_template('aserve_exp', {'mode': 'ontology'});
    };

    ///
    /// API functions for navi js data.
    ///

    this.navi_js_data = function(args){

	if( ! args ){ args = {}; }

	var final_args = {};

	// Transfer the name/value pairs in opt_args into final args
	// if extant.
	var opt_args = ['focus', 'zoom', 'lon', 'lat'];
	//var opt_args_str = '';
	for( var oa = 0; oa < opt_args.length; oa++ ){
	    var arg_name = opt_args[oa];
	    if( args[arg_name] ){
		// opt_args_str =
		// opt_args_str + '&' + arg_name + '=' + args[arg_name];
		final_args[arg_name] = args[arg_name];
	    }
	}

	//
	var terms_buf = new Array();
	if( args.terms &&
	    args.terms.length &&
	    args.terms.length > 0 ){

	    //
	    for( var at = 0; at < args.terms.length; at++ ){
		terms_buf.push(args.terms[at]);
	    } 
	}
	final_args['terms'] = terms_buf.join(' '); 

	return _navi_data_template(final_args);
    };

    ///
    /// Links for terms and gene products.
    ///

    function _term_link(in_args){

	if( ! in_args ){ in_args = {}; }
	var default_args =
	    {
		acc: ''
	    };
	var final_args = bbop.core.fold(default_args, in_args);
	
	var acc = final_args['acc'];
	//return 'term_details?term=' + acc;
	return 'amigo?mode=golr_term_details&term=' + acc;
    }
    this.link.term = _term_link;

    // BUG/TODO: should this actually be in widgets? How core is this
    // convenience?
    this.html.term_link = function(acc, label){
	if( ! label ){ label = acc; }
	return '<a title="Go to term details page for ' + label +
	    '." href="' + _term_link({acc: acc}) + '">' + label +'</a>';
    };

    function _gene_product_link(in_args){

	if( ! in_args ){ in_args = {}; }
	var default_args =
	    {
		acc: ''
	    };
	var final_args = bbop.core.fold(default_args, in_args);
	
	var acc = final_args['acc'];
	//return 'gp-details.cgi?gp=' + acc;
	return 'amigo?mode=golr_gene_product_details&gp=' + acc;
    }
    this.link.gene_product = _gene_product_link;

    // BUG/TODO: should this actually be in widgets? How core is this
    // convenience?
    this.html.gene_product_link = function(acc, label){
	if( ! label ){ label = acc; }
	return '<a title="Go to gene product details page for ' + label +
	    '." href="' + _gene_product_link({acc: acc}) + '">' + label +'</a>';
    };

    ///
    /// Links for term product associations.
    ///

    this.link.term_assoc = function(in_args){

	if( ! in_args ){ in_args = {}; }
	var default_args =
	    {
		acc: '',
		speciesdb: [],
		taxid: []
	    };
	var final_args = bbop.core.fold(default_args, in_args);
	var acc = final_args['acc'];
	var speciesdbs = final_args['speciesdb'];
	var taxids = final_args['taxid'];

	//
	var spc_fstr = speciesdbs.join('&speciesdb');
	var tax_fstr = taxids.join('&taxid=');
	//core.kvetch('LINK SRCS: ' + spc_fstr);
	//core.kvetch('LINK TIDS: ' + tax_fstr);

	return 'term-assoc.cgi?term=' + acc +
	    '&speciesdb=' + spc_fstr +
	    '&taxid=' + tax_fstr;
    };

    ///
    /// Link function for blast.
    ///

    this.link.single_blast = function(in_args){

	if( ! in_args ){ in_args = {}; }
	var default_args =
	    {
		acc: ''
	    };
	var final_args = bbop.core.fold(default_args, in_args);
	
	var acc = final_args['acc'];
	return 'blast.cgi?action=blast&seq_id=' + acc;
    };

    ///
    /// Link function for term enrichment.
    ///

    this.link.term_enrichment = function(in_args){

	if( ! in_args ){ in_args = {}; }
	var default_args =
	    {
		gp_list: [] 
	    };
	var final_args = bbop.core.fold(default_args, in_args);
	
	var acc = final_args['acc'];
	return 'term_enrichment?' +
	    'gp_list=' + final_args['gp_list'].join(' ');
    };

    ///
    /// Link function for slimmer.
    ///

    this.link.slimmer = function(in_args){

	if( ! in_args ){ in_args = {}; }
	var default_args =
	    {
		gp_list: [], 
		slim_list: []
	    };
	var final_args = bbop.core.fold(default_args, in_args);
	
	return 'slimmer?' +
	    'gp_list=' + final_args['gp_list'].join(' ') +
	    '&slim_list=' + final_args['slim_list'].join(' ');
    };

    ///
    /// Link function for N-Matrix.
    ///

    this.link.nmatrix = function(in_args){

	if( ! in_args ){ in_args = {}; }
	var default_args =
	    {
		term_set_1: '',
		term_set_2: ''
	    };
	var final_args = bbop.core.fold(default_args, in_args);

	//
	var terms_buf = new Array();
	if( in_args.terms &&
	    in_args.terms.length &&
	    in_args.terms.length > 0 ){

		//
	    for( var at = 0; at < in_args.terms.length; at++ ){
		terms_buf.push(in_args.terms[at]);
	    } 
	}
	final_args['term_set_1'] = terms_buf.join(' '); 
	final_args['term_set_2'] = terms_buf.join(' '); 

	return _nmatrix_template(final_args);
    };

    ///
    /// Link functions for navi client (bookmark).
    ///

    this.link.layers_graph = function(args){

	//
	var final_args = {};
	if( args['lon'] &&
	    args['lat'] &&
	    args['zoom'] &&
	    args['focus'] ){

	    //
	    final_args['lon'] = args['lon'];
	    final_args['lat'] = args['lat'];
	    final_args['zoom'] = args['zoom'];
	    final_args['focus'] = args['focus'];
	}

	if( args['terms'] &&
	    args['terms'].length &&
	    args['terms'].length > 0 ){

	    //
	    var aterms = args['terms'];
	    var terms_buf = new Array();
	    for( var at = 0; at < aterms.length; at++ ){
		terms_buf.push(aterms[at]);
	    }
	    final_args['terms'] = terms_buf.join(' '); 
	}
	
	return _navi_client_template(final_args);
    };

    // TODO:
};
/* 
 * Package: linker.js
 * 
 * Namespace: amigo.linker
 * 
 * Generic AmiGO link generator, fed by <amigo.data.server> for local
 * links and <amigo.data.xrefs> for non-local links.
 * 
 * NOTE: A lot of this is lifted from the (defunct) amigo2.js
 * package. However, the future should be here.
 */

// Module and namespace checking.
if( typeof amigo == "undefined" ){ var amigo = {}; }

/*
 * Constructor: linker
 * 
 * Create an object that can make URLs and/or anchors.
 * 
 * These functions have a well defined interface so that other
 * packages can use it.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  self
 */
amigo.linker = function (){
    this._is_a = 'amigo.linker';

    // With the new dispatcher, relative URLs no longer work, so we
    // have to bring in server data--first let's ensure it.
    if( ! amigo.data.server ){
	throw new Error('we are missing access to amigo.data.server!');
    }
    // Easy app base.
    var sd = new amigo.data.server();
    this.app_base = sd.app_base();
    // Internal term matcher.
    this.term_regexp = null;
    var internal_regexp_str = sd.term_regexp();    
    if( internal_regexp_str ){
	this.term_regexp = new RegExp(internal_regexp_str);
    }

    // Categories for different special cases (internal links).
    this.ont_category = {
	'term': true,
	'ontology_class': true,
	'annotation_class': true,
	'annotation_class_closure': true,
	'annotation_class_list': true
    };
    this.bio_category = {
        'gp': true,
	'gene_product': true,
	'bioentity': true
    };
    this.complex_annotation_category = {
        //'complex_annotation': true,
        'annotation_group': true
        //'annotation_unit': true
    };
    this.search_category = { // not including the trivial medial_search below
        'search': true,
	'live_search': true
    };
    this.search_modifier = {
	// Possibly "dynamic".
	'gene_product': '/bioentity',
	'bioentity': '/bioentity',
	'ontology': '/ontology',
	'annotation': '/annotation',
	'complex_annotation': '/complex_annotation',
	'family': '/family',
	'lego_unit': '/lego_unit',
	'general': '/general'
    };
    this.other_interlinks = {
	'medial_search': '/amigo/medial_search',
	'landing': '/amigo/landing',
	'tools': '/amigo/software_list',
	'schema_details': '/amigo/schema_details',
	'load_details': '/amigo/load_details',
	'browse': '/amigo/browse',
	'goose': '/goose',
	'grebe': '/grebe',
	'gannet': '/gannet',
	'repl': '/repl'	
    };
};

/*
 * Function: url
 * 
 * Return a url string.
 * 
 * Arguments:
 *  args - id
 *  xid - *[optional]* an internal transformation id
 *  modifier - *[optional]* modify xid; only used with xid
 * 
 * Returns:
 *  string (url); null if it couldn't create anything
 */
amigo.linker.prototype.url = function (id, xid, modifier){
    
    var retval = null;

    ///
    /// AmiGO hard-coded internal link types.
    ///

    // For us, having an xid means that we will be doing some more
    // complicated routing.
    if( xid && xid != '' ){

	// First let's do the ones that need an associated id to
	// function--either data urls or searches.
	if( id && id != '' ){
	    if( this.ont_category[xid] ){
		retval = this.app_base + '/amigo/term/' + id;
		//retval = _add_restmark_modifier(retval, modifier);
            }else if( this.bio_category[xid] ){
		retval = this.app_base + '/amigo/gene_product/' + id;
		//retval = _add_restmark_modifier(retval, modifier);
            }else if( this.complex_annotation_category[xid] ){
		retval = this.app_base + '/amigo/complex_annotation/'+ id;
            }else if( this.search_category[xid] ){

		// First, try and get the proper path out. Will
		// hardcode for now since some paths don't map
		// directly to the personality.
		var search_path = '';
		if( this.search_modifier[modifier] ){
		    search_path = this.search_modifier[modifier];
		}
		
		retval = this.app_base + '/amigo/search' + search_path;
		if( id ){
		    // Ugh...decide if the ID indicated a restmark or
		    // a full http action bookmark.
		    var http_re = new RegExp("^http");
		    if( http_re.test(id) ){
			// HTTP bookmark.
			retval = retval + '?bookmark='+ id;
		    }else{
			// minimalist RESTy restmark.
			retval = retval + '?' + id;
		    }
		}
	    }
	}

	// Things that do not need an id to function--like just
	// popping somebody over to Grebe or the medial search.
	if( ! retval ){
	    if( this.other_interlinks[xid] ){
		var extension = this.other_interlinks[xid];
		retval = this.app_base + extension;

		// Well, for medial search really, but it might be
		// general?
		if( xid == 'medial_search' ){
		    // The possibility of just tossing back an empty
		    // search for somebody downstream to fill in.
		    if( bbop.core.is_defined(id) && id != null ){
			retval = retval + '?q=' + id;
		    }
		}
	    }
	}
    }

    ///
    /// External resources. For us, if we haven't found something
    /// so far, try the data xrefs.
    ///
    
    // Since we couldn't find anything with our explicit local
    // transformation set, drop into the great abyss of the xref data.
    if( ! retval && id && id != '' ){ // not internal, but still has an id
	if( ! amigo.data.xrefs ){
	    throw new Error('amigo.data.xrefs is missing!');
	}
	
	// First, extract the probable source and break it into parts.
	var full_id_parts = bbop.core.first_split(':', id);
	if( full_id_parts && full_id_parts[0] && full_id_parts[1] ){
	    var src = full_id_parts[0];
	    var sid = full_id_parts[1];
	    
	    // Now, check to see if it is indeed in our store.
	    var lc_src = src.toLowerCase();
	    var xref = amigo.data.xrefs[lc_src];
	    if( xref && xref['url_syntax'] ){
		retval =
		    xref['url_syntax'].replace('[example_id]', sid, 'g');
	    }
	}
    }
    
    return retval;
};

/*
 * Function: anchor
 * 
 * Return a link as a chunk of HTML, all ready to consume in a
 * display.
 * 
 * Arguments:
 *  args - hash--'id' required; 'label' and 'hilite' are inferred if not extant
 *  xid - *[optional]* an internal transformation id
 *  rest - *[optional]* modify xid; only used with xid
 * 
 * Returns:
 *  string (link); null if it couldn't create anything
 */
amigo.linker.prototype.anchor = function(args, xid, modifier){
    
    var anchor = this;
    var retval = null;

    // Don't even start if there is nothing.
    if( args ){

	// Get what fundamental arguments we can.
	var id = args['id'];
	if( id ){
	
	    // Infer label from id if not present.
	    var label = args['label'];
	    if( ! label ){ label = id; }
	
	    // Infer hilite from label if not present.
	    var hilite = args['hilite'];
	    if( ! hilite ){ hilite = label; }
	
	    // See if the URL is legit. If it is, make something for it.
	    var url = this.url(id, xid, modifier);
	    if( url ){
		
		// First, see if it is one of the internal ones we know about
		// and make something special for it.
		if( xid ){
		    if( this.ont_category[xid] ){
		    
			// Possible internal/external detection here.
			// var class_str = ' class="amigo-ui-term-internal" ';
			var class_str = '';
			var title_str = 'title="' + // internal default
			id + ' (go to the term details page for ' +
			    label + ')"';
			if( this.term_regexp ){
			    if( this.term_regexp.test(id) ){
			    }else{
				class_str = ' class="amigo-ui-term-external" ';
				title_str = ' title="' +
				    id + ' (is an external term; click ' +
				    'to view our internal information for ' +
				    label + ')" ';
			    }
			}
			
			//retval = '<a title="Go to the term details page for '+
 			retval = '<a ' + class_str + title_str +
			    ' href="' + url + '">' + hilite + '</a>';
		    }else if( this.bio_category[xid] ){
 			retval = '<a title="' + id +
			    ' (go to the details page for ' + label +
			    ')" href="' + url + '">' + hilite + '</a>';
		    }else if( this.search_category[xid] ){
			retval = '<a title="Reinstate bookmark for ' + label +
			    '." href="' + url + '">' + hilite + '</a>';
		    }
		}
		
		// If it wasn't in the special transformations, just make
		// something generic.
		if( ! retval ){
		    retval = '<a title="' + id +
			' (go to the page for ' + label +
			')" href="' + url + '">' + hilite + '</a>';
		}
	    }
	}
    }

    return retval;
};
/* 
 * Package: handler.js
 * 
 * Namespace: amigo.handler
 * 
 * Generic AmiGO handler (conforming to what /should/ be described in
 * the BBOP JS documentation), fed by <amigo.data.dispatch>.
 */

// Module and namespace checking.
if( typeof amigo == "undefined" ){ var amigo = {}; }

/*
 * Constructor: handler
 * 
 * Create an object that will run functions in the namespace with a
 * specific profile.
 * 
 * These functions have a well defined interface so that other
 * packages can use them (for example, the results display in
 * LiveSearch.js).
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  self
 */
amigo.handler = function (){
    this._is_a = 'amigo.handler';

    var is_def = bbop.core.is_defined;

    // Let's ensure we're sane.
    if( ! is_def(amigo) ||
	! is_def(amigo.data) ||
	! is_def(amigo.data.dispatch) ){
	throw new Error('we are missing access to amigo.data.dispatch!');
    }

    // Okay, since trying functions into existance is slow, we'll
    // create a cache of strings to functions.
    this.mangle = bbop.core.uuid();
    this.string_to_function_map = {};
    this.entries = 0; // a little extra for debugging and testing
};

/*
 * Function: dispatch
 * 
 * Return a string.
 * 
 * The fallback function is called if no match could be found in the
 * amigo.data.dispatch. It is called with the name and context
 * arguments in the same order.
 * 
 * Arguments:
 *  data - the incoming thing to be handled
 *  name - the field name to be processed
 *  context - *[optional]* a string to add extra context to the call
 *  fallback - *[optional]* a fallback function to call in case nothing is found
 * 
 * Returns:
 *  string; null if it couldn't create anything
 */
amigo.handler.prototype.dispatch = function(data, name, context, fallback){
    
    // Aliases.
    var is_def = bbop.core.is_defined;

    // First, get the specific id for this combination.
    var did = name || '';
    did += '_' + this.mangle;
    if( context ){
	did += '_' + context;
    }

    // If the combination is not already in the map, fill it in as
    // best we can.
    if( ! is_def(this.string_to_function_map[did]) ){
	
	this.entries += 1;

	// First, try and get the most specific.
	if( is_def(amigo.data.dispatch[name]) ){

	    var field_hash = amigo.data.dispatch[name];
	    var function_string = null;

	    if( is_def(field_hash['context']) &&
		is_def(field_hash['context'][context]) ){
		// The most specific.
		function_string = field_hash['context'][context];
	    }else{
		// If the most specific cannot be found, try and get
		// the more general one.
		if( is_def(field_hash['default']) ){
		    function_string = field_hash['default'];
		}
	    }

	    // At the end of this section, if we don't have a string
	    // to resolve into a function, the data format we're
	    // working from is damaged.
	    if( function_string == null ){
		throw new Error('amigo.data.dispatch appears to be damaged!');
	    }
	    
	    // We have a string. Pop it into existance with eval.
	    var evalled_thing = eval(function_string);

	    // Final test, make sure it is a function.
	    if( ! is_def(evalled_thing) ||
		evalled_thing == null ||
		bbop.core.what_is(evalled_thing) != 'function' ){
		throw new Error('"' + function_string + '" did not resolve!');
	    }else{
		this.string_to_function_map[did] = evalled_thing;		
	    }

	}else if( is_def(fallback) ){
	    // Nothing could be found, so add the fallback if it is
	    // there.
	    this.string_to_function_map[did] = fallback;
	}else{
	    // Whelp, nothing there, so stick an indicator in.
	    this.string_to_function_map[did] = null;
	}
    }

    // We are now ensured that either we have a callable function or
    // null, so let's finish it--either the return value of the called
    // function or null.
    var retval = null;
    if( this.string_to_function_map[did] != null ){
	var cfunc = this.string_to_function_map[did];
	retval = cfunc(data, name, context);
    }
    return retval;
};
/* 
 * Package: echo.js
 * 
 * Namespace: amigo.handlers.echo
 * 
 * Static function handler for echoing inputs--really used for
 * teaching and testing.
 */

if ( typeof amigo == "undefined" ){ var amigo = {}; }
if ( typeof amigo.handlers == "undefined" ){ amigo.handlers = {}; }

/*
 * Function: echo
 * 
 * Applies bbop.core.dump to whatever comes in.
 * 
 * Parameters:
 *  thing
 * 
 * Returns:
 *  a string; it /will/ be a string
 * 
 * Also See: <bbop.handler>
 */
amigo.handlers.echo = function(thing, name, context){

    // Force a return string into existence.
    var retstr = null;
    try {
	retstr = bbop.core.dump(thing);
    } catch (x) {
	retstr = '';
    }

    // // Appaend any optional stuff.
    // var is_def = bbop.core.is_defined;
    // var what = bbop.core.what_is;
    // if( is_def(name) && what(name) == 'string' ){
    // 	retstr += ' (' + name + ')';
    // }
    // if( is_def(context) && what(context) == 'string' ){
    // 	retstr += ' (' + context + ')';
    // }

    return retstr;
};
/* 
 * Package: owl_class_expression.js
 * 
 * Namespace: amigo.handlers.owl_class_expression
 * 
 * Static function handler for displaying OWL class expression
 * results. To be used for GAF column 16 stuff.
 */

if ( typeof amigo == "undefined" ){ var amigo = {}; }
if ( typeof amigo.handlers == "undefined" ){ amigo.handlers = {}; }

/*
 * Function: owl_class_expression
 * 
 * Example incoming data (as a string or object):
 * 
 * : { relationship: {
 * :     relation: [{id: "RO:001234", label: "regulates"},
 * :                {id:"BFO:0003456", label: "hp"}], 
 * :     id: "MGI:MGI:185963",
 * :     label: "kidney"
 * :   }
 * : }
 * 
 * Parameters:
 *  JSON object as *[string or object]*; see above
 * 
 * Returns:
 *  HTML string
 * 
 * Also See: <bbop.handler>
 */
amigo.handlers.owl_class_expression = function(in_owlo){

    var retstr = "";

    // // Add logging.
    // var logger = new bbop.logger();
    // logger.DEBUG = true;
    // //logger.DEBUG = false;
    // function ll(str){ logger.kvetch(str); }

    // Aliases.
    var is_def = bbop.core.is_defined;
    var what_is = bbop.core.what_is;
    var loop = bbop.core.each;

    var owlo = in_owlo;
    if( what_is(owlo) == 'string' ){
	// This should be an unnecessary robustness check as
	// everything /should/ be a legit JSON string...but things
	// happen in testing. We'll check to make sure that it looks
	// like what it should be as well.
	if( in_owlo.charAt(0) == '{' &&
	    in_owlo.charAt(in_owlo.length-1) == '}' ){
	    owlo = bbop.json.parse(in_owlo) || {};
	}else{
	    // Looks like a normal string string.
	    // Do nothing for now, but catch in the next section.
	}
    }

    // Check to make sure that it looks right.
    if( what_is(owlo) == 'string' ){
	// Still a string means bad happened--we want to see that.
	retstr = owlo + '?';
    }else if( ! is_def(owlo) ||
	      ! is_def(owlo['relationship']) ||
	      ! what_is(owlo['relationship']) == 'object' ||
	      ! what_is(owlo['relationship']['relation']) == 'array' ||
	      ! is_def(owlo['relationship']['id']) ||
	      ! is_def(owlo['relationship']['label']) ){
	// 'Twas an error--ignore.
	//throw new Error('sproing!');
    }else{
	
	//throw new Error('sproing!');
	var link = new amigo.linker();

	// Okay, right structure--first assemble the relationships,
	// then tag onto end.
	var rel_buff = [];
	bbop.core.each(owlo['relationship']['relation'],
		       function(rel){
			   // Check to make sure that these are
			   // structured correctly as well.
			   var rel_id = rel['id'];
			   var rel_lbl = rel['label'];
			   if( is_def(rel_id) && is_def(rel_lbl) ){
			       var an =
				   link.anchor({id: rel_id, label: rel_lbl});
			       // Final check: if we didn't get
			       // anything reasonable, just a label.
			       if( ! an ){ an = rel_lbl; }
			       rel_buff.push(an);
			       // ll('in ' + rel_id + ' + ' + rel_lbl + ': ' + an);
			   }
		       });
	var ranc = link.anchor({id: owlo['relationship']['id'],
				label: owlo['relationship']['label']});
	// Again, a final check
	if( ! ranc ){ ranc = owlo['relationship']['label']; }
	retstr = rel_buff.join(' &rarr; ') + ' ' + ranc;
    }
    
    return retstr;
};
/* 
 * Package: golr.js
 * 
 * Namespace: amigo.data.golr
 * 
 * This package was automatically created during an AmiGO 2 installation
 * from the YAML configuration files that AmiGO pulls in.
 *
 * Useful information about GOlr. See the package <golr_conf.js>
 * for the API to interact with this data file.
 *
 * NOTE: This file is generated dynamically at installation time.
 * Hard to work with unit tests--hope it's not too bad. You have to
 * occasionally copy back to keep the unit tests sane.
 *
 * NOTE: This file has a slightly different latout from the YAML
 * configurations files--in addition instead of the fields
 * being in lists (fields), they are in hashes keyed by the
 * field id (fields_hash).
 */

// All of the server/instance-specific meta-data.
if ( typeof amigo == "undefined" ){ var amigo = {}; }
if ( typeof amigo.data == "undefined" ){ amigo.data = {}; }

/*
 * Variable: golr
 * 
 * The configuration for the data.
 * Essentially a JSONification of the OWLTools YAML files.
 * This should be consumed directly by <bbop.golr.conf>.
 */
amigo.data.golr = {
   "bbop_ann_ev_agg" : {
      "_strict" : 0,
      "description" : "A description of annotation evidence aggregate for GOlr and AmiGO.",
      "_outfile" : "/home/sjcarbon/local/src/git/amigo/metadata/ann_ev_agg-config.yaml",
      "id" : "bbop_ann_ev_agg",
      "searchable_extension" : "_searchable",
      "boost_weights" : "annotation_class^2.0 annotation_class_label^1.0 bioentity^2.0 bioentity_label^1.0 panther_family^1.0 panther_family_label^1.0 taxon_closure_label^1.0",
      "weight" : "-10",
      "result_weights" : "bioentity^4.0 annotation_class^3.0 taxon^2.0",
      "display_name" : "Advanced",
      "_infile" : "/home/sjcarbon/local/src/git/amigo/metadata/ann_ev_agg-config.yaml",
      "document_category" : "annotation_evidence_aggregate",
      "schema_generating" : "true",
      "fields" : [
         {
            "type" : "string",
            "indexed" : "true",
            "display_name" : "Acc",
            "property" : [],
            "cardinality" : "single",
            "description" : "Gene/product ID.",
            "searchable" : "false",
            "required" : "false",
            "id" : "id",
            "transform" : []
         },
         {
            "cardinality" : "single",
            "property" : [],
            "display_name" : "Gene/product ID",
            "indexed" : "true",
            "type" : "string",
            "transform" : [],
            "required" : "false",
            "id" : "bioentity",
            "searchable" : "false",
            "description" : "Column 1 + columns 2."
         },
         {
            "type" : "string",
            "property" : [],
            "display_name" : "Gene/product label",
            "cardinality" : "single",
            "indexed" : "true",
            "id" : "bioentity_label",
            "required" : "false",
            "description" : "Column 3.",
            "searchable" : "true",
            "transform" : []
         },
         {
            "type" : "string",
            "property" : [],
            "display_name" : "Annotation class",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "id" : "annotation_class",
            "description" : "Column 5.",
            "searchable" : "false",
            "transform" : []
         },
         {
            "transform" : [],
            "description" : "Column 5 + ontology.",
            "searchable" : "true",
            "id" : "annotation_class_label",
            "required" : "false",
            "indexed" : "true",
            "display_name" : "Annotation class label",
            "property" : [],
            "cardinality" : "single",
            "type" : "string"
         },
         {
            "indexed" : "true",
            "property" : [],
            "display_name" : "Evidence type",
            "cardinality" : "multi",
            "type" : "string",
            "transform" : [],
            "description" : "All evidence for this term/gene product pair",
            "searchable" : "false",
            "id" : "evidence_type_closure",
            "required" : "false"
         },
         {
            "type" : "string",
            "cardinality" : "multi",
            "property" : [],
            "display_name" : "Evidence with",
            "indexed" : "true",
            "id" : "evidence_with",
            "required" : "false",
            "searchable" : "false",
            "description" : "All column 8s for this term/gene product pair",
            "transform" : []
         },
         {
            "transform" : [],
            "id" : "taxon",
            "required" : "false",
            "description" : "Column 13: taxon.",
            "searchable" : "false",
            "display_name" : "Taxon",
            "property" : [],
            "cardinality" : "single",
            "indexed" : "true",
            "type" : "string"
         },
         {
            "required" : "false",
            "id" : "taxon_label",
            "description" : "Derived from C13 + ncbi_taxonomy.obo.",
            "searchable" : "true",
            "transform" : [],
            "type" : "string",
            "property" : [],
            "display_name" : "Taxon",
            "cardinality" : "single",
            "indexed" : "true"
         },
         {
            "transform" : [],
            "id" : "taxon_closure",
            "required" : "false",
            "description" : "IDs derived from C13 + ncbi_taxonomy.obo.",
            "searchable" : "false",
            "display_name" : "Taxon (IDs)",
            "property" : [],
            "cardinality" : "multi",
            "indexed" : "true",
            "type" : "string"
         },
         {
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "multi",
            "property" : [],
            "display_name" : "Taxon",
            "searchable" : "true",
            "description" : "Labels derived from C13 + ncbi_taxonomy.obo.",
            "id" : "taxon_closure_label",
            "required" : "false",
            "transform" : []
         },
         {
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "single",
            "property" : [],
            "display_name" : "Protein family",
            "searchable" : "true",
            "description" : "Family IDs that are associated with this entity.",
            "required" : "false",
            "id" : "panther_family",
            "transform" : []
         },
         {
            "id" : "panther_family_label",
            "required" : "false",
            "description" : "Families that are associated with this entity.",
            "searchable" : "true",
            "transform" : [],
            "type" : "string",
            "display_name" : "Family",
            "property" : [],
            "cardinality" : "single",
            "indexed" : "true"
         }
      ],
      "fields_hash" : {
         "annotation_class" : {
            "type" : "string",
            "property" : [],
            "display_name" : "Annotation class",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "id" : "annotation_class",
            "description" : "Column 5.",
            "searchable" : "false",
            "transform" : []
         },
         "taxon_label" : {
            "required" : "false",
            "id" : "taxon_label",
            "description" : "Derived from C13 + ncbi_taxonomy.obo.",
            "searchable" : "true",
            "transform" : [],
            "type" : "string",
            "property" : [],
            "display_name" : "Taxon",
            "cardinality" : "single",
            "indexed" : "true"
         },
         "annotation_class_label" : {
            "transform" : [],
            "description" : "Column 5 + ontology.",
            "searchable" : "true",
            "id" : "annotation_class_label",
            "required" : "false",
            "indexed" : "true",
            "display_name" : "Annotation class label",
            "property" : [],
            "cardinality" : "single",
            "type" : "string"
         },
         "taxon_closure_label" : {
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "multi",
            "property" : [],
            "display_name" : "Taxon",
            "searchable" : "true",
            "description" : "Labels derived from C13 + ncbi_taxonomy.obo.",
            "id" : "taxon_closure_label",
            "required" : "false",
            "transform" : []
         },
         "panther_family" : {
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "single",
            "property" : [],
            "display_name" : "Protein family",
            "searchable" : "true",
            "description" : "Family IDs that are associated with this entity.",
            "required" : "false",
            "id" : "panther_family",
            "transform" : []
         },
         "evidence_with" : {
            "type" : "string",
            "cardinality" : "multi",
            "property" : [],
            "display_name" : "Evidence with",
            "indexed" : "true",
            "id" : "evidence_with",
            "required" : "false",
            "searchable" : "false",
            "description" : "All column 8s for this term/gene product pair",
            "transform" : []
         },
         "taxon_closure" : {
            "transform" : [],
            "id" : "taxon_closure",
            "required" : "false",
            "description" : "IDs derived from C13 + ncbi_taxonomy.obo.",
            "searchable" : "false",
            "display_name" : "Taxon (IDs)",
            "property" : [],
            "cardinality" : "multi",
            "indexed" : "true",
            "type" : "string"
         },
         "taxon" : {
            "transform" : [],
            "id" : "taxon",
            "required" : "false",
            "description" : "Column 13: taxon.",
            "searchable" : "false",
            "display_name" : "Taxon",
            "property" : [],
            "cardinality" : "single",
            "indexed" : "true",
            "type" : "string"
         },
         "bioentity" : {
            "cardinality" : "single",
            "property" : [],
            "display_name" : "Gene/product ID",
            "indexed" : "true",
            "type" : "string",
            "transform" : [],
            "required" : "false",
            "id" : "bioentity",
            "searchable" : "false",
            "description" : "Column 1 + columns 2."
         },
         "id" : {
            "type" : "string",
            "indexed" : "true",
            "display_name" : "Acc",
            "property" : [],
            "cardinality" : "single",
            "description" : "Gene/product ID.",
            "searchable" : "false",
            "required" : "false",
            "id" : "id",
            "transform" : []
         },
         "panther_family_label" : {
            "id" : "panther_family_label",
            "required" : "false",
            "description" : "Families that are associated with this entity.",
            "searchable" : "true",
            "transform" : [],
            "type" : "string",
            "display_name" : "Family",
            "property" : [],
            "cardinality" : "single",
            "indexed" : "true"
         },
         "bioentity_label" : {
            "type" : "string",
            "property" : [],
            "display_name" : "Gene/product label",
            "cardinality" : "single",
            "indexed" : "true",
            "id" : "bioentity_label",
            "required" : "false",
            "description" : "Column 3.",
            "searchable" : "true",
            "transform" : []
         },
         "evidence_type_closure" : {
            "indexed" : "true",
            "property" : [],
            "display_name" : "Evidence type",
            "cardinality" : "multi",
            "type" : "string",
            "transform" : [],
            "description" : "All evidence for this term/gene product pair",
            "searchable" : "false",
            "id" : "evidence_type_closure",
            "required" : "false"
         }
      },
      "filter_weights" : "evidence_type_closure^4.0 evidence_with^3.0 taxon_closure_label^2.0"
   },
   "annotation" : {
      "boost_weights" : "annotation_class^2.0 annotation_class_label^1.0 bioentity^2.0 bioentity_label^1.0 bioentity_name^1.0 annotation_extension_class^2.0 annotation_extension_class_label^1.0 reference^1.0 panther_family^1.0 panther_family_label^1.0 bioentity_isoform^1.0 regulates_closure^1.0 regulates_closure_label^1.0",
      "display_name" : "Annotations",
      "_infile" : "/home/sjcarbon/local/src/git/amigo/metadata/ann-config.yaml",
      "result_weights" : "bioentity^7.0 bioentity_name^6.0 qualifier^5.0 annotation_class^4.7 annotation_extension_json^4.5 source^4.0 taxon^3.0 evidence_type^2.5 evidence_with^2.0 panther_family^1.5 bioentity_isoform^0.5 reference^0.25",
      "weight" : "20",
      "document_category" : "annotation",
      "schema_generating" : "true",
      "filter_weights" : "source^7.0 assigned_by^6.5 aspect^6.25 evidence_type_closure^6.0 panther_family_label^5.5 qualifier^5.25 taxon_closure_label^5.0 annotation_class_label^4.5 regulates_closure_label^3.0 annotation_extension_class_closure_label^2.0",
      "fields_hash" : {
         "bioentity_internal_id" : {
            "type" : "string",
            "display_name" : "This should not be displayed",
            "property" : [],
            "cardinality" : "single",
            "indexed" : "false",
            "id" : "bioentity_internal_id",
            "required" : "false",
            "description" : "The bioentity ID used at the database of origin.",
            "searchable" : "false",
            "transform" : []
         },
         "panther_family_label" : {
            "type" : "string",
            "display_name" : "PANTHER family",
            "property" : [],
            "cardinality" : "single",
            "indexed" : "true",
            "id" : "panther_family_label",
            "required" : "false",
            "description" : "PANTHER families that are associated with this entity.",
            "searchable" : "true",
            "transform" : []
         },
         "secondary_taxon" : {
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "display_name" : "Secondary taxon",
            "cardinality" : "single",
            "description" : "Secondary taxon.",
            "searchable" : "false",
            "id" : "secondary_taxon",
            "required" : "false",
            "transform" : []
         },
         "qualifier" : {
            "transform" : [],
            "description" : "Annotation qualifier.",
            "searchable" : "false",
            "required" : "false",
            "id" : "qualifier",
            "indexed" : "true",
            "property" : [],
            "display_name" : "Qualifier",
            "cardinality" : "multi",
            "type" : "string"
         },
         "panther_family" : {
            "description" : "PANTHER families that are associated with this entity.",
            "searchable" : "true",
            "required" : "false",
            "id" : "panther_family",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "display_name" : "PANTHER family",
            "property" : [],
            "cardinality" : "single"
         },
         "evidence_with" : {
            "indexed" : "true",
            "cardinality" : "multi",
            "display_name" : "Evidence with",
            "property" : [],
            "type" : "string",
            "transform" : [],
            "searchable" : "false",
            "description" : "Evidence with/from.",
            "id" : "evidence_with",
            "required" : "false"
         },
         "is_redundant_for" : {
            "type" : "string",
            "property" : [],
            "display_name" : "Redundant for",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "id" : "is_redundant_for",
            "description" : "Rational for redundancy of annotation.",
            "searchable" : "false",
            "transform" : []
         },
         "reference" : {
            "transform" : [],
            "id" : "reference",
            "required" : "false",
            "searchable" : "false",
            "description" : "Database reference.",
            "cardinality" : "multi",
            "property" : [],
            "display_name" : "Reference",
            "indexed" : "true",
            "type" : "string"
         },
         "taxon_label" : {
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "display_name" : "Taxon",
            "cardinality" : "single",
            "description" : "Taxonomic group and ancestral groups.",
            "searchable" : "true",
            "id" : "taxon_label",
            "required" : "false",
            "transform" : []
         },
         "annotation_extension_class" : {
            "type" : "string",
            "indexed" : "true",
            "display_name" : "Annotation extension",
            "property" : [],
            "cardinality" : "multi",
            "description" : "Extension class for the annotation.",
            "searchable" : "false",
            "id" : "annotation_extension_class",
            "required" : "false",
            "transform" : []
         },
         "annotation_extension_class_closure_label" : {
            "searchable" : "true",
            "description" : "Extension class for the annotation.",
            "required" : "false",
            "id" : "annotation_extension_class_closure_label",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "multi",
            "display_name" : "Annotation extension",
            "property" : []
         },
         "source" : {
            "required" : "false",
            "id" : "source",
            "searchable" : "false",
            "description" : "Database source.",
            "transform" : [],
            "type" : "string",
            "cardinality" : "single",
            "property" : [],
            "display_name" : "Source",
            "indexed" : "true"
         },
         "taxon_closure_label" : {
            "transform" : [],
            "id" : "taxon_closure_label",
            "required" : "false",
            "description" : "Taxonomic group and ancestral groups.",
            "searchable" : "true",
            "property" : [],
            "display_name" : "Taxon",
            "cardinality" : "multi",
            "indexed" : "true",
            "type" : "string"
         },
         "secondary_taxon_label" : {
            "type" : "string",
            "display_name" : "Secondary taxon",
            "property" : [],
            "cardinality" : "single",
            "indexed" : "true",
            "id" : "secondary_taxon_label",
            "required" : "false",
            "description" : "Secondary taxon.",
            "searchable" : "true",
            "transform" : []
         },
         "isa_partof_closure" : {
            "id" : "isa_partof_closure",
            "required" : "false",
            "searchable" : "false",
            "description" : "Annotations for this term or its children (over is_a/part_of).",
            "transform" : [],
            "type" : "string",
            "cardinality" : "multi",
            "property" : [],
            "display_name" : "Involved in",
            "indexed" : "true"
         },
         "bioentity_isoform" : {
            "transform" : [],
            "searchable" : "false",
            "description" : "Biological isoform.",
            "id" : "bioentity_isoform",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "property" : [],
            "display_name" : "Isoform",
            "type" : "string"
         },
         "assigned_by" : {
            "transform" : [],
            "searchable" : "false",
            "description" : "Annotations assigned by group.",
            "id" : "assigned_by",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "property" : [],
            "display_name" : "Assigned by",
            "type" : "string"
         },
         "taxon_closure" : {
            "type" : "string",
            "cardinality" : "multi",
            "display_name" : "Taxon",
            "property" : [],
            "indexed" : "true",
            "required" : "false",
            "id" : "taxon_closure",
            "searchable" : "false",
            "description" : "Taxonomic group and ancestral groups.",
            "transform" : []
         },
         "annotation_extension_json" : {
            "id" : "annotation_extension_json",
            "required" : "false",
            "searchable" : "false",
            "description" : "Extension class for the annotation (JSON).",
            "transform" : [],
            "type" : "string",
            "cardinality" : "multi",
            "display_name" : "Annotation extension",
            "property" : [],
            "indexed" : "true"
         },
         "evidence_type_closure" : {
            "transform" : [],
            "id" : "evidence_type_closure",
            "required" : "false",
            "searchable" : "false",
            "description" : "All evidence (evidence closure) for this annotation",
            "cardinality" : "multi",
            "display_name" : "Evidence type",
            "property" : [],
            "indexed" : "true",
            "type" : "string"
         },
         "evidence_type" : {
            "type" : "string",
            "indexed" : "true",
            "display_name" : "Evidence",
            "property" : [],
            "cardinality" : "single",
            "description" : "Evidence type.",
            "searchable" : "false",
            "required" : "false",
            "id" : "evidence_type",
            "transform" : []
         },
         "bioentity" : {
            "id" : "bioentity",
            "required" : "false",
            "description" : "Gene or gene product identifiers.",
            "searchable" : "false",
            "transform" : [],
            "type" : "string",
            "display_name" : "Gene/product",
            "property" : [],
            "cardinality" : "single",
            "indexed" : "true"
         },
         "secondary_taxon_closure" : {
            "description" : "Secondary taxon closure.",
            "searchable" : "false",
            "id" : "secondary_taxon_closure",
            "required" : "false",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "display_name" : "Secondary taxon",
            "cardinality" : "multi"
         },
         "date" : {
            "type" : "string",
            "cardinality" : "single",
            "display_name" : "Date",
            "property" : [],
            "indexed" : "true",
            "id" : "date",
            "required" : "false",
            "searchable" : "false",
            "description" : "Date of assignment.",
            "transform" : []
         },
         "secondary_taxon_closure_label" : {
            "cardinality" : "multi",
            "property" : [],
            "display_name" : "Secondary taxon",
            "indexed" : "true",
            "type" : "string",
            "transform" : [],
            "required" : "false",
            "id" : "secondary_taxon_closure_label",
            "searchable" : "true",
            "description" : "Secondary taxon closure."
         },
         "regulates_closure" : {
            "id" : "regulates_closure",
            "required" : "false",
            "searchable" : "false",
            "description" : "Annotations for this term or its children (over regulates).",
            "transform" : [],
            "type" : "string",
            "cardinality" : "multi",
            "display_name" : "Inferred annotation",
            "property" : [],
            "indexed" : "true"
         },
         "type" : {
            "required" : "false",
            "id" : "type",
            "description" : "Type class.",
            "searchable" : "false",
            "transform" : [],
            "type" : "string",
            "property" : [],
            "display_name" : "Type class id",
            "cardinality" : "single",
            "indexed" : "true"
         },
         "annotation_extension_class_label" : {
            "searchable" : "true",
            "description" : "Extension class for the annotation.",
            "id" : "annotation_extension_class_label",
            "required" : "false",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "multi",
            "display_name" : "Annotation extension",
            "property" : []
         },
         "bioentity_name" : {
            "indexed" : "true",
            "display_name" : "Gene/product name",
            "property" : [],
            "cardinality" : "single",
            "type" : "string",
            "transform" : [],
            "description" : "The full name of the gene or gene product.",
            "searchable" : "true",
            "required" : "false",
            "id" : "bioentity_name"
         },
         "synonym" : {
            "type" : "string",
            "property" : [],
            "display_name" : "Synonym",
            "cardinality" : "multi",
            "indexed" : "true",
            "id" : "synonym",
            "required" : "false",
            "description" : "Gene or gene product synonyms.",
            "searchable" : "false",
            "transform" : []
         },
         "has_participant_closure" : {
            "indexed" : "true",
            "display_name" : "Has participant (IDs)",
            "property" : [],
            "cardinality" : "multi",
            "type" : "string",
            "transform" : [],
            "description" : "Closure of ids/accs over has_participant.",
            "searchable" : "false",
            "id" : "has_participant_closure",
            "required" : "false"
         },
         "isa_partof_closure_label" : {
            "indexed" : "true",
            "cardinality" : "multi",
            "display_name" : "Involved in",
            "property" : [],
            "type" : "string",
            "transform" : [],
            "searchable" : "true",
            "description" : "Annotations for this term or its children (over is_a/part_of).",
            "required" : "false",
            "id" : "isa_partof_closure_label"
         },
         "taxon" : {
            "transform" : [],
            "id" : "taxon",
            "required" : "false",
            "searchable" : "false",
            "description" : "Taxonomic group.",
            "cardinality" : "single",
            "display_name" : "Taxon",
            "property" : [],
            "indexed" : "true",
            "type" : "string"
         },
         "bioentity_label" : {
            "description" : "Gene or gene product identifiers.",
            "searchable" : "true",
            "required" : "false",
            "id" : "bioentity_label",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "display_name" : "Gene/product",
            "cardinality" : "single"
         },
         "id" : {
            "type" : "string",
            "property" : [],
            "display_name" : "Acc",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "id" : "id",
            "description" : "A unique (and internal) combination of bioentity and ontology class.",
            "searchable" : "false",
            "transform" : []
         },
         "regulates_closure_label" : {
            "transform" : [],
            "description" : "Annotations for this term or its children (over regulates).",
            "searchable" : "true",
            "required" : "false",
            "id" : "regulates_closure_label",
            "indexed" : "true",
            "display_name" : "Inferred annotation",
            "property" : [],
            "cardinality" : "multi",
            "type" : "string"
         },
         "has_participant_closure_label" : {
            "transform" : [],
            "id" : "has_participant_closure_label",
            "required" : "false",
            "description" : "Closure of labels over has_participant.",
            "searchable" : "true",
            "display_name" : "Has participant",
            "property" : [],
            "cardinality" : "multi",
            "indexed" : "true",
            "type" : "string"
         },
         "aspect" : {
            "cardinality" : "single",
            "display_name" : "Ontology (aspect)",
            "property" : [],
            "indexed" : "true",
            "type" : "string",
            "transform" : [],
            "id" : "aspect",
            "required" : "false",
            "searchable" : "false",
            "description" : "Ontology aspect."
         },
         "annotation_class_label" : {
            "id" : "annotation_class_label",
            "required" : "false",
            "description" : "Direct annotations.",
            "searchable" : "true",
            "transform" : [],
            "type" : "string",
            "property" : [],
            "display_name" : "Direct annotation",
            "cardinality" : "single",
            "indexed" : "true"
         },
         "annotation_class" : {
            "id" : "annotation_class",
            "required" : "false",
            "searchable" : "false",
            "description" : "Direct annotations.",
            "transform" : [],
            "type" : "string",
            "cardinality" : "single",
            "display_name" : "Direct annotation",
            "property" : [],
            "indexed" : "true"
         },
         "annotation_extension_class_closure" : {
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "multi",
            "display_name" : "Annotation extension",
            "property" : [],
            "searchable" : "false",
            "description" : "Extension class for the annotation.",
            "required" : "false",
            "id" : "annotation_extension_class_closure",
            "transform" : []
         }
      },
      "fields" : [
         {
            "type" : "string",
            "property" : [],
            "display_name" : "Acc",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "id" : "id",
            "description" : "A unique (and internal) combination of bioentity and ontology class.",
            "searchable" : "false",
            "transform" : []
         },
         {
            "required" : "false",
            "id" : "source",
            "searchable" : "false",
            "description" : "Database source.",
            "transform" : [],
            "type" : "string",
            "cardinality" : "single",
            "property" : [],
            "display_name" : "Source",
            "indexed" : "true"
         },
         {
            "required" : "false",
            "id" : "type",
            "description" : "Type class.",
            "searchable" : "false",
            "transform" : [],
            "type" : "string",
            "property" : [],
            "display_name" : "Type class id",
            "cardinality" : "single",
            "indexed" : "true"
         },
         {
            "type" : "string",
            "cardinality" : "single",
            "display_name" : "Date",
            "property" : [],
            "indexed" : "true",
            "id" : "date",
            "required" : "false",
            "searchable" : "false",
            "description" : "Date of assignment.",
            "transform" : []
         },
         {
            "transform" : [],
            "searchable" : "false",
            "description" : "Annotations assigned by group.",
            "id" : "assigned_by",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "property" : [],
            "display_name" : "Assigned by",
            "type" : "string"
         },
         {
            "type" : "string",
            "property" : [],
            "display_name" : "Redundant for",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "id" : "is_redundant_for",
            "description" : "Rational for redundancy of annotation.",
            "searchable" : "false",
            "transform" : []
         },
         {
            "transform" : [],
            "id" : "taxon",
            "required" : "false",
            "searchable" : "false",
            "description" : "Taxonomic group.",
            "cardinality" : "single",
            "display_name" : "Taxon",
            "property" : [],
            "indexed" : "true",
            "type" : "string"
         },
         {
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "display_name" : "Taxon",
            "cardinality" : "single",
            "description" : "Taxonomic group and ancestral groups.",
            "searchable" : "true",
            "id" : "taxon_label",
            "required" : "false",
            "transform" : []
         },
         {
            "type" : "string",
            "cardinality" : "multi",
            "display_name" : "Taxon",
            "property" : [],
            "indexed" : "true",
            "required" : "false",
            "id" : "taxon_closure",
            "searchable" : "false",
            "description" : "Taxonomic group and ancestral groups.",
            "transform" : []
         },
         {
            "transform" : [],
            "id" : "taxon_closure_label",
            "required" : "false",
            "description" : "Taxonomic group and ancestral groups.",
            "searchable" : "true",
            "property" : [],
            "display_name" : "Taxon",
            "cardinality" : "multi",
            "indexed" : "true",
            "type" : "string"
         },
         {
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "display_name" : "Secondary taxon",
            "cardinality" : "single",
            "description" : "Secondary taxon.",
            "searchable" : "false",
            "id" : "secondary_taxon",
            "required" : "false",
            "transform" : []
         },
         {
            "type" : "string",
            "display_name" : "Secondary taxon",
            "property" : [],
            "cardinality" : "single",
            "indexed" : "true",
            "id" : "secondary_taxon_label",
            "required" : "false",
            "description" : "Secondary taxon.",
            "searchable" : "true",
            "transform" : []
         },
         {
            "description" : "Secondary taxon closure.",
            "searchable" : "false",
            "id" : "secondary_taxon_closure",
            "required" : "false",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "display_name" : "Secondary taxon",
            "cardinality" : "multi"
         },
         {
            "cardinality" : "multi",
            "property" : [],
            "display_name" : "Secondary taxon",
            "indexed" : "true",
            "type" : "string",
            "transform" : [],
            "required" : "false",
            "id" : "secondary_taxon_closure_label",
            "searchable" : "true",
            "description" : "Secondary taxon closure."
         },
         {
            "id" : "isa_partof_closure",
            "required" : "false",
            "searchable" : "false",
            "description" : "Annotations for this term or its children (over is_a/part_of).",
            "transform" : [],
            "type" : "string",
            "cardinality" : "multi",
            "property" : [],
            "display_name" : "Involved in",
            "indexed" : "true"
         },
         {
            "indexed" : "true",
            "cardinality" : "multi",
            "display_name" : "Involved in",
            "property" : [],
            "type" : "string",
            "transform" : [],
            "searchable" : "true",
            "description" : "Annotations for this term or its children (over is_a/part_of).",
            "required" : "false",
            "id" : "isa_partof_closure_label"
         },
         {
            "id" : "regulates_closure",
            "required" : "false",
            "searchable" : "false",
            "description" : "Annotations for this term or its children (over regulates).",
            "transform" : [],
            "type" : "string",
            "cardinality" : "multi",
            "display_name" : "Inferred annotation",
            "property" : [],
            "indexed" : "true"
         },
         {
            "transform" : [],
            "description" : "Annotations for this term or its children (over regulates).",
            "searchable" : "true",
            "required" : "false",
            "id" : "regulates_closure_label",
            "indexed" : "true",
            "display_name" : "Inferred annotation",
            "property" : [],
            "cardinality" : "multi",
            "type" : "string"
         },
         {
            "indexed" : "true",
            "display_name" : "Has participant (IDs)",
            "property" : [],
            "cardinality" : "multi",
            "type" : "string",
            "transform" : [],
            "description" : "Closure of ids/accs over has_participant.",
            "searchable" : "false",
            "id" : "has_participant_closure",
            "required" : "false"
         },
         {
            "transform" : [],
            "id" : "has_participant_closure_label",
            "required" : "false",
            "description" : "Closure of labels over has_participant.",
            "searchable" : "true",
            "display_name" : "Has participant",
            "property" : [],
            "cardinality" : "multi",
            "indexed" : "true",
            "type" : "string"
         },
         {
            "type" : "string",
            "property" : [],
            "display_name" : "Synonym",
            "cardinality" : "multi",
            "indexed" : "true",
            "id" : "synonym",
            "required" : "false",
            "description" : "Gene or gene product synonyms.",
            "searchable" : "false",
            "transform" : []
         },
         {
            "id" : "bioentity",
            "required" : "false",
            "description" : "Gene or gene product identifiers.",
            "searchable" : "false",
            "transform" : [],
            "type" : "string",
            "display_name" : "Gene/product",
            "property" : [],
            "cardinality" : "single",
            "indexed" : "true"
         },
         {
            "description" : "Gene or gene product identifiers.",
            "searchable" : "true",
            "required" : "false",
            "id" : "bioentity_label",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "display_name" : "Gene/product",
            "cardinality" : "single"
         },
         {
            "indexed" : "true",
            "display_name" : "Gene/product name",
            "property" : [],
            "cardinality" : "single",
            "type" : "string",
            "transform" : [],
            "description" : "The full name of the gene or gene product.",
            "searchable" : "true",
            "required" : "false",
            "id" : "bioentity_name"
         },
         {
            "type" : "string",
            "display_name" : "This should not be displayed",
            "property" : [],
            "cardinality" : "single",
            "indexed" : "false",
            "id" : "bioentity_internal_id",
            "required" : "false",
            "description" : "The bioentity ID used at the database of origin.",
            "searchable" : "false",
            "transform" : []
         },
         {
            "transform" : [],
            "description" : "Annotation qualifier.",
            "searchable" : "false",
            "required" : "false",
            "id" : "qualifier",
            "indexed" : "true",
            "property" : [],
            "display_name" : "Qualifier",
            "cardinality" : "multi",
            "type" : "string"
         },
         {
            "id" : "annotation_class",
            "required" : "false",
            "searchable" : "false",
            "description" : "Direct annotations.",
            "transform" : [],
            "type" : "string",
            "cardinality" : "single",
            "display_name" : "Direct annotation",
            "property" : [],
            "indexed" : "true"
         },
         {
            "id" : "annotation_class_label",
            "required" : "false",
            "description" : "Direct annotations.",
            "searchable" : "true",
            "transform" : [],
            "type" : "string",
            "property" : [],
            "display_name" : "Direct annotation",
            "cardinality" : "single",
            "indexed" : "true"
         },
         {
            "cardinality" : "single",
            "display_name" : "Ontology (aspect)",
            "property" : [],
            "indexed" : "true",
            "type" : "string",
            "transform" : [],
            "id" : "aspect",
            "required" : "false",
            "searchable" : "false",
            "description" : "Ontology aspect."
         },
         {
            "transform" : [],
            "searchable" : "false",
            "description" : "Biological isoform.",
            "id" : "bioentity_isoform",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "property" : [],
            "display_name" : "Isoform",
            "type" : "string"
         },
         {
            "type" : "string",
            "indexed" : "true",
            "display_name" : "Evidence",
            "property" : [],
            "cardinality" : "single",
            "description" : "Evidence type.",
            "searchable" : "false",
            "required" : "false",
            "id" : "evidence_type",
            "transform" : []
         },
         {
            "transform" : [],
            "id" : "evidence_type_closure",
            "required" : "false",
            "searchable" : "false",
            "description" : "All evidence (evidence closure) for this annotation",
            "cardinality" : "multi",
            "display_name" : "Evidence type",
            "property" : [],
            "indexed" : "true",
            "type" : "string"
         },
         {
            "indexed" : "true",
            "cardinality" : "multi",
            "display_name" : "Evidence with",
            "property" : [],
            "type" : "string",
            "transform" : [],
            "searchable" : "false",
            "description" : "Evidence with/from.",
            "id" : "evidence_with",
            "required" : "false"
         },
         {
            "transform" : [],
            "id" : "reference",
            "required" : "false",
            "searchable" : "false",
            "description" : "Database reference.",
            "cardinality" : "multi",
            "property" : [],
            "display_name" : "Reference",
            "indexed" : "true",
            "type" : "string"
         },
         {
            "type" : "string",
            "indexed" : "true",
            "display_name" : "Annotation extension",
            "property" : [],
            "cardinality" : "multi",
            "description" : "Extension class for the annotation.",
            "searchable" : "false",
            "id" : "annotation_extension_class",
            "required" : "false",
            "transform" : []
         },
         {
            "searchable" : "true",
            "description" : "Extension class for the annotation.",
            "id" : "annotation_extension_class_label",
            "required" : "false",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "multi",
            "display_name" : "Annotation extension",
            "property" : []
         },
         {
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "multi",
            "display_name" : "Annotation extension",
            "property" : [],
            "searchable" : "false",
            "description" : "Extension class for the annotation.",
            "required" : "false",
            "id" : "annotation_extension_class_closure",
            "transform" : []
         },
         {
            "searchable" : "true",
            "description" : "Extension class for the annotation.",
            "required" : "false",
            "id" : "annotation_extension_class_closure_label",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "multi",
            "display_name" : "Annotation extension",
            "property" : []
         },
         {
            "id" : "annotation_extension_json",
            "required" : "false",
            "searchable" : "false",
            "description" : "Extension class for the annotation (JSON).",
            "transform" : [],
            "type" : "string",
            "cardinality" : "multi",
            "display_name" : "Annotation extension",
            "property" : [],
            "indexed" : "true"
         },
         {
            "description" : "PANTHER families that are associated with this entity.",
            "searchable" : "true",
            "required" : "false",
            "id" : "panther_family",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "display_name" : "PANTHER family",
            "property" : [],
            "cardinality" : "single"
         },
         {
            "type" : "string",
            "display_name" : "PANTHER family",
            "property" : [],
            "cardinality" : "single",
            "indexed" : "true",
            "id" : "panther_family_label",
            "required" : "false",
            "description" : "PANTHER families that are associated with this entity.",
            "searchable" : "true",
            "transform" : []
         }
      ],
      "_strict" : 0,
      "description" : "Associations between GO terms and genes or gene products.",
      "searchable_extension" : "_searchable",
      "id" : "annotation",
      "_outfile" : "/home/sjcarbon/local/src/git/amigo/metadata/ann-config.yaml"
   },
   "bbop_term_ac" : {
      "description" : "Easily find ontology classes in GO. For personality only - not a schema configuration.",
      "id" : "bbop_term_ac",
      "_outfile" : "/home/sjcarbon/local/src/git/amigo/metadata/term-autocomplete-config.yaml",
      "searchable_extension" : "_searchable",
      "_strict" : 0,
      "schema_generating" : "false",
      "document_category" : "ontology_class",
      "fields_hash" : {
         "id" : {
            "transform" : [],
            "searchable" : "false",
            "description" : "Term acc/ID.",
            "required" : "false",
            "id" : "id",
            "indexed" : "true",
            "cardinality" : "single",
            "display_name" : "Acc",
            "property" : [],
            "type" : "string"
         },
         "annotation_class_label" : {
            "id" : "annotation_class_label",
            "required" : "false",
            "description" : "Common term name.",
            "searchable" : "true",
            "transform" : [],
            "type" : "string",
            "property" : [],
            "display_name" : "Term",
            "cardinality" : "single",
            "indexed" : "true"
         },
         "synonym" : {
            "required" : "false",
            "id" : "synonym",
            "description" : "Term synonyms.",
            "searchable" : "true",
            "transform" : [],
            "type" : "string",
            "display_name" : "Synonyms",
            "property" : [],
            "cardinality" : "multi",
            "indexed" : "true"
         },
         "alternate_id" : {
            "transform" : [],
            "required" : "false",
            "id" : "alternate_id",
            "searchable" : "false",
            "description" : "Alternate term id.",
            "cardinality" : "multi",
            "property" : [],
            "display_name" : "Alt ID",
            "indexed" : "true",
            "type" : "string"
         },
         "annotation_class" : {
            "searchable" : "false",
            "description" : "Term acc/ID.",
            "required" : "false",
            "id" : "annotation_class",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "single",
            "display_name" : "Term",
            "property" : []
         }
      },
      "fields" : [
         {
            "transform" : [],
            "searchable" : "false",
            "description" : "Term acc/ID.",
            "required" : "false",
            "id" : "id",
            "indexed" : "true",
            "cardinality" : "single",
            "display_name" : "Acc",
            "property" : [],
            "type" : "string"
         },
         {
            "searchable" : "false",
            "description" : "Term acc/ID.",
            "required" : "false",
            "id" : "annotation_class",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "single",
            "display_name" : "Term",
            "property" : []
         },
         {
            "id" : "annotation_class_label",
            "required" : "false",
            "description" : "Common term name.",
            "searchable" : "true",
            "transform" : [],
            "type" : "string",
            "property" : [],
            "display_name" : "Term",
            "cardinality" : "single",
            "indexed" : "true"
         },
         {
            "required" : "false",
            "id" : "synonym",
            "description" : "Term synonyms.",
            "searchable" : "true",
            "transform" : [],
            "type" : "string",
            "display_name" : "Synonyms",
            "property" : [],
            "cardinality" : "multi",
            "indexed" : "true"
         },
         {
            "transform" : [],
            "required" : "false",
            "id" : "alternate_id",
            "searchable" : "false",
            "description" : "Alternate term id.",
            "cardinality" : "multi",
            "property" : [],
            "display_name" : "Alt ID",
            "indexed" : "true",
            "type" : "string"
         }
      ],
      "filter_weights" : "annotation_class^8.0 synonym^3.0 alternate_id^2.0",
      "boost_weights" : "annotation_class^5.0 annotation_class_label^5.0 synonym^1.0 alternate_id^1.0",
      "weight" : "-20",
      "display_name" : "Term autocomplete",
      "_infile" : "/home/sjcarbon/local/src/git/amigo/metadata/term-autocomplete-config.yaml",
      "result_weights" : "annotation_class^8.0 synonym^3.0 alternate_id^2.0"
   },
   "family" : {
      "description" : "Information about protein (PANTHER) families.",
      "searchable_extension" : "_searchable",
      "id" : "family",
      "_outfile" : "/home/sjcarbon/local/src/git/amigo/metadata/protein-family-config.yaml",
      "_strict" : 0,
      "document_category" : "family",
      "schema_generating" : "true",
      "filter_weights" : "bioentity_list_label^1.0",
      "fields_hash" : {
         "panther_family" : {
            "type" : "string",
            "cardinality" : "single",
            "property" : [],
            "display_name" : "PANTHER family",
            "indexed" : "true",
            "id" : "panther_family",
            "required" : "false",
            "searchable" : "true",
            "description" : "PANTHER family IDs that are associated with this entity.",
            "transform" : []
         },
         "bioentity_list" : {
            "description" : "Gene/products annotated with this protein family.",
            "searchable" : "false",
            "id" : "bioentity_list",
            "required" : "false",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "display_name" : "Gene/products",
            "cardinality" : "multi"
         },
         "bioentity_list_label" : {
            "transform" : [],
            "searchable" : "false",
            "description" : "Gene/products annotated with this protein family.",
            "id" : "bioentity_list_label",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "display_name" : "Gene/products",
            "property" : [],
            "type" : "string"
         },
         "id" : {
            "transform" : [],
            "id" : "id",
            "required" : "false",
            "description" : "Family ID.",
            "searchable" : "false",
            "display_name" : "Acc",
            "property" : [],
            "cardinality" : "single",
            "indexed" : "true",
            "type" : "string"
         },
         "phylo_graph_json" : {
            "type" : "string",
            "indexed" : "false",
            "display_name" : "This should not be displayed",
            "property" : [],
            "cardinality" : "single",
            "description" : "JSON blob form of the phylogenic tree.",
            "searchable" : "false",
            "id" : "phylo_graph_json",
            "required" : "false",
            "transform" : []
         },
         "panther_family_label" : {
            "indexed" : "true",
            "cardinality" : "single",
            "property" : [],
            "display_name" : "PANTHER family",
            "type" : "string",
            "transform" : [],
            "searchable" : "true",
            "description" : "PANTHER families that are associated with this entity.",
            "id" : "panther_family_label",
            "required" : "false"
         }
      },
      "fields" : [
         {
            "transform" : [],
            "id" : "id",
            "required" : "false",
            "description" : "Family ID.",
            "searchable" : "false",
            "display_name" : "Acc",
            "property" : [],
            "cardinality" : "single",
            "indexed" : "true",
            "type" : "string"
         },
         {
            "type" : "string",
            "cardinality" : "single",
            "property" : [],
            "display_name" : "PANTHER family",
            "indexed" : "true",
            "id" : "panther_family",
            "required" : "false",
            "searchable" : "true",
            "description" : "PANTHER family IDs that are associated with this entity.",
            "transform" : []
         },
         {
            "indexed" : "true",
            "cardinality" : "single",
            "property" : [],
            "display_name" : "PANTHER family",
            "type" : "string",
            "transform" : [],
            "searchable" : "true",
            "description" : "PANTHER families that are associated with this entity.",
            "id" : "panther_family_label",
            "required" : "false"
         },
         {
            "type" : "string",
            "indexed" : "false",
            "display_name" : "This should not be displayed",
            "property" : [],
            "cardinality" : "single",
            "description" : "JSON blob form of the phylogenic tree.",
            "searchable" : "false",
            "id" : "phylo_graph_json",
            "required" : "false",
            "transform" : []
         },
         {
            "description" : "Gene/products annotated with this protein family.",
            "searchable" : "false",
            "id" : "bioentity_list",
            "required" : "false",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "display_name" : "Gene/products",
            "cardinality" : "multi"
         },
         {
            "transform" : [],
            "searchable" : "false",
            "description" : "Gene/products annotated with this protein family.",
            "id" : "bioentity_list_label",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "display_name" : "Gene/products",
            "property" : [],
            "type" : "string"
         }
      ],
      "boost_weights" : "panther_family^2.0 panther_family_label^2.0 bioentity_list^1.0 bioentity_list_label^1.0",
      "_infile" : "/home/sjcarbon/local/src/git/amigo/metadata/protein-family-config.yaml",
      "display_name" : "Protein families",
      "result_weights" : "panther_family^5.0 bioentity_list^4.0",
      "weight" : "5"
   },
   "ontology" : {
      "description" : "Ontology classes for GO.",
      "searchable_extension" : "_searchable",
      "_outfile" : "/home/sjcarbon/local/src/git/amigo/metadata/ont-config.yaml",
      "id" : "ontology",
      "_strict" : 0,
      "schema_generating" : "true",
      "document_category" : "ontology_class",
      "filter_weights" : "source^4.0 subset^3.0 regulates_closure_label^1.0 is_obsolete^0.0",
      "fields_hash" : {
         "database_xref" : {
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "multi",
            "property" : [
               "getXref"
            ],
            "display_name" : "DB xref",
            "searchable" : "false",
            "description" : "Database cross-reference.",
            "required" : "false",
            "id" : "database_xref",
            "transform" : []
         },
         "alternate_id" : {
            "searchable" : "false",
            "description" : "Alternate term identifier.",
            "required" : "false",
            "id" : "alternate_id",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "multi",
            "display_name" : "Alt ID",
            "property" : [
               "getAnnotationPropertyValues",
               "alt_id"
            ]
         },
         "subset" : {
            "cardinality" : "multi",
            "property" : [
               "getSubsets"
            ],
            "display_name" : "Subset",
            "indexed" : "true",
            "type" : "string",
            "transform" : [],
            "required" : "false",
            "id" : "subset",
            "searchable" : "false",
            "description" : "Special use collections of terms."
         },
         "only_in_taxon_closure" : {
            "indexed" : "true",
            "display_name" : "Only in taxon (IDs)",
            "property" : [
               "getRelationLabelClosure",
               "RO:0002160"
            ],
            "cardinality" : "multi",
            "type" : "string",
            "transform" : [],
            "description" : "Only in taxon closure.",
            "searchable" : "false",
            "id" : "only_in_taxon_closure",
            "required" : "false"
         },
         "regulates_transitivity_graph_json" : {
            "property" : [
               "getLineageShuntGraphJSON",
               "BFO:0000050",
               "BFO:0000066",
               "RO:0002211",
               "RO:0002212",
               "RO:0002213",
               "RO:0002215",
               "RO:0002216"
            ],
            "display_name" : "Regulates transitivity graph (JSON)",
            "cardinality" : "single",
            "indexed" : "false",
            "type" : "string",
            "transform" : [],
            "id" : "regulates_transitivity_graph_json",
            "required" : "false",
            "description" : "JSON blob form of the local relation transitivity graph. Uses various relations (including regulates, occurs in, capable_of).",
            "searchable" : "false"
         },
         "description" : {
            "indexed" : "true",
            "cardinality" : "single",
            "property" : [
               "getDef"
            ],
            "display_name" : "Definition",
            "type" : "string",
            "transform" : [],
            "searchable" : "true",
            "description" : "Term definition.",
            "required" : "false",
            "id" : "description"
         },
         "isa_partof_closure_label" : {
            "id" : "isa_partof_closure_label",
            "required" : "false",
            "searchable" : "true",
            "description" : "Ancestral terms (is_a/part_of).",
            "transform" : [],
            "type" : "string",
            "cardinality" : "multi",
            "display_name" : "Is-a/part-of",
            "property" : [
               "getRelationLabelClosure",
               "BFO:0000050"
            ],
            "indexed" : "true"
         },
         "only_in_taxon_label" : {
            "description" : "Only in taxon label.",
            "searchable" : "true",
            "id" : "only_in_taxon_label",
            "required" : "false",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "property" : [
               "getLabel"
            ],
            "display_name" : "Only in taxon",
            "cardinality" : "single"
         },
         "synonym" : {
            "transform" : [],
            "required" : "false",
            "id" : "synonym",
            "searchable" : "true",
            "description" : "Term synonyms.",
            "cardinality" : "multi",
            "display_name" : "Synonyms",
            "property" : [
               "getOBOSynonymStrings"
            ],
            "indexed" : "true",
            "type" : "string"
         },
         "topology_graph_json" : {
            "description" : "JSON blob form of the local stepwise topology graph. Uses various relations (including regulates, occurs in, capable_of).",
            "searchable" : "false",
            "id" : "topology_graph_json",
            "required" : "false",
            "transform" : [],
            "type" : "string",
            "indexed" : "false",
            "display_name" : "Topology graph (JSON)",
            "property" : [
               "getSegmentShuntGraphJSON",
               "BFO:0000050",
               "BFO:0000066",
               "RO:0002211",
               "RO:0002212",
               "RO:0002213",
               "RO:0002215",
               "RO:0002216"
            ],
            "cardinality" : "single"
         },
         "definition_xref" : {
            "transform" : [],
            "searchable" : "false",
            "description" : "Definition cross-reference.",
            "required" : "false",
            "id" : "definition_xref",
            "indexed" : "true",
            "cardinality" : "multi",
            "display_name" : "Def xref",
            "property" : [
               "getDefXref"
            ],
            "type" : "string"
         },
         "regulates_closure" : {
            "searchable" : "false",
            "description" : "Ancestral terms (regulates, occurs in, capable_of).",
            "required" : "false",
            "id" : "regulates_closure",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "multi",
            "property" : [
               "getRelationIDClosure",
               "BFO:0000050",
               "BFO:0000066",
               "RO:0002211",
               "RO:0002212",
               "RO:0002213",
               "RO:0002215",
               "RO:0002216"
            ],
            "display_name" : "Ancestor"
         },
         "comment" : {
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "single",
            "property" : [
               "getComment"
            ],
            "display_name" : "Comment",
            "searchable" : "true",
            "description" : "Term comment.",
            "id" : "comment",
            "required" : "false",
            "transform" : []
         },
         "id" : {
            "type" : "string",
            "property" : [
               "getIdentifier"
            ],
            "display_name" : "Acc",
            "cardinality" : "single",
            "indexed" : "true",
            "id" : "id",
            "required" : "false",
            "description" : "Term identifier.",
            "searchable" : "false",
            "transform" : []
         },
         "replaced_by" : {
            "indexed" : "true",
            "property" : [
               "getAnnotationPropertyValues",
               "replaced_by"
            ],
            "display_name" : "Replaced By",
            "cardinality" : "multi",
            "type" : "string",
            "transform" : [],
            "description" : "Term that replaces this term.",
            "searchable" : "false",
            "id" : "replaced_by",
            "required" : "false"
         },
         "regulates_closure_label" : {
            "id" : "regulates_closure_label",
            "required" : "false",
            "description" : "Ancestral terms (regulates, occurs in, capable_of).",
            "searchable" : "true",
            "transform" : [],
            "type" : "string",
            "property" : [
               "getRelationLabelClosure",
               "BFO:0000050",
               "BFO:0000066",
               "RO:0002211",
               "RO:0002212",
               "RO:0002213",
               "RO:0002215",
               "RO:0002216"
            ],
            "display_name" : "Ancestor",
            "cardinality" : "multi",
            "indexed" : "true"
         },
         "is_obsolete" : {
            "required" : "false",
            "id" : "is_obsolete",
            "searchable" : "false",
            "description" : "Is the term obsolete?",
            "transform" : [],
            "type" : "boolean",
            "cardinality" : "single",
            "property" : [
               "getIsObsoleteBinaryString"
            ],
            "display_name" : "Obsoletion",
            "indexed" : "true"
         },
         "source" : {
            "indexed" : "true",
            "cardinality" : "single",
            "property" : [
               "getNamespace"
            ],
            "display_name" : "Ontology source",
            "type" : "string",
            "transform" : [],
            "searchable" : "false",
            "description" : "Term namespace.",
            "required" : "false",
            "id" : "source"
         },
         "consider" : {
            "indexed" : "true",
            "cardinality" : "multi",
            "property" : [
               "getAnnotationPropertyValues",
               "consider"
            ],
            "display_name" : "Consider",
            "type" : "string",
            "transform" : [],
            "searchable" : "false",
            "description" : "Others terms you might want to look at.",
            "id" : "consider",
            "required" : "false"
         },
         "only_in_taxon_closure_label" : {
            "searchable" : "true",
            "description" : "Only in taxon label closure.",
            "id" : "only_in_taxon_closure_label",
            "required" : "false",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "multi",
            "property" : [
               "getRelationLabelClosure",
               "RO:0002160"
            ],
            "display_name" : "Only in taxon"
         },
         "annotation_class" : {
            "indexed" : "true",
            "display_name" : "Term",
            "property" : [
               "getIdentifier"
            ],
            "cardinality" : "single",
            "type" : "string",
            "transform" : [],
            "description" : "Term identifier.",
            "searchable" : "false",
            "id" : "annotation_class",
            "required" : "false"
         },
         "only_in_taxon" : {
            "cardinality" : "single",
            "display_name" : "Only in taxon",
            "property" : [
               "getIdentifier"
            ],
            "indexed" : "true",
            "type" : "string",
            "transform" : [],
            "required" : "false",
            "id" : "only_in_taxon",
            "searchable" : "true",
            "description" : "Only in taxon."
         },
         "annotation_class_label" : {
            "required" : "false",
            "id" : "annotation_class_label",
            "description" : "Identifier.",
            "searchable" : "true",
            "transform" : [],
            "type" : "string",
            "display_name" : "Term",
            "property" : [
               "getLabel"
            ],
            "cardinality" : "single",
            "indexed" : "true"
         },
         "isa_partof_closure" : {
            "transform" : [],
            "required" : "false",
            "id" : "isa_partof_closure",
            "description" : "Ancestral terms (is_a/part_of).",
            "searchable" : "false",
            "property" : [
               "getRelationIDClosure",
               "BFO:0000050"
            ],
            "display_name" : "Is-a/part-of",
            "cardinality" : "multi",
            "indexed" : "true",
            "type" : "string"
         }
      },
      "fields" : [
         {
            "type" : "string",
            "property" : [
               "getIdentifier"
            ],
            "display_name" : "Acc",
            "cardinality" : "single",
            "indexed" : "true",
            "id" : "id",
            "required" : "false",
            "description" : "Term identifier.",
            "searchable" : "false",
            "transform" : []
         },
         {
            "indexed" : "true",
            "display_name" : "Term",
            "property" : [
               "getIdentifier"
            ],
            "cardinality" : "single",
            "type" : "string",
            "transform" : [],
            "description" : "Term identifier.",
            "searchable" : "false",
            "id" : "annotation_class",
            "required" : "false"
         },
         {
            "required" : "false",
            "id" : "annotation_class_label",
            "description" : "Identifier.",
            "searchable" : "true",
            "transform" : [],
            "type" : "string",
            "display_name" : "Term",
            "property" : [
               "getLabel"
            ],
            "cardinality" : "single",
            "indexed" : "true"
         },
         {
            "indexed" : "true",
            "cardinality" : "single",
            "property" : [
               "getDef"
            ],
            "display_name" : "Definition",
            "type" : "string",
            "transform" : [],
            "searchable" : "true",
            "description" : "Term definition.",
            "required" : "false",
            "id" : "description"
         },
         {
            "indexed" : "true",
            "cardinality" : "single",
            "property" : [
               "getNamespace"
            ],
            "display_name" : "Ontology source",
            "type" : "string",
            "transform" : [],
            "searchable" : "false",
            "description" : "Term namespace.",
            "required" : "false",
            "id" : "source"
         },
         {
            "required" : "false",
            "id" : "is_obsolete",
            "searchable" : "false",
            "description" : "Is the term obsolete?",
            "transform" : [],
            "type" : "boolean",
            "cardinality" : "single",
            "property" : [
               "getIsObsoleteBinaryString"
            ],
            "display_name" : "Obsoletion",
            "indexed" : "true"
         },
         {
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "single",
            "property" : [
               "getComment"
            ],
            "display_name" : "Comment",
            "searchable" : "true",
            "description" : "Term comment.",
            "id" : "comment",
            "required" : "false",
            "transform" : []
         },
         {
            "transform" : [],
            "required" : "false",
            "id" : "synonym",
            "searchable" : "true",
            "description" : "Term synonyms.",
            "cardinality" : "multi",
            "display_name" : "Synonyms",
            "property" : [
               "getOBOSynonymStrings"
            ],
            "indexed" : "true",
            "type" : "string"
         },
         {
            "searchable" : "false",
            "description" : "Alternate term identifier.",
            "required" : "false",
            "id" : "alternate_id",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "multi",
            "display_name" : "Alt ID",
            "property" : [
               "getAnnotationPropertyValues",
               "alt_id"
            ]
         },
         {
            "indexed" : "true",
            "property" : [
               "getAnnotationPropertyValues",
               "replaced_by"
            ],
            "display_name" : "Replaced By",
            "cardinality" : "multi",
            "type" : "string",
            "transform" : [],
            "description" : "Term that replaces this term.",
            "searchable" : "false",
            "id" : "replaced_by",
            "required" : "false"
         },
         {
            "indexed" : "true",
            "cardinality" : "multi",
            "property" : [
               "getAnnotationPropertyValues",
               "consider"
            ],
            "display_name" : "Consider",
            "type" : "string",
            "transform" : [],
            "searchable" : "false",
            "description" : "Others terms you might want to look at.",
            "id" : "consider",
            "required" : "false"
         },
         {
            "cardinality" : "multi",
            "property" : [
               "getSubsets"
            ],
            "display_name" : "Subset",
            "indexed" : "true",
            "type" : "string",
            "transform" : [],
            "required" : "false",
            "id" : "subset",
            "searchable" : "false",
            "description" : "Special use collections of terms."
         },
         {
            "transform" : [],
            "searchable" : "false",
            "description" : "Definition cross-reference.",
            "required" : "false",
            "id" : "definition_xref",
            "indexed" : "true",
            "cardinality" : "multi",
            "display_name" : "Def xref",
            "property" : [
               "getDefXref"
            ],
            "type" : "string"
         },
         {
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "multi",
            "property" : [
               "getXref"
            ],
            "display_name" : "DB xref",
            "searchable" : "false",
            "description" : "Database cross-reference.",
            "required" : "false",
            "id" : "database_xref",
            "transform" : []
         },
         {
            "transform" : [],
            "required" : "false",
            "id" : "isa_partof_closure",
            "description" : "Ancestral terms (is_a/part_of).",
            "searchable" : "false",
            "property" : [
               "getRelationIDClosure",
               "BFO:0000050"
            ],
            "display_name" : "Is-a/part-of",
            "cardinality" : "multi",
            "indexed" : "true",
            "type" : "string"
         },
         {
            "id" : "isa_partof_closure_label",
            "required" : "false",
            "searchable" : "true",
            "description" : "Ancestral terms (is_a/part_of).",
            "transform" : [],
            "type" : "string",
            "cardinality" : "multi",
            "display_name" : "Is-a/part-of",
            "property" : [
               "getRelationLabelClosure",
               "BFO:0000050"
            ],
            "indexed" : "true"
         },
         {
            "searchable" : "false",
            "description" : "Ancestral terms (regulates, occurs in, capable_of).",
            "required" : "false",
            "id" : "regulates_closure",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "multi",
            "property" : [
               "getRelationIDClosure",
               "BFO:0000050",
               "BFO:0000066",
               "RO:0002211",
               "RO:0002212",
               "RO:0002213",
               "RO:0002215",
               "RO:0002216"
            ],
            "display_name" : "Ancestor"
         },
         {
            "id" : "regulates_closure_label",
            "required" : "false",
            "description" : "Ancestral terms (regulates, occurs in, capable_of).",
            "searchable" : "true",
            "transform" : [],
            "type" : "string",
            "property" : [
               "getRelationLabelClosure",
               "BFO:0000050",
               "BFO:0000066",
               "RO:0002211",
               "RO:0002212",
               "RO:0002213",
               "RO:0002215",
               "RO:0002216"
            ],
            "display_name" : "Ancestor",
            "cardinality" : "multi",
            "indexed" : "true"
         },
         {
            "description" : "JSON blob form of the local stepwise topology graph. Uses various relations (including regulates, occurs in, capable_of).",
            "searchable" : "false",
            "id" : "topology_graph_json",
            "required" : "false",
            "transform" : [],
            "type" : "string",
            "indexed" : "false",
            "display_name" : "Topology graph (JSON)",
            "property" : [
               "getSegmentShuntGraphJSON",
               "BFO:0000050",
               "BFO:0000066",
               "RO:0002211",
               "RO:0002212",
               "RO:0002213",
               "RO:0002215",
               "RO:0002216"
            ],
            "cardinality" : "single"
         },
         {
            "property" : [
               "getLineageShuntGraphJSON",
               "BFO:0000050",
               "BFO:0000066",
               "RO:0002211",
               "RO:0002212",
               "RO:0002213",
               "RO:0002215",
               "RO:0002216"
            ],
            "display_name" : "Regulates transitivity graph (JSON)",
            "cardinality" : "single",
            "indexed" : "false",
            "type" : "string",
            "transform" : [],
            "id" : "regulates_transitivity_graph_json",
            "required" : "false",
            "description" : "JSON blob form of the local relation transitivity graph. Uses various relations (including regulates, occurs in, capable_of).",
            "searchable" : "false"
         },
         {
            "cardinality" : "single",
            "display_name" : "Only in taxon",
            "property" : [
               "getIdentifier"
            ],
            "indexed" : "true",
            "type" : "string",
            "transform" : [],
            "required" : "false",
            "id" : "only_in_taxon",
            "searchable" : "true",
            "description" : "Only in taxon."
         },
         {
            "description" : "Only in taxon label.",
            "searchable" : "true",
            "id" : "only_in_taxon_label",
            "required" : "false",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "property" : [
               "getLabel"
            ],
            "display_name" : "Only in taxon",
            "cardinality" : "single"
         },
         {
            "indexed" : "true",
            "display_name" : "Only in taxon (IDs)",
            "property" : [
               "getRelationLabelClosure",
               "RO:0002160"
            ],
            "cardinality" : "multi",
            "type" : "string",
            "transform" : [],
            "description" : "Only in taxon closure.",
            "searchable" : "false",
            "id" : "only_in_taxon_closure",
            "required" : "false"
         },
         {
            "searchable" : "true",
            "description" : "Only in taxon label closure.",
            "id" : "only_in_taxon_closure_label",
            "required" : "false",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "multi",
            "property" : [
               "getRelationLabelClosure",
               "RO:0002160"
            ],
            "display_name" : "Only in taxon"
         }
      ],
      "boost_weights" : "annotation_class^3.0 annotation_class_label^5.5 description^1.0 comment^0.5 synonym^1.0 alternate_id^1.0 regulates_closure^1.0 regulates_closure_label^1.0",
      "display_name" : "Ontology",
      "_infile" : "/home/sjcarbon/local/src/git/amigo/metadata/ont-config.yaml",
      "result_weights" : "annotation_class^8.0 description^6.0 source^4.0 synonym^3.0 alternate_id^2.0",
      "weight" : "40"
   },
   "complex_annotation" : {
      "display_name" : "Complex annotations (ALPHA)",
      "_infile" : "/home/sjcarbon/local/src/git/amigo/metadata/complex-ann-config.yaml",
      "result_weights" : "function_class^5.0 enabled_by^4.0 location_list^3.0 process_class^2.0 annotation_group^1.0",
      "weight" : "-5",
      "boost_weights" : "annotation_group_label^1.0 annotation_unit_label^1.0 enabled_by^1.0 enabled_by_label^1.0 location_list_closure^1.0 location_list_closure_label^1.0 process_class_closure_label^1.0 function_class_closure_label^1.0",
      "filter_weights" : "annotation_group_label^5.0 enabled_by_label^4.5 location_list_closure_label^4.0 process_class_closure_label^3.0 function_class_closure_label^2.0",
      "fields" : [
         {
            "searchable" : "false",
            "description" : "A unique (and internal) thing.",
            "id" : "id",
            "required" : "false",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "single",
            "property" : [],
            "display_name" : "ID"
         },
         {
            "cardinality" : "single",
            "display_name" : "Annotation unit",
            "property" : [],
            "indexed" : "true",
            "type" : "string",
            "transform" : [],
            "required" : "false",
            "id" : "annotation_unit",
            "searchable" : "false",
            "description" : "???."
         },
         {
            "property" : [],
            "display_name" : "Annotation unit",
            "cardinality" : "single",
            "indexed" : "true",
            "type" : "string",
            "transform" : [],
            "id" : "annotation_unit_label",
            "required" : "false",
            "description" : "???.",
            "searchable" : "true"
         },
         {
            "transform" : [],
            "searchable" : "false",
            "description" : "???.",
            "required" : "false",
            "id" : "annotation_group",
            "indexed" : "true",
            "cardinality" : "single",
            "display_name" : "Annotation group",
            "property" : [],
            "type" : "string"
         },
         {
            "type" : "string",
            "display_name" : "Annotation group",
            "property" : [],
            "cardinality" : "single",
            "indexed" : "true",
            "id" : "annotation_group_label",
            "required" : "false",
            "description" : "???.",
            "searchable" : "true",
            "transform" : []
         },
         {
            "transform" : [],
            "description" : "???.",
            "searchable" : "false",
            "id" : "annotation_group_url",
            "required" : "false",
            "indexed" : "true",
            "display_name" : "Annotation group URL",
            "property" : [],
            "cardinality" : "single",
            "type" : "string"
         },
         {
            "description" : "???",
            "searchable" : "true",
            "id" : "enabled_by",
            "required" : "false",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "display_name" : "Enabled by",
            "cardinality" : "single"
         },
         {
            "indexed" : "true",
            "cardinality" : "single",
            "property" : [],
            "display_name" : "Enabled by",
            "type" : "string",
            "transform" : [],
            "searchable" : "true",
            "description" : "???",
            "id" : "enabled_by_label",
            "required" : "false"
         },
         {
            "property" : [],
            "display_name" : "PANTHER family",
            "cardinality" : "single",
            "indexed" : "true",
            "type" : "string",
            "transform" : [],
            "id" : "panther_family",
            "required" : "false",
            "description" : "PANTHER family IDs that are associated with this entity.",
            "searchable" : "true"
         },
         {
            "type" : "string",
            "display_name" : "PANTHER family",
            "property" : [],
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "id" : "panther_family_label",
            "description" : "PANTHER families that are associated with this entity.",
            "searchable" : "true",
            "transform" : []
         },
         {
            "required" : "false",
            "id" : "taxon",
            "searchable" : "false",
            "description" : "GAF column 13 (taxon).",
            "transform" : [],
            "type" : "string",
            "cardinality" : "single",
            "display_name" : "Taxon",
            "property" : [],
            "indexed" : "true"
         },
         {
            "indexed" : "true",
            "property" : [],
            "display_name" : "Taxon",
            "cardinality" : "single",
            "type" : "string",
            "transform" : [],
            "description" : "Taxon derived from GAF column 13 and ncbi_taxonomy.obo.",
            "searchable" : "true",
            "id" : "taxon_label",
            "required" : "false"
         },
         {
            "transform" : [],
            "required" : "false",
            "id" : "taxon_closure",
            "description" : "Taxon IDs derived from GAF column 13 and ncbi_taxonomy.obo.",
            "searchable" : "false",
            "display_name" : "Taxon (IDs)",
            "property" : [],
            "cardinality" : "multi",
            "indexed" : "true",
            "type" : "string"
         },
         {
            "indexed" : "true",
            "property" : [],
            "display_name" : "Taxon",
            "cardinality" : "multi",
            "type" : "string",
            "transform" : [],
            "description" : "Taxon label closure derived from GAF column 13 and ncbi_taxonomy.obo.",
            "searchable" : "true",
            "required" : "false",
            "id" : "taxon_closure_label"
         },
         {
            "transform" : [],
            "searchable" : "false",
            "description" : "Function acc/ID.",
            "id" : "function_class",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "display_name" : "Function",
            "property" : [],
            "type" : "string"
         },
         {
            "cardinality" : "single",
            "display_name" : "Function",
            "property" : [],
            "indexed" : "true",
            "type" : "string",
            "transform" : [],
            "required" : "false",
            "id" : "function_class_label",
            "searchable" : "true",
            "description" : "Common function name."
         },
         {
            "id" : "function_class_closure",
            "required" : "false",
            "searchable" : "false",
            "description" : "???",
            "transform" : [],
            "type" : "string",
            "cardinality" : "multi",
            "display_name" : "Function",
            "property" : [],
            "indexed" : "true"
         },
         {
            "transform" : [],
            "searchable" : "true",
            "description" : "???",
            "required" : "false",
            "id" : "function_class_closure_label",
            "indexed" : "true",
            "cardinality" : "multi",
            "property" : [],
            "display_name" : "Function",
            "type" : "string"
         },
         {
            "transform" : [],
            "required" : "false",
            "id" : "process_class",
            "description" : "Process acc/ID.",
            "searchable" : "false",
            "property" : [],
            "display_name" : "Process",
            "cardinality" : "single",
            "indexed" : "true",
            "type" : "string"
         },
         {
            "searchable" : "true",
            "description" : "Common process name.",
            "required" : "false",
            "id" : "process_class_label",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "single",
            "property" : [],
            "display_name" : "Process"
         },
         {
            "required" : "false",
            "id" : "process_class_closure",
            "description" : "???",
            "searchable" : "false",
            "transform" : [],
            "type" : "string",
            "display_name" : "Process",
            "property" : [],
            "cardinality" : "multi",
            "indexed" : "true"
         },
         {
            "description" : "???",
            "searchable" : "true",
            "required" : "false",
            "id" : "process_class_closure_label",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "display_name" : "Process",
            "property" : [],
            "cardinality" : "multi"
         },
         {
            "searchable" : "false",
            "description" : "",
            "required" : "false",
            "id" : "location_list",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "multi",
            "property" : [],
            "display_name" : "Location"
         },
         {
            "transform" : [],
            "searchable" : "false",
            "description" : "",
            "id" : "location_list_label",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "property" : [],
            "display_name" : "Location",
            "type" : "string"
         },
         {
            "description" : "",
            "searchable" : "false",
            "required" : "false",
            "id" : "location_list_closure",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "display_name" : "Location",
            "cardinality" : "multi"
         },
         {
            "property" : [],
            "display_name" : "Location",
            "cardinality" : "multi",
            "indexed" : "true",
            "type" : "string",
            "transform" : [],
            "required" : "false",
            "id" : "location_list_closure_label",
            "description" : "",
            "searchable" : "false"
         },
         {
            "transform" : [],
            "id" : "owl_blob_json",
            "required" : "false",
            "description" : "???",
            "searchable" : "false",
            "property" : [],
            "display_name" : "???",
            "cardinality" : "single",
            "indexed" : "false",
            "type" : "string"
         },
         {
            "id" : "topology_graph_json",
            "required" : "false",
            "description" : "JSON blob form of the local stepwise topology graph.",
            "searchable" : "false",
            "transform" : [],
            "type" : "string",
            "display_name" : "Topology graph (JSON)",
            "property" : [],
            "cardinality" : "single",
            "indexed" : "false"
         }
      ],
      "fields_hash" : {
         "location_list_label" : {
            "transform" : [],
            "searchable" : "false",
            "description" : "",
            "id" : "location_list_label",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "property" : [],
            "display_name" : "Location",
            "type" : "string"
         },
         "function_class" : {
            "transform" : [],
            "searchable" : "false",
            "description" : "Function acc/ID.",
            "id" : "function_class",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "display_name" : "Function",
            "property" : [],
            "type" : "string"
         },
         "topology_graph_json" : {
            "id" : "topology_graph_json",
            "required" : "false",
            "description" : "JSON blob form of the local stepwise topology graph.",
            "searchable" : "false",
            "transform" : [],
            "type" : "string",
            "display_name" : "Topology graph (JSON)",
            "property" : [],
            "cardinality" : "single",
            "indexed" : "false"
         },
         "function_class_closure" : {
            "id" : "function_class_closure",
            "required" : "false",
            "searchable" : "false",
            "description" : "???",
            "transform" : [],
            "type" : "string",
            "cardinality" : "multi",
            "display_name" : "Function",
            "property" : [],
            "indexed" : "true"
         },
         "owl_blob_json" : {
            "transform" : [],
            "id" : "owl_blob_json",
            "required" : "false",
            "description" : "???",
            "searchable" : "false",
            "property" : [],
            "display_name" : "???",
            "cardinality" : "single",
            "indexed" : "false",
            "type" : "string"
         },
         "function_class_closure_label" : {
            "transform" : [],
            "searchable" : "true",
            "description" : "???",
            "required" : "false",
            "id" : "function_class_closure_label",
            "indexed" : "true",
            "cardinality" : "multi",
            "property" : [],
            "display_name" : "Function",
            "type" : "string"
         },
         "process_class" : {
            "transform" : [],
            "required" : "false",
            "id" : "process_class",
            "description" : "Process acc/ID.",
            "searchable" : "false",
            "property" : [],
            "display_name" : "Process",
            "cardinality" : "single",
            "indexed" : "true",
            "type" : "string"
         },
         "function_class_label" : {
            "cardinality" : "single",
            "display_name" : "Function",
            "property" : [],
            "indexed" : "true",
            "type" : "string",
            "transform" : [],
            "required" : "false",
            "id" : "function_class_label",
            "searchable" : "true",
            "description" : "Common function name."
         },
         "taxon_label" : {
            "indexed" : "true",
            "property" : [],
            "display_name" : "Taxon",
            "cardinality" : "single",
            "type" : "string",
            "transform" : [],
            "description" : "Taxon derived from GAF column 13 and ncbi_taxonomy.obo.",
            "searchable" : "true",
            "id" : "taxon_label",
            "required" : "false"
         },
         "taxon_closure" : {
            "transform" : [],
            "required" : "false",
            "id" : "taxon_closure",
            "description" : "Taxon IDs derived from GAF column 13 and ncbi_taxonomy.obo.",
            "searchable" : "false",
            "display_name" : "Taxon (IDs)",
            "property" : [],
            "cardinality" : "multi",
            "indexed" : "true",
            "type" : "string"
         },
         "location_list_closure_label" : {
            "property" : [],
            "display_name" : "Location",
            "cardinality" : "multi",
            "indexed" : "true",
            "type" : "string",
            "transform" : [],
            "required" : "false",
            "id" : "location_list_closure_label",
            "description" : "",
            "searchable" : "false"
         },
         "panther_family_label" : {
            "type" : "string",
            "display_name" : "PANTHER family",
            "property" : [],
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "id" : "panther_family_label",
            "description" : "PANTHER families that are associated with this entity.",
            "searchable" : "true",
            "transform" : []
         },
         "process_class_closure_label" : {
            "description" : "???",
            "searchable" : "true",
            "required" : "false",
            "id" : "process_class_closure_label",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "display_name" : "Process",
            "property" : [],
            "cardinality" : "multi"
         },
         "annotation_unit" : {
            "cardinality" : "single",
            "display_name" : "Annotation unit",
            "property" : [],
            "indexed" : "true",
            "type" : "string",
            "transform" : [],
            "required" : "false",
            "id" : "annotation_unit",
            "searchable" : "false",
            "description" : "???."
         },
         "annotation_group_label" : {
            "type" : "string",
            "display_name" : "Annotation group",
            "property" : [],
            "cardinality" : "single",
            "indexed" : "true",
            "id" : "annotation_group_label",
            "required" : "false",
            "description" : "???.",
            "searchable" : "true",
            "transform" : []
         },
         "annotation_group" : {
            "transform" : [],
            "searchable" : "false",
            "description" : "???.",
            "required" : "false",
            "id" : "annotation_group",
            "indexed" : "true",
            "cardinality" : "single",
            "display_name" : "Annotation group",
            "property" : [],
            "type" : "string"
         },
         "panther_family" : {
            "property" : [],
            "display_name" : "PANTHER family",
            "cardinality" : "single",
            "indexed" : "true",
            "type" : "string",
            "transform" : [],
            "id" : "panther_family",
            "required" : "false",
            "description" : "PANTHER family IDs that are associated with this entity.",
            "searchable" : "true"
         },
         "enabled_by_label" : {
            "indexed" : "true",
            "cardinality" : "single",
            "property" : [],
            "display_name" : "Enabled by",
            "type" : "string",
            "transform" : [],
            "searchable" : "true",
            "description" : "???",
            "id" : "enabled_by_label",
            "required" : "false"
         },
         "location_list_closure" : {
            "description" : "",
            "searchable" : "false",
            "required" : "false",
            "id" : "location_list_closure",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "display_name" : "Location",
            "cardinality" : "multi"
         },
         "location_list" : {
            "searchable" : "false",
            "description" : "",
            "required" : "false",
            "id" : "location_list",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "multi",
            "property" : [],
            "display_name" : "Location"
         },
         "annotation_unit_label" : {
            "property" : [],
            "display_name" : "Annotation unit",
            "cardinality" : "single",
            "indexed" : "true",
            "type" : "string",
            "transform" : [],
            "id" : "annotation_unit_label",
            "required" : "false",
            "description" : "???.",
            "searchable" : "true"
         },
         "process_class_closure" : {
            "required" : "false",
            "id" : "process_class_closure",
            "description" : "???",
            "searchable" : "false",
            "transform" : [],
            "type" : "string",
            "display_name" : "Process",
            "property" : [],
            "cardinality" : "multi",
            "indexed" : "true"
         },
         "annotation_group_url" : {
            "transform" : [],
            "description" : "???.",
            "searchable" : "false",
            "id" : "annotation_group_url",
            "required" : "false",
            "indexed" : "true",
            "display_name" : "Annotation group URL",
            "property" : [],
            "cardinality" : "single",
            "type" : "string"
         },
         "taxon" : {
            "required" : "false",
            "id" : "taxon",
            "searchable" : "false",
            "description" : "GAF column 13 (taxon).",
            "transform" : [],
            "type" : "string",
            "cardinality" : "single",
            "display_name" : "Taxon",
            "property" : [],
            "indexed" : "true"
         },
         "id" : {
            "searchable" : "false",
            "description" : "A unique (and internal) thing.",
            "id" : "id",
            "required" : "false",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "single",
            "property" : [],
            "display_name" : "ID"
         },
         "enabled_by" : {
            "description" : "???",
            "searchable" : "true",
            "id" : "enabled_by",
            "required" : "false",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "display_name" : "Enabled by",
            "cardinality" : "single"
         },
         "process_class_label" : {
            "searchable" : "true",
            "description" : "Common process name.",
            "required" : "false",
            "id" : "process_class_label",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "single",
            "property" : [],
            "display_name" : "Process"
         },
         "taxon_closure_label" : {
            "indexed" : "true",
            "property" : [],
            "display_name" : "Taxon",
            "cardinality" : "multi",
            "type" : "string",
            "transform" : [],
            "description" : "Taxon label closure derived from GAF column 13 and ncbi_taxonomy.obo.",
            "searchable" : "true",
            "required" : "false",
            "id" : "taxon_closure_label"
         }
      },
      "schema_generating" : "true",
      "document_category" : "complex_annotation",
      "_strict" : 0,
      "searchable_extension" : "_searchable",
      "id" : "complex_annotation",
      "_outfile" : "/home/sjcarbon/local/src/git/amigo/metadata/complex-ann-config.yaml",
      "description" : "An individual unit within LEGO. This is <strong>ALPHA</strong> software."
   },
   "bioentity" : {
      "_strict" : 0,
      "description" : "Genes and gene products associated with GO terms.",
      "_outfile" : "/home/sjcarbon/local/src/git/amigo/metadata/bio-config.yaml",
      "id" : "bioentity",
      "searchable_extension" : "_searchable",
      "boost_weights" : "bioentity^2.0 bioentity_label^2.0 bioentity_name^1.0 bioentity_internal_id^1.0 synonym^1.0 isa_partof_closure_label^1.0 regulates_closure^1.0 regulates_closure_label^1.0 panther_family^1.0 panther_family_label^1.0 taxon_closure_label^1.0",
      "weight" : "30",
      "display_name" : "Genes and gene products",
      "_infile" : "/home/sjcarbon/local/src/git/amigo/metadata/bio-config.yaml",
      "result_weights" : "bioentity^8.0 bioentity_name^7.0 taxon^6.0 panther_family^5.0 type^4.0 source^3.0 annotation_class_list^2.0 synonym^1.0",
      "document_category" : "bioentity",
      "schema_generating" : "true",
      "fields_hash" : {
         "isa_partof_closure" : {
            "indexed" : "true",
            "property" : [],
            "display_name" : "Involved in",
            "cardinality" : "multi",
            "type" : "string",
            "transform" : [],
            "description" : "Closure of ids/accs over isa and partof.",
            "searchable" : "false",
            "required" : "false",
            "id" : "isa_partof_closure"
         },
         "taxon_closure_label" : {
            "type" : "string",
            "cardinality" : "multi",
            "property" : [],
            "display_name" : "Taxon",
            "indexed" : "true",
            "id" : "taxon_closure_label",
            "required" : "false",
            "searchable" : "true",
            "description" : "Taxonomic group and ancestral groups.",
            "transform" : []
         },
         "source" : {
            "transform" : [],
            "id" : "source",
            "required" : "false",
            "description" : "Database source.",
            "searchable" : "false",
            "property" : [],
            "display_name" : "Source",
            "cardinality" : "single",
            "indexed" : "true",
            "type" : "string"
         },
         "taxon" : {
            "transform" : [],
            "description" : "Taxonomic group",
            "searchable" : "false",
            "id" : "taxon",
            "required" : "false",
            "indexed" : "true",
            "property" : [],
            "display_name" : "Taxon",
            "cardinality" : "single",
            "type" : "string"
         },
         "regulates_closure_label" : {
            "type" : "string",
            "cardinality" : "multi",
            "property" : [],
            "display_name" : "Inferred annotation",
            "indexed" : "true",
            "required" : "false",
            "id" : "regulates_closure_label",
            "searchable" : "true",
            "description" : "Bioentities associated with this term or its children (over regulates).",
            "transform" : []
         },
         "bioentity_label" : {
            "type" : "string",
            "cardinality" : "single",
            "display_name" : "Label",
            "property" : [],
            "indexed" : "true",
            "required" : "false",
            "id" : "bioentity_label",
            "searchable" : "true",
            "description" : "Symbol or name.",
            "transform" : []
         },
         "id" : {
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "single",
            "display_name" : "Acc",
            "property" : [],
            "searchable" : "false",
            "description" : "Gene of gene product ID.",
            "required" : "false",
            "id" : "id",
            "transform" : []
         },
         "synonym" : {
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "multi",
            "display_name" : "Synonyms",
            "property" : [],
            "searchable" : "false",
            "description" : "Gene product synonyms.",
            "required" : "false",
            "id" : "synonym",
            "transform" : []
         },
         "taxon_label" : {
            "transform" : [],
            "searchable" : "true",
            "description" : "Taxonomic group",
            "required" : "false",
            "id" : "taxon_label",
            "indexed" : "true",
            "cardinality" : "single",
            "property" : [],
            "display_name" : "Taxon",
            "type" : "string"
         },
         "isa_partof_closure_label" : {
            "type" : "string",
            "indexed" : "true",
            "display_name" : "Involved in",
            "property" : [],
            "cardinality" : "multi",
            "description" : "Closure of labels over isa and partof.",
            "searchable" : "true",
            "required" : "false",
            "id" : "isa_partof_closure_label",
            "transform" : []
         },
         "annotation_class_list" : {
            "type" : "string",
            "cardinality" : "multi",
            "display_name" : "Direct annotation",
            "property" : [],
            "indexed" : "true",
            "id" : "annotation_class_list",
            "required" : "false",
            "searchable" : "false",
            "description" : "Direct annotations.",
            "transform" : []
         },
         "regulates_closure" : {
            "transform" : [],
            "id" : "regulates_closure",
            "required" : "false",
            "searchable" : "false",
            "description" : "Bioentities associated with this term or its children (over regulates).",
            "cardinality" : "multi",
            "display_name" : "Inferred annotation",
            "property" : [],
            "indexed" : "true",
            "type" : "string"
         },
         "bioentity_name" : {
            "indexed" : "true",
            "cardinality" : "single",
            "display_name" : "Name",
            "property" : [],
            "type" : "string",
            "transform" : [],
            "searchable" : "true",
            "description" : "The full name of the gene product.",
            "id" : "bioentity_name",
            "required" : "false"
         },
         "annotation_class_list_label" : {
            "indexed" : "true",
            "cardinality" : "multi",
            "property" : [],
            "display_name" : "Direct annotation",
            "type" : "string",
            "transform" : [],
            "searchable" : "false",
            "description" : "Direct annotations.",
            "required" : "false",
            "id" : "annotation_class_list_label"
         },
         "type" : {
            "description" : "Type class.",
            "searchable" : "false",
            "required" : "false",
            "id" : "type",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "display_name" : "Type",
            "property" : [],
            "cardinality" : "single"
         },
         "phylo_graph_json" : {
            "transform" : [],
            "id" : "phylo_graph_json",
            "required" : "false",
            "description" : "JSON blob form of the phylogenic tree.",
            "searchable" : "false",
            "display_name" : "This should not be displayed",
            "property" : [],
            "cardinality" : "single",
            "indexed" : "false",
            "type" : "string"
         },
         "database_xref" : {
            "required" : "false",
            "id" : "database_xref",
            "description" : "Database cross-reference.",
            "searchable" : "false",
            "transform" : [],
            "type" : "string",
            "display_name" : "DB xref",
            "property" : [],
            "cardinality" : "multi",
            "indexed" : "true"
         },
         "panther_family" : {
            "indexed" : "true",
            "property" : [],
            "display_name" : "PANTHER family",
            "cardinality" : "single",
            "type" : "string",
            "transform" : [],
            "description" : "PANTHER families that are associated with this entity.",
            "searchable" : "true",
            "id" : "panther_family",
            "required" : "false"
         },
         "taxon_closure" : {
            "transform" : [],
            "description" : "Taxonomic group and ancestral groups.",
            "searchable" : "false",
            "required" : "false",
            "id" : "taxon_closure",
            "indexed" : "true",
            "display_name" : "Taxon",
            "property" : [],
            "cardinality" : "multi",
            "type" : "string"
         },
         "bioentity" : {
            "description" : "Gene or gene product ID.",
            "searchable" : "false",
            "required" : "false",
            "id" : "bioentity",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "display_name" : "Acc",
            "cardinality" : "single"
         },
         "panther_family_label" : {
            "cardinality" : "single",
            "property" : [],
            "display_name" : "PANTHER family",
            "indexed" : "true",
            "type" : "string",
            "transform" : [],
            "required" : "false",
            "id" : "panther_family_label",
            "searchable" : "true",
            "description" : "PANTHER families that are associated with this entity."
         },
         "bioentity_internal_id" : {
            "required" : "false",
            "id" : "bioentity_internal_id",
            "description" : "The bioentity ID used at the database of origin.",
            "searchable" : "false",
            "transform" : [],
            "type" : "string",
            "property" : [],
            "display_name" : "This should not be displayed",
            "cardinality" : "single",
            "indexed" : "false"
         }
      },
      "fields" : [
         {
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "single",
            "display_name" : "Acc",
            "property" : [],
            "searchable" : "false",
            "description" : "Gene of gene product ID.",
            "required" : "false",
            "id" : "id",
            "transform" : []
         },
         {
            "description" : "Gene or gene product ID.",
            "searchable" : "false",
            "required" : "false",
            "id" : "bioentity",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "display_name" : "Acc",
            "cardinality" : "single"
         },
         {
            "type" : "string",
            "cardinality" : "single",
            "display_name" : "Label",
            "property" : [],
            "indexed" : "true",
            "required" : "false",
            "id" : "bioentity_label",
            "searchable" : "true",
            "description" : "Symbol or name.",
            "transform" : []
         },
         {
            "indexed" : "true",
            "cardinality" : "single",
            "display_name" : "Name",
            "property" : [],
            "type" : "string",
            "transform" : [],
            "searchable" : "true",
            "description" : "The full name of the gene product.",
            "id" : "bioentity_name",
            "required" : "false"
         },
         {
            "required" : "false",
            "id" : "bioentity_internal_id",
            "description" : "The bioentity ID used at the database of origin.",
            "searchable" : "false",
            "transform" : [],
            "type" : "string",
            "property" : [],
            "display_name" : "This should not be displayed",
            "cardinality" : "single",
            "indexed" : "false"
         },
         {
            "description" : "Type class.",
            "searchable" : "false",
            "required" : "false",
            "id" : "type",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "display_name" : "Type",
            "property" : [],
            "cardinality" : "single"
         },
         {
            "transform" : [],
            "description" : "Taxonomic group",
            "searchable" : "false",
            "id" : "taxon",
            "required" : "false",
            "indexed" : "true",
            "property" : [],
            "display_name" : "Taxon",
            "cardinality" : "single",
            "type" : "string"
         },
         {
            "transform" : [],
            "searchable" : "true",
            "description" : "Taxonomic group",
            "required" : "false",
            "id" : "taxon_label",
            "indexed" : "true",
            "cardinality" : "single",
            "property" : [],
            "display_name" : "Taxon",
            "type" : "string"
         },
         {
            "transform" : [],
            "description" : "Taxonomic group and ancestral groups.",
            "searchable" : "false",
            "required" : "false",
            "id" : "taxon_closure",
            "indexed" : "true",
            "display_name" : "Taxon",
            "property" : [],
            "cardinality" : "multi",
            "type" : "string"
         },
         {
            "type" : "string",
            "cardinality" : "multi",
            "property" : [],
            "display_name" : "Taxon",
            "indexed" : "true",
            "id" : "taxon_closure_label",
            "required" : "false",
            "searchable" : "true",
            "description" : "Taxonomic group and ancestral groups.",
            "transform" : []
         },
         {
            "indexed" : "true",
            "property" : [],
            "display_name" : "Involved in",
            "cardinality" : "multi",
            "type" : "string",
            "transform" : [],
            "description" : "Closure of ids/accs over isa and partof.",
            "searchable" : "false",
            "required" : "false",
            "id" : "isa_partof_closure"
         },
         {
            "type" : "string",
            "indexed" : "true",
            "display_name" : "Involved in",
            "property" : [],
            "cardinality" : "multi",
            "description" : "Closure of labels over isa and partof.",
            "searchable" : "true",
            "required" : "false",
            "id" : "isa_partof_closure_label",
            "transform" : []
         },
         {
            "transform" : [],
            "id" : "regulates_closure",
            "required" : "false",
            "searchable" : "false",
            "description" : "Bioentities associated with this term or its children (over regulates).",
            "cardinality" : "multi",
            "display_name" : "Inferred annotation",
            "property" : [],
            "indexed" : "true",
            "type" : "string"
         },
         {
            "type" : "string",
            "cardinality" : "multi",
            "property" : [],
            "display_name" : "Inferred annotation",
            "indexed" : "true",
            "required" : "false",
            "id" : "regulates_closure_label",
            "searchable" : "true",
            "description" : "Bioentities associated with this term or its children (over regulates).",
            "transform" : []
         },
         {
            "transform" : [],
            "id" : "source",
            "required" : "false",
            "description" : "Database source.",
            "searchable" : "false",
            "property" : [],
            "display_name" : "Source",
            "cardinality" : "single",
            "indexed" : "true",
            "type" : "string"
         },
         {
            "type" : "string",
            "cardinality" : "multi",
            "display_name" : "Direct annotation",
            "property" : [],
            "indexed" : "true",
            "id" : "annotation_class_list",
            "required" : "false",
            "searchable" : "false",
            "description" : "Direct annotations.",
            "transform" : []
         },
         {
            "indexed" : "true",
            "cardinality" : "multi",
            "property" : [],
            "display_name" : "Direct annotation",
            "type" : "string",
            "transform" : [],
            "searchable" : "false",
            "description" : "Direct annotations.",
            "required" : "false",
            "id" : "annotation_class_list_label"
         },
         {
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "multi",
            "display_name" : "Synonyms",
            "property" : [],
            "searchable" : "false",
            "description" : "Gene product synonyms.",
            "required" : "false",
            "id" : "synonym",
            "transform" : []
         },
         {
            "indexed" : "true",
            "property" : [],
            "display_name" : "PANTHER family",
            "cardinality" : "single",
            "type" : "string",
            "transform" : [],
            "description" : "PANTHER families that are associated with this entity.",
            "searchable" : "true",
            "id" : "panther_family",
            "required" : "false"
         },
         {
            "cardinality" : "single",
            "property" : [],
            "display_name" : "PANTHER family",
            "indexed" : "true",
            "type" : "string",
            "transform" : [],
            "required" : "false",
            "id" : "panther_family_label",
            "searchable" : "true",
            "description" : "PANTHER families that are associated with this entity."
         },
         {
            "transform" : [],
            "id" : "phylo_graph_json",
            "required" : "false",
            "description" : "JSON blob form of the phylogenic tree.",
            "searchable" : "false",
            "display_name" : "This should not be displayed",
            "property" : [],
            "cardinality" : "single",
            "indexed" : "false",
            "type" : "string"
         },
         {
            "required" : "false",
            "id" : "database_xref",
            "description" : "Database cross-reference.",
            "searchable" : "false",
            "transform" : [],
            "type" : "string",
            "display_name" : "DB xref",
            "property" : [],
            "cardinality" : "multi",
            "indexed" : "true"
         }
      ],
      "filter_weights" : "source^7.0 type^6.0 panther_family_label^5.0 annotation_class_list_label^3.5 taxon_closure_label^4.0 regulates_closure_label^2.0"
   },
   "general" : {
      "_strict" : 0,
      "searchable_extension" : "_searchable",
      "id" : "general",
      "_outfile" : "/home/sjcarbon/local/src/git/amigo/metadata/general-config.yaml",
      "description" : "A generic search document to get a general overview of everything.",
      "result_weights" : "entity^3.0 category^1.0",
      "display_name" : "General",
      "_infile" : "/home/sjcarbon/local/src/git/amigo/metadata/general-config.yaml",
      "weight" : "0",
      "boost_weights" : "entity^3.0 entity_label^3.0 general_blob^3.0",
      "filter_weights" : "category^4.0",
      "fields_hash" : {
         "entity_label" : {
            "description" : "The label for this entity.",
            "searchable" : "true",
            "id" : "entity_label",
            "required" : "false",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "display_name" : "Enity label",
            "cardinality" : "single"
         },
         "id" : {
            "description" : "The mangled internal ID for this entity.",
            "searchable" : "false",
            "required" : "false",
            "id" : "id",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "display_name" : "Internal ID",
            "cardinality" : "single"
         },
         "entity" : {
            "transform" : [],
            "required" : "false",
            "id" : "entity",
            "searchable" : "false",
            "description" : "The ID/label for this entity.",
            "cardinality" : "single",
            "property" : [],
            "display_name" : "Entity",
            "indexed" : "true",
            "type" : "string"
         },
         "category" : {
            "transform" : [],
            "searchable" : "false",
            "description" : "The document category that this enitity belongs to.",
            "id" : "category",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "display_name" : "Document category",
            "property" : [],
            "type" : "string"
         },
         "general_blob" : {
            "description" : "A hidden searchable blob document to access this item. It should contain all the goodies that we want to search for, like species(?), synonyms, etc.",
            "searchable" : "true",
            "required" : "false",
            "id" : "general_blob",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "display_name" : "Generic blob",
            "cardinality" : "single"
         }
      },
      "fields" : [
         {
            "description" : "The mangled internal ID for this entity.",
            "searchable" : "false",
            "required" : "false",
            "id" : "id",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "display_name" : "Internal ID",
            "cardinality" : "single"
         },
         {
            "transform" : [],
            "required" : "false",
            "id" : "entity",
            "searchable" : "false",
            "description" : "The ID/label for this entity.",
            "cardinality" : "single",
            "property" : [],
            "display_name" : "Entity",
            "indexed" : "true",
            "type" : "string"
         },
         {
            "description" : "The label for this entity.",
            "searchable" : "true",
            "id" : "entity_label",
            "required" : "false",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "display_name" : "Enity label",
            "cardinality" : "single"
         },
         {
            "transform" : [],
            "searchable" : "false",
            "description" : "The document category that this enitity belongs to.",
            "id" : "category",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "display_name" : "Document category",
            "property" : [],
            "type" : "string"
         },
         {
            "description" : "A hidden searchable blob document to access this item. It should contain all the goodies that we want to search for, like species(?), synonyms, etc.",
            "searchable" : "true",
            "required" : "false",
            "id" : "general_blob",
            "transform" : [],
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "display_name" : "Generic blob",
            "cardinality" : "single"
         }
      ],
      "document_category" : "general",
      "schema_generating" : "true"
   }
};
/*
 * Package: server.js
 * 
 * Namespace: amigo.data.server
 * 
 * This package was automatically created during AmiGO 2 installation.
 * 
 * Purpose: Useful information about GO and the AmiGO installation.
 *          Also serves as a repository and getter for web
 *          resources such as images.
 * 
 * NOTE: This file is generated dynamically at installation time.
 *       Hard to work with unit tests--hope it's not too bad.
 *       Want to keep this real simple.
 */

// Module and namespace checking.
if ( typeof amigo == "undefined" ){ var amigo = {}; }
if ( typeof amigo.data == "undefined" ){ amigo.data = {}; }

/*
 * Constructor: server
 * 
 * The configuration for the server settings.
 * Essentially a JSONification of the config.pl AmiGO 2 file.
 * 
 * Arguments:
 *  n/a
 */
amigo.data.server = function(){

    // All of the server/instance-specific meta-data.
    var meta_data = {"html_base":"http://localhost:9999/static","js_base":"http://localhost:9999/static/js","bbop_img_star":"http://localhost:9999/static/images/star.png","js_dev_base":"http://localhost:9999/static/staging","beta":"1","species":[],"app_base":"http://localhost:9999","species_map":{},"evidence_codes":{},"galaxy_base":"http://galaxy.berkeleybop.org/","image_base":"http://localhost:9999/static/images","sources":[],"css_base":"http://localhost:9999/static/css","gp_types":[],"golr_base":"http://localhost:8080/solr/","ontologies":[],"term_regexp":"all|GO:[0-9]{7}"};

    ///
    /// Break out the data and various functions to access them...
    ///

    /*
     * Function: html_base
     * 
     * Access to AmiGO variable html_base.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var html_base = meta_data.html_base;
    this.html_base = function(){ return html_base; };

    /*
     * Function: js_base
     * 
     * Access to AmiGO variable js_base.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var js_base = meta_data.js_base;
    this.js_base = function(){ return js_base; };

    /*
     * Function: bbop_img_star
     * 
     * Access to AmiGO variable bbop_img_star.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var bbop_img_star = meta_data.bbop_img_star;
    this.bbop_img_star = function(){ return bbop_img_star; };

    /*
     * Function: js_dev_base
     * 
     * Access to AmiGO variable js_dev_base.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var js_dev_base = meta_data.js_dev_base;
    this.js_dev_base = function(){ return js_dev_base; };

    /*
     * Function: beta
     * 
     * Access to AmiGO variable beta.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var beta = meta_data.beta;
    this.beta = function(){ return beta; };

    /*
     * Function: species
     * 
     * Access to AmiGO variable species.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var species = meta_data.species;
    this.species = function(){ return species; };

    /*
     * Function: app_base
     * 
     * Access to AmiGO variable app_base.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var app_base = meta_data.app_base;
    this.app_base = function(){ return app_base; };

    /*
     * Function: species_map
     * 
     * Access to AmiGO variable species_map.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var species_map = meta_data.species_map;
    this.species_map = function(){ return species_map; };

    /*
     * Function: evidence_codes
     * 
     * Access to AmiGO variable evidence_codes.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var evidence_codes = meta_data.evidence_codes;
    this.evidence_codes = function(){ return evidence_codes; };

    /*
     * Function: galaxy_base
     * 
     * Access to AmiGO variable galaxy_base.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var galaxy_base = meta_data.galaxy_base;
    this.galaxy_base = function(){ return galaxy_base; };

    /*
     * Function: image_base
     * 
     * Access to AmiGO variable image_base.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var image_base = meta_data.image_base;
    this.image_base = function(){ return image_base; };

    /*
     * Function: sources
     * 
     * Access to AmiGO variable sources.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var sources = meta_data.sources;
    this.sources = function(){ return sources; };

    /*
     * Function: css_base
     * 
     * Access to AmiGO variable css_base.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var css_base = meta_data.css_base;
    this.css_base = function(){ return css_base; };

    /*
     * Function: gp_types
     * 
     * Access to AmiGO variable gp_types.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var gp_types = meta_data.gp_types;
    this.gp_types = function(){ return gp_types; };

    /*
     * Function: golr_base
     * 
     * Access to AmiGO variable golr_base.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var golr_base = meta_data.golr_base;
    this.golr_base = function(){ return golr_base; };

    /*
     * Function: ontologies
     * 
     * Access to AmiGO variable ontologies.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var ontologies = meta_data.ontologies;
    this.ontologies = function(){ return ontologies; };

    /*
     * Function: term_regexp
     * 
     * Access to AmiGO variable term_regexp.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var term_regexp = meta_data.term_regexp;
    this.term_regexp = function(){ return term_regexp; };


    // Does it look like a term?
    var tre_str = meta_data.term_regexp;
    var tre = new RegExp(tre_str);

    /*
     * Function: term_id_p
     * 
     * True or false on whether or not a string looks like a GO term id.
     * 
     * Parameters:
     *  term_id - the string to test
     * 
     * Returns:
     *  boolean
     */
    this.term_id_p = function(term_id){
       var retval = false;
       if( tre.test(term_id) ){
          retval = true;
       }
       return retval;
    };

    /*
     * Function: get_image_resource
     * 
     * Get a named resource from the meta_data hash if possible.
     * 
     * Parameters:
     *  resource - the string id of the resource
     * 
     * Returns:
     * string (url) of resource
     */
    this.get_image_resource = function(resource){

       var retval = null;
       var mangled_res = 'bbop_img_' + resource;

       if( meta_data[mangled_res] ){
          retval = meta_data[mangled_res];
       }
       return retval;
    };
};
/*
 * Package: definitions.js
 * 
 * Namespace: amigo.data.definitions
 * 
 * Purpose: Useful information about common GO datatypes and
 * structures, as well as some constants.
 */

// Module and namespace checking.
if ( typeof amigo == "undefined" ){ var amigo = {}; }
if ( typeof amigo.data == "undefined" ){ amigo.data = {}; }

/*
 * Constructor: definitions
 * 
 * Encapsulate common structures and constants.
 * 
 * Arguments:
 *  n/a
 */
amigo.data.definitions = function(){

    /*
     * Function: gaf_from_golr_fields
     * 
     * A list of fields to generate a GAF from using golr fields.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  list of strings
     */
    this.gaf_from_golr_fields = function(){
	return [
	    'source', // c1
	    'bioentity_internal_id', // c2; not bioentity
	    'bioentity_label', // c3
	    'qualifier', // c4
	    'annotation_class', // c5
	    'reference', // c6
	    'evidence_type', // c7
	    'evidence_with', // c8
	    'aspect', // c9
	    'bioentity_name', // c10
	    'synonym', // c11
	    'type', // c12
	    'taxon', // c13
	    'date', // c14
	    'assigned_by', // c15
	    'annotation_extension_class', // c16
	    'bioentity_isoform' // c17
	];
    };

    /*
     * Function: download_limit
     * 
     * The maximum allowed number of items to download for out server.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  integer
     */
    this.download_limit = function(){
	//return 7500;
	return 10000;
    };

};
/* 
 * Package: xrefs.js
 * 
 * Namespace: amigo.data.xrefs
 * 
 * This package was automatically created during an AmiGO 2 installation
 * from the GO.xrf_abbs file at: "http://www.geneontology.org/doc/GO.xrf_abbs".
 *
 * NOTE: This file is generated dynamically at installation time.
 * Hard to work with unit tests--hope it's not too bad. You have to
 * occasionally copy back to keep the unit tests sane.
 */

// All of the server/instance-specific meta-data.
if ( typeof amigo == "undefined" ){ var amigo = {}; }
if ( typeof amigo.data == "undefined" ){ amigo.data = {}; }

/*
 * Variable: xrefs
 * 
 * All the external references that we know about.
 */
amigo.data.xrefs = {
   "tgd_locus" : {
      "object" : "Gene name (gene symbol in mammalian nomenclature)",
      "generic_url" : "http://www.ciliate.org/",
      "abbreviation" : "TGD_LOCUS",
      "fullname" : null,
      "id" : null,
      "database" : "Tetrahymena Genome Database",
      "url_syntax" : "http://db.ciliate.org/cgi-bin/locus.pl?locus=[example_id]",
      "example_id" : "TGD_LOCUS:PDD1",
      "datatype" : null,
      "url_example" : "http://db.ciliate.org/cgi-bin/locus.pl?locus=PDD1",
      "name" : null,
      "uri_prefix" : null
   },
   "go_ref" : {
      "datatype" : null,
      "url_syntax" : "http://www.geneontology.org/cgi-bin/references.cgi#GO_REF:[example_id]",
      "database" : "Gene Ontology Database references",
      "example_id" : "GO_REF:0000001",
      "uri_prefix" : null,
      "url_example" : "http://www.geneontology.org/cgi-bin/references.cgi#GO_REF:0000001",
      "name" : null,
      "abbreviation" : "GO_REF",
      "generic_url" : "http://www.geneontology.org/",
      "object" : "Accession (for reference)",
      "id" : null,
      "fullname" : null,
      "local_id_syntax" : "^\\d{7}$"
   },
   "pubchem_bioassay" : {
      "datatype" : null,
      "example_id" : "PubChem_BioAssay:177",
      "url_syntax" : "http://pubchem.ncbi.nlm.nih.gov/assay/assay.cgi?aid=[example_id]",
      "database" : "NCBI PubChem database of bioassay records",
      "uri_prefix" : null,
      "url_example" : "http://pubchem.ncbi.nlm.nih.gov/assay/assay.cgi?aid=177",
      "name" : null,
      "abbreviation" : "PubChem_BioAssay",
      "generic_url" : "http://pubchem.ncbi.nlm.nih.gov/",
      "object" : "Identifier",
      "id" : null,
      "fullname" : null
   },
   "medline" : {
      "datatype" : null,
      "url_syntax" : null,
      "database" : "Medline literature database",
      "example_id" : "MEDLINE:20572430",
      "url_example" : null,
      "name" : null,
      "uri_prefix" : null,
      "generic_url" : "http://www.nlm.nih.gov/databases/databases_medline.html",
      "abbreviation" : "MEDLINE",
      "object" : "Identifier",
      "fullname" : null,
      "id" : null
   },
   "wikipedia" : {
      "datatype" : null,
      "url_syntax" : "http://en.wikipedia.org/wiki/[example_id]",
      "database" : "Wikipedia",
      "example_id" : "Wikipedia:Endoplasmic_reticulum",
      "url_example" : "http://en.wikipedia.org/wiki/Endoplasmic_reticulum",
      "name" : null,
      "uri_prefix" : null,
      "generic_url" : "http://en.wikipedia.org/",
      "abbreviation" : "Wikipedia",
      "object" : "Page Reference Identifier",
      "fullname" : null,
      "id" : null
   },
   "genbank" : {
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Genbank/",
      "abbreviation" : "GenBank",
      "object" : "Sequence accession",
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein ",
      "id" : null,
      "description" : "The NIH genetic sequence database, an annotated collection of all publicly available DNA sequences.",
      "local_id_syntax" : "^[A-Z]{2}[0-9]{6}$",
      "datatype" : null,
      "example_id" : "GB:AA816246",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=nucleotide&val=[example_id]",
      "database" : "GenBank",
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=nucleotide&val=AA816246",
      "name" : null,
      "uri_prefix" : null
   },
   "gr_ref" : {
      "uri_prefix" : null,
      "url_example" : "http://www.gramene.org/db/literature/pub_search?ref_id=659",
      "name" : null,
      "url_syntax" : "http://www.gramene.org/db/literature/pub_search?ref_id=[example_id]",
      "example_id" : "GR_REF:659",
      "database" : null,
      "datatype" : null,
      "database: Gramene" : "A Comparative Mapping Resource for Grains",
      "id" : null,
      "fullname" : null,
      "object" : "Reference",
      "abbreviation" : "GR_REF",
      "generic_url" : "http://www.gramene.org/"
   },
   "obo_rel" : {
      "id" : null,
      "fullname" : null,
      "abbreviation" : "OBO_REL",
      "generic_url" : "http://www.obofoundry.org/ro/",
      "object" : "Identifier",
      "uri_prefix" : null,
      "url_example" : null,
      "name" : null,
      "datatype" : null,
      "url_syntax" : null,
      "example_id" : "OBO_REL:part_of",
      "database" : "OBO relation ontology"
   },
   "gr_protein" : {
      "id" : null,
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein",
      "local_id_syntax" : "^[A-Z][0-9][A-Z0-9]{3}[0-9]$",
      "database: Gramene" : "A Comparative Mapping Resource for Grains",
      "abbreviation" : "GR_protein",
      "generic_url" : "http://www.gramene.org/",
      "object" : "Protein identifier",
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://www.gramene.org/db/protein/protein_search?acc=Q6VSV0",
      "datatype" : null,
      "example_id" : "GR_PROTEIN:Q6VSV0",
      "url_syntax" : "http://www.gramene.org/db/protein/protein_search?acc=[example_id]",
      "database" : null
   },
   "tigr_genprop" : {
      "object" : "Accession",
      "generic_url" : "http://cmr.jcvi.org/",
      "abbreviation" : "TIGR_GenProp",
      "local_id_syntax" : "^GenProp[0-9]{4}$",
      "entity_type" : "GO:0008150 ! biological process",
      "fullname" : null,
      "id" : null,
      "example_id" : "JCVI_GenProp:GenProp0120",
      "database" : "Genome Properties database at the J. Craig Venter Institute",
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenomePropDefinition.cgi?prop_acc=[example_id]",
      "datatype" : null,
      "name" : null,
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenomePropDefinition.cgi?prop_acc=GenProp0120",
      "uri_prefix" : null
   },
   "brenda" : {
      "url_example" : "http://www.brenda-enzymes.info/php/result_flat.php4?ecno=4.2.1.3",
      "name" : null,
      "uri_prefix" : null,
      "url_syntax" : "http://www.brenda-enzymes.info/php/result_flat.php4?ecno=[example_id]",
      "database" : "BRENDA, The Comprehensive Enzyme Information System",
      "example_id" : "BRENDA:4.2.1.3",
      "datatype" : null,
      "entity_type" : "GO:0003824 ! catalytic activity",
      "fullname" : null,
      "id" : null,
      "object" : "EC enzyme identifier",
      "generic_url" : "http://www.brenda-enzymes.info",
      "abbreviation" : "BRENDA"
   },
   "ecogene" : {
      "object" : "EcoGene accession",
      "generic_url" : "http://www.ecogene.org/",
      "abbreviation" : "ECOGENE",
      "local_id_syntax" : "^EG[0-9]{5}$",
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "id" : null,
      "url_syntax" : "http://www.ecogene.org/geneInfo.php?eg_id=[example_id]",
      "example_id" : "ECOGENE:EG10818",
      "database" : "EcoGene Database of Escherichia coli Sequence and Function",
      "datatype" : null,
      "url_example" : "http://www.ecogene.org/geneInfo.php?eg_id=EG10818",
      "name" : null,
      "uri_prefix" : null
   },
   "ncbi_np" : {
      "url_example" : null,
      "name" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "database" : "NCBI RefSeq",
      "url_syntax" : null,
      "example_id" : "NCBI_NP:123456",
      "is_obsolete" : "true",
      "fullname" : null,
      "replaced_by" : "RefSeq",
      "id" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "abbreviation" : "NCBI_NP",
      "object" : "Protein identifier"
   },
   "mi" : {
      "id" : null,
      "fullname" : null,
      "object" : "Interaction identifier",
      "abbreviation" : "MI",
      "generic_url" : "http://psidev.sourceforge.net/mi/xml/doc/user/index.html",
      "uri_prefix" : null,
      "url_example" : null,
      "name" : null,
      "url_syntax" : null,
      "example_id" : "MI:0018",
      "database" : "Proteomic Standard Initiative for Molecular Interaction",
      "datatype" : null
   },
   "cacao" : {
      "description" : "The Community Assessment of Community Annotation with Ontologies (CACAO) is a project to do large-scale manual community annotation of gene function using the Gene Ontology as a multi-institution student competition. ",
      "fullname" : null,
      "id" : null,
      "object" : "accession",
      "generic_url" : "http://gowiki.tamu.edu/wiki/index.php/Category:CACAO",
      "abbreviation" : "CACAO",
      "name" : null,
      "url_example" : "http://gowiki.tamu.edu/wiki/index.php/MYCS2:A0QNF5",
      "uri_prefix" : null,
      "url_syntax" : "http://gowiki.tamu.edu/wiki/index.php/[example_id]",
      "database" : "Community Assessment of Community Annotation with Ontologies",
      "example_id" : "MYCS2:A0QNF5",
      "datatype" : null
   },
   "broad" : {
      "url_syntax" : null,
      "database" : "Broad Institute",
      "example_id" : null,
      "datatype" : null,
      "url_example" : null,
      "name" : null,
      "uri_prefix" : null,
      "object" : null,
      "generic_url" : "http://www.broad.mit.edu/",
      "abbreviation" : "Broad",
      "fullname" : null,
      "id" : null
   },
   "agi_locuscode" : {
      "datatype" : null,
      "database" : "Arabidopsis Genome Initiative",
      "abbreviation" : "AGI_LocusCode",
      "entity_type" : "SO:0000704 ! gene",
      "local_id_syntax" : "^AT[MC0-5]G[0-9]{5}(\\.[0-9]{1})?$",
      "description" : "Comprises TAIR, TIGR and MIPS",
      "url_syntax" : "http://arabidopsis.org/servlets/TairObject?type=locus&name=[example_id]",
      "!url_example" : "http://www.tigr.org/tigr-scripts/euk_manatee/shared/ORF_infopage.cgi?db=ath1&orf=At2g17950",
      "example_id" : "AGI_LocusCode:At2g17950",
      "uri_prefix" : null,
      "url_example" : "http://arabidopsis.org/servlets/TairObject?type=locus&name=At2g17950",
      "name" : null,
      "generic_url" : "http://www.arabidopsis.org",
      "object" : "Locus identifier",
      "id" : null,
      "fullname" : null,
      "!url_syntax" : "http://www.tigr.org/tigr-scripts/euk_manatee/shared/ORF_infopage.cgi?db=ath1&orf=[example_id]"
   },
   "merops_fam" : {
      "generic_url" : "http://merops.sanger.ac.uk/",
      "abbreviation" : "MEROPS_fam",
      "object" : "Peptidase family identifier",
      "fullname" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://merops.sanger.ac.uk/cgi-bin/famsum?family=[example_id]",
      "example_id" : "MEROPS_fam:M18",
      "database" : "MEROPS peptidase database",
      "url_example" : "http://merops.sanger.ac.uk/cgi-bin/famsum?family=m18",
      "name" : null,
      "uri_prefix" : null
   },
   "go" : {
      "datatype" : null,
      "url_syntax" : "http://amigo.geneontology.org/cgi-bin/amigo/term-details.cgi?term=GO:[example_id]",
      "example_id" : "GO:0004352",
      "database" : "Gene Ontology Database",
      "url_example" : "http://amigo.geneontology.org/cgi-bin/amigo/term-details.cgi?term=GO:0004352",
      "name" : null,
      "uri_prefix" : null,
      "generic_url" : "http://amigo.geneontology.org/",
      "abbreviation" : "GO",
      "object" : "Identifier",
      "fullname" : null,
      "entity_type" : "GO:0032991 ! macromolecular complex",
      "id" : null,
      "local_id_syntax" : "^\\d{7}$"
   },
   "pinc" : {
      "uri_prefix" : null,
      "name" : null,
      "url_example" : null,
      "datatype" : null,
      "url_syntax" : null,
      "example_id" : null,
      "database" : "Proteome Inc.",
      "id" : null,
      "fullname" : null,
      "description" : "represents GO annotations created in 2001 for NCBI and extracted into UniProtKB-GOA from EntrezGene",
      "abbreviation" : "PINC",
      "generic_url" : "http://www.proteome.com/",
      "object" : null
   },
   "wbbt" : {
      "entity_type" : "WBbt:0005766 ! anatomy",
      "fullname" : null,
      "id" : null,
      "local_id_syntax" : "[0-9]{7}",
      "generic_url" : "http://www.wormbase.org/",
      "abbreviation" : "WBbt",
      "object" : "Identifier",
      "name" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "url_syntax" : null,
      "database" : "C. elegans gross anatomy",
      "example_id" : "WBbt:0005733"
   },
   "uberon" : {
      "uri_prefix" : null,
      "url_example" : "http://purl.obolibrary.org/obo/UBERON_0002398",
      "name" : null,
      "database" : "Uber-anatomy ontology",
      "url_syntax" : "http://purl.obolibrary.org/obo/UBERON_[example_id]",
      "example_id" : "URBERON:0002398",
      "datatype" : null,
      "local_id_syntax" : "^[0-9]{7}$",
      "description" : "A multi-species anatomy ontology",
      "id" : null,
      "fullname" : null,
      "entity_type" : "UBERON:0001062 ! anatomical entity",
      "object" : "Identifier",
      "abbreviation" : "UBERON",
      "generic_url" : "http://uberon.org"
   },
   "embl" : {
      "description" : "International nucleotide sequence database collaboration, comprising EMBL-EBI nucleotide sequence data library (EMBL-Bank), DNA DataBank of Japan (DDBJ), and NCBI GenBank",
      "local_id_syntax" : "^([A-Z]{1}[0-9]{5})|([A-Z]{2}[0-9]{6})|([A-Z]{4}[0-9]{8,9})$",
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "id" : null,
      "object" : "Sequence accession",
      "generic_url" : "http://www.ebi.ac.uk/embl/",
      "abbreviation" : "EMBL",
      "name" : null,
      "url_example" : "http://www.ebi.ac.uk/cgi-bin/emblfetch?style=html&Submit=Go&id=AA816246",
      "uri_prefix" : null,
      "example_id" : "EMBL:AA816246",
      "url_syntax" : "http://www.ebi.ac.uk/cgi-bin/emblfetch?style=html&Submit=Go&id=[example_id]",
      "database" : "EMBL Nucleotide Sequence Database",
      "datatype" : null
   },
   "gdb" : {
      "abbreviation" : "GDB",
      "generic_url" : "http://www.gdb.org/",
      "object" : "Accession",
      "id" : null,
      "fullname" : null,
      "datatype" : null,
      "database" : "Human Genome Database",
      "url_syntax" : "http://www.gdb.org/gdb-bin/genera/accno?accessionNum=GDB:[example_id]",
      "example_id" : "GDB:306600",
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://www.gdb.org/gdb-bin/genera/accno?accessionNum=GDB:306600"
   },
   "ddb_ref" : {
      "datatype" : null,
      "example_id" : "dictyBase_REF:10157",
      "url_syntax" : "http://dictybase.org/db/cgi-bin/dictyBase/reference/reference.pl?refNo=[example_id]",
      "database" : "dictyBase literature references",
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://dictybase.org/db/cgi-bin/dictyBase/reference/reference.pl?refNo=10157",
      "abbreviation" : "DDB_REF",
      "generic_url" : "http://dictybase.org",
      "object" : "Literature Reference Identifier",
      "id" : null,
      "fullname" : null
   },
   "ecoliwiki" : {
      "generic_url" : "http://ecoliwiki.net/",
      "abbreviation" : "EcoliWiki",
      "object" : null,
      "fullname" : null,
      "id" : null,
      "description" : "EcoliHub's subsystem for community annotation of E. coli K-12",
      "local_id_syntax" : "^[A-Za-z]{3,4}$",
      "datatype" : null,
      "url_syntax" : null,
      "example_id" : null,
      "database" : "EcoliWiki from EcoliHub",
      "name" : null,
      "url_example" : null,
      "uri_prefix" : null
   },
   "smd" : {
      "generic_url" : "http://genome-www.stanford.edu/microarray",
      "abbreviation" : "SMD",
      "object" : null,
      "fullname" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : null,
      "example_id" : null,
      "database" : "Stanford Microarray Database",
      "url_example" : null,
      "name" : null,
      "uri_prefix" : null
   },
   "superfamily" : {
      "name" : null,
      "url_example" : "http://supfam.cs.bris.ac.uk/SUPERFAMILY/cgi-bin/scop.cgi?ipid=SSF51905",
      "uri_prefix" : null,
      "example_id" : "SUPERFAMILY:51905",
      "url_syntax" : "http://supfam.cs.bris.ac.uk/SUPERFAMILY/cgi-bin/scop.cgi?ipid=SSF[example_id]",
      "database" : "SUPERFAMILY protein annotation database",
      "datatype" : null,
      "description" : "A database of structural and functional protein annotations for completely sequenced genomes",
      "fullname" : null,
      "id" : null,
      "object" : "Accession",
      "generic_url" : "http://supfam.cs.bris.ac.uk/SUPERFAMILY/index.html",
      "abbreviation" : "SUPERFAMILY"
   },
   "uniprotkb" : {
      "name" : null,
      "url_example" : "http://www.uniprot.org/uniprot/P51587",
      "uri_prefix" : null,
      "datatype" : null,
      "example_id" : "UniProtKB:P51587",
      "url_syntax" : "http://www.uniprot.org/uniprot/[example_id]",
      "database" : "Universal Protein Knowledgebase",
      "entity_type" : "PR:000000001 ! protein ",
      "fullname" : null,
      "id" : null,
      "description" : "A central repository of protein sequence and function created by joining the information contained in Swiss-Prot, TrEMBL, and PIR database",
      "local_id_syntax" : "^([OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z]([0-9][A-Z][A-Z0-9]{2}){1,2}[0-9])((-[0-9]+)|:PRO_[0-9]{10}|:VAR_[0-9]{6}){0,1}$",
      "generic_url" : "http://www.uniprot.org",
      "abbreviation" : "UniProtKB",
      "object" : "Accession"
   },
   "dictybase_gene_name" : {
      "generic_url" : "http://dictybase.org",
      "abbreviation" : "dictyBase_gene_name",
      "object" : "Gene name",
      "fullname" : null,
      "id" : null,
      "datatype" : null,
      "example_id" : "dictyBase_gene_name:mlcE",
      "url_syntax" : "http://dictybase.org/gene/[example_id]",
      "database" : "dictyBase",
      "url_example" : "http://dictybase.org/gene/mlcE",
      "name" : null,
      "uri_prefix" : null
   },
   "subtilistg" : {
      "uri_prefix" : null,
      "name" : null,
      "url_example" : null,
      "url_syntax" : null,
      "example_id" : "SUBTILISTG:accC",
      "database" : "Bacillus subtilis Genome Sequence Project",
      "datatype" : null,
      "id" : null,
      "fullname" : null,
      "object" : "Gene symbol",
      "abbreviation" : "SUBTILISTG",
      "generic_url" : "http://genolist.pasteur.fr/SubtiList/"
   },
   "pamgo" : {
      "abbreviation" : "PAMGO",
      "generic_url" : "http://pamgo.vbi.vt.edu/",
      "object" : null,
      "id" : null,
      "fullname" : null,
      "datatype" : null,
      "url_syntax" : null,
      "example_id" : null,
      "database" : "Plant-Associated Microbe Gene Ontology Interest Group",
      "uri_prefix" : null,
      "url_example" : null,
      "name" : null
   },
   "vbrc" : {
      "fullname" : null,
      "id" : null,
      "generic_url" : "http://vbrc.org",
      "abbreviation" : "VBRC",
      "object" : "Identifier",
      "url_example" : "http://vbrc.org/query.asp?web_id=VBRC:F35742",
      "name" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "example_id" : "VBRC:F35742",
      "url_syntax" : "http://vbrc.org/query.asp?web_id=VBRC:[example_id]",
      "database" : "Viral Bioinformatics Resource Center"
   },
   "chebi" : {
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://www.ebi.ac.uk/chebi/searchId.do?chebiId=CHEBI:17234",
      "example_id" : "CHEBI:17234",
      "database" : "Chemical Entities of Biological Interest",
      "url_syntax" : "http://www.ebi.ac.uk/chebi/searchId.do?chebiId=CHEBI:[example_id]",
      "datatype" : null,
      "local_id_syntax" : "^[0-9]{1,6}$",
      "id" : null,
      "entity_type" : "CHEBI:24431 ! chemical entity ",
      "fullname" : null,
      "object" : "Identifier",
      "abbreviation" : "ChEBI",
      "generic_url" : "http://www.ebi.ac.uk/chebi/"
   },
   "gorel" : {
      "generic_url" : "http://purl.obolibrary.org/obo/ro",
      "abbreviation" : "GOREL",
      "object" : null,
      "fullname" : null,
      "id" : null,
      "description" : "Additional relations pending addition into RO",
      "datatype" : null,
      "url_syntax" : null,
      "database" : "GO Extensions to OBO Relation Ontology Ontology",
      "example_id" : null,
      "name" : null,
      "url_example" : null,
      "uri_prefix" : null
   },
   "casgen" : {
      "name" : null,
      "url_example" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Genus&id=1040",
      "uri_prefix" : null,
      "datatype" : null,
      "database" : "Catalog of Fishes genus database",
      "url_syntax" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Genus&id=[example_id]",
      "example_id" : "CASGEN:1040",
      "fullname" : null,
      "id" : null,
      "generic_url" : "http://research.calacademy.org/research/ichthyology/catalog/fishcatsearch.html",
      "abbreviation" : "CASGEN",
      "object" : "Identifier"
   },
   "mo" : {
      "url_example" : "http://mged.sourceforge.net/ontologies/MGEDontology.php#Action",
      "name" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "example_id" : "MO:Action",
      "url_syntax" : "http://mged.sourceforge.net/ontologies/MGEDontology.php#[example_id]",
      "database" : "MGED Ontology",
      "fullname" : null,
      "id" : null,
      "generic_url" : "http://mged.sourceforge.net/ontologies/MGEDontology.php",
      "abbreviation" : "MO",
      "object" : "ontology term"
   },
   "ensembl_transcriptid" : {
      "url_example" : "http://www.ensembl.org/id/ENST00000371959",
      "name" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "database" : "Ensembl database of automatically annotated genomic data",
      "url_syntax" : "http://www.ensembl.org/id/[example_id]",
      "example_id" : "ENSEMBL_TranscriptID:ENST00000371959",
      "fullname" : null,
      "entity_type" : "SO:0000673 ! transcript",
      "id" : null,
      "local_id_syntax" : "^ENST[0-9]{9,16}$",
      "generic_url" : "http://www.ensembl.org/",
      "abbreviation" : "ENSEMBL_TranscriptID",
      "object" : "Transcript identifier"
   },
   "go_central" : {
      "abbreviation" : "GO_Central",
      "generic_url" : "http://www.geneontology.org/GO.refgenome.shtml",
      "object" : null,
      "id" : null,
      "fullname" : null,
      "description" : "Manual annotation from PAINT curators into the UniProt Protein2GO curation tool.",
      "datatype" : null,
      "url_syntax" : null,
      "example_id" : null,
      "database" : "GO Central",
      "uri_prefix" : null,
      "url_example" : null,
      "name" : null
   },
   "mesh" : {
      "abbreviation" : "MeSH",
      "generic_url" : "http://www.nlm.nih.gov/mesh/2005/MBrowser.html",
      "object" : "MeSH heading",
      "id" : null,
      "fullname" : null,
      "datatype" : null,
      "url_syntax" : "http://www.nlm.nih.gov/cgi/mesh/2005/MB_cgi?mode=&term=[example_id]",
      "example_id" : "MeSH:mitosis",
      "database" : "Medical Subject Headings",
      "uri_prefix" : null,
      "url_example" : "http://www.nlm.nih.gov/cgi/mesh/2005/MB_cgi?mode=&term=mitosis",
      "name" : null
   },
   "lifedb" : {
      "object" : "cDNA clone identifier",
      "abbreviation" : "LIFEdb",
      "generic_url" : "http://www.lifedb.de/",
      "description" : "LifeDB is a database for information on protein localization, interaction, functional assays and expression.",
      "id" : null,
      "fullname" : null,
      "url_syntax" : "http://www.dkfz.de/LIFEdb/LIFEdb.aspx?ID=[example_id]",
      "database" : "LifeDB",
      "example_id" : "LIFEdb:DKFZp564O1716",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.dkfz.de/LIFEdb/LIFEdb.aspx?ID=DKFZp564O1716",
      "name" : null
   },
   "wb" : {
      "object" : "Gene identifier",
      "abbreviation" : "WB",
      "generic_url" : "http://www.wormbase.org/",
      "local_id_syntax" : "^WB(Gene|Var|RNAi|Transgene)[0-9]{8}$",
      "id" : null,
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein",
      "url_syntax" : "http://www.wormbase.org/db/gene/gene?name=[example_id]",
      "example_id" : "WB:WBGene00003001",
      "database" : "WormBase database of nematode biology",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.wormbase.org/db/get?class=Gene;name=WBGene00003001",
      "name" : null
   },
   "jcvi_cmr" : {
      "object" : "Locus",
      "abbreviation" : "JCVI_CMR",
      "generic_url" : "http://cmr.jcvi.org/",
      "id" : null,
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein",
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenePage.cgi?locus=[example_id]",
      "example_id" : "JCVI_CMR:VCA0557",
      "database" : "Comprehensive Microbial Resource at the J. Craig Venter Institute",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenePage.cgi?locus=VCA0557",
      "name" : null
   },
   "img" : {
      "url_syntax" : "http://img.jgi.doe.gov/cgi-bin/pub/main.cgi?section=GeneDetail&page=geneDetail&gene_oid=[example_id]",
      "example_id" : "IMG:640008772",
      "database" : "Integrated Microbial Genomes; JGI web site for genome annotation",
      "datatype" : null,
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://img.jgi.doe.gov/cgi-bin/pub/main.cgi?section=GeneDetail&page=geneDetail&gene_oid=640008772",
      "object" : "Identifier",
      "abbreviation" : "IMG",
      "generic_url" : "http://img.jgi.doe.gov",
      "id" : null,
      "fullname" : null
   },
   "pompep" : {
      "uri_prefix" : null,
      "url_example" : null,
      "name" : null,
      "url_syntax" : null,
      "example_id" : "Pompep:SPAC890.04C",
      "database" : "Schizosaccharomyces pombe protein data",
      "datatype" : null,
      "id" : null,
      "fullname" : null,
      "object" : "Gene/protein identifier",
      "abbreviation" : "Pompep",
      "generic_url" : "ftp://ftp.sanger.ac.uk/pub/yeast/pombe/Protein_data/"
   },
   "iuphar" : {
      "datatype" : null,
      "url_syntax" : null,
      "example_id" : null,
      "database" : "International Union of Pharmacology",
      "name" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "generic_url" : "http://www.iuphar.org/",
      "abbreviation" : "IUPHAR",
      "object" : null,
      "fullname" : null,
      "id" : null
   },
   "ensembl" : {
      "datatype" : null,
      "database" : "Ensembl database of automatically annotated genomic data",
      "example_id" : "ENSEMBL:ENSP00000265949",
      "url_syntax" : "http://www.ensembl.org/id/[example_id]",
      "uri_prefix" : null,
      "url_example" : "http://www.ensembl.org/id/ENSP00000265949",
      "name" : null,
      "abbreviation" : "Ensembl",
      "generic_url" : "http://www.ensembl.org/",
      "object" : "Identifier (unspecified)",
      "id" : null,
      "entity_type" : "SO:0000673 ! transcript",
      "fullname" : null,
      "local_id_syntax" : "^ENS[A-Z0-9]{10,17}$"
   },
   "unigene" : {
      "datatype" : null,
      "database" : "UniGene",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/UniGene/clust.cgi?ORG=[organism_abbreviation]&CID=[cluster_id]",
      "example_id" : "UniGene:Hs.212293",
      "name" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/UniGene/clust.cgi?ORG=Hs&CID=212293",
      "uri_prefix" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/UniGene",
      "abbreviation" : "UniGene",
      "object" : "Identifier (for transcript cluster)",
      "fullname" : null,
      "id" : null,
      "description" : "NCBI transcript cluster database, organized by transcriptome. Each UniGene entry is a set of transcript sequences that appear to come from the same transcription locus (gene or expressed pseudogene)."
   },
   "pseudocap" : {
      "url_syntax" : "http://v2.pseudomonas.com/getAnnotation.do?locusID=[example_id]",
      "example_id" : "PseudoCAP:PA4756",
      "database" : "Pseudomonas Genome Project",
      "datatype" : null,
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://v2.pseudomonas.com/getAnnotation.do?locusID=PA4756",
      "object" : "Identifier",
      "abbreviation" : "PseudoCAP",
      "generic_url" : "http://v2.pseudomonas.com/",
      "id" : null,
      "fullname" : null
   },
   "subtilist" : {
      "url_example" : null,
      "name" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "example_id" : "SUBTILISTG:BG11384",
      "url_syntax" : null,
      "database" : "Bacillus subtilis Genome Sequence Project",
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein",
      "id" : null,
      "generic_url" : "http://genolist.pasteur.fr/SubtiList/",
      "abbreviation" : "SUBTILIST",
      "object" : "Accession"
   },
   "pato" : {
      "object" : "Identifier",
      "abbreviation" : "PATO",
      "generic_url" : "http://www.bioontology.org/wiki/index.php/PATO:Main_Page",
      "id" : null,
      "fullname" : null,
      "url_syntax" : null,
      "example_id" : "PATO:0001420",
      "database" : "Phenotypic quality ontology",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : null,
      "name" : null
   },
   "unipathway" : {
      "datatype" : null,
      "example_id" : "UniPathway:UPA00155",
      "url_syntax" : "http://www.grenoble.prabi.fr/obiwarehouse/unipathway/upa?upid=[example_id]",
      "database" : "UniPathway",
      "uri_prefix" : null,
      "url_example" : "http://www.grenoble.prabi.fr/obiwarehouse/unipathway/upa?upid=UPA00155",
      "name" : null,
      "abbreviation" : "UniPathway",
      "generic_url" : "http://www.grenoble.prabi.fr/obiwarehouse/unipathway",
      "object" : "Identifier",
      "id" : null,
      "fullname" : null,
      "entity_type" : "GO:0008150 ! biological process",
      "description" : "UniPathway is a a metabolic door to UniProtKB/Swiss-Prot, a curated resource of metabolic pathways for the UniProtKB/Swiss-Prot knowledgebase."
   },
   "ppi" : {
      "datatype" : null,
      "example_id" : null,
      "url_syntax" : null,
      "database" : "Pseudomonas syringae community annotation project",
      "uri_prefix" : null,
      "name" : null,
      "url_example" : null,
      "abbreviation" : "PPI",
      "generic_url" : "http://genome.pseudomonas-syringae.org/",
      "object" : null,
      "id" : null,
      "fullname" : null
   },
   "pubmed" : {
      "local_id_syntax" : "^[0-9]+$",
      "id" : null,
      "fullname" : null,
      "object" : "Identifier",
      "abbreviation" : "PubMed",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/PubMed/",
      "uri_prefix" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/pubmed/4208797",
      "name" : null,
      "database" : "PubMed",
      "example_id" : "PMID:4208797",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/pubmed/[example_id]",
      "datatype" : null
   },
   "refseq_na" : {
      "datatype" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=[example_id]",
      "example_id" : "RefSeq_NA:NC_000913",
      "database" : "RefSeq (Nucleic Acid)",
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=NC_000913",
      "name" : null,
      "uri_prefix" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/RefSeq/",
      "abbreviation" : "RefSeq_NA",
      "object" : "Identifier",
      "fullname" : null,
      "is_obsolete" : "true",
      "id" : null,
      "replaced_by" : "RefSeq"
   },
   "spd" : {
      "datatype" : null,
      "url_syntax" : "http://www.riken.jp/SPD/[example_id].html",
      "example_id" : "SPD:05/05F01",
      "database" : "Schizosaccharomyces pombe Postgenome Database at RIKEN; includes Orfeome Localisation data",
      "url_example" : "http://www.riken.jp/SPD/05/05F01.html",
      "name" : null,
      "uri_prefix" : null,
      "generic_url" : "http://www.riken.jp/SPD/",
      "abbreviation" : "SPD",
      "object" : "Identifier",
      "fullname" : null,
      "id" : null,
      "local_id_syntax" : "^[0-9]{2}/[0-9]{2}[A-Z][0-9]{2}$"
   },
   "sabio-rk" : {
      "fullname" : null,
      "id" : null,
      "description" : "The SABIO-RK (System for the Analysis of Biochemical Pathways - Reaction Kinetics) is a web-based application based on the SABIO relational database that contains information about biochemical reactions, their kinetic equations with their parameters, and the experimental conditions under which these parameters were measured.",
      "generic_url" : "http://sabio.villa-bosch.de/",
      "abbreviation" : "SABIO-RK",
      "object" : "reaction",
      "url_example" : "http://sabio.villa-bosch.de/reacdetails.jsp?reactid=1858",
      "name" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "url_syntax" : "http://sabio.villa-bosch.de/reacdetails.jsp?reactid=[example_id]",
      "database" : "SABIO Reaction Kinetics",
      "example_id" : "SABIO-RK:1858"
   },
   "patric" : {
      "example_id" : "PATRIC:cds.000002.436951",
      "url_syntax" : "http://patric.vbi.vt.edu/gene/overview.php?fid=[example_id]",
      "database" : "PathoSystems Resource Integration Center",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : "http://patric.vbi.vt.edu/gene/overview.php?fid=cds.000002.436951",
      "name" : null,
      "object" : "Feature identifier",
      "abbreviation" : "PATRIC",
      "generic_url" : "http://patric.vbi.vt.edu",
      "description" : "PathoSystems Resource Integration Center at the Virginia Bioinformatics Institute",
      "id" : null,
      "fullname" : null
   },
   "pamgo_mgg" : {
      "description" : "Magnaporthe grisea database at North Carolina State University; member of PAMGO Interest Group",
      "id" : null,
      "fullname" : null,
      "object" : "Locus",
      "abbreviation" : "PAMGO_MGG",
      "generic_url" : "http://scotland.fgl.ncsu.edu/smeng/GoAnnotationMagnaporthegrisea.html",
      "uri_prefix" : null,
      "url_example" : "http://scotland.fgl.ncsu.edu/cgi-bin/adHocQuery.cgi?adHocQuery_dbName=smeng_goannotation&Action=Data&QueryName=Functional+Categorization+of+MGG+GO+Annotation&P_KeyWord=MGG_05132",
      "name" : null,
      "url_syntax" : "http://scotland.fgl.ncsu.edu/cgi-bin/adHocQuery.cgi?adHocQuery_dbName=smeng_goannotation&Action=Data&QueryName=Functional+Categorization+of+MGG+GO+Annotation&P_KeyWord=[example_id]",
      "example_id" : "PAMGO_MGG:MGG_05132",
      "database" : "Magnaporthe grisea database",
      "datatype" : null
   },
   "casspc" : {
      "generic_url" : "http://research.calacademy.org/research/ichthyology/catalog/fishcatsearch.html",
      "abbreviation" : "CASSPC",
      "object" : "Identifier",
      "fullname" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Species&id=[example_id]",
      "example_id" : null,
      "database" : "Catalog of Fishes species database",
      "name" : null,
      "url_example" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Species&id=1979",
      "uri_prefix" : null
   },
   "broad_mgg" : {
      "datatype" : null,
      "example_id" : "Broad_MGG:MGG_05132.5",
      "url_syntax" : "http://www.broad.mit.edu/annotation/genome/magnaporthe_grisea/GeneLocus.html?sp=S[example_id]",
      "database" : "Magnaporthe grisea Database",
      "uri_prefix" : null,
      "url_example" : "http://www.broad.mit.edu/annotation/genome/magnaporthe_grisea/GeneLocus.html?sp=SMGG_05132",
      "name" : null,
      "abbreviation" : "Broad_MGG",
      "generic_url" : "http://www.broad.mit.edu/annotation/genome/magnaporthe_grisea/Home.html",
      "object" : "Locus",
      "id" : null,
      "fullname" : null,
      "description" : "Magnaporthe grisea Database at the Broad Institute"
   },
   "phenoscape" : {
      "id" : null,
      "fullname" : null,
      "abbreviation" : "PhenoScape",
      "generic_url" : "http://phenoscape.org/",
      "object" : null,
      "uri_prefix" : null,
      "name" : null,
      "url_example" : null,
      "datatype" : null,
      "example_id" : null,
      "url_syntax" : null,
      "database" : "PhenoScape Knowledgebase"
   },
   "sp_kw" : {
      "generic_url" : "http://www.uniprot.org/keywords/",
      "abbreviation" : "SP_KW",
      "object" : "Identifier",
      "fullname" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://www.uniprot.org/keywords/[example_id]",
      "database" : "UniProt Knowledgebase keywords",
      "example_id" : "UniProtKB-KW:KW-0812",
      "url_example" : "http://www.uniprot.org/keywords/KW-0812",
      "name" : null,
      "uri_prefix" : null
   },
   "ncbitaxon" : {
      "abbreviation" : "NCBITaxon",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Taxonomy/taxonomyhome.html/",
      "object" : "Identifier",
      "id" : null,
      "fullname" : null,
      "datatype" : null,
      "database" : "NCBI Taxonomy",
      "example_id" : "taxon:7227",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=[example_id]",
      "uri_prefix" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=3702",
      "name" : null
   },
   "rgd" : {
      "datatype" : null,
      "example_id" : "RGD:2004",
      "url_syntax" : "http://rgd.mcw.edu/generalSearch/RgdSearch.jsp?quickSearch=1&searchKeyword=[example_id]",
      "database" : "Rat Genome Database",
      "name" : null,
      "url_example" : "http://rgd.mcw.edu/generalSearch/RgdSearch.jsp?quickSearch=1&searchKeyword=2004",
      "uri_prefix" : null,
      "generic_url" : "http://rgd.mcw.edu/",
      "abbreviation" : "RGD",
      "object" : "Accession",
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "id" : null,
      "local_id_syntax" : "^[0-9]{4,7}$"
   },
   "mgd" : {
      "generic_url" : "http://www.informatics.jax.org/",
      "abbreviation" : "MGD",
      "! url_syntax" : "http://www.informatics.jax.org/searches/marker.cgi?",
      "object" : "Gene symbol",
      "fullname" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : null,
      "example_id" : "MGD:Adcy9",
      "database" : "Mouse Genome Database",
      "url_example" : null,
      "name" : null,
      "uri_prefix" : null
   },
   "hugo" : {
      "datatype" : null,
      "url_syntax" : null,
      "example_id" : null,
      "database" : "Human Genome Organisation",
      "url_example" : null,
      "name" : null,
      "uri_prefix" : null,
      "generic_url" : "http://www.hugo-international.org/",
      "abbreviation" : "HUGO",
      "object" : null,
      "fullname" : null,
      "id" : null
   },
   "cgen" : {
      "id" : null,
      "fullname" : null,
      "abbreviation" : "CGEN",
      "generic_url" : "http://www.cgen.com/",
      "object" : "Identifier",
      "uri_prefix" : null,
      "url_example" : null,
      "name" : null,
      "datatype" : null,
      "database" : "Compugen Gene Ontology Gene Association Data",
      "url_syntax" : null,
      "example_id" : "CGEN:PrID131022"
   },
   "hamap" : {
      "url_example" : "http://hamap.expasy.org/unirule/MF_00131",
      "name" : null,
      "uri_prefix" : null,
      "url_syntax" : "http://hamap.expasy.org/unirule/[example_id]",
      "example_id" : "HAMAP:MF_00031",
      "database" : "High-quality Automated and Manual Annotation of microbial Proteomes",
      "datatype" : null,
      "fullname" : null,
      "id" : null,
      "object" : "Identifier",
      "generic_url" : "http://hamap.expasy.org/",
      "abbreviation" : "HAMAP"
   },
   "agricola_id" : {
      "fullname" : null,
      "id" : null,
      "generic_url" : "http://agricola.nal.usda.gov/",
      "abbreviation" : "AGRICOLA_ID",
      "object" : "AGRICOLA call number",
      "url_example" : null,
      "name" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "example_id" : "AGRICOLA_NAL:TP248.2 P76 v.14",
      "url_syntax" : null,
      "database" : "AGRICultural OnLine Access"
   },
   "cbs" : {
      "datatype" : null,
      "example_id" : "CBS:TMHMM",
      "url_syntax" : null,
      "database" : "Center for Biological Sequence Analysis",
      "url_example" : "http://www.cbs.dtu.dk/services/[example_id]/",
      "name" : null,
      "uri_prefix" : null,
      "generic_url" : "http://www.cbs.dtu.dk/",
      "abbreviation" : "CBS",
      "object" : "prediction tool",
      "fullname" : null,
      "id" : null
   },
   "ena" : {
      "fullname" : null,
      "id" : null,
      "description" : "ENA is made up of a number of distinct databases that includes EMBL-Bank, the newly established Sequence Read Archive (SRA) and the Trace Archive. International nucleotide sequence database collaboration, comprising ENA-EBI nucleotide sequence data library (EMBL-Bank), DNA DataBank of Japan (DDBJ), and NCBI GenBank",
      "local_id_syntax" : "^([A-Z]{1}[0-9]{5})|([A-Z]{2}[0-9]{6})|([A-Z]{4}[0-9]{8,9})$",
      "generic_url" : "http://www.ebi.ac.uk/ena/",
      "abbreviation" : "ENA",
      "object" : "Sequence accession",
      "name" : null,
      "url_example" : "http://www.ebi.ac.uk/ena/data/view/AA816246",
      "uri_prefix" : null,
      "datatype" : null,
      "url_syntax" : "http://www.ebi.ac.uk/ena/data/view/[example_id]",
      "example_id" : "ENA:AA816246",
      "database" : "European Nucleotide Archive"
   },
   "uniprotkb-subcell" : {
      "id" : null,
      "fullname" : null,
      "object" : "Identifier",
      "abbreviation" : "UniProtKB-SubCell",
      "generic_url" : "http://www.uniprot.org/locations/",
      "uri_prefix" : null,
      "url_example" : "http://www.uniprot.org/locations/SL-0012",
      "name" : null,
      "url_syntax" : "http://www.uniprot.org/locations/[example_id]",
      "example_id" : "UniProtKB-SubCell:SL-0012",
      "database" : "UniProt Knowledgebase Subcellular Location vocabulary",
      "datatype" : null
   },
   "h-invdb" : {
      "abbreviation" : "H-invDB",
      "generic_url" : "http://www.h-invitational.jp/",
      "object" : null,
      "id" : null,
      "fullname" : null,
      "datatype" : null,
      "example_id" : null,
      "url_syntax" : null,
      "database" : "H-invitational Database",
      "uri_prefix" : null,
      "name" : null,
      "url_example" : null
   },
   "psi-mod" : {
      "datatype" : null,
      "url_syntax" : "http://www.ebi.ac.uk/ontology-lookup/?termId=MOD:[example_id]",
      "example_id" : "MOD:00219",
      "database" : "Proteomics Standards Initiative protein modification ontology",
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://www.ebi.ac.uk/ontology-lookup/?termId=MOD:00219",
      "abbreviation" : "PSI-MOD",
      "generic_url" : "http://psidev.sourceforge.net/mod/",
      "object" : "Protein modification identifier",
      "id" : null,
      "fullname" : null
   },
   "ncbi_gi" : {
      "example_id" : "NCBI_gi:113194944",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=[example_id]",
      "database" : "NCBI databases",
      "datatype" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=113194944",
      "name" : null,
      "uri_prefix" : null,
      "object" : "Identifier",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "abbreviation" : "NCBI_gi",
      "local_id_syntax" : "^[0-9]{6,}$",
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "id" : null
   },
   "enzyme" : {
      "object" : "Identifier",
      "abbreviation" : "ENZYME",
      "generic_url" : "http://www.expasy.ch/",
      "id" : null,
      "fullname" : null,
      "url_syntax" : "http://www.expasy.ch/cgi-bin/nicezyme.pl?[example_id]",
      "example_id" : "ENZYME:EC 1.1.1.1",
      "database" : "Swiss Institute of Bioinformatics enzyme database",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.expasy.ch/cgi-bin/nicezyme.pl?1.1.1.1",
      "name" : null
   },
   "tair" : {
      "generic_url" : "http://www.arabidopsis.org/",
      "abbreviation" : "TAIR",
      "object" : "Accession",
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "id" : null,
      "local_id_syntax" : "^locus:[0-9]{7}$",
      "datatype" : null,
      "url_syntax" : "http://arabidopsis.org/servlets/TairObject?accession=[example_id]",
      "database" : "The Arabidopsis Information Resource",
      "example_id" : "TAIR:locus:2146653",
      "name" : null,
      "url_example" : "http://arabidopsis.org/servlets/TairObject?accession=locus:2146653",
      "uri_prefix" : null
   },
   "cgd_ref" : {
      "uri_prefix" : null,
      "url_example" : "http://www.candidagenome.org/cgi-bin/reference/reference.pl?dbid=1490",
      "name" : null,
      "url_syntax" : "http://www.candidagenome.org/cgi-bin/reference/reference.pl?dbid=[example_id]",
      "database" : "Candida Genome Database",
      "example_id" : "CGD_REF:1490",
      "datatype" : null,
      "id" : null,
      "fullname" : null,
      "object" : "Literature Reference Identifier",
      "abbreviation" : "CGD_REF",
      "generic_url" : "http://www.candidagenome.org/"
   },
   "fb" : {
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://flybase.org/reports/FBgn0000024.html",
      "datatype" : null,
      "example_id" : "FB:FBgn0000024",
      "url_syntax" : "http://flybase.org/reports/[example_id].html",
      "database" : "FlyBase",
      "id" : null,
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "local_id_syntax" : "^FBgn[0-9]{7}$",
      "abbreviation" : "FB",
      "generic_url" : "http://flybase.org/",
      "object" : "Identifier"
   },
   "jcvi_genprop" : {
      "local_id_syntax" : "^GenProp[0-9]{4}$",
      "id" : null,
      "entity_type" : "GO:0008150 ! biological process",
      "fullname" : null,
      "object" : "Accession",
      "abbreviation" : "JCVI_GenProp",
      "generic_url" : "http://cmr.jcvi.org/",
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenomePropDefinition.cgi?prop_acc=GenProp0120",
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenomePropDefinition.cgi?prop_acc=[example_id]",
      "database" : "Genome Properties database at the J. Craig Venter Institute",
      "example_id" : "JCVI_GenProp:GenProp0120",
      "datatype" : null
   },
   "gene3d" : {
      "generic_url" : "http://gene3d.biochem.ucl.ac.uk/Gene3D/",
      "abbreviation" : "Gene3D",
      "object" : "Accession",
      "fullname" : null,
      "id" : null,
      "datatype" : null,
      "example_id" : "Gene3D:G3DSA:3.30.390.30",
      "url_syntax" : "http://gene3d.biochem.ucl.ac.uk/superfamily/?accession=[example_id]",
      "database" : "Domain Architecture Classification",
      "url_example" : "http://gene3d.biochem.ucl.ac.uk/superfamily/?accession=G3DSA%3A3.30.390.30",
      "name" : null,
      "uri_prefix" : null
   },
   "cog_function" : {
      "fullname" : null,
      "id" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/COG/",
      "abbreviation" : "COG_Function",
      "object" : "Identifier",
      "url_example" : "http://www.ncbi.nlm.nih.gov/COG/grace/shokog.cgi?fun=H",
      "name" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/COG/grace/shokog.cgi?fun=[example_id]",
      "example_id" : "COG_Function:H",
      "database" : "NCBI COG function"
   },
   "aspgd_ref" : {
      "object" : "Literature Reference Identifier",
      "abbreviation" : "AspGD_REF",
      "generic_url" : "http://www.aspergillusgenome.org/",
      "id" : null,
      "fullname" : null,
      "url_syntax" : "http://www.aspergillusgenome.org/cgi-bin/reference/reference.pl?dbid=[example_id]",
      "database" : "Aspergillus Genome Database",
      "example_id" : "AspGD_REF:90",
      "datatype" : null,
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://www.aspergillusgenome.org/cgi-bin/reference/reference.pl?dbid=90"
   },
   "mgi" : {
      "url_syntax" : "http://www.informatics.jax.org/accession/[example_id]",
      "example_id" : "MGI:MGI:80863",
      "database" : "Mouse Genome Informatics",
      "datatype" : null,
      "url_example" : "http://www.informatics.jax.org/accession/MGI:80863",
      "name" : null,
      "uri_prefix" : null,
      "object" : "Accession",
      "generic_url" : "http://www.informatics.jax.org/",
      "abbreviation" : "MGI",
      "local_id_syntax" : "^MGI:[0-9]{5,}$",
      "entity_type" : "VariO:0001 ! variation",
      "fullname" : null,
      "id" : null
   },
   "reactome" : {
      "object" : "Identifier",
      "generic_url" : "http://www.reactome.org/",
      "abbreviation" : "Reactome",
      "local_id_syntax" : "^REACT_[0-9]+$",
      "fullname" : null,
      "id" : null,
      "example_id" : "Reactome:REACT_604",
      "url_syntax" : "http://www.reactome.org/cgi-bin/eventbrowser_st_id?ST_ID=[example_id]",
      "database" : "Reactome - a curated knowledgebase of biological pathways",
      "datatype" : null,
      "name" : null,
      "url_example" : "http://www.reactome.org/cgi-bin/eventbrowser_st_id?ST_ID=REACT_604",
      "uri_prefix" : null
   },
   "wp" : {
      "object" : "Identifier",
      "abbreviation" : "WP",
      "generic_url" : "http://www.wormbase.org/",
      "id" : null,
      "is_obsolete" : "true",
      "fullname" : null,
      "url_syntax" : "http://www.wormbase.org/db/get?class=Protein;name=WP:[example_id]",
      "example_id" : "WP:CE25104",
      "database" : "Wormpep database of proteins of C. elegans",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.wormbase.org/db/get?class=Protein;name=WP:CE15104",
      "name" : null
   },
   "cgdid" : {
      "url_example" : "http://www.candidagenome.org/cgi-bin/locus.pl?dbid=CAL0005516",
      "name" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "example_id" : "CGD:CAL0005516",
      "url_syntax" : "http://www.candidagenome.org/cgi-bin/locus.pl?dbid=[example_id]",
      "database" : "Candida Genome Database",
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "id" : null,
      "local_id_syntax" : "^(CAL|CAF)[0-9]{7}$",
      "generic_url" : "http://www.candidagenome.org/",
      "abbreviation" : "CGDID",
      "object" : "Identifier for CGD Loci"
   },
   "nif_subcellular" : {
      "name" : null,
      "url_example" : "http://www.neurolex.org/wiki/sao1770195789",
      "uri_prefix" : null,
      "datatype" : null,
      "url_syntax" : "http://www.neurolex.org/wiki/[example_id]",
      "database" : "Neuroscience Information Framework standard ontology, subcellular hierarchy",
      "example_id" : "NIF_Subcellular:sao1186862860",
      "fullname" : null,
      "id" : null,
      "generic_url" : "http://www.neurolex.org/wiki",
      "abbreviation" : "NIF_Subcellular",
      "object" : "ontology term"
   },
   "sgdid" : {
      "id" : null,
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "local_id_syntax" : "^S[0-9]{9}$",
      "abbreviation" : "SGDID",
      "generic_url" : "http://www.yeastgenome.org/",
      "object" : "Identifier for SGD Loci",
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://db.yeastgenome.org/cgi-bin/locus.pl?dbid=S000006169",
      "datatype" : null,
      "example_id" : "SGD:S000006169",
      "database" : "Saccharomyces Genome Database",
      "url_syntax" : "http://db.yeastgenome.org/cgi-bin/locus.pl?dbid=[example_id]"
   },
   "paint_ref" : {
      "url_example" : "http://www.geneontology.org/gene-associations/submission/paint/PTHR10046/PTHR10046.txt",
      "name" : null,
      "uri_prefix" : null,
      "example_id" : "PAINT_REF:PTHR10046",
      "url_syntax" : "http://www.geneontology.org/gene-associations/submission/paint/[example_id]/[example_id].txt",
      "database" : "Phylogenetic Annotation INference Tool References",
      "datatype" : null,
      "fullname" : null,
      "id" : null,
      "object" : "Reference locator",
      "generic_url" : "http://www.pantherdb.org/",
      "abbreviation" : "PAINT_REF"
   },
   "sgd_locus" : {
      "object" : "Gene name (gene symbol in mammalian nomenclature)",
      "abbreviation" : "SGD_LOCUS",
      "generic_url" : "http://www.yeastgenome.org/",
      "id" : null,
      "fullname" : null,
      "example_id" : "SGD_LOCUS:GAL4",
      "url_syntax" : "http://db.yeastgenome.org/cgi-bin/locus.pl?locus=[example_id]",
      "database" : "Saccharomyces Genome Database",
      "datatype" : null,
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://db.yeastgenome.org/cgi-bin/locus.pl?locus=GAL4"
   },
   "wormbase" : {
      "datatype" : null,
      "database" : "WormBase database of nematode biology",
      "example_id" : "WB:WBGene00003001",
      "url_syntax" : "http://www.wormbase.org/db/gene/gene?name=[example_id]",
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://www.wormbase.org/db/get?class=Gene;name=WBGene00003001",
      "abbreviation" : "WormBase",
      "generic_url" : "http://www.wormbase.org/",
      "object" : "Gene identifier",
      "id" : null,
      "entity_type" : "PR:000000001 ! protein",
      "fullname" : null,
      "local_id_syntax" : "^WB(Gene|Var|RNAi|Transgene)[0-9]{8}$"
   },
   "sp_sl" : {
      "generic_url" : "http://www.uniprot.org/locations/",
      "abbreviation" : "SP_SL",
      "object" : "Identifier",
      "fullname" : null,
      "id" : null,
      "datatype" : null,
      "database" : "UniProt Knowledgebase Subcellular Location vocabulary",
      "example_id" : "UniProtKB-SubCell:SL-0012",
      "url_syntax" : "http://www.uniprot.org/locations/[example_id]",
      "name" : null,
      "url_example" : "http://www.uniprot.org/locations/SL-0012",
      "uri_prefix" : null
   },
   "sanger" : {
      "example_id" : null,
      "url_syntax" : null,
      "database" : "Wellcome Trust Sanger Institute",
      "datatype" : null,
      "url_example" : null,
      "name" : null,
      "uri_prefix" : null,
      "object" : null,
      "generic_url" : "http://www.sanger.ac.uk/",
      "abbreviation" : "Sanger",
      "fullname" : null,
      "id" : null
   },
   "jcvi_tba1" : {
      "name" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "url_syntax" : null,
      "example_id" : "JCVI_Tba1:25N14.10",
      "database" : "Trypanosoma brucei database at the J. Craig Venter Institute",
      "is_obsolete" : "true",
      "fullname" : null,
      "id" : null,
      "generic_url" : "http://www.tigr.org/tdb/e2k1/tba1/",
      "abbreviation" : "JCVI_Tba1",
      "object" : "Accession"
   },
   "eurofung" : {
      "url_syntax" : null,
      "example_id" : null,
      "database" : "Eurofungbase community annotation",
      "datatype" : null,
      "url_example" : null,
      "name" : null,
      "uri_prefix" : null,
      "object" : null,
      "generic_url" : "http://www.eurofung.net/option=com_content&task=section&id=3&Itemid=4",
      "abbreviation" : "Eurofung",
      "fullname" : null,
      "id" : null
   },
   "zfin" : {
      "database" : "Zebrafish Information Network",
      "url_syntax" : "http://zfin.org/cgi-bin/ZFIN_jump?record=[example_id]",
      "example_id" : "ZFIN:ZDB-GENE-990415-103",
      "datatype" : null,
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://zfin.org/cgi-bin/ZFIN_jump?record=ZDB-GENE-990415-103",
      "object" : "Identifier",
      "abbreviation" : "ZFIN",
      "generic_url" : "http://zfin.org/",
      "local_id_syntax" : "^ZDB-(GENE|GENO|MRPHLNO)-[0-9]{6}-[0-9]+$",
      "id" : null,
      "entity_type" : "VariO:0001 ! variation",
      "fullname" : null
   },
   "kegg_reaction" : {
      "object" : "Reaction",
      "abbreviation" : "KEGG_REACTION",
      "generic_url" : "http://www.genome.jp/kegg/reaction/",
      "local_id_syntax" : "^R\\d+$",
      "id" : null,
      "fullname" : null,
      "url_syntax" : "http://www.genome.jp/dbget-bin/www_bget?rn:[example_id]",
      "example_id" : "KEGG:R02328",
      "database" : "KEGG Reaction Database",
      "datatype" : null,
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://www.genome.jp/dbget-bin/www_bget?rn:R02328"
   },
   "protein_id" : {
      "url_syntax" : null,
      "database" : "DDBJ / ENA / GenBank",
      "example_id" : "protein_id:CAA71991",
      "datatype" : null,
      "uri_prefix" : null,
      "name" : null,
      "url_example" : null,
      "object" : "Identifier",
      "abbreviation" : "protein_id",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Genbank/",
      "local_id_syntax" : "^[A-Z]{3}[0-9]{5}(\\.[0-9]+)?$",
      "description" : "protein identifier shared by DDBJ/EMBL-bank/GenBank nucleotide sequence databases",
      "id" : null,
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein"
   },
   "transfac" : {
      "url_example" : null,
      "name" : null,
      "uri_prefix" : null,
      "url_syntax" : null,
      "example_id" : null,
      "database" : "TRANSFAC database of eukaryotic transcription factors",
      "datatype" : null,
      "fullname" : null,
      "id" : null,
      "object" : null,
      "generic_url" : "http://www.gene-regulation.com/pub/databases.html#transfac",
      "abbreviation" : "TRANSFAC"
   },
   "gb" : {
      "datatype" : null,
      "database" : "GenBank",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=nucleotide&val=[example_id]",
      "example_id" : "GB:AA816246",
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=nucleotide&val=AA816246",
      "name" : null,
      "uri_prefix" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Genbank/",
      "abbreviation" : "GB",
      "object" : "Sequence accession",
      "entity_type" : "PR:000000001 ! protein ",
      "fullname" : null,
      "id" : null,
      "description" : "The NIH genetic sequence database, an annotated collection of all publicly available DNA sequences.",
      "local_id_syntax" : "^[A-Z]{2}[0-9]{6}$"
   },
   "cgd" : {
      "datatype" : null,
      "database" : "Candida Genome Database",
      "url_syntax" : "http://www.candidagenome.org/cgi-bin/locus.pl?dbid=[example_id]",
      "example_id" : "CGD:CAL0005516",
      "uri_prefix" : null,
      "url_example" : "http://www.candidagenome.org/cgi-bin/locus.pl?dbid=CAL0005516",
      "name" : null,
      "abbreviation" : "CGD",
      "generic_url" : "http://www.candidagenome.org/",
      "object" : "Identifier for CGD Loci",
      "id" : null,
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "local_id_syntax" : "^(CAL|CAF)[0-9]{7}$"
   },
   "flybase" : {
      "abbreviation" : "FLYBASE",
      "generic_url" : "http://flybase.org/",
      "object" : "Identifier",
      "id" : null,
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "local_id_syntax" : "^FBgn[0-9]{7}$",
      "datatype" : null,
      "example_id" : "FB:FBgn0000024",
      "database" : "FlyBase",
      "url_syntax" : "http://flybase.org/reports/[example_id].html",
      "uri_prefix" : null,
      "url_example" : "http://flybase.org/reports/FBgn0000024.html",
      "name" : null
   },
   "rnamdb" : {
      "database" : "RNA Modification Database",
      "example_id" : "RNAmods:037",
      "url_syntax" : "http://s59.cas.albany.edu/RNAmods/cgi-bin/rnashow.cgi?[example_id]",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : "http://s59.cas.albany.edu/RNAmods/cgi-bin/rnashow.cgi?091",
      "name" : null,
      "object" : "Identifier",
      "abbreviation" : "RNAMDB",
      "generic_url" : "http://s59.cas.albany.edu/RNAmods/",
      "id" : null,
      "fullname" : null
   },
   "syscilia_ccnet" : {
      "datatype" : null,
      "example_id" : null,
      "url_syntax" : null,
      "database" : "Syscilia",
      "url_example" : null,
      "name" : null,
      "uri_prefix" : null,
      "generic_url" : "http://syscilia.org/",
      "abbreviation" : "SYSCILIA_CCNET",
      "object" : null,
      "fullname" : null,
      "id" : null,
      "description" : "A systems biology approach to dissect cilia function and its disruption in human genetic disease"
   },
   "iuphar_receptor" : {
      "fullname" : null,
      "id" : null,
      "object" : "Receptor identifier",
      "generic_url" : "http://www.iuphar.org/",
      "abbreviation" : "IUPHAR_RECEPTOR",
      "name" : null,
      "url_example" : "http://www.iuphar-db.org/DATABASE/ObjectDisplayForward?objectId=56",
      "uri_prefix" : null,
      "example_id" : "IUPHAR_RECEPTOR:2205",
      "url_syntax" : "http://www.iuphar-db.org/DATABASE/ObjectDisplayForward?objectId=[example_id]",
      "database" : "International Union of Pharmacology",
      "datatype" : null
   },
   "geo" : {
      "object" : null,
      "abbreviation" : "GEO",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/geo/",
      "id" : null,
      "fullname" : null,
      "example_id" : "GEO:GDS2223",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/sites/GDSbrowser?acc=[example_id]",
      "database" : "NCBI Gene Expression Omnibus",
      "datatype" : null,
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/sites/GDSbrowser?acc=GDS2223"
   },
   "genedb_tbrucei" : {
      "shorthand_name" : "Tbrucei",
      "local_id_syntax" : "^Tb\\d+\\.\\d+\\.\\d+$",
      "abbreviation" : "GeneDB_Tbrucei",
      "datatype" : null,
      "database" : "Trypanosoma brucei GeneDB",
      "replaced_by" : "GeneDB",
      "id" : null,
      "is_obsolete" : "true",
      "fullname" : null,
      "generic_url" : "http://www.genedb.org/genedb/tryp/",
      "object" : "Gene identifier",
      "uri_prefix" : null,
      "url_example" : "http://www.genedb.org/genedb/Search?organism=tryp&name=Tb927.1.5250",
      "name" : null,
      "example_id" : "GeneDB_Tbrucei:Tb927.1.5250",
      "url_syntax" : "http://www.genedb.org/genedb/Search?organism=tryp&name=[example_id]"
   },
   "ecocyc_ref" : {
      "fullname" : null,
      "id" : null,
      "generic_url" : "http://ecocyc.org/",
      "abbreviation" : "ECOCYC_REF",
      "object" : "Reference identifier",
      "name" : null,
      "url_example" : "http://biocyc.org/ECOLI/reference.html?type=CITATION-FRAME&object=COLISALII",
      "uri_prefix" : null,
      "datatype" : null,
      "url_syntax" : "http://biocyc.org/ECOLI/reference.html?type=CITATION-FRAME&object=[example_id]",
      "database" : "Encyclopedia of E. coli metabolism",
      "example_id" : "EcoCyc_REF:COLISALII"
   },
   "fbbt" : {
      "generic_url" : "http://flybase.org/",
      "abbreviation" : "FBbt",
      "object" : "Identifier",
      "fullname" : null,
      "id" : null,
      "datatype" : null,
      "database" : "Drosophila gross anatomy",
      "url_syntax" : "http://flybase.org/cgi-bin/fbcvq.html?query=FBbt:[example_id]",
      "example_id" : "FBbt:00005177",
      "url_example" : "http://flybase.org/cgi-bin/fbcvq.html?query=FBbt:00005177",
      "name" : null,
      "uri_prefix" : null
   },
   "psort" : {
      "fullname" : null,
      "id" : null,
      "object" : null,
      "generic_url" : "http://www.psort.org/",
      "abbreviation" : "PSORT",
      "name" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "example_id" : null,
      "url_syntax" : null,
      "database" : "PSORT protein subcellular localization databases and prediction tools for bacteria",
      "datatype" : null
   },
   "eck" : {
      "object" : "ECK accession (E. coli K-12 gene identifier)",
      "generic_url" : "http://www.ecogene.org/",
      "abbreviation" : "ECK",
      "local_id_syntax" : "^ECK[0-9]{4}$",
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "id" : null,
      "database" : "EcoGene Database of Escherichia coli Sequence and Function",
      "url_syntax" : "http://www.ecogene.org/geneInfo.php?eck_id=[example_id]",
      "example_id" : "ECK:ECK3746",
      "datatype" : null,
      "url_example" : "http://www.ecogene.org/geneInfo.php?eck_id=ECK3746",
      "name" : null,
      "uri_prefix" : null
   },
   "metacyc" : {
      "fullname" : null,
      "id" : null,
      "object" : "Identifier (pathway or reaction)",
      "generic_url" : "http://metacyc.org/",
      "abbreviation" : "MetaCyc",
      "name" : null,
      "url_example" : "http://biocyc.org/META/NEW-IMAGE?type=NIL&object=GLUTDEG-PWY",
      "uri_prefix" : null,
      "example_id" : "MetaCyc:GLUTDEG-PWY",
      "url_syntax" : "http://biocyc.org/META/NEW-IMAGE?type=NIL&object=[example_id]",
      "database" : "Metabolic Encyclopedia of metabolic and other pathways",
      "datatype" : null
   },
   "imgt_ligm" : {
      "name" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "url_syntax" : null,
      "example_id" : "IMGT_LIGM:U03895",
      "database" : "ImMunoGeneTics database covering immunoglobulins and T-cell receptors",
      "fullname" : null,
      "id" : null,
      "description" : "Database of immunoglobulins and T cell receptors from human and other vertebrates, with translation for fully annotated sequences.",
      "generic_url" : "http://imgt.cines.fr",
      "abbreviation" : "IMGT_LIGM",
      "object" : null
   },
   "wbls" : {
      "url_example" : null,
      "name" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "example_id" : "WBls:0000010",
      "url_syntax" : null,
      "database" : "C. elegans development",
      "entity_type" : "WBls:0000075 ! nematoda Life Stage",
      "fullname" : null,
      "id" : null,
      "local_id_syntax" : "[0-9]{7}",
      "generic_url" : "http://www.wormbase.org/",
      "abbreviation" : "WBls",
      "object" : "Identifier"
   },
   "mtbbase" : {
      "name" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "url_syntax" : null,
      "example_id" : null,
      "database" : "Collection and Refinement of Physiological Data on Mycobacterium tuberculosis",
      "datatype" : null,
      "fullname" : null,
      "id" : null,
      "object" : null,
      "generic_url" : "http://www.ark.in-berlin.de/Site/MTBbase.html",
      "abbreviation" : "MTBBASE"
   },
   "refseq_prot" : {
      "fullname" : null,
      "is_obsolete" : "true",
      "replaced_by" : "RefSeq",
      "id" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/RefSeq/",
      "abbreviation" : "RefSeq_Prot",
      "object" : "Identifier",
      "name" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=YP_498627",
      "uri_prefix" : null,
      "datatype" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=[example_id]",
      "example_id" : "RefSeq_Prot:YP_498627",
      "database" : "RefSeq (Protein)"
   },
   "bhf-ucl" : {
      "abbreviation" : "BHF-UCL",
      "generic_url" : "http://www.ucl.ac.uk/cardiovasculargeneontology/",
      "object" : null,
      "id" : null,
      "fullname" : null,
      "description" : "The Cardiovascular Gene Ontology Annotation Initiative is supported by the British Heart Foundation (BHF) and located at University College London (UCL).",
      "datatype" : null,
      "url_syntax" : null,
      "example_id" : null,
      "database" : "Cardiovascular Gene Ontology Annotation Initiative",
      "uri_prefix" : null,
      "name" : null,
      "url_example" : null
   },
   "mod" : {
      "datatype" : null,
      "example_id" : "MOD:00219",
      "database" : "Proteomics Standards Initiative protein modification ontology",
      "url_syntax" : "http://www.ebi.ac.uk/ontology-lookup/?termId=MOD:[example_id]",
      "url_example" : "http://www.ebi.ac.uk/ontology-lookup/?termId=MOD:00219",
      "name" : null,
      "uri_prefix" : null,
      "generic_url" : "http://psidev.sourceforge.net/mod/",
      "abbreviation" : "MOD",
      "object" : "Protein modification identifier",
      "fullname" : null,
      "id" : null
   },
   "omim" : {
      "fullname" : null,
      "id" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?db=OMIM",
      "abbreviation" : "OMIM",
      "object" : "Identifier",
      "url_example" : "http://omim.org/entry/190198",
      "name" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "example_id" : "OMIM:190198",
      "url_syntax" : "http://omim.org/entry/[example_id]",
      "database" : "Mendelian Inheritance in Man"
   },
   "ptarget" : {
      "example_id" : null,
      "url_syntax" : null,
      "database" : "pTARGET Prediction server for protein subcellular localization",
      "datatype" : null,
      "name" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "object" : null,
      "generic_url" : "http://bioinformatics.albany.edu/~ptarget/",
      "abbreviation" : "pTARGET",
      "fullname" : null,
      "id" : null
   },
   "tigr" : {
      "datatype" : null,
      "database" : "J. Craig Venter Institute",
      "url_syntax" : null,
      "example_id" : null,
      "uri_prefix" : null,
      "url_example" : null,
      "name" : null,
      "abbreviation" : "TIGR",
      "generic_url" : "http://www.jcvi.org/",
      "object" : null,
      "id" : null,
      "fullname" : null
   },
   "ensembl_proteinid" : {
      "object" : "Protein identifier",
      "abbreviation" : "ENSEMBL_ProteinID",
      "generic_url" : "http://www.ensembl.org/",
      "local_id_syntax" : "^ENSP[0-9]{9,16}$",
      "id" : null,
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein",
      "url_syntax" : "http://www.ensembl.org/id/[example_id]",
      "example_id" : "ENSEMBL_ProteinID:ENSP00000361027",
      "database" : "Ensembl database of automatically annotated genomic data",
      "datatype" : null,
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://www.ensembl.org/id/ENSP00000361027"
   },
   "echobase" : {
      "datatype" : null,
      "example_id" : "EchoBASE:EB0231",
      "url_syntax" : "http://www.biolws1.york.ac.uk/echobase/Gene.cfm?recordID=[example_id]",
      "database" : "EchoBASE post-genomic database for Escherichia coli",
      "uri_prefix" : null,
      "url_example" : "http://www.biolws1.york.ac.uk/echobase/Gene.cfm?recordID=EB0231",
      "name" : null,
      "abbreviation" : "EchoBASE",
      "generic_url" : "http://www.ecoli-york.org/",
      "object" : "Identifier",
      "id" : null,
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "local_id_syntax" : "^EB[0-9]{4}$"
   },
   "phi" : {
      "generic_url" : "http://aclame.ulb.ac.be/Classification/mego.html",
      "abbreviation" : "PHI",
      "object" : null,
      "fullname" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : null,
      "example_id" : "PHI:0000055",
      "database" : "MeGO (Phage and Mobile Element Ontology)",
      "url_example" : null,
      "name" : null,
      "uri_prefix" : null
   },
   "so" : {
      "url_example" : "http://song.sourceforge.net/SOterm_tables.html#SO:0000195",
      "name" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "example_id" : "SO:0000195",
      "url_syntax" : "http://song.sourceforge.net/SOterm_tables.html#SO:[example_id]",
      "database" : "Sequence Ontology",
      "fullname" : null,
      "entity_type" : "SO:0000110 ! sequence feature",
      "id" : null,
      "local_id_syntax" : "^\\d{7}$",
      "generic_url" : "http://sequenceontology.org/",
      "abbreviation" : "SO",
      "object" : "Identifier"
   },
   "roslin_institute" : {
      "url_syntax" : null,
      "database" : "Roslin Institute",
      "example_id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "name" : null,
      "url_example" : null,
      "object" : null,
      "abbreviation" : "Roslin_Institute",
      "generic_url" : "http://www.roslin.ac.uk/",
      "id" : null,
      "fullname" : null
   },
   "panther" : {
      "generic_url" : "http://www.pantherdb.org/",
      "abbreviation" : "PANTHER",
      "object" : "Protein family tree identifier",
      "fullname" : null,
      "id" : null,
      "datatype" : null,
      "database" : "Protein ANalysis THrough Evolutionary Relationships Classification System",
      "url_syntax" : "http://www.pantherdb.org/panther/lookupId.jsp?id=[example_id]",
      "example_id" : "PANTHER:PTHR11455",
      "url_example" : "http://www.pantherdb.org/panther/lookupId.jsp?id=PTHR10000",
      "name" : null,
      "uri_prefix" : null
   },
   "trembl" : {
      "url_example" : "http://www.uniprot.org/uniprot/O31124",
      "name" : null,
      "uri_prefix" : null,
      "example_id" : "TrEMBL:O31124",
      "url_syntax" : "http://www.uniprot.org/uniprot/[example_id]",
      "database" : "UniProtKB-TrEMBL protein sequence database",
      "datatype" : null,
      "description" : "UniProtKB-TrEMBL, a computer-annotated protein sequence database supplementing UniProtKB and containing the translations of all coding sequences (CDS) present in the EMBL Nucleotide Sequence Database but not yet integrated in UniProtKB/Swiss-Prot",
      "fullname" : null,
      "is_obsolete" : "true",
      "id" : null,
      "replaced_by" : "UniProtKB",
      "object" : "Accession",
      "generic_url" : "http://www.uniprot.org",
      "abbreviation" : "TrEMBL"
   },
   "cl" : {
      "url_syntax" : "http://purl.obolibrary.org/obo/CL_[example_id]",
      "example_id" : "CL:0000041",
      "database" : "Cell Type Ontology",
      "datatype" : null,
      "url_example" : "http://purl.obolibrary.org/obo/CL_0000041",
      "name" : null,
      "uri_prefix" : null,
      "object" : "Identifier",
      "generic_url" : "http://cellontology.org",
      "abbreviation" : "CL",
      "local_id_syntax" : "^[0-9]{7}$",
      "entity_type" : "CL:0000000 ! cell ",
      "fullname" : null,
      "id" : null
   },
   "gonuts" : {
      "name" : null,
      "url_example" : "http://gowiki.tamu.edu/wiki/index.php/MOUSE:CD28",
      "uri_prefix" : null,
      "example_id" : "GONUTS:MOUSE:CD28",
      "url_syntax" : "http://gowiki.tamu.edu/wiki/index.php/[example_id]",
      "database" : "Gene Ontology Normal Usage Tracking System (GONUTS)",
      "datatype" : null,
      "description" : "Third party documentation for GO and community annotation system.",
      "fullname" : null,
      "id" : null,
      "object" : "Identifier (for gene or gene product)",
      "generic_url" : "http://gowiki.tamu.edu",
      "abbreviation" : "GONUTS"
   },
   "genedb_lmajor" : {
      "abbreviation" : "GeneDB_Lmajor",
      "local_id_syntax" : "^LmjF\\.\\d+\\.\\d+$",
      "shorthand_name" : "Lmajor",
      "database" : "Leishmania major GeneDB",
      "datatype" : null,
      "object" : "Gene identifier",
      "generic_url" : "http://www.genedb.org/genedb/leish/",
      "fullname" : null,
      "is_obsolete" : "true",
      "id" : null,
      "replaced_by" : "GeneDB",
      "example_id" : "GeneDB_Lmajor:LM5.32",
      "url_syntax" : "http://www.genedb.org/genedb/Search?organism=leish&name=[example_id]",
      "url_example" : "http://www.genedb.org/genedb/Search?organism=leish&name=LM5.32",
      "name" : null,
      "uri_prefix" : null
   },
   "ncbi_gene" : {
      "example_id" : "NCBI_Gene:4771",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=[example_id]",
      "database" : "NCBI Gene",
      "datatype" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=4771",
      "name" : null,
      "uri_prefix" : null,
      "object" : "Identifier",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "abbreviation" : "NCBI_Gene",
      "local_id_syntax" : "^\\d+$",
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "id" : null
   },
   "kegg_enzyme" : {
      "object" : "Enzyme Commission ID, as stored in KEGG",
      "abbreviation" : "KEGG_ENZYME",
      "generic_url" : "http://www.genome.jp/dbget-bin/www_bfind?enzyme",
      "local_id_syntax" : "^\\d(\\.\\d{1,2}){2}\\.\\d{1,3}$",
      "id" : null,
      "fullname" : null,
      "url_syntax" : "http://www.genome.jp/dbget-bin/www_bget?ec:[example_id]",
      "database" : "KEGG Enzyme Database",
      "example_id" : "KEGG_ENZYME:2.1.1.4",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.genome.jp/dbget-bin/www_bget?ec:2.1.1.4",
      "name" : null
   },
   "uniprotkb/trembl" : {
      "uri_prefix" : null,
      "url_example" : "http://www.uniprot.org/uniprot/O31124",
      "name" : null,
      "datatype" : null,
      "example_id" : "TrEMBL:O31124",
      "database" : "UniProtKB-TrEMBL protein sequence database",
      "url_syntax" : "http://www.uniprot.org/uniprot/[example_id]",
      "replaced_by" : "UniProtKB",
      "id" : null,
      "is_obsolete" : "true",
      "fullname" : null,
      "description" : "UniProtKB-TrEMBL, a computer-annotated protein sequence database supplementing UniProtKB and containing the translations of all coding sequences (CDS) present in the EMBL Nucleotide Sequence Database but not yet integrated in UniProtKB/Swiss-Prot",
      "abbreviation" : "UniProtKB/TrEMBL",
      "generic_url" : "http://www.uniprot.org",
      "object" : "Accession"
   },
   "kegg_pathway" : {
      "id" : null,
      "fullname" : null,
      "abbreviation" : "KEGG_PATHWAY",
      "generic_url" : "http://www.genome.jp/kegg/pathway.html",
      "object" : "Pathway",
      "uri_prefix" : null,
      "url_example" : "http://www.genome.jp/dbget-bin/www_bget?path:ot00020",
      "name" : null,
      "datatype" : null,
      "url_syntax" : "http://www.genome.jp/dbget-bin/www_bget?path:[example_id]",
      "example_id" : "KEGG_PATHWAY:ot00020",
      "database" : "KEGG Pathways Database"
   },
   "tigr_tba1" : {
      "id" : null,
      "is_obsolete" : "true",
      "fullname" : null,
      "object" : "Accession",
      "abbreviation" : "TIGR_Tba1",
      "generic_url" : "http://www.tigr.org/tdb/e2k1/tba1/",
      "uri_prefix" : null,
      "url_example" : null,
      "name" : null,
      "database" : "Trypanosoma brucei database at the J. Craig Venter Institute",
      "example_id" : "JCVI_Tba1:25N14.10",
      "url_syntax" : null,
      "datatype" : null
   },
   "hpa" : {
      "url_example" : "http://www.proteinatlas.org/tissue_profile.php?antibody_id=HPA000237",
      "name" : null,
      "uri_prefix" : null,
      "url_syntax" : "http://www.proteinatlas.org/tissue_profile.php?antibody_id=[example_id]",
      "database" : "Human Protein Atlas tissue profile information",
      "example_id" : "HPA:HPA000237",
      "datatype" : null,
      "fullname" : null,
      "id" : null,
      "object" : "Identifier",
      "generic_url" : "http://www.proteinatlas.org/",
      "abbreviation" : "HPA"
   },
   "cog_cluster" : {
      "generic_url" : "http://www.ncbi.nlm.nih.gov/COG/",
      "abbreviation" : "COG_Cluster",
      "object" : "Identifier",
      "fullname" : null,
      "id" : null,
      "datatype" : null,
      "example_id" : "COG_Cluster:COG0001",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/COG/new/release/cow.cgi?cog=[example_id]",
      "database" : "NCBI COG cluster",
      "url_example" : "http://www.ncbi.nlm.nih.gov/COG/new/release/cow.cgi?cog=COG0001",
      "name" : null,
      "uri_prefix" : null
   },
   "reac" : {
      "url_syntax" : "http://www.reactome.org/cgi-bin/eventbrowser_st_id?ST_ID=[example_id]",
      "database" : "Reactome - a curated knowledgebase of biological pathways",
      "example_id" : "Reactome:REACT_604",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.reactome.org/cgi-bin/eventbrowser_st_id?ST_ID=REACT_604",
      "name" : null,
      "object" : "Identifier",
      "abbreviation" : "REAC",
      "generic_url" : "http://www.reactome.org/",
      "local_id_syntax" : "^REACT_[0-9]+$",
      "id" : null,
      "fullname" : null
   },
   "pubchem_substance" : {
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?CMD=search&DB=pcsubstance&term=[example_id]",
      "example_id" : "PubChem_Substance:4594",
      "database" : "NCBI PubChem database of chemical substances",
      "datatype" : null,
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?CMD=search&DB=pcsubstance&term=4594",
      "object" : "Identifier",
      "abbreviation" : "PubChem_Substance",
      "generic_url" : "http://pubchem.ncbi.nlm.nih.gov/",
      "local_id_syntax" : "^[0-9]{4,}$",
      "id" : null,
      "entity_type" : "CHEBI:24431 ! chemical entity",
      "fullname" : null
   },
   "locusid" : {
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "abbreviation" : "LocusID",
      "object" : "Identifier",
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "id" : null,
      "local_id_syntax" : "^\\d+$",
      "datatype" : null,
      "example_id" : "NCBI_Gene:4771",
      "database" : "NCBI Gene",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=[example_id]",
      "name" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=4771",
      "uri_prefix" : null
   },
   "obi" : {
      "id" : null,
      "fullname" : null,
      "local_id_syntax" : "^\\d{7}$",
      "abbreviation" : "OBI",
      "generic_url" : "http://obi-ontology.org/page/Main_Page",
      "object" : "Identifier",
      "uri_prefix" : null,
      "name" : null,
      "url_example" : null,
      "datatype" : null,
      "database" : "Ontology for Biomedical Investigations",
      "url_syntax" : null,
      "example_id" : "OBI:0000038"
   },
   "hgnc_gene" : {
      "name" : null,
      "url_example" : "http://www.genenames.org/data/hgnc_data.php?app_sym=ABCA1",
      "uri_prefix" : null,
      "database" : "HUGO Gene Nomenclature Committee",
      "url_syntax" : "http://www.genenames.org/data/hgnc_data.php?app_sym=[example_id]",
      "example_id" : "HGNC_gene:ABCA1",
      "datatype" : null,
      "fullname" : null,
      "id" : null,
      "object" : "Gene symbol",
      "generic_url" : "http://www.genenames.org/",
      "abbreviation" : "HGNC_gene"
   },
   "refseq" : {
      "datatype" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=[example_id]",
      "example_id" : "RefSeq:XP_001068954",
      "database" : "RefSeq",
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=XP_001068954",
      "name" : null,
      "uri_prefix" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/RefSeq/",
      "abbreviation" : "RefSeq",
      "object" : "Identifier",
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein",
      "id" : null,
      "local_id_syntax" : "^(NC|AC|NG|NT|NW|NZ|NM|NR|XM|XR|NP|AP|XP|ZP)_\\d+$"
   },
   "po_ref" : {
      "datatype" : null,
      "url_syntax" : "http://wiki.plantontology.org:8080/index.php/PO_REF:[example_id]",
      "example_id" : "PO_REF:00001",
      "database" : "Plant Ontology custom references",
      "url_example" : "http://wiki.plantontology.org:8080/index.php/PO_REF:00001",
      "name" : null,
      "uri_prefix" : null,
      "generic_url" : "http://wiki.plantontology.org:8080/index.php/PO_references",
      "abbreviation" : "PO_REF",
      "object" : "Reference identifier",
      "fullname" : null,
      "id" : null
   },
   "ecogene_g" : {
      "uri_prefix" : null,
      "url_example" : null,
      "name" : null,
      "datatype" : null,
      "example_id" : "ECOGENE_G:deoC",
      "url_syntax" : null,
      "database" : "EcoGene Database of Escherichia coli Sequence and Function",
      "id" : null,
      "fullname" : null,
      "abbreviation" : "ECOGENE_G",
      "generic_url" : "http://www.ecogene.org/",
      "object" : "EcoGene Primary Gene Name"
   },
   "corum" : {
      "fullname" : null,
      "id" : null,
      "generic_url" : "http://mips.gsf.de/genre/proj/corum/",
      "abbreviation" : "CORUM",
      "object" : "Identifier",
      "name" : null,
      "url_example" : "http://mips.gsf.de/genre/proj/corum/complexdetails.html?id=837",
      "uri_prefix" : null,
      "datatype" : null,
      "url_syntax" : "http://mips.gsf.de/genre/proj/corum/complexdetails.html?id=[example_id]",
      "example_id" : "CORUM:837",
      "database" : "CORUM - the Comprehensive Resource of Mammalian protein complexes"
   },
   "unimod" : {
      "id" : null,
      "fullname" : null,
      "description" : "protein modifications for mass spectrometry",
      "abbreviation" : "UniMod",
      "generic_url" : "http://www.unimod.org/",
      "object" : "Identifier",
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://www.unimod.org/modifications_view.php?editid1=1287",
      "datatype" : null,
      "url_syntax" : "http://www.unimod.org/modifications_view.php?editid1=[example_id]",
      "example_id" : "UniMod:1287",
      "database" : "UniMod"
   },
   "jcvi_egad" : {
      "generic_url" : "http://cmr.jcvi.org/",
      "abbreviation" : "JCVI_EGAD",
      "object" : "Accession",
      "fullname" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/EgadSearch.cgi?search_string=[example_id]",
      "example_id" : "JCVI_EGAD:74462",
      "database" : "EGAD database at the J. Craig Venter Institute",
      "name" : null,
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/EgadSearch.cgi?search_string=74462",
      "uri_prefix" : null
   },
   "mitre" : {
      "uri_prefix" : null,
      "name" : null,
      "url_example" : null,
      "url_syntax" : null,
      "database" : "The MITRE Corporation",
      "example_id" : null,
      "datatype" : null,
      "id" : null,
      "fullname" : null,
      "object" : null,
      "abbreviation" : "MITRE",
      "generic_url" : "http://www.mitre.org/"
   },
   "tigr_tigrfams" : {
      "name" : null,
      "url_example" : "http://search.jcvi.org/search?p&q=TIGR00254",
      "uri_prefix" : null,
      "url_syntax" : "http://search.jcvi.org/search?p&q=[example_id]",
      "database" : "TIGRFAMs HMM collection at the J. Craig Venter Institute",
      "example_id" : "JCVI_TIGRFAMS:TIGR00254",
      "datatype" : null,
      "fullname" : null,
      "entity_type" : "SO:0000839 ! polypeptide region",
      "id" : null,
      "object" : "Accession",
      "generic_url" : "http://search.jcvi.org/",
      "abbreviation" : "TIGR_TIGRFAMS"
   },
   "pubchem_compound" : {
      "id" : null,
      "entity_type" : "CHEBI:24431 ! chemical entity",
      "fullname" : null,
      "local_id_syntax" : "^[0-9]+$",
      "abbreviation" : "PubChem_Compound",
      "generic_url" : "http://pubchem.ncbi.nlm.nih.gov/",
      "object" : "Identifier",
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?CMD=search&DB=pccompound&term=2244",
      "datatype" : null,
      "example_id" : "PubChem_Compound:2244",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?CMD=search&DB=pccompound&term=[example_id]",
      "database" : "NCBI PubChem database of chemical structures"
   },
   "dflat" : {
      "fullname" : null,
      "id" : null,
      "generic_url" : "http://bcb.cs.tufts.edu/dflat/",
      "abbreviation" : "DFLAT",
      "object" : null,
      "name" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "example_id" : null,
      "url_syntax" : null,
      "database" : "Developmental FunctionaL Annotation at Tufts"
   },
   "ncbi_nm" : {
      "url_example" : null,
      "name" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "example_id" : "NCBI_NM:123456",
      "url_syntax" : null,
      "database" : "NCBI RefSeq",
      "is_obsolete" : "true",
      "fullname" : null,
      "id" : null,
      "replaced_by" : "RefSeq",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "abbreviation" : "NCBI_NM",
      "object" : "mRNA identifier"
   },
   "sgn" : {
      "generic_url" : "http://www.sgn.cornell.edu/",
      "abbreviation" : "SGN",
      "object" : "Gene identifier",
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://www.sgn.cornell.edu/phenome/locus_display.pl?locus_id=[example_id]",
      "example_id" : "SGN:4476",
      "database" : "Sol Genomics Network",
      "url_example" : "http://www.sgn.cornell.edu/phenome/locus_display.pl?locus_id=4476",
      "name" : null,
      "uri_prefix" : null
   },
   "swiss-prot" : {
      "uri_prefix" : null,
      "url_example" : "http://www.uniprot.org/uniprot/P51587",
      "name" : null,
      "datatype" : null,
      "example_id" : "Swiss-Prot:P51587",
      "url_syntax" : "http://www.uniprot.org/uniprot/[example_id]",
      "database" : "UniProtKB/Swiss-Prot",
      "id" : null,
      "replaced_by" : "UniProtKB",
      "fullname" : null,
      "is_obsolete" : "true",
      "description" : "A curated protein sequence database which provides a high level of annotation and a minimal level of redundancy",
      "abbreviation" : "Swiss-Prot",
      "generic_url" : "http://www.uniprot.org",
      "object" : "Accession"
   },
   "resid" : {
      "abbreviation" : "RESID",
      "generic_url" : "ftp://ftp.ncifcrf.gov/pub/users/residues/",
      "object" : "Identifier",
      "id" : null,
      "fullname" : null,
      "datatype" : null,
      "example_id" : "RESID:AA0062",
      "url_syntax" : null,
      "database" : "RESID Database of Protein Modifications",
      "uri_prefix" : null,
      "url_example" : null,
      "name" : null
   },
   "jstor" : {
      "abbreviation" : "JSTOR",
      "generic_url" : "http://www.jstor.org/",
      "object" : "journal article",
      "id" : null,
      "fullname" : null,
      "datatype" : null,
      "url_syntax" : "http://www.jstor.org/stable/[example_id]",
      "example_id" : "JSTOR:3093870",
      "database" : "Digital archive of scholarly articles",
      "uri_prefix" : null,
      "url_example" : "http://www.jstor.org/stable/3093870",
      "name" : null
   },
   "pamgo_gat" : {
      "abbreviation" : "PAMGO_GAT",
      "generic_url" : "http://agro.vbi.vt.edu/public/",
      "object" : "Gene",
      "id" : null,
      "fullname" : null,
      "datatype" : null,
      "example_id" : "PAMGO_GAT:Atu0001",
      "url_syntax" : "http://agro.vbi.vt.edu/public/servlet/GeneEdit?&Search=Search&level=2&genename=[example_id]",
      "database" : "Genome Annotation Tool (Agrobacterium tumefaciens C58); PAMGO Interest Group",
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://agro.vbi.vt.edu/public/servlet/GeneEdit?&Search=Search&level=2&genename=atu0001"
   },
   "cgsc" : {
      "database: CGSC" : "E.coli Genetic Stock Center",
      "example_id" : "CGSC:rbsK",
      "url_syntax" : null,
      "database" : null,
      "datatype" : null,
      "url_example" : "http://cgsc.biology.yale.edu/Site.php?ID=315",
      "name" : null,
      "uri_prefix" : null,
      "object" : "Gene symbol",
      "generic_url" : "http://cgsc.biology.yale.edu/",
      "abbreviation" : "CGSC",
      "fullname" : null,
      "id" : null
   },
   "genprotec" : {
      "fullname" : null,
      "id" : null,
      "object" : null,
      "generic_url" : "http://genprotec.mbl.edu/",
      "abbreviation" : "GenProtEC",
      "name" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "example_id" : null,
      "url_syntax" : null,
      "database" : "GenProtEC E. coli genome and proteome database",
      "datatype" : null
   },
   "cog_pathway" : {
      "fullname" : null,
      "id" : null,
      "object" : "Identifier",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/COG/",
      "abbreviation" : "COG_Pathway",
      "name" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/COG/new/release/coglist.cgi?pathw=14",
      "uri_prefix" : null,
      "example_id" : "COG_Pathway:14",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/COG/new/release/coglist.cgi?pathw=[example_id]",
      "database" : "NCBI COG pathway",
      "datatype" : null
   },
   "uniprot" : {
      "example_id" : "UniProtKB:P51587",
      "database" : "Universal Protein Knowledgebase",
      "url_syntax" : "http://www.uniprot.org/uniprot/[example_id]",
      "datatype" : null,
      "name" : null,
      "url_example" : "http://www.uniprot.org/uniprot/P51587",
      "uri_prefix" : null,
      "object" : "Accession",
      "generic_url" : "http://www.uniprot.org",
      "abbreviation" : "UniProt",
      "description" : "A central repository of protein sequence and function created by joining the information contained in Swiss-Prot, TrEMBL, and PIR database",
      "local_id_syntax" : "^([OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z]([0-9][A-Z][A-Z0-9]{2}){1,2}[0-9])((-[0-9]+)|:PRO_[0-9]{10}|:VAR_[0-9]{6}){0,1}$",
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein ",
      "id" : null
   },
   "ensemblplants/gramene" : {
      "datatype" : null,
      "example_id" : "EnsemblPlants:LOC_Os01g22954",
      "url_syntax" : "http://www.ensemblgenomes.org/id/[example_ID]",
      "database" : "Ensembl Plants, the Ensembl Genomes database for accessing plant genome data",
      "url_example" : "http://www.ensemblgenomes.org/id/LOC_Os01g22954",
      "name" : null,
      "uri_prefix" : null,
      "generic_url" : "http://plants.ensembl.org/",
      "abbreviation" : "EnsemblPlants/Gramene",
      "object" : "Identifier",
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "id" : null
   },
   "geneid" : {
      "datatype" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=[example_id]",
      "database" : "NCBI Gene",
      "example_id" : "NCBI_Gene:4771",
      "name" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=4771",
      "uri_prefix" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "abbreviation" : "GeneID",
      "object" : "Identifier",
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "id" : null,
      "local_id_syntax" : "^\\d+$"
   },
   "cas_gen" : {
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Genus&id=1040",
      "datatype" : null,
      "example_id" : "CASGEN:1040",
      "database" : "Catalog of Fishes genus database",
      "url_syntax" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Genus&id=[example_id]",
      "id" : null,
      "fullname" : null,
      "abbreviation" : "CAS_GEN",
      "generic_url" : "http://research.calacademy.org/research/ichthyology/catalog/fishcatsearch.html",
      "object" : "Identifier"
   },
   "wormpep" : {
      "id" : null,
      "fullname" : null,
      "is_obsolete" : "true",
      "object" : "Identifier",
      "abbreviation" : "Wormpep",
      "generic_url" : "http://www.wormbase.org/",
      "uri_prefix" : null,
      "url_example" : "http://www.wormbase.org/db/get?class=Protein;name=WP:CE15104",
      "name" : null,
      "database" : "Wormpep database of proteins of C. elegans",
      "example_id" : "WP:CE25104",
      "url_syntax" : "http://www.wormbase.org/db/get?class=Protein;name=WP:[example_id]",
      "datatype" : null
   },
   "h-invdb_locus" : {
      "id" : null,
      "fullname" : null,
      "object" : "Cluster identifier",
      "abbreviation" : "H-invDB_locus",
      "generic_url" : "http://www.h-invitational.jp/",
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://www.h-invitational.jp/hinv/spsoup/locus_view?hix_id=HIX0014446",
      "url_syntax" : "http://www.h-invitational.jp/hinv/spsoup/locus_view?hix_id=[example_id]",
      "example_id" : "H-invDB_locus:HIX0014446",
      "database" : "H-invitational Database",
      "datatype" : null
   },
   "pirsf" : {
      "example_id" : "PIRSF:SF002327",
      "url_syntax" : "http://pir.georgetown.edu/cgi-bin/ipcSF?id=[example_id]",
      "database" : "PIR Superfamily Classification System",
      "datatype" : null,
      "url_example" : "http://pir.georgetown.edu/cgi-bin/ipcSF?id=SF002327",
      "name" : null,
      "uri_prefix" : null,
      "object" : "Identifier",
      "generic_url" : "http://pir.georgetown.edu/pirsf/",
      "abbreviation" : "PIRSF",
      "fullname" : null,
      "id" : null
   },
   "ensembl_geneid" : {
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://www.ensembl.org/id/ENSG00000126016",
      "url_syntax" : "http://www.ensembl.org/id/[example_id]",
      "database" : "Ensembl database of automatically annotated genomic data",
      "example_id" : "ENSEMBL_GeneID:ENSG00000126016",
      "datatype" : null,
      "local_id_syntax" : "^ENSG[0-9]{9,16}$",
      "id" : null,
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "object" : "Gene identifier",
      "abbreviation" : "ENSEMBL_GeneID",
      "generic_url" : "http://www.ensembl.org/"
   },
   "ri" : {
      "uri_prefix" : null,
      "name" : null,
      "url_example" : null,
      "example_id" : null,
      "database" : "Roslin Institute",
      "url_syntax" : null,
      "datatype" : null,
      "id" : null,
      "fullname" : null,
      "object" : null,
      "abbreviation" : "RI",
      "generic_url" : "http://www.roslin.ac.uk/"
   },
   "pamgo_vmd" : {
      "object" : "Gene identifier",
      "abbreviation" : "PAMGO_VMD",
      "generic_url" : "http://phytophthora.vbi.vt.edu",
      "description" : "Virginia Bioinformatics Institute Microbial Database; member of PAMGO Interest Group",
      "id" : null,
      "fullname" : null,
      "example_id" : "PAMGO_VMD:109198",
      "url_syntax" : "http://vmd.vbi.vt.edu/cgi-bin/browse/go_detail.cgi?gene_id=[example_id]",
      "database" : "Virginia Bioinformatics Institute Microbial Database",
      "datatype" : null,
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://vmd.vbi.vt.edu/cgi-bin/browse/go_detail.cgi?gene_id=109198"
   },
   "pharmgkb" : {
      "datatype" : null,
      "example_id" : "PharmGKB:PA267",
      "url_syntax" : "http://www.pharmgkb.org/do/serve?objId=[example_id]",
      "database" : "Pharmacogenetics and Pharmacogenomics Knowledge Base",
      "url_example" : "http://www.pharmgkb.org/do/serve?objId=PA267",
      "name" : null,
      "uri_prefix" : null,
      "generic_url" : "http://www.pharmgkb.org",
      "abbreviation" : "PharmGKB",
      "object" : null,
      "fullname" : null,
      "id" : null
   },
   "rnamods" : {
      "object" : "Identifier",
      "generic_url" : "http://s59.cas.albany.edu/RNAmods/",
      "abbreviation" : "RNAmods",
      "fullname" : null,
      "id" : null,
      "url_syntax" : "http://s59.cas.albany.edu/RNAmods/cgi-bin/rnashow.cgi?[example_id]",
      "example_id" : "RNAmods:037",
      "database" : "RNA Modification Database",
      "datatype" : null,
      "name" : null,
      "url_example" : "http://s59.cas.albany.edu/RNAmods/cgi-bin/rnashow.cgi?091",
      "uri_prefix" : null
   },
   "cas_spc" : {
      "fullname" : null,
      "id" : null,
      "generic_url" : "http://research.calacademy.org/research/ichthyology/catalog/fishcatsearch.html",
      "abbreviation" : "CAS_SPC",
      "object" : "Identifier",
      "url_example" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Species&id=1979",
      "name" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "url_syntax" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Species&id=[example_id]",
      "database" : "Catalog of Fishes species database",
      "example_id" : null
   },
   "prow" : {
      "url_example" : null,
      "name" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "database" : "Protein Reviews on the Web",
      "url_syntax" : null,
      "example_id" : null,
      "fullname" : null,
      "id" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/prow/",
      "abbreviation" : "PROW",
      "object" : null
   },
   "ipr" : {
      "local_id_syntax" : "^IPR\\d{6}$",
      "id" : null,
      "fullname" : null,
      "entity_type" : "SO:0000839 ! polypeptide region",
      "object" : "Identifier",
      "abbreviation" : "IPR",
      "generic_url" : "http://www.ebi.ac.uk/interpro/",
      "uri_prefix" : null,
      "url_example" : "http://www.ebi.ac.uk/interpro/entry/IPR015421",
      "name" : null,
      "url_syntax" : "http://www.ebi.ac.uk/interpro/entry/[example_id]",
      "database" : "InterPro database of protein domains and motifs",
      "example_id" : "InterPro:IPR000001",
      "datatype" : null
   },
   "taxon" : {
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Taxonomy/taxonomyhome.html/",
      "abbreviation" : "taxon",
      "object" : "Identifier",
      "fullname" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=[example_id]",
      "database" : "NCBI Taxonomy",
      "example_id" : "taxon:7227",
      "url_example" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=3702",
      "name" : null,
      "uri_prefix" : null
   },
   "ncbi" : {
      "! url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=",
      "name" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "database" : "National Center for Biotechnology Information",
      "url_syntax" : null,
      "example_id" : null,
      "fullname" : null,
      "id" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "abbreviation" : "NCBI",
      "object" : "Prefix",
      "! url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=[example_id]"
   },
   "biomd" : {
      "object" : "Accession",
      "generic_url" : "http://www.ebi.ac.uk/biomodels/",
      "abbreviation" : "BIOMD",
      "fullname" : null,
      "id" : null,
      "url_syntax" : "http://www.ebi.ac.uk/compneur-srv/biomodels-main/publ-model.do?mid=[example_id]",
      "example_id" : "BIOMD:BIOMD0000000045",
      "database" : "BioModels Database",
      "datatype" : null,
      "name" : null,
      "url_example" : "http://www.ebi.ac.uk/compneur-srv/biomodels-main/publ-model.do?mid=BIOMD0000000045",
      "uri_prefix" : null
   },
   "ddbj" : {
      "datatype" : null,
      "url_syntax" : "http://arsa.ddbj.nig.ac.jp/arsa/ddbjSplSearch?KeyWord=[example_id]",
      "example_id" : "DDBJ:AA816246",
      "database" : "DNA Databank of Japan",
      "name" : null,
      "url_example" : "http://arsa.ddbj.nig.ac.jp/arsa/ddbjSplSearch?KeyWord=AA816246",
      "uri_prefix" : null,
      "generic_url" : "http://www.ddbj.nig.ac.jp/",
      "abbreviation" : "DDBJ",
      "object" : "Sequence accession",
      "fullname" : null,
      "id" : null
   },
   "omssa" : {
      "name" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "url_syntax" : null,
      "example_id" : null,
      "database" : "Open Mass Spectrometry Search Algorithm",
      "fullname" : null,
      "id" : null,
      "generic_url" : "http://pubchem.ncbi.nlm.nih.gov/omssa/",
      "abbreviation" : "OMSSA",
      "object" : null
   },
   "hpa_antibody" : {
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://www.proteinatlas.org/antibody_info.php?antibody_id=HPA000237",
      "datatype" : null,
      "example_id" : "HPA_antibody:HPA000237",
      "url_syntax" : "http://www.proteinatlas.org/antibody_info.php?antibody_id=[example_id]",
      "database" : "Human Protein Atlas antibody information",
      "id" : null,
      "fullname" : null,
      "abbreviation" : "HPA_antibody",
      "generic_url" : "http://www.proteinatlas.org/",
      "object" : "Identifier"
   },
   "alzheimers_university_of_toronto" : {
      "object" : null,
      "abbreviation" : "Alzheimers_University_of_Toronto",
      "generic_url" : "http://www.ims.utoronto.ca/",
      "id" : null,
      "fullname" : null,
      "url_syntax" : null,
      "example_id" : null,
      "database" : "Alzheimers Project at University of Toronto",
      "datatype" : null,
      "uri_prefix" : null,
      "name" : null,
      "url_example" : null
   },
   "maizegdb_locus" : {
      "datatype" : null,
      "url_syntax" : "http://www.maizegdb.org/cgi-bin/displaylocusresults.cgi?term=[example_id]",
      "example_id" : "MaizeGDB_Locus:ZmPK1",
      "database" : "MaizeGDB",
      "url_example" : "http://www.maizegdb.org/cgi-bin/displaylocusresults.cgi?term=ZmPK1",
      "name" : null,
      "uri_prefix" : null,
      "generic_url" : "http://www.maizegdb.org",
      "abbreviation" : "MaizeGDB_Locus",
      "object" : "Maize gene name",
      "fullname" : null,
      "id" : null,
      "local_id_syntax" : "^[A-Za-z][A-Za-z0-9]*$"
   },
   "interpro" : {
      "url_example" : "http://www.ebi.ac.uk/interpro/entry/IPR015421",
      "name" : null,
      "uri_prefix" : null,
      "example_id" : "InterPro:IPR000001",
      "database" : "InterPro database of protein domains and motifs",
      "url_syntax" : "http://www.ebi.ac.uk/interpro/entry/[example_id]",
      "datatype" : null,
      "local_id_syntax" : "^IPR\\d{6}$",
      "entity_type" : "SO:0000839 ! polypeptide region",
      "fullname" : null,
      "id" : null,
      "object" : "Identifier",
      "generic_url" : "http://www.ebi.ac.uk/interpro/",
      "abbreviation" : "INTERPRO"
   },
   "goc" : {
      "id" : null,
      "fullname" : null,
      "object" : null,
      "abbreviation" : "GOC",
      "generic_url" : "http://www.geneontology.org/",
      "uri_prefix" : null,
      "url_example" : null,
      "name" : null,
      "url_syntax" : null,
      "example_id" : null,
      "database" : "Gene Ontology Consortium",
      "datatype" : null
   },
   "pmid" : {
      "abbreviation" : "PMID",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/PubMed/",
      "object" : "Identifier",
      "id" : null,
      "fullname" : null,
      "local_id_syntax" : "^[0-9]+$",
      "datatype" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/pubmed/[example_id]",
      "example_id" : "PMID:4208797",
      "database" : "PubMed",
      "uri_prefix" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/pubmed/4208797",
      "name" : null
   },
   "rebase" : {
      "url_example" : "http://rebase.neb.com/rebase/enz/EcoRI.html",
      "name" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "url_syntax" : "http://rebase.neb.com/rebase/enz/[example_id].html",
      "example_id" : "REBASE:EcoRI",
      "database" : "REBASE restriction enzyme database",
      "fullname" : null,
      "id" : null,
      "generic_url" : "http://rebase.neb.com/rebase/rebase.html",
      "abbreviation" : "REBASE",
      "object" : "Restriction enzyme name"
   },
   "dictybase_ref" : {
      "object" : "Literature Reference Identifier",
      "generic_url" : "http://dictybase.org",
      "abbreviation" : "dictyBase_REF",
      "fullname" : null,
      "id" : null,
      "url_syntax" : "http://dictybase.org/db/cgi-bin/dictyBase/reference/reference.pl?refNo=[example_id]",
      "database" : "dictyBase literature references",
      "example_id" : "dictyBase_REF:10157",
      "datatype" : null,
      "url_example" : "http://dictybase.org/db/cgi-bin/dictyBase/reference/reference.pl?refNo=10157",
      "name" : null,
      "uri_prefix" : null
   },
   "um-bbd_ruleid" : {
      "datatype" : null,
      "example_id" : "UM-BBD_ruleID:bt0330",
      "url_syntax" : "http://umbbd.msi.umn.edu/servlets/rule.jsp?rule=[example_id]",
      "database" : "University of Minnesota Biocatalysis/Biodegradation Database",
      "uri_prefix" : null,
      "url_example" : "http://umbbd.msi.umn.edu/servlets/rule.jsp?rule=bt0330",
      "name" : null,
      "abbreviation" : "UM-BBD_ruleID",
      "generic_url" : "http://umbbd.msi.umn.edu/",
      "object" : "Rule identifier",
      "id" : null,
      "fullname" : null
   },
   "aracyc" : {
      "fullname" : null,
      "id" : null,
      "object" : "Identifier",
      "generic_url" : "http://www.arabidopsis.org/biocyc/index.jsp",
      "abbreviation" : "AraCyc",
      "url_example" : "http://www.arabidopsis.org:1555/ARA/NEW-IMAGE?type=NIL&object=PWYQT-62",
      "name" : null,
      "uri_prefix" : null,
      "database" : "AraCyc metabolic pathway database for Arabidopsis thaliana",
      "url_syntax" : "http://www.arabidopsis.org:1555/ARA/NEW-IMAGE?type=NIL&object=[example_id]",
      "example_id" : "AraCyc:PWYQT-62",
      "datatype" : null
   },
   "trait" : {
      "url_example" : null,
      "name" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "example_id" : null,
      "url_syntax" : null,
      "database" : "TRAnscript Integrated Table",
      "fullname" : null,
      "id" : null,
      "description" : "an integrated database of transcripts expressed in human skeletal muscle",
      "generic_url" : "http://muscle.cribi.unipd.it/",
      "abbreviation" : "TRAIT",
      "object" : null
   },
   "agricola_ind" : {
      "id" : null,
      "fullname" : null,
      "abbreviation" : "AGRICOLA_IND",
      "generic_url" : "http://agricola.nal.usda.gov/",
      "object" : "AGRICOLA IND number",
      "uri_prefix" : null,
      "url_example" : null,
      "name" : null,
      "datatype" : null,
      "url_syntax" : null,
      "database" : "AGRICultural OnLine Access",
      "example_id" : "AGRICOLA_IND:IND23252955"
   },
   "vmd" : {
      "name" : null,
      "url_example" : "http://vmd.vbi.vt.edu/cgi-bin/browse/browserDetail_new.cgi?gene_id=109198",
      "uri_prefix" : null,
      "example_id" : "VMD:109198",
      "url_syntax" : "http://vmd.vbi.vt.edu/cgi-bin/browse/browserDetail_new.cgi?gene_id=[example_id]",
      "database" : "Virginia Bioinformatics Institute Microbial Database",
      "datatype" : null,
      "fullname" : null,
      "id" : null,
      "object" : "Gene identifier",
      "generic_url" : "http://phytophthora.vbi.vt.edu",
      "abbreviation" : "VMD"
   },
   "genedb_spombe" : {
      "abbreviation" : "GeneDB_Spombe",
      "local_id_syntax" : "^SP[A-Z0-9]+\\.[A-Za-z0-9]+$",
      "shorthand_name" : "Spombe",
      "entity_type" : "SO:0000704 ! gene ",
      "database" : "Schizosaccharomyces pombe GeneDB",
      "datatype" : null,
      "object" : "Gene identifier",
      "generic_url" : "http://old.genedb.org/genedb/pombe/index.jsp",
      "replaced_by" : "PomBase",
      "id" : null,
      "is_obsolete" : "true",
      "fullname" : null,
      "example_id" : "GeneDB_Spombe:SPAC890.04C",
      "url_syntax" : "http://old.genedb.org/genedb/Search?organism=pombe&name=[example_id]",
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://old.genedb.org/genedb/Search?organism=pombe&name=SPAC890.04C"
   },
   "mim" : {
      "abbreviation" : "MIM",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?db=OMIM",
      "object" : "Identifier",
      "id" : null,
      "fullname" : null,
      "datatype" : null,
      "database" : "Mendelian Inheritance in Man",
      "url_syntax" : "http://omim.org/entry/[example_id]",
      "example_id" : "OMIM:190198",
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://omim.org/entry/190198"
   },
   "uniprotkb/swiss-prot" : {
      "generic_url" : "http://www.uniprot.org",
      "abbreviation" : "UniProtKB/Swiss-Prot",
      "object" : "Accession",
      "fullname" : null,
      "is_obsolete" : "true",
      "replaced_by" : "UniProtKB",
      "id" : null,
      "description" : "A curated protein sequence database which provides a high level of annotation and a minimal level of redundancy",
      "datatype" : null,
      "database" : "UniProtKB/Swiss-Prot",
      "url_syntax" : "http://www.uniprot.org/uniprot/[example_id]",
      "example_id" : "Swiss-Prot:P51587",
      "name" : null,
      "url_example" : "http://www.uniprot.org/uniprot/P51587",
      "uri_prefix" : null
   },
   "aspgd_locus" : {
      "fullname" : null,
      "id" : null,
      "object" : "Gene name (gene symbol in mammalian nomenclature)",
      "generic_url" : "http://www.aspergillusgenome.org/",
      "abbreviation" : "AspGD_LOCUS",
      "name" : null,
      "url_example" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?locus=AN10942",
      "uri_prefix" : null,
      "url_syntax" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?locus=[example_id]",
      "example_id" : "AspGD_LOCUS:AN10942",
      "database" : "Aspergillus Genome Database",
      "datatype" : null
   },
   "pfamb" : {
      "uri_prefix" : null,
      "url_example" : null,
      "name" : null,
      "example_id" : "PfamB:PB014624",
      "url_syntax" : null,
      "database" : "Pfam-B supplement to Pfam",
      "datatype" : null,
      "id" : null,
      "fullname" : null,
      "object" : "Accession",
      "abbreviation" : "PfamB",
      "generic_url" : "http://www.sanger.ac.uk/Software/Pfam/"
   },
   "coriell" : {
      "name" : null,
      "url_example" : "http://ccr.coriell.org/Sections/Search/Sample_Detail.aspx?Ref=GM07892",
      "uri_prefix" : null,
      "datatype" : null,
      "url_syntax" : "http://ccr.coriell.org/Sections/Search/Sample_Detail.aspx?Ref=[example_id]",
      "database" : "Coriell Institute for Medical Research",
      "example_id" : "GM07892",
      "fullname" : null,
      "id" : null,
      "description" : "The Coriell Cell Repositories provide essential research reagents to the scientific community by establishing, verifying, maintaining, and distributing cell cultures and DNA derived from cell cultures. These collections, supported by funds from the National Institutes of Health (NIH) and several foundations, are extensively utilized by research scientists around the world. ",
      "generic_url" : "http://ccr.coriell.org/",
      "abbreviation" : "CORIELL",
      "object" : "Identifier"
   },
   "germonline" : {
      "example_id" : null,
      "url_syntax" : null,
      "database" : "GermOnline",
      "datatype" : null,
      "uri_prefix" : null,
      "name" : null,
      "url_example" : null,
      "object" : null,
      "abbreviation" : "GermOnline",
      "generic_url" : "http://www.germonline.org/",
      "id" : null,
      "fullname" : null
   },
   "pfam" : {
      "abbreviation" : "Pfam",
      "generic_url" : "http://www.sanger.ac.uk/Software/Pfam/",
      "object" : "Accession",
      "id" : null,
      "fullname" : null,
      "entity_type" : "SO:0000839 ! polypeptide region",
      "description" : "Pfam is a collection of protein families represented by sequence alignments and hidden Markov models (HMMs)",
      "datatype" : null,
      "example_id" : "Pfam:PF00046",
      "url_syntax" : "http://www.sanger.ac.uk/cgi-bin/Pfam/getacc?[example_id]",
      "database" : "Pfam database of protein families",
      "uri_prefix" : null,
      "url_example" : "http://www.sanger.ac.uk/cgi-bin/Pfam/getacc?PF00046",
      "name" : null
   },
   "gr_gene" : {
      "abbreviation" : "GR_gene",
      "generic_url" : "http://www.gramene.org/",
      "object" : "Gene identifier",
      "id" : null,
      "fullname" : null,
      "database: Gramene" : "A Comparative Mapping Resource for Grains",
      "datatype" : null,
      "database" : null,
      "example_id" : "GR_GENE:GR:0060198",
      "url_syntax" : "http://www.gramene.org/db/genes/search_gene?acc=[example_id]",
      "uri_prefix" : null,
      "url_example" : "http://www.gramene.org/db/genes/search_gene?acc=GR:0060198",
      "name" : null
   },
   "fypo" : {
      "generic_url" : "http://www.pombase.org/",
      "abbreviation" : "FYPO",
      "object" : "Identifier",
      "fullname" : null,
      "id" : null,
      "local_id_syntax" : "^\\d{7}$",
      "datatype" : null,
      "database" : "Fission Yeast Phenotype Ontology",
      "url_syntax" : null,
      "example_id" : "FYPO:0000001",
      "name" : null,
      "url_example" : null,
      "uri_prefix" : null
   },
   "jcvi_ref" : {
      "fullname" : null,
      "id" : null,
      "generic_url" : "http://cmr.jcvi.org/",
      "abbreviation" : "JCVI_REF",
      "object" : "Reference locator",
      "url_example" : "http://cmr.jcvi.org/CMR/AnnotationSops.shtml",
      "name" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "url_syntax" : null,
      "example_id" : "JCVI_REF:GO_ref",
      "database" : "J. Craig Venter Institute"
   },
   "wb_ref" : {
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://www.wormbase.org/db/misc/paper?name=WBPaper00004823",
      "datatype" : null,
      "url_syntax" : "http://www.wormbase.org/db/misc/paper?name=[example_id]",
      "example_id" : "WB_REF:WBPaper00004823",
      "database" : "WormBase database of nematode biology",
      "id" : null,
      "fullname" : null,
      "abbreviation" : "WB_REF",
      "generic_url" : "http://www.wormbase.org/",
      "object" : "Literature Reference Identifier"
   },
   "genedb" : {
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://www.genedb.org/gene/PF3D7_1467300",
      "datatype" : null,
      "url_syntax" : "http://www.genedb.org/gene/[example_id]",
      "example_id" : "PF3D7_1467300",
      "database" : "GeneDB",
      "id" : null,
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "local_id_syntax" : "^Tb\\d+\\.[A-Za-z0-9]+\\.\\d+$",
      "abbreviation" : "GeneDB",
      "generic_url" : "http://www.genedb.org/gene/",
      "object" : "Identifier"
   },
   "ec" : {
      "generic_url" : "http://www.chem.qmul.ac.uk/iubmb/enzyme/",
      "abbreviation" : "EC",
      "object" : null,
      "entity_type" : "GO:0003824 ! catalytic activity",
      "fullname" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://www.expasy.org/enzyme/[example_id]",
      "example_id" : "EC:1.4.3.6",
      "database" : "Enzyme Commission",
      "! url_example" : "http://www.chem.qmw.ac.uk/iubmb/enzyme/EC1/4/3/6.html",
      "url_example" : "http://www.expasy.org/enzyme/1.4.3.6",
      "name" : null,
      "uri_prefix" : null
   },
   "aspgdid" : {
      "object" : "Identifier for AspGD Loci",
      "generic_url" : "http://www.aspergillusgenome.org/",
      "abbreviation" : "AspGDID",
      "local_id_syntax" : "^ASPL[0-9]{10}$",
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "id" : null,
      "url_syntax" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?dbid=[example_id]",
      "example_id" : "AspGD:ASPL0000067538",
      "database" : "Aspergillus Genome Database",
      "datatype" : null,
      "name" : null,
      "url_example" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?dbid=ASPL0000067538",
      "uri_prefix" : null
   },
   "intact" : {
      "id" : null,
      "fullname" : null,
      "entity_type" : "MI:0315 ! protein complex ",
      "local_id_syntax" : "^EBI-[0-9]+$",
      "abbreviation" : "IntAct",
      "generic_url" : "http://www.ebi.ac.uk/intact/",
      "object" : "Accession",
      "uri_prefix" : null,
      "url_example" : "http://www.ebi.ac.uk/intact/search/do/search?searchString=EBI-17086",
      "name" : null,
      "datatype" : null,
      "example_id" : "IntAct:EBI-17086",
      "url_syntax" : "http://www.ebi.ac.uk/intact/search/do/search?searchString=[example_id]",
      "database" : "IntAct protein interaction database"
   },
   "imgt_hla" : {
      "fullname" : null,
      "id" : null,
      "object" : null,
      "generic_url" : "http://www.ebi.ac.uk/imgt/hla",
      "abbreviation" : "IMGT_HLA",
      "url_example" : null,
      "name" : null,
      "uri_prefix" : null,
      "url_syntax" : null,
      "example_id" : "IMGT_HLA:HLA00031",
      "database" : "IMGT/HLA human major histocompatibility complex sequence database",
      "datatype" : null
   },
   "ensemblfungi" : {
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "id" : null,
      "generic_url" : "http://fungi.ensembl.org/",
      "abbreviation" : "EnsemblFungi",
      "object" : "Identifier",
      "url_example" : "http://www.ensemblgenomes.org/id/YOR197W",
      "name" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "example_id" : "EnsemblFungi:YOR197W",
      "url_syntax" : "http://www.ensemblgenomes.org/id/[example_ID]",
      "database" : "Ensembl Fungi, the Ensembl Genomes database for accessing fungal genome data"
   },
   "aspgd" : {
      "object" : "Identifier for AspGD Loci",
      "abbreviation" : "AspGD",
      "generic_url" : "http://www.aspergillusgenome.org/",
      "local_id_syntax" : "^ASPL[0-9]{10}$",
      "id" : null,
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "url_syntax" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?dbid=[example_id]",
      "database" : "Aspergillus Genome Database",
      "example_id" : "AspGD:ASPL0000067538",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?dbid=ASPL0000067538",
      "name" : null
   },
   "locsvmpsi" : {
      "uri_prefix" : null,
      "name" : null,
      "url_example" : null,
      "example_id" : null,
      "url_syntax" : null,
      "database" : "LOCSVMPSI",
      "datatype" : null,
      "description" : "Subcellular localization for eukayotic proteins based on SVM and PSI-BLAST",
      "id" : null,
      "fullname" : null,
      "object" : null,
      "abbreviation" : "LOCSVMpsi",
      "generic_url" : "http://bioinformatics.ustc.edu.cn/locsvmpsi/locsvmpsi.php"
   },
   "ncbi_taxid" : {
      "example_id" : "taxon:7227",
      "database" : "NCBI Taxonomy",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=[example_id]",
      "datatype" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=3702",
      "name" : null,
      "uri_prefix" : null,
      "object" : "Identifier",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Taxonomy/taxonomyhome.html/",
      "abbreviation" : "ncbi_taxid",
      "fullname" : null,
      "id" : null
   },
   "uniprotkb-kw" : {
      "url_example" : "http://www.uniprot.org/keywords/KW-0812",
      "name" : null,
      "uri_prefix" : null,
      "url_syntax" : "http://www.uniprot.org/keywords/[example_id]",
      "example_id" : "UniProtKB-KW:KW-0812",
      "database" : "UniProt Knowledgebase keywords",
      "datatype" : null,
      "fullname" : null,
      "id" : null,
      "object" : "Identifier",
      "generic_url" : "http://www.uniprot.org/keywords/",
      "abbreviation" : "UniProtKB-KW"
   },
   "biopixie_mefit" : {
      "url_syntax" : null,
      "example_id" : null,
      "database" : "biological Process Inference from eXperimental Interaction Evidence/Microarray Experiment Functional Integration Technology",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : null,
      "name" : null,
      "object" : null,
      "abbreviation" : "bioPIXIE_MEFIT",
      "generic_url" : "http://pixie.princeton.edu/pixie/",
      "id" : null,
      "fullname" : null
   },
   "rhea" : {
      "uri_prefix" : null,
      "url_example" : "http://www.ebi.ac.uk/rhea/reaction.xhtml?id=25811",
      "name" : null,
      "datatype" : null,
      "url_syntax" : "http://www.ebi.ac.uk/rhea/reaction.xhtml?id=[example_id]",
      "example_id" : "RHEA:25811",
      "database" : "Rhea, the Annotated Reactions Database",
      "id" : null,
      "fullname" : null,
      "description" : "Rhea is a freely available, manually annotated database of chemical reactions created in collaboration with the Swiss Institute of Bioinformatics (SIB).",
      "abbreviation" : "RHEA",
      "generic_url" : "http://www.ebi.ac.uk/rhea/",
      "object" : "Accession"
   },
   "isbn" : {
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "https://en.wikipedia.org/w/index.php?title=Special%3ABookSources&isbn=0123456789",
      "datatype" : null,
      "example_id" : "ISBN:0781702534",
      "url_syntax" : "https://en.wikipedia.org/w/index.php?title=Special%3ABookSources&isbn=[example_id]",
      "database" : "International Standard Book Number",
      "id" : null,
      "fullname" : null,
      "abbreviation" : "ISBN",
      "generic_url" : "http://isbntools.com/",
      "object" : "Identifier"
   },
   "biocyc" : {
      "abbreviation" : "BioCyc",
      "generic_url" : "http://biocyc.org/",
      "object" : "Identifier",
      "id" : null,
      "fullname" : null,
      "datatype" : null,
      "example_id" : "BioCyc:PWY-5271",
      "url_syntax" : "http://biocyc.org/META/NEW-IMAGE?type=PATHWAY&object=[example_id]",
      "database" : "BioCyc collection of metabolic pathway databases",
      "uri_prefix" : null,
      "url_example" : "http://biocyc.org/META/NEW-IMAGE?type=PATHWAY&object=PWY-5271",
      "name" : null
   },
   "pmcid" : {
      "url_example" : "http://www.ncbi.nlm.nih.gov/sites/entrez?db=pmc&cmd=search&term=PMC201377",
      "name" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/sites/entrez?db=pmc&cmd=search&term=[example_id]",
      "!url_example" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?cmd=Search&db=PMC&term=PMC201377",
      "example_id" : "PMCID:PMC201377",
      "database" : "Pubmed Central",
      "fullname" : null,
      "id" : null,
      "!url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?cmd=Search&db=PMC&term=[example_id]",
      "generic_url" : "http://www.pubmedcentral.nih.gov/",
      "abbreviation" : "PMCID",
      "object" : "Identifier"
   },
   "nmpdr" : {
      "name" : null,
      "url_example" : "http://www.nmpdr.org/linkin.cgi?id=fig|306254.1.peg.183",
      "uri_prefix" : null,
      "url_syntax" : "http://www.nmpdr.org/linkin.cgi?id=[example_id]",
      "example_id" : "NMPDR:fig|306254.1.peg.183",
      "database" : "National Microbial Pathogen Data Resource",
      "datatype" : null,
      "fullname" : null,
      "id" : null,
      "object" : "Identifier",
      "generic_url" : "http://www.nmpdr.org",
      "abbreviation" : "NMPDR"
   },
   "mengo" : {
      "uri_prefix" : null,
      "name" : null,
      "url_example" : null,
      "url_syntax" : null,
      "example_id" : null,
      "database" : "Microbial ENergy processes Gene Ontology Project",
      "datatype" : null,
      "id" : null,
      "fullname" : null,
      "object" : null,
      "abbreviation" : "MENGO",
      "generic_url" : "http://mengo.vbi.vt.edu/"
   },
   "issn" : {
      "url_syntax" : null,
      "database" : "International Standard Serial Number",
      "example_id" : "ISSN:1234-1231",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : null,
      "name" : null,
      "object" : "Identifier",
      "abbreviation" : "ISSN",
      "generic_url" : "http://www.issn.org/",
      "id" : null,
      "fullname" : null
   },
   "vida" : {
      "datatype" : null,
      "url_syntax" : null,
      "example_id" : null,
      "database" : "Virus Database at University College London",
      "name" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "generic_url" : "http://www.biochem.ucl.ac.uk/bsm/virus_database/VIDA.html",
      "abbreviation" : "VIDA",
      "object" : null,
      "fullname" : null,
      "id" : null
   },
   "jcvi_pfa1" : {
      "object" : "Accession",
      "generic_url" : "http://www.tigr.org/tdb/e2k1/pfa1/pfa1.shtml",
      "abbreviation" : "JCVI_Pfa1",
      "is_obsolete" : "true",
      "fullname" : null,
      "id" : null,
      "url_syntax" : null,
      "example_id" : "JCVI_Pfa1:PFB0010w",
      "database" : "Plasmodium falciparum database at the J. Craig Venter Institute",
      "datatype" : null,
      "name" : null,
      "url_example" : null,
      "uri_prefix" : null
   },
   "muscletrait" : {
      "fullname" : null,
      "id" : null,
      "description" : "an integrated database of transcripts expressed in human skeletal muscle",
      "generic_url" : "http://muscle.cribi.unipd.it/",
      "abbreviation" : "MuscleTRAIT",
      "object" : null,
      "url_example" : null,
      "name" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "url_syntax" : null,
      "database" : "TRAnscript Integrated Table",
      "example_id" : null
   },
   "ro" : {
      "fullname" : null,
      "id" : null,
      "description" : "A collection of relations used across OBO ontologies",
      "generic_url" : "http://purl.obolibrary.org/obo/ro",
      "abbreviation" : "RO",
      "object" : null,
      "url_example" : "http://purl.obolibrary.org/obo/RO_0002211",
      "name" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "url_syntax" : "http://purl.obolibrary.org/obo/RO_[example_id]",
      "example_id" : "RO:0002211",
      "database" : "OBO Relation Ontology Ontology"
   },
   "sgn_ref" : {
      "abbreviation" : "SGN_ref",
      "generic_url" : "http://www.sgn.cornell.edu/",
      "object" : "Reference identifier",
      "id" : null,
      "fullname" : null,
      "datatype" : null,
      "example_id" : "SGN_ref:861",
      "url_syntax" : "http://www.sgn.cornell.edu/chado/publication.pl?pub_id=[example_id]",
      "database" : "Sol Genomics Network",
      "uri_prefix" : null,
      "url_example" : "http://www.sgn.cornell.edu/chado/publication.pl?pub_id=861",
      "name" : null
   },
   "sgd" : {
      "url_example" : "http://db.yeastgenome.org/cgi-bin/locus.pl?dbid=S000006169",
      "name" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "url_syntax" : "http://db.yeastgenome.org/cgi-bin/locus.pl?dbid=[example_id]",
      "example_id" : "SGD:S000006169",
      "database" : "Saccharomyces Genome Database",
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "id" : null,
      "local_id_syntax" : "^S[0-9]{9}$",
      "generic_url" : "http://www.yeastgenome.org/",
      "abbreviation" : "SGD",
      "object" : "Identifier for SGD Loci"
   },
   "vz" : {
      "url_example" : "http://viralzone.expasy.org/all_by_protein/957.html",
      "name" : null,
      "uri_prefix" : null,
      "url_syntax" : "http://viralzone.expasy.org/all_by_protein/[example_id].html",
      "database" : "ViralZone",
      "example_id" : "VZ:957",
      "datatype" : null,
      "fullname" : null,
      "id" : null,
      "object" : "Page Reference Identifier",
      "generic_url" : "http://viralzone.expasy.org/",
      "abbreviation" : "VZ"
   },
   "agbase" : {
      "id" : null,
      "fullname" : null,
      "object" : null,
      "abbreviation" : "AgBase",
      "generic_url" : "http://www.agbase.msstate.edu/",
      "uri_prefix" : null,
      "url_example" : null,
      "name" : null,
      "url_syntax" : "http://www.agbase.msstate.edu/cgi-bin/getEntry.pl?db_pick=[ChickGO/MaizeGO]&uid=[example_id]",
      "example_id" : null,
      "database" : "AgBase resource for functional analysis of agricultural plant and animal gene products",
      "datatype" : null
   },
   "ntnu_sb" : {
      "id" : null,
      "fullname" : null,
      "abbreviation" : "NTNU_SB",
      "generic_url" : "http://www.ntnu.edu/nt/systemsbiology",
      "object" : null,
      "uri_prefix" : null,
      "name" : null,
      "url_example" : null,
      "datatype" : null,
      "example_id" : null,
      "url_syntax" : null,
      "database" : "Norwegian University of Science and Technology, Systems Biology team"
   },
   "rfam" : {
      "url_syntax" : "http://rfam.sanger.ac.uk/family/[example_id]",
      "example_id" : "Rfam:RF00012",
      "database" : "Rfam database of RNA families",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : "http://rfam.sanger.ac.uk/family/RF00012",
      "name" : null,
      "object" : "accession",
      "abbreviation" : "Rfam",
      "generic_url" : "http://rfam.sanger.ac.uk/",
      "id" : null,
      "fullname" : null
   },
   "modbase" : {
      "fullname" : null,
      "id" : null,
      "object" : "Accession",
      "generic_url" : "http://modbase.compbio.ucsf.edu/ ",
      "abbreviation" : "ModBase",
      "url_example" : "http://salilab.org/modbase/searchbyid?databaseID=P04848",
      "name" : null,
      "uri_prefix" : null,
      "database" : "ModBase comprehensive Database of Comparative Protein Structure Models",
      "url_syntax" : "http://salilab.org/modbase/searchbyid?databaseID=[example_id]",
      "example_id" : "ModBase:P10815",
      "datatype" : null
   },
   "ecocyc" : {
      "generic_url" : "http://ecocyc.org/",
      "abbreviation" : "EcoCyc",
      "object" : "Pathway identifier",
      "fullname" : null,
      "entity_type" : "GO:0008150 ! biological process",
      "id" : null,
      "local_id_syntax" : "^EG[0-9]{5}$",
      "datatype" : null,
      "url_syntax" : "http://biocyc.org/ECOLI/NEW-IMAGE?type=PATHWAY&object=[example_id]",
      "example_id" : "EcoCyc:P2-PWY",
      "database" : "Encyclopedia of E. coli metabolism",
      "url_example" : "http://biocyc.org/ECOLI/NEW-IMAGE?type=PATHWAY&object=P2-PWY",
      "name" : null,
      "uri_prefix" : null
   },
   "tigr_pfa1" : {
      "url_example" : null,
      "name" : null,
      "uri_prefix" : null,
      "database" : "Plasmodium falciparum database at the J. Craig Venter Institute",
      "example_id" : "JCVI_Pfa1:PFB0010w",
      "url_syntax" : null,
      "datatype" : null,
      "fullname" : null,
      "is_obsolete" : "true",
      "id" : null,
      "object" : "Accession",
      "generic_url" : "http://www.tigr.org/tdb/e2k1/pfa1/pfa1.shtml",
      "abbreviation" : "TIGR_Pfa1"
   },
   "iuphar_gpcr" : {
      "datatype" : null,
      "database" : "International Union of Pharmacology",
      "url_syntax" : "http://www.iuphar-db.org/DATABASE/FamilyMenuForward?familyId=[example_id]",
      "example_id" : "IUPHAR_GPCR:1279",
      "uri_prefix" : null,
      "url_example" : "http://www.iuphar-db.org/DATABASE/FamilyMenuForward?familyId=13",
      "name" : null,
      "abbreviation" : "IUPHAR_GPCR",
      "generic_url" : "http://www.iuphar.org/",
      "object" : "G-protein-coupled receptor family identifier",
      "id" : null,
      "fullname" : null
   },
   "prodom" : {
      "generic_url" : "http://prodom.prabi.fr/prodom/current/html/home.php",
      "abbreviation" : "ProDom",
      "object" : "Accession",
      "fullname" : null,
      "id" : null,
      "description" : "ProDom protein domain families automatically generated from UniProtKB",
      "datatype" : null,
      "url_syntax" : "http://prodom.prabi.fr/prodom/current/cgi-bin/request.pl?question=DBEN&query=[example_id]",
      "example_id" : "ProDom:PD000001",
      "database" : "ProDom protein domain families",
      "url_example" : "http://prodom.prabi.fr/prodom/current/cgi-bin/request.pl?question=DBEN&query=PD000001",
      "name" : null,
      "uri_prefix" : null
   },
   "vega" : {
      "object" : "Identifier",
      "generic_url" : "http://vega.sanger.ac.uk/index.html",
      "abbreviation" : "VEGA",
      "fullname" : null,
      "id" : null,
      "url_syntax" : "http://vega.sanger.ac.uk/perl/searchview?species=all&idx=All&q=[example_id]",
      "example_id" : "VEGA:OTTHUMP00000000661",
      "database" : "Vertebrate Genome Annotation database",
      "datatype" : null,
      "url_example" : "http://vega.sanger.ac.uk/perl/searchview?species=all&idx=All&q=OTTHUMP00000000661",
      "name" : null,
      "uri_prefix" : null
   },
   "ncbi_gp" : {
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein",
      "id" : null,
      "local_id_syntax" : "^[A-Z]{3}[0-9]{5}(\\.[0-9]+)?$",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "abbreviation" : "NCBI_GP",
      "object" : "Protein identifier",
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=protein&val=EAL72968",
      "name" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "example_id" : "NCBI_GP:EAL72968",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=protein&val=[example_id]",
      "database" : "NCBI GenPept"
   },
   "biomdid" : {
      "database" : "BioModels Database",
      "example_id" : "BIOMD:BIOMD0000000045",
      "url_syntax" : "http://www.ebi.ac.uk/compneur-srv/biomodels-main/publ-model.do?mid=[example_id]",
      "datatype" : null,
      "url_example" : "http://www.ebi.ac.uk/compneur-srv/biomodels-main/publ-model.do?mid=BIOMD0000000045",
      "name" : null,
      "uri_prefix" : null,
      "object" : "Accession",
      "generic_url" : "http://www.ebi.ac.uk/biomodels/",
      "abbreviation" : "BIOMDID",
      "fullname" : null,
      "id" : null
   },
   "psi-mi" : {
      "object" : "Interaction identifier",
      "abbreviation" : "PSI-MI",
      "generic_url" : "http://psidev.sourceforge.net/mi/xml/doc/user/index.html",
      "id" : null,
      "fullname" : null,
      "database" : "Proteomic Standard Initiative for Molecular Interaction",
      "url_syntax" : null,
      "example_id" : "MI:0018",
      "datatype" : null,
      "uri_prefix" : null,
      "name" : null,
      "url_example" : null
   },
   "cazy" : {
      "datatype" : null,
      "example_id" : "CAZY:PL11",
      "url_syntax" : "http://www.cazy.org/[example_id].html",
      "database" : "Carbohydrate Active EnZYmes",
      "url_example" : "http://www.cazy.org/PL11.html",
      "name" : null,
      "uri_prefix" : null,
      "generic_url" : "http://www.cazy.org/",
      "abbreviation" : "CAZY",
      "object" : "Identifier",
      "fullname" : null,
      "id" : null,
      "description" : "The CAZy database describes the families of structurally-related catalytic and carbohydrate-binding modules (or functional domains) of enzymes that degrade, modify, or create glycosidic bonds.",
      "local_id_syntax" : "^(CE|GH|GT|PL)\\d+$"
   },
   "gr" : {
      "datatype" : null,
      "database" : null,
      "url_syntax" : "http://www.gramene.org/db/searches/browser?search_type=All&RGN=on&query=[example_id]",
      "example_id" : "GR:sd1",
      "url_example" : "http://www.gramene.org/db/searches/browser?search_type=All&RGN=on&query=sd1",
      "name" : null,
      "uri_prefix" : null,
      "generic_url" : "http://www.gramene.org/",
      "abbreviation" : "GR",
      "object" : "Identifier (any)",
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein",
      "id" : null,
      "database: Gramene" : "A Comparative Mapping Resource for Grains",
      "local_id_syntax" : "^[A-Z][0-9][A-Z0-9]{3}[0-9]$"
   },
   "dictybase" : {
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "id" : null,
      "local_id_syntax" : "^DDB_G[0-9]{7}$",
      "generic_url" : "http://dictybase.org",
      "abbreviation" : "DictyBase",
      "object" : "Identifier",
      "name" : null,
      "url_example" : "http://dictybase.org/gene/DDB_G0277859",
      "uri_prefix" : null,
      "datatype" : null,
      "database" : "dictyBase",
      "example_id" : "dictyBase:DDB_G0277859",
      "url_syntax" : "http://dictybase.org/gene/[example_id]"
   },
   "um-bbd" : {
      "datatype" : null,
      "example_id" : null,
      "url_syntax" : null,
      "database" : "University of Minnesota Biocatalysis/Biodegradation Database",
      "name" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "generic_url" : "http://umbbd.msi.umn.edu/",
      "abbreviation" : "UM-BBD",
      "object" : "Prefix",
      "fullname" : null,
      "id" : null
   },
   "casref" : {
      "id" : null,
      "fullname" : null,
      "object" : "Identifier",
      "abbreviation" : "CASREF",
      "generic_url" : "http://research.calacademy.org/research/ichthyology/catalog/fishcatsearch.html",
      "uri_prefix" : null,
      "url_example" : "http://research.calacademy.org/research/ichthyology/catalog/getref.asp?id=2031",
      "name" : null,
      "example_id" : "CASREF:2031",
      "url_syntax" : "http://research.calacademy.org/research/ichthyology/catalog/getref.asp?id=[example_id]",
      "database" : "Catalog of Fishes publications database",
      "datatype" : null
   },
   "cog" : {
      "url_syntax" : null,
      "database" : "NCBI Clusters of Orthologous Groups",
      "example_id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "name" : null,
      "url_example" : null,
      "object" : null,
      "abbreviation" : "COG",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/COG/",
      "id" : null,
      "fullname" : null
   },
   "tc" : {
      "generic_url" : "http://www.tcdb.org/",
      "abbreviation" : "TC",
      "object" : "Identifier",
      "entity_type" : "PR:000000001 ! protein",
      "fullname" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://www.tcdb.org/tcdb/index.php?tc=[example_id]",
      "example_id" : "TC:9.A.4.1.1",
      "database" : "Transport Protein Database",
      "url_example" : "http://www.tcdb.org/tcdb/index.php?tc=9.A.4.1.1",
      "name" : null,
      "uri_prefix" : null
   },
   "jcvi_tigrfams" : {
      "abbreviation" : "JCVI_TIGRFAMS",
      "generic_url" : "http://search.jcvi.org/",
      "object" : "Accession",
      "id" : null,
      "fullname" : null,
      "entity_type" : "SO:0000839 ! polypeptide region",
      "datatype" : null,
      "example_id" : "JCVI_TIGRFAMS:TIGR00254",
      "url_syntax" : "http://search.jcvi.org/search?p&q=[example_id]",
      "database" : "TIGRFAMs HMM collection at the J. Craig Venter Institute",
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://search.jcvi.org/search?p&q=TIGR00254"
   },
   "cas" : {
      "datatype" : null,
      "url_syntax" : null,
      "example_id" : "CAS:58-08-2",
      "database" : "CAS Chemical Registry",
      "uri_prefix" : null,
      "url_example" : null,
      "name" : null,
      "abbreviation" : "CAS",
      "generic_url" : "http://www.cas.org/expertise/cascontent/registry/index.html",
      "object" : "Identifier",
      "id" : null,
      "fullname" : null,
      "description" : "CAS REGISTRY is the most authoritative collection of disclosed chemical substance information, containing more than 54 million organic and inorganic substances and 62 million sequences. CAS REGISTRY covers substances identified from the scientific literature from 1957 to the present, with additional substances going back to the early 1900s."
   },
   "uniparc" : {
      "uri_prefix" : null,
      "url_example" : "http://www.uniprot.org/uniparc/UPI000000000A",
      "name" : null,
      "database" : "UniProt Archive",
      "url_syntax" : "http://www.uniprot.org/uniparc/[example_id]",
      "example_id" : "UniParc:UPI000000000A",
      "datatype" : null,
      "description" : "A non-redundant archive of protein sequences extracted from Swiss-Prot, TrEMBL, PIR-PSD, EMBL, Ensembl, IPI, PDB, RefSeq, FlyBase, WormBase, European Patent Office, United States Patent and Trademark Office, and Japanese Patent Office",
      "id" : null,
      "fullname" : null,
      "object" : "Accession",
      "abbreviation" : "UniParc",
      "generic_url" : "http://www.uniprot.org/uniparc/"
   },
   "kegg" : {
      "fullname" : null,
      "id" : null,
      "object" : "identifier",
      "generic_url" : "http://www.genome.ad.jp/kegg/",
      "abbreviation" : "KEGG",
      "name" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "url_syntax" : null,
      "example_id" : null,
      "database" : "Kyoto Encyclopedia of Genes and Genomes",
      "datatype" : null
   },
   "merops" : {
      "database" : "MEROPS peptidase database",
      "url_syntax" : "http://merops.sanger.ac.uk/cgi-bin/pepsum?mid=[example_id]",
      "example_id" : "MEROPS:A08.001",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : "http://merops.sanger.ac.uk/cgi-bin/pepsum?mid=A08.001",
      "name" : null,
      "object" : "Identifier",
      "abbreviation" : "MEROPS",
      "generic_url" : "http://merops.sanger.ac.uk/",
      "id" : null,
      "entity_type" : "PR:000000001 ! protein",
      "fullname" : null
   },
   "nc-iubmb" : {
      "fullname" : null,
      "id" : null,
      "generic_url" : "http://www.chem.qmw.ac.uk/iubmb/",
      "abbreviation" : "NC-IUBMB",
      "object" : null,
      "name" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "example_id" : null,
      "url_syntax" : null,
      "database" : "Nomenclature Committee of the International Union of Biochemistry and Molecular Biology"
   },
   "um-bbd_reactionid" : {
      "object" : "Reaction identifier",
      "abbreviation" : "UM-BBD_reactionID",
      "generic_url" : "http://umbbd.msi.umn.edu/",
      "id" : null,
      "fullname" : null,
      "url_syntax" : "http://umbbd.msi.umn.edu/servlets/pageservlet?ptype=r&reacID=[example_id]",
      "example_id" : "UM-BBD_reactionID:r0129",
      "database" : "University of Minnesota Biocatalysis/Biodegradation Database",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : "http://umbbd.msi.umn.edu/servlets/pageservlet?ptype=r&reacID=r0129",
      "name" : null
   },
   "ddb" : {
      "url_example" : "http://dictybase.org/gene/DDB_G0277859",
      "name" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "database" : "dictyBase",
      "example_id" : "dictyBase:DDB_G0277859",
      "url_syntax" : "http://dictybase.org/gene/[example_id]",
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "id" : null,
      "local_id_syntax" : "^DDB_G[0-9]{7}$",
      "generic_url" : "http://dictybase.org",
      "abbreviation" : "DDB",
      "object" : "Identifier"
   },
   "bfo" : {
      "datatype" : null,
      "database" : "Basic Formal Ontology",
      "url_syntax" : "http://purl.obolibrary.org/obo/BFO_[example_id]",
      "example_id" : "BFO:0000066",
      "name" : null,
      "url_example" : "http://purl.obolibrary.org/obo/BFO_0000066",
      "uri_prefix" : null,
      "generic_url" : "http://purl.obolibrary.org/obo/bfo",
      "abbreviation" : "BFO",
      "object" : null,
      "fullname" : null,
      "id" : null,
      "description" : "An upper ontology used by Open Bio Ontologies (OBO) Foundry. BFO contains upper-level classes as well as core relations such as part_of (BFO_0000050)"
   },
   "um-bbd_pathwayid" : {
      "object" : "Pathway identifier",
      "abbreviation" : "UM-BBD_pathwayID",
      "generic_url" : "http://umbbd.msi.umn.edu/",
      "id" : null,
      "fullname" : null,
      "url_syntax" : "http://umbbd.msi.umn.edu/[example_id]/[example_id]_map.html",
      "example_id" : "UM-BBD_pathwayID:acr",
      "database" : "University of Minnesota Biocatalysis/Biodegradation Database",
      "datatype" : null,
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://umbbd.msi.umn.edu/acr/acr_map.html"
   },
   "um-bbd_enzymeid" : {
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://umbbd.msi.umn.edu/servlets/pageservlet?ptype=ep&enzymeID=e0230",
      "example_id" : "UM-BBD_enzymeID:e0413",
      "url_syntax" : "http://umbbd.msi.umn.edu/servlets/pageservlet?ptype=ep&enzymeID=[example_id]",
      "database" : "University of Minnesota Biocatalysis/Biodegradation Database",
      "datatype" : null,
      "id" : null,
      "fullname" : null,
      "object" : "Enzyme identifier",
      "abbreviation" : "UM-BBD_enzymeID",
      "generic_url" : "http://umbbd.msi.umn.edu/"
   },
   "ddanat" : {
      "url_syntax" : null,
      "database" : "Dictyostelium discoideum anatomy",
      "example_id" : "DDANAT:0000068",
      "datatype" : null,
      "name" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "object" : "Identifier",
      "generic_url" : "http://dictybase.org/Dicty_Info/dicty_anatomy_ontology.html",
      "abbreviation" : "DDANAT",
      "local_id_syntax" : "[0-9]{7}",
      "entity_type" : "UBERON:0001062 ! anatomical entity",
      "fullname" : null,
      "id" : null
   },
   "tgd" : {
      "name" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "url_syntax" : null,
      "database" : "Tetrahymena Genome Database",
      "example_id" : null,
      "fullname" : null,
      "id" : null,
      "generic_url" : "http://www.ciliate.org/",
      "abbreviation" : "TGD",
      "object" : null
   },
   "smart" : {
      "abbreviation" : "SMART",
      "generic_url" : "http://smart.embl-heidelberg.de/",
      "object" : "Accession",
      "id" : null,
      "entity_type" : "SO:0000839 ! polypeptide region",
      "fullname" : null,
      "datatype" : null,
      "example_id" : "SMART:SM00005",
      "url_syntax" : "http://smart.embl-heidelberg.de/smart/do_annotation.pl?BLAST=DUMMY&DOMAIN=[example_id]",
      "database" : "Simple Modular Architecture Research Tool",
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://smart.embl-heidelberg.de/smart/do_annotation.pl?BLAST=DUMMY&DOMAIN=SM00005"
   },
   "tigr_cmr" : {
      "object" : "Locus",
      "abbreviation" : "TIGR_CMR",
      "generic_url" : "http://cmr.jcvi.org/",
      "id" : null,
      "entity_type" : "PR:000000001 ! protein",
      "fullname" : null,
      "database" : "Comprehensive Microbial Resource at the J. Craig Venter Institute",
      "example_id" : "JCVI_CMR:VCA0557",
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenePage.cgi?locus=[example_id]",
      "datatype" : null,
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenePage.cgi?locus=VCA0557"
   },
   "kegg_ligand" : {
      "url_syntax" : "http://www.genome.jp/dbget-bin/www_bget?cpd:[example_id]",
      "database" : "KEGG LIGAND Database",
      "example_id" : "KEGG_LIGAND:C00577",
      "datatype" : null,
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://www.genome.jp/dbget-bin/www_bget?cpd:C00577",
      "object" : "Compound",
      "abbreviation" : "KEGG_LIGAND",
      "generic_url" : "http://www.genome.ad.jp/kegg/docs/upd_ligand.html",
      "local_id_syntax" : "^C\\d{5}$",
      "id" : null,
      "fullname" : null,
      "entity_type" : "CHEBI:24431 ! chemical entity"
   },
   "tigr_egad" : {
      "uri_prefix" : null,
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/EgadSearch.cgi?search_string=74462",
      "name" : null,
      "datatype" : null,
      "example_id" : "JCVI_EGAD:74462",
      "database" : "EGAD database at the J. Craig Venter Institute",
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/EgadSearch.cgi?search_string=[example_id]",
      "id" : null,
      "fullname" : null,
      "abbreviation" : "TIGR_EGAD",
      "generic_url" : "http://cmr.jcvi.org/",
      "object" : "Accession"
   },
   "h-invdb_cdna" : {
      "uri_prefix" : null,
      "url_example" : "http://www.h-invitational.jp/hinv/spsoup/transcript_view?acc_id=AK093149",
      "name" : null,
      "datatype" : null,
      "example_id" : "H-invDB_cDNA:AK093148",
      "url_syntax" : "http://www.h-invitational.jp/hinv/spsoup/transcript_view?acc_id=[example_id]",
      "database" : "H-invitational Database",
      "id" : null,
      "fullname" : null,
      "abbreviation" : "H-invDB_cDNA",
      "generic_url" : "http://www.h-invitational.jp/",
      "object" : "Accession"
   },
   "tigr_ath1" : {
      "id" : null,
      "is_obsolete" : "true",
      "fullname" : null,
      "object" : "Accession",
      "abbreviation" : "TIGR_Ath1",
      "generic_url" : "http://www.tigr.org/tdb/e2k1/ath1/ath1.shtml",
      "uri_prefix" : null,
      "name" : null,
      "url_example" : null,
      "example_id" : "JCVI_Ath1:At3g01440",
      "database" : "Arabidopsis thaliana database at the J. Craig Venter Institute",
      "url_syntax" : null,
      "datatype" : null
   },
   "rgdid" : {
      "generic_url" : "http://rgd.mcw.edu/",
      "abbreviation" : "RGDID",
      "object" : "Accession",
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "id" : null,
      "local_id_syntax" : "^[0-9]{4,7}$",
      "datatype" : null,
      "example_id" : "RGD:2004",
      "database" : "Rat Genome Database",
      "url_syntax" : "http://rgd.mcw.edu/generalSearch/RgdSearch.jsp?quickSearch=1&searchKeyword=[example_id]",
      "name" : null,
      "url_example" : "http://rgd.mcw.edu/generalSearch/RgdSearch.jsp?quickSearch=1&searchKeyword=2004",
      "uri_prefix" : null
   },
   "pombase" : {
      "id" : null,
      "entity_type" : "SO:0000704 ! gene ",
      "fullname" : null,
      "local_id_syntax" : "^S\\w+(\\.)?\\w+(\\.)?$",
      "abbreviation" : "PomBase",
      "generic_url" : "http://www.pombase.org/",
      "object" : "Identifier",
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://www.pombase.org/spombe/result/SPBC11B10.09",
      "datatype" : null,
      "url_syntax" : "http://www.pombase.org/spombe/result/[example_id]",
      "example_id" : "PomBase:SPBC11B10.09",
      "database" : "PomBase"
   },
   "ensemblplants" : {
      "abbreviation" : "EnsemblPlants",
      "generic_url" : "http://plants.ensembl.org/",
      "object" : "Identifier",
      "id" : null,
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "datatype" : null,
      "database" : "Ensembl Plants, the Ensembl Genomes database for accessing plant genome data",
      "example_id" : "EnsemblPlants:LOC_Os01g22954",
      "url_syntax" : "http://www.ensemblgenomes.org/id/[example_ID]",
      "uri_prefix" : null,
      "url_example" : "http://www.ensemblgenomes.org/id/LOC_Os01g22954",
      "name" : null
   },
   "ncbi_locus_tag" : {
      "name" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "example_id" : "NCBI_locus_tag:CTN_0547",
      "url_syntax" : null,
      "database" : "NCBI locus tag",
      "fullname" : null,
      "id" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "abbreviation" : "NCBI_locus_tag",
      "object" : "Identifier"
   },
   "tigr_ref" : {
      "fullname" : null,
      "id" : null,
      "object" : "Reference locator",
      "generic_url" : "http://cmr.jcvi.org/",
      "abbreviation" : "TIGR_REF",
      "url_example" : "http://cmr.jcvi.org/CMR/AnnotationSops.shtml",
      "name" : null,
      "uri_prefix" : null,
      "database" : "J. Craig Venter Institute",
      "url_syntax" : null,
      "example_id" : "JCVI_REF:GO_ref",
      "datatype" : null
   },
   "gr_qtl" : {
      "fullname" : null,
      "id" : null,
      "database: Gramene" : "A Comparative Mapping Resource for Grains",
      "generic_url" : "http://www.gramene.org/",
      "abbreviation" : "GR_QTL",
      "object" : "QTL identifier",
      "url_example" : "http://www.gramene.org/db/qtl/qtl_display?qtl_accession_id=CQU7",
      "name" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "url_syntax" : "http://www.gramene.org/db/qtl/qtl_display?qtl_accession_id=[example_id]",
      "database" : null,
      "example_id" : "GR_QTL:CQU7"
   },
   "genedb_pfalciparum" : {
      "example_id" : "GeneDB_Pfalciparum:PFD0755c",
      "url_syntax" : "http://www.genedb.org/genedb/Search?organism=malaria&name=[example_id]",
      "uri_prefix" : null,
      "url_example" : "http://www.genedb.org/genedb/Search?organism=malaria&name=PFD0755c",
      "name" : null,
      "generic_url" : "http://www.genedb.org/genedb/malaria/",
      "object" : "Gene identifier",
      "replaced_by" : "GeneDB",
      "id" : null,
      "fullname" : null,
      "is_obsolete" : "true",
      "datatype" : null,
      "database" : "Plasmodium falciparum GeneDB",
      "abbreviation" : "GeneDB_Pfalciparum",
      "shorthand_name" : "Pfalciparum",
      "local_id_syntax" : "^SP[A-Z0-9]+\\.[A-Za-z0-9]+$"
   },
   "jcvi_medtr" : {
      "fullname" : null,
      "id" : null,
      "generic_url" : "http://medicago.jcvi.org/cgi-bin/medicago/overview.cgi",
      "abbreviation" : "JCVI_Medtr",
      "object" : "Accession",
      "url_example" : "http://medicago.jcvi.org/cgi-bin/medicago/search/shared/ORF_infopage.cgi?orf=Medtr5g024510",
      "name" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "url_syntax" : "http://medicago.jcvi.org/cgi-bin/medicago/search/shared/ORF_infopage.cgi?orf=[example_id]",
      "example_id" : "JCVI_Medtr:Medtr5g024510",
      "database" : "Medicago truncatula genome database at the J. Craig Venter Institute "
   },
   "po" : {
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://www.plantontology.org/amigo/go.cgi?action=query&view=query&search_constraint=terms&query=PO:0009004",
      "url_syntax" : "http://www.plantontology.org/amigo/go.cgi?action=query&view=query&search_constraint=terms&query=PO:[example_id]",
      "example_id" : "PO:0009004",
      "database" : "Plant Ontology Consortium Database",
      "datatype" : null,
      "local_id_syntax" : "^[0-9]{7}$",
      "id" : null,
      "entity_type" : "PO:0009012 ! plant structure development stage ",
      "fullname" : null,
      "object" : "Identifier",
      "abbreviation" : "PO",
      "generic_url" : "http://www.plantontology.org/"
   },
   "doi" : {
      "datatype" : null,
      "url_syntax" : "http://dx.doi.org/DOI:[example_id]",
      "database" : "Digital Object Identifier",
      "example_id" : "DOI:10.1016/S0963-9969(99)00021-6",
      "name" : null,
      "url_example" : "http://dx.doi.org/DOI:10.1016/S0963-9969(99)00021-6",
      "uri_prefix" : null,
      "generic_url" : "http://dx.doi.org/",
      "abbreviation" : "DOI",
      "object" : "Identifier",
      "fullname" : null,
      "id" : null,
      "local_id_syntax" : "^10\\.[0-9]+\\/.*$"
   },
   "seed" : {
      "abbreviation" : "SEED",
      "generic_url" : "http://www.theseed.org",
      "object" : "identifier",
      "id" : null,
      "fullname" : null,
      "description" : "Project to annotate the first 1000 sequenced genomes, develop detailed metabolic reconstructions, and construct the corresponding stoichiometric matrices",
      "datatype" : null,
      "example_id" : "SEED:fig|83331.1.peg.1",
      "url_syntax" : "http://www.theseed.org/linkin.cgi?id=[example_id]",
      "database" : "The SEED;",
      "uri_prefix" : null,
      "url_example" : "http://www.theseed.org/linkin.cgi?id=fig|83331.1.peg.1",
      "name" : null
   },
   "maizegdb" : {
      "url_example" : "http://www.maizegdb.org/cgi-bin/id_search.cgi?id=881225",
      "name" : null,
      "uri_prefix" : null,
      "url_syntax" : "http://www.maizegdb.org/cgi-bin/id_search.cgi?id=[example_id]",
      "example_id" : "MaizeGDB:881225",
      "database" : "MaizeGDB",
      "datatype" : null,
      "fullname" : null,
      "id" : null,
      "object" : "MaizeGDB Object ID Number",
      "generic_url" : "http://www.maizegdb.org",
      "abbreviation" : "MaizeGDB"
   },
   "refgenome" : {
      "object" : null,
      "generic_url" : "http://www.geneontology.org/GO.refgenome.shtml",
      "abbreviation" : "RefGenome",
      "fullname" : null,
      "id" : null,
      "example_id" : null,
      "url_syntax" : null,
      "database" : "GO Reference Genomes",
      "datatype" : null,
      "name" : null,
      "url_example" : null,
      "uri_prefix" : null
   },
   "fma" : {
      "id" : null,
      "fullname" : null,
      "object" : "Identifier",
      "abbreviation" : "FMA",
      "generic_url" : "http://sig.biostr.washington.edu/projects/fm/index.html",
      "uri_prefix" : null,
      "url_example" : null,
      "name" : null,
      "url_syntax" : null,
      "example_id" : "FMA:61905",
      "database" : "Foundational Model of Anatomy",
      "datatype" : null
   },
   "hgnc" : {
      "datatype" : null,
      "url_syntax" : "http://www.genenames.org/data/hgnc_data.php?hgnc_id=HGNC:[example_id]",
      "example_id" : "HGNC:29",
      "database" : "HUGO Gene Nomenclature Committee",
      "name" : null,
      "url_example" : "http://www.genenames.org/data/hgnc_data.php?hgnc_id=HGNC:29",
      "uri_prefix" : null,
      "generic_url" : "http://www.genenames.org/",
      "abbreviation" : "HGNC",
      "object" : "Identifier",
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "id" : null
   },
   "jcvi_ath1" : {
      "id" : null,
      "fullname" : null,
      "is_obsolete" : "true",
      "abbreviation" : "JCVI_Ath1",
      "generic_url" : "http://www.tigr.org/tdb/e2k1/ath1/ath1.shtml",
      "object" : "Accession",
      "uri_prefix" : null,
      "url_example" : null,
      "name" : null,
      "datatype" : null,
      "url_syntax" : null,
      "example_id" : "JCVI_Ath1:At3g01440",
      "database" : "Arabidopsis thaliana database at the J. Craig Venter Institute"
   },
   "biosis" : {
      "uri_prefix" : null,
      "url_example" : null,
      "name" : null,
      "url_syntax" : null,
      "example_id" : "BIOSIS:200200247281",
      "database" : "BIOSIS previews",
      "datatype" : null,
      "id" : null,
      "fullname" : null,
      "object" : "Identifier",
      "abbreviation" : "BIOSIS",
      "generic_url" : "http://www.biosis.org/"
   },
   "prints" : {
      "datatype" : null,
      "example_id" : "PRINTS:PR00025",
      "url_syntax" : "http://www.bioinf.manchester.ac.uk/cgi-bin/dbbrowser/sprint/searchprintss.cgi?display_opts=Prints&category=None&queryform=false&regexpr=off&prints_accn=[example_id]",
      "database" : "PRINTS compendium of protein fingerprints",
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://www.bioinf.manchester.ac.uk/cgi-bin/dbbrowser/sprint/searchprintss.cgi?display_opts=Prints&category=None&queryform=false&regexpr=off&prints_accn=PR00025",
      "abbreviation" : "PRINTS",
      "generic_url" : "http://www.bioinf.manchester.ac.uk/dbbrowser/PRINTS/",
      "object" : "Accession",
      "id" : null,
      "entity_type" : "SO:0000839 ! polypeptide region",
      "fullname" : null
   },
   "tgd_ref" : {
      "uri_prefix" : null,
      "url_example" : "http://db.ciliate.org/cgi-bin/reference/reference.pl?dbid=T000005818",
      "name" : null,
      "datatype" : null,
      "url_syntax" : "http://db.ciliate.org/cgi-bin/reference/reference.pl?dbid=[example_id]",
      "example_id" : "TGD_REF:T000005818",
      "database" : "Tetrahymena Genome Database",
      "id" : null,
      "fullname" : null,
      "abbreviation" : "TGD_REF",
      "generic_url" : "http://www.ciliate.org/",
      "object" : "Literature Reference Identifier"
   },
   "pdb" : {
      "datatype" : null,
      "example_id" : "PDB:1A4U",
      "url_syntax" : "http://www.rcsb.org/pdb/cgi/explore.cgi?pdbId=[example_id]",
      "database" : "Protein Data Bank",
      "url_example" : "http://www.rcsb.org/pdb/cgi/explore.cgi?pdbId=1A4U",
      "name" : null,
      "uri_prefix" : null,
      "generic_url" : "http://www.rcsb.org/pdb/",
      "abbreviation" : "PDB",
      "object" : "Identifier",
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein",
      "id" : null,
      "local_id_syntax" : "^[A-Za-z0-9]{4}$"
   },
   "wbphenotype" : {
      "datatype" : null,
      "example_id" : "WBPhenotype:0002117",
      "url_syntax" : "http://www.wormbase.org/species/c_elegans/phenotype/WBPhenotype:[example_id]",
      "database" : "WormBase phenotype ontology",
      "name" : null,
      "url_example" : "http://www.wormbase.org/species/c_elegans/phenotype/WBPhenotype:0000154",
      "uri_prefix" : null,
      "generic_url" : "http://www.wormbase.org/",
      "abbreviation" : "WBPhenotype",
      "object" : "Gene identifier",
      "fullname" : null,
      "entity_type" : "PATO:0000001 ! Quality",
      "id" : null,
      "local_id_syntax" : "^[0-9]{7}$"
   },
   "eco" : {
      "object" : "Identifier",
      "generic_url" : "http://www.geneontology.org/",
      "abbreviation" : "ECO",
      "local_id_syntax" : "^\\d{7}$",
      "fullname" : null,
      "id" : null,
      "example_id" : "ECO:0000002",
      "url_syntax" : null,
      "database" : "Evidence Code ontology",
      "datatype" : null,
      "url_example" : null,
      "name" : null,
      "uri_prefix" : null
   },
   "multifun" : {
      "datatype" : null,
      "database" : "MultiFun cell function assignment schema",
      "url_syntax" : null,
      "example_id" : null,
      "url_example" : null,
      "name" : null,
      "uri_prefix" : null,
      "generic_url" : "http://genprotec.mbl.edu/files/MultiFun.html",
      "abbreviation" : "MultiFun",
      "object" : null,
      "fullname" : null,
      "id" : null
   },
   "pr" : {
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://www.proconsortium.org/cgi-bin/pro/entry_pro?id=PR:000025380",
      "url_syntax" : "http://www.proconsortium.org/cgi-bin/pro/entry_pro?id=PR:[example_id]",
      "example_id" : "PR:000025380",
      "database" : "Protein Ontology",
      "datatype" : null,
      "local_id_syntax" : "^[0-9]{9}$",
      "id" : null,
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein ",
      "object" : "Identifer",
      "abbreviation" : "PR",
      "generic_url" : "http://www.proconsortium.org/pro/pro.shtml"
   },
   "genedb_gmorsitans" : {
      "url_syntax" : "http://www.genedb.org/genedb/Search?organism=glossina&name=[example_id]",
      "example_id" : "GeneDB_Gmorsitans:Gmm-0142",
      "database" : "Glossina morsitans GeneDB",
      "datatype" : null,
      "name" : null,
      "url_example" : "http://www.genedb.org/genedb/Search?organism=glossina&name=Gmm-0142",
      "uri_prefix" : null,
      "object" : "Gene identifier",
      "generic_url" : "http://www.genedb.org/genedb/glossina/",
      "abbreviation" : "GeneDB_Gmorsitans",
      "fullname" : null,
      "is_obsolete" : "true",
      "id" : null,
      "replaced_by" : "GeneDB",
      "shorthand_name" : "Tsetse"
   },
   "yeastfunc" : {
      "database" : "Yeast Function",
      "url_syntax" : null,
      "example_id" : null,
      "datatype" : null,
      "name" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "object" : null,
      "generic_url" : "http://func.med.harvard.edu/yeast/",
      "abbreviation" : "YeastFunc",
      "fullname" : null,
      "id" : null
   },
   "broad_neurospora" : {
      "object" : "Identifier for Broad_Ncrassa Loci",
      "abbreviation" : "Broad_NEUROSPORA",
      "generic_url" : "http://www.broadinstitute.org/annotation/genome/neurospora/MultiHome.html",
      "description" : "Neurospora crassa database at the Broad Institute",
      "id" : null,
      "fullname" : null,
      "url_syntax" : "http://www.broadinstitute.org/annotation/genome/neurospora/GeneDetails.html?sp=S[example_id]",
      "example_id" : "BROAD_NEUROSPORA:7000007580576824",
      "database" : "Neurospora crassa Database",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.broadinstitute.org/annotation/genome/neurospora/GeneDetails.html?sp=S7000007580576824",
      "name" : null
   },
   "prosite" : {
      "entity_type" : "SO:0000839 ! polypeptide region",
      "fullname" : null,
      "id" : null,
      "generic_url" : "http://www.expasy.ch/prosite/",
      "abbreviation" : "Prosite",
      "object" : "Accession",
      "name" : null,
      "url_example" : "http://www.expasy.ch/cgi-bin/prosite-search-ac?PS00365",
      "uri_prefix" : null,
      "datatype" : null,
      "example_id" : "Prosite:PS00365",
      "url_syntax" : "http://www.expasy.ch/cgi-bin/prosite-search-ac?[example_id]",
      "database" : "Prosite database of protein families and domains"
   },
   "obo_sf_po" : {
      "example_id" : "OBO_SF_PO:3184921",
      "url_syntax" : "https://sourceforge.net/tracker/index.php?func=detail&aid=[example_id]&group_id=76834&atid=835555",
      "database" : "Source Forge OBO Plant Ontology (PO) term request tracker",
      "datatype" : null,
      "url_example" : "https://sourceforge.net/tracker/index.php?func=detail&aid=3184921&group_id=76834&atid=835555",
      "name" : null,
      "uri_prefix" : null,
      "object" : "Term request",
      "generic_url" : "http://sourceforge.net/tracker/?func=browse&group_id=76834&atid=835555",
      "abbreviation" : "OBO_SF_PO",
      "fullname" : null,
      "id" : null
   },
   "ipi" : {
      "fullname" : null,
      "id" : null,
      "generic_url" : "http://www.ebi.ac.uk/IPI/IPIhelp.html",
      "abbreviation" : "IPI",
      "object" : "Identifier",
      "url_example" : null,
      "name" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "example_id" : "IPI:IPI00000005.1",
      "url_syntax" : null,
      "database" : "International Protein Index"
   },
   "cdd" : {
      "id" : null,
      "fullname" : null,
      "abbreviation" : "CDD",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?db=cdd",
      "object" : "Identifier",
      "uri_prefix" : null,
      "name" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/Structure/cdd/cddsrv.cgi?uid=34222",
      "datatype" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/Structure/cdd/cddsrv.cgi?uid=[example_id]",
      "example_id" : "CDD:34222",
      "database" : "Conserved Domain Database at NCBI"
   },
   "jcvi" : {
      "object" : null,
      "abbreviation" : "JCVI",
      "generic_url" : "http://www.jcvi.org/",
      "id" : null,
      "fullname" : null,
      "url_syntax" : null,
      "example_id" : null,
      "database" : "J. Craig Venter Institute",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : null,
      "name" : null
   },
   "nasc_code" : {
      "datatype" : null,
      "url_syntax" : "http://seeds.nottingham.ac.uk/NASC/stockatidb.lasso?code=[example_id]",
      "example_id" : "NASC_code:N3371",
      "database" : "Nottingham Arabidopsis Stock Centre Seeds Database",
      "url_example" : "http://seeds.nottingham.ac.uk/NASC/stockatidb.lasso?code=N3371",
      "name" : null,
      "uri_prefix" : null,
      "generic_url" : "http://arabidopsis.info",
      "abbreviation" : "NASC_code",
      "object" : "NASC code Identifier",
      "fullname" : null,
      "id" : null
   },
   "pro" : {
      "database" : "Protein Ontology",
      "example_id" : "PR:000025380",
      "url_syntax" : "http://www.proconsortium.org/cgi-bin/pro/entry_pro?id=PR:[example_id]",
      "datatype" : null,
      "name" : null,
      "url_example" : "http://www.proconsortium.org/cgi-bin/pro/entry_pro?id=PR:000025380",
      "uri_prefix" : null,
      "object" : "Identifer",
      "generic_url" : "http://www.proconsortium.org/pro/pro.shtml",
      "abbreviation" : "PRO",
      "local_id_syntax" : "^[0-9]{9}$",
      "entity_type" : "PR:000000001 ! protein ",
      "fullname" : null,
      "id" : null
   },
   "ma" : {
      "fullname" : null,
      "id" : null,
      "description" : "Adult Mouse Anatomical Dictionary; part of Gene Expression Database",
      "generic_url" : "http://www.informatics.jax.org/",
      "abbreviation" : "MA",
      "object" : "Identifier",
      "url_example" : "http://www.informatics.jax.org/searches/AMA.cgi?id=MA:0000003",
      "name" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "example_id" : "MA:0000003",
      "url_syntax" : "http://www.informatics.jax.org/searches/AMA.cgi?id=MA:[example_id]",
      "database" : "Adult Mouse Anatomical Dictionary"
   },
   "pir" : {
      "datatype" : null,
      "url_syntax" : "http://pir.georgetown.edu/cgi-bin/pirwww/nbrfget?uid=[example_id]",
      "example_id" : "PIR:I49499",
      "database" : "Protein Information Resource",
      "name" : null,
      "url_example" : "http://pir.georgetown.edu/cgi-bin/pirwww/nbrfget?uid=I49499",
      "uri_prefix" : null,
      "generic_url" : "http://pir.georgetown.edu/",
      "abbreviation" : "PIR",
      "object" : "Accession",
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein",
      "id" : null,
      "local_id_syntax" : "^[A-Z]{1}[0-9]{5}$"
   },
   "dbsnp" : {
      "fullname" : null,
      "id" : null,
      "local_id_syntax" : "^\\d+$",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/projects/SNP",
      "abbreviation" : "dbSNP",
      "object" : "Identifier",
      "url_example" : "http://www.ncbi.nlm.nih.gov/projects/SNP/snp_ref.cgi?rs=rs3131969",
      "name" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/projects/SNP/snp_ref.cgi?rs=[example_id]",
      "example_id" : "dbSNP:rs3131969",
      "database" : "NCBI dbSNP"
   },
   "poc" : {
      "id" : null,
      "fullname" : null,
      "abbreviation" : "POC",
      "generic_url" : "http://www.plantontology.org/",
      "object" : null,
      "uri_prefix" : null,
      "url_example" : null,
      "name" : null,
      "datatype" : null,
      "url_syntax" : null,
      "example_id" : null,
      "database" : "Plant Ontology Consortium"
   },
   "mips_funcat" : {
      "object" : "Identifier",
      "generic_url" : "http://mips.gsf.de/proj/funcatDB/",
      "abbreviation" : "MIPS_funcat",
      "fullname" : null,
      "id" : null,
      "example_id" : "MIPS_funcat:11.02",
      "url_syntax" : "http://mips.gsf.de/cgi-bin/proj/funcatDB/search_advanced.pl?action=2&wert=[example_id]",
      "database" : "MIPS Functional Catalogue",
      "datatype" : null,
      "url_example" : "http://mips.gsf.de/cgi-bin/proj/funcatDB/search_advanced.pl?action=2&wert=11.02",
      "name" : null,
      "uri_prefix" : null
   },
   "parkinsonsuk-ucl" : {
      "object" : null,
      "generic_url" : "http://www.ucl.ac.uk/cardiovasculargeneontology",
      "abbreviation" : "ParkinsonsUK-UCL",
      "fullname" : null,
      "id" : null,
      "example_id" : null,
      "url_syntax" : null,
      "database" : "Parkinsons Disease Gene Ontology Initiative",
      "datatype" : null,
      "name" : null,
      "url_example" : null,
      "uri_prefix" : null
   },
   "asap" : {
      "name" : null,
      "url_example" : "https://asap.ahabs.wisc.edu/annotation/php/feature_info.php?FeatureID=ABE-0000008",
      "uri_prefix" : null,
      "url_syntax" : "https://asap.ahabs.wisc.edu/annotation/php/feature_info.php?FeatureID=[example_id]",
      "example_id" : "ASAP:ABE-0000008",
      "database" : "A Systematic Annotation Package for Community Analysis of Genomes",
      "datatype" : null,
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "id" : null,
      "object" : "Feature identifier",
      "generic_url" : "https://asap.ahabs.wisc.edu/annotation/php/ASAP1.htm",
      "abbreviation" : "ASAP"
   },
   "cgd_locus" : {
      "uri_prefix" : null,
      "url_example" : "http://www.candidagenome.org/cgi-bin/locus.pl?locus=HWP1",
      "name" : null,
      "example_id" : "CGD_LOCUS:HWP1",
      "url_syntax" : "http://www.candidagenome.org/cgi-bin/locus.pl?locus=[example_id]",
      "database" : "Candida Genome Database",
      "datatype" : null,
      "id" : null,
      "fullname" : null,
      "object" : "Gene name (gene symbol in mammalian nomenclature)",
      "abbreviation" : "CGD_LOCUS",
      "generic_url" : "http://www.candidagenome.org/"
   },
   "apidb_plasmodb" : {
      "example_id" : "ApiDB_PlasmoDB:PF11_0344",
      "url_syntax" : "http://www.plasmodb.org/gene/[example_id]",
      "database" : "PlasmoDB Plasmodium Genome Resource",
      "datatype" : null,
      "url_example" : "http://www.plasmodb.org/gene/PF11_0344",
      "name" : null,
      "uri_prefix" : null,
      "object" : "PlasmoDB Gene ID",
      "generic_url" : "http://plasmodb.org/",
      "abbreviation" : "ApiDB_PlasmoDB",
      "fullname" : null,
      "id" : null
   },
   "sgd_ref" : {
      "url_example" : "http://db.yeastgenome.org/cgi-bin/reference/reference.pl?dbid=S000049602",
      "name" : null,
      "uri_prefix" : null,
      "example_id" : "SGD_REF:S000049602",
      "url_syntax" : "http://db.yeastgenome.org/cgi-bin/reference/reference.pl?dbid=[example_id]",
      "database" : "Saccharomyces Genome Database",
      "datatype" : null,
      "fullname" : null,
      "id" : null,
      "object" : "Literature Reference Identifier",
      "generic_url" : "http://www.yeastgenome.org/",
      "abbreviation" : "SGD_REF"
   }
};
/* 
 * Package: dispatch.js
 * 
 * Namespace: amigo.data.dispatch
 * 
 * This package was automatically created during an AmiGO 2 installation
 * from the YAML configuration files that AmiGO pulls in.
 *
 * The mapping file for data fields and contexts to functions, often
 * used for displays. See the package <handler.js> for the API to interact
 * with this data file.
 *
 * NOTE: This file is generated dynamically at installation time.
 * Hard to work with unit tests--hope it's not too bad. You have to
 * occasionally copy back to keep the unit tests sane.
 *
 * NOTE: This file has a slightly different latout from the YAML
 * configuration file.
 */

// All of the server/instance-specific meta-data.
if ( typeof amigo == "undefined" ){ var amigo = {}; }
if ( typeof amigo.data == "undefined" ){ amigo.data = {}; }

/*
 * Variable: dispatch
 * 
 * The configuration for the data.
 * Essentially a JSONification of the YAML file.
 * This should be consumed directly by <amigo.handler>.
 */
amigo.data.dispatch = {
   "annotation_extension_json" : {
      "context" : {
         "bbop.widgets.search_pane" : "amigo.handlers.owl_class_expression"
      }
   }
};
/*
 * Package: context.js
 * 
 * Namespace: amigo.data.context
 * 
 * Another context.
 */

// Module and namespace checking.
if ( typeof amigo == "undefined" ){ var amigo = {}; }
if ( typeof amigo.data == "undefined" ){ amigo.data = {}; }

/*
 * Variable: context
 * 
 * Colors are X11: http://cng.seas.rochester.edu/CNG/docs/x11color.html
 */
amigo.data.context = {
    'instance_of':
    {
	readable: 'activity',
	priority: 8,
	aliases: [
	    'activity'
	],
	color: '#FFFAFA' // snow
    },
    'BFO:0000050':
    {
	readable: 'part of',
	priority: 15,
	aliases: [
		//'http://purl.obolibrary.org/obo/BFO_0000050',
		//'http://purl.obolibrary.org/obo/part_of',
	    'BFO_0000050',
	    'part:of',
	    'part of',
	    'part_of'
	],
	color: '#add8e6' // light blue
    },
    'BFO:0000051':
    {
	readable: 'has part',
	priority: 4,
	aliases: [
		//'http://purl.obolibrary.org/obo/BFO_0000051',
	    'has:part',
	    'has part',
	    'has_part'
	],
	color: '#6495ED' // cornflower blue
    },
    'BFO:0000066':
    {
	readable: 'occurs in',
	priority: 12,
	aliases: [
		//'http://purl.obolibrary.org/obo/BFO_0000066',
		//'BFO_0000066',
	    'occurs:in',
	    'occurs in',
	    'occurs_in'
	],
	color: '#66CDAA' // medium aquamarine
    },
    'RO:0002202':
    {
	readable: 'develops from',
	priority: 0,
	aliases: [
	    'develops:from',
	    'develops from',
	    'develops_from'
	],
	color: '#A52A2A' // brown
    },
    'RO:0002211':
    {
	readable: 'regulates',
	priority: 16,
	aliases: [
		//'http://purl.obolibrary.org/obo/RO_0002211'
	    'regulates'
	],
	color: '#2F4F4F' // dark slate grey
    },
    'RO:0002212':
    {
	readable: 'negatively regulates',
	priority: 17,
	aliases: [
		//'http://purl.obolibrary.org/obo/RO_0002212'
	    'negatively:regulates',
	    'negatively regulates',
	    'negatively_regulates'
	],
	glyph: 'bar',
	color: '#FF0000' // red
    },
    'RO:0002213':
    {
	readable: 'positively regulates',
	priority: 18,
	aliases: [
		//'http://purl.obolibrary.org/obo/RO_0002213'
	    'positively:regulates',
	    'positively regulates',
	    'positively_regulates'
	],
	glyph: 'arrow',
	color: '#008000' //green
    },
    'RO:0002233':
    {
	readable: 'has input',
	priority: 14,
	aliases: [
		//'http://purl.obolibrary.org/obo/BFO_0000051',
	    'has:input',
	    'has input',
	    'has_input'
	],
	color: '#6495ED' // cornflower blue
    },
    'RO:0002234':
    {
	readable: 'has output',
	priority: 0,
	aliases: [
	    'has:output',
	    'has output',
	    'has_output'
	],
	color: '#ED6495' // ??? - random
    },
    'RO:0002330':
    {
	readable: 'genomically related to',
	priority: 0,
	aliases: [
	    'genomically related to',
	    'genomically_related_to'
	],
	color: '#9932CC' // darkorchid
    },
    'RO:0002331':
    {
	readable: 'involved in',
	priority: 3,
	aliases: [
	    'involved:in',
	    'involved in',
	    'involved_in'
	],
	color: '#E9967A' // darksalmon
    },
    'RO:0002332':
    {
	readable: 'regulates level of',
	priority: 0,
	aliases: [
	    'regulates level of',
	    'regulates_level_of'
	],
	color: '#556B2F' // darkolivegreen
    },
    'RO:0002333':
    {
	readable: 'enabled by',
	priority: 13,
	aliases: [
	    'RO_0002333',
	    'enabled:by',
	    'enabled by',
	    'enabled_by'
	],
	color: '#B8860B' // darkgoldenrod
    },
    'RO:0002334':
    {
	readable: 'regulated by',
	priority: 0,
	aliases: [
	    'RO_0002334',
	    'regulated by',
	    'regulated_by'
	],
	color: '#86B80B' // ??? - random
    },
    'RO:0002335':
    {
	readable: 'negatively regulated by',
	priority: 0,
	aliases: [
	    'RO_0002335',
	    'negatively regulated by',
	    'negatively_regulated_by'
	],
	color: '#0B86BB' // ??? - random
    },
    'RO:0002336':
    {
	readable: 'positively regulated by',
	priority: 0,
	aliases: [
	    'RO_0002336',
	    'positively regulated by',
	    'positively_regulated_by'
	],
	color: '#BB0B86' // ??? - random
    },
    'activates':
    {
	readable: 'activates',
	priority: 0,
	aliases: [
	    'http://purl.obolibrary.org/obo/activates'
	],
	//glyph: 'arrow',
	//glyph: 'diamond',
	//glyph: 'wedge',
	//glyph: 'bar',
	color: '#8FBC8F' // darkseagreen
    },
    'RO:0002404':
    {
	readable: 'causally downstream of',
	priority: 2,
	aliases: [
	    'causally_downstream_of'
	],
	color: '#FF1493' // deeppink
    },
    'RO:0002406':
    {
	readable: 'directly activates',
	priority: 20,
	aliases: [
		//'http://purl.obolibrary.org/obo/directly_activates',
	    'directly:activates',
	    'directly activates',
	    'directly_activates'
	],
	glyph: 'arrow',
	color: '#2F4F4F' // darkslategray
    },
    'upstream_of':
    {
	readable: 'upstream of',
	priority: 2,
	aliases: [
		//'http://purl.obolibrary.org/obo/upstream_of'
	    'upstream:of',
	    'upstream of',
	    'upstream_of'
	],
	color: '#FF1493' // deeppink
    },
    'RO:0002408':
    {
	readable: 'directly inhibits',
	priority: 19,
	aliases: [
		//'http://purl.obolibrary.org/obo/directly_inhibits'
	    'directly:inhibits',
	    'directly inhibits',
	    'directly_inhibits'
	],
	glyph: 'bar',
	color: '#7FFF00' // chartreuse
    },
    'RO:0002411':
    {
	readable: 'causally upstream of',
	priority: 2,
	aliases: [
	    'causally_upstream_of'
	],
	color: '#483D8B' // darkslateblue
    },
    'indirectly_disables_action_of':
    {
	readable: 'indirectly disables action of',
	priority: 0,
	aliases: [
		//'http://purl.obolibrary.org/obo/indirectly_disables_action_of'
	    'indirectly disables action of',
	    'indirectly_disables_action_of'
	],
	color: '#483D8B' // darkslateblue
    },
    'provides_input_for':
    {
	readable: 'provides input for',
	priority: 0,
	aliases: [
	    'GOREL_provides_input_for',
	    'http://purl.obolibrary.org/obo/GOREL_provides_input_for'
	],
	color: '#483D8B' // darkslateblue
    },
    'RO:0002413':
    {
	readable: 'directly provides input for',
	priority: 1,
	aliases: [
	    'directly_provides_input_for',
	    'GOREL_directly_provides_input_for',
	    'http://purl.obolibrary.org/obo/GOREL_directly_provides_input_for'
	],
	glyph: 'diamond',
	color: '#483D8B' // darkslateblue
    },
    // New ones for monarch.
    'subclass_of':
    {
	readable: 'subclass of',
	priority: 100,
	aliases: [
	    'SUBCLASS_OF'
	],
	glyph: 'diamond',
	color: '#E9967A' // darksalmon
    },
    'superclass_of':
    {
	readable: 'superclass of',
	priority: 100,
	aliases: [
	    'SUPERCLASS_OF'
	],
	glyph: 'diamond',
	color: '#556B2F' // darkolivegreen
    },
    'annotation':
    {
	readable: 'annotation',
	priority: 100,
	aliases: [
	    'ANNOTATION'
	],
	glyph: 'diamond',
	color: '#483D8B' // darkslateblue
    }
};
/*
 * Package: statistics.js
 * 
 * Namespace: amigo.data.statistics
 * 
 * This package was automatically created during an AmiGO 2 installation.
 * 
 * Purpose: Useful numbers about the current data in the store.
 * 
 * Requirements: amigo2.js for bbop.amigo namespace.
 * 
 * NOTE: This file is generated dynamically at installation time.
 *       Hard to work with unit tests--hope it's not too bad.
 *       Want to keep this real simple.
 */

// Module and namespace checking.
if ( typeof amigo == "undefined" ){ var amigo = {}; }
if ( typeof amigo.data == "undefined" ){ amigo.data = {}; }
if ( typeof amigo.data.statistics == "undefined" ){ amigo.data.statistics = {}; }

/*
 * Variable: annotation_evidence
 * 
 * TBD
 */
amigo.data.statistics.annotation_source = [["MGI", 143898], ["UniProtKB", 131680], ["ZFIN", 88093], ["WB", 68439], ["TAIR", 68319], ["SGD", 44070], ["PomBase", 38714], ["RGD", 23674], ["dictyBase", 20561], ["InterPro", 12251], ["TIGR", 11229], ["RefGenome", 7252], ["GOC", 6282], ["BHF-UCL", 4758], ["IntAct", 2036], ["HGNC", 532], ["UniPathway", 499], ["DFLAT", 311], ["PINC", 18], ["Roslin_Institute", 10], ["ENSEMBL", 5], ["Reactome", 3]];

/*
 * Variable: annotation_source
 * 
 * TBD
 */
amigo.data.statistics.annotation_evidence = [["experimental evidence", 192016], ["similarity evidence", 132787], ["curator inference", 68788], ["combinatorial evidence", 15414], ["author statement", 11503]];

/*
 * Variable: annotation_overview
 * 
 * TBD
 */
amigo.data.statistics.annotation_overview = [["Source", "similarity evidence", "experimental evidence", "curator inference", "author statement", "combinatorial evidence", "genomic context evidence", "biological system reconstruction", "imported information"], ["dictyBase", 9289, 4311, 6478, 483, 0, 0, 0, 0], ["EcoCyc", 0, 0, 0, 0, 0, 0, 0, 0], ["FlyBase", 0, 0, 0, 0, 0, 0, 0, 0], ["MGI", 53520, 55284, 32957, 2002, 135, 0, 0, 0], ["PomBase", 10204, 16257, 3661, 2286, 511, 0, 0, 0], ["RGD", 23674, 0, 0, 0, 0, 0, 0, 0], ["SGD", 3396, 33774, 4578, 2321, 1, 0, 0, 0], ["TAIR", 11078, 16661, 6626, 1663, 14752, 0, 0, 0], ["WB", 861, 33166, 60, 144, 1, 0, 0, 0], ["ZFIN", 507, 10672, 10946, 127, 0, 0, 0, 0]];
/*
 * Package: rollup.js
 * 
 * Namespace: amigo.ui.rollup
 * 
 * BBOP method to roll an information are up to save real estate.
 * This requires jQuery and an HTML format like:
 * 
 * : <div id="ID_TEXT" class="SOME_CLASS_FOR_YOUR_STYLING">
 * :  <span class="ANOTHERONE">ANCHOR_TEXT<a href="#"><img src="?" /></span></a>
 * :  <div>
 * :   ABC
 * :  </div>
 * : </div>
 * 
 * Usage would then simply be:
 * 
 * : amigo.ui.rollup(['ID_TEXT']);
 * 
 * As a note, for AmiGO 2, his is handled by the common templates
 * info_rollup_start.tmpl and info_rollup_end.tmpl in the amigo git
 * repo. Usage would be like:
 * 
 * : [% rollup_id = "ID_TEXT" %]
 * : [% rollup_anchor = "ANCHOR_TEXT" %]
 * : [% INCLUDE "common/info_rollup_start.tmpl" %]
 * : ABC
 * : [% INCLUDE "common/info_rollup_end.tmpl" %]
 * 
 * Again, this is a method, not an object constructor.
 */

// Module and namespace checking.
if ( typeof amigo == "undefined" ){ var amigo = {}; }
if ( typeof amigo.ui == "undefined" ){ amigo.ui = {}; }

/*
 * Method: rollup
 * 
 * See top-level for details.
 * 
 * Arguments:
 *  elt_ids - a list if element ids of the areas to roll up
 * 
 * Returns:
 *  n/a
 */
amigo.ui.rollup = function(elt_ids){

    var each = bbop.core.each;
    each(elt_ids,
    	 function(eltid){
	     var eheader = '#' + eltid + ' > div';
	     var earea = '#' + eltid + ' > span > a';
	     jQuery(eheader).hide();
    	     var click_elt =
		 jQuery(earea).click(function(){
					 jQuery(eheader).toggle("blind",{},250);
					 return false;
				     });
	 });
};

// If it looks like we're in an environment that supports CommonJS
// Modules 1.0, take the amigo namespace whole and export it. Otherwise
// (browser environment, etc.), take no action and depend on the
// global namespace.
if( typeof(exports) != 'undefined' ){

    // Old style--exporting separate namespace.
    exports.amigo = amigo;

    // New, better, style--assemble; these should not collide.
    bbop.core.each(amigo, function(k, v){
	exports[k] = v;
    });
}
