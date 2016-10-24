// searchResults is an array
console.log(searchResults);


$( document ).ready(function() {

    // change is-checked class on buttons
    $('.search-results-button-group').each( function( i, buttonGroup ) {
      var $buttonGroup = $( buttonGroup );
      $buttonGroup.on('click', 'button', function() {
        $buttonGroup.find('.is-checked').removeClass('is-checked');
        $(this).addClass('is-checked');
        
        // hide
        var filterClass = $(this).data("filter");
        $('.search-result-item').filter(filterClass).hide();


      });
    });

    

});

