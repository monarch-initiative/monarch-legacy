<template>
<nav
  id="monarch-navbar"
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
    <ul class="navbar-nav mr-auto mt-2 mt-lg-0">
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

    <form
      id="search_form"
      class="form-inline my-2 my-lg-0 searchspace"
        action="/search" role="search">
        <div class="form-group">
          <input id="search" type="text" class="col-xs-8 form-control" placeholder="Search (e.g. Parkinson's)"/>
          <button class="col-xs-4 btn btn-primary nav-search-btn"
              type="submit">Go</button>
        </div>
    </form>
  </div>
</nav>



<!-- 

<nav
  id="monarch-navbar"
  class="navbar navbar-default navbar-pf"
  role="navigation">
  <div class="navbar-header">
    <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
      <span class="sr-only">Toggle navigation</span>
      <span class="icon-bar"></span>
      <span class="icon-bar"></span>
      <span class="icon-bar"></span>
    </button>

    <router-link to="/" class="navbar-brand">
      <img class="branding-logo"
           src="../assets/images/monarch-logo-white.png"
           alt="Monarch Initiative logo"
           title="Monarch Initiative front page"/>

    </router-link>
  </div>
  <div id="navbar" class="navbar-collapse collapse">
    <ul class="nav navbar-nav navbar-utility">
        <li class="dropdown">
            <a href="#" class="dropdown-toggle" data-toggle="dropdown">
              Browse
              <span class="caret"></span>
            </a>
            <ul class="dropdown-menu">
                <li><router-link to="/disease">Diseases</router-link></li>
                <li><router-link to="/phenotype">Phenotypes</router-link></li>
                <li><router-link to="/gene">Genes</router-link></li>
                <li><router-link to="/model">Models</router-link></li>
            </ul>
        </li>
        <li class="dropdown">
            <a href="#" class="dropdown-toggle" data-toggle="dropdown">
              Analyze
              <span class="caret"></span>
            </a>
            <ul class="dropdown-menu">
                <li><router-link to="/analyze/phenotypes">Phenotypes</router-link></li>
                <li><router-link to="/annotate/text">Annotate Text</router-link></li>
                <li><router-link to="/page/exomes">Exomes</router-link></li>
            </ul>
        </li>
        <li class="dropdown">
            <a href="#" class="dropdown-toggle" data-toggle="dropdown">
              About
              <span class="caret"></span>
            </a>
            <ul class="dropdown-menu">
                <li><router-link to="/page/about">About Monarch</router-link></li>
                <li><router-link to="/about/sources">Data Sources</router-link></li>
                <li><router-link to="/page/releases">Releases</router-link></li>
                <li><router-link to="/page/team">Monarch Team</router-link></li>
                <li><router-link to="/page/disclaimer">Monarch Disclaimer</router-link></li>
                <li role="separator" class="divider"></li>
                <li><router-link to="/page/services">Monarch Web Services and APIs</router-link></li>
                <li><a target="_blank" href="https://archive.monarchinitiative.org/latest ">Data Downloads</a></li>
                <li role="separator" class="divider"></li>

                <li>
                  <router-link to="/disease/MONDO:0007947">
                    Marfan syndrome MONDO:0007947
                  </router-link>
                </li>
                <li>
                  <router-link to="/disease/OMIA:000628-9913">
                    Marfan syndrome OMIA:000628-9913
                  </router-link>
                </li>
                <li>
                  <router-link to="/gene/MGI:3A98365">
                    Sox3 (Mus musculus) MGI:3A98365
                  </router-link>
                </li>
                <li>
                  <router-link to="/gene/ZFIN:ZDB-GENE-980526-333">
                    sox3 (Danio rerio) ZFIN:ZDB-GENE-980526-333
                  </router-link>
                </li>

                <li><router-link to="/page/aboutSPA">About Monarch (SPA)</router-link></li>
            </ul>
        </li>
        <li class="dropdown">
            <a href="#" class="dropdown-toggle" data-toggle="dropdown">
              Documentation
              <span class="caret"></span>
            </a>
            <ul class="dropdown-menu">
                <li><router-link to="/page/phenogrid">Monarch Phenotype Grid Widget</router-link></li>
                <li><a target="_blank" href="http://monarch-initiative.blogspot.com/2015/01/how-to-annotate-patients-phenotypic.html">Phenotype Curation Guidelines</a></li>
                <li><a target="_blank" href="https://github.com/monarch-initiative">GitHub Organization</a></li>
                <li><a target="_blank" href="https://github.com/obophenotype/upheno">Phenotype Ontologies Project</a></li>
                <li><router-link to="/page/pubs">Publications</router-link></li>
                <li><router-link to="/page/links">Link To Us</router-link></li>
            </ul>
        </li>

        <li
          v-if="$route.path === '/'">
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        </li>

        <form
          v-if="$route.path !== '/'"
          v-on:submit="searchSubmit"
          id="search_form"
          class="navbar-right navbar-form navbar_searchspace"
          action="/search" role="search">
          <div class="form-group input-group">
            <span class="input-group-addon" id="sizing-addon1">
            <i class="fa fa-search fa-fw"></i>
            </span>
            <input id="search" type="text" class="form-control" placeholder="Search (e.g. Parkinson's)"/>

          </div>
        </form>
      </ul>
  </div>
</nav>

 -->
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
    }
  }
}
</script>

<style lang="scss">
@import "../../css/_prelude-patternfly.scss";

nav#monarch-navbar.navbar.navbar-default.navbar-pf .navbar-brand {
  height: $navbar-height;
  max-height: $navbar-height;
  padding: 1px;
  margin: 1px 5px;
}

nav#monarch-navbar.navbar.navbar-default.navbar-pf .navbar-toggle {
  margin: 2px 35px 0 10px;
  padding: 1px;
}

nav#monarch-navbar.navbar.navbar-default.navbar-pf .navbar-toggle .icon-bar {
  margin: 3px;
}

.branding-logo {
  height: 22px;
  width: auto;
  margin: 0 0 0 10px;
  xfloat: left;
}

.branding-name {
  margin: 2px 10px 0 10px;
  float: right;
}

#monarch-navbar {
  background-image: -webkit-linear-gradient(left, #0B556B 0%, #232733 100%) !important;
  background-image: linear-gradient(to right, #0B556B 0%, #232733 100%) !important;
  background-repeat: repeat-x !important;
  filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#ffffffff', endColorstr='#ffdfdfdf', GradientType=0) !important;
}

#search_form {
  margin: 1px 32px 0 10px;
  padding: 0;
}


#search {
  height: 25px;
  width: 200px;
  margin: 2px 2px;
  padding: 1px 10px;
}


#monarch-navbar #search_form .nav-search-btn {
    padding: 0;
    font-weight:500;
    width:35px;
    height: 25px;
    margin: 2px 2px;
    color: #fff;
    background: #337ab7;
    border-color: #2e6da4;
}

@media (max-width: ($grid-float-breakpoint + 60)) {
  .branding-name {
    display: none;
  }
}

</style>
