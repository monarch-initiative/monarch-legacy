<template>
  <div class="monarch-legacy">
    <div v-if="progressPath">
      <br>
      <br>
      <br>
      <div class="progress">
        <div
          class="progress-bar progress-bar-striped active"
          role="progressbar"
          aria-valuenow="40"
          aria-valuemin="0"
          aria-valuemax="100"
          style="width:100%;margin:auto;">Loading <b>{{progressPath}}</b>
        </div>
      </div>
    </div>

<!--     <div v-if="contentBody" v-bind:is="transformedBody" v-bind="$props">
    </div>
 -->

    <div id="selenium_id_content" v-if="contentBody" v-html="contentBody" xv-bind="$props">
    </div>

  </div>
</template>

<script>

// Copied from https://github.com/jashkenas/underscore/blob/e944e0275abb3e1f366417ba8facb5754a7ad273/underscore.js#L1458

var unescapeMap = {
  '&amp;' : '&',
  '&lt;' : '<',
  '&gt;' : '>',
  '&quot;' : '"',
  '&#x27;' : "'",
  '&#x60;' : '`',
  '&#x2F;' : '/'
};

// Functions for escaping and unescaping strings to/from HTML interpolation.
var createEscaper = function(map) {
  var escaper = function(match) {
    return map[match];
  };
  // Regexes for identifying a key that needs to be escaped.
  var source = '(?:' + Object.keys(map).join('|') + ')';
  var testRegexp = RegExp(source);
  var replaceRegexp = RegExp(source, 'g');
  return function(string) {
    string = string == null ? '' : '' + string;
    return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
  };
};
var unescape = createEscaper(unescapeMap);


export default {
  name: 'monarchlegacy',
  data () {
    return {
      contentScript: '',
      contentBody: '',
      progressTimer: null,
      progressPath: null,
      path: null
    }
  },
  created() {
  },
  mounted() {
    this.fetchData();
    this.$on('legacyContentChanged', function (msg) {
      console.log('legacyContentChanged:', msg);
    });
  },
  destroy() {
  },
  watch: {
    '$route' (to, from) {
      // Only fetchData if the path is different.
      // hash changes are currently handled by monarch-tabs.js
      // within the loaded MonarchLegacy component.

      console.log('$route', to, from, to.path, this.path);
      if (to.path !== this.path) {
        this.fetchData();
      }
    }
  },
  computed: {
    transformedScript() {
      return {
        template: this.contentScript,
        props: this.$options.props
      }
    },
    transformedBody() {
      return {
        template: this.contentBody,
        props: this.$options.props
      }
    }
  },
  methods: {
    fetchData() {
      const that = this;
      const path = that.$route.fullPath;
      this.path = that.$route.path;

      if (that.progressTimer) {
        console.log('leftover progressTimer');
      }
      else {
        that.progressPath = null;
        that.progressTimer = setTimeout(function timeout() {
          that.progressTimer = null;
          that.progressPath = path;
          that.contentBody = null;
        }, 500);
      }
      // console.log('fetchData', path);
      const scriptHeaderPrefix = '+++++++++++++++monarch-script';
      const scriptHeaderSuffix = '---------------monarch-script';
      window.loadPathContentAsync(path, function(content, responseURL) {
        const scriptHeaderBegin = content.indexOf(scriptHeaderPrefix);
        const scriptHeaderEnd = content.indexOf(scriptHeaderSuffix);
        if (scriptHeaderBegin !== 0 ||
            scriptHeaderEnd <= 0) {
          console.log('Invalid script header', scriptHeaderBegin, scriptHeaderEnd, content.slice(0, 100));
        }
        else {
          // console.log('#content', content);
          that.contentScript = content.slice(
            scriptHeaderBegin + scriptHeaderPrefix.length,
            scriptHeaderEnd);
          that.contentBody = content.slice(
            scriptHeaderEnd + scriptHeaderSuffix.length);
          // that.contentBody = unescape(that.contentBody);
          that.$nextTick(function() {
            if (that.progressTimer) {
              clearTimeout(that.progressTimer);
              that.progressTimer = null;
            }
            that.progressPath = null;

            responseURL = responseURL.replace(window.location.origin, '');
            responseURL = responseURL.replace(/\/legacy/g, '');
            console.log('#responseURL', responseURL, window.location.origin, path);
            if (responseURL !== path) {
              console.log('path/responseURL', window.location.origin, path, responseURL);
              var hashIndex = path.indexOf('#');
              if (hashIndex >= 0) {
                responseURL += path.slice(hashIndex);
              }
              window.vueRouter.push(responseURL, function() {
                console.log('pushed', that.$route.path);
                that.path = that.$route.path;
              });
            }

            console.log('that.contentScript', that.contentScript.slice(0, 50));
            if (that.contentScript) {
              eval(that.contentScript);
              window.vueRouter.updatePageLinks();
            }
          });
        }
      });
    }
  }
}
</script>

<style>
</style>


