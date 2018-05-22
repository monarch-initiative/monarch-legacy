<template>
<div id="selenium_id_content">
  <div
    id="monarch-home-container"
    class="container-fluid monarch-container">

  <header class="intro">
    <div class="intro-body">
      <div class="container">
        <div class="row">
          <div class="col-md-8 offset-md-2">

            <h1 class="brand-heading">
              <img
                class="center-block text-center img-fluid"
                style="max-height:150px;"
                src="../assets/images/monarch-logo-white-stacked.png"/>
            </h1>

            <p class="intro-text">
              Advancing translational science by semantically integrating biological information across species.
            </p>
            <monarch-autocomplete homeSearch="true">
            </monarch-autocomplete>
            <!--<p class="search-examples-text">-->
              <!--Examples: <i>Marfan Syndrome</i> <i>sox3</i>-->
            <!--</p>-->

            <a href="#footer-fake" class="btn btn-circle page-scroll">
              <i class="fa fa-angle-double-down animated"></i>
            </a>

          </div>
        </div>
      </div>
    </div>
  </header>

<!--
  <section>
    id="search"
    class="container search-section text-center">
    <div class="container">

      <div class="row">
        <div class="col-xs-12">

          <form
            id="home_search_form"
            class="searchspace"
            action="/search"
            role="search">
            <div class="input-group">
              <span class="input-group-addon" id="sizing-addon1">
              <i class="fa fa-search fa-fw"></i>
              </span>
              <input
                autofocus
                id="home_search" type="text" class="form-control" placeholder="Search for...">

              <span class="input-group-btn">
              <button class="btn btn-default" type="button">Search</button>
              </span>


            </div>
          </form>

        </div>
      </div>

    </div>
  </section>
 -->


  <section id="about" class="container content-section text-center">
    <div class="row">
      <div class="col-lg-8 offset-lg-2">
        <h2>The Monarch Initiative</h2>
        <p>Our philosophy is based on the premise that we want to make all the data count. Monarch isn’t just another database that slurps data from the typical places and renders it in a different format. We are driven to truly integrate biological information using semantics, and present it in a novel way, leveraging phenotypes to bridge the knowledge gap.</p>
      </div>
    </div>
  </section>



  <section id="features" class="content-section text-center">
    <div class="features-section">
      <div class="container-fluid">
        <div class="col-sm">
          <h2>What We Do</h2>
          <ul style="list-style-type:none;">
            <li>Integrate, align, and re-distribute cross-species gene, genotype, variant, disease, and phenotype data.</li>
            <li>Provide a portal for exploration of phenotype-based similarity.</li>
            <li>Facilitate identification of animal models of human disease through phenotypic similarity.</li>
            <li>Enable quantitative comparison of cross-species phenotypes.</li>
            <li>Develop embeddable widgets for data exploration.</li>
            <li>Influence genotype and phenotype reporting standards.</li>
            <li>Improve ontologies to better curate genotype-phenotype data.</li>
          </ul>

          <router-link to="/page/about" class="btn btn-default btn-lg">
            <span>Learn More</span>
          </router-link>

        </div>
      </div>
    </div>
  </section>

  <section class="news-section text-center">
    <div class="container-fluid">
      <div class="row">
        <div class="col-sm">
          <h4>Recent Blog Posts</h4>
          <ul class="list-inline">
            <li>
              <a href="https://medium.com/@MonarchInit/exomiser-10-faster-leaner-better-c988650488be"> 
              March 22, 2018: <b> Exomiser 10: Faster, Leaner, Better</b>
              </a>
            </li>
            <li>
              <a href="https://medium.com/@MonarchInit/tailoring-the-nci-thesaurus-for-semantic-interoperability-21305ccfe3a6">
              March 2, 2018: <b>Tailoring the NCI Thesaurus...</b>
              </a>
            </li>
            <li>
              <a href="https://medium.com/@MonarchInit/rare-disease-day-2018-a5b7e72df57b">
              Feb 28, 2018: <b>Rare Disease Day 2018</b>
              </a>
            </li>
          </ul>
          <h4>Upcoming Events</h4>
          <ul class="list-inline">
            <li>
              <a href="http://icbo2018.cgrb.oregonstate.edu/"> 
              ICBO Conference, Aug 7, 2018
              </a>
            </li>
          </ul>
          <div style="padding: 0 0 15px 0;">
            <a class="btn btn-dark" target="_blank" href="https://medium.com/@MonarchInit" role="button">Read More</a>
          </div>
        </div>
        <div class="col-sm">
          <div>
            <div class="card-body news-list">
              <a class="twitter-timeline"
                href="https://twitter.com/search?q=%40MonarchInit+OR+%40hp_ontology+OR+%40GA4GH+OR+%40UDNconnect"
                data-widget-id="527567015918051328"
                xdata-theme="dark"
                xdata-tweet-limit="1"
                data-preview=""
                height="220"
                width="320">
                Loading Tweets about "@MonarchInit OR @hp_ontology OR @GA4GH OR @UDNconnect"
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="content-section text-center">
    <div class="features-section">
      <h4 class="text-center" style="margin: 10px; padding: 0px 0px 25px 0px;"> The Monarch Initiative is a collaboration between: </h4>
      <div class="container">
        <div class="row">
          <div class="col-6 col-md-3">
            <div class="media">
              <a target="_blank" href="https://www.charite.de/en/"><span class="network-name"></span>
              <img class="mr-3"
              style="max-height:35px;"
              src="../assets/images/team-charite.png"
              alt="Charite">
              </a>
            </div>
          </div>
          <div class="col-6 col-md-3">  
            <div class="media">
              <a target="_blank" href="https://www.garvan.org.au/"><span class="network-name"></span>
              <img class="mr-3"
              style="max-height:35px;"
              src="../assets/images/team-garvan.png"
              alt="Garvan">
              </a>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="media">
              <a target="_blank" href="https://www.jax.org/"><span class="network-name"></span>
              <img class="mr-3"
              style="max-height:35px;"
              src="../assets/images/team-jackson.png"
              alt="Jax">
              </a>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="media">
              <a target="_blank" href="http://www.lbl.gov/"><span class="network-name"></span>
              <img class="mr-3"
              style="max-height:25px;"
              src="../assets/images/team-lbnl.jpeg"
              alt="LBNL">
              </a>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="media">
              <a target="_blank" href="https://www.ohsu.edu/"><span class="network-name"></span>
              <img class="mr-3"
              style="max-height:35px;"
              src="../assets/images/team-ohsu.gif"
              alt="OHSU">
              </a>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="media">
              <a target="_blank" href="http://www.smd.qmul.ac.uk/"><span class="network-name"></span>
              <img class="mr-3"
              style="max-height:35px;"
              src="../assets/images/team-qmul.png"
              alt="QMUL">
              </a>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="media">
              <a target="_blank" href="http://renci.org/"><span class="network-name"></span>
              <img class="mr-3"
              style="max-height:35px;"
              src="../assets/images/team-renci.png"
              alt="RENCI">
              </a>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="media">
              <a target="_blank" href="http://www.sanger.ac.uk/"><span class="network-name"></span>
              <img class="mr-3"
              style="max-height:35px;"
              src="../assets/images/team-sanger.png"
              alt="Sanger">
              </a>
            </div>
          </div>
        </div>
      </div>
      <div style="padding: 25px 15px 0px 15px;">
        Monarch is supported generously by a NIH Office of the Director Grant #5R24OD011883,
        as well as by NIH-UDP: HHSN268201350036C, HHSN268201400093P, NCI/Leidos #15X143.
        We are grateful to the many <a target="_blank" href="/about/sources">original sources of our data</a> for allowing Monarch to integrate them in this way.
        Except where forbidden by the original sources, this work is licensed under a
        Creative Commons Attribution 3.0 License.
      </div>
    </div>
  </section>

  <home-footer>
  </home-footer>
