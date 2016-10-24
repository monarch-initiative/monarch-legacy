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
console.log(filters.species);

      // show only filtered groups
      var results = $('.search-result-item');
      results.filter(function(index){
        return $(this).hasClass(filters.species);
      }).show();


      results.not('.' + filters.species).hide();
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



    

});

