<template>
  <div>
    <div v-if="dataFetched">
      <b-table :outlined="true"
               :bordered="true"
               :fields="fields"
               :items="rows"
               class="full-width"
      >
        <template slot="index" slot-scope="row">
          {{ row.index + 1 }}
        </template>
        <template slot="object" slot-scope="row">
          <div class="align-left"><strong>{{ row.item.objectLabel }}</strong></div>
        </template>
        <template slot="evidence" slot-scope="row">
          ({{ row.item.evidence.length}})
        </template>
        <template slot="references" slot-scope="row">
          <div v-if="row.item.references">({{ row.item.references.length }})</div>
          <div v-else>(0)</div>
        </template>
        <template slot="sources" slot-scope="row">
          ({{ row.item.sources.length }})
        </template>
        <template slot="show-details" slot-scope="row">
          <button @click.stop="row.toggleDetails" class="mr-2 btn btn-outline-secondary btn-sm">
            {{ row.detailsShowing ? 'Hide' : 'Show'}} Details
          </button>
        </template>
        <template slot="row-details" slot-scope="row">
          <div class="card card-body">
            <div class="row mb-2">
              <div class="col-4">
                <h4 class="align-left">Evidence</h4>
                <ul class="list-bullets align-left" v-for="evi in row.item.evidence" :key="evi.id">
                  <li class="align-left">
                    <a v-bind:href="evi.id | eviHref">
                      {{ evi.lbl }}
                    </a>
                  </li>
                </ul>
              </div>
              <div class="col-4">
                <h4 class="align-left">References</h4>
                <div v-if="row.item.references">
                  <ul v-for="ref in row.item.references"
                      :key="ref.id">
                    <li class="align-left">
                      <a v-bind:href="ref.id | pubHref">{{ ref.id }}</a></li>
                  </ul>
                </div>
                <div v-else>
                  No References
                </div>
              </div>
              <div class="col-4">
                <h4 class="align-left">Sources</h4>
                <ul class="list-bullets align-left"
                    v-for="source in row.item.sources"
                    :key="source.id">
                  <li class="align-left">
                    <a v-bind:href="source">
                      {{source | sourceHref}}
                    </a>
                  </li>
                </ul>
                <div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </b-table>
      <template>
        <b-pagination
          class="secondary"
          align="center"
          size="md"
          :total-rows="dataPacket.data.associations.length"
          v-model="currentPage"
          :per-page="10">
        </b-pagination>
        <h6 class="main-font">{{ currentPage * 10 }}/{{ dataPacket.data.associations.length }}</h6>
      </template>
    </div>
    <div v-else>
      <h1>Loading ...</h1>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      currentPage: 0,
      dataPacket: '',
      dataFetched: false,
      dataError: false,
      fields: [
        'index',
        { key: 'object', label: this.firstCap(this.cardType) },
        { key: 'evidence', label: 'Evidence' },
        { key: 'references', label: 'References' },
        { key: 'sources', label: 'Sources' },
        { key: 'show-details', label: 'More' },
      ],
      rows: [],
    };
  },
  props: {
    identifier: {
      type: String,
      required: true,
    },
    cardType: {
      type: String,
      required: true,
    },
    nodeType: {
      type: String,
      required: true,
    },
    facets: {
      type: Object,
      default: null,
      required: false,

    },
  },
  methods: {
    fetchData() {
      const biolinkAnnotationSuffix = this.getBiolinkAnnotation(this.cardType);
      const baseURL = `https://api.monarchinitiative.org/api/bioentity/${this.nodeType}/${this.identifier}/${biolinkAnnotationSuffix}`;
      const that = this;
      axios.get(baseURL, {
        params: {
          fetch_objects: true,
          rows: 1000,
        },
      })
        .then((resp) => {
          that.dataPacket = resp;
          that.dataFetched = true;
        })
        .catch((err) => {
          that.dataError = err;
          console.log('BioLink Error', baseURL, err);
        });
    },
    populateRows(page) {
      const that = this;
      that.rows = [];
      this.dataPacket.data.associations.forEach((elem) => {
        that.rows.push({
          references: elem.publications,
          annotationType: that.cardType,
          evidence: this.parseEvidence(elem.evidence_graph.nodes),
          objectCurie: elem.object.id,
          sources: elem.provided_by,
          objectLabel: elem.object.label,
        });
      });
      that.rows = that.rows.slice(page, page + 10);
    },
    getBiolinkAnnotation(val) {
      let result = `${val}s/`;
      if (val === 'anatomy') {
        result = 'expression/anatomy';
      }
      return result;
    },
    parseEvidence(evidenceList) {
      if (evidenceList) {
        return evidenceList.filter(elem => elem.id.includes('ECO'));
      }
      return evidenceList;
    },
    firstCap(val) {
      return val.charAt(0)
        .toUpperCase() + val.slice(1);
    },
  },
  mounted() {
    this.fetchData();
  },
  filters: {
    pubHref(curie) {
      const identifier = curie.split(/[:]+/).pop();
      return `https://www.ncbi.nlm.nih.gov/pubmed/${identifier}`;
    },
    eviHref(curie) {
      const identifier = curie.split(/[:]+/).pop();
      return `http://purl.obolibrary.org/obo/ECO_${identifier}`;
    },
    sourceHref(url) {
      const file = url.split(/[/]+/).pop();
      const name = file.split(/[.]+/)[0];
      return name.toUpperCase();
    },
  },
  watch: {
    currentPage() {
      this.populateRows(this.currentPage);
    },
    cardType() {
      this.dataFetched = false;
      this.dataError = false;
      this.columns[0].label = this.firstCap(this.cardType);
      this.fetchData();
    },
    dataPacket() {
      this.populateRows(this.currentPage);
    },
    facets: {
      handler() {
        this.currentPage = 0;
        this.populateRows(this.currentPage);
      },
      deep: true,
    },
  },
};
</script>
<style>
  a {
    color: #404040;
  }

  .main-font {
    color: #404040;
  }

  .align-left {
    text-align: left;
  }

  .align-right {
    text-align: right;
  }

  .table-border-soft {
    border: solid lightgrey 1px;
    border-radius: 10px;

  }

  .list-bullets {
    list-style: square;
  }

  a.page-link {
    color: #404040;
  }
  .full-width {
    width: 100%;
  }
</style>

