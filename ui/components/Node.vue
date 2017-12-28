<template>
<div id="selenium_id_content">

<a
  target="_blank"
  v-bind:href="'http://beta.monarchinitiative.org' + path">
  <img class="node-logo" :src="nodeIcon"/>
</a>


<!-- <pre>
{{JSON.stringify(node, null, 2)}}
</pre>
 -->
<div class="wrapper">
  <div
    class="overlay"
    v-bind:class="{ active: isActive }"
    v-on:click="toggleSidebar()">
  </div>
  <div id="sidebar-header">
    <button
      id="sidebarCollapse"
      v-on:click="toggleSidebar()"
      class="btn btn-default btn-sm btn-sidebar">
        <i class="fa fa-2x fa-crosshairs"></i>
    </button>
  </div>
  <nav id="sidebar" v-bind:class="{ active: isActive }">
    <div class="sidebar-content">
      <div class="row sidebar-title">
        <div class="col-xs-12">
          <b>Neighborhood</b>
        </div>
      </div>
      <div class="row superclass" v-for="c in superclasses">
        <div class="col-xs-12">
          <router-link :to="'/' + nodeCategory + '/' + c.id">
            {{c.label}}
          </router-link>
        </div>
      </div>

      <div class="row currentclass">
        <div class="col-xs-8">
          {{nodeLabel}}
        </div>
        <div class="col-xs-4">
          ({{nodeID}})
        </div>
      </div>

      <div class="row subclass" v-for="c in subclasses">
        <div class="col-xs-12">
          <router-link :to="'/' + nodeCategory + '/' + c.id">
            {{c.label}}
          </router-link>
        </div>
      </div>
    </div>
  </nav>

  <div
    v-if="node != null"
    class="container-fluid node-container">

    <div class="row node-title">
      <div class="col-xs-12">
        <span><b>{{nodeLabel}}</b> ({{node.id}})</span>
      </div>
      <div class="col-xs-12">
        <b>AKA:</b>&nbsp;
        <b v-for="s in synonyms">{{s}}&nbsp;</b>
      </div>
    </div>


    <div class="row">
      <div class="col-xs-12">
        <h5>{{nodeDefinition}}</h5>
      </div>
    </div>

    <br>
<div class="cards-pf">


<div class="container-fluid container-cards-pf">
  <div class="row row-cards-pf">

    <node-card
      class="col-xs-12 col-sm-4"
      card-type="phenotype"
      :card-count="counts.phenotype"
      :parent-node="node"
      :parent-node-id="nodeID"
      v-on:expandCard="expandCard">
      <h4>I'm in a Phenotype for {{nodeID}}</h4>
    </node-card>

    <node-card
      class="col-xs-12 col-sm-4"
      card-type="gene"
      :card-count="counts.gene"
      :parent-node="node"
      :parent-node-id="nodeID"
      v-on:expandCard="expandCard">
      <h4>I'm in a Gene for {{nodeID}}</h4>
    </node-card>

    <node-card
      class="col-xs-12 col-sm-4"
      card-type="model"
      :card-count="counts.model"
      :parent-node="node"
      :parent-node-id="nodeID"
      v-on:expandCard="expandCard">
      <h4>I'm in a Model for {{nodeID}}</h4>
    </node-card>

  </div>
</div>

</div>

</div>
    <br>

<!--
    <div class="row" v-for="equivalentClass in equivalentClasses">
      <div class="col-xs-8">
        {{equivalentClass.label}}
      </div>
      <div class="col-xs-4">
        ({{equivalentClass.id}})
      </div>
    </div>


    <div class="row" v-if="node.relationships">
      <vue-good-table
        class="table table-stripped table-bordered condensed"
        title="Relationships"
        :defaultSortBy="{field: 'property.id', type: 'asc'}"
        :columns="relationshipsColumns"
        :rows="node.relationships"
        :paginate="false"
        :lineNumbers="false">

        <template slot="table-row" slot-scope="props">
          <td class="fancy">{{ props.row.subject.label }} ({{ props.row.subject.id }})</td>
          <td class="fancy">{{ props.row.property.label }} ({{ props.row.property.id }})</td>
          <td class="fancy">{{ props.row.object.label }} ({{ props.row.object.id }})</td>
          <td class="has-text-right">{{ props.row.source }}</td>
        </template>
      </vue-good-table>
    </div>


    <br>
    <br>
    <br>
    <div class="row pre-scrollable">
      <div class="col-xs-12">
        <json-tree :data="node" :level="1"></json-tree>
      </div>
    </div>

