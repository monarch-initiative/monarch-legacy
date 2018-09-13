<template>
  <div>
  <br><br>
  <h1>Monarch Data Graphs</h1>
  <br>
  <section class="data-dashboard text-center">
    <h2>Monarch Associations</h2>
    <div class="container">
    <div class="row">
      <div class="col-sm">
        <router-link to="/analytics" class="btn btn-link" role="button">
        <img style="max-height:35px;"
          src="../assets/img/icon-diseases.png" 
          alt="disease">
        </router-link>
        <span class="network-name"><br><b>218,313</b><br>Disease-Phenotype Associations</span>
      </div>
      <div class="col-sm">
        <router-link to="/analytics" class="btn btn-link" role="button">
        <img style="max-height:35px;"
          src="../assets/img/icon-genes.png" 
          alt="genes">
          </router-link>
        <span class="network-name"><br><b>793,526</b><br>Gene-Phenotype Associations</span>
      </div>
      <div class="col-sm">
        <router-link to="/analytics" class="btn btn-link" role="button">
        <img style="max-height:35px;"
          src="../assets/img/icon-models.png" 
          alt="models">
          </router-link>
        <span class="network-name"><br><b>20,870</b><br>Model Associations</span>
      </div>
    </div>
    </div>
  </section>
  <section class="analytics">
    <div>
    <h2>Counts of species-specific data integrated into Monarch</h2>
      <img
        class="center-block text-center img-fluid"
        style="max-height:300px;"
        src="../assets/img/tax-heat-plotly.png"/>
    <h4>For the top 15 species in Monarch</h4>
    </div>
  </section>
  <footer-all>
  </footer-all>
  </div>
</template>

<script>
</script>

<style>

.analytics  {
  padding: 50px;
  text-align: center;
  }

.analytics h2 {
  padding-top: 25px;
  text-align: center;
  }

  .analytics h4 {
  padding-bottom: 25px;
  text-align: center;
  }

</style>