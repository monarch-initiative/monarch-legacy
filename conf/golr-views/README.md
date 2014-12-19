This directory contains the Yaml Golr-view definitions. Each golr-view
corresponds to a tab in the new Monarch architecture.

The combined set of golr-views are compiled into:

 * a single schema.xml file, for Solr
 * A javascript object, which drives the behavior of the tabs/widgets

For an example, see:

 * http://tartini.crbs.ucsd.edu/labs/widget-scratch/phenotype/HP:0008065

This is driven by disease-to-phenotype-config.yaml

## Modeling guidelines

Each golr view is a denormalized flattening of a subgraph in
SciGraph. See https://github.com/SciCrunch/SciGraph/issues/46 for
further context.

When mapping a subgraph to a golr view, we will typically re-use the
same golr fields, but add context-specific descriptions.

### Core Conventions

Many of these were inherited from AmiGO, open to discussion on generalizing

 * fields representing nodes in SG typically come in pairs, e.g.
    * FOO  ## CURIE/ID
    * FOO_label  ## rdfs:label
 * fields representing nodes typed using an ontology in SG often have closure fields, e.g
    * FOO_subclassof_closure
    * FOO_subclassof_closure_label
 * More than one closure field may be present for any object. These are typically named by the properties included in the closure


### Modeling associations

One of the core modeling patterns is the association, between a subject and an object/target, possibly with one relation.

 * by convention we use **bioentity** for the field for the subject
    * bioentity ## ID/CURIE of entity - e.g. OMIM ID for disease-phenotype
    * bioentity_label ## rdfs:label. E.g. 'autism'
 * the bioentity typically has a taxon associated. In SciGraph, this is with RO:in_taxon. Here it goes in a taxon field, which is typically expanded:
    * taxon ## the ID/CURIE
    * taxon_label
    * taxon_closure ## always SubClassOf closure
    * taxon_closure_label
 * for an entity-ontologyTerm type association, the 'object' in SG maps to annotation_class, which is typically expanded
    * annotation_class ## e.g. HPO ID
    * annotation_class_label ## e.g. HPO name
    * annotation_class_FOO_closure ## where FOO may vary depending on the biology. See below.

### Closures

The above meta-schema allows different types of closures for any
ontology class. This allows refinement in faceting etc. Typically
there should be at least one closure per ontology class. Minimally
this is a superclass closure.

We may want to experiment with different closures. E.g. if we expand
the closure for any phenotype query to allow 'inheres in' and 'part
of', then this means that we can easily query for diseases genes based
on the anatomical entity the phenotype affects!

### Open Questions

When we have a gene x phenotype association derived from genotype x gene
and genotype x phenotype, should we put the genotype in the 'evidence' field?




