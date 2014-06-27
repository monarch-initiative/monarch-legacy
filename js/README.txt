Updating jQuery is as simple as downloading the new versions, putting
them in this directory, and the updating JavaScript.pm in the perl
section. However, we'll only do this in special cases since jQuery UI
bundles its own version usually.

jQuery UI is a little trickier. Fortunately, it comes with its own
jQuery version bundled in. Looking in the included CSS, there should
be a URL a little way in to get started with the same settings. Get
that archive and unzip it somewhere. The jQuery and jQuery UI files
can just be moved up and have JavaScript.pm point at them (pretty much
the same as above). There should be an uncompressed jQuery version as
well in the development-bundle section.

For the CSS, create a new directory in
geneontology/AmiGO/trunk/javascript/com/jquery/css for the new version
(e.g. "jqamigo-1.8.23"). Then copy the content of the archive's
css/custom-theme/* to the new directory. Finally, update with the new
information in CSS.pm.

Here is some information about what the other scripts do:

- monarch-common.js

    This script document contains functions relating to general Monarch
    pages.

    - Displays and calculates annotation sufficiency score stars
    - Displays linked terms on annotated text

- tabs.js

    This script document is primarily used for tab behavior on pages
    relating to specific diseases, phenotypes, genes, or genotypes.

    - Displays tooltips
    - Changes tab styling
    - Switches page content depending on tabs
    - Displays/hides authors on literature (publication) tabs

- tables.js

    This script document is solely used for table sorting on all pages
    relating to specific diseases, phenotypes, genes, or genotypes that
    have tables of data with sortable information.

    As a general style note, try not to add more sortable data types
    (unless there is something that needs to be sorted specially and
    does not fall within the categories of string, float, or frequency.

    The sorting type of tables is defined in the tableSortDataType
    function in widgets.js. To make a table sortable, add the column
    name of the table to the appropriate dictionary for sortable type.

    - Defines comparison functions for sortable data types (float,
        string, frequency)
    - Displays/switches arrows on sortable columns of tables