</div>
</div>
</template>

<script>
export default {
  name: 'home',
  mounted() {
    this.$nextTick(_ => {
      navbar_search_init('home_search', 'home_search_form');
    });
  },
  data () {
    return {
    }
  },
}

// From https://dev.twitter.com/web/javascript/loading - 7/26/2015
!(function(d, s, id) {

  var js,
      fjs=d.getElementsByTagName(s)[0],
      p=/^http:/.test(d.location)?'http':'https';
  if(!d.getElementById(id)){
    js=d.createElement(s);
    js.id=id;
    js.src=p+"://platform.twitter.com/widgets.js";
    fjs.parentNode.insertBefore(js,fjs);
  }

  // https://twittercommunity.com/t/auto-expand-photos-always-on-for-embedded-timeline/62510/48

  var hideRecursive = false;
  var hideTweetMedia = function() {
    var container = jQuery("#twitter").find(".twitter-timeline").contents().find(".timeline-Tweet-media");
      container.css("display", "none");
      jQuery("#twitter").css("height", "100%");
      container.css("border", "3px solid red");
      if (!hideRecursive) {
        jQuery("#twitter").find(".twitter-timeline").contents().find(".timeline-TweetList").bind('DOMSubtreeModified propertychange',
          function() {
            hideTweetMedia(this);
            hideRecursive = true;
          }
        );
      }
  };
  hideTweetMedia();
  jQuery('#twitter').on('DOMSubtreeModified propertychange',"#twitter-widget-0", function() {
      hideTweetMedia();
  });
}(document, "script", "twitter-wjs"));

</script>



<style>
$home-primary: #42DCA3;


body {
  width: 100%;
  height: 100%;
  font-family: "Lora","Helvetica Neue",Helvetica,Arial,sans-serif;
  color: white;
  background-color: black;
}

html {
  width: 100%;
  height: 100%;
}

#monarch-home-container h1,
#monarch-home-container h2,
#monarch-home-container h3,
*/ COMMENT OUT #monarch-home-container h4, */
#monarch-home-container h5,
#monarch-home-container h6 {
  margin: 0 0 35px;
  text-transform: uppercase;
  font-family: "Montserrat","Helvetica Neue",Helvetica,Arial,sans-serif;
  font-weight: 700;
  letter-spacing: 1px;
}

