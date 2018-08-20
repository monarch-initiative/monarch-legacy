<template>
<!-- eslint-disable vue/html-indent -->
<div>

  <nav
    id="sidebar"
    :class="{ active: isNeighborhood }">
    <div class="sidebar-content">
      <div
        class="row superclass"
        v-for="c in superclasses"
        :key="c">
        <div class="col-12">
          <router-link
            :to="'/' + nodeType + '/' + c.id">
            {{ c.label }}
          </router-link>
        </div>
      </div>

      <div class="row currentclass">
        <div class="col-12">
          {{ nodeLabel }}
        </div>
      </div>

      <div
        class="row subclass"
        v-for="c in subclasses"
        :key="c">
        <div class="col-12">
          <router-link
            :to="'/' + nodeType + '/' + c.id">
            {{ c.label }}
          </router-link>
        </div>
      </div>
    </div>
  </nav>

  <div class="nav-sidebar-vertical">
    <ul
      class="list-group"
      v-if="nodeType">
      <li class="list-group-item list-group-item-node">
        <a
          target="_blank"
          :href="debugServerName + $route.path">
          <img
            class="entity-type-icon"
            :src="$parent.icons[nodeType]"/>
          <span class="list-group-item-value">{{ $parent.labels[nodeType] }}</span>
        </a>
        <a
          class="debug-link-to-alpha"
          target="_blank"
          :href="'http://alpha.monarchinitiative.org' + $route.path">
        </a>
      </li>

      <li class="list-group-item list-group-item-squat">
        <a
          @click="toggleNeighborhood()"
          href="#">
          <i class="fa fa-2x fa-crosshairs"></i>
          <span class="list-group-item-value">Neighbors</span>
        </a>
      </li>

      <li class="list-group-item list-group-item-squat"
        :class="{ active: !expandedCard }">
        <a
          @click="expandCard(null)"
          href="#">
          <i class="fa fa-2x fa-th-large"></i>
          <span class="list-group-item-value">Overview</span>
        </a>
      </li>

      <li class="list-group-item"
        :class="{ active: expandedCard === cardType }"
        v-for="cardType in cardsToDisplay"
        :key="cardType">
        <a
          :href="'#' + cardType"
          @click="expandCard(cardType)">
          <img class="entity-type-icon" :src="$parent.icons[cardType]"/>
          <span class="list-group-item-value">{{$parent.labels[cardType]}} ({{cardCounts[cardType]}})</span>
        </a>
      </li>
      <li
        class="node-filter-section">
        <h5>Species</h5>

        <assoc-facets
          v-model="facetObject.species"/>
      </li>
    </ul>
</div>

</div>
</template>

<script>


export default {
  name: 'NodeSidebar',
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
  },

  /* eslint vue/require-default-prop: 0 */
  props: {
    cardsToDisplay: Array,
    expandedCard: String,
    cardCounts: Object,
    nodeType: String,
    nodeLabel: String,
    superclasses: Array,
    subclasses: Array,
    facetObject: Object,
    isNeighborhood: Boolean
  },

  data() {
    return {
      debugServerName:
        (
          (window.serverConfiguration.app_base.length > 0) ?
            window.serverConfiguration.app_base :
            'https://beta.monarchinitiative.org'
        )
    };
  },


  methods: {
    expandCard(cardType) {
      this.$emit('expand-card', cardType);
    },

    toggleNeighborhood() {
      // this.isNeighborhood = !this.isNeighborhood;
      this.$emit('toggle-neighborhood');
    },
  }
};

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

.nav-sidebar-vertical .node-filter-section {
  padding: 0;
  margin-top: 6px;
  height: 250px;
  overflow-y: scroll;
  color: white;
}

.nav-sidebar-vertical .node-filter-section h5 {
  margin-left:10px;
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
}

.nav-sidebar-vertical li.list-group-item.list-group-item-node .debug-link-to-alpha {
  padding:0;
  height:0;
  width:100%;
  border:2px solid $monarch-bg-color;
}

.nav-sidebar-vertical li.list-group-item.list-group-item-node > a {
  text-transform: uppercase;
  vertical-align: bottom;
  height: 28px;
}

.nav-sidebar-vertical li.list-group-item.list-group-item-node img.entity-type-icon {
  margin: 0;
  height: 26px;
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


@media (max-width: $grid-float-breakpoint) {
  .nav-sidebar-vertical {
    width: $collapsed-sidebar-width;
  }

  .nav-sidebar-vertical li.list-group-item > a .list-group-item-value {
    display: none;
  }

  .nav-sidebar-vertical li.node-filter-section {
    display: none;
  }
}

</style>

