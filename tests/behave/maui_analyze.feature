
Feature: Analyze phenotypes is usable by the expected user interfaces
 The tools behaves as expected given typical user input.

 ## No Background necessary.

 @data
 Scenario: adding "allergy" and "asthma" to analyze phenotype results in "Ichthyosis Vulgaris"
    Given I go to page "/analyze/phenotypes"
     and I type "aller" into the phenotype analyze search
     and I wait until "Allergy" appears in the autocomplete
     and I click the autocomplete item "Allergy"
     and I type "asth" into the phenotype analyze search
     and I wait until "Bronchial asthma" appears in the autocomplete
     and I click the autocomplete item "Bronchial asthma"
     when I submit analyze phenotype
     and I wait for id "phen_vis_svg"
     then the document should contain "Asthma,"

@data
 Scenario: adding "Microalbuminuria" and "microcephaly" to analyze phenotype results in "pru1"
    Given I go to page "/analyze/phenotypes"
     and I type "microa" into the phenotype analyze search
     and I wait until "Microalbuminuria" appears in the autocomplete
     and I click the autocomplete item "Microalbuminuria"
     and I type "microc" into the phenotype analyze search
     and I wait until "Microcephaly" appears in the autocomplete
     and I click the autocomplete item "Microcephaly"
     when I submit analyze phenotype
     and I wait for id "phen_vis_svg"
     then the document should contain "pru1"

@data
 Scenario: compare phenotype with geneList
    Given I go to page "/analyze/phenotypes"
     and I type "microa" into the phenotype analyze search
     and I wait until "Microalbuminuria" appears in the autocomplete
     and I click the autocomplete item "Microalbuminuria"
     and I click the "compare" radio button
     and I input "NCBIGene:388552,NCBIGene:3586" into the textarea "gene-list"
     when I submit analyze phenotype
     and I wait for id "phen_vis_svg"
     then the document should contain "IL10"

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
