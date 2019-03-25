// Re-export all polyfilled web builtins
export {
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  setImmediate,
  clearImmediate
} from './timers.js';
export { fetch, Headers, Request, Response } from './fetch.js';
export { TextEncoder } from './text-encoder.js';
