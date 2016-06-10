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
function eSummaryResponse(data) {
    
    this._isA = 'eSummaryResponse';
    
    // Work with the raw incoming document.
    if (typeof (data) === 'string') {
        try {
            this._raw = JSON.parse(data);
        } catch (e) {
            throw new Error('unable to deal with incoming: ' + typeof (data));
        }
    } else if (typeof (data) === 'object') { 
        this._raw = data;
    } else {
        throw new Error('unable to deal with incoming: ' + typeof (data));
    }
    
    if (this._raw.hasOwnProperty('result') 
            && this._raw['result'].hasOwnProperty('uids')){
        this.idList = this._raw['result']['uids'];
    } else {
        this.idList = [];
    }
    
    //immutable maps for convenience
    this._authorTable = this._makeAuthorTable();
    this._journalMap = this._makeJournalMap();
    this._titleMap = this._makeTitleMap();
    this._dateMap = this._makeDateMap();
    
};

/**
 * makes author list object
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
 * @returns {object} authors
 */
eSummaryResponse.prototype._makeAuthorTable = function() {
    var self = this;
    var authors = {};
    
    self.idList.forEach( function(id) {
        if (self._raw.hasOwnProperty('result') 
                && self._raw['result'].hasOwnProperty(id)) {
            authors[id] = self._raw['result'][id]['authors'];
        }
    });
    
    return authors;
};

/**
 * makes journal object
 * 
 * Returns journal object, for example:
 * 
 *  { '1234' : 'Science (New York, N.Y.)'" }
 *  
 * @returns {object} journals
 */
eSummaryResponse.prototype._makeJournalMap = function() {
    var self = this;
    var journals = {};
    
    self.idList.forEach( function(id) {
        if (self._raw.hasOwnProperty('result') 
                && self._raw['result'].hasOwnProperty(id)) {
            journals[id] = self._raw['result'][id]['fulljournalname'];
        }
    });
    
    return journals;
};

/**
 * makes title object
 * 
 * Returns title object, for example:
 * 
 *  { '1234' : 'The genome of the...'" }
 *  
 * @returns {object} titles
 */
eSummaryResponse.prototype._makeTitleMap = function() {
    var self = this;
    var titles = {};
    
    self.idList.forEach( function(id) {
        if (self._raw.hasOwnProperty('result') 
                && self._raw['result'].hasOwnProperty(id)) {
            titles[id] = self._raw['result'][id]['title'];
        }
    });
    
    return titles;
};

/**
 * makes data object
 * 
 * Returns date object, for example:
 * 
 *  { '1234' : '2014 Jul-Aug'" }
 *  
 * @returns {object} dates
 */
eSummaryResponse.prototype._makeDateMap = function() {
    var self = this;
    var dates = {};
    
    self.idList.forEach( function(id) {
        if (self._raw.hasOwnProperty('result') 
                && self._raw['result'].hasOwnProperty(id)) {
            dates[id] = self._raw['result'][id]['pubdate'];
        }
    });
    
    return dates;
};

/**
 * Getter for journal title
 * 
 * 
 * @returns {string} journal
 */
eSummaryResponse.prototype.getJournal = function(id) {
    var self = this;
    var journal = '';
    if (self._journalMap.hasOwnProperty(id)) {
        journal = self._journalMap[id];
    }
    return journal;
};

/**
 * Getter for entity title
 * 
 * @returns {string} title
 */
eSummaryResponse.prototype.getTitle = function(id) {
    var self = this;
    var title = '';
    if (self._titleMap.hasOwnProperty(id)) {
        title = self._titleMap[id];
    }
    return title;
};

/**
 * Getter for pub date
 * 
 * @returns {string} date
 */
eSummaryResponse.prototype.getDate = function(id) {
    var self = this;
    var date = '';
    if (self._dateMap.hasOwnProperty(id)) {
        date = self._dateMap[id];
    }
    return date;
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
    
    if (self._authorTable.hasOwnProperty(id)) {
        //(ES6) return self._authorTable.map( i => i.name);
        authorList = self._authorTable[id].map( function (i) {
            return i.name;
        });
    }
    return authorList;
};

//TODO will be deleted
if (typeof exports === 'object') {
    exports.eSummaryResponse = eSummaryResponse;
}
if (typeof (loaderGlobals) === 'object') {
    loaderGlobals.eSummaryResponse = eSummaryResponse;
}