-->
  </div>
</div>

</div>
</template>

<script>

import _ from 'underscore';

function pathLoadedAsync(sourceText, responseURL, path, done) {
  if (done) {
    done(sourceText, responseURL);
  }
  else {
    console.log('pathLoadedAsync', responseURL, path, sourceText.slice(0, 100));
  }
}


function loadPathContentAsync(path, done) {
  console.log('loadPathContentAsync', path);
  /* global XMLHttpRequest */
  const oReq = new XMLHttpRequest();
  oReq.addEventListener('load', function load() {
    console.log('loadPathContentAsync', path, this);
    pathLoadedAsync(this.responseText, this.responseURL, path, done);
  });

  let refinedPath = path;

  // const hashIndex = refinedPath.indexOf('#');
  // if (hashIndex >= 0) {
  //   refinedPath = refinedPath.slice(0, hashIndex) + '?stripme' + refinedPath.slice(hashIndex);
  // }
  // else {
  //   refinedPath += '?stripme';
  // }
  oReq.open('GET', refinedPath);
  oReq.send();
}


const icons = {
  disease: require('../../image/carousel-diseases.png'),
  gene: require('../../image/carousel-genes.png'),
  phenotype: require('../../image/carousel-phenotypes.png'),
  model: require('../../image/carousel-models.png'),
};

