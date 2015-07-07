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
 Scenario: A hyperlink with text "All" should not be linked from /phenotype/HP:0000118
    Given I go to page "/phenotype/HP:0000118"
     then the document should not contain link with "All"
