<template>
  <div id="app">
    <monarch-navbar></monarch-navbar>
	<router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'app'
}
</script>

<style>
#app {
	xborder:5px solid red;
}
</style>
