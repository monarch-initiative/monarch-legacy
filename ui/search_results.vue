<template>
  <div>
    <h2>Bio Search</h2>

    <el-row>
      <el-col :span="24">
        <el-input
          autofocus
          @change="doSearch"
          placeholder="Type a Bio Symbol or Name"
          v-model="searchFor">
          <template slot="prepend"><b>Symbol/Name</b></template>
          <template slot="append">{{ searchResultsLength }} found</template>
        </el-input>
      </el-col>
    </el-row>


    <el-row>
      <vue-good-table
        style="width:90%;margin:auto;"
        title="Bio Types"
        :columns="columns"
        :rows="rows"
        :perPage="15"
        styleClass="table-striped table-bordered xcondensed"
        :paginate="true"
        :lineNumbers="false"
        :onClick="toggleWatch">
        <div slot="emptystate" style="width:500px;">
          No Bio Types Selected
        </div>

<!--         <template slot="table-row" scope="props">
          <td v-for="(column, i) in columns"
            v-if="!column.hidden"
            :class="column.getDataStyle(i, 'td')">
            {{ props.row[column.field] }}
          </td>
        </template> -->


      </vue-good-table>
    </el-row>
  </div>
</template>

<script>
  const columnDefs = [
          {
            label: 'ID',
            field: 'id',
            width: '15%',
          },
          {
            label: 'Name',
            field: 'name',
            width: '50%',
          },
          {
            label: 'Description',
            field: 'description',
            type: 'string',
            width: '20%',
          },
          {
            label: 'Link',
            field: 'link',
            type: 'string',
            width: '20%',
          },
          {
            label: 'Watch',
            field: 'watchHTML',
            type: 'boolean',
            width: '5%',
            html: true,
          },
        ];
  export default {
    name: 'Search',

    data() {
      return {
        facets: [],
        user_facets: {},
        results: [],
        highlight: {},
        suggestions: {},
        page: 0,
        numFound: 0,
        numRowsDisplayed: 0,
        searching: true,
        watches: [],
        searchFor: '',
        bioTypes: [],
        columns: [],
        rows: [],
      }
    },

    created() {
    },

    watch: {
    },

    computed: {
      searchResultsLength: function searchResultsLength() {
        return this.rows.length;
      },
    },
    methods: {
      isSymbolWatched(symbol) {
        let result = false;
        if (this.watches) {
          this.watches.forEach(watch => {
            if (watch && watch.symbol.toUpperCase() === symbol.toUpperCase()) {
              result = true;
            }
          });
        }
        return result;
      },
      generateCheckboxOrNot(flag) {
        return flag ?
          '<span style="color:green;margin:0;">&nbsp;&#10004;&nbsp;</span>' :
          '';
      },
      toggleWatch(row) {
        row.watch = !row.watch;
        row.watchHTML = this.generateCheckboxOrNot(row.watch);
        if (this.watches) {
          const symbol = row.symbol;

          if (row.watch) {
            this.watches.push({
              title: row.name,
              symbol: symbol,
              price_usd: row.price_usd,
              completed: false,
            });
          }
          else {
            for (let i = 0; i < this.watches.length; ++i) {
              const watch = this.watches[i];
              if (watch && watch.symbol.toUpperCase() === symbol.toUpperCase()) {
                this.watches.splice(i, 1);
                break;
              }
            }
          }
        }
      },
      doSearch() {
        const anchor = this;
        const monarchURL = 'https://beta.monarchinitiative.org';
        const searchTerm = this.searchFor;
        const query = `${monarchURL}/searchapi/${searchTerm}`;
        const userFacets = {};

        if (searchTerm.length < 3) {
          this.rows = [];
          this.columns = [];
        }
        else {
          console.log('query', query);
          axios.get(
            query,
            {
              params: userFacets
            })
            .then(function (response) {
              console.log('response', response);

              anchor.searching = false;
              anchor.numFound = response.data.response.numFound;
              anchor.numRowsDisplayed = response.data.response.docs.length;
              anchor.results = response.data.response.docs;

              const searchRows = anchor.results.map((result) => {
                return {
                  id: result.id_std,
                  name: result.label_std[0],
                  description: result.definition_std ? result.definition_std[0] : '',
                  link: result.iri_std,
                  watchHTML: '<b>false</b>', // this.generateCheckboxOrNot(watched),
                  watch: false,
                };
              });

              // console.log('anchor.results[0]', anchor.results[0],
              //   JSON.stringify(anchor.results[0], null, 2));

              anchor.columns = columnDefs;
              anchor.rows = searchRows;

            })
            .catch(function (error) {
              // anchor.searching = false;
              console.log(error);
            });

        }
      }
    }
  }
</script>

<style>
.search-input {
  width: 100%;
}
</style>
