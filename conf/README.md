## Alerts

If there are anticipated problems, change alerts.js ot be:

    ["We are currently experiencing difficulties. <b>Results may be unreliable</b>. Please check back later."]

## Server Configuration

One of three configurations are selected at startup time

 * server_config_production.json
 * server_config_dev.json
 * server_config_alpha.json  <-- use for bleeding edge testing

In addition we provide amother json files for booking purposes:

 * server_config_public.json

This is the URLs we encourage external users to use. The contents
should be the same as production, but this is not currently
guaranteed.
