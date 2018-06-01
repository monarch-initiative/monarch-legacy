<template>
  <div>
    <div v-if="dataFetched">
      <span>
        <i>
          <small>
            <strong>{{rows.length}}</strong>
            <strong>{{nodeType}}</strong> to
            <strong>{{cardType}}</strong> associations found
          </small>
        </i>
      </span>
      <b-table :items="rows"
               :fields="fields"
               responsive="true"
               class="table-border-soft"
               @row-clicked="rowClickHandler"
               :current-page="currentPage"
               :per-page="rowsPerPage"
      >
        <template slot="index" slot-scope="data">
          {{data.item.recordIndex}}
        </template>
        <template slot="assocObject"
                  slot-scope="data"
        >
          <strong>
            <router-link :to="data.item.objectLink">
              <strong>{{data.item.assocObject}}</strong>
            </router-link>
          </strong>
        </template>
        <template v-if="isGene"
                  slot="taxon"
                  slot-scope="data"
        >
          {{data.item.taxonLabel}}
        </template>
        <template slot="evidence"
                  slot-scope="data"
        >
          ({{data.item.evidenceLength}})
        </template>
        <template slot="references"
                  slot-scope="data"
        >
          ({{data.item.referencesLength}})
        </template>
        <template slot="sources"
                  slot-scope="data"
        >
          ({{data.item.sourcesLength}})
        </template>
        <template slot="show_details"
                  slot-scope="row"
        >
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
                  slot-scope="row"
        >
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
                         v-bind:href="evi.id | eviHref"
                  >
                    {{evi.lbl}}
                  </a>
                  </li>
                </ul>
              </template>
              <template slot="references"
                        slot-scope="data"
              >
                <ul class="list-bullets"
                    v-for="ref in data.item.references">
                  <li>
                    <a target="_blank"
                       v-bind:href="ref | pubHref"
                    >
                      {{ref}}
                    </a>
                  </li>
                </ul>
              </template>
              <template slot="sources"
                        slot-scope="data"
              >
                <ul class="list-bullets"
                    v-for="source in data.item.sources"
                >
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
          <div v-if="rows.length > 10"><b-pagination
                  class="pag-width my-1"
                  align="center"
                  size="md"
                  v-model="currentPage"
                  :per-page="rowsPerPage"
                  :total-rows="rows.length"
          >
          </b-pagination></div>
    </div>
    <div v-else-if="dataError">
      <h3>BioLink Error</h3>
      <div class="row">
        <div class="col-xs-12 pre-scrollable">
          <json-tree :data="dataError.response"
                     :level="1"
          >
          </json-tree>
        </div>
      </div>
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
        rowsPerPage: 10,
        inverted: false,
        rowClicked: false,
        isGene: false,
        currentPage: 1,
        dataPacket: '',
        dataFetched: false,
        dataError: false,
        fields: '',
        rows: [],
        taxonFields: [
          'gene',
          'genotype',
          'model',
          'variant',
          'homolog',
        ],
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
    computed: {
      trueFacets() {
        const truth = [];
        Object.entries(this.facets.species)
          .forEach((elem) => {
            if (elem[1]) {
              truth.push(this.keyMap(elem[0]));
            }
          });
        return truth;
      }
    },
    mounted() {
      this.generateFields();
      this.handleSubjectObjectInversion();
      this.fetchData();
    },
    methods: {
      keyMap(key) {
        const keyMappings = {
          'Skeletal system': 'HP:0000924',
          'Limbs': 'HP:0040064',
          'Nervous system': 'HP:0000707',
          'Head or neck': 'HP:0000152',
          'Metabolism/homeostasis': 'HP:0001939',
          'Cardiovascular system': 'HP:0001626',
          'Integument': 'HP:0001574',
          'Genitourinary system': 'HP:0000119',
          'Eye': 'HP:0000478',
          'Musculature': 'HP:0003011',
          'Neoplasm': 'HP:0002664',
          'Digestive system': 'HP:0025031',
          'Immune System': 'HP:0002715',
          'Blood and blood-forming tissues': 'HP:0001871',
          'Endocrine': 'HP:0000818',
          'Respiratory system': 'HP:0002086',
          'Ear': 'HP:0000598',
          'Connective tissue': 'HP:0003549',
          'Prenatal development or birth': 'HP:0001197',
          'Growth': 'HP:0001507',
          'Constitutional': 'HP:0025142',
          'Thoracic cavity': 'HP:0045027',
          'Breast': 'HP:0000769',
          'Voice': 'HP:0001608',
          'Cellular': 'HP:0025354',
          'Anolis carolinensis': 'NCBITaxon:28377',
          'Arabidopsis thaliana': 'NCBITaxon:3702',
          'Bos taurus': 'NCBITaxon:9913',
          'Caenorhabditis elegans': 'NCBITaxon:6239',
          'Danio rerio': 'NCBITaxon:7955',
          'Drosophila melanogaster': 'NCBITaxon:7227',
          'Equus caballus': 'NCBITaxon:9796',
          'Gallus gallus': 'NCBITaxon:9031',
          'Homo sapiens': 'NCBITaxon:9606',
          'Macaca mulatta': 'NCBITaxon:9544',
          'Monodelphis domestica': 'NCBITaxon:13616',
          'Mus musculus': 'NCBITaxon:10090',
          'Ornithorhynchus anatinus': 'NCBITaxon:9258',
          'Pan troglodytes': 'NCBITaxon:9598',
          'Rattus norvegicus': 'NCBITaxon:10116',
          'Saccharomyces cerevisiae S288C': 'NCBITaxon:559292',
          'Sus scrofa': 'NCBITaxon:9823',
          'Xenopus (Silurana) tropicalis': 'NCBITaxon:8364',
        };
        return keyMappings[key];
      },
      rowClickHandler(record, index, event){
        this.rowClicked = !this.rowClicked;
      },
      facetRows(){
        this.rows = this.rows.filter(elem => this.trueFacets.includes(elem.taxonId));
      },
      handleSubjectObjectInversion() {
        const invertedCalls = [
          {
            'object': 'genotype',
            'subject': 'gene',
          },
          {
            'object': 'literature',
            'subject': 'gene',
          },
          {
            'object': 'model',
            'subject': 'gene',
          },
          {
            'object': 'variant',
            'subject': 'gene',
          },
          {
            'object': 'gene',
            'subject': 'disease',
          },
          {
            'object': 'model',
            'subject': 'disease',
          },
          {
            'object': 'genotype',
            'subject': 'disease',
          },
          {
            'object': 'literature',
            'subject': 'disease',
          },
          {
            'object': 'variant',
            'subject': 'disease',
          },
          {
            'object': 'disease',
            'subject': 'phenotype',
          },
          {
            'object': 'gene',
            'subject': 'phenotype',
          },
          {
            'object': 'genotype',
            'subject': 'phenotype',
          },
          {
            'object': 'literature',
            'subject': 'phenotype',
          },
          {
            'object': 'variant',
            'subject': 'phenotype',
          },
          {
            'object': 'gene',
            'subject': 'goterm',
          },
          {
            'object': 'literature',
            'subject': 'model',
          },
        ];
        this.inverted = false;
        invertedCalls.forEach((elem) => {
          if (this.nodeType === elem.subject && this.cardType === elem.object) {
            this.inverted = true;
          }
        })
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
          that.dataFetched = true;
        }
        catch (e) {
          that.dataError = e;
          console.log('BioLink Error', e);
        }

      },
      populateRows() {
        this.rows = [];
        let count = 0;
        this.dataPacket.data.associations.forEach((elem) => {
          count += 1;
          let pubs = [
            'No References',
          ];
          let pubsLength = 0;
          if (elem.publications) {
            pubs = this.parsePublications(elem.publications);
            pubsLength += pubs.length;
          }
          let evidence = [
            {
              lbl: 'No Evidence',
              id: '',
            }
          ];
          let evidenceLength = 0;
          const eviResults = this.parseEvidence(elem.evidence_graph.nodes);
          if (eviResults.length) {
            evidence = eviResults;
            evidenceLength += eviResults.length;
          }
          let objectElem = elem.object;
          if (this.inverted) {
            objectElem = elem.subject;
          }
          const taxon = this.parseTaxon(objectElem);
          this.rows.push({
            recordIndex: count,
            references: pubs,
            referencesLength: pubsLength,
            annotationType: this.cardType,
            evidence: evidence,
            evidenceLength: evidenceLength,
            objectCurie: objectElem.id,
            sources: elem.provided_by,
            sourcesLength: elem.provided_by.length,
            assocObject: objectElem.label,
            objectLink:`/${this.cardType}/${objectElem.id}`,
            taxonLabel: taxon.label,
            taxonId: taxon.id,
            relationId: elem.relation.id,
            relationLabel: elem.relation.label,
          });
        });
        if (this.taxonFields.includes(this.cardType)) {
          this.facetRows();
        }
      },
      generateFields() {
        this.isGene = false;
        const fields = [
          {
            key: 'recordIndex',
            label: 'Index',
            sortable: true,
          },
          {
            key: 'assocObject',
            label: this.firstCap(this.cardType),
            'class': 'assoc-column-width ',
            sortable: true,
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
        if (this.taxonFields.includes(this.cardType)) {
          this.isGene = true;
          fields.splice(2, 0, {
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
        } else if (val === 'literature') {
          result = val;
        } else if (val === 'function') {
          result = val;
        }
        return result;
      },
      parseEvidence(evidenceList) {
        let result = [];
        if (evidenceList) {
          result = evidenceList.filter(elem => elem.id.includes('ECO'));
        }
        return result;
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
      cardType() {
        this.dataFetched = false;
        this.dataError = false;
        this.generateFields();
        this.handleSubjectObjectInversion();
        this.fetchData();
      },
      dataPacket() {
        this.populateRows();
      },
      facets: {
        handler() {
          this.currentPage = 1;
          this.fetchData();
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
  .table thead th{
    border-top: none;
  }
</style>

