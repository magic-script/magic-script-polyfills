/// <reference path="../lib.uv.d.ts"/>
import { Fs, fs } from 'uv';
import { Response } from './fetch.js';
import { guess } from './weblit-js/libs/mime.js';

export function readFileStream (path, offset = 0, end = -1) {
  let { open, read, close } = fs;
  let fd;
  let buf = new Uint8Array(256 * 512);
  let queue = [];
  let reads = 0;
  let writes = 0;
  let reading = false;

  return new Promise((resolve, reject) =>
    open(new Fs(), path, 0, 0, (err, value) =>
      err ? reject(err)
        : ((fd = value),
        resolve({
          [Symbol.asyncIterator] () { return this; },
          next
        }))
    )
  );

  function next () {
    return new Promise((resolve, reject) => {
      if (writes > reads) {
        let { error, result } = queue[reads];
        queue[reads++] = null;
        return error ? reject(error) : resolve(result);
      }
      queue[reads++] = { resolve, reject };
      reading = true;
      pull();
    });
  }

  function push ({ error, result }) {
    if (reads > writes) {
      let { resolve, reject } = queue[writes];
      queue[writes++] = null;
      return error ? reject(error) : resolve(result);
    }
    queue[writes++] = { error, result };
    if (writes > reads) reading = false;
  }

  function pull () {
    if (!reading) return;
    read(new Fs(), fd, buf.buffer, offset, onRead);
  }

  function onRead (err, bytesRead) {
    if (err) return push({ error: err });
    if (end >= 0 && bytesRead > end - offset) {
      bytesRead = end - offset;
    }
    if (bytesRead > 0) {
      offset += bytesRead;
      push({ result: { done: false, value: buf.slice(0, bytesRead) } });
      pull();
    } else {
      push({ result: { done: true } });
      close(new Fs(), fd);
    }
  }
}

/**
 * Load a local file as if it was an HTTP request.
 * @param {Request} req
 * @returns {Response}
 */
export async function fileRequest (req) {
  let body = await readFileStream(req.meta.path);
  return new Response(body, { headers: {
    'Content-Type': guess(req.meta.path),
  }});
}
