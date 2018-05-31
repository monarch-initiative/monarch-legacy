<template>
    <div>
       <div v-if="dataFetched">
           <b-table :items="items"
                 :fields="fields"
                 responsive="true"
                 class="table-border-soft"
                 :current-page="currentPage"
                 :per-page="rowsPerPage"
        >
            <template slot="hit"
                      slot-scope="data"
            >
                <strong>{{data.item.hitLabel}}</strong>
            </template>
            <template slot="combined_score"
                      slot-scope="data"
            >
                {{data.item.combinedScore}}
            </template>
            <template slot="most_informative_shared_phenotype"
                      slot-scope="data"
            >
                <router-link :to="data.item.mostInformativeLink">
                    {{data.item.mostInformativeLabel}}
                </router-link>

            </template>
            <template slot="misp_ic"
                      slot-scope="data"
            >
                {{data.item.mostInformativeIc}}
            </template>
            <template slot="other_matching_phenotypes"
                      slot-scope="data"
            >
                <router-link :to="data.item.otherMatchLink">
                    {{data.item.otherMatchLabel}}
                </router-link>
            </template>
            <template slot="omp_ic"
                      slot-scope="data"
            >
                {{data.item.otherMatchIc}}
            </template>
        </b-table>
        <div v-if="items.length > 10">
            <b-pagination
                    class="my-1"
                    align="center"
                    size="md"
                    v-model="currentPage"
                    :per-page="rowsPerPage"
                    :total-rows="items.length"
            >
            </b-pagination>
        </div>
       </div>
        <div v-else>Loading Phenotype Comparison Table ...</div>
    </div>
</template>
<script>
  import * as MA from '../../js/MonarchAccess';

  export default {
    data() {
      return {
        dataFetched: false,
        rowsPerPage: 10,
        currentPage: 1,
        fields: [
          {
            key: 'hit',
            sortable: true,
          },
          {
            key: 'combined_score',
            sortable: true,
          },
          {
            key: 'most_informative_shared_phenotype',
            sortable: true,
          },
          {
            key: 'misp_ic',
            sortable: true,
            label: 'MISP IC',
          },
          {
            key: 'other_matching_phenotypes',
            sortable: true,
          },
          {
            key: 'omp_ic',
            sortable: true,
            label: 'OMP IC',
          },
        ],
        items: [],
        preItems: [],
      };
    },
    props: {
      phenotypes: {
        type: Array,
        required: true,
      },
    },
    mounted(){
      this.comparePhenotypes();
    },
    watch: {
      preItems(){
        this.processItems();
      },
    },
    methods: {
      async comparePhenotypes() {
        const that = this;
        try {
          let searchResponse = await MA.comparePhenotypes(this.phenotypes);
          this.preItems = searchResponse;
          this.dataFetched = true;
        }
        catch (e) {
          that.dataError = e;
          console.log('BioLink Error', e);
        }
      },
      processItems(){
        this.preItems.data.results.forEach((elem) => {
          const rowData = {
            hitLabel: elem.j.label,
            hitId: elem.j.id,
            mostInformativeId: elem.maxIC_class.id,
            mostInformativeIc: this.round(elem.maxIC_class.IC, 2),
            mostInformativeLabel: elem.maxIC_class.label,
            mostInformativeLink: `/phenotype/${elem.maxIC_class.id}`,
            combinedScore: elem.combinedScore,
            otherMatchId: '',
            otherMatchLabel: '',
            otherMatchIc: '',
            otherMatchLink: '',
          };
          elem.matches.forEach((match) => {
            if (match.lcs.id !== rowData.hitId) {
              rowData.otherMatchIc = this.round(match.lcs.IC, 2);
              rowData.otherMatchId = match.lcs.id;
              rowData.otherMatchLabel = match.lcs.label;
              rowData.otherMatchLink = `/phenotype/${match.lcs.id}`;
            }
              });
          this.items.push(rowData);
        });
      },
      round(value, decimals) {
        return value.toFixed(decimals);
      },
    },
  }
</script>
<style>

</style>
