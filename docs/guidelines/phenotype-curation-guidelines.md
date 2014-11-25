Reporting phenotypes using structured data allows computational analyses within and across species. It is helpful if the person annotating thinks of the set of annotations as a query against all known phenotype profiles. Therefore, the set of phenotypes chosen for the annotation must be as specific as possible, and represent the most salient and important observable phenotypes. We have observed time and again that the performance of computational search algorithms improves if a comprehensive list of phenotypic features is used.  Furthermore, the annotations should be limited to those features that are abnormal or considered potentially abnormal. Also note that not all facets of a patient phenotype can be annotated using structured vocabularies. The goal is not to represent everything possible, but rather to represent that which most aids these query functions. The vocabularies are a work in progress and your feedback is very valuable. 

These guidelines are separated into two sections, the first should be implemented in a “getting started” or “help” menu of PhenoTips or in tool tips for each section, the second are to aid curators reviewing the content of PhenoTips output and are considered additional curation guidelines. Note that the focus here is on annotation of the phenotype data – there is a rough sketch of guidelines constructed for the other kinds of data recorded within PhenoTips, but the PhenoTips team and UDP should flesh these out as specific to the UDP use case. These guidelines have been made specific to the UDP implementation of PhenoTips.

## PhenoTips Annotation Guidelines

Each of the following sections may be edited by clicking on the pencil icon to the right of the section header, visible when hovering over the title. The form autosaves, and there is also a save button on the bottom of the form.

Patient information

