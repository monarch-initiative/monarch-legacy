// searchResults is an array
console.log(searchResults);

// group the results by category
var groupsByCategory = _.groupBy(searchResults, "category");

console.log(groupsByCategory);

// group the results by taxon
var groupsByTaxon = _.groupBy(searchResults, "taxon");

console.log(groupsByTaxon);

// isotope
// external js: isotope.pkgd.js

$( document ).ready(function() {
    
    // init Isotope
    var $grid = $('.search-results-grid').isotope({
      itemSelector: '.search-result-box'
    });

    // store filter for each group
    var filters = {};

    $('.filters').on( 'click', '.search-results-button', function() {
      var $this = $(this);
      // get group key
      var $buttonGroup = $this.parents('.search-results-button-group');
      var filterGroup = $buttonGroup.attr('data-filter-group');
      // set filter for group
      filters[ filterGroup ] = $this.attr('data-filter');
      // combine filters
      var filterValue = concatValues( filters );
      // set filter for Isotope
      $grid.isotope({ filter: filterValue });
    });

    // change is-checked class on buttons
    $('.search-results-button-group').each( function( i, buttonGroup ) {
      var $buttonGroup = $( buttonGroup );
      $buttonGroup.on( 'click', 'button', function() {
        $buttonGroup.find('.is-checked').removeClass('is-checked');
        $( this ).addClass('is-checked');
      });
    });
      
    // flatten object by concatting values
    function concatValues( obj ) {
      var value = '';
      for ( var prop in obj ) {
        value += obj[ prop ];
      }
      return value;
    }

});

