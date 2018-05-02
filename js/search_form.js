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
            event.stopPropagation();
            var element = jQuery(search_elt);
            var val = element.val();
            element.autocomplete('close');
            var newurl = "/search/"+ encodeURIComponent(val);

            if (window.vueRouter) {
              window.vueRouter.push(newurl);
            }
            else {
              window.location.href = newurl;
            }
        });

    // Arguments for autocomplete box.
    var ac_args = {
        position : {
            my: "right top",
            at: "right bottom",
            collision: "flip"
        },
        source: function(request, response) {
          var _on_success = function(data) {
            return response(data);
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
            // Violating DRY and copying from the new Vue autocomplete
            const validCats = {
               'gene': 'gene',
               'variant locus': 'variant',
               'phenotype': 'phenotype',
               'genotype': 'genotype',
               'disease': 'disease'
            };
            const categoryObj = ui.item.category.reduce((map, cat) => {
                cat = validCats[cat];
                if (cat) {
                  map[cat] = cat;
                }
                return map;
            }, {});
            const category = categoryObj.gene ||
              categoryObj.variant ||
              Object.keys(categoryObj).join(',');
            const newurl = "/"+category+"/"
                +encodeURIComponent(ui.item.id);
            if (window.vueRouter) {
              window.vueRouter.push(newurl);
            }
            else {
              window.location.href = newurl;
            }
        }
        }
    };

    // Create our own custom rendering to make the categories a little
    // nicer to look at (as minor data).
    // http://jqueryui.com/autocomplete/#custom-data
    var jac = jQuery(search_elt).autocomplete(ac_args);
    jac.data('ui-autocomplete')._renderItem = function(ul, item) {
        var taxonOrCategory = item.taxon;
        if(taxonOrCategory == "" || taxonOrCategory == null || taxonOrCategory == undefined) {
            taxonOrCategory = item.category;
        }
        var li = jQuery('<li>');
        li.append('<a data-monarch-legacy alt="'+ item.id +'" title="'+ item.id +'">' +
              '<span class="autocomplete-main-item">' +
              item.completion +
              '</span>' +
              '&nbsp;' +
              '<span class="autocomplete-tag-item">' +
              taxonOrCategory +
              '</span>' +
              '</a>');
        li.appendTo(ul);
        return li;
    };
    }
}

exports.navbar_search_init = navbar_search_init;
