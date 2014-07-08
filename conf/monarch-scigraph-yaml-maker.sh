#!/bin/bash
REMOTE_SERVER="vivaldi.crbs.ucsd.edu"
LOCATION="/var/home/bamboo"

#### Modify URLs to be loaded below.  Be sure to leave the echo ' at the beginning and the '> graphload.yml at the end

echo '
ontologyConfiguration:
    graphLocation: /var/home/bamboo/SciGraph/monarchGraph

ontologyUrls:
 - http://purl.obolibrary.org/obo/upheno/monarch.owl

curies:
    http://purl.obolibrary.org/obo/DOID_ : DOID
    http://purl.obolibrary.org/obo/ORPHANET_ : ORPHANET
    http://purl.obolibrary.org/obo/OMIM_ : OMIM
    http://www.ncbi.nlm.nih.gov/pubmed/ : PMID
    http://purl.obolibrary.org/obo/HP_ : HP
    http://purl.obolibrary.org/obo/MP_ : MP
    http://purl.obolibrary.org/obo/ZP_ : ZP
    http://purl.obolibrary.org/obo/GENO_ : GENO
    http://purl.obolibrary.org/obo/ECO_ : ECO
    http://purl.obolibrary.org/obo/RO_ : RO
    http://purl.obolibrary.org/obo/BFO_ : BFO
    http://monarch-initiative.org/data/MGI_ : MGI
    http://semanticscience.org/resource/SIO_ : SIO
    http://purl.obolibrary.org/obo/Ensembl_ : ENSEMBL
    http://purl.obolibrary.org/obo/ENSEMBL_ : ENSEMBL
    http://purl.obolibrary.org/obo/MGI_ : MGI
    http://purl.obolibrary.org/obo/ZFIN_ : ZFIN
    http://purl.obolibrary.org/obo/UniProtKB_ : UniProtKB
    http://purl.obolibrary.org/obo/MESH_ : MESH
    http://purl.obolibrary.org/obo/UMLS_ : UMLS
    http://purl.obolibrary.org/obo/WB_ : WB
    http://purl.obolibrary.org/obo/WBPhenotype_ : WBPhenotype
    http://purl.obolibrary.org/obo/UBERON_ : UBERON
    http://purl.obolibrary.org/obo/CL_ : CL
    http://purl.obolibrary.org/obo/MPATH_ : MPATH
    http://purl.obolibrary.org/obo/CHEBI_ : CHEBI
    http://purl.obolibrary.org/obo/FB_ : FB
    http://purl.obolibrary.org/obo/FBbt_ : FBbt
    http://purl.obolibrary.org/obo/FBcv_ : FBcv
    http://purl.obolibrary.org/obo/RGD_ : RGD
    http://purl.obolibrary.org/obo/MONARCH_ : MONARCH
    http://omia.angis.org.au/OMIA : OMIA
    http://purl.obolibrary.org/obo/OMIABreed_ : OMIABreed
    http://purl.obolibrary.org/obo/OMIAPub_ : OMIAPub

categories:
    http://purl.obolibrary.org/obo/CL_0000000 : cell
    http://purl.obolibrary.org/obo/UBERON_0001062 : anatomical entity
    http://purl.obolibrary.org/obo/ZFA_0009000 : cell
    http://purl.obolibrary.org/obo/UBERON_0004529 : anatomical projection
    http://purl.obolibrary.org/obo/UBERON_0000468 : multi-cellular organism
    http://purl.obolibrary.org/obo/UBERON_0000955 : brain
    http://purl.obolibrary.org/obo/PATO_0000001 : quality
    http://purl.obolibrary.org/obo/GO_0005623 : cell
    http://purl.obolibrary.org/obo/WBbt_0007833 : organism
    http://purl.obolibrary.org/obo/WBbt_0004017 : Cell
    http://purl.obolibrary.org/obo/DOID_4 : disease
    http://purl.obolibrary.org/obo/PATO_0000003 : assay
    http://purl.obolibrary.org/obo/PATO_0000006 : process
    http://purl.obolibrary.org/obo/PATO_0000011 : age
    http://purl.obolibrary.org/obo/ZFA_0000008 : brain
    http://purl.obolibrary.org/obo/ZFA_0001637 : bony projection
    http://purl.obolibrary.org/obo/WBPhenotype_0000061 : extended life span
    http://purl.obolibrary.org/obo/WBPhenotype_0000039 : life span variant
    http://purl.obolibrary.org/obo/WBPhenotype_0001171 : shortened life span
    http://purl.obolibrary.org/obo/CHEBI_23367 : molecular entity
    http://purl.obolibrary.org/obo/CHEBI_23888 : drug
    http://purl.obolibrary.org/obo/CHEBI_51086 : chemical role
    http://purl.obolibrary.org/obo/UPHENO_0001001 : Phenotype
    http://purl.obolibrary.org/obo/GO_0008150 : biological_process
    http://purl.obolibrary.org/obo/GO_0005575 : cellular component

mappedProperties:
  - name: label
    properties:
    - http://www.w3.org/2000/01/rdf-schema#label
  - name: synonym
    properties:
    - http://www.geneontology.org/formats/oboInOwl#hasExactSynonym
    - http://www.geneontology.org/formats/oboInOwl#hasNarrowSynonym
    - http://www.geneontology.org/formats/oboInOwl#hasBroadSynonym
    - http://www.geneontology.org/formats/oboInOwl#hasRelatedSynonym
    - http://purl.obolibrary.org/obo/go#systematic_synonym
    - http://ontology.neuinfo.org/NIF/Backend/OBO_annotation_properties.owl#synonym
  - name: acronym
    properties:
    - http://ontology.neuinfo.org/NIF/Backend/OBO_annotation_properties.owl#acronym
  - name: abbreviation
    properties:
    - http://ontology.neuinfo.org/NIF/Backend/OBO_annotation_properties.owl#abbrev
  - name: definition
    properties:
    - http://purl.obolibrary.org/obo/IAO_0000115
    - http://www.w3.org/2004/02/skos/core#definition

' > graphload.yaml


ssh bamboo@$REMOTE_SERVER "mkdir -p $LOCATION/SciGraph"
scp -r ${bamboo.build.working.directory}/* bamboo@$REMOTE_SERVER:$LOCATION/SciGraph/
