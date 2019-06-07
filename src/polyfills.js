/* global globalThis */
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
  TextEncoder,
  XMLHttpRequest,
  WebSocket
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
globalThis.XMLHttpRequest = XMLHttpRequest;
globalThis.WebSocket = WebSocket;

globalThis.window = globalThis;
