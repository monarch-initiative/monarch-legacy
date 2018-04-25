/**
 * Created by timputman on 10/13/17.
 */
/* global $ */
/* global document */
/* global Vue */
/* global axios */
/* global nodeID */

import Vue from 'vue';
import axios from 'axios';

/* eslint indent: 0 */
function createExacTable(nodeID) {
  const vueapp = new Vue({
    delimiters: ['{[{', '}]}'],
    el: '#vue-exac',
    data() {
      return {
        rowData: '',
        exacID: '',
        showTable: false,
        curieMap: {
          ClinVarVariant: 'clinvar.variant_id',
          dbSNP: 'dbsnp.rsid',
        },
      };
    },
    mounted() {
      if (this.nodePrefix.prefix in this.curieMap) {
        this.hitMyVariant();
      }
    },
    computed: {
      nodePrefix() {
        const splitID = nodeID.split(':');
        return {
          prefix: splitID[0],
          identifier: splitID[1],
        };
      },
    },
    methods: {
      buildRowData(prefixes, alleleCounts, alleleNumbers, homozygotes) {
        const rowData = {};
        let aCTotal = 0;
        let aNTotal = 0;
        let homTotal = 0;
        let aFTotal = 0;

        prefixes.forEach(prefix => {
          const aC = alleleCounts[`ac_${prefix}`];
          const aN = alleleNumbers[`an_${prefix}`];
          const hom = homozygotes[`hom_${prefix}`];
          const aF = this.singleAlleleFrequency(aC, aN);
          aCTotal += aC;
          aNTotal += aN;
          homTotal += hom;
          aFTotal += aF;

          const element = {
            aC: aC,
            aN: aN,
            hom: hom,
            aF: this.singleAlleleFrequency(aC, aN),
          };
          rowData[prefix] = element;
        });
        rowData.tot = {
          aC: aCTotal,
          aN: aNTotal,
          hom: homTotal,
          aF: this.round(aCTotal / aNTotal, 4),
        };
        return rowData;
      },
      singleAlleleFrequency(count, number){
        return this.round(count / number, 7);
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
        const baseURL = 'https://myvariant.info/v1/query';
        axios.get(baseURL, {
          params: {
            q: `${this.curieMap[this.nodePrefix.prefix]}:${this.nodePrefix.identifier}`,
            fields: 'exac',
          }
        })
          .then(resp => {
            if (resp.data.total === 1) {
              const exacData = resp.data.hits[0].exac;
              if (exacData) {
                const alleleCounts = exacData.ac;
                const alleleNumbers = exacData.an;
                const homozygotes = exacData.hom;
                const exacURL = 'https://exac.broadinstitute.org/variant/';
                const exacIDParams = [
                  exacData.chrom,
                  exacData.pos,
                  exacData.ref,
                  exacData.alt,
                ].join('-');
                this.exacID = `${exacURL}${exacIDParams}`;
                const prefixes = [
                  'sas',
                  'oth',
                  'amr',
                  'nfe',
                  'afr',
                  'eas',
                  'fin'
                ];
                this.rowData = this.buildRowData(
                  prefixes,
                  alleleCounts,
                  alleleNumbers,
                  homozygotes
                );
                this.showTable = true;
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