export default {
  name: 'home',
  created() {
    // console.log('created', this.nodeID);
  },

  updated() {
    // console.log('updated', this.nodeID);
  },

  destroyed() {
    // console.log('destroyed', this.nodeID);
  },

  mounted() {
    // $(".row-cards-pf > [class*='col'] > .card-pf > .card-pf-body").matchHeight();
    // Card Single Select
    var that = this;
    // that.$nextTick(function() {
    //   console.log('qsa', document.querySelectorAll('.card-pf-view-single-select'));
    //   $('.card-pf-view-single-select').click(function() {
    //     console.log('click');
    //     if ($(this).hasClass('active'))
    //     { $(this).removeClass('active'); }
    //     else
    //     { $('.card-pf-view-single-select').removeClass('active'); $(this).addClass('active'); }
    //   });
    // });

    // $('#dismiss, .overlay').on('click', function () {
    //     $('#sidebar').removeClass('active');
    //     $('.overlay').fadeOut();
    // });

    // $('#sidebarCollapse').on('click', function () {
    //     $('#sidebar').addClass('active');
    //     $('.overlay').fadeIn();
    //     $('.collapse.in').toggleClass('in');
    //     $('a[aria-expanded=true]').attr('aria-expanded', 'false');
    // });

    console.log('mounted fetchData', this.nodeID);
    this.fetchData();
  },
  watch: {
    '$route' (to, from) {
      // Only fetchData if the path is different.
      // hash changes are currently handled by monarch-tabs.js
      // within the loaded MonarchLegacy component.

      console.log('$route', to, from, to.path, this.path);
      if (to.path !== this.path) {
        console.log('$route fetchData', to.path, this.path);
        this.fetchData();
      }
    }
  },
  data () {
    return {
      isActive: false,
      isSelected: {
        phenotypes: false,
        genes: false,
        models: false,
        diseases: false,
      },
      node: null,
      equivalentClasses: null,
      superclasses: null,
      subclasses: null,
      synonyms: null,
      contentScript: '',
      contentBody: '',
      progressTimer: null,
      progressPath: null,
      path: null,
      nodeID: null,
      nodeDefinition: null,
      nodeCategory: null,
      nodeLabel: null,
      nodeIcon: null,
      nodeCategory: null,
      counts: {
        phenotype: 0,
        gene: 0,
        genotype: 0,
        model: 0,
        variant: 0,
        pathway: 0,
        literature: 0,
      },
      relationshipsColumns: [
        {
          label: 'Subject',
          field: 'subject.id'
        },
        {
          label: 'Property',
          field: 'property.id'
        },
        {
          label: 'Object',
          field: 'object.id'
        },
        {
          label: 'Source',
          field: 'source'
        }
      ],
    }
  },


  methods: {
    expandCard(arg) {
      console.log('expandCard', arg);
    },

    toggleSidebar() {
      this.isActive = !this.isActive;
    },

    parseNodeContent(content) {
      var that = this;
      this.node = JSON.parse(content);
      var equivalentClasses = [];
      var superclasses = [];
      var subclasses = [];
      if (this.node.relationships) {
        this.node.relationships.forEach(relationship => {
          if (relationship.property.id === 'subClassOf') {
            if (relationship.subject.id === this.nodeID) {
              superclasses.push(relationship.object);
            }
            else if (relationship.object.id === this.nodeID) {
              subclasses.push(relationship.subject);
            }
            else {
              console.log('parseNodeContent ERROR', relationship);
            }
          }
          else if (relationship.property.id === 'equivalentClass') {
            equivalentClasses.push(relationship.subject);
          }
        });
      }

      this.superclasses = _.uniq(superclasses, function(item, key, list) {
        return JSON.stringify(item);
      });
      this.subclasses = _.uniq(subclasses, function(item, key, list) {
        return JSON.stringify(item);
      });
      this.equivalentClasses = _.uniq(equivalentClasses, function(item, key, list) {
        return JSON.stringify(item);
      });

      this.synonyms = this.node.synonyms;
      this.nodeDefinition = this.node.definitions ? this.node.definitions[0] : '???definitions???';
      this.nodeLabel = this.node.labels ? this.node.labels[0] : '???labels???';
      this.nodeCategory = this.node.categories ? this.node.categories[0].toLowerCase() : '???categories???';
      this.nodeIcon = icons[this.nodeCategory];
      this.phenotypeIcon = icons.phenotype;
      this.geneIcon = icons.gene;
      this.modelIcon = icons.model;
      this.counts.phenotype = this.node.phenotypeNum;
      this.counts.gene = this.node.geneNum;
      this.counts.genotype = this.node.genotypeNum;
      this.counts.model = this.node.modelNum;
      this.counts.variant = this.node.variantNum;
      this.counts.pathway = this.node.pathwayNum;
      this.literature = this.node.literatureNum;
    },

    fetchData() {
      const that = this;
      const path = that.$route.fullPath;
      this.path = that.$route.path;
      this.nodeID = this.$route.params.id;
      console.log('fetchData', path, this.$route.params, this.$route.params.id);

      if (that.progressTimer) {
        console.log('leftover progressTimer');
      }
      else {
        that.progressPath = null;
        that.progressTimer = setTimeout(function timeout() {
          that.progressTimer = null;
          that.progressPath = path;
          that.node = null;
        }, 500);
      }
      that.node = null;
      // var url = `${that.path}.json`;
      var url = `/node${that.path}.json`;
      console.log('url', url);
      loadPathContentAsync(url, function(content, responseURL) {
        that.parseNodeContent(content);
        console.log('that.node', that.node);
        that.$nextTick(function() {
          if (that.progressTimer) {
            clearTimeout(that.progressTimer);
            that.progressTimer = null;
          }
          that.progressPath = null;
        });
      });
    }
  }

}

</script>

<style lang="scss">
@import "../../css/_prelude-patternfly.scss";

$sidebar-width: 600px;
$sidebar-button-width: 32px;

#sidebar a,
#sidebar a:hover,
#sidebar a:focus {
  color: inherit;
  text-decoration: none;
  transition: all 0.3s;
}

