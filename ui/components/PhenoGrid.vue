<template>
    <div
      ref="phenogridbox"
      v-if="pgVersion === index"
      v-bind:id="'phenogridbox-'+index"
    >
    </div>

</template>
<script>
  export default {
    data() {
      return {
        pgVersion: null
      };
    },
    props: {
      xAxis: {
        type: Array,
      },
      yAxis: {
        type: Array,
      },
      index: {
        type: Number,
      },
      mode: {
        type: String,
      }

    },
    mounted(){
      this.pgVersion = this.index;
    },
    updated() {
      if (this.pgVersion === this.index) {
        this.launchPhenogrid();
      }
      else {
        this.pgVersion = this.index;
      }
    },
    methods: {
      launchPhenogrid() {
        const pgData = {
          "title": "Phenogrid Results",
          "xAxis": this.xAxis,
          "yAxis": this.yAxis,
        };
        Phenogrid.createPhenogridForElement(this.$refs.phenogridbox, {
          serverURL: 'https://beta.monarchinitiative.org',
          gridSkeletonData: pgData,
          selectedCalculation: 0,
          selectedSort: 'Frequency',
          geneList: this.xAxis,
          owlSimFunction: this.mode,
        });
      },
    },
  };
</script>
