import axios from 'axios';

export function loadJSONXHR(path, doneHandler, errorHandler) {
  console.log('loadJSONXHR', path);
  const oReq = new global.XMLHttpRequest();

  oReq.addEventListener('load', evt => {
    console.log('...loadJSONXHR', path, evt.target);
    const { responseText, responseURL } = evt.target;

    try {
      const responseData = JSON.parse(responseText);
      if (doneHandler) {
        doneHandler(responseData, responseURL);
      }
      else {
        console.log('...loadJSONXHR', path, responseData, responseURL, evt);
      }
    }
    catch (e) {
      if (errorHandler) {
        errorHandler(e);
      }
      else {
        console.log('...loadJSONXHR parse', path, e);
      }
    }
  });

  oReq.addEventListener('error', evt => {
    console.log('...loadJSONXHR error', path, evt);
    if (errorHandler) {
      errorHandler(evt);
    }
    else {
      console.log('...loadJSONXHR error', path, evt);
    }
  });

  oReq.addEventListener('readystatechange', evt => {
    if (oReq.status === 404) {
      console.log('...loadJSONXHR 404');
      if (errorHandler) {
        errorHandler(evt);
      }
      else {
        console.log('...loadJSONXHR 404', path, evt);
      }
    }
  });

  oReq.open('GET', path);
  oReq.send();
}


// https://github.com/axios/axios#response-schema

export function loadJSONAxios(path, doneHandler, errorHandler) {
  console.log('loadJSONAxios', path);

  axios.get(path)
    .then(resp => {
      console.log('...loadJSONAxios', path, resp);
      const responseData = resp.data;
      const { responseURL } = resp.request;
      if (typeof responseData !== 'object') {
        if (errorHandler) {
          errorHandler(responseData);
        }
        else {
          console.log('...loadJSONAxios error', path, responseData, responseURL, resp);
        }
      }
      else if (doneHandler) {
        doneHandler(responseData, responseURL);
      }
      else {
        console.log('...loadJSONAxios', path, responseData, responseURL, resp);
      }
    })
    .catch(err => {
      if (errorHandler) {
        errorHandler(err);
      }
      else {
        console.log('...loadJSONAxios error', path, err);
      }
    });
}

