<template>
<div class="footer-all">
  <div class="container"
    <div class="row justify-content-center">
      <div class="col-3">
        <div class="media">
          <img
            class="img-fluid monarch-logo-all"
            src="../assets/images/monarch-logo-black.png" 
            alt="Monarch logo">
        </div>
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
@import "../../css/_prelude-ng.scss";

.footer-all{
  padding: 15px;
  background: lightgrey;
  height: 60px;
  width: 100%;
  position: absolute;
  bottom:0;
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