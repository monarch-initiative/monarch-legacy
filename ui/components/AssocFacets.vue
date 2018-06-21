<template>
  <div
    class="assoc-facets-wrapper">
    <div
      v-for="(value, key) in facetObject"
      :key="key">
      <label>
        <input
          type="checkbox"
          v-model="facetObject[key]"
        >
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

  /* eslint vue/require-default-prop: 0 */
  props: {
    facetObject: {
      type: Object,
    }
  },
};
</script>
<style lang="scss">
.assoc-facets-wrapper {
  margin: 0;
  padding: 0;
  padding: 0;
  margin: 0;
  background: #444;

  label {
    margin: 0;
    padding-left: 4px;
  }
}
</style>

