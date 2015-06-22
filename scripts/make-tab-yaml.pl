#!/usr/bin/perl

use strict;

my $subject = shift;
my $object = shift;

my $subject_lc = lc($subject);
my $object_lc = lc($object);


print "id: ${subject_lc}_${object_lc}
schema_generating: true
document_category: generic_association
weight: 20

## Results table, horizontal
result_weights: subject^7.0 subject_taxon^6.5 relation^6.0  object^5.0 object_taxon^4.2 evidence^4.0 source^3.5

## Ordering of facets, vertical
filter_weights: relation_closure_label^6.5 evidence_closure_label^6.0 subject_closure_label^4.5 object_closure_label^4.0

## SOLR FIELD DEFINITIONS

fields:

## SUBJECT

  - id: subject
    description: \"The CURIE for oban:association_has_subject. May be disease, variant, gene, person, ....\"
    display_name: $subject
    type: string
    property: []

  - id: subject_label
    description: \"Label for association_subject. This will always be rdfs:label. Conventions may vary as to what goes in the label. For genes will be symbol, but we may choose to uniquify by prefixing with species\"
    display_name: $subject
    type: string
    property: []
    searchable: true

  - id: subject_closure
    description: \"Reflexive closure of association_has_subject. A list of CURIEs. If an individual, first traverse rdf:tpye. The default closure is subclass, but other may optionally be added depending on what type of association this is and what the class is. E.g. for expression associations, the object is an anatomy class, and the closure will include part_of\"
    display_name: $subject
    type: string
    cardinality: multi
    property: []

  - id: subject_closure_label
    description: \"Labels for subject_closure.\"
    display_name: $subject
    type: string
    cardinality: multi
    property: []
    searchable: true

  - id: object
    description: \"The CURIE for oban:association_has_object. This is often, but not always an ontology class. E.g. for a gene-gene interaction it is an (arbitrary) member of the pair.\"
    display_name: $object
    type: string
    property: []

  - id: object_label
    description: \"Label for association_object.\"
    display_name: $object
    type: string
    property: []
    searchable: true

  - id: object_closure
    description: \"Reflexive closure of association_has_object. A list of CURIEs. If an individual, first traverse rdf:tpye. The default closure is subclass, but other may optionally be added depending on what type of association this is and what the class is. E.g. for expression associations, the object is an anatomy class, and the closure will include part_of\"
    display_name: $object
    type: string
    cardinality: multi
    property: []

  - id: object_closure_label
    description: \"Labels for object_class_closure.\"
    display_name: $object
    type: string
    cardinality: multi
    property: []
    searchable: true";
