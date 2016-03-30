"use strict";

/** 
 * Lightweight API for constructing phenopacket objects
 * 
 * Schema based on https://github.com/phenopackets/phenopacket-format
 * 
 * Secondarily based on python API, 
 * converted to ES6 which has similar syntax
 * 
 * @module phenopacket
 */

// Top level phenopacket container
class PhenoPacket {
    constructor({id = null, title = null, entities = [], variants = [],
                persons = [], organisms = [], phenotype_profile = [],
                diagnosis_profile = [], environment_profile = [],
                schema = "phenopacket-level-1", comment = null}) {
        
        this.id = id;
        this.title = title;
        this.entities = entities;
        this.variants = variants;
        this.persons = persons;
        this.organisms = organisms;
        this.phenotype_profile = phenotype_profile;
        this.diagnosis_profile = diagnosis_profile;
        this.environment_profile = environment_profile;
        this.schema = schema;
        this.comment = comment;
    }
}
/**
 * An abstract class for anything that can be described
 *  as a boolean combination of ontology classes
 */
class ClassInstance {
    constructor({types = [], negated_types = [], description = null}){
        
        this.types = types;
        this.negated_types = negated_types;
        this.description = description;
    }
}


class OntologyClass {
    constructor({id = null, label = null}){
        
        this.id = id;
        this.label = label;
    }
}


class PropertyValue {
    constructor({property = null, filler = null}){
        
        // Filler can be an object or string
        this.property = property;
        this.filler = filler;
    }
}

/*
 * An entity encompasses persons or non-human organisms,
 * variants, diseases, genes, cohorts, etc
 */
class Entity extends ClassInstance {

    //Holding off on implementing an enum class/check
    constructor({types = [], negated_types = [], description = null,
                id = null, label = null, type = null}) {

        super({types: types, negated_types: negated_types,
               description: description});
        
        this.id = id;
        this.label = label;
        this.type = type;
    }
}

/**
 *  An association connects an entity (for example, disease,
 *  person or variant) with either another entity, or with
 *  some kind of descriptor (for example, phenotype).
 *
 *  All pieces of evidences are attached to associations
 */
class Association {

    constructor({entity = {}, evidence_list = []}) {
        
        this.entity = entity;
        this.evidence_list = evidence_list;
    }
}

/**
 *  An instance of a type of evidence that supports an association
 *  The evidence model follows the GO model
 */
class Evidence extends ClassInstance {

    constructor({types = [], negated_types = [], description = null,
                 supporting_entities = [], source = []}) {

        super({types: types, negated_types: negated_types,
               description: description});
        
        this.supporting_entities = supporting_entities;
        this.source = source;
    }
}


class Publication {
    
    constructor({pub_id = null, title = null}) {
        this.id = pub_id;
        this.title = title;
    }
}

class GenomicEntity extends Entity {

    constructor({types = [], negated_types = [],
                 description = null, id = null,
                 label = null, type = null,
                 taxon = {}}) {

        super({types: types, negated_types: negated_types,
               description: description,
               id: id, label: label, type: type});
        
        this.taxon = taxon;
    }
}


class Variant extends GenomicEntity {

    constructor({types = [], negated_types = [],
                 description = null, id = null,
                 label = null, type = null,
                 taxon = {}, description_hgvs = null}) {

        super({types: types, negated_types: negated_types,
               description: description,
               id: id, label: label, type: type, taxon: taxon});
        
        this.description_hgvs = description_hgvs;
    }
}


class Organism extends Entity {

    constructor({types = [], negated_types = [],
                 description = null, id = null,
                 label = null, type = null,
                 taxon = {}, strain = {},
                 sex = null, date_of_birth = null}) {  
    
        super({types: types, negated_types: negated_types,
               description: description,
               id: id, label: label, type: type});
        
        this.taxon = taxon;
        this.strain = strain;
        this.sex = sex;
        this.date_of_birth = date_of_birth;
    }
}


class Person extends Organism {

    constructor({types = [], negated_types = [],
                 description = null, id = null,
                 label = null, type = null,
                 taxon = {}, strain = {},
                 sex = null, date_of_birth = null}) {

        super({types: types, negated_types: negated_types,
               description: description,
               id: id, label: label, type: type, strain: strain,
               sex: sex, date_of_birth: date_of_birth});
    }
}


/**
 * An instance of a type of assay that was performed to determine
 *  the presence or extent of a phenotype
 */
class Assay extends ClassInstance {

    constructor({types = [], negated_types = [], description= null}) {
        super({types:types, negated_types: negated_types,
               description: description});
    }
}

/**
 * An abstract class that encompasses both DiseaseOccurrences and Phenotypes
 */
class Condition extends ClassInstance {

    constructor({types = [], negated_types = [], description = null,
                 has_location = {}, onset = {},
                 offset = {}, severity = {}, environment = {} }) {
    
        super({types: types, negated_types: negated_types,
               description: description});
        this.has_location = has_location;
        this.onset = onset;
        this.offset = offset;
        this.severity = severity;
        this.environment = environment;
    }
}


class ConditionSeverity extends ClassInstance {

    constructor({types = [], negated_types = [], description= null}) {
        super({types: types, negated_types: negated_types,
               description: description});
    }
}


class DiseaseStage extends Condition {

