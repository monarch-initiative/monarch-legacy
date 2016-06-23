
function AnalyzeInit(uploaded_data){
    // hide the limit field under search section
    // since the selected target species is 'all' by default - Zhou
    jQuery('#analyze-limit').hide();

    // Default mode is search
    var comparable_mode = 'search';

    var DEFAULT_LIMIT = 100;
    var DEBUG = false;
    //var DEBUG = true;

    var urlParams = {};

    ///
    /// HTML connctions.
    ///

    var analyze_auto_input_id = 'analyze_auto_input';
    var analyze_auto_input_elt = '#' + analyze_auto_input_id;
    var analyze_auto_target_id = 'analyze_auto_target';
    var analyze_auto_target_elt = '#' + analyze_auto_target_id;
    var analyze_auto_list_id = 'analyze_auto_list';
    var analyze_auto_list_elt = '#' + analyze_auto_list_id;

    //Control instructions show/hide href
    $("#instructions-toggle").click(function(e){
        e.preventDefault();
        $("#instructions").toggle(400);
    });

    ///
    /// Gunna go crazy without bbop-js, so adding a few things
    /// here: (stripped) logger and iterator.
    ///

    var ll = function(str){
		if( DEBUG && console && console.log ){
		    console.log(str);
		}
    };

    var uuid = function(){

		// Replace x (and y) in string.
		function replacer(c) {
	            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
	            return v.toString(16);
		}
		var target_str = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
		return target_str.replace(/[xy]/g, replacer);
    };

    var is_array = function(in_thing){
		var retval = false;
		if( in_thing &&
	            typeof(in_thing) == 'object' &&
	            typeof(in_thing.push) == 'function' &&
	            typeof(in_thing.length) == 'number' ){
			retval = true;
	    }
		return retval;
    };

    var is_hash = function(in_thing){
		var retval = false;
		if( in_thing &&
	            typeof(in_thing) == 'object' &&
	            (! is_array(in_thing)) ){
	        retval = true;
		}
		return retval;
    };

    var get_keys = function (arg_hash){

		if( ! arg_hash ){ arg_hash = {}; }
		var out_keys = [];
		for (var out_key in arg_hash) {
	        if (arg_hash.hasOwnProperty(out_key)) {
				out_keys.push(out_key);
	        }
		}

		return out_keys;
    };

    var each = function(in_thing, in_function){

	// Probably an not array then.
	if( typeof(in_thing) == 'undefined' ){
            // this is a nothing, to nothing....
	}else if( typeof(in_thing) != 'object' ){
            throw new Error('Unsupported type in bbop.core.each: ' +
                            typeof(in_thing) );
	}else if( is_hash(in_thing) ){
            // Probably a hash...
            var hkeys = get_keys(in_thing);
            for( var ihk = 0; ihk < hkeys.length; ihk++ ){
		var ikey = hkeys[ihk];
		var ival = in_thing[ikey];
		in_function(ikey, ival);
            }
	}else{
            // Otherwise likely an array.
            for( var iai = 0; iai < in_thing.length; iai++ ){
		in_function(in_thing[iai], iai);
            }
	}
    };

    ///
    /// Ready analyze interface.
    ///

    ll('Starting ready!');

    var search_set = {};
    var delete2val = {};

//Attempt to fix input_items listing
	jQuery("#analyze_auto_target").val(function(index,text){
		var textFix = text.trim();
		if (textFix.charAt(0) == ','){
			textFix = textFix.substring(1);
		}
		if (textFix.charAt(textFix.length-1) == ','){
			textFix = textFix.substring(0,textFix.length-1);
		}
		textFix = textFix.replace(/,/g ,' ');
		ll('In jQuery: '+textFix);
    	return textFix;
	});

//added CDB to extract current phenotype list
	var URLVariables = window.location.search.substring(1).split('&');
    var splitLabel = jQuery('#splitLabels').text();
    if (splitLabel){
    	var splittedLabels = splitLabel.split("+");
    }
    for (var irn = 0; irn < URLVariables.length; irn++) {
        var parameterName = URLVariables[irn].split('=');
        if (parameterName[0] == "input_items" && splittedLabels) {
             var url_phenotypes = decodeURIComponent(parameterName[1]).split("+");
             for (var urn = 0; urn < url_phenotypes.length; urn++){
             	if (splittedLabels[urn]){
             		search_set[url_phenotypes[urn]] = splittedLabels[urn];
             	}else{
    				search_set[url_phenotypes[urn]] = "Phenotype_"+(urn+1);
    			}
    		}
        }

        switch(parameterName[0]){

            case 'mode':
                urlParams.mode = parameterName[1];
                break;
            case 'gene_list':
                urlParams.geneList =
                    add_gene_list_as_string(urlParams.geneList, parameterName[1]);
                jQuery('#gene-list').val(decodeURIComponent(parameterName[1].replace(/\+/g, ' ')));
                break;
            case 'ortholog_list':
                urlParams.geneList =
                    add_gene_list_as_string(urlParams.geneList, parameterName[1]);
                jQuery('#ortholog-text-area').show();
                jQuery('#ortholog-list').val(decodeURIComponent(parameterName[1].replace(/\+/g, ' ')));
                break;
            case 'paralog_list':
                urlParams.geneList =
                    add_gene_list_as_string(urlParams.geneList, parameterName[1]);
                jQuery('#paralog-text-area').show();
                jQuery('#paralog-list').val(decodeURIComponent(parameterName[1].replace(/\+/g, ' ')));
                break;
            case 'target_species':
                jQuery('#target').val(parameterName[1]);
                break;
            case 'target_type':
                jQuery('#type').val(parameterName[1]);
                break;
            case 'limit':
                jQuery('#analyze_limit_input').val(parameterName[1]);
                break;
            default:
                break;
        }
    }

    if (typeof urlParams.geneList !== 'undefined'){
        var decode = decodeURIComponent(urlParams.geneList.replace(/\+/g, ' '));
        urlParams.geneList = parse_text_area(decode);
    }

    if (jQuery('#analyze_limit_input').val() == ''){
        jQuery('#analyze_limit_input').val(DEFAULT_LIMIT);
    }

    if (urlParams.mode == 'compare'){
        //jQuery("#srch").removeAttr('clicked');
        jQuery('#compare').prop('checked', true);
        disable_search_form();
        enable_compare_form();
    } else if (urlParams.mode == 'search'){
        jQuery('#srch').prop('checked',true);
        disable_compare_form();
        enable_search_form();
    }


    redraw_form_list();

    //add these items to the list on the "Table View" tab
    var result_list = jQuery('#phen_vis');

    //Settings
    var homologs = {};

    jQuery('#gene-list').on('change', function() {
        homologs = {};
    });

    // Disable search form when compare radio button selected
    // and enable compare
    jQuery('#compare').click(function(){
        // Hide the phenogrid and results table
        jQuery('#resultSection').hide();
 
        disable_search_form();
        enable_compare_form();

        comparable_mode = 'compare';
    });

    // Disable compare form when compare radio button selected
    // Re-enable search form
    jQuery('#srch').click(function(){
        // Hide the phenogrid and results table
        jQuery('#resultSection').hide();

        disable_compare_form();
        enable_search_form();

        comparable_mode = 'search';
    });

    jQuery('#target').on('change', function() {
        set_target_type(this.value);
        // hide the limit field for all species
        // only show limit for single species - Zhou
        if (this.value === 'all') {
            jQuery('#analyze-limit').hide();
        } else {
            jQuery('#analyze-limit').show();
        }
    });


    jQuery('#ortholog').click(function(){
        if (typeof homologs.orthologs !== 'undefined'){
            jQuery("#gene-list").val(homologs.input.join(', '));
            jQuery("#ortholog-list").val(homologs.orthologs.join(', '));
            jQuery("#ortholog-text-area").show();
            jQuery("#ortholog-list").prop('disabled', false);
            //Scroll to the bottom to show somthing has changed
            scroll_to_bottom('ortholog-list');
            return
        }
        var gene_list = parse_text_area(document.getElementById('gene-list').value);
        var genes = gene_list.join('+');
        var query = '/query/orthologs/'+genes+'.json'
        jQuery("#ajax-spinner").show();
        disable_compare_form();
        jQuery("#reset").prop('disabled', true);
        jQuery("#srch").prop("disabled", true);

        jQuery.getJSON(query, function(data) {
            jQuery("#ajax-spinner").hide();
            enable_compare_form();
            jQuery("#reset").prop('disabled', false);
            //Set global homologs to reuse if needed
            homologs = data;
            jQuery("#gene-list").val(homologs.input.join(', '));
            jQuery("#ortholog-list").val(homologs.orthologs.join(', '));
            jQuery("#ortholog-text-area").show();
            jQuery("#ortholog-list").prop('disabled', false);
            jQuery("#srch").prop("disabled", false);
            scroll_to_bottom('ortholog-list');
        })
        .error(function() {
            jQuery("#ajax-spinner").hide();
            enable_compare_form();
            jQuery("#reset").prop('disabled', false);
            jQuery("#srch").prop("disabled", false);
            jQuery("#error-msg").show().delay(3000).fadeOut();
        });


    });

    jQuery('#paralog').click(function(){
        if (typeof homologs.paralogs !== 'undefined'){
            jQuery("#gene-list").val(homologs.input.join(', '));
            jQuery("#paralog-list").val(homologs.paralogs.join(', '));
            jQuery("#paralog-text-area").show();
            jQuery("#paralog-list").prop("disabled",false);
            //Scroll to the bottom to show something has changed:
            scroll_to_bottom('paralog-list');
            return
        }
        var gene_list = parse_text_area(document.getElementById('gene-list').value);
        var genes = gene_list.join('+');
        var query = '/query/orthologs/'+genes+'.json'
        jQuery("#ajax-spinner").show();
        disable_compare_form();
        jQuery("#srch").prop("disabled", true);

        jQuery.getJSON(query, function(data) {
            jQuery("#ajax-spinner").hide();
            enable_compare_form();
            //Set global homologs to reuse if needed
            homologs = data;
            jQuery("#gene-list").val(homologs.input.join(', '));
            jQuery("#paralog-list").val(homologs.paralogs.join(', '));
            jQuery("#paralog-text-area").show();
            jQuery("#paralog-list").prop("disabled", false);
            jQuery("#srch").prop("disabled", false);
            scroll_to_bottom('paralog-list');
        })
        .error(function() {
            jQuery("#ajax-spinner").hide();
            enable_compare_form();
            jQuery("#srch").prop("disabled", false);
            jQuery("#error-msg").show().delay(3000).fadeOut();
        });

    });

    // Prevent submit if no phenotype or gene ID added
    jQuery('#analyze-submit').click(function(event){
        if (jQuery('#analyze_auto_target').val() === '') {
            event.preventDefault();
            alert('Please specify the Phenotypes at Step 1.');
        } else {
            if (comparable_mode === 'compare' && jQuery('#gene-list').val() === '') {
                event.preventDefault();
                alert('Please specify the Gene IDs at Step 2.');
            }
        }  
    });

    /*
     * Function: parse_text_area
     *
     * Returns: list of value from text area
     * split by comma, comma\s, or \n
     */
    function parse_text_area(text){
        var gene_list = text.split(/\,\s|\,|\s\n|\n/);
        return gene_list;
    }

    function scroll_to_bottom(id){
        var textarea = document.getElementById(id);
        textarea.scrollTop = textarea.scrollHeight;
    }

    function disable_search_form(){
        jQuery("#analyze-search").hide();
    }

    function disable_compare_form(){
        jQuery("#analyze-compare").hide();
    }

    function enable_compare_form(){
        jQuery("#analyze-compare").show();
    }

    function enable_search_form(){
        jQuery("#analyze-search").show();
    }

    function set_target_type(value){

        if (value === '9606'){
            jQuery("#type option[value=gene]").prop('disabled', true);
            jQuery("#type option[value=all]").prop('disabled', true);
            jQuery("#type option[value=disease]").prop('disabled', false);
            jQuery('#type').val('disease');
        } else if (value === '10090'){
            jQuery("#type option[value=disease]").prop('disabled', true);
            jQuery("#type option[value=all]").prop('disabled', true);
            jQuery("#type option[value=gene]").prop('disabled', false);
            jQuery('#type').val('gene');
        } else if (value === '7955'){
            jQuery("#type option[value=disease]").prop('disabled', true);
            jQuery("#type option[value=all]").prop('disabled', true);
            jQuery("#type option[value=gene]").prop('disabled', false);
            jQuery('#type').val('gene');
        } else if (value === 'all'){
            jQuery("#type option[value=gene]").prop('disabled', true);
            jQuery("#type option[value=disease]").prop('disabled', true);
            jQuery("#type option[value=all]").prop('disabled', false);
            jQuery('#type').val('all');
        }
    }


    function add_gene_list_as_string(geneList, newGenes){
        if (typeof geneList == 'undefined'){
            return newGenes;
        } else if (newGenes != '') {
            return (geneList + ',' + newGenes);
        } else {
            return geneList;
        }
    }

    function add_gene_from_autocomplete(id){
        var current_list = jQuery("#gene-list").val();
        var new_list;
        if (/\,\s?$/.test(current_list)){
            new_list = current_list + id;
        } else if (/\n$/.test(current_list)){
            new_list = current_list + ', ' + id;
        } else if (current_list == ''){
            new_list = id;
        } else {
            new_list = current_list + ', ' + id;
        }
        jQuery("#gene-list").val(new_list);
        homologs = {};
    }

    function add_metadata(obj){
    	obj.metadata = {
                "maxSumIC": "6070.04276",
                "meanMaxIC": "10.42642",
                "meanMeanIC": "7.84354",
                "meanSumIC": "112.10397",
                "maxMaxIC": "14.87790",
                "meanN": "14.43013",
                "individuals": "26357",
                "metric_stats":
                {
                    "metric": "combinedScore",
                    "maxscore": "100",
                    "avgscore": "60",
                    "stdevscore": "4.32",
                    "comment": "These stats are approximations for this release"
                }
        };
		return obj;
    }

    //Upload file
    jQuery('#upload-file').on('change', function() {
        var file_name = jQuery(this).val();
        jQuery('#file-name').text(" "+file_name);
        jQuery('#file-exceed').empty();
    });

    function update_form_value(){
		jQuery(analyze_auto_target_elt).val('');
		var vals = get_keys(search_set);
		var vals_str = vals.join(' ');
		ll("Vals_Str: "+vals_str);
		jQuery(analyze_auto_target_elt).val(vals_str);

        refreshResults();
    }

    function refreshResults() {
        if (typeof(urlParams.mode) !== 'undefined') {
            // Gray out the phenogrid and results table
            jQuery('#resultContainer').css('opacity', '.3');
            
            // Change the button color and text
            jQuery('#analyze-submit').html('Refresh');
            jQuery('#analyze-submit').addClass('btn-warning');
        }
    }

    function redraw_form_list(){
		// Get ready to redraw list.
		var draw_cache = [];
		var saw_something = false;
		each(search_set,function(skey, slabel){
			saw_something = true;
			var nid = uuid();
			delete2val[nid] = skey;
			draw_cache.push('<li class="list-group-item" style="font-size:12px;float:left;display:inline-block;margin-right:5px;">');
			draw_cache.push(slabel + ' (' + decodeURIComponent(skey) + ')');
			draw_cache.push('<span id="'+ nid +'" class="badge analyze-delete-button font-size:12px;">X</span>');
			draw_cache.push('</li>');
		});

		// Wipe list.
		jQuery(analyze_auto_list_elt).empty();

		// Redraw it.
		if( ! saw_something ){
		    // Placeholder when there is nothing.
		    jQuery(analyze_auto_list_elt).append('<li class="list-group-item" style="font-size:12px;float:left;display:inline-block;margin-right:5px;">Empty: Add items using the input above.</li>');
		}else{
		    jQuery(analyze_auto_list_elt).append(draw_cache.join(''));
		}


		// Add events to it.
		each(delete2val,
		     function(did, val){
			 jQuery('#' + did).click(
			     function(){
				 //alert('did: ' + did + ', val: ' + val);
				 delete_item(val);
			     }
			 );
		     });

    }

    function delete_item(id){
		ll('deleting: ' + id);

		// Delete the item.
		delete search_set[id];

		// Update.
		update_form_value();
		redraw_form_list();
    }

    // Action to perform when an item is selected from the dropdown
    // list.
    function select_item(id, label){
		ll('selected: ' + id + '/' + label);

		// Add the item.
		search_set[id] = label;

		// Update.
		update_form_value();
		redraw_form_list();

		// Remove the current input.
		jQuery(analyze_auto_input_elt).val('');
    }

    // Action to perform when an item is selected from the dropdown
    // list.
    function bootstrap_from_url(){
		ll('selected: ' + id + '/' + label);

		// Add the item.
		search_set[id] = label;

		// Update.
		update_form_value();
		redraw_form_list();

		// Remove the current input.
		jQuery(analyze_auto_input_elt).val('');
    }

    var auto_args = {
		source: function(request, response) {
		    var query = "/autocomplete/Phenotype/" + request.term + ".json";
		    jQuery.ajax({
				    url: query,
				    dataType: 'json',
				    error: function(){
					ll('ERROR: looking at: ' + query);
				    },
				    success: function(data) {
					ll("auto success");
					var map = jQuery.map(data, function(item) {
                        return {
                            'label': item.label,
                            'id': item.id
                        };
                    });
					if (map.length > 0) {
					    var id_list = map.map( function(i) { return i.id; });
					    remove_equivalent_ids(map, id_list, response);
					} else {
					    response(map);
					}
				    }
				});
		},
		select: function(event, ui){

		    // Get the selected input.
		    var id = null;
		    var lbl = null;
		    if( ui.item && ui.item.id ){ id = ui.item.id; }
		    if( ui.item && ui.item.label ){ lbl = ui.item.label; }

		    // If okay, do whatever...?
		    if( ! id || ! lbl ){
			ll('input issues');
		    }else{
			select_item(id, lbl);
		    }

		    return false;
		}
    };

    var auto_gene_args = {
        source: function(request, response) {
            var query = "/autocomplete/gene/" + request.term + ".json";
            jQuery.ajax({
                    url: query,
                    dataType: 'json',
                    error: function(){
                        ll('ERROR: looking at: ' + query);
                    },
                    success: function(data) {
                        ll("auto success");
                        var map = jQuery.map(data,
                                function(item) {
                                    return {
                                        'label': item.label,
                                        'id': item.id
                                    };
                        });

                        var gene_ids = map.map(function(i) { return i.id; });
                        //var gene_ids = id_list;
                        var ids = gene_ids.join('&id=');
                        if (gene_ids.length > 0) {
                            //TODO pass server in using puptent var
                            var qurl = global_scigraph_data_url+"graph/neighbors?id="
                            + ids + "&depth=1&blankNodes=false&relationshipType=http%3A%2F%2Fpurl.obolibrary.org%2Fobo%2FRO_0002162"
                            + "&direction=BOTH&project=%2A";
                            jQuery.ajax({
                                url: qurl,
                                dataType:"json",
                                error: function (){
                                    console.log('could not get taxon for genes');
                                    response(map);
                                },
                                success: function ( data ){
                                    map = add_species_to_autocomplete(data, map, gene_ids);

                                    response(map);
                                }
                            });
                        } else {
                            response(map);
                        }
                    }
            });
        },
        select: function(event, ui){

            // Get the selected input.
            var id = null;
            var lbl = null;
            if( ui.item && ui.item.id ){ id = ui.item.id; }
            if( ui.item && ui.item.label ){ lbl = ui.item.label; }

            // If okay, do whatever...?
            if( ! id || ! lbl ){
                ll('input issues');
            }else{
                add_gene_from_autocomplete(id.replace('_',':').replace(/^OBO:/,''));
            }

            return false;
        }
    };
    jQuery(analyze_auto_input_elt).autocomplete(auto_args);

    //  Add species for gene autocomplete
    var jac = jQuery('#auto_gene_input').autocomplete(auto_gene_args);
    jac.data('ui-autocomplete')._renderItem = function(ul, item){
        var li = jQuery('<li>');
        
console.log(item);

        li.append('<a alt="'+ item.name +'" title="'+ item.name +'">' +
              '<span class="autocomplete-main-item">' +
              item.label +
              '</span>' +
              '&nbsp;' +
              '<span class="autocomplete-tag-item">' +
              item.tag +
              '</span>' +
              '</a>');
        li.appendTo(ul);
        return li;
    };



    if (jQuery("#analyze_auto_target").val() !== null) {
        var text = jQuery("#analyze_auto_target").val();
        var species = jQuery("#target").val();
        var limit = jQuery("#analyze_limit_input").val();

        if (typeof urlParams.user_input != 'undefined'
                && typeof urlParams.user_input.matches != 'undefined'){

            console.log(urlParams.user_input);

            flattened_user_input = flatten_json(urlParams.user_input);

            console.log("flat");
            console.log(flattened_user_input);
            console.log(JSON.stringify(flattened_user_input));

            // HACK to add gene ID prefixes, will make
            // it work but will forward people to the wrong gene!!
            flattened_user_input.b.forEach(function(attribute,index){
                if (/^\d+$/.test(attribute.id)){
                    flattened_user_input.b[index].id = "Exomiser:"+attribute.id;
                }
                if (/^OMIM|ORPHANET/.test(attribute.id)){
                    flattened_user_input.b[index].type = "disease";
                }
            });

            // Obviously an Exomiser call
            urlParams.mode = "exomiser"

            urlParams.user_input = flattened_user_input
        }


        var phenotypes  = text.split(/[\s,]+/);

        // Need to convert each phenotype ID into an object {id: "HP:0004388"} - Zhou
        var phenotype_list = [];
        for (var i = 0; i < phenotypes.length; i++) {
            var phenotype_obj = {"id": phenotypes[i]};
            phenotype_list.push(phenotype_obj);
        }

        // New data schema since Phenogrid 1.3.0 input - Zhou
        var gridSkeletonData = {
            "title": null,
            "xAxis": [
                {
                    "groupId": "9606",
                    "groupName": "Homo sapiens"
                },
                {
                    "groupId": "10090",
                    "groupName": "Mus musculus"
                },
                {
                    "groupId": "7955",
                    "groupName": "Danio rerio"
                },
                {
                    "groupId": "7227",
                    "groupName": "Drosophila melanogaster"
                },
                {
                    "groupId": "6239",
                    "groupName": "Caenorhabditis elegans"
                },
                {
                    "groupId": "6239",
                    "groupName": "Caenorhabditis elegans"
                }
            ],
            "yAxis": phenotype_list
        };

    console.log('before window.onload in Analyze.js');

	// window.onload = function() {
        console.log('before Phenogrid.createPhenogridForElement in Analyze.js');
		Phenogrid.createPhenogridForElement(document.getElementById('phen_vis'), {
			gridSkeletonData: gridSkeletonData,
			serverURL: global_app_base,
			targetSpecies: species,
            searchResultLimit: limit,
			owlSimFunction: urlParams.mode,
			geneList: urlParams.geneList // geneList is only used when in compare mode - Zhou
		});
	// };
    }

    // Flatten JSON output from Exomiser
    function flatten_json(json) {
         var toFlatten = json.matches
         if(toFlatten != undefined && toFlatten.length != 0) {
            var ref = _.head(toFlatten) // Takes the first as template
            var onlyBs = _.map(_.tail(toFlatten), function(el){  // collect the rest of the Bs
                return el.b;
            });
            ref.b = _.flatten(ref.b.concat(onlyBs)); // injecting the Bs in the reference
            ref.metadata = json.metadata;
            return ref;
         } else {
            return {};
         }
    }

}
