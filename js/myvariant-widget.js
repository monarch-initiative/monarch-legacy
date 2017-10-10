/* global $ */
/* global document */
/* global Vue */
/* global axios */
/* global variantID */

/* eslint indent: 0 */

$(document).ready(function() {
    const vueapp = new Vue({
        delimiters: ['{[{', '}]}'], // ugly, but otherwise it'll clash with puptent template mechanism
        el: '#myvariant-widget',
        data: {
            results: [],
            selenium_id: '',
            searching: true
        },
        methods: {
            fetchResults: function() {
                const anchor = this;
                anchor.searching = true;
                const myVariantInfo = 'http://myvariant.info/v1/query';
                const [prefix, id] = variantID.split(':');
                let params = {};
                switch (prefix) {
                    case ('ClinVarVariant'):
                        params = {
                            q: 'clinvar.allele_id:' + id
                        };
                        break;
                    case ('dbSNP'):
                        params = {
                            q: 'dbsnp.rsid:rs58991260:' + id
                        };
                        break;
                    default:
                        params = {};
                }
                axios.get(
                    myVariantInfo,
                    {
                        params: params
                    })
                    .then(function (response) {
                        anchor.searching = false;
                        const exacFrequency = response.data.hits[0].exac.af;
                        const exacID = 'foo';
                        const exacDB = 'exac';
                        anchor.results.push({
                            id: exacID,
                            db: exacDB,
                            frequency: exacFrequency
                        });
                        anchor.selenium_id = 'loaded';
                    })
                    .catch(function (error) {
                        anchor.searching = false;
                        console.log(error);
                    });
            }
        }
    });
    vueapp.fetchResults();
});
