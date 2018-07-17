<template>
  <div class="container-fluid">
    <div class="row wizard-style">
      <div class="col-1"/>
      <div class="col-10 card card-body">
        <form-wizard
          title="Analyze Phenotypes"
          shape="circle"
          subtitle="A tool for ontological comparison of phenotype sets"
          color="darkgrey"
          finish-button-text="Submit and Analyze"
          @on-complete="generatePhenogridData()"
        >
          <tab-content title="Create A Profile of Phenotypes">
            <monarch-autocomplete
              home-search="true"
              single-category="phenotype"
              @interface="handlePhenotypes"
            />
            <b-form-textarea
              id="textarea1"
              v-model="phenoCurieList"
              placeholder="Enter a comma separated list of prefixed phenotype ids e.g. HP:0000322"
              :rows="3"
              :max-rows="6"
              class="my-2"
            />
            <div
              @click="generatePGDataFromPhenotypeList"
              class="btn btn-success btn-sm"
            >
              Submit Phenotype List
            </div>
            <b-alert
              variant="danger"
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
                  <b-form-checkbox-group
                    id="btnradios1"
                    buttons
                    stacked
                    size="sm"
                    v-model="selectedGroups"
                    :options="groupOptions"
                    name="radiosBtnDefault"
                  />
                </b-form-group>
              </div>
              <div class="col-9">
                <monarch-autocomplete
                  home-search="true"
                  single-category="gene"
                  @interface="handleGenes"
                />
                <b-form-textarea
                  id="textarea1"
                  v-model="geneCurieList"
                  placeholder="Enter a comma seperated list of gene ids"
                  :rows="3"
                  :max-rows="6"
                  class="my-3"
                />
                <div class="form-group">
                  <div
                    @click="geneListLookup"
                    class="btn btn-success btn-sm"
                  >
                    Submit Gene List
                  </div>
                  <b-form-radio-group
                    buttons
                    button-variant="primary"
                    size="sm"
                    v-model="geneCurieType"
                    :options="geneCurieTypeOptions"
                  />
                </div>
                <b-alert
                  variant="danger"
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
          <tab-content
            title="Run Analyses"
          />
        </form-wizard>
      </div>
      <div class="col-1"/>
    </div>

    <!--results below here-->
    <div v-if="phenotypes.length">
      <div
        class="row my-2"
      >
        <div class="col-1"/>
        <div class="col-1">

          <svg
            height="100"
            width="100"
          >
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke-width="3"
              fill="darkgrey"
            />
            <text
              x="50%"
              y="50%"
              text-anchor="middle"
              stroke="white"
              stroke-width="3px"
              dy=".3em"
              font-style="italic"
            >
              1
            </text>
          </svg>
        </div>
        <div class="col-9 card">
          <div class="p-3">
            <h4>Phenotype Profile</h4>
            <div class="flex-container">
              <div
                class="m-1"
                v-for="(phenotype, index) in phenotypes"
                :key="phenotype.curie"
              >
                <div
                  class="btn-group"
                  role="group"
                >
                  <button
                    v-b-modal="phenotype.curie"
                    class="btn btn-sm btn-info"
                  >
                    {{ phenotype.match }} ({{ phenotype.curie }})
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm btn-info"
                    @click="popPhenotype(index)"
                  >
                    <strong>x</strong>
                  </button>
                </div>
                <b-modal
                  size="lg"
                  :id="phenotype.curie"
                  title="phenotype.label"
                >
                  <div
                    slot="modal-title"
                    class="w-100"
                  >
                    {{ phenotype.match }} | {{ phenotype.curie }}
                  </div>
                  <div>
                    <local-nav
                      @interface="handleReplacePhenotype"
                      :anchor-id="phenotype.curie"
                    />
                  </div>
                </b-modal>
              </div>
            </div>
          </div>
        </div>
        <div class="col-1"/>
      </div>
    </div>
    <div v-if="showComparableList">
      <div class="row my-2">
        <div class="col-1"/>
        <div class="col-1">
          <svg
            height="100"
            width="100"
          >
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke-width="3"
              fill="darkgrey"
            />
            <text
              x="50%"
              y="50%"
              text-anchor="middle"
              stroke="white"
              stroke-width="3px"
              dy=".3em"
              font-style="italic"
            >
              2
            </text>
          </svg>
        </div>
        <div class="col-9 card">
          <div class="p-3">
            <h4>Comparables</h4>
            <div class="flex-container">
              <div
                class="m-1"
                v-for="(group, index) in selectedGroups"
                :key="group.id"
              >
                <div
                  class="btn-group"
                  role="group"
                >
                  <button class="btn btn-sm btn-success">
                    {{ group.groupName }}
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm btn-success"
                    @click="popGroup(index)"
                  >
                    <strong>x</strong>
                  </button>
                </div>
              </div>
            </div>
            <div class="flex-container">
              <div
                class="m-1"
                v-for="(gene, index) in genes"
                :key="gene.curie"
              >
                <div
                  class="btn-group"
                  role="group">
                  <button class="btn btn-sm btn-warning">
                    {{ gene.match }}
                  </button>
                  <button
                    type="button"
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
        <div class="col-1"/>
      </div>
    </div>
    <div class="row my-3">
      <div class="col-1"/>
      <div
        class="col-10 card"
        v-show="showPhenogrid"
      >
        <pheno-grid
          :x-axis="xAxis"
          :y-axis="yAxis"
          :index="pgIndex"
          :mode="mode"
        />
      </div>
      <div class="col-1"></div>
    </div>
    <div
      class="row my-3"
      v-if="showPhenogrid">
      <div class="col-1"></div>
      <div class="col-10">
        <phenotypes-table
          :genes="genes"
          :phenotypes="phenotypes"
        />
      </div>
      <div class="col-1"></div>
    </div>
  </div>
