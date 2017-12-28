<template>
<div>
  <div
    class="card-pf card-pf-view card-pf-view-select card-pf-view-single-select"
    v-bind:class="{ active: isSelected }"
    v-on:click="toggleSelected()">
    <div class="card-pf-body">
      <div class="card-pf-top-element">
          <img class="card-pf-icon-circle" :src="cardIcon"/>
      </div>
      <h2 class="card-pf-title text-center">
        {{cardLabel}}
      </h2>
      <slot>This will only be displayed if no content is inserted</slot>
      <div class="card-pf-items text-center">
        <div class="card-pf-item">
          <span class="pficon pficon-screen"></span>
          <span class="card-pf-item-text">{{cardCount}}</span>
        </div>
      </div>
    </div>
    <div class="card-pf-view-checkbox">
      <input type="checkbox">
    </div>
  </div>
</div>
</template>



<script>


const icons = {
  disease: require('../../image/carousel-diseases.png'),
  gene: require('../../image/carousel-genes.png'),
  phenotype: require('../../image/carousel-phenotypes.png'),
  model: require('../../image/carousel-models.png'),
};


const labels = {
  disease: 'Disease',
  gene: 'Gene',
  phenotype: 'Phenotype',
  model: 'Model'
};

export default {
  name: 'NodeCard',

  props: [
    'cardType',
    'cardCount',
    'parentNode',
    'parentNodeId'
  ],

  created() {
    console.log('created', this.parentNodeId);
  },

  updated() {
    console.log('updated', this.parentNodeId);
  },

  destroyed() {
    console.log('destroyed', this.parentNodeId);
  },

  mounted() {
    console.log('mounted', this.cardType, this.parentNodeId, this.parentNode);
    this.cardIcon = icons[this.cardType];
    this.cardLabel = labels[this.cardType];
  },

  watch: {
    '$route' (to, from) {
      // Only fetchData if the path is different.
      // hash changes are currently handled by monarch-tabs.js
      // within the loaded MonarchLegacy component.

      console.log('$route', to, from, to.path, this.path);
      if (to.path !== this.path) {
        console.log('$route fetchData', to.path, this.path);
        this.fetchData();
      }
    }
  },

  data () {
    return {
      isSelected: false,
      cardIcon: null,
      cardLabel: null
    }
  },


  methods: {
    toggleSelected() {
      this.isSelected = !this.isSelected;
      if (this.isSelected) {
        this.$emit('expandCard', this);
      }
    },
  }

}

</script>

<style lang="scss">
@import "../../css/_prelude-patternfly.scss";

</style>
