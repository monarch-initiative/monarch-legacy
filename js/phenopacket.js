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
    constructor({packet_id = "", title = "", entities = [], variants = [],
                persons = [], organisms = [], phenotype_profile = [],
                diagnosis_profile = [], environment_profile = []}) {

        self = this;
        
        self.id = packet_id;
        self.title = title;
        self.entities = entities;
        self.variants = variants;
        self.persons = persons;
        self.organisms = organisms;
        self.phenotype_profile = phenotype_profile;
        self.diagnosis_profile = diagnosis_profile;
        self.environment_profile = environment_profile;
    }
}
/**
 * An abstract class for anything that can be described
 *  as a boolean combination of ontology classes
 */
class ClassInstance {
    constructor({types = [], negated_types = [], description = ""}){
        var self = this;
        self.types = types;
        self.negated_types = negated_types;
        self.description = description;
    }
}


class OntologyClass {
    constructor({class_id = "", label = ""}){
        var self = this;
        self.id = class_id;
        self.label = label;
    }
}


class PropertyValue {
    constructor({property = "", filler = ""}){
        var self = this;
        // Filler can be an object or string
        self.property = property;
        self.filler = filler;
    }
}

/*
 * An entity encompasses persons or non-human organisms,
 * variants, diseases, genes, cohorts, etc
 */
class Entity extends ClassInstance {

    //Holding off on implementing an enum class/check

    constructor({types = [], negated_types = [], description = "",
                entity_id = "", entity_label = "",
                entity_type = ""}) {

        super(types, negated_types, description);
        var self = this;
        self.id = entity_id;
        self.label = entity_label;
        self.entity_type = entity_type;
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
        var self = this;
        self.entity = entity;
        self.evidence_list = evidence_list;
    }
}

/**
 *  An instance of a type of evidence that supports an association
 *  The evidence model follows the GO model
 */
class Evidence extends ClassInstance {

    constructor({types = [], negated_types = [], description = "",
                 supporting_entities = [], source = []}) {

        super(types, negated_types, description);
        var self = this;
        self.supporting_entities = supporting_entities;
        self.source = source;
    }
}


class Publication {

    constructor({pub_id = "", title = ""}) {
        var self =  this;
        self.id = pub_id;
        self.title = title;
    }
}

class GenomicEntity extends Entity {

    constructor({types = [], negated_types = [],
                 description = "", entity_id = "",
                 entity_label = "", entity_type = "",
                 taxon = {}}) {

        super(types, negated_types, description,
              entity_id, entity_label, entity_type);
        var self = this;
        self.taxon = taxon;
    }
}


class Variant extends GenomicEntity {

    constructor({types = [], negated_types = [],
                 description = "", entity_id = "",
                 entity_label = "", entity_type = "",
                 taxon = {}, description_hgvs = ""}) {

        super(types, negated_types, description,
              entity_id, entity_label, entity_type, taxon);
        var self = this;
        self.description_hgvs = description_hgvs;
    }
}


class Organism extends Entity {

    constructor({types = [], negated_types = [],
                 description = "", entity_id = "",
                 entity_label = "", entity_type = "",
                 taxon = {}, strain = {},
                 sex = "", date_of_birth = ""}) {  
    
        super(types, negated_types, description,
              entity_id, entity_label, entity_type);
        var self = this;
        self.taxon = taxon;
        self.strain = strain;
        self.sex = sex;
        self.date_of_birth = date_of_birth;
    }
}


class Person extends Organism {

    constructor({types = [], negated_types = [],
                 description = "", entity_id = "",
                 entity_label = "", entity_type = "",
                 taxon = {}, strain = {},
                 sex = "", date_of_birth = ""}) {

        super(types, negated_types, description,
              entity_id, entity_label, entity_type,
              taxon, straing, sex, date_of_birth);
    }
}


/**
 * An instance of a type of assay that was performed to determine
 *  the presence or extent of a phenotype
 */
class Assay extends ClassInstance {

    constructor({types = [], negated_types = [], description= ""}) {
        super(types, negated_types, description);
    }
}

/**
 * An abstract class that encompasses both DiseaseOccurrences and Phenotypes
 */
class Condition extends ClassInstance {

    constructor({types = [], negated_types = [], description = "",
                 has_location = "", onset = {},
                 offset = {}, severity = {}, environment = {} }) {
        
    
        super(types, negated_types, description);

        var self = this;
        self.has_location = has_location;
        self.onset = onset;
        self.offset = offset;
        self.severity = severity;
        self.environment = environment;
    }
}


class ConditionSeverity extends ClassInstance {

    constructor({types = [], negated_types = [], description= ""}) {
        super(types, negated_types, description);
    }
}


class DiseaseStage extends Condition {

    constructor({types = [], negated_types = [], description = "",
                 has_location = "", onset = {},
                 offset = {}, severity = {},
                 environment= {} }) {
        
        super(types, negated_types, description, has_location,
              onset, offset, severity, environment);
    }
}


class DiseaseOccurrence extends Condition {

    constructor({types = [], negated_types = [], description = "",
                 has_location = "", onset = {},
                 offset = {}, severity = {},
                 environment= {}, stage = {}}) {

        super(types, negated_types, description, has_location,
              onset, offset, severity, environment);
        var self = this;
        self.stage = stage;
    }
}


class DiseaseOccurrenceAssociation extends Association {

    constructor({ entity = {}, evidence_list = [], disease = {}}) {
        super(entity, evidence_list);
        var self = this;
        self.disease = disease;
    } 
}


class Measurement extends ClassInstance {

    constructor({types = [], negated_types = [], description = "",
                 unit = {}, magnitude = ""}) {
        super(types, negated_types, description);

        var self = this;
        self.unit = unit;
        self.magnitude = magnitude;
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
    
    constructor({types = [], negated_types = [], description= ""}) {
        super(types, negated_types, description);
    }
}

// An individual occurrence of a phenotype (a type of condition)
class Phenotype extends Condition {

    constructor({types = [], negated_types = [], description = "",
                has_location = "", onset = {},
                offset = {}, severity = {},
                environment= {} , measurements = []}) {

        super(types, negated_types, description, has_location,
              onset, offset, severity, environment);
        var self = this;
        self.measurements = measurements;
    }
}


class PhenotypeAssociation extends Association {

    constructor({entity = {}, evidence_list = [],phenotype: {}}) {
        super().__init__(entity, evidence_list);
        var self = this;
        self.phenotype = phenotype;
    }
}


class TemporalRegion extends ClassInstance {

    constructor({types = [], negated_types = [], description = "",
                 start_time = "", end_time = ""}) {
        super(types, negated_types, description);
        var self = this;
        self.start_time = start_time;
        self.end_time = end_time;
    }
}
