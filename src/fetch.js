import { guess } from './mime.js';
import { socketWrap } from './socket-wrap.js';
import { tlsWrap } from './tls-wrap.js';
import { codecWrap } from './codec-wrap.js';
import { decoder, encoder, STATUS_CODES } from './http-codec.js';
import { readFileStream, writeFileStream, prepareBody, expandBody } from './fs.js';
import { connect } from './tcp.js';
import { Headers } from './headers.js';
import { resolveUrl } from './resolve.js';
import { consume, binToStr } from './utils.js';
import { mkdirSync } from "./fs-uv.js";
import { sha1 } from "./sha1.js";

export { Headers };

export let fetch = makeFetch({
  file: fileRequest,
  http: httpRequest,
  https: httpRequest
});
// Set to a string path to enable caching
fetch.cacheBase = undefined;
fetch.setCacheFolder = (basePath) => {
  if (basePath) {
    try {
      mkdirSync(basePath, 0o700);
    } catch (err) {
      if (!/^EEXIST/.test(err.message)) { throw err; }
    }
  }
  fetch.cacheBase = basePath;
}

/**
 *
 * @param {{[key:name]:(req:Request)=>Promise<Response>}} protocols
 */
function makeFetch(protocols) {
  return async function fetch(input, init) {
    let req = new Request(input, init);
    let protocol = req.meta.protocol;
    /** @type {((req:Request)=>Promise<Response>)|undefined} */
    let handler = protocols[protocol];
    if (handler) return handler(req);
    throw new Error(`Unknown protocol: ${protocol}`);
  };
}

