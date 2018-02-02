<template>
<div id="selenium_id_content">
<div class="wrapperforfooter">
  <div id="monarch-home-container" class="container-fluid monarch-container">
    <div class="row">
      <div class="col-xs-12">

        <form id="home_search_form" class="searchspace"
            action="/search" role="search">
          <div class="input-group">
            <input id="home_search" type="text" class="form-control" placeholder="Search for...">
            <span class="input-group-btn">
              <button class="btn btn-default" type="button">Go!</button>
            </span>
          </div>

        </form>

      </div>
    </div>

    <br>

    <div class="row">
      <div class="col-xs-12">
        <div class="center-block text-center">
          <img
            class="center-block text-center img-responsive"
            src="/image/carousel-overview.png"
            alt="Explore Monarch" />
        </div>
      </div>
    </div>
  </div>
</div>

<br>

<footer
    id="footer">
    <div> The Monarch Initiative is a collaboration between: </div>
    <ul>
        <li>
            Oregon Health & Science University
        </li>
        <li>
            The Jackson Laboratory
        </li>
        <li>
            Lawrence Berkeley National Laboratory
        </li>
        <li>
            Charité - Universitätsmedizin Berlin
        </li>
        <li>
            Garvan Institute of Medical Research
        </li>
        <li>
            William Harvey Research Institute
        </li>
        <li>
            Barts & The London School of Medicine & Dentistry, Queen Mary University of London
        </li>
        <li>
            Renaissance Computing Institute, University of North Carolina at Chapel Hill
        </li>
    </ul>

    <div>
    Monarch is supported generously by a NIH Office of the Director Grant #5R24OD011883,
    as well as by NIH-UDP: HHSN268201300036C, HHSN268201400093P, NCI/Leidos #15X143.
    We are grateful to the many <a target="_blank" href="/about/sources">original sources of our data</a> for allowing Monarch to integrate them in this way.
    Except where forbidden by the original sources, this work is licensed under a
    Creative Commons Attribution 3.0 License.
    </div>

</footer>
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
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
</style>
