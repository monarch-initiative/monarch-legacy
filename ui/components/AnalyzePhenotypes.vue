<template>
  <div class="container-fluid">
    <div class="row wizard-style">
      <div class="col-2"></div>
      <div class="col-8 card card-body">
        <form-wizard title="Analyze Phenotypes"
                     subtitle="A tool for ontological comparison of phenotype sets"
                     color="#404040"
                     @on-complete="onComplete">
          <tab-content title="Step 1: Create A Profile of Phenotypes"
                       icon="ti-user">
            <div class="card card-body">
              <!--<monarch-autocomplete-->
                <!--semanticType="Phenotype"-->
                <!--v-on:value="handlePhenotype"-->
                <!--:homeSearch='false'-->
              <!--&gt;</monarch-autocomplete>-->
            </div>
          </tab-content>
          <tab-content title="Additional Info"
                       icon="ti-settings">
            Step 2: Select Comparables
          </tab-content>
          <tab-content title="Last step"
                       icon="ti-check">
            Yuhuuu! This seems pretty damn simple
          </tab-content>
        </form-wizard>
        <div class="flex-container">
          <div class="m-1" v-for="(phenotype, index) in phenotypes"
               :key="phenotype.id" style="">
            <div class="btn-group" role="group">
              <button class="btn btn-sm btn-info"
                      v-b-tooltip title="Click to find optimal term"
                      v-b-modal="'navModal' + index">{{...phenotype.label}}
              </button>
              <button type="button" class="btn btn-sm btn-info"
                      @click="popPhenotype(index)">
                <strong>x</strong>
              </button>
            </div>
            <b-modal size="lg" :id="'navModal' + index">
              <div>
                <div>
                  <local-nav :anchorTerm="phenotype.id"></local-nav>
                </div>
              </div>
            </b-modal>
          </div>
        </div>
      </div>
      <div class="col-2"></div>
    </div>

  </div>
</template>
<script>
export default {
  name: 'AnalyzePhenotypes',
  data() {
    return {
      messages: [],
      phenotypes: [],
    };
  },
  methods: {
    popPhenotype(ind) {
      this.phenotypes.splice(ind, 1);
    },
    handlePhenotype(payload) {
      this.phenotypes.push(payload.value);
    },
    onComplete() {
      alert('Yay. Done!');
    },
  },
};
</script>

<style scoped>
  .wizard-style {
    margin-top: 100px;
  }
  .flex-container{
    flex-wrap: wrap;
    display: flex;
    flex-direction: row;
  }
</style>
