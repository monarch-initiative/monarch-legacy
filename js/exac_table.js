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
        nodeID: varID,
        alleleCounts: '',
        alleleNumbers: '',
        totalFrequencies: '',
        homozygotes: '',
        exacID: '',
        showTable: false,
        curieMap: {
          ClinVarVariant: 'clinvar.variant_id',
          dbSNP: 'dbsnp.rsid',
        },
      };
    },
    mounted() {
      if (Object.keys(this.curieMap).indexOf(this.nodePrefix.prefix) !== -1) {
        this.hitMyVariant();
      }
    },
    computed: {
      nodePrefix() {
        const splitID = this.nodeID.split(':');
        return {
          prefix: splitID[0],
          identifier: splitID[1],
        }
      },
    },
    methods: {
      alleleFrequency(counts, numbers){
        const alleleCounts = counts.ac_sas +
          counts.ac_amr +
          counts.ac_oth +
          counts.ac_nfe +
          counts.ac_afr +
          counts.ac_eas +
          counts.ac_fin;
        const alleleNumbers = numbers.an_sas +
          numbers.an_amr +
          numbers.an_oth +
          numbers.an_nfe +
          numbers.an_afr +
          numbers.an_eas +
          numbers.an_fin;
        return this.round(alleleCounts/alleleNumbers, 7)

      },
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
      hitMyVariant() {
        // Example API Call: http://myvariant.info/v1/query?q=clinvar.allele_id:251469&fields=exac
        const baseURL = 'https://myvariant.info/v1/query';
        axios.get(baseURL, {
          params: {
            q: `${this.curieMap[this.nodePrefix.prefix]}:${this.nodePrefix.identifier}`,
            fields: 'exac',
          }
        })
          .then((resp) => {
            if (resp.data.total === 1) {
              const exacData = resp.data.hits[0].exac;
              if (exacData) {
                this.alleleCounts = exacData.ac;
                this.alleleNumbers = exacData.an;
                this.totalFrequencies = this.alleleFrequency(this.alleleCounts, this.alleleNumbers);
                this.homozygotes = exacData.hom;
                const exacURL = 'https://exac.broadinstitute.org/variant/';
                const exacIDParams = [
                  exacData.chrom,
                  exacData.pos,
                  exacData.ref,
                  exacData.alt,
                ].join('-');
                this.exacID = `${exacURL}${exacIDParams}`;
                this.showTable = true;
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
