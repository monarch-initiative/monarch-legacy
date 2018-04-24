<template>
    <div id="vue-exac" v-if="showTable" class="col-md-8" >
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
                <td>{{ rowData.sa.aC }}</td>
                <td>{{ rowData.sa.aN }}</td>
                <td>{{ rowData.sa.hmzgts }}</td>
                <td>{{ rowData.sa.aF }}</td>
            </tr>
            <tr>
                <th scope="row">Other</th>
                <td>{{ rowData.oth.aC }}</td>
                <td>{{ rowData.oth.aN }}</td>
                <td>{{ rowData.oth.hmzgts }}</td>
                <td>{{ rowData.oth.aF }}</td>
            </tr>
            <tr>
                <th scope="row">Latino</th>
                <td>{{ rowData.amr.aC }}</td>
                <td>{{ rowData.amr.aN }}</td>
                <td>{{ rowData.amr.hmzgts }}</td>
                <td>{{ rowData.amr.aF }}</td>
            </tr>
            <tr>
                <th scope="row">European (Non-Finnish)</th>
                <td>{{ rowData.nfe.aC }}</td>
                <td>{{ rowData.nfe.aN }}</td>
                <td>{{ rowData.nfe.hmzgts }}</td>
                <td>{{ rowData.nfe.aF }}</td>
            </tr>
            <tr>
                <th scope="row">African</th>
                <td>{{ rowData.afr.aC }}</td>
                <td>{{ rowData.afr.aN }}</td>
                <td>{{ rowData.afr.hmzgts }}</td>
                <td>{{ rowData.afr.aF }}</td>
            </tr>
            <tr>
                <th scope="row">East Asian</th>
                <td>{{ rowData.eas.aC }}</td>
                <td>{{ rowData.eas.aN }}</td>
                <td>{{ rowData.eas.hmzgts }}</td>
                <td>{{ rowData.eas.aF }}</td>
            </tr>
            <tr>
                <th scope="row">European (Finnish)</th>
                <td>{{ rowData.fin.aC }}</td>
                <td>{{ rowData.fin.aN }}</td>
                <td>{{ rowData.fin.hmzgts }}</td>
                <td>{{ rowData.fin.aF }}</td>
            </tr>
            <tr style="border-top: solid black 2px;">
                <th scope="row">Total</th>
                <td>
                    {{ rowData.tot.aC }}
                </td>
                <td>
                    {{ rowData.tot.aN }}
                </td>
                <td>
                    {{ rowData.tot.hmzgts }}
                </td>
                <td>
                    {{ rowData.tot.aF }}
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
      singleAlleleFrequency(count, number){
        return this.round(count / number, 7);
      },
      totalAlleleFrequency(counts, numbers){
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