#monarch-home-container p {
  margin: 0 0 25px;
  font-size: 18px;
  line-height: 1.5;
  @media(min-width:768px) {
    margin: 0 0 35px;
    font-size: 20px;
    line-height: 1.6;
  }
}

#monarch-home-container a {
  color: $home-primary;
  -webkit-transition: all .2s ease-in-out;
  -moz-transition: all .2s ease-in-out;
  transition: all .2s ease-in-out;
  &:hover,
  &:focus {
    text-decoration: none;
    color: darken($home-primary,20%);
  }
}

#monarch-home-container .light {
  font-weight: 400;
}

#monarch-home-container .intro .search-examples-text {
  background: lightgray;
  color: black;
  border:1px solid lightgray;
  font-size: 0.9em;
}

#monarch-home-container .intro {
  display: table;
  width: 100%;
  height: auto;
  padding: 50px 0;
  text-align: center;
  color: white;
  background: url(../assets/images/home-splash.png) no-repeat bottom center scroll;
  background-color: #434343;
  */ -webkit-background-size: cover;*/
  */ -moz-background-size: cover;*/
  */ background-size: cover;*/
  */ -o-background-size: cover;*/
  .intro-body {
    display: table-cell;
    vertical-align: middle;
    .brand-heading {
      font-size: 40px;
    }
    .intro-text {
      font-size: 18px;
    }
  }
  @media(min-width:768px) {
    height: 100%;
    padding: 0;
    .intro-body {
      .brand-heading {
        font-size: 100px;
      }
      .intro-text {
        font-size: 26px;
      }
    }
  }
}

#monarch-home-container .btn-circle {
  width: 70px;
  height: 70px;
  margin-top: 15px;
  padding: 7px 16px;
  border: 2px solid white;
  border-radius: 100% !important;
  font-size: 40px;
  color: white;
  background: transparent;
  -webkit-transition: background .3s ease-in-out;
  -moz-transition: background .3s ease-in-out;
  transition: background .3s ease-in-out;
  &:hover,
  &:focus {
    outline: none;
    color: white;
    background: rgba(white, 0.1);
  }
  i.animated {
    -webkit-transition-property: -webkit-transform;
    -webkit-transition-duration: 1s;
    -moz-transition-property: -moz-transform;
    -moz-transition-duration: 1s;
  }
  &:hover {
    i.animated {
      -webkit-animation-name: pulse;
      -moz-animation-name: pulse;
      -webkit-animation-duration: 1.5s;
      -moz-animation-duration: 1.5s;
      -webkit-animation-iteration-count: infinite;
      -moz-animation-iteration-count: infinite;
      -webkit-animation-timing-function: linear;
      -moz-animation-timing-function: linear;
    }
  }
}

@-webkit-keyframes pulse {
  from {
    -webkit-transform: scale(1);
    transform: scale(1);
  }

  50% {
    -webkit-transform: scale(1.2);
    transform: scale(1.2);
  }

  100% {
    -webkit-transform: scale(1);
    transform: scale(1);
  }
}

@-moz-keyframes pulse {
  from {
    -moz-transform: scale(1);
    transform: scale(1);
  }

  50% {
    -moz-transform: scale(1.2);
    transform: scale(1.2);
  }

  100% {
    -moz-transform: scale(1);
    transform: scale(1);
  }
}

#monarch-home-container .content-section {
  padding-top: 50px;
  font-size: 18px;
}

#monarch-home-container .news-section {
  padding-top: 50px;
  font-size: 18px;
}

#monarch-home-container .search-section {
  padding: 50px 10px;
}


#monarch-home-container .features-section {
  height: auto;
  width: 100%;
  padding: 50px 0;
  color: black;
  background-color: #E8E8E8;
  -webkit-background-size: cover;
  -moz-background-size: cover;
  background-size: cover;
  -o-background-size: cover;
}


#monarch-home-container .partners-section {
  padding: 50px 10px;
  background: #EBEBEB;
}


@media(min-width:767px) {
}

#monarch-home-container .btn {
  text-transform: uppercase;
  font-family: "Montserrat","Helvetica Neue",Helvetica,Arial,sans-serif;
  font-weight: 400;
  -webkit-transition: all .3s ease-in-out;
  -moz-transition: all .3s ease-in-out;
  transition: all .3s ease-in-out;
  /*border-radius: 0;*/
}

#monarch-home-container .btn-default {
  border: 1px solid $home-primary;
  color: $home-primary;
  background-color: transparent;
  &:hover,
  &:focus {
    border: 1px solid $home-primary;
    outline: none;
    color: black;
    background-color: $home-primary;
  }
}


#monarch-home-container ul.banner-social-buttons {
  margin-top: 0;
  @media(max-width:1199px) {
    margin-top: 15px;
  }
  @media(max-width:767px) {
    li {
      display: block;
      margin-bottom: 20px;
      padding: 0;
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

#monarch-home-container footer {
  padding: 50px 0;
  p {
    margin: 0;
  }
}

</style>
