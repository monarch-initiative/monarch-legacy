    [
        {
            component : "federation",
            priority : 1,
            url : "http://beta.neuinfo.org/services/v1/federation/data/nlx_151835-1.json?includePrimaryData=true&q=HP_0003797",
            desc : "Query OmimDiseasePhenotype using an HPO ID; we expect diseases directly annotated and annotated to subclasses",
            notes : "This test needs fully configured",
            expects : {
                format : "json",
                min_results : 2
            }
        },

        {
            component : "vocabulary",
            priority : 1,
            url : "http://beta.neuinfo.org/services/v1/vocabulary.json?prefix=small+adrenal+gland&vocabulary=monarch",
            desc : "Autocomplete query form 'small adrenal...'",
            expects : {
                format : "json",
                min_results : 2,
                must_contain : {
                    id : "MP_0002768"
                },
            }
        },

        {
            component : "ontoquest",
            priority : 1,
            url : "http://nif-services-stage.neuinfo.org//ontoquest-lamhdi/concepts/term/HP_0003325",
            desc : "Concept details for 'limb girdle muscle weakness''",
            notes : "Currently just checks for string matches in returned XML",
            expects : {
                format : "xml",
                raw_contains : "Limb-girdle muscle weakness",
            }
        },

        {
            component : "monarch",
            priority : 1,
            url : "http://tartini.crbs.ucsd.edu",
            desc : "Top level monarch portal page",
            notes : "Currently just checks for string matches in returned HTML",
            expects : {
                format : "html",
                raw_contains : "Welcome to Monarch",
            }
        },

        {
            component : "monarch",
            priority : 1,
            url : "http://tartini.crbs.ucsd.edu/disease/DOID_14330",
            desc : "A DO disease page",
            expects : {
                format : "html",
                raw_contains : 
                [
                    "DOID_14330",
                    "Parkinsonism" // HP term associated
                ]
            }
        },

        {
            component : "monarch",
            subcomponent : "simsearch",
            priority : 1,
            url : "http://tartini.crbs.ucsd.edu/simsearch/phenotype/?input_items=HP:0002360,HP:0002015,HP:0002063,HP:0002322&target_species=10090",
            desc : "Simsearch (layered on owlsim)",
            expects : {
                format : "json",
                raw_contains : 
                [
                    "MGI",
                    "HP:0002360",
                ]
            }
        },


            
    ]
