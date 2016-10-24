// searchResults is an array
console.log(searchResults);


$( document ).ready(function() {
    // store filter for each group
    var filters = {};

    $('.filters').on( 'click', '.search-results-button', function() {
      var $this = $(this);
      // get group key
      var $buttonGroup = $this.parents('.search-results-button-group');
      var filterGroup = $buttonGroup.attr('data-filter-group');
      // set filter for group
      filters[filterGroup] = $this.attr('data-filter');

      // E.g. {species: "danio_rerio", category: "gene"}
      console.log(filters);
      
      // combine filters
      var filterValue = concatValues( filters );
console.log(filterValue);
      // show only filtered groups
      $('.search-result-item'+ filterValue).show();
      $('.search-result-item:not(' + filterValue +')').hide();

      // Will need to reapply the table striped tr highlighting
    });








    // change is-checked class on buttons
    $('.search-results-button-group').each( function( i, buttonGroup ) {
      var $buttonGroup = $( buttonGroup );
      $buttonGroup.on('click', 'button', function() {
        // Highlight selected button
        $buttonGroup.find('.is-checked').removeClass('is-checked');
        $(this).addClass('is-checked');
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

