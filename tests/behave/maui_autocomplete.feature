
Feature: Basic autocomplete works
 Monarch-app can have correct data in the drop-down and navigate to a search
 page or detail page.

 ## No Background necessary.

@ui
Scenario: "food" in the navbar search with submit goes to a search page
   Given I go to page "/"
    and I type "food" into the navbar search
    and I submit navbar search
    when I wait for id "selenium_id_loaded"
    then the title should be "Search Results: food"
    and the document should contain "food allergy"
    and the document should contain "botulism"

@ui
Scenario: "food" in the navbar search with a click goes to a details page
   Given I go to page "/"
    and I type "food all" into the navbar search
    and I wait until "Allergies, Food" appears in the autocomplete
    and I click the autocomplete item "Allergies, Food"
    when I wait for id "overview-panel"
    then the title should be "Monarch Disease: food allergy (DOID:3044)"

@ui
Scenario: "ZRS" in the navbar search with a click goes to a gene page
   Given I go to page "/"
    and I type "ZRS" into the navbar search
    and I wait until "ZRSR1" appears in the autocomplete
    and I click the autocomplete dropdown item "ZRSR1" with category "Homo sapiens"
    when I wait for id "monarch-node"
    then the title should be "Monarch Gene: ZRSR1 (NCBIGene:7310)"

@ui
Scenario: "hyper-be" in the navbar search with a click goes to a disease page
   Given I go to page "/"
    and I type "Hyper-bet" into the navbar search
    and I wait until "HYPER-BETA-ALANINEMIA" appears in the autocomplete
    and I click the autocomplete item "HYPER-BETA-ALANINEMIA"
    when I wait for id "monarch-node"
    then the title should be "Monarch Disease: Hyper-beta-alaninemia (OMIM:237400)"
