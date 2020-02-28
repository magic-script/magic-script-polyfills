import { Fs, fs } from 'uv';
import { TextEncoder } from './text-encoder.js';

/// <reference path="../lib.uv.d.ts"/>

// Helper to consume callback based uv.fs functions using promises
let acall = (fn, ...args) => new Promise((resolve, reject) =>
  fn(new Fs(), ...args, (err, val) => err ? reject(err) : resolve(val))
);

//
/**
 * Promise and iterator based wrapper for scandir
 * @param {string} path
 * @param {number} flags
 * @returns {Promise<IterableIterator<{name:string,type:string}>>}
 */
export let scandir = (path, flags = 0) =>
  new Promise((resolve, reject) =>
    fs.scandir(new Fs(), path, flags, (err, req) =>
      err ? reject(err) : resolve({
        next() {
          let entry = fs.scandirNext(req);
          return {
            done: !entry,
            value: entry
          };
        },
        [Symbol.iterator]() { return this; }
      })
    )
  );

/**
 *
 * @param {string} path
 * @param {number} mode
 */
export let chmod = (path, mode) => acall(fs.chmod, path, mode);

/**
 *
 * @param {string} path
 * @returns {Promise<{mode:number,uid:number,gid:number,size:number,type:string}>}
 */
export let stat = (path) => acall(fs.stat, path);

/**
 *
 * @param {string} path
 * @returns {Promise<{mode:number,uid:number,gid:number,size:number,type:string}>}
 */
export let lstat = (path) => acall(fs.lstat, path);

/**
 *
 * @param {number} fd
 * @returns {Promise<{mode:number,uid:number,gid:number,size:number,type:string}>}
 */
export let fstat = (fd) => acall(fs.fstat, fd);

/**
 * Open a file, getting a file descriptor.
 * @param {string} path
 * @param {string} flags accepts string flags like "r" or "w"
 * @param {number} mode
 * @returns {Promise<number>}
 */
export let open = (path, flags, mode) => acall(fs.open, path, flags, mode);

/**
 *
 * @param {number} fd
 * @param {ArrayBuffer} buffer
 * @param {number} offset
 */
export let write = (fd, buffer, offset) => {
  // Workaround bug in 0.96 that uses all bytes in underlying buffer if typed array.
  if (buffer instanceof Uint8Array) {
    // Force a reallocation of the internal ArrayBuffer with the right size
    buffer = buffer.slice();
  }
  return acall(fs.write, fd, buffer, offset);
};

/**
 *
 * @param {number} fd
 * @param {ArrayBuffer} buffer
 * @param {number} offset
 */
export let read = (fd, buffer, offset) => acall(fs.read, fd, buffer, offset);

/**
 * Close a file descriptor.
 * @param {number} fd
 */
export let close = (fd) => acall(fs.close, fd);

/**
 * Write a data stream to a file.
 * @param {string} path
 * @param {IterableIterator<Promise<ArrayBuffer>>} stream
 * @param {{flags:string,mode:number}} options
 */
export async function writeFileStream(path, stream, options = {}) {
  let { flags = 'w', mode = parseInt('644', 8) } = options;
  let fd = await open(path, flags, mode);
  let offset = 0;
  try {
    await expandBody(stream, async data => {
      await write(fd, data, offset);
      offset += data.byteLength;
    });
  } finally {
    await close(fd);
  }
}

/**
 * Create a data stream from a file.
 * @param {string} path
 * @param {{flags:string,mode:number,offset:number,end:number:chunkSize:number}} options
 * @returns {IterableIterator<Promise<ArrayBuffer>>}
 */
export async function readFileStream(path, options = {}) {
  let { flags = 'r', mode = parseInt('644', 8), offset = 0, end = -1, chunkSize = 128 * 1024 } = options;
  let buf = new ArrayBuffer(chunkSize);

  let fd = await open(path, flags, mode);
  let used = false;
  return {
    stat: await fstat(fd),
    [Symbol.asyncIterator]() {
      if (used) throw new Error("File streams are not reusable");
      used = true;
      return this;
    },
    next
  };

  async function next() {
    if (!fd) throw new Error('Can\'t read from closed stream');
    try {
      let bytesRead = await read(fd, buf, offset);
      if (end >= 0 && bytesRead > end - offset) {
        bytesRead = end - offset;
      }
      if (bytesRead > 0) {
        offset += bytesRead;
        return { done: false, value: buf.slice(0, bytesRead) };
      }
      await cleanup();
      return { done: true };
    } catch (err) {
      await cleanup();
      throw err;
    }
  }

  async function cleanup() {
    if (!fd) return;
    await close(fd);
    fd = null;
  }
}

// Do simple body cleanup rules that don't cause unneeded buffering in memory.
// This means we can get total length for string, Uint8Array, or ArrayBuffer
export function prepareBody(data) {
  // Convert strings into UTF8-encoded Uint8Arrays
  if (typeof data === 'string') {
    return new TextEncoder().encode(data);
  }
  return data;
}

export async function expandBody(data, onBuffer) {
  if (typeof data.then === 'function') {
    data = await data;
  }
  if (typeof data === 'string') {
    return onBuffer(new TextEncoder().encode(data));
  }
  if (typeof data.byteLength === 'number') {
    return onBuffer(data);
  }
  if (data[Symbol.asyncIterator]) {
    for await (let part of data) {
      await expandBody(part, onBuffer);
    }
    return;
  }
  if (data[Symbol.iterator]) {
    for (let part of data) {
      await expandBody(part, onBuffer);
    }
    return;
  }
  throw new Error('Unsupported value type in body stream');
}
