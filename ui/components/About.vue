<template>

<div class="layout-pf layout-pf-fixed">
<div class="nav-pf-vertical nav-pf-vertical-with-sub-menus">
  <ul class="list-group">
    <li class="list-group-item">
      <a href="#0">
        <span class="fa fa-dashboard" data-toggle="tooltip" title="Dashboard"></span>
        <span class="list-group-item-value">Dashboard</span>
      </a>
    </li>
    <li class="list-group-item">
      <a href="#0">
        <span class="fa fa-shield" data-toggle="tooltip" title="Dolor"></span>
        <span class="list-group-item-value">Dolor</span>

      </a>
    </li>
    <li class="list-group-item active " data-target="#ipsum-secondary">
      <a href="#0">
        <span class="fa fa-space-shuttle" data-toggle="tooltip" title="Ipsum"></span>
        <span class="list-group-item-value">Ipsum</span>
      </a>

    </li>
    <li class="list-group-item " data-target="#amet-secondary">
      <a href="#0">
        <span class="fa fa-paper-plane" data-toggle="tooltip" title="Amet"></span>
        <span class="list-group-item-value">Amet</span>
      </a>

    </li>
    <li class="list-group-item">
      <a href="#0">
        <span class="fa fa-graduation-cap" data-toggle="tooltip" title="Adipscing"></span>
        <span class="list-group-item-value">Adipscing</span>
      </a>
    </li>
    <li class="list-group-item">
      <a href="#0">
        <span class="fa fa-gamepad" data-toggle="tooltip" title="Lorem"></span>
        <span class="list-group-item-value">Lorem</span>
      </a>
    </li>

    <li class="list-group-item secondary-nav-item-pf mobile-nav-item-pf visible-xs-block">
      <a href="#0">
        <span class="pficon pficon-user" data-toggle="tooltip" title="" data-original-title="User"></span>
        <span class="list-group-item-value">User</span>
      </a>
      <div id="user-secondary" class="nav-pf-secondary-nav">
        <div class="nav-item-pf-header">
          <a href="#0" class="secondary-collapse-toggle-pf" data-toggle="collapse-secondary-nav"></a>
          <span>User</span>
        </div>

        <ul class="list-group">
          <li class="list-group-item">
            <a href="#0">
              <span class="list-group-item-value">Preferences</span>
            </a>
          </li>

          <li class="list-group-item">
            <a href="#0">
              <span class="list-group-item-value">Logout</span>
            </a>
          </li>
        </ul>
      </div>
    </li>
    <li class="list-group-item secondary-nav-item-pf mobile-nav-item-pf visible-xs-block" data-target="#amet-secondary">
      <a href="#0">
        <span class="pficon pficon-help" data-toggle="tooltip" title="" data-original-title="Help"></span>
        <span class="list-group-item-value">Help</span>
      </a>
      <div id="help-secondary" class="nav-pf-secondary-nav">
        <div class="nav-item-pf-header">
          <a href="#0" class="secondary-collapse-toggle-pf" data-toggle="collapse-secondary-nav"></a>
          <span>Help</span>
        </div>
        <ul class="list-group">
          <li class="list-group-item">
            <a href="#0">
              <span class="list-group-item-value">Help</span>
            </a>
          </li>
          <li class="list-group-item">
            <a href="#0">
              <span class="list-group-item-value">About</span>
            </a>
          </li>
        </ul>
      </div>
    </li>

  </ul>

</div>

<div class="container-fluid container-cards-pf container-pf-nav-pf-vertical">

      <div class="row row-cards-pf">
      <!-- Important:  if you need to nest additional .row within a .row.row-cards-pf, do *not* use .row-cards-pf on the nested .row  -->
        <div class="col-xs-12 col-sm-6 col-md-3">
<div class="card-pf card-pf-accented card-pf-aggregate-status">
  <h2 class="card-pf-title">
    <span class="fa fa-shield"></span><span class="card-pf-aggregate-status-count">0</span> Ipsum
  </h2>
  <div class="card-pf-body">
    <p class="card-pf-aggregate-status-notifications">
      <span class="card-pf-aggregate-status-notification"><a href="#" class="add" data-toggle="tooltip" data-placement="top" title="Add Ipsum"><span class="pficon pficon-add-circle-o"></span></a></span>
    </p>
  </div>
</div>

        </div>
        <div class="col-xs-12 col-sm-6 col-md-3">
