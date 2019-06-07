import { hexToB64, binToStr, uint16, uint64, flatten } from './bintools.js';
import { sha1 } from './sha1.js';
import { assert } from './assert.js';

let websocketGuid = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

export function acceptKey (key) {
  return hexToB64(sha1(key + websocketGuid));
}

function rand4 () {
  // Generate 32 bits of pseudo random data
  let num = Math.floor(Math.random() * 0x100000000);
  // Return as a 4-bytes
  return new Uint8Array([
    num >> 24,
    (num >> 16) & 0xff,
    (num >> 8) & 0xff,
    num & 0xff
  ]);
}

function applyMask (data, mask) {
  let length = data.length;
  let masked = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    masked[i] = data[i] ^ mask[i % 4];
  }
  return masked;
}

export function decode (chunk, offset) {
  let out;
  while ((out = decodeRaw(chunk, offset))) {
    let frame = out[0];
    offset = out[1];
    if (frame.opcode === 1 || frame.opcode === 2) return [frame.payload, offset];
    if (chunk.length <= offset) return;
  }
}

export function decodeRaw (chunk, offset) {
  if (!chunk) return;
  let length = chunk.length - offset;
  if (length < 2) return;
  let first = chunk[offset];
  let bits = chunk[offset + 1];
  let len = bits & 0x7f;
  if (len === 126) {
    if (length < 4) return;
    len = (chunk[offset + 2] << 8) | chunk[offset + 3];
    offset += 4;
  } else if (len === 127) {
    if (length < 10) return;
    len = ((
      (chunk[offset + 2] << 24) |
      (chunk[offset + 3] << 16) |
      (chunk[offset + 4] << 8) |
      chunk[offset + 5]
    ) >>> 0) * 0x100000000 +
      ((
        (chunk[offset + 6] << 24) |
        (chunk[offset + 7] << 16) |
        (chunk[offset + 8] << 8) |
        chunk[offset + 9]
      ) >>> 0);
    offset += 10;
  } else {
    offset += 2;
  }
  let mask = (bits & 0x80) > 0;
  if (mask) {
    offset += 4;
  }
  if (chunk.length < offset + len) return;

  let payload = chunk.slice(offset, offset + len);
  assert(payload.length === len, 'Length mismatch');
  if (mask) payload = applyMask(payload, chunk.slice(offset - 4, offset));
  let opcode = (first & 0xf);
  if (opcode === 1) {
    payload = binToStr(payload);
  } else {
    payload = payload.buffer;
    assert(payload.byteLength === len);
  }

  return [{
    fin: (first & 0x80) > 0,
    opcode: opcode,
    mask: !!mask,
    len: len,
    payload: payload
  }, offset + len];
}

export function encode (item) {
  if (item === undefined) return;
  if (typeof item === 'string') {
    return encodeRaw({
      opcode: 1,
      payload: item
    });
  }
  if (item instanceof Uint8Array) {
    return encodeRaw({
      opcode: 2,
      payload: item
    });
  }
  throw new TypeError('Simple Websocket encoder only accepts string and Uint8Array buffers');
}

export function encodeRaw (item) {
  if (item == null) {
    return;
  } else if (typeof item === 'string') {
    item = { opcode: 1, payload: item };
  } else if (item.constructor !== Object) {
    item = { opcode: 2, payload: item };
  }
  assert(item.hasOwnProperty('payload'),
    'payload is required in websocket message');

  let payload = flatten(item.payload);
  let len = payload.length;
  let head = [
    ((item.hasOwnProperty('fin') ? item.fin : true) ? 0x80 : 0) |
    (item.hasOwnProperty('opcode') ? item.opcode & 0xf : 2),
    (item.mask ? 0x80 : 0) |
    (len < 126 ? len : len < 0x10000 ? 126 : 127)
  ];
  if (len >= 0x10000) {
    head.push(uint64(len));
  } else if (len >= 126) {
    head.push(uint16(len));
  }
  if (item.mask) {
    let key = rand4();
    head.push(key);
    payload = applyMask(payload, key);
  }
  head.push(payload);
  return flatten(head);
}
