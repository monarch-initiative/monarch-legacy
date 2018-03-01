/**
 * Inspired by https://github.com/topheman/react-es6-redux
 */

/* eslint-disable max-len */
/* eslint-disable */

const path = require('path');
const log = require('npmlog');
const nodeSass = require("node-sass");

log.level = 'silly';
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const myLocalIp = require('my-local-ip');
const common = require('./common');
const AssetsPlugin = require('assets-webpack-plugin');

const plugins = [];
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const BANNER = common.getBanner();
const BANNER_HTML = common.getBannerHtml();

const root = __dirname;

const MODE_DEV_SERVER = process.argv[1].indexOf('webpack-dev-server') > -1 ? true : false;

log.info('webpack', 'Launched in ' + (MODE_DEV_SERVER ? 'dev-server' : 'build') + ' mode');

/** environment setup */

const BUILD_DIR = '';
const DIST_DIR = process.env.DIST_DIR || 'dist';// relative to BUILD_DIR
const NODE_ENV = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : 'development';
const USE_SPA = (process.env.USE_SPA ? process.env.USE_SPA : 0);
const DEVTOOLS = process.env.DEVTOOLS ? JSON.parse(process.env.DEVTOOLS) : null;// can be useful in case you have web devtools (null by default to differentiate from true or false)
const ANALYZE = process.env.ANALYZE ? JSON.parse(process.env.ANALYZE) : false;
// optimize in production by default - otherwize, override with OPTIMIZE=false flag (if not optimized, sourcemaps will be generated)
const OPTIMIZE = process.env.OPTIMIZE ? JSON.parse(process.env.OPTIMIZE) : NODE_ENV === 'production';
const LINTER = process.env.LINTER ? JSON.parse(process.env.LINTER) : true;
const FAIL_ON_ERROR = process.env.FAIL_ON_ERROR ? JSON.parse(process.env.FAIL_ON_ERROR) : !MODE_DEV_SERVER;// disabled on dev-server mode, enabled in build mode
const STATS = process.env.STATS ? JSON.parse(process.env.STATS) : false; // to output a stats.json file (from webpack at build - useful for debuging)
const LOCALHOST = process.env.LOCALHOST ? JSON.parse(process.env.LOCALHOST) : true;
const ASSETS_LIMIT = typeof process.env.ASSETS_LIMIT !== 'undefined' ? parseInt(process.env.ASSETS_LIMIT, 10) : 5000;// limit bellow the assets will be inlines
const hash = ''; // (NODE_ENV === 'production' && DEVTOOLS ? '-devtools' : '') + (NODE_ENV === 'production' ? '-[hash]' : '');
const TEST = false;



/** integrity checks */

if (/^\w+/.test(DIST_DIR) === false || /\/$/.test(DIST_DIR) === true) { // @todo make a better regexp that accept valid unicode leading chars
  log.error('webpack', `DIST_DIR should not contain trailing slashes nor invalid leading chars - you passed "${DIST_DIR}"`);
  process.exit(1);
}

log.info('webpack', `${NODE_ENV.toUpperCase()} mode`);
if (USE_SPA) {
  log.info('webpack', 'USE_SPA active');
}
if (DEVTOOLS) {
  log.info('webpack', 'DEVTOOLS active');
}
if (!OPTIMIZE) {
  log.info('webpack', 'SOURCEMAPS activated');
}
if (FAIL_ON_ERROR) {
  log.info('webpack', 'NoErrorsPlugin disabled, build will fail on error');
}

/** plugins setup */

if (!FAIL_ON_ERROR) {
  plugins.push(new webpack.NoEmitOnErrorsPlugin());
}


plugins.push(new AssetsPlugin());
plugins.push(new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      "window.jQuery": "jquery"
  }));

if (USE_SPA) {
  plugins.push(new HtmlWebpackPlugin({
    title: 'Monarch',
    template: 'ui/index.ejs',
    filename: 'index.html',
    inject: MODE_DEV_SERVER, // inject scripts in dev-server mode - in build mode, use the template tags
    MODE_DEV_SERVER: MODE_DEV_SERVER,
    DEVTOOLS: DEVTOOLS,
    BANNER_HTML: BANNER_HTML,
    USE_SPA: USE_SPA
  }));
}

