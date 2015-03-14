
function AnalyzeInit(){
    
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
		var textFix = text.replace(/:/g ,'_').trim();
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
             var url_phenotypes = parameterName[1].split("+");
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
            case 'user_results':
                var usrResults = decodeURIComponent(parameterName[1]).replace(/\+/g, ' ');
                
                try {
                    urlParams.userResults = add_metadata(JSON.parse(usrResults));
                } catch (err){
                    console.log(err);
                }
                //HARDCODE COMPARE
                urlParams.mode = 'compare';
                jQuery('#user-results').val(usrResults);
                break;
            default:
                break;
        }
    }

    if (typeof urlParams.userResults == 'undefined'){   
        urlParams.userResults = {};
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
    var result_list = jQuery('#result-table');
    var term_list = '';
    var select_terms = jQuery('.list-group-item');
    jQuery.each(select_terms, function(key, value) {
    	term_list += (value.textContent.substring(0,value.textContent.length-1) + ', ');
    });
    if (typeof urlParams.userResults == 'undefined'){
        result_list.prepend('<h3>Search Terms</h3> ' + term_list.substring(0, term_list.length-2) + '<br/>');
    }
    
    
    //Settings
    
    var isGeneListChanged = false;
    var homologs;
    
    jQuery('#gene-list').on('input', function() {
        isGeneListChanged = true;
        jQuery("#compare-form-group button").removeAttr('disabled');
    });
    
    // Disable search form when compare radio button selected
    // and enable compare
    jQuery('#compare').click(function(){
        disable_search_form();
        enable_compare_form();
    });
    
    // Disable compare form when compare radio button selected
    // Re-enable search form
    jQuery('#srch').click(function(){   
        disable_compare_form();
        enable_search_form();
    });
    
    jQuery('#target').on('change', function() {
        set_target_type(this.value);
    });
    
    jQuery('#ortholog').click(function(){
        if ((isGeneListChanged === false) && (typeof homologs !== 'undefined')){
            jQuery("#gene-list").val(homologs.input.join(', '));
            jQuery("#ortholog-list").val(homologs.orthologs.join(', '));
            jQuery("#ortholog-text-area").show();
            jQuery("#ortholog-list").prop('disabled', false);
            jQuery("#compare-form-group button").prop("disabled", true);
            return
        }
        var gene_list = parse_text_area(document.getElementById('gene-list').value);
        var genes = gene_list.join('+');
        var query = '/query/orthologs/'+genes+'.json'
        jQuery("#ajax-spinner").show();
        jQuery("#compare-form-group button").prop("disabled", true);
        jQuery("#compare-form-group textarea").prop("disabled", true);
        
        jQuery.getJSON(query, function(data) {
            jQuery("#ajax-spinner").hide();
            jQuery("#compare-form-group button").prop('disabled', false);
            jQuery("#compare-form-group textarea").prop('disabled', false);
            //Set global homologs to reuse if needed
            homologs = data;
            jQuery("#gene-list").val(homologs.input.join(', '));
            jQuery("#ortholog-list").val(homologs.orthologs.join(', '));
            jQuery("#ortholog-text-area").show();
            isGeneListChanged = false;
            jQuery("#ortholog").prop("disabled", true);
            jQuery("#ortholog-list").prop('disabled', false);
        })
        .error(function() { 
            jQuery("#ajax-spinner").hide();
            jQuery("#compare-form-group button").prop('disabled', false);
            jQuery("#compare-form-group textarea").prop('disabled', false);
            jQuery("#error-msg").show().delay(3000).fadeOut();
        });
        
        
    });
    
    jQuery('#paralog').click(function(){
        if ((isGeneListChanged === false) && (typeof homologs !== 'undefined')){
            jQuery("#gene-list").val(homologs.input.join(', '));
            jQuery("#paralog-list").val(homologs.paralogs.join(', '));
            jQuery("#paralog-text-area").show();
            jQuery("#paralog-list").prop("disabled",false);
            jQuery("#compare-form-group button").prop("disabled", true);
            return
        }
        var gene_list = parse_text_area(document.getElementById('gene-list').value);
        var genes = gene_list.join('+');
        var query = '/query/orthologs/'+genes+'.json'
        jQuery("#ajax-spinner").show();
        jQuery("#compare-form-group button").attr("disabled", 'true');
        jQuery("#compare-form-group textarea").attr("disabled", 'true');
        
        jQuery.getJSON(query, function(data) {
            jQuery("#ajax-spinner").hide();
            jQuery("#compare-form-group button").removeAttr('disabled');
            jQuery("#compare-form-group textarea").removeAttr('disabled');
            //Set global homologs to reuse if needed
            homologs = data;
            jQuery("#gene-list").val(homologs.input.join(', '));
            jQuery("#paralog-list").val(homologs.paralogs.join(', '));
            jQuery("#paralog-text-area").show();
            isGeneListChanged = false;
            jQuery("#paralog").prop("disabled", true);
            jQuery("#paralog-list").prop("disabled", false);
        })   
        .error(function() { 
            jQuery("#ajax-spinner").hide();
            jQuery("#compare-form-group button").prop('disabled', false);
            jQuery("#compare-form-group textarea").prop('disabled', false);
            jQuery("#error-msg").show().delay(3000).fadeOut();
        });
;
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
    
    function disable_search_form(){       
        jQuery("#search-form-group input").prop("disabled", true);
        jQuery("#search-form-group select").prop("disabled", true);
    }
    
    function disable_compare_form(){
        jQuery("#compare-form-group button").prop("disabled", true);
        jQuery("#compare-form-group textarea").prop("disabled", true);
        jQuery("#compare-form-group input").prop("disabled", true);
    }
    
    function enable_compare_form(){
        jQuery("#compare-form-group button").prop('disabled', false);
        jQuery("#compare-form-group textarea").prop('disabled', false);
        jQuery("#compare-form-group input").prop("disabled", false);
    }
    
    function enable_search_form(){
        jQuery("#search-form-group input").prop('disabled', false);
        jQuery("#search-form-group select").prop('disabled', false);
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
        if (/(\,\s?)|\n/.test(current_list)){
            new_list = current_list + id + ', ';
        } else if (current_list == ''){
            new_list = id;
        } else {
            new_list = current_list + ', ' + id + ', ';
        }
        jQuery("#gene-list").val(new_list);
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

    function update_form_value(){
		jQuery(analyze_auto_target_elt).val('');
		var vals = get_keys(search_set);
		var vals_str = vals.join(' ');
		ll("Vals_Str: "+vals_str);
		jQuery(analyze_auto_target_elt).val(vals_str);
    }

    function redraw_form_list(){

		// Get ready to redraw list.
		var draw_cache = [];
		var saw_something = false;
		each(search_set,function(skey, slabel){
			saw_something = true;
			var nid = uuid();
			delete2val[nid] = skey;
			draw_cache.push('<li class="list-group-item">');
			draw_cache.push(slabel + ' (' + decodeURIComponent(skey) + ')');
			draw_cache.push('<span id="'+ nid +'" class="badge analyze-delete-button">X</span>');
			draw_cache.push('</li>');
		});

		// Wipe list.
		jQuery(analyze_auto_list_elt).empty();

		// Redraw it.
		if( ! saw_something ){
		    // Placeholder when there is nothing.
		    jQuery(analyze_auto_list_elt).append('<li class="list-group-item">Empty: Add items using the input above.</li>');
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
					response(jQuery.map(data,
							    function(item) {
								return {
								    'label': item.label,
								    'id': item.id
								};
							    }));
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
                        response(jQuery.map(data,
                                function(item) {
                            return {
                                'label': item.label,
                                'id': item.id
                            };
                        }));
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
    jQuery('#auto_gene_input').autocomplete(auto_gene_args);

    ll('Done ready!');
    return urlParams;
};

// jQuery gets to bootstrap everything.
jQuery(document).ready(
    function(){
	var params = AnalyzeInit();

	if (jQuery("#analyze_auto_target").val() !== null) {
	    var text = jQuery("#analyze_auto_target").val();
	    var species = jQuery("#analyze_auto_species").val();

	    var phenotypes  = text.split(/[\s,]+/);
	    jQuery("#phen_vis").phenogrid({phenotypeData: phenotypes,
				      targetSpeciesName: species,
				      owlSimFunction: params.mode,
				      geneList: params.geneList,
                      providedData: params.userResults
                       });
	}
	
});
