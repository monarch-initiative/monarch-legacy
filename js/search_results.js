// searchResults is an array
console.log(searchResults);

// group the results by category
var groupsByCategory = _.groupBy(searchResults, "category");

console.log(groupsByCategory);

// group the results by taxon
var groupsByTaxon = _.groupBy(searchResults, "taxon");

console.log(groupsByTaxon);