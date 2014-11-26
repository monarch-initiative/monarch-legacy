
#Phenogrid installation

Please see the instructions in index.html to see how to install the
Phenogrid widget.

#Phenogrid configuration

The phenogrid can be configured via a variety of options contained in
the ./js/phenogrid_config.js file. This file must be loaded as a
separate Javascript file in every page that uses the phenogrid. Please
be sure that this file is loaded _before_ the main ./js/phenogrid.js file.

Options that can be modified include

* *serverURL* - the base url of the server/site from which the widget
   will be served. Should usually left to be null, in which case the
   server url be inferred from the code.

* *selectedCalculation*: an integer value describing the initial
   similarity  measure that will be used. Other values can always be
   selected via the appropriate pulldown. Possible values include:
   
  * 0 - for Similarity (default)
  * 1 - Ratio (q)
  * 2 - Uniqueness
  * 3 - Ratio (t)

* *selectedSort* - the initial sort order. As with the calculation,
   these choices may be adjusted via a pulldown. Values include
   Frequency, Alphabetic, and Frequency and Rarity. Frequency is the default.

* *targetSpeciesList* - a list of "name", "taxon" pairs indicating the
   organisms to be shown in the phenogrid. "Name" should be the
   traditional latin name, while "taxon" should be the NCBI taxon
   number.  Default value includes Homo sapiens, Mus musculus, Danio
   rerio, and Drosophila melanogaster


* *targetSpeciesName* The initial species name to be displayed, or
   "Overview" if the multi-species overview is desired.   Must be one
   of the species included in the *targetSpeciesList*. Default is "overview".

* *refSpecies* the reference species that provides the comparison
   point for similarity scoring.  Must be one of the species included
   in the *targetSpeciesList*. Defaults to "Homo sapiens".


The Phenogrid is implemented as a jQuery UI Widget. However, due to
the overhead of refresh, we do not automatically update when options
are set. If you wish to set options using the configuration file,
those options will be read and processed upon initialization. For any
other changes, you should be able to use *setOption* or *setOptions*
followed by a manual call to the *reDraw* method.


