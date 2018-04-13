// searchResults is an array
//console.log(searchResults);
/* global $ */
/* global document */
/* global Vue */
/* global axios */
/* global searchTerm */

/* eslint indent: 0 */

import Vue from 'vue';
import axios from 'axios';

const validCats = {
  'gene': 'gene',
  'phenotype': 'phenotype',
  'genotype': 'genotype',
  'disease': 'disease',
  'variant locus': 'variant',
};

function getOrderedCats(catList) {
  catList = catList || [];
  const categoryObj = catList.reduce( (map, cat) => {
    const mappedCat = validCats[cat];
    if (mappedCat) {
      map.valid[mappedCat] = mappedCat;
    }
    else {
      map.other[cat] = cat;
    }
    return map;
  },
  {
    valid: {},
    other: {}
  });

  if (categoryObj.valid.length > 1) {
    console.log('goc', catList, categoryObj.valid);
  }
  return categoryObj;
}

function InitSearchResults() {
    const vueapp = new Vue({
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
        selenium_id: '',
        searching: true
      },
      methods: {
        sanitizeHighlighting(htmlHighlightedText) {
          // NYI: We should properly make sure that the highlighting conforms to our
          // expectations, and does not contain script tags or other nasties.
          return htmlHighlightedText;
        },
        sanitize(rawResults) {
          return rawResults.map(result => {
            const orderedCats = getOrderedCats(result.category_std);
            const orderedCatsCombined = Object.keys(orderedCats.valid);  // [].concat(Object.keys(orderedCats.valid), Object.keys(orderedCats.other));
            const category = Object.keys(orderedCats.valid)[0];
            const categoryLower = category ? category.toLowerCase() : '';
            const categoryCommas = orderedCatsCombined.join(',');
            const taxonLabel = typeof result.taxon_label === 'object' ?
              result.taxon_label.join(',') :
              result.taxon_label;
            const htmlHighlight = this.highlight[result.id];

            result.linkName = this.sanitizeHighlighting(result.label[0]);
            if (category) {
              result.linkURL = '/' + category + '/' + result.id;
            }
            result.category = categoryLower;
            result.categoryCommas = categoryCommas;
            result.taxonLabel = taxonLabel;
            result.htmlHighlight = htmlHighlight;

            return result;
          });
        },
        fetchResults: function() {
          // console.log("=== FETCH " + this.page + " " + JSON.stringify(this.user_facets));
          const anchor = this;
          anchor.searching = true;
          axios.get(
            `/searchapi/${searchTerm}`,
            {
              params: this.user_facets
            })
            .then(function (response) {
              // console.log('response', response);
              anchor.searching = false;
              anchor.numFound = response.data.response.numFound;
              anchor.numRowsDisplayed = response.data.response.docs.length;
              anchor.highlight = {};
              anchor.selenium_id = 'loaded';
              if (anchor.numFound === 0) {
                anchor.fetchSuggestions();
              }
              // Take the first highilited field and massage it in a more convenient data structure
              Object.keys(response.data.highlighting).forEach(function(key) {
                var firstKey = Object.keys(response.data.highlighting[key])[0];
                anchor.highlight[key] = response.data.highlighting[key][firstKey][0];
              });

              anchor.results = anchor.sanitize(response.data.response.docs);

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

              if (window.vueRouter) {
                anchor.$nextTick(function () {
                  window.vueRouter.updatePageLinks();
                });
              }
            })
            .catch(function (error) {
              anchor.searching = false;
              console.log(error);
          });
        },
        fetchMore: function() {
          this.page += 1;
          var anchor = this;
          anchor.searching = true;
          var params = jQuery.extend(true, {}, this.user_facetst); // deep copy
          params['p'] = this.page;
          axios.get('/searchapi/'+searchTerm, {params: params})
            .then(function (response) {
              anchor.searching = false;
              anchor.numRowsDisplayed += response.data.response.docs.length;
              Object.keys(response.data.highlighting).forEach(function(key) {
                var firstKey = Object.keys(response.data.highlighting[key])[0];
                anchor.highlight[key] = response.data.highlighting[key][firstKey][0];
              });

              anchor.results = anchor.results.concat(
                anchor.sanitize(response.data.response.docs));
            })
            .catch(function (error) {
              anchor.searching = false;
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
          // console.log("=== FETCH SUGGESTIONS");
          var anchor = this;
          anchor.searching = true;
          axios.get('/suggestapi/'+searchTerm)
            .then(function (response) {
              anchor.suggestions = response.data;
              anchor.searching = false;
            })
            .catch(function (error) {
              console.log(error);
              anchor.searching = false;
          });
        }
      }
    });

    // initial call
    vueapp.fetchResults();
  }

module.exports = {
  InitSearchResults: InitSearchResults
};

