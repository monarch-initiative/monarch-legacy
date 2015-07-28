
Feature: Basic autocomplete works
 Monarch-app can have correct data in the drop-down and navigate to a search
 page or detail page.
 
 ## No Background necessary.

 @ui
 Scenario: "food" in the home search with submit goes to a search page
    Given I go to page "/"
     and I type "food" into the home search
     and I submit home search
     then the title should be "Search Results: food"
     and the document should contain "food allergy"
     and the document should contain "botulism"

 @ui
 Scenario: "food" in the home search with a click goes to a details page
    Given I go to page "/"
     and I type "food" into the home search
     and I wait until "food allergy" appears in the autocomplete 
     and I click the autocomplete item "food allergy"
     then the title should be "Monarch Disease: food allergy (DOID:3044)"

 @ui
 Scenario: "ZRS" in the home search with a click goes to a gene page
    Given I go to page "/"
     and I type "ZRS" into the home search
     and I wait until "ZRS" appears in the autocomplete 
     and I click the autocomplete item "ZRS"
     then the title should be "Monarch Gene: LMBR1 (NCBIGene:64327)"
