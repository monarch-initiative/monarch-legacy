    [

        // ====================
        // FEDERATION SERVICES
        // ====================
        {
            component : "federation",
            priority : 1,
            url : "http://beta.neuinfo.org/services/v1/federation/data/nlx_151835-1.json?includePrimaryData=true&q=HP:0001337",
            desc : "DIRECT Query on OmimDiseasePhenotype using an HPO ID (Tremor)",
            expects : {
                format : "json",
                min_results : 0,
                must_contain : {
                    disorder_id : "OMIM:270500" // Ataxia, Spastic, Childhood-Onset, Autosomal Recessive, With Optic Atrophy And Mental Retardation
                }
            }
        },

        {
            component : "federation",
            priority : 1,
            url : "http://beta.neuinfo.org/services/v1/federation/data/nlx_151835-1.json?includePrimaryData=true&q=HP:0001337&includeSubclasses=true",
            desc : "INFERRED Query OmimDiseasePhenotype using an HPO ID (Tremor) - include subclasses - we expect diseases directly annotated and annotated to subclasses",
            expects : {
                format : "json",
                min_results : 20,
                must_contain : 
                [
                    {
                        aspect_text : "organ abnormality",
                        disorder_id : "OMIM:300619" // Cataract, Ataxia, Short Stature, And Mental Retardation
                    },
                    {  
                        aspect_text : "organ abnormality",
                        phenotype_id : "HP:0001337" // always include annotations to direct
                    },
                    {  
                        aspect_text : "organ abnormality",
                        phenotype_id : "HP:0002378" // annotation to hand tremor - indirect
                    },
                    {  
                        aspect_text : "organ abnormality",
                        phenotype_id : "HP:0002599", // Head titubation
                        "disorder_id": "OMIM:275550", // Trichorrhexis Nodosa Syndrome
                    },
                    
                ]
            }
        },

        {
            component : "federation",
            priority : 1,
            url : "http://beta.neuinfo.org/services/v1/federation/data/nif-0000-00096-6.json?includePrimaryData=true&count=1000&q=MP:0000428&includeSubclasses=true&",
            desc : "INFERRED MGI Geno Pheno using an MP ID (craniofacial) - include subclasses - we expect genotypes directly annotated and annotated to subclasses",
            expects : {
                format : "json",
                min_results : 20,
                must_contain : 
                [
                    // TODO
                ]
            }
        },

        {
            component : "federation",
            priority : 1,
            url : "http://beta.neuinfo.org/services/v1/federation/data/nif-0000-03216-9.json?includePrimaryData=true&count=1000&q=Huntington",
            desc : "Query OmimDiseaseVariants using string matching (expect Hungtindon's disease)",
            expects : {
                format : "json",
                min_results : 3,
                must_contain : {
                    phenotype_id : "OMIM:143100" // ID for Huntington's disease (note in this view, phenotype subsumes phenotype and disease)
                }
            }
        },

        // ====================
        // VOCABULARY SERVICES
        // ====================
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

        // ====================
        // ONTOQUEST QUERIES
        // ====================
        {
            component : "ontoquest",
            subcomponent : "concepts",
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
            component : "ontoquest",
            subcomponent : "rel",
            priority : 1,
            url : "http://nif-services-stage.neuinfo.org/ontoquest-lamhdi/rel/all/MP_0002789",
            desc : "Relationships for male pseudohermaphroditism",
            notes : "Currently just checks for string matches in returned XML",
            expects : {
                format : "xml",
                raw_contains : [
                    "HP_0000037", // equivalent HP class
                    "MP_0002787", // parent class pseudohermaphroditism
                ],
            }
        },

        // ====================
        // MONARCH QUERIES
        // ====================
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
            desc : "A DO disease page, Parkinsons",
            expects : {
                format : "html",
                raw_contains : 
                [
                    "DOID_14330",
                    "Parkinsonism", // HP term associated
                    "PINK1", // 
                    "Parkinson Disease 14", // OMIM subtype
                ]
            }
        },

        {
            component : "monarch",
            priority : 1,
            url : "http://tartini.crbs.ucsd.edu/phenotype/HP:0001337",
            desc : "A HPO phenotype disease page, Tremor",
            expects : {
                format : "html",
                raw_contains : 
                [
                    "Phenotype: Tremor",
                    "Cataract, Ataxia, Short Stature, And Mental Retardation", // associated with a subtype of tremor
                    "Grid2", // MGI genotype, for titubation
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

        {
            component : "monarch",
            priority : 1,
            url : "http://tartini.crbs.ucsd.edu/analyze/phenotypes",
            desc : "Top level monarch portal page page for phenotype profile search",
            notes : "Currently just checks for string matches in returned HTML",
            expects : {
                format : "html",
                raw_contains : "Monarch Analysis: phenotypes",
            }
        },


        {
            component : "monarch",
            priority : 1,
            url : "http://tartini.crbs.ucsd.edu/analyze/phenotypes/?target_species=10090&input_items=MP%3A0000788%0D%0AMP%3A0000822%0D%0AMP%3A0000914%0D%0AMP%3A0000929%0D%0AMP%3A0000930%0D%0AMP%3A0001286%0D%0AMP%3A0001393%0D%0AMP%3A0001688%0D%0AMP%3A0001698%0D%0AMP%3A0001732%0D%0AMP%3A0001787%0D%0AMP%3A0002064%0D%0AMP%3A0002083%0D%0AMP%3A0002151%0D%0AMP%3A0002950%0D%0AMP%3A0003012%0D%0AMP%3A0003424%0D%0AMP%3A0003651%0D%0AMP%3A0004948%0D%0AMP%3A0005657&limit=100",
            desc : "Results for phenotype profile search",
            notes : "Currently just checks for string matches in returned HTML",
            expects : {
                format : "html",
                raw_contains : "Cfl1",
            }
        },

        {
            component : "monarch",
            priority : 1,
            url : "http://tartini.crbs.ucsd.edu/reference/PMID:16516152",
            desc : "Pubmed query, which should redirect",
            expects : {
                redirect: true
            }
        },


            
    ]
