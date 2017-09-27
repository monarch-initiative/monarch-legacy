Feature: Gene description
 The page displays the text-based gene description as expected

 ## No Background necessary.

@ui
Scenario: text based description of the gene appears in a user-friendly way
   Given I go to page "/gene/NCBIGene:6469#overview" and wait for id "my-gene-spinner" to be hidden
    then the "Overview" tab should contain "This gene encodes a protein that is instrumental in patterning"

