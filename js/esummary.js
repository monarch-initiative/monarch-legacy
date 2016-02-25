/** 
 * Lightweight API for handling JSON from ESummary
 * 
 * Documentation for ESummary service:
 * http://www.ncbi.nlm.nih.gov/books/NBK25499/#_chapter4_ESummary_
 * 
 * Similar design to 
 * https://github.com/berkeleybop/bbop-response-golr
 * 
 * @module esummary
 */

/**
 * Constructor for a esummary response module
 * 
 * @constructor
 * @param {object} data- the JSON data (as object) returned from a request
 * @param {array} idList- the list of ids used to make the request
 * @returns {this} new eSummaryResponse
 */
function eSummaryResponse(data, idList) {
    
    this._isA = 'eSummaryResponse';
    
    // Work with the raw incoming document.
    if (typeof(data) === 'string') {
        try {
            this._raw = JSON.parse(data);
        } catch (e) {
            throw new Error('unable to deal with incoming: ' + typeof(data));
        }
    } else if (typeof(data) === 'object') { 
        this._raw = data;
    } else {
        throw new Error('unable to deal with incoming: ' + typeof(data));
    }
    
    if (typeof idList !== 'undefined') {
        if (typeof idList === 'string') {
            this.idList = [idList];
        } else {
            this.idList = idList;
        }
    } else {
        this.idList = [];
    }
};

/**
 * Returns a pointer to the initial response object
 * 
 * @returns {object} raw
 */
eSummaryResponse.prototype.raw = function(){
    return this._raw;
};


/**
 * Getter for author list object
 * 
 * Returns object of author objects, for example:
 * 
 *  { '1234 :
 *      [
 *        {
 *          "name": "Armbrust EV",
 *          "authtype": "Author",
 *          "clusterid": ""
 *        }
 *      ]
 *  }
 *  
 * @returns {array} authorList
 */
eSummaryResponse.prototype._getAuthors = function() {
    var self = this;
    var authors = {};
    
    if (self.idList.length === 0) {
        throw new Error('fetching author list requires ids');
    }
    
    
    
    return authors;
};

/**
 * Getter for journal title
 * 
 *  
 * @returns {string} journal
 */
eSummaryResponse.prototype.getJournal = function() {
    var self = this;
    var journal = '';
    
    return journal;
};

/**
 * Getter for entity title
 * 
 * @returns {string} title
 */
eSummaryResponse.prototype.getTitle = function() {
    var self = this;
    var title = '';
    return title;
};

/**
 * Getter for pub year
 * 
 * @returns {string} year
 */
eSummaryResponse.prototype.getYear = function() {
    var self = this;
    var year = '';
    
    return year;
};

/**
 * Transforms author list object into formatted list
 * of {lastname} {initials}
 * 
 * @param {string} id - id of entity
 * @returns {array} authorList
 */
eSummaryResponse.prototype.getAuthorList = function(id) {
    var self = this;
    var authorList = [];
    
    return authorList;
};

//TODO will be deleted
if (typeof exports === 'object') {
    exports.eSummaryResponse = eSummaryResponse;
}
if (typeof(loaderGlobals) === 'object') {
    loaderGlobals.eSummaryResponse = eSummaryResponse;
}