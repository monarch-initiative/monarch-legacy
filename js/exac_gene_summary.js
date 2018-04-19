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
      if (Object.keys(this.curieMap).indexOf(this.nodePrefix[0]) !== -1) {
        this.hitMyGene();
      }
    },
    computed: {
      nodePrefix() {
        return varID.split(':');
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
        const mgCurie = `${this.curieMap[this.nodePrefix[0]]}:${this.nodePrefix[1]}`;
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
