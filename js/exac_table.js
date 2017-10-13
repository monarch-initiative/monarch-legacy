/**
 * Created by timputman on 10/13/17.
 */
/* global $ */
/* global document */
/* global Vue */
/* global axios */
/* global var_id */

import Vue from 'vue';
import axios from 'axios';

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
            show_table: false,
        },
        methods: {
            round(value, decimals) {
                return Number(Math.round(`${value}e${decimals}`) + `e-${decimals}`);
            },
            hitMyVariant(id) {
                var anchor = this;
                if (id.includes('ClinVarVariant')) {
                    // Example API Call: http://myvariant.info/v1/query?q=clinvar.allele_id:251469&fields=exac
                    const baseURL = 'https://myvariant.info/v1/query';
                    const endpoint = 'clinvar.allele_id:';
                    const finalID = id.replace('ClinVarVariant:', '');
                    axios.get(baseURL, {
                            params: {
                                q: `${endpoint}${finalID}`,
                                fields: 'exac',
                            }
                        })
                        .then((resp) => {
                            if (resp.data.total === 1) {
                                const exacData = resp.data.hits[0].exac;
                                if (exacData) {
                                    // console.log('exacData', resp.data, resp.data.hits, exacData);
                                    this.allele_counts = exacData.ac;
                                    this.allele_numbers = exacData.an;
                                    this.homozygotes = exacData.hom;
                                    const exacURL = 'https://exac.broadinstitute.org/variant/';
                                    const exacIDParams = [
                                        exacData.chrom,
                                        exacData.pos,
                                        exacData.ref,
                                        exacData.alt,
                                    ].join('-');
                                    this.exacID = `${exacURL}${exacIDParams}`;
                                    this.show_table = true;
                                    // console.log('showtable', this, anchor);
                                    if (window.routerNavigo) {
                                      anchor.$nextTick(function () {
                                        window.routerNavigo.updatePageLinks();
                                      });
                                    }
                                }
                            }
                        })
                        .catch((err) => {
                            // eslint-disable-next-line
                            console.log(err);
                        });
                }
                else {
                    this.show_table = false;
                }
            },
        },
    });
    vueapp.hitMyVariant(var_id);
};
exports.createExacTable = createExacTable;