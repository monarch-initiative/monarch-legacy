
Feature: Basic autocomplete works
 Monarch-app can have correct data in the drop-down and navigate to a search
 page or detail page.
 
 ## No Background necessary.

 @ui
 Scenario: "food" in the navbar search with submit goes to a search page
    Given I go to page "/"
     and I type "food" into the navbar search
     and I submit navbar search
     then the title should be "Search Results: food"
     and the document should contain "food allergy"
     and the document should contain "botulism"

 @ui
 Scenario: "food" in the navbar search with a click goes to a details page
    Given I go to page "/"
     and I type "food a" into the navbar search
     and I wait until "food allergy" appears in the autocomplete 
     and I click the autocomplete item "food allergy"
     then the title should be "Monarch Disease: food allergy (DOID:3044)"

 @ui
 Scenario: "ZRS" in the navbar search with a click goes to a gene page
    Given I go to page "/"
     and I type "ZRS" into the navbar search
     and I wait until "ZRS" appears in the autocomplete 
     and I click the autocomplete dropdown item "ZRS" with category "Human"
     then the title should be "Monarch Gene: LMBR1 (NCBIGene:64327)"
     
## Commenting out, see https://github.com/monarch-initiative/monarch-app/issues/1017
 @ui
 Scenario: "hyper-be" in the navbar search with a click goes to a disease page
    Given I go to page "/"
     and I type "hyper-be" into the navbar search
     and I wait until "Hyper-beta-alaninemia" appears in the autocomplete
     and I click the autocomplete item "Hyper-beta-alaninemia"
     then the title should be "Monarch Disease: Hyper-beta-alaninemia (OMIM:237400)"
