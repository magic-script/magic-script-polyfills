import { Storage } from '../src/index.js';
import { readfileSync } from '../src/fs-sync.js';
import { assert, utf8Decode } from '../src/utils2.js';
import '../src/polyfills.js';
const memStorage = new Storage();
const fileStorage = new Storage('storage');

const meta = JSON.parse(utf8Decode(readfileSync('package.json', 'r', 0o644)));
console.log(meta);
for (const key in meta) {
  console.log({ [key]: fileStorage.getItem(key) });
}
memStorage.clear();
fileStorage.clear();
for (const key in meta) {
  const value = JSON.stringify(meta[key], null, 2) + '\n';
  assert(memStorage.getItem(key) === null);
  assert(fileStorage.getItem(key) === null);
  memStorage.setItem(key, value);
  fileStorage.setItem(key, value);
  assert(memStorage.getItem(key) === value);
  assert(fileStorage.getItem(key) === value);
  memStorage.removeItem(key);
  fileStorage.removeItem(key);
  assert(memStorage.getItem(key) === null);
  assert(fileStorage.getItem(key) === null);
  memStorage.removeItem(key);
  fileStorage.removeItem(key);
  memStorage.setItem(key, value);
  fileStorage.setItem(key, value);
  memStorage.setItem(key, value);
  fileStorage.setItem(key, value);
}