import { httpRequest } from './fetch-http.js';
import { fileRequest } from './fetch-file.js';
import { Headers } from './headers.js';
export { Headers };

export let fetch = makeFetch({
  file: fileRequest,
  http: httpRequest
});

export function makeFetch(protocols) {
  return async function fetch(input, init) {
    let req;
    if (input instanceof Request) {
      // TODO: should we apply `init` to the request?
      req = input;
    } else {
      req = new Request(input, init);
    }
    let protocol = req.meta.protocol;
    let handler = protocols[protocol];
    if (handler) return handler(req);
    if (protocol === 'https') throw new Error('TODO: Implement TLS for HTTPS clients');
  };
}


export class Response {
  constructor(body, init = {}) {
    let status = init.status || 200;
    let statusText = init.statusText || 'OK';
    let headers = new Headers(init.headers);
    let url = init.url;
    Object.defineProperties(this, {
      url: { value: url, enumerable: true, writable: false },
      body: { value: body, enumerable: true, writable: false },
      status: { value: status, enumerable: true, writable: false },
      statusText: { value: statusText, enumerable: true, writable: false },
      headers: { value: headers, enumerable: true, writable: false }
    });
  }

  async arrayBuffer() {
    return consume(this.body);
  }

  async text() {
    return binToStr(await consume(this.body));
  }

  async json() {
    return JSON.parse(binToStr(await consume(this.body)));
  }

  get ok() {
    return this.status >= 200 && this.status < 300;
  }
}

async function consume(stream) {
  let total = 0;
  let parts = [];
  for await (let part of stream) {
    total += part.byteLength;
    parts.push(part);
  }
  let array = new Uint8Array(total);
  let offset = 0;
  for (let part of parts) {
    array.set(new Uint8Array(part), offset);
    offset += part.byteLength;
  }
  return array.buffer;
}

function binToStr(bin) {
  let array = new Uint8Array(bin);
  let end = array.length;
  let raw = '';
  for (let i = 0; i < end; i++) {
    raw += String.fromCharCode(array[i]);
  }
  // UTF8 decode
  return decodeURIComponent(escape(raw));
}

export class Request {
  constructor(input, init = {}) {
    let [url, meta] = normalizeUrl(input);
    let method = init.method || 'GET';
    let headers = new Headers(init.headers);
    let body = init.body;
    Object.defineProperties(this, {
      meta: { value: meta, writable: false },
      url: { value: url, enumerable: true, writable: false },
      method: { value: method, enumerable: true, writable: false },
      headers: { value: headers, enumerable: true, writable: false },
      body: { value: body, enumerable: true, writable: false }
    });
  }
}

function pathJoin(base, ...inputs) {
  let segments = [];
  for (let part of (base + '/' + inputs.join('/')).split(/\/+/)) {
    if (part === '' || part === '.') continue;
    if (part === '..') {
      segments.pop();
      continue;
    }
    segments.push(part);
  }
  return (base[0] === '/' ? '/' : '') + segments.join('/');
}

function normalizeUrl(input) {
  if (typeof input !== 'string') { throw new TypeError('Input must be string'); }
  let match = input.match(/^([a-z]+):/);
  let protocol;

  if (!match) {
    protocol = 'file';
    if (input[0] === '/') {
      input = `file:/${input}`;
    } else {
      input = `file://${getCaller()}/../${input}`;
    }
  } else {
    protocol = match[1];
  }

  if (protocol === 'http' || protocol === 'https') {
    match = input.match(/^https?:\/\/([^:/]+)(:[0-9]+)?(\/[^?#]*)?([?][^#]*)?(#.*)?$/);
    if (!match) {
      throw new TypeError(`Invalid ${protocol} url: '${input}'`);
    }
    let [, host, portStr, path, query, hash] = match;
    path = pathJoin('/', path);
    let defaultPort = protocol === 'http' ? 80 : 443;
    let port = portStr ? parseInt(portStr.substr(1), 10) : defaultPort;
    let hostname = `${host}${port === defaultPort ? '' : ':' + port}`;
    let pathname = `${path}${query || ''}`;
    let url = `${protocol}://${hostname}${pathname}${query || ''}${hash || ''}`;
    return [url, { protocol, host, port, path, query, hash, hostname, pathname }];
  }

  if (protocol === 'file') {
    match = input.match(/^file:\/\/([^?#]+)([?][^#]*)?(#.*)?$/);
    if (!match) {
      throw new TypeError(`Invalid ${protocol} url: '${input}'`);
    }
    let [, path, query, hash] = match;
    path = pathJoin(path);
    let url = `${protocol}://${path}${query || ''}`;
    return [url, { protocol, path, query, hash }];
  }
  throw new TypeError(`Unsupported protocol: '${protocol}'`);
}

// Use the V8 Stack Trace API to find the filename of the caller outside this file.
function getCaller() {
  let old = Error.prepareStackTrace;
  Error.prepareStackTrace = findCaller;
  let caller = new Error().stack;
  Error.prepareStackTrace = old;
  return caller;
}

function findCaller(_, stack) {
  // Skip down the stack till get leave this file.
  let self = stack[0].getFileName();
  let other;
  for (let frame of stack) {
    let entry = frame.getFileName();
    if (entry !== self) {
      other = entry;
      break;
    }
  }
  return other || self;
}
