/* eslint space-unary-ops: 0 */
/* eslint no-redeclare: 0 */
/* eslint no-eval: 0 */

/*
 * Package: browse.js
 *
 * Namespace: monarch.widget.browse
 *
 * BBOP object to draw various UI elements that have to do with
 * autocompletion.
 *
 * This is a completely self-contained UI and manager.
 */


function InitMonarchBBOPWidgetDisplay() {


/*
 * Package: results_table_by_class_conf_bs3.js
 *
 * Namespace: bbop.widget.display.results_table_by_class_conf_bs3
 *
 * Subclass of <bbop.html.tag>.
 */

if ( typeof bbop.monarch.widget.display == "undefined" ){ bbop.monarch.widget.display = {}; }

/*
 * Function: results_table_by_class_conf_bs3
 *
 * Using a conf class and a set of data, automatically populate and
 * return a results table.
 *
 * This is the Bootstrap 3 version of this display. It affixes itself
 * directly to the DOM using jQuery at elt_id.
 *
 * Parameters:
 *  class_conf - a <bbop.golr.conf_class>
 *  golr_resp - a <bbop.golr.response>
 *  linker - a linker object; see <amigo.linker> for more details
 *  handler - a handler object; see <amigo.handler> for more details
 *  elt_id - the element id to attach it to
 *  selectable_p - *[optional]* whether to create checkboxes (default true)
 *
 * Returns:
 *  this object
 *
 * See Also:
 *  <bbop.widget.display.results_table_by_class>
 */
bbop.monarch.widget.display.results_table_by_class_conf_bs3 = function(cclass,
                    golr_resp,
                    linker,
                    handler,
                    elt_id,
                    selectable_p,
                    select_toggle_id,
                    select_item_name){
    // console.log('rtbccb:',
    //   handler.query_field,
    //   golr_resp,
    //   cclass.display_name(),
    //   cclass.document_category(),
    //   cclass.id(),
    //   cclass.description(),
    //   cclass.display_name(),
    //   selectable_p, select_toggle_id, select_item_name);

    var anchor = this;

    // Temp logger.
    var logger = new bbop.logger();
    logger.DEBUG = true;
    //logger.DEBUG = false;
    function ll(str){ logger.kvetch('RTBCCBS3: ' + str); }

    // Tie important things down for cell rendering prototype.
    anchor._golr_response = golr_resp;
    anchor._linker = linker;
    anchor._handler = handler;

    // Conveience aliases.
    var each = bbop.core.each;
    var is_defined = bbop.core.is_defined;

    // The context we'll deliver to
    var display_context = 'bbop.widgets.search_pane';

    // Only want to compile once.
    var ea_regexp = new RegExp("\<\/a\>", "i"); // detect an <a>
    var br_regexp = new RegExp("\<br\ \/\>", "i"); // detect a <br />
    var sp_regexp = new RegExp("\&nbsp\;", "i"); // detect a &nbsp;
    var img_regexp = new RegExp("\<img", "i"); // detect a <img

    // // Sort out whether we want to display checkboxes. Also, give life
    // // to the necessary variables if they will be called upon.
    // var select_toggle_id = null;
    // var select_item_name = null;
    // if( is_defined(selectable_p) && selectable_p == true ){

    // }

    // Now take what we have, and wrap around some expansion code
    // if it looks like it is too long.
    var trim_hash = {};
    var trimit = 100;
    function _trim_and_store( in_str ){

  var retval = in_str;

  //ll("T&S: " + in_str);

  // Skip if it is too short.
  //if( ! ea_regexp.test(retval) && retval.length > (trimit + 50) ){
  if( retval.length > (trimit + 50) ){
      //ll("T&S: too long: " + retval);

      // Let there be tests.
      var list_p = br_regexp.test(retval);
      var anchors_p = ea_regexp.test(retval);
      var space_p = sp_regexp.test(retval);

      var tease = null;
      if( ! anchors_p && ! list_p && ! space_p){
    // A normal string then...trim it!
    //ll("\tT&S: easy normal text, go nuts!");
    tease = new bbop.html.span(bbop.core.crop(retval, trimit, ''),
             {'generate_id': true});
      }else if( anchors_p && ! list_p ){
    // It looks like it is a link without a break, so not
    // a list. We cannot trim this safely.
    //ll("\tT&S: single link so cannot work on!");
      }else{
    //ll("\tT&S: we have a list to deal with");

    var new_str_list = retval.split(br_regexp);
    if( new_str_list.length <= 3 ){
        // Let's just ignore lists that are only three
        // items.
        //ll("\tT&S: pass thru list length <= 3");
    }else{
        //ll("\tT&S: contruct into 2 plus tag");
        var new_str = '';
        new_str = new_str + new_str_list.shift();
        new_str = new_str + '<br />';
        new_str = new_str + new_str_list.shift();
        tease = new bbop.html.span(new_str, {'generate_id': true});
    }
      }

      // If we have a tease, assemble the rest of the packet
      // to create the UI.
      if( tease ){
    // Setup the text for tease and full versions.
    function bgen(lbl, dsc){
        var b = new bbop.html.button(
        lbl,
      {
          'generate_id': true,
          'type': 'button',
          'title': dsc || lbl,
          //'class': 'btn btn-default btn-xs'
          'class': 'btn btn-primary btn-xs'
      });
        return b;
    }
    var more_b = new bgen('more...', 'Display the complete list');
    var full = new bbop.html.span(retval,
                {'generate_id': true});
    var less_b = new bgen('less', 'Display the truncated list');

    // Store the different parts for later activation.
    var tease_id = tease.get_id();
    var more_b_id = more_b.get_id();
    var full_id = full.get_id();
    var less_b_id = less_b.get_id();
    trim_hash[tease_id] =
        [tease_id, more_b_id, full_id, less_b_id];

    // New final string.
    retval = tease.to_string() + " " +
        more_b.to_string() + " " +
        full.to_string() + " " +
        less_b.to_string();
      }
  }

  return retval;
    }

    // Create a locally mangled checkbox.
    function _create_select_box(val, id, name){
  if( ! is_defined(name) ){
      name = select_item_name;
  }

  var input_attrs = {
      'value': val,
      'name': name,
      'type': 'checkbox'
  };
  if( is_defined(id) ){
      input_attrs['id'] = id;
  }
  var input = new bbop.html.input(input_attrs);
  return input;
    }

    ///
    /// Render the headers.
    ///

    // Start with score, and add the others by order of the class
    // results_weights field.
    // var headers = ['score'];
    // var headers_display = ['Score'];
    var headers = [];
    var headers_display = [];
    if( selectable_p ){
  // Hint for later.
  headers.push(select_toggle_id);

  // Header select for selecting all.
  var hinp = _create_select_box('', select_toggle_id, '');
  //headers_display.push('All ' + hinp.to_string());
  headers_display.push(hinp.to_string());
    }
    var results_order = cclass.field_order_by_weight('result');
    var headerColumns = [];
    var skipFields = [];
    var hideRedundantFields = true;
    if (hideRedundantFields && handler.is_leaf) {
        skipFields = ['subject', 'subject_taxon', 'subject_gene']; // , 'subject_taxon'
        if (handler.query_field === 'object_closure') {
          skipFields = ['object', 'object_taxon']; // , 'object_taxon'
        }
    }

    var prunedRO = [];
    for (var ro = 0; ro < results_order.length; ++ro) {
      var fid = results_order[ro];
      if (skipFields.indexOf(fid) >= 0) {
        // console.log('skip[' + ro + ']', fid);
      }
      else {
        prunedRO.push(fid);
      }
    }
    results_order = prunedRO;
    each(results_order,
   function(fid){
      // Store the raw headers/fid for future use.
      headers.push(fid);
      // Get the headers into a presentable state.
      var field = cclass.get_field(fid);
      if( ! field ){ throw new Error('conf error: not found:' + fid); }
      //headers_display.push(field.display_name());
      var fdname = field.display_name();
      var fdesc = field.description() || '???';
      var head_column_id = 'TH-' + elt_id + '-' + fdname;
      var head_span_attrs = {
        // TODO/NOTE: to make the tooltip work properly, since the
        // table headers are being created each time,
        // the tooltop initiator would have to be called after
        // each pass...I don't know that I want to do that.
        //'class': 'bbop-js-ui-hoverable bbop-js-ui-tooltip',
        'class': 'bbop-js-ui-hoverable',
        'title': fdesc,
        'id': head_column_id
      };

      var filterAreaSelector = '#' + elt_id + '-filter-area';
      var filterArea = jQuery(filterAreaSelector);

      var addMenuButton = filterArea.length > 0 && (fid === 'subject_taxon');
      if (addMenuButton) {
        head_span_attrs.class += ' ';
        head_span_attrs['data-toggle'] = 'collapse';
        head_span_attrs['data-target'] = filterAreaSelector;
      }

       // console.log('#TH   field:', field);
       // console.log('#TH   fdname:', fdname);
       // console.log('#TH   elt_id:', elt_id);
       // console.log('#TH   head_span_attrs:', head_span_attrs);
       // More aggressive link version.
       //var head_span = new bbop.html.anchor(fdname, head_span_attrs);
       var head_span;

      if (addMenuButton) {
        var menuButtonAttrs = {
          class: 'fa fa-bars fa-fw'
        };
        var menuButton = new bbop.html.tag('i', menuButtonAttrs, '');
        head_span = new bbop.html.span(fdname, head_span_attrs);
        var space = new bbop.html.span('&nbsp;&nbsp;&nbsp;', {}, '');
        head_span.add_to(space);
        head_span.add_to(menuButton);
      }
      else {
        head_span = new bbop.html.span(fdname, head_span_attrs);
      }
       headerColumns.push(
       {
        fdname: fdname,
        id: head_column_id
       });

       headers_display.push(head_span.to_string());
   });

    ///
    /// Render the documents.
    ///

    // Cycle through and render each document.
    // For each doc, deal with it as best we can using a little
    // probing. Score is a special case as it is not an explicit
    // field.
    var table_buff = [];
    var docs = golr_resp.documents();
    each(docs, function(doc){
      // console.log('doc', doc, headers);
  // Well, they had better be in here, so we're just gunna cycle
  // through all the headers/fids.
  var entry_buff = [];
  each(headers, function(fid){
      // Detect out use of the special selectable column and add
      // a special checkbox there.
      if( fid == select_toggle_id ){
    // Also
    var did = doc['id'];
    var dinp = _create_select_box(did);
    entry_buff.push(dinp.to_string());
      }
      else if( fid == 'score' ) {
    // Remember: score is also
    // special--non-explicit--case.
    var score = doc['score'] || 0.0;
    score = bbop.core.to_string(100.0 * score);
    entry_buff.push(bbop.core.crop(score, 4) + '%');
      }
      else {

    // Not "score", so let's figure out what we can
    // automatically.
    var field = cclass.get_field(fid);
    if (skipFields.indexOf(fid) >= 0) {
      // console.log('SKIP:', fid, field, skipFields, doc[fid]);
    }
    else {
      // Make sure that something is there and that we can
      // iterate over whatever it is.
      var bits = [];
      if( doc[fid] ){
          if( field.is_multi() ){
        //ll("Is multi: " + fid);
        bits = doc[fid];
          }else{
        //ll("Is single: " + fid);
        bits = [doc[fid]];
          }
      }
      // Render each of the bits.
      var tmp_buff = [];
      each(bits, function(bit){
          var out = anchor.process_entry(bit, fid, doc, display_context);
          tmp_buff.push(out);
      });
      // Join it, trim/store it, push to to output.
          var joined;
      //Terrible hack to remove breaks for images
      if (img_regexp.test(tmp_buff)){
          joined = tmp_buff.join('&nbsp;&nbsp;');
      } else {
          joined = tmp_buff.join('<br />');
      }

      entry_buff.push(_trim_and_store(joined));
    }
      }
  });
  table_buff.push(entry_buff);
    });

    // Add the table to the DOM.
    var final_table =
  new bbop.html.table(headers_display, table_buff,
          {'class': 'table table-striped table-hover table-condensed'});
  // new bbop.html.table(headers_display, table_buff,
  //        {'class': 'bbop-js-search-pane-results-table'});
    jQuery('#' + elt_id).append(bbop.core.to_string(final_table));

    // Add the roll-up/down events to the doc.
    each(trim_hash, function(key, val){
  var tease_id = val[0];
  var more_b_id = val[1];
  var full_id = val[2];
  var less_b_id = val[3];

  // Initial state.
  jQuery('#' + full_id ).hide();
  jQuery('#' + less_b_id ).hide();

  // Click actions to go back and forth.
  jQuery('#' + more_b_id ).click(function(){
      jQuery('#' + tease_id ).hide();
      jQuery('#' + more_b_id ).hide();
      jQuery('#' + full_id ).show('fast');
      jQuery('#' + less_b_id ).show('fast');
  });
  jQuery('#' + less_b_id ).click(function(){
      jQuery('#' + full_id ).hide();
      jQuery('#' + less_b_id ).hide();
      jQuery('#' + tease_id ).show('fast');
      jQuery('#' + more_b_id ).show('fast');
  });
    });

    if (window.routerNavigo) {
        window.routerNavigo.updatePageLinks();
    }

    // Since we already added to the DOM in the table, now add the
    // group toggle if the optional checkboxes are defined.
    if( select_toggle_id && select_item_name ){
  jQuery('#' + select_toggle_id).click(function(){
      var cstr = 'input[id=' + select_toggle_id + ']';
      var nstr = 'input[name=' + select_item_name + ']';
      if( jQuery(cstr).prop('checked') ){
    jQuery(nstr).prop('checked', true);
      }else{
    jQuery(nstr).prop('checked', false);
      }
  });
    }
};
}

exports.InitMonarchBBOPWidgetDisplay = InitMonarchBBOPWidgetDisplay;
