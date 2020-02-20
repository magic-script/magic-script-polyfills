import { flatten } from './bintools.js';
import { assert } from './assert.js';

export function codecWrap ({ read: innerRead, write: innerWrite, ...rest }, { encode, decode }) {
  assert(innerRead);
  assert(innerWrite);
  read.inner = innerRead;
  read.updateDecode = newDecode => { decode = newDecode; };
  write.inner = innerWrite;
  write.updateEncode = newEncode => { encode = newEncode; };

  let buffer = null;
  let offset = 0;
  let readClosed = false;

  return { read, write, ...rest };

  async function read () {
    let out;
    while (!(out = decode(buffer, offset))) {
      if (readClosed) return;

      // Cleanup all consumed bytes, even partially consumed buffers
      if (offset && buffer) {
        buffer = offset === buffer.length ? null : buffer.slice(offset);
        offset = 0;
      }

      // Get more data from the stream source...
      let chunk = await innerRead();

      if (!chunk) {
        readClosed = true;
      } else if (buffer) {
        let old = buffer;
        buffer = new Uint8Array(old.length + chunk.byteLength);
        buffer.set(old);
        buffer.set(new Uint8Array(chunk), old.length);
      } else {
        buffer = new Uint8Array(chunk);
      }
    }

    let result = out[0];
    offset = out[1];
    assert((buffer && offset <= buffer.length) || !offset);

    // Cleanup the buffer if it's completely consumed.
    if (buffer && offset === buffer.length) {
      buffer = null;
      offset = 0;
    }

    // Emit the result.
    return result;
  }

  async function write (value) {
    value = encode(value);
    if (value) value = flatten(value);
    if (value instanceof Uint8Array) {
      if (value.length < value.buffer.byteLength) {
        value = value.slice(0, value.length)
      }
      value = value.buffer
    }
    if (value === '') return;
    return innerWrite(value);
  }
}
