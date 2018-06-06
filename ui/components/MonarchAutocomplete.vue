<template>
  <div
    class="autocomplete autorootdiv"
    v-bind:class="{
    'home-search':homeSearch,
    'open':open
    }"
  >
    <div
      v-if="homeSearch && !singleCategory"
      class="form-group"
    >
      <div
        class="form-group"
        label="Button style checkboxes">
        <b-form-checkbox-group
          buttons
          button-variant="dark"
          v-model="selected"
          name="butons1"
          size="sm"
          :options="options"
          v-b-tooltip.left
          title="Select a single category or set of categories to search on"
        >
        </b-form-checkbox-group>
      </div>
    </div>
    <div class="input-group input-group-sm">
      <div v-if="!homeSearch && !singleCategory" class="input-group-prepend">
        <button
          class="btn btn-secondary dropdown-toggle"
          type="button"
          v-on:click="catDropDown = !catDropDown"
        >
          Categories
        </button>
        <div
          v-if="catDropDown"
          class="dropdown-menu list-group dropCatList px-4"
        >
          <div>
            <div class="form-group">
              <b-form-checkbox-group
                plain
                stacked
                v-model="selected"
                :options="options">
              </b-form-checkbox-group>
            </div>
          </div>
        </div>
      </div>
      <input
        v-bind:class="{'loading': loading}"
        class="form-control form-control-sm"
        type="text"
        v-model="value"
        v-on:input="debounceInput"
        @keydown.enter="enter"
        @keydown.down="down"
        @keydown.up="up"
        @keydown.esc="clearSearch"
        placeholder="Search..."
      >
    </div>
    <div
      v-if="open"
      class="dropdown-menu list-group dropList px-4"
    >
      <div
        v-for="(suggestion, index) in suggestions"
        :key="index"
        @click="suggestionClick(index)"
        v-bind:class="{'active': isActive(index)}"
        v-on:mouseover="mouseOver(index)"
        class="border-bottom px-1"
      >
        <div class="row p-0">
          <div
            class="col-5"
            v-if="suggestion.has_hl"
          >
            <span v-html="suggestion.highlight"></span>
          </div>
          <div
            class="col-5"
            v-else
          >
            <strong>{{suggestion.match}}</strong>
          </div>
          <div class="col-4"><i>{{suggestion.taxon}}</i></div>
          <div class="col-3 text-align-right">
            <small>{{suggestion.category}}</small>
          </div>
        </div>
      </div>
      <div class="row">
        <div
          v-if="suggestions.length && !singleCategory"
          class="btn btn-outline-success col m-2"
          v-on:click="showMore"
        >
          Show all results for '{{value}}'
        </div>
        <div
          v-if="suggestions.length === 0"
          class="btn col m-2"
        >
          No results for '{{value}}'
        </div>
        <div
          class="btn btn-outline-secondary col m-2"
          @click="clearSearch"
        >
          Clear Search
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as MA from '../../js/MonarchAccess';
const debounce = require('lodash/debounce');

export default {
  name: 'AutoComplete',
  props: {
    homeSearch: {
      type: String,
      required: true,
      default: false,
    },
    singleCategory: {
      type: String,
      required: false,
      default: false,
    },
  },
  data() {
    return {
      selected: [],
      options: [
        { text: 'Gene', value: 'gene' },
        { text: 'Genotype', value: 'genotype' },
        { text: 'Variant', value: 'variant locus' },
        { text: 'Phenotype', value: 'phenotype' },
        { text: 'Disease', value: 'disease' },
      ],
      catDropDown: false,
      value: '',
      suggestions: [],
      open: false,
      current: 0,
      loading: false,
    };
  },
  filters: {
    allLower(word) {
      return word.toLowerCase();
    },
  },
  mounted() {
    if (this.singleCategory) {
      this.selected.push(this.singleCategory);
    }
  },
  methods: {
    debounceInput: debounce(
      function () {
        this.fetchData();
      }, 500, {leading: false, trailing: true}),
    async fetchData() {
      try {
        let searchResponse = await MA.getSearchTermSuggestions(this.value, this.selected);
        searchResponse.docs.forEach(elem => {
          const resultPacket = {
            match: elem.match,
            category: this.categoryMap(elem.category),
            taxon: this.checkTaxon(elem.taxon_label),
            curie: elem.id,
            highlight: elem.highlight,
            has_hl: elem.has_highlight,
          };
          this.suggestions.push(resultPacket);
        });
        this.open = true;
        this.loading = false;
      }
      catch (e) {
        console.log('nodeResponse ERROR', e, this);
      }
    },
    enter() {
      const currentData = this.suggestions[this.current];
      if (!this.singleCategory) {
        this.$router.push({ path: `/${currentData.category}/${currentData.curie}` });
      } else {
        this.$emit('interface', this.suggestions[this.current]);
      }
      this.value = '';
      this.open = false;
      this.suggestions = [];
    },
    up() {
      if (this.current > 0) {
        this.current -= 1;
      }
    },
    down() {
      if (this.current < this.suggestions.length - 1) {
        this.current += 1;
      }
    },
    isActive(index) {
      return index === this.current;
    },
    mouseOver(index) {
      this.current = index;
    },
    suggestionClick(index) {
      const currentData = this.suggestions[index];
      if (!this.singleCategory) {
        this.$router.push({ path: `/${currentData.category}/${currentData.curie}` });
      } else {
        this.$emit('interface', this.suggestions[index]);
      }
      this.value = '';
      this.open = false;
      this.suggestions = [];
    },
    showMore() {
      window.location = `/search/${this.value}`;
    },
    clearSearch() {
      this.suggestions = [];
      this.value = '';
    },
    categoryMap(catList) {
      const validCats = {
        'gene': 'gene',
        'variant locus': 'variant',
        'phenotype': 'phenotype',
        'genotype': 'genotype',
        'disease': 'disease'
      };
      const categoryObj = catList.reduce((map, cat) => {
        cat = validCats[cat];
        if (cat) {
          map[cat] = cat;
        }
        return map;
      }, {});
      return categoryObj.gene ||
        categoryObj.variant ||
        Object.keys(categoryObj).join(',');
    },
    checkTaxon(taxon) {
      if (typeof taxon === 'string') {
        return taxon;
      }
    },
  },
  watch: {
    value: function () {
      this.suggestions = [];
      if (!this.value) {
        this.open = false;
      }
    },
    selected: function () {
      if (!this.singleCategory){
        this.suggestions = [];
        this.fetchData();
      }
    },
  },
};
</script>

<style scoped>
  .text-align-right {
    text-align: right;
  }
  .autocomplete-input {
    position: relative;
    height: 300px;
  }
  .loading {
    background-color: #ffffff;
    background-image: url("../assets/images/infinity.gif");
    background-size: 25px 25px;
    background-position: 99%;
    background-repeat: no-repeat;
  }
  .dropList {
    width:100%;
    border-radius: 2px;
    border: solid black 1px;
  }
  .dropCatList {
    position: absolute;
    z-index: 1001;
    border-radius: 2px;
    padding-left: 2px;
    padding-right: 2px;
  }
  li:hover {
    background-color: cornflowerblue;
    color: white;
  }
  .active {
    background-color: cornflowerblue;
    color: white;
  }
  .autorootdiv {
    position: relative;
  }

  .hilite {
    font-weight: bold;
  }

  .autorootdiv .input-group.input-group-sm {
    width: 400px;
  }

  .autorootdiv.home-search .input-group.input-group-sm {
    width: unset;
  }
</style>
