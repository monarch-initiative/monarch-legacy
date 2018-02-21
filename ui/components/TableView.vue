<template>
    <div id="TableView">
        <div
            v-if="dataFetched">
            <vue-good-table
                    @pageChanged="onPageChange"
                    id="table-style"
                    :columns="columns"
                    :rows="rows"
                    :paginate="true"
                    :lineNumbers="true"
                    styleClass="table condensed table-bordered"/>
        </div>
        <div
            v-else-if="dataError">
            <h3>BioLink Error</h3>
            <div class="row">
              <div class="col-xs-12 pre-scrollable">
                <json-tree :data="dataError.response" :level="1"></json-tree>
              </div>
            </div>
        </div>
        <div
            v-else>
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
                dataFetched: false,
                dataError: false,
                rows: null,
                columns: [
                    {
                        label: this.firstCap(this.cardType),
                        field: 'annoType',
                        html: true,
                        width: '40%',
                    },
                    {
                        label: 'Evidence Type',
                        field: 'evidenceType',
                        width: '20%',
                    },
                    {
                        label: 'Reference',
                        field: 'reference',
                        html: true,
                        width: '20%',
                    },
                    {
                        label: 'Source',
                        field: 'source',
                        html: true,
                        width: '20%',
                    },
                ],
            };
        },
//        will need to add watch or updated
        mounted() {
            this.fetchData(1);
        },
        watch: {
            cardType: function () {
                this.dataFetched = false;
                this.dataError = false;
                this.rows = [];
                this.columns[0].label = this.firstCap(this.cardType);
                this.fetchData(1);
            }
        },

        methods: {
            onPageChange: function (evt) {
                // { currentPage: 1, currentPerPage: 10, total: 5 }
                this.fetchData(evt.currentPage * evt.currentPerPage);
                console.log(evt);
            },
            fetchData(start) {
                const _this = this;
                const nodeType = _this.nodeType;
                const entity_curie = _this.identifier;
                const annotationType = _this.cardType;
                const biolinkAnnotationSuffix = this.getBiolinkAnnotation(annotationType);
                const baseURL = `https://api-dev.monarchinitiative.org/api/bioentity/${nodeType}/${entity_curie}/${biolinkAnnotationSuffix}`;
                const params = {
                    fetch_objects: true,
                    rows: 1000,
//                    start: start, vue-good-table does not support providing the total number of hits right now
                };
                axios.get(baseURL, {
                    params: params,
                }).then((resp) => {
                    const preRows = [];
                    const numFound = resp.data.objects.length;
                    _this.dataPacket = resp;
                    // console.log('resp.data', baseURL, resp.data,
                    //     this.identifier, this.cardType, this.nodeType);
                    resp.data.associations.forEach(function (element) {
                        const refs = [];
                        const objectCurie = element.object.id;
                        if (element.publications) {
                            element.publications.forEach(function (data) {
                                refs.push(`<a href='http://www.ncbi.nlm.nih.gov/pubmed/${data.id}'>${data.id}</a></br>`);
                            });
                        }
                        preRows.push({
                            annoType: `<a href='/${annotationType}/${objectCurie}'>${element.object.label}</a>`,
                            evidenceType: 'TODO',
                            reference: refs.join('\n'),
                            source: 'TODO',
                        })
                    });
                    _this.dataFetched = true;
                    _this.rows = preRows;
                })
                .catch((err) => {
                    _this.dataError = err;
                    console.log('BioLink Error', baseURL, err);
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
