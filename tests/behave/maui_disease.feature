Feature: Disease page description
 The page displays the text-based gene description as expected

 ## No Background necessary.

@ui
Scenario: text based description of the disease appears in a user-friendly way
   Given I go to slow page "/disease/OMIM:168600#overview" and wait for class "bbop-js-ui-browse"
    then the "Overview" tab should contain "See http://www.omim.org/entry/168600"
    #then the "Overview" tab should contain "Parkinson disease was first described by James Parkinson"

