<template>
  <div class="container-fluid">
    <div class="row wizard-style">
      <div class="col-1"></div>
      <div class="col-10 card card-body">
        <form-wizard title="Analyze Phenotypes"
                     shape="circle"
                     subtitle="A tool for ontological comparison of phenotype sets"
                     color="darkgrey"
                     finish-button-text="Submit and Analyze"
                     @on-complete="launchPhenogrid()"
        >
          <tab-content title="Create A Profile of Phenotypes">
            <monarch-autocomplete homeSearch="true"
                                  singleCategory="phenotype"
                                  @interface="handlePhenotypes"
            >
            </monarch-autocomplete>
            <b-form-textarea id="textarea1"
                             v-model="phenoCurieList"
                             placeholder="Enter a comma seperated list of phenotype ids"
                             :rows="3"
                             :max-rows="6"
                             class="my-2"
            >
            </b-form-textarea>
            <div @click="generatePGDataFromPhenotypeList"
                 class="btn btn-success btn-sm"
            >
              Submit Phenotype List
            </div>
            <b-alert variant="danger"
                     class="my-2"
                     dismissible
                     :show="showPhenotypeAlert"
                     @dismissed="showPhenotypeAlert=false"
            >
              Error: '{{...rejectedPhenotypeCuries}}' Please enter phenotype curies from HP, MP, or ZP!
            </b-alert>
          </tab-content>
          <tab-content title="Select Comparables">
            <div class="row">
              <div class="col-3">
                <b-form-group>
                  <b-form-checkbox-group id="btnradios1"
                                         buttons
                                         stacked
                                         size="sm"
                                         v-model="selectedGroups"
                                         :options="groupOptions"
                                         name="radiosBtnDefault"
                  >
                  </b-form-checkbox-group>
                </b-form-group>
              </div>
              <div class="col-9">
                <monarch-autocomplete homeSearch="true"
                                      singleCategory="gene"
                                      @interface="handleGenes"
                >
                </monarch-autocomplete>
                <b-form-textarea id="textarea1"
                                 v-model="geneCurieList"
                                 placeholder="Enter a comma seperated list of gene ids"
                                 :rows="3"
                                 :max-rows="6"
                                 class="my-3"
                >
                </b-form-textarea>
                <div class="form-group">
                  <div @click="geneListLookup"
                       class="btn btn-success btn-sm"
                  >
                    Submit Gene List</div>
                  <b-form-radio-group
                          buttons
                          button-variant="primary"
                          size="sm"
                          v-model="geneCurieType"
                          :options="geneCurieTypeOptions"
                  >
                  </b-form-radio-group>
                </div>
                <b-alert variant="danger"
                         class="my-2"
                         dismissible
                         :show="showGeneAlert"
                         @dismissed="showGeneAlert=false"
                >
                  Error: Please enter a valid gene identifier!
                </b-alert>
              </div>
            </div>
          </tab-content>
          <tab-content title="Run Analyses"
          >
          </tab-content>
        </form-wizard>
      </div>
      <div class="col-1"></div>
    </div>
    <div class="row my-2">
      <div class="col-1"></div>
      <div class="col-10">
        <div class="row p-0">
          <div class="col-6 pad-right">
            <div v-if="phenotypes.length"
                 class="card full-height"
            >
              <div class="p-3">
                <h4>Phenotype Profile</h4>
                <div class="flex-container">
                  <div class="m-1"
                       v-for="(phenotype, index) in phenotypes"
                       :key="phenotype.curie"
                  >
                    <div class="btn-group"
                         role="group"
                    >
                      <button v-b-modal="phenotype.curie"
                              class="btn btn-sm btn-info"
                      >
                        {{phenotype.match}} ({{phenotype.curie}})
                      </button>
                      <button type="button"
                              class="btn btn-sm btn-info"
                              @click="popPhenotype(index)">
                        <strong>x</strong>
                      </button>
                    </div>
                    <b-modal size="lg"
                             :id="phenotype.curie"
                             title="phenotype.label"
                    ><div slot="modal-title" class="w-100">
                      {{phenotype.match}} | {{phenotype.curie}}
                    </div>
                      <div>
                        <local-nav @interface="handleReplacePhenotype"
                                   :anchorId="phenotype.curie"
                        >
                        </local-nav>
                      </div>
                    </b-modal>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="pad-left col-6">
            <div v-if="genes.length || selectedGroups.length"
                 class="card full-height"
            >
              <div class="p-3">
                <h4>Comparables</h4>
                <div class="flex-container">
                  <div class="m-1"
                       v-for="(group, index) in selectedGroups"
                       :key="group.id"
                  >
                    <div class="btn-group"
                         role="group"
                    >
                      <button class="btn btn-sm btn-success">
                        {{ group.groupName }}
                      </button>
                      <button type="button"
                              class="btn btn-sm btn-success"
                              @click="popGroup(index)"
                      >
                        <strong>x</strong>
                      </button>
                    </div>
                  </div>
                </div>
                <div class="flex-container">
                  <div class="m-1"
                       v-for="(gene, index) in genes"
                       :key="gene.curie"
                  >
                    <div class="btn-group" role="group">
                      <button class="btn btn-sm btn-warning">
                        {{ gene.match }}
                      </button>
                      <button type="button"
                              class="btn btn-sm btn-warning"
                              @click="popGene(index)"
                      >
                        <strong>x</strong>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-1"></div>
    </div>
    <div class="row my-3" v-show="showPhenogrid">
      <div class="col-1"></div>
      <div class="col-10 card">
        <div id="phenogrid_container"
             class="clearfix"
             ref="phenogrid_container"
        ></div>
      </div>
      <div class="col-1"></div>
    </div>
    <div class="row my-3" v-if="launchPhenotypesTable">
      <div class="col-1"></div>
      <div class="col-10 card">
        <phenotypes-table :phenotypes="phenotypes"
        >
        </phenotypes-table>
      </div>
      <div class="col-1"></div>
    </div>
  </div>
