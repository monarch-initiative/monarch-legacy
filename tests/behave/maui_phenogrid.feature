Feature: Phenogrid Works
 The several places where Phenogrid appears are properly loaded.

 ## No Background necessary.

 @ui
 Scenario: Phenotype Analysis Phenogrid works
    Given I go to slow page "/disease/OMIM:105830" and wait for id "pg_svg_area"
      then the title should be "Monarch Disease: Angelman syndrome (OMIM:105830)"
      and the document should contain "Cross-Species Overview"

@ui
Scenario: Documentation example phenogrid appears
   Given I go to page "/page/phenogrid"
    then the title should be "Monarch Phenotype Grid Widget"

# Disabled until the CORS issue is fixed on beta.monarchinitiative.org for the /simsearch route:
#   [Error] XMLHttpRequest cannot load http://beta.monarchinitiative.org/simsearch/phenotype.
#   Origin http://localhost:8080 is not allowed by Access-Control-Allow-Origin. (index.html, line 0)
#
# @ui
# Scenario: Loading the iframe content for Monarch Phenotype Grid Widget loads a page with the correct title
#    Given I go to slow page "/node_modules/phenogrid/index.html" and wait for id "pg_svg_area"
#      then the title should be "Monarch Phenotype Grid Widget"
#      and the document should contain "Phenogrid is a Javascript component that visualizes"
#      and the document should contain "Phenotype Comparison (grouped by Mus musculus genes)"
#      and the document should contain "Fluctuations in consciousness"
#      and the document should contain "Bahcc1"

