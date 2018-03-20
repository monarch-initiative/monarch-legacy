<template>
    <div id="TableView">
        <div v-if="dataFetched">
            <vue-good-table
                    :onClick="expandRow"
                    :columns="columns"
                    :rows="rows"
                    :paginate="true"
                    :lineNumbers="true"
                    styleClass="table table-bordered">
                <template slot="table-row"
                          slot-scope="props"
                >
                    <td>
                        <div v-bind:class="{
                        'td-collapsed': currentRow != props.index,
                        }">
                            <strong>
                                <router-link :to="'/' + cardType + '/' + props.row.objectCurie">
                                    {{props.row.objectLabel}}
                                </router-link>
                            </strong>
                        </div>
                    </td>
                    <td>
                        <div v-bind:class="{'td-collapsed': currentRow != props.index}"
                             v-if="props.row.evidenceType">
                            <span class="evi-length">({{props.row.evidenceType.length}})</span>
                            <ul class="evi-list"
                                v-bind:class="{
                                 'list-display':currentRow != props.index,
                            }">
                                <li v-for="evidence in props.row.evidenceType">
                                    <a v-bind:href="evidence.id | eviHref">
                                        {{ evidence.lbl }}
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div v-else>
                            (0)
                        </div>
                    </td>
                    <td>
                        <div v-bind:class="{'td-collapsed': currentRow != props.index}"
                             v-if="props.row.references">
                            <div>
                                ({{props.row.references.length}})
                                <div class="float-right"
                                     v-for="ref in props.row.references">
                                    <div class="ref-id">
                                        <a v-bind:href="ref.id | pubHref">
                                            {{ref.id }}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-else>
                            (0)
                        </div>
                    </td>
                    <td>
                        <div v-bind:class="{'td-collapsed': currentRow != props.index}"
                             v-if="props.row.source">
                            <div>
                                ({{props.row.source.length}})
                                <div class="source-div"
                                     v-for="source in props.row.source">
                                    <a v-bind:href="source">
                                        {{source | sourceHref}}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="glyphicon"
                             v-bind:class="{
                 'glyphicon-chevron-right': currentRow != props.index &&
                  props.row.evidence && props.row.evidenceType.length > 1 ||
                  props.row.source && props.row.source.length > 1 ||
                  props.row.references && props.row.references.length > 1,
                  'glyphicon-chevron-down': currentRow == props.index,
              }">

                        </div>
                    </td>
                </template>
            </vue-good-table>
        </div>
        <div v-else-if="dataError">
            <h3>BioLink Error</h3>
            <div class="row">
                <div class="col-xs-12 pre-scrollable">
                    <json-tree :data="dataError.response" :level="1"></json-tree>
                </div>
            </div>
        </div>
        <div v-else>
            Loading...
        </div>
    </div>
</template>