</template>
<script>
import * as MA from '../../js/MonarchAccess';
import * as _ from 'underscore';
export default {
  name: 'AnalyzePhenotypes',
  data() {
    return {
      launchPhenotypesTable: false,
      rejectedPhenotypeCuries: [],
      showGeneAlert: false,
      showPhenotypeAlert: false,
      showPhenogrid: false,
      phenoCurieList: 'HP:0000303,HP:0000272, HP:0000316,HP:0000322,NCBIGene:231221',
      geneCurieList:'',
      messages: [],
      phenotypes: [],
      genes: [],
      selectedGroups: [],
      yAxis: [],
      xAxis: [],
      geneCurieType: 'NCBIGene',
      geneCurieTypeOptions: [
        {
          text: 'NCBI Gene ID',
          value: 'NCBIGene',
        },
        {
          text: 'Ensemble Gene ID',
          value: 'ENSEMBL',
        },
        {
          text: 'HGNC Gene ID',
          value: 'HGNC',
        }
      ],
      groupOptions: [
        {
          text: 'Mus musculus (genes)',
          value: {
            "groupId": "10090",
            "groupName": "Mus musculus"
          }
        },
        {
          text: 'Homo sapiens (diseases)',
          value: {
            "groupId": "9606",
            "groupName": "Homo sapiens"
          }
        },
        {
          text: 'Drosophila melanogaster (genes)',
          value: {
            groupId: '7227',
            groupName: 'Drosophila melanogaster'
          }
        },
        {
          text: 'Caenorhabditis elegans (genes)',
          value: {
            groupId: '6239',
            groupName: 'Caenorhabditis elegans',
          }
        },
        {
          text: 'Danio rerio (genes)',
          value: {
            groupId: "7955",
            groupName: "Danio rerio"
          }
        },
      ]
    };
  },
  mounted(){
  },
  watch: {
  },
  methods: {
    async fetchLabel(curie, curieType) {
      const that = this;
      try {
        let searchResponse = await MA.getNodeLabelByCurie(curie);
        if (curieType === 'phenotype') {
          this.convertPhenotypes(searchResponse);
          if (searchResponse.status === 500) {
            this.showGeneAlert = false;
          }
        }
        if (curieType === 'gene') {
          this.convertGenes(searchResponse);
          if (searchResponse.status === 500) {
            this.showGeneAlert = true;
          }
        }

      }
      catch (e) {
        that.dataError = e;
        console.log('BioLink Error', e);
      }
    },
    popPhenotype(ind) {
      this.phenotypes.splice(ind, 1);
    },
    popGroup(ind) {
      this.selectedGroups.splice(ind, 1);
    },
    popGene(ind) {
      this.genes.splice(ind, 1);
    },
    handlePhenotypes(payload) {
      this.phenotypes.push(payload);
    },
    handleReplacePhenotype(payload){
      const replaceIndex = _.findIndex(this.phenotypes, {curie: payload.root});
      this.phenotypes.splice(replaceIndex, 1);
      this.phenotypes.push(payload);
    },
    handleGenes(payload) {
      this.genes.push(payload);
    },
    generatePhenogridData() {
      this.phenotypes.forEach((elem) => {
        this.yAxis.push({
          id: elem.curie,
          term: elem.match,
        });
      });
      this.xAxis = this.selectedGroups;
    },
    geneListLookup(){
      this.genes = [];
      this.geneCurieList.split(',').forEach((elem) => {
        this.fetchLabel(`${this.geneCurieType}:${elem.trim()}`, 'gene');
      });
    },
    generatePGDataFromPhenotypeList(){
      this.rejectedPhenotypeCuries = [];
      const acceptedPrefixes = [
        'HP',
        'MP',
        'ZP',
      ];
      this.phenotypes = [];
      this.phenoCurieList.split(',').forEach((elem) => {
        let elemTrimmed = elem.trim();
        const prefix = elemTrimmed.split(':')[0];
        if (acceptedPrefixes.includes(prefix)) {
          this.fetchLabel(elemTrimmed, 'phenotype');
        } else {
          this.rejectedPhenotypeCuries.push(elemTrimmed);
          this.showPhenotypeAlert = true;
        }
      });
    },
    convertGenes(elem) {
      const geneData = elem.data;
      this.genes.push({
        curie: geneData.id,
        match: geneData.label,
      });
    },
    convertPhenotypes(elem) {
      const phenoData = elem.data;
      this.phenotypes.push({
        curie: phenoData.id,
        match: phenoData.label,
      });
    },
    launchPhenogrid() {
      this.launchPhenotypesTable = true;
      this.showPhenogrid = true;
      this.yAxis = [];
      this.xAxis = [];
      this.generatePhenogridData();
      const pgData = {
        "title": "Phenogrid Results",
        "xAxis": this.xAxis,
        "yAxis": this.yAxis,
      };
      Phenogrid.createPhenogridForElement(this.$refs.phenogrid_container,{
        serverURL : "https://beta.monarchinitiative.org",
        gridSkeletonData: pgData,
        selectedCalculation: 0,
        selectedSort: "Frequency",
      });
    },

  },
};
</script>

<style scoped>
  .wizard-style {
    margin-top: 100px;
  }
  .flex-container {
    flex-wrap: wrap;
    display: flex;
    flex-direction: row;
  }
  .pad-right {
    padding-right: 4px;
    padding-left: 0;
  }
  .pad-left {
    padding-left: 4px;
    padding-right: 0;
  }
  .full-height {
    height: 100%;
  }
</style>
<!--https://beta.monarchinitiative.org/compare/MP:0000585+MP:0020309+HP:0011892/WormBase:WBGene00000406,WormBase:WBGene00019362,NCBIGene:618631-->
