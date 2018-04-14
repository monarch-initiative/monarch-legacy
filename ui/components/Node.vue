<template>
<div id="selenium_id_content">

<div>
  <div class="nav-sidebar-vertical">
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
      <li
        class="node-filter-section">
        <h5>Species</h5>
        <assoc-facets
          v-model="facetObject.species">
        </assoc-facets>
      </li>
    </ul>

  </div>

</div>


<div class="container-cards">
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
    class="container-fluid title-bar">
    <div
      v-if="!node">
      <div
        v-if="nodeError">
        <sm>
          <h6>
            Error loading {{labels[nodeType]}}: {{nodeId}}
          </h6>
          <pre
            class="pre-scrollable">{{nodeError}}</pre>
        </sm>
      </div>
      <div
        v-else>
        <h5 class="text-center">Loading Data for {{labels[nodeType]}}: {{nodeId}}</h5>
      </div>
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
      class="node-content-section">
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
      class="node-content-section">
      <div
        class="row">
        <node-card
          v-for="cardType in nonEmptyCards"
          :key="cardType"
          class="col-4"
          :card-type="cardType"
          :card-count="counts[cardType]"
          :parent-node="node"
          :parent-node-id="nodeId"
          v-on:expandCard="expandCard(cardType)">
        </node-card>
      </div>
    </div>
    <div v-if="!expandedCard">
      <exac-gene :nodeID="nodeId"></exac-gene>
    </div>
    <div
      v-if="expandedCard"
      class="expanded-card-view">
      <h3 class="text-center">{{labels[expandedCard]}} Associations</h3>
      <table-view
              :facets="facetObject"
              :nodeType="nodeCategory"
              :cardType="expandedCard"
              :identifier="nodeId">
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


</div>
</div>
</template>

<script>