// extract css into one main.css file
const extractSass = new ExtractTextPlugin({
  filename: `[name]${hash}.bundle.css`,
  disable: MODE_DEV_SERVER || TEST,
  allChunks: true
});
plugins.push(extractSass);
plugins.push(new webpack.BannerPlugin(BANNER));
plugins.push(new webpack.HotModuleReplacementPlugin());
plugins.push(new webpack.NamedModulesPlugin()); // HMR shows correct file names in console on update
plugins.push(new webpack.DefinePlugin({
  // Lots of library source code (like React) are based on process.env.NODE_ENV
  // (all development related code is wrapped inside a conditional that can be dropped if equal to "production"
  // this way you get your own react.min.js build)
  'process.env': {
    NODE_ENV: JSON.stringify(NODE_ENV),
    DEVTOOLS: DEVTOOLS, // You can rely on this var in your code to enable specific features only related to development (that are not related to NODE_ENV)
    LINTER: LINTER, // You can choose to log a warning in dev if the linter is disabled
    USE_SPA: USE_SPA
  }
}));

if (OPTIMIZE) {
  plugins.push(new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: true
    }
  }));
}

if (ANALYZE) {
  plugins.push(
    new BundleAnalyzerPlugin({
      analyzerMode: 'static'
    }));
}

if (NODE_ENV !== 'production') {
  // to keep compatibility with old loaders - debug: true was previously on config
  plugins.push(new webpack.LoaderOptionsPlugin({
    debug: true
  }));
}

if (MODE_DEV_SERVER) {
  // webpack-dev-server mode
  if(LOCALHOST) {
    log.info('webpack', 'Check http://localhost:8081');
  }
  else {
    log.info('webpack', 'Check http://' + myLocalIp() + ':8081');
  }

  // https://github.com/1337programming/webpack-browser-plugin
  const WebpackBrowserPlugin = require('webpack-browser-plugin');
  plugins.push(
    new WebpackBrowserPlugin({
      // browser: 'Safari'   // 'Firefox'
    })
  );
}
else {
  // build mode
  log.info('webpackbuild', `rootdir: ${root}`);
  if (STATS) {
    // write infos about the build (to retrieve the hash) https://webpack.github.io/docs/long-term-caching.html#get-filenames-from-stats
    plugins.push(function () {
      this.plugin('done', function(stats) {
        require('fs').writeFileSync(
          path.join(__dirname, BUILD_DIR, DIST_DIR, 'stats.json'),
          JSON.stringify(stats.toJson()));
      });
    });
  }
}

/** preloaders */

const preLoaders = [];

if (LINTER && !ANALYZE) {
  log.info('webpack', 'LINTER ENABLED');
  preLoaders.push({
    test: /\.js$/,
    exclude: /node_modules/,
    loader: 'eslint-loader',
    enforce: 'pre',
    options: {
      configFile: path.join(__dirname, 'wbs.eslintrc')
    }
  });
}
else {
  log.info('webpack', 'LINTER DISABLED');
}



/** webpack config */

