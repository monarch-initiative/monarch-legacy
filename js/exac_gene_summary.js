/**
 * Created by timputman on 11/14/17.
 */
/* global $ */
/* global document */
/* global Vue */
/* global axios */
/* global var_id */

import Vue from 'vue';
import axios from 'axios';

/* eslint indent: 0 */
function createExaxGeneSummaryTable(varID) {
    const vueapp = new Vue({
        delimiters: ['{[{', '}]}'],
        el: '#exacGene',
        data() {
            return {
                exacGene: '',
                showGeneExac: false,
            };
        },
        methods: {
            round(value, decimals) {
                // eslint-disable-next-line
                return Number(Math.round(`${value}e${decimals}`) + `e-${decimals}`);
            },
            hitMyGene(identifier) {
                const baseURL = 'https://mygene.info/v3/query/';
                const numericalIdentifier = identifier.split(':').pop();
                axios.get(baseURL, {
                    params: {
                        q: numericalIdentifier,
                        fields: 'exac',
                    },
                })
                    .then((resp) => {
                        // eslint-disable-next-line
                        console.log(resp.request.responseURL);
                        const hits = resp.data.hits[0];
                        if (hits.exac) {
                            this.showGeneExac = true;
                        }
                        this.exacGene = {
                            exp_syn: hits.exac.all.exp_syn,
                            n_syn: hits.exac.all.n_syn,
                            syn_z: hits.exac.all.n_syn,
                            exp_mis: hits.exac.all.exp_mis,
                            n_mis: hits.exac.all.n_mis,
                            mis_z: hits.exac.all.mis_z,
                            exp_lof: hits.exac.all.exp_lof,
                            n_lof: hits.exac.all.n_lof,
                            p_li: hits.exac.all.p_li,
                            link: resp.request.responseURL,
                        };
                        console.log(this.exacGene);
                    })
                    .catch((err) => {
                        // eslint-disable-next-line
                        console.log(err);
                    });
            },
        },
    });
    vueapp.hitMyGene(varID);
}
exports.createExaxGeneSummaryTable = createExaxGeneSummaryTable;
