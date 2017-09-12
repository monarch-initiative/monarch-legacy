/**
 * Inspired by https://github.com/topheman/react-es6-redux
 */

/* eslint-disable max-len */
/* eslint-disable */

const path = require('path');
const log = require('npmlog');

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
const LEGACY = true;

/** integrity checks */

if (/^\w+/.test(DIST_DIR) === false || /\/$/.test(DIST_DIR) === true) { // @todo make a better regexp that accept valid unicode leading chars
  log.error('webpack', `DIST_DIR should not contain trailing slashes nor invalid leading chars - you passed "${DIST_DIR}"`);
  process.exit(1);
}

log.info('webpack', `${NODE_ENV.toUpperCase()} mode`);
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

if (!LEGACY) {
  plugins.push(new HtmlWebpackPlugin({
    title: 'Topheman - Webpack Babel Starter Kit',
    template: 'ui/index.ejs', // Load a custom template
    inject: MODE_DEV_SERVER, // inject scripts in dev-server mode - in build mode, use the template tags
    MODE_DEV_SERVER: MODE_DEV_SERVER,
    DEVTOOLS: DEVTOOLS,
    BANNER_HTML: BANNER_HTML
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
plugins.push(new webpack.DefinePlugin({
  // Lots of library source code (like React) are based on process.env.NODE_ENV
  // (all development related code is wrapped inside a conditional that can be dropped if equal to "production"
  // this way you get your own react.min.js build)
  'process.env': {
    NODE_ENV: JSON.stringify(NODE_ENV),
    DEVTOOLS: DEVTOOLS, // You can rely on this var in your code to enable specific features only related to development (that are not related to NODE_ENV)
    LINTER: LINTER // You can choose to log a warning in dev if the linter is disabled
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
    log.info('webpack', 'Check http://localhost:8088');
  }
  else {
    log.info('webpack', 'Check http://' + myLocalIp() + ':8088');
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

if (LINTER) {
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

/* NOTUSED
var cssLoader = {
  test: /\.css$/,
  // Reference: https://github.com/webpack/extract-text-webpack-plugin
  // Extract css files in production builds
  //
  // Reference: https://github.com/webpack/style-loader
  // Use style-loader in development for hot-loading
  loader: 'style-loader!css-loader'

  // ExtractTextPlugin.extract('style', 'css?sourceMap!postcss')
    // ExtractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader' })
};

// Skip loading css in test mode
if (TEST) {
  // Reference: https://github.com/webpack/null-loader
  // Return an empty module
  cssLoader.loader = 'null';
}


// LESS LOADER
var lessLoader = {
  test: /\.less$/,
  loader: "style-loader!css-loader!less-loader?outputStyle=expanded&includePaths[]=" + (path.resolve(__dirname, "./node_modules"))
//    loader: ExtractTextPlugin.extract('style', 'less?sourceMap!postcss')
};

// Skip loading less in test mode
if (TEST) {
  // Reference: https://github.com/webpack/null-loader
  // Return an empty module
  lessLoader.loader = 'null';
}
*/


/** webpack config */

const config = {
  amd: {
    jQuery: true
  },
  bail: FAIL_ON_ERROR,
  entry: {
    // 'bundle': './ui/bootstrap.js',
    // 'main': './ui/style/main.scss'
    'app': './js/index.js',
    // 'main': './ui/style/main.scss'
  },
  output: {
    publicPath: MODE_DEV_SERVER ? '' : '/dist/',
    filename: `[name]${hash}.bundle.js`,
    chunkFilename: `[id]${hash}.chunk.js`,
    path: path.join(__dirname, BUILD_DIR, DIST_DIR)
  },
  cache: true,
  devtool: OPTIMIZE ? false : 'sourcemap',
  module: {
    rules: [
      ...preLoaders,
      // NOTUSED cssLoader,
      // NOTUSED lessLoader,
      {
        test: /\.js$/,
        exclude: /node_modules/,
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
        test: /\.less$/,
        use: extractSass.extract({
          use: [{
            loader: 'css-loader',
            query: JSON.stringify({
              sourceMap: true
            })
          }, {
            loader: 'less-loader',
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
          use: [{
            loader: 'css-loader',
            query: JSON.stringify({
              sourceMap: true
            })
          }, {
            loader: 'sass-loader',
            query: JSON.stringify({
              sourceMap: true
            })
          }],
          // use style-loader in development
          fallback: 'style-loader'
        })
      },
      { test: /\.(png|gif)$/, loader: 'url-loader?limit=' + ASSETS_LIMIT + '&name=[hash].[ext]' },
      { test: /\.woff(\?v=\d+\.\d+\.\d+)?$/, loader: 'url-loader?limit=' + ASSETS_LIMIT + '&mimetype=application/font-woff&name=[hash].[ext]' },
      { test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/, loader: 'url-loader?limit=' + ASSETS_LIMIT + '&mimetype=application/font-woff&name=[hash].[ext]' },
      { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: 'url-loader?limit=' + ASSETS_LIMIT + '&mimetype=application/octet-stream&name=[hash].[ext]' },
      { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: 'file-loader?&name=[hash].[ext]' },
      { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: 'url-loader?limit=' + ASSETS_LIMIT + '&mimetype=image/svg+xml&&name=[hash].[ext]' }
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
        'ringo/httpclient': path.join(__dirname, "js/nop.js")
    }
  }
};

if (MODE_DEV_SERVER) {
  config.devServer = {
    host: LOCALHOST ? 'localhost' : myLocalIp(),
    watchContentBase: true,
  };
  if (LEGACY) {
    config.devServer.hot = true;
    config.devServer.hotOnly = true;
    config.devServer.inline = true;
    config.devServer.contentBase = './';
    config.devServer.historyApiFallback = true;
    config.devServer.headers = {
      "Access-Control-Allow-Origin": "http://localhost:8080",
      "Access-Control-Allow-Credentials": "true"
    };
    config.devServer.proxy = {
      '*.json': {
        target: 'http://localhost:8080'
      },
      '/status': {
        target: 'http://localhost:8080'
      },
      '/': {
        target: 'http://localhost:8080'
      }
    };
  }
};

module.exports = config;