const config = {
  amd: {
    jQuery: true
  },
  bail: FAIL_ON_ERROR,
  entry:    {
              'app': './js/index.js'
            },
  output: {
    publicPath: MODE_DEV_SERVER ? '/' : '/dist/',
    filename: `[name]${hash}.bundle.js`,
    chunkFilename: `[id]${hash}.chunk.js`,
    path: path.resolve(__dirname, BUILD_DIR, DIST_DIR)
  },
  cache: true,
  devtool: OPTIMIZE ? false : 'sourcemap',
  module: {
    noParse: [
      path.resolve(__dirname, 'gen/bbop.min.js'),
      path.resolve(__dirname, 'node_modules/bootstrap/dist/js/bootstrap.min.js'),
      path.resolve(__dirname, 'node_modules/underscore/underscore-min.js'),
      path.resolve(__dirname, 'node_modules/d3/d3.min.js'),
      path.resolve(__dirname, 'node_modules/jquery/dist/jquery.min.js'),
      // path.resolve(__dirname, 'node_modules/phenogrid/dist/phenogrid-bundle.js'),
      path.resolve(__dirname, 'gen/phenogrid.min.js'),
    ],
    rules: [
      ...preLoaders,

      {
        test: /\.vue$/,
        loader: 'vue-loader',
        include: [
          path.resolve('ui'),
          path.resolve('node_modules/vue-json-tree/src/')],
        options: {
          esModule: true,
          loaders: {
            scss: [ 'vue-style-loader',
                    'css-loader',
                    {
                        loader: 'sass-loader',
                        options: {
                            // data: '@import "variables";',
                            includePaths: [
                              path.resolve(__dirname, 'node_modules/patternfly/dist/sass'),
                              path.resolve(__dirname, 'node_modules/bootstrap-sass/assets/stylesheets/bootstrap'),
                              path.resolve(__dirname, 'node_modules/bootstrap-sass/assets/stylesheets'),
                              path.resolve(__dirname, 'node_modules/font-awesome/scss'),
                            ]
                        },
                    },
                  ]
          }
        },
      },

      {
        test: /\.js$/,
        // exclude: /node_modules/,
        include: [
          path.resolve('ui'),
          path.resolve('js'),
          path.resolve('node_modules/q'),
          path.resolve('node_modules/webpack-dev-server/client')],
        loader: 'babel-loader'
      },
      {
        test: /\.css$/,
        use: extractSass.extract({
          use: [{
            loader: 'css-loader',
            query: JSON.stringify({
              sourceMap: true
            })
          }],
          // use style-loader in development
          fallback: 'style-loader'
        })
      },
      {
        test: /\.scss$/,
        use: extractSass.extract({
          use: [
          {
            loader: 'css-loader',
            query: JSON.stringify({
              sourceMap: true
            })
          },
          {
            loader: 'sass-loader',
            options: {
              includePaths: [
                // path.join(__dirname, 'node_modules'),
                path.join(__dirname, 'node_modules/patternfly/dist/sass'),
                path.resolve(__dirname, 'node_modules/font-awesome/scss'),
                path.join(__dirname, 'node_modules/bootstrap-sass/assets/stylesheets'),
                // path.join(__dirname, 'node_modules/bootstrap-sass/assets/stylesheets/bootstrap')
              ],
              sourceMap: true,
              // importer: [
              //   // // url will be the string passed to @import
              //   // // prev is the file where the import was encountered
              //   (url, prev) => {
              //     // console.log('###importer', url, prev);
              //     if (url.indexOf('bootstrap/') === 0) {
              //       return {
              //         file: path.join(__dirname, 'node_modules/bootstrap-sass/assets/stylesheets/' + url)
              //       };
              //     }
              //     else if (url.indexOf('font-awesome') === 0) {
              //       return {
              //         file: path.join(__dirname, 'node_modules/font-awesome/scss/' + url)
              //       };
              //     }
              //     else {
              //       return nodeSass.types.Null();
              //     }
              //   }
              // ]
            }
          }],
          // use style-loader in development
          fallback: 'style-loader'
        })
      },
      {
        test: /\.(svg|woff|woff2|ttf|eot)$/,
        loader: 'file-loader'
      },
      { test: /\.(png|jpg|jpeg|gif)$/, loader: 'url-loader?limit=' + ASSETS_LIMIT + '&name=[hash].[ext]' },
    ]
  },
  plugins: plugins,
  node: {
    console: true,
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  },
  resolve: {
    modules: ['node_modules'],
    alias: {
      'bbop': path.join(__dirname, 'gen/bbop.min.js'),
      'jquery': path.join(__dirname, 'node_modules/jquery/dist/jquery.min.js'),
      'jquery-ui': path.join(__dirname, 'node_modules/jquery-ui/'),
      'd3': path.join(__dirname, 'node_modules/d3/d3.min.js'),
      'monarchSCSS': (USE_SPA ? '../css/monarch-patternfly.scss' : '../css/monarch.scss'),
      'monarchHomeCSS': (USE_SPA ? '../css/empty.css' : '../css/monarch-home.css'),
      // 'patternfly$': 'patternfly/dist/sass/patternfly',
      'bootstrap$': path.join(__dirname, 'node_modules/bootstrap-sass/assets/stylesheets/bootstrap/'),
      'vue$': 'vue/dist/vue.min.js',  // 'vue/dist/vue.esm.js',
      'vue-good-table$': 'vue-good-table/dist/vue-good-table.min.js',
      'ringo/httpclient': path.join(__dirname, "js/nop.js"),
      'phenogrid': path.join(__dirname, 'gen/phenogrid.min.js'),
      // 'phenogrid': path.join(__dirname, 'node_modules/phenogrid/js/phenogrid.js')
      // 'phenogrid': path.join(__dirname, 'node_modules/phenogrid/dist/phenogrid-bundle.js')
    }
  }
};



