/* eslint new-cap: 0 */
/* eslint-disable */

function InitFacetFilters() {
  var _ = require('underscore');
  var jq = require('jquery');
  if (typeof(globalUseBundle) === 'undefined' || !globalUseBundle) {
    var bbop = loaderGlobals.bbop;
  }
  else {
    var bbop = require('bbop');
  }

  // Module and namespace checking.
  // if ( typeof bbop == "undefined" ){ var bbop = {}; }

  if ( typeof bbop.monarch == "undefined" ){ bbop.monarch = {}; }
  if ( typeof bbop.monarch.widget == "undefined" ){ bbop.monarch.widget = {}; }

  if (typeof(loaderGlobals) === 'object') {
      loaderGlobals.bbop = bbop;
  }
  if (typeof(global) === 'object') {
      global.bbop = bbop;
  }
  if( typeof(exports) != 'undefined' ) {
      exports.bbop = bbop;
  }

/*
 * Package: facet_filters.js
 *
 * Namespace: bbop.widget.facet_filters
 *
 * BBOP JS object to allow the live probing of a GOlr personality.
 *
 * This class is a drop-in replacement for live_filters
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }

/*
 * Constructor: facet_filters
 *
 * Contructor for the bbop.widget.facet_filters object.
 *
 * Widget interface to interactively explore a search personality with
 * no direct side effects.
 * Based on live_filters, but uses checkboxes instead of AmiGO-style +/-
 *
 * Arguments:
 *  interface_id - string id of the element to build on
 *  manager - the shared GOlr manager to use
 *  golr_conf_obj - the profile of the specific
 *  in_argument_hash - *[optional]* optional hash of optional arguments
 *
 * Returns:
 *  this object
 */
bbop.widget.facet_filters = function(interface_id, manager, golr_conf_obj, in_argument_hash) {
  this._is_a = 'bbop.widget.facet_filters';

  var anchor = this;
  var each = bbop.core.each;

  // TODO/BUG: Remove the need for these.
  var ui_icon_positive_label = '&plus;';
  var ui_icon_positive_source = null;
  var ui_icon_negative_label = '&minus;';
  var ui_icon_negative_source = null;
  var ui_icon_remove_label = '&minus;';
  var ui_icon_remove_source = null;
  var ui_spinner_shield_source = null;
  var ui_spinner_shield_message = '';

  // Per-UI logger.
  var logger = new bbop.logger();
  logger.DEBUG = false;
  // logger.DEBUG = true;
  function ll(str){ logger.kvetch('FF: ' + str); }

  ///
  /// Deal with incoming arguments.
  ///

  // this._class_conf = golr_conf_obj;

  // Our argument default hash.
  var default_hash = {
    'meta_label': 'Documents:&nbsp;',
    'display_meta_p': true,
    'display_accordion_p': true,
    'on_update_callback': function(){}
  };
  var folding_hash = in_argument_hash || {};
  var arg_hash = bbop.core.fold(default_hash, folding_hash);
  //
  this._interface_id = interface_id;
  this._display_meta_p = false;
  this._meta_label = arg_hash['meta_label'];
  this._display_accordion_p = arg_hash['display_accordion_p'];
  this._on_update_callback = arg_hash['on_update_callback'];

  this.fullFacet = {};

  ///
  /// Prepare the interface and setup the div hooks.
  ///

  anchor._established_p = false;

  // Mangle everything around this unique id so we don't collide
  // with other instances on the same page.
  var ui_div_id = this._interface_id;
  var mangle = ui_div_id + '_ui_element_' + bbop.core.uuid() + '_';

  // Main div id hooks to the easily changable areas of the display.
  var container_div_id = mangle + 'container-id';
  // Meta hooks.
  var meta_div_id = mangle + 'meta-id';
  var meta_count_id = mangle + 'meta-count-id';
  var meta_wait_id = mangle + 'meta-wait-id';
  // Query hooks
  var query_input_div_id = mangle + 'query-id';

  // Accordion hooks.
  var filters_div_id = mangle + 'ui-filters-wrapper';

  var pager_top_id = ui_div_id + '-pager-top';
  var pager_bottom_id = ui_div_id + '-pager-bottom';

  var query_filter_table_id = ui_div_id + '-area';
  var query_filter_handle_id = ui_div_id + '-handle';
  var query_filter_all_id = ui_div_id + '-all';
  var query_filter_none_id = ui_div_id + '-none';



  // Blow away whatever was there completely.
  // Render a control section into HTML. This includes the accordion
  // and current filter sections.
  // Get the user interface hook and remove anything that was there.
  var container_div = new bbop.html.tag('div', {'id': container_div_id});
  jQuery('#' + ui_div_id).empty();
  jQuery('#' + ui_div_id).append(container_div.to_string());


  // // These pointers are used in multiple functions (e.g. both
  // // *_setup and *_draw).
  var filter_accordion_widget = null;
  var spinner_div = null;

  function _spin_up(){
      if( spinner_div ){
      jQuery('#' + spinner_div.get_id()).removeClass('hidden');
      jQuery('#' + spinner_div.get_id()).addClass('active');
      }
  }
  function _spin_down(){
      if( spinner_div ){
      jQuery('#' + spinner_div.get_id()).addClass('hidden');
      jQuery('#' + spinner_div.get_id()).removeClass('active');
      }
  }

  /*
   * Function: spin_up
   *
   * Turn on the spinner.
   *
   * Parameters:
   *  n/a
   *
   * Returns
   *  n/a
   */
  this.spin_up = function(){
  _spin_up();
  };

  /*
   * Function: spin_down
   *
   * Turn off the spinner.
   *
   * Parameters:
   *  n/a
   *
   * Returns
   *  n/a
   */
  this.spin_down = function(){
  _spin_down();
  };


  /*
   * Function: updateAccordionQuery
   *
   * Helper function called when anchor.fullFacet has been changed (due to Checkbox action or All/None action).
   * Updates the existing GOLR query and reissues it.
   *
   * Parameters:
   *  n/a
   *
   * Returns
   *  n/a
   */
  this.updateAccordionQuery = function(call_field) {
    var facet = anchor.fullFacet[call_field];

    manager.reset_query_filters();
    var disjunction = '';
    var disjunctionOp = ' OR ';
    facet.facet_bd.forEach( function (val) {
      if (facet.includes[val[0]]) {
        disjunction += disjunctionOp + call_field + ':"' + val[0] + '"';
      }
    });

    disjunction = disjunction.slice(disjunctionOp.length);
    if (disjunction.length > 0) {
      manager.add_query_filter_as_string(disjunction);
    }
    else {
      manager.add_query_filter(call_field, 'NONE');
    }
  };

  /*
   * Function: establish_display
   *
   * Completely redraw the display.
   *
   * Required to display after setting up the manager.
   *
   * Also may be useful after a major change to the manager to reset
   * it.
   *
   * Parameters:
   *  n/a
   *
   * Returns
   *  n/a
   */
  this.establish_display = function(){

    // Can only make a display if there is a set
    // personality--there is no general default and it is an
    // error.
    var personality = manager.get_personality();
    var cclass = golr_conf_obj.get_class(personality);
    if( !personality || !cclass ){
      ll('ERROR: no usable personality set');
      throw new Error('ERROR: no useable personality set');
    }

    ///
    /// Setup the UI base.
    ///

    // Holder for things like spinner and current number of
    // results.
    this.setup_meta = function(){
      ll('setup_meta for: ' + meta_div_id);

      // Count area.
      var ms_attrs = {
        id: meta_count_id,
        'class': 'badge'
      };
      var ms = new bbop.html.tag('span', ms_attrs, 'n/a');

      // Get a progress bar assembled.
      var inspan = new bbop.html.tag('span', {'class': 'sr-only'}, '...');
      var indiv = new bbop.html.tag(
                        'div',
                        {
                          'class': 'progress-bar',
                          'role': 'progressbar',
                          'aria-valuenow': '100',
                          'aria-valuemin': '0',
                          'aria-valuemax': '100',
                          'style': 'width: 100%;'
                        },
                        inspan);
      spinner_div = new bbop.html.tag(
                        'div',
                        {
                          'generate_id': true,
                          'class':
                          'progress progress-striped active pull-right',
                          'style': 'width: 3em;'
                        },
                        indiv);

      // The container area; add in the label and count.
      var mdiv_args = {
        'class': 'well well-sm',
        'id': meta_div_id
      };
      var mdiv = new bbop.html.tag(
                    'div',
                    mdiv_args,
                    [this._meta_label, ms, spinner_div]);

      jQuery('#' + container_div.get_id()).append(mdiv.to_string());
    };
    if( this._display_meta_p ){
      this.setup_meta();
    }


    // Setup the accordion skeleton under constructed tags for later
    // population. The seeding information is coming in through the
    // GOlr conf class.
    // Start building the accordion here. Not an updatable part.
    //
    // If no icon_*_source is defined, icon_*_label will be
    // used as the defining text.
    this.setup_accordion = function(){
      ll('setup_accordion UI for class configuration: ' + cclass.id());

      var filter_accordion_attrs = {
        id: filters_div_id
      };
      filter_accordion_widget = new bbop.html.collapsible([], filter_accordion_attrs);

      // Add the sections with no contents as a skeleton to be
      // filled by draw_accordion.
      var field_list = cclass.field_order_by_weight('filter');
      each(field_list,
       function(in_field){
           ll('saw field: ' + in_field);
           var ifield = cclass.get_field(in_field);
           var in_attrs = {
             id: in_field,
             label: ifield.display_name(),
             description: ifield.description()
           };
           filter_accordion_widget.add_to(in_attrs, '', true);
       });

      // Add the output from the accordion to the page.
      var accordion_str = filter_accordion_widget.to_string();
      jQuery('#' + container_div_id).append(accordion_str);



      jQuery('#' + query_filter_table_id).draggable({
          handle: '#' + query_filter_table_id
      });

      jQuery('#' + query_filter_all_id).click(
        function(e) {
          var tid = e.target.id;
          var call_field = 'subject_taxon_label';

          var facet = anchor.fullFacet[call_field];
          facet.includes = _.mapObject(facet.includes, function(val, key) {
                                return true;
                              });

          manager.reset_query_filters();
          anchor.updateAccordionQuery(call_field);
          manager.search();
          _spin_up();
        });

      jQuery('#' + query_filter_none_id).click(
        function(e) {
          var tid = e.target.id;
          var call_field = 'subject_taxon_label';

          var facet = anchor.fullFacet[call_field];
          facet.includes = _.mapObject(facet.includes, function(val, key) {
                                return false;
                              });

          manager.reset_query_filters();
          anchor.updateAccordionQuery(call_field);
          manager.search();
          _spin_up();
        });
    };
    if( this._display_accordion_p ){
      this.setup_accordion();
    }

    ///
    /// Define the drawing callbacks, as well as the action hooks.
    ///

    /*
     * Function: draw_meta
     *
     * Draw meta results. Includes selector for drop down.
     *
     * (Re)draw the count control with the current information in the
     * manager. This also tries to set the selector to the response
     * number (to keep things in sync), unbinds any current "change"
     * event, and adds a new change event.
     *
     * Parameters:
     *  response - the <bbop.golr.response> returned from the server
     *  manager - <bbop.golr.manager> that we initially registered with
     *
     * Returns:
     *  n/a
     */
    this.draw_meta = function(response, manager) {
      // Collect numbers for display.
      var total_c = response.total_documents();
      if (total_c === 0) {
        jQuery('#' + meta_count_id).empty();
        jQuery('#' + meta_div_id).empty();
        jQuery('#' + pager_top_id).empty();
        jQuery('#' + pager_bottom_id).empty();
      }
    };
    if( true || this._display_meta_p ) {
      // We do this to inhibit BBOP's default meta drawing
      manager.register('search', 'meta_first', this.draw_meta, -1);
    }

    // Detect whether or not a keyboard event is ignorable.
    function _ignorable_event(event){
      var retval = false;

      if( event ) {
        var kc = event.keyCode;
        if( kc ) {
          if( kc == 39 || // right
              kc == 37 || // left
              kc == 32 || // space
              kc == 20 || // ctl?
              kc == 17 || // ctl?
              kc == 16 || // shift
            //kc ==  8 || // delete
              kc ==  0 ) { // super
              ll('ignorable key event: ' + kc);
              retval = true;
          }
        }
      }
      return retval;
    }


    /*
     * Function: draw_accordion
     *
     * (Re)draw the information in the accordion controls/filters.
     * This function makes them active as well.
     *
     * Parameters:
     *  response - the <bbop.golr.response> returned from the server
     *  manager - <bbop.golr.manager> that we initially registered with
     *
     * Returns:
     *  n/a
     */
    this.draw_accordion = function(response, manager){
      ll('draw_accordion for: ' + filters_div_id);

      // Make sure that accordion has already been inited.
      if( typeof(filter_accordion_widget) == 'undefined' ){
        throw new Error('Need to init accordion widget to use it.');
      }

      // We'll need this in a little bit for calculating when to
      // display the "more" option for the field filters.
      var real_facet_limit = manager.get_facet_limit();
      var curr_facet_limit = real_facet_limit -1; // the facets we'll show

      // We want this so we can filter out any facets that have the
      // same count as the current response total--these facets are
      // pretty much information free.
      var total_docs = response.total_documents();

      // A helper function for when no filters are
      // displayed.
      function _nothing_to_see_here(in_field) {
        var section_id = filter_accordion_widget.get_section_id(in_field);
        jQuery('#' + section_id).empty();
        jQuery('#' + section_id).append('Nothing to filter.');
      }

      // Hash where we collect our button information.
      // button_id -> [source, filter, count, polarity];
      var button_hash = {};

      // And a hash to store information to be able to generate the
      // complete filter shields.
      // span_id -> filter_id
      var overflow_hash = {};

      var in_query_filters = response.query_filters();
      ll('--- accordion filters: ' + bbop.core.dump(in_query_filters));

      // Cycle through each facet field; all the items in each,
      // create the lists and buttons (while collectong data useful
      // in creating the callbacks) and put them into the accordion.
      each(response.facet_field_list(),
        function(in_field){
          var field_vals = in_query_filters[in_field];
          ll('--- field_vals[' + in_field + '] ' + bbop.core.dump(field_vals));

          var facet_bd = response.facet_field(in_field);
          if (!anchor.fullFacet[in_field]) {
              var includes = {};
              _.each(facet_bd, function(e) {
                includes[e[0]] = true;
              });
              anchor.fullFacet[in_field] = {
                facet_bd: facet_bd,
                includes: includes
              };
          }
          else {
              facet_bd = anchor.fullFacet[in_field].facet_bd;
              console.log('### overriding facet_bd:', facet_bd);
          }
          if( bbop.core.is_empty(facet_bd) ){
           // No filters means nothing in the box.
           _nothing_to_see_here(in_field);

          }
          else{
            // Create ul lists of the facet contents.
            var tbl_id = mangle + 'filter-list-' + in_field;
            var facet_list_tbl_attrs = {
              'class': 'table table-hover table-striped table-condensed',
              'id': tbl_id
            };

            var facet_list_tbl = new bbop.html.table([], [], facet_list_tbl_attrs);

            ll("consider:" + in_field + ": " + facet_bd.length);

            // BUG/TODO:
            // Count the number of redundant (not shown)
            // facets so we can at least give a face to this
            // bug/problem.
            // Also filter out "empty filters".
            var redundant_count = 0;
            // Now go through and get filters and counts.
            var good_count = 0; // only count when good
            var overflow_p = false; // true when at 24 -> 25
            each(facet_bd,
              function(ff_field, ff_index){
                // Pull out info early so we can test it
                // for information content.
                var f_name = ff_field[0];
                var f_count = ff_field[1];

                // TODO: The field is likely redundant
                // (BUG: not always true in closures),
                // so eliminate it.
                if( false && f_count == total_docs ){
                  //ll("\tnothing here");
                  redundant_count++;
                }
                else if( ! f_name || f_name == "" ){
                  // Straight out skip if it is an
                  // "empty" facet field.
                }
                else if( ff_index < real_facet_limit -1 ){
                  //ll("\tgood row");
                  good_count++;

                  var facet = anchor.fullFacet[in_field];
                  var include = facet.includes[ff_field[0]];
                  var b_check_info =
                        {
                          'generate_id': true,
                          'value': true,
                          'title': include ? 'Exclude' : 'Include',
                          'name': 'Include/Exclude',
                          'type': 'checkbox',
                          'class': 'btn btn-default btn-xs',
                        };
                  if (include) {
                    b_check_info.checked = true;
                  }

                  var b_check = new bbop.html.input(b_check_info);

                  // Store in hash for later keying to
                  // event.
                  button_hash[b_check.get_id()] = [in_field, f_name, f_count, include];

                  facet_list_tbl.add_to([f_name,
                             '('+ f_count+ ')',
                             b_check.to_string()
                            ]);
                }

                // This must be logically separated from
                // the above since we still want to show
                // more even if all of the top 25 are
                // redundant.
                if( ff_index == real_facet_limit -1 ) {
                  // Add the more button if we get up to
                  // this many facet rows. This should
                  // only happen on the last possible
                  // iteration.

                  overflow_p = true;
                  //ll( "\tadd [more]");

                  // Since this is the overflow item,
                  // add a span that can be clicked on
                  // to get the full filter list.
                  //ll("Overflow for " + in_field);
                  var b_over = new bbop.html.button(
                    'more...',
                    {
                        'generate_id': true,
                        'type': 'button',
                        'title':
                        'Display the complete list',
                        'class':
                        'btn btn-primary btn-xs'
                    });
                  facet_list_tbl.add_to([b_over.to_string(), '', '']);
                  overflow_hash[b_over.get_id()] = in_field;
                }
              });

              // There is a case when we have filtered out all
              // avilable filters (think db source).
              if( good_count == 0 && ! overflow_p ){
                _nothing_to_see_here(in_field);
              }
              else{
                // Otherwise, now add the ul to the
                // appropriate section of the accordion in
                // the DOM.
                var sect_id = filter_accordion_widget.get_section_id(in_field);
                jQuery('#' + sect_id).empty();

                // TODO/BUG:
                // Give warning to the redundant facets.
                var warn_txt = null;
                if( redundant_count == 1 ){
                  warn_txt = "field is";
                }
                else if( redundant_count > 1 ){
                  warn_txt = "fields are";
                }
                if( warn_txt ){
                  jQuery('#' + sect_id).append(
                  "<small> The top (" + redundant_count +
                  ") redundant " + warn_txt + " not shown" +
                  "</small>");
                }

                // Add facet table.
                var final_tbl_str = facet_list_tbl.to_string();
                jQuery('#' + sect_id).append(final_tbl_str);
              }
            }
          });

        // Okay, now introducing a function that we'll be using a
        // couple of times in our callbacks. Given a button id (from
        // a button hash) and the [field, filter, count, polarity]
        // values from the props, make a button-y thing an active
        // filter.
        function filter_select_live(button_id, create_time_button_props){
          var in_polarity = create_time_button_props[3];

          // Create the button and immediately add the event.
          jQuery('#' + button_id).click(
            function(){
              var tid = jQuery(this).attr('id');
              var call_time_button_props = button_hash[tid];
              var call_field = call_time_button_props[0];
              var call_filter = call_time_button_props[1];
              //var in_count = button_props[2];
              var call_polarity = call_time_button_props[3];

              var facet = anchor.fullFacet[call_field];

              facet.includes[call_filter] = !facet.includes[call_filter];

              anchor.updateAccordionQuery(call_field);
              manager.search();
              // We are now searching--show it.
              _spin_up();
            });
        }

        // Now let's go back and add the buttons, styles,
        // events, etc. in the main accordion section.
        each(button_hash, filter_select_live);

        // Next, tie the events to the "more" spans.
        each(overflow_hash,
          function(button_id, filter_name){
            jQuery('#' + button_id).click(

              // On click, set that one field to limitless in
              // the manager, setup a shield, and wait for the
              // callback.
              function(){
                // Recover the field name.
                var tid = jQuery(this).attr('id');
                var call_time_field_name = overflow_hash[tid];

                // Set the manager to no limit on that field and
                // only rturn the information that we want.
                manager.set_facet_limit(0);
                manager.set_facet_limit(call_time_field_name, -1);
                var curr_row = manager.get('rows');
                manager.set('rows', 0);

                // Create the shield and pop-up the
                // placeholder.
                var fs = bbop.widget.display.filter_shield;
                var filter_shield = new fs(ui_spinner_shield_source, ui_spinner_shield_message);
                filter_shield.start_wait();

                // Open the populated shield.
                function draw_shield(resp){
                  // ll("shield what: " + bbop.core.what_is(resp));
                  // ll("shield resp: " + bbop.core.dump(resp));

                  // First, extract the fields from the
                  // minimal response.
                  var fina = call_time_field_name;
                  var flist = resp.facet_field(call_time_field_name);

                  // Draw the proper contents of the shield.
                  filter_shield.draw(fina, flist, manager);
                }
                manager.fetch(draw_shield);

                // Reset the manager to more sane settings.
                manager.reset_facet_limit();
                manager.set('rows', curr_row);
              });
          });

        ll('Done current accordion for: ' + filters_div_id);
      };

    if( this._display_accordion_p ){
      manager.register('search', 'accrdn_first', this.draw_accordion, 1);
    }

    /*
     * Function: draw_error
     *
     * Somehow report an error to the user.
     *
     * Parameters:
     *  error_message - a string(?) describing the error
     *  manager - <bbop.golr.manager> that we initially registered with
     *
     * Returns:
     *  n/a
     */
    this.draw_error = function(error_message, manager){
      ll("draw_error: " + error_message);
      alert("Runtime error: " + error_message);
      _spin_down();
    };
    manager.register('error', 'error_first', this.draw_error, 0);

    function spin_down_wait(){
      _spin_down();
    }
    manager.register('search', 'donedonedone', spin_down_wait, -100);

    // Start the ball with a reset event.
    //manager.search();

    // The display has been established.
    anchor._established_p = true;
  };
};


}


console.log('define InitFacetFilters');
if (typeof loaderGlobals === 'object') {
    loaderGlobals.InitFacetFilters = InitFacetFilters;
}
if (typeof global === 'object') {
    global.InitFacetFilters = InitFacetFilters;
    console.log('define InitFacetFilters global');
}