1.	The Patient Identifier, Exam date, Attending Clinician, and Date of Birth. Sex should be recorded as biological sex rather than gender.
2.	To create links to other patients or family members in the system, click the black “new entry button” once for each desired relationship.  
3.	For each relationship, choose the type of relationship in the first box (for example, “Sibling” and then choose the patient ID (UDP_XXX) for the second person in the second box. 
4.	Indicate the onset of the disease using the radio buttons. Note that the choice of a given onset designates that this is the onset for the majority of the symptoms. Individual phenotypes may be designated with different onset than recorded here in the Clinical Symptoms section (see below).
5.	Record the “Indication for Referral”. This content can be a short summary or include content from the patient record. DO NOT RECORD any PHI content in the PhenoTips form.

## Prenatal and Perinatal History

1.	Gestation at delivery. Please record a numeric value in weeks, such as “38” or leave blank if unknown.
2.	AGPAR score at 1 and 5 mins. Please choose from the pulldowns the appropriate value if known.
3.	Prenatal Growth Parameters. Indicate the birth measurements for Weight, Height, and Head Circumference as <3rd percentile or >97th percentile for age by clicking the “Y” or “N” for yes or no, respectively. If not known, leave as the default “N/A”. 
4.	Prenatal Development or Birth. Indicate “Oligohydramnios,” “Polyhydramnios”, or “Premature Birth”, or the latter’s subtype “Premature delivery because of cervical insufficiency or membrane fragility” using the “Y” or “N” for yes or no as per above.
5.	A field for additional pre- and perinatal notes is included. This content can be a short summary or include content from the patient record. DO NOT RECORD any PHI content in the PhenoTips form. 

## Medical and Developmental History

1.	A “Medical and developmental history” notes field is provided to record notable issues in the medical history not already recorded above. This content can be a short summary or include content from the patient record. DO NOT RECORD any PHI content in the PhenoTips form. 

## Family History

1.	Record Maternal and Paternal Ethnicity, such as “White” or “Hispanic”. These will autocomplete or specified by the user. You may enter more than one ethnicity for each parent.
2.	Check the box if the patient was conceived using in vitro fertilization.
3.	Indicate Consanguinity using the “Y” or “N”. The default value is N/A if not relevant or unknown.
4.	List Health Conditions Found in Family (describe the relationship with proband) in the notes field. DO NOT RECORD any PHI content in the PhenoTips form. 

## Measurements 

1.	Click the black “New entry” button to create a list of patient measurements. These are dated, and a new set of measurements from a different date may be recorded by clicking the “new entry” button again. The age of the patient at each measurement date will be displayed.
2.	Enter values for Weight (kg), and in cm: Height, Arm Span, Sitting Height, Head Circumference, Philtrum Length, Left Ear Length, Right Ear Length, Outer Canthal Distance, Inner Canthal Distance, Palpebral Fissure Length, Interpupilary Distance, Left Hand Length, Left Palm Length, Left Foot Length, Right Hand Length, Right Palm Length, and Right Foot Length. 
3.	The growth charts are displayed below based on prior entries.

## Clinical symptoms and physical findings

Click “This patient is clinically normal” for those patients/family members that have no known abnormal phenotypes.

## Searching for Phenotypes. 

There are three methods to search for phenotypes. In both methods, you can autocomplete on any phenotype and add it directly to the record. 
1.	You can use the “Quick Phenotype Search” in the black box at the top of the Clinical Symptoms section. “Quick Phenotype Search” searches the whole HPO ontology. 
2.	You can “Browse Categories”, where you can click the “jump to” link to choose a specific category or “expand all” to show all categories. The “collapse all” button reverts to closing all the categories, and the “hide” button hides all of the categories, which are restored by clicking the “Browse Categories” button again. The categories are as follows:
a.	Growth parameters
b.	Craniofacial
c.	Eye defects
d.	Ear defects
e.	Cutaneous
f.	Cardiac
g.	Respiratory
h.	Musculoskeletal
i.	Gastrointestinal
j.	Genitourinary
k.	Behavior, Cognition and Development
l.	Neurological
m.	Other. See term requests below.
3.	You can use the “Other” search box within each diagnostic category. This searches only the relevant portion of the HPO within each category, including synonyms and alternate spellings.

## Choosing Phenotype terms. 

Your phenotype selections will show up under the “Current Selection” section over on the right panel of the Clinical symptoms section, where all of the selections from the different categories will be shown. This is where you will visualize the whole phenotype profile for the given patient. 

1.	For each phenotype, choose the most specific term possible, based on the definition (available by clicking the “i”) and not necessarily simply based on the label. Before selecting a term, examine any of the more specific terms contained underneath it by opening the arrow. If any of those are appropriate, select the more specific term. In particular, if you are using the “Quick Search” box, you should always browse related terms to ensure that you have selected the most specific term. 
2.	Record “Y” for Yes, to indicate a phenotype being present in the patient. You may provide annotations for things that were investigated and specifically not observed by clicking on the “N” for No. These will turn red in the interface. These NOT annotations are especially useful to include in cases where there are only a few observable phenotypes. The default is a grey “N/A”, which means not noted to be specifically present or absent.
3.	The more specific the item chosen, the better the specificity of the whole phenotypic profile. If there are no phenotypes in a given category, consider making a high level NOT annotation.
4.	Choose terms that are thought to be pathological or unusual, even if they are not so in the greater populace. For example, ‘blue irides’ is a common phenotype in the population, but as a phenotype annotation, it is a subtype of ‘abnormal iris pigmentation’ and should only be chosen in cases where abnormal pigmentation is suspected, such as Heterochromia. We will work to support common traits in later enhancements of the HPO.

## Phenotype Annotation Sufficiency Meter

This function appears at the top of the “Current Selection” section. This meter assesses the breadth and depth of your phenotype annotation profile using a five-star rating system for a given patient in the context of all curated human and model organism phenotypes. The goal is to make your annotation profile specific enough to exclude similar diseases and to identify model organisms with similar phenotypes that may have mutations in relevant genes or pathways. The patient annotation profile is also used to aid exome prioritization using the same technology.

1.	Annotate the patient record until you get to a 5-star rating. 
2.	Inclusion of NOT annotations in different categories can aid in obtaining this rating, especially where there are few specific observable phenotypes. 

## Additional Phenotype Information

1.	Each phenotype may be associated with an ‘age of onset’ term, such as congenital onset, by clicking the “add details” button over in the Current Selection box on the right side of the interface. If a later onset period is indicated for any given phenotype than the whole patient recorded in the Patient Information section, it is assumed that that phenotype was NOT present initially and was noted at the later time. If an earlier onset is indicated for any given phenotype, then it is assumed that this indicates that the other phenotypes were not present at the earlier time EXCEPT the one indicated by the earlier onset period.  
2.	Each phenotype may also be associated with a “pace of progression” term, such as “slow progression”. 
3.	Comments, Images, and Medical reports may also be included in the “Add details” section for each phenotype.

## Term requests

In some cases, you may not be able to find the term you are looking for. The “Other” white box at the bottom of each category besides being used to search that category is also used to record user requests. This allows a free-text request, which will be sent to the HPO tracker and someone will follow up with you in the UDPICS system chat once the term has been implemented or if clarification is needed.  Please make sure to include only one term per request and make it as descriptive as possible. A request may also be a refinement of existing terms, please feel free to reference these in the request. Please do not request:
a.	Acronyms
b.	Measurement values
c.	Collections of phenotypes, such as diseases or syndromes
d.	Genotype or chromosomal abnormalities (for example, Microarray Xp22.31 dup, maternally derived; ETFDH carrier)
e.	Identifiers - a human readable label is required
f.	Patient history (use the section above).
g.	Assays – however, observable phenotypes derived from a specific assay are fine. For example, “abnormal MRI” does not describe a phenotype, rather what made that MRI abnormal is the observed phenotype (instead, request “cerebral volume loss indicated by abnormal MRI”).
h.	Devices – similarly, do not request devices but rather the phenotypes that are addressed by their use. For example, “mitral valve prolapse via echocardiogram.”
If you have questions about whether a term is applicable, please contact the Phenotype Team by emailing obo-human-phenotype@lists.sourceforge.net.

You Might Want to Check For
In the yellow box underneath the “Browse Categories” one has the ability to indicate specific phenotypes that are known to improve differential diagnosis. Clicking on this header opens up a direct selection of these phenotype terms. Choice of these populates the Current Selection in the right hand panel.

## Diagnosis

Note that generally, a disorder is used to annotate the patient profile because it was either: tested and confirmed to be either present or absent OR suspected based on the manifestations (phenotypes), but not yet tested.

1.	Choose an OMIM disease/disorder using the autocomplete based on the disease name in the box on the right. 
2.	You may also use the “Instant OMIM Search” function at the bottom to identify the OMIM diseases based on the matching of the phenotype profile. You can update the list of potential OMIM candidates by clicking on/off each of the phenotypes listed at the top of the “Instant OMIM Search”. Note that a disorder is marked as confirmed_present, confirmed_absent, or suspected in the toggle when you choose an OMIM disorder. Note also that not all the symptoms linked in OMIM for a disease need to be present in the Categories section.
