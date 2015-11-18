////
//// Application-level code for initiating the upper-right
//// autocomplete in the navigation bar.
////

// Initializer for search autocomplete.
function navbar_search_init(in_search_id, in_form_id){
    // Default DOM contact points.
    var search_elt = '#search';
    var form_elt = '#search_form';

    // Allow argument overrides.
    if( in_search_id ){ search_elt = '#' + in_search_id; }
    if( in_form_id ){ form_elt = '#' + in_form_id; }

    // Only run if these IDs are legit.
    if( jQuery(form_elt).length && jQuery(search_elt).length ){

	// Helper lifted from bbop-js: bbop.core.first_split
	// For documentation, see:
	// http://cdn.berkeleybop.org/jsapi/bbop-js/docs/files/core-js.html
	var first_split = function(character, string){
	    var retlist = null;

	    var eq_loc = string.indexOf(character);
	    if( eq_loc == 0 ){
		retlist = ['', string.substr(eq_loc +1, string.length)];
	    }else if( eq_loc > 0 ){
		var before = string.substr(0, eq_loc);
		var after = string.substr(eq_loc +1, string.length);
		retlist = [before, after];
	    }else{
		retlist = ['', ''];
	    }
	    
	    return retlist;
	};

	// Override form submission and bump to search page.
	jQuery(form_elt).submit(
	    function(event){
		event.preventDefault();
		
		var val = jQuery(search_elt).val();
		var newurl = "/search/"+val;
		window.location.href = newurl;
	    });

	// Arguments for autocomplete box.
	var ac_args = {
	    position : {
       		my: "right top",
		at: "right bottom",
		collision: "none"
	    },
	    source: function(request, response) {
		console.log("trying autocomplete on "+request.term);

		// Argument response from source gets map as argument.
		var _parse_data_item = function(item){
		    
		    // If has a category, append that; if not try to use
		    // namespace; otherwise, nothing.
		    var appendee = '';
		    if( item ){
			if( item['concept']['categories'][0] ){
			    appendee = item['concept']['categories'][0];
			}else if( item['id'] ){
			    // Get first split on '_'.
			    var fspl = first_split(/_|:/, item['id']);
			    if( fspl[0] ){
				appendee = fspl[0];
			    }
			}
		    }

		    return {
			label: item.completion,
			id : item.id,
			category : item.concept.categories[0],
			tag: appendee,
			name: item.id
		    };
		};
		var _on_success = function(data) {
			console.log('success:', data);
		    // Pare out duplicates. Assume existence of 'id'
		    // field. Would really be nice to have bbop.core in
		    // here...
		    var pared_data = [];
		    var seen_ids = {};
		    for( var di = 0; di < data.length; di++ ){
		        var datum = data[di];
		        var datum_id = datum['id'];
		        if( ! seen_ids[datum_id] ){
		            // Only add new ids to pared data list.
		            pared_data.push(datum);
		            
		            // Block them in the future.
		            seen_ids[datum_id] = true;
		        }
		    }

		    var map = jQuery.map(pared_data, _parse_data_item);

		    if (map.length > 0) {
		        var id_list = map.map( function(i) { return i.id; });
		        
		        var filtered_list = map.filter(function(i) { return i.category === 'gene'; });
		        var gene_ids = filtered_list.map(function(i) { return i.id; });
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
		                remove_equivalent_ids(map, id_list, response);
		            },
		            success: function ( data ){
		                map = add_species_to_autocomplete(data, map, gene_ids);
		                remove_equivalent_ids(map, id_list, response);
		            }

		        });
		    } else {
		        remove_equivalent_ids(map, id_list, response);
		    }
		    } else {
		        response(map);
		    }
		};

		var query = "/autocomplete/"+request.term+".json";
		console.log('about to do query:', query);
		jQuery.ajax({
		    url: query,
		    dataType:"json",
		    /*data: {
		      prefix: request.term,
		      },*/
		    success: _on_success
		});
	    },
	    messages: {
		noResults: '',
		results: function() {}
            },
	    select: function(event,ui) {
		if (ui.item !== null) {
		    var newurl = "http://"+window.location.host+"/"+ui.item.category+"/"
	      		+encodeURIComponent(ui.item.id);
		    window.location.href = newurl;
		}
	    }	
	};

	// Create our own custom rendering to make the categories a little
	// nicer to look at (as minor data).
	// http://jqueryui.com/autocomplete/#custom-data
	var jac = jQuery(search_elt).autocomplete(ac_args);
	jac.data('ui-autocomplete')._renderItem = function(ul, item){
	    var li = jQuery('<li>');
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
    }
}

if (typeof exports === 'object') {
    exports.navbar_search_init = navbar_search_init;
}
if (typeof(loaderGlobals) === 'object') {
    loaderGlobals.navbar_search_init = navbar_search_init;
}