<script>
    import axios from 'axios';

    const facetMap = {
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
        'human': 'NCBITaxon:9606',
        'zebrafish': 'NCBITaxon:7955',
        'chimpanzee': 'NCBITaxon:9598',
        'mouse': 'NCBITaxon:10090',
        'opposum': 'NCBITaxon:13616',
        'horse': 'NCBITaxon:9796',
        'rat': 'NCBITaxon:10116',
        'macaque': 'NCBITaxon:9544',
        'chicken': 'NCBITaxon:9031',
        'cow': 'NCBITaxon:9913',
        'anole': 'NCBITaxon:28377',
        'frog': 'NCBITaxon:8364',
        'boar': 'NCBITaxon:9823',
        'fly': 'NCBITaxon:7227',
        'arabidopsis': 'NCBITaxon:3702',
        'platypus': 'NCBITaxon:9258',
        'worm': 'NCBITaxon:6239',
        'yeast': 'NCBITaxon:559292',

    };

    export default {
        name: 'TableView',
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

            }
        },
        data() {
            return {
                currentRow: null,
                rowExpanded: false,
                dataPacket: '',
                dataFetched: false,
                dataError: false,
                rows: [],
                columns: [
                    {
                        label: this.firstCap(this.cardType),
                        field: 'annoType',
                        width: '34%',
                    },
                    {
                        label: 'Evidence Type',
                        field: 'evidenceType',
                        width: '34%',
                    },
                    {
                        label: 'Reference',
                        field: 'reference',
                        width: '20%',
                    },
                    {
                        label: 'Source',
                        field: 'source',
                        width: '12%',
                    },
                ],
            };
        },
        mounted() {
            this.fetchData();
        },
        watch: {
            cardType() {
                this.dataFetched = false;
                this.dataError = false;
                this.columns[0].label = this.firstCap(this.cardType);
                this.fetchData();
            },
            dataPacket() {
                this.populateRows();
            },
            facets: {
                handler() {
                    this.populateRows();
                },
                deep: true,
            },
        },
        filters: {
            pubHref(curie) {
                const identifier = curie.split(/[:]+/)
                    .pop();
                return `https://www.ncbi.nlm.nih.gov/pubmed/${identifier}`;
            },
            eviHref(curie) {
                const identifier = curie.split(/[:]+/)
                    .pop();
                return `http://purl.obolibrary.org/obo/ECO_${identifier}`;
            },
            sourceHref(url) {
                const file = url.split(/[/]+/)
                    .pop();
                const name = file.split(/[.]+/)[0];
                return name.toUpperCase();
            },
        },
        methods: {
            expandReferences(index) {
                this.currentRow = index;
                this.refExpanded = !this.refExpanded;
            },
            fetchData() {
                const biolinkAnnotationSuffix = this.getBiolinkAnnotation(this.cardType);
                const baseURL = `https://api-dev.monarchinitiative.org/api/bioentity/${this.nodeType}/${this.identifier}/${biolinkAnnotationSuffix}`;
                const params = {
                    fetch_objects: true,
                    rows: 1000,
                };
                const _this = this;
                axios.get(baseURL, {
                    params: params,
                })
                    .then((resp) => {
                        _this.dataPacket = resp;
                        _this.dataFetched = true;
                    })
                    .catch((err) => {
                        _this.dataError = err;
                        console.log('BioLink Error', baseURL, err);
                    });
            },
            populateRows() {
                const _this = this;
                _this.rows = [];
                if (this.cardType === 'gene') {
                    this.dataPacket.data.associations.forEach(function (element) {
                        _this.rows.push({
                            references: element.publications,
                            annotationType: _this.cardType,
                            evidenceType: _this.parseEvidence(element.evidence_graph.nodes),
                            objectCurie: element.subject.id,
                            source: element.provided_by,
                            objectLabel: `${element.subject.label} (${element.subject.taxon.label})`,
                            objectTaxon: element.subject.taxon.id,
                        });
                    });
                    this.facetRows(_this.rows);
                }
                else {
                    this.dataPacket.data.associations.forEach(function (element) {
                        _this.rows.push({
                            references: element.publications,
                            annotationType: _this.cardType,
                            evidenceType: _this.parseEvidence(element.evidence_graph.nodes),
                            objectCurie: element.object.id,
                            source: element.provided_by,
                            objectLabel: element.object.label,
                        });
                    });
                }

            },
            firstCap(val) {
                return val.charAt(0)
                    .toUpperCase() + val.slice(1);
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
                    let evidence = evidenceList.filter(elem => elem.id.includes('ECO'));
                    return evidence;
                }
                else {
                    return null;
                }

            },
            expandRow(row, index) {
                this.rowExpanded = !this.rowExpanded;
                if (this.currentRow || this.currentRow === 0) {
                    console.log(index);
                    this.currentRow = null;
                }
                else {
                    this.currentRow = index;
                }
            },
            facetRows(rowData) {
                this.rows = [];
                const _this = this;
                if (this.cardType === 'gene') {
                    Object.entries(this.facets.species)
                        .forEach(
                            ([key, value]) => {
                                if (value) {
                                    rowData.forEach(function (data) {
                                        if (data.objectTaxon === facetMap[key]) {
                                            _this.rows.push(data);
                                        }
                                    });
                                }
                            }
                        );
                }
            },
        },
    };
</script>
<style scoped>
    a {
        color: #404040;
    }

    .td-collapsed {
        height: 20px;
        overflow: hidden;
    }

    .evi-length {
        width: 5%;
    }

    .evi-list {
        text-align: left;
        width: 90%;
        float: right;
        list-style-type: square;
    }

    .list-display {
        list-style-type: none;
    }

    .float-right {
        float: right;
    }

    .ref-id {
        width: 120px;
        text-align: left;
    }

    .source-div {
        float: right;
        margin-right: 5px;
    }
</style>
