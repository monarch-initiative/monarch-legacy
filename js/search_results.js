// searchResults is an array
console.log(searchResults);


$( document ).ready(function() {
    // store filter for each group
    var filters = {category: [], taxon_label: []};
    var pageNum = 1;

    $('.filters').on( 'click', '.search-results-button', function() {
      var $this = $(this);

      // Always set pageNum to 1
      pageNum = 1;

      // get group key
      var $buttonGroup = $this.parents('.search-results-button-group');
      var filterGroup = $buttonGroup.attr('data-filter-group');

      if (filterGroup === 'category') {
          if ($this.attr('data-filter') === '') {
              filters.category = [];
          } else {
              filters.category = [$this.attr('data-filter')];
          }
      }

      if (filterGroup === 'taxon_label') {
          if ($this.attr('data-filter') === '') {
              filters.taxon_label = [];
          } else {
              filters.taxon_label = [$this.attr('data-filter')];
          }
      }

      // Convert object to JSON string
      // E.g. {"category": ["gene"], "taxon_label": ["Danio rerio"]}
      var url = 'http://localhost:8080/searchfiltering/' + searchTerm + '/' + JSON.stringify(filters) + '/' + pageNum;
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
            console.log('Ajax error!')
        });

    });


    // Load more content
    $('#more').click(function(){
        // Increase the page number
        pageNum++;
console.log(pageNum);

        // Convert object to JSON string
        // E.g. {"category": ["gene"], "taxon_label": ["Danio rerio"]}
        var url = 'http://localhost:8080/searchfiltering/' + searchTerm + '/' + JSON.stringify(filters) + '/' + pageNum;

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
              // append new table content
              $('.search-results-rows').append(data.table);
            }
        });
        
        jqxhr.fail(function () { 
            console.log('Ajax error to fetch more results!')
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

