<template>
  <div id="selenium_id_content">
    <div>
      <div class="nav-pf-vertical nav-pf-vertical-with-sub-menus">
        <ul class="list-group">
          <li class="list-group-item list-group-item-node">
            <a
              target="_blank"
              v-bind:href="'http://beta.monarchinitiative.org' + path">
              <img
                class="entity-type-icon"
                :src="icons[nodeType]"/>
              <span class="list-group-item-value">{{labels[nodeType]}}</span>
            </a>
          </li>

          <li class="list-group-item list-group-item-squat">
            <a
              v-on:click="toggleSidebar()"
              href="#">
              <i class="fa fa-2x fa-crosshairs"></i>
              <span class="list-group-item-value">Neighbors</span>
            </a>
          </li>

          <li class="list-group-item list-group-item-squat"
              v-bind:class="{ active: !expandedCard }">
            <a
              v-on:click="expandCard(null)"
              href="#">
              <i class="fa fa-2x fa-th-large"></i>
              <span class="list-group-item-value">Overview</span>
            </a>
          </li>

          <li class="list-group-item"
              v-bind:class="{ active: expandedCard === cardType }"
              v-for="cardType in nonEmptyCards"
              :key="cardType">
            <a
              :href="'#' + cardType"
              v-on:click="expandCard(cardType)">
              <img class="entity-type-icon" :src="icons[cardType]"/>
              <span class="list-group-item-value">{{labels[cardType]}} ({{counts[cardType]}})</span>
            </a>
          </li>
          <li class="list-group-item list-group-item-squat">
            <a href="#"><span class="list-group-item-value">Association Filters</span></a>
            <div style="padding:15px; background: #363636; color:white" class="panel">
              <h3>Species</h3>
              <assoc-facets v-model="facetObject.species"></assoc-facets>
              <!--<h3>Evidence</h3>-->
              <!--<assoc-facets v-model="facetObject.evidence"></assoc-facets>-->
              <!--<h3>Systems</h3>-->
              <!--<assoc-facets v-model="facetObject.systems"></assoc-facets>-->
            </div>
            <pre style="text-align: left">{{facetObject}}</pre>
          </li>
        </ul>

      </div>

    </div>


    <div class="container-fluid container-cards-pf container-pf-nav-pf-vertical">
      <div class="wrapper">
        <div
          class="overlay"
          v-bind:class="{ active: isActive }"
          v-on:click="toggleSidebar()">
        </div>
        <nav
          id="sidebar"
          v-bind:class="{ active: isActive }">
          <div class="sidebar-content">
            <div class="row superclass" v-for="c in superclasses">
              <div class="col-xs-12">
                <router-link
                  :to="'/' + nodeCategory + '/' + c.id">
                  {{c.label}}
                </router-link>
              </div>
            </div>

            <div class="row currentclass">
              <div class="col-xs-12">
                {{nodeLabel}}
              </div>
            </div>

            <div class="row subclass" v-for="c in subclasses">
              <div class="col-xs-12">
                <router-link
                  :to="'/' + nodeCategory + '/' + c.id">
                  {{c.label}}
                </router-link>
              </div>
            </div>
          </div>
        </nav>

        <div
          class="title-bar">
          <div
            v-if="!node">
            <h4 class="text-center">Loading Data for {{labels[nodeType]}}: {{nodeID}}</h4>
          </div>

          <div
            v-else>

            <span><b>{{nodeLabel}}</b> ({{node.id}})</span>
            <br>
            <span><b>AKA:</b>&nbsp;</span>
            <span class="synonym" v-for="s in synonyms">{{s}}</span>
          </div>
        </div>

        <div
          v-if="node"
          class="container-fluid node-container">

          <div
            v-if="!expandedCard && nodeDefinition"
            class="row">
            <div class="col-xs-12">
              <div class="node-description">
                {{nodeDefinition}}
              </div>
            </div>

            <div class="col-xs-12">
              <b>References:</b>&nbsp;
              <span
                v-for="r in xrefs">
          <router-link
            v-if="r.url.indexOf('/') === 0"
            :to="r.url">
            {{r.label}}
          </router-link>

          <a
            v-else-if="r.url && r.blank"
            :href="r.url"
            target="_blank">
            {{r.label}}
          </a>
          <a
            v-else-if="r.url"
            :href="r.url">
            {{r.label}}
          </a>

          <span
            v-else>
            {{r.label}}
          </span>
        </span>
              <br>
              <span
                v-if="inheritance">
          <b>Heritability:</b>&nbsp;{{inheritance}}
        </span>
            </div>

            <div class="col-xs-12">
              <b>Equivalent IDs:</b>&nbsp;

              <span
                v-for="r in equivalentClasses">
          <router-link
            v-if="r.id"
            :to="'/resolve/' + r.id">
            {{r.label || r.id}}
          </router-link>

          <span
            v-else>
            {{r.label}}
          </span>
        </span>
              <br>
              <span
                v-if="inheritance">
          <b>Heritability:</b>&nbsp;{{inheritance}}
        </span>
            </div>

          </div>

          <div
            v-if="!expandedCard"
            class="cards-pf">
            <div
              class="row row-cards-pf">
              <node-card
                v-for="cardType in nonEmptyCards"
                :key="cardType"
                class="col-lg-3 col-xs-6"
                :card-type="cardType"
                :card-count="counts[cardType]"
                :parent-node="node"
                :parent-node-id="nodeID"
                v-on:expandCard="expandCard(cardType)">
              </node-card>
            </div>
          </div>

          <div
            v-if="expandedCard"
            class="expanded-card-view">
            <h3 class="text-center">{{labels[expandedCard]}} Associations</h3>
            <table-view
              :facets="facetObject"
              :nodeType="nodeCategory"
              :cardType="expandedCard"
              :identifier="nodeID">
            </table-view>
          </div>

          <!--
              <br>
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
      <!--
      <button
        v-on:click="getHierarchy()"
        class="btn btn-default btn-sm">
          Get Hierarchy
      </button>
       -->


    </div>
  </div>
