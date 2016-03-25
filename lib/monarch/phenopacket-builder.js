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
            var packets = buildVariantPhenotype(response)
            phenopacket.phenopackets = packets;
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
    return packets;
}

//Exports
if (typeof exports === 'object') {
    exports.buildPhenoPacket = buildPhenoPacket;
}
if (typeof (loaderGlobals) === 'object') {
    loaderGlobals.buildPhenoPacket = buildPhenoPacket;
}