const bodyPromise = Symbol('arrayBufferPromise');
export class Response {
  constructor(body, init = {}) {
    let { url, status = 200, statusText = STATUS_CODES[status] || 'UNKNOWN', redirected = false } = init;
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

  async arrayBuffer() {
    if (!this[bodyPromise]) {
      this[bodyPromise] = consume(this.body)
    }
    return this[bodyPromise];
  }

  async text() {
    return binToStr(await this.arrayBuffer());
  }

  async json() {
    return JSON.parse(binToStr(await this.arrayBuffer()));
  }

  get ok() {
    return this.status >= 200 && this.status < 300;
  }
}

export class Request {
  constructor(input, init = {}) {
    if (input instanceof Request) return input;
    let [url, meta] = normalizeUrl(input);
    let { method = 'GET', body, redirect = 'follow', cache = fetch.cacheBase ? 'default' : 'no-store' } = init;
    let headers = new Headers(init.headers);
    Object.defineProperties(this, {
      meta: { value: meta, writable: false },
      body: { value: prepareBody(body), enumerable: true, writable: false },
      cache: { value: cache, enumerable: true, writable: false },
      headers: { value: headers, enumerable: true, writable: false },
      method: { value: method, enumerable: true, writable: false },
      redirect: { value: redirect, enumerable: true, writable: false },
      url: { value: url, enumerable: true, writable: false },
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
    const trailing = path.length > 1 && path.substr(path.length - 1) === '/';
    path = pathJoin('/', path) + (trailing ? '/' : '');
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

const cacheConfig = {
  'default': { useCache: true, conditionalRequest: true, updateCache: true },
  'no-store': {},
  'reload': { updateCache: true },
  'no-cache': { conditionalRequest: true, updateCache: true },
  'force-cache': { useCache: true, allowStale: true, updateCache: true },
  'only-if-cached': { useCache: true, allowStale: true, skipNet: true },
};

/**
 * @type {{[key:string]:Promise<Response>}}
 */
const concurrentRequests = {};

/**
 * Share concurrent requests/responses for the same resource.
 * @param {string} cacheKey
 * @param {()=>Promise<Response>} next
 * @returns {Promise<Response>}
 */
async function checkConcurrent(cacheKey, next) {
  // If there is already the same request active, reuse it.
  let current = concurrentRequests[cacheKey];
  if (current) return current;

  // Otherwise, make a new request.
  current = next();

  // Mark this request as current for the next 1000ms.
  concurrentRequests[cacheKey] = current;
  setTimeout(() => {
    if (concurrentRequests[cacheKey] !== current) return;
    delete concurrentRequests[cacheKey];
  }, 1000).unref();

  return current;
}

/**
 * @param  {string[]} args
 * @returns string
 */
function hashKey(...args) {
  const extension = args[args.length - 1].match(/\.([^.]{1,6})$/);
  return sha1(args.join(':')) + (extension ? `.${extension[1]}` : '');
}

/**
 * Perform an HTTP Request
 * @param {Request} req
 * @param {number} redirected
 * @returns {Promise<Response>}
 */
async function httpRequest(req, redirected = 0) {
  // For non GET requests, skip all connection pooling and caching logic.
  if (req.method !== "GET") {
    return realHttpRequest(req, redirected);
  }

  const { protocol, host, port, pathname } = req.meta;
  const cacheKey = `${fetch.cacheBase}/${hashKey(protocol, host, port, pathname)}`;

  // Combine concurrent requests for the same resource.
  return checkConcurrent(cacheKey, async () => {

    const config = cacheConfig[req.cache];
    const { useCache, allowStale, conditionalRequest, updateCache, skipNet } = config;

    const metaPath = `${cacheKey}.json`;
    const bodyPath = `${cacheKey}`;

    if (useCache) {
      const metaBody = await readFileStream(metaPath).catch(err => {
        if (!/^ENOENT:/.test(err.message)) throw err;
      });
      if (metaBody) {
        const meta = JSON.parse(binToStr(await consume(metaBody)));
        let fresh = Boolean(allowStale);

        if (!allowStale) {
          const now = Date.now();
          const age = metaBody.stat.mtime - now;
          // TODO: Implement robust freshness algorithm.  For now, we assume stale to be safe.
          fresh = false;
        }

        if (!fresh && conditionalRequest) {
          let condition = {};
          const headers = new Headers(meta.headers);
          const etag = headers.get('ETag');
          const date = headers.get('Last-Modified') || headers.get('Date');
          if (etag || date) {
            if (date) req.headers.set('If-Modified-Since', date);
            if (etag) req.headers.set('If-None-Match', etag);
            const res = await realHttpRequest(req);
            fresh = res.status === 304;
          }
        }

        if (fresh) {
          const body = await readFileStream(bodyPath);
          const res = new Response(body, meta);
          res.headers.set('Via', '1.1 fetch-cache');
          if (body) res.cacheFile = Promise.resolve(bodyPath);
          return res;
        }


      }
    }


    // If we're supposed to skip the net, we need to bail here.
    if (skipNet) {
      return new Response(undefined, {
        url: req.url,
        status: 504
      });
    }

    // Make a real http request.
    const res = await realHttpRequest(req, redirected);

    if (updateCache && res.status === 200 && /^http/.test(res.url)) {
      // TODO: make this cache update atomic!
      // Otherwise there be dragons here with subtle race conditions.
      writeFileStream(metaPath, JSON.stringify(res, null, 2) + "\n");
      if (res.body) {
        res.cacheFile = writeFileStream(bodyPath, res.arrayBuffer()).then(() => bodyPath);
      }
    }

    return res;
  });
}

/**
 *
 * @param {Request} req
 * @param {number} redirected
 * @returns {Promise<Response>}
 */
async function realHttpRequest(req, redirected = 0) {
  const { protocol, host, port, hostname, pathname } = req.meta;

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

  let used = false;
  let body = {
    [Symbol.asyncIterator]() {
      if (used) throw new Error("TCP streams are not reusable.");
      used = true;
      return this;
    },
    async next() {
      const part = await read();
      if (!part || part.length === 0) {
        await stream.close();
        return { done: true };
      }
      return {
        done: false, value: part.buffer
      };
    }
  };
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
 * @returns {Promise<Response>}
 */
async function fileRequest(req) {
  let { meta: { path }, method, body } = req;
  if (method === 'GET') {
    let body = await readFileStream(path).catch(err => {
      if (!/^ENOENT:/.test(err.message)) throw err;
    });
    return body ?
      new Response(body, {
        url: req.url,
        status: 200,
        headers: {
          'Content-Type': guess(path)
        }
      }) : new Response(`No such file: '${path}'\n`, {
        url: req.url,
        status: 404,
        headers: {
          'Content-Type': 'text/plain'
        }
      });
  }
  if (method === 'PUT' && body) {
    await writeFileStream(path, body);
    return new Response();
  }
  throw new Error('file fetch only supports GET to read files and PUT to write files');
}
