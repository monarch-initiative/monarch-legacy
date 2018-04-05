<template>
  <div
    class="assoc-facets-wrapper">
    <div v-for="(value, key) in facetObject">
      <label>
        <input type="checkbox" v-model="facetObject[key]">
        <i>{{ key | keyMap }}</i>
      </label>
    </div>
  </div>
</template>
<script>
  export default {
    model: {
      prop: 'facetObject'
    },
    props: {
      facetObject: {
        type: Object,
      }
    },
    filters: {
      keyMap(key) {
        const keyMappings = {
          human: 'Homo sapiens',
          zebrafish: 'Danio rerio',
          chimpanzee: 'Pan troglodytes',
          mouse: 'Mus musculus',
          opposum: 'Monodelphis domestica',
          horse: 'Equus caballus',
          rat: 'Rattus norvegicus',
          macaque: 'Macaca mulatta',
          chicken: 'Gallus gallus',
          cow: 'Bos taurus',
          anole: 'Anolis carolinensis',
          frog: 'Xenopus (Silurana) tropicalis',
          boar: 'Sus scrofa',
          fly: 'Drosophila melanogaster',
          arabidopsis: 'Arabidopsis thaliana',
          platypus: 'Ornithorhynchus anatinus',
          worm: 'Caenorhabditis elegans',
          yeast: 'Saccharomyces cerevisiae S288C',
        };
        return keyMappings[key];
      },
    },
  };
</script>
<style scoped>
.assoc-facets-wrapper {
  height: 200px;
  overflow-y: scroll;
  padding: 0;
  margin: 0;
}
</style>


