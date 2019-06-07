/* global XMLHttpRequest, print */
import '../src/polyfills.js';

function reqListener () {
  print('Binary file downloaded', this.response, this.response.byteLength);
  print('XHR test passed');
}

var oReq = new XMLHttpRequest();
oReq.addEventListener('load', reqListener);
oReq.open('GET', 'https://loremflickr.com/320/240');
oReq.responseType = 'arraybuffer';
oReq.send();
