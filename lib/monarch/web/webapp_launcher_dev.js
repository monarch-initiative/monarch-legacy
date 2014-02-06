if (typeof bbop == 'undefined') { var bbop = {};}
if (typeof bbop.monarch == 'undefined') { bbop.monarch = {};}
// see: https://docs.google.com/document/d/1ZxGuuvyvMmHVWQ7rIleIRkmbiDTNNP27eAHhxyFWHok/edit#
bbop.monarch.defaultConfig =
    {
        type : "dev",

	//ontology_services_url : 'http://nif-services-stage.neuinfo.org/ontoquest-lamhdi/',  // postgres-stage.neuinfo.org
	ontology_services_url : 'http://services.monarchinitiative.org/ontoquest/',

	federation_services_url : "http://beta.neuinfo.org/services/v1/federation/",

	owlsim_services_url : "http://owlsim.crbs.ucsd.edu/",

        autocomplete_url : "http://beta.neuinfo.org/services/v1/vocabulary.json"
    };
load('lib/monarch/web/webapp_launcher.js');
console.log("This is a development server");
