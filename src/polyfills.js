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
  Response,
  TextEncoder
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
globalThis.TextEncoder = TextEncoder;

// This helps with libraries like underscore that don't know about globalThis yet.
globalThis.window = globalThis;