</template>
<script>
import * as MA from '../../js/MonarchAccess';

const findIndex = require('lodash/findIndex');

export default {
  name: 'AnalyzePhenotypes',
  data() {
    return {
      mode: 'search',
      showPhenogrid: false,
      pgIndex: 0,
      rejectedPhenotypeCuries: [],
      showGeneAlert: false,
      showPhenotypeAlert: false,
      phenoCurieList: 'HP:0000322,HP:0000303,HP:0000316,HP:0000272',
      geneCurieList: '5290, 5728, 324, 7428, 3845',
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
            groupId: '10090',
            groupName: 'Mus musculus'
          }
        },
        // {
        //   text: 'Homo sapiens (diseases)',
        //   value: {
        //     groupId: '9606',
        //     groupName: 'Homo sapiens'
        //   }
        // },
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
            groupId: '7955',
            groupName: 'Danio rerio'
          }
        },
      ]
    };
  },
  computed: {
    showComparableList() {
      let show = false;
      if (this.phenotypes.length) {
        if (this.genes.length || this.selectedGroups.length) {
          show = true
        }
      }
      return show;
    },
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
      const replaceIndex = findIndex(this.phenotypes, { curie: payload.root });
      this.phenotypes.splice(replaceIndex, 1);
      this.phenotypes.push(payload);
    },
    handleGenes(payload) {
      this.genes.push(payload);
    },
    generatePhenogridData() {
      this.showPhenogrid = true;
      if (this.selectedGroups.length) {
        this.xAxis = this.selectedGroups;
      }
      else {
        this.xAxis = this.genes.map(elem => {
          this.mode = 'compare';
          return elem.curie;
        });
      }
      this.yAxis = this.phenotypes.map(elem => {
        return {
          id: elem.curie,
          term: elem.match,
        };
      });
      this.pgIndex += 1;
    },
    geneListLookup() {
      this.genes = [];
      this.geneCurieList.split(',').forEach((elem) => {
        this.fetchLabel(`${this.geneCurieType}:${elem.trim()}`, 'gene');
      });

    },
    generatePGDataFromPhenotypeList() {
      this.rejectedPhenotypeCuries = [];
      const acceptedPrefixes = [
        'HP',
        'MP',
        'ZP',
      ];
      this.phenotypes = [];
      this.phenoCurieList.split(',').forEach(elem => {
        const elemTrimmed = elem.trim();
        const prefix = elemTrimmed.split(':')[0];
        if (acceptedPrefixes.includes(prefix)) {
          this.fetchLabel(elemTrimmed, 'phenotype');
        }
        else {
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
