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
