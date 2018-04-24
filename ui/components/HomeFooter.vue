<template>

<div class="home-footer">
  <div class="row">
    <div class="col-12 col-md-6 col-lg-3">
      <div class="media">
        <img class="left-block text-left img-fluid"
        style="max-height:150px;"
        src="../assets/images/monarch-logo-black-stacked.png" 
        alt="Monarch logo">
      </div>
    </div>
    <div class="col-12 col-md-6 col-lg-3 about-section">
      <h4> Contact Us </h4>
        <ul class="list-inline banner-social-buttons">
          <li>
            <a target="_blank" href="https://twitter.com/MonarchInit" class="btn btn-default btn-lg"><i class="fa fa-twitter fa-fw"></i> <span class="network-name">Twitter</span></a>
          </li>
          <li>
            <a target="_blank" href="https://github.com/monarch-initiative/monarch-app/" class="btn btn-default btn-lg"><i class="fa fa-github fa-fw"></i> <span class="network-name">Github</span></a>
          </li>
          <li>
            <a href="mailto:info@monarchinitiative.org" class="btn btn-default btn-lg"><i class="fa fa-envelope fa-fw"></i> <span class="network-name">Mail</span></a>
          </li>
          <li>
            <a href="mailto:info@monarchinitiative.org" class="btn btn-default btn-lg"><i class="fa fa-envelope-square fa-fw"></i> <span class="network-name">List</span></a>
          </li>
        </ul>
    </div>
    <div class="col-12 col-md-6 col-lg-3 about-section">
      <h4> About </h4>
      <ul class="list-inline">
        <li>
          <router-link to="/page/about" class="btn btn-default btn-lg"><i class="fa fa-info"></i>  <span class="network-name">About Monarch</span></router-link>
        </li>
        <li>
          <router-link to="/about/sources" class="btn btn-default btn-lg"><i class="fa fa-database">  </i><span class="network-name"> Data Sources</span></router-link>
        </li>
        <li>
          <router-link to="/page/releases" class="btn btn-default btn-lg"><i class="fa fa-folder-open"></i> <span class="network-name">Releases</span></router-link>
        </li>
        <li>
          <router-link to="/page/team" class="btn btn-default btn-lg"><i class="fa fa-users"></i> <span class="network-name">Team</span></router-link>
        </li>
        <li>
          <router-link to="/page/disclaimer" class="btn btn-default btn-lg"><i class="fa fa-file"></i> <span class="network-name">Disclaimer</span></router-link>
        </li>
      </ul>
    </div>
    <div class="col-12 col-md-6 col-lg-3 about-section">
      <h4> Documentation </h4>
        <ul class="list-inline">
          <li>
            <a href="https://archive.monarchinitiative.org/latest/" class="btn btn-default btn-lg"><i class="fa fa-download"></i> <span class="network-name">Data Downloads</span></a>
          </li>
          <li>
            <router-link to="/page/phenogrid" class="btn btn-default btn-lg"><i class="fa fa-braille"></i> <span class="network-name">Phenogrid Widget</span></router-link>
          </li>
          <li>
            <a href="https://github.com/monarch-initiative" class="btn btn-default btn-lg"><i class="fa fa-github"></i> <span class="network-name">Github Organization</span></a>
          </li>
          <li>
            <a href="https://github.com/obophenotype/upheno" class="btn btn-default btn-lg"><i class="fa fa-github"></i> <span class="network-name">Phenotype Ontology Project</span></a>
          </li>
          <li>
            <router-link to="/page/pubs" class="btn btn-default btn-lg"><i class="fa fa-file"></i> <span class="network-name">Publications</span></router-link>
          </li>
          <li>
            <router-link to="/page/links" class="btn btn-default btn-lg"><i class="fa fa-link"></i> <span class="network-name">Link to us</span></router-link>
          </li>
          <li>
            <router-link to="/page/services" class="btn btn-default btn-lg"><i class="fa fa-database"></i> <span class="network-name">Monarch Web Services and APIs</span></router-link>
          </li>
        </ul>
    </div>
  </div>
  <div>
    <h4 class="text-center"> The Monarch Initiative is a collaboration between: </h4>
    <div class="container">
      <div class="row">
        <div class="col-6 col-md-3">
          <div class="media">
            <a target="_blank" href="https://www.charite.de/en/" class="btn btn-default "><span class="network-name"></span>
            <img class="mr-3"
            style="max-height:50px;"
            src="../assets/images/team-charite.png" 
            alt="Charite">
            </a>
          </div>
        </div>
        <div class="col-6 col-md-3">  
          <div class="media">
            <a target="_blank" href="https://www.garvan.org.au/" class="btn btn-default "><span class="network-name"></span>
            <img class="mr-3"
            style="max-height:50px;"
            src="../assets/images/team-garvan.png"
            alt="Garvan">
            </a>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="media">
            <a target="_blank" href="https://www.jax.org/" class="btn btn-default "><span class="network-name"></span>
            <img class="mr-3"
            style="max-height:50px;"
            src="../assets/images/team-jackson.png" 
            alt="Jax">
            </a>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="media">
            <a target="_blank" href="http://www.lbl.gov/" class="btn btn-default "><span class="network-name"></span>
            <img class="mr-3"
            style="max-height:50px;"
            src="../assets/images/team-lbnl.jpeg"
            alt="LBNL">
            </a>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="media">
            <a target="_blank" href="https://www.ohsu.edu/" class="btn btn-default "><span class="network-name"></span>
            <img class="mr-3"
            style="max-height:50px;"
            src="../assets/images/team-ohsu.gif" 
            alt="OHSU">
            </a>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="media">
            <a target="_blank" href="http://www.smd.qmul.ac.uk/" class="btn btn-default "><span class="network-name"></span>
            <img class="mr-3"
            style="max-height:50px;"
            src="../assets/images/team-qmul.png"
            alt="QMUL">
            </a>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="media">
           <a target="_blank" href="http://renci.org/" class="btn btn-default "><span class="network-name"></span>
           <img class="mr-3"
            style="max-height:50px;"
            src="../assets/images/team-renci.png" 
            alt="RENCI">
            </a>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="media">
            <a target="_blank" href="http://www.sanger.ac.uk/" class="btn btn-default "><span class="network-name"></span>
            <img class="mr-3"
            style="max-height:50px;"
            src="../assets/images/team-sanger.png"
            alt="Sanger">
            </a>
          </div>
        </div>
      </div>
    </div>
    <div>
        Monarch is supported generously by a NIH Office of the Director Grant #5R24OD011883,
        as well as by NIH-UDP: HHSN268201300036C, HHSN268201400093P, NCI/Leidos #15X143.
        We are grateful to the many <a target="_blank" href="/about/sources">original sources of our data</a> for allowing Monarch to integrate them in this way.
        Except where forbidden by the original sources, this work is licensed under a
        Creative Commons Attribution 3.0 License.
    </div>
  </div>
</div>
</template>



<script>

</script>

<style lang="scss">
@import "../../css/_prelude-ng.scss";
.home-footer {
  border:5px solid red;
}

.about-section > ul > li > a {
  padding: 0;
  margin: 0;
}


</style>
