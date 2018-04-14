<template>
    <div id="exacGene" class="col-md-6" v-show="showGeneExac">
        <h4>Exac Population Frequencies</h4>
        <table class="table table-hover">
            <thead>
            <tr>
                <th>Constraint from ExAC</th>
                <th>Expected no. variants</th>
                <th>Observed no. variants</th>
                <th>Constraint Metric</th>
            </tr>
            </thead>
            <tbody>
            <tr>
                <th scope="row">Synonymous</th>
                <td>{{ round(exacGene.exp_syn, 1) }}</td>
                <td>{{ round(exacGene.n_syn, 1) }}</td>
                <td>z = {{ round(exacGene.syn_z, 2) }}</td>
            </tr>
            <tr>
                <th scope="row">Missense</th>
                <td>{{ round(exacGene.exp_mis, 1) }}</td>
                <td>{{ round(exacGene.n_mis, 1) }}</td>
                <td>z = {{ round(exacGene.mis_z, 2) }}</td>
            </tr>
            <tr>
                <th scope="row">LoF</th>
                <td>{{ round(exacGene.exp_lof, 1) }}</td>
                <td>{{ round(exacGene.n_lof, 1)}}</td>
                <td>pLI = {{ round(exacGene.p_li, 2) }}</td>
            </tr>
            </tbody>
        </table>
        <div class="row">
            <div class="col-md-6" id="mgi-link">
                [Retrieved from <a target="_blank" v-bind:href="exacGene.link">MyGene.info</a>]
            </div>
            <div class="col-md-6" id="exac-link"><a target="_blank" href="http://exac.broadinstitute.org/"
                                                    class="glyphicon glyphicon-link"></a>
            </div>
        </div>
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
      if (Object.keys(this.curieMap).indexOf(this.nodePrefix) !== -1 ) {
        this.hitMyGene(this.nodeID);
      }
    },
    computed: {
      nodePrefix() {
        return this.nodeID.split(':')[0];
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
      hitMyGene(identifier) {
        const baseURL = 'https://mygene.info/v3/query/';
        const splitCurie = identifier.split(':');
        const mgCurie = `${this.curieMap[splitCurie[0]]}:${splitCurie[1]}`;
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
  };
</script>
<style>
    #exacGene {
        border-radius: 10px;
        border: solid darkgray 1px;
    }

    #mgi-link {
        text-align: left;
        margin-bottom: 4px;
    }

    #exac-link {
        text-align: right;
        margin-bottom: 4px;
    }

</style>