<div class="card-pf card-pf-accented card-pf-aggregate-status">
  <h2 class="card-pf-title">
    <a href="#"><span class="fa fa-shield"></span><span class="card-pf-aggregate-status-count">20</span> Amet</a>
  </h2>
  <div class="card-pf-body">
    <p class="card-pf-aggregate-status-notifications">
      <span class="card-pf-aggregate-status-notification"><a href="#"><span class="pficon pficon-error-circle-o"></span>4</a></span>
      <span class="card-pf-aggregate-status-notification"><a href="#"><span class="pficon pficon-warning-triangle-o"></span>1</a></span>
    </p>
  </div>
</div>

        </div>
        <div class="col-xs-12 col-sm-6 col-md-3">
<div class="card-pf card-pf-accented card-pf-aggregate-status">
  <h2 class="card-pf-title">
    <a href="#"><span class="fa fa-shield"></span><span class="card-pf-aggregate-status-count">9</span> Adipiscing</a>
  </h2>
  <div class="card-pf-body">
    <p class="card-pf-aggregate-status-notifications">
      <span class="card-pf-aggregate-status-notification"><span class="pficon pficon-ok"></span></span>
    </p>
  </div>
</div>

        </div>
        <div class="col-xs-12 col-sm-6 col-md-3">
          <div class="card-pf card-pf-accented card-pf-aggregate-status">
            <h2 class="card-pf-title">
              <a href="#"><span class="fa fa-shield"></span><span class="card-pf-aggregate-status-count">12</span> Lorem</a>
            </h2>
            <div class="card-pf-body">
              <p class="card-pf-aggregate-status-notifications">
                <a href="#"><span class="card-pf-aggregate-status-notification"><span class="pficon pficon-error-circle-o"></span>1</span></a>
              </p>
            </div>
          </div>
        </div>
      </div><!-- /row -->
      <div class="row row-cards-pf">
      <!-- Important:  if you need to nest additional .row within a .row.row-cards-pf, do *not* use .row-cards-pf on the nested .row  -->
        <div class="col-xs-12 col-sm-6 col-md-3">
<div class="card-pf card-pf-accented card-pf-aggregate-status card-pf-aggregate-status-mini">
  <h2 class="card-pf-title">
    <span class="fa fa-rebel"></span>
    <span class="card-pf-aggregate-status-count">0</span> Ipsum
  </h2>
  <div class="card-pf-body">
    <p class="card-pf-aggregate-status-notifications">
      <span class="card-pf-aggregate-status-notification"><a href="#" class="add" data-toggle="tooltip" data-placement="top" title="Add Ipsum"><span class="pficon pficon-add-circle-o"></span></a></span>
    </p>
  </div>
</div>

        </div>
        <div class="col-xs-12 col-sm-6 col-md-3">
<div class="card-pf card-pf-accented card-pf-aggregate-status card-pf-aggregate-status-mini">
  <h2 class="card-pf-title">
    <a href="#">
      <span class="fa fa-paper-plane"></span>
      <span class="card-pf-aggregate-status-count">20</span> Amet
    </a>
  </h2>
  <div class="card-pf-body">
    <p class="card-pf-aggregate-status-notifications">
      <span class="card-pf-aggregate-status-notification"><a href="#"><span class="pficon pficon-error-circle-o"></span>4</a></span>
    </p>
  </div>
</div>

        </div>
        <div class="col-xs-12 col-sm-6 col-md-3">
<div class="card-pf card-pf-accented card-pf-aggregate-status card-pf-aggregate-status-mini">
  <h2 class="card-pf-title">
    <a href="#">
      <span class="pficon pficon-cluster"></span>
      <span class="card-pf-aggregate-status-count">9</span> Adipiscing
    </a>
  </h2>
  <div class="card-pf-body">
    <p class="card-pf-aggregate-status-notifications">
      <span class="card-pf-aggregate-status-notification"><span class="pficon pficon-ok"></span></span>
    </p>
  </div>
