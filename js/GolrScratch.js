//Some documentation here
function getTableFromSolr(id){
    id = id.replace(":","_");
    // Conf.
    var gconf = new bbop.golr.conf(getConf());
    var srv = global_solr_url;
    var sd = new amigo.data.server();
    var defs = new amigo.data.definitions();
    var handler = new amigo.handler();
    var linker = new amigo.linker();
    var confc = gconf.get_class('annotation');
    
    // Other widget tests; start with manager.
    var srch = new bbop.golr.manager.jquery(srv, gconf);

    srch.set_personality('annotation');
    //srch.add_query_filter('document_category', 'annotation', ['*']);
    srch.add_query_filter('isa_partof_closure', id, ['*']);
    
    // Add filters.
    var f_opts = {
    'meta_label': 'Total:&nbsp;',
    'display_free_text_p': true
    };
    var filters = new bbop.widget.live_filters('bs3filter', srch, gconf, f_opts);
    filters.establish_display();

    // Attach pager.
    var pager_opts = {
    };
    var pager = new bbop.widget.live_pager('bs3pager', srch, pager_opts);
    // Add results.
    var results_opts = {
    //'callback_priority': -200,
    'user_buttons_div_id': pager.button_span_id(),
    'user_buttons': [],
    'selectable_p' : false
    };
    var results = new bbop.widget.live_results('bs3results', srch, confc,
                           handler, linker, results_opts);
    
    // Add pre and post run spinner (borrow filter's for now).
    srch.register('prerun', 'foo', function(){
    filters.spin_up();
    });
    srch.register('postrun', 'foo', function(){
    filters.spin_down();
    });
    
    // Initial run.
    srch.search();
}

function getOntologyBrowser(id){
    
    // Conf.
    var gconf = new bbop.golr.conf(amigo.data.golr);
    var srv = 'http://toaster.lbl.gov:9000/solr/';
    var sd = new amigo.data.server();
    var defs = new amigo.data.definitions();
    var handler = new amigo.handler();
    var linker = new amigo.linker();
    var confc = gconf.get_class('annotation');
    
    // Browser.
    var b = new bbop.widget.browse(srv, gconf, 'brw', {
    'transitivity_graph_field':
    'regulates_transitivity_graph_json',
    'base_icon_url': sd.image_base(),
    'info_icon': 'info',
    'current_icon': 'current_term',
    'image_type': 'gif',
    'info_button_callback':
    function(term_acc, term_doc){
        // // Local form.
        // shield.draw(term_doc);
        // Remote form (works).
        //shield.draw(term_acc);
    }
    });
    b.draw_browser(id);
    
}

