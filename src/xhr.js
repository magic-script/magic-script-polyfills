import { fetch } from './fetch.js';
import { Evented } from './evented.js';

// XHR States
const UNSENT = 0;
const OPENED = 1;
const DONE = 4;

// Extends from Evented to fire events
export class XMLHttpRequest extends Evented {
  constructor() {
    super();
    this.headers = {};
    this.readyState = UNSENT;
    this.withCredentials = true;
  }

  // Stores method and url
  open(method, url) {
    this.readyState = OPENED;
    this.method = method;
    this.url = url;
  }

  /**
   * Resets status and values
   * Needed by some implementations
   */
  abort() {
    this.readyState = UNSENT;
    this.responseText = '';
    this.response = null;
    this.status = null;
  }

  // Append header to headers object
  setRequestHeader(name, value) {
    this.headers[name] = value;
  }

  /**
   * A ByteString representing all of the response's headers (except those 
   * whose field name is Set-Cookie or Set-Cookie2) separated by CRLF, or null
   * if no response has been received.
   */
  getAllResponseHeaders() {
    return this.responseHeaders ? Object.keys(this.responseHeaders)
      .filter(key => key.toLowerCase() !== 'set-cookie' && key.toLowerCase() !== 'set-cookie2')
      .map(key => `${key}: ${this.responseHeaders[key]}`)
      .join('\r\n') : null;
  }

  /**
   * Uses fetch to fire request
   * Fires both load and readystatechange so registered components know data was loaded
   */
  send(body) {
    fetch(this.url, { method: this.method, body })
      .then(res => {
        this.readyState = DONE;
        this.status = res.status;
        this.statusText = res.statusText;
        this.redirected = res.redirected;
        this.responseHeaders = res.headers;

        if (this.responseType === 'arraybuffer') {
          this.bodyField = 'response';
          return res.arrayBuffer();
        } else {
          this.bodyField = 'responseText';
          return res.text();
        }
      })
      .then(
        body => {
          this.response = body;
          this[this.bodyField] = body;
          this.emit('readystatechange', body);
          this.emit('load', body);
        },
        err => {
          this.abort();
          this.emit('error', err);
        }
      );
  }

  // Get response header by key
  getResponseHeader(key) {
    return this.responseHeaders.get(key);
  }
}
