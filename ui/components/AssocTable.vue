<template>
  <div>
    <div v-if="dataFetched">
      <b-table :items="rows"
               :fields="fields"
               responsive="true"
               class="table-border-soft"
               @row-clicked="rowClickHandler"
      >
        <template slot="index" slot-scope="data">
          {{data.index + 1}}
        </template>
        <template slot="assocObject"
                  slot-scope="data">
          <strong>
            <router-link :to="data.item.objectLink">
              <strong>{{data.item.assocObject}}</strong>
            </router-link>
          </strong>
        </template>
        <template v-if="isGene"
                  slot="taxon"
                  slot-scope="data">
          {{data.item.taxonLabel}}
        </template>
        <template slot="evidence"
                  slot-scope="data">
          ({{data.item.evidenceLength}})
        </template>
        <template slot="references"
                  slot-scope="data">
          ({{data.item.referencesLength}})
        </template>
        <template slot="sources"
                  slot-scope="data">
          ({{data.item.sourcesLength}})
        </template>
        <template slot="show_details"
                  slot-scope="row">
          <div @click="row.toggleDetails">
            <div class="fa"
                 v-bind:class="{
                'fa-angle-down': row.detailsShowing,
                'fa-angle-right': !row.detailsShowing
                }"
            >
            </div>
          </div>
        </template>
        <template slot="row-details"
                  slot-scope="row">
          <div class="card">
            <b-table :fields="fields.slice(-4,-1)"
                     :items="[row.item]"
                      fixed
            >
              <template slot="evidence"
                        slot-scope="data">
                <ul class="list-bullets"
                    v-for="evi in data.item.evidence"
                >
                  <li><a target="_blank"
                         v-bind:href="evi.id | eviHref">
                    {{evi.lbl}}
                  </a>
                  </li>
                </ul>
              </template>
              <template slot="references"
                        slot-scope="data">
                <ul class="list-bullets"
                    v-for="ref in data.item.references">
                  <li><a target="_blank"
                         v-bind:href="ref | pubHref">
                    {{ref}}
                  </a>
                  </li>
                </ul>
              </template>
              <template slot="sources"
                        slot-scope="data">
                <ul class="list-bullets"
                    v-for="source in data.item.sources">
                  <li>
                    <a v-bind:href="source">
                      {{source | sourceHref}}
                    </a>
                  </li>
                </ul>
              </template>
            </b-table>
          </div>
        </template>
      </b-table>
          <b-pagination
                  class="pag-width my-1"
                  align="center"
                  size="md"
                  v-model="currentPage"
                  :per-page="10"
                  :total-rows="totalRows"
          >
          </b-pagination>
    </div>
    <div v-else>
      <h1>Loading ...</h1>
    </div>
  </div>
</template>

<script>
  import * as MA from '../../js/MonarchAccess';

  export default {
    data() {
      return {
        rowClicked: false,
        totalRows: 0,
        isGene: false,
        currentPage: 0,
        dataPacket: '',
        dataFetched: false,
        dataError: false,
        fields: '',
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
      rowClickHandler(record, index, event){
        this.rowClicked = !this.rowClicked;
      },
      async fetchData() {
        const that = this;
        try {
          const biolinkAnnotationSuffix = this.getBiolinkAnnotation(this.cardType);
          const params= {
            fetch_objects: true,
              rows: 1000,
          };
          let searchResponse = await MA.getNodeAssociations(
            this.nodeType,
            this.identifier,
            biolinkAnnotationSuffix,
            params
          );
          that.dataPacket = searchResponse;
          that.totalRows = searchResponse.data.objects.length;
          that.dataFetched = true;
        }
        catch (e) {
          console.log('nodeResponse ERROR', e, this);
        }
      },
      populateRows(page) {
        const that = this;
        that.rows = [];
        this.dataPacket.data.associations.forEach((elem) => {
          let pubs = ['No References'];
          let pubsLength = 0;
          if (elem.publications) {
            pubs = this.parsePublications(elem.publications);
            pubsLength += pubs.length;
          }
          let evidence = [{lbl: 'No Evidence', id: '',}];
          let evidenceLength = 0;
          const eviResults = this.parseEvidence(elem.evidence_graph.nodes);
          if (eviResults.length) {
            evidence = eviResults;
            evidenceLength += eviResults.length;
          }
          const taxon = this.parseTaxon(elem.subject);
          that.rows.push({
            references: pubs,
            referencesLength: pubsLength,
            annotationType: that.cardType,
            evidence: evidence,
            evidenceLength: evidenceLength,
            objectCurie: elem.object.id,
            sources: elem.provided_by,
            sourcesLength: elem.provided_by.length,
            assocObject: elem.object.label,
            objectLink:`/${this.cardType}/${elem.object.id}`,
            taxonLabel: taxon.label,
            taxonId: taxon.id,
            relationId: elem.relation.id,
            relationLabel: elem.relation.label,
          });
        });
        that.rows = that.rows.slice(page, page + 10);
      },
      generateFields() {
        this.isGene = false;
        const fields = [
          'index',
          {
            key: 'assocObject',
            label: this.firstCap(this.cardType),
            'class': 'assoc-column-width ',
          },
          {
            key: 'evidence',
            label: 'Evidence',
          },
          {
            key: 'references',
            label: 'References',
          },
          {
            key: 'sources',
            label: 'Sources',
          },
          {
            key: 'show_details',
            label: '',
          },
        ];
        const taxonFields = ['gene', 'genotype', 'model', 'variant'];
        if (taxonFields.includes(this.cardType)) {
          this.isGene = true;
          fields.splice(1, 0, {
            key: 'taxon',
            label: 'Taxon',
            sortable: true,
          });
        }
        this.fields = fields;
      },
      getBiolinkAnnotation(val) {
        let result = `${val}s/`;
        if (val === 'anatomy') {
          result = 'expression/anatomy';
        }
        return result;
      },
      parseEvidence(evidenceList) {
        return evidenceList.filter(elem => elem.id.includes('ECO'));
      },
      parsePublications(pubsList) {
        const pubs = [];
        pubsList.forEach(elem => pubs.push(elem.id));
        return pubs;
      },
      parseTaxon(elemObj) {
        const taxon = {
          label: '',
          id: '',
        };
        if ('taxon' in elemObj) {
          taxon.label = elemObj.taxon.label;
          taxon.id = elemObj.taxon.id;
        }
        return taxon;
      },
      firstCap(val) {
        return val.charAt(0)
          .toUpperCase() + val.slice(1);
      },
    },
    mounted() {
      this.generateFields();
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
        return url.split(/[/]+/)
          .pop()
          .split(/[.]+/)[0]
          .toUpperCase();
      },
    },
    watch: {
      currentPage() {
        this.populateRows(this.currentPage);
      },
      cardType() {
        this.dataFetched = false;
        this.dataError = false;
        this.generateFields();
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
  .assoc-column-width {
    width: 400px;
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

