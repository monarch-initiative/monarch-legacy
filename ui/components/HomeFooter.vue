<template>

<div class="home-footer">
  <div class="row">
    <div class="col-12 col-lg-3">
      <div class="media">
        <img class="img-fluid"
        style="max-height:125px; margin:auto; padding:5px 5px 15px 5px;"
        src="../assets/images/monarch-logo-black-stacked.png" 
        alt="Monarch logo">
      </div>
    </div>
    <div class="col-12 col-md-4 col-lg-3 about-section">
      <h4> Contact Us </h4>
        <ul class="list-inline banner-social-buttons">
          <li>
            <a target="_blank" href="https://twitter.com/MonarchInit"><i class="fa fa-twitter fa-fw"></i> <span class="network-name">Twitter</span></a>
          </li>
          <li>
            <a target="_blank" href="https://github.com/monarch-initiative/monarch-app/"><i class="fa fa-github fa-fw"></i> <span class="network-name">Github</span></a>
          </li>
          <li>
            <a href="mailto:info@monarchinitiative.org"><i class="fa fa-envelope fa-fw"></i> <span class="network-name">Mail</span></a>
          </li>
          <li>
            <a href="mailto:info@monarchinitiative.org"><i class="fa fa-envelope-square fa-fw"></i> <span class="network-name">List</span></a>
          </li>
        </ul>
    </div>
    <div class="col-12 col-md-4 col-lg-3 about-section">
      <h4> About </h4>
      <ul class="list-inline">
        <li>
          <router-link to="/page/about"><i class="fa fa-info fa-fw"></i>  <span class="network-name">About Monarch</span></router-link>
        </li>
        <li>
          <router-link to="/about/sources"><i class="fa fa-database fa-fw">  </i><span class="network-name"> Data Sources</span></router-link>
        </li>
        <li>
          <router-link to="/page/releases"><i class="fa fa-folder-open fa-fw"></i> <span class="network-name">Releases</span></router-link>
        </li>
        <li>
          <router-link to="/page/team"><i class="fa fa-users fa-fw"></i> <span class="network-name">Team</span></router-link>
        </li>
        <li>
          <router-link to="/page/disclaimer"><i class="fa fa-file fa-fw"></i> <span class="network-name">Disclaimer</span></router-link>
        </li>
      </ul>
    </div>
    <div class="col-12 col-md-4 col-lg-3 about-section">
      <h4> Documentation </h4>
        <ul class="list-inline">
          <li>
            <a href="https://archive.monarchinitiative.org/latest/"><i class="fa fa-download fa-fw"></i> <span class="network-name">Data Downloads</span></a>
          </li>
          <li>
            <router-link to="/page/phenogrid"><i class="fa fa-braille fa-fw"></i> <span class="network-name">Phenogrid Widget</span></router-link>
          </li>
          <li>
            <a href="https://github.com/monarch-initiative"><i class="fa fa-github fa-fw"></i> <span class="network-name">Github Organization</span></a>
          </li>
          <li>
            <a href="https://github.com/obophenotype/upheno"><i class="fa fa-github fa-fw"></i> <span class="network-name">Phenotype Ontology</span></a>
          </li>
          <li>
            <router-link to="/page/pubs"><i class="fa fa-file fa-fw"></i> <span class="network-name">Publications</span></router-link>
          </li>
          <li>
            <router-link to="/page/links"><i class="fa fa-link fa-fw"></i> <span class="network-name">Link to us</span></router-link>
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
  padding: 10px 0px;
}

.about-section{
  padding-left: 25px;
}

@media (max-width: 770px) {
  .about-section {
    text-align: center;
  }
}

.about-section > ul > li > a {
  padding: 0;
  margin: 0;
}
</style>
