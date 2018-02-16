<template>
    <div id="TableView">
        <div v-if="rows.length > 0">
            <vue-good-table
                    @pageChanged="onPageChange"
                    id="table-style"
                    :columns="columns"
                    :rows="rows"
                    :paginate="true"
                    :lineNumbers="true"
                    styleClass="table condensed table-bordered"/>
        </div>
        <div v-else>Loading...</div>
    </div>
</template>
<script>
    import axios from 'axios';
    export default {
        name: 'TableView',
        props: ['identifier', 'cardType', 'nodeType'],
        data() {
            return {
                rows: [],
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
                this.rows = [];
                this.fetchData(1);
            }
        },

        methods: {
            onPageChange: function (evt) {
                // { currentPage: 1, currentPerPage: 10, total: 5 }
                this.fetchData(evt.currentPage * evt.currentPerPage);
            },
            fetchData(start) {
                const _this = this;
                const nodeType = _this.nodeType;
                const entity_curie = _this.identifier;
                const annotationType = _this.cardType;
                console.log(annotationType);
                const baseURL = `https://api-dev.monarchinitiative.org/api/bioentity/${nodeType}/${entity_curie}/${annotationType}s/`;
                const params = {
                    fetch_objects: true,
                    rows: 1000,
                    start: start,
                };
                axios.get(baseURL, {
                    params: params,
                }).then((resp) => {
                    _this.dataPacket = resp;
                    resp.data.associations.forEach(function (element) {
                        const refs = [];
                        const objectCurie = element.object.id;
                        if (element.publications) {
                            element.publications.forEach(function (data) {
                                refs.push(`<a href='http://www.ncbi.nlm.nih.gov/pubmed/${data.id}'>${data.id}</a></br>`);
                            });
                        }
                        _this.rows.push({
                            annoType: `<a href='/${annotationType}/${objectCurie}'>${element.object.label}</a>`,
                            evidenceType: 'TODO',
                            reference: refs.join('\n'),
                            source: 'TODO',
                        })
                    })
                })
                    .catch((err) => {
                        console.log(err);
                    });
            },
            firstCap(val) {
                return val.charAt(0).toUpperCase() + val.slice(1);
            },
        },
    };
</script>
<style scoped>
    [v-cloak] > {
        display: none
    }
</style>
