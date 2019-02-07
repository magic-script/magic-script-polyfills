/* global setTimeout, clearTimeout, setInterval, clearInterval, setImmediate, clearImmediate, fetch, Headers, Request, Response */
import '../src/polyfills.js';

print('Start');
setTimeout(()=>{
  print('Hello');
}, 100);

// TODO: write tests for more functions?