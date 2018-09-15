<template>
<!-- eslint-disable vue/html-indent -->

<div id="selenium_id_content">

<node-sidebar
  v-if="node"
  ref="sidebar"
  :node-type="nodeType"
  :node-label="nodeLabel"
  :expanded-card="expandedCard"
  :available-cards="availableCards"
  :cards-to-display="nonEmptyCards"
  :card-counts="counts"
  :parent-node="node"
  :parent-node-id="nodeId"
  :facet-object="facetObject"
  :is-neighborhood="isNeighborhood"
  :subclasses="subclasses"
  :superclasses="superclasses"
  @expand-card="expandCard"
  @toggle-neighborhood="toggleNeighborhood"
  />

<div class="container-cards">
<div class="wrapper">

  <div
    class="overlay"
    :class="{ active: isNeighborhood }"
    @click="toggleNeighborhood()">
  </div>

  <div
    class="container-fluid title-bar">
    <div
      v-if="!node">
      <div
        v-if="nodeError">
        <sm>
          <h6>
            Error loading {{ labels[nodeType] }}: {{ nodeId }}
          </h6>
          <pre
            class="pre-scrollable">{{ nodeError }}</pre>
        </sm>
      </div>
      <div
        v-else>
        <h5 class="text-center">Loading Data for {{ labels[nodeType] }}: {{ nodeId }}</h5>
      </div>
    </div>

    <div
      v-else>
      <div
        class="node-label">
        <span
          class="node-label-label">
          {{ nodeLabel }}
        </span>
        <a
          :href="node.iri"
          target="_blank"
          class="node-label-id">
          {{ node.id }}
        </a>
      </div>

      <div
        class="node-synonyms">
        <span
          class="synonym"
          v-for="s in synonyms"
          :key="s"
        >
          {{ s.val }}
        </span>
      </div>
    </div>
  </div>

  <div
    v-if="node"
    class="container-fluid node-container">

    <div
      v-if="nodeDebug"
      class="row node-content-section">
      <div class="col-12">
        <pre>{{ nodeDebug }}</pre>
      </div>
    </div>

    <div
      v-if="!expandedCard && nodeDefinition"
      class="row node-content-section">
      <div class="col-12">
        <div class="node-description">
          {{ nodeDefinition }}
        </div>
      </div>

      <div
        class="col-12 pt-2">
        <b>References:</b>&nbsp;
        <span
          v-for="r in xrefs"
          :key="r">
          <router-link
            v-if="r.url.indexOf('/') === 0"
            :to="r.url">
            {{ r.label }}
          </router-link>

          <a
            v-else-if="r.url && r.blank"
            :href="r.url"
            target="_blank">
            {{ r.label }}
          </a>
          <a
            v-else-if="r.url"
            :href="r.url">
            {{ r.label }}
          </a>

          <span
            v-else>
            {{ r.label }}
          </span>
        </span>
      </div>

      <div class="col-12">
        <span
          v-if="inheritance">
          <b>Heritability:</b>&nbsp;{{ inheritance }}
        </span>
      </div>

      <div class="col-12">
        <b>Equivalent IDs:</b>&nbsp;

        <span
          v-for="r in equivalentClasses"
          :key="r">
          <router-link
            v-if="r.id"
            :to="'/resolve/' + r.id">
            {{ r.label || r.id }}
          </router-link>

          <span
            v-else>
            {{ r.label }}
          </span>
        </span>
      </div>

    </div>

    <div
      v-if="!expandedCard"
      class="row node-cards-section">
      <node-card
        v-for="cardType in nonEmptyCards"
        :key="cardType"
        :card-type="cardType"
        :card-count="counts[cardType]"
        :parent-node="node"
        :parent-node-id="nodeId"
        @expand-card="expandCard(cardType)">
      </node-card>
    </div>
    <div
      v-if="!expandedCard && hasExacGene"
      class="row">
      <exac-gene
        :node-id="nodeId"/>
    </div>
    <div
      v-if="expandedCard"
      class="expanded-card-view col-12">
      <assoc-table
              :facets="facetObject"
              :node-type="nodeCategory"
              :card-type="expandedCard"
              :identifier="nodeId"
      >
      </assoc-table>
    </div>
    <div v-if="!expandedCard && nodeCategory === 'variant'">
      <exac-variant
        :node-id="nodeId"/>
    </div>
  </div>
