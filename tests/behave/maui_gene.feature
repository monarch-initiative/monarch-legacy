Feature: Gene page description
 The page displays the text-based gene description as expected
 
 ## No Background necessary.

 @ui
 Scenario: text based description of the gene appears in a user-friendly way
    Given I go to page "/gene/OMIM:168600"
     then the "Overview" tab should contain "Parkinson disease was first described by James Parkinson"

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