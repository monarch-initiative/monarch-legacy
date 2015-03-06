
function AnalyzeInit(){
    
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
	$("#analyze_auto_target").val(function(index,text){
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
    var splitLabel = $('#splitLabels').text();
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
        } else if (parameterName[0] == "mode"){
            urlParams.mode = parameterName[1];
        } else if (parameterName[0] == "gene-list"){
            urlParams.geneList = parameterName[1];
        }
    }

    if (typeof urlParams.geneList !== 'undefined'){
        var decode = decodeURIComponent(urlParams.geneList.replace(/\+/g, ' '))
        urlParams.geneList = parse_text_area(decode);
    }  
    
    redraw_form_list();
    
    //add these items to the list on the "Table View" tab
    var result_list = jQuery('#result');
    var term_list = '';
    var select_terms = jQuery('.list-group-item');
    jQuery.each(select_terms, function(key, value) {
    	term_list += (value.textContent.substring(0,value.textContent.length-1) + ', ');
    });
    result_list.prepend('<h3>Search Terms</h3> ' + term_list.substring(0, term_list.length-2) + '<br/>');
    
    
    //Settings
    
    var isGeneListChanged = false;
    var homologs;
    
    jQuery('#gene-list').on('input', function() {
        isGeneListChanged = true;
        $("#compare-form-group button").removeAttr('disabled');
    });
    
    // Disable search form when compare radio button selected
    // and enable compare
    $('#pheno-compare input[type=radio]').click(function(){
        
        $("#compare-form-group button").removeAttr('disabled');
        $("#compare-form-group textarea").removeAttr('disabled');   
        
        $("#search-form-group input").attr("disabled", 'true');
        $("#search-form-group select").attr("disabled", 'true');
    });
    
    // Disable compare form when compare radio button selected
    // Re-enable search form
    $('#pheno-search input[type=radio]').click(function(){
        
        $("#compare-form-group button").attr("disabled", 'true');
        $("#compare-form-group textarea").attr("disabled", 'true');
        
        $("#search-form-group input").removeAttr('disabled');
        $("#search-form-group select").removeAttr('disabled');
    });
    
    $('#target').on('change', function() {
        if (this.value === '9606'){
            $("#type option[value=gene]").attr('disabled','true');
            $("#type option[value=all]").attr('disabled','true');
            $('#type').val('disease');
        } else if (this.value === '10090'){
            $("#type option[value=disease]").attr('disabled','true');
            $("#type option[value=all]").attr('disabled','true');
            $('#type').val('gene');
        } else if (this.value === '7955'){
            $("#type option[value=disease]").attr('disabled','true');
            $("#type option[value=all]").attr('disabled','true');
            $('#type').val('gene');
        } else if (this.value === 'all'){
            $("#type option[value=disease]").removeAttr('disabled');
            $("#type option[value=gene]").removeAttr('disabled');
            $("#type option[value=all]").removeAttr('disabled');
        }
    });
    
    $('#ortholog').click(function(){
        if ((isGeneListChanged === false) && (typeof homologs !== 'undefined')){
            var input = homologs.input.concat(homologs.orthologs);
            var test_list = input.join(', ');
            if ($("#gene-list").val() != test_list){
                var current_list = homologs.input.concat(homologs.paralogs);
                var results = (current_list.concat(homologs.orthologs)).join(', ');
                $("#gene-list").val(results);
                $("#compare-form-group button").attr("disabled", 'true');
            }
            return
        }
        var gene_list = parse_text_area(document.getElementById('gene-list').value);
        var genes = gene_list.join('+');
        var query = '/query/orthologs/'+genes+'.json'
        $("#ajax-spinner").show();
        $("#compare-form-group button").attr("disabled", 'true');
        $("#compare-form-group textarea").attr("disabled", 'true');
        
        jQuery.getJSON(query, function(data) {
            $("#ajax-spinner").hide();
            $("#compare-form-group button").removeAttr('disabled');
            $("#compare-form-group textarea").removeAttr('disabled');
            //Set global homologs to reuse if needed
            homologs = data;
            var orthologs = data.orthologs;
            var input = data.input;
            var results = (input.concat(orthologs)).join(', ');
            $("#gene-list").val(results);
            isGeneListChanged = false;
            $("#ortholog").attr("disabled", 'true');
        })
        .error(function() { 
            $("#ajax-spinner").hide();
            $("#compare-form-group button").removeAttr('disabled');
            $("#compare-form-group textarea").removeAttr('disabled');
            $("#error-msg").show().delay(3000).fadeOut();
        });
        
        
    });
    
    $('#paralog').click(function(){
        if ((isGeneListChanged === false) && (typeof homologs !== 'undefined')){
            var input = homologs.input.concat(homologs.paralogs);
            var test_list = input.join(', ');
            if ($("#gene-list").val() != test_list){
                var results = (input.concat(homologs.orthologs)).join(', ');
                $("#gene-list").val(results);
                $("#compare-form-group button").attr("disabled", 'true');
            }
            return
        }
        var gene_list = parse_text_area(document.getElementById('gene-list').value);
        var genes = gene_list.join('+');
        var query = '/query/orthologs/'+genes+'.json'
        $("#ajax-spinner").show();
        $("#compare-form-group button").attr("disabled", 'true');
        $("#compare-form-group textarea").attr("disabled", 'true');
        
        jQuery.getJSON(query, function(data) {
            $("#ajax-spinner").hide();
            $("#compare-form-group button").removeAttr('disabled');
            $("#compare-form-group textarea").removeAttr('disabled');
            //Set global homologs to reuse if needed
            homologs = data;
            var paralogs = data.paralogs;
            var input = data.input;
            var results = (input.concat(paralogs)).join(', ');
            $("#gene-list").val(results);
            isGeneListChanged = false;     
            $("#paralog").attr("disabled", 'true');
        })   
        .error(function() { 
            $("#ajax-spinner").hide();
            $("#compare-form-group button").removeAttr('disabled');
            $("#compare-form-group textarea").removeAttr('disabled');
            $("#error-msg").show().delay(3000).fadeOut();
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
        var gene_list = text.split(/,\s|,|\s\n|\n/);
        return gene_list;
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
			draw_cache.push(slabel + ' (' + skey + ')');
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
    jQuery(analyze_auto_input_elt).autocomplete(auto_args);

    ll('Done ready!');
    return urlParams;
};

// jQuery gets to bootstrap everything.
jQuery(document).ready(
    function(){
	var params = AnalyzeInit();

	if ($("#analyze_auto_target").val() !== null) {
	    var text = $("#analyze_auto_target").val();
	    var species = $("#analyze_auto_species").val();
	    if (typeof species === 'undefined'){
	        species = 'all';
	    }
	    var phenotypes  = text.split(/[\s,]+/);
	    $("#phen_vis").phenogrid({phenotypeData: phenotypes,
				      targetSpecies: species,
				      owlSimFunction: params.mode,
				      geneList: params.geneList });
	}
	
});
