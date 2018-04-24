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
        nodeID: nodeID,
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
        const splitID = this.nodeID.split(':');
        return {
          prefix: splitID[0],
          identifier: splitID[1],
        };
      },
    },
    methods: {
      singleAlleleFrequency(count, number) {
        return this.round(count / number, 7);
      },
      totalAlleleFrequency(counts, numbers) {
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
        return this.round(alleleCounts / alleleNumbers, 7)
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
                const alleleCounts = exacData.ac;
                const alleleNumbers = exacData.an;
                const totalFrequencies = this.totalAlleleFrequency(alleleCounts, alleleNumbers);
                const homozygotes = exacData.hom;
                const exacURL = 'https://exac.broadinstitute.org/variant/';
                const exacIDParams = [
                  exacData.chrom,
                  exacData.pos,
                  exacData.ref,
                  exacData.alt,
                ].join('-');
                this.exacID = `${exacURL}${exacIDParams}`;
                this.rowData = {
                  sa: {
                    aC: alleleCounts.ac_sas,
                    aN: alleleNumbers.an_sas,
                    hmzgts: homozygotes.hom_sas,
                    aF: this.singleAlleleFrequency(alleleCounts.ac_sas, alleleNumbers.an_sas),
                  },
                  oth: {
                    aC: alleleCounts.ac_oth,
                    aN: alleleNumbers.an_oth,
                    hmzgts: homozygotes.hom_oth,
                    aF: this.singleAlleleFrequency(alleleCounts.ac_oth, alleleNumbers.an_oth),
                  },
                  amr: {
                    aC: alleleCounts.ac_amr,
                    aN: alleleNumbers.an_amr,
                    hmzgts: homozygotes.hom_amr,
                    aF: this.singleAlleleFrequency(alleleCounts.ac_amr, alleleNumbers.an_amr),
                  },
                  nfe: {
                    aC: alleleCounts.ac_nfe,
                    aN: alleleNumbers.an_nfe,
                    hmzgts: homozygotes.hom_nfe,
                    aF: this.singleAlleleFrequency(alleleCounts.ac_nfe, alleleNumbers.an_nfe),
                  },
                  afr: {
                    aC: alleleCounts.ac_afr,
                    aN: alleleNumbers.an_afr,
                    hmzgts: homozygotes.hom_afr,
                    aF: this.singleAlleleFrequency(alleleCounts.ac_afr, alleleNumbers.an_afr),
                  },
                  eas: {
                    aC: alleleCounts.ac_eas,
                    aN: alleleNumbers.an_eas,
                    hmzgts: homozygotes.hom_eas,
                    aF: this.singleAlleleFrequency(alleleCounts.ac_eas, alleleNumbers.an_eas),
                  },
                  fin: {
                    aC: alleleCounts.ac_fin,
                    aN: alleleNumbers.an_fin,
                    hmzgts: homozygotes.hom_fin,
                    aF: this.singleAlleleFrequency(alleleCounts.ac_fin, alleleNumbers.an_fin),
                  },
                  tot: {
                    aC: alleleCounts.ac_sas +
                    alleleCounts.ac_amr +
                    alleleCounts.ac_oth +
                    alleleCounts.ac_nfe +
                    alleleCounts.ac_afr +
                    alleleCounts.ac_eas +
                    alleleCounts.ac_fin
                    ,
                    aN: alleleNumbers.an_sas +
                    alleleNumbers.an_amr +
                    alleleNumbers.an_oth +
                    alleleNumbers.an_nfe +
                    alleleNumbers.an_afr +
                    alleleNumbers.an_eas +
                    alleleNumbers.an_fin,
                    hmzgts: homozygotes.hom_sas +
                    homozygotes.hom_amr +
                    homozygotes.hom_oth +
                    homozygotes.hom_nfe +
                    homozygotes.hom_afr +
                    homozygotes.hom_eas +
                    homozygotes.hom_fin,
                    aF: totalFrequencies,
                  },
                };
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
