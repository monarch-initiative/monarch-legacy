Feature: Monarch-app UI basic pages display okay
 Monarch-app's basic landing pages are all functional.

 ## No Background necessary.

 @ui
 Scenario Outline: the core landing pages exist
   Given I go to page "<page>"
    then the title should be "<title>"
   Examples: core pages
    | page                | title                         |
    | /                   | Welcome to Monarch            |
    | /disease            | Monarch Diseases              |
    | /phenotype          | Monarch Phenotypes            |
    | /gene               | Monarch Genes                 |
    | /model              | Monarch Models                |
    | /analyze/phenotypes | Monarch Analysis              |
    | /annotate/text      | Annotation                    |
    | /page/exomes        | Monarch Exomes                |
    | /page/about         | About Monarch                 |
    | /sources            | Data Sources                  |
    | /page/releases      | Monarch Releases              |
    | /page/software      | Monarch Software              |
    | /page/services      | Monarch Services              |
    | /docs/index.html    | monarch.api                   |
    | /page/phenogrid     | Monarch Phenotype Grid Widget |
    | /page/pubs          | Monarch Publications          |
    | /page/glossary      | Monarch Glossary              |
    | /page/team          | Monarch Development Team      |
    
 @ui
 Scenario: Going to the page /resolve/HP:0006645 will forward to /phenotype/HP:0006645
    Given I go to page "/resolve/HP:0006645"
     then the url will be "/phenotype/HP:0006645"
     
 @ui
 Scenario: Going to the page /resolve/ClinVarVariant:159648 will forward to /variant/ClinVarVariant:159648
    Given I go to page "/resolve/ClinVarVariant:159648"
     then the url will be "/variant/ClinVarVariant:159648"
     
 @ui
 Scenario: Going to the page /resolve/MGI:3771021 will forward to /genotype/MGI:3771021
    Given I go to page "/resolve/MGI:3771021"
     then the url will be "/genotype/MGI:3771021"
     
 @ui
 Scenario: Going to the page /resolve/OMIM:600669 will forward to /disease/OMIM:600669
    Given I go to page "/resolve/OMIM:600669"
     then the url will be "/disease/OMIM:600669"

 @ui
 Scenario: Going to the page /resolve/OMIM_600669 will forward to /disease/OMIM:600669
    Given I go to page "/resolve/OMIM_600669"
     then the url will be "/disease/OMIM:600669"

 @ui
 Scenario: Going to the page /resolve/Bogus:123 will produce a Page Not Found error
    Given I go to page "/resolve/Bogus:123"
     then the document should contain "Sorry. Your page could not be found"
     and the title should be "Error"
     
 @ui
 Scenario: Going to the page /resolve/Coriell:ND24213 will forward to /model/Coriell:ND24213
    Given I go to page "/resolve/Coriell:ND24213"
     then the url will be "/model/Coriell:ND24213"
     
 @ui
 Scenario: Going to the page /resolve/RRID:Coriell:ND24213 will forward to /model/RRID:Coriell:ND24213
    Given I go to page "/resolve/RRID:Coriell:ND24213"
     then the url will be "/model/Coriell:ND24213"

 @ui
 Scenario: A hyperlink with text "All" should not be linked from /phenotype/HP:0000118
    Given I go to page "/phenotype/HP:0000118"
     then the document should not contain link with "All"
     
 @ui
 Scenario: An internal hyperlink to relative path /phenotype/HP:0000001 should not be linked from /phenotype/HP:0000118
    Given I go to page "/phenotype/HP:0000118"
     then the document should not contain an internal link to "/phenotype/HP:0000001"
