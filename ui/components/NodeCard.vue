<template>

<div class="node-card">

  <div
    class="card"
    v-bind:class="{ active: isSelected }"
    v-on:click="toggleSelected()">
    <h6 class="card-title card-header text-center py-0">
      {{cardLabel}}
      <img class="card-img-top" :src="cardIcon"/>
    </h6>
    <div class="card-header text-center py-0">
    </div>
    <div class="card-body">
      <div class="card-text text-center">
        {{cardCount}}
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

.node-card {
  height: $card-height;
  max-height: $card-height;
  min-width: ($card-height);
  max-width: (2 * $card-height);
}

.node-card .card-img-top {
  width:40px;
  height:40px;
}


</style>