</div>

        </div>
        <div class="col-xs-12 col-sm-6 col-md-3">
          <div class="card-pf card-pf-accented card-pf-aggregate-status card-pf-aggregate-status-mini">
            <h2 class="card-pf-title">
              <a href="#">
                <span class="pficon pficon-image"></span>
                <span class="card-pf-aggregate-status-count">12</span> Lorem
              </a>
            </h2>
            <div class="card-pf-body">
              <p class="card-pf-aggregate-status-notifications">
                <a href="#"><span class="card-pf-aggregate-status-notification"><span class="pficon pficon-error-circle-o"></span>1</span></a>
              </p>
            </div>
          </div>
        </div>
      </div>
      <div class="row row-cards-pf">
      <!-- Important:  if you need to nest additional .row within a .row.row-cards-pf, do *not* use .row-cards-pf on the nested .row  -->
        <div class="col-xs-12 col-sm-6">
<div class="card-pf">
  <div class="card-pf-heading">
    <h2 class="card-pf-title">
      Top Utilized Clusters
    </h2>
  </div>
  <div class="card-pf-body">
    <div class="progress-description">
      RHOS6-Controller
    </div>
    <div class="progress progress-label-top-right">
      <div class="progress-bar progress-bar-danger" role="progressbar" aria-valuenow="95" aria-valuemin="0" aria-valuemax="100" style="width: 95%;"  data-toggle="tooltip" title="95% Used">
        <span><strong>190.0 of 200.0 GB</strong> Used</span>
      </div>
      <div class="progress-bar progress-bar-remaining" role="progressbar" aria-valuenow="5" aria-valuemin="0" aria-valuemax="100" style="width: 5%;" data-toggle="tooltip" title="5% Available">
        <span class="sr-only">5% Available</span>
      </div>
    </div>
    <div class="progress-description">
      CFMEQE-Cluster
    </div>
    <div class="progress progress-label-top-right">
      <div class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100" style="width: 50%;"  data-toggle="tooltip" title="50% Used">
        <span><strong>100.0 of 200.0 GB</strong> Used</span>
      </div>
      <div class="progress-bar progress-bar-remaining" role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100" style="width: 50%;" data-toggle="tooltip" title="50% Available">
        <span class="sr-only">50% Available</span>
      </div>
    </div>
    <div class="progress-description">
      RHOS-Undercloud
    </div>
    <div class="progress progress-label-top-right">
      <div class="progress-bar progress-bar-warning" role="progressbar" aria-valuenow="70" aria-valuemin="0" aria-valuemax="100" style="width: 70%;"  data-toggle="tooltip" title="70% Used">
        <span><strong>140.0 of 200.0 GB</strong> Used</span>
      </div>
      <div class="progress-bar progress-bar-remaining" role="progressbar" aria-valuenow="30" aria-valuemin="0" aria-valuemax="100" style="width: 30%;" data-toggle="tooltip" title="30% Available">
        <span class="sr-only">30% Available</span>
      </div>
    </div>
    <div class="progress-description">
      RHEL6-Controller
    </div>
    <div class="progress progress-label-top-right">
      <div class="progress-bar progress-bar-warning" role="progressbar" aria-valuenow="76.5" aria-valuemin="0" aria-valuemax="100" style="width: 76.5%;"  data-toggle="tooltip" title="76.5% Used">
        <span><strong>153.0 of 200.0 GB</strong> Used</span>
      </div>
      <div class="progress-bar progress-bar-remaining" role="progressbar" aria-valuenow="23.5" aria-valuemin="0" aria-valuemax="100" style="width: 23.5%;" data-toggle="tooltip" title="23.5% Available">
        <span class="sr-only">23.5% Available</span>
      </div>
    </div>
  </div>
</div>

        </div>
        <div class="col-xs-12 col-sm-6">
