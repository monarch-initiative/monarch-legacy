<template>
  <div
    class="assoc-facets-wrapper">
    <div v-for="(value, key) in facetObject">
      <label>
        <input type="checkbox" v-model="facetObject[key]">
        <i>{{ key }}</i>
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


