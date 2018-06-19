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

          </div>
        </div>
      </div>
    </div>
  </header>

  <section id="about" class="container content-section text-center">
    <div class="row">
      <div class="col-lg-8 offset-lg-2">
        <h2>The Monarch Initiative</h2>
        <p>Our philosophy is based on the premise that we want to make all the data count. We are driven to truly integrate biological information using semantics, and present it in a novel way, leveraging phenotypes to bridge the knowledge gap.</p>
      </div>
    </div>
  </section>



  <section id="features" class="features-section text-center">
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

        <router-link to="/page/about" class="btn btn-dark">
          <span>Learn More</span>
        </router-link>

      </div>
    </div>
  </section>

  <section class="news-section text-center">
    <div class="container-fluid">
      <div class="row">
        <div class="col-sm">
          <h3>Recent Blog Posts</h3>
          <ul class="list-inline">
            <li>
              <a href="https://medium.com/@MonarchInit/curating-rare-disease-genes-an-interview-with-eleanor-williams-of-genomics-england-ad2a677de8a0">
              Feb 28, 2018: <b>Curating Rare Disease Genes...</b>
              </a>
            </li>
            <li>
              <a href="https://medium.com/@MonarchInit/exomiser-10-faster-leaner-better-c988650488be">
              March 22, 2018: <b>Exomiser 10: Faster, Leaner, Better</b>
              </a>
            </li>
            <li>
              <a href="https://medium.com/@MonarchInit/tailoring-the-nci-thesaurus-for-semantic-interoperability-21305ccfe3a6">
              March 2, 2018: <b>Tailoring the NCI Thesaurus...</b>
              </a>
            </li>
          </ul>
          <br>
          <h3>Upcoming Events</h3>
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
          <h3>Tweets about Monarch</h3>
            <a class="twitter-timeline"
              href="https://twitter.com/search?q=%40MonarchInit"
              data-widget-id="527567015918051328"
              data-preview=""
              data-chrome="noheader"
              data-height="250">
              Loading Tweets about "@MonarchInit"
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="data-dashboard text-center">
    <div class="container">
    <div class="row">
      <div class="col-sm">
        <i class="fa fa-child fa-fw" style="color: #15556A; font-size: 2em;"></i>
        <span class="network-name"><br><b>218,313</b><br>Disease-Phenotype Associations</span>
      </div>
      <div class="col-sm">
        <i class="fa fa-tint fa-fw" style="color: #15556A; font-size: 2em;"></i>
        <span class="network-name"><br><b>793,526</b><br>Gene-Phenotype Associations</span>
      </div>
      <div class="col-sm">
        <i class="fa fa-paw fa-fw" style="color: #15556A; font-size: 2em;"></i>
        <span class="network-name"><br><b>20,870</b><br>Model Associations</span>
      </div>
    </div>
    </div>
  </section>

  <section class="content-section text-center">
    <h4
      class="text-center"
      style="margin: 10px; padding: 0px 0px 25px 0px;">
      The Monarch Initiative is a collaboration between:
    </h4>
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
  </section>

  <footer class="footer">
    <home-footer>
    </home-footer>
  </footer>

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


<style lang="scss">
  @import "../../css/_prelude-ng.scss";
  $home-primary: pink;  // #42DCA3;


  #monarch-home-container h1,
  #monarch-home-container h2,
  #monarch-home-container h3,
  #monarch-home-container h4,
  #monarch-home-container h5,
  #monarch-home-container h6 {
    xmargin: 0 0 35px 0;
    xtext-transform: uppercase;
    xfont-family: "Montserrat","Helvetica Neue",Helvetica,Arial,sans-serif;
    xfont-weight: 700;
    xletter-spacing: 1px;
  }

  #monarch-home-container p {
    margin: 0 0 25px;
    font-size: 18px;
    line-height: 1.5;
    @media(min-width:$grid-float-breakpoint) {
      margin: 0 0 35px;
      font-size: 20px;
      line-height: 1.6;
    }
  }


  // #monarch-home-container a {
  //   color: $link-color;
  //   -webkit-transition: all .2s ease-in-out;
  //   -moz-transition: all .2s ease-in-out;
  //   transition: all .2s ease-in-out;
  //   &:hover,
  //   &:focus {
  //     xtext-decoration: none;
  //     color: darken($link-color,20%);
  //   }
  // }

  #monarch-home-container .light {
    font-weight: 400;
  }

  #monarch-home-container header.intro {
    display: table;
    width: 100%;
    height: auto;
    padding: 50px 0;
    text-align: center;
    color: white;
    background-color: $monarch-bg-color;

    .intro-body {
      display: table-cell;
      vertical-align: middle;

      .brand-heading {
        padding: 20px 0 20px 0;
      }
      .intro-text {
        font-size: 18px;
      }
    }

    @media(min-width:$grid-float-breakpoint) {
      .intro-body {
        .intro-text {
          font-size: 26px;
        }
      }

    }
  }

  #monarch-home-container .content-section {
    padding-top: 50px;
    padding-bottom: 50px;
    font-size: 18px;
  }

  #monarch-home-container .data-dashboard {
    padding-top: 50px;
    padding-bottom: 50px;
    font-size: 18px;
    background: #EBEBEB;
  }

  #monarch-home-container .news-section {
    padding-top: 50px;
    padding-bottom: 50px;
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
    font-size: 18px;
    background-color: #E8E8E8;
    -webkit-background-size: cover;
    -moz-background-size: cover;
    background-size: cover;
    -o-background-size: cover;
  }


  #monarch-home-container .partners-section {
    padding: 50px 10px;
  }

  #monarch-home-container .btn.btn-dark {
    text-transform: uppercase;
    color: white;
    font-family: "Montserrat","Helvetica Neue",Helvetica,Arial,sans-serif;
    font-weight: 400;
    -webkit-transition: all .3s ease-in-out;
    -moz-transition: all .3s ease-in-out;
    transition: all .3s ease-in-out;
  }


  #monarch-home-container footer.footer {
    display: table;
    width: 100%;
    height: auto;
    padding: 50px 0;
    text-align: center;
    color: white;
    background-color: $monarch-bg-color;

    a {
      color: white;
    }
  }
</style>


