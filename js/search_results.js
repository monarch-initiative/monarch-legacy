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

var url = 'http://localhost:8080/searchfiltering/' + searchTerm + '/' + filters.category + '/' + filters.species;
console.log(url);

      // fire the new search call and update table
      // Separate the ajax request with callbacks
        var jqxhr = $.ajax({
            url: url,
            method: 'GET', 
            async : true,
            dataType : 'json'
        });
        
        jqxhr.done(function(data) {
            console.log(data);
            
            if (typeof(data) !== 'undefined') {
              // update the table with this new table content
              $('.search-results-rows').html(data.table);

              // Update the total count number
              $('#totalCount').html(data.count);
            }
        });
        
        jqxhr.fail(function () { 
            console.log('Ajax error')
        });

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

