/* This is how you use the environments variables passed by the webpack.DefinePlugin */

import 'jquery';
import 'bootstrap';
import 'bootstrap-sass';
import Navigo from 'navigo';

/**
 * The linter can be disabled via LINTER=false env var
 *  - show a message in console to inform if it's on or off
 * Won't show in production
 */
if (process.env.NODE_ENV !== 'production') {
  if (!process.env.LINTER) {
    console.warn('Linter disabled, make sure to run your code against the linter, otherwise, if it fails, your commit will be rejected.');
  }
  else {
    console.info('Linter active, if you meet some problems, you can still run without linter, just set the env var LINTER=false.');
  }
}
else if (process.env.DEVTOOLS) {
  console.info('Turn on the "Sources" tab of your devtools to inspect original source code - thanks to sourcemaps!');
}

/**
 * You could setup some mocks for tests
 * Won't show in production
 */
if (process.env.NODE_ENV === 'mock') {
  console.info('MOCK mode');
}

if (process.env.DEVTOOLS && process.env.NODE_ENV !== 'production') {
  console.info(`You're on DEVTOOLS mode, you may have access to tools enhancing developer experience - off to you to choose to disable them in production ...`);
}

var router = null;
function pathLoaded(sourceText, path) {
  var dom = document.getElementById('monarch-content-fragment');
  if (dom) {
    dom.innerHTML = sourceText;
    if (router) {
      router.updatePageLinks();
    }
    var launchablesScript = document.getElementById('monarch-launchables');
    if (launchablesScript) {
      var text = launchablesScript.text;
      if (text) {
        if (text.indexOf('/* monarch-launchable-safety-check */') === 0) {
          eval(text);
        }
      }
      else {
        console.log('no monarch-launchables text for', path);
      }
    }
    else {
      console.log('no monarch-launchables script for', path);
    }
  }
}

function loadPathContent(path) {
  var oReq = new XMLHttpRequest();
  oReq.addEventListener('load', function () {
    pathLoaded(this.responseText, path);
  });

  console.log('loadPathContent', path);
  oReq.open('GET', path);
  oReq.send();
}
window.loadPathContent = loadPathContent;

window.addEventListener('popstate', function(event) {
  console.log('popstate fired!');
  console.log('location: ' + document.location + ', state: ' + JSON.stringify(event.state));
});

const main = () => {
  console.log('monarch', monarch);
  window.monarch.dovechart.locationChangeHack = function(url) {
    loadPathContent(url);
  };

  var root = null;
  var useHash = false; // Defaults to: false
  var hash = '#!'; // Defaults to: '#'
  router = new Navigo(root);  // , useHash, hash);
  // https://github.com/krasimir/navigo
  router
    .on(function () {
      console.log('router: show home page here');
      loadPathContent('/home');
    })
    .resolve();

  router
    .on('/home', function () {
      console.log('router: /home');
      loadPathContent('/home');
    })
    .resolve();

  router
    .on('/disease', function () {
      console.log('router: /disease');
      loadPathContent('/disease');
    })
    .resolve();

  router
    .on('/disease/:id', function (params) {
      console.log('router: /disease/:id', params);
      loadPathContent(`/disease/${params.id}`);
    })
    .resolve();

  // router
  //   .on('/spa', function () {
  //     console.log('router: /spa');
  //     loadPathContent('/');
  //   })
  //   .resolve();
  // router
  //   .on('/spa/disease', function () {
  //     console.log('router: spa/disease');
  //     loadPathContent('/disease?spa=1');
  //   })
  //   .resolve();

  // router
  //   .on('/spa/disease/:id', function (params) {
  //     console.log('router: /spa/disease/:id', params);
  //     loadPathContent(`/disease/${params.id}?spa=1`);
  //   })
  //   .resolve();

  window.addEventListener('popstate', function(event) {
    console.log('popstate fired!', event);
    event.preventDefault();
  });

  const { document } = global;
  if (document && document.querySelector) {
    const testRequireEnsureLink = document.querySelector('.test-require-ensure');
    const logo = global.document.querySelector('.logo');

    /** display logos */
    const cssClasses = ['babel', 'npm', 'eslint', 'sass'];
    let current = 0;
    logo.addEventListener('mouseover', () => {
      const body = document.getElementsByTagName('body')[0];
      cssClasses.forEach(name => body.classList.remove(name));
      current = (current + 1) % cssClasses.length;
      body.classList.add(cssClasses[current]);
    });

    testRequireEnsureLink.addEventListener('click', () => {
      console.log('testRequireEnsureLink');
      // the following won't be included in the original build but
      // will be lazy loaded only when needed
      import('./scripts/css-utils.js')
        .then(module => {
          const { toggleCssClassName } = module;
          toggleCssClassName(logo, 'rotate');
          toggleCssClassName(testRequireEnsureLink, 'active');
        })
        .catch(error => console.error('Chunk loading failed', error));
    });
  }
};

main();

