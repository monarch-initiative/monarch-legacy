"use strict";
var PhenoPacket = require('./phenopacket.js');



/**
 * Use the state of a golr manager to generate a phenopacket
 * 
 * @param {object} golrManager - bbop.golr.manager
 * @returns {object} information about monarch-app with list of phenopackets
 */
function buildPhenoPacket(response, personality, showEmptyFields) {
    
    var phenopacket = {};
   
    switch(personality) {
        case "variant_phenotype":
            var packet = buildVariantPhenotype(response);
            phenopacket.phenopacket = packet;
            break;
        case "case":
            var packet = buildCasePacket(response);
            phenopacket.phenopacket = packet;
            break;
        default:
            throw new Error("personality is not supported") 
    }
    if (!showEmptyFields) {
        cleanObject(phenopacket);
    }
    return phenopacket;
}

//
/**
 * Build phenopacket for variant-phenotype associations
 * 
 * @param {object} golrManager - bbop.golr.manager
 * @returns {array} list of phenopackets
 */
function buildVariantPhenotype(response) {
    var packets = [];
    
    /* build phenopacket from ground up
     * We know that we have a golr response with the
     * personality "variant_phenotype", so subjects are variants
     * and objects are phenotypes
     */
    
    var packet = new PhenoPacket.PhenoPacket({});
    var variantList = [];
    //Get phenotypes
    response.documents().forEach(function(doc){ 

        var ontologyClass = new PhenoPacket.OntologyClass({
            id: doc.object,
            label :  doc.object_label
        });
        
        var phenotypeTypes = [ontologyClass];
        
        var phenotype = new PhenoPacket.Phenotype({
            types: phenotypeTypes
        });
        
        var variant = new PhenoPacket.Variant({
            id : doc.subject,
            label :  doc.subject_label
        });
        
        variant.type = getEntityType(doc.subject, doc.subject_closure, doc.subject_closure_map);

        var phenotype_association = new PhenoPacket.PhenotypeAssociation({
            entity : variant.id,
            phenotype : phenotype
        });
        
        //Check if we've seen this variant before
        if (variantList.map(
                function(val){return val.id;}).indexOf(variant.id) === -1) {
            variantList.push(variant);
        }

        packet.phenotype_profile.push(phenotype_association);
    });
    
    if (variantList.length > 1) {
        console.warn("expected one variant in phenopacket, found  >1");
    } else if (variantList.length === 1){
        packet.variants = variantList;
        var packetID = variantList[0].id + '-phenopacket';
        packet.id = packetID;
    }
    packet.schema = "phenopacket-level-1";
    
    return packet;
}

/**
 * Build phenopacket for cases
 * 
 * @param {object} golrManager - bbop.golr.manager
 * @returns {array} list of phenopackets
 */
function buildCasePacket(response) {
    var packet = new PhenoPacket.PhenoPacket({});
    var entityList = [];
    
    response.documents().forEach(function(doc){ 
        //Things to ignore: DOID:4
        if (doc.object === 'DOID:4'){
            return;
        }
        if (doc.subject_category === 'case') {
            if (entityList.map(
                    function(val){return val.id;}).indexOf(doc.subject) === -1) {
                var entity_type = getEntityType(doc.subject, doc.subject_closure, doc.subject_closure_map);
                var entity = new PhenoPacket.Entity({
                    id : doc.subject,
                    label : doc.subject_label,
                    type : entity_type
                });
                entityList.push(entity);
                
            }
        }
        if (doc.object_category === 'phenotype') {
            var ontologyClass = new PhenoPacket.OntologyClass({
                id: doc.object,
                label :  doc.object_label
            });
            
            var phenotypeTypes = [ontologyClass];
            
            var phenotype = new PhenoPacket.Phenotype({
                types: phenotypeTypes
            });

            var phenotype_association = new PhenoPacket.PhenotypeAssociation({
                entity : doc.subject,
                phenotype : phenotype
            });
            packet.phenotype_profile.push(phenotype_association);
        }
        
        if (doc.object_category === 'variant') {

            var variant = new PhenoPacket.Variant({
                id : doc.object,
                label :  doc.object_label
            });
            
            variant.type = getEntityType(doc.object, doc.object_closure, doc.object_closure_map);
            packet.variants.push(variant);
        }
        
    });
    
    if (entityList.length > 0) {
        packet.entities =  entityList;       
    }
    packet.schema = "phenopacket-level-1";
    return packet;
}

// Remove anything that is null or undefined
// Credit http://stackoverflow.com/a/24190282
function cleanObject(obj) {
    Object.keys(obj).forEach (function (key) {
        if (obj[key] === null || Object.keys(obj[key]).length === 0) {
            delete obj[key];
        } else if (typeof obj[key] === 'object') {
            cleanObject(obj[key]);
        }
    });
}

function getEntityType(curie, closureList, closureMap) {

    var typeMap = {};
    var type = {};
    if (typeof(closureList) === 'undefined'){
        closureList = [];
    }
    if (typeof(closureMap) === 'undefined'){
        closureMap = {};
    }
    try {
        typeMap = JSON.parse(closureMap);
    } catch (e) {
        console.log(e);
    }

    if (closureList.length > 0 && closureList[0] != curie) {
        type.id = closureList[0];
        type.label = typeMap[closureList[0]];
    } else if (closureList.length > 1) {
        type.id = closureList[1];
        type.label = typeMap[closureList[1]];
    }

    return type;
}

exports.buildPhenoPacket = buildPhenoPacket;
