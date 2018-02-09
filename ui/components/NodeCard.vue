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
      <h4 class="text-center">
        {{cardLabel}}
      </h4>
      <div class="card-pf-items text-center">
        <div class="card-pf-item">
          <span class="pficon pficon-folder-open"></span>
          <span class="card-pf-item-text">{{cardCount}}</span>
        </div>
      </div>
    </div>
  </div>
</div>
</template>



<script>

export default {
  name: 'NodeCard',

  props: [
    'cardType',
    'cardCount',
    'parentNode',
    'parentNodeId'
  ],

  created() {
  },

  updated() {
  },

  destroyed() {
  },

  mounted() {
    this.cardIcon = this.$parent.icons[this.cardType];
    this.cardLabel = this.$parent.labels[this.cardType];
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

$card-height: 150px;

.card-pf {
  border:2px solid blue;
  height: $card-height;
  max-height: $card-height;
}

.card-pf-view .card-pf-top-element img.card-pf-icon-circle {
  width:40px;
  height:40px;
}

</style>
