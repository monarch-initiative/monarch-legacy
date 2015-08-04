/* This script document contains functions relating to general Monarch pages. */

jQuery(document).ready(function(){

    /* This displays the help text about the annotation sufficiency score upon
     * hovering over the blue question mark box. */
    jQuery('#annotationscore > span.annotatequestion').hover(function() {
        jQuery('#annotationscore > span.annotatehelp').css({'display': 'block'});
    }, function() {
        jQuery('#annotationscore > span.annotatehelp').css({'display': 'none'});
    });


    /* Annotate Marked Up Text */

    /* This displays the box of found terms upon hovering over a highlighted/linked
     * term. An example is located in the Text Annotater (found on the Annotate Text
     * tab of the main drop-down navigation menu). */
    jQuery('.linkedspan').hover(function() {
        jQuery(this).find('.linkedterms').css({'display': 'block'});
    }, function() {
        jQuery(this).find('.linkedterms').css({'display': 'none'});
    });


    /* Show/Hide items */
    /* Used when a "more..." kind of functionality is desired */
    jQuery('.fewitems').click(function(event) {
        jQuery(this).hide();
        jQuery(this).parent().find('.moreitems').show();
        jQuery(this).parent().find('.hideitems').show();
    });

    jQuery('.hideitems').click(function(event) {
        jQuery(this).hide();
        jQuery(this).parent().find('.moreitems').hide();
        jQuery(this).parent().find('.hideitems').hide();
        jQuery(this).parent().find('.fewitems').show();
    });


});

function getAnnotationScore() {
    
    var isLoading = false;
    jQuery('#categories a[href="#phenotypes"]').click(function(event) {
        if (isLoading == false){
            isLoading = true;
            getPhenotypesAndScore();
        }
    });
    
    function getPhenotypesAndScore(){
        jQuery('.stars').hide();
        var spinner_class = 'ui-score-spinner';
        jQuery('.score-spinner').addClass(spinner_class);
    
        var id = this.location.pathname;
        var slash_idx = id.indexOf('/');
        id = id.substring(slash_idx+1);
    
        var query = '/' + id + '/phenotype_list.json';
    
        jQuery.ajax({
            url : query,
            dataType: "json",
            error: function(){
                console.log('ERROR: looking at: ' + query);
            },
            success: function(data) {
            
                var score_query = '/score';
                var phenotype_map = data.phenotype_list.map( function(val) { 
                    return {'id': val};
                });
                var profile = JSON.stringify({features:phenotype_map});
                var params = {'annotation_profile' : profile};
                jQuery.ajax({
                    type : 'POST',
                    url : score_query,
                    data : params,
                    dataType: "json",
                    error: function(){
                        console.log('ERROR: looking at: ' + score_query);
                    },
                    success: function(data) {
                        jQuery('.score-spinner').removeClass(spinner_class);
                        var score = (5 * data.scaled_score);
                        jQuery(".stars").text(score);
                    
                        /* This displays the stars used to denote annotation sufficiency. For example,
                         * annotation sufficiency scores are currently located on the phenotype tab
                         * of the disease page. */
                        jQuery.fn.stars = function() {
                            return this.each(function(i,e){jQuery(e).html(jQuery('<span/>').width(jQuery(e).text()*16));});
                        };
                        jQuery('.stars').stars();
                        jQuery('.stars').show();
                    }
                });
            }
            
        });
    }    
}

function genTable(spec, rows) {
    var content = "";
    content += "<table class='table table-striped table-condensed simpletable'>\n";
    if (rows != null) {
        content += "<thead>\n<tr>\n";
        for (var j = 0; j < spec.columns.length; j++) {
            var colname = spec.columns[j].name;
            var datatype = tableSortDataType(colname);
            content += "<th data-sort='" + datatype + "'>" + colname;
            var sortingsupported = ["string", "float", "frequency"];
            if (sortingsupported.indexOf(datatype) != -1) {
                content += "<span class=\"arrow\"> &#x2195;</span>";
            }
            content += "</th>\n";
        }
        content += "</tr>\n</thead>\n<tbody>\n";
        for (var i = 0; i < rows.length; i++) {
            content += "<tr>\n";
            for (var j=0; j< spec.columns.length; j++) {
                var colspec = spec.columns[j];
                var ontSpace = "";
                if (j == 0 && spec.columns.length > 1) {
                    if (spec.columns[1].val(rows[i]) == "equivalentClass") {
                        ontSpace += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
                    } else if (spec.columns[1].val(rows[i]) == "subClassOf") {
                        ontSpace += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
                    }
                }
                content += "<td>"+ontSpace+colspec.val(rows[i])+"</td>";                    
            }
            content += "\n</tr>\n";            
        }
        content += "</tbody>\n";
    }
    content + "</table>\n";
    return content;
}

