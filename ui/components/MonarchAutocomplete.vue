<template>
  <div class="autocomplete autorootdiv" v-bind:class="{'open':open}">
    <div v-if="homeSearch" class="form-group">
      <div class="form-group" label="Button style checkboxes">
        <b-form-checkbox-group buttons
                               button-variant="dark"
                               v-model="selected"
                               name="butons1"
                               size="sm"
                               :options="options">
        </b-form-checkbox-group>
      </div>
    </div>
    <div class="input-group input-group-sm">
      <div v-if="!homeSearch" class="input-group-prepend">
        <button class="btn btn-secondary dropdown-toggle"
                type="button"
                v-on:click="catDropDown = !catDropDown">
                Categories
        </button>
        <div v-if="catDropDown" class="dropdown-menu list-group dropCatList px-4">
          <div>
            <div class="form-group">
                <b-form-checkbox-group plain
                                       stacked
                                       v-model="selected"
                                       :options="options">
                </b-form-checkbox-group>
            </div>
          </div>
        </div>
      </div>
      <input v-bind:class="{'loading': loading}"
             class="form-control form-control-sm"
             type="text"
             v-model="value"
             v-on:input="debounceInput"
             @keydown.enter='enter'
             @keydown.down='down'
             @keydown.up='up'
             placeholder="search...">
    </div>
    <div v-if="open"
         class="dropdown-menu list-group dropList px-4">
        <div v-for="(suggestion, index) in suggestions" :key="index"
            @click="suggestionClick(index)"
            v-bind:class="{'active': isActive(index)}"
            v-on:mouseover="mouseOver(index)"
            class="dropList border-bottom px-1">
          <div class="row p-0">
            <div class="col-5" v-if="suggestion.has_hl">
              <span v-html="suggestion.highlight"></span>
            </div>
            <div class="col-5" v-else>
              <strong>{{suggestion.match}}</strong>
            </div>
            <div class="col-4"><i>{{ suggestion.taxon }}</i></div>
            <div class="col-3 text-align-right">
              <small>{{suggestion.category }}</small>
            </div>
          </div>
        </div>
      <div class="row">
        <div v-if="suggestions.length > 0"
             class="btn btn-outline-success col m-2"
             v-on:click="showMore">
          Show all results for '{{value}}'
        </div>
        <div v-if="suggestions.length === 0" class="btn col m-2">
          No results for '{{value}}'
        </div>
        <div  class="btn btn-outline-warning col m-2"
              @click="clearSearch">Clear Search</div>
      </div>
    </div>
  </div>
</template>

<script type="text/babel">
import axios from 'axios';

const debounce = require('lodash/debounce');

export default {
  name: 'AutoComplete',
  props: {
    homeSearch: {
      type: String,
      required: true,
      default: false,
    },
  },
  data() {
    return {
      selected: [],
      options: [
        { text: 'Gene', value: 'gene' },
        { text: 'Genotype', value: 'genotype' },
        { text: 'Phenotype', value: 'Phenotype' },
        { text: 'Disease', value: 'disease' },
        // { text: 'Variant', value: 'variant' },
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
  methods: {
    debounceInput: debounce(
      // eslint-disable-next-line
      function () {
        this.fetchData();
      }, 500, { leading: false, trailing: true }),
    fetchData() {
      if (this.value) {
        const that = this;
        this.loading = true;
        const blUrl = `https://owlsim.monarchinitiative.org/api/search/entity/autocomplete/${this.value}`;
        const params = new URLSearchParams();
        params.append('rows', 10);
        params.append('start', 0);
        if (this.selected.length > 0) {
          this.selected.forEach(elem => {
            params.append('category', elem);
          });
        } else {
          this.options.forEach((elem, index) => {
            params.append('category', elem.value);
          });
        }
        params.append('prefix', '-OMIA');
        axios.get(blUrl, { params })
          .then((resp) => {
            resp.data.docs.forEach(elem => {
              const resultPacket = {
                match: elem.match,
                category: that.categoryMap(elem.category),
                taxon: that.checkTaxon(elem.taxon_label),
                curie: elem.id,
                highlight: elem.highlight,
                has_hl: elem.has_highlight,
              };
              this.suggestions.push(resultPacket);
            });
            this.open = true;
            this.loading = false;
          })
          .catch((err) => {
            // eslint-disable-next-line
            console.log(err);
          });
      } else {
        this.suggestions = [];
      }
    },
    enter() {
      const currentData = this.suggestions[this.current];
      // this.$emit('value', { value: this.suggestions[this.current] });
      this.$router.push({ path: `/${currentData.category}/${currentData.curie}` });
      this.value = '';
      this.open = false;
      this.suggestions = [];
    },
    // When up pressed while suggestions are open
    up() {
      if (this.current > 0) {
        this.current -= 1;
      }
    },
    // When down pressed while suggestions are open
    down() {
      if (this.current < this.suggestions.length - 1) {
        this.current += 1;
      }
    },
    // For highlighting element
    isActive(index) {
      return index === this.current;
    },
    mouseOver(index) {
      this.current = index;
    },
    // When one of the suggestion is clicked
    suggestionClick(index) {
      const currentData = this.suggestions[index];
      this.$router.push({ path: `/${currentData.category}/${currentData.curie}` });
      // this.$emit('value', { value: this.suggestions[index] });
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
      let cat1 = new Set(catList);
      let cat2 = new Set(['Phenotype', 'gene', 'variant', 'model', 'disease']);
      let intersection = new Set(
        [...cat1].filter(x => cat2.has(x)));
      const intArray = Array.from(intersection);
      return intArray[0]
    },
    checkTaxon(taxon){
      if (typeof taxon === 'string') {
        return taxon;
      }

    },
  },
  watch: {
    // eslint-disable-next-line
    value: function () {
      this.suggestions = [];
      if (!this.value) {
        this.open = false;
      }
    },
    selected: function () {
      this.suggestions = [];
      this.fetchData();
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
  }
  .dropCatList {
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
    min-width: 600px;
  }
</style>