import _ from 'underscore';
import TableView from "./TableView.vue";
import * as MA from '../../js/MonarchAccess';


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
    // console.log('created', this.nodeId);
  },

  updated() {
    // console.log('updated', this.nodeId);
  },

  destroyed() {
    // console.log('destroyed', this.nodeId);
  },

  mounted() {
    this.fetchData();
  },
  watch: {
    '$route' (to, from) {
      // Only fetchData if the path is different.
      // hash changes are currently handled by monarch-tabs.js
      // within the loaded MonarchLegacy component.

      if (to.path !== this.path) {
        this.fetchData();
      }
    }
  },
  data () {
    return {
      facetObject: {
          species: {
              human: true,
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
      nodeError: null,
      equivalentClasses: null,
      superclasses: null,
      subclasses: null,
      synonyms: null,
      inheritance: null,
      contentScript: '',
      contentBody: '',
      progressTimer: null,
      path: null,
      icons: icons,
      labels: labels,
      nodeId: null,
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
    }
  },


  methods: {
    expandCard(cardType) {
      this.expandedCard = cardType;
    },

    toggleSidebar() {
      this.isActive = !this.isActive;
    },

    // TIP/QUESTION: This applyResponse is called asynchronously via the function
    // fetchData when it's promise is fulfilled. We (as VueJS newbies) aren't
    // yet certain how this fits into the Vue lifecycle and we may eventually
    // need to apply $nextTick() to deal with this. Keep an eye out for UI fields
    // not updating or having undefined values.
    //
    applyResponse(content) {
      var that = this;
      this.node = content;
      // console.log('applyResponse', this.node);

      var equivalentClasses = [];
      var superclasses = [];
      var subclasses = [];
      if (this.node.relationships) {
        this.node.relationships.forEach(relationship => {
          if (relationship.property.id === 'subClassOf') {
            if (relationship.subject.id === this.nodeId) {
              superclasses.push(relationship.object);
            }
            else if (relationship.object.id === this.nodeId) {
              subclasses.push(relationship.subject);
            }
            else {
              console.log('applyResponse ERROR', relationship);
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


    startProgress() {
      const that = this;
      if (that.progressTimer) {
        console.log('startProgress.... leftover progressTimer');
      }
      else {
        that.progressTimer = setTimeout(function timeout() {
          that.progressTimer = null;
        }, 500);
      }
    },


    clearProgress() {
      const that = this;
      that.$nextTick(function() {
        if (that.progressTimer) {
          clearTimeout(that.progressTimer);
          that.progressTimer = null;
        }
      });
    },


    async fetchData() {
      const that = this;
      const path = that.$route.fullPath;

      this.path = that.$route.path;
      this.nodeId = this.$route.params.id;
      this.nodeType = this.path.split('/')[1];

      // TIP: setup the pre-fetch state, waiting for the async result
      this.node = null;
      this.nodeError = null;
      this.expandedCard = null;
      this.nonEmptyCards = [];
      this.isActive = false;
      this.startProgress();

      try {
        let nodeResponse = await MA.getNodeSummary(this.nodeId, this.nodeType);
        // console.log('nodeResponse', nodeResponse);
        // TIP: We got a result, apply it to the Vue model
        that.applyResponse(nodeResponse);
        that.clearProgress();
      }
      catch (e) {
        console.log('nodeResponse ERROR', e, that);
        that.nodeError = e;
        that.clearProgress();
      }

      // TIP: Don't put anything useful here, because this will execute BEFORE
      // the async operation has even been queued and before it has returned
      // a useful result or error.
    },
  }
}

</script>

<style lang="scss">
@import "../../css/_prelude-ng.scss";

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
  left: 10px;
  box-shadow: 3px 3px 3px rgba(0, 0, 0, 0.2);
}


#sidebar .sidebar-content {
  width: ($sidebar-content-width - $sidebar-button-width);
  margin: 0;
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
  margin: $title-bar-height 5px 5px 5px;
  padding: 3px 5px;
  transition: all 0.3s;
  width: 100%;
  height:100%;
}

.expanded-card-view {
  margin:0;
  padding:0;
  width:100%;
  height:100%;
}

.nav-sidebar-vertical li.list-group-item {
  margin: 0;
  padding: 0;
  background-color: transparent;
  border-color: #030303;
}

.nav-sidebar-vertical li.list-group-item > a {
  background-color: transparent;
  color: #d1d1d1;
  cursor: pointer;
  display: block;
  font-size: 16px;
  font-weight: 400;
  height: 63px;
  line-height: 26px;
  padding: 17px 20px 17px 25px;
  position: relative;
  white-space: nowrap;
  width: $sidebar-width;
  text-decoration: none;
  margin: 0;
  padding: 2px 0 0 6px;
  height: 35px;
}


.nav-sidebar-vertical li.list-group-item > a:hover {
  color: #fff;
  font-weight: 600
}



.nav-sidebar-vertical li.list-group-item.active > a {
  background-color: #393f44;
  color: #fff;
  font-weight: 600
}

.nav-sidebar-vertical li.list-group-item.active > a:before {
  background: #39a5dc;
  content: " ";
  height: 100%;
  left: 0;
  position: absolute;
  top: 0;
  width: 3px;
}

.nav-sidebar-vertical li.list-group-item > a img.entity-type-icon {
  margin: 0 5px;
  padding: 0;
  height: 30px;
}



.nav-sidebar-vertical li.list-group-item.list-group-item-node {
  background: black;
}

.nav-sidebar-vertical li.list-group-item.list-group-item-node > a {
  text-transform: uppercase;
  vertical-align: bottom;
  height: 30px;
}

.nav-sidebar-vertical li.list-group-item.list-group-item-node img.entity-type-icon {
  margin: 0;
  height: 28px;
}


.nav-sidebar-vertical li.list-group-item.list-group-item-squat {
}

.nav-sidebar-vertical li.list-group-item.list-group-item-squat > a {
  padding: 0;
}

.nav-sidebar-vertical li.list-group-item.list-group-item-squat > a i.fa {
  margin: 2px 8px 0 12px;
  padding: 0;
}

.nav-sidebar-vertical li.list-group-item.list-group-item-squat > a .list-group-item-value {
  padding: 0;
  vertical-align:text-bottom;
}


.nav-sidebar-vertical li.list-group-item.list-group-item-squat > a {
  height: 35px;
}

.nav-sidebar-vertical li.list-group-item.list-group-item-squat > a > i {
  margin: 5px 0 0 5px;
}

.nav-sidebar-vertical li.list-group-item > a .list-group-item-value {
  margin: 2px 0 0 5px;
}


.node-container .node-title {
  background: #4B4B4B;
  color: white;
}

.node-container .node-description {
  margin: 5px 0;
  padding: 5px;
  border:1px solid lightgray;
  line-height: 1.15em;
}

.wrapper {
  display: flex;
  align-items: stretch;
  min-height: 100%;
  width: 100%;
  margin: 0;
  padding: 5px;
}


div.panel.panel-default {
  margin-bottom: 0;
}

.nav-sidebar-vertical {
  background: #292e34;
  border-right: 1px solid #292e34;
  bottom: 0;
  left: 0;
  overflow-x: hidden;
  overflow-y: auto;
  position: fixed;
  width: $sidebar-width;
  top: ($navbar-height + 6);
  z-index: 1000;
}



div.container-cards {
  width: unset;
  padding: 0;
  margin: $navbar-height 0 0 $sidebar-width;
}

div.container-cards .node-content-section {
  margin: 0;
}

.title-bar {
  border-bottom:1px solid lightgray;
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
  border:1px solid lightgray;
  padding: 0 5px;
  font-size: 0.9em;
}

table.fake-table-view {
  border:1px solid black;
  width: 100%;
  height: 100%;
  margin: 0;
}

table.fake-table-view th,
table.fake-table-view td
{
  border:1px solid lightgray;
  padding: 3px;
}

.btn-sidebar {
  border:1px solid red;
}

li.node-filter-section {
  margin: 0;
  padding: 0 0 0 10px;
  background: white;
}

@media (max-width: $grid-float-breakpoint) {
  .node-container {
    margin-left: 0;
  }

  .nav-sidebar-vertical {
    width: $collapsed-sidebar-width;
  }

  .nav-sidebar-vertical li.list-group-item > a .list-group-item-value {
    display: none;
  }

  div.container-cards {
    margin-left: $collapsed-sidebar-width;
  }

  .title-bar {
    left: $collapsed-sidebar-width;
  }
}

</style>
