"use strict";
var PhenoPacket = require('./phenopacket.js');



/**
 * Use the state of a golr manager to generate a phenopacket
 * 
 * @param {object} golrManager - bbop.golr.manager
 * @returns {object} information about monarch-app with list of phenopackets
 */
function buildPhenoPacket(response, personality) {
    
    var phenopacket = {};
    //initialize object with some api information
   
    phenopacket.phenopackets = {};
   
    switch(personality) {
        case "variant_phenotype":
            var packet = buildVariantPhenotype(response)
            phenopacket.phenopacket = packet;
            break;
        default:
            throw new Error("personality is not supported") 
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
    
    var packet = new PhenoPacket.PhenoPacket({id : 'test'});
    
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
        
        var variant = new PhenoPacket.Entity({
            id : doc.subject,
            label :  doc.subject_label,
            type : "variant"
        });

        var phenotype_association = new PhenoPacket.PhenotypeAssociation({
            entity : variant,
            phenotype : phenotype
        });

        packet.phenotype_profile.push(phenotype_association);
    });
    
    
    packet.schema = "phenopacket-level-1";
    
    return packet;
}

//Exports
if (typeof exports === 'object') {
    exports.buildPhenoPacket = buildPhenoPacket;
}
if (typeof (loaderGlobals) === 'object') {
    loaderGlobals.buildPhenoPacket = buildPhenoPacket;
}
