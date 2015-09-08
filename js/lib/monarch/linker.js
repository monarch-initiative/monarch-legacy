/* 
 * Package: linker.js
 * 
 * Namespace: bbop.monarch.linker
 * 
 * Generic Monarch link generator
 * 
 * Server information generated from conf/server_config*
 * files
 * 
 * External inks generated with conf/xrefs.json
 * 
 * Global variables passed by PupTent in webapp.js:
 * 
 * global_app_base: App host address from conf/server_config*
 * global_xrefs_conf: Xrefs conf file from conf/xrefs.json
 * 
 */

// Module and namespace checking.
if (typeof bbop == 'undefined') { var bbop = {};}
if (typeof bbop.monarch == 'undefined') { bbop.monarch = {};}

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
bbop.monarch.linker = function (){
    this._is_a = 'bbop.monarch.linker';

    // With the new dispatcher, relative URLs no longer work, so we
    // have to bring in server data--first let's ensure it.
    if(typeof global_app_base === 'undefined'){
    throw new Error('we are missing access to global_app_base!');
    }
    // Easy app base.
    this.app_base = global_app_base;

    // Categories for different special cases (internal links).
    this.generic_item = {
        'subject': true,
        'object': true
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
bbop.monarch.linker.prototype.url = function (id, xid, modifier, category){
    
    var retval = null;

    ///
    /// Monarch hard-coded internal link types.
    ///

    // For us, having an xid means that we will be doing some more
    // complicated routing.
    if(xid && xid != ''){

        // First let's do the ones that need an associated id to
        // function--either data urls or searches.
        if(id && id != ''){
            if(this.generic_item[xid]){
                if (typeof category === 'undefined'){
                    throw new Error('category is missing!');
                } else if (category != 'pathway' && !(/^_/.test(id))){
                    retval = this.app_base + '/' + category + '/' + id;
                }
            }
        }
    
        // Since we couldn't find anything with our explicit local
        // transformation set, drop into the great abyss of the xref data.
        if(!retval && id && id != ''){ // not internal, but still has an id
            if(!global_xrefs_conf){
                throw new Error('global_xrefs_conf is missing!');
            }
    
            // First, extract the probable source and break it into parts.
            var full_id_parts = bbop.core.first_split(':', id);
            if(full_id_parts && full_id_parts[0] && full_id_parts[1]){
                var src = full_id_parts[0];
                var sid = full_id_parts[1];
        
                // Now, check to see if it is indeed in our store.
                var lc_src = src.toLowerCase();
                var xref = global_xrefs_conf[lc_src];
                if (xref && xref['url_syntax']){
                    retval =
                        xref['url_syntax'].replace('[example_id]', sid, 'g');
                }
            }
        }
    }
    return retval;
};

/*
 * Function: img
 * 
 * Return a html img string.
 * 
 * Arguments:
 *  args - id
 *  xid - *[optional]* an internal transformation id
 *  modifier - *[optional]* modify xid; only used with xid
 * 
 * Returns:
 *  string (img tag); null if it couldn't create anything
 */
bbop.monarch.linker.prototype.img = function (id, xid, modifier, category){
    
    var retval = null;

    ///
    /// Monarch hard-coded internal link types.
    ///

    // For us, having an xid means that we will be doing some more
    // complicated routing.
    if(xid && xid != ''){

        if(!retval && id && id != ''){ // not internal, but still has an id
            if(!global_xrefs_conf){
                throw new Error('global_xrefs_conf is missing!');
            }
            var src;
            if (/^http/.test(id)){
                src = id.replace(/.*\/(\w+)\.ttl/, "$1");
            } else {
    
                // First, extract the probable source and break it into parts.
                var full_id_parts = bbop.core.first_split(':', id);
                if(full_id_parts && full_id_parts[0] && full_id_parts[1]){
                    src = full_id_parts[0];
                }
            }
            
            if (src) {
                
                // Now, check to see if it is indeed in our store.
                var lc_src = src.toLowerCase();
                var xref = global_xrefs_conf[lc_src];
                if (xref && xref['image_path']){
                    retval = '<img class="source" src="' + global_app_base 
                              + xref['image_path'] + '"/>';
                }
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
 * If args['id'] is a list then iterate over this.set_anchor()
 * 
 * Arguments:
 *  args - hash--'id' required; 'label' and 'hilite' are inferred if not extant
 *  xid - *[optional]* an internal transformation id
 *  rest - *[optional]* modify xid; only used with xid
 * 
 * Returns:
 *  string (link); null if it couldn't create anything
 */
bbop.monarch.linker.prototype.anchor = function(args, xid, modifier){
    
    var anchor = this;
    var retval = null;

    // Don't even start if there is nothing.
    if(args){
        // Get what fundamental arguments we can.
        var id = args['id'];
        if (typeof id === 'string'){
            retval = this.set_anchor(id, args, xid, modifier);
        } else if (id instanceof Array){
            retval = '';
            for (var i = 0, l = id.length; i < l; i++){
                var anchor_tag = this.set_anchor(id[i], args, xid, modifier);
                
                if (anchor_tag){
                    retval = retval + ((retval) ? ', ' + anchor_tag : anchor_tag);
                } 
            }
            if (retval === ''){
                retval = null;
            }
        }
    }

    return retval;
};

/*
 * Function: set_anchor
 * 
 * Return a link as a chunk of HTML, all ready to consume in a
 * display.
 */
bbop.monarch.linker.prototype.set_anchor = function(id, args, xid, modifier){
    
    var retval = null;
    var label = args['label'];
    if (!label){ 
        label = id; 
    }
    
    // Infer hilite from label if not present.
    var hilite = args['hilite'];
    if (!hilite){ hilite = label; }
    
    var category = args['category'];
    
    // See if the URL is legit. If it is, make something for it.
    var url = this.url(id, xid, modifier, category);
    var img = this.img(id, xid, modifier, category);
    if (url){

        // If it wasn't in the special transformations, just make
        // something generic.
        if (!retval && img
                && xid == 'source-site'){
            retval = '<a title="' + id +
            ' (go to source page)" href="' + url + '">' + img + '</a>';
        } else if (!retval && img
                && xid == 'source'){
            retval = '<a title="' + id +
            ' (go to source page) " + href="' + url + '">' + id + '</a>';
        }
        else if (!retval){
            // We want to escape < and >
            // should probably break out into function
            hilite = hilite.replace(/\>/g,'&gt;');
            hilite = hilite.replace(/\</g,'&lt;');
            
            retval = '<a title="' + id +
            ' (go to the page for ' + label +
            ')" href="' + url + '">' + hilite + '</a>';
        }
    } else {
        // Check if id is an is_defined_by url
        var title = "";
        if (/^http/.test(id)){
            src = id.replace(/.*\/(\w+)\.ttl/, "$1");
            var lc_src = src.toLowerCase();
            var xref = global_xrefs_conf[lc_src];
            if (xref && xref['database']){
                title = xref['database'];
            }
        }
        if (!retval && img
                && xid == 'is_defined_by'){
            retval = '<span title="' + title + '">' + img + '</span>';
        }
    }
    return retval;
}
    