</template>

<script>

  import _ from 'underscore';
  import TableView from './TableView.vue';

  function pathLoadedAsync(sourceText, responseURL, path, done) {
    if (done) {
      done(sourceText, responseURL);
    }
    else {
      console.log('pathLoadedAsync', responseURL, path, sourceText.slice(0, 100));
    }
  }


  function loadPathContentAsync(path, done) {
    // console.log('loadPathContentAsync', path);
    /* global XMLHttpRequest */
    const oReq = new XMLHttpRequest();
    oReq.addEventListener('load', function load() {
      // console.log('loadPathContentAsync', path, this);
      pathLoadedAsync(this.responseText, this.responseURL, path, done);
    });

    oReq.open('GET', path);
    oReq.send();
  }

  const availableCardTypes = [
    'anatomy',
    'cellline',
    'disease',
    'function',
    'gene',
    'genotype',
    'homolog',
    'interaction',
    'literature',
    'model',
    'ortholog-phenotype',
    'ortholog-disease',
    'pathway',
    'phenotype',
    'variant',
  ];

  const icons = {
    anatomy: require('../../image/carousel-anatomy.png'),
    cellline: require('../../image/carousel-anatomy.png'),
    disease: require('../../image/carousel-diseases.png'),
    function: require('../../image/carousel-anatomy.png'),
    gene: require('../../image/carousel-genes.png'),
    genotype: require('../../image/carousel-anatomy.png'),
    homolog: require('../../image/carousel-anatomy.png'),
    interaction: require('../../image/carousel-anatomy.png'),
    literature: require('../../image/carousel-anatomy.png'),
    model: require('../../image/carousel-models.png'),
    'ortholog-disease': require('../../image/carousel-anatomy.png'),
    'ortholog-phenotype': require('../../image/carousel-anatomy.png'),
    pathway: require('../../image/carousel-anatomy.png'),
    phenotype: require('../../image/carousel-phenotypes.png'),
    variant: require('../../image/carousel-genes.png'),
  };

  const labels = {
    anatomy: 'Anatomy',
    cellline: 'Cell Line',
    disease: 'Disease',
    function: 'Function',
    gene: 'Gene',
    genotype: 'Genotype',
    homolog: 'Homolog',
    interaction: 'Interaction',
    literature: 'Literature',
    model: 'Model',
    'ortholog-phenotype': 'Ortholog Phenotype',
    'ortholog-disease': 'Ortholog Disease',
    pathway: 'Pathway',
    phenotype: 'Phenotype',
    variant: 'Variant',
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
      this.fetchData();
    },
    watch: {
      '$route'(to, from) {
        // Only fetchData if the path is different.
        // hash changes are currently handled by monarch-tabs.js
        // within the loaded MonarchLegacy component.

        if (to.path !== this.path) {
          this.fetchData();
        }
      }
    },
    data() {
      return {
        facetObject: {
          species: {

            zebrafish: true,
            chimpanzee: true,
            mouse: true,
            opposum: true,
            horse: true,
            rat: true,
            macaque: true,
            chicken: true,
            cow: true,
            anole: true,
            frog: true,
            boar: true,
            fly: true,
            arabidopsis: true,
            platypus: true,
            worm: true,
            yeast: true,
          },
          evidence: {
            IEA: true,
          },
          systems: {
            'Skeletal system': true,
            'Limbs': true,
            'Nervous system': true,
            'Head or neck': true,
            'Metabolism/homeostasis': true,
            'Cardiovascular system': true,
            'Integument': true,
            'Genitourinary system': true,
            'Eye': true,
            'Musculature': true,
            'Neoplasm': true,
            'Digestive system': true,
            'Immune System': true,
            'Blood and blood-forming tissues': true,
            'Endocrine': true,
            'Respiratory system': true,
            'Ear': true,
            'Connective tissue': true,
            'Prenatal development or birth': true,
            'Growth': true,
            'Constitutional': true,
            'Thoracic cavity': true,
            'Breast': true,
            'Voice': true,
            'Cellular': true,
          },
        },
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
        inheritance: null,
        contentScript: '',
        contentBody: '',
        progressTimer: null,
        progressPath: null,
        path: null,
        icons: icons,
        labels: labels,
        nodeID: null,
        nodeDefinition: null,
        nodeLabel: null,
        nodeIcon: null,
        nodeCategory: null,
        availableCards: availableCardTypes,
        nonEmptyCards: [],
        expandedCard: null,
        counts: {
          disease: 0,
          phenotype: 0,
          gene: 0,
          variant: 0,
          model: 0,
          pathway: 0,
          literature: 0,
          cellline: 0,
          genotype: 0,
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
      };
    },


    methods: {
      expandCard(cardType) {
        this.expandedCard = cardType;
      },

      toggleSidebar() {
        this.isActive = !this.isActive;
      },

      parseNodeContent(content) {
        var that = this;
        this.node = JSON.parse(content);
        // console.log('parseNodeContent', this.node);

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

        this.superclasses = _.uniq(superclasses, function (item, key, list) {
          return JSON.stringify(item);
        });
        this.subclasses = _.uniq(subclasses, function (item, key, list) {
          return JSON.stringify(item);
        });
        this.equivalentClasses = _.uniq(equivalentClasses, function (item, key, list) {
          return JSON.stringify(item);
        });

        this.synonyms = this.node.synonyms;
        this.xrefs = this.node.xrefs;
        this.inheritance = this.node.inheritance ? this.node.inheritance[0] : null;
        this.nodeDefinition = this.node.definitions ? this.node.definitions[0] : '???definitions???';
        this.nodeLabel = this.node.label;
        this.nodeCategory = this.node.categories ? this.node.categories[0].toLowerCase() : this.nodeType;
        this.nodeIcon = this.icons[this.nodeCategory];
        this.phenotypeIcon = this.icons.phenotype;
        this.geneIcon = this.icons.gene;
        this.modelIcon = this.icons.model;

        var nonEmptyCards = [];
        this.availableCards.forEach(cardType => {
          const count = that.node[cardType + 'Num'];
          that.counts[cardType] = count;
          if (count > 0) {
            nonEmptyCards.push(cardType);
          }
        });
        this.nonEmptyCards = nonEmptyCards;
        // this.counts.phenotype = this.node.phenotypeNum;
        // this.counts.gene = this.node.geneNum;
        // this.counts.genotype = this.node.genotypeNum;
        // this.counts.model = this.node.modelNum;
        // this.counts.variant = this.node.variantNum;
        // this.counts.pathway = this.node.pathwayNum;
        // this.literature = this.node.literatureNum;
      },

      fetchData() {
        const that = this;
        const path = that.$route.fullPath;
        this.path = that.$route.path;
        this.nodeID = this.$route.params.id;
        this.nodeType = this.path.split('/')[1];
        this.expandedCard = null;
        this.nonEmptyCards = [];
        this.isActive = false;

        // console.log('fetchData', path, this.$route.params, this.$route.params.id, this.nodeType);

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
        var url = `/node${that.path}.json`;
        loadPathContentAsync(url, function (content, responseURL) {
          that.parseNodeContent(content);
          that.$nextTick(function () {
            if (that.progressTimer) {
              clearTimeout(that.progressTimer);
              that.progressTimer = null;
            }
            that.progressPath = null;
          });
        });
      },

      xloadPathContentAsync(path, done) {
        console.log('xloadPathContentAsync', path);
        /* global XMLHttpRequest */
        const oReq = new XMLHttpRequest();
        oReq.addEventListener('load', function load() {
          // console.log('xloadPathContentAsync', path, this);
          var responseJSON = this.responseText;
          var response = JSON.parse(responseJSON);
          done(response, this.responseURL, path);
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
      },

      getHierarchy() {
        //Determine if ID is clique leader
        console.log('qurl', this.node);
        var qurl = this.node.global_scigraph_data_url + 'dynamic/cliqueLeader/' + this.nodeID + '.json';
        this.xloadPathContentAsync(qurl,
          function (response, responseURL, path) {
            console.log('xpathLoadedAsync', response, responseURL, path);

            var graph = new bbop.model.graph();
            graph.load_json(response);
            var nodeList = graph.all_nodes();
            console.log('nodeList', nodeList);
            if (nodeList.length !== 1) {
              console.log('nodeList ERROR too many entries', nodeList);
            }
            else {
              var leaderId = nodeList[0].id();
              console.log('leaderId', leaderId);
            }
          });
      }
    }

  };

</script>

<style lang="scss">
  @import "../../css/_prelude-patternfly.scss";

  $sidebar-content-width: 500px;
  $sidebar-width: 200px;
  $collapsed-sidebar-width: 55px;
  $sidebar-button-width: 32px;
  $title-bar-height: 70px;

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
    width: $sidebar-content-width;
    position: fixed;
    top: ($navbar-height + 80);
    left: (-$sidebar-content-width);
    min-height: 40px;
    z-index: 1050;
    xcolor: #fff;
    transition: all 0.3s;
    overflow-y: auto;
    overflow-x: hidden;
    background: ghostwhite;
    xpadding-left: $sidebar-button-width;
  }

  #sidebar.active {
    left: 0;
    box-shadow: 3px 3px 3px rgba(0, 0, 0, 0.2);
  }

  #sidebar .sidebar-content {
    width: ($sidebar-content-width - $sidebar-button-width);
    margin: 0;
  }

  #sidebar.active .sidebar-content {
    xdisplay: block;
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
    margin-right: 0;
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
    margin: $title-bar-height 25px 0 0;
    padding: 3px 5px;
    transition: all 0.3s;
    width: 100%;
    height: 100%;
  }

  .expanded-card-view {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
  }

  img.entity-type-icon {
    margin: 0 5px 0 0;
    padding: 0;
    height: 40px;
  }

  .nav-pf-vertical li.list-group-item {
    margin: 0;
    padding: 0;
  }

  .nav-pf-vertical li.list-group-item > a {
    margin: 0;
    padding: 3px 0 0 8px;
    height: 45px;
  }

  .nav-pf-vertical li.list-group-item.list-group-item-node {
    background: black;
  }

  .nav-pf-vertical li.list-group-item.list-group-item-node > a {
    text-transform: uppercase;
    vertical-align: bottom;
    height: 35px;
  }

  .nav-pf-vertical li.list-group-item.list-group-item-node img.entity-type-icon {
    margin: 0;
    height: 32px;
  }

  .nav-pf-vertical li.list-group-item.list-group-item-squat {
  }

  .nav-pf-vertical li.list-group-item.list-group-item-squat > a {
    padding: 0;
  }

  .nav-pf-vertical li.list-group-item.list-group-item-squat > a .list-group-item-value {
    padding: 2px 2px;
  }

  .nav-pf-vertical li.list-group-item.list-group-item-squat > a {
    height: 35px;
  }

  .nav-pf-vertical li.list-group-item.list-group-item-squat > a > i {
    margin: 5px 0 0 5px;
  }

  .nav-pf-vertical li.list-group-item > a .list-group-item-value {
    margin: 2px 0 0 5px;
  }

  .node-container .node-title {
    background: #4B4B4B;
    color: white;
  }

  .node-container .node-description {
    margin: 5px 0;
    padding: 5px;
    border: 1px solid lightgray;
    line-height: 1.15em;
  }

  .wrapper {
    display: flex;
    align-items: stretch;
    min-height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
  }

  div.container-cards-pf.container-pf-nav-pf-vertical {
    padding: 0;
    margin: $navbar-height 0 0 0;
  }

  div.panel.panel-default {
    margin-bottom: 0;
  }

  .nav-pf-vertical {
    top: ($navbar-height + 6);
    z-index: 1000;
  }

  div.container-fluid.container-cards-pf.container-pf-nav-pf-vertical {
  }

  div.container-fluid.container-cards-pf.container-pf-nav-pf-vertical .cards-pf {
    margin: 0 5px 0 0;
  }

  .title-bar {
    border-bottom: 1px solid lightgray;
    background: aliceblue;
    position: fixed;
    height: $title-bar-height;
    max-height: $title-bar-height;
    overflow-y: auto;
    xfont-size: 1.0em;
    line-height: 1.1em;
    top: ($navbar-height + 6);
    left: $sidebar-width;
    right: 0;
    padding: 5px 10px;
    z-index: 1;
  }

  .title-bar .synonym {
    border: 1px solid lightgray;
    padding: 0 5px;
    font-size: 0.9em;
  }

  table.fake-table-view {
    border: 1px solid black;
    width: 100%;
    height: 100%;
    margin: 0;
  }

  table.fake-table-view th,
  table.fake-table-view td {
    border: 1px solid lightgray;
    padding: 3px;
  }

  .btn-sidebar {
    border: 1px solid red;
  }

  @media (max-width: $grid-float-breakpoint) {
    .node-container {
      margin-left: 0;
    }

    .nav-pf-vertical {
      width: $collapsed-sidebar-width;
    }

    .nav-pf-vertical li.list-group-item > a .list-group-item-value {
      display: none;
    }

    div.container-fluid.container-cards-pf.container-pf-nav-pf-vertical {
      margin-left: $collapsed-sidebar-width;
    }

    .title-bar {
      left: $collapsed-sidebar-width;
    }
  }

</style>
