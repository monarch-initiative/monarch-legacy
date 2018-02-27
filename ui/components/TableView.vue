<template>
    <div id="TableView">
        <div v-if="dataFetched">
            <vue-good-table
                    :onClick="expandRow"
                    :columns="columns"
                    :rows="rows"
                    :paginate="true"
                    :lineNumbers="true"
                    styleClass="table condensed table-bordered">
                <template slot="table-row"
                          slot-scope="props"
                >
                    <td>
                        <div v-bind:class="{
                        'td-collapsed': currentRow != props.index,
                        }">
                            <router-link :to="'/' + props.row.objectCurie">
                                {{props.row.objectLabel}}
                            </router-link>
                        </div>
                    </td>
                    <td>
                        <div v-bind:class="{'td-collapsed': currentRow != props.index}"
                             v-if="props.row.evidenceType">
                            <span class="evi-length">({{props.row.evidenceType.length}})</span>
                            <ul class="evi-list">
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

    export default {
        name: 'TableView',
        props: ['identifier', 'cardType', 'nodeType'],
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
                }).then((resp) => {
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
                this.dataPacket.data.associations.forEach(function (element) {
                    _this.rows.push({
                        references: element.publications,
                        annotationType: _this.cardType,
                        evidenceType: _this.parseEvidence(element.evidence_graph.nodes),
                        objectCurie: element.object.id,
                        source: element.provided_by,
                        objectLabel: element.object.label,
                    })
                });
            },
            firstCap(val) {
                return val.charAt(0).toUpperCase() + val.slice(1);
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
                } else {
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
        },
    };
</script>
<style scoped>
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
