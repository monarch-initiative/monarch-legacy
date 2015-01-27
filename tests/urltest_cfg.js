    [

        // ====================
        // FEDERATION SERVICES
        // ====================
        // --OMIM, general q--
        {
            component : "federation",
            priority : 1,
            url : "http://beta.neuinfo.org/services/v1/federation/data/nlx_151835-1.json?exportType=data&q=HP:0200085",
            desc : "DIRECT Query on OmimDiseasePhenotype using an HPO ID (Limb Tremor)",
            maxTimeMilliseconds : 5000,
            expects : {
                format : "json",
                min_results : 2,
                must_contain : {
                    disorder_id : "OMIM:105830" // Angelman
                }
            }
        },

        // --OMIM closure--
        {
            component : "federation",
            priority : 1,
            url : "http://beta.neuinfo.org/services/v1/federation/data/nlx_151835-1.json?exportType=data&subclassFilter=phenotype_id:HP:0001337&count=1000",
            desc : "INFERRED Query OmimDiseasePhenotype using an HPO ID (Tremor) - include subclasses - we expect diseases directly annotated and annotated to subclasses",
            maxTimeMilliseconds : 5000,
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

        // --MGI closure: high level term--
        {
            component : "federation",
            priority : 1,
            url : "http://beta.neuinfo.org/services/v1/federation/data/nif-0000-00096-6.json?exportType=data&count=100&subclassFilter=phenotype_id:MP:0000428&",
            desc : "INFERRED MGI Geno Pheno using an MP ID (craniofacial) - include subclasses - we expect genotypes directly annotated and annotated to subclasses",
            maxTimeMilliseconds : 5000,
            expects : {
                format : "json",
                min_results : 80,
            }
        },

        // --MGI closure: high level term--
        {
            component : "federation",
            priority : 1,
            url : "http://beta.neuinfo.org/services/v1/federation/data/nif-0000-00096-6.json?exportType=data&count=1000&subclassFilter=phenotype_id:MP:0003677&",
            desc : "INFERRED MGI Geno Pheno using an MP ID (craniofacial) - include subclasses - we expect genotypes directly annotated and annotated to subclasses",
            maxTimeMilliseconds : 5000,
            expects : {
                format : "json",
                min_results : 2,
                must_contain : 
                [
                    {
                        effective_genotype_id: "MGI:3686776",
                        genomic_background_label: "involves: 129S7/SvEvBrd * C57BL/6 * CBA",
                        phenotype_id: "MP:0003679",
                        phenotype_label: "ear lobe hypoplasia",
                        publication_id: "PMID:16914493",
                        
                    }
                ]
            }
        },

        // --OMIM variant search (textual)--
        {
            component : "federation",
            priority : 1,
            url : "http://beta.neuinfo.org/services/v1/federation/data/nif-0000-03216-9.json?exportType=data&count=1000&q=Huntington",
            desc : "Query OmimDiseaseVariants using string matching (expect Hungtindon's disease)",
            maxTimeMilliseconds : 5000,
            expects : {
                format : "json",
                min_results : 3,
                must_contain : {
                    phenotype_id : "OMIM:143100" // ID for Huntington's disease (note in this view, phenotype subsumes phenotype and disease)
                }
            }
        },

        // --OMIM variant--
        {
            component : "federation",
            priority : 1,
            url : "http://beta.neuinfo.org/services/v1/federation/data/nif-0000-03216-9.json?exportType=data&count=1000&q=OMIM:214290",
            desc : "Query OmimDiseaseVariants using OMIM ID (Cervical Vertebrae, Agenesis Of)",
            maxTimeMilliseconds : 3000,
            expects : {
                format : "json",
                max_results : 1,
                must_contain : {
                    phenotype_id : "OMIM:214290" // Cervical Vertebrae, Agenesis Of
                },
                must_not_contain : {
                    phenotype_id : "OMIM:103400" // non-queried for ID
                }
            }
        },

         // NIF FEDERATION SEARCH TERM EXPANSION
        {
            component : "federation-search",
            priority : 1,
            url : "http://nif-services.neuinfo.org/servicesv1/v1/federation/search.json?exportType=data&q=birnlex_721",
            desc : "Query NIF to confirm terms available from expansion",
            maxTimeMilliseconds : 12000,
            expects : {
                format : "json",
                min_results : 1,
                must_contain : {
                    query: "Hippocampus"
                },   
                
                /*must_contain : [
                [
                    {
                        category: null,
                        property: null,
                        query: "Hippocampus",
                        expansion: [
                        "ammon's horn",
                        "ammon gyrus",
                        "hippocampus major",
                        "ammon horn",
                        "hippocampus proper",
                        "cornu ammonis",
                        "hippocampus proprius"
                        ],
                        id: "birnlex_721",
                        quoted: false,
                        require: false,
                        forbid: false
                    }
                ]
                ]
            },
            */
                raw_contains: 
                   ["ammon\'s horn",
                    "ammon gyrus",
                    "hippocampus major",
                    "ammon horn",
                    "hippocampus proper",
                    "cornu ammonis",
                    "hippocampus proprius"]
                }
        },

        // ORPHANET
        {
            component : "federation",
            priority : 1,
            url : "http://beta.neuinfo.org/services/v1/federation/data/nif-0000-21306-2.json?exportType=data&count=50&q=Huntington",
            desc : "Query ORPHANET using string matching (expect Hungtindon's disease)",
            maxTimeMilliseconds : 5000,
            expects : {
                format : "json",
                min_results : 3,
                must_contain : {
                    disease_id: "ORPHANET:399", // ID for Huntington's disease
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
            maxTimeMilliseconds : 400,
            expects : {
                format : "json",
                min_results : 2,
                must_contain : {
                    id : "MP_0002768"
                },
            }
        },

        // ========================
        // NIFSTD SCIGRAPH QUERIES
        // ========================
        {
            component : "scigraph",
            subcomponent : "vocabulary-autocomplete",
            priority : 1,
            url : "http://matrix.neuinfo.org:9000/scigraph/vocabulary/autocomplete/brain.json?limit=4&searchSynonyms=true&includeDeprecated=false",
            desc : "SciGraph autocomplete service call",
            notes : "Check for concept brain from Uberon",
            maxTimeMilliseconds : 400,
            expects : {
                format : "json",
                min_results : 1,
                must_contain : {
                    completion: "brain"
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
            url : "http://nif-services-stage.neuinfo.org/ontoquest-lamhdi/concepts/term/HP_0003325",
            desc : "Concept details for 'limb girdle muscle weakness''",
            notes : "Currently just checks for string matches in returned XML",
            maxTimeMilliseconds : 2000,
            expects : {
                format : "xml",
                raw_contains : 
                ["Limb-girdle muscle weakness",
                 "HP:0008971", // alt ID
                 "Weakness of the limb-girdle muscles"     // definition field
                ]
            }
        },

        {
            component : "ontoquest",
            subcomponent : "concepts",
            priority : 1,
            url : "http://nif-services-stage.neuinfo.org/ontoquest-lamhdi/concepts/term/ZP_0000001",
            desc : "Concept details for 'abnormal(ly) quality zebrafish anatomical entity''",
            notes : "Currently just checks for string matches in returned XML",
            maxTimeMilliseconds : 2000,
            expects : {
                format : "xml",
                raw_contains : 
                ["abnormal(ly) quality zebrafish anatomical entity"
                ]
            }
        },

        {
            component : "ontoquest",
            subcomponent : "rel",
            priority : 1,
            url : "http://nif-services-stage.neuinfo.org/ontoquest-lamhdi/rel/all/MP_0002789?level=1",
            desc : "Relationships for male pseudohermaphroditism",
            notes : "Currently just checks for string matches in returned XML",
            maxTimeMilliseconds : 2000,
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
        // --html--
        {
            component : "monarch",
            priority : 1,
            url : "http://tartini.crbs.ucsd.edu",
            desc : "Top level monarch portal page",
            notes : "Currently just checks for string matches in returned HTML",
            expects : {
                format : "html",
                raw_contains : "Disease",
            }
        },

        // --html--
        {
            component : "monarch",
            priority : 1,
            url : "http://tartini.crbs.ucsd.edu/disease/DOID_14330",
            desc : "A DO disease page, Parkinsons",
            expects : {
                format : "html",
                raw_contains : 
                [
                    "14330",
                    "Parkinsonism", // HP term associated
                    "PINK1", // 
                    "Parkinson Disease 14", // OMIM subtype
                ]
            }
        },

        // --html--
        {
            component : "monarch",
            priority : 1,
            url : "http://tartini.crbs.ucsd.edu/variant/dbSNP:121912582",
            desc : "See https://github.com/monarch-initiative/monarch-app/issues/617",
            expects : {
                format : "html",
                raw_contains : 
                [
                ]
            }
        },
        // --html--
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

        // --json--
        // monarch API calls can return deeply nested/structured objects, these are
        // checked recursively
        // TODO - check for taxon
        {
            component : "monarch",
            priority : 1,
            url : "http://tartini.crbs.ucsd.edu/gene/NCBIGene:388552.json",
            desc : "JSON for a gene",
            expects : {
                format : "json",
                must_contain : 
                    {
                        "label": "BLOC1S3",
                        "type": "gene",
                        "taxon": {
                            "label": "Homo sapiens"
                        }

                        //object: {
                        //"id": "SO_0001217"
                        //}
                    }
                
            }
        },
    

        // --json--
        // monarch API calls can return deeply nested/structured objects, these are
        // checked recursively
        {
            component : "monarch-ignore",
            priority : 1,
            url : "http://tartini.crbs.ucsd.edu/phenotype/HP:0001337.json",
            desc : "JSON for A HPO phenotype disease page, Tremor (and subtypes)",
            expects : {
                format : "json",
                must_contain : [
                    {
                        disease_associations : {
                            disease: {
                                label: "Nipah Virus Disease"
                            }
                        }
                    },
                    {
                        disease_associations : {
                            type: "Association",
                            disease: {
                                id: "OMIM:253550",
                                label: "Spinal Muscular Atrophy, Type Ii"
                            },
                            phenotype: {
                                id: "HP:0002378",
                                label: "Hand tremor"
                            },
                            source: {
                                id: "nlx_151835-1",
                                label: "HPO"
                            }
                        }
                    },
                    {
                        genotype_associations : {
                            has_genotype : {
                                id: "MGI:3844321",
                                label: "Grid2<Lc-J>/Grid2<+> [BALB/cByJ]",
                                type: "effective_genotype",
                                has_part: {
                                    id: "MGI:3844321",
                                    label: "Grid2<Lc-J>/Grid2<+> [BALB/cByJ]",
                                    type: "intrinsic_genotype",
                                    has_part: {
                                        type: "genomic_variation_complement",
                                        has_part : {
                                            type: "variant_single_locus_complement",
                                            has_variant_part : {
                                                has_part : {
                                                    type: "variant_locus",
                                                    has_part : {
                                                        type: "sequence_alteration"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                ],
                raw_contains : 
                [
                    "Tremor",
                    "Cataract, Ataxia, Short Stature, And Mental Retardation", // associated with a subtype of tremor
                    "Grid2", // MGI genotype, for titubation
                ]
            }
        },

        // --simsearch json--
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

        // --simsearch html--
        {
            component : "monarch",
            priority : 1,
            url : "http://tartini.crbs.ucsd.edu/analyze/phenotypes",
            desc : "Top level monarch portal page page for phenotype profile search",
            notes : "Currently just checks for string matches in returned HTML",
            expects : {
                format : "html",
                raw_contains : "Monarch Phenotype Profile Analysis",
            }
        },


        // --analyze html--
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

        // --redirects--
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