<div class="card-pf">
  <div class="card-pf-heading">
    <h2 class="card-pf-title">
      Quotas
    </h2>
  </div>
  <div class="card-pf-body">
    <div class="progress-container progress-description-left progress-label-right">
      <div class="progress-description">
        CPU
      </div>
      <div class="progress">
        <div class="progress-bar" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100" style="width: 25%;" data-toggle="tooltip" title="25% Used">
          <span><strong>115 of 460</strong> MHz</span>
        </div>
        <div class="progress-bar progress-bar-remaining" role="progressbar" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100" style="width: 75%;" data-toggle="tooltip" title="75% Available">
          <span class="sr-only">75% Available</span>
        </div>
      </div>
    </div>
    <div class="progress-container progress-description-left progress-label-right">
      <div class="progress-description">
        Memory
      </div>
      <div class="progress">
        <div class="progress-bar" role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100" style="width: 50%;" data-toggle="tooltip" title="8 GB Used">
          <span><strong>8 of 16</strong> GB</span>
        </div>
        <div class="progress-bar progress-bar-remaining" role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100" style="width: 50%;" data-toggle="tooltip" title="8 GB Available">
          <span class="sr-only">50% Available</span>
        </div>
      </div>
    </div>
    <div class="progress-container progress-description-left progress-label-right">
      <div class="progress-description">
        Pods
      </div>
      <div class="progress">
        <div class="progress-bar" role="progressbar" aria-valuenow="62.5" aria-valuemin="0" aria-valuemax="100" style="width: 62.5%;" data-toggle="tooltip" title="62.5% Used">
          <span><strong>5 of 8</strong> Total</span>
        </div>
        <div class="progress-bar progress-bar-remaining" role="progressbar" aria-valuenow="37.5" aria-valuemin="0" aria-valuemax="100" style="width: 37.5%;" data-toggle="tooltip" title="37.5% Available">
          <span class="sr-only">37.5% Available</span>
        </div>
      </div>
    </div>
    <div class="progress-container progress-description-left progress-label-right">
      <div class="progress-description">
        Services
      </div>
      <div class="progress">
        <div class="progress-bar" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%;" data-toggle="tooltip" title="100% Used">
          <span><strong>2 of 2</strong> Total</span>
        </div>
      </div>
    </div>
  </div>
</div>

        </div>
      </div><!-- /row -->
      <div class="row row-cards-pf">
        <div class="col-md-12">
<div class="card-pf card-pf-utilization">
  <div class="card-pf-heading">
    <p class="card-pf-heading-details">Last 30 days</p>
    <h2 class="card-pf-title">
      Utilization
    </h2>
  </div>
  <div class="card-pf-body">
    <div class="row">
      <div class="col-xs-12 col-sm-4 col-md-4">
        <h3 class="card-pf-subtitle">CPU</h3>
        <p class="card-pf-utilization-details">
          <span class="card-pf-utilization-card-details-count">50</span>
            <span class="card-pf-utilization-card-details-description">
              <span class="card-pf-utilization-card-details-line-1">Available</span>
              <span class="card-pf-utilization-card-details-line-2">of 1000 MHz</span>
            </span>
        </p>
        <div id="chart-pf-donut-1"></div>
        <div class="chart-pf-sparkline" id="chart-pf-sparkline-1"></div>

      </div>
      <div class="col-xs-12 col-sm-4 col-md-4">
        <h3 class="card-pf-subtitle">Network</h3>
        <p class="card-pf-utilization-details">
          <span class="card-pf-utilization-card-details-count">200</span>
            <span class="card-pf-utilization-card-details-description">
              <span class="card-pf-utilization-card-details-line-1">Available</span>
              <span class="card-pf-utilization-card-details-line-2">of 1300 Gbps</span>
            </span>
        </p>
        <div id="chart-pf-donut-3"></div>
        <div class="chart-pf-sparkline" id="chart-pf-sparkline-3"></div>

      </div>
    </div>
  </div>
</div>

        </div>
      </div><!-- /row -->
      <div class="row row-cards-pf">
        <div class="col-xs-12 col-sm-4 col-md-4">
<div class="card-pf card-pf-utilization">
  <h2 class="card-pf-title">
    Network
  </h2>
  <div class="card-pf-body">
    <p class="card-pf-utilization-details">
      <span class="card-pf-utilization-card-details-count">200</span>
        <span class="card-pf-utilization-card-details-description">
          <span class="card-pf-utilization-card-details-line-1">Available</span>
          <span class="card-pf-utilization-card-details-line-2">of 1300 Gbps</span>
        </span>
    </p>
    <div id="chart-pf-donut-4"></div>
    <div class="chart-pf-sparkline" id="chart-pf-sparkline-4"></div>

  </div>
</div>

        </div>
      </div><!-- /row -->
      <div class="row row-cards-pf">
      <!-- Important:  if you need to nest additional .row within a .row.row-cards-pf, do *not* use .row-cards-pf on the nested .row  -->
        <div class="col-xs-12 col-sm-6 col-md-5">
