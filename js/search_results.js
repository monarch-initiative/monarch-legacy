// searchResults is an array
//console.log(searchResults);

$( document ).ready(function() {

    var vueapp = new Vue({
      delimiters: ['{[{', '}]}'], // ugly, but otherwise it'll clash with puptent template mechanism
      el: '#vue-app',
      data: {
        facets: [],
        user_facets: {},
        results: [],
        highlight: {},
        suggestions: {},
        page: 0,
        numFound: 0,
        numRowsDisplayed: 0,
        selenium_id: ''
      },
      methods: {
        fetchResults: function () {
          // console.log("=== FETCH " + this.page + " " + JSON.stringify(this.user_facets));
          var anchor = this;
          axios.get('/searchapi/'+searchTerm, {params: this.user_facets})
            .then(function (response) {
              anchor.numFound = response.data.response.numFound;
              anchor.numRowsDisplayed = response.data.response.docs.length;
              anchor.results = response.data.response.docs;
              anchor.highlight = {};
              anchor.selenium_id = 'loaded';
              if (anchor.numFound == 0) {
                anchor.fetchSuggestions();
              }
              // Take the first highilited field and massage it in a more convenient data structure
              Object.keys(response.data.highlighting).forEach(function(key) {
                var firstKey = Object.keys(response.data.highlighting[key])[0];
                anchor.highlight[key] = response.data.highlighting[key][firstKey][0];
              });
              var facets_fields = response.data.facet_counts.facet_fields;
              if(anchor.facets.length == 0) { // for initial visit of the search page
                Object.keys(facets_fields).forEach(function(key) {
                  var json = {};
                  json[key] = facets_fields[key];
                  anchor.facets.push(json);
                });
              } else { // user used facets, just update the numbers
                anchor.facets.forEach(function(facet) {
                  var key = Object.keys(facet)[0];
                  var filters = facet[key];

                  // make an inventory of newly fetched facets
                  var newFacets = {};
                  facets_fields[key].forEach(function(facets_field) {
                    newFacets[facets_field[0]] = facets_field[1];
                  });

                  // Update the existing filters, with new number if exists, or 0
                  filters.forEach(function(filter) {
                    if(newFacets.hasOwnProperty(filter[0])) {
                      filter[1] = newFacets[filter[0]];
                    } else {
                      filter[1] = 0;
                    }
                  });

                });
              }
            })
            .catch(function (error) {
              console.log(error);
          });
        },
        fetchMore: function() {
          this.page += 1;
          var anchor = this;
          var params = jQuery.extend(true, {}, this.user_facetst); // deep copy
          params['p'] = this.page;
          axios.get('/searchapi/'+searchTerm, {params: params})
            .then(function (response) {
              anchor.numRowsDisplayed += response.data.response.docs.length;
              anchor.results = anchor.results.concat(response.data.response.docs);
              Object.keys(response.data.highlighting).forEach(function(key) {
                var firstKey = Object.keys(response.data.highlighting[key])[0];
                anchor.highlight[key] = response.data.highlighting[key][firstKey][0];
              });
            })
            .catch(function (error) {
              console.log(error);
          });
        },
        updateFacets: function(event, category, item) {
          if(item == "all") {
            delete this.user_facets[category];
          } else {
            this.user_facets[category] = item;
          }
          this.page = 0;
          this.fetchResults();
        },
        beautifyFacetTitle: function(title) {
          // taxon_label => Taxon
          // category => Category
          var cleanTitle = title.split('_')[0];
          return cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
        },
        fetchSuggestions: function() {
          //console.log("=== FETCH SUGGESTIONS");
          var anchor = this;
          axios.get('/suggestapi/'+searchTerm)
            .then(function (response) {
              anchor.suggestions = response.data;
            })
            .catch(function (error) {
              console.log(error);
          });
        }
      }
    })

    // initial call
    vueapp.fetchResults();

  });
