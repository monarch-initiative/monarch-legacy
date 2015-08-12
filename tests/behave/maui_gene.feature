Feature: Gene page description
 The page displays the text-based gene description as expected

 ## No Background necessary.

 @ui
 Scenario: text based description of the gene appears in a user-friendly way
    Given I go to slow page "/gene/OMIM:168600#overview" and wait for id "compare"
     then the "Overview" tab should contain "Parkinson disease was first described by James Parkinson"

