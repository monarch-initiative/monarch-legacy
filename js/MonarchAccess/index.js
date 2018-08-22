import axios from 'axios';
import * as JSONAccess from './JSONAccess';

// Re-export stuff from JSONAccess into the MonarchAccess namespace
export const { loadJSONXHR, loadJSONAxios } = JSONAccess;

const serviceEnvironment = window.serverConfigurationName;
const biolink = window.serverConfiguration.biolink_url;
// const scigraphData = globalServiceURLs[serviceEnvironment].SCIGRAPH_DATA;
// const scigraphOntology = globalServiceURLs[serviceEnvironment].SCIGRAPH_ONTOLOGY;

// console.log('###biolink', serviceEnvironment, biolink);


// TIP: Example of a domain-specific (as opposed to a generic loadJSON)
// service function. This set of domain-specific services will pretty much
// correspond to the set of needed services for the Monarch UI application, and may
// not necessarily be the same set of functions needed by a generic client
// of Monarch's services/data. In other words, we can add convenience/aggregation
// services here that may not make sense for general-purpose use. Our goal
// with MonarchAccess is to isolate the UI from the service layer, and only secondarily,
// to create a general-purpose service layer, which is more what BioLink promises
// to be.
//

export function getNodeSummary(nodeId, nodeType) {
  const url = `/node/${nodeType}/${nodeId}.json`;

  const returnedPromise = new Promise((resolve, reject) => {
    axios.get(url)
      .then(resp => {
        const responseData = resp.data;
        // const { responseURL } = resp.request;
        // console.log('...getNodeSummary', resp, responseData, responseURL);
        if (typeof responseData !== 'object') {
          reject(responseData);
        }
        else {
          resolve(responseData);
        }
      })
      .catch(err => {
        reject(err);
      });
  });

  return returnedPromise;
}


export function getSearchTermSuggestions(term, selected) {
  const baseUrl = `${biolink}search/entity/autocomplete/`;
  const urlExtension = `${baseUrl}${term}`;
  const params = new URLSearchParams();
  params.append('rows', 10);
  params.append('start', 0);
  params.append('highlight_class', 'hilite');
  params.append('boost_q', 'category:genotype^-10');
  if (selected.toString() === 'gene') {
    params.append('boost_fx', 'pow(edges,0.334)');
  }
  if (selected.length > 0) {
    selected.forEach(elem => {
      params.append('category', elem);
    });
  }
  else {
    ['gene', 'variant locus', 'phenotype', 'genotype', 'disease']
      .forEach(elem => (params.append('category', elem)));
  }
  params.append('prefix', '-OMIA');
  const returnedPromise = new Promise((resolve, reject) => {
    axios.get(urlExtension, { params })
      .then(resp => {
        const responseData = resp.data;
        if (typeof responseData !== 'object') {
          reject(responseData);
        }
        else {
          resolve(responseData);
        }
      })
      .catch(err => {
        reject(err);
      });
  });

  return returnedPromise;
}

export function getNodeAssociations(nodeType, identifier, biolinkAnnotationSuffix, params) {
  const baseUrl = `${biolink}bioentity/`;
  const urlExtension = `${nodeType}/${identifier}/${biolinkAnnotationSuffix}`;

  const returnedPromise = new Promise((resolve, reject) => {
    axios.get(
      `${baseUrl}${urlExtension}`,
      {
        params
      }
    )
      .then(resp => {
        const responseData = resp;
        if (typeof responseData !== 'object') {
          reject(responseData);
        }
        else {
          resolve(responseData);
        }
      })
      .catch(err => {
        reject(err);
      });
  });
  return returnedPromise;
}

export function getNodeLabelByCurie(curie) {
  const baseUrl = `${biolink}bioentity/${curie}`;
  const params = {
    fetch_objects: true,
    rows: 100,
  };
  const returnedPromise = new Promise((resolve, reject) => {
    axios.get(baseUrl, { params })
      .then(resp => {
        const responseData = resp;
        if (typeof responseData !== 'object') {
          reject(responseData);
        }
        else {
          resolve(responseData);
        }
      })
      .catch(err => {
        reject(err);
      });
  });
  return returnedPromise;
}

export function comparePhenotypes(phenotypesList, geneList, species = 'all', mode = 'search') {
  const baseUrl = 'https://beta.monarchinitiative.org/analyze/phenotypes.json?';
  const params = new URLSearchParams();
  const phenoCuries = phenotypesList.map(elem => {
    return elem.curie;
  });
  params.append('input_items', phenoCuries);
  params.append('gene_items', geneList);
  params.append('target_species', species);
  params.append('mode', mode);
  const returnedPromise = new Promise((resolve, reject) => {
    axios.get(baseUrl, { params })
      .then(resp => {
        const responseData = resp;
        if (typeof responseData !== 'object') {
          reject(responseData);
        }
        else {
          resolve(responseData);
        }
      })
      .catch(err => {
        reject(err);
      });
  });
  return returnedPromise;
}



/*
  might be useful, probably should be deleted and reinvented.
  Basically calls scigraph directly instead of using the webapp response.
  Not currently displayed.
  probably should delete this.
    xloadPathContentAsync(path, done) {
      console.log('xloadPathContentAsync', path);
      const oReq = new XMLHttpRequest();
      oReq.addEventListener('load', function load() {
        // console.log('xloadPathContentAsync', path, this);
        var responseJSON = this.responseText;
        var response = JSON.parse(responseJSON);
        done(response, this.responseURL, path);
      });

      let refinedPath = path;

      // const hashIndex = refinedPath.indexOf('#');
      // if (hashIndex >= 0) {
      //   refinedPath = refinedPath.slice(0, hashIndex) + '?stripme' + refinedPath.slice(hashIndex);
      // }
      // else {
      //   refinedPath += '?stripme';
      // }
      oReq.open('GET', refinedPath);
      oReq.send();
    },

    getHierarchy() {
      console.log('qurl', this.node);
      //Determine if ID is clique leader
      var qurl = this.node.global_scigraph_data_url + "dynamic/cliqueLeader/" + this.nodeId + ".json";
      this.xloadPathContentAsync(qurl,
        function(response, responseURL, path) {
          console.log('xpathLoadedAsync', response, responseURL, path);

          var graph = new bbop.model.graph();
          graph.load_json(response);
          var nodeList = graph.all_nodes();
          console.log('nodeList', nodeList);
          if (nodeList.length !== 1) {
            console.log('nodeList ERROR too many entries', nodeList);
          }
          else {
            var leaderId = nodeList[0].id();
            console.log('leaderId', leaderId);
          }
        });
    }
*/

