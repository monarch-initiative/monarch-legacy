Feature: NodeJS and RingoJS pass all tests.
 Monarch-app JSON blobs behave as expected for various data.

@ui
 Scenario: The "/search" endpoint returns the correct JSON
    Given I go to page "/search/twist"
     then the title should be "Search Results: twist"
     then the document should contain "Search Results: twist"

@ui
 Scenario: The "/about/sources" endpoint returns the correct HTML
    Given I go to page "/about/sources"
     then the title should be "Data Sources"
     then the document should contain "Data Sources"

@ui
 Scenario: The "/about/sources.json" endpoint returns the correct JSON
    Given I go to page "/about/sources.json"
     then the document should contain '"resource_description":"BioGRID is'

@ui
 Scenario: The "/admin/introspect" endpoint returns the correct JSON
    Given I go to page "/admin/introspect"
     then the document should contain '"config":'

@ui
 Scenario: The "/admin/introspect.json" endpoint returns the correct JSON
    Given I go to page "/admin/introspect.json"
     then the document should contain '"config":'

@ui
 Scenario: The "/variant/ClinVarVariant:30599" endpoint returns the correct page
    Given I go to page "/variant/ClinVarVariant:30599"
     then the document should contain "Variant: NM_017882.2(CLN6):c.200T>C (p.Leu67Pro)"
     then the title should be "Monarch Variant: NM_017882.2(CLN6):c.200T>C (p.Leu67Pro) (ClinVarVariant:30599)"

@ui
 Scenario: The "/status" endpoint returns the correct JSON
    Given I go to page "/status"
     then the document should contain '"name":"Monarch Application"'

@ui
 Scenario: The "/robots.txt" endpoint returns the correct JSON
    Given I go to page "/robots.txt"
     then the document should contain "User-agent: *"

@ui
 Scenario Outline: the documentation pages exist
   Given I go to page "<page>"
    then the title should be "<title>"
    and the document should contain "<content>"
   Examples: doc pages
    | page                              | title             | content                       |
    | /docs/index.html                  | monarch.api       | fetchDiseaseInfo              |
    | /docs/files/web/webapp-js.html    | webapp            | Monarch REST URLs for retrieving web pages, JSON and HTML|
    | /docs/files/web/webapp-js.html#webapp.simsearch    | webapp            | Performs OwlSim search|

@ui
 Scenario: The "/compare/" endpoint returns the correct JSON
    Given I go to page "/compare/OMIM:270400/NCBIGene:5156,OMIM:249000,OMIM:194050.json"
     then the document should contain "Smith-Lemli-Opitz Syndrome"
     then the document should contain "PDGFRA"
     then the document should contain "Blue irides"
     
@ui
 Scenario: The "/compare/" endpoint returns the correct JSON with invalid ID
    Given I go to page "/compare/HP:0012774+HP:0002650/1232413241234.json"
     then the document should contain "HP:0012774"
     then the document should contain "HP:0002650"
     then the document should contain '"metric":"combinedScore"'

@ui
Scenario: The "/query/orthologs/" endpoint returns the correct JSON
   Given I go to page "/query/orthologs/NCBIGene:6469.json"
   then the document should contain "NCBIGene:6469"
   then the document should contain "MGI:98297"

@ui
 Scenario: The "/annotate/text" endpoint returns the correct query page
    Given I go to page "/annotate/text"
     then the document should contain "Text Annotator"
     then the title should be "Annotation"


@ui
 Scenario: The "/annotate/text" endpoint returns the correct results page
    Given I go to page "/annotate/text?q=In+the+LEOPARD+syndrome+%28151100%29+vestibular+function+is+normal."
     then the document should contain "Marked Up Text"
     then the title should be "Annotation"

