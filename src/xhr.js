import { fetch } from './fetch.js';
import { Evented } from './evented.js';

export class XMLHttpRequest extends Evented {
  open (method, url) {
    this.method = method;
    this.url = url;
  }
  send () {
    // print('XHR', this.method, this.url);
    fetch(this.url, { method: this.method })
      .then(res => {
        this.status = res.status;
        // print('XHR', this.status, this.url);
        this.statusText = res.statusText;
        this.redirected = res.redirected;
        this.headers = res.headers;
        if (this.responseType === 'arraybuffer') {
          this.bodyField = 'response';
          return res.arrayBuffer();
        } else {
          this.bodyField = 'responseText';
          return res.text();
        }
      })
      .then(body => {
        this[this.bodyField] = body;
        this.emit('load', {});
      }, err => this.emit('error', err));
  }
}
