/**
 * Created by timputman on 10/13/17.
 */
/* global $ */
/* global document */
/* global Vue */
/* global axios */
/* global varID */

import Vue from 'vue';
import axios from 'axios';

/* eslint indent: 0 */
function createExacTable(varID) {
  const vueapp = new Vue({
    delimiters: ['{[{', '}]}'],
    el: '#vue-exac',
    data() {
      return {
        allele_counts: '',
        allele_numbers: '',
        homozygotes: '',
        exacID: '',
        show_table: false,
        curieMap: {
          ClinVarVariant: 'clinvar',
          dbSNP: 'dbsnp',
        },
      };
    },
    mounted() {
      if (Object.keys(this.curieMap).indexOf(this.nodePrefix[0]) !== -1) {
        console.log('variant mounts');
        this.hitMyVariant();
      }
    },
    computed: {
      nodePrefix() {
        return varID.split(':');
      },
    },
    methods: {
      round(value, decimals) {
        return Number(Math.round(`${value}e${decimals}`) + `e-${decimals}`);
      },
      hitMyVariant() {
        // Example API Call: http://myvariant.info/v1/query?q=clinvar.allele_id:251469&fields=exac
        const baseURL = 'https://myvariant.info/v1/query';
        axios.get(baseURL, {
          params: {
            q: `${this.curieMap[this.nodePrefix[0]]}:${this.nodePrefix[1]}`,
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
                // console.log('showtable', this, that);
                if (window.vueRouter) {
                  this.$nextTick(function () {
                    window.vueRouter.updatePageLinks();
                  });
                }
              }
            }
          })
          .catch((err) => {
            // eslint-disable-next-line
            console.log(err);
          });
      },
    },
  });
};
exports.createExacTable = createExacTable;
