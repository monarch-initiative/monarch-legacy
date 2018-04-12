<template>
<nav
  id="monarchng-navbar"
  class="navbar fixed-top navbar-expand-lg navbar-dark bg-dark">

  <router-link to="/" class="navbar-brand">
    <img class="branding-logo"
         src="../assets/images/monarch-logo-white.png"
         alt="Monarch Initiative logo"
         title="Monarch Initiative front page"/>
  </router-link>

  <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarTogglerDemo02" aria-controls="navbarTogglerDemo02" aria-expanded="false" aria-label="Toggle navigation">
    <span class="navbar-toggler-icon"></span>
  </button>

  <div class="collapse navbar-collapse" id="navbarTogglerDemo02">
    <ul class="navbar-nav mr-auto">
      <li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown1" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          Browse
        </a>
        <div class="dropdown-menu" aria-labelledby="navbarDropdown1">
          <router-link class="dropdown-item" to="/disease">Diseases</router-link>
          <router-link class="dropdown-item" to="/phenotype">Phenotypes</router-link>
          <router-link class="dropdown-item" to="/gene">Genes</router-link>
          <router-link class="dropdown-item" to="/model">Models</router-link>

        </div>
      </li>

      <li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown2" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          Analyze
        </a>
        <div class="dropdown-menu" aria-labelledby="navbarDropdown2">
          <router-link class="dropdown-item" to="/analyze/phenotypes">Phenotypes</router-link>
          <router-link class="dropdown-item" to="/annotate/text">Annotate Text</router-link>
          <router-link class="dropdown-item" to="/page/exomes">Exomes</router-link>
        </div>
      </li>
      <li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown3" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          About
        </a>
        <div class="dropdown-menu" aria-labelledby="navbarDropdown3">
          <router-link class="dropdown-item" to="/page/about">About Monarch</router-link>
          <router-link class="dropdown-item" to="/about/sources">Data Sources</router-link>
          <router-link class="dropdown-item" to="/page/releases">Releases</router-link>
          <router-link class="dropdown-item" to="/page/team">Monarch Team</router-link>
          <router-link class="dropdown-item" to="/page/disclaimer">Monarch Disclaimer</router-link>
          <router-link class="dropdown-item" to="/page/services">Monarch Web Services and APIs</router-link>
          <a target="_blank" class="dropdown-item" href="https://archive.monarchinitiative.org/latest ">Data Downloads</a>

          <router-link class="dropdown-item" to="/disease/MONDO:0007947">
            Marfan syndrome MONDO:0007947
          </router-link>
          <router-link class="dropdown-item" to="/disease/OMIA:000628-9913">
            Marfan syndrome OMIA:000628-9913
          </router-link>
          <router-link class="dropdown-item" to="/gene/MGI:3A98365">
            Sox3 (Mus musculus) MGI:3A98365
          </router-link>
          <router-link class="dropdown-item" to="/gene/ZFIN:ZDB-GENE-980526-333">
            sox3 (Danio rerio) ZFIN:ZDB-GENE-980526-333
          </router-link>

          <router-link class="dropdown-item" to="/page/aboutSPA">About Monarch (SPA)</router-link>
        </div>
      </li>

      <li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown4" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          Documentation
        </a>
        <div class="dropdown-menu" aria-labelledby="navbarDropdown4">
          <router-link class="dropdown-item" to="/page/phenogrid">Monarch Phenotype Grid Widget</router-link>
          <a target="_blank" class="dropdown-item" href="http://monarch-initiative.blogspot.com/2015/01/how-to-annotate-patients-phenotypic.html">Phenotype Curation Guidelines</a>
          <a target="_blank" class="dropdown-item" href="https://github.com/monarch-initiative">GitHub Organization</a>
          <a target="_blank" class="dropdown-item" href="https://github.com/obophenotype/upheno">Phenotype Ontologies Project</a>
          <router-link class="dropdown-item" to="/page/pubs">Publications</router-link>
          <router-link class="dropdown-item" to="/page/links">Link To Us</router-link>
        </div>
      </li>
    </ul>
    <div v-if="this.$route.path !== '/'"
         class="nav-ac">
      <monarch-autocomplete>
      </monarch-autocomplete>
    </div>

  </div>
</nav>



</template>


<script>
export default {
  name: 'navbar',
  mounted() {
    this.$nextTick(_ => {
      navbar_search_init();
    });
  },
  data () {
    return {
    }
  },
  methods: {
    searchSubmit() {
      console.log('searchSubmit');
    },
  }
}
</script>

<style lang="scss">
@import "../../css/_prelude-ng.scss";

nav#monarchng-navbar.navbar .navbar-brand {
  height: $navbar-height;
  padding: 0;
  margin: 0 20px 0 0;
}

nav#monarchng-navbar.navbar .navbar-brand .branding-logo {
  height: 26px;
  width: auto;
  margin: 0;
  padding: 0;
}

nav#monarchng-navbar.navbar .navbar-collapse > .navbar-nav {
}

nav#monarchng-navbar.navbar .navbar-collapse > .navbar-nav > .nav-item {
  xvertical-align:middle;
}


nav#monarchng-navbar.navbar .navbar-collapse > .navbar-nav > .nav-item > .nav-link {
  xpadding:0;
  xmargin:0;
}

nav#monarchng-navbar.navbar .navbar-toggle {
  margin: 2px 35px 0 10px;
  padding: 1px;
}

nav#monarchng-navbar.navbar .navbar-toggler {
  padding: 2px 10px;
}

nav#monarchng-navbar.navbar .navbar-toggle .icon-bar {
  margin: 3px;
}


#monarchng-navbar {
  background-image: -webkit-linear-gradient(left, #0B556B 0%, #232733 100%) !important;
  background-image: linear-gradient(to right, #0B556B 0%, #232733 100%) !important;
  background-repeat: repeat-x !important;
  filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#ffffffff', endColorstr='#ffdfdfdf', GradientType=0) !important;
}

.nav-ac {
  margin:1px 25px 1px 0;
  height: 30px;
}
</style>
