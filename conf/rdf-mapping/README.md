## DISCO 2 TURTLE

![img](http://fc01.deviantart.net/fs71/f/2012/052/e/7/disco_turtle_by_kiatonasy-d4qk6ab.jpg)

This folder contains YAML configurations for Monarch resources used by
disco2turtle to extract triples from DISCO via Federation services.

Each YAML configuration file describes how to generate a single
particular Mamed Graph, in turtle format.

## Basic Concepts

Monarch requires ingested data to be structured/nested
appropriately. Currently we use DISCO to ingest external resources,
but this has the disadvantage of flattening everything.

As an interim workaround until we start ingesting structured data
directly, we have developed a system that maps a NIF view to
normalized RDF triples. The default serialization format is turtle
(ttl), which is nice and compact. Each dumped file constitutes an
individual Named Graph (or OWL ontology, in the OWL translation).

The regurgitated triples can be found here:

 * http://purl.obolibrary.org/obo/upheno/data/

These triples can be ingested directly into a triplestore, or for
Monarch, into our SciGraph instance.

Note that additional post-processing can be done directly on the
triples using SPARQL rewrites.

## Running disco2turtle

Check out the monarch-app project from github. Currently the
disco2turtle script relies on some Monarch API calls but these may be
separated in future to allow the system to be run independently.

To generate a ttl NG, do this:

    make human-gene-phenotype.ttl

Where the name of the ttl file can be any of the supported NGs.

To make all of them, type

    make triples

You can also convert the ttl to OWL:

    make human-gene-phenotype.owl

This is a useful check - OWL sometimes requires additional
declarations and will often use annotation properties as a default
where object properties should be used. this should be avoided.

## Scheduled Exports

The following Jenkins job dumps all triples:

 * http://build.berkeleybop.org/job/generate-triples-from-nif/

## Authoring a configuration

To get started, copy an existing mapping as a template. Always name
the file *-map.yaml

(note you should make the yaml file primary, with the json conf
derived from the yaml)

When done, type "make triples" in top level directory, or just make
your file

### Mapping configuration structure


The following top-level tags are used:

 * graph - name of the named graph
 * mapVersion - the version ID for the mapping (not the data)
 * view - the NIF view ID
 * prefixes - to define URI prefixes (in addition to those in the monarch JSON-LD configuation)
 * columns - metadata on each column. Every column mapped should be here
 * filter (optional) - key-value pairs used to filter the NIF view
 * mappings - an array of Subject-Predicate-Object templates
 * objects - additional RDF objects that should be inserted into each graph

The core of the configuration is in the set of mappings. Any given NIF
view can generate 1 to N triples per row, where N is the number of
mappings specified.

Note that it is best to understand configurations by looking at
existing examples. Let's look at one,
[panther-orthologs-map.yaml](panther-orthologs-map.yaml) .

The first lines in the file are:

    graph: panther-orthologs
    view: nlx_84521-1
    filter: 
      tax_id_a: NCBITaxon:9606

This states the name of the named graph (which is also used the name
the file) and the ID of the view used as source. Only one view can be
specified, this is deliberate, there is no need for additional views
as NGs can be trivially combined.

The filter parameter is optional, and is passed on to the federation
API call to selectivelt filter rows (here we are just getting human
homologs).

Next up are the prefixes:

    prefixes:
      ## Panther prefixes - need verified
      P:   http://purl.obolibrary.org/obo/RO_HOM0000011 ## in paralogy relationship with
      O:   http://purl.obolibrary.org/obo/RO_HOM0000037 ## in 1 to many homology relationship with
      LDO: http://purl.obolibrary.org/obo/RO_HOM0000019 ## in 1 to 1 homology relationship with
      X: http://purl.obolibrary.org/obo/RO_HOM0000018 ## in xenology relationship with
      LDX: http://purl.obolibrary.org/obo/RO_HOM0000018 ## in xenology relationship with

To fully grok these you should have a basic understanding of how URI
prefixing works. Note also that prefixes from the [monarch JSON LD context file](../../conf/monarch-context.jsonld) are automatically used.

These prefixes actually map abbreviations in the panther source to
complete URIs. This is actually a common and convenient paradigm in
[JSON-LD](http://json-ld.org/).

Next up are the column declarations:

    columns: 
      - 
        name: tax_id_a
        prefix: http://purl.obolibrary.org/obo/
        type: owl:Class
      - 
        name: tax_id_b
        prefix: http://purl.obolibrary.org/obo/
        type: owl:Class
      - 
        name: genea
        type: owl:Class
      - 
        name: geneb
        type: owl:Class
      - 
        name: orthology_class
        type: owl:ObjectProperty

You don't need to declare every column in the view, just those you are
mapping with this conf. Only minimal metadata is required for each.

If the input view is badly behaved (does not use valid CURIEs) you may
need to declare prefixes for the columns here.

The real meat and potatoes of disco2turtle is in the mappings. Each
entry here is a triple template:

    mappings: 
      - 
        object: geneb
        predicate: orthology_class
        subject: genea
      - 
        object: tax_id_a
        predicate: RO:0002162
        subject: genea
      - 
        object: tax_id_b
        predicate: RO:0002162
        subject: geneb

genea, geneb and orthology_class are all column names in the NIF view,
so the values of each of these columns will be used to populate a value.

For the second two templates, a hardcoded value is used - here two
URIs from the relations ontology -- for the relation [in taxon](http://purl.obolibrary.org/obo/RO_0002162) .

These second two templates are not strictly required - we should
follow a normalized pattern and get metadata about genes from a
different view. However, a little redundancy is not a problem (but
might be if data was inconsistent).

Note that all these should expand to valid IRIs. This can be done at
different levels. First, this is a well behave view that uses valid
CURIES. For example, every mouse gene ID is of the form
MGI:3030900. As MGI is declared in the Monarch JSON LD context file
(in conf/monarch-context.jsonld) this will be correctly expanded.

Note the value of the orthology_class field is single letter codes
such as 'P' for paralogy. These are not valid URIs, but we include a
prefix for each of these that is local to this mapping. In this case:

    P:   http://purl.obolibrary.org/obo/RO_HOM0000011 ## in paralogy relationship with

Further down we see

    mapVersion: 2014-07-30

This is the version number of the mapping (not the data). If this is
increased it will force a re-dump.

## Tips

### IRI abbreviations and curies

The monarch JSON-LD context is always used for prefix abbreviations

### Always set type for non-ID columns

The default assumption is that a column contains an ID that cab be expanded to a URI.

This means in the 'columns' section, you only need to specify column names.

However, if the column contains a non-ID you should set the type. A
good choice is rdfs:Literal. However, if you are sure that a column
contains a numeric type, go ahead and use the xsd type

## Modeling Patterns and Best Practice

This will be defined in a separate document. Some rough guidelines for now:

 * use standard vocabularies
 * We try and follow a general Annotation model, similar to a reified triple
    * exact vocabulary TBD
 * stay normalized. If another NG provides labels for all genes, you don't need to redundantly include this in a gene-disease view

## Pre- and Post-processing

The assumption that is that any pre-processing is already done by the time the view is exposed (e.g. in DISCO/CM).

SPARQL can be used for post-processing.

## Future plans

Eventually disco2turtle will be discarded as we move towards consuming
graph data directly without the need of DISCO, but for now we have a
lot of resources ingested into DISCO and need a way to dump them.

There is considerable overlap in functionality between disco2turtle
and the proposed extensions to the Concept Mapper, particularly making
column to column mappings.

For more background, see:
https://docs.google.com/document/d/1_eEaaoduwuYdiCFMlZtA-PZPRwAcX9isdfq5Oue2F7I/edit#heading=h.ejqhzd8mprcc

## Happy Disco to turtling!

![img](http://www.crestschools.com/wp-content/uploads/2011/08/disco-turtle-sm.jpg)