function LaunchEverything(){
  
    if( phenotypeID ){ // globally declared from webapp.js
    
     getTableFromSolr(phenotypeID);
     getOntologyBrowser(phenotypeID);
    }
}
//Just a something to mess with, this gets populated from the solr yaml
// TODO: load this dynamically. See: https://github.com/monarch-initiative/monarch-app/issues/629
function getConf(){
    return {
             "annotation" : {
                "boost_weights" : "annotation_class^2.0 annotation_class_label^1.0 bioentity^2.0 bioentity_label^1.0 bioentity_name^1.0 annotation_extension_class^2.0 annotation_extension_class_label^1.0 reference^1.0 panther_family^1.0 panther_family_label^1.0 bioentity_isoform^1.0 regulates_closure^1.0 regulates_closure_label^1.0",
                "display_name" : "Annotations",
                "_infile" : "/home/sjcarbon/local/src/git/amigo/metadata/ann-config.yaml",
                "result_weights" : "bioentity^7.0 annotation_class^4.7 source^4.0 reference^0.25",
                "weight" : "20",
                "document_category" : "annotation",
                "schema_generating" : "true",
                //"filter_weights" : "source^7.0 assigned_by^6.5 aspect^6.25 evidence_type_closure^6.0 panther_family_label^5.5 qualifier^5.25 taxon_closure_label^5.0 annotation_class_label^4.5 regulates_closure_label^3.0 annotation_extension_class_closure_label^2.0",
                "filter_weights" : "bioentity_label^7.0 annotation_class_label^7.5 source^7.0",
                "fields_hash" : {
                   "bioentity_internal_id" : {
                      "type" : "string",
                      "display_name" : "This should not be displayed",
                      "property" : [],
                      "cardinality" : "single",
                      "indexed" : "false",
                      "id" : "bioentity_internal_id",
                      "required" : "false",
                      "description" : "The bioentity ID used at the database of origin.",
                      "searchable" : "false",
                      "transform" : []
                   },
                   "panther_family_label" : {
                      "type" : "string",
                      "display_name" : "PANTHER family",
                      "property" : [],
                      "cardinality" : "single",
                      "indexed" : "true",
                      "id" : "panther_family_label",
                      "required" : "false",
                      "description" : "PANTHER families that are associated with this entity.",
                      "searchable" : "true",
                      "transform" : []
                   },
                   "secondary_taxon" : {
                      "type" : "string",
                      "indexed" : "true",
                      "property" : [],
                      "display_name" : "Secondary taxon",
                      "cardinality" : "single",
                      "description" : "Secondary taxon.",
                      "searchable" : "false",
                      "id" : "secondary_taxon",
                      "required" : "false",
                      "transform" : []
                   },
                   "qualifier" : {
                      "transform" : [],
                      "description" : "Annotation qualifier.",
                      "searchable" : "false",
                      "required" : "false",
                      "id" : "qualifier",
                      "indexed" : "true",
                      "property" : [],
                      "display_name" : "Qualifier",
                      "cardinality" : "multi",
                      "type" : "string"
                   },
                   "panther_family" : {
                      "description" : "PANTHER families that are associated with this entity.",
                      "searchable" : "true",
                      "required" : "false",
                      "id" : "panther_family",
                      "transform" : [],
                      "type" : "string",
                      "indexed" : "true",
                      "display_name" : "PANTHER family",
                      "property" : [],
                      "cardinality" : "single"
                   },
                   "evidence_with" : {
                      "indexed" : "true",
                      "cardinality" : "multi",
                      "display_name" : "Evidence with",
                      "property" : [],
                      "type" : "string",
                      "transform" : [],
                      "searchable" : "false",
                      "description" : "Evidence with/from.",
                      "id" : "evidence_with",
                      "required" : "false"
                   },
                   "is_redundant_for" : {
                      "type" : "string",
                      "property" : [],
                      "display_name" : "Redundant for",
                      "cardinality" : "single",
                      "indexed" : "true",
                      "required" : "false",
                      "id" : "is_redundant_for",
                      "description" : "Rational for redundancy of annotation.",
                      "searchable" : "false",
                      "transform" : []
                   },
                   "reference" : {
                      "transform" : [],
                      "id" : "reference",
                      "required" : "false",
                      "searchable" : "false",
                      "description" : "Database reference.",
                      "cardinality" : "multi",
                      "property" : [],
                      "display_name" : "Reference",
                      "indexed" : "true",
                      "type" : "string"
                   },
                   "taxon_label" : {
                      "type" : "string",
                      "indexed" : "true",
                      "property" : [],
                      "display_name" : "Taxon",
                      "cardinality" : "single",
                      "description" : "Taxonomic group and ancestral groups.",
                      "searchable" : "true",
                      "id" : "taxon_label",
                      "required" : "false",
                      "transform" : []
                   },
                   "annotation_extension_class" : {
                      "type" : "string",
                      "indexed" : "true",
                      "display_name" : "Annotation extension",
                      "property" : [],
                      "cardinality" : "multi",
                      "description" : "Extension class for the annotation.",
                      "searchable" : "false",
                      "id" : "annotation_extension_class",
                      "required" : "false",
                      "transform" : []
                   },
                   "annotation_extension_class_closure_label" : {
                      "searchable" : "true",
                      "description" : "Extension class for the annotation.",
                      "required" : "false",
                      "id" : "annotation_extension_class_closure_label",
                      "transform" : [],
                      "type" : "string",
                      "indexed" : "true",
                      "cardinality" : "multi",
                      "display_name" : "Annotation extension",
                      "property" : []
                   },
                   "source" : {
                      "required" : "false",
                      "id" : "source",
                      "searchable" : "false",
                      "description" : "Database source.",
                      "transform" : [],
                      "type" : "string",
                      "cardinality" : "single",
                      "property" : [],
                      "display_name" : "Source",
                      "indexed" : "true"
                   },
                   "taxon_closure_label" : {
                      "transform" : [],
                      "id" : "taxon_closure_label",
                      "required" : "false",
                      "description" : "Taxonomic group and ancestral groups.",
                      "searchable" : "true",
                      "property" : [],
                      "display_name" : "Taxon",
                      "cardinality" : "multi",
                      "indexed" : "true",
                      "type" : "string"
                   },
                   "secondary_taxon_label" : {
                      "type" : "string",
                      "display_name" : "Secondary taxon",
                      "property" : [],
                      "cardinality" : "single",
                      "indexed" : "true",
                      "id" : "secondary_taxon_label",
                      "required" : "false",
                      "description" : "Secondary taxon.",
                      "searchable" : "true",
                      "transform" : []
                   },
                   "isa_partof_closure" : {
                      "id" : "isa_partof_closure",
                      "required" : "false",
                      "searchable" : "false",
                      "description" : "Annotations for this term or its children (over is_a/part_of).",
                      "transform" : [],
                      "type" : "string",
                      "cardinality" : "multi",
                      "property" : [],
                      "display_name" : "Involved in",
                      "indexed" : "true"
                   },
                   "bioentity_isoform" : {
                      "transform" : [],
                      "searchable" : "false",
                      "description" : "Biological isoform.",
                      "id" : "bioentity_isoform",
                      "required" : "false",
                      "indexed" : "true",
                      "cardinality" : "single",
                      "property" : [],
                      "display_name" : "Isoform",
                      "type" : "string"
                   },
                   "assigned_by" : {
                      "transform" : [],
                      "searchable" : "false",
                      "description" : "Annotations assigned by group.",
                      "id" : "assigned_by",
                      "required" : "false",
                      "indexed" : "true",
                      "cardinality" : "single",
                      "property" : [],
                      "display_name" : "Assigned by",
                      "type" : "string"
                   },
                   "taxon_closure" : {
                      "type" : "string",
                      "cardinality" : "multi",
                      "display_name" : "Taxon",
                      "property" : [],
                      "indexed" : "true",
                      "required" : "false",
                      "id" : "taxon_closure",
                      "searchable" : "false",
                      "description" : "Taxonomic group and ancestral groups.",
                      "transform" : []
                   },
                   "annotation_extension_json" : {
                      "id" : "annotation_extension_json",
                      "required" : "false",
                      "searchable" : "false",
                      "description" : "Extension class for the annotation (JSON).",
                      "transform" : [],
                      "type" : "string",
                      "cardinality" : "multi",
                      "display_name" : "Annotation extension",
                      "property" : [],
                      "indexed" : "true"
                   },
                   "evidence_type_closure" : {
                      "transform" : [],
                      "id" : "evidence_type_closure",
                      "required" : "false",
                      "searchable" : "false",
                      "description" : "All evidence (evidence closure) for this annotation",
                      "cardinality" : "multi",
                      "display_name" : "Evidence type",
                      "property" : [],
                      "indexed" : "true",
                      "type" : "string"
                   },
                   "evidence_type" : {
                      "type" : "string",
                      "indexed" : "true",
                      "display_name" : "Evidence",
                      "property" : [],
                      "cardinality" : "single",
                      "description" : "Evidence type.",
                      "searchable" : "false",
                      "required" : "false",
                      "id" : "evidence_type",
                      "transform" : []
                   },
                   "bioentity" : {
                      "id" : "bioentity",
                      "required" : "false",
                      "description" : "Gene or gene product identifiers.",
                      "searchable" : "false",
                      "transform" : [],
                      "type" : "string",
                      "display_name" : "Disease",
                      "property" : [],
                      "cardinality" : "single",
                      "indexed" : "true"
                   },
                   "secondary_taxon_closure" : {
                      "description" : "Secondary taxon closure.",
                      "searchable" : "false",
                      "id" : "secondary_taxon_closure",
                      "required" : "false",
                      "transform" : [],
                      "type" : "string",
                      "indexed" : "true",
                      "property" : [],
                      "display_name" : "Secondary taxon",
                      "cardinality" : "multi"
                   },
                   "date" : {
                      "type" : "string",
                      "cardinality" : "single",
                      "display_name" : "Date",
                      "property" : [],
                      "indexed" : "true",
                      "id" : "date",
                      "required" : "false",
                      "searchable" : "false",
                      "description" : "Date of assignment.",
                      "transform" : []
                   },
                   "secondary_taxon_closure_label" : {
                      "cardinality" : "multi",
                      "property" : [],
                      "display_name" : "Secondary taxon",
                      "indexed" : "true",
                      "type" : "string",
                      "transform" : [],
                      "required" : "false",
                      "id" : "secondary_taxon_closure_label",
                      "searchable" : "true",
                      "description" : "Secondary taxon closure."
                   },
                   "regulates_closure" : {
                      "id" : "regulates_closure",
                      "required" : "false",
                      "searchable" : "false",
                      "description" : "Annotations for this term or its children (over regulates).",
                      "transform" : [],
                      "type" : "string",
                      "cardinality" : "multi",
                      "display_name" : "Inferred annotation",
                      "property" : [],
                      "indexed" : "true"
                   },
                   "type" : {
                      "required" : "false",
                      "id" : "type",
                      "description" : "Type class.",
                      "searchable" : "false",
                      "transform" : [],
                      "type" : "string",
                      "property" : [],
                      "display_name" : "Type class id",
                      "cardinality" : "single",
                      "indexed" : "true"
                   },
                   "annotation_extension_class_label" : {
                      "searchable" : "true",
                      "description" : "Extension class for the annotation.",
                      "id" : "annotation_extension_class_label",
                      "required" : "false",
                      "transform" : [],
                      "type" : "string",
                      "indexed" : "true",
                      "cardinality" : "multi",
                      "display_name" : "Annotation extension",
                      "property" : []
                   },
                   "bioentity_name" : {
                      "indexed" : "true",
                      "display_name" : "Gene/product name",
                      "property" : [],
                      "cardinality" : "single",
                      "type" : "string",
                      "transform" : [],
                      "description" : "The full name of the gene or gene product.",
                      "searchable" : "true",
                      "required" : "false",
                      "id" : "bioentity_name"
                   },
                   "synonym" : {
                      "type" : "string",
                      "property" : [],
                      "display_name" : "Synonym",
                      "cardinality" : "multi",
                      "indexed" : "true",
                      "id" : "synonym",
                      "required" : "false",
                      "description" : "Gene or gene product synonyms.",
                      "searchable" : "false",
                      "transform" : []
                   },
                   "has_participant_closure" : {
                      "indexed" : "true",
                      "display_name" : "Has participant (IDs)",
                      "property" : [],
                      "cardinality" : "multi",
                      "type" : "string",
                      "transform" : [],
                      "description" : "Closure of ids/accs over has_participant.",
                      "searchable" : "false",
                      "id" : "has_participant_closure",
                      "required" : "false"
                   },
                   "isa_partof_closure_label" : {
                      "indexed" : "true",
                      "cardinality" : "multi",
                      "display_name" : "Involved in",
                      "property" : [],
                      "type" : "string",
                      "transform" : [],
                      "searchable" : "true",
                      "description" : "Annotations for this term or its children (over is_a/part_of).",
                      "required" : "false",
                      "id" : "isa_partof_closure_label"
                   },
                   "taxon" : {
                      "transform" : [],
                      "id" : "taxon",
                      "required" : "false",
                      "searchable" : "false",
                      "description" : "Taxonomic group.",
                      "cardinality" : "single",
                      "display_name" : "Taxon",
                      "property" : [],
                      "indexed" : "true",
                      "type" : "string"
                   },
                   "bioentity_label" : {
                      "description" : "Gene or gene product identifiers.",
                      "searchable" : "true",
                      "required" : "false",
                      "id" : "bioentity_label",
                      "transform" : [],
                      "type" : "string",
                      "indexed" : "true",
                      "property" : [],
                      "display_name" : "Disease",
                      "cardinality" : "single"
                   },
                   "id" : {
                      "type" : "string",
                      "property" : [],
                      "display_name" : "Acc",
                      "cardinality" : "single",
                      "indexed" : "true",
                      "required" : "false",
                      "id" : "id",
                      "description" : "A unique (and internal) combination of bioentity and ontology class.",
                      "searchable" : "false",
                      "transform" : []
                   },
                   "regulates_closure_label" : {
                      "transform" : [],
                      "description" : "Annotations for this term or its children (over regulates).",
                      "searchable" : "true",
                      "required" : "false",
                      "id" : "regulates_closure_label",
                      "indexed" : "true",
                      "display_name" : "Inferred annotation",
                      "property" : [],
                      "cardinality" : "multi",
                      "type" : "string"
                   },
                   "has_participant_closure_label" : {
                      "transform" : [],
                      "id" : "has_participant_closure_label",
                      "required" : "false",
                      "description" : "Closure of labels over has_participant.",
                      "searchable" : "true",
                      "display_name" : "Has participant",
                      "property" : [],
                      "cardinality" : "multi",
                      "indexed" : "true",
                      "type" : "string"
                   },
                   "aspect" : {
                      "cardinality" : "single",
                      "display_name" : "Ontology (aspect)",
                      "property" : [],
                      "indexed" : "true",
                      "type" : "string",
                      "transform" : [],
                      "id" : "aspect",
                      "required" : "false",
                      "searchable" : "false",
                      "description" : "Ontology aspect."
                   },
                   "annotation_class_label" : {
                      "id" : "annotation_class_label",
                      "required" : "false",
                      "description" : "Direct annotations.",
                      "searchable" : "true",
                      "transform" : [],
                      "type" : "string",
                      "property" : [],
                      "display_name" : "Phenotype",
                      "cardinality" : "single",
                      "indexed" : "true"
                   },
                   "annotation_class" : {
                      "id" : "annotation_class",
                      "required" : "false",
                      "searchable" : "false",
                      "description" : "Direct annotations.",
                      "transform" : [],
                      "type" : "string",
                      "cardinality" : "single",
                      "display_name" : "Phenotype",
                      "property" : [],
                      "indexed" : "true"
                   },
                   "annotation_extension_class_closure" : {
                      "type" : "string",
                      "indexed" : "true",
                      "cardinality" : "multi",
                      "display_name" : "Annotation extension",
                      "property" : [],
                      "searchable" : "false",
                      "description" : "Extension class for the annotation.",
                      "required" : "false",
                      "id" : "annotation_extension_class_closure",
                      "transform" : []
                   }
                },
                "fields" : [
                   {
                      "type" : "string",
                      "property" : [],
                      "display_name" : "Acc",
                      "cardinality" : "single",
                      "indexed" : "true",
                      "required" : "false",
                      "id" : "id",
                      "description" : "A unique (and internal) combination of bioentity and ontology class.",
                      "searchable" : "false",
                      "transform" : []
                   },
                   {
                      "required" : "false",
                      "id" : "source",
                      "searchable" : "false",
                      "description" : "Database source.",
                      "transform" : [],
                      "type" : "string",
                      "cardinality" : "single",
                      "property" : [],
                      "display_name" : "Source",
                      "indexed" : "true"
                   },
                   {
                      "required" : "false",
                      "id" : "type",
                      "description" : "Type class.",
                      "searchable" : "false",
                      "transform" : [],
                      "type" : "string",
                      "property" : [],
                      "display_name" : "Type class id",
                      "cardinality" : "single",
                      "indexed" : "true"
                   },
                   {
                      "type" : "string",
                      "cardinality" : "single",
                      "display_name" : "Date",
                      "property" : [],
                      "indexed" : "true",
                      "id" : "date",
                      "required" : "false",
                      "searchable" : "false",
                      "description" : "Date of assignment.",
                      "transform" : []
                   },
                   {
                      "transform" : [],
                      "searchable" : "false",
                      "description" : "Annotations assigned by group.",
                      "id" : "assigned_by",
                      "required" : "false",
                      "indexed" : "true",
                      "cardinality" : "single",
                      "property" : [],
                      "display_name" : "Assigned by",
                      "type" : "string"
                   },
                   {
                      "type" : "string",
                      "property" : [],
                      "display_name" : "Redundant for",
                      "cardinality" : "single",
                      "indexed" : "true",
                      "required" : "false",
                      "id" : "is_redundant_for",
                      "description" : "Rational for redundancy of annotation.",
                      "searchable" : "false",
                      "transform" : []
                   },
                   {
                      "transform" : [],
                      "id" : "taxon",
                      "required" : "false",
                      "searchable" : "false",
                      "description" : "Taxonomic group.",
                      "cardinality" : "single",
                      "display_name" : "Taxon",
                      "property" : [],
                      "indexed" : "true",
                      "type" : "string"
                   },
                   {
                      "type" : "string",
                      "indexed" : "true",
                      "property" : [],
                      "display_name" : "Taxon",
                      "cardinality" : "single",
                      "description" : "Taxonomic group and ancestral groups.",
                      "searchable" : "true",
                      "id" : "taxon_label",
                      "required" : "false",
                      "transform" : []
                   },
                   {
                      "type" : "string",
                      "cardinality" : "multi",
                      "display_name" : "Taxon",
                      "property" : [],
                      "indexed" : "true",
                      "required" : "false",
                      "id" : "taxon_closure",
                      "searchable" : "false",
                      "description" : "Taxonomic group and ancestral groups.",
                      "transform" : []
                   },
                   {
                      "transform" : [],
                      "id" : "taxon_closure_label",
                      "required" : "false",
                      "description" : "Taxonomic group and ancestral groups.",
                      "searchable" : "true",
                      "property" : [],
                      "display_name" : "Taxon",
                      "cardinality" : "multi",
                      "indexed" : "true",
                      "type" : "string"
                   },
                   {
                      "type" : "string",
                      "indexed" : "true",
                      "property" : [],
                      "display_name" : "Secondary taxon",
                      "cardinality" : "single",
                      "description" : "Secondary taxon.",
                      "searchable" : "false",
                      "id" : "secondary_taxon",
                      "required" : "false",
                      "transform" : []
                   },
                   {
                      "type" : "string",
                      "display_name" : "Secondary taxon",
                      "property" : [],
                      "cardinality" : "single",
                      "indexed" : "true",
                      "id" : "secondary_taxon_label",
                      "required" : "false",
                      "description" : "Secondary taxon.",
                      "searchable" : "true",
                      "transform" : []
                   },
                   {
                      "description" : "Secondary taxon closure.",
                      "searchable" : "false",
                      "id" : "secondary_taxon_closure",
                      "required" : "false",
                      "transform" : [],
                      "type" : "string",
                      "indexed" : "true",
                      "property" : [],
                      "display_name" : "Secondary taxon",
                      "cardinality" : "multi"
                   },
                   {
                      "cardinality" : "multi",
                      "property" : [],
                      "display_name" : "Secondary taxon",
                      "indexed" : "true",
                      "type" : "string",
                      "transform" : [],
                      "required" : "false",
                      "id" : "secondary_taxon_closure_label",
                      "searchable" : "true",
                      "description" : "Secondary taxon closure."
                   },
                   {
                      "id" : "isa_partof_closure",
                      "required" : "false",
                      "searchable" : "false",
                      "description" : "Annotations for this term or its children (over is_a/part_of).",
                      "transform" : [],
                      "type" : "string",
                      "cardinality" : "multi",
                      "property" : [],
                      "display_name" : "Involved in",
                      "indexed" : "true"
                   },
                   {
                      "indexed" : "true",
                      "cardinality" : "multi",
                      "display_name" : "Involved in",
                      "property" : [],
                      "type" : "string",
                      "transform" : [],
                      "searchable" : "true",
                      "description" : "Annotations for this term or its children (over is_a/part_of).",
                      "required" : "false",
                      "id" : "isa_partof_closure_label"
                   },
                   {
                      "id" : "regulates_closure",
                      "required" : "false",
                      "searchable" : "false",
                      "description" : "Annotations for this term or its children (over regulates).",
                      "transform" : [],
                      "type" : "string",
                      "cardinality" : "multi",
                      "display_name" : "Inferred annotation",
                      "property" : [],
                      "indexed" : "true"
                   },
                   {
                      "transform" : [],
                      "description" : "Annotations for this term or its children (over regulates).",
                      "searchable" : "true",
                      "required" : "false",
                      "id" : "regulates_closure_label",
                      "indexed" : "true",
                      "display_name" : "Inferred annotation",
                      "property" : [],
                      "cardinality" : "multi",
                      "type" : "string"
                   },
                   {
                      "indexed" : "true",
                      "display_name" : "Has participant (IDs)",
                      "property" : [],
                      "cardinality" : "multi",
                      "type" : "string",
                      "transform" : [],
                      "description" : "Closure of ids/accs over has_participant.",
                      "searchable" : "false",
                      "id" : "has_participant_closure",
                      "required" : "false"
                   },
                   {
                      "transform" : [],
                      "id" : "has_participant_closure_label",
                      "required" : "false",
                      "description" : "Closure of labels over has_participant.",
                      "searchable" : "true",
                      "display_name" : "Has participant",
                      "property" : [],
                      "cardinality" : "multi",
                      "indexed" : "true",
                      "type" : "string"
                   },
                   {
                      "type" : "string",
                      "property" : [],
                      "display_name" : "Synonym",
                      "cardinality" : "multi",
                      "indexed" : "true",
                      "id" : "synonym",
                      "required" : "false",
                      "description" : "Gene or gene product synonyms.",
                      "searchable" : "false",
                      "transform" : []
                   },
                   {
                      "id" : "bioentity",
                      "required" : "false",
                      "description" : "Gene or gene product identifiers.",
                      "searchable" : "false",
                      "transform" : [],
                      "type" : "string",
                      "display_name" : "Gene/product",
                      "property" : [],
                      "cardinality" : "single",
                      "indexed" : "true"
                   },
                   {
                      "description" : "Gene or gene product identifiers.",
                      "searchable" : "true",
                      "required" : "false",
                      "id" : "bioentity_label",
                      "transform" : [],
                      "type" : "string",
                      "indexed" : "true",
                      "property" : [],
                      "display_name" : "Disease",
                      "cardinality" : "single"
                   },
                   {
                      "indexed" : "true",
                      "display_name" : "Gene/product name",
                      "property" : [],
                      "cardinality" : "single",
                      "type" : "string",
                      "transform" : [],
                      "description" : "The full name of the gene or gene product.",
                      "searchable" : "true",
                      "required" : "false",
                      "id" : "bioentity_name"
                   },
                   {
                      "type" : "string",
                      "display_name" : "This should not be displayed",
                      "property" : [],
                      "cardinality" : "single",
                      "indexed" : "false",
                      "id" : "bioentity_internal_id",
                      "required" : "false",
                      "description" : "The bioentity ID used at the database of origin.",
                      "searchable" : "false",
                      "transform" : []
                   },
                   {
                      "transform" : [],
                      "description" : "Annotation qualifier.",
                      "searchable" : "false",
                      "required" : "false",
                      "id" : "qualifier",
                      "indexed" : "true",
                      "property" : [],
                      "display_name" : "Qualifier",
                      "cardinality" : "multi",
                      "type" : "string"
                   },
                   {
                      "id" : "annotation_class",
                      "required" : "false",
                      "searchable" : "false",
                      "description" : "Direct annotations.",
                      "transform" : [],
                      "type" : "string",
                      "cardinality" : "single",
                      "display_name" : "Direct annotation",
                      "property" : [],
                      "indexed" : "true"
                   },
                   {
                      "id" : "annotation_class_label",
                      "required" : "false",
                      "description" : "Direct annotations.",
                      "searchable" : "true",
                      "transform" : [],
                      "type" : "string",
                      "property" : [],
                      "display_name" : "Direct annotation",
                      "cardinality" : "single",
                      "indexed" : "true"
                   },
                   {
                      "cardinality" : "single",
                      "display_name" : "Ontology (aspect)",
                      "property" : [],
                      "indexed" : "true",
                      "type" : "string",
                      "transform" : [],
                      "id" : "aspect",
                      "required" : "false",
                      "searchable" : "false",
                      "description" : "Ontology aspect."
                   },
                   {
                      "transform" : [],
                      "searchable" : "false",
                      "description" : "Biological isoform.",
                      "id" : "bioentity_isoform",
                      "required" : "false",
                      "indexed" : "true",
                      "cardinality" : "single",
                      "property" : [],
                      "display_name" : "Isoform",
                      "type" : "string"
                   },
                   {
                      "type" : "string",
                      "indexed" : "true",
                      "display_name" : "Evidence",
                      "property" : [],
                      "cardinality" : "single",
                      "description" : "Evidence type.",
                      "searchable" : "false",
                      "required" : "false",
                      "id" : "evidence_type",
                      "transform" : []
                   },
                   {
                      "transform" : [],
                      "id" : "evidence_type_closure",
                      "required" : "false",
                      "searchable" : "false",
                      "description" : "All evidence (evidence closure) for this annotation",
                      "cardinality" : "multi",
                      "display_name" : "Evidence type",
                      "property" : [],
                      "indexed" : "true",
                      "type" : "string"
                   },
                   {
                      "indexed" : "true",
                      "cardinality" : "multi",
                      "display_name" : "Evidence with",
                      "property" : [],
                      "type" : "string",
                      "transform" : [],
                      "searchable" : "false",
                      "description" : "Evidence with/from.",
                      "id" : "evidence_with",
                      "required" : "false"
                   },
                   {
                      "transform" : [],
                      "id" : "reference",
                      "required" : "false",
                      "searchable" : "false",
                      "description" : "Database reference.",
                      "cardinality" : "multi",
                      "property" : [],
                      "display_name" : "Reference",
                      "indexed" : "true",
                      "type" : "string"
                   },
                   {
                      "type" : "string",
                      "indexed" : "true",
                      "display_name" : "Annotation extension",
                      "property" : [],
                      "cardinality" : "multi",
                      "description" : "Extension class for the annotation.",
                      "searchable" : "false",
                      "id" : "annotation_extension_class",
                      "required" : "false",
                      "transform" : []
                   },
                   {
                      "searchable" : "true",
                      "description" : "Extension class for the annotation.",
                      "id" : "annotation_extension_class_label",
                      "required" : "false",
                      "transform" : [],
                      "type" : "string",
                      "indexed" : "true",
                      "cardinality" : "multi",
                      "display_name" : "Annotation extension",
                      "property" : []
                   },
                   {
                      "type" : "string",
                      "indexed" : "true",
                      "cardinality" : "multi",
                      "display_name" : "Annotation extension",
                      "property" : [],
                      "searchable" : "false",
                      "description" : "Extension class for the annotation.",
                      "required" : "false",
                      "id" : "annotation_extension_class_closure",
                      "transform" : []
                   },
                   {
                      "searchable" : "true",
                      "description" : "Extension class for the annotation.",
                      "required" : "false",
                      "id" : "annotation_extension_class_closure_label",
                      "transform" : [],
                      "type" : "string",
                      "indexed" : "true",
                      "cardinality" : "multi",
                      "display_name" : "Annotation extension",
                      "property" : []
                   },
                   {
                      "id" : "annotation_extension_json",
                      "required" : "false",
                      "searchable" : "false",
                      "description" : "Extension class for the annotation (JSON).",
                      "transform" : [],
                      "type" : "string",
                      "cardinality" : "multi",
                      "display_name" : "Annotation extension",
                      "property" : [],
                      "indexed" : "true"
                   },
                   {
                      "description" : "PANTHER families that are associated with this entity.",
                      "searchable" : "true",
                      "required" : "false",
                      "id" : "panther_family",
                      "transform" : [],
                      "type" : "string",
                      "indexed" : "true",
                      "display_name" : "PANTHER family",
                      "property" : [],
                      "cardinality" : "single"
                   },
                   {
                      "type" : "string",
                      "display_name" : "PANTHER family",
                      "property" : [],
                      "cardinality" : "single",
                      "indexed" : "true",
                      "id" : "panther_family_label",
                      "required" : "false",
                      "description" : "PANTHER families that are associated with this entity.",
                      "searchable" : "true",
                      "transform" : []
                   }
                ],
                "_strict" : 0,
                "description" : "Associations between GO terms and genes or gene products.",
                "searchable_extension" : "_searchable",
                "id" : "annotation",
                "_outfile" : "/home/sjcarbon/local/src/git/amigo/metadata/ann-config.yaml"
             }
          };
}
