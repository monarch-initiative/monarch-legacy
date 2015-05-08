
// Check if jQuery is loaded
if (typeof jQuery === 'undefined') {
    throw new Error('ClassEnrichment widget requires jQuery');
}

// Check if underscore is loaded
if(typeof _  != "function") {
    throw new Error('ClassEnrichment widget requires underscore.js');
}

// TODO does not work in Monarch app
// Check if DataTables is loaded
//if (typeof jQuery.fn.dataTable === 'undefined'){
//    throw new Error('ClassEnrichment widget requires DataTables');
//}


// depends on Bootstrap and Underscore
$.widget('monarch.classenrichment', {
    options: {
        hostUrl: "http://localhost:9000",
        resolverEndpoint: "/scigraph/annotations/entities.json",
        enrichmentEndpoint: "/scigraph/analyzer/enrichment.json",
        sampleSetLabel: "Enter your favorite pizzas:",
        backgroundLabel: "Background:",
        pathLabel: "Path:",
        sampleSetDefault: "four seasons cajun american hot",
        backgroundDefault: "pizza:Pizza",
        pathDefault: "-[pizza:hasTopping]->"
    },

    _create: function () {

        // to avoid the auto brackets in AJAX calls
        $.ajaxSetup({traditional: true});

        this.form = $('<form class="form-horizontal" style="padding-right:25px;"/>');
        this.inputSampleSet = $('<textarea class="form-control" rows="3">' + this.options.sampleSetDefault + '</textarea>');
        this.inputClass = $('<input class="form-control" value="' + this.options.backgroundDefault + '">');
        this.inputPath = $('<input class="form-control" id="inputPath" value="' + this.options.pathDefault + '">');
        this.resultArea = $('<div style="padding-left:15px;padding-right:25px;"/>');
        this.form.append($('<div class="form-group" style="padding-top:15px;">')
            .append($('<label for="sampleSet" class="col-sm-2 control-label">' + this.options.sampleSetLabel + '</label>'))
            .append($('<div class="col-sm-10"/>').append(this.inputSampleSet)));
        this.form.append($('<div class="form-group">')
            .append($('<label for="ontologyClass" class="col-sm-2 control-label">' + this.options.backgroundLabel + '</label>'))
            .append($('<div class="col-sm-10"/>').append(this.inputClass)));
        this.form.append($('<div class="form-group">')
            .append($('<label for="path" class="col-sm-2 control-label">' + this.options.pathLabel + '</label>'))
            .append($('<div class="col-sm-10"/>').append(this.inputPath)));

        this.formButton = $( "<button>", {
          text: "Run",
          class: "btn btn-default"
        }).button();

        this._on( this.formButton, {
          click: function(){
            var _this = this;
            _this.resultArea.html( "Loading data" );
            $.ajax({
                url: this.options.hostUrl + this.options.resolverEndpoint,
                jsonp: "callback",
                dataType: "jsonp",
                data: {
                    content: this.inputSampleSet.val()
                },
                success: function( resolved ) {
                    var iris = _.map(resolved, function(n){ return n.token.id; });
                    $.ajax({
                        url: _this.options.hostUrl + _this.options.enrichmentEndpoint,
                        jsonp: "callback",
                        dataType: "jsonp",
                        data: {
                            ontologyClass: _this.inputClass.val(),
                            path: _this.inputPath.val(),
                            sample: iris
                        },
                        success: function( response ) {
                            var processedData = _.map(response, function(n){ return [n.labels, n.iri, n.pValue]; });
                            var resultTable = $( '<table cellpadding="0" cellspacing="0" border="0" class="display"></table>' );
                            _this.resultArea.html( resultTable );
                            resultTable.dataTable( {
                                "data": processedData,
                                "columns": [
                                    { "title": "Labels"},
                                    { "title": "IRI" },
                                    { "title": "P-value" }
                                ],
                                "order": [[ 2, "asc" ]]
                            } ); 
                        },
                        error: function( response ) {
                            _this.resultArea.text(JSON.stringify(response));
                        }
                    });
                },
                error: function( response ) {
                    _this.resultArea.text(JSON.stringify(response));
                }
            });
          }
        });
        this.element.append(this.form).append(this.resultArea);
        this.element.append($('<div class="pull-right" style="padding-bottom:15px;padding-right:25px;"/>').append(this.formButton))
                    .append(this.resultArea);
    },

    _destroy: function () {
        this.element.html(""); // destroy everything
    },


    _setOptions: function (options) {
        this._super( options );
        this.refresh();
    }
});