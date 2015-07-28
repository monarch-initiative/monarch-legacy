
Feature: Monarch-app's JSON service is sane
 Monarch-app JSON blobs behave as expected for various data.
 
 ## No Background necessary.
 
 ## Removed - and the JSON should have JSONPath "annotation_sufficiency" equal to "integer" "0"

 @data
 Scenario: User attempts to use consume the JSON for a disease
    Given I collect data at path "/disease/DOID:3044.json"
     then the content type should be "application/json"
      and the content should contain "relationships"
    when the content is converted to JSON
     then the JSON should have the top-level property "uri"
      and the JSON should have the top-level property "fragment"
      and the JSON should have the top-level property "curie"
      and the JSON should have the JSONPath "relationships[*].source"
      and the JSON should have JSONPath "synonyms[0]" equal to "string" "food hypersensitivity"
