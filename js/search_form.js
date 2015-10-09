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
		        var qurl = "http://rosie.crbs.ucsd.edu:9000/scigraph/graph/neighbors?id=" 
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
		                var graph = new bbop.model.graph();
		                graph.load_json(data);
		                gene_ids.forEach(function (id) {
		                    var label = '';
		                    var taxon_list = graph.get_parent_nodes(id, 'http://purl.obolibrary.org/obo/RO_0002162');
		                    if (taxon_list && taxon_list.length > 0){
	                            label = taxon_list[0].label();
	                            var meta = taxon_list[0].metadata();
	                            if (meta && meta['synonym']){
	                                label = meta['synonym'][0];
	                            }
	                            label = label.replace(/\b[a-z]/g, function() {
	                                return arguments[0].toUpperCase()
	                            });
	                        }
		                    for (i = 0; i < map.length; i++){
	                            if (map[i]['id'] == id) {
	                                if (label) {
	                                    map[i]['tag'] = label;
	                                }
	                            }
	                        }
                        });
		                remove_equivalent_ids(map, id_list, response);
		            }

		        });
		    } else {
		        remove_equivalent_ids(map, id_list, response);
		    }
		    }
		};

		var query = "/autocomplete/"+request.term+".json";
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

var remove_equivalent_ids = function (map, id_list, response) {
  //TODO pass server in using puptent var
    var ids = id_list.join('&id=');
    var qurl = "http://geoffrey.crbs.ucsd.edu:9000/scigraph/graph/neighbors?id=" 
        + ids + "&depth=3&blankNodes=false&relationshipType=equivalentClass"
        + "&direction=BOTH&project=%2A";
    jQuery.ajax({
        url: qurl,
        dataType:"json",
        error: function (){
            console.log('error fetching equivalencies');
            response(map);
        },
        success: function ( data ){
            var equivalent_graph = new bbop.model.graph();
            equivalent_graph.load_json(data);
            
            //Need to put this in one place
            equivalent_graph.get_descendent_subgraph = function(obj_id, pred){   
                var anchor = this;
                var edge_list = new Array();
                var descendent_graph = new bbop.model.graph();
                if (typeof anchor.seen_node_list === 'undefined') {
                    anchor.seen_node_list = [obj_id];
                }
                
                anchor.get_child_nodes(obj_id, pred).forEach( function(sub_node) {
                    var sub_id = sub_node.id();
                    if (anchor.seen_node_list.indexOf(sub_id) > -1){
                        return;
                    }
                    anchor.seen_node_list.push(sub_id);
                    descendent_graph.add_edge(anchor.get_edge(sub_id, obj_id, pred));
                    descendent_graph.add_node(anchor.get_node(sub_id));
                    descendent_graph.add_node(anchor.get_node(obj_id));
                    descendent_graph.merge_in(anchor.get_descendent_subgraph(sub_id, pred));
                });
                    
                return descendent_graph; 
            }
            
            for (var i=0; i < map.length; i++) {
                var id = map[i]['id'];
                var eq_node_list = [];
                //Get all equivalent nodes of v[i][0]
                var equivalent_nodes = equivalent_graph.get_ancestor_subgraph(id, 'equivalentClass')
                .all_nodes();
                var other_eq_nodes = equivalent_graph.get_descendent_subgraph(id, 'equivalentClass')
                .all_nodes();
                
                eq_node_list = equivalent_nodes.map(function(i){return i.id();});
                var temp_list = other_eq_nodes.map(function(i){return i.id();});
                
                eq_node_list.push.apply(eq_node_list, temp_list);
                //equivalent_node_list.map
                
                for (var k=i+1; k < map.length; k++) {
                    var node_id = map[k]['id'];
                    if (node_id) {
                        if (eq_node_list.indexOf(node_id) > -1){
                            
                            // If the id is from MESH
                            if (/^MESH/.test(id)){
                                map.splice(i,1)
                                i--;
                                break;
                            } else {
                                map.splice(k, 1);
                                k--;
                                continue;
                            }
                        }
                    }
            
                }
            }
            response(map);  
        }
    });
};

// Run initializer on jQuery ready event.
jQuery(document).ready(function(){
    navbar_search_init();
});
