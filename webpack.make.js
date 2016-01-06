'use strict';

// Modules
var webpack = require('webpack');
var autoprefixer = require('autoprefixer');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var path = require('path');

module.exports = function(options) { // makeWebpackConfig
  /**
   * Environment type
   * BUILD is for generating minified builds
   * TEST is for generating test builds
   */
  var BUILD = !!options.BUILD;
  var TEST = !!options.TEST;
  var BUILDHASH = false;
  var LINT = false;

  /**
   * Config
   * Reference: http://webpack.github.io/docs/configuration.html
   * This is the object where all configuration gets set
   */
  var config = {};
  config.debug = true;

  config.eslint = {
    configFile: './.eslintrc',
    emitError: false,
    emitWarning: false,
    quiet: false,
    failOnError: false,
    failOnWarning: false
  };

  var deps = [
    'bootstrap/dist/js/bootstrap.min.js',
    'underscore/underscore-min.js'
  ];

  /**
   * Entry
   * Reference: http://webpack.github.io/docs/configuration.html#entry
   * Should be an empty object if it's generating a test build
   * Karma will set this when it's a test build
   */
  if (TEST) {
    config.entry = {};
  }
  else {
    config.entry = {
      app: './js/index.js'
    };
  }

  /**
   * Output
   * Reference: http://webpack.github.io/docs/configuration.html#output
   * Should be an empty object if it's generating a test build
   * Karma will handle setting it up for you when it's a test build
   */
  if (TEST) {
    config.output = {};
  }
  else {
    config.output = {
      // Absolute output directory
      path: path.join(__dirname, '/dist'),

      // Output path from the view of the page
      // Uses webpack-dev-server in development
      publicPath: BUILD ? '/dist/' : 'http://localhost:8081/dist/',

      // Filename for entry points
      // Only adds hash in build mode
      // hash currently disabled for all builds
      filename: BUILDHASH ? '[name].[hash].js' : '[name].bundle.js',

      // Filename for non-entry points
      // Only adds hash in build mode
      // hash currently disabled for all builds
      chunkFilename: BUILDHASH ? '[name].[hash].js' : '[name].bundle.js'
    };
  }

  /**
   * Devtool
   * Reference: http://webpack.github.io/docs/configuration.html#devtool
   * Type of sourcemap to use per build type
   */
  if (TEST) {
    config.devtool = 'inline-source-map';
  } else if (BUILD) {
    config.devtool = 'eval-cheap-source-map';  // Trying to speed up builds with 'eval', correct behavior is 'source-map';
  } else {
    config.devtool = 'eval';
  }

  /**
   * Loaders
   * Reference: http://webpack.github.io/docs/configuration.html#module-loaders
   * List: http://webpack.github.io/docs/list-of-loaders.html
   * This handles most of the magic responsible for converting modules
   */

  var monarchJSRoot = path.resolve(__dirname, 'js');
  var monarchLibRoot = path.resolve(__dirname, 'lib/monarch');
  var nmRoot = path.resolve(__dirname, 'node_modules');
  var fa = path.resolve(__dirname, 'node_modules/font-awesome');

  // Initialize module
  config.module = {
    // jshint: {
    //     emitErrors: false
    // },

    preLoaders: [],
    loaders: [
      {
        // JS LOADER
        // Reference: https://github.com/babel/babel-loader
        // Transpile .js files using babel-loader
        // Compiles ES6 and ES7 into ES5 code
        test: /\.js$/,
        // loader: 'babel?optional=runtime',
        loader: 'babel',
        query: {
            // https://github.com/babel/babel-loader#options
            cacheDirectory: true,
            presets: ['es2015']
        },
        exclude: [
          nmRoot,
          // The following files are excluded from babel processing
          // because the transformation results in eslint violations.
          // - jquery.cookie.js is obsoleted by js.cookie.js
          // - I don't know where stupidtable comes from.
          path.join(monarchJSRoot, 'jquery.cookie.js'),
          path.join(monarchJSRoot, 'stupidtable.min.js')
          ]
      },

      {
        test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
        loader: "url?limit=10000&mimetype=application/font-woff",
        include: [fa]
      },

      {
        test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
        loader: "url?limit=10000&mimetype=application/font-woff",
        include: [fa]
      },

      {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
        loader: "url?limit=10000&mimetype=application/octet-stream",
        include: [fa]
      },

      {
        test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
        loader: "file",
        include: [fa]
      },

      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        loader: "url?limit=10000&mimetype=image/svg+xml",
        include: [fa]
      },

    {
      // ASSET LOADER
      // Reference: https://github.com/webpack/file-loader
      // Copy png, jpg, jpeg, gif, svg, woff, woff2, ttf, eot files to output
      // Rename the file using the asset hash
      // Pass along the updated reference to your code
      // You can add here any file extension you want to get copied to your output
      test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/,
      loader: 'file'
    },
    {
      // HTML LOADER
      // Reference: https://github.com/webpack/raw-loader
      // Allow loading html through js
      test: /\.html$/,
      loader: 'html'

    },
    {
      // JSON LOADER
      // Reference: https://github.com/webpack/json-loader
      // json loader module for webpack
      test: /\.json$/,
      loader: 'json'
    }],

   postLoaders: [
     // {
     //   emitErrors: false,
     //   test: /\.js$/,
     //   exclude: /node_modules|js\/jquery.+/, // do not lint third-party code
     //   loader: 'jshint-loader'
     //  }
   ],

    // don't parse some dependencies to speed up build.
    // can probably do this non-AMD/CommonJS deps
    noParse: [
      // path.resolve(nmRoot, 'phenogrid/js/htmlnotes.json'),
      // path.resolve(nmRoot, 'phenogrid/js/images.json')
    ],
    resolve: {
      alias: {}
    }
  };

  // Run through deps and extract the first part of the path,
  // as that is what you use to require the actual node modules
  // in your code. Then use the complete path to point to the correct
  // file and make sure webpack does not try to parse it
  // From: https://christianalfoni.github.io/react-webpack-cookbook/Optimizing-development.html
  //
  deps.forEach(function (dep) {
    var depPath = path.resolve(nmRoot, dep);
    config.module.resolve.alias[dep.split(path.sep)[0]] = depPath;
    config.module.noParse.push(depPath);
  });

  if (LINT && !TEST) {
    config.module.loaders.push(
      {
        test: /\.js$/,
        loader: 'eslint-loader',
        exclude: [nmRoot]
      });
  }


  // ISPARTA LOADER
  // Reference: https://github.com/ColCh/isparta-instrumenter-loader
  // Instrument JS files with Isparta for subsequent code coverage reporting
  // Skips node_modules and files that end with .test.js
  if (false && TEST) {
    config.module.preLoaders.push({
      test: /\.js$/,
      exclude: [nmRoot, /\.test\.js$/],
      loader: 'isparta-instrumenter'
    });
  }

  // CSS LOADER
  // Reference: https://github.com/webpack/css-loader
  // Allow loading css through js
  //
  // Reference: https://github.com/postcss/postcss-loader
  // Postprocess your css with PostCSS plugins
  var cssLoader = {
    test: /\.css$/,
    // Reference: https://github.com/webpack/extract-text-webpack-plugin
    // Extract css files in production builds
    //
    // Reference: https://github.com/webpack/style-loader
    // Use style-loader in development for hot-loading
    loader: ExtractTextPlugin.extract('style', 'css?sourceMap!postcss')
  };

  // Skip loading css in test mode
  if (TEST) {
    // Reference: https://github.com/webpack/null-loader
    // Return an empty module
    cssLoader.loader = 'null';
  }

  // Add cssLoader to the loader list
  config.module.loaders.push(cssLoader);

  // LESS LOADER
  var lessLoader = {
    test: /\.less$/,
    loader: "style!css!less-loader?outputStyle=expanded&includePaths[]=" + (path.resolve(__dirname, "./node_modules"))
//    loader: ExtractTextPlugin.extract('style', 'less?sourceMap!postcss')
  };

  // Skip loading less in test mode
  if (TEST) {
    // Reference: https://github.com/webpack/null-loader
    // Return an empty module
    lessLoader.loader = 'null';
  }

  // Add lessLoader to the loader list
  config.module.loaders.push(lessLoader);

  /**
   * PostCSS
   * Reference: https://github.com/postcss/autoprefixer
   * Add vendor prefixes to your css
   */
  config.postcss = [
    autoprefixer({
      browsers: ['last 2 version']
    })
  ];

  /**
   * Plugins
   * Reference: http://webpack.github.io/docs/configuration.html#plugins
   * List: http://webpack.github.io/docs/list-of-plugins.html
   */
  config.plugins = [
    // Reference: https://github.com/webpack/extract-text-webpack-plugin
    // Extract css files
    // Disabled when in test mode or not in build mode
    new ExtractTextPlugin(BUILDHASH ? '[name].[hash].css' : '[name].bundle.css',
      {
        disable: !BUILD || TEST
      }),
    new webpack.ProvidePlugin({
        $: "jquery",
        jQuery: "jquery",
        "window.jQuery": "jquery"
    })
  ];

  // // Skip rendering index.html in test mode
  // if (!TEST) {
  //   // Reference: https://github.com/ampedandwired/html-webpack-plugin
  //   // Render index.html
  //   config.plugins.push(
  //     new HtmlWebpackPlugin({
  //       template: './src/index.html',
  //       inject: 'body',
  //       minify: BUILD
  //     })
  //   );
  // }

  // Add build specific plugins
  if (BUILD) {
    config.plugins.push(
      // Reference: http://webpack.github.io/docs/list-of-plugins.html#noerrorsplugin
      // Only emit files when there are no errors
      // new webpack.NoErrorsPlugin(),

      // Reference: http://webpack.github.io/docs/list-of-plugins.html#dedupeplugin
      // Dedupe modules in the output
      new webpack.optimize.DedupePlugin()

      // Reference: http://webpack.github.io/docs/list-of-plugins.html#uglifyjsplugin
      // Minify all javascript, switch loaders to minimizing mode
      ,new webpack.optimize.UglifyJsPlugin({
        sourceMap: true,
        mangle: false,
        compress: {
          warnings: false
        }
      })
    );
  }

  if (!BUILD && !TEST) {
    var BrowserSyncPlugin = require('browser-sync-webpack-plugin');
    config.plugins.push(
      new BrowserSyncPlugin({
        proxy: 'localhost:8081',
        files: ['templates/*.mustache', 'templates/page/*.mustache', 'css/*.css', 'serverStarted.dat'],
        //tunnel: true,
        ghostMode: {
            clicks: false,
            forms: false,
            scroll: false
        },
        // logLevel: "debug",
        // logConnections: true,
        reloadOnRestart: false,
        browser: ["firefox"]
      }));
  }

  config.resolve = {
    modulesDirectories: ['node_modules', 'image'],
    alias: {
        //'bbop.min.js': path.join(__dirname, "node_modules/bbop.js"),
        //jquery: path.join(__dirname, "js/jquery-1.11.0.min.js"),
        // underscore: path.join(__dirname, "js/underscore-min.js"),
        'ringo/httpclient': path.join(__dirname, "js/nop.js")
    }
  };

  /**
   * Dev server configuration
   * Reference: http://webpack.github.io/docs/configuration.html#devserver
   * Reference: http://webpack.github.io/docs/webpack-dev-server.html
   */
  config.devServer = {
    contentBase: './dist',
    /* Send API requests on localhost to API server get around CORS */
    // proxy: {
    //   '/*': 'http://localhost:8080'
    // },
    proxy: [
        {
            path: /(.*)\.json/,
            target: "http://localhost:8080"
        },
        {
            path: /\/status/,
            target: "http://localhost:8080"
        },
        {
            path: /\/.*/,
            target: "http://localhost:8080"
        }
      ],

    stats: {
      modules: false,
      cached: false,
      colors: true,
      chunk: false
    }
  };

  return config;
};
