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
        curieMap: {
          'HGNC': 'hgnc',
          'OMIM': 'mim',
          'ENSEMBL': 'ensembl.gene',
          'NCBIGene': 'entrezgene',
        },
      };
    },
    mounted() {
      if (this.nodePrefix.prefix in this.curieMap) {
        this.hitMyGene();
      }
    },
    computed: {
      nodePrefix() {
        const splitID = this.nodeID.split(':');
        return {
          prefix: splitID[0],
          identifier: splitID[1],
        };
      },
    },
    methods: {
      round(value, decimals) {
        let returnValue = '';
        if (value < 1) {
          returnValue = value.toPrecision(2);
        }
        else {
          returnValue = Number(Math.round(`${value}e${decimals}`) + `e-${decimals}`);
        }
        return returnValue;
      },
      hitMyGene() {
        const baseURL = 'https://mygene.info/v3/query/';
        const mgCurie = `${this.curieMap[this.nodePrefix.prefix]}:${this.nodePrefix.identifier}`;
        axios.get(baseURL, {
          params: {
            q: mgCurie,
            fields: 'exac',
          },
        })
          .then((resp) => {
            // eslint-disable-next-line
            const hits = resp.data.hits[0];
            if (hits.exac) {
              this.showGeneExac = true;
            }
            this.exacGene = {
              exp_syn: this.round(hits.exac.all.exp_syn, 1),
              n_syn: this.round(hits.exac.all.n_syn, 1),
              syn_z: this.round(hits.exac.all.n_syn, 1),
              exp_mis: this.round(hits.exac.all.exp_mis, 1),
              n_mis: this.round(hits.exac.all.n_mis, 1),
              mis_z: this.round(hits.exac.all.mis_z, 2),
              exp_lof: this.round(hits.exac.all.exp_lof, 1),
              n_lof: this.round(hits.exac.all.n_lof, 1),
              p_li: this.round(hits.exac.all.p_li, 1),
              link: resp.request.responseURL,
            };
          })
          .catch((err) => {
            // eslint-disable-next-line
            console.log(err);
          });
      },
    },
  });
}
exports.createExaxGeneSummaryTable = createExaxGeneSummaryTable;