function convChars (str) {

    // convert label.. modified from 
    //http://stackoverflow.com/questions/784586/convert-special-characters-to-
    //html-in-javascript 
    var converted = str;   
    if (typeof converted === 'string' && converted !== ""
            && converted !== undefined && converted !== null) {

        //first, change < > " ' #
        var c = {'<':'&lt;', '>':'&gt;',  '"':'&quot;', "'":'&#039;', '#':'&#035;' };
        converted =  str.replace( /[<>'"#]/g, function(s) { return c[s]; } );
    
        // now, we must convert &, but only if it is not found before any of those..
        // see http://fineonly.com/solutions/regex-exclude-a-string for a good eplantion of the 
        // use of ?! for "string to exclude..
        converted = converted.replace(/&(?!(lt;|gt;|quot;|#039;|#035;))/g,'&amp;');
        if (typeof converted == 'undefined') {
            converted = '';
        }
    }
    return converted;
}

//Function:
//- type: object type/category
//- obj: either { id : id, label : label} or a list of these
function genObjectHref(type,obj,fmt) {
    if (obj == null) {
       return "";
    }
    if (obj.type != null && obj.type.id != null) {
       return genObjectHref(type, obj.type, fmt);
    }
    if (obj.map != null) {
        return obj.map(function(x){return genObjectHref(type,x,fmt)}).join(" ");
    }

    var url = genURL(type, obj, fmt);
    var label = obj.label;

    // must escape label here. How do to this in JAvascript.
    if (label == null || label=="") {
        label = obj.id;
    } else {
        label = convChars(label);
    }
    
    return '<a href="'+url+'">'+label+'</a>';
}

function genTableOfSearchDataResults(results) {
    return genTable(
        {
            columns: [
                {name: "category",
                 val: function(a){ return convChars(a.category) }
                },
                {name: "match",
                 val: function(a){ return genObjectHref(a.category, a) }
                },
                {name: "taxon",
                val : function(a) {return genObjectHref('taxon',a.taxon) }
                }
            ]
        },
        results);
}

//Function: used to assign data types to each column for sortable tables
//- name: name of column
function tableSortDataType(name) {
 var string_types = ["allele", "associated with", "association type", "authors", "data type", "disease",
     "similar diseases", "evidence", "gene", "gene A", "gene B", "gene B organism", "genotype", "hit",
     "homolog", "homology class", "inferred from", "interaction detection method", "interaction type",
     "journal", "model", "model species", "model type", "most informative shared phenotype", "mutation",
     "onset", "organism", "other matching phenotypes", "pathway", "phenotype", "phenotype description",
     "qualifier", "reference", "references", "relationship", "species", "title", "variant"];
 var float_types = ["combined score", "phenotype similarity score", "rank", "year"];
 if (string_types.indexOf(name) != -1) {
     return "string";
 } else if (float_types.indexOf(name) != -1) {
     return "float";
 } else {
     return name;
 }
}

function genURL(type,obj,fmt) {
    var id = obj.id;
    var label = obj.label;
    if (id == null && label == null) {
        //HACK - backup case for when a plain id is given
        id = obj;
        label = id;
    }
    if (type == 'object') {
        // 'object' is a generic type that should be mapped to 
        // a more specific type, based on ID.
        // Note: currently incomplete
        if (/^(ORPHANET|OMIM|MIM)/.test(id)) {
            type = 'disease'
        }
        else if (/^(ORPHANET|OMIM|MIM)/.test(id)) {
            type = 'disease'
        }
        else if (/^(MP|HP|ZP)/.test(id)) {
            type = 'phenotype'
        }
        else {
            type = 'unknown';
            console.error("Could not map: "+id);
        }
    }
    if (type == 'source') {
        var xrefblob = getXrefObjByPrefix(label);
        var url = "";
        if (xrefblob != null) {
            url = xrefblob.generic_url;
        } else {
            //refer to the neurolex wiki, as before
            // E.g. neurolex.org/wiki/Nif-0000-21427
            if (id != null) {
                var toks = id.split("-");
                toks.pop();
                var id_trimmed = toks.join("-");
                url = "http://neurolex.org/wiki/"+id_trimmed;
            }
        }
        return url;
    }
    if (type == 'obopurl') {
        return "http://purl.obolibrary.org/obo/" + id
    }
    var url = '/'+type+'/'+id;
    
    if (fmt != null) {
        url = url + '.' + fmt;
    }
    return url;
}