</div>
</div>
</div>
</template>

<script>

import _ from 'underscore';
import * as MA from 'monarchAccess';


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
  anatomy: require('../assets/img/icon-anatomy.png'),
  cellline: require('../assets/img/icon-anatomy.png'),
  disease: require('../assets/img/icon-diseases.png'),
  function: require('../assets/img/icon-anatomy.png'),
  gene: require('../assets/img/icon-genes.png'),
  genotype: require('../assets/img/icon-anatomy.png'),
  homolog: require('../assets/img/icon-anatomy.png'),
  interaction: require('../assets/img/icon-anatomy.png'),
  literature: require('../assets/img/icon-anatomy.png'),
  model: require('../assets/img/icon-models.png'),
  'ortholog-disease': require('../assets/img/icon-anatomy.png'),
  'ortholog-phenotype': require('../assets/img/icon-anatomy.png'),
  pathway: require('../assets/img/icon-anatomy.png'),
  phenotype: require('../assets/img/icon-phenotypes.png'),
  variant: require('../assets/img/icon-genes.png'),
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
    $route(to, _from) {
      // Only fetchData if the path is different.
      // hash changes are currently handled by monarch-tabs.js
      // within the loaded MonarchLegacy component.

      if (to.path !== this.path) {
        this.fetchData();
      }
    }
  },

  /* eslint quote-props: 0 */
  data() {
    return {
      isNeighborhood: false,
      facetObject: {
        species: {
          'Anolis carolinensis': true,
          'Arabidopsis thaliana': true,
          'Bos taurus': true,
          'Caenorhabditis elegans': true,
          'Danio rerio': true,
          'Drosophila melanogaster': true,
          'Equus caballus': true,
          'Gallus gallus': true,
          'Homo sapiens': true,
          'Macaca mulatta': true,
          'Monodelphis domestica': true,
          'Mus musculus': true,
          'Ornithorhynchus anatinus': true,
          'Pan troglodytes': true,
          'Rattus norvegicus': true,
          'Saccharomyces cerevisiae S288C': true,
          'Sus scrofa': true,
          'Xenopus (Silurana) tropicalis': true,
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
      nodeDebug: null,
      nodeDefinition: null,
      nodeLabel: null,
      nodeIcon: null,
      nodeCategory: null,
      availableCards: availableCardTypes,
      nonEmptyCards: [],
      expandedCard: null,
      hasExacGene: false,
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
      this.$router.replace({ hash: cardType });
      this.expandedCard = cardType;
    },

    toggleNeighborhood() {
      this.isNeighborhood = !this.isNeighborhood;
    },

    generateDefinitionText(nodeType, node) {
      let result = node.description;

      if (nodeType === 'gene') {
        result = 'MYGENEFIXME';
      }

      return result;
    },

    // TIP/QUESTION: This applyResponse is called asynchronously via the function
    // fetchData when it's promise is fulfilled. We (as VueJS newbies) aren't
    // yet certain how this fits into the Vue lifecycle and we may eventually
    // need to apply $nextTick() to deal with this. Keep an eye out for UI fields
    // not updating or having undefined values.
    //
    applyResponse(response) {
      // console.log('applyResponse', response);
      const that = this;
      this.node = response;
      // this.nodeDebug = JSON.stringify(response, null, 2);

      const neighborhood = MA.getNeighborhoodFromResponse(response);
      const nodeLabelMap = neighborhood.nodeLabelMap;
      const equivalentClasses = neighborhood.equivalentClasses;
      const superclasses = neighborhood.superclasses;
      const subclasses = neighborhood.subclasses;

      this.superclasses = _.map(_.uniq(superclasses), c => {
        return {
          id: c,
          label: nodeLabelMap[c]
        };
      });
      this.subclasses = _.map(_.uniq(subclasses), c => {
        return {
          id: c,
          label: nodeLabelMap[c]
        };
      });
      this.equivalentClasses = _.map(_.uniq(equivalentClasses), c => {
        return {
          id: c,
          label: nodeLabelMap[c]
        };
      });
      // console.log('superclasses', this.superclasses);
      // console.log('subclasses', this.subclasses);
      // console.log('equivalentClasses', this.equivalentClasses);


      this.synonyms = this.node.synonyms;
      this.xrefs = this.node.xrefs;
      this.inheritance = this.node.inheritance ? this.node.inheritance[0] : null;
      this.nodeDefinition = this.generateDefinitionText(this.nodeType, this.node);
      this.nodeLabel = this.node.label;
      this.nodeCategory = this.node.categories ?
        this.node.categories[0].toLowerCase() :
        this.nodeType;
      this.nodeIcon = this.icons[this.nodeCategory];
      this.phenotypeIcon = this.icons.phenotype;
      this.geneIcon = this.icons.gene;
      this.modelIcon = this.icons.model;
      this.hasExacGene = (this.nodeType === 'gene' || this.nodeType === 'variant');

      const nonEmptyCards = [];
      this.availableCards.forEach(cardType => {
        const count = that.node.counts[cardType];
        that.counts[cardType] = count ? count.totalCount : 0;
        if (that.counts[cardType] > 0) {
          nonEmptyCards.push(cardType);
        }
      });
      this.nonEmptyCards = nonEmptyCards;

      const hash = this.$router.currentRoute.hash;
      if (hash.length > 1) {
        const cardType = hash.slice(1);
        this.$nextTick(_ => {
          this.expandCard(cardType);
        });
      }
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
      this.isNeighborhood = false;
      this.startProgress();

      try {
        let nodeResponse = await MA.getNodeSummary(this.nodeId, this.nodeType);

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
@import "monarchNGPrelude";

$sidebar-content-width: 500px;
$sidebar-width: 200px;
$collapsed-sidebar-width: 55px;
$sidebar-button-width: 32px;
$title-bar-height: 80px;
$line-height-compact: 1.3em;

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
  xborder-color: #030303;
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
  xbackground: black;
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


.node-container .node-description {
  margin: 0;
  padding: 0;
  line-height: $line-height-compact;
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
  background: $monarch-bg-color;
  border-right: 1px solid #292e34;
  bottom: 0;
  left: 0;
  overflow-x: hidden;
  overflow-y: auto;
  position: fixed;
  width: $sidebar-width;
  top: ($navbar-height);
  z-index: 1000;
}


div.container-cards {
  width: unset;
  padding: 0;
  margin: $navbar-height 0 0 $sidebar-width;
}

div.container-cards .node-content-section {
  line-height: $line-height-compact;
}

div.container-cards .node-cards-section {
  margin-top: 10px;
}


.title-bar {
  border-bottom:1px solid lightgray;
  background: aliceblue;
  position: fixed;
  height: $title-bar-height;
  max-height: $title-bar-height;
  overflow-y: auto;
  xfont-size: 1.0em;
  line-height: $line-height-compact;
  top: ($navbar-height);
  left: 0;
  right: 222px;
  padding: 5px;
  padding-left: ($sidebar-width + 5);
  margin: 0;
  z-index: 1;
}

.title-bar .node-synonyms {
  line-height: $line-height-compact;
}

.title-bar .synonym {
  padding: 2px 10px 1px 2px;
  font-size: 0.9em;
  background: white;
}

.title-bar .node-label {
  margin: 2px 5px 5px 2px;
}

.title-bar .node-label-label {
  font-size: 1.8em;
  font-weight: 500;
}

.title-bar .node-label-id {
}

.title-bar .node-label-iri {
  border:1px solid gray;
  padding:5px;
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

@media (max-width: $grid-float-breakpoint) {
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
    padding-left: ($collapsed-sidebar-width + 5);
  }

}

</style>
