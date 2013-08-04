
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

## Adding new datatypes

Let's say we have ingested a new resource and created a new view using
the NIF DISCO system. We wish to expose this in the app, let's say in
the disease page.

### Extend the API

We first add a new low-level API call to api.js. Clone an existing
method (e.g. fetchOmimDiseasePhenotypeAsAssocations), and modify:

 * The ID of the view (e.g. nlx_12345_1)
 * The callback function used to translate the flat tuple into a nested json object

Then add a call to your new method to fetchDiseaseInfo (assuming the
new view provides disease related data), or to any of the other
high-level API calls.

### Create a widget

Open widgets.js and create a new widget for displaying your data. This
is typically a table but could be anything. Clone an existing function.

### Register the widget

In webapp.js, find the relevant path (e.g. /disease/:id) and register.

Let's say you are adding "stuff" to the disease page, and the widget
you created is called genTableOfMyStuff, and your API extension adds
an extra associative array or list to the disease object keyed by
'stuff':

    info.myStuff = function() {return genTableOfMyStuff(info.stuff)} ;

### Modify the template

Assuming you are adding to the disease page, add an html div like the
following:

   <div id="stuff"
    <table>
     {{{myStuff}}}
    </table>
   </div>

### Restart the server

Kill the server and restart:

    ./start-server.sh

That's it!


