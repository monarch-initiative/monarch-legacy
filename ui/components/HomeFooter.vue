<template>

<div class="home-footer">
  <div class="row">
    <div class="col-12 col-lg-3">
      <div class="media">
        <img
          class="img-fluid monarch-logo"
          src="../assets/images/monarch-logo-white-stacked.png" 
          alt="Monarch logo">
      </div>
    </div>
    <div class="col-12 col-md-4 col-lg-3 about-section">
      <h4> Contact Us </h4>
        <ul class="list-inline banner-social-buttons">
          <li>
            <a href="mailto:info@monarchinitiative.org"><i class="fa fa-envelope fa-fw"></i> <span class="network-name">Mail</span></a>
          </li>
          <li>
            <a target="_blank" href="https://github.com/monarch-initiative/"><i class="fa fa-github fa-fw"></i> <span class="network-name">Github</span></a>
          </li>
          <li>
            <a target="_blank" href="https://twitter.com/MonarchInit"><i class="fa fa-twitter fa-fw"></i> <span class="network-name">Twitter</span></a>
          </li>
          <!--li>
            <a href="mailto:info@monarchinitiative.org"><i class="fa fa-envelope-square fa-fw"></i> <span class="network-name">List</span></a>
          </li-->
        </ul>
    </div>
    <div class="col-12 col-md-4 col-lg-3 about-section">
      <h4> About </h4>
      <ul class="list-inline">
        <li>
          <router-link to="/page/about"><i class="fa fa-info fa-fw"></i>  <span class="network-name">About Monarch</span></router-link>
        </li>
        <li>
          <router-link to="/page/disclaimer"><i class="fa fa-file fa-fw"></i> <span class="network-name">Disclaimer</span></router-link>
        </li>
      </ul>
    </div>
    <div class="col-12 col-md-4 col-lg-3 about-section">
      <h4> Data </h4>
        <ul class="list-inline">
          <li>
            <a href="https://archive.monarchinitiative.org/latest/"><i class="fa fa-download fa-fw"></i> <span class="network-name">Data Downloads</span></a>
          </li>
          <li>
            <router-link to="/page/releases"><i class="fa fa-folder-open fa-fw"></i> <span class="network-name">Releases</span></router-link>
          </li>
          <li>
            <router-link to="/page/services"><i class="fa fa-database fa-fw"></i> <span class="network-name">APIs</span></router-link>
          </li>
        </ul>
    </div>
  </div>
</div>
</template>

<script>

</script>

<style lang="scss">
@import "../../css/_prelude-ng.scss";
.home-footer {
  margin: 0px 15px;
  padding: 15px 0px;
  xbackground: $monarch-bg-color;
  xcolor: white;
}

.about-section{
  padding-left: 25px;
}

@media (max-width:$grid-float-breakpoint) {
  .about-section {
    text-align: center;
  }
}

.about-section > ul > li > a {
  padding: 0;
  margin: 0;
  color: white;
}

.monarch-logo {
  max-height:100px;
  margin:auto;
  padding:5px 5px 5px 5px;
}


</style>
