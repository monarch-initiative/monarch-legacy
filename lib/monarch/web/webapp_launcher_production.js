if (typeof bbop == 'undefined') { var bbop = {};}
if (typeof bbop.monarch == 'undefined') { bbop.monarch = {};}
// see: https://docs.google.com/document/d/1ZxGuuvyvMmHVWQ7rIleIRkmbiDTNNP27eAHhxyFWHok/edit#
bbop.monarch.defaultConfig =
    {
        type : "production",

	ontology_services_url : 'http://services.monarchinitiative.org/ontoquest/',

	//federation_services_url : "http://neuinfo.org/services/v1/federation/",  // WE HAVE TO USE BETA FOR NOW
	federation_services_url : "http://beta.neuinfo.org/services/v1/federation/",

	owlsim_services_url : "http://owlsim.crbs.ucsd.edu/"

        autocomplete_url : "http://beta.neuinfo.org/services/v1/vocabulary.json"
    };
load('lib/monarch/web/webapp_launcher.js');
console.log("This is the production server");
