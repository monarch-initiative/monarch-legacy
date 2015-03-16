
Feature: Analyze phenotypes is usable by the expected user interfaces
 The tools behaves as expected given typical user input.
 
 ## No Background necessary.

 @data
 Scenario: adding "allergy" and "asthma" to analyze phenotype results in "Ichthyosis Vulgaris"
    Given I go to page "/analyze/phenotype"
     and I type "aller" into the phenotype analyze search
     and I wait until "Allergy" appears in the autocomplete
     and I click the autocomplete item "Allergy"
     and I type "asth" into the phenotype analyze search
     and I wait until "Asthma" appears in the autocomplete
     and I click the autocomplete item "Asthma"
     when I submit analyze phenotype
     then the document should contain "Ichthyosis Vulgaris"

 ## Example how you might do other forms.
 # @data
 # Scenario: user uses a random form page with 
 #    Given I go to page "/page-with-form"
 #     and I input the following text into the textarea "foo"
 #      """
 #      P31946   ,P62258
 #      Q04917,P61981
 #      P31947  baxter
 #      P27348,
 #      P63104 ,  Q96QU6
 #      Q8NCW5 ,
 #      """
 #     when I submit the form by clicking XPath "/html/body/div[2]/div[4]/button"
 #     then the title should be "Foo"