if (USE_SPA) {
  config.entry.spa = './ui/main.js';
  config.entry.spastyle = './ui/style/main.scss';
  config.resolve.extensions = ['.js', '.vue', '.json'];
  // config.resolve.alias['vue$'] = 'vue/dist/vue.esm.js';
  config.resolve.alias['@'] = path.resolve('ui');
}

if (MODE_DEV_SERVER) {
  config.devServer = {
    clientLogLevel: 'info', // 'warning',
    historyApiFallback: true,
    hot: true,
    inline: true,
    contentBase: false, // since we use CopyWebpackPlugin.
    compress: true,
    host: LOCALHOST ? 'localhost' : myLocalIp(),
    open: false,
    overlay: true,  // { warnings: false, errors: true },
    publicPath: '/',
    quiet: true, // necessary for FriendlyErrorsPlugin
    watchOptions: {
      poll: false,
    },
    headers: {
      "Access-Control-Allow-Origin": "http://localhost:8080",
      "Access-Control-Allow-Credentials": "true"
    }



    // clientLogLevel: 'warning',
    // host: LOCALHOST ? 'localhost' : myLocalIp(),
    // watchContentBase: true,
    // hot: false,
    // hotOnly: false,
    // inline: true,
    // contentBase: './',
    // historyApiFallback: true,
    // headers: {
    //   "Access-Control-Allow-Origin": "http://localhost:8080",
    //   "Access-Control-Allow-Credentials": "true"
    // }
  };
  config.devServer.proxy = {
    '*.json': {
      target: 'http://localhost:8080'
    },
    '/status': {
      target: 'http://localhost:8080'
    },
    '/admin/introspect': {
      target: 'http://localhost:8080'
    },
    '/simsearch/phenotype': {
      target: 'http://localhost:8080'
    },
    '/robots.txt': {
      target: 'http://localhost:8080'
    },
    '/score': {
      target: 'http://localhost:8080'
    },
    '/compare': {
      target: 'http://localhost:8080'
    },
    '/autocomplete': {
      target: 'http://localhost:8080'
    },
    '/searchapi': {
      target: 'http://localhost:8080'
    },
    '/node_modules/phenogrid/': {
      target: 'http://localhost:8080'
    }
  };

  if (!USE_SPA) {
    config.devServer.proxy['/'] = {
      target: 'http://localhost:8080'
    };
  }
  else {
    config.devServer.proxy['/image'] = {
      target: 'http://localhost:8080'
    };

    config.devServer.proxy['/**/*.json'] = {
      target: 'http://localhost:8080'
    };

    config.devServer.proxy['/legacy'] = {
      target: 'http://localhost:8080',
    };
    config.devServer.proxy['/'] = {
      target: 'http://localhost:8080',
      bypass: function(req, res, proxyOptions) {
        return '/index.html';
      }
    };
  }
}

console.log('config.output', config.output);

module.exports = config;