<div class="card-pf">
  <div class="card-pf-heading">
    <div class="dropdown card-pf-time-frame-filter">
      <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">
        Last 30 Days <span class="caret"></span>
      </button>
      <ul class="dropdown-menu dropdown-menu-right" role="menu">
        <li class="selected"><a href="#">Last 30 Days</a></li>
        <li><a href="#">Last 60 Days</a></li>
        <li><a href="#">Last 90 Days</a></li>
      </ul>
    </div>
    <h2 class="card-pf-title">
      Card Title
    </h2>
  </div>
  <div class="card-pf-body">
    <p>[card contents]</p>
  </div>
</div>

        </div>
        <div class="col-xs-12 col-sm-6 col-md-7">
<div class="card-pf">
  <h2 class="card-pf-title">
    Card Title
  </h2>
  <div class="card-pf-body">
    <p>[card contents]</p>
  </div>
  <div class="card-pf-footer">
    <div class="dropdown card-pf-time-frame-filter">
      <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">
        Last 30 Days <span class="caret"></span>
      </button>
      <ul class="dropdown-menu dropdown-menu-right" role="menu">
        <li class="selected"><a href="#">Last 30 Days</a></li>
        <li><a href="#">Last 60 Days</a></li>
        <li><a href="#">Last 90 Days</a></li>
      </ul>
    </div>
    <p>
      <a href="#" class="card-pf-link-with-icon">
        <span class="pficon pficon-add-circle-o"></span>Add New Cluster
      </a>
    </p>
  </div>
</div>

        </div>
      </div><!-- /row -->
      <div class="row row-cards-pf">
      <!-- Important:  if you need to nest additional .row within a .row.row-cards-pf, do *not* use .row-cards-pf on the nested .row  -->
        <div class="col-xs-12 col-sm-5 col-md-5">
          <div class="card-pf">
            <h2 class="card-pf-title">
              Card Title
            </h2>
            <div class="card-pf-body">
              <p>[card contents]</p>
            </div>
            <div class="card-pf-footer">
              <div class="dropdown card-pf-time-frame-filter">
                <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">
                  Last 30 Days <span class="caret"></span>
                </button>
                <ul class="dropdown-menu dropdown-menu-right" role="menu">
                  <li class="selected"><a href="#">Last 30 Days</a></li>
                  <li><a href="#">Last 60 Days</a></li>
                  <li><a href="#">Last 90 Days</a></li>
                </ul>
              </div>
              <p>
                <a href="#" class="card-pf-link-with-icon">
                  <span class="pficon pficon-flag"></span>View CPU Events
                </a>
              </p>
            </div>
          </div>
        </div>
        <div class="col-xs-12 col-sm-7 col-md-7">
          <div class="card-pf">
            <h2 class="card-pf-title">
              Card Title
            </h2>
            <div class="card-pf-body">
              <p>[card contents]</p>
            </div>
          </div>
        </div>
      </div>
      <div class="row row-cards-pf">
      <!-- Important:  if you need to nest additional .row within a .row.row-cards-pf, do *not* use .row-cards-pf on the nested .row  -->
        <div class="col-xs-6 col-sm-8 col-md-8">
          <div class="card-pf">
            <div class="card-pf-body">
              <p>[card contents]</p>
            </div>
            <div class="card-pf-footer">
              <p><a href="#">Footer link</a></p>
            </div>
          </div>
        </div>
        <div class="col-xs-6 col-sm-4 col-md-4">
          <div class="card-pf">
            <div class="card-pf-body">
              <p>[card contents]</p>
            </div>
            <div class="card-pf-footer">
              <p><a href="#">Footer link</a></p>
            </div>
          </div>
        </div>
      </div><!-- /row -->
      <div class="row row-cards-pf">
      <!-- Important:  if you need to nest additional .row within a .row.row-cards-pf, do *not* use .row-cards-pf on the nested .row  -->
        <div class="col-xs-6 col-sm-6 col-md-6">
          <div class="card-pf">
            <div class="card-pf-body">
              <p>[card contents]</p>
            </div>
          </div>
        </div>
        <div class="col-xs-6 col-sm-6 col-md-6">
          <div class="card-pf">
            <div class="card-pf-body">
              <p>[card contents]</p>
            </div>
          </div>
        </div>
      </div><!-- /row -->

</div>
</div>


</template>

<script>
export default {
  name: 'about',
  data () {
    return {
      msg: 'Welcome to the Monarch Initiative PWA'
    }
  }
}
</script>

<style lang="scss">
@import "../../css/_prelude-patternfly.scss";
</style>

