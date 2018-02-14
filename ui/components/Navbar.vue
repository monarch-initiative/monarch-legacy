<template>
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
           src="/image/logo.png"
           alt="Monarch Initiative logo"
           title="Monarch Initiative front page"/>
      <span class="branding-name">Monarch</span>
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
                <li><router-link to="/page/aboutSPA">About Monarch (SPA)</router-link></li>
                <li><router-link to="/page/about">About Monarch</router-link></li>
                <li><router-link to="/about/sources">Data Sources</router-link></li>
                <li><router-link to="/page/releases">Releases</router-link></li>
                <li><router-link to="/page/team">Monarch Team</router-link></li>
                <li><router-link to="/page/disclaimer">Monarch Disclaimer</router-link></li>
                <li role="separator" class="divider"></li>
                <li><router-link to="/page/services">Monarch Web Services and APIs</router-link></li>
                <li><a target="_blank" href="https://archive.monarchinitiative.org/latest ">Data Downloads</a></li>
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

        <form
          v-on:submit="searchSubmit"
          id="search_form"
          class="navbar-right navbar-form navbar_searchspace"
          action="/search" role="search">
          <div class="form-group">
            <input id="search" type="text" class="form-control" placeholder="Search (e.g. Parkinson's)"/>
            <button id="navbar-search-btn" class="btn btn-primary"
                type="submit">
                Go
            </button>
          </div>
        </form>
      </ul>
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
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>

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
  height: 24px;
  width: auto;
  margin: 1px 0 0 10px;
  float: left;
}

.branding-name {
  margin: 2px 10px 0 10px;
  float: right;
}

#monarch-navbar {
  background-image: -webkit-linear-gradient(left, #0B556B 0%, #232733 100%);
  background-image: linear-gradient(to right, #0B556B 0%, #232733 100%);
  background-repeat: repeat-x;
  filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#ffffffff', endColorstr='#ffdfdfdf', GradientType=0);
}

#search_form {
  margin: -3px 30px 0 10px;
  padding: 0;
}

#navbar_search {
  margin: 0;
  padding: 0;
}

#navbar-search-btn {
  font-weight:500;
  width:40px;
  height: 30px;
  margin:0;
}


</style>
