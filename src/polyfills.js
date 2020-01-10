/* global globalThis */

import "./console.js";
import process from "./node/process.js";
import Buffer from "./node/buffer.js";

import {
  clearImmediate,
  clearInterval,
  clearTimeout,
  crypto,
  fetch,
  Headers,
  Request,
  Response,
  setImmediate,
  setInterval,
  setTimeout,
  Storage,
  TextEncoder,
  WebSocket,
  XMLHttpRequest,
} from './index.js';

// Browser globals
globalThis.clearImmediate = clearImmediate;
globalThis.clearInterval = clearInterval;
globalThis.clearTimeout = clearTimeout;
globalThis.crypto = crypto;
globalThis.fetch = fetch;
globalThis.Headers = Headers;
globalThis.localStorage = new Storage();
globalThis.Request = Request;
globalThis.Response = Response;
globalThis.setImmediate = setImmediate;
globalThis.setInterval = setInterval;
globalThis.setTimeout = setTimeout;
globalThis.TextEncoder = TextEncoder;
globalThis.WebSocket = WebSocket;
globalThis.window = globalThis;
globalThis.XMLHttpRequest = XMLHttpRequest;

// node.js globals
globalThis.global = globalThis;
globalThis.process = process;

