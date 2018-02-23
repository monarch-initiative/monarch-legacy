<template>
    <div id="TableView">
        <div v-if="dataFetched">
            <vue-good-table
                    id="table-style"
                    :columns="columns"
                    :rows="rows"
                    :paginate="true"
                    :lineNumbers="true"
                    styleClass="table condensed table-bordered table-striped">
                <template slot="table-row" slot-scope="props">
                    <td>
                        <router-link :to="'/' + props.row.objectCurie">
                            {{props.row.objectLabel}}
                        </router-link>
                    </td>
                    <td>{{ props.row.evidenceType }}</td>
                    <td>
                        <div v-if="props.row.references && props.row.references.length === 1"
                             class="row">
                            <div class="col-md-2">(1)</div>
                            <div class="col-md-8">
                                <a v-bind:href="props.row.references[0].id | pubHref">
                                    {{ props.row.references[0].id }}
                                </a>
                            </div>
                            <div class="col-md-2"></div>
                        </div>
                        <div v-else-if="props.row.references && props.row.references.length > 1"
                             class="row">
                            <div class="col-md-2">({{props.row.references.length}})</div>
                            <div class="col-md-8">
                                <div v-if="refExpanded && currentRow === props.index">
                                    <a v-for="ref in props.row.references"
                                       v-bind:href="ref.id | pubHref">
                                        {{ref.id }}
                                    </a>
                                </div>
                                <div v-else>
                                    <a v-bind:href="props.row.references[0].id | pubHref">
                                        {{ props.row.references[0].id }}
                                    </a>
                                </div>
                            </div>
                            <div class="col-md-2">
                                <div v-on:click="expandReferences(props.index)" class="glyphicon"
                                     v-bind:class="{
                                        'glyphicon-chevron-right': !refExpanded,
                                        'glyphicon-chevron-down': refExpanded && currentRow === props.index,
                                        }"
                                >
                                </div>
                            </div>
                        </div>
                        <div v-else
                             class="row">
                            <div class="col-md-2">(0)</div>
                            <div class="col-md-8"></div>
                            <div class="col-md-2"></div>
                        </div>
                    </td>
                    <td>{{ props.row.source }}</td>
                </template>
            </vue-good-table>
        </div>
        <div v-else-if="dataError">
            <h3>BioLink Error</h3>
            <div class="row">
                <div class="col-md-12 pre-scrollable">
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
    import VueGoodTable from "../../node_modules/vue-good-table/src/components/Table.vue";

    export default {
        components: {VueGoodTable},
        name: 'TableView',
        props: ['identifier', 'cardType', 'nodeType'],
        data() {
            return {
                currentRow: null,
                refExpanded: false,
                dataPacket: '',
                dataFetched: false,
                dataError: false,
                rows: [],
                columns: [
                    {
                        label: this.firstCap(this.cardType),
                        field: 'annoType',
                        width: '40%',
                    },
                    {
                        label: 'Evidence Type',
                        field: 'evidenceType',
                        width: '15%',
                    },
                    {
                        label: 'Reference',
                        field: 'reference',
                        width: '30%',
                    },
                    {
                        label: 'Source',
                        field: 'source',
                        width: '15%',
                    },
                ],
            };
        },
//        will need to add watch or updated
        mounted() {
            this.fetchData();
        },
        watch: {
            cardType () {
                this.dataFetched = false;
                this.dataError = false;
                this.columns[0].label = this.firstCap(this.cardType);
                this.fetchData();
            },
            dataPacket () {
                this.populateRows();
            },
        },
        filters: {
            pubHref: function (curie) {
                const identifier = curie.split(/[:]+/).pop();
                return `https://www.ncbi.nlm.nih.gov/pubmed/${identifier}`;
            },
        },
        methods: {
            expandReferences: function (index) {
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
                    const objectCurie = element.object.id;
                    _this.rows.push({
                        references: element.publications,
                        annotationType: _this.cardType,
                        evidenceType: 'TODO',
                        objectCurie: objectCurie,
                        source: 'TODO',
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
        },
    };
</script>
<style scoped>
</style>
