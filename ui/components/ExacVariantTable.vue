<template>
    <div id="vue-exac" v-show="showTable" class="col-md-8" >
        <h2 class="p-2">Exac Population Frequencies</h2>
        <table class="table table-hover">

            <thead>
            <tr>
                <th>Population</th>
                <th>Allele Count</th>
                <th>Allele Number</th>
                <th>Number of Homozygotes</th>
                <th>Allele Frequency</th>
            </tr>
            </thead>
            <tbody>
            <tr>
                <th scope="row">South Asian</th>
                <td>{{ alleleCounts.ac_sas }}</td>
                <td>{{ alleleNumbers.an_sas }}</td>
                <td>{{ homozygotes.hom_sas }}</td>
                <td>{{ round((alleleCounts.ac_sas / alleleNumbers.an_sas), 7) }}</td>
            </tr>
            <tr>
                <th scope="row">Other</th>
                <td>{{ alleleCounts.ac_oth }}</td>
                <td>{{ alleleNumbers.an_oth }}</td>
                <td>{{ homozygotes.hom_oth }}</td>
                <td>{{ round((alleleCounts.ac_oth / alleleNumbers.an_oth), 7) }}</td>
            </tr>
            <tr>
                <th scope="row">Latino</th>
                <td>{{ alleleCounts.ac_amr }}</td>
                <td>{{ alleleNumbers.an_amr }}</td>
                <td>{{ homozygotes.hom_amr }}</td>
                <td>{{ round((alleleCounts.ac_amr / alleleNumbers.an_amr), 7) }}</td>
            </tr>
            <tr>
                <th scope="row">European (Non-Finnish)</th>
                <td>{{ alleleCounts.ac_nfe }}</td>
                <td>{{ alleleNumbers.an_nfe }}</td>
                <td>{{ homozygotes.hom_nfe }}</td>
                <td>{{ round((alleleCounts.ac_nfe / alleleNumbers.an_nfe), 7) }}</td>
            </tr>
            <tr>
                <th scope="row">African</th>
                <td>{{ alleleCounts.ac_afr }}</td>
                <td>{{ alleleNumbers.an_afr }}</td>
                <td>{{ homozygotes.hom_afr }}</td>
                <td>{{ round((alleleCounts.ac_afr / alleleNumbers.an_afr), 7) }}</td>
            </tr>
            <tr>
                <th scope="row">East Asian</th>
                <td>{{ alleleCounts.ac_eas }}</td>
                <td>{{ alleleNumbers.an_eas }}</td>
                <td>{{ homozygotes.hom_eas }}</td>
                <td>{{ round((alleleCounts.ac_eas / alleleNumbers.an_eas), 7) }}</td>
            </tr>
            <tr>
                <th scope="row">European (Finnish)</th>
                <td>{{ alleleCounts.ac_fin }}</td>
                <td>{{ alleleNumbers.an_fin }}</td>
                <td>{{ homozygotes.hom_fin }}</td>
                <td>{{ round((alleleCounts.ac_fin / alleleNumbers.an_fin), 7) }}</td>
            </tr>
            <tr style="border-top: solid black 2px;">
                <th scope="row">Total</th>
                <td>
                    {{
                    alleleCounts.ac_sas +
                    alleleCounts.ac_amr +
                    alleleCounts.ac_oth +
                    alleleCounts.ac_nfe +
                    alleleCounts.ac_afr +
                    alleleCounts.ac_eas +
                    alleleCounts.ac_fin
                    }}
                </td>
                <td>
                    {{
                    alleleNumbers.an_sas +
                    alleleNumbers.an_amr +
                    alleleNumbers.an_oth +
                    alleleNumbers.an_nfe +
                    alleleNumbers.an_afr +
                    alleleNumbers.an_eas +
                    alleleNumbers.an_fin
                    }}
                </td>
                <td>
                    {{
                    homozygotes.hom_sas +
                    homozygotes.hom_amr +
                    homozygotes.hom_oth +
                    homozygotes.hom_nfe +
                    homozygotes.hom_afr +
                    homozygotes.hom_eas +
                    homozygotes.hom_fin
                    }}
                </td>
                <td>
                    {{this.totalFrequencies}}
                </td>
            </tr>
            </tbody>
        </table>
        <div id="exac-link"><a target="_blank" v-bind:href="exacID" class="glyphicon glyphicon-link"></a></div>
    </div>
</template>
<script>
  import axios from 'axios';
  export default {
    props: {
      nodeID: {
        type: String,
        required: true,
      },
    },
    data() {
      return {
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
  };
</script>
<style>
    #vue-exac {
        border-radius: 10px;
        border: solid darkgray 1px;
    }
    #exac-link {
        text-align: right;
        margin-bottom: 10px;
    }
</style>
