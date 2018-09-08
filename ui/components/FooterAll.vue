<template>
<div class="footer-all">
  <div class="container"
    <div class="row">
      <div class="col-3">
        <i class="fa fa-creative-commons fa-fw"></i>
        CC-BY 3.0, except where noted.
      </div>
      <div class="col-3">
        <a href="mailto:info@monarchinitiative.org">
        <i class="fa fa-envelope fa-fw"></i> 
        <span class="network-name">Contact Us</span></a>
      </div>
      <div class="col-3">
        <router-link to="/page/about">
        <i class="fa fa-info fa-fw"></i>
        <span class="network-name">About Monarch</span></router-link>
      </div>
      <div class="col-3">
        <a href="https://archive.monarchinitiative.org/latest/">
        <i class="fa fa-download fa-fw"></i> 
        <span class="network-name">Data Downloads</span></a>
      </div>
    </div>
  </div>
</div>
</template>

<script>
</script>

<style lang="scss">
@import "monarchNGPrelude";

.footer-all{
  padding: 15px;
  height: 60px;
  width: 100%;
  position: absolute;
}

@media (max-width:$grid-float-breakpoint) {
  .footer {
    text-align: center;
  }
}

.monarch-logo-all {
  max-height:25px;
  max-width:40px;
  margin:auto;
  padding:5px 5px 5px 5px;
}

</style>