    constructor({types = [], negated_types = [], description = null,
                 has_location = {}, onset = {},
                 offset = {}, severity = {},
                 environment= {} }) {
        
        super({types: types, negated_types: negated_types,
               description: description, has_location: has_location,
               onset: onset, offset: offset, severity: severity, 
               environment: environment});
    }
}


class DiseaseOccurrence extends Condition {

    constructor({types = [], negated_types = [], description = null,
                 has_location = {}, onset = {},
                 offset = {}, severity = {},
                 environment= {}, stage = {}}) {

        super({types: types, negated_types: negated_types,
               description: description, has_location: has_location,
               onset: onset, offset: offset, severity: severity, 
               environment: environment});
        
        this.stage = stage;
    }
}


class DiseaseOccurrenceAssociation extends Association {

    constructor({ entity = {}, evidence_list = [], disease = {}}) {
        super({entity: entity, evidence_list: evidence_list});
        
        this.disease = disease;
    } 
}


class Measurement extends ClassInstance {

    constructor({types = [], negated_types = [], description = null,
                 unit = {}, magnitude = null}) {
        super({types: types, negated_types: negated_types,
               description: description});
     
        this.unit = unit;
        this.magnitude = magnitude;
    }
}

/**
 * An instance of a particular site on or in an organism. This may be
 *  a whole organ, a cell type or even a subcellular location.
 *
 *  The type fields for this class are typically drawn from ontologies such
 *  as Uberon and CL.
 */
class OrganismalSite extends ClassInstance {
    
    constructor({types = [], negated_types = [], description= null}) {
        super({types: types, negated_types: negated_types,
               description: description});
    }
}

// An individual occurrence of a phenotype (a type of condition)
class Phenotype extends Condition {

    constructor({types = [], negated_types = [], description = null,
                 has_location = {}, onset = {},
                 offset = {}, severity = {},
                 environment= {} , measurements = []}) {

        super({types: types, negated_types: negated_types,
              description: description, has_location: has_location,
              onset: onset, offset: offset, severity: severity, 
              environment: environment});
        
        this.measurements = measurements;
    }
}


class PhenotypeAssociation extends Association {

    constructor({entity = {}, evidence_list = [], phenotype = {}}) {
        super({entity : entity, evidence_list: evidence_list});

        this.phenotype = phenotype;
    }
}


class TemporalRegion extends ClassInstance {

    constructor({types = [], negated_types = [], description = null,
                 start_time = null, end_time = null}) {
        super({types: types, negated_types: negated_types,
               description: description});
        
        this.start_time = start_time;
        this.end_time = end_time;
    }
}

if (typeof exports === 'object') {
    exports.PhenoPacket = PhenoPacket;
    exports.ClassInstance = ClassInstance;
    exports.OntologyClass = OntologyClass;
    exports.PropertyValue = PropertyValue;
    exports.Entity  = Entity; 
    exports.Association = Association;
    exports.Evidence  = Evidence; 
    exports.Publication = Publication;
    exports.GenomicEntity  = GenomicEntity; 
    exports.Variant  = Variant; 
    exports.Organism  = Organism; 
    exports.Person  = Person;
    exports.Assay  = Assay; 
    exports.Condition  = Condition; 
    exports.ConditionSeverity  = ConditionSeverity; 
    exports.DiseaseStage  = DiseaseStage; 
    exports.DiseaseOccurrence  = DiseaseOccurrence; 
    exports.DiseaseOccurrenceAssociation  = DiseaseOccurrenceAssociation; 
    exports.Measurement  = Measurement; 
    exports.OrganismalSite  = OrganismalSite; 
    exports.Phenotype  = Phenotype; 
    exports.PhenotypeAssociation  = PhenotypeAssociation; 
    exports.TemporalRegion  = TemporalRegion; 
}
if (typeof (loaderGlobals) === 'object') {
    loaderGlobals.PhenoPacket = PhenoPacket;
    loaderGlobals.ClassInstance = ClassInstance;
    loaderGlobals.OntologyClass = OntologyClass;
    loaderGlobals.PropertyValue = PropertyValue;
    loaderGlobals.Entity  = Entity; 
    loaderGlobals.Association = Association;
    loaderGlobals.Evidence  = Evidence;
    loaderGlobals.Publication = Publication;
    loaderGlobals.GenomicEntity  = GenomicEntity; 
    loaderGlobals.Variant  = Variant;
    loaderGlobals.Organism  = Organism; 
    loaderGlobals.Person  = Person; 
    loaderGlobals.Assay  = Assay; 
    loaderGlobals.Condition  = Condition; 
    loaderGlobals.ConditionSeverity  = ConditionSeverity; 
    loaderGlobals.DiseaseStage  = DiseaseStage; 
    loaderGlobals.DiseaseOccurrence  = DiseaseOccurrence; 
    loaderGlobals.DiseaseOccurrenceAssociation  = DiseaseOccurrenceAssociation; 
    loaderGlobals.Measurement  = Measurement; 
    loaderGlobals.OrganismalSite  = OrganismalSite; 
    loaderGlobals.Phenotype  = Phenotype; 
    loaderGlobals.PhenotypeAssociation  = PhenotypeAssociation; 
    loaderGlobals.TemporalRegion  = TemporalRegion; 
}
