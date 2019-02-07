// Also place on globalThis
import {
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  setImmediate,
  clearImmediate,
  fetch,
  Headers,
  Request,
  Response
} from './index.js';

globalThis.setTimeout = setTimeout;
globalThis.clearTimeout = clearTimeout;
globalThis.setInterval = setInterval;
globalThis.clearInterval = clearInterval;
globalThis.setImmediate = setImmediate;
globalThis.clearImmediate = clearImmediate;
globalThis.fetch = fetch;
globalThis.Headers = Headers;
globalThis.Request = Request;
globalThis.Response = Response;
