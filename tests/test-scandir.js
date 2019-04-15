import { fs, Fs } from 'uv';
import { scandir } from "../src/fs.js"

// Manually using uv directly.
fs.scandir(new Fs(), ".", 0, (err, req) => {
  print(err, req)
  let iter = {
    next() {
      let entry = fs.scandirNext(req);
      return { done: !entry, value: entry }
    },
    [Symbol.iterator]() { return this }
  }
  for (let { name, type } of iter) {
    print(name, type)
  }
})

// Recursive using polyfill helper
dir('.')
async function dir(path) {
  for (let { name, type } of await scandir(path)) {
    print(path, name, type)
    if (type === 'dir') {
      await dir(path + '/' + name);
    }
  }
}