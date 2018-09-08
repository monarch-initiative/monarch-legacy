<template>
  <!-- eslint-disable vue/html-indent -->

  <div
    class="node-card card py-0 my-0"
    :class="{ active: isSelected }"
    @click="toggleSelected()">
    <div class="card-title card-header">
      <img
        class="card-img-top"
        :src="cardIcon"/>
      {{ pluralize(cardLabel, cardCount) }}
    </div>

<!--
    <div class="card-body">
      <div class="card-text text-center">
        {{ cardCount }}
      </div>
    </div>
 -->
  </div>

</template>

<script>

export default {
  name: 'NodeCard',

  /* eslint vue/require-default-prop: 0 */
  /* eslint vue/require-prop-types: 0 */
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

  data() {
    return {
      isSelected: false,
      cardIcon: null,
      cardLabel: null
    };
  },


  methods: {
    toggleSelected() {
      this.isSelected = !this.isSelected;
      if (this.isSelected) {
        this.$emit('expand-card', this);
      }
    },

    pluralize(label, count) {
      const s = count === 1 ? '' : 's';
      return `${count} ${label}${s}`;
    }
  }

};

</script>

<style lang="scss">
@import "monarchNGPrelude";

$card-height: 110px;
$card-width: 300px;

.node-card {
  margin: 50px auto;
  padding: 0;
  xmin-height: $card-height;
  xmax-height: $card-height;
  min-width: 90%;
  max-width: 90%;
}

.node-card .card-img-top {
  width:40px;
  height:40px;
  margin-right: 10px;
}

.card-title.card-header {
  font-weight: 600;
}


$sm-width: map-get($grid-breakpoints, "sm");
@media (min-width: $sm-width) {
  .node-card {
    margin: 50px 5%;
    min-width: 40%;
    max-width: 40%;
  }
}

$md-width: map-get($grid-breakpoints, "md");
@media (min-width: $md-width) {
  .node-card {
    margin: 50px auto;
    min-width: $card-width;
    max-width: $card-width;
  }
}

// $xl-width: map-get($grid-breakpoints, "xl");
// @media (min-width: $xl-width) {
//   .node-card {
//     margin: 5px auto;
//     min-width: ($card-width);
//     max-width: ($card-width);
//   }
// }

</style>
