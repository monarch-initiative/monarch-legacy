/**
 * Created by timputman on 10/13/17.
 */
/* global $ */
/* global document */
/* global Vue */
/* global axios */
/* global var_id */

/* eslint indent: 0 */
function createExacTable(var_id) {
    const vueapp = new Vue({
        delimiters: ['{[{', '}]}'],
        el: '#vue-exac',
        data: {
            allele_counts: '',
            allele_numbers: '',
            homozygotes: '',
            exacID: '',
            proceed: '',
        },
        methods: {
            round(value, decimals) {
                // eslint-disable-next-line
                return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
            },
            hitMyVarient(id) {
                if (id.includes('ClinVarVariant' )) {
                    this.proceed = true;
                    const baseURL = 'https://myvariant.info/v1/query?q=';
                    const endpoint = 'clinvar.allele_id:';
                    const finalID = id.replace('ClinVarVariant:', '');
                    const url = baseURL + endpoint + finalID;
                    axios.get(url)
                        .then((resp) => {
                            if ('exac' in resp.data.hits[0]) {
                                const exacData1 = resp.data.hits[0].exac;
                                this.allele_counts = exacData1.ac;
                                this.allele_numbers = exacData1.an;
                                this.homozygotes = exacData1.hom;
                                const exacURL = 'https://exac.broadinstitute.org/variant/';
                                this.exacID = exacURL + [exacData1.chrom, exacData1.pos, exacData1.ref, exacData1.alt,].join('-');
                            } else{
                                this.proceed = false;
                            }
                        })
                        .catch((err) => {
                            // eslint-disable-next-line
                            console.log(err);
                        });
                }
                else{
                    this.proceed = false;
                }
            },
        },
    });
    vueapp.hitMyVarient(var_id);
};
exports.createExacTable = createExacTable;