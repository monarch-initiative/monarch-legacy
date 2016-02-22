## Project Organization

 * templates/           - we use mustache
 * lib/                 - our javascript API and application doe
     * monarch/         - that's us
         * api.js       - core API. Wraps OQ/NIF-Fed APIs. See naturaldocs.
         * web/         - web application. See README.md in that dir
             * webapp.js
             * widgets.js

## Changing Page Layout

For changes to the basic page layout and content that do not require
changing the logic, find the relevant mustache template in the
templates directory and make the changes there. This requires no
programming. The changes should take effect immediately without you
having to restart the server.

## Data tables

Tables are generated from a Solr index of the Monarch Data SciGraph Instance.
We interact with the Solr index using the GOlr API, for example,
the GOlr [Response](https://berkeleybop.github.io/bbop-js/docs/files/golr/response-js.html) and
[Manager](https://berkeleybop.github.io/bbop-js/docs/files/golr/manager-js.html) classes.

Tables are created using the bbop golr widget, see the
[Live Results Widget](https://berkeleybop.github.io/bbop-js/docs/files/widget/live_results-js.html) for API docs.

### Adding tables to a page

The current approach is to break data into individual tables stored in various tabs.  The long term
goal is to display data in a single large table, see the [issue](https://github.com/monarch-initiative/monarch-app/issues/723)
with adding logical OR filter to GOlr.

Adding a new table requires adding 5 lines to webapp.js and adding 2 lines to the mustache template;
for example, to add disease phenotype associations to a disease page:

        webapp.js

        var phenotype_filter = [
                                {
                                    field: 'object_category',
                                    value: 'phenotype'
                                }
        ];

        # Add the table where the second parameter is where we filter out the disease ID, typically either
        # object_closure or subject_closure, in this case the disease ID is filtered via the subject_closure
        addGolrTable(info, "subject_closure", id, 'phenotypes-table', phenotype_filter, 'generic_association');

        # Server side query to get the result counts
        info.phenotypeNum = engine.fetchAssociationCount(id, 'subject_closure', phenotype_filter);

        # Add the mustache templates to the info object
        info.includes.phenotype_anchor = addPhenotypeAnchor(info);
        info.includes.phenotype_table = addPhenotypeTable();

Then in the mustache template, add the anchor to categories div

        disease.mustache

        <div id="categories">
            {{{includes.phenotype_anchor}}}
        </div>

Then add the table to the complete-info div

        disease.mustache

        <div id="complete-info">
            {{{includes.phenotype_table}}}
        </div>

Note: in some cases a new data association will require making new functions to serialize the table and anchor html templates.
New functions can be made by following this format:

        webapp.js

        function addPhenotypeAnchor(info) {
            var phenotype_anchor = {id: info.id,
                                    resultNum: info.phenotypeNum,
                                    type: "Phenotypes", href: "phenotypes"};
            return Mustache.to_html(getTemplate('anchor'), phenotype_anchor);
        }

        function addPhenotypeTable() {
            var phenotype_table = {href: "phenotypes", div: "phenotypes-table"};
            return Mustache.to_html(getTemplate('golr-table'), phenotype_table);
        }

### Adding a new GOlr view

A GOlr view can be configured via a yaml file; for example, the generic_association view
is defined [here](https://github.com/monarch-initiative/monarch-app/blob/master/conf/golr-views/oban-config.yaml).

New views can be defined using this format.  Change the ID propery and pass this to the
addGolrTable() function in webapp.js function as the 6th parameter.

### Merging two yaml files to create a new GOlr view

There are many cases where we want to use a GOlr view as a base and update the filters,
column names, order, description, etc.  To do this, create a new yaml file with properties
that you would like to override and then merge into a base configuration.

For example, see the [disease-phenotype.yaml](https://github.com/monarch-initiative/monarch-app/blob/master/conf/golr-views/single-tab/disease-phenotype.yaml)
which overrides values in the [oban-config.yaml file](https://github.com/monarch-initiative/monarch-app/blob/master/conf/golr-views/oban-config.yaml)
These are merged by running:

        gulp build
        
Note that gulp merges all tab yaml files with the oban configuration.  If using a different reference schema we will need to update the task appropriately.
