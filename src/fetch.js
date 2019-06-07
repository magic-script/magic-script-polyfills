import { guess } from './mime.js';
import { socketWrap } from './socket-wrap.js';
import { tlsWrap } from './tls-wrap.js';
import { codecWrap } from './codec-wrap.js';
import { decoder, encoder } from './http-codec.js';
import { readFileStream, writeFileStream, prepareBody, expandBody } from './fs.js';
import { connect } from './tcp.js';
import { Headers } from './headers.js';
import { resolveUrl } from './resolve.js';
import { consume, binToStr } from './utils.js';
export { Headers };

export let fetch = makeFetch({
  file: fileRequest,
  http: httpRequest,
  https: httpRequest
});

function makeFetch (protocols) {
  return async function fetch (input, init) {
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
    throw new Error(`Unknown protocol: ${protocol}`);
  };
}

export class Response {
  constructor (body, init = {}) {
    let { url, status = 200, statusText = 'OK', redirected = false } = init;
    let headers = new Headers(init.headers);
    Object.defineProperties(this, {
      url: { value: url, enumerable: true, writable: false },
      body: { value: body, enumerable: true, writable: false },
      status: { value: status, enumerable: true, writable: false },
      statusText: { value: statusText, enumerable: true, writable: false },
      headers: { value: headers, enumerable: true, writable: false },
      redirected: { value: redirected, enumerable: true, writable: false }
    });
  }

  async arrayBuffer () {
    return consume(this.body);
  }

  async text () {
    return binToStr(await consume(this.body));
  }

  async json () {
    return JSON.parse(binToStr(await consume(this.body)));
  }

  get ok () {
    return this.status >= 200 && this.status < 300;
  }
}

export class Request {
  constructor (input, init = {}) {
    let [url, meta] = normalizeUrl(input);
    let { method = 'GET', body, redirect = 'follow' } = init;
    let headers = new Headers(init.headers);
    Object.defineProperties(this, {
      meta: { value: meta, writable: false },
      url: { value: url, enumerable: true, writable: false },
      method: { value: method, enumerable: true, writable: false },
      headers: { value: headers, enumerable: true, writable: false },
      body: { value: prepareBody(body), enumerable: true, writable: false },
      redirect: { value: redirect, enumerable: true, writable: false }
    });
  }
}

function pathJoin (base, ...inputs) {
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

function normalizeUrl (input) {
  if (typeof input !== 'string') { throw new TypeError('Input must be string'); }
  let match = input.match(/^([a-z]+):/);
  let protocol;

  if (!match) {
    protocol = 'file';
    input = `file://${input}`;
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

/**
 * Perform an HTTP Request
 * @param {Request} req
 * @returns {Response}
 */
async function httpRequest (req, redirected = 0) {
  let { protocol, host, port, hostname, pathname } = req.meta;
  let stream = socketWrap(await connect(host, port));
  if (protocol === 'https') {
    stream = await tlsWrap(stream, host);
  }
  let { read, write } = codecWrap(stream, {
    encode: encoder(),
    decode: decoder()
  });

  req.headers.set('Host', hostname);
  req.headers.set('Connection', 'close');
  req.headers.set('User-Agent', 'MagicScript');
  if (req.body != null) {
    if (typeof req.body === 'object' && typeof req.body.byteLength === 'number') {
      // If we know the length up-front, set a header for it.
      req.headers.set('Content-Length', String(req.body.byteLength));
    } else {
      // If not, use chunked encoding.
      req.headers.set('Transfer-Encoding', 'chunked');
    }
  } else if (req.method !== 'GET') {
    // Tell non GET requests that there is no body expected if there was none.
    req.headers.set('Content-Length', '0');
  }

  let headers = [];
  for (let [key, value] of req.headers) {
    headers.push(key, value);
  }

  await write({
    method: req.method,
    path: pathname,
    headers
  });
  if (req.body) {
    await expandBody(req.body, write);
  }
  await write('');

  let resHead = await read();

  async function next () {
    let part = await read();
    if (!part || part.length === 0) {
      await stream.close();
      return { done: true };
    }
    return {
      done: false, value: part.buffer
    };
  }
  let body = { [Symbol.asyncIterator] () { return this; }, next };
  let resHeaders = new Headers(resHead.headers);

  let res = new Response(body, {
    status: resHead.code,
    statusText: resHead.reason,
    url: req.url,
    headers: resHeaders,
    redirected: !!redirected
  });

  if (res.status >= 300 && res.status < 400 && res.headers.Location) {
    if (req.redirect === 'follow') {
      if (req.method === 'GET') {
        await res.arrayBuffer();
        if (redirected > 5) {
          throw new Error('Too many redirects');
        }
        let location = resolveUrl(req.url, res.headers.Location);
        return httpRequest(new Request(location), redirected + 1);
      }
    }
    if (req.redirect === 'error') {
      throw new Error('Unexpected redirect');
    }
  }

  return res;
}

/**
 * Load a local file as if it was an HTTP request.
 * @param {Request} req
 * @returns {Response}
 */
async function fileRequest (req) {
  let { meta: { path }, method, body } = req;
  if (method === 'GET') {
    let body = await readFileStream(path);
    return new Response(body, {
      headers: {
        'Content-Type': guess(path)
      }
    });
  }
  if (method === 'PUT' && body) {
    await writeFileStream(path, body);
    return new Response();
  }
  throw new Error('file fetch only supports GET to read files and PUT to write files');
}