#sidebar a img.sidebar-logo {
  margin: 0 0 0 0;
  padding: 0;
  height: 30px !important;
}

#sidebar {
  width: $sidebar-width;
  position: fixed;
  top: ($navbar-height + 110);
  left: (-$sidebar-width);
  xheight: 80vh;
  min-height: 40px;
  z-index: 50;
  xcolor: #fff;
  transition: all 0.3s;
  overflow-y: auto;
  overflow-x: hidden;
  background: ivory;
  padding-left: $sidebar-button-width;
}

#sidebar.active {
  left: 0;
  box-shadow: 3px 3px 3px rgba(0, 0, 0, 0.2);
}

#sidebar-header {
  position: fixed;
  top: ($navbar-height + 110);
  height: 100%;
  z-index:999;
}

#sidebar-header #sidebarCollapse {
  padding: 0 4px;
}


#sidebar .sidebar-content {
  width: ($sidebar-width - $sidebar-button-width);
  margin: 0;
}

#sidebar .sidebar-content .sidebar-title {
  text-align: center;
  background: lightgray;
}


#sidebar.active .sidebar-content {
  xdisplay:block;
}

#sidebar .sidebar-content .superclass {
  margin-left: 0;
}

#sidebar .sidebar-content .currentclass {
  font-weight: 600;
  margin-left: 15px;
}

#sidebar .sidebar-content .subclass {
  margin-left: 30px;
}

.overlay {
    position: fixed;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.3);
    z-index: 50;
    display: none;
}

.overlay.active {
    display: initial;
}

#sidebar ul li a {
    text-align: left;
}

#sidebar.active ul li a {
    padding: 20px 10px;
    text-align: center;
    font-size: 0.85em;
}

#sidebar.active ul li a i {
    margin-right:  0;
    display: block;
    font-size: 1.8em;
    margin-bottom: 5px;
}

#sidebar.active ul ul a {
    padding: 10px !important;
}

#sidebar.active a[aria-expanded="false"]::before,
#sidebar.active a[aria-expanded="true"]::before {
    top: auto;
    bottom: 5px;
    right: 50%;
    -webkit-transform: translateX(50%);
    -ms-transform: translateX(50%);
    transform: translateX(50%);
}

#sidebar ul.components {
    padding: 20px 0;
    border-bottom: 1px solid #47748b;
}

#sidebar ul li a {
    padding: 10px;
    font-size: 1.1em;
    display: block;
}
#sidebar ul li a:hover {
    color: #7386D5;
    background: #fff;
}
#sidebar ul li a i {
    margin-right: 10px;
}

#sidebar ul li.active > a,
#sidbar a[aria-expanded="true"] {
    color: #fff;
    background: #6d7fcc;
}


#sidebar a[data-toggle="collapse"] {
    position: relative;
}

#sidebar a[aria-expanded="false"]::before,
#sidebar a[aria-expanded="true"]::before {
    content: '\e259';
    display: block;
    position: absolute;
    right: 20px;
    font-family: 'Glyphicons Halflings';
    font-size: 0.6em;
}
#sidebar a[aria-expanded="true"]::before {
    content: '\e260';
}


#sidebar ul ul a {
    font-size: 0.9em !important;
    padding-left: 30px !important;
    background: #6d7fcc;
}

#sidebar a.download {
    background: #fff;
    color: #7386D5;
}

#sidebar a.article,
#sidebar a.article:hover {
    background: #6d7fcc !important;
    color: #fff !important;
}

.node-container {
  margin-left: $sidebar-button-width;
  min-height: 100vh;
  transition: all 0.3s;
}

img.node-logo {
  position: absolute;
  margin: 0 0 0 0;
  padding: 0;
  height: 30px !important;
}

.node-container .node-title {
  background: #4B4B4B;
  color: white;
}

.wrapper {
  display: flex;
  align-items: stretch;
  min-height: 100%;
  width: 100%;
  margin: ($navbar-height + 1) 0 2px 0;
  padding: 0;
}

</style>